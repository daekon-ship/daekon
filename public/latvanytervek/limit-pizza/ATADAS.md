# Limit Pizza Házhozszállítás — látványterv, átadás

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/limit-pizza/
**Mappa:** `public/latvanytervek/limit-pizza/`
**Kör:** 3. kör (2026.11.08.): rendelési rendszer és iPades konyhai admin, teljes audit. Lásd lent a „3. kör — végső auditjelentés” részt. Az 1. és 2. kör ugyanaznap készült. A korábbi, olaszos irányú tervet az ügyfél 2026.09.07-én elutasította; ez nulláról készült, a régi tervet nem használja.
**Állapot:** bemutató, `noindex`. Az online rendelés és az admin felület demó: semmi nem kerül elküldésre, személyes adatot nem kér (a mezők rögzített minta adatok), fizetést nem indít.
**Admin demó:** https://daekon-ship.github.io/daekon/latvanytervek/limit-pizza/admin.html

## 3. kör — végső auditjelentés (2026.11.08.)

**Röviden:** a bemutató az ügyfélnek biztonságosan megmutatható. A két fülön (vevő + konyha) végigjátszható: pizza → feltétek → kosár → adatok → bemutató-rendelés → hangjelzés a konyhán → elfogadás idővel → a vevő látja, hogy elfogadták. A demó jellege mindenhol jelölve van. Valódi rendelés, adat vagy fizetés sehol nem keletkezik. Mind a 44 automata teszt sikeres.

Az ügyfél helyzete: kétfős, csak házhozszállító pizzéria. A rendszer ezért a terhelés kezelésére épül: egy koppintással szüneteltethető a rendelésfelvétel, állítható a várható idő, tiltható, ami elfogyott, és egyetlen beérkező rendelés sem tűnhet el észrevétlenül. Asztalfoglalás, helyben fogyasztás és asztaltérkép nincs a tervben.

### Hibajegyzék — amit az audit talált, és mi lett vele

| # | Hiba (2. kör állapota) | Javítás |
|---|---|---|
| 1 | A „Rendelést fogadunk” kapcsoló csak a feliratot váltotta | Valódi közös állapot (`js/demo-store.js`). Szünetben a vevői oldal sávot mutat, a továbblépés és a leadás tiltott, a kosár megmarad. |
| 2 | Új rendelésre csak egyszeri csipogás volt | Ismétlődő riasztás 2,6 mp-enként, amíg minden új rendelést el nem fogadtak vagy el nem utasítottak. Mellé villogó sáv és fülcím-jelzés. |
| 3 | Elfogadáskor nem lehetett időt megadni | Elfogadó lap: 15 / 20 / 30 / 45 / 60 perc vagy egyedi (5–180). A vevő a saját fülén látja. |
| 4 | Kiszállítási idő beállítás nem volt | 30–45 / 45–60 / 60–90 / 90–120 perc vagy egyedi (10–240, ellenőrzött). A vevői oldalon „becsült idő, nem garantált” jelöléssel jelenik meg. |
| 5 | Elfogyott csak pizza lehetett, feltét nem | Pizza, plusz és extra feltét egyenként tiltható. A konfigurátorban a tiltott opció nem választható, és a nyitott ablak is azonnal frissül. |
| 6 | A heróban lévő pizzafotóra kattintva az elfogyott pizza is megnyílt | A hero tányérok is tiltva vannak. |
| 7 | A kosárban lévő, közben elfogyott tétel nem volt kezelve | A tétel jelölve van, a továbblépés tiltott; törlés után folytatható. |
| 8 | Sérült `localStorage` adatnál összeomolhatott (ismeretlen pizza-azonosító) | Betöltéskor a kosár, a beállítások és a rendelések is ellenőrzöttek; csak érvényes tétel marad. |
| 9 | Gyors dupla kattintás duplán adhatott le rendelést | Zárolás a leadásnál és a „Kosárba” gombnál. Tesztelve: egy rendelés, egy darab. |
| 10 | „Elküldve” felirat a demó végén | „Bemutató vége — Valódi rendelés nem történt.”, mellette élő konyhai állapot. |
| 11 | A sikeres oldal nem volt görgethető, ha magas volt (alsó gombok elérhetetlenek) | A panel görgethető. |
| 12 | Fülek között a BroadcastChannel üzenet megelőzhette a tárolt adatot (egy lépés késés) | Elsődleges jelzés a `storage` esemény; a BroadcastChannel késleltetett újraolvasást vált ki. |
| 13 | Az admin csak a láblécből volt elérhető | Külön szakasz a főoldalon: „Nézd meg, hogyan érkezik meg a rendelés a konyhába” (+ mobilmenü, lábléc, kosár vége). |
| 14 | „Dupla adag” (már rajta lévő feltét extrában) árát a terv eldöntötte | Az étlap extra árával számol, de „felára egyeztetendő” jelölést kap a konfigurátorban, a kosárban és a blokkon. |
| 15 | Konyhai blokk: nem volt előnézet; az elhagyott feltét nem tűnt ki | Előnézet a képernyőn. „— NÉLKÜLE:” kiemelve, plusz/extra/megjegyzés külön sorban, a mintaadat és a „BEMUTATÓ — NEM ÉLES” jelölve. |
| 16 | Admin iPadre kicsi és sűrű | Nagy, legalább 48 px-es, a fő műveleteknél 62–84 px-es gombok. iPad fekvőben a rendelés balra, a döntés (összeg + Elfogadás) jobbra, mindig látható. |
| 17 | Kis telefonon (320–360 px) az admin új rendelés kártyája kilógott | Javítva, ellenőrizve. |

