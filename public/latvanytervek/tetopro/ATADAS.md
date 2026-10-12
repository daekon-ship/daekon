# Tető.pro (Tetőszakértő) — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/tetopro/
Fájlok: `index.html`, `tetopro.css`, `tetopro.js`, `logo-jelveny.svg`, `logo-fekvo.svg`, `jel.svg`, `fonts/archivo.woff` (helyben), `img/` (15 saját fotó, WebP, 800 és 1600 px).
A régi webnode-os oldalhoz nem nyúltunk; a terv `noindex`.

## 9. kör – végleges logó (az ügyfél által választott minta alapján)
- Saját rajz (az ügyfél az 1. – kalapácsos – változatot választotta): kiemelt, vastag tető két tetősíkkal (bal világosabb, jobb sötétebb), eresz alatti éllel, cserépsorokkal és eltolt cserépillesztésekkel, élfénnyel, gerinccseréppel, kéménnyel; a jobb lejtőn ácskalapács (gumis nyél, acélfej, kettéosztott karom). Ablak nincs; alatta vastag, keskeny „TETŐ” (borostyán) + „.PRO” (acélszürke), majd „TETŐSZAKÉRTŐ” vonalak között. Fájlok: `logo-teljes.svg` (sötét alapra), `logo-teljes-vilagos.svg` (világos alapra), `logo-jel.svg` (csak a tető, a fejlécbe). A fejlécben: tető felül, alatta HTML-szöveg (TETŐ borostyán, .PRO fehér, TETŐSZAKÉRTŐ). Lábléc: a teljes logó.

## 7. kör – fejléc-logó (felülírva)
- A fejlécben és a láblécben a logó: lekerekített sötét jel (`jel.svg`: borostyán tető kéménnyel, ház-körvonal, fehér TP) + HTML-szöveg „TETŐ.PRO” (19–21 px) és „TETŐSZAKÉRTŐ” (10,5–11 px, borostyán) – a korábbi SVG-ben az alsor alig látszott. A `jel.svg` a favicon is.

## 8. kör – kompaktabb mobil
- Szolgáltatások mobilon lapozás helyett 2 oszlopos rács (6 négyzetes kép, rajta a cím); tableten 3 oszlop.
- A nagy telefonszám az ajánlat-szakaszban 18 px (asztalon 20 px).

## 9. kör – végleges logó (az ügyfél által választott minta alapján)
- Saját rajz (az ügyfél az 1. – kalapácsos – változatot választotta): kiemelt, vastag tető két tetősíkkal (bal világosabb, jobb sötétebb), eresz alatti éllel, cserépsorokkal és eltolt cserépillesztésekkel, élfénnyel, gerinccseréppel, kéménnyel; a jobb lejtőn ácskalapács (gumis nyél, acélfej, kettéosztott karom). Ablak nincs; alatta vastag, keskeny „TETŐ” (borostyán) + „.PRO” (acélszürke), majd „TETŐSZAKÉRTŐ” vonalak között. Fájlok: `logo-teljes.svg` (sötét alapra), `logo-teljes-vilagos.svg` (világos alapra), `logo-jel.svg` (csak a tető, a fejlécbe). A fejlécben: tető felül, alatta HTML-szöveg (TETŐ borostyán, .PRO fehér, TETŐSZAKÉRTŐ). Lábléc: a teljes logó.

## 7. kör – fejléc-logó (felülírva)
- Fejlécben és láblécben: lekerekített sötét jel (`jel.svg`: borostyán tető kéménnyel, ház-körvonal, fehér TP) + HTML-szöveg „TETŐ.PRO” (19–21 px) és „TETŐSZAKÉRTŐ” (10,5–11 px, borostyán) – a korábbi SVG-ben az alsor alig látszott. A `jel.svg` a favicon is.

## 6. kör – szebb
- Minden fotó egységes színezést kapott (finom kontraszt, visszafogott kék ég, meleg tónus, enyhe élesítés) – a telefonos képek így egy sorozatnak hatnak. Az eredeti képek a régi oldalon megvannak.
- Mobilon a nyitókép teljes képes, a szöveg a fotón ül. Betöltéskor a kép lassan „beáll” (18 mp-es finom közelítés), a szöveg soronként beúszik.
- Szolgáltatás-kártyák: a cím és a leírás a fotón, sötét átmeneten (magazinszerű).
- Kiemelt munka fotója „Saját munka” címkét kapott; a szakaszok görgetésre finoman jelennek meg (a vízszintesen lapozható kártyák nem). Csökkentett mozgásnál minden animáció kikapcsol.

## 5. kör – tiszta újraírás (érvényes alap)
A korábbi rétegzett javítások helyett egy egységes CSS (`tetopro.css`) és egyszerűbb HTML.
- Kompakt: H1 27 / 34 / 42 px, szakaszcímek 22 / 28 px, szöveg 15 px; szakaszközök 48 / 64 / 80 px. Oldalhossz mobilon ~6 000 px.
- Sorrend: fejléc → nyitókép (cserépfedés-fotó, asztalon felmérés-kártya) → bizalmi sor → szolgáltatások (mobilon lapozható kártyák) → kiemelt munka (tetőtér-bővítés előtte/közben/utána + tények) → folyamat → munkáink (szűrhető galéria) → Rólunk + térkép → GYIK → ajánlat (sötét, űrlap) → lábléc.
- Színek: grafit #14191E, papír #F5F4F1, borostyán #F5B21B. Mondatkezdő címek, nincs csupa nagybetű, nincs tetőgerinc-levágás.
- Szövegtördelés: nincs `nowrap`; a „200 km‑es” és a telefonszám nem törhet szét. Gépi ellenőrzés 320, 360, 375, 412, 768, 1024, 1440 px-en: nincs kilógó vagy levágott szöveg, nincs vízszintes görgetés.

