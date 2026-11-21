# Karikagyuru.com – átadás (1. kör, 2026.11.18.)

Élő előnézet: https://daekon-ship.github.io/daekon/latvanytervek/karikagyuru/
Build nélküli, önálló mappa (`index.html` + `css/` + `js/` + `fonts/`), `noindex`.

## Mi működik ténylegesen

| Rész | Hol | Állapot |
|---|---|---|
| Kezdőoldal (hero, kollekciók, kiemelt modellek, egyedi készítés, miért személyesen, kalkulátor-előzetes, kapcsolat) | `#/` | kész |
| Kollekció 30 valós cikkszámmal + 2 jelölt ezüst demótermékkel, szűrők (szín, 14K/18K, kő, stílus, típus, szélesség, ártartomány), rendezés | `#/kollekcio` | kész |
| Termékoldal + konfigurátor: szín, finomság, a két gyűrű külön mérete/szélessége/köve/gravírozása, animált ár, mobil árcsík | `#/gyuru/<id>` | kész |
| Érdeklődés / időpontkérés a cikkszámmal és a konfigurációval előtöltve | modal | **demó: nem küld adatot**, az admin „Érdeklődések” listájába kerül |
| Admin 7 menüvel (Áttekintés, Alapanyagárak, Gyűrűk kezelése, Árképletek és munkadíjak, Érdeklődések, Árváltozási előzmények, Beállítások) | `#/admin/...` | kész, bejelentkezés nélkül |
| Alapanyagár-módosítás: hatás-előnézet (érintett db, átlagos %, 5 példa régi→új), érvényességi nap, nagy változás külön megerősítése, Mégsem / Új árak alkalmazása, visszavonás | `#/admin/alapanyag` | kész |
| Egyedi ár: képlet / képlet ± % / rögzített ár, minimumár, alacsony árrés figyelmeztetés | `#/admin/gyuru/<id>` | kész |
| Ajánlati ár rögzítése érdeklődésnél (az aranyár-változás nem írja felül) | `#/admin/erdeklodesek` | kész |
| Napló (ki, mikor, mit, hány gyűrű, összeg) + visszaállítás | `#/admin/elozmenyek` | kész |
| Bemutató-sáv: Vásárlói ↔ Adminisztrátori nézet, Forgatókönyv (7 lépés), Demóadatok visszaállítása | felül | kész |

Az állapot közös (`js/store.js`, `localStorage` kulcs: `karikagyuru-demo-v1`) – csak az adott böngészőben él. **Nincs** szerveroldali adatbázis, jogosultság vagy e-mail-küldés; a felület ezt ki is írja.

## 4. kör (2026.11.18.) – kalkulátor és admin árazás

**Vásárlói konfigurátor** (`#/gyuru/<id>`):
- Számozott lépések: 1. arany színe, 2. finomság (585/750 magyarázattal), 3. a két gyűrű (fülek összegzéssel), 4. „Árak egy pillantásra” (szín × finomság táblázat, kattintható).
- Minden választási lehetőségen látszik, mennyivel módosítja az árat (pl. „+4 500 Ft”, „ugyanannyi”).
- Pároknál női/férfi ármegosztás (tájékoztató).
- Méretsegítő (kerület ↔ belső átmérő táblázat, tippek), „Még nem tudom – a konzultáción megmérjük” lehetőség.
- Gravírozás élő előnézettel a gyűrű belső felületén, a választott aranyszínben; egyenes vagy írott betű.
- A beállítás bekerül a linkbe (`?k=`): „Konfiguráció linkjének másolása” – elküldhető a párnak, visszatérve ugyanaz nyílik meg; az érdeklődési űrlapba is így kerül.
- Kezdőlapi kalkulátor: 6 modell fotóval, finomság, szín, kő; a „Tovább” gomb a beállítással együtt nyitja a termékoldalt.

**Admin**:
- Alapanyagárak: arany-kártya nagy mezővel, gyors gombokkal (−3%, −1%, +1%, +3%, +5%) és aranyár-grafikonnal (lépcsős, az új ár szaggatott vonallal). A korábbi árváltozások **kitalált demó előzmények** (jelölve).
- Hatáspanel: kattintható példák; „Mitől változik?” árösszetétel-sáv (arany / gyémánt / munkadíj / doboz-gravír) – látszik, hogy csak az arany része nő, a munkadíj és a kő változatlan; „Mind a N érintett gyűrű listája” előnézet.
- Mobilon alsó sáv mutatja a hatást („30 gyűrű ára változna, +7,9%”), egy gombbal a részletekhez ugrik.
- Jóváhagyás után az összesítő képernyőn is látszik a régi/új összetétel.
- Árképletek: minden mező alatt egyszerű magyarázat; példagyűrű választható; lépésről lépésre számítás és összetétel-sáv; **munkadíj stílusonként** egy mozdulattal az összes adott stílusú gyűrűre (előnézettel, naplózva).
- Gyűrűk kezelése: szűrők (egyedi áras, köves, pár, alacsony árrés), rendezés (ár, eltérés a mostani weboldali ártól), címkék; **árlista nyomtatása** (A4, logóval) és **letöltése Excelhez** (CSV, magyar ékezetekkel).
- Áttekintés: aranyár-grafikon.
- A bemutató állapota új kulcson indul (`karikagyuru-demo-v2`), a régi böngészőállapot automatikusan kezdőállapotra áll.

## 7. kör (2026.11.18.) – az eredeti oldal adatai
- **Termékek:** az eredeti 30 mellé +87 modell a karikagyuru.com 2. oldaláról, valamint a cikkszám (csökkenő) és ár (növekvő/csökkenő) szerinti rendezések első oldalairól – összesen 117 tétel (ebből 2 ezüst demótermék). Cikkszám, ár, képfájl valós. Az új modellek fotói a karikagyuru.com-ról töltődnek (innen nem tölthetők le, a munkakörnyezet hálózata ezt nem engedi); ha nem töltenek be, rajzolt színminta jelenik meg.
- **Nem érhető el:** a 3. oldaltól kezdve az eredeti lapozás innen nem működött (mindig az 1. oldalt adta vissza), ezért a katalógus **nem teljes**. A teljes lista az ügyfél oldalán lévő többi oldal mentésével (MHT, ahogy az 1. oldal is jött) pótolható – a fotókkal együtt.
- **8 tétel ár nélkül** szerepel az eredeti oldalon („Ár: Ft”): MAZ 81632, 82064–82065 (4 változat), 82070–82071 (2), 93210–93211 W. Ezek nálunk „Egyedi ajánlat alapján” felirattal, árajánlatkérő gombbal jelennek meg, és kimaradnak az alapanyagár-számításból; az adminban rögzített árral vagy tömeggel bekapcsolhatók.
- **Szín** a cikkszám végződéséből: W fehér, Y sárga, R rozé, W/Y és Y/W fehér–sárga, W/R és R/W fehér–rozé, Y/R sárga–rozé. Ahol nincs jelölés (pl. MAZ 93130 - 93131), „szín egyeztetendő”. A „Y/V” végződést fehér–sárgának vettük (egyeztetendő).
- **Cégadatok** az ÁSZF-ből a láblécben: Virág & Társa Kft., székhely 1132 Budapest, Visegrádi utca 42–46., üzlet 1089 Budapest, Bláthy Ottó utca 4–8., I. emelet 123., adószám 12149030-2-41, cégjegyzékszám 01-09-469480.
- **Rendelési feltételek** (új kezdőlapi szekció + termékoldali sorok, ÁSZF alapján): személyes egyeztetés, előleg = a termék árának fele, feldolgozás legfeljebb 3 munkanap, egyedi határidő, személyes átvétel, fizetés átvételkor készpénzben vagy átutalással, 1 év jótállás, egyedi méretre készült gyűrűre nincs elállás.
- Kollekció és admin lista 24/30-asával tölt, „Továbbiak mutatása” gombbal.
- A bemutató állapota új kulcson indul (`karikagyuru-demo-v3`).

