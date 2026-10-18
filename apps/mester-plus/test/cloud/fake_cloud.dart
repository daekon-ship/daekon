import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mester_plus/cloud/api_client.dart';
import 'package:mester_plus/cloud/cloud_config.dart';
import 'package:mester_plus/cloud/cloud_session.dart';
import 'package:mester_plus/cloud/secure_kv.dart';

/// Memóriában futó Mester+ Cloud álszerver a kliens-tesztekhez (a valódi szerver szerződése szerint:
/// tokenrotáció, Pro-jogosultság, mentés-feltöltés ellenőrzőösszeggel, online ajánlat).
class FakeCloud {
  FakeCloud({this.pro = true});

  bool pro;
  bool offline = false;
  int failNext5xx = 0;
  final rnd = Random(7);
  final log = <http.BaseRequest>[];
  final users = <String, String>{}; // email → jelszó
  String? access;
  String? refresh;
  final usedRefresh = <String>{};
  int refreshCalls = 0;
  final bk = List<int>.generate(32, (i) => (i * 7 + 3) & 0xff);
  final backups = <String, Map<String, Object?>>{};
  final blobs = <String, Uint8List>{};
  final quotes = <Map<String, Object?>>[];
  Uint8List Function(Uint8List)? corruptDownload;
  static const ws = 'w0000000000000000000000000';

  static final config = CloudConfig.resolve(defineBase: 'https://api.test.invalid', defineEnv: 'test', isRelease: false);

  String _tok(String p) => '$p${List.generate(43, (_) => 'abcdefghijklmnopqrstuvwxyz0123456789'[rnd.nextInt(36)]).join()}';
  String _id() => List.generate(26, (_) => '0123456789abcdefghjkmnpqrstvwxyz'[rnd.nextInt(32)]).join();

  http.Response _json(Object body, [int status = 200, Map<String, String> h = const {}]) =>
      http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json; charset=utf-8', ...h});
  http.Response _err(int s, String code, String msg) => _json({'error': {'code': code, 'message': msg, 'request_id': 'x'}}, s);

  Map<String, Object?> _tokens() {
    access = _tok('mpa_');
    refresh = _tok('mpr_');
    return {'access_token': access, 'access_expires_in': 900, 'refresh_token': refresh, 'refresh_expires_in': 5184000, 'device_id': _id()};
  }

  Map<String, Object?> me() => {
        'account': {'id': _id(), 'email': users.keys.isEmpty ? 'a@b.hu' : users.keys.first, 'email_verified': false, 'status': 'ACTIVE'},
        'workspace': {'id': ws, 'name': 'Saját vállalkozás', 'role': 'owner'},
        'device_id': 'd000000000000000000000000a',
        'plan': {'code': pro ? 'pro' : 'free', 'name': pro ? 'Mester+ Pro' : 'Mester+ Offline'},
        'subscription': pro ? {'status': 'ACTIVE', 'provider': 'manual', 'current_period_end': '2099-01-01T00:00:00Z', 'auto_renewing': false} : null,
        'entitlements': pro ? ['cloud_backup', 'cloud_restore', 'multiple_devices', 'online_quotes'] : <String>[],
        'backup_policy': {'quota': 524288000, 'max_versions': 30, 'retention_days': 30},
        'server_time': DateTime.now().toUtc().toIso8601String(),
        'cache_until': DateTime.now().toUtc().add(const Duration(days: 7)).toIso8601String(),
      };

