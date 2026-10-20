// ÉLŐ integrációs teszt a VALÓDI Mester+ Cloud szerver ellen (a teljes kliens-kódúttal).
// Csak kifejezett kérésre fut (CI-ben kimarad):
//   MP_LIVE_BASE=http://mp-cloud-test.test MP_LIVE_CONNECT=127.0.0.1:18080 flutter test test/integration/cloud_live_test.dart
// (az MP_LIVE_CONNECT egy SSH-alagút helyi vége a szerver felé – a forgalom titkosított; a teszt csak eldobható
// teszt-fiókot használ, és a végén törli.)
import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart' show Value, driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';
import 'package:mester_plus/cloud/api_client.dart';
import 'package:mester_plus/cloud/cloud_backup_service.dart';
import 'package:mester_plus/cloud/cloud_config.dart';
import 'package:mester_plus/cloud/cloud_errors.dart';
import 'package:mester_plus/cloud/cloud_session.dart';
import 'package:mester_plus/cloud/online_quotes.dart';
import 'package:mester_plus/cloud/secure_kv.dart';
import 'package:mester_plus/data/backup.dart';
import 'package:mester_plus/data/db/app_database.dart';
import 'package:mester_plus/data/repositories.dart';
import 'package:mester_plus/domain/enums.dart';

final _base = Platform.environment['MP_LIVE_BASE'] ?? '';
final _connect = Platform.environment['MP_LIVE_CONNECT'] ?? '';

http.Client _client() {
  final hc = HttpClient();
  if (_connect.isNotEmpty) {
    final parts = _connect.split(':');
    hc.connectionFactory = (uri, proxyHost, proxyPort) => Socket.startConnect(parts[0], int.parse(parts[1]));
  }
  return IOClient(hc);
}

