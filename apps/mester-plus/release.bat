@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
echo === Mester+ Play Aruhaz kiadas (AAB) ===
where flutter >nul 2>nul || (echo HIBA: Flutter nincs a PATH-ban. & pause & exit /b 1)
if not exist android\app (echo HIBA: elobb futtasd a setup.bat-ot. & pause & exit /b 1)

if exist android\key.properties goto :build

echo.
echo Meg nincs feltoltesi kulcs. Most letrehozzuk.
echo A kulcsfajl helye: %USERPROFILE%\mester_plus_upload.jks
echo FONTOS: ezt a fajlt es a jelszot orizd meg (pl. jelszokezelo + pendrive),
echo ezzel tudsz kesobb frissitest feltolteni.
echo.

set "KEYTOOL="
for /f "delims=" %%K in ('where keytool 2^>nul') do if not defined KEYTOOL set "KEYTOOL=%%K"
if not defined KEYTOOL if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\keytool.exe" set "KEYTOOL=%ProgramFiles%\Android\Android Studio\jbr\bin\keytool.exe"
if not defined KEYTOOL if exist "%ProgramFiles%\Android\Android Studio\jre\bin\keytool.exe" set "KEYTOOL=%ProgramFiles%\Android\Android Studio\jre\bin\keytool.exe"
if not defined KEYTOOL (
  echo HIBA: a keytool nem talalhato. Telepitsd az Android Studio-t, vagy add a PATH-hoz a Java bin mappajat.
  pause & exit /b 1
)

:askpass
set "KSPASS="
set /p "KSPASS=Adj meg egy jelszot a kulcshoz (legalabb 6 karakter, csak betu es szam): "
if "!KSPASS!"=="" goto :askpass
if "!KSPASS:~5,1!"=="" (echo Tul rovid. & goto :askpass)

"!KEYTOOL!" -genkeypair -v -keystore "%USERPROFILE%\mester_plus_upload.jks" -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload -storepass "!KSPASS!" -keypass "!KSPASS!" -dname "CN=Mester+, C=HU"
if errorlevel 1 (echo HIBA: a kulcs letrehozasa nem sikerult. & pause & exit /b 1)

set "STOREPATH=%USERPROFILE:\=/%/mester_plus_upload.jks"
(
  echo storePassword=!KSPASS!
  echo keyPassword=!KSPASS!
  echo keyAlias=upload
  echo storeFile=!STOREPATH!
) > android\key.properties
echo Kulcs letrehozva, android\key.properties kitoltve (ez NEM kerul a git-be).

:build
echo.
echo Beallitasok ellenorzese...
call dart run tool/android_release_setup.dart || (pause & exit /b 1)
echo Tesztek...
call flutter test || (echo HIBA: a tesztek nem futottak le hibatlanul, a kiadas leallt. & pause & exit /b 1)
echo AAB keszitese...
call flutter build appbundle --release || (pause & exit /b 1)
echo.
echo KESZ: build\app\outputs\bundle\release\app-release.aab
echo Ezt toltsd fel a Play Console-ba (Teszteles / Belso teszteles -^> Uj kiadas).
echo Reszletes lepesek: docs\PLAY_STORE.md
pause
exit /b 0