### Mi működik ténylegesen (a bemutatóban, valódi kóddal)

- **Étlap:** mind a 19 pizza, 6 üdítő, a feltétek és a díjak a `data/menu.json`-ból.
- **Konfigurátor:**
  - eltávolítás, plusz feltét (350 Ft), extra feltét (550 Ft);
  - darabszám, megjegyzés;
  - azonnali ár, és módosítás a kosárból.
- **Kosár:**
  - mennyiség, törlés;
  - település szerinti díj (külön sorban);
  - 2000 Ft-os minimum, 5 pizzás ajándék jelzése.
- **Szüneteltetés, várható idő, elfogyott termékek:** a beállítás ugyanabban a böngészőben azonnal hat a vevői oldalra, és újratöltés után is megmarad.
- **Konyha:**
  - új rendelés kártyája, ismétlődő riasztás;
  - elfogadás idővel, elutasítás megerősítéssel és indokkal;
  - állapotok: Készül → Úton → Kiszállítva;
  - elutasítottak listája, blokk-előnézet.

### Mi működik csak a demóban (és miért)

- A vevő és a konyha **csak ugyanazon a böngészőn belül, két fül között** kommunikál (`localStorage` + `storage` esemény + BroadcastChannel). A vendég telefonja és a konyhai iPad között ez nem működik, és a demó nem is állítja.
- A szállítási adatok rögzített minta adatok (Minta Vendég, +36 30 000 0000). Valódi adat nem adható meg, és nem tárolódik.
- A „Próbarendelés érkezik” gomb minta rendelést hoz létre, hogy egyetlen eszközön is bemutatható legyen a riasztás.

### Mihez kell valódi backend (élesítéskor)

- Rendelések fogadása és tárolása szerveren (adatbázis), a vendég és a konyha közötti valós idejű kapcsolat.
- A konyhai felület bejelentkezéssel (jelszó vagy PIN), a nyilvános demóban ilyen nincs.
- Visszaigazolás a vendégnek (e-mail vagy SMS), és a rendelés állapotának követése a vendég eszközén.
- A beállítások (szünet, idő, elfogyott termékek) központi tárolása.
- Adatkezelési tájékoztató, ÁSZF, impresszum, valamint a személyes adatok kezelése (GDPR).
- Riasztás háttérben vagy lezárt kijelzőnél: push-értesítés (Web Push, iPadOS 16.4+ esetén csak főképernyőre tett webappként) vagy natív alkalmazás. A böngészős hang erre **nem garantált**.

### Hang és riasztás az iPaden — korlátok