## 8. kör (2026.11.18.) – nincs rajzolt („kamu”) gyűrű
- A vásárlói oldalon sehol nincs programból rajzolt gyűrűkép: kikerült a „Színminta” nézet, a kalkulátor-előzetes rajza és a két ezüst demótermék.
- Más aranyszín választásakor a valódi fotó marad, alatta felirat: „A fotón fehérarany látható – az Ön gyűrűje rozéarany színben készül el.”
- A karikagyuru.com-ról töltődő fotókat az oldal betöltéskor ellenőrzi; amelyik nem érhető el, az a gyűrű nem jelenik meg a kollekcióban és a kezdőlapon (az adminban „a fotó nem érhető el” jelzéssel látszik). Biztosan a helyben tárolt 30 saját fotós gyűrű látszik; a többi csak akkor, ha a karikagyuru.com kiszolgálja a képet.
- Az ezüst referenciaár mezője megmaradt az adminban, de jelenleg nincs ezüst termék.
 (kb. 3 perc)
1. Vásárlói nézet → Kollekció. 2. MAZ 81184 - 81185 W megnyitása (410 500 Ft). 3. Felső sáv: Adminisztrátori nézet. 4. 24K színarany: 39 000 → 45 000 Ft/g (vagy „Kipróbálom” gomb). 5. Új árak alkalmazása (30 gyűrű, átlag +8,8%). 6. „Megnézem a katalógusban”. 7. A kártyákon „Frissült ár”, az ár felszámol 441 500 Ft-ra.
Utána: „Demóadatok visszaállítása”.

## Árképlet (`js/engine.js`, tiszta függvények)
```
tömeg = alaptömeg(14K, ref. méret) × méret/refméret × szélesség/refszélesség × (18K ? 1,17 : 1)
nemesfém  = tömeg × finomság(0,585 | 0,75) × 24K ár × (1 + veszteség%)
ötvözet   = tömeg × (1 − finomság) × ötvözetár(szín) × (1 + veszteség%)
kövek     = darabszám × kategória-egységár   (nem grammár)
alap      = nemesfém + ötvözet + munkadíj (fix Ft) + kőfoglalás + gravír + doboz + tanúsítvány + egyéb
nettó     = alap × (1 + fém/munka felár%) + kövek × (1 + kőfelár%)
kalkulált = felfelé kerekítve( nettó × (1 + ÁFA%) )
megjelenő = felülbírálás (rögzített / ±%) → minimumár-védelem
```
Árrés = (nettó végár − önköltség) / nettó végár; a beállított minimum alatt figyelmeztet.
A nyilvános felület csak a végső becsült árat, a paramétereket és a becsült tömeget mutatja – felárat, beszerzési árat, önköltséget nem.

## Valós vs. demó adat
- **Valós** (karikagyuru.com, 2026.11.18.): 30 cikkszám, a mostani weboldali árak (`listaAr`, csak az adminban, összehasonlításhoz), képfájlnevek, cím (1089 Budapest, Bláthy Ottó utca 4–8.), telefon (+36 30 984 3090), e-mail, „időpont-egyeztetés után bármikor, akár munkaidő után vagy hétvégén is”, anyagválaszték, természetes gyémántok, „rendelésre elkészítjük”, közösségi linkek, ÁSZF/adatkezelés linkek.
- **Demó** (kitalált, egyeztetendő): minden alapanyagár (39 000 Ft/g arany, 500 Ft/g ezüst, kőárak, ötvözetek), felárak, munkadíjak, díjak, a terméknevek (cikkszám-végződésből: W = fehér, Y = sárga, W/Y = kétszínű), stílus, szélesség, kőszám/kategória, tömegek. A tömegeket a rendszer a kezdő demóárakból úgy számolja vissza (`seedWeights`), hogy a kalkulált ár ~1%-on belül a mostani weboldali ár legyen – így a bemutatón ismerős árak jelennek meg.
- Két ezüst demótermék (`DEMÓ AG 01/02`), hogy az ezüstár-módosítás is látható legyen; nem a katalógus része.
- Árak mellett „demó” jelölés (Beállítások → kikapcsolható).

## Képek és logó (2. kör, 2026.11.18.)
- A 30 termékfotó és a logó az ügyfél által küldött mentett oldalról (`Karikagyuru.com.mht`) került ki, és helyben van: `img/termekek/` (a 79014-es fotó 1000 px-re kicsinyítve, a KETS-fotóról levágva a vékony keret), `img/logo.png` (eredeti), `img/logo-jel.png` (gyémánt + jel, a fejlécben a szóvédjegy mellett), `img/logo-vilagos.png` (invertált, sötét láblécre), favicon és apple-touch-ikon a jelből. Hotlink már nincs.
- A fotók alapján javítva: MAZ 79016-79017 rozéarany pár (eddig fehérként szerepelt), a 79008, 79014 és 81169 pár, a 79014 és 81169 kő nélküli; a kövek darabszáma a fotóról becsült (egyeztetendő), a kő mérete demó.
- A fotók 600×600 px körüliek, a legtöbbön „www.karikagyuru.com” vízjel; éleshez nagyobb felbontású, vízjel nélküli képeket és modellenként több nézetet kérünk.
- A logó 270×146 px-es PNG; éleshez vektoros (SVG) újrarajzolás javasolt.
- Tartalékként marad a programból rajzolt, színhelyes gyűrűkép (a „Színminta” nézet és az ezüst demótermékek).

## Art direction – három irány, a választott
(3. kör: a „Vitrin” elrendezés marad, a meleg elefántcsont–arany paletta helyett az ügyfél kék–fehér színeivel.)
1. **Vitrin (választott)** – elefántcsont/pezsgő/homok, egyetlen meleg arany hajszálvonal-szín, a gyűrű kör alakú „talapzaton”, a magyar fémjel (585/750) bélyegként visszatérő motívum. A brief luxusirányához ez illik a legjobban, és a gyűrű marad a főszereplő.
2. Ötvösműhely – sötét dió, kovácsolt textúrák, műhelyfotók. Elvetve: nincs valódi műhelyfotó, és a brief világos alapot kér.
3. Esküvői meghívó – letterpress, kézírásos díszítés. Elvetve: túl dekoratív, könnyen sablonos „esküvői” hangulatú lesz.

## Designrendszer
- Betűk (6. kör): Libre Baskerville csak a vásárlói oldal nagy címeihez + Manrope minden máshoz (szöveg, gombok, árak, teljes admin); nincs csupa nagybetűs, ritkított felirat. Korábban: Libre Baskerville (címek) + Jost (szöveg, UI, árak) – helyben (`fonts/`, OFL). Az 5. körben a Bodoni Moda helyett, mert annak hajszálvékony vonalai telefonon szétestek. Mérsékelt méretek: h1 max ~43 px, h2 max ~30 px. Admin alapméret 18,4 px.
- Színek (3. kör, az ügyfél kérésére a karikagyuru.com kék–fehér arculata): fehér `#FFFFFF`, halványkék felületek `#F2F8FA` / `#E7F4F8`, márkakék `#43BDDB` (gombok, vonalak, fémjel-bélyegek), sötétkék szöveg-kiemelés `#136A82`, szöveg `#15262D`, sötét szekciók `#12303B` / `#0F222A`. A CSS-változók neve (`--gold`, `--ivory` stb.) az 1. körből maradt, az értékük kék–fehér. Kontraszt: `#136A82` fehéren 6,2:1, sötét szöveg a kék gombon 7,1:1.
- Térköz: 8 / 16 / 24 / 40 / 64 / szekció 72–128 px; konténer 1240 px.
- Komponensek: fémjel-bélyeg, szegmentált választó, aranyszín-minta (fémes gradiens), chip, léptető, kártya, admin mező ± gombokkal, hatáspanel.
- Reszponzív: 1100 / 960 / 640 / 380 px töréspontok; mobilon menü teljes képernyőn, szűrők alsó lapként, ár + „Érdeklődöm” alsó sávban (a tartalom alatta kap helyet), admin menü vízszintesen görgethető, nagy gombokkal.

