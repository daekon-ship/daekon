# Mester+ – biztonság

Az app offline, minden adat a készüléken van. Ez a fájl leírja, mi védi az adatokat, és mit ellenőriz a gép minden változásnál.

## Mi védi az adatokat

| Réteg | Megoldás |
|---|---|
| Adatbázis a lemezen | **SQLCipher** (AES-256-CBC, HMAC-SHA512, oldalanként). A fájl kulcs nélkül olvashatatlan. |
| A titkosító kulcs | 32 bájt kriptográfiai véletlen, az első indításkor készül. Az **Android Keystore** által védett biztonságos tárolóban van (`flutter_secure_storage`), az app aláírásához kötve. Nem kerül mentésbe, naplóba, képernyőre. |
| Hozzáférés az apphoz | Opcionális **PIN-zár** (4–8 számjegy). Csak sózott PBKDF2-HMAC-SHA256 kivonat tárolódik (60 000 kör). 5 hibás próba után növekvő várakozás (10 s → 5 perc). Indításkor és 2 perc háttér után kér PIN-t. |
| Felhős mentés | `android:allowBackup="false"`: a Google automatikus mentése és az eszközátvitel **nem** viszi az app adatait. A kézi, beépített mentés a hivatalos út. |
| Hálózat | Nincs `INTERNET` engedély. A kész csomagot a CI ellenőrzi. |
| Biztonsági mentés fájl | Visszaállítás előtt teljes ellenőrzés: formátum, verzió, hivatkozások, azonosítók, összeghatárok, dátumsorrend. Egy tranzakció: hibánál a meglévő adat marad. 50 MB-os méretkorlát. A fájl **titkosítatlan** (hogy telefoncserénél kulcs nélkül is használható legyen), ezért a felhasználót figyelmeztetjük, hol tárolja. |
| Bevitel | Minden szám tartományhatáros (max. 99 999 999 Ft/egység, 999 999 mennyiség, 999 999 999 Ft befizetés), a szorzatok BigInt-ben. Szövegmezők hosszkorláttal az adatbázis-oszlopokhoz igazítva. Minden lekérdezés paraméterezett (Drift). |
| Fájlnevek | A PDF fájlneve csak `[A-Za-z0-9-_]`, max. 70 karakter: nincs útvonal-beszúrás. |
| Hibaüzenetek | A felhasználó soha nem lát nyers kivételt vagy SQL-hibát (`friendlyError`). |

## Mit ellenőriz a CI minden változásnál

- `flutter analyze`, `flutter test` (benne: PIN-kivonat ismert tesztvektorral, kulcs-formátum, 500 fuzz-rongált mentési fájl, fájlnév-szűrés, pénzügyi határok).
- A kész AAB-ban: nincs `INTERNET` engedély, `allowBackup="false"`, SQLCipher natív könyvtár jelen van, minden `.so` 16 KB-igazított.
- `osv-scanner` a `pubspec.lock`-on: ismert sérülékenységű csomag esetén a futás piros.

## Tudatos korlátok

- **Képernyőkép-tiltás** (`FLAG_SECURE`) nincs: a szaki gyakran képernyőképet küld az ajánlatról. Kérésre bekapcsolható.
- **Elfelejtett PIN**: nincs visszaállítás, ez szándékos. Újratelepítés + mentés visszatöltése.
- **Rootolt készülék**: a Keystore-ból a kulcs elvileg kinyerhető; ez minden Android-appra igaz.
- **Biometria**: nincs, a PIN determinisztikus és minden készüléken ugyanúgy működik. Később bővíthető.

## Hibajelentés

Biztonsági hibát a daekonxaxa@gmail.com címre jelezz, ne nyilvános issue-ban.
