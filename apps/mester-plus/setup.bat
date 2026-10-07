@echo off
chcp 65001 >nul
setlocal
echo === Mester+ telepites ===
where flutter >nul 2>nul || goto :noflutter

echo [1/7] Platform mappak (android, windows)...
call flutter create . --project-name mester_plus --org hu.mesterplus --platforms android,windows || goto :err
if exist test\widget_test.dart del test\widget_test.dart

echo [2/7] Csomagok letoltese...
call flutter pub get || goto :err

echo [3/7] Adatbazis kod generalasa (Drift)...
call dart run build_runner build --delete-conflicting-outputs --force-jit || goto :err

echo [4/7] App ikon es inditokepernyo...
call dart run flutter_launcher_icons || goto :err
call dart run flutter_native_splash:create || goto :err

echo [5/7] Android kiadasi beallitasok (nev, API 36, alairas)...
call dart run tool/android_release_setup.dart || goto :err

echo [6/7] Statikus elemzes...
call flutter analyze

echo [7/7] Tesztek...
call flutter test || goto :err

echo.
echo KESZ. Inditas: flutter run   (asztali gepen: flutter run -d windows)
echo Play Aruhazhoz: release.bat
pause
exit /b 0

:noflutter
echo HIBA: a Flutter nincs telepitve vagy nincs a PATH-ban.
echo Telepites: https://docs.flutter.dev/get-started/install/windows
pause
exit /b 1

:err
echo.
echo HIBA tortent - masold be a fenti kimenetet Claude-nak.
pause
exit /b 1
