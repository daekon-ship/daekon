# Tündérszem Optika — látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/tunderszem-optika/
**Koncepció (3 irány):** https://daekon-ship.github.io/daekon/latvanytervek/tunderszem-optika/koncepcio.html
**Állapot:** 2. kör – prémium újratervezés (az 1. kör visszajelzése: „nem elég prémium”), előzetes látványterv (noindex). Build nélküli statikus oldal: `index.html` + `tunderszem.css` + `tunderszem.js`.

## Valós adatok (ellenőrizve)
- Tündérszem Optika, 5052 Újszász, Damjanich út 14. · +36 30 146 4644 · tunderszemoptika@gmail.com
- Hétfő–péntek 9:00–17:00, szombat–vasárnap zárva · 2020 óta működik
- Facebook: https://www.facebook.com/tunderszemoptika/
- Szolgáltatások és lencsetípusok: a megrendelő briefje alapján.
- Vélemények: két nyilvános vélemény (Z. B., Z. O. — magyarvelemeny.com) **saját szavakkal összefoglalva**, nem idézve.

## Egyeztetendő az ügyféllel
1. **Fotók** — nem fértem hozzá az üzlet saját képeihez (Facebook, logós JPG). Stockot nem használtam, ezért minden kép programból rajzolt illusztráció. Cserélendő/kiegészítendő: üzletportál, keretfal, vizsgálóhelyiség, keretek közelről.
2. **Logó** — a meglévő logó nem volt letölthető; a fejlécben tipográfiai változat (dőlt Cormorant „Tündérszem” + OPTIKA + kék madár) áll. Vektoros logó kell.
3. **Vélemények** — a végleges oldalra a Google/Facebook értékelések szó szerint, a szerzők hozzájárulásával. A két „Minta-hely” kártya kicserélendő.
4. **Díjak** — az optikaturul.eu „Turul” jelöléseit szándékosan nem tettem ki (nem ellenőrzött elismerés). Csak az ügyfél kérésére.
5. Időpontkérés jelenleg csak telefon + e-mail (mailto). Online foglalás opcionális későbbi fejlesztés, **nincs bekötve**.

## Art direction — 2. kör: „Maison”
Az 1. kör rajzos, pasztell kártyás világa túl „bájos” volt. A 2. körben butik-optika hangulat:
- **Renderelt keretek** (`_forras/rajzok.py`): acetát színátmenet, csúcsfény, belső él, lencse-tükröződés, rozéarany zsanér és szegecsek, vetett árnyék. A hero kerete füstös levendula acetát.
- **Rézmetszet-botanika**: körvonal + vonalkázás, kitöltés nélkül; a márka kék madara elegáns fecskeként (logójel is).
- **Nyomdai keretezés**: a hero kettős hajszálvonalas „lemezen” ül, sarokfeliratokkal (valós adatok: 2020, Damjanich út 14.).
- **Középre tett logó**, felső elérhetőségi sáv, szögletes gombok nagybetűs, ritkított felirattal, rozéarany hajszálvonalak.
- **Szolgáltatások „index”**: hat sor, bal oldalt ragadós metszet-előnézet, ami a sorra mutatva cserélődik.
- **Sötét vitrin** a kereteknek: reflektorfény, tükröződő padló, 3D-billenés, lapozó (01 / 05).
- **Utcakép**: építészeti vonalrajz a csúszkához. **Vélemények**: egyetlen nagy, dőlt idézetes lapozó. **Kapcsolat**: sötét/világos osztott blokk.
- Finom papírszemcse az egész oldalon.

**Tündér (2. kör kiegészítés):** a névből hiányzott a lényeg, ezért bekerült egy Rackham-hangulatú sziluett-tündér irizáló, erezett szárnyakkal és csillogó „tündérporral” (`_forras/tunder.py`). Hol: a hero szemüvegkeretén ül, és tündérport szór a lencsébe (a kerettel együtt mozog); a logójel és a favicon repülő tündér; repül a „Miért hozzánk” fejlécben, a Damjanich úti utcaképen és a sötét kapcsolat-blokkban; a díszítő csillagok is tündérpor-csillámok. A por finoman csillog (SVG-n belüli CSS, `prefers-reduced-motion` alatt áll).

**Szignatúra (maradt):** a hero szemüvege valódi lencseként élesít — mögötte a „TÜNDÉRSZEM” látásvizsgáló tábla és a metszett virág elmosódott, a lencsén át éles és nagyított. Egérre követ, érintőn lassan pásztáz, a vetett árnyék a lebegéssel együtt halványul.

## Tipográfia (3. kör: betűcsere)
Visszajelzés: a betűtípus nem tetszett (a Cormorant Garamond túl vékony, „ernyedt” volt). Új páros: **Bodoni Moda** (divat- és optikai márkák didóni antikvája) + **Jost** (Futura-szerű geometrikus groteszk). A Bodoni nagyobb méreten is mérsékelt optikai mérettel fut (`font-variation-settings: "opsz" 22`), hogy a hajszálvonalak ne vesszenek el; az ékezetes nagybetűk (É, Ő, Ű) nem vágódnak le.

