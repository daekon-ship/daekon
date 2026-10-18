import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/cloud/cloud_errors.dart';
import 'package:mester_plus/cloud/entitlements.dart';
import 'package:mester_plus/cloud/secure_kv.dart';

import 'fake_cloud.dart';

void main() {
  group('Mester+ fiók (CloudSession)', () {
    test('regisztráció / belépés: tokenek a biztonságos tárolóban, jogosultság gyorstárazva', () async {
      final cloud = FakeCloud();
      final kv = MemoryKeyValueStore();
      final s = cloud.session(kv);
      await s.register(email: 'uj@example.test', password: 'Jo-Jelszo-2026');
      expect(s.isSignedIn, isTrue);
      expect(kv.data[CloudKeys.refreshToken], startsWith('mpr_'));
      expect(kv.data[CloudKeys.accessToken], startsWith('mpa_'));
      expect(s.entitlements.canUseCloudBackup(), isTrue);
      expect(kv.data.values.any((v) => v.contains('Jo-Jelszo-2026')), isFalse, reason: 'a jelszó nem tárolódik');
      await expectLater(s.register(email: 'uj@example.test', password: 'Jo-Jelszo-2026'), throwsA(isA<CloudException>()));
    });

    test('rossz jelszó: érthető hiba, nincs bejelentkezés', () async {
      final cloud = FakeCloud();
      final s = cloud.session(MemoryKeyValueStore());
      cloud.users['a@example.test'] = 'Jo-Jelszo-2026';
      await expectLater(
          s.login(email: 'a@example.test', password: 'rossz'),
          throwsA(isA<CloudException>().having((e) => e.message, 'msg', 'Hibás e-mail cím vagy jelszó.')));
      expect(s.isSignedIn, isFalse);
    });

    test('egyszerre csak EGY tokenfrissítés fut (rotációnál a második a felhasznált tokent küldené)', () async {
      final cloud = FakeCloud();
      final (s, _) = await cloud.signedInSession();
      final r = await Future.wait([s.refreshTokens(), s.refreshTokens(), s.refreshTokens()]);
      expect(r, [true, true, true]);
      expect(cloud.refreshCalls, 1);
    });

    test('lejárt / visszavont munkamenet: frissítés sikertelen → kijelentkeztetve, a helyi tokenek törölve', () async {
      final cloud = FakeCloud();
      final (s, kv) = await cloud.signedInSession();
      cloud.refresh = 'mpr_mas';
      expect(await s.refreshTokens(), isFalse);
      expect(s.isSignedIn, isFalse);
      expect(kv.data.containsKey(CloudKeys.refreshToken), isFalse);
      expect(kv.data.containsKey(CloudKeys.deviceUuid), isTrue, reason: 'az eszköz-azonosító megmarad');
    });

    test('offline kijelentkezés is törli a helyi tokeneket; offline indítás a tárolóból (hálózat nélkül)', () async {
      final cloud = FakeCloud();
      final (s, kv) = await cloud.signedInSession();
      final s2 = cloud.session(kv);
      cloud.offline = true;
      await s2.load();
      expect(s2.isSignedIn, isTrue, reason: 'indulás hálózat nélkül');
      expect(s2.entitlements.canUseCloudBackup(), isTrue, reason: 'a gyorstár offline is él');
      await s2.refreshQuietly();
      expect(s2.isSignedIn, isTrue, reason: 'offline frissítés nem jelentkeztet ki');
      await s.logout();
      expect(kv.data.containsKey(CloudKeys.refreshToken), isFalse);
    });

    test('eszközlista és fiók törlése (a helyi adatokhoz nem nyúl)', () async {
      final cloud = FakeCloud();
      final (s, _) = await cloud.signedInSession();
      final d = await s.devices();
      expect(d.length, 2);
      expect(d.first.current, isTrue);
      expect(() => s.revokeDevice('../x'), throwsArgumentError);
    });
  });

  group('Jogosultság-gyorstár (offline entitlement)', () {
    final now = DateTime.utc(2026, 10, 18, 12);
    EntitlementSnapshot snap({int days = 7}) => EntitlementSnapshot.fromServer({
          'plan': {'code': 'pro', 'name': 'Mester+ Pro'},
          'entitlements': ['cloud_backup', 'online_quotes'],
          'server_time': now.toIso8601String(),
          'cache_until': now.add(Duration(days: days)).toIso8601String(),
        }, now);

    test('türelmi időn belül offline is Pro; utána újra kell kapcsolódni', () {
      final s = snap();
      expect(Entitlements(s, true, clock: () => now.add(const Duration(days: 3))).canUseCloudBackup(), isTrue);
      final late = Entitlements(s, true, clock: () => now.add(const Duration(days: 8)));
      expect(late.canUseCloudBackup(), isFalse);
      expect(late.needsRefresh, isTrue);
    });
    test('visszaállított telefon-óra (manipuláció) → nem érvényes', () {
      expect(Entitlements(snap(), true, clock: () => now.subtract(const Duration(days: 5))).canUseOnlineQuotes(), isFalse);
    });
    test('kijelentkezve nincs felhős jogosultság; a tárolt forma visszaolvasható', () {
      expect(Entitlements(snap(), false, clock: () => now).canUseCloudBackup(), isFalse);
      final back = EntitlementSnapshot.fromJsonString(snap().toJsonString())!;
      expect(back.features, {'cloud_backup', 'online_quotes'});
      expect(EntitlementSnapshot.fromJsonString('{hibás'), isNull);
    });
    test('hamisított (szerver nélküli) gyorstár sem ad végtelen Pro-t: a lejárat a lekéréshez kötött', () {
      final fake = EntitlementSnapshot.fromServer({
        'plan': {'code': 'pro', 'name': 'x'},
        'entitlements': ['cloud_backup'],
        'server_time': now.toIso8601String(),
        'cache_until': now.add(const Duration(days: 3650)).toIso8601String(),
      }, now);
      expect(fake.cacheUntil.difference(now).inDays, 7, reason: 'irreális (> 30 nap) gyorstár-hossz helyett 7 nap');
    });
  });
}