- A hang csak koppintás után indulhat. Ezért van a „Hang bekapcsolása” gomb, a teszthang, és a riasztó sávban a figyelmeztetés: „A hang nincs bekapcsolva — koppints ide”.
- Előtérben, bekapcsolt kijelzővel működik. Ha a Safari háttérbe kerül vagy a kijelző lezár, a hang leállhat; visszatéréskor a felület megpróbálja újraindítani.
- Ahol a böngésző támogatja, a felület kéri, hogy a kijelző ne aludjon el (Screen Wake Lock). Ha ez nem érhető el, a felület kiírja.
- Ezek **csak Chromium-emulációban** lettek tesztelve (a hangjel ismétlődése az oszcillátorhívások számlálásával). Valódi iPaden nem volt hardverteszt.

### Nyomtatás — korlátok

- **Kész:** 80 mm-es blokk-elrendezés, előnézettel; a „Nyomtatás” a böngésző nyomtatási párbeszédét nyitja meg.
- **Nem kész:** az automatikus, kattintás nélküli nyomtatás. Ezt konkrét nyomtatóval kell ellenőrizni, és a nyomtató típusától függ:
  - **AirPrint-képes blokknyomtató:** iPadről a megosztás/nyomtatás menüből megy, de minden blokknál kell egy koppintás.
  - **Gyártói SDK-val vagy felhős nyomtatással rendelkező nyomtatók** (pl. Epson TM sorozat ePOS-szal, Star CloudPRNT): automatikus nyomtatást ezek tudnak, de backend vagy natív alkalmazás kell hozzá.
  - **Bluetooth-os olcsó blokknyomtatók:** böngészőből iPaden általában nem érhetők el.
- A nyomtató típusát és árát a terv nem találja ki — egyeztetendő.

### Tesztjelentés (3. kör)

- **Automata végponttól végpontig tesztek:** `_forras/tesztek/e2e.py` (Playwright, Chromium). 44/44 sikeres, 1440 és 390 px-en:
  - **T1:** Magyaros, lilahagyma nélkül, +gomba, +bacon, 2 db = 9100 Ft
  - **T2:** + 1,75 l Cola, Sajtoskál = 10 900 Ft (szállítás külön sorban)
  - **T3:** elfogyott pizza (lista, hero, kosár)
  - **T4:** elfogyott feltét (nyitott ablakban is)
  - **T5:** szünet (kosár és adatok lépés, a kosár megmarad)
  - **T6:** várható idő (előre beállított, egyedi, hibás érték elutasítva)
  - **T7:** riasztás → elfogadás → leáll
  - **T8:** újabb rendelés új riasztást indít, több új külön látszik
  - **T9:** elutasítás csak megerősítéssel (Mégse és Esc nem utasít el)
  - **T10:** a blokk tartalmazza az összes módosítást
  - **T11:** mobilmenü, modalok, kosár
  - **T12:** újratöltés, két fül, sérült adatok, üres kosár, dupla kattintások
  - konzolhiba nincs
- **Elrendezés:** `_forras/tesztek/layout.py`.
  - Vevői oldal és admin 320 · 360 · 390 · 430 · 768 · 1024×768 (iPad fekvő) · 1024×1366 (iPad Pro álló) · 1440 · 1920 px-en.
  - Vízszintes túlcsordulás nincs, 36 px-nél kisebb gomb nincs, konzolhiba nincs.
- **Nem ellenőrzött:**
  - valódi iPad vagy iPhone (Safari) hardveresen;
  - valódi blokknyomtató;
  - Lighthouse-mérés;
  - teljes képernyőolvasós bejárás.

## 2. kör változásai (2026.11.08.)