## Animációk (Motion 11, helyben: `js/vendor/`)
- Betöltés: hero-elemek lépcsőzetes felúszása, a talapzat kirajzolódó „pályagyűrűje” (pathLength), felirat-kártya beúszik.
- Görgetés: `inView` alapú finom felúszás (data-reveal).
- Interakció: ár felszámolása régi→új értékre, kártyák „Frissült ár” jelzése alapanyagár-változás után, nézetváltásnál halvány átúszás, modal belépés, jóváhagyás-pipa rugós animáció.
- `prefers-reduced-motion` esetén minden animáció kikapcsol. Nincs scrolljacking, nincs blokkoló betöltő.

## Éles rendszerhez kell (nincs benne)
Bejelentkezés és szerepkörök; szerveroldali adatbázis (termékek, árak, napló); szerveroldali árképzés és naplózás; érdeklődés e-mail/SMS értesítéssel; képfeltöltés; adatkezelési hozzájárulás az űrlapon; mentés. React + TypeScript + Tailwind portolás a meglévő tiszta motorral (`engine.js` változtatás nélkül átvihető).

## Ügyféllel egyeztetendő
- Valós tömegek, szélességek, kövek, finomság-elérhetőség modellenként; terméknevek.
- Valós munkadíjak, felárak, kerekítési szabály, ÁFA-kezelés, díszdoboz/tanúsítvány.
- Melyik gyémántkategóriákat használja, milyen minőségben.
- Kér-e rozéarany/18K opciót minden modellhez; platina, palládium, titán, acél kollekció.
- Fotók (több nézet, nagy felbontás), logó (most tipográfiai szóvédjegy + két karika jel).
- Érdeklődés: telefon vagy űrlap legyen-e az elsődleges.

---

## V2 fejlesztés (2026. november)

A meglévő rendszer továbbfejlesztése, újraépítés nélkül. Továbbra sincs webshop, fizetés, kosár vagy készletkezelés. A fő gombok: „Érdeklődöm erről a gyűrűről” és „Kérjen személyes konzultációt”.

### Lépésenkénti konfigurátor (termékoldal)
Anyag → Finomság (csak arany, 14K/18K) → Arany színe (csak arany, ha több szín van) → Méret (női és férfi egymás mellett, külön léptetővel, méretsegítővel, „még nem tudom” opcióval, szélességgel) → Gyémánt (gyűrűnként) → Gravírozás (gyűrűnként, betűtípussal, előnézettel) → Összefoglaló, ár, érdeklődés.
- Csak a releváns lépések jelennek meg; minden választásnál látszik az árkülönbség.
- A szín azonos karátnál nem változtat az árat (egy közös ötvözetár: `alloyAll`).
- Nem arany anyagnál nincs aranyszín-választó.
- Lehetetlen összeállítás nem marad: az `engine.normalizeConfig` mindent a modell szabályaira szorít, és figyelmeztet.
- Ha nincs megbízható ár (ár nélküli kőméret, hiányzó tömeg vagy grammár, „ár nélküli” modell), akkor az ár helyén ez áll: „Egyedi árajánlat szükséges”. Nincs 0 Ft és nincs becsült kamu ár.

### Anyagok
14K arany (alapértelmezett), 18K arany, platina (Pt950), palládium (Pd950), titán. A 24K csak számítási alap, választható anyagként nem jelenik meg; 9K nincs. Modellenként admin állítja, melyik anyag választható (`p.metals`).

### Árképzési módok – AZ ÜGYFÉLLEL EGYEZTETENDŐ, egyik sem végleges
Az admin „Felárak és munkadíjak” oldalán választható; az „Arany ára” oldal fejléce mutatja, melyik aktív.
- **Költség szerint (`koltseg`, alap):** színarany-tartalom × 24K ár × (1 + veszteség) + ötvözet + munkadíj × anyagszorzó + kőfoglalás + egyéb → felár → ÁFA → kerekítés. A kövekre külön felár.
- **Grammár szerint (`gramm`):** kész tömeg × bruttó grammár (anyagonként, `sellPerGram`). A grammár már tartalmazza a fémet, a munkát és az árrést, ezért a munkadíj és a fém-felár NEM adódik hozzá még egyszer; csak a kövek (+kőfelár), a kőfoglalás, a gravír és a doboz. Ebben a módban árrés nem számolható.
- A megbeszélésen elhangzott példaárak NEM kerültek be élő árként. A demó grammárak a költségalapú mód kőnélküli átlagához vannak igazítva, csak az összevethetőség kedvéért.

### Méret hatása – egyeztetendő
- **Tömeg szerint (`tomeg`, alap):** tömeg = referenciatömeg × méret / referenciaméret × szélesség-arány × anyagszorzó. A munkadíj és a kő nem változik.
- **Egyszerű árarányosítás (`ar`):** a kő nélküli rész teljes ára arányos a mérettel (a munkadíjat is arányosítja).

### Gyémántszabályok (termékenként, `ring.stoneRule`)
Kizárólag természetes gyémánt. Módok:
- `free`: a vásárló választ kőszámot min és max között;
- `fixed`: kötött kőszám;
- `perSize`: körbe foglalt, a kőszám a mérettől függ;
- `quote`: csak ajánlattal.

További beállítások:
- választható kőméretek (`cats`) és alap kőméret;
- kő nélkül is kérhető-e (`allowNone`);
- `demo` jelölés: a szabály még jóváhagyásra vár, ezt a vásárlói oldalon is jelezzük.

Ha egy kőméretnek nincs ára (`price: null`, pl. 0,10 ct), az egyedi ajánlatot jelent. A kő ára egyszer számolódik (tesztelve). A mostani szabályok demók, a weboldali kőszámból képzett becslések.

### Admin
- **Arany ára:**
  - a fő mező módfüggő (24K ár vagy 14K grammár);
  - ±% gombok, előnézet (érintett gyűrűk száma, átlagos %, példák, Ft-különbség);
  - figyelmeztetés, ha egy gyűrű ár nélkül maradna;
  - nagy változásnál külön megerősítés, napló, visszaállítás;
  - lenyitható részben a platina, palládium, titán és ötvözet ára (vagy a többi grammár), valamint a kőárak (üres mező = egyedi ajánlat).
- **Felárak és munkadíjak:** árképzési mód, méretkezelés, felárak, fix díjak, anyagonkénti tömeg- és munkadíj-szorzó, mentés előtti hatáselőnézet.
- **Gyűrű szerkesztése:**
  - cikkszám, név, stílus, szélességek, megjelenés (látható/rejtett), domain;
  - választható anyagok;
  - gyűrűnként referenciaméret, tömeg, szélesség, munkadíj, egyéb költség és kőszabály-szerkesztő;
  - egyedi ár, minimumár, „csak ajánlattal” kapcsoló;
  - „Jóváhagyandó adatok” lista.
- **Árszámítás:** anyag, szín, méretek, kő be/ki, majd „Felírom ajánlatnak” → Érdeklődések (rögzített árral, vagy ár nélküli ajánlatként).
- A gyűrűlistában van „Rejtett” és „Ár nélkül” szűrő; a CSV és a nyomtatott árlista kezeli az ár nélküli tételeket.

