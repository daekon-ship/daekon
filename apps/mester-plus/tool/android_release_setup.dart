// Mester+ – Android kiadás-előkészítés (Google Play).
//
// Futtatás a projekt gyökeréből, a `flutter create .` UTÁN:
//   dart run tool/android_release_setup.dart
//
// Mit csinál (idempotens – többször is futtatható):
//  1. AndroidManifest: az app neve „Mester+”.
//  2. app/build.gradle(.kts):
//     - compileSdk / targetSdk legalább 36 (Google Play követelmény 2026. 08. 31. óta),
//     - minSdk legalább 24 (Android 7.0),
//     - kiadási aláírás az android/key.properties fájlból; ha az nincs meg,
//       debug aláírás marad (azt a Play nem fogadja el – a release.bat ellenőrzi).
//
// Kilépési kód: 0 = rendben, 1 = hiba (érthető üzenettel).
import 'dart:io';

const _marker = 'mester_plus:release-setup';

void main() {
  final androidDir = Directory('android');
  if (!androidDir.existsSync()) {
    _fail('Nincs android mappa. Előbb futtasd: flutter create . --platforms android');
  }
  _patchManifest(File('android/app/src/main/AndroidManifest.xml'));

  final kts = File('android/app/build.gradle.kts');
  final groovy = File('android/app/build.gradle');
  if (kts.existsSync()) {
    _patchGradleKts(kts);
  } else if (groovy.existsSync()) {
    _patchGradleGroovy(groovy);
  } else {
    _fail('Nem található az android/app/build.gradle(.kts) fájl.');
  }
  stdout.writeln('Kész: az Android projekt be van állítva a Play-kiadáshoz.');
}

Never _fail(String msg) {
  stderr.writeln('HIBA: $msg');
  exit(1);
}

void _patchManifest(File f) {
  if (!f.existsSync()) _fail('Hiányzik: ${f.path}');
  var s = f.readAsStringSync();
  final label = RegExp(r'android:label="[^"]*"');
  if (!label.hasMatch(s)) _fail('Az AndroidManifest-ben nincs android:label.');
  s = s.replaceFirst(label, 'android:label="Mester+"');
  // Android 11+ csomag-láthatóság: a hívás és az e-mail indításához.
  if (!s.contains('android:scheme="tel"')) {
    if (!s.contains('</manifest>')) _fail('Hibás AndroidManifest: nincs </manifest>.');
    s = s.replaceFirst('</manifest>', '''    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="tel" />
        </intent>
        <intent>
            <action android:name="android.intent.action.SENDTO" />
            <data android:scheme="mailto" />
        </intent>
    </queries>
</manifest>''');
  }
  f.writeAsStringSync(s);
  stdout.writeln('  ✓ App neve: Mester+, hívás/e-mail engedélyezve');
}

/// Első egyezés cseréje; a cseretextben a `$1` az első csoportra hivatkozik.
/// (A Dart `replaceFirst` a `$1`-et szó szerint venné, ezért kézzel helyettesítünk.)
String _replaceRequired(String s, RegExp re, String replacement, String what) {
  if (!re.hasMatch(s)) _fail('Nem találom a build.gradle-ben: $what. Futtasd újra a flutter create-et.');
  return s.replaceFirstMapped(re, (m) => replacement.replaceAll(r'$1', m.groupCount >= 1 ? (m.group(1) ?? '') : ''));
}

void _patchGradleKts(File f) {
  var s = f.readAsStringSync();
  if (s.contains(_marker)) {
    stdout.writeln('  ✓ build.gradle.kts már be van állítva');
    return;
  }

  // 1) Importok a fájl elejére.
  s = 'import java.io.FileInputStream\nimport java.util.Properties\n\n$s';

  // 2) key.properties betöltése a plugins blokk után.
  s = _replaceRequired(
    s,
    RegExp(r'(plugins\s*\{[\s\S]*?\n\}\n)'),
    '''\$1
// $_marker
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}
''',
    'plugins { … } blokk',
  );

  // 3) SDK-szintek.
  s = _replaceRequired(s, RegExp(r'compileSdk\s*=\s*[^\n]+'),
      'compileSdk = maxOf(flutter.compileSdkVersion, 36)', 'compileSdk');
  s = _replaceRequired(s, RegExp(r'minSdk\s*=\s*[^\n]+'), 'minSdk = maxOf(flutter.minSdkVersion, 24)', 'minSdk');
  s = _replaceRequired(s, RegExp(r'targetSdk\s*=\s*[^\n]+'),
      'targetSdk = maxOf(flutter.targetSdkVersion, 36)', 'targetSdk');

  // 4) Aláírás: signingConfigs a buildTypes elé, a release a kulcsot használja.
  s = _replaceRequired(
    s,
    RegExp(r'(\n\s*)buildTypes\s*\{'),
    '''\$1signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }
\$1buildTypes {''',
    'buildTypes { … } blokk',
  );
  s = _replaceRequired(
    s,
    RegExp(r'signingConfig\s*=\s*signingConfigs\.getByName\("debug"\)'),
    'signingConfig = if (keystorePropertiesFile.exists()) signingConfigs.getByName("release") '
        'else signingConfigs.getByName("debug")',
    'release signingConfig',
  );

  f.writeAsStringSync(s);
  stdout.writeln('  ✓ build.gradle.kts: API 36, minSdk 24, kiadási aláírás');
}

void _patchGradleGroovy(File f) {
  var s = f.readAsStringSync();
  if (s.contains(_marker)) {
    stdout.writeln('  ✓ build.gradle már be van állítva');
    return;
  }
  s = _replaceRequired(
    s,
    RegExp(r'(\nandroid\s*\{)'),
    '''
// $_marker
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
\$1''',
    'android { … } blokk',
  );
  s = _replaceRequired(s, RegExp(r'compileSdk(Version)?\s*=?\s*[^\n]+'),
      'compileSdk Math.max(flutter.compileSdkVersion, 36)', 'compileSdk');
  s = _replaceRequired(s, RegExp(r'minSdk(Version)?\s*=?\s*[^\n]+'),
      'minSdkVersion Math.max(flutter.minSdkVersion, 24)', 'minSdk');
  s = _replaceRequired(s, RegExp(r'targetSdk(Version)?\s*=?\s*[^\n]+'),
      'targetSdkVersion Math.max(flutter.targetSdkVersion, 36)', 'targetSdk');
  s = _replaceRequired(
    s,
    RegExp(r'(\n\s*)buildTypes\s*\{'),
    '''\$1signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
\$1buildTypes {''',
    'buildTypes { … } blokk',
  );
  s = _replaceRequired(
    s,
    RegExp(r'signingConfig\s*=?\s*signingConfigs\.debug'),
    'signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug',
    'release signingConfig',
  );
  f.writeAsStringSync(s);
  stdout.writeln('  ✓ build.gradle: API 36, minSdk 24, kiadási aláírás');
}
