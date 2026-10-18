import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../data/backup.dart';
import 'cloud_backup_service.dart';
import 'cloud_errors.dart';
import 'cloud_session.dart';
import 'secure_kv.dart';

/// A felhőmentés állapota (Beállítások → FELHŐMENTÉS).
class CloudBackupState {
  const CloudBackupState({this.auto = true, this.lastSuccessAt, this.lastAttemptAt, this.failures = 0, this.nextAttemptAt, this.lastFingerprint, this.lastError});
  final bool auto;
  final DateTime? lastSuccessAt;
  final DateTime? lastAttemptAt;
  final int failures;
  final DateTime? nextAttemptAt;
  final String? lastFingerprint;
  final String? lastError;

  CloudBackupState copyWith({bool? auto, DateTime? lastSuccessAt, DateTime? lastAttemptAt, int? failures, DateTime? nextAttemptAt,
          String? lastFingerprint, String? lastError, bool clearError = false}) =>
      CloudBackupState(
        auto: auto ?? this.auto,
        lastSuccessAt: lastSuccessAt ?? this.lastSuccessAt,
        lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
        failures: failures ?? this.failures,
        nextAttemptAt: nextAttemptAt ?? this.nextAttemptAt,
        lastFingerprint: lastFingerprint ?? this.lastFingerprint,
        lastError: clearError ? null : (lastError ?? this.lastError),
      );

  String toJson() => jsonEncode({
        'auto': auto, 'ok': lastSuccessAt?.toIso8601String(), 'try': lastAttemptAt?.toIso8601String(), 'fail': failures,
        'next': nextAttemptAt?.toIso8601String(), 'fp': lastFingerprint, 'err': lastError,
      });

  static CloudBackupState fromJson(String? s) {
    if (s == null) return const CloudBackupState();
    try {
      final j = jsonDecode(s) as Map<String, dynamic>;
      DateTime? d(String k) => j[k] == null ? null : DateTime.tryParse(j[k] as String);
      return CloudBackupState(auto: j['auto'] != false, lastSuccessAt: d('ok'), lastAttemptAt: d('try'), failures: (j['fail'] as num?)?.toInt() ?? 0,
          nextAttemptAt: d('next'), lastFingerprint: j['fp'] as String?, lastError: j['err'] as String?);
    } catch (_) {
      return const CloudBackupState();
    }
  }
}

/// AUTOMATIKUS FELHŐMENTÉS (Pro). Nem háttérszolgáltatás és nem 5 percenkénti: csak amikor az
/// app előtérbe kerül, és
///  - legalább 24 óra telt el az utolsó sikeres mentés óta, ÉS
///  - a helyi adatok azóta változtak (ujjlenyomat), ÉS
///  - nincs folyamatban visszalépés (hiba után exponenciális várakozás: 15 p → 30 p → … → max. 24 ó).
/// Nem tart ébren a telefont (nincs wake lock, nincs háttér-feladat), nem lassítja az indulást
/// (a vizsgálat késleltetve, a felület után fut), és internet nélkül csendben kimarad.
class AutoBackup extends ChangeNotifier {
  AutoBackup({required CloudSession session, required CloudBackupService service, required BackupService local,
      required KeyValueStore store, DateTime Function()? clock})
      : _session = session,
        _service = service,
        _local = local,
        _kv = store,
        _clock = clock ?? DateTime.now;

  final CloudSession _session;
  final CloudBackupService _service;
  final BackupService _local;
  final KeyValueStore _kv;
  final DateTime Function() _clock;

  static const interval = Duration(hours: 24);
  static const firstRetry = Duration(minutes: 15);

  CloudBackupState _state = const CloudBackupState();
  bool _running = false;
  bool _loaded = false;

  CloudBackupState get state => _state;
  bool get running => _running;

  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    _state = CloudBackupState.fromJson(await _kv.read(CloudKeys.backupState));
    notifyListeners();
  }

  Future<void> _set(CloudBackupState s) async {
    _state = s;
    await _kv.write(CloudKeys.backupState, s.toJson());
    notifyListeners();
  }

  Future<void> setAuto(bool on) async {
    await load();
    await _set(_state.copyWith(auto: on));
  }

  /// A következő tervezett automatikus mentés (a felületnek).
  DateTime? get nextScheduled {
    if (!_state.auto) return null;
    final base = _state.lastSuccessAt == null ? _clock() : _state.lastSuccessAt!.add(interval);
    final n = _state.nextAttemptAt;
    return (n != null && n.isAfter(base)) ? n : base;
  }

  static Duration backoff(int failures) {
    final m = firstRetry.inMinutes * pow(2, max(0, failures - 1)).toInt();
    return Duration(minutes: min(m, interval.inMinutes));
  }

  /// MENTÉS MOST (kézi) vagy az automatikus mentés közös útja.
  Future<CloudBackupInfo> runNow() async {
    if (_running) throw const CloudException(CloudErrorKind.api, 'Már fut egy felhőmentés.');
    _running = true;
    notifyListeners();
    final now = _clock();
    try {
      final (info, fp) = await _service.backupNow();
      await _set(_state.copyWith(lastSuccessAt: _clock(), lastAttemptAt: now, failures: 0, nextAttemptAt: _clock().add(interval), lastFingerprint: fp, clearError: true));
      return info;
    } on CloudException catch (e) {
      final f = _state.failures + 1;
      final hard = e.kind == CloudErrorKind.notPro || e.kind == CloudErrorKind.sessionExpired || e.kind == CloudErrorKind.disabled;
      await _set(_state.copyWith(lastAttemptAt: now, failures: f, nextAttemptAt: now.add(hard ? interval : backoff(f)), lastError: e.message));
      rethrow;
    } catch (e) {
      final f = _state.failures + 1;
      await _set(_state.copyWith(lastAttemptAt: now, failures: f, nextAttemptAt: now.add(backoff(f)), lastError: CloudException.genericMessage));
      rethrow;
    } finally {
      _running = false;
      notifyListeners();
    }
  }

  /// Előtérbe kerüléskor hívja az app. Igazzal tér vissza, ha mentés készült.
  Future<bool> maybeRun() async {
    await load();
    if (_running || !_state.auto || !_session.isSignedIn || !_session.cloudEnabled) return false;
    if (!_session.entitlements.canUseCloudBackup()) return false;
    final now = _clock();
    if (_state.nextAttemptAt != null && now.isBefore(_state.nextAttemptAt!)) return false;
    if (_state.lastSuccessAt != null && now.difference(_state.lastSuccessAt!) < interval) return false;
    final fp = CloudBackupService.fingerprint(await _local.exportJson());
    if (fp == _state.lastFingerprint) {
      // Nincs változás: nem töltünk fel feleslegesen; holnap újra megnézzük.
      await _set(_state.copyWith(nextAttemptAt: now.add(interval)));
      return false;
    }
    try {
      await runNow();
      return true;
    } on CloudException {
      return false; // offline / szerverhiba: csendben, visszalépéssel újra
    } catch (_) {
      return false;
    }
  }
}
