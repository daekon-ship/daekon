# Mester+ – Code review (M1 lezárás előtt)

Dátum: 2026-10-03 · Hatókör: a teljes `lib/` és `test/` kód.

## Ellenőrzési környezet – mi futott és mi nem

| Ellenőrzés | Hol futott | Eredmény |
|---|---|---|
| `tool/static_check.py`: zárójelek, importok, saját nevek, YAML, fontok | felhőkörnyezet | 0 hiba |
| Nem használt importok (egyedi szkript) | felhőkörnyezet | 0 találat |
| Widget-paraméterek és osztálytagok kereszt-ellenőrzése | felhőkörnyezet | 0 valódi hiba |
| Kalkulátor-, formázó- és geometria-tesztek elvárt értékei Pythonban újraszámolva (BigInt-tel is) | felhőkörnyezet | egyezik |
| `dart run build_runner build` (Drift kódgenerálás) | **nem futott** – nincs Flutter/Dart SDK | **nálad kell futtatni** |
| `flutter analyze` | **nem futott** | **nálad kell futtatni** |
| `flutter test` | **nem futott** | **nálad kell futtatni** |
| Futtatás eszközön / emulátoron | **nem futott** | **nálad kell kipróbálni** |

A felhőkörnyezetben nincs Flutter SDK, és a pub.dev sem érhető el, ezért ezek a lépések kimaradtak.
A legnagyobb fennmaradó kockázat: a generált `app_database.g.dart` és a fordítás. Ezt csak a
`build_runner` + `flutter analyze` futtatása igazolja.

## Talált és javított hibák

### Számítási pontosság
1. **Egész-túlcsordulás nagy összegeknél.** A `részösszeg × bázispont × 2` köztes szorzat 64 biten
   átcsordulhatott (kb. 460 milliárd Ft-os részösszeg felett), és csendben hibás összeget adott.
   → `mulDivRoundHalfUp` BigInt köztes szorzattal; tartományon kívül hibát dob, nem számol rosszul.
   Pontos értékes regressziós teszt is került mellé.
2. **A sorösszeg nem volt ellenőrizhető az ajánlaton.** A díjat és az anyagot külön kerekítettük,
   így a `1,5 × (1+1) Ft` sor 4 Ft lett 3 helyett. → Sorösszeg = `round(menny × (díj+anyag))`,
   a díj külön kerekítve, az anyag a különbözet. A bontás így forintra kiadja a sor összegét. Teszt van rá.

### Hibák (crash / helytelen működés)
3. **Index-elcsúszás az ajánlat-előnézetben.** A tétellistát és az összesítőt két külön stream
   adta, és egy frissítés közben a `totals.lines[i]` RangeError-t dobhatott.
   → Az összesítő ugyanabból a listából készül, amit megjelenítünk.
4. **TextEditingController dispose a lap-záró animáció alatt** („used after being disposed”).
   → Az alsó lapok vezérlőit nem dispose-oljuk idő előtt.
5. **`ref` használata dispose-ban** (Riverpod StateError) az automatikus mentéseknél.
   → A repository-t az `initState`-ben kérjük el.
6. **Container-ben egyszerre `color` és `decoration`** (assert hiba) → a szín a decoration-be került.

### Adatvesztési lehetőségek
7. **Árazás:** a „Mentés” megnyomása nélkül elhagyott képernyőn elvesztek a beírt árak.
   → Automatikus mentés (700 ms), elhagyáskor azonnali mentés. Látható mentés-állapot.
8. **Kedvezmény/felár:** az „Alkalmaz” nélkül elveszett. → Automatikus mentés és elhagyáskor mentés.
   A „Nincs” típusra váltás az adatbázisban is nullázza a százalékot, így nem éled fel csendben. Teszt van rá.
9. **Új projekt / ügyfél / árlista-tétel űrlap:** a vissza gomb szó nélkül eldobta a kitöltött adatot.
   → `UnsavedGuard` rákérdez, mielőtt elvetné.
10. **Alsó lapok (helyiség, tétel):** egy mellé-koppintás bezárta a lapot. → Csak a bezárás gombbal
    vagy mentéssel zárul.
11. **Beállítások:** a nem mentett módosítás nem látszott. → Jelzés + a mentés gomb csak módosítás után aktív.
12. **Kiküldött ajánlat utólagos módosítása** észrevétlenül megváltoztatta az ajánlatot.
    → Figyelmeztető sáv a Tételek, az Árazás és a Kalkuláció képernyőn.

