import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Az adatbázis titkosító kulcsa. 32 bájt, kriptográfiai véletlenből, az első
/// indításkor készül, és a rendszer biztonságos tárolójában van (Androidon az
/// Android Keystore által védett, az app aláírásához kötött tároló).
///
/// A kulcs SOHA nem kerül a biztonsági mentésbe, naplóba vagy a képernyőre.
/// Ha a tároló nem elérhető, az app nem nyit titkosítatlan adatbázist,
/// hanem hibát jelez.
class DatabaseKeyStore {
  DatabaseKeyStore([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(resetOnError: false),
            );

  final FlutterSecureStorage _storage;

  static const String _key = 'mester_plus.db_key.v1';

  /// A kulcs 64 hexadecimális karakterként (SQLCipher „raw key” formátum).
  Future<String> getOrCreateHex() async {
    final existing = await _storage.read(key: _key);
    if (existing != null && _isValid(existing)) return existing;
    if (existing != null) {
      throw StateError('Sérült adatbázis-kulcs a biztonságos tárolóban.');
    }
    final hex = generateHex();
    await _storage.write(key: _key, value: hex);
    // Visszaolvasás: csak akkor használjuk, ha biztosan el is mentődött.
    final check = await _storage.read(key: _key);
    if (check != hex) throw StateError('A biztonságos tároló nem őrizte meg a kulcsot.');
    return hex;
  }

  static bool _isValid(String s) => RegExp(r'^[0-9a-f]{64}$').hasMatch(s);

  /// 32 bájt kriptográfiai véletlen, hex kódolva.
  static String generateHex([Random? random]) {
    final r = random ?? Random.secure();
    final b = StringBuffer();
    for (var i = 0; i < 32; i++) {
      b.write(r.nextInt(256).toRadixString(16).padLeft(2, '0'));
    }
    return b.toString();
  }
}
