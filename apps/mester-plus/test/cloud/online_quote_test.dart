import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart' show Value, driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/cloud/cloud_errors.dart';
import 'package:mester_plus/cloud/online_quotes.dart';
import 'package:mester_plus/data/backup.dart';
import 'package:mester_plus/data/db/app_database.dart';
import 'package:mester_plus/data/providers.dart';
import 'package:mester_plus/data/repositories.dart';
import 'package:mester_plus/domain/enums.dart';
import 'package:mester_plus/domain/quote_calculator.dart';
import 'package:sqlite3/sqlite3.dart';

import 'fake_cloud.dart';

Object _skipReason() {
  try {
    sqlite3.openInMemory().close();
    return false;
  } catch (_) {
    return 'Natív SQLite nem érhető el – adatbázis-tesztek kihagyva.';
  }
}

void main() {
  setUpAll(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);

  test('KÖZÖS FIXTURE-ÖK: a Flutter QuoteCalculator forintra = a szerver (PHP) kalkulátora (ugyanaz a fájl)', () {
    final fx = jsonDecode(File('test/fixtures/quote_totals.json').readAsStringSync()) as Map<String, dynamic>;
    final cases = fx['cases'] as List;
    expect(cases.length, greaterThanOrEqualTo(50));
    for (final c in cases.cast<Map<String, dynamic>>()) {
      final input = c['input'] as Map<String, dynamic>;
      final t = QuoteCalculator.calculate(
        lines: [
          for (final l in (input['lines'] as List).cast<Map<String, dynamic>>())
            CalcLine(quantityMilli: l['quantity_milli'] as int, laborUnitPriceHuf: l['labor_unit_price_huf'] as int, materialUnitPriceHuf: l['material_unit_price_huf'] as int),
        ],
        adjustmentType: AdjustmentType.values.byName(input['adjustment_type'] as String),
        adjustmentPercentBp: input['adjustment_percent_bp'] as int,
        vatRateBp: input['vat_rate_bp'] as int,
      );
      final e = c['expected'] as Map<String, dynamic>;
      final name = c['name'];
      expect(t.laborSubtotalHuf, e['labor_subtotal_huf'], reason: '$name: díj');
      expect(t.materialSubtotalHuf, e['material_subtotal_huf'], reason: '$name: anyag');
      expect(t.adjustmentHuf, e['adjustment_huf'], reason: '$name: kedvezmény/felár');
      expect(t.netTotalHuf, e['net_total_huf'], reason: '$name: nettó');
      expect(t.vatHuf, e['vat_huf'], reason: '$name: ÁFA');
      expect(t.grossTotalHuf, e['gross_total_huf'], reason: '$name: bruttó');
      final el = (e['lines'] as List).cast<Map<String, dynamic>>();
      for (var i = 0; i < el.length; i++) {
        expect(t.lines[i].totalHuf, el[i]['total_huf'], reason: '$name: sor $i');
      }
    }
  });

  group('ONLINE AJÁNLAT (kliens)', skip: _skipReason(), () {
    late AppDatabase db;
    setUp(() => db = AppDatabase(NativeDatabase.memory()));
    tearDown(() => db.close());

    Future<(ProjectWithCustomer, List<QuoteLine>, CompanyProfile)> quote() async {
      final projects = ProjectRepository(db);
      final c = await CustomerRepository(db).create(name: 'Kovács Péter', phone: '+36 30 111 2222', email: 'kovacs@example.test', notes: 'BIZALMAS megjegyzés');
      final p = await projects.create(customerId: c, title: 'Fürdőszoba', siteAddress: 'Szeged');
      final lines = QuoteLineRepository(db, projects, PriceListRepository(db));
      final a = await lines.add(projectId: p, name: 'Burkolás', unit: WorkUnit.m2, quantityMilli: 12500, laborUnitPriceHuf: 6500, materialUnitPriceHuf: 3200);
      expect(a, greaterThan(0));
      await projects.setAdjustment(p, AdjustmentType.discount, 500);
      await CompanyRepository(db).save(const CompanyProfilesCompanion(companyName: Value('Kőműves Kft.'), phone: Value('+36 30 123 4567')));
      await projects.markQuoted(p);
      final pc = (await projects.watch(p).first)!;
      return (pc, await lines.watchForProject(p).first, await CompanyRepository(db).watch().first);
    }

    test('pillanatkép: csak az ajánlathoz szükséges adat, az összeg = az app kalkulátora', () async {
      final (pc, lines, co) = await quote();
      final payload = OnlineQuoteService.buildPayload(pc, lines, co);
      final snap = payload['snapshot']! as Map;
      final txt = jsonEncode(payload);
      expect(txt, isNot(contains('BIZALMAS')), reason: 'ügyfél-megjegyzés nem kerül fel');
      expect(txt, isNot(contains('kovacs@example.test')), reason: 'az ügyfél e-mailje nem kerül fel');
      expect(txt, isNot(contains('111 2222')), reason: 'az ügyfél telefonja nem kerül fel');
      expect((snap['customer'] as Map)['name'], 'Kovács Péter');
      expect(snap['quote_number'], pc.project.quoteNumber);
      expect((payload['totals']! as Map)['gross_total_huf'], totalsFor(pc.project, lines).grossTotalHuf);
      expect(((snap['lines'] as List).first as Map)['unit'], 'm²');
    });

    test('küldés → link + állapot; frissítés (megnyitva / elfogadva); visszavonás; offline: legutóbbi ismert állapot', () async {
      final (pc, lines, co) = await quote();
      final cloud = FakeCloud();
      final (s, kv) = await cloud.signedInSession();
      final svc = OnlineQuoteService(session: s, store: kv);
      final st = await svc.share(pc, lines, co);
      expect(st.state, OnlineQuoteState.available);
      expect(st.url, startsWith('https://ajanlat.test.invalid/a/'));
      expect(cloud.log.last.headers['Idempotency-Key'], isNotNull);
      cloud.quotes.last['opened'] = true;
      expect((await svc.refresh(pc.project.quoteNumber!))!.state, OnlineQuoteState.opened);
      cloud.quotes.last['status'] = 'ACCEPTED';
      final acc = await svc.refresh(pc.project.quoteNumber!);
      expect(acc!.state, OnlineQuoteState.accepted);
      expect(acc.url, st.url, reason: 'a link a telefonon megmarad');
      cloud.offline = true;
      await expectLater(svc.refresh(pc.project.quoteNumber!), throwsA(isA<CloudException>().having((e) => e.kind, 'kind', CloudErrorKind.offline)));
      expect((await svc.cached(pc.project.quoteNumber!))!.state, OnlineQuoteState.accepted);
      cloud.offline = false;
      cloud.quotes.last['status'] = 'ACTIVE';
      final rev = await svc.revoke(acc);
      expect(rev.state, OnlineQuoteState.revoked);
    });

    test('ajánlatszám nélkül nem küldhető online (előbb kiküldés)', () async {
      final c = await CustomerRepository(db).create(name: 'X');
      final p = await ProjectRepository(db).create(customerId: c, title: 'Y');
      final pc = (await ProjectRepository(db).watch(p).first)!;
      final co = await CompanyRepository(db).watch().first;
      expect(() => OnlineQuoteService.buildPayload(pc, const [], co), throwsStateError);
    });
  });

  group('MIGRÁCIÓ / RÉGI FELHASZNÁLÓ (v0.7 → Cloud-verzió)', skip: _skipReason(), () {
    test('a helyi adatbázis-séma NEM változott (schemaVersion 3) – nincs migráció, nincs adatvesztés', () async {
      final db = AppDatabase(NativeDatabase.memory());
      expect(db.schemaVersion, 3);
      await db.close();
    });

    test('a v0.7-es helyi mentés (format 2, schema 3) az új verzióval hibátlanul visszaállítható', () async {
      final old = AppDatabase(NativeDatabase.memory());
      final c = await CustomerRepository(old).create(name: 'Régi ügyfél');
      await ProjectRepository(old).create(customerId: c, title: 'Régi projekt');
      final json = await BackupService(old).exportJson();
      expect((jsonDecode(json) as Map)['format'], 2);
      final fresh = AppDatabase(NativeDatabase.memory());
      final svc = BackupService(fresh);
      await svc.restore(svc.parse(json));
      expect((await fresh.select(fresh.customers).get()).single.name, 'Régi ügyfél');
      expect((await fresh.select(fresh.projects).get()).single.title, 'Régi projekt');
      await old.close();
      await fresh.close();
    });
  });
}