### Adatbázis-kapcsolatok
13. **Az ajánlatszám nem volt egyedi az adatbázisban.** → `UNIQUE` kényszer került rá.
14. Ellenőrizve (és tesztelve):
    - `PRAGMA foreign_keys = ON` minden megnyitáskor;
    - a projekt törlése kaszkádol, a repository explicit is törli a gyermekrekordokat;
    - projekttel rendelkező ügyfél nem törölhető (`RESTRICT` + UI ellenőrzés);
    - a helyiség törlésekor a tétel megmarad (`SET NULL`);
    - az árlista-tétel archiválódik, nem törlődik;
    - az ajánlat sorai pillanatképet tárolnak.
15. **Hosszkorlát:** a Drift `withLength(max: 200)` túl hosszú bevitelnél kivételt dobott.
    → A mezők a bevitelt az oszlop hosszára korlátozzák.

### Félkész funkció
16. **Az ajánlat érvényessége** (`validityDays`) csak az adatbázisban létezett, felület nem tartozott hozzá.
    → Választó (15/30/60/90 nap) került a Kalkuláció képernyőre, a repository 1–365 nap közé szűkít.

### Mobilos elrendezés
17. **Az ajánlat tételtáblája** 4 oszlopban tördelte a forintösszegeket 360 dp szélességen.
    → Két soros tétel: a név felül, alatta „menny × egységár … összeg”.
18. A kedvezmény-választó feliratai keskeny kijelzőn nem törnek (`FittedBox`).
19. Elavuló API-k (`RadioListTile.groupValue`, `DropdownButtonFormField.value`, Flutter 3.35+)
    lecserélve választó-chipekre, illetve saját listaelemre. A `flutter analyze` így nem jelez deprecation-t.

### Teljesítmény
20. **A family-providerek nem szabadultak fel.** Minden meglátogatott projekt streamje nyitva maradt.
    → `autoDispose`.
21. A listák lustán épülnek (`ListView.separated`, `SliverList`). A dashboard egyetlen lekérdezéssel
    összesít, nem projektenként. Offline adatmennyiségnél (néhány ezer tétel) ez bőven elég.

### Biztonság
22. Nincs hálózati forgalom, nincs titok a kódban, minden lekérdezés paraméterezett (Drift).
    Az ajánlatszám-előtag csak betű és szám lehet, ezért a `LIKE` mintában nem lehet helyettesítő karakter.
23. **Tudatos korlát, dokumentálva:** az SQLite adatbázis titkosítatlanul van az eszközön, és az
    Android automatikus mentése (Google-fiók) tartalmazhatja. Titkosítás vagy kizárás a
    szinkron/mentés mérföldkő (M2+) döntése.

## Ellenőrzött szabályok (változatlanok)

- Az egyetlen számítási forrás a `QuoteCalculator`. A dashboard, a projekt, a kalkuláció és az ajánlat is ezt hívja.
- Egész forint, half-up kerekítés. A kedvezmény az ÁFA előtt számít. A „Nincs” típus soha nem alkalmaz százalékot.
- A seed árlista kitalált árak nélkül készül: minden ár 0 Ft.
- A dashboard pipeline-ja projektenként tartalmazza a kedvezményt/felárat és az ÁFA-t. Teszt van rá.

## 2. kör (2026-10-07): új funkciók és átvizsgálásuk

Új funkciók:
- PDF árajánlat megosztással és nyomtatással;
- projekt másolása;
- keresés a projektek között;
- biztonsági mentés és visszaállítás.

Átvizsgálás közben ezekre figyeltem:
- **PDF:** ugyanazt a `totalsFor` számítást használja, mint az előnézet, így az összegek nem térhetnek el.
  A fontok beágyazottak. Mind a négy fontfájlban ellenőriztem (fontTools-szal) az alábbi karakterek meglétét:
  ő, ű, Ő, Ű, nem-törő szóköz, „−” mínuszjel, ×, ², ³. Mindegyik megvan.
  A fájlnév ékezet- és speciálisjel-mentes, így minden levelezőben átmegy.
  Hiányzó cégnévnél az app figyelmeztet.
