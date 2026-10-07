import 'money.dart';

/// Felmérési geometria. Bemenet cm-ben (egész), kimenet milli-egységben,
/// hogy közvetlenül munkatétel-mennyiségként használható legyen.
class AreaMeasurements {
  const AreaMeasurements({
    this.lengthCm,
    this.widthCm,
    this.heightCm,
    this.openingsMilliM2 = 0,
  });

  final int? lengthCm;
  final int? widthCm;
  final int? heightCm;

  /// Nyílászárók levonandó felülete (m², milli).
  final int openingsMilliM2;

  bool get hasFloor => (lengthCm ?? 0) > 0 && (widthCm ?? 0) > 0;
  bool get hasWalls => hasFloor && (heightCm ?? 0) > 0;

  /// Alapterület m² (milli). cm×cm / 10 000 m²  →  ×1000 milli  →  /10
  int? get floorMilliM2 => hasFloor ? divRoundHalfUp(lengthCm! * widthCm!, 10) : null;

  /// Kerület fm (milli). 2×(H+Sz) cm / 100 → ×1000 → ×10
  int? get perimeterMilliM => hasFloor ? 2 * (lengthCm! + widthCm!) * 10 : null;

  /// Nettó falfelület m² (milli), nyílászárók levonásával, 0 alá nem megy.
  int? get wallMilliM2 {
    if (!hasWalls) return null;
    final gross = divRoundHalfUp(2 * (lengthCm! + widthCm!) * heightCm!, 10);
    final net = gross - openingsMilliM2;
    return net < 0 ? 0 : net;
  }
}
