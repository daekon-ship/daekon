import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/tokens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  // Android 15+ (API 35/36) kötelezően edge-to-edge: átlátszó rendszersávok,
  // a tartalom SafeArea-val / MediaQuery-paddinggel kerüli ki őket.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.dark,
    systemNavigationBarContrastEnforced: false,
  ));
  runApp(const ProviderScope(child: MesterApp()));
}

class MesterApp extends StatefulWidget {
  const MesterApp({super.key});

  @override
  State<MesterApp> createState() => _MesterAppState();
}

class _MesterAppState extends State<MesterApp> {
  // Egyszer jön létre — hot reload / rebuild ne állítsa vissza a navigációt.
  late final GoRouter _router = buildRouter();

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Mester+',
      debugShowCheckedModeBanner: false,
      theme: MpTheme.light(),
      routerConfig: _router,
      locale: const Locale('hu', 'HU'),
      supportedLocales: const [Locale('hu', 'HU')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (context, child) => _ResponsiveFrame(child: child ?? const SizedBox.shrink()),
    );
  }
}

/// Mobil-első keret minden képernyőhöz:
///  - **Nagy rendszer-betűméret:** a felhasználó beállítását tiszteletben tartjuk,
///    de 1,3×-nál nem nagyítunk tovább — e fölött a pénzösszeg-sorok és a
///    kétoszlopos beviteli mezők már nem férnének el telefonon.
///  - **Tablet / fekvő kijelző / Chromebook:** a tartalom legfeljebb 640 dp széles,
///    középre igazítva, így a telefonra tervezett elrendezés nem nyúlik szét.
class _ResponsiveFrame extends StatelessWidget {
  const _ResponsiveFrame({required this.child});
  final Widget child;

  static const double maxContentWidth = 640;
  static const double maxTextScale = 1.3;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final scaled = mq.copyWith(
      textScaler: mq.textScaler.clamp(minScaleFactor: 1.0, maxScaleFactor: maxTextScale),
    );
    final width = mq.size.width;
    if (width <= maxContentWidth) {
      return MediaQuery(data: scaled, child: child);
    }
    final side = (width - maxContentWidth) / 2;
    return ColoredBox(
      color: MpColors.surfaceSunken,
      child: Center(
        child: SizedBox(
          width: maxContentWidth,
          child: MediaQuery(
            // A belső képernyők a keskenyebb szélességgel számolnak, és a bal/jobb
            // rendszer-padding (pl. kamerakivágás fekvő módban) a keretre vonatkozik.
            data: scaled.copyWith(
              size: Size(maxContentWidth, mq.size.height),
              padding: mq.padding.copyWith(
                left: math.max(0, mq.padding.left - side),
                right: math.max(0, mq.padding.right - side),
              ),
              viewPadding: mq.viewPadding.copyWith(
                left: math.max(0, mq.viewPadding.left - side),
                right: math.max(0, mq.viewPadding.right - side),
              ),
            ),
            child: ClipRect(child: child),
          ),
        ),
      ),
    );
  }
}