- **Másolás:**
  - a másolat mindig piszkozat, ajánlatszám és kiküldési dátum nélkül, így nem keverhető a kiadott ajánlattal;
  - a tételek az ÚJ helyiségekre mutatnak, nem a régiekre;
  - a helyszín csak azonos ügyfélnél másolódik;
  - a művelet egyetlen tranzakció. Teszt van rá.
- **Mentés/visszaállítás:**
  - a fájlt teljesen ellenőrzi, mielőtt az adatbázishoz nyúlna;
  - a csere egy tranzakcióban történik;
  - van méretkorlát (50 MB);
  - egy újabb app-verzió mentését elutasítja.
  - Javított hiba: a nyitva hagyott Beállítások-űrlap visszaállítás után a régi cégadatot visszaírta volna.
    Most visszaállítás után az űrlap újraépül.
  - Oda-vissza teszt (összeg-egyezéssel) és hibás-fájl tesztek készültek hozzá.
- **Tipográfia:** a túl nagy címsor- és számméreteket mérsékeltem:
  - display 30 → 24;
  - nagy összeg 28/32 → 22/24;
  - cím 22 → 19.

Új külső csomagok: `pdf`, `printing`, `file_picker`. Ezek verzió-feloldását csak a `flutter pub get` igazolja nálad.

## 3. kör (2026-10-07 este): javítások

1. **Ajánlatszám újrafelhasználása.** Ha a legutóbb kiküldött ajánlat projektjét törölted, a következő ajánlat
   ugyanazt a számot kapta. Így kint két különböző PDF keringhetett azonos számmal.
   → A cégprofilban monoton növekvő számláló van. Ez az adatbázis 2-es sémaverziója, migrációval
   (`addColumn`). A régi (v1) biztonsági mentés is visszaállítható. Mindkettőre van teszt.
2. **Árlista felülírása egyedi árral.** Egy ügyfélnek alkudott ár alapértelmezésként az árlistát is felülírta.
   → Az árlista alapból csak akkor frissül, ha a tételnek még nem volt ára. Az alapértéket az app a szerkesztő
   létrehozásakor rögzíti, így gépelés közben nem vált át csendben.
3. **Elavult mennyiség a helyiség-méret pontosítása után.** → Az a tétel, amely pontosan a régi padló-,
   fal- vagy kerület-értéket vette át, az új méretre frissül. A kézi mennyiségekhez az app nem nyúl, csak jelzi őket. Van rá teszt.
4. **Félrevezető törlési megerősítés.** Ha a lista még töltődött, „0 helyiség, 0 tétel” jelent meg.
   → Ilyenkor általános szöveg jelenik meg.

Nem ellenőrzött: a v1 → v2 migrációt valódi régi adatbázison csak nálad lehet kipróbálni.
Ehhez telepítsd a v0.2-t, hozz létre adatot, majd telepítsd a v0.3-at felülírással.

## 4. kör (2026-10-07 éjjel): mobil és Play Áruház

**Javított hiba.** A tétel-, helyiség- és alapadat-szerkesztő panelek a megnyitó listaelem `ref`-jét használták.
Ha a listaelem a panel nyitva tartása alatt újraépült vagy eltűnt, a mentés vagy a törlés kivételt dobott.
→ A repository-t a panel megnyitásakor kéri el az app.

**Mobilra optimalizálás:**
- edge-to-edge megjelenítés (az Android 15+ kötelezővé tette), átlátszó rendszersávok;
- a rendszer-betűméretet az app 1,3×-ig követi, e fölött a pénzösszeg-sorok már nem férnének el;
- tableten, fekvő módban és Chromebookon a tartalom legfeljebb 640 dp széles, középre igazítva.
  Az Android 16 nagy kijelzőn figyelmen kívül hagyja az álló tájolás rögzítését, ez a keret ezt is kezeli.

**Play-kiadás:**
- app-ikon: adaptív és monokróm (téma-ikon);
- Android 12+ indítóképernyő;
- target/compile SDK 36, min SDK 24;
- kiadási aláírás kulccsal (`release.bat`), AAB build;
- adatlap-szövegek, adatvédelmi tájékoztató, Data safety válaszok, kiemelt grafika, képernyőképek.

