import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/sqlite3.dart' as sql;

import '../../security/db_key_store.dart';

/// Titkosított (SQLCipher) adatbázis megnyitása a készüléken.
///
/// - A kulcs a [DatabaseKeyStore]-ból jön (Android Keystore által védett tároló).
/// - Egy korábbi, titkosítatlan `mester_plus.sqlite` fájlt az első megnyitáskor
///   átköltöztet a titkosított `mester_plus.enc.sqlite` fájlba, és a régit
///   biztonságosan felülírva törli.
/// - A SQLCipher nem tárolja a kulcsot; rossz kulccsal a fájl olvashatatlan.
const String encryptedDbName = 'mester_plus.enc';
const String _legacyFileName = 'mester_plus.sqlite';

/// A `PRAGMA key` értéke „raw key” formában: 32 bájt hexben, idézőjelben.
String rawKeyPragma(String hex) => "PRAGMA key = \"x'$hex'\"";

Future<DatabaseConnection> openEncryptedDatabase(DatabaseKeyStore keys) async {
  final hex = await keys.getOrCreateHex();
  final dir = await getApplicationDocumentsDirectory();
  await _migrateLegacyPlaintext(dir, hex);
  return driftDatabase(
    name: encryptedDbName,
    native: DriftNativeOptions(
      shareAcrossIsolates: true,
      setup: (db) {
        db.execute(rawKeyPragma(hex));
        // A memóriában lévő kulcs- és oldalpuffereket használat után nullázza.
        db.execute('PRAGMA cipher_memory_security = ON');
        // Gyors ellenőrzés: rossz kulccsal itt dob hibát, nem később, félúton.
        db.execute('SELECT count(*) FROM sqlite_master');
      },
    ),
  );
}

/// Ha van régi, titkosítatlan adatbázis és még nincs titkosított, átmásolja a
/// tartalmát a SQLCipher hivatalos `sqlcipher_export` eljárásával.
Future<void> _migrateLegacyPlaintext(Directory dir, String hex) async {
  final legacy = File(p.join(dir.path, _legacyFileName));
  final target = File(p.join(dir.path, '$encryptedDbName.sqlite'));
  if (!legacy.existsSync() || target.existsSync()) return;

  // Csak akkor nyúlunk hozzá, ha valóban titkosítatlan SQLite fájl.
  final raf = legacy.openSync();
  final head = raf.readSync(16);
  raf.closeSync();
  if (String.fromCharCodes(head) != 'SQLite format 3\u0000') return;

  final tmp = File('${target.path}.migrating');
  if (tmp.existsSync()) tmp.deleteSync();
  final db = sql.sqlite3.open(legacy.path);
  try {
    final escapedPath = tmp.path.replaceAll("'", "''");
    db.execute("ATTACH DATABASE '$escapedPath' AS encrypted KEY \"x'$hex'\"");
    db.execute("SELECT sqlcipher_export('encrypted')");
    db.execute('DETACH DATABASE encrypted');
  } finally {
    db.close();
  }
  tmp.renameSync(target.path);

  // A régi, nyílt fájl felülírása nullákkal, majd törlése (a journal/wal fájlokkal).
  for (final f in [legacy, File('${legacy.path}-journal'), File('${legacy.path}-wal'), File('${legacy.path}-shm')]) {
    if (!f.existsSync()) continue;
    final len = f.lengthSync();
    final out = f.openSync(mode: FileMode.writeOnly);
    const chunk = 1 << 16;
    final zeros = List<int>.filled(chunk, 0);
    var written = 0;
    while (written < len) {
      final n = (len - written) < chunk ? (len - written) : chunk;
      out.writeFromSync(zeros, 0, n);
      written += n;
    }
    out.flushSync();
    out.closeSync();
    f.deleteSync();
  }
}
