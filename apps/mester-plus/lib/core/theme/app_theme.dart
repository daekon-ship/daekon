import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'tokens.dart';
import 'typography.dart';

abstract final class MpTheme {
  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: MpColors.brand,
      onPrimary: MpColors.onBrand,
      secondary: MpColors.accent,
      onSecondary: MpColors.onAccent,
      error: MpColors.danger,
      onError: Colors.white,
      surface: MpColors.surface,
      onSurface: MpColors.ink,
      surfaceContainerHighest: MpColors.surfaceSunken,
      outline: MpColors.lineStrong,
      outlineVariant: MpColors.line,
    );

    final inputBorder = OutlineInputBorder(
      borderRadius: MpRadius.mdAll,
      borderSide: const BorderSide(color: MpColors.line),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: MpFonts.sans,
      scaffoldBackgroundColor: MpColors.canvas,
      splashFactory: InkRipple.splashFactory,
      dividerTheme: const DividerThemeData(color: MpColors.line, thickness: 1, space: 1),
      appBarTheme: const AppBarTheme(
        backgroundColor: MpColors.canvas,
        foregroundColor: MpColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: MpText.heading,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      textTheme: const TextTheme(
        displaySmall: MpText.display,
        titleLarge: MpText.title,
        titleMedium: MpText.heading,
        bodyLarge: MpText.body,
        bodyMedium: MpText.body,
        bodySmall: MpText.small,
        labelSmall: MpText.label,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: MpColors.surface,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        labelStyle: MpText.small,
        floatingLabelStyle: MpText.small.copyWith(color: MpColors.brand),
        hintStyle: MpText.body.copyWith(color: MpColors.inkFaint),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(
          borderSide: const BorderSide(color: MpColors.brand, width: 1.6),
        ),
        errorBorder: inputBorder.copyWith(
          borderSide: const BorderSide(color: MpColors.danger),
        ),
        focusedErrorBorder: inputBorder.copyWith(
          borderSide: const BorderSide(color: MpColors.danger, width: 1.6),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: MpColors.surface,
        indicatorColor: MpColors.accentSoft,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 68,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return MpText.small.copyWith(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            color: selected ? MpColors.ink : MpColors.inkMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 23,
            color: selected ? MpColors.ink : MpColors.inkMuted,
          );
        }),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: MpColors.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(MpRadius.xl)),
        ),
      ),
      dialogTheme: const DialogThemeData(
        backgroundColor: MpColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: MpRadius.lgAll),
        titleTextStyle: MpText.heading,
        contentTextStyle: MpText.body,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: MpColors.ink,
        contentTextStyle: MpText.body.copyWith(color: Colors.white),
        shape: const RoundedRectangleBorder(borderRadius: MpRadius.mdAll),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: MpColors.brand,
        foregroundColor: MpColors.onBrand,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: MpRadius.lgAll),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          textStyle: WidgetStatePropertyAll(MpText.small.copyWith(fontWeight: FontWeight.w600)),
          side: const WidgetStatePropertyAll(BorderSide(color: MpColors.line)),
          backgroundColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? MpColors.brand : MpColors.surface,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? MpColors.onBrand : MpColors.inkSoft,
          ),
          iconColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? MpColors.onBrand : MpColors.inkSoft,
          ),
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? MpColors.brand : null,
        ),
      ),
      switchTheme: SwitchThemeData(
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? MpColors.brand : MpColors.surfaceSunken,
        ),
      ),
    );
  }
}
