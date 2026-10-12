# Tető.pro (Tetőszakértő) — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/tetopro/
Fájlok: `index.html`, `tetopro.css`, `tetopro.js`, `logo-jelveny.svg`, `logo-fekvo.svg`, `jel.svg`, `fonts/archivo.woff` (helyben), `img/` (15 saját fotó, WebP, 800 és 1600 px).
A régi webnode-os oldalhoz nem nyúltunk; a terv `noindex`.

## 2. kör – a vezető tetőfedő oldalak mintájára
Az 1. kört („minimalista”, egyszerű betűlogó) az ügyfél gyengének találta. 14 vezető tetőfedő/tetőanyag oldalt fényképeztünk le asztalon és mobilon (Premier Roofing, Schulte, Bone Dry, Artisan, Malarkey, PREFA, Rheinzink, Velux, Heidler, Shingle Savers stb.), és az ott bevált elemekre építettük újra:
- **Jelvény-logó** (`logo-jelveny.svg`): tetőgerinces pajzs, sárga szalagon TETŐ.PRO, alatta TETŐSZAKÉRTŐ. Fekvő változat a fejlécbe (`logo-fekvo.svg`), kis jel faviconnak (`jel.svg`, TP). Lapos színek, nincs fémes csillogás. Görbékké alakítva.
- **Színek:** fekete #0F1011, antracit #1A1C1F, jelzősárga #FFC20E, törtfehér #F3F2EF. Erős sárga sávok (bizalmi sáv, ajánlat), a sávok és a garancia-blokk teteje **tetőgerinc alakú** (clip-path).
- **Betű:** Archivo (helyben), vastag, csupa nagybetűs címek mérsékelt méretben (H1 max. 54 px, mobilon 34–42 px).
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