- **Fotók csak a heróban.** Az étlaplistából kikerültek a képek; minden pizza egységesen sorszámkört kap.
- **A gyűrű a pizzára illeszkedik.** A három fotóból a pizza saját körvonala mentén kivágott, enyhén kerekre igazított (perspektíva-korrekció: 1,5–7,5%) változat készült (`_forras/feldolgozas/tanyer.py`). A kép középpontja a pizza középpontja, így a gyűrű pontosan koncentrikus. A betonháttér helyett fehér alapon, valódi árnyékkal ül.
- **Teljes felbontás.** Kivágások 360 / 720 / 1080 px és a forrás teljes felbontása (~1470–1520 px), `srcset`-tel — retina kijelzőn is éles.
- **Finom tónusjavítás:** enyhe melegítés, vibrance (+16% a fakóbb színeken), lágy S-görbe, enyhe élesítés. Generatív/AI eszköz nincs, semmi nem került a képre, ami az eredetin nincs rajta.
- **Facebook és Instagram** a heróban („Kövess minket”), a mobilmenüben, a kapcsolat szakaszban (kártyák) és a láblécben.
- **Online rendelés demó** (az ügyfél 2026.09.06-i kérése alapján: pizzára kattintva alap feltétek elvétele, plusz feltét felárral, megjegyzés, minden költség látható): Kosár → Szállítási adatok → Kész. A végén „Bemutató — valódi rendelés nem történt.”, és egy gomb, ami megmutatja a rendelést a konyhai felületen.
- **Admin (konyha) demó — `admin.html`:** beérkező rendelések négy állapotban (Új → Készül → Úton → Kiszállítva), elutasítás megerősítéssel, konyhai cetli nyomtatása (80 mm-es blokknyomtatóra méretezve), mai összesítő, hangjelzés új rendelésre (bekapcsolható), „Rendelést fogadunk” kapcsoló, és **Étlap · elérhetőség**: amit itt „Ma elfogyott”-ra állítanak, az a weboldalon azonnal szürkén jelenik meg, és nem rendelhető. A weboldalról küldött demó rendelés egy másik fülön nyitott adminban azonnal megjelenik (ugyanabban a böngészőben). Négy „minta” rendelés az étlap valódi áraival számolva.

## Ügyfélkérés → megoldás

| Kérés (2026.09.07.) | Ahogy a terv kezeli |
|---|---|
| A logó marad | Az eredeti PNG-ből készült, pixelre változatlan kivágás. Csak a fehér háttér lett átlátszó (szín-alfa), újrarajzolás nincs. |
| Az étlap marad | Az eredeti étlap külön nézetben, változatlanul megnyitható („Az eredeti étlap” gomb). A digitális étlap ugyanazt a szerkezetet követi: sorszám, kondenzált kapitális név, pontozott vezetővonal, ár, piros feltétsor. |
| Az arculat marad | Fekete–fehér–piros paletta a logóból és az étlapról mintázva; ritkított kapitális címkék, mint a logón és a „NYITVATARTÁS” felíraton. |
| Nem olasz pizzéria | Nincs zászló, trattoria-hangulat vagy olasz eredettörténet. A szöveg az étlap saját mondatára épül: „kézzel nyújtott, helyben sütött, saját recept alapján”. |
| Rendelés ma csak telefonon (étlap) | A hívás mindenhol elérhető (`tel:`). Az online rendelés bemutató (az ügyfél 2026.09.06-i kérése, Black Angel-minta): a végén „Valódi rendelés nem történt.”, és a telefonos rendelés mellette marad. |

## Három irány, és amit választottunk

1. **„Az étlap, digitálisan”** (ezt választottuk): fehér papír, fekete kondenzált kapitális, az étlap pontozott vezetővonalai és piros feltétsora. A fotók kör alakú „tányérokként” jelennek meg, a logó körét idézve. Ez a leghűségesebb az ügyfél saját anyagaihoz, ezért az ügyfél az első pillanatban ráismer.
2. **„Doboztető”**: domináns fekete felületek, mintha egy pizzásdoboz teteje lenne. Erős, de eltávolodik a fehér alapú logótól és étlaptól, ezért elvetettük. A fekete csak a kapcsolat szakaszban jelenik meg.
3. **„Homokóra / idő”**: a „Limit” és a homokóra az időre utal, a fő interakció egy visszaszámláló lenne. Trükkösnek hat, és a logó elemeit animálni kellene, ami tilos. Ebből csak az élő nyitvatartás-jelző maradt meg (Europe/Budapest idő szerint).

## Asset-audit