### Több domain
A `data.js`-ben `SITES` (karikagyuru.com, budapestikarikagyuru.com) és `CURRENT_SITE`; minden termékhez tartozik egy `sites` lista. A katalógus csak az adott oldalhoz rendelt, látható termékeket mutatja. A termék- és áradminisztráció közös. A második oldal nincs megépítve, csak az adatszerkezet kész rá.

### Backend-előkészítés
- Az árképzés tiszta függvényekben van (`engine.js`), DOM nélkül; szerveroldalra változtatás nélkül átvihető.
- A tárolás egy helyen van (`store.js`, localStorage); éles rendszerben ezt kell API-hívásokra cserélni.
- Az admin NEM biztonságos: nincs bejelentkezés, és nincs szerveroldali jogosultság.

### Tesztek
- `node --test public/latvanytervek/karikagyuru/tests/engine.test.mjs` – 12 motor-teszt:
  - a szín nem változtat az árat;
  - 14K/18K tömeg és ár;
  - méret hatása (mindkét módszerrel);
  - kőszám-határok, a kötött és a méretfüggő kőszám;
  - nincs dupla kőár;
  - a női és a férfi méret külön számít;
  - alapanyagár-változás és rögzített ár;
  - a grammáras mód nem számol dupla munkadíjat;
  - hibás adatból nincs megtévesztő ár;
  - nem arany anyagnál nincs aranyszín;
  - a megosztható link oda-vissza működik;
  - minden áras terméknek van ára.
- `python3 public/latvanytervek/karikagyuru/tests/e2e.py [URL]` – 23 böngészős ellenőrzés:
  - a konfigurátor lépései, színsemlegesség, 18K, platina, méretek, kőhatár, kő ki/be, egyedi ajánlat, gravír, érdeklődés;
  - körbe foglalt gyűrű;
  - adminban módosított ár megjelenése a vásárlói oldalon;
  - grammáras mód;
  - termékszerkesztő, rejtett termék, gyors árszámítás;
  - demó visszaállítás;
  - 360/390/768/1440 px szélességen nincs vízszintes görgetés;
  - nincs JS-hiba.
- A localStorage kulcs `karikagyuru-demo-v8` lett, így a régi demóadat nem keveredik az újjal.

### Az ötvösmester jóváhagyása kell
1. Árképzési mód (költség vagy grammár) és méretkezelés (tömeg vagy árarányos).
2. Valós 24K, platina-, palládium- és titánár, illetve valós grammárak anyagonként.
3. Modellenként: valós tömeg (14K-ban) referenciamérettel és szélességgel; mely anyagok és finomságok készülhetnek.
4. Kőszabályok modellenként: kőszám (min/max/kötött/méretfüggő), kőméretek, elhagyható-e a kő.
5. Kőárak méretenként és minőségenként (a 0,10 ct most szándékosan ár nélküli).
6. Munkadíjak, anyagonkénti munkadíj-szorzók (platina, palládium, titán), felárak, kerekítés, gravír, doboz, tanúsítvány díja.
7. A cikkszámból képzett terméknevek és az alapszín ott, ahol a cikkszámban nincs színjel.

---

## V2.1 – az ügyfél kézírásos árazási jegyzete alapján (2026. november 19.)

Cél: a kalkulátor az ötvös saját számítási logikáját mutassa, ne kitalált árazást.

### Az ötvös módszere = alapértelmezett „grammár szerint” mód
**Ár = kész tömeg (g) × eladási grammár (Ft/g, bruttó) × méret / 54 + kövek darabára + külön díjak.**
- A grammár már tartalmazza a fémet, a munkát, az árrést és az ÁFA-t. Munkadíj, felár és ÁFA nem kerül rá még egyszer; ezt teszt ellenőrzi.
- Az alapanyag-referenciaár KÜLÖN mező:
  - 24K 40 000 Ft/g → 14K = ×0,585 = 23 400; 18K = ×0,75 = 30 000;
  - platina 15 000, palládium 10 000.
- Grammáras módban az alapanyag-referenciaár nem változtatja az eladási árat. A részletes kalkulációban tájékoztató anyagköltségként látszik.
- A költségalapú mód összehasonlításnak megmaradt.

### Ügyfélpéldák → beállítások
- **Eladási grammár:** 14K 47 000, platina 55 000 (ügyfél példája). A 18K, palládium és titán grammára demó, mert még nem kaptuk meg.
- **Tömegarányok az 54-es példatömegekből:** 14K 4,8 g → 18K 5,4 · Pt 6,9 · Pd 4,0 · Ti 1,5 g (`S.density`). Egy gyűrűnél anyagonként pontos tömeg is megadható (`ring.weights`).
- **Természetes gyémánt, Ft/db:**
  - 0,01 ct (Ø 1,25 mm) 6 000 · 0,015 ct (1,5) 9 000 · 0,02 ct (1,7) 12 000 · 0,03 ct (2,0) 18 000;
  - 0,04 ct (2,2–2,3): ár nélkül, „megerősítendő” (jegyzet: 24 000, beszélgetés: 20 000);
  - 0,05 ct (2,3–2,4): ár nélkül, megerősítendő;
  - a 0,005 ct és a 0,10 ct demó.
  - Ár nélküli kő → „Egyedi árajánlat szükséges”.
- **Díjak:** kőfoglalás 0 (benne lehet a kő árában – egyeztetendő), díszdoboz és tanúsítvány 0, gravír 6 000 (demó). Kerekítés felfelé 100 Ft-ra (demó).
- **A jegyzet 60-as platina 442 000 Ft-ját nem állítottuk be.** A lineáris számítás 421 667 Ft. A különbség (20 333 Ft) az admin Árszámítás oldalán ki van emelve, egyeztetendő.

### Fizikai korlát a kövekre (demó műszaki szabály)
- A kő átmérője legfeljebb a gyűrű szélessége mínusz 1 mm perem.
- Körbe foglalásnál a kőszám legfeljebb kerület ÷ (átmérő + 0,1 mm).
- A vásárlói oldalon a be nem férő kőméret „nem fér el” felirattal le van tiltva.
- A peremet és a hézagot az admin állítja (Felárak és munkadíjak).

### Adatforrás-jelölés
Minden árazási adat négy állapot egyikében van:
- **jóváhagyott** (zöld);
- **ügyfél példája** (kék);
- **megerősítendő** (sárga);
- **demó** (szaggatott).

Ahol látszik:
- Az admin minden ármezője mellett megjelenik a jelölés.
- Új oldal: **Jóváhagyásra vár**. Itt egy gombbal jóváhagyható egy-egy adat. Ár nélküli kő csak akkor, ha előbb árat kap.
- Amit a tulajdonos maga átír, automatikusan jóváhagyottá válik.
- A gyűrűk tömege „becsült tömeg”: a weboldali árból visszaszámolva, (ár − kövek) ÷ grammár. Gyűrűnként jelölhető „Az ötvös jóváhagyta”.

### Admin Árszámítás oldal
- „Az ötvös számítási módja”: táblázat az élő beállításokból (225 600 / 379 500 / 337 333 / 421 667 Ft).
- Próbaszámítás tetszőleges tömeggel, mérettel és kővel, lépésenkénti levezetéssel és tájékoztató anyagköltséggel.

### Tesztek
- `node --test public/latvanytervek/karikagyuru/tests/engine.test.mjs` → 27/27.
  - Az ügyfél számpéldái: 225 600; 379 500; 337 333; 421 667 (és nem 442 000).
  - Kerekítés: 337 400.
  - Tömegarányok: 4,8 → 5,4 / 6,9 / 4,0 / 1,5 g.
  - Alapanyagárak: 23 400 / 30 000 / 15 000 / 10 000.
  - Kőárak 6 000–18 000 Ft, „ügyfél példája” jelöléssel.
  - 0,04 és 0,05 ct → egyedi ajánlat.
  - 4,8 g + 3 × 0,01 ct = 243 600 Ft.
  - Nincs dupla munkadíj, felár és ÁFA.
  - Az alapanyagár grammáras módban nem mozgatja az eladási árat.
  - Fizikai kőkorlát.
  - Minden termék alapkonfigurációja lehetséges és árazható.
