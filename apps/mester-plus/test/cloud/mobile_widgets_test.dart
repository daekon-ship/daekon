import 'package:drift/drift.dart' show Value, driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/cloud/cloud_providers.dart';
import 'package:mester_plus/cloud/cloud_session.dart';
import 'package:mester_plus/cloud/secure_kv.dart';
import 'package:mester_plus/core/theme/app_theme.dart';
import 'package:mester_plus/data/db/app_database.dart';
import 'package:mester_plus/data/providers.dart';
import 'package:mester_plus/data/repositories.dart';
import 'package:mester_plus/domain/enums.dart';
import 'package:mester_plus/features/cloud/account_screen.dart';
import 'package:mester_plus/features/cloud/cloud_backups_screen.dart';
import 'package:mester_plus/features/cloud/devices_screen.dart';
import 'package:mester_plus/features/projects/quote_preview_screen.dart';
import 'package:mester_plus/features/settings/settings_screen.dart';
import 'package:sqlite3/sqlite3.dart';

import 'fake_cloud.dart';

Object _skipReason() {
  try {
    sqlite3.openInMemory().close();
    return false;
  } catch (_) {
    return 'Natív SQLite nem érhető el – widget-tesztek kihagyva.';
  }
}

/// MOBIL QA: minden új felhős képernyő 360 / 390 / 412 / 430 dp szélességen, normál és 1,3× betűmérettel.
/// A Flutter tesztben minden túlcsordulás (levágott gomb, kilógó sor) hibaként buktatja a tesztet.
const widths = [360.0, 390.0, 412.0, 430.0];

