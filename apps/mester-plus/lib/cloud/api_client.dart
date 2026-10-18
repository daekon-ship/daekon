import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../core/app_info.dart';
import 'cloud_config.dart';
import 'cloud_errors.dart';

/// A hitelesítés felé mutató felület (a [CloudSession] valósítja meg) – így az API-kliens
/// nem tud a tokenek tárolásáról, csak kérni / frissíteni tudja őket.
abstract class AuthTokens {
  Future<String?> accessToken();

  /// Refresh token rotáció. `false`: a munkamenet véglegesen lejárt (ki kell jelentkeztetni).
  Future<bool> refreshTokens();
}

class ApiBytes {
  const ApiBytes(this.bytes, this.headers);
  final Uint8List bytes;
  final Map<String, String> headers;
}

/// EGYETLEN HTTP-réteg a felhőhöz: a képernyők soha nem hívnak közvetlenül HTTP-t.
///  - időkorlát (alap 20 mp, feltöltésnél hosszabb);
///  - újrapróbálás CSAK biztonságos kérésnél: GET / DELETE / PUT, vagy Idempotency-Key-es POST
///    (bejelentkezés, regisztráció és más nem idempotens írás NEM ismétlődik vakon);
///  - Authorization fejléc, lejárt access tokennél egyszeri frissítés és ismétlés;
///  - X-Request-ID minden kérésen (a szerver X-Correlation-ID-ként visszaadja);
///  - JSON-ellenőrzés és magyar hibaüzenetek ([CloudException]).
class ApiClient {
  ApiClient({
    required http.Client client,
    required CloudConfig config,
    AuthTokens? tokens,
    this.timeout = const Duration(seconds: 20),
    this.maxAttempts = 3,
    Future<void> Function(Duration)? sleep,
    Random? random,
  })  : _client = client,
        _config = config,
        _tokens = tokens,
        _sleep = sleep ?? ((d) => Future<void>.delayed(d)),
        _random = random ?? Random.secure();

  final http.Client _client;
  final CloudConfig _config;
  AuthTokens? _tokens;
  final Duration timeout;
  final int maxAttempts;
  final Future<void> Function(Duration) _sleep;
  final Random _random;

  // ignore: use_setters_to_change_properties
  void attachTokens(AuthTokens tokens) => _tokens = tokens;

  bool get enabled => _config.enabled;

  String newIdempotencyKey() => 'mp${_hex(16)}';