- `python3 public/latvanytervek/karikagyuru/tests/e2e.py` → 27/27 (böngészős folyamatok + 4 képernyőméret).
- localStorage-kulcs: `karikagyuru-demo-v9`.

---

## V2.2 – ellenőrzés és véglegesítés bemutatásra (2026. november 19.)

Szakmai árat nem módosítottunk, új funkciót nem kezdtünk.

### Javítások
- **Nyers és kerekített ár külön.**
  - A motor visszaadja: `raw` (nyers, egész forint), `calculated` (kerekített), `rounding` (a kettő különbsége).
  - Az admin minden előnézete külön sorban mutatja: termékszerkesztő, árképlet-oldal, ötvös-példák táblázata („Számított” / „Megjelenő” oszlop), próbaszámítás, gyors árszámítás.
  - A vásárlói árdobozban: „100 Ft-ra kerekítve”.
- **A kerekítés a kijelzett egész forintos nyers árból számolódik**, így a nyers és a kerekített ár mindig egyezik. Előtte 337 300,4 Ft-nál 337 300 / 337 400 eltérés lehetett.
- **Kerekítés:** választólista (nincs / 10 / 100 / 500 / 1000 Ft, felfelé) a Felárak és a Beállítások oldalon is. Demó jelölésű, és átállítva is demó marad, amíg a Jóváhagyásra vár oldalon kifejezetten jóvá nem hagyják.
- **Árképlet-előnézet:** grammáras módban tévesen „+ kőfelár 20%” sor jelent meg. A végösszeg helyes volt, a levezetés félrevezető. Javítva: a kő darabára egyszer, felár nélkül szerepel.
- **Kőméret kijelzése:** a 0,005 ct „0,01 ct”-nak, a 0,015 ct „0,02 ct”-nak látszott (2 tizedesre kerekítés miatt). Javítva (`ctFmt`).
- **Magyar toldalék a méreteknél:** „63-es” helyett 63-as, „55-es” helyett 55-ös (`sizeSfx`).
- **Demó grammár jelölése:** a 18K, palládium és titán grammár az adminban „demó” jelölést kap. A vásárlói árdobozban és a gyors árszámításban is látszik, ha demó grammárral számolt az ár.

### Tesztek
- `node --test tests/engine.test.mjs` → 38/38. Új tesztek:
  - kerekítés az ügyfélpéldákkal: nyers / 100 / 1000 Ft / nincs;
  - minden termék × anyag × kő ki/be × gravír esetén a nyers ár pontosan a tételek összege (480+ eset), foglalással, tanúsítvánnyal és dobozzal;
  - költségalapú mód: kő és gravír egyszer;
  - gravír gyűrűnként egyszer, üres szövegre 0;
  - demó-jelölések, magyar toldalék, karát-kijelzés.
- `python3 tests/e2e.py` → 30/30 (asztali folyamatok és 4 képernyőméret).
- `python3 tests/mobile.py` → 24/24. Érintéses mobilfolyamat 360 és 390 px-en:
  - kollekció → termék → minden lépés;
  - gombméretek;
  - az alsó sáv ára egyezik és nem takar;
  - méretsegítő, érdeklődés a teljes konfigurációval, 0,04 ct-nál egyedi ajánlat, nincs JS-hiba.
- **Gyorsítótár-védelem:** az `index.html` import mapje minden modult `?v=2.2` verzióval tölt, a CSS-t is. Kiadásnál a verziószámot ott kell átírni (a `kg-version` meta, a CSS, az import map és az app.js sorában). Így a GitHub Pages 10 perces gyorsítótára alatt sem keveredhet régi és új modul, ami üres oldalt okozhatna. A `<meta name="kg-version">` mutatja, melyik verzió van kint.

---

## V2.3 – teljes átnézés és javítás (2026. november 20.)

Minden oldalt végignéztünk telefonon (390 px) és asztali gépen (1440 px). Szakmai árat nem módosítottunk.

- **Az alapárak pontosan egyeznek a weboldali árakkal.** A becsült tömeget 3 tizedesre számoljuk, így a 100 Ft-os kerekítés már nem tolja 100 Ft-tal a weboldali ár fölé (pl. 435 100 helyett 435 000 Ft). Teszt ellenőrzi mind a 107 áras gyűrűre.
- **Admin példatábla telefonon:** a „Számított” és „Megjelenő” oszlop korábban csak oldalra görgetve látszott. Most három oszlopban elfér.
- **Felárak és munkadíjak oldal grammáras módban:**
  - a képletsor már nem mutat „+ felár” és „+ ÁFA” tagot;
  - az árösszetétel „Gyűrű (tömeg × grammár)” feliratot használ „Arany (nemesfém + ötvözet)” helyett;
  - a „Munkadíj stílusonként” rész csak költségalapú módban látszik.
- **Szövegek:** az admin sávja és a lábléc már nem „kitalált demóárakat” ír, hiszen az árak az ügyfél példáiból is számolódnak. A menüpont neve „Árak”, az oldalé „Árak: grammár, arany, gyémánt”.
- **Apróságok:** a lenyitható részek felirata telefonon nem torlódik; a kőméret-gombok asztali nézetben egy sorba férnek.
- Verzió: `V2.3` (import map `?v=2.3`), localStorage-kulcs `karikagyuru-demo-v10`.
- Tesztek: motor 39/39, asztali 30/30, mobil 26/26.

---

## V3 – teljes vásárlói élmény és személyre szabás (2026. november 20.)

**Forrás:** a V3 feladatleírás. Az ügyfélbeszélgetés átirata és a kézzel írt jegyzet fényképe ehhez a munkamenethez NEM volt csatolva; a tulajdonos gondolkodását a feladatleírás összefoglalója alapján építettük be. Ha megvan az átirat, a szövegeket érdemes vele összevetni.

### A három üzenet a nyitóképernyőn
1. Nem kell kész modellből választani – főcím: „Nem kell beérned azzal, ami a vitrinben van.”
2. Két út: „Alakítsd a sajátodra” (→ Gyűrűk) és „Van egy saját ötletem” (→ `#/sajat`); közvetlenül a hero alatt két nagy kártya.
3. Egy több mint 30 éve dolgozó ötvös segít személyesen (hero-megjegyzés és „Akivel a gyűrűdet kitalálod” szekció).

### Új és átírt részek
- **Teljes szövegújraírás tegeződve** (kezdőoldal, gyűrűk, termékoldal, konfigurátor, saját ötlet, kapcsolat, űrlapok). **Ügyféllel jóváhagyandó kommunikációs döntés.** Az admin magázva maradt (a tulajdonosnak szól).
- **Kezdőoldal sorrendje:** hero → két út → induló modellek → gyors árpróba → „A kevesebb is lehet pont tökéletes” → irányok/inspiráció → az ötvös → így megy → rendelés röviden → kapcsolat. A korábbi „Válasszon aranyszín szerint” és „Miért érdemes bejönni” blokk kikerült (a tartalmuk az ötvös-szekcióba olvadt).
- **„A kevesebb is…”:** ugyanaz a modell kő nélkül / egy kővel / alapkiépítésben, élő árakkal a motorból. Csak olyan változat, amit a modell kőszabálya enged.
- **Irányok (inspiráció):** a katalógus saját fotói négy irány szerint (körbekövezve, több kő sorban, két szín, megmunkált felület) + „Egészen más jár a fejedben?”. Nem mutatunk kitalált egyedi megrendelést; a korábbi egyedi munkák fotóit az ügyféltől várjuk (jelölve).
- **Az ötvös:** 30+ év, gép és kéz együtt (nem állítjuk, hogy minden kézzel készül), megmondja, ha valami nem működne. Portré/műhelyfotó nincs – az ügyféltől várjuk (jelölve), kitalált képet nem használunk.
- **Saját gyűrűt szeretnék (`#/sajat`):** leírás, gyűrűtípus, anyag, gyémánt, kép vagy rajz (legfeljebb 3, helyi előnézet), költségkeret (nem kötelező, demó sávok), elérhetőség, konzultáció.
  - Az ár mindig „Személyes egyeztetés alapján” – nincs automatikus ajánlat.
  - A kép NEM töltődik fel: ezt az űrlap és a visszaigazolás is kiírja.
  - A vázlat a böngésző munkamenetében megmarad (sessionStorage), a képek csak az oldal újratöltéséig.
  - Az admin Érdeklődések között „saját elképzelés” típussal jelenik meg, a leírással és a képek számával.
