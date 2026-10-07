import 'dart:convert';
import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/data/db/encrypted_open.dart';
import 'package:mester_plus/features/projects/quote_pdf.dart';
import 'package:mester_plus/security/db_key_store.dart';
import 'package:mester_plus/security/pin_lock.dart';
import 'package:mester_plus/data/backup.dart';
import 'package:mester_plus/data/db/app_database.dart';
import 'package:drift/native.dart';
import 'package:mester_plus/data/repositories.dart';
import 'package:mester_plus/domain/enums.dart';

/// Memória-tároló a tesztekhez (a valódi az Android Keystore-t használja).
class _MemStorage extends Fake implements FlutterSecureStorage {
  final Map<String, String> _m = {};
  @override
  Future<String?> read({required String key, IOSOptions? iOptions, AndroidOptions? aOptions, LinuxOptions? lOptions,
      WebOptions? webOptions, MacOsOptions? mOptions, WindowsOptions? wOptions}) async => _m[key];
  @override
  Future<void> write({required String key, required String? value, IOSOptions? iOptions, AndroidOptions? aOptions,
      LinuxOptions? lOptions, WebOptions? webOptions, MacOsOptions? mOptions, WindowsOptions? wOptions}) async {
    if (value == null) _m.remove(key); else _m[key] = value;
  }
  @override
  Future<void> delete({required String key, IOSOptions? iOptions, AndroidOptions? aOptions, LinuxOptions? lOptions,
      WebOptions? webOptions, MacOsOptions? mOptions, WindowsOptions? wOptions}) async => _m.remove(key);
}