**Nem ellenőrzött (Flutter nélkül nem futtatható):**
- a `flutter_launcher_icons` és a `flutter_native_splash` generálás;
- az `android_release_setup.dart` a te gépeden generált Gradle-fájlon.
  A Python-másolatát a jelenlegi Flutter-sablonon kipróbáltam, a kimenet helyes.
  Ha a sablon eltér, a szkript érthető hibaüzenettel leáll, és nem ront el semmit.

## 5. kör (2026-10-07): Play-kiadás előtti átnézés

- **Nyers technikai hibaüzenetek** (pl. `SqliteException(...)`, angol `ArgumentError`) jutottak a felhasználó elé.
  → Saját `UserInputError` a magyar, felhasználónak szóló hibákra. Minden más hibánál érthető mondat jelenik meg,
  a részletek a naplóba kerülnek (`friendlyError`).
- **Gépies szövegek:** az appon belüli üzenetek, az áruházi adatlap, a kiemelt grafika és az adatvédelmi tájékoztató
  újraírva rövid, köznapi mondatokkal.
- **Ikon:** a plusz jel nagyobb lett. Az adaptív ikon és az indítóképernyő a biztonsági zónán belül maradt (ellenőrizve).
- **Csomagverziók:** a `file_picker` tartománya bővült (8.1.7 – 10.x). A feloldó a gépeden a Fluttereddel kompatibilis
  legújabbat választja. A többi csomagnál a meglévő `^` tartomány ezt már biztosítja.

## 6. kör (2026-10-07): teljes átolvasás, API-ellenőrzés a valódi forrásokon

**Ellenőrzés:**
- A sandboxban nincs Dart-fordító, ezért a felhasznált **Flutter 3.35.5** keretrendszer-API-kat és a csomag-API-kat
  a csomagok saját GitHub-forrásában néztem meg. Az összes hívott osztály, paraméter és metódus létezik.
- Ellenőrzött csomagok: drift 2.26, riverpod 2.6.1, go_router 14.8.1, pdf/printing, file_picker 10.3, url_launcher.
- Valódi fordítás: a `daekon` repóba került GitHub Actions munkafolyamat minden push után lefuttatja
  a `flutter analyze`, a `flutter test` és a `flutter build appbundle` parancsot.

**Javított hibák:**
- **Szám nélküli PDF kiküldése.** A PDF-et ki lehetett küldeni „tervezet” felirattal, ajánlatszám nélkül.
  → A fő gomb „Ajánlat küldése PDF-ben”: előbb kiosztja a számot, aztán a már számozott PDF-et küldi.
  A cégadat-ellenőrzés a számkiosztás előtt fut, így nem maradhat kiküldöttnek jelölt, de el nem küldött ajánlat.
- **Rossz betűrend.** Az SQLite NOCASE csak az angol ábécét ismeri, így az „Ádám” a „Zsolt” mögé került.
  → Magyar betűrend az ügyfeleknél és az árlistánál. Teszttel együtt.
- **Kezeletlen aszinkron hiba** a képernyő elhagyásakor indított mentésnél → elkapva és naplózva.
- **Egy hibás projekt** (tartományon kívüli összeg) az egész áttekintést hibára futtatta → most csak azt az egyet hagyja ki.
- **Görgethetetlen „nincs adat” képernyők** kis kijelzőn → görgethetők.
- **Kártyákon kilógó koppintás-hullám** → a kártya vágja.

**Új funkciók:**
- **Teendők az áttekintésen:** lejárt ajánlat, 7 napon belül lejáró ajánlat, ár nélküli tétel.
- **Következő lépés a projekten:** „Elfogadta / Nem kérte”, „Munka elkezdve”, „Munka befejezve”, és az érvényesség kijelzése.
- **Hívás és e-mail** egy koppintással az ügyfél adatlapjáról.
- **Ezres tagolás gépelés közben** a forintmezőkben, helyes kurzor- és törléskezeléssel. Teszttel.
- Az e-mail és az adószám formátumát a Beállítások ellenőrzi. A verziószám egy helyen van, teszt figyeli.

**Látványterv és képernyőképek:** az új funkciók szerint frissítve.
Javítva benne: az árajánlat képén korábban 4 tétel látszott, a végösszeg viszont 8 tételből jött ki.

## Ismert korlátok (nem hibák, a terv része)

- A web platform kimarad, mert a Drift webes futtatása külön beállítást igényel.
- A DB-tesztekhez natív SQLite kell. Windows-on `sqlite3.dll` nélkül a csoport indoklással kimarad (ld. README).