- **Termékoldal:**
  - Két külön nézet: **Fotó** (az eredeti, valódi termékfotó) és **A te változatod** (szemléltető ábra). Az ábra a valós adatokból rajzol: anyag/szín, belső átmérő a méretből, szélesség mm-ben, a kövek száma és átmérője. Felirat: „Szemléltető ábra – nem fotó”, és külön mondat, hogy nem a kész gyűrű pontos képe.
  - **„Másképp képzelted el?”** → `#/sajat?modell=…&k=…`: viszi a cikkszámot és a beállított paramétereket.
  - Ahol a férfigyűrűn a modell szerint nincs kő: nem tiltunk, hanem egyedi egyeztetést kínálunk.
  - Gombok: „Érdekel ez a gyűrű”, „Személyes konzultációt kérek”.
- **Admin – új gyűrű felvitele** (Gyűrűk → „+ Új gyűrű felvitele”, `#/admin/gyuru/uj`): cikkszám, név, típus (pár / egy gyűrű), kép (fájl vagy webcím), aranyszínek, anyagok, szélességek, referenciaméret és tömeg, kőszabály, egyedi ár, „csak ajánlattal”, látható/rejtett. Mentés után megjelenik a vásárlói katalógusban és konfigurálható. Meglévő gyűrűnél is cserélhető a kép és a színválaszték.
- **Menü:** Gyűrűk · Saját ötlet · Az ötvös · Kapcsolat. A márkanév és a logó változatlan.

### Ami továbbra is csak böngészőoldali demó (nincs megvalósítva)
- Nincs szerver: az érdeklődések, az új gyűrűk és a feltöltött képek csak a böngésző localStorage-ában vannak; a „Demóadatok visszaállítása” törli őket.
- Az adminban kiválasztott képet kicsinyítve (max. 900 px) tároljuk; a böngésző tárhelye szűk, nagy képeknél betelhet (erre figyelmeztet).
- Az éles rendszerhez kell: központi adatbázis, bejelentkezéshez kötött admin, valódi képfeltöltés, szerveroldali mentés, e-mail értesítés.
- Nincs online fizetés, rendelés, 3D/CAD – és nem is cél ebben a körben.

### Jóváhagyandó (V3)
1. Tegeződés a vásárlói oldalon.
2. A főcím és a szövegek hangja.
3. „Több mint 30 év” pontos megfogalmazása; az ötvös neve, portréja, műhelyfotók.
4. Korábbi egyedi munkák fotói az inspirációs részhez.
5. A költségkeret-sávok a saját ötlet űrlapon (most demó).
6. Készülhet-e kő a férfigyűrűbe az egyes modelleken.
7. A szemléltető ábra maradjon-e, és milyen részletességgel.

### Tesztek
- `node --test tests/engine.test.mjs` → 39/39
- `python3 tests/e2e.py` → 30/30 · `python3 tests/mobile.py` → 26/26
- `python3 tests/v3.py` → 50/50 (1280 és 390 px): főcím és két út; az ötvös a nyitóképernyőn; „kevesebb” árak; fotó és ábra külön; az ábra követi a kőszámot, színt, anyagot, méretet; a két gyűrű külön szerkeszthető; egyedi kérés viszi a modell adatait; kép helyi előnézettel; nincs automatikus ár; az űrlap megőrzi az adatokat; visszaigazolás; admin megkapja; új gyűrű felvitele → katalógus → konfigurátor; nincs oldalra görgetés és JS-hiba.
- Verzió: `V3.0` (import map `?v=3.0`).

---

## V3.1–V3.2 – szakmai pontosítások az ügyfél jelzései alapján (2026. november 20.)

Az ügyféligények részletes, időkódos összevetése bizalmas, ezért nincs a nyilvános repositoryban (a DAEKON-nál érhető el).

- Kikerültek a túlzó állítások („ugyanaz az ember készíti”, „bármelyiken változtathatsz”); a gyűrű oldalán külön „Amit itt te állíthatsz” és „Amit külön egyeztetünk”.
- Titán: nincs grammár, az ár a munkából adódik → egyedi árajánlat.
- Szélesség: alapból nem választható online.
- Platina, palládium: csak fehér. Körbekövezett gyűrű: méretigazítási megjegyzés.
- A fotón „Valódi modellfotó” felirat; az űrlapokon „Ez bemutató, valódi adatot ne adj meg”.
- „Készült már ilyen is” szöveges lista, fotó nélkül, jelölve.

---

## V3.3 – három működési javítás (2026. november 20.)

Dizájn és kezdőoldal változatlan. Az ötvös számítási módszere változatlan (teszt ellenőrzi).

1. **Ár nélküli (priceOnRequest) modellek:** eddig kimaradt a konfigurátor. Most ugyanúgy beállítható, amit a modell enged (anyag, finomság, szín, méret, kő, gravír), de árkülönbség és ár helyett „Egyedi árajánlat szükséges” áll, a gomb „Árajánlatot kérek erre a gyűrűre”. A beállítások bekerülnek az érdeklődésbe és az egyedi kérésbe.
2. **Szélesség következetesen:** a motor mindig a modell saját szélességével számol (`normalizeConfig`), linkből vagy máshonnan sem állítható át. Az adminból kikerült a „Szélességek” lista; gyűrűnként egy „Szélesség” mező van, azzal a megjegyzéssel, hogy a vásárló online nem választhat mást. A vásárlói oldalon: „online nem választható, más szélesség személyes egyeztetéssel”.
3. **Élesítési ellenőrzés** (`engine.readiness`, admin → Jóváhagyásra vár): amíg bármely árat befolyásoló adat nem „jóváhagyott”, az élesítés gombja tiltott. Ide tartozik a grammár, a gyémántárak, a kerekítés, az ÁFA-beállítás, a gravír- és foglalási díj, a számítási mód, a tömegarányok és a gyűrűk tömeg- és kőadatai. Az ügyfél példája sem számít jóváhagyottnak. Az ÁFA-beállítás jelölése „jóváhagyott”-ról „demó”-ra változott. A bemutató továbbra is számol a demóadatokkal, jelölve.

Tesztek: motor 46/46, asztali 30/30, mobil 26/26, V3 66/66. Verzió `V3.3`, localStorage-kulcs `karikagyuru-demo-v12`.

---

## V3.4 – az élesítési ellenőrzés két logikai javítása (2026. november 20.)

Megjelenés, vásárlói szövegek és a kalkulációs módszer változatlan.

