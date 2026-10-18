import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mester_plus/cloud/api_client.dart';
import 'package:mester_plus/cloud/cloud_config.dart';
import 'package:mester_plus/cloud/cloud_errors.dart';

class _Tokens implements AuthTokens {
  String token = 'mpa_old';
  int refreshes = 0;
  bool refreshOk = true;
  @override
  Future<String?> accessToken() async => token;
  @override
  Future<bool> refreshTokens() async {
    refreshes++;
    if (refreshOk) token = 'mpa_new';
    return refreshOk;
  }
}

http.Response _j(Object b, [int s = 200]) => http.Response(jsonEncode(b), s, headers: {'content-type': 'application/json'});
http.Response _e(int s, String code, String msg) => _j({'error': {'code': code, 'message': msg, 'request_id': 'r'}}, s);

final _cfg = CloudConfig.resolve(defineBase: 'https://api.test.invalid', defineEnv: 'test', isRelease: false);

ApiClient _client(MockClient c, {_Tokens? t}) => ApiClient(client: c, config: _cfg, tokens: t ?? _Tokens(), sleep: (_) async {});

void main() {
  group('ApiClient', () {
    test('JSON, Authorization, X-Request-ID, User-Agent; csak a saját API-útvonal', () async {
      late http.BaseRequest seen;
      final api = _client(MockClient((r) async {
        seen = r;
        return _j({'ok': true});
      }));
      expect(await api.getJson('/api/v1/me'), {'ok': true});
      expect(seen.headers['Authorization'], 'Bearer mpa_old');
      expect(seen.headers['X-Request-ID'], matches(RegExp(r'^mp-[0-9a-f]{16}$')));
      expect(seen.url.toString(), 'https://api.test.invalid/api/v1/me');
      expect(() => api.getJson('https://evil.example/x'), throwsArgumentError);
      expect(() => api.getJson('/../etc/passwd'), throwsArgumentError);
    });

    test('hibaleképezés: offline / szerver nem elérhető / session lejárt / nincs Pro / API-hiba – magyarul, nyers részlet nélkül', () async {
      Future<CloudException> err(MockClient c) async {
        try {
          await _client(c).getJson('/api/v1/me');
        } on CloudException catch (e) {
          return e;
        }
        fail('nem dobott');
      }

      var e = await err(MockClient((_) async => throw const SocketException('Failed host lookup: api', osError: OSError('x', 7))));
      expect(e.kind, CloudErrorKind.offline);
      expect(e.message, 'Nincs internetkapcsolat. A helyi adataid megvannak, a felhő-művelet később újrapróbálható.');
      e = await err(MockClient((_) async => throw const SocketException('Connection refused', osError: OSError('refused', 111))));
      expect(e.kind, CloudErrorKind.serverUnavailable);
      e = await err(MockClient((_) async => throw TimeoutException('t')));
      expect(e.kind, CloudErrorKind.serverUnavailable);
      e = await err(MockClient((_) async => _e(500, 'INTERNAL_ERROR', 'Váratlan hiba történt.')));
      expect(e.kind, CloudErrorKind.serverUnavailable);
      expect(e.message, isNot(contains('500')));
      e = await err(MockClient((_) async => _e(403, 'PRO_REQUIRED', 'x')));
      expect([e.kind, e.message], [CloudErrorKind.notPro, 'Ehhez a funkcióhoz Mester+ Pro szükséges.']);
      e = await err(MockClient((_) async => _e(413, 'QUOTA_EXCEEDED', 'Elfogyott a felhőtárhelyed.')));
      expect([e.kind, e.message, e.code], [CloudErrorKind.api, 'Elfogyott a felhőtárhelyed.', 'QUOTA_EXCEEDED']);
      e = await err(MockClient((_) async => http.Response('<html>nginx</html>', 502)));
      expect(e.kind, CloudErrorKind.serverUnavailable);
      e = await err(MockClient((_) async => http.Response('SQLSTATE[HY000] stack trace #0', 400)));
      expect(e.message, CloudException.genericMessage, reason: 'nem-JSON hibatest nem jut a felületre');
      e = await err(MockClient((_) async => http.Response('nem json', 200)));
      expect(e.kind, CloudErrorKind.serverUnavailable);
    });

    test('újrapróbálás: GET 503 → siker; nem idempotens POST (belépés) NEM ismétlődik; Idempotency-Key-es POST igen', () async {
      var n = 0;
      var api = _client(MockClient((_) async => ++n < 3 ? _e(503, 'SERVICE_UNAVAILABLE', 'x') : _j({'ok': 1})));
      expect(await api.getJson('/api/v1/me'), {'ok': 1});
      expect(n, 3);
      n = 0;
      api = _client(MockClient((_) async {
        n++;
        return _e(503, 'SERVICE_UNAVAILABLE', 'x');
      }));
      await expectLater(api.postJson('/api/v1/auth/login', {'email': 'a'}, auth: false), throwsA(isA<CloudException>()));
      expect(n, 1, reason: 'belépés nem ismétlődik vakon');
      n = 0;
      final keys = <String?>{};
      api = _client(MockClient((r) async {
        n++;
        keys.add(r.headers['Idempotency-Key']);
        return n < 2 ? _e(503, 'x', 'x') : _j({'id': 'b'}, 201);
      }));
      expect(await api.postJson('/api/v1/backups', {'a': 1}, idempotencyKey: api.newIdempotencyKey()), {'id': 'b'});
      expect([n, keys.length], [2, 1], reason: 'ugyanazzal a kulccsal ismétel → a szerver nem duplikál');
    });

    test('lejárt access token: egyszeri frissítés és ismétlés; sikertelen frissítés → SESSION LEJÁRT', () async {
      final t = _Tokens();
      final api = _client(MockClient((r) async => r.headers['Authorization'] == 'Bearer mpa_new' ? _j({'ok': 1}) : _e(401, 'SESSION_EXPIRED', 'x')), t: t);
      expect(await api.getJson('/api/v1/me'), {'ok': 1});
      expect(t.refreshes, 1);
      final t2 = _Tokens()..refreshOk = false;
      final api2 = _client(MockClient((_) async => _e(401, 'SESSION_EXPIRED', 'x')), t: t2);
      await expectLater(api2.getJson('/api/v1/me'), throwsA(isA<CloudException>().having((e) => e.kind, 'kind', CloudErrorKind.sessionExpired)));
    });

    test('kikapcsolt felhő (release, nem engedélyezett cím): semmilyen kérés nem megy ki', () async {
      var n = 0;
      final api = ApiClient(
        client: MockClient((_) async {
          n++;
          return _j({});
        }),
        config: CloudConfig.resolve(defineBase: 'http://localhost:8080', defineEnv: 'development', isRelease: true),
      );
      await expectLater(api.getJson('/api/v1/health', auth: false), throwsA(isA<CloudException>().having((e) => e.kind, 'kind', CloudErrorKind.disabled)));
      expect(n, 0);
    });
  });

  group('CloudConfig – környezetek', () {
    test('release: csak https://api.mesterplus.daekon.hu (production)', () {
      final prod = CloudConfig.resolve(defineBase: '', defineEnv: '', isRelease: true);
      expect([prod.enabled, prod.baseUri.toString(), prod.environment], [true, 'https://api.mesterplus.daekon.hu', 'production']);
      for (final bad in ['http://api.mesterplus.daekon.hu', 'https://localhost', 'https://127.0.0.1', 'https://api-staging.mesterplus.daekon.hu',
        'https://api.mesterplus.daekon.hu:8443', 'https://evil.example']) {
        expect(CloudConfig.resolve(defineBase: bad, defineEnv: 'production', isRelease: true).enabled, isFalse, reason: bad);
      }
      expect(CloudConfig.resolve(defineBase: 'https://api.mesterplus.daekon.hu', defineEnv: 'staging', isRelease: true).enabled, isFalse,
          reason: 'production build soha nem mutat stagingre');
    });
    test('fejlesztői build: staging megengedett, de csak HTTPS', () {
      expect(CloudConfig.resolve(defineBase: 'https://api-staging.mesterplus.daekon.hu', defineEnv: 'staging', isRelease: false).enabled, isTrue);
      expect(CloudConfig.resolve(defineBase: 'http://10.0.2.2:8080', defineEnv: 'development', isRelease: false).enabled, isFalse);
    });
  });
}
