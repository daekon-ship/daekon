#!/usr/bin/env bash
set -e
echo "=== Mester+ telepítés ==="
command -v flutter >/dev/null || { echo "HIBA: Flutter nincs telepítve."; exit 1; }
flutter create . --project-name mester_plus --org hu.mesterplus --platforms android,macos
rm -f test/widget_test.dart
flutter pub get
dart run build_runner build --delete-conflicting-outputs --force-jit
dart run flutter_launcher_icons
dart run flutter_native_splash:create
dart run tool/android_release_setup.dart
flutter analyze || true
flutter test
echo "KÉSZ. Indítás: flutter run"
