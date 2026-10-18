import 'dart:convert';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';

import '../core/app_info.dart';
import '../data/backup.dart';
import 'api_client.dart';
import 'backup_crypto.dart';
import 'cloud_errors.dart';
import 'cloud_session.dart';

class CloudBackupInfo {
  const CloudBackupInfo({required this.id, required this.createdAt, required this.sizeBytes, required this.sha256,
      required this.appVersion, required this.keyVersion, this.deviceName});
  final String id;
  final DateTime createdAt;
  final int sizeBytes;
  final String sha256;
  final String appVersion;
  final int keyVersion;
  final String? deviceName;

  static CloudBackupInfo fromJson(Map j) => CloudBackupInfo(
        id: '${j['id']}',
        createdAt: (DateTime.tryParse('${j['created_at']}') ?? DateTime.fromMillisecondsSinceEpoch(0)).toLocal(),
        sizeBytes: (j['size_bytes'] as num).toInt(),
        sha256: '${j['sha256']}',
        appVersion: '${j['app_version']}',
        keyVersion: (j['key_version'] as num?)?.toInt() ?? 1,
        deviceName: (j['device'] as Map?)?['name'] as String?,
      );
}

class CloudBackupList {
  const CloudBackupList(this.backups, this.usedBytes, this.quotaBytes);
  final List<CloudBackupInfo> backups;
  final int usedBytes;
  final int quotaBytes;
}

/// Visszaállítás előtti, már ellenőrzött állapot: a fájl letöltve, ellenőrzőösszeg rendben,
/// visszafejtve, a meglévő [BackupService.parse] minden szabályán átment. DB-írás még NEM történt.
class PreparedRestore {
  const PreparedRestore(this.info, this.parsed);
  final CloudBackupInfo info;
  final ParsedBackup parsed;
}

/// MESTER+ CLOUD BACKUP – a meglévő helyi mentésre épül (ugyanaz a JSON-formátum és ugyanaz az
/// ellenőrzés / tranzakciós visszaállítás); a felhő csak titkosítva szállítja és tárolja.
class CloudBackupService {
  CloudBackupService({
    required CloudSession session,
    required BackupService local,
    required Future<void> Function(String json) writeSafetyCopy,
  })  : _session = session,
        _local = local,
        _writeSafety = writeSafetyCopy;

  final CloudSession _session;
  final BackupService _local;
  final Future<void> Function(String json) _writeSafety;

  ApiClient get _api => _session.api;

  String get _ws {
    final ws = _session.account?.workspaceId ?? '';
    if (ws.isEmpty) throw const CloudException(CloudErrorKind.sessionExpired, CloudException.sessionMessage);
    return ws;
  }

  Future<(int, List<int>)> _key([int? version]) async {
    final r = await _api.getJson('/api/v1/backups/key', query: version == null ? null : {'version': '$version'});
    final k = base64Decode('${r['key']}');
    if (k.length != 32) throw const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage);
    return ((r['key_version'] as num).toInt(), k);
  }

  /// A helyi adatok aktuális ujjlenyomata (az automatikus mentés ezzel dönti el, változott-e valami).
  static String fingerprint(String exportJson) {
    // Az exportedAt időbélyeg nélkül – különben minden export „más” lenne.
    final cleaned = exportJson.replaceFirst(RegExp(r'"exportedAt":\s*"[^"]*"'), '');
    return sha256.convert(utf8.encode(cleaned)).toString();
  }

  /// MENTÉS MOST: export → gzip → titkosítás → bejelentés (Idempotency-Key) → feltöltés → READY.
  Future<(CloudBackupInfo, String)> backupNow() async {
    final json = await _local.exportJson();
    final (kv, key) = await _key();
    final blob = await BackupCrypto.encrypt(plain: utf8.encode(json), key: key, keyVersion: kv, workspaceId: _ws);
    final sum = sha256.convert(blob).toString();
    final init = await _api.postJson(
      '/api/v1/backups',
      {
        'size_bytes': blob.length,
        'sha256': sum,
        'app_version': appVersion,
        'backup_format_version': BackupService.formatVersion,
        'encryption_version': BackupCrypto.formatVersion,
        'key_version': kv,
      },
      idempotencyKey: _api.newIdempotencyKey(),
    );
    final path = '${init['upload_path']}';
    if (!RegExp(r'^/api/v1/backups/[0-9a-z]{26}/content$').hasMatch(path)) {
      throw const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage);
    }
    final done = await _api.putBytes(path, blob, timeout: const Duration(minutes: 3));
    if (done['status'] != 'READY' || done['sha256'] != sum) {
      throw const CloudException(CloudErrorKind.api, 'A felhőmentés nem lett hibátlan. Próbáld újra.');
    }
    return (CloudBackupInfo.fromJson(done), fingerprint(json));
  }

  Future<CloudBackupList> list() async {
    final r = await _api.getJson('/api/v1/backups');
    return CloudBackupList(
      [for (final b in (r['backups'] as List? ?? const [])) if (b is Map) CloudBackupInfo.fromJson(b)],
      (r['used_bytes'] as num?)?.toInt() ?? 0,
      (r['quota_bytes'] as num?)?.toInt() ?? 0,
    );
  }

  Future<void> delete(String id) => _api.delete('/api/v1/backups/${_checkId(id)}');

  String _checkId(String id) {
    if (!RegExp(r'^[0-9a-z]{26}$').hasMatch(id)) throw ArgumentError.value(id, 'id');
    return id;
  }

  /// Letöltés → ellenőrzőösszeg → visszafejtés → a meglévő mentés-ellenőrzés. Bármely hibánál kivétel;
  /// a helyi adatbázis érintetlen.
  Future<PreparedRestore> prepareRestore(CloudBackupInfo info) async {
    final dl = await _api.getBytes('/api/v1/backups/${_checkId(info.id)}/content', timeout: const Duration(minutes: 3));
    final sum = sha256.convert(dl.bytes).toString();
    if (sum != info.sha256 || (dl.headers['x-checksum-sha256'] != null && dl.headers['x-checksum-sha256'] != sum)) {
      throw const BackupFormatException('A letöltött felhőmentés sérült (ellenőrzőösszeg-eltérés). Próbáld újra.');
    }
    final Uint8List plain;
    try {
      final (_, key) = await _key(BackupCrypto.keyVersionOf(dl.bytes));
      plain = await BackupCrypto.decrypt(blob: dl.bytes, key: key, workspaceId: _ws);
    } on BackupCryptoException catch (e) {
      throw BackupFormatException(e.message);
    }
    final String json;
    try {
      json = utf8.decode(plain);
    } on FormatException {
      throw const BackupFormatException('A felhőmentés tartalma sérült.');
    }
    return PreparedRestore(info, _local.parse(json));
  }

  /// A visszaállítás: ELŐBB biztonsági másolat a jelenlegi helyi adatokról, UTÁNA a meglévő,
  /// egy-tranzakciós csere. Ha a másolat nem készül el, nincs csere.
  Future<void> restore(PreparedRestore prepared) async {
    await _writeSafety(await _local.exportJson());
    await _local.restore(prepared.parsed);
  }
}
