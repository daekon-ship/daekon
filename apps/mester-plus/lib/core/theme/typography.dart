import 'package:flutter/material.dart';

import 'tokens.dart';

abstract final class MpFonts {
  static const String sans = 'IBMPlexSans';
  static const String mono = 'IBMPlexMono';
}

/// Tipográfiai skála. Pénzösszegek mindig mono + tabular figures.
/// Szándékosan mérsékelt méretek: nincs óriás címsor vagy óriás szám —
/// mobilon és asztalon is visszafogott, professzionális hatás.
abstract final class MpText {
  static const TextStyle display = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 24,
    height: 1.2,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.4,
    color: MpColors.ink,
  );
  static const TextStyle title = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 19,
    height: 1.25,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
    color: MpColors.ink,
  );
  static const TextStyle heading = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 17,
    height: 1.3,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.1,
    color: MpColors.ink,
  );
  static const TextStyle body = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 15,
    height: 1.45,
    fontWeight: FontWeight.w400,
    color: MpColors.inkSoft,
  );
  static const TextStyle bodyStrong = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 15,
    height: 1.45,
    fontWeight: FontWeight.w500,
    color: MpColors.ink,
  );
  static const TextStyle small = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 13,
    height: 1.4,
    fontWeight: FontWeight.w400,
    color: MpColors.inkMuted,
  );
  static const TextStyle label = TextStyle(
    fontFamily: MpFonts.sans,
    fontSize: 11.5,
    height: 1.2,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.9,
    color: MpColors.inkMuted,
  );
  static const TextStyle money = TextStyle(
    fontFamily: MpFonts.mono,
    fontSize: 15,
    height: 1.3,
    fontWeight: FontWeight.w500,
    color: MpColors.ink,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  static const TextStyle moneyLarge = TextStyle(
    fontFamily: MpFonts.mono,
    fontSize: 22,
    height: 1.2,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.4,
    color: MpColors.ink,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  static const TextStyle mono = TextStyle(
    fontFamily: MpFonts.mono,
    fontSize: 13,
    height: 1.35,
    fontWeight: FontWeight.w400,
    color: MpColors.inkMuted,
    fontFeatures: [FontFeature.tabularFigures()],
  );
}