| Fájl (`_forras/eredeti/`, változatlan) | Tartalom | Felhasználás |
|---|---|---|
| `logo-eredeti.png` (1080×1350) | Kör alakú jelvény: „LIMIT PIZZA” ritkított fekete kapitális ívben, két pizzaszeletből álló homokóra piros feltétkörökkel, piros kézírásos „Házhozszállítás” | `img/logo-*.webp/png` (átlátszó háttér), favicon a homokóra-kivágásból |
| `etlap-1-pizzak-eredeti.png` | 19 pizza: név, ár, feltétek, allergénjelek, nyitvatartás, telefon, „Rendelés: csak telefonon”, „kb. 30–32 cm” | `data/menu.json`, eredeti nézet (`img/etlap-1.webp`) |
| `etlap-2-feltetek-italok-eredeti.png` | Plusz feltétek (350 Ft), extra feltétek (550 Ft), allergének, 6 üdítő, kiszállítási díjak, minimum rendelés, 5 pizzás ajándék, fizetés futárnál, nyitvatartás, közösségi oldalak | `data/menu.json`, eredeti nézet (`img/etlap-2.webp`) |
| `foto-tonhalas-eredeti.jpg` | Felülnézet: tonhal, lilahagyma, zöld olivabogyó → **12. Tonhalas** | `img/tonhalas-*.webp` |
| `foto-magyaros-eredeti.jpg` | Felülnézet: paradicsom, lilahagyma, hegyes erős, kolbász, bacon → **18. Magyaros** | hero főkép, `img/magyaros-*.webp`, OG-kép |
| `foto-hawaii-eredeti.jpg` | Felülnézet: főtt sonka, ananász, oregano → **5. Hawaii** | `img/hawaii-*.webp` |

A 2. körtől a hero fotók a pizza körvonala mentén kivágott, enyhén kerekre igazított, finoman tónusjavított változatok (lásd fent). Generatív eszköz nincs. Mindhárom fotó egységes: betonszürke háttér, fehér tányér, foltosra sült perem. A 16 fotó nélküli pizzánál a sorszám látszik vékony körben, ami nem félrevezető helyettesítés. Stock- és AI-kép nincs.

## Design tokenek

- **Színek:** `brandPrimary #0d0d0d` (logó fekete) · `brandSecondary #FF3131` (logó piros, mintavételezve; nagy felület, rajta fekete szöveg 5,7:1) · `accent #F74840` (étlap piros) · `accentText #C41F1F` (piros szöveg fehéren, AA) · `surface #F2F3F4` (a fotók betonszürkéjéből) · `border #DCDDE0` · `muted #5A5D62`
- **Betű:** Archivo variable, helyben (`fonts/archivo-limit.woff`, 96 KB, latin + latin-ext, wght 400–900, wdth 62–100).
  - Kondenzált 62% / 850-es vastagság: nevek és címek, az étlap kondenzált kapitálisát idézi.
  - 75% ritkított kapitális: címkék.
  - 100%: kenyérszöveg.
  - Az étlap kézírásos betűjét nem pótoltuk webfonttal, mert kis méretben, telefonon olvashatatlan. A kézírás a logóban marad meg.
  - Méretek mértéktartók: H1 31–46 px, H2 27–38 px, pizzanév 19–22 px. Óriás display-betű nincs, Fraunces nincs.
- **Térköz:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96
- **Lekerekítés:** 8 / 14 / 20 / pill. A körforma a logóból jön: tányérok, sorszámkörök, díjzóna-ábra.
- **Mozgás:** Motion 11.18.2, helyben (`js/vendor/`). `prefers-reduced-motion` esetén nincs mozgás. Ha a Motion nem tölt be, minden ugyanúgy működik.

## Mozgás

| Elem | Indító | Mit csinál |
|---|---|---|
| Hero szöveg | betöltés | 14 px-es felúszás és áttűnés, 70 ms-os lépcsővel. Biztonsági időzítés: 2,2 s után mindenképp látszik. |
| Hero tányérok | betöltés | 0,96 → 1 skála, áttűnés, a szöveg után |
| Szakaszok | görgetés (`inView`) | 16 px-es felúszás, egyszer |
| Szűrés/keresés | interakció | a találatok rövid lépcsős áttűnése |
| Konfigurátor | megnyitás | desktopon felúszás, mobilon alsó lapként csúszik fel |
| Ár | opcióváltás | az összeg rövid rebbenése |
| Kosár | megnyitás | desktopon jobbról csúszik be, mobilon alulról |
| Kosárszámláló | kosárba tétel | 1 → 1,35 → 1 „pöccintés” és toast |

