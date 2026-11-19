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