Future<void> pumpAt(WidgetTester tester, double width, Widget child, List<Override> overrides, {double textScale = 1.0}) async {
  tester.view.devicePixelRatio = 2.0;
  tester.view.physicalSize = Size(width * 2, 2600 * 2);
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      theme: MpTheme.light(),
      builder: (context, c) => MediaQuery(data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(textScale)), child: c!),
      home: child,
    ),
  ));
  for (var i = 0; i < 8; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

/// A Drift-folyamok lezárása a teszt végén (különben „Timer is still pending”).
Future<void> unmount(WidgetTester t) async {
  await t.pumpWidget(const SizedBox.shrink());
  await t.pump(const Duration(seconds: 1));
}

void main() {
  setUpAll(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  group('Mobil QA – felhős képernyők', skip: _skipReason(), () {
    late AppDatabase db;
    setUp(() => db = AppDatabase(NativeDatabase.memory()));
    tearDown(() => db.close());

    Future<List<Override>> overrides(FakeCloud cloud, {bool signedIn = true}) async {
      final kv = MemoryKeyValueStore();
      final CloudSession s;
      if (signedIn) {
        (s, _) = await cloud.signedInSession();
      } else {
        s = cloud.session(kv);
      }
      return [
        databaseProvider.overrideWithValue(db),
        cloudStoreProvider.overrideWithValue(kv),
        cloudSessionProvider.overrideWith((ref) => s),
      ];
    }

    for (final w in widths) {
      for (final scale in [1.0, 1.3]) {
        testWidgets('Beállítások – fiók nélkül (Folytatás fiók nélkül), ${w.toInt()} dp, ${scale}x', (t) async {
          await pumpAt(t, w, const SettingsScreen(), await t.runAsync(() => overrides(FakeCloud(), signedIn: false)) ?? [], textScale: scale);
          expect(find.text('Fiók nélkül használod'), findsOneWidget);
          expect(find.text('Felhőmentés – Mester+ Pro'), findsOneWidget);
          expect(find.text('Hamarosan'), findsWidgets);
          expect(find.text('Mentés készítése'), findsOneWidget, reason: 'a helyi mentés fiók nélkül is ott van');
          await unmount(t);
        });

        testWidgets('Beállítások – Pro fiók, FELHŐMENTÉS kártya, ${w.toInt()} dp, ${scale}x', (t) async {
          await pumpAt(t, w, const SettingsScreen(), await t.runAsync(() => overrides(FakeCloud())) ?? [], textScale: scale);
          expect(find.text('Mentés most'), findsOneWidget);
          expect(find.text('Felhőmentések és visszaállítás'), findsOneWidget);
          expect(find.text('Eszközeim'), findsOneWidget);
          expect(find.text('Fiók törlése'), findsOneWidget);
          expect(find.text('Még nincs felhőmentés'), findsOneWidget);
          await unmount(t);
        });
      }

      testWidgets('Fiók képernyő (belépés / regisztráció), ${w.toInt()} dp', (t) async {
        await pumpAt(t, w, const AccountScreen(), await t.runAsync(() => overrides(FakeCloud(), signedIn: false)) ?? []);
        expect(find.text('Folytatás fiók nélkül'), findsOneWidget);
        await t.tap(find.text('Új fiók'));
        await t.pump();
        expect(find.text('Jelszó még egyszer'), findsOneWidget);
        await t.tap(find.text('Fiók létrehozása'));
        await t.pump();
        expect(find.text('Érvénytelen e-mail cím'), findsOneWidget, reason: 'üres űrlap: helyben ellenőrzött, nincs hálózati hívás');
        await unmount(t);
      });

      testWidgets('Eszközeim, ${w.toInt()} dp', (t) async {
        await pumpAt(t, w, const DevicesScreen(), await t.runAsync(() => overrides(FakeCloud())) ?? []);
        await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
        await t.pump();
        expect(find.textContaining('(ez a telefon)'), findsOneWidget);
        expect(find.text('Visszavonás'), findsOneWidget);
        await unmount(t);
      });

      testWidgets('Felhőmentések lista, ${w.toInt()} dp', (t) async {
        final cloud = FakeCloud();
        final ov = await t.runAsync(() => overrides(cloud)) ?? [];
        cloud.backups['b0000000000000000000000001'] = {'id': 'b0000000000000000000000001', 'status': 'READY', 'size_bytes': 48211,
          'sha256': 'x', 'app_version': '0.8.0', 'key_version': 1, 'created_at': '2026-10-18T08:30:00Z', 'device': {'name': 'Samsung Galaxy A54 – műhely'}};
        await pumpAt(t, w, const CloudBackupsScreen(), ov);
        await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
        await t.pump();
        expect(find.text('Visszaállítás'), findsOneWidget);
        expect(find.textContaining('Samsung Galaxy A54'), findsOneWidget);
        await unmount(t);
      });

      testWidgets('Felhőmentések – nincs internet: érthető üzenet, nincs összeomlás, ${w.toInt()} dp', (t) async {
        final cloud = FakeCloud();
        final ov = await t.runAsync(() => overrides(cloud)) ?? [];
        cloud.offline = true;
        await pumpAt(t, w, const CloudBackupsScreen(), ov);
        await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
        await t.pump();
        expect(find.textContaining('Nincs internetkapcsolat'), findsOneWidget);
        expect(find.textContaining('SocketException'), findsNothing);
        await unmount(t);
      });

      testWidgets('Ajánlat-előnézet ONLINE AJÁNLAT kártyával (Pro), ${w.toInt()} dp', (t) async {
        final ov = await t.runAsync(() => overrides(FakeCloud())) ?? [];
        final id = await t.runAsync(() async {
          final projects = ProjectRepository(db);
          final c = await CustomerRepository(db).create(name: 'Nagy Ödönné Kiss Erzsébet', phone: '+36301112222');
          final p = await projects.create(customerId: c, title: 'Fürdőszoba és konyha teljes felújítása', siteAddress: 'Hódmezővásárhely');
          await QuoteLineRepository(db, projects, PriceListRepository(db)).add(projectId: p, name: 'Nagylapos burkolás (60×120 felett)', unit: WorkUnit.m2,
              quantityMilli: 23500, laborUnitPriceHuf: 9800, materialUnitPriceHuf: 4200);
          await CompanyRepository(db).save(const CompanyProfilesCompanion(companyName: Value('Kőműves és Burkoló Kft.')));
          await projects.markQuoted(p);
          return p;
        });
        await pumpAt(t, w, QuotePreviewScreen(projectId: id!), ov);
        await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 80)));
        await t.pump();
        expect(find.text('Online ajánlat'), findsOneWidget);
        expect(find.text('Nem küldött'), findsOneWidget);
        expect(find.text('Online ajánlat küldése'), findsOneWidget);
        await unmount(t);
      });
    }
  });
}