void main() {
  group('Adatbázis-kulcs', () {
    test('64 hex, kriptográfiai véletlen, egyszer készül és megmarad', () async {
      final store = DatabaseKeyStore(_MemStorage());
      final k1 = await store.getOrCreateHex();
      final k2 = await store.getOrCreateHex();
      expect(k1, matches(RegExp(r'^[0-9a-f]{64}$')));
      expect(k2, k1);
      expect(DatabaseKeyStore.generateHex(), isNot(DatabaseKeyStore.generateHex()));
    });

    test('a kulcs a PRAGMA-ban nem kerülhet SQL-injekció alá (csak hex)', () {
      final hex = DatabaseKeyStore.generateHex(Random(1));
      final pragma = rawKeyPragma(hex);
      expect(pragma, "PRAGMA key = \"x'$hex'\"");
      expect(RegExp(r"^PRAGMA key = \"x'[0-9a-f]{64}'\"$").hasMatch(pragma), isTrue);
    });

    test('sérült tárolt kulcsnál hibát jelez, nem generál újat csendben', () async {
      final mem = _MemStorage();
      await mem.write(key: 'mester_plus.db_key.v1', value: 'nem-hex');
      expect(() => DatabaseKeyStore(mem).getOrCreateHex(), throwsStateError);
    });
  });

  group('PIN-zár', () {
    test('helyes PIN átmegy, hibás nem, a PIN nincs tárolva nyíltan', () async {
      final mem = _MemStorage();
      final lock = PinLock(mem);
      expect(await lock.isEnabled(), isFalse);
      await lock.setPin('2468');
      expect(await lock.isEnabled(), isTrue);
      expect(await lock.verify('2468'), isTrue);
      expect(await lock.verify('2469'), isFalse);
      expect(await lock.verify(''), isFalse);
      expect(await lock.verify('abcd'), isFalse);
      expect(mem._m.values.any((v) => v.contains('2468')), isFalse, reason: 'csak sózott kivonat tárolódik');
      await lock.clear();
      expect(await lock.isEnabled(), isFalse);
      expect(await lock.verify('2468'), isFalse);
    });

    test('ugyanaz a PIN más sóval más kivonatot ad', () {
      final a = PinLock.derive('1234', [1, 2, 3, 4], rounds: 100);
      final b = PinLock.derive('1234', [9, 9, 9, 9], rounds: 100);
      final c = PinLock.derive('1234', [1, 2, 3, 4], rounds: 100);
      expect(a, isNot(b));
      expect(a, c);
      expect(a.length, 32);
    });

    test('PBKDF2 ismert vektor (RFC 6070 jellegű, SHA-256): password/salt, 1 kör', () {
      // PBKDF2-HMAC-SHA256("password", "salt", c=1, dkLen=32)
      final out = PinLock.derive('password', utf8.encode('salt'), rounds: 1);
      final hex = out.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
      expect(hex, '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
    });

    test('hibás próbálkozások után növekvő várakozás', () {
      expect(PinLock.lockoutSeconds(4), 0);
      expect(PinLock.lockoutSeconds(5), 10);
      expect(PinLock.lockoutSeconds(6), 20);
      expect(PinLock.lockoutSeconds(10), 300);
      expect(PinLock.lockoutSeconds(50), 300);
    });

    test('PIN szabály: 4–8 számjegy', () {
      expect(PinLock.isValidPin('1234'), isTrue);
      expect(PinLock.isValidPin('12345678'), isTrue);
      expect(PinLock.isValidPin('123'), isFalse);
      expect(PinLock.isValidPin('123456789'), isFalse);
      expect(PinLock.isValidPin('12a4'), isFalse);
    });
  });

  group('Mentési fájl ellenőrzése (fuzz)', () {
    test('500 véletlenül megrongált mentés: csak BackupFormatException, az adatbázis érintetlen', () async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final customers = CustomerRepository(db);
      final projects = ProjectRepository(db);
      final c = await customers.create(name: 'Teszt Elek');
      await projects.create(customerId: c, title: 'Munka');
      final backup = BackupService(db);
      final good = await backup.exportJson();
      final rnd = Random(42);
      final junk = ['', '[]', '{}', 'null', '"x"', '{"app":"mester_plus"}', '{"app":"mester_plus","format":1,"schemaVersion":3,"tables":[]}'];
      var rejected = 0;
      for (var i = 0; i < 500; i++) {
        String bad;
        if (i < junk.length) {
          bad = junk[i];
        } else {
          final chars = good.split('');
          final kind = rnd.nextInt(3);
          final at = rnd.nextInt(chars.length);
          if (kind == 0) chars.removeAt(at);
          if (kind == 1) chars.insert(at, '"{}[],:0'[rnd.nextInt(8)]);
          if (kind == 2) chars[at] = '"{}[],:0x-'[rnd.nextInt(10)];
          bad = chars.join();
        }
        try {
          final parsed = backup.parse(bad);
          // Ha mégis átment, legalább belsőleg konzisztens legyen.
          expect(parsed.projects.every((p) => parsed.customers.any((cu) => cu.id == p.customerId)), isTrue);
        } on BackupFormatException {
          rejected++;
        }
      }
      expect(rejected, greaterThan(400));
      expect(await db.select(db.projects).get(), hasLength(1));
      expect(await db.select(db.customers).get(), hasLength(1));
    });

    test('túl nagy számok és negatív összegek elutasítva', () async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final c = await CustomerRepository(db).create(name: 'x');
      final pid = await ProjectRepository(db).create(customerId: c, title: 'x');
      final backup = BackupService(db);
      final m = jsonDecode(await backup.exportJson()) as Map<String, dynamic>;
      (m['tables'] as Map<String, dynamic>)['payments'] = [
        {'id': 1, 'projectId': pid, 'amountHuf': -5, 'paidAt': 0, 'method': 'cash', 'note': null, 'createdAt': 0},
      ];
      expect(() => backup.parse(jsonEncode(m)), throwsA(isA<BackupFormatException>()));
      (m['tables'] as Map<String, dynamic>)['payments'] = [
        {'id': 1, 'projectId': pid, 'amountHuf': 1000000000000, 'paidAt': 0, 'method': 'cash', 'note': null, 'createdAt': 0},
      ];
      expect(() => backup.parse(jsonEncode(m)), throwsA(isA<BackupFormatException>()));
    });
  });

  group('PDF fájlnév', () {
    test('nem tartalmazhat útvonalat vagy veszélyes karaktert', () async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final c = await CustomerRepository(db).create(name: 'x');
      final pr = ProjectRepository(db);
      final id = await pr.create(customerId: c, title: '../../etc/passwd; rm -rf / "<>|?*');
      final p = await (db.select(db.projects)..where((t) => t.id.equals(id))).getSingle();
      final name = QuotePdf.fileName(p);
      expect(name, matches(RegExp(r'^Arajanlat_[A-Za-z0-9\-_]+\.pdf$')));
      expect(name.contains('/'), isFalse);
      expect(name.contains('..'), isFalse);
      expect(name.length, lessThan(80));
    });
  });

  group('Projekt státusz logika', () {
    test('isWon / isPipeline / isActive diszjunkt és teljes', () {
      for (final s in ProjectStatus.values) {
        expect(s.isWon && s.isPipeline, isFalse);
      }
      expect(ProjectStatus.values.where((s) => s.isWon).length, 3);
      expect(ProjectStatus.values.where((s) => s.isPipeline).length, 2);
    });
  });
}