| Szerep | Betű | Méret (clamp) |
|---|---|---|
| H1 | Bodoni Moda 450, harmadik sor dőlt | 2.35rem → 3.3rem |
| H2 | Bodoni Moda 440 (+ dőlt kiemelés) | 1.9rem → 2.75rem |
| H3 / sorcím | Bodoni Moda 420–440 | 1.34–1.95rem |
| Törzs | Jost 400 | 1.1rem / 1.68 |
| Szemöldök, címkék, gombok | Jost 500, nagybetű, .16–.3em | .62–.76rem |

Mérsékelt méretek (házszabály), Fraunces sehol. Betűk helyben: `fonts/` (Bodoni Moda + dőlt, Jost; változó, latin + latin-ext subset), OFL-licencek mellékelve.

## Színek (tokenek a `:root`-ban)
`--pearl #F7F1F7` alap · `--powder #E9C5D9` · `--lavender #B8A3D8` · `--mist #9CB9C6` · `--ink #263432` · `--white`
Származtatott: `--ink-deep #1C2625` (vitrin, lábléc, felső sáv), `--lav-deep #6C5A97` / `--lav-light #CDBBE3` (dőlt kiemelés világos/sötét alapon), `--gold #B8937A` (rozéarany hajszálvonalak), `--gold-text #8C6B58` / `--gold-light #D9C2AE` (címkék), `--ink-soft #4C5957` (törzsszöveg).
Sávok: felső sáv (grafit) → hero lemez (papír + púder fény) → szolgáltatás-sor → rólunk (gyöngyház) → index (papír) → vitrin (mély grafit) → utcakép (gyöngyház) → miért (fehér) → vélemények (levendula-tint) → kapcsolat (grafit | papír) → lábléc (mély grafit).

## Térköz, rács
- Konténer 1240 px, oldalsáv `clamp(20px, 5vw, 64px)`, szekció `clamp(104px, 12vw, 184px)`.
- Fejléc: 1 fr | logó | 1 fr rács; 1180 px alatt hamburger.

## Reszponzív
- ≤1180 px: hamburger menü. ≤980 px: hero sorrend cím → szemüveg (kivágott viewBox) → szöveg → gombok; az index sorai saját metszetet kapnak.
- ≤759 px: felső sáv rejtve, alsó hívássáv (Hívás / Útvonal), a `body` alsó paddingje pontosan akkora; a vitrin fülei vízszintesen görgethetők.
- Ellenőrizve: 360, 390, 430, 768, 1024, 1440, 1920 px — nincs vízszintes görgetés, nincs konzolhiba.

## Mozgás (GSAP 3 + ScrollTrigger, helyben: `js/`)
| Elem | Mit csinál | Indító | Átadás / reduced-motion |
|---|---|---|---|
| Hero keret + háttér | Elmosódott réteg, éles réteg, árnyék és keret lágyan beúszik | betöltés (CSS) | rögtön kész állapot |
| Hero cím | Soronként maszkból felcsúszik; sarokfeliratok utána | betöltés | statikus |
| Lencse-élesség | Keret + clipPath + nagyított éles réteg követi az egeret / érintőn pásztáz / görgetésre emelkedik; árnyék szélesedik-halványul | pointer, idő, scroll | statikus középen; rAF megáll, ha a hero nem látszik |
| Szekciócímek | Szavanként maszkból | scroll (86%) | statikus |
| Rólunk metszet | Alulról nyíló clip-path + kép kicsinyedés | scroll | statikus |
| Szolgáltatás-index | Sorok csoportos belépője; rámutatásra/fókuszra a sor kiemelődik, az előnézet áttűnik | scroll / hover / fókusz | azonnali csere |
| Vitrin | Belépéskor a keret felúszik; váltáskor ki- és becsúszik tükörképpel; egérre 3D-billenés | scroll / kattintás, nyilak / pointer | azonnali csere |
| Összehasonlító | Belépéskor egyszer megmutatja a csúszkát | scroll | nincs bemutató |
| Vélemények | Áttűnő lapozó (gombok, húzás) | kattintás / érintés | azonnali csere |

Nincs blokkoló intro, nincs scrolljacking.

## Komponensek
`btn` (ink/ghost/pearl/ghostlight/small/wide) · `hero__plate` + `corner` · `ribbon` · `engraving` · `photoslot` · `index`/`row` · `tabs`/`stage` (sötét vitrin) · `compare` (pointer + rejtett range a billentyűzethez) · `values` · `quote` lapozó · `hours` (mai nap, „Most nyitva” Europe/Budapest szerint) · `callbar`.

## Mi kell élesítéshez (és mi nincs benne)
- GSAP + ScrollTrigger: benne (ingyenes licenc). Three.js/WebGL, React Bits, HorizonX: **nincs használva**, nem is szükséges.
- React + TypeScript + Tailwind átírás opcionális; a mostani statikus felépítés komponensenként átvihető.
- Rajzok forrása: `_forras/rajzok.py` → `img/*.svg` (újragenerálható). Valódi fotó helye: `.photoslot__box` (rólunk), illetve az `engraving`, `index__frame` és `stage__frame` képei cserélhetők saját fotóra.
- Adatkezelési tájékoztató, süti-sáv: még nincs.
