import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../core/app_info.dart';
import 'api_client.dart';
import 'cloud_errors.dart';
import 'entitlements.dart';
import 'secure_kv.dart';

class CloudAccount {
  const CloudAccount({required this.email, required this.emailVerified, required this.workspaceId, required this.workspaceName, this.deviceId});
  final String email;
  final bool emailVerified;
  final String workspaceId;
  final String workspaceName;
  final String? deviceId;

  Map<String, Object?> toJson() =>
      {'email': email, 'verified': emailVerified, 'ws': workspaceId, 'ws_name': workspaceName, 'device': deviceId};

  static CloudAccount? fromJson(String? s) {
    if (s == null) return null;
    try {
      final j = jsonDecode(s) as Map<String, dynamic>;
      return CloudAccount(
        email: j['email'] as String,
        emailVerified: j['verified'] as bool,
        workspaceId: j['ws'] as String,
        workspaceName: j['ws_name'] as String,
        deviceId: j['device'] as String?,
      );
    } catch (_) {
      return null;
    }
  }
}

class CloudDevice {
  const CloudDevice({required this.id, required this.name, required this.platform, required this.appVersion,
      required this.lastSeen, required this.current, required this.revoked, required this.signedIn});
  final String id;
  final String name;
  final String platform;
  final String appVersion;
  final DateTime? lastSeen;
  final bool current;
  final bool revoked;
  final bool signedIn;
}

enum CloudSessionStatus { signedOut, signedIn }

/// Mester+ fiók a telefonon. A bejelentkezés OPCIONÁLIS: fiók nélkül minden helyi funkció megy.
/// Tokenek: access (15 perc) a memóriában + biztonságos tárolóban, refresh (60 nap) a biztonságos tárolóban;
/// minden frissítés új refresh tokent ad (rotáció), a régi azonnal érvénytelen.
class CloudSession extends ChangeNotifier implements AuthTokens {
  CloudSession({required KeyValueStore store, required ApiClient api, DateTime Function()? clock, Random? random})
      : _kv = store,
        _api = api,
        _clock = clock ?? DateTime.now,
        _random = random ?? Random.secure() {
    _api.attachTokens(this);
  }

  final KeyValueStore _kv;
  final ApiClient _api;
  final DateTime Function() _clock;
  final Random _random;

  CloudSessionStatus _status = CloudSessionStatus.signedOut;
  CloudAccount? _account;
  EntitlementSnapshot _ent = EntitlementSnapshot.none;
  String? _access;
  DateTime? _accessExp;
  Future<bool>? _refreshing;
  bool _loaded = false;

  CloudSessionStatus get status => _status;
  bool get isSignedIn => _status == CloudSessionStatus.signedIn;
  CloudAccount? get account => _account;
  ApiClient get api => _api;
  bool get cloudEnabled => _api.enabled;
  Entitlements get entitlements => Entitlements(_ent, isSignedIn, clock: _clock);
  EntitlementSnapshot get entitlementSnapshot => _ent;

