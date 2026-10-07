/// Pénzügyi alapműveletek. Minden összeg egész forint (int).
///
/// Az egyetlen kerekítési szabály: fél-felfelé (half-up), negatív számnál
/// szimmetrikusan, a nullától távolodva (-2,5 → -3). Így egy kedvezmény
/// abszolút értéke ugyanúgy kerekül, mint egy feláré.
library;

import 'errors.dart';

/// `numerator / denominator` egészre kerekítve, half-up.
/// [denominator] csak pozitív lehet.
int divRoundHalfUp(int numerator, int denominator) {
  if (denominator <= 0) {
    throw ArgumentError.value(denominator, 'denominator', 'must be > 0');
  }
  if (numerator >= 0) {
    return (numerator * 2 + denominator) ~/ (denominator * 2);
  }
  return -((-numerator * 2 + denominator) ~/ (denominator * 2));
}

/// `a * b / d` half-up kerekítéssel, TÚLCSORDULÁS NÉLKÜL.
/// A szorzat BigInt-ben készül, így nagy összegnél (pl. sok tétel részösszege
/// × bázispont) sem csordul át a 64 bites egész.
int mulDivRoundHalfUp(int a, int b, int d) {
  if (d <= 0) throw ArgumentError.value(d, 'd', 'must be > 0');
  final n = BigInt.from(a) * BigInt.from(b);
  final den = BigInt.from(d);
  final two = BigInt.two;
  final BigInt q;
  if (n >= BigInt.zero) {
    q = (n * two + den) ~/ (den * two);
  } else {
    q = -((-n * two + den) ~/ (den * two));
  }
  if (!q.isValidInt) throw UserInputError('Az összeg túl nagy, ezt az app nem tudja kezelni. Ellenőrizd a mennyiségeket és az árakat.');
  return q.toInt();
}

/// Forintra kerekít egy törtrészes értéket. Csak megjelenítési / import
/// határon használjuk; a belső számítás egészekkel, [divRoundHalfUp]-pal megy.
int roundToHuf(num value) {
  if (value.isNaN || value.isInfinite) {
    throw ArgumentError.value(value, 'value', 'must be finite');
  }
  // Tizedes hibák (pl. 2.4999999) ellen: 1/1000 Ft pontosságra rögzítjük.
  final milli = (value * 1000).round();
  return divRoundHalfUp(milli, 1000);
}

/// Mennyiségek egységesen ezredrészben (milli) tárolva: 12,5 m² → 12500.
const int quantityScale = 1000;

/// Százalékok bázispontban: 27% → 2700, 7,5% → 750.
const int percentScale = 10000;
