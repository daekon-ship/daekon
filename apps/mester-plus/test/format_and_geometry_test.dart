import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/domain/format.dart';
import 'package:mester_plus/domain/survey_geometry.dart';

void main() {
  const nb = '\u00A0';

  group('Fmt kimenet', () {
    test('Ft formátum', () {
      expect(Fmt.huf(0), '0${nb}Ft');
      expect(Fmt.huf(999), '999${nb}Ft');
      expect(Fmt.huf(1000), '1${nb}000${nb}Ft');
      expect(Fmt.huf(1234567), '1${nb}234${nb}567${nb}Ft');
      expect(Fmt.huf(-12000), '−12${nb}000${nb}Ft');
      expect(Fmt.hufSigned(500), '+500${nb}Ft');
    });
    test('mennyiség', () {
      expect(Fmt.quantity(12500), '12,5');
      expect(Fmt.quantity(3000), '3');
      expect(Fmt.quantity(3333), '3,333');
      expect(Fmt.quantity(1234050), '1${nb}234,05');
    });
    test('százalék', () {
      expect(Fmt.percentBp(2700), '27%');
      expect(Fmt.percentBp(750), '7,5%');
      expect(Fmt.percentBp(1225), '12,25%');
      expect(Fmt.percentBp(5), '0,05%');
    });
    test('dátum', () {
      expect(Fmt.date(DateTime(2026, 3, 7)), '2026. 03. 07.');
    });
  });

  group('Fmt bevitel', () {
    test('mennyiség', () {
      expect(Fmt.parseQuantityMilli('12'), 12000);
      expect(Fmt.parseQuantityMilli('12,5'), 12500);
      expect(Fmt.parseQuantityMilli('12.5'), 12500);
      expect(Fmt.parseQuantityMilli('1 234,25'), 1234250);
      expect(Fmt.parseQuantityMilli('0,001'), 1);
      expect(Fmt.parseQuantityMilli('1,2345'), isNull);
      expect(Fmt.parseQuantityMilli('abc'), isNull);
      expect(Fmt.parseQuantityMilli(''), isNull);
      expect(Fmt.parseQuantityMilli('-3'), isNull);
    });
    test('százalék', () {
      expect(Fmt.parsePercentBp('10'), 1000);
      expect(Fmt.parsePercentBp('7,5'), 750);
      expect(Fmt.parsePercentBp('12,25'), 1225);
      expect(Fmt.parsePercentBp('1,234'), isNull);
    });
    test('forint', () {
      expect(Fmt.parseHuf('12 500'), 12500);
      expect(Fmt.parseHuf('8500 Ft'), 8500);
      expect(Fmt.parseHuf('12,5'), isNull);
      expect(Fmt.parseHuf(''), isNull);
    });
    test('oda-vissza', () {
      expect(Fmt.parseQuantityMilli(Fmt.quantityInput(1234050)), 1234050);
      expect(Fmt.parsePercentBp(Fmt.percentInput(750)), 750);
    });
  });

  group('Felmérési geometria', () {
    test('alapterület, kerület, falfelület', () {
      const a = AreaMeasurements(lengthCm: 320, widthCm: 245, heightCm: 260, openingsMilliM2: 2500);
      // 3,20 × 2,45 = 7,84 m²
      expect(a.floorMilliM2, 7840);
      // 2 × (3,20 + 2,45) = 11,3 fm
      expect(a.perimeterMilliM, 11300);
      // 11,3 × 2,6 = 29,38 − 2,5 = 26,88 m²
      expect(a.wallMilliM2, 26880);
    });
    test('hiányos méret', () {
      const a = AreaMeasurements(lengthCm: 320);
      expect(a.floorMilliM2, isNull);
      expect(a.wallMilliM2, isNull);
    });
    test('nyílászáró nem visz negatívba', () {
      const a = AreaMeasurements(lengthCm: 100, widthCm: 100, heightCm: 100, openingsMilliM2: 999999);
      expect(a.wallMilliM2, 0);
    });
  });

  test('magyar betűrend', () {
    final names = ['Zsolt', 'Ádám', 'Ottó', 'Ablak', 'Örs', 'Ödön', 'Anna', 'Úrsula', 'Ügyes', 'Ede', 'Éde'];
    names.sort(Fmt.compareHu);
    expect(names, ['Ablak', 'Ádám', 'Anna', 'Ede', 'Éde', 'Ottó', 'Ödön', 'Örs', 'Úrsula', 'Ügyes', 'Zsolt']);
  });
}
