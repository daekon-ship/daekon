import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// PIN-zár. A PIN-t nem tároljuk: csak egy sózott, lassított kivonatát
/// (PBKDF2-HMAC-SHA256, 60 000 kör), a biztonságos tárolóban.
///
/// Elfelejtett PIN esetén nincs „visszaállítás”: az app újratelepítésével
/// (és a biztonsági mentés visszatöltésével) lehet továbblépni. Ez szándékos:
/// a telefonhoz hozzáférő idegen se tudja megkerülni.
class PinLock {
  PinLock([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage(aOptions: AndroidOptions(resetOnError: false));

  final FlutterSecureStorage _storage;

  static const String _hashKey = 'mester_plus.pin.hash.v1';
  static const String _saltKey = 'mester_plus.pin.salt.v1';
  static const int iterations = 60000;
  static const int minLength = 4;
  static const int maxLength = 8;

  /// Ennyi hibás próbálkozás után ennyi másodpercet várni kell (növekvő).
  static int lockoutSeconds(int failedAttempts) {
    if (failedAttempts < 5) return 0;
    return min(300, 10 << (failedAttempts - 5)); // 10, 20, 40, 80, 160, 300…
  }

  static bool isValidPin(String pin) => RegExp('^[0-9]{$minLength,$maxLength}\$').hasMatch(pin);

  Future<bool> isEnabled() async => (await _storage.read(key: _hashKey)) != null;

  Future<void> setPin(String pin) async {
    if (!isValidPin(pin)) throw ArgumentError('A PIN $minLength–$maxLength számjegy legyen.');
    final salt = _randomSalt();
    final hash = derive(pin, salt);
    await _storage.write(key: _saltKey, value: base64Encode(salt));
    await _storage.write(key: _hashKey, value: base64Encode(hash));
  }

  Future<void> clear() async {
    await _storage.delete(key: _hashKey);
    await _storage.delete(key: _saltKey);
  }

  Future<bool> verify(String pin) async {
    final hashB64 = await _storage.read(key: _hashKey);
    final saltB64 = await _storage.read(key: _saltKey);
    if (hashB64 == null || saltB64 == null) return false;
    if (!isValidPin(pin)) return false;
    final expected = base64Decode(hashB64);
    final actual = derive(pin, base64Decode(saltB64));
    return constantTimeEquals(expected, actual);
  }

  static Uint8List _randomSalt() {
    final r = Random.secure();
    return Uint8List.fromList(List<int>.generate(16, (_) => r.nextInt(256)));
  }

  /// PBKDF2-HMAC-SHA256, 32 bájtos kimenet (egy blokk).
  static Uint8List derive(String pin, List<int> salt, {int rounds = iterations}) {
    final mac = Hmac(sha256, utf8.encode(pin));
    var u = Uint8List.fromList(mac.convert([...salt, 0, 0, 0, 1]).bytes);
    final out = Uint8List.fromList(u);
    for (var i = 1; i < rounds; i++) {
      u = Uint8List.fromList(mac.convert(u).bytes);
      for (var j = 0; j < out.length; j++) {
        out[j] ^= u[j];
      }
    }
    return out;
  }

  /// Időzítés-független összehasonlítás.
  static bool constantTimeEquals(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff == 0;
  }
}