void main() {
  setUpAll(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);

  test('ÉLŐ: CLOUD BACKUP + ONLINE AJÁNLAT teljes munkafolyamat a valódi szerver ellen', skip: _base.isEmpty ? 'MP_LIVE_BASE nincs megadva' : false, () async {
    final steps = <String>[];
    void ok(String s) {
      steps.add('PASS  $s');
      // ignore: avoid_print
      print('PASS  $s');
    }

    final cfg = CloudConfig(baseUri: Uri.parse(_base), enabled: true, environment: 'test');
    final httpClient = _client();
    CloudSession newSession(KeyValueStore kv) => CloudSession(store: kv, api: ApiClient(client: httpClient, config: cfg));

    // 1. REGISTER + DEVICE
    final email = 'live-${DateTime.now().millisecondsSinceEpoch}@example.test';
    const password = 'Elo-Teszt-Jelszo-2026'; // gitleaks:allow (eldobható teszt-fiók jelszava)
    final kv1 = MemoryKeyValueStore();
    final phone1 = newSession(kv1);
    await phone1.register(email: email, password: password);
    expect(phone1.isSignedIn, isTrue);
    ok('REGISTER (+ eszköz regisztrálva, tokenek a biztonságos tárolóban)');
    // Pro jogosultság: teszt-szerveren sandbox-vásárlással; PRODUCTIONBEN (ahol sandbox nincs és valódi fizetés nem lehet)
    // a tulajdonosi CLI kézi, 1 napos jogosultságával (MP_LIVE_GRANT_SSH + MP_LIVE_GRANT_REMOTE).
    final grantSsh = Platform.environment['MP_LIVE_GRANT_SSH'] ?? '';
    if (grantSsh.isNotEmpty) {
      final r = await Process.run('C:/Windows/System32/OpenSSH/ssh.exe', ['-n', grantSsh, '${Platform.environment['MP_LIVE_GRANT_REMOTE']} $email']);
      expect(r.exitCode, 0, reason: 'kézi Pro-jogosultság (CLI)');
    } else {
      await phone1.api.postJson('/api/v1/billing/sandbox/verify', {'purchase_token': 'sandbox:mester_plus_pro_monthly:ok:${DateTime.now().microsecondsSinceEpoch}'},
          idempotencyKey: phone1.api.newIdempotencyKey());
    }
    await phone1.refreshAccount();
    expect(phone1.entitlements.canUseCloudBackup(), isTrue);
    ok('PRO jogosultság a szervertől (${grantSsh.isEmpty ? 'sandbox-vásárlás' : 'kézi tulajdonosi jogosultság, fizetés nélkül'}) → canUseCloudBackup()');

    // 2. LOCAL DATA
    final src = AppDatabase(NativeDatabase.memory());
    final projects = ProjectRepository(src);
    final cust = await CustomerRepository(src).create(name: 'Élő Teszt Ügyfél – Őrség', phone: '+36 30 999 0000');
    final pid = await projects.create(customerId: cust, title: 'Fürdőszoba – élő teszt', siteAddress: 'Pécs');
    await QuoteLineRepository(src, projects, PriceListRepository(src))
        .add(projectId: pid, name: 'Falburkolás', unit: WorkUnit.m2, quantityMilli: 18250, laborUnitPriceHuf: 7400, materialUnitPriceHuf: 2900);
    await projects.setAdjustment(pid, AdjustmentType.discount, 350);
    await FinanceRepository(src, projects).addPayment(projectId: pid, amountHuf: 120000, paidAt: DateTime(2026, 10, 10), method: PaymentMethod.transfer);
    await CompanyRepository(src).save(const CompanyProfilesCompanion(companyName: Value('Élő Teszt Burkoló Kft.'), phone: Value('+36 30 123 4567')));
    ok('LOCAL DATA (ügyfél, projekt, tétel, kedvezmény, befizetés, cégadat)');

    // 3. CREATE BACKUP → ENCRYPT → UPLOAD → VERIFY
    final svc1 = CloudBackupService(session: phone1, local: BackupService(src), writeSafetyCopy: (_) async {});
    final (info, _) = await svc1.backupNow();
    expect(info.sha256, hasLength(64));
    ok('CREATE BACKUP → ENCRYPT (AES-256-GCM a telefonon) → UPLOAD → VERIFY (szerver: méret + SHA-256 + fejléc → READY)');

    // 4. LIST
    final list = await svc1.list();
    expect(list.backups.map((b) => b.id), contains(info.id));
    ok('LIST BACKUPS (${list.backups.length} db, ${list.usedBytes} bájt / ${list.quotaBytes})');

    // Kereszt-ellenőrzés a szerver nyelvével (PHP / OpenSSL) – a blob és a kulcs csak egy ideiglenes helyi fájlba kerül.
    final xdir = Directory.systemTemp.createTempSync('mp-xcheck');
    final blob = await phone1.api.getBytes('/api/v1/backups/${info.id}/content');
    final key = await phone1.api.getJson('/api/v1/backups/key');
    File('${xdir.path}/x.json').writeAsStringSync(jsonEncode({
      'key': key['key'], 'ws': phone1.account!.workspaceId, 'blob': base64Encode(blob.bytes), 'plain': await BackupService(src).exportJson(),
    }));
    // ignore: avoid_print
    print('XCHECK ${xdir.path}/x.json');

    // 5. ÚJ TELEFON: LOGIN → DOWNLOAD → VERIFY → RESTORE TO CLEAN TEST DB → COMPARE
    final kv2 = MemoryKeyValueStore();
    final phone2 = newSession(kv2);
    await phone2.login(email: email, password: password);
    ok('LOGIN egy második (új) eszközről');
    final dst = AppDatabase(NativeDatabase.memory());
    String? safety;
    final svc2 = CloudBackupService(session: phone2, local: BackupService(dst), writeSafetyCopy: (j) async => safety = j);
    final list2 = await svc2.list();
    final prepared = await svc2.prepareRestore(list2.backups.firstWhere((b) => b.id == info.id));
    ok('DOWNLOAD → VERIFY (SHA-256) → DECRYPT → a meglévő BackupService-ellenőrzés: ${prepared.parsed.customers.length} ügyfél, ${prepared.parsed.projects.length} projekt');
    await svc2.restore(prepared);
    expect(safety, isNotNull);
    final a = (jsonDecode(await BackupService(src).exportJson()) as Map)['tables'];
    final b = (jsonDecode(await BackupService(dst).exportJson()) as Map)['tables'];
    expect(b, a);
    ok('RESTORE TO CLEAN TEST DB (előtte biztonsági másolat) → COMPARE DATA: minden tábla egyezik');

    // 6. ONLINE AJÁNLAT: CREATE → SNAPSHOT → PUBLIC LINK
    await projects.markQuoted(pid);
    final pc = (await projects.watch(pid).first)!;
    final lines = await QuoteLineRepository(src, projects, PriceListRepository(src)).watchForProject(pid).first;
    final company = await CompanyRepository(src).watch().first;
    final oq = OnlineQuoteService(session: phone1, store: kv1);
    final st = await oq.share(pc, lines, company);
    expect(st.state, OnlineQuoteState.available);
    expect(st.url, isNotNull);
    ok('ONLINE QUOTE: CREATE → SNAPSHOT (a szerver ugyanazzal a szabállyal újraszámolta) → PUBLIC LINK');
    File('${xdir.path}/quote.txt').writeAsStringSync('${st.url}\n${st.id}\n${pc.project.quoteNumber}\n');
    // ignore: avoid_print
    print('QUOTE ${xdir.path}/quote.txt');

    // 7. Ügyfél: OPEN → OPEN EVENT
    final path = Uri.parse(st.url!).path;
    final ua = {'User-Agent': 'Mozilla/5.0 (Linux; Android 14) MesterPlusLiveTest'};
    var r = await httpClient.get(cfg.baseUri.replace(path: path), headers: ua);
    expect(r.statusCode, 200);
    expect(r.body, contains('ELFOGADOM'));
    expect(r.headers['content-security-policy'], contains("default-src 'none'"));
    expect((await oq.refresh(pc.project.quoteNumber!))!.state, OnlineQuoteState.opened);
    ok('OPEN (mobil böngésző) → OPEN EVENT → az app látja: Megnyitva');

    // 8. ACCEPT (megerősítő oldal → CSRF-süti + rejtett mező → POST) → ACCEPT EVENT → APP STATUS REFRESH
    r = await httpClient.get(cfg.baseUri.replace(path: '$path/elfogadom'), headers: ua);
    final cookie = RegExp(r'mp_csrf=([a-f0-9]{32})').firstMatch(r.headers['set-cookie'] ?? '')!.group(1)!;
    final hash = RegExp(r'name="hash" value="([0-9a-f]{64})"').firstMatch(r.body)!.group(1)!;
    r = await httpClient.post(cfg.baseUri.replace(path: '$path/elfogadom'),
        headers: {...ua, 'Cookie': 'mp_csrf=$cookie', 'Content-Type': 'application/x-www-form-urlencoded'}, body: 'csrf=$cookie&hash=$hash&ok=1');
    expect(r.statusCode, 200);
    expect(r.body, contains('Ajánlat elfogadva'));
    final accepted = await oq.refresh(pc.project.quoteNumber!);
    expect(accepted!.state, OnlineQuoteState.accepted);
    ok('ACCEPT (megerősítéssel, CSRF-fel) → ACCEPT EVENT → APP STATUS REFRESH: Elfogadva');

    // 9. REVOKE (egy új változaton) – a régi link 410
    final v2 = await oq.share(pc, lines, company);
    final rv = await oq.revoke(v2);
    expect(rv.state, OnlineQuoteState.revoked);
    r = await httpClient.get(cfg.baseUri.replace(path: Uri.parse(v2.url!).path), headers: ua);
    expect(r.statusCode, 410);
    ok('REVOKE → a link 410 (nem érhető el)');

    // 10. Eszközök, kijelentkezés mindenhonnan, fiók törlése
    final devs = await phone1.devices();
    expect(devs.where((d) => d.signedIn).length, 2);
    ok('ESZKÖZEIM: 2 bejelentkezett eszköz');
    await phone1.deleteAccount(password);
    expect(phone1.isSignedIn, isFalse);
    await expectLater(phone2.refreshAccount(), throwsA(isA<CloudException>()));
    await expectLater(newSession(MemoryKeyValueStore()).login(email: email, password: password), throwsA(isA<CloudException>()));
    ok('DELETE TEST ACCOUNT → a másik eszköz munkamenete is halott, belépés nem lehetséges');

    await src.close();
    await dst.close();
    httpClient.close();
    File('${xdir.path}/steps.txt').writeAsStringSync(steps.join('\n'));
  }, timeout: const Timeout(Duration(minutes: 5)));
}
