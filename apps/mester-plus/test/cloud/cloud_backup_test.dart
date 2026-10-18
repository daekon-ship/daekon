import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/cloud/auto_backup.dart';
import 'package:mester_plus/cloud/backup_crypto.dart';
import 'package:mester_plus/cloud/cloud_backup_service.dart';
import 'package:mester_plus/cloud/cloud_errors.dart';
import 'package:mester_plus/data/backup.dart';
import 'package:mester_plus/data/db/app_database.dart';
import 'package:mester_plus/data/repositories.dart';
import 'package:mester_plus/domain/enums.dart';
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

final _key = List<int>.generate(32, (i) => i);

void main() {
  setUpAll(() => driftRuntimeOptions.dontWarnAboutMultipleDatabases = true);

  group('BackupCrypto (AES-256-GCM, a szerverrel azonos formátum)', () {
    test('oda-vissza; ékezetek; a fejléc "MPCB" v1 + kulcsverzió', () async {
      final plain = utf8.encode('{"app":"mester_plus","x":"Árvíztűrő tükörfúrógép"}');
      final blob = await BackupCrypto.encrypt(plain: plain, key: _key, keyVersion: 3, workspaceId: 'ws1');
      expect(ascii.decode(blob.sublist(0, 4)), 'MPCB');
      expect(blob[4], 1);
      expect(BackupCrypto.keyVersionOf(blob), 3);
      expect(utf8.decode(blob, allowMalformed: true), isNot(contains('Árvíz')), reason: 'nincs nyílt szöveg');
      expect(await BackupCrypto.decrypt(blob: blob, key: _key, workspaceId: 'ws1'), plain);
    });

    test('egy módosított bájt, más kulcs, más munkaterület → elutasítva (nincs hibás visszaállítás)', () async {
      final blob = await BackupCrypto.encrypt(plain: utf8.encode('{"a":1}'), key: _key, keyVersion: 1, workspaceId: 'ws1');
      final tampered = Uint8List.fromList(blob)..[30] ^= 1;
      await expectLater(BackupCrypto.decrypt(blob: tampered, key: _key, workspaceId: 'ws1'), throwsA(isA<BackupCryptoException>()));
      await expectLater(BackupCrypto.decrypt(blob: blob, key: List<int>.filled(32, 9), workspaceId: 'ws1'), throwsA(isA<BackupCryptoException>()));
      await expectLater(BackupCrypto.decrypt(blob: blob, key: _key, workspaceId: 'ws2'), throwsA(isA<BackupCryptoException>()));
      expect(() => BackupCrypto.keyVersionOf(utf8.encode('PK\u0003\u0004 nem mentés, de elég hosszú fájl')), throwsA(isA<BackupCryptoException>()));
    });

    test('zip-bomba: a kicsomagolás a korlátnál megáll', () {
      final bomb = gzip.encode(List<int>.filled(5 * 1024 * 1024, 0));
      expect(bomb.length, lessThan(20000));
      expect(() => BackupCrypto.gunzipLimited(bomb, 1024 * 1024), throwsA(isA<BackupCryptoException>()));
      expect(BackupCrypto.gunzipLimited(bomb, 6 * 1024 * 1024).length, 5 * 1024 * 1024);
    });
  });

  group('MESTER+ CLOUD BACKUP – teljes kliens-folyamat (álszerverrel)', skip: _skipReason(), () {
    late AppDatabase src;
    late AppDatabase dst;
    setUp(() {
      src = AppDatabase(NativeDatabase.memory());
      dst = AppDatabase(NativeDatabase.memory());
    });
    tearDown(() async {
      await src.close();
      await dst.close();
    });

    Future<void> seed(AppDatabase db) async {
      final c = await CustomerRepository(db).create(name: 'Kovács Péter', phone: '+36301234567');
      final p = await ProjectRepository(db).create(customerId: c, title: 'Fürdőszoba – Ő ű');
      await FinanceRepository(db, ProjectRepository(db)).addPayment(projectId: p, amountHuf: 150000, paidAt: DateTime(2026, 10, 1), method: PaymentMethod.cash);
    }

    test('MENTÉS → lista → letöltés → ellenőrzés → visszafejtés → visszaállítás TISZTA DB-be → az adat egyezik; előtte biztonsági másolat', () async {
      await seed(src);
      final cloud = FakeCloud();
      final (s, _) = await cloud.signedInSession();
      final up = CloudBackupService(session: s, local: BackupService(src), writeSafetyCopy: (_) async {});
      final (info, fp) = await up.backupNow();
      expect(fp, hasLength(64));
      expect(cloud.blobs.length, 1);
      expect(utf8.decode(cloud.blobs.values.first, allowMalformed: true), isNot(contains('Kovács')), reason: 'a szerverre csak titkosított blob megy');
      final list = await up.list();
      expect(list.backups.single.id, info.id);

      String? safety;
      final down = CloudBackupService(session: s, local: BackupService(dst), writeSafetyCopy: (j) async => safety = j);
      final prepared = await down.prepareRestore(list.backups.single);
      expect(prepared.parsed.customers.single.name, 'Kovács Péter');
      await down.restore(prepared);
      expect(safety, isNotNull, reason: 'visszaállítás előtt biztonsági másolat a mostani adatokról');
      final a = jsonDecode(await BackupService(src).exportJson()) as Map;
      final b = jsonDecode(await BackupService(dst).exportJson()) as Map;
      expect(b['tables'], a['tables'], reason: 'minden tábla egyezik');
    });

    test('sérült letöltés (ellenőrzőösszeg) / hibás tartalom → a helyi adat ÉRINTETLEN', () async {
      await seed(src);
      await seed(dst);
      final before = await BackupService(dst).exportJson();
      final cloud = FakeCloud();
      final (s, _) = await cloud.signedInSession();
      await CloudBackupService(session: s, local: BackupService(src), writeSafetyCopy: (_) async {}).backupNow();
      final svc = CloudBackupService(session: s, local: BackupService(dst), writeSafetyCopy: (_) async {});
      final info = (await svc.list()).backups.single;
      cloud.corruptDownload = (b) => Uint8List.fromList(b)..[b.length - 3] ^= 0xff;
      await expectLater(svc.prepareRestore(info), throwsA(isA<BackupFormatException>()));
      expect(await BackupService(dst).exportJson(), isNot(equals('')));
      expect(_tables(await BackupService(dst).exportJson()), _tables(before), reason: 'nem változott');
    });

    test('helyesen titkosított, de ÉRVÉNYTELEN mentés-tartalom → a meglévő ellenőrzés megfogja, nincs csere', () async {
      await seed(dst);
      final before = await BackupService(dst).exportJson();
      final cloud = FakeCloud();
      final (s, _) = await cloud.signedInSession();
      final blob = await BackupCrypto.encrypt(plain: utf8.encode('{"app":"mester_plus","format":2,"schemaVersion":3,"tables":{"customers":[{"id":1}]}}'),
          key: cloud.bk, keyVersion: 1, workspaceId: FakeCloud.ws);
      cloud.backups['b00000000000000000000000x1'] = {'id': 'b00000000000000000000000x1', 'status': 'READY', 'size_bytes': blob.length,
        'sha256': _sha(blob), 'app_version': '0.8.0', 'key_version': 1, 'created_at': '2026-10-18T10:00:00Z'};
      cloud.blobs['b00000000000000000000000x1'] = blob;
      final svc = CloudBackupService(session: s, local: BackupService(dst), writeSafetyCopy: (_) async {});
      final info = (await svc.list()).backups.single;
      await expectLater(svc.prepareRestore(info), throwsA(isA<BackupFormatException>()));
      expect(_tables(await BackupService(dst).exportJson()), _tables(before));
    });

    test('nincs Pro → PRO_REQUIRED, offline → érthető hiba; a helyi app érintetlen', () async {
      final cloud = FakeCloud(pro: false);
      final (s, _) = await cloud.signedInSession();
      final svc = CloudBackupService(session: s, local: BackupService(src), writeSafetyCopy: (_) async {});
      await expectLater(svc.backupNow(), throwsA(isA<CloudException>().having((e) => e.kind, 'kind', CloudErrorKind.notPro)));
      cloud.pro = true;
      cloud.offline = true;
      await expectLater(svc.backupNow(), throwsA(isA<CloudException>().having((e) => e.message, 'msg', contains('Nincs internetkapcsolat'))));
    });

    test('AUTOMATIKUS MENTÉS: első alkalommal fut; 24 órán belül nem; változatlan adatnál nem tölt fel; hibánál exponenciális várakozás', () async {
      await seed(src);
      final cloud = FakeCloud();
      final (s, kv) = await cloud.signedInSession();
      var now = DateTime(2026, 10, 18, 8);
      final auto = AutoBackup(session: s, service: CloudBackupService(session: s, local: BackupService(src), writeSafetyCopy: (_) async {}),
          local: BackupService(src), store: kv, clock: () => now);
      expect(await auto.maybeRun(), isTrue);
      expect(cloud.blobs.length, 1);
      now = now.add(const Duration(hours: 5));
      expect(await auto.maybeRun(), isFalse, reason: '24 órán belül nem');
      now = now.add(const Duration(hours: 20));
      expect(await auto.maybeRun(), isFalse, reason: 'nem változott semmi → nincs feltöltés');
      expect(cloud.blobs.length, 1);
      await CustomerRepository(src).create(name: 'Új ügyfél');
      now = now.add(const Duration(hours: 25));
      cloud.offline = true;
      expect(await auto.maybeRun(), isFalse);
      expect(auto.state.failures, 1);
      expect(auto.state.nextAttemptAt, now.add(const Duration(minutes: 15)));
      now = now.add(const Duration(minutes: 16));
      expect(await auto.maybeRun(), isFalse);
      expect(auto.state.nextAttemptAt, now.add(const Duration(minutes: 30)), reason: '15 → 30 perc');
      cloud.offline = false;
      now = now.add(const Duration(minutes: 31));
      expect(await auto.maybeRun(), isTrue);
      expect(auto.state.failures, 0);
      expect(cloud.blobs.length, 2);
      expect(AutoBackup.backoff(20), const Duration(hours: 24), reason: 'legfeljebb naponta');
    });
  });
}

String _sha(List<int> b) => sha256.convert(b).toString();
Object _tables(String json) => (jsonDecode(json) as Map)['tables'] as Object;
