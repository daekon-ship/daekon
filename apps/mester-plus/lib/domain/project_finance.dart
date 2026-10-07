/// Projekt-pénzügy: mi folyt be, mi ment ki, mi maradt. Minden bruttó, egész
/// forint. Az ajánlat bruttó végösszege a [QuoteCalculator]-ból jön, itt csak
/// összeadunk és kivonunk — nincs saját kerekítés.
library;

import 'money.dart';

class ProjectFinance {
  const ProjectFinance({
    required this.quoteGrossHuf,
    required this.paidHuf,
    required this.expensesHuf,
    required this.workMinutes,
  });

  /// Az ajánlat bruttó végösszege (ennyit kell az ügyfélnek fizetnie).
  final int quoteGrossHuf;

  /// Eddig befolyt (előleg + részletek).
  final int paidHuf;

  /// Eddigi kiadások (anyag, alvállalkozó, szállítás…).
  final int expensesHuf;

  /// Munkanaplóban rögzített idő, percben.
  final int workMinutes;

  /// Még fizetendő. Túlfizetésnél 0 (a többletet [overpaidHuf] mutatja).
  int get outstandingHuf => (quoteGrossHuf - paidHuf).clamp(0, 1 << 62);

  int get overpaidHuf => (paidHuf - quoteGrossHuf).clamp(0, 1 << 62);

  /// Ami a munkán marad: ajánlati összeg − kiadások. Lehet negatív.
  int get marginHuf => quoteGrossHuf - expensesHuf;

  /// Egy órára jutó eredmény (bruttó ajánlat − kiadások) / ledolgozott óra.
  /// Null, ha nincs rögzített idő.
  int? get marginPerHourHuf =>
      workMinutes <= 0 ? null : mulDivRoundHalfUp(marginHuf, 60, workMinutes);

  bool get isFullyPaid => quoteGrossHuf > 0 && paidHuf >= quoteGrossHuf;

  /// 0..1 arány a sávhoz.
  double get paidRatio => quoteGrossHuf <= 0 ? 0 : (paidHuf / quoteGrossHuf).clamp(0, 1).toDouble();
}

/// Csempe-/burkolólap-kalkulátor: hány doboz kell.
///
/// Bemenet: felület (milli m²), doboz tartalma (milli m²), ráhagyás bázispontban
/// (egyenes rakás 5–10%, átlós 15% — a szaki adja meg). Kimenet: szükséges
/// felület ráhagyással és a dobozszám FELFELÉ kerekítve.
class TileCalc {
  const TileCalc({required this.areaMilliM2, required this.boxMilliM2, required this.wasteBp});

  final int areaMilliM2;
  final int boxMilliM2;
  final int wasteBp;

  int get neededMilliM2 => mulDivRoundHalfUp(areaMilliM2, percentScale + wasteBp, percentScale);

  int get boxes {
    if (boxMilliM2 <= 0 || neededMilliM2 <= 0) return 0;
    return (neededMilliM2 + boxMilliM2 - 1) ~/ boxMilliM2;
  }

  /// A dobozokban ténylegesen megvett felület.
  int get purchasedMilliM2 => boxes * boxMilliM2;
}
