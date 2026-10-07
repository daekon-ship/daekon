/// Domain enumok. A Drift `textEnum` a [Enum.name]-et tárolja, ezért
/// az enum értékek nevét átnevezni csak migrációval szabad.
library;

import 'format.dart';

enum ProjectStatus {
  draft('Piszkozat'),
  quoted('Ajánlat kiküldve'),
  accepted('Elfogadva'),
  inProgress('Folyamatban'),
  completed('Befejezve'),
  lost('Elutasítva');

  const ProjectStatus(this.label);
  final String label;

  /// Nyitott ajánlat: ez számít a "pipeline"-ba.
  bool get isPipeline => this == ProjectStatus.draft || this == ProjectStatus.quoted;

  /// Megnyert munka.
  bool get isWon =>
      this == ProjectStatus.accepted ||
      this == ProjectStatus.inProgress ||
      this == ProjectStatus.completed;

  bool get isActive => this != ProjectStatus.completed && this != ProjectStatus.lost;
}

enum AdjustmentType {
  none('Nincs'),
  discount('Kedvezmény'),
  surcharge('Felár');

  const AdjustmentType(this.label);
  final String label;
}

/// Mértékegységek. A `symbol` kerül az ajánlatra.
enum WorkUnit {
  m2('m²'),
  fm('fm'),
  m3('m³'),
  db('db'),
  ora('óra'),
  klt('klt');

  const WorkUnit(this.symbol);
  final String symbol;
}

enum TradeCategory {
  burkolas('Burkolás'),
  falazas('Falazás'),
  vakolas('Vakolás'),
  aljzat('Aljzat'),
  szigeteles('Szigetelés'),
  bontas('Bontás'),
  festes('Festés'),
  egyeb('Egyéb');

  const TradeCategory(this.label);
  final String label;
}

/// Gyakori ÁFA-kulcsok bázispontban.
abstract final class VatRates {
  static const int standard = 2700;
  static const int reduced5 = 500;
  static const int exempt = 0;

  static const List<int> presets = [standard, reduced5, exempt];

  static String label(int bp) => switch (bp) {
        standard => '27%',
        reduced5 => '5%',
        exempt => '0% (AAM / fordított)',
        _ => Fmt.percentBp(bp),
      };
}

/// Befolyt pénz módja.
enum PaymentMethod {
  cash('Készpénz'),
  transfer('Átutalás'),
  card('Kártya');

  const PaymentMethod(this.label);
  final String label;
}

/// Kiadás típusa (a projekt költségeinek bontásához).
enum ExpenseCategory {
  material('Anyag'),
  subcontractor('Alvállalkozó'),
  transport('Szállítás, sitt'),
  tool('Gép, szerszám'),
  other('Egyéb');

  const ExpenseCategory(this.label);
  final String label;
}
