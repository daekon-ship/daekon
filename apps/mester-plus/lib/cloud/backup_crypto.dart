import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

/// Felhőmentés titkosítása a TELEFONON (a szerver soha nem lát nyílt mentést).
///
/// Formátum v1 (a szerver `Backups.php`-val azonos):
///   "MPCB" | formátum (1 bájt = 1) | kulcsverzió (uint32 BE) | nonce (12 bájt) | AES-256-GCM titkosított adat | tag (16)
/// Titkosított adat = gzip(a meglévő JSON-mentés). AAD = a 21 bájtos fejléc + a munkaterület azonosítója,
/// így egy mentés nem csempészhető át másik fiókba, és a fejléc sem módosítható észrevétlenül.
/// Kriptográfia: a `cryptography` csomag hitelesített titkosítása (saját algoritmus nincs).
abstract final class BackupCrypto {
  static const magic = 'MPCB';
  static const formatVersion = 1;
  static const headerLength = 21;

  /// Kicsomagolási korlát (zip-bomba ellen). A helyi mentés is legfeljebb 50 MB lehet.
  static const maxPlainBytes = 100 * 1024 * 1024;

  static final AesGcm _aes = AesGcm.with256bits();

  static Future<Uint8List> encrypt({required List<int> plain, required List<int> key, required int keyVersion, required String workspaceId}) async {
    if (key.length != 32) throw ArgumentError('A mentési kulcs 32 bájt kell legyen.');
    final nonce = _aes.newNonce();
    final header = BytesBuilder()
      ..add(ascii.encode(magic))
      ..addByte(formatVersion)
      ..add((ByteData(4)..setUint32(0, keyVersion)).buffer.asUint8List())
      ..add(nonce);
    final head = header.toBytes();
    final box = await _aes.encrypt(gzip.encode(plain), secretKey: SecretKey(key), nonce: nonce, aad: [...head, ...utf8.encode(workspaceId)]);
    return (BytesBuilder()
          ..add(head)
          ..add(box.cipherText)
          ..add(box.mac.bytes))
        .toBytes();
  }

  /// A fejlécben lévő kulcsverzió (a megfelelő kulcs lekéréséhez). Hibás fájlnál [BackupCryptoException].
  static int keyVersionOf(List<int> blob) {
    _checkHeader(blob);
    return ByteData.sublistView(Uint8List.fromList(blob.sublist(5, 9))).getUint32(0);
  }

  static void _checkHeader(List<int> blob) {
    if (blob.length < headerLength + 16 || ascii.decode(blob.sublist(0, 4), allowInvalid: true) != magic || blob[4] != formatVersion) {
      throw const BackupCryptoException('Ez nem Mester+ felhőmentés, vagy sérült.');
    }
  }

  /// Visszafejtés + ellenőrzés + korlátozott kicsomagolás. Bármilyen eltérés (más kulcs, más fiók,
  /// egyetlen módosított bájt) → [BackupCryptoException]; a helyi adatbázishoz ilyenkor nem nyúlunk.
  static Future<Uint8List> decrypt({required List<int> blob, required List<int> key, required String workspaceId}) async {
    _checkHeader(blob);
    final head = blob.sublist(0, headerLength);
    final nonce = blob.sublist(9, headerLength);
    final box = SecretBox(blob.sublist(headerLength, blob.length - 16), nonce: nonce, mac: Mac(blob.sublist(blob.length - 16)));
    List<int> packed;
    try {
      packed = await _aes.decrypt(box, secretKey: SecretKey(key), aad: [...head, ...utf8.encode(workspaceId)]);
    } on SecretBoxAuthenticationError {
      throw const BackupCryptoException('A felhőmentés sérült vagy nem ehhez a fiókhoz tartozik.');
    }
    return gunzipLimited(packed, maxPlainBytes);
  }

  /// gzip kicsomagolás méretkorláttal (zip-bomba ellen): a korlát felett megáll, nem fogy el a memória.
  static Uint8List gunzipLimited(List<int> packed, int limit) {
    final out = _LimitedSink(limit);
    try {
      final conv = gzip.decoder.startChunkedConversion(out);
      const step = 64 * 1024;
      for (var i = 0; i < packed.length; i += step) {
        conv.add(packed.sublist(i, i + step > packed.length ? packed.length : i + step));
      }
      conv.close();
    } on BackupCryptoException {
      rethrow;
    } catch (_) {
      throw const BackupCryptoException('A felhőmentés sérült (kicsomagolás).');
    }
    return out.builder.toBytes();
  }
}

class _LimitedSink implements Sink<List<int>> {
  _LimitedSink(this.limit);
  final int limit;
  final BytesBuilder builder = BytesBuilder(copy: false);

  @override
  void add(List<int> data) {
    if (builder.length + data.length > limit) {
      throw const BackupCryptoException('A felhőmentés túl nagy vagy sérült.');
    }
    builder.add(data);
  }

  @override
  void close() {}
}

class BackupCryptoException implements Exception {
  const BackupCryptoException(this.message);
  final String message;
  @override
  String toString() => message;
}
