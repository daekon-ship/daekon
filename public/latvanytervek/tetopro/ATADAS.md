# Tető.pro (Tetőszakértő) — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/tetopro/
Fájlok: `index.html`, `tetopro.css`, `tetopro.js`, `logo.svg` (világos felirat, sötét alapra), `logo-sotet.svg` (világos alapra), `jel.svg` (ikon/favicon), `fonts/archivo.woff` (helyben), `img/` (15 saját fotó, WebP, 800 és 1600 px).
A régi webnode-os oldalhoz nem nyúltunk; a terv `noindex`.

## Arculat
- **Logó:** egyszerű, csak betűs: „tető.pro” (Archivo, vastag), fölötte egyetlen sárga tetővonal. Görbékké alakítva, betűtípus nélkül is működik. Két korábbi kör (fémes arany pecsét, illetve „Ő-ékezet” betűlogó) elvetve – túl AI-hatású / nem tetszett.
- **Színek:** fekete #111213, felület #18191B, törtfehér #F4F2EE, jelzősárga #F5B700 csak gombokra, kiemelésre. Egy világos szakasz (Rólunk) töri meg a sötétet. Nincs színátmenetes dísz, nincs arany csillogás.
- **Betű:** egyetlen család, Archivo (helyben, latin-ext, ő/ű rendben). Mérsékelt címméretek (hero max. 56 px, mobilon 34–40 px).

## Szekciók
Hero (teljes képes, a fotó betöltéskor soronként, az eresztől a gerinc felé „fedődik be” – ez az egyetlen nyitó animáció) → bizalmi sáv (4 elem) → Szolgáltatások (6 kártya; mobilon lapozható sor jelzőpontokkal; a lapostetőnél rajzolt rétegrend, mert nincs róla fotó) → Miért mi (6 előny + tények: garancia, számlaképes, ingyenes felmérés, 200 km) → Munkáink (tetőtér-bővítés 3 lépésben + szűrhető galéria, nagyító lapozással, húzással, billentyűvel) → Rólunk (világos, 150 km-es körös térkép Bugyi körül a célvárosokkal) → Hogyan dolgozunk (4 lépés, asztalon emelkedő „tetővonalon”) → Ajánlatkérés (hívás, Messenger, űrlap) → lábléc. Mobilon ragadós alsó sáv: Hívás most | Ajánlatkérés (a hero gombjai után jelenik meg).

## Tartalom forrása
- Régi oldal (tetofedoa-tol-z-ig.webnode.hu): szolgáltatások (tetőszerkezet, újítás, javítás, bővítés, új tető; PVC és bitumenes lapostető; bádogos munkák: ereszcsatorna, lefolyó, kemény szegély; teraszok, kocsibeálló), munkaterület (Csongrád, Bács-Kiskun, Pest megye, 200 km; Szeged, Hódmezővásárhely, Csongrád, Kecskemét, Szolnok, Budapest), „számlaképes”, „garanciával”, „ingyenes helyszíni felmérés”, e-mail samujanos777@gmail.com, „János tetőfedő”.
- Facebook (briefből): Tető.pro / Tetőszakértő, Bugyi, Ady Endre utca 8., +36 70 265 6704.
- Fotók: a régi oldal 15 egyedi saját munkafotója (duplikátumok nélkül); a drónkép fekete sávjai levágva. Stock/AI-kép nincs.

## Egyeztetendő az ügyféllel
- **Facebook / Messenger link** – most jelzőablak („egyeztetendő”).
- A „tetőtér-bővítés 3 lépésben” sor: a 2. és 3. kép biztosan ugyanaz a ház (ugyanaz a fa), az 1. („kiindulás”) feltételezés – ellenőrizni.
- Név a Rólunknál: „János és csapata” (a régi oldal fejlécéből). Vezetéknév nincs kiírva.
- A „Megyék”: a régi szöveg Csongrád megyét írt, itt Csongrád-Csanád szerepel; Jász-Nagykun-Szolnok Szolnok miatt került be.
- Az „Ajánlatkérés küldése” előre kitöltött e-mailt nyit (nincs háttérrendszer). A „1–2 munkanapon belül visszahívjuk” ígéret egyeztetendő.
- Domain: a terv tetopro-t használ névként; a valódi domain még nincs.

## Új referenciakép hozzáadása
`tetopro.js` → `GALERIA` tömb: új sor `{ nev, felirat, kat, h }`, a kép az `img/` mappába `<nev>-800.webp` és `<nev>-1600.webp` néven. Kategóriák: `tetofedes`, `lemez`, `egyedi`, `terasz`, `kozben` (több is lehet szóközzel). Az első 9 kép látszik, a többi az „Összes kép” gombbal.

## Ellenőrizve
- 390 px és 1440 px teljes oldalképen; nagyító (lapozás, Esc, fókuszcsapda), szűrő, űrlap-hibaüzenetek, mobilmenü működik, konzolhiba nincs.
- Minden telefonlink: `tel:+36702656704`. Csökkentett mozgás beállításnál az animáció kikapcsol.
