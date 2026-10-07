import 'package:flutter/material.dart';

/// Mester+ design tokens. Minden szín, távolság, sugár és árnyék innen jön —
/// képernyőkön nem használunk "nyers" értékeket.
abstract final class MpColors {
  // Felületek — meleg, papírszerű alap; nem steril admin-szürke.
  static const Color canvas = Color(0xFFF5F3EE);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSunken = Color(0xFFEDEAE3);
  static const Color line = Color(0xFFE2DED5);
  static const Color lineStrong = Color(0xFFCBC5B8);

  // Tinta — mély grafit-kék, a márka gerince.
  static const Color ink = Color(0xFF151A23);
  static const Color inkSoft = Color(0xFF3A4150);
  static const Color inkMuted = Color(0xFF6B7180);
  static const Color inkFaint = Color(0xFF9AA0AC);

  // Márka
  static const Color brand = Color(0xFF1B2B44);
  static const Color brandSoft = Color(0xFF2C4166);
  static const Color onBrand = Color(0xFFFFFFFF);

  // Jelzőszín — építkezési "signal amber", takarékosan.
  static const Color accent = Color(0xFFE09A2C);
  static const Color accentSoft = Color(0xFFFBEFD9);
  static const Color onAccent = Color(0xFF231703);

  // Állapotok
  static const Color success = Color(0xFF2F7A57);
  static const Color successSoft = Color(0xFFE2F1E8);
  static const Color warning = Color(0xFFB7791F);
  static const Color warningSoft = Color(0xFFFCF1DC);
  static const Color danger = Color(0xFFB83A26);
  static const Color dangerSoft = Color(0xFFF8E3DE);
  static const Color info = Color(0xFF2F5C8F);
  static const Color infoSoft = Color(0xFFE2EBF5);
}

abstract final class MpSpace {
  static const double x1 = 4;
  static const double x2 = 8;
  static const double x3 = 12;
  static const double x4 = 16;
  static const double x5 = 20;
  static const double x6 = 24;
  static const double x8 = 32;
  static const double x10 = 40;
  static const double x12 = 48;

  /// Képernyő oldalsó margó.
  static const double gutter = 20;
}

abstract final class MpRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 22;
  static const double pill = 999;

  static const BorderRadius smAll = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius mdAll = BorderRadius.all(Radius.circular(md));
  static const BorderRadius lgAll = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius xlAll = BorderRadius.all(Radius.circular(xl));
}

abstract final class MpShadow {
  static const List<BoxShadow> card = [
    BoxShadow(color: Color(0x0F151A23), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x0A151A23), blurRadius: 16, offset: Offset(0, 6)),
  ];
  static const List<BoxShadow> raised = [
    BoxShadow(color: Color(0x14151A23), blurRadius: 4, offset: Offset(0, 2)),
    BoxShadow(color: Color(0x1A151A23), blurRadius: 28, offset: Offset(0, 12)),
  ];
}

abstract final class MpDuration {
  static const Duration fast = Duration(milliseconds: 140);
  static const Duration base = Duration(milliseconds: 220);
}