1. **Titán:** a `readiness()` nem követel jóváhagyott titán-grammárat. Azt ellenőrzi, hogy a titánhoz NINCS grammár megadva; ha valaki mégis megad, az blokkol (jóváhagyott jelöléssel is). A motor ezen felül titánnál soha nem számol tömeg- vagy anyagalapú árat, egyik árképzési módban sem – mindig egyedi ajánlat.
2. **Tényleges érvényesség:** a `readiness()` a jelölésen túl az értékeket is vizsgálja. Hiányzó vagy hibás grammár, kőár, kőátmérő, kerekítés, ÁFA, gravír- és foglalási díj, tömegarány, számítási mód, illetve gyűrűnként hiányzó tömeg, hibás méret, szélesség vagy kőszabály jóváhagyott jelöléssel is blokkol. A blokkolók típusa: `jovahagyas` vagy `ervenytelen`. Rejtett gyűrű nem blokkol; ár nélküli modellnél a tömeg nem kötelező.
3. **Admin:** a dobozban külön sor: „Ez csak előzetes ellenőrzés a látványtervben. Valódi élesítéshez szerveroldali ellenőrzés és hitelesített admin szükséges.” A hiányzó vagy hibás adatok külön listában látszanak.

Tesztek: motor 67/67 (21 új az élesítési ellenőrzésre), asztali 30/30, mobil 26/26, V3 70/70. Verzió `V3.4`.


## V4 – fejlesztés az új ügyféligények alapján (2026. november 20.)

Kiindulás: V3.4. A meglévő oldal nem épült újra; a számítási módszer és az árak nem változtak.

**Gyűrűnkénti lehetőségek (adatmodell + motor).** Minden terméknél `opts.width` (engedélyezve?, min, max, lépés, jóváhagyva?), `opts.thickness` (engedélyezett értékek, jóváhagyva?), `sizeMin/sizeMax`, `consult[]` (egyeztetést igénylő módosítások), `models3d[]`. Szélesség vagy vastagság **csak akkor választható, ha az adott gyűrűnél engedélyezve ÉS jóváhagyva van** – különben a V3.4 viselkedése él (a gyűrű saját szélessége látszik). A vásárló látja az okot, ha valami nem választható. A numerikus ellenőrzés nem gyárthatósági ígéret; ezt az admin és a vásárlói oldal is kiírja.

**Kezelőfelület.** Főmenü öt feladattal: 1. Árak, 2. Gyűrűk, 3. Fotók, 4. Szabályok, 5. Érdeklődések. Árak: árverzió és érvényesség kezdete, hiányzó adatok doboza, változatlista visszaállítással; a korábbi előtte–utána összevetés és megerősítés megmaradt. Fotók: kép cseréje gyűrűnként (a bemutatóban kicsinyítve, a böngészőben). Szabályok: gyűrűnkénti áttekintés, „csak ami jóváhagyásra vár” szűrő. Gyűrű szerkesztése: „Mit állíthat a vásárló ezen a gyűrűn?” – méretek, szélesség, vastagság, figyelmeztetések (pl. 3,5 mm alatti sima aranygyűrű, 1,2–1,3 mm vastagság), egyeztetést igénylő módosítások, 3D-modellek listája.

**Vásárlói oldal.** Katalóguskeresés; nem elérhető fémek letiltva, indoklással; „Amit külön egyeztetünk” lista a gyűrű saját tételeivel.

**Szerveroldal (váz, nincs élesítve, nincs bekötve).** `services/karikagyuru-api/` – PHP 8.1+ és SQLite, külső csomag nélkül: jelszavas belépés, CSRF, változatkezelt mentés, érdeklődések, ellenőrzött képfeltöltés. Helyi teszt: `python3 services/karikagyuru-api/tests/api_test.py` (58 ellenőrzés). A látványterv továbbra is `localStorage`-ba ment.

**Dokumentumok.** `docs/ELSO_ATADAS.md` (A: első átadás, B: későbbi fejlesztések, C: élesítéshez szükséges hozzáférések, adatok, jóváhagyások), `docs/RHINO_3D.md` (hogyan lesz `.3dm`-ből webes modell; nincs megvalósítva).

**Adatvédelem.** A bizalmas igénymátrix kikerült a nyilvános tárolóból (a git-előzményben a korábbi commitokban még megvan – eltávolítása külön döntés). Ügyfél CAD-fájl nincs a tárolóban.

Tesztek: motor 73/73, asztali 30/30, mobil 26/26, V3 70/70, V4 54/54, API 58/58. Verzió `V4.0`, tárolókulcs `karikagyuru-demo-v13`.

## V5 – prémium arculati átdolgozás (2026. november 20.)

Funkció, ár és számítás nem változott; a meglévő szerkezetre került egy új arculati réteg (`css/kg.css`, „V5” blokk).