Nincs folyamatos mozgás, nincs forgás és nincs scrolljacking.

## Felépítés

- `index.html`: szekciók. DemoNotice, PauseBar, Header, Hero, MenuSection, CategoryNavigation, DeliverySection, konyhai demó belépő, ContactSection, Footer, mobil alsó sáv, és három natív `<dialog>`: konfigurátor, kosár, eredeti étlap.
- `admin.html` + `admin.js` + `admin.css`: a konyhai felület (iPad-első).
- `js/demo-store.js`: **az egyetlen közös demó-állapot**. Két kulcsa: `limitpizza-demo-rendelesek-v1` (rendelések) és `limitpizza-demo-beallitasok-v1` (szünet, várható idő, elfogyott pizzák és feltétek). Mindkét oldal ezt olvassa és írja. Ellenőrzi a tárolt adatot, és jelez a fülek között.
- `limit.js`: komponensfüggvények (`ProductCard`, `ProductConfigurator`, `CartDrawer`, `DemoNotice`), egy kosárállapot, árszámítás, nyitvatartás-jelzés, Motion.
- `data/menu.json`: **az egyetlen adatforrás** (pizzák, italok, feltétcsoportok, alapok, allergének, díjzónák, nyitvatartás). A `data/menu.js` ebből generálódik: `python3 _forras/menu_js_gen.py`. Így az oldal build és szerver nélkül is fut, a JSON pedig változatlanul átvehető egy valódi rendelési rendszerbe.
- A kosár a `localStorage`-ban tárolódik, kulcsa `limitpizza-demo-kosar-v1`. Csak termékválasztást tartalmaz, személyes adatot nem.
- React/Vite helyett build nélküli HTML/CSS/JS készült. Ez a DAEKON látványterv-szabálya, és a GitHub Pages-en változatlanul fut.

## Árszámítás

Egységár = étlapár + plusz feltét × 350 Ft + extra feltét × 550 Ft. A sor összege ennek és a darabszámnak a szorzata.

- **Alapcsere** (fokhagymás-tejfölös, csípős-paradicsomos): felárat nem számol, mert az étlap nem tünteti fel. A kosárban „felár egyeztetendő” jelzést kap.
- **Feltét elhagyása:** kérésként kerül a listára, az árat nem módosítja.
- **Kiszállítás:** a település választható (Bük ingyenes · 500 Ft · 700 Ft).
- **Minimum rendelés:** 2000 Ft. Alatta figyelmeztetés jelenik meg, és a lezárás gomb tiltott.
- **Ajándék:** 5 pizzánál megjelenik az ajándék 1,75 l-es Coca Cola termék.

Tesztelt eset: Magyaros, lilahagyma nélkül, +gomba, +bacon, fokhagymás-tejfölös alappal, 2 db = **9100 Ft**. Ehhez +1,75 l Coca Cola = 10 200 Ft, Sajtoskálra 10 900 Ft.

## Tesztjelentés (2026.11.08., Playwright + Chrome, helyi szerver)

- **Szélességek:** 320 · 360 · 390 · 430 · 768 · 1024 · 1440 · 1920 px. Vízszintes túlcsordulás egyiken sincs. Konzolhiba, oldalhiba és sikertelen kérés nincs.
- **Funkcionálisan, 1440 és 390 px-en:**
  - keresés („gomba” → Gombás, Erdész, Songoku, Vega);
  - szűrők („Hús nélkül” → Margherita, Kukoricás, Gombás, Vegyes sajtos, Vega);
  - konfigurátor: alap, elhagyás, plusz, extra, megjegyzés, darabszám, összeg;
  - kosár: mennyiség, törlés, település, összesítés;
  - bemutató-lezárás és a `tel:` link;
  - Esc-re záródó dialógusok;
  - eredeti étlap nézet;
  - mobilmenü (megnyitás, navigálás, zárás);
  - üres kosár;
  - a `localStorage` megmarad.
