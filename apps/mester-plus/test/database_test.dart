import 'dart:convert';

import 'package:drift/drift.dart' show Value, driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/data/backup.dart';
import 'package:mester_plus/data/db/app_database.dart';
import 'package:mester_plus/data/providers.dart';
import 'package:mester_plus/data/repositories.dart';
import 'package:mester_plus/domain/enums.dart';
import 'package:mester_plus/domain/project_finance.dart';
import 'package:sqlite3/sqlite3.dart';

/// A DB-tesztekhez natív SQLite kell a gépen. macOS/Linux alatt alapból van;
/// Windows-on egy sqlite3.dll-t kell a PATH-ra (vagy a projekt gyökerébe)
/// tenni — ld. README. Ha nincs, a csoport ÉRTHETŐ indoklással kimarad,
/// nem bukik el.
Object _skipReason() {
  try {
    sqlite3.openInMemory().close();
    return false;
  } catch (_) {
    return 'Natív SQLite nem érhető el ezen a gépen — adatbázis-tesztek kihagyva (ld. README).';
  }
}

void main() {
  late AppDatabase db;
  late CustomerRepository customers;
  late ProjectRepository projects;
  late SurveyRepository survey;
  late PriceListRepository prices;
  late QuoteLineRepository lines;
  late CompanyRepository company;

  setUpAll(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    customers = CustomerRepository(db);
    projects = ProjectRepository(db);
    survey = SurveyRepository(db, projects);
    prices = PriceListRepository(db);
    lines = QuoteLineRepository(db, projects, prices);
    company = CompanyRepository(db);
  });

  tearDown(() => db.close());

  Future<int> newProject() async {
    final c = await customers.create(name: 'Kovács Péter');
    return projects.create(customerId: c, title: 'Fürdőszoba');
  }

  group('Adatbázis', skip: _skipReason(), () {
    test('seed: árlista ár NÉLKÜL, cégprofil létezik', () async {
      final items = await db.select(db.priceItems).get();
      expect(items, isNotEmpty);
      expect(items.every((i) => i.laborUnitPriceHuf == 0 && i.materialUnitPriceHuf == 0), isTrue);
      final profile = await company.watch().first;
      expect(profile.id, 1);
    });

    test('projekt törlése a gyermekrekordokat is törli', () async {
      final p = await newProject();
      await survey.create(projectId: p, name: 'Fürdő', lengthCm: 200, widthCm: 150);
      await lines.add(
        projectId: p,
        name: 'Csempézés',
        unit: WorkUnit.m2,
        quantityMilli: 10000,
        laborUnitPriceHuf: 9000,
        materialUnitPriceHuf: 0,
      );
      await projects.delete(p);
      expect(await db.select(db.surveyAreas).get(), isEmpty);
      expect(await db.select(db.quoteLines).get(), isEmpty);
      expect(await db.select(db.projects).get(), isEmpty);
    });

    test('FK cascade önmagában is működik (PRAGMA foreign_keys = ON)', () async {
      final p = await newProject();
      await lines.add(
        projectId: p,
        name: 'X',
        unit: WorkUnit.db,
        quantityMilli: 1000,
        laborUnitPriceHuf: 1,
        materialUnitPriceHuf: 0,
      );
      // Közvetlen törlés, a repository explicit gyermektörlése nélkül:
      await (db.delete(db.projects)..where((t) => t.id.equals(p))).go();
      expect(await db.select(db.quoteLines).get(), isEmpty);
    });

    test('projekttel rendelkező ügyfél nem törölhető', () async {
      final p = await newProject();
      final c = (await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle()).customerId;
      expect(await customers.deleteIfUnused(c), isFalse);
      expect(
        () => (db.delete(db.customers)..where((t) => t.id.equals(c))).go(),
        throwsA(anything),
        reason: 'FK restrict az adatbázis szintjén is véd',
      );
    });

    test('kedvezmény perzisztál; "Nincs" nullázza a százalékot (nincs csendes visszaéledés)', () async {
      final p = await newProject();
      await projects.setAdjustment(p, AdjustmentType.discount, 1500);
      var row = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      expect(row.adjustmentType, AdjustmentType.discount);
      expect(row.adjustmentPercentBp, 1500);

      await projects.setAdjustment(p, AdjustmentType.none, 1500);
      row = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      expect(row.adjustmentPercentBp, 0);

      await projects.setAdjustment(p, AdjustmentType.discount, 0);
      row = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      expect(row.adjustmentPercentBp, 0, reason: 'visszaváltáskor a régi 15% nem éledhet fel');
    });

    test('helyiség törlése megtartja a tételt, helyiség nélkül', () async {
      final p = await newProject();
      final a = await survey.create(projectId: p, name: 'Konyha');
      await lines.add(
        projectId: p,
        areaId: a,
        name: 'Burkolás',
        unit: WorkUnit.m2,
        quantityMilli: 5000,
        laborUnitPriceHuf: 1,
        materialUnitPriceHuf: 0,
      );
      final area = await (db.select(db.surveyAreas)..where((t) => t.id.equals(a))).getSingle();
      await survey.delete(area);
      final ls = await db.select(db.quoteLines).get();
      expect(ls, hasLength(1));
      expect(ls.single.areaId, isNull);
    });

    test('ajánlat-sor ár pillanatkép: az árlista módosítása nem írja át', () async {
      final p = await newProject();
      final item = await prices.create(
        name: 'Fugázás',
        unit: WorkUnit.m2,
        category: TradeCategory.burkolas,
        laborUnitPriceHuf: 1000,
        materialUnitPriceHuf: 200,
      );
      await lines.add(
        projectId: p,
        priceItemId: item,
        name: 'Fugázás',
        unit: WorkUnit.m2,
        quantityMilli: 1000,
        laborUnitPriceHuf: 1000,
        materialUnitPriceHuf: 200,
      );
      await prices.updatePrices(item, laborUnitPriceHuf: 5000, materialUnitPriceHuf: 900);
      final l = await db.select(db.quoteLines).getSingle();
      expect(l.laborUnitPriceHuf, 1000);
      expect(l.materialUnitPriceHuf, 200);
    });

    test('árazás a sorra és (kérésre) az árlistára is ír', () async {
      final p = await newProject();
      final item = await prices.create(
        name: 'Aljzat',
        unit: WorkUnit.m2,
        category: TradeCategory.aljzat,
        laborUnitPriceHuf: 0,
        materialUnitPriceHuf: 0,
      );
      await lines.add(
        projectId: p,
        priceItemId: item,
        name: 'Aljzat',
        unit: WorkUnit.m2,
        quantityMilli: 2000,
        laborUnitPriceHuf: 0,
        materialUnitPriceHuf: 0,
      );
      final l = await db.select(db.quoteLines).getSingle();
      await lines.setPrices(l, laborUnitPriceHuf: 3000, materialUnitPriceHuf: 1500, alsoUpdatePriceList: true);
      final pi = await (db.select(db.priceItems)..where((t) => t.id.equals(item))).getSingle();
      expect(pi.laborUnitPriceHuf, 3000);
      expect(pi.materialUnitPriceHuf, 1500);
    });

    test('ajánlatszám: egyedi, évenként növekvő, ismételt jelölésnél nem változik', () async {
      await company.save(const CompanyProfilesCompanion(quotePrefix: Value('KP')));
      final p1 = await newProject();
      final p2 = await newProject();
      final n1 = await projects.markQuoted(p1);
      final n2 = await projects.markQuoted(p2);
      final year = DateTime.now().year;
      expect(n1, 'KP-$year-001');
      expect(n2, 'KP-$year-002');
      expect(await projects.markQuoted(p1), n1);
      final row = await (db.select(db.projects)..where((t) => t.id.equals(p1))).getSingle();
      expect(row.status, ProjectStatus.quoted);
    });

    test('helyiség-méret pontosítása frissíti az átvett mennyiséget, a kézit nem', () async {
      final p = await newProject();
      final a = await survey.create(projectId: p, name: 'Fürdő', lengthCm: 200, widthCm: 150, heightCm: 250);
      final area = await (db.select(db.surveyAreas)..where((t) => t.id.equals(a))).getSingle();
      // padló 3,0 m² (átvett), kerület 7,0 fm (átvett), kézi 5,5 m²
      for (final (name, unit, q) in [
        ('Padló', WorkUnit.m2, 3000),
        ('Lábazat', WorkUnit.fm, 7000),
        ('Kézi', WorkUnit.m2, 5500),
      ]) {
        await lines.add(
          projectId: p,
          areaId: a,
          name: name,
          unit: unit,
          quantityMilli: q,
          laborUnitPriceHuf: 1,
          materialUnitPriceHuf: 0,
        );
      }
      final r = await survey.update(area, name: 'Fürdő', lengthCm: 210, widthCm: 150, heightCm: 250);
      expect(r.updatedLines, 2);
      expect(r.manualLines, 1);
      final byName = {for (final l in await db.select(db.quoteLines).get()) l.name: l.quantityMilli};
      expect(byName['Padló'], 3150); // 2,10 × 1,50
      expect(byName['Lábazat'], 7200); // 2 × (2,10 + 1,50)
      expect(byName['Kézi'], 5500);
    });

    test('törölt projekt ajánlatszáma nem kerül újra kiosztásra', () async {
      final p1 = await newProject();
      final p2 = await newProject();
      final year = DateTime.now().year;
      expect(await projects.markQuoted(p1), 'MP-$year-001');
      expect(await projects.markQuoted(p2), 'MP-$year-002');
      await projects.delete(p2);
      final p3 = await newProject();
      expect(await projects.markQuoted(p3), 'MP-$year-003', reason: 'a 002 már kint lehet PDF-ként');
    });

    test('dashboard: pipeline a kedvezményt és az ÁFA-t is tartalmazza', () async {
      final p = await newProject();
      await lines.add(
        projectId: p,
        name: 'Munka',
        unit: WorkUnit.db,
        quantityMilli: 1000,
        laborUnitPriceHuf: 100000,
        materialUnitPriceHuf: 0,
      );
      await projects.setAdjustment(p, AdjustmentType.discount, 1000);
      final row = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      final ls = await db.select(db.quoteLines).get();
      // 100 000 − 10% = 90 000; + 27% = 114 300
      expect(totalsFor(row, ls).grossTotalHuf, 114300);
    });

    test('érvénytelen bevitel elutasítva', () async {
      final p = await newProject();
      expect(
        () => lines.add(
          projectId: p,
          name: 'Nulla',
          unit: WorkUnit.db,
          quantityMilli: 0,
          laborUnitPriceHuf: 1,
          materialUnitPriceHuf: 0,
        ),
        throwsArgumentError,
      );
      expect(() => projects.setValidityDays(p, 0), throwsArgumentError);
      expect(() => projects.setAdjustment(p, AdjustmentType.discount, 10001), throwsArgumentError);
    });
    test('projekt másolása: piszkozat, szám nélkül, helyiség-hivatkozások az új helyiségekre', () async {
      final p = await newProject();
      final a = await survey.create(projectId: p, name: 'Fürdő', lengthCm: 200, widthCm: 150);
      await lines.add(
        projectId: p,
        areaId: a,
        name: 'Csempézés',
        unit: WorkUnit.m2,
        quantityMilli: 3000,
        laborUnitPriceHuf: 8000,
        materialUnitPriceHuf: 0,
      );
      await projects.setAdjustment(p, AdjustmentType.discount, 500);
      await projects.markQuoted(p);

      final c2 = await customers.create(name: 'Nagy Anna');
      final copy = await projects.duplicate(p, customerId: c2);
      final row = await (db.select(db.projects)..where((t) => t.id.equals(copy))).getSingle();
      expect(row.status, ProjectStatus.draft);
      expect(row.quoteNumber, isNull);
      expect(row.quotedAt, isNull);
      expect(row.customerId, c2);
      expect(row.adjustmentPercentBp, 500);

      final newAreas = await (db.select(db.surveyAreas)..where((t) => t.projectId.equals(copy))).get();
      final newLines = await (db.select(db.quoteLines)..where((t) => t.projectId.equals(copy))).get();
      expect(newAreas, hasLength(1));
      expect(newLines.single.areaId, newAreas.single.id);
      expect(newLines.single.areaId, isNot(a));
      // Az eredeti érintetlen
      expect(await (db.select(db.quoteLines)..where((t) => t.projectId.equals(p))).get(), hasLength(1));
    });

    test('biztonsági mentés: oda-vissza, minden adat és összeg egyezik', () async {
      final p = await newProject();
      final a = await survey.create(projectId: p, name: 'Konyha', lengthCm: 300, widthCm: 250, heightCm: 260);
      await lines.add(
        projectId: p,
        areaId: a,
        name: 'Burkolás',
        unit: WorkUnit.m2,
        quantityMilli: 7500,
        laborUnitPriceHuf: 9000,
        materialUnitPriceHuf: 4500,
      );
      await projects.setAdjustment(p, AdjustmentType.surcharge, 750);
      await projects.markQuoted(p);
      final backup = BackupService(db);
      final json = await backup.exportJson();

      final projBefore = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      final grossBefore = totalsFor(projBefore, await db.select(db.quoteLines).get()).grossTotalHuf;

      // Egy másik (üres) adatbázisba állítjuk vissza.
      final db2 = AppDatabase(NativeDatabase.memory());
      addTearDown(db2.close);
      final b2 = BackupService(db2);
      await b2.restore(b2.parse(json));

      final proj = await (db2.select(db2.projects)..where((t) => t.id.equals(p))).getSingle();
      expect(proj.quoteNumber, projBefore.quoteNumber);
      expect(proj.adjustmentType, AdjustmentType.surcharge);
      expect(proj.status, ProjectStatus.quoted);
      expect(await db2.select(db2.surveyAreas).get(), hasLength(1));
      expect(totalsFor(proj, await db2.select(db2.quoteLines).get()).grossTotalHuf, grossBefore);
      expect((await db2.select(db2.priceItems).get()).length, (await db.select(db.priceItems).get()).length);
    });

    test('régi (v1) mentés is visszaállítható — számláló nélkül', () async {
      await newProject();
      final backup = BackupService(db);
      final m = jsonDecode(await backup.exportJson()) as Map<String, dynamic>;
      m['schemaVersion'] = 1;
      for (final row in (m['tables'] as Map<String, dynamic>)['companyProfiles'] as List) {
        (row as Map<String, dynamic>)
          ..remove('quoteSeqYear')
          ..remove('quoteSeq');
      }
      final parsed = backup.parse(jsonEncode(m));
      expect(parsed.companyProfiles.single.quoteSeq, 0);
      await backup.restore(parsed);
      expect(await db.select(db.projects).get(), hasLength(1));
    });

    test('hibás mentés visszautasítva, a meglévő adat érintetlen', () async {
      await newProject();
      final backup = BackupService(db);
      expect(() => backup.parse('nem json'), throwsA(isA<BackupFormatException>()));
      expect(() => backup.parse('{"app":"mas"}'), throwsA(isA<BackupFormatException>()));

      // Árva tétel: a projekt hiányzik a fájlból.
      final good = jsonDecode(await backup.exportJson()) as Map<String, dynamic>;
      (good['tables'] as Map<String, dynamic>)['projects'] = <Object>[];
      (good['tables'] as Map<String, dynamic>)['quoteLines'] = [
        {'id': 1, 'projectId': 999, 'priceItemId': null, 'areaId': null, 'name': 'X', 'unit': 'db',
         'quantityMilli': 1000, 'laborUnitPriceHuf': 1, 'materialUnitPriceHuf': 0, 'sortOrder': 0, 'createdAt': 0},
      ];
      expect(() => backup.parse(jsonEncode(good)), throwsA(isA<BackupFormatException>()));

      // Újabb formátum
      final newer = jsonDecode(await backup.exportJson()) as Map<String, dynamic>;
      newer['format'] = 99;
      expect(() => backup.parse(jsonEncode(newer)), throwsA(isA<BackupFormatException>()));

      expect(await db.select(db.projects).get(), hasLength(1), reason: 'a parse nem nyúl az adatbázishoz');
    });
    test('pénzügy: befizetés, kiadás, hátralék, napló → óradíj', () async {
      final p = await newProject();
      await lines.add(projectId: p, name: 'Munka', unit: WorkUnit.db, quantityMilli: 1000, laborUnitPriceHuf: 100000, materialUnitPriceHuf: 0);
      final fin = FinanceRepository(db, projects);
      final logs = WorkLogRepository(db, projects);
      await fin.addPayment(projectId: p, amountHuf: 50000, paidAt: DateTime(2026, 10, 1), method: PaymentMethod.cash);
      await fin.addExpense(projectId: p, title: 'Ragasztó', category: ExpenseCategory.material, amountHuf: 20000, spentAt: DateTime(2026, 10, 2));
      await logs.add(projectId: p, day: DateTime(2026, 10, 2), minutes: 480);
      final row = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      final gross = totalsFor(row, await db.select(db.quoteLines).get()).grossTotalHuf; // 127 000
      final f = ProjectFinance(quoteGrossHuf: gross, paidHuf: 50000, expensesHuf: 20000, workMinutes: 480);
      expect(gross, 127000);
      expect(f.outstandingHuf, 77000);
      expect(f.marginHuf, 107000);
      expect(f.marginPerHourHuf, 13375);
      expect(f.isFullyPaid, isFalse);
      expect(() => fin.addPayment(projectId: p, amountHuf: 0, paidAt: DateTime.now(), method: PaymentMethod.cash), throwsArgumentError);
      expect(() => logs.add(projectId: p, day: DateTime.now(), minutes: 25 * 60), throwsArgumentError);
      // Törléskor a projekt gyermekei is mennek
      await projects.delete(p);
      expect(await db.select(db.payments).get(), isEmpty);
      expect(await db.select(db.expenses).get(), isEmpty);
      expect(await db.select(db.workLogs).get(), isEmpty);
    });

    test('ütemezés: a befejezés nem lehet a kezdés előtt', () async {
      final p = await newProject();
      await projects.setSchedule(p, start: DateTime(2026, 10, 10, 15), end: DateTime(2026, 10, 12));
      final row = await (db.select(db.projects)..where((t) => t.id.equals(p))).getSingle();
      expect(row.startDate, DateTime(2026, 10, 10));
      expect(() => projects.setSchedule(p, start: DateTime(2026, 10, 10), end: DateTime(2026, 10, 9)), throwsArgumentError);
    });

    test('anyaglista: másolásnál átmegy, befizetés nem', () async {
      final p = await newProject();
      final mats = MaterialRepository(db, projects);
      final fin = FinanceRepository(db, projects);
      await mats.add(projectId: p, name: 'Fuga', quantityMilli: 2000, unit: 'kg');
      await fin.addPayment(projectId: p, amountHuf: 1000, paidAt: DateTime.now(), method: PaymentMethod.cash);
      final c2 = await customers.create(name: 'Más');
      final copy = await projects.duplicate(p, customerId: c2);
      expect(await (db.select(db.materialItems)..where((t) => t.projectId.equals(copy))).get(), hasLength(1));
      expect(await (db.select(db.payments)..where((t) => t.projectId.equals(copy))).get(), isEmpty);
    });

    test('biztonsági mentés v2: az új táblák is oda-vissza mennek', () async {
      final p = await newProject();
      final fin = FinanceRepository(db, projects);
      await fin.addPayment(projectId: p, amountHuf: 12345, paidAt: DateTime(2026, 10, 3), method: PaymentMethod.transfer, note: 'előleg');
      await MaterialRepository(db, projects).add(projectId: p, name: 'Csempe', quantityMilli: 12000, unit: 'doboz');
      final json = await BackupService(db).exportJson();
      final db2 = AppDatabase(NativeDatabase.memory());
      addTearDown(db2.close);
      final b2 = BackupService(db2);
      await b2.restore(b2.parse(json));
      final pay = await db2.select(db2.payments).getSingle();
      expect(pay.amountHuf, 12345);
      expect(pay.note, 'előleg');
      expect((await db2.select(db2.materialItems).getSingle()).unit, 'doboz');
    });

    test('csempekalkulátor: ráhagyás és felfelé kerekített dobozszám', () {
      // 10 m², 10% → 11 m²; 1,44 m²/doboz → 7,64 → 8 doboz
      const c = TileCalc(areaMilliM2: 10000, boxMilliM2: 1440, wasteBp: 1000);
      expect(c.neededMilliM2, 11000);
      expect(c.boxes, 8);
      expect(c.purchasedMilliM2, 11520);
      expect(const TileCalc(areaMilliM2: 0, boxMilliM2: 1440, wasteBp: 0).boxes, 0);
    });
  });
}