  /// Indításkor: csak helyi olvasás (hálózat nélkül) – az app indulását nem lassítja.
  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    final refresh = await _kv.read(CloudKeys.refreshToken);
    _account = CloudAccount.fromJson(await _kv.read(CloudKeys.account));
    _ent = EntitlementSnapshot.fromJsonString(await _kv.read(CloudKeys.entitlements)) ?? EntitlementSnapshot.none;
    _access = await _kv.read(CloudKeys.accessToken);
    _accessExp = DateTime.tryParse(await _kv.read(CloudKeys.accessExpires) ?? '');
    _status = (refresh != null && _account != null) ? CloudSessionStatus.signedIn : CloudSessionStatus.signedOut;
    notifyListeners();
  }

  Future<String> deviceUuid() async {
    final existing = await _kv.read(CloudKeys.deviceUuid);
    if (existing != null && RegExp(r'^[0-9a-f-]{36}$').hasMatch(existing)) return existing;
    final b = List<int>.generate(16, (_) => _random.nextInt(256));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
    final uuid = '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
    await _kv.write(CloudKeys.deviceUuid, uuid);
    return uuid;
  }

  Future<Map<String, Object?>> _device() async => {
        'uuid': await deviceUuid(),
        'platform': defaultTargetPlatform == TargetPlatform.android ? 'android' : defaultTargetPlatform.name,
        'app_version': appVersion,
        'name': defaultTargetPlatform == TargetPlatform.android ? 'Android telefon' : 'Eszköz',
      };

  Future<void> register({required String email, required String password}) async {
    final r = await _api.postJson('/api/v1/auth/register', {'email': email.trim(), 'password': password, 'device': await _device()}, auth: false);
    await _storeTokens(r);
    await refreshAccount();
  }

  Future<void> login({required String email, required String password}) async {
    final r = await _api.postJson('/api/v1/auth/login', {'email': email.trim(), 'password': password, 'device': await _device()}, auth: false);
    await _storeTokens(r);
    await refreshAccount();
  }

  Future<void> _storeTokens(Map<String, dynamic> r) async {
    final access = r['access_token'];
    final refresh = r['refresh_token'];
    if (access is! String || refresh is! String) {
      throw const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage);
    }
    _access = access;
    _accessExp = _clock().toUtc().add(Duration(seconds: ((r['access_expires_in'] as num?)?.toInt() ?? 900) - 30));
    // Előbb a refresh token kerül biztonságba: ha a mentés közben leáll az app, a régi már érvénytelen.
    await _kv.write(CloudKeys.refreshToken, refresh);
    await _kv.write(CloudKeys.accessToken, access);
    await _kv.write(CloudKeys.accessExpires, _accessExp!.toIso8601String());
  }

  /// /me: fiók + jogosultság frissítése (app indításkor, húzásra frissítéskor).
  Future<void> refreshAccount() async {
    final me = await _api.getJson('/api/v1/me');
    final acc = (me['account'] as Map?) ?? const {};
    final ws = (me['workspace'] as Map?) ?? const {};
    _account = CloudAccount(
      email: '${acc['email'] ?? ''}',
      emailVerified: acc['email_verified'] == true,
      workspaceId: '${ws['id'] ?? ''}',
      workspaceName: '${ws['name'] ?? ''}',
      deviceId: me['device_id'] as String?,
    );
    _ent = EntitlementSnapshot.fromServer(me, _clock());
    await _kv.write(CloudKeys.account, jsonEncode(_account!.toJson()));
    await _kv.write(CloudKeys.entitlements, _ent.toJsonString());
    _status = CloudSessionStatus.signedIn;
    notifyListeners();
  }

  /// Hálózat-tűrő frissítés: offline / szerverhiba esetén a gyorstár marad, kivétel nincs.
  Future<void> refreshQuietly() async {
    if (!isSignedIn || !cloudEnabled) return;
    try {
      await refreshAccount();
    } on CloudException catch (e) {
      if (e.kind == CloudErrorKind.sessionExpired) await _clearLocal();
    }
  }

  @override
  Future<String?> accessToken() async {
    // A tokenre támaszkodunk, nem az állapotjelzőre: belépés közben (a /me előtt) még „kijelentkezett”.
    final exp = _accessExp;
    if (_access == null || exp == null || _clock().toUtc().isAfter(exp)) {
      if (!await refreshTokens()) return null;
    }
    return _access;
  }

  /// Egyszerre csak EGY frissítés fut (párhuzamos kérések ugyanarra várnak) – különben a
  /// rotáció miatt a második a már felhasznált refresh tokent küldené, ami munkamenet-visszavonást okozna.
  @override
  Future<bool> refreshTokens() => _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);

  Future<bool> _doRefresh() async {
    final rt = await _kv.read(CloudKeys.refreshToken);
    if (rt == null) return false;
    try {
      final r = await _api.postJson('/api/v1/auth/refresh', {'refresh_token': rt}, auth: false);
      await _storeTokens(r);
      return true;
    } on CloudException catch (e) {
      if (e.kind == CloudErrorKind.sessionExpired) {
        await _clearLocal();
        return false;
      }
      rethrow; // offline / szerverhiba: a munkamenet megmarad, később újrapróbálható
    }
  }

  Future<void> logout() async {
    try {
      if (isSignedIn) await _api.postJson('/api/v1/auth/logout', const {});
    } catch (_) {
      // offline kijelentkezés: a helyi tokenek mindenképp törlődnek
    }
    await _clearLocal();
  }

  Future<void> logoutAll() async {
    await _api.postJson('/api/v1/auth/logout-all', const {});
    await _clearLocal();
  }

  Future<void> _clearLocal() async {
    for (final k in [CloudKeys.accessToken, CloudKeys.accessExpires, CloudKeys.refreshToken, CloudKeys.account, CloudKeys.entitlements, CloudKeys.quoteLinks]) {
      await _kv.delete(k);
    }
    _access = null;
    _accessExp = null;
    _account = null;
    _ent = EntitlementSnapshot.none;
    _status = CloudSessionStatus.signedOut;
    notifyListeners();
  }

  Future<List<CloudDevice>> devices() async {
    final r = await _api.getJson('/api/v1/devices');
    return [
      for (final d in (r['devices'] as List? ?? const []))
        if (d is Map)
          CloudDevice(
            id: '${d['id']}',
            name: '${d['name']}',
            platform: '${d['platform']}',
            appVersion: '${d['app_version']}',
            lastSeen: DateTime.tryParse('${d['last_seen_at']}')?.toLocal(),
            current: d['current'] == true,
            revoked: d['revoked'] == true,
            signedIn: d['signed_in'] == true,
          ),
    ];
  }

  Future<void> revokeDevice(String id) async {
    if (!RegExp(r'^[0-9a-z]{26}$').hasMatch(id)) throw ArgumentError.value(id, 'id');
    await _api.delete('/api/v1/devices/$id');
  }

  Future<void> resendVerification() => _api.postJson('/api/v1/auth/email/resend', const {});

  Future<void> forgotPassword(String email) => _api.postJson('/api/v1/auth/password/forgot', {'email': email.trim()}, auth: false);

  /// ADATAIM EXPORTÁLÁSA (felhős metaadat; a projekt-adat a helyi mentésben van).
  Future<String> exportData() async => const JsonEncoder.withIndent(' ').convert(await _api.getJson('/api/v1/account/export'));

  /// FIÓK TÖRLÉSE: a szerveren minden felhős adat törlődik; a telefon helyi adatai MEGMARADNAK.
  Future<void> deleteAccount(String password) async {
    await _api.postJson('/api/v1/account/delete', {'password': password});
    await _clearLocal();
  }
}
