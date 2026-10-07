import 'enums.dart';
import 'errors.dart';
import 'money.dart';

/// A kalkulátor bemeneti sora. Független a Drift sorosztálytól, így a
/// számítás tisztán, adatbázis nélkül tesztelhető.
class CalcLine {
  const CalcLine({
    required this.quantityMilli,
    required this.laborUnitPriceHuf,
    required this.materialUnitPriceHuf,
  });

  final int quantityMilli;
  final int laborUnitPriceHuf;
  final int materialUnitPriceHuf;

  /// Nincs ár megadva (sem díj, sem anyag) — az ajánlat így hiányos.
  bool get isUnpriced => laborUnitPriceHuf == 0 && materialUnitPriceHuf == 0;
}

class LineTotals {
  const LineTotals({required this.laborHuf, required this.materialHuf});
  final int laborHuf;
  final int materialHuf;
  int get totalHuf => laborHuf + materialHuf;
}

class QuoteTotals {
  const QuoteTotals({
    required this.lines,
    required this.laborSubtotalHuf,
    required this.materialSubtotalHuf,
    required this.adjustmentType,
    required this.adjustmentPercentBp,
    required this.adjustmentHuf,
    required this.vatRateBp,
    required this.netTotalHuf,
    required this.vatHuf,
    required this.grossTotalHuf,
    required this.unpricedLineCount,
  });

  final List<LineTotals> lines;
  final int laborSubtotalHuf;
  final int materialSubtotalHuf;
  final AdjustmentType adjustmentType;
  final int adjustmentPercentBp;

  /// Előjeles: kedvezménynél negatív, felárnál pozitív.
  final int adjustmentHuf;
  final int vatRateBp;
  final int netTotalHuf;
  final int vatHuf;
  final int grossTotalHuf;
  final int unpricedLineCount;

  int get subtotalHuf => laborSubtotalHuf + materialSubtotalHuf;
  bool get isComplete => lines.isNotEmpty && unpricedLineCount == 0;

  static const QuoteTotals empty = QuoteTotals(
    lines: [],
    laborSubtotalHuf: 0,
    materialSubtotalHuf: 0,
    adjustmentType: AdjustmentType.none,
    adjustmentPercentBp: 0,
    adjustmentHuf: 0,
    vatRateBp: 0,
    netTotalHuf: 0,
    vatHuf: 0,
    grossTotalHuf: 0,
    unpricedLineCount: 0,
  );
}

/// AZ EGYETLEN hely, ahol ajánlati összeg keletkezik. Dashboard, kalkuláció,
/// ajánlat-előnézet mind ezt hívja — sehol máshol nincs pénzügyi aritmetika.
///
/// Sorrend:
/// 1. soronként: összeg = round(menny × (díj+anyag)); díj = round(menny × díj); anyag = különbözet
/// 2. részösszeg = Σ díj + Σ anyag
/// 3. kedvezmény/felár = round(részösszeg × %)
/// 4. nettó = részösszeg ± kedvezmény/felár
/// 5. ÁFA = round(nettó × kulcs)
/// 6. bruttó = nettó + ÁFA
abstract final class QuoteCalculator {
  static QuoteTotals calculate({
    required List<CalcLine> lines,
    required AdjustmentType adjustmentType,
    required int adjustmentPercentBp,
    required int vatRateBp,
  }) {
    if (adjustmentPercentBp < 0 || adjustmentPercentBp > percentScale) {
      throw ArgumentError.value(adjustmentPercentBp, 'adjustmentPercentBp', '0..10000');
    }
    if (vatRateBp < 0 || vatRateBp > percentScale) {
      throw ArgumentError.value(vatRateBp, 'vatRateBp', '0..10000');
    }

    var labor = 0;
    var material = 0;
    var unpriced = 0;
    final lineTotals = <LineTotals>[];

    for (final l in lines) {
      if (l.quantityMilli < 0 || l.laborUnitPriceHuf < 0 || l.materialUnitPriceHuf < 0) {
        throw UserInputError('Negatív mennyiség vagy egységár nem megengedett.');
      }
      final lt = line(l);
      lineTotals.add(lt);
      labor += lt.laborHuf;
      material += lt.materialHuf;
      if (l.isUnpriced) unpriced++;
    }

    final subtotal = labor + material;

    // A "Nincs" típusnál a tárolt százalékot SOHA nem alkalmazzuk.
    final effectiveBp = adjustmentType == AdjustmentType.none ? 0 : adjustmentPercentBp;
    final adjAbs = mulDivRoundHalfUp(subtotal, effectiveBp, percentScale);
    final adjustment = switch (adjustmentType) {
      AdjustmentType.none => 0,
      AdjustmentType.discount => -adjAbs,
      AdjustmentType.surcharge => adjAbs,
    };

    final net = subtotal + adjustment;
    final vat = mulDivRoundHalfUp(net, vatRateBp, percentScale);

    return QuoteTotals(
      lines: List.unmodifiable(lineTotals),
      laborSubtotalHuf: labor,
      materialSubtotalHuf: material,
      adjustmentType: adjustmentType,
      adjustmentPercentBp: effectiveBp,
      adjustmentHuf: adjustment,
      vatRateBp: vatRateBp,
      netTotalHuf: net,
      vatHuf: vat,
      grossTotalHuf: net + vat,
      unpricedLineCount: unpriced,
    );
  }

  /// Egy sor összege. A sor végösszege = round(mennyiség × (díj + anyag)),
  /// így az ajánlaton szereplő „mennyiség × egységár = összeg” a megrendelő
  /// számára is pontosan ellenőrizhető. A díj = round(mennyiség × díj), az
  /// anyag a különbözet — a bontás így forintra pontosan kiadja a sor összegét.
  static LineTotals line(CalcLine l) {
    final total = mulDivRoundHalfUp(l.quantityMilli, l.laborUnitPriceHuf + l.materialUnitPriceHuf, quantityScale);
    final labor = mulDivRoundHalfUp(l.quantityMilli, l.laborUnitPriceHuf, quantityScale);
    return LineTotals(laborHuf: labor, materialHuf: total - labor);
  }
}
