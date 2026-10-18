import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Kulcs–érték tároló a felhős állapothoz (tokenek, eszköz-azonosító, jogosultság-gyorstár).
/// Éles: Android Keystore által védett `flutter_secure_storage`; tesztben memória.
abstract class KeyValueStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class SecureKeyValueStore implements KeyValueStore {
  SecureKeyValueStore([FlutterSecureStorage? storage])
      : _s = storage ?? const FlutterSecureStorage(aOptions: AndroidOptions(resetOnError: false));
  final FlutterSecureStorage _s;

  @override
  Future<String?> read(String key) => _s.read(key: key);
  @override
  Future<void> write(String key, String value) => _s.write(key: key, value: value);
  @override
  Future<void> delete(String key) => _s.delete(key: key);
}

class MemoryKeyValueStore implements KeyValueStore {
  final Map<String, String> data = {};
  @override
  Future<String?> read(String key) async => data[key];
  @override
  Future<void> write(String key, String value) async => data[key] = value;
  @override
  Future<void> delete(String key) async => data.remove(key);
}

/// A tárolt kulcsok nevei – egy helyen.
abstract final class CloudKeys {
  static const accessToken = 'mester_plus.cloud.access.v1';
  static const accessExpires = 'mester_plus.cloud.access_exp.v1';
  static const refreshToken = 'mester_plus.cloud.refresh.v1';
  static const deviceUuid = 'mester_plus.cloud.device_uuid.v1';
  static const account = 'mester_plus.cloud.account.v1';
  static const entitlements = 'mester_plus.cloud.entitlements.v1';
  static const backupState = 'mester_plus.cloud.backup_state.v1';
  static const quoteLinks = 'mester_plus.cloud.quote_links.v1';
}
