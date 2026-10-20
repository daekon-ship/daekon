/// Az app verziója — EGY helyen. A `test/app_info_test.dart` ellenőrzi, hogy
/// megegyezik a pubspec.yaml `version` mezőjével.
const String appVersion = '0.9.0';

/// Kiadási csatorna – CSAK fordításkor adható meg (`--dart-define=MP_CHANNEL=pilot`).
/// A pilot csak egy diszkrét „béta tesztverzió” jelölést ad; jogosultságot NEM (azt a szerver adja, lejárattal).
const String releaseChannel = String.fromEnvironment('MP_CHANNEL');
const bool isPilotBuild = releaseChannel == 'pilot';

/// A felületen mutatott verzió-felirat.
const String appVersionLabel = isPilotBuild ? 'Mester+ Pilot · béta tesztverzió · $appVersion' : 'Mester+ $appVersion';