  late final MockClient client = MockClient((req) async {
    log.add(req);
    if (offline) throw const SocketException('Failed host lookup: api.test.invalid');
    if (failNext5xx > 0) {
      failNext5xx--;
      return _err(503, 'SERVICE_UNAVAILABLE', 'Átmeneti hiba.');
    }
    final path = req.url.path;
    Map<String, dynamic> body() => req.body.isEmpty ? {} : jsonDecode(req.body) as Map<String, dynamic>;
    bool authed() => req.headers['Authorization'] == 'Bearer $access' && access != null;

    if (path == '/api/v1/auth/register' && req.method == 'POST') {
      final b = body();
      if ('${b['password']}'.length < 10) return _err(422, 'WEAK_PASSWORD', 'A jelszó legalább 10 karakter legyen.');
      if (users.containsKey(b['email'])) return _err(409, 'EMAIL_TAKEN', 'Ezzel az e-mail címmel már van Mester+ fiók. Jelentkezz be.');
      users['${b['email']}'] = '${b['password']}';
      return _json({'account': {}, ..._tokens()}, 201);
    }
    if (path == '/api/v1/auth/login' && req.method == 'POST') {
      final b = body();
      if (users[b['email']] != b['password']) return _err(401, 'INVALID_CREDENTIALS', 'Hibás e-mail cím vagy jelszó.');
      return _json({'account': {}, ..._tokens()});
    }
    if (path == '/api/v1/auth/refresh') {
      refreshCalls++;
      final t = '${body()['refresh_token']}';
      if (t != refresh || usedRefresh.contains(t)) return _err(401, 'SESSION_EXPIRED', 'A munkamenet lejárt.');
      usedRefresh.add(t);
      return _json(_tokens());
    }
    if (path == '/api/v1/auth/password/forgot') return _json({'ok': true}, 202);
    if (!authed()) return _err(401, 'SESSION_EXPIRED', 'A munkamenet lejárt. Jelentkezz be újra.');

    if (path == '/api/v1/me') return _json(me());
    if (path == '/api/v1/auth/logout' || path == '/api/v1/auth/logout-all') {
      access = null;
      return _json({'ok': true});
    }
    if (path == '/api/v1/devices') {
      return _json({'devices': [
        {'id': 'd000000000000000000000000a', 'name': 'Android telefon', 'platform': 'android', 'app_version': '0.8.0', 'last_seen_at': '2026-10-18T10:00:00Z', 'current': true, 'revoked': false, 'signed_in': true},
        {'id': 'd000000000000000000000000b', 'name': 'Régi telefon', 'platform': 'android', 'app_version': '0.7.0', 'last_seen_at': '2026-09-01T10:00:00Z', 'current': false, 'revoked': false, 'signed_in': true},
      ]});
    }
    final proOnly = path.startsWith('/api/v1/backups') || path.startsWith('/api/v1/quotes');
    if (proOnly && !pro) return _err(403, 'PRO_REQUIRED', 'Ehhez a funkcióhoz Mester+ Pro szükséges.');
    if (path == '/api/v1/backups/key') return _json({'key_version': 1, 'key': base64Encode(bk)});
    if (path == '/api/v1/backups' && req.method == 'POST') {
      if (req.headers['Idempotency-Key'] == null) return _err(400, 'IDEMPOTENCY_KEY_REQUIRED', 'x');
      final b = body();
      final id = _id();
      backups[id] = {'id': id, 'status': 'UPLOADING', 'size_bytes': b['size_bytes'], 'sha256': b['sha256'], 'app_version': b['app_version'],
        'key_version': 1, 'created_at': DateTime.now().toUtc().toIso8601String(), 'device': {'name': 'Android telefon'}};
      return _json({'id': id, 'status': 'UPLOADING', 'upload_path': '/api/v1/backups/$id/content'}, 201);
    }
    final m = RegExp(r'^/api/v1/backups/([0-9a-z]{26})(/content)?$').firstMatch(path);
    if (m != null) {
      final row = backups[m.group(1)];
      if (row == null) return _err(404, 'NOT_FOUND', 'Nincs ilyen mentés.');
      if (req.method == 'PUT') {
        final bytes = req.bodyBytes;
        if (sha256.convert(bytes).toString() != row['sha256']) {
          row['status'] = 'FAILED';
          return _err(422, 'CHECKSUM_MISMATCH', 'A feltöltött mentés sérült (ellenőrzőösszeg-eltérés). Próbáld újra.');
        }
        blobs[row['id'] as String] = bytes;
        row['status'] = 'READY';
        return _json(row);
      }
      if (req.method == 'DELETE') {
        backups.remove(row['id']);
        return _json({'ok': true});
      }
      var data = blobs[row['id']]!;
      if (corruptDownload != null) data = corruptDownload!(data);
      return http.Response.bytes(data, 200, headers: {'content-type': 'application/octet-stream', 'x-checksum-sha256': '${row['sha256']}'});
    }
    if (path == '/api/v1/backups') {
      return _json({'backups': backups.values.where((b) => b['status'] == 'READY').toList().reversed.toList(), 'used_bytes': 1234, 'quota_bytes': 524288000});
    }
    if (path == '/api/v1/quotes' && req.method == 'POST') {
      final b = body();
      final q = {'id': _id(), 'quote_number': (b['snapshot'] as Map)['quote_number'], 'quote_version': quotes.length + 1, 'status': 'ACTIVE', 'opened': false,
        'valid_until': (b['snapshot'] as Map)['valid_until'], 'url': 'https://ajanlat.test.invalid/a/${_tok('')}', '_payload': b};
      quotes.add(q);
      return _json(q, 201);
    }
    if (path == '/api/v1/quotes') {
      final qn = req.url.queryParameters['quote_number'];
      return _json({'quotes': quotes.where((q) => q['quote_number'] == qn).map((q) => Map.of(q)..remove('url')..remove('_payload')).toList().reversed.toList()});
    }
    final rq = RegExp(r'^/api/v1/quotes/([0-9a-z]{26})/revoke$').firstMatch(path);
    if (rq != null) {
      final q = quotes.firstWhere((x) => x['id'] == rq.group(1));
      q['status'] = 'REVOKED';
      return _json(Map.of(q)..remove('url')..remove('_payload'));
    }
    return _err(404, 'NOT_FOUND', 'Nincs ilyen végpont.');
  });

  /// Kész munkamenet (bejelentkezve) az álszerverhez.
  Future<(CloudSession, MemoryKeyValueStore)> signedInSession() async {
    final kv = MemoryKeyValueStore();
    final s = session(kv);
    users['szaki@example.test'] = 'Jo-Jelszo-2026';
    await s.login(email: 'szaki@example.test', password: 'Jo-Jelszo-2026');
    return (s, kv);
  }

  CloudSession session(KeyValueStore kv) =>
      CloudSession(store: kv, api: ApiClient(client: client, config: config, sleep: (_) async {}));
}
