# Mester+

Árajánlat- és projektkezelő magyar szakiknak (burkoló, kőműves és rokon szakmák).
Offline-first: minden adat a készüléken, SQLite-ban tárolódik.

## Előfeltételek

- Flutter SDK **3.38 vagy újabb** (Dart 3.10: a titkosított adatbázis build-hookjai, Play API 36, 16 KB): https://docs.flutter.dev/get-started/install/windows
- Git
- Futtatáshoz az alábbiak egyike:
  - Android telefon USB-hibakereséssel,
  - Android emulátor (Android Studio),
  - Windows asztali futtatás (Visual Studio „Desktop development with C++” csomaggal).
- Ellenőrzés: `flutter doctor`

## Telepítés (Windows, Asztal\APPOK mappába)

```bat
cd %USERPROFILE%\Desktop\APPOK
git clone https://github.com/daekon-ship/mester-plus.git
cd mester-plus
setup.bat
```

Ha az Asztal OneDrive-ban van, akkor ezzel lépj a mappába: `cd %USERPROFILE%\OneDrive\Asztal\APPOK`.

A `setup.bat` lépései:
1. `flutter create .` – létrehozza a platform-mappákat (android, ios, windows, macos). A meglévő fájlokhoz nem nyúl.
2. `flutter pub get` – letölti a csomagokat.
3. `dart run build_runner build --delete-conflicting-outputs --force-jit` – legenerálja az adatbázis-kódot (`*.g.dart`). A `--force-jit` azért kell, mert a titkosított adatbázis build-hookot használ, amit a build_runner AOT-fordítója még nem támogat.
4. `flutter analyze` – statikus elemzés.
5. `flutter test` – unit és adatbázis-tesztek.

macOS/Linux alatt ugyanezt a `./setup.sh` végzi.

## Kiadás a Play Áruházba

```bat
release.bat
```

Első futtatáskor létrehozza a feltöltési kulcsot, majd elkészíti az `app-release.aab` fájlt.
A Play Console beállításai, az adatlap-szövegek és a 12 fős zárt teszt menete: **`docs/PLAY_STORE.md`**.
Az áruházi anyagok a `store/` mappában vannak: ikon, kiemelt grafika, képernyőképek, leírás, adatvédelmi tájékoztató.

## Indítás

```bat
flutter run              :: csatlakoztatott telefon / emulátor
flutter run -d windows   :: asztali Windows-alkalmazás
```

## Adatbázis-tesztek Windows-on

A `test/database_test.dart` natív SQLite-ot használ. Windows-on ez alapból nincs a PATH-on, ezért
ott a teszt-csoport indoklással kimarad, de nem bukik el. Ha futtatni szeretnéd:
1. Töltsd le a „Precompiled Binaries for Windows” 64 bites DLL csomagot a https://sqlite.org/download.html oldalról.
2. A `sqlite3.dll` fájlt másold a projekt gyökerébe.
3. Futtasd újra: `flutter test`.

## Mit tud (M1)

A teljes folyamat:
1. Ügyfél → Új projekt.
2. **Felmérés:** helyiségek, méretek cm-ben. A padló, a kerület és a falfelület a nyílászárók levonásával automatikusan számolódik.
3. **Munkatételek:** saját árlistából vagy egyedileg. A mennyiség egy érintéssel átvehető a felmérésből.
4. **Saját árazás:** munkadíj és anyag egységáron, automatikus mentéssel. Kérésre az árlista is frissül.
5. **Kalkuláció:** kedvezmény vagy felár, ÁFA (27% / 5% / 0%), az ajánlat érvényessége.
6. **Árajánlat:**
   - előnézet és ajánlatszám, kiküldöttnek jelölés;
   - **PDF megosztás** (e-mail, Viber, Drive…) és **nyomtatás** A4-ben;
   - másolás szövegként.

További részek:
- **Projekt másolása:** egy korábbi munka helyiségei, tételei és árai egy új piszkozatba kerülnek, ugyanannak vagy másik ügyfélnek.
- **Keresés** a projektek között: projektnév, ügyfél, cím vagy ajánlatszám alapján.
- **Biztonsági mentés és visszaállítás** (Beállítások → Adatmentés): egyetlen JSON fájl, amit Drive-on, e-mailben vagy pendrive-on tárolhatsz.
- Áttekintés: a nyitott és a megnyert ajánlatok bruttó értéke.
- Ügyfelek: keresés, projektek, törlésvédelem.
- Árlista: kategóriák, archiválás.
- Beállítások: cégadatok, alapértelmezett ÁFA, ajánlatszám-előtag, lábléc.

## Pénzügyi szabályok

- Minden összeg **egész forint** (`int`). A mennyiség ezredrészben, a százalék bázispontban tárolódik.
- Egyetlen számítási forrás van: `lib/domain/quote_calculator.dart`.
- Sorösszeg = `round(mennyiség × (díj + anyag))`, half-up kerekítéssel. Ezután jön a kedvezmény/felár a nettóra, majd az ÁFA.
- A köztes szorzatok BigInt-ben készülnek, így nincs túlcsordulás.
- Az árlista **nem tartalmaz kitalált árakat**: a seed tételek ára 0 Ft.
- Az ajánlat sorai pillanatképet tárolnak, így az árlista későbbi módosítása a meglévő ajánlatot nem írja át.

## Szerkezet

```
lib/
  core/      téma (tokenek, tipográfia), navigáció, közös widgetek
  data/      Drift adatbázis, repository-k, Riverpod providerek
  domain/    kalkulátor, formázás, felmérési geometria, enumok
  features/  képernyők (dashboard, projects, customers, prices, settings)
test/        kalkulátor, formázás, geometria és adatbázis-tesztek
tool/        static_check.py – SDK nélküli statikus ellenőrző
docs/        CODE_REVIEW.md – a legutóbbi teljes átvizsgálás eredménye
```

## Statikus ellenőrző (Flutter nélkül is fut)

```bat
python tool\static_check.py
```

Mit ellenőriz:
- zárójel-egyensúly,
- importok és `part` fájlok feloldása,
- a projekt saját osztály- és függvénynevei,
- a YAML fájlok szintaxisa,
- a pubspec-ben megadott fontfájlok megléte.

A `flutter analyze` futtatását nem helyettesíti.

## Biztonsági mentés

Minden adat csak a készüléken van, ezért rendszeresen készíts mentést: **Beállítások → Adatmentés → Mentés készítése**.
- A visszaállítás előbb az egész fájlt ellenőrzi: formátumot, verziót, hivatkozásokat, ismétlődő azonosítókat és ajánlatszámokat.
- A cserét egyetlen tranzakcióban végzi. Hibás fájlnál a meglévő adat érintetlen marad.
- A visszaállítás a készüléken lévő adatokat **teljesen lecseréli**, erre az app előtte rákérdez.

## Ismert korlátok

- A web platform nem támogatott (a Drift webes beállítása külön lépés).
- Az adatbázis titkosítatlan a készüléken. A mentés és a szinkron egy későbbi mérföldkő témája.