## 2. kör – a vezető tetőfedő oldalak mintájára
Az 1. kört („minimalista”, egyszerű betűlogó) az ügyfél gyengének találta. 14 vezető tetőfedő/tetőanyag oldalt fényképeztünk le asztalon és mobilon (Premier Roofing, Schulte, Bone Dry, Artisan, Malarkey, PREFA, Rheinzink, Velux, Heidler, Shingle Savers stb.), és az ott bevált elemekre építettük újra:
- **Jelvény-logó** (`logo-jelveny.svg`): ház alakú jelvény túlnyúló tetővel és kéménnyel, sárga szalagon TETŐ.PRO, alatta TETŐSZAKÉRTŐ (az ügyfél a hatszögletű pajzs helyett ezt választotta). Fekvő változat a fejlécbe (`logo-fekvo.svg`), kis jel faviconnak (`jel.svg`, TP). Lapos színek, nincs fémes csillogás. Görbékké alakítva.
- **Színek (3. kör):** kékes grafitfekete #13181D, antracit #1C232A, meleg borostyánsárga #FFB81C, törtfehér #F2F1ED – a tiszta fekete + citromsárga helyett, nemesebb hatás. Logók mindenhol kisebbek; mobilon vízszintes csempesor, soros szolgáltatás-kártyák, egyforma galériarács, nagyobb térképfeliratok. Erős sárga sávok (bizalmi sáv, ajánlat), a sávok és a garancia-blokk teteje **tetőgerinc alakú** (clip-path).
- **Betű:** Archivo (helyben), vastag, csupa nagybetűs címek mérsékelt méretben (4. kör, kompakt: H1 38 / 25 px, szakaszcímek 28 / 21 px, mondatkezdő írásmód; mobilon nincs infósáv, felmérés-kártya és csempesor – a hero rövid, az oldal ~10 600 → ~7 000 px).
- **Felső infósáv + ragadós fejléc** sárga alsó vonallal, a fejlécben „Hívjon most” gomb.
- **Nyitókép:** teljes képes háttér (elkészült tetőtér-bővítés), címkék, H1, 3 pipás bizalmi pont, Hívás / Ajánlat gomb, jobbra **2 lépéses felmérés-kérő kártya** ikonos munkatípus-választóval, „Garancia” pecsét.
- **Ráúszó csempék** (Tetőfedés, Lemezfedés, Bádogos munkák) a nyitókép aljára.
- Szolgáltatás-kártyák ikonjelvénnyel, garancia-blokk a jelvénnyel és tényekkel, 4 lépés pajzs-számokkal, munkák (előtte–közben–utána + szűrhető galéria nagyítóval), Rólunk + munkaterület-térkép, **GYIK**, sárga ajánlat-sáv űrlappal, lábléc.

## Tartalom forrása
- Régi oldal (tetofedoa-tol-z-ig.webnode.hu): szolgáltatások (tetőszerkezet, újítás, javítás, bővítés, új tető; PVC és bitumenes lapostető; bádogos munkák: ereszcsatorna, lefolyó, kemény szegély; teraszok, kocsibeálló), munkaterület (Csongrád, Bács-Kiskun, Pest megye, 200 km; Szeged, Hódmezővásárhely, Csongrád, Kecskemét, Szolnok, Budapest), „számlaképes”, „garanciával”, „ingyenes helyszíni felmérés”, e-mail samujanos777@gmail.com, „János tetőfedő”.
- Facebook (briefből): Tető.pro / Tetőszakértő, Bugyi, Ady Endre utca 8., +36 70 265 6704.
- Fotók: a régi oldal 15 egyedi saját munkafotója (duplikátumok nélkül); a drónkép fekete sávjai levágva. Stock/AI-kép nincs.

## Egyeztetendő az ügyféllel
- **Facebook / Messenger link** – most jelzőablak („egyeztetendő”).
- A „tetőtér-bővítés 3 lépésben” sor: a 2. és 3. kép biztosan ugyanaz a ház (ugyanaz a fa), az 1. („kiindulás”) feltételezés – ellenőrizni.
- Név a Rólunknál: „János és csapata” (a régi oldal fejlécéből). Vezetéknév nincs kiírva.
- A „Megyék”: a régi szöveg Csongrád megyét írt, itt Csongrád-Csanád szerepel; Jász-Nagykun-Szolnok Szolnok miatt került be.
- A felmérés-kérő kártya és az „Ajánlatkérés küldése” előre kitöltött e-mailt nyit (nincs háttérrendszer).
- A GYIK válaszai általánosak (pl. kivitelezési idő) – egyeztetendők.
- Domain: a terv tetopro-t használ névként; a valódi domain még nincs.

## Új referenciakép hozzáadása
`tetopro.js` → `GALERIA` tömb: új sor `{ nev, felirat, kat, h }`, a kép az `img/` mappába `<nev>-800.webp` és `<nev>-1600.webp` néven. Kategóriák: `tetofedes`, `lemez`, `egyedi`, `terasz`, `kozben` (több is lehet szóközzel). Az első 9 kép látszik, a többi az „Összes kép” gombbal.

## Ellenőrizve
- 390 px és 1440 px teljes oldalképen; nagyító (lapozás, Esc, fókuszcsapda), szűrő, űrlap-hibaüzenetek, mobilmenü működik, konzolhiba nincs.
- Minden telefonlink: `tel:+36702656704`. Csökkentett mozgás beállításnál az animáció kikapcsol.