- **Tipográfia:** a címek Libre Baskerville-lel (helyben tárolt betűtípus), mérsékelt méretben; a szövegtörzs Manrope maradt.
- **Színek:** a karikagyuru.com kékje csak kiemelés (vonalak, sorszámok, linkek); az elsődleges gomb sötét. A fotók körüli felületek a termékfotók saját háttérszínét (#F4F8FB) kapják, így nincs „kép a dobozban” hatás.
- **Kezdőlap:** a hero rajzolt körös kompozíciója helyett nagy, valódi termékfotó; alatta négy rövid tény (rendelésre készül, természetes gyémánt, ötvössel tervezed, Budapest VIII.). Kevesebb keret, vékonyabb elválasztók.
- **Termékoldal:** asztali gépen a fotó alatt ár-dokk – görgetés közben is látszik az aktuális ár és az „Érdekel ez a gyűrű” gomb. A nem választható szélesség/vastagság tömör sorban, okkal. Telefonon a cím és az ár közvetlenül a fotó után jön.
- **Bemutató-jelölések:** megmaradtak, de visszafogottabbak (pontozott aláhúzás).
- **Admin:** a főmenü csempéi kisebb betűmérettel.

Tesztek: motor 73/73, asztali 30/30, mobil 26/26, V3 70/70, V4 54/54, V5 38/38 (új), API 58/58. Verzió `V5.0`.


## V5.1 – bemutató-feliratok nélkül (2026. november 21.)

- Eltűnt a felső bemutató-sáv (nézetváltó, forgatókönyv, demóadatok gomb) és minden „demó”/„Bemutató” felirat. A kezelőfelület a lábléc „Kezelőfelület” linkjéről érhető el, onnan „← Vissza a weboldalra”.
- **A jóváhagyás nem változott:** az árak attól nem lettek jóváhagyottak, hogy a felirat eltűnt. A kezelőfelület „Jóváhagyásra vár” oldala és az élesítési ellenőrzés ugyanúgy jelzi a hiányzó jóváhagyásokat („jóváhagyásra vár” címkével).
- A kitalált aranyár-előzmények és a rájuk épülő grafikon törölve – felirat nélkül valódi adatnak tűntek volna. Az árnapló a kiinduló bejegyzéssel indul, a grafikon csak valódi, itt mentett változásokból rajzolódik.
- Az űrlapok visszajelzése igaz maradt: helyi módban azt írja, hogy az érdeklődés a kezelőfelületre került; a saját ötlethez választott kép nem töltődik fel, ezt kiírja, és e-mail-címet ad.

## V5.2 – szerveres mentés bekötve (2026. november 21.)

- `js/api.js`: ha az `index.html` `kg-api` metája ki van töltve, az oldal a szerverről tölti az árakat, a kezelőfelület jelszót kér, minden mentés a szerverre megy változatként, az érdeklődések a szerverre kerülnek, a fotókból a szerver optimalizált JPEG-et készít (max. 2400 px; az eredeti fájl nem marad meg). Üres metával (GitHub Pages) minden a böngészőben marad.
- Mentésjelző a kezelőfelületen („Mentve a szerverre hh:mm”, piros hiba, ha nem sikerült – a hiba felugró üzenetben is). Ütközésnél (két helyről mentenek) a második mentés nem ír felül.
- Kilépés gomb; a látogató a fül újra-előtérbe kerülésekor friss árakat kap.
- Fejlesztői környezet: `services/karikagyuru-api/dev/router.php` (oldal + API egy címen).

Tesztek: motor 73/73, asztali 30/30, mobil 26/26, V3 70/70, V4 54/54, V5 38/38, V5.1 32/32 (új), API 60/60, szerver mód böngészőből 18/18 (új). Verzió `V5.2`, tárolókulcs `karikagyuru-demo-v14`.


## V5.3 – ügyfélátadásra felkészítés (2026. november 21.)

- **Fokozatos jóváhagyás.** Új motorfüggvények: `priceTrust` és `shownPrice`. A vásárló számolt árat csak akkor lát, ha a gyűrű jóváhagyott, és a beállítás minden felhasznált árelemét (grammár, kőár, számítási szabály, gravírdíj) az ötvös jóváhagyta.
  - Nem jóváhagyott gyűrű: a katalógusban marad. Az alapváltozatnál a karikagyuru.com mostani listaárát mutatja, „Jelenlegi listaár – alapváltozat” felirattal, máskor „egyedi ajánlat”-ot. Online beállítás nincs, helyette ajánlatkérés. Becsült tömeg és gyűrűnkénti árbontás sem jelenik meg.
  - A beállítás-link (`?k=`) sem nyit ki nem jóváhagyott beállítást.
- **Jóváhagyás sorban** (`#/admin/sorban`). Egy gyűrű egyszerre, a jóváhagyandó adatokkal: tömeg, szélesség, méretek, kőszabály, választható opciók, számolt ár és a mostani listaár. Gombok: „Rendben, jóváhagyom”, „Javítani kell”, „Később”, illetve visszavonás. Haladásjelző mutatja, hány gyűrű van kész. A főmenü 4. csempéje ide visz.
- **Szerver mód, hibák.**
  - API-kiesés induláskor: a kezelőfelület helyett zárolt képernyő jelenik meg, és a böngészőbe sem ment semmit.
  - Sikertelen mentés: a kezelőfelület zárolódik, és a szerveren ténylegesen meglévő állapot töltődik vissza. Nem mentett változás nem marad a képernyőn.
  - Lejárt belépés: belépőképernyő jelenik meg, „NEM került mentésre” üzenettel; belépés után a szerver állapota látszik.
  - A „Mentve” felugró üzenet szerver módban csak a szerver visszaigazolása után jelenik meg, addig „Mentés folyamatban”.
- **Érdeklődés.** Semmilyen hiba esetén nincs „sikeres” visszajelzés (szerverhiba, kiesés, betelt böngészőtárhely), helyette hibaüzenet és telefonszám. Helyi módban a visszajelzés azt írja, ami igaz: az érdeklődés a kezelőfelületre került, értesítést az ötvös nem kap.
- **Képfeltöltés leírása.** A szerver optimalizált JPEG-et készít (legfeljebb 2400 px, EXIF nélkül), az eredeti fájl nem marad meg.
- **Dokumentumok.** `docs/TELEPITES.md` (telepítési és élesítési ellenőrzőlista, SEO-val); `ELSO_ATADAS.md` frissítve. A git-előzmény tisztítási terve privát dokumentum, nem került a repóba.
- **Tesztek.** Új: `tests/v53.py` (helyi, kiinduló adatokkal, 34), `services/karikagyuru-api/tests/server_failures_e2e.py` (17). A konfigurátort vizsgáló régebbi csomagok egy közös előkészítő lépéssel (`tests/kg_common.py`) minden adatot jóváhagynak, a nem jóváhagyott viselkedést a V5.3-tesztek nézik. Verzió `V5.3`.


## V5.4 – az első éles átadást akadályozó hibák javítása (2026. november 21.)

- **Nyilvános `/api/state`.** A látogató csak szűkített nézetet kap (`App::publicState`):
  - csak a jóváhagyott grammárakat és kőárakat;
  - a nyilvános oldalhoz szükséges beállításokat;
  - a látható gyűrűket, rögzített mezőlistával (gyűrűszinten munkadíj nélkül);
  - egyedi árat és minimumárat csak jóváhagyott gyűrűnél;
  - a „frissült ár” jelzést csak jóváhagyott gyűrűre.

  Kimarad: beszerzési referenciaárak, felárak, anyagveszteség, munkadíj-szorzó, árrés-küszöb, árnapló, érdeklődések, megjegyzések, rejtett gyűrűk, 3D-adatok és a belső jóváhagyási címkék. Költségalapú módban nincs nyilvános grammár. Az admin a teljes állapotot kapja, belépés után mindig újratöltve. A nyilvános nézet visszamentését a szerver elutasítja.
- **`priceTrust` felülvizsgálat.** Új feltételek:
  - mindig: tömegarány anyagonként, doboz díja (0-ként is);
  - kövek esetén: foglalási díj (0-ként is), tanúsítvány, bruttó/nettó kőár, kőelférési szabály, nettó kőárnál a kőfelár és az ÁFA;
  - költségalapú módban: referenciaár, anyagveszteség, munkadíj-szorzó, felárak, ÁFA.

  Rögzített ár csak jóváhagyott gyűrűn számít. A listaár a nyilvános nézetben is megjelenik, ahol a motor számolni sem tud.
- **E-mail-értesítés** (`src/Mailer.php`). Alapból kikapcsolt. Módok: kikapcsolt, fájlba írás vagy SMTP. A beállítás az adatmappában van (`mail.json`) vagy környezeti változóban.
  - Hiányos beállításnál nem küld, titkosítatlan SMTP-t csak helyi géppel enged.
  - A fejlécinjekció ellen védett.
  - A levél az érdeklődés mentése után indul; hibánál az érdeklődés megmarad, és a kezelőfelület jelzi.
  - Próbalevél csak admin gombnyomásra megy. Valódi levél nem ment ki.
- **GitHub Pages és szerver mód.** Helyi módban az űrlap előre és beküldés után is kimondja, hogy az üzenet nem jut el az ötvöshöz, és telefonszámot, e-mail-címet ad. A különbségek táblázata: `docs/TELEPITES.md`, melléklet.
- **Tesztek.** Motor 97 (+18 V5.4-es), API 87 (+23 szivárgás-ellenőrzés), levelezés 24 (új), szerver mód 25. Verzió `V5.4`.

## V5.5 – célzott minőségi javítások (2026. november 21.)

- **Jóváhagyás visszavonása mezőszinten:** ha egy jóváhagyott gyűrű ára, tömege, mérete, vastagsága, kőszabálya vagy
  gyártási paramétere (anyag, szín, választható szélesség/vastagság, munkadíj) változik, a jóváhagyás automatikusan
  visszavonódik, és bekerül az előzményekbe. Fotó és leíró szöveg nem vonja vissza.
- **Jótállás:** a hibás „1 év jótállás” helyett általános szöveg (a hatályos jogszabályok szerint, a jótállási jegyen
  rögzített feltételekkel). Új kötelezettséget az oldal nem vállal az ügyfél helyett.
- **Belső árak a nyilvános kódból kivéve:** `js/data.js` semleges; a mintaadat `services/karikagyuru-api/dev/demo-dataset.json`.
- **Nem éles bemutató 3 gyűrűvel:** `bash services/karikagyuru-api/dev/bemutato.sh` (anyag, méret, természetes gyémánt,
  ár frissülése, központi grammár hatása, admin jóváhagyás). „Bemutató példány” felirattal, élesítést blokkoló jelzéssel.
- **Referenciakép-feltöltés a szerverre:** JPG/PNG/WebP, 8 MB, max. 3, újrakódolás, privát tárolás, csak admin látja,
  törlés és megőrzési idő (`bin/purge.php`).
- **Adatkezelési link** mindkét űrlap mellett (`BUSINESS.adatkezeles` – az ügyfél végleges tájékoztatójára cserélendő).
- **SEO:** `docs/SEO_MIGRACIO.md` – valódi útvonalak, szerveroldali fej, sitemap, 301-es átirányítások.