- **Reduced motion:** minden tartalom azonnal látszik, a kosár működik.
- **Javítva a körben:**
  - rejtett kosárszámláló „0”-val látszott;
  - mobilon szó közben tört a pizzanév („MAGYAR-OS”);
  - mobilon a hero fotó nem volt az első képernyőn, ezért a tányérok kerültek felülre;
  - a díjzóna-ábrán egymásra csúszott egy felirat;
  - az árformátum most az étlapéval egyezik („3650 Ft”).
- **Nem ellenőrzött:**
  - valódi iOS/Android készülék;
  - Lighthouse-mérés;
  - képernyőolvasóval végzett teljes bejárás;
  - a publikált oldal betöltési ideje.

## Ügyféllel egyeztetendő

1. **Fotó–pizza párosítás:** a három fotót az összetevők alapján rendeltük a Tonhalas, Magyaros és Hawaii pizzához. Helyes?
2. **További fotók** kellenének a 16 fotó nélküli pizzához, ugyanígy: felülről, betonháttéren.
3. **Alapcsere felára:** van felár a fokhagymás-tejfölös és a csípős-paradicsomos alapra?
4. **Feltét elhagyása:** módosítja az árat?
5. **Dupla feltét:** kérhető-e és ugyanannyiba kerül-e egy feltét, ami már rajta van (pl. extra bacon a Baconosra)?
6. **Fizetés:**
   - Az étlap szerint a futárnál OTP SZÉP-kártyával és bankkártyával is lehet fizetni. A 2026. októberi nyilvános közlés a **digitális** OTP SZÉP-kártyát is említi, ezt meg kell erősíteni.
   - A készpénzt az étlap nem írja ki, ezért a terv sem állítja.
7. **Kiszállítási idő:** az étlapon nem szerepel. A demóban a konyha állítja, és mindenhol „becsült idő, nem garantált” jelölést kap; az alapérték (45–60 perc) csak minta.
8. **Közösségi linkek** (a 2. körben mind a négy helyen beépítve):
   - A Facebook-link a foodyas-oldal azonosítójából készült: `facebook.com/683872544816054`.
   - Az Instagram-link az étlapon szereplő `limitpizza` névből: `instagram.com/limitpizza`.
   - Mindkettő ellenőrizendő.
9. **Árlista-lábjegyzet:** az étlapon „A változtatás jogát fenntart…” áll, a mondat vége nehezen olvasható. A terv „fenntartják” alakot használ.
10. **Allergének:** csak az étlap négy jele szerepel (glutén, tej, halfélék, csípős). Teljes allergénlista (pl. a feltétekre) nincs, és a terv sem állít többet.
11. **Nyitvatartás és települések:** a 2026. június 1-től érvényes étlap szerint. Változott azóta?
12. **Online fizetés** nincs a tervben, és nem is kerül bele. Az online rendelés bemutató; élesítéshez backend kell (lásd fent).
15. **Nyomtató típusa** (AirPrint / Epson ePOS / Star CloudPRNT / egyéb) — ettől függ az automatikus nyomtatás.
16. **Rendelés elfogadásakor kiválasztható idők** (15–60 perc) és a **riasztás hangja** — az ügyféllel finomítandó.

13. **Készpénz** a rendelési demóban „egyeztetendő” jelzéssel szerepel — az étlap csak a kártyát és a SZÉP-kártyát írja ki.
14. **„24 december”** — a megrendelő üzenetében szerepelt, tisztázandó, mire vonatkozik (pl. ünnepi nyitvatartás, határidő).

## Nem része a tervnek

Éles rendelésküldés (az online rendelés és az admin csak demó), fizetési integráció, backend, bejelentkezés az adminba, e-mail/SMS-küldés, push-értesítés, automatikus nyomtatás, adatkezelési tájékoztató és impresszum (ezek az élesítéskor kellenek), valamint GSAP, Three.js, WebGL.