  String _hex(int bytes) => List.generate(bytes, (_) => _random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();

  Future<Map<String, dynamic>> getJson(String path, {Map<String, String>? query, bool auth = true}) async =>
      _json(await _send('GET', path, query: query, auth: auth, retry: true));

  Future<Map<String, dynamic>> postJson(String path, Map<String, Object?> body, {bool auth = true, String? idempotencyKey}) async =>
      _json(await _send('POST', path,
          body: utf8.encode(jsonEncode(body)),
          contentType: 'application/json; charset=utf-8',
          auth: auth,
          idempotencyKey: idempotencyKey,
          retry: idempotencyKey != null));

  Future<Map<String, dynamic>> putBytes(String path, Uint8List bytes, {Duration? timeout}) async =>
      _json(await _send('PUT', path, body: bytes, contentType: 'application/octet-stream', auth: true, retry: true, timeoutOverride: timeout));

  Future<void> delete(String path) async => _json(await _send('DELETE', path, auth: true, retry: true));

  Future<ApiBytes> getBytes(String path, {Duration? timeout}) async {
    final r = await _send('GET', path, auth: true, retry: true, timeoutOverride: timeout);
    return ApiBytes(r.bodyBytes, r.headers);
  }

  Future<http.Response> _send(
    String method,
    String path, {
    Map<String, String>? query,
    List<int>? body,
    String? contentType,
    required bool auth,
    String? idempotencyKey,
    required bool retry,
    Duration? timeoutOverride,
  }) async {
    if (!_config.enabled) {
      throw const CloudException(CloudErrorKind.disabled, CloudException.disabledMessage);
    }
    if (!path.startsWith('/api/v1/')) {
      throw ArgumentError.value(path, 'path'); // csak a saját API – tetszőleges URL soha
    }
    final uri = _config.baseUri.replace(path: path, queryParameters: query);
    var refreshed = false;
    var attempt = 0;
    while (true) {
      attempt++;
      final req = http.Request(method, uri)
        ..followRedirects = false
        ..headers['Accept'] = 'application/json'
        ..headers['X-Request-ID'] = 'mp-${_hex(8)}'
        ..headers['User-Agent'] = 'MesterPlus/$appVersion (${defaultTargetPlatform.name})';
      if (contentType != null) req.headers['Content-Type'] = contentType;
      if (idempotencyKey != null) req.headers['Idempotency-Key'] = idempotencyKey;
      if (body != null) req.bodyBytes = body;
      if (auth) {
        final t = await _tokens?.accessToken();
        if (t == null) throw const CloudException(CloudErrorKind.sessionExpired, CloudException.sessionMessage);
        req.headers['Authorization'] = 'Bearer $t';
      }
      http.Response resp;
      try {
        final streamed = await _client.send(req).timeout(timeoutOverride ?? timeout);
        resp = await http.Response.fromStream(streamed).timeout(timeoutOverride ?? timeout);
      } catch (e) {
        final err = mapNetworkError(e);
        if (retry && attempt < maxAttempts) {
          await _sleep(_backoff(attempt));
          continue;
        }
        throw err;
      }
      if (resp.statusCode == 401 && auth && !refreshed && _errorCode(resp) == 'SESSION_EXPIRED') {
        refreshed = true;
        if (await (_tokens?.refreshTokens() ?? Future.value(false))) {
          attempt--; // a frissítés nem számít próbálkozásnak
          continue;
        }
        throw const CloudException(CloudErrorKind.sessionExpired, CloudException.sessionMessage, status: 401);
      }
      final transient = resp.statusCode == 502 || resp.statusCode == 503 || resp.statusCode == 504 || resp.statusCode == 429;
      if (transient && retry && attempt < maxAttempts) {
        final ra = int.tryParse(resp.headers['retry-after'] ?? '');
        await _sleep(ra != null && ra > 0 && ra <= 10 ? Duration(seconds: ra) : _backoff(attempt));
        continue;
      }
      if (resp.statusCode >= 200 && resp.statusCode < 300) return resp;
      throw mapHttpError(resp.statusCode, resp.body);
    }
  }

  Duration _backoff(int attempt) => Duration(milliseconds: 400 * pow(3, attempt - 1).toInt() + _random.nextInt(250));

  static String? _errorCode(http.Response r) {
    try {
      final j = jsonDecode(r.body);
      if (j is Map && j['error'] is Map) return (j['error'] as Map)['code'] as String?;
    } catch (_) {}
    return null;
  }

  Map<String, dynamic> _json(http.Response r) {
    if (r.body.isEmpty) return const {};
    try {
      final j = jsonDecode(utf8.decode(r.bodyBytes));
      if (j is Map<String, dynamic>) return j;
    } catch (_) {}
    throw const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage);
  }

  /// Hálózati hiba → OFFLINE vagy SZERVER NEM ELÉRHETŐ (a felhasználó nem lát kivételt).
  static CloudException mapNetworkError(Object e) {
    if (e is CloudException) return e;
    if (e is TimeoutException || e is HandshakeException || e is TlsException) {
      return const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage);
    }
    final s = e.toString().toLowerCase();
    if (e is SocketException) {
      final code = e.osError?.errorCode;
      final refused = code == 111 || code == 61 || code == 10061 || s.contains('refused') || s.contains('reset by peer');
      return refused
          ? const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage)
          : const CloudException(CloudErrorKind.offline, CloudException.offlineMessage);
    }
    if (s.contains('failed host lookup') || s.contains('network is unreachable') || s.contains('no address associated')) {
      return const CloudException(CloudErrorKind.offline, CloudException.offlineMessage);
    }
    return const CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage);
  }

  /// HTTP-hiba → magyar üzenet. A szerver magyar üzenetét (error.message) átvesszük, a belső részletet soha.
  static CloudException mapHttpError(int status, String body) {
    String? code;
    String? msg;
    try {
      final j = jsonDecode(body);
      if (j is Map && j['error'] is Map) {
        code = (j['error'] as Map)['code'] as String?;
        final m = (j['error'] as Map)['message'];
        if (m is String && m.isNotEmpty && m.length < 300) msg = m;
      }
    } catch (_) {}
    if (status == 401 && (code == 'SESSION_EXPIRED' || code == 'UNAUTHENTICATED' || code == null)) {
      return CloudException(CloudErrorKind.sessionExpired, CloudException.sessionMessage, code: code, status: status);
    }
    if (status == 403 && code == 'PRO_REQUIRED') {
      return CloudException(CloudErrorKind.notPro, CloudException.notProMessage, code: code, status: status);
    }
    if (status == 429) {
      return CloudException(CloudErrorKind.rateLimited, msg ?? CloudException.rateMessage, code: code, status: status);
    }
    if (status >= 500) {
      return CloudException(CloudErrorKind.serverUnavailable, CloudException.unavailableMessage, code: code, status: status);
    }
    return CloudException(CloudErrorKind.api, msg ?? CloudException.genericMessage, code: code, status: status);
  }
}
