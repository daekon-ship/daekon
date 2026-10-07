import 'package:flutter_test/flutter_test.dart';
import 'package:mester_plus/domain/enums.dart';
import 'package:mester_plus/domain/money.dart';
import 'package:mester_plus/domain/quote_calculator.dart';

void main() {
  group('divRoundHalfUp', () {
    test('half-up pozitív', () {
      expect(divRoundHalfUp(5, 10), 1); // 0,5 → 1
      expect(divRoundHalfUp(4, 10), 0); // 0,4 → 0
      expect(divRoundHalfUp(15, 10), 2); // 1,5 → 2
      expect(divRoundHalfUp(25, 10), 3); // 2,5 → 3 (nem banker's)
      expect(divRoundHalfUp(0, 7), 0);
    });
    test('negatív szimmetrikus', () {
      expect(divRoundHalfUp(-5, 10), -1);
      expect(divRoundHalfUp(-4, 10), 0);
      expect(divRoundHalfUp(-25, 10), -3);
    });
    test('nulla nevező hibát dob', () {
      expect(() => divRoundHalfUp(1, 0), throwsArgumentError);
    });
  });

  group('roundToHuf', () {
    test('lebegőpontos zaj ellen védett', () {
      expect(roundToHuf(2.5), 3);
      expect(roundToHuf(2.4999999999), 3); // ezredre rögzítve 2,500
      expect(roundToHuf(2.4994), 2);
      expect(roundToHuf(-2.5), -3);
      expect(roundToHuf(1234567.5), 1234568);
    });
  });

  group('QuoteCalculator', () {
    const tiles = CalcLine(quantityMilli: 12500, laborUnitPriceHuf: 8500, materialUnitPriceHuf: 0);
    const grout = CalcLine(quantityMilli: 3333, laborUnitPriceHuf: 1001, materialUnitPriceHuf: 333);

    test('soronkénti kerekítés, részösszeg, ÁFA', () {
      final t = QuoteCalculator.calculate(
        lines: const [tiles, grout],
        adjustmentType: AdjustmentType.none,
        adjustmentPercentBp: 0,
        vatRateBp: VatRates.standard,
      );
      // 12,5 × 8500 = 106 250
      expect(t.lines[0].laborHuf, 106250);
      // 3,333 × 1001 = 3336,333 → 3336 ; 3,333 × 333 = 1109,889 → 1110
      expect(t.lines[1].laborHuf, 3336);
      expect(t.lines[1].materialHuf, 1110);
      expect(t.laborSubtotalHuf, 109586);
      expect(t.materialSubtotalHuf, 1110);
      expect(t.subtotalHuf, 110696);
      expect(t.netTotalHuf, 110696);
      // 110 696 × 0,27 = 29 887,92 → 29 888
      expect(t.vatHuf, 29888);
      expect(t.grossTotalHuf, 140584);
      expect(t.isComplete, isTrue);
    });

    test('sor összege = mennyiség × teljes egységár (ellenőrizhető az ajánlaton)', () {
      // 1,5 × (1 + 1) = 3 Ft — nem 2 + 2 = 4 (külön kerekítve)
      final lt = QuoteCalculator.line(const CalcLine(quantityMilli: 1500, laborUnitPriceHuf: 1, materialUnitPriceHuf: 1));
      expect(lt.totalHuf, 3);
      expect(lt.laborHuf, 2);
      expect(lt.materialHuf, 1);
    });

    test('kedvezmény az ÁFA előtt, negatív előjellel', () {
      final t = QuoteCalculator.calculate(
        lines: const [tiles],
        adjustmentType: AdjustmentType.discount,
        adjustmentPercentBp: 1000,
        vatRateBp: VatRates.standard,
      );
      expect(t.adjustmentHuf, -10625);
      expect(t.netTotalHuf, 95625);
      // 95 625 × 0,27 = 25 818,75 → 25 819
      expect(t.vatHuf, 25819);
      expect(t.grossTotalHuf, 121444);
    });

    test('felár pozitív', () {
      final t = QuoteCalculator.calculate(
        lines: const [tiles],
        adjustmentType: AdjustmentType.surcharge,
        adjustmentPercentBp: 750,
        vatRateBp: 0,
      );
      // 106 250 × 0,075 = 7968,75 → 7969
      expect(t.adjustmentHuf, 7969);
      expect(t.grossTotalHuf, 114219);
    });

    test('"Nincs" típusnál a tárolt százalék NEM érvényesül', () {
      final t = QuoteCalculator.calculate(
        lines: const [tiles],
        adjustmentType: AdjustmentType.none,
        adjustmentPercentBp: 1500,
        vatRateBp: 0,
      );
      expect(t.adjustmentHuf, 0);
      expect(t.adjustmentPercentBp, 0);
      expect(t.grossTotalHuf, 106250);
    });

    test('ár nélküli sor hiányosnak jelöli az ajánlatot', () {
      final t = QuoteCalculator.calculate(
        lines: const [tiles, CalcLine(quantityMilli: 1000, laborUnitPriceHuf: 0, materialUnitPriceHuf: 0)],
        adjustmentType: AdjustmentType.none,
        adjustmentPercentBp: 0,
        vatRateBp: VatRates.standard,
      );
      expect(t.unpricedLineCount, 1);
      expect(t.isComplete, isFalse);
    });

    test('üres ajánlat nulla és nem teljes', () {
      final t = QuoteCalculator.calculate(
        lines: const [],
        adjustmentType: AdjustmentType.none,
        adjustmentPercentBp: 0,
        vatRateBp: VatRates.standard,
      );
      expect(t.grossTotalHuf, 0);
      expect(t.isComplete, isFalse);
    });

    test('érvénytelen bemenet', () {
      expect(
        () => QuoteCalculator.calculate(
          lines: const [CalcLine(quantityMilli: -1, laborUnitPriceHuf: 1, materialUnitPriceHuf: 0)],
          adjustmentType: AdjustmentType.none,
          adjustmentPercentBp: 0,
          vatRateBp: 0,
        ),
        throwsArgumentError,
      );
      expect(
        () => QuoteCalculator.calculate(
          lines: const [],
          adjustmentType: AdjustmentType.discount,
          adjustmentPercentBp: 10001,
          vatRateBp: 0,
        ),
        throwsArgumentError,
      );
    });

    test('nagy összeg sem csordul túl (BigInt köztes szorzat)', () {
      // 3 sor × max. mennyiség × max. egységár, 100% felár, 27% ÁFA.
      // A régi int-es képlet (részösszeg × 10000 × 2) itt átcsordult volna.
      const big = CalcLine(quantityMilli: 999999999, laborUnitPriceHuf: 99999999, materialUnitPriceHuf: 99999999);
      final t = QuoteCalculator.calculate(
        lines: const [big, big, big],
        adjustmentType: AdjustmentType.surcharge,
        adjustmentPercentBp: 10000,
        vatRateBp: VatRates.standard,
      );
      expect(t.lines[0].laborHuf, 99999998900000);
      expect(t.subtotalHuf, 599999993400000);
      expect(t.adjustmentHuf, 599999993400000);
      expect(t.vatHuf, 323999996436000);
      expect(t.grossTotalHuf, 1523999983236000);
    });
  });

  group('mulDivRoundHalfUp', () {
    test('egyezik a divRoundHalfUp-pal kis számokon', () {
      for (final (a, b, d) in [(5, 1, 10), (25, 1, 10), (-25, 1, 10), (12500, 8500, 1000), (3333, 1001, 1000)]) {
        expect(mulDivRoundHalfUp(a, b, d), divRoundHalfUp(a * b, d));
      }
    });
  });
}
