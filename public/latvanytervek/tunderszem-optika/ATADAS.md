# Tündérszem Optika — látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/tunderszem-optika/
**Koncepció (3 irány):** https://daekon-ship.github.io/daekon/latvanytervek/tunderszem-optika/koncepcio.html
**Állapot:** 1. kör, előzetes látványterv (noindex). Build nélküli statikus oldal: `index.html` + `tunderszem.css` + `tunderszem.js`.

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

## Art direction — „Herbárium a lencse mögött”
A meglévő virágos, madaras, pasztell arculat érett újraolvasása: botanikai tábla / herbáriumlap esztétika, vékony vonalas rajzok, papírlapok, címkék („No. 01”). Nincs gyerekes, mesekönyves rajzstílus: tiszta tónusok, sok levegő, finom vonalak.

**Szignatúra:** a hero szemüvege valódi lencseként működik — a háttér (látásvizsgáló tábla „T / Ü N / D É R / S Z E M / O P T I K A”, virágok) elmosódott, a két lencse mögött élesen és enyhén nagyítva látszik. Egérre követi a mutatót, érintőn lassan „körbenéz”, görgetésre kicsit felemelkedik.

## Tipográfia
| Szerep | Betű | Méret (clamp) |
|---|---|---|
| H1 | Cormorant Garamond 500, harmadik sor dőlt 450 | 2.6rem → 3.6rem |
| H2 | Cormorant Garamond 500 (+ dőlt kiemelés) | 2.05rem → 3rem |
| H3 / kártyacím | Cormorant Garamond 500 | 1.6–1.75rem |
| Törzs | Manrope 450 | 1.0625rem / 1.65 |
| Szemöldök, címkék | Manrope 650–700, nagybetű, .18–.22em | .66–.72rem |

Mérsékelt méretek (házszabály: nincs óriás tipó, a lábléc-felirat is 2.9rem max). Fraunces sehol. Betűk helyben: `fonts/` (Cormorant Garamond változó, latin + latin-ext subset; Manrope változó), OFL-licencek mellékelve.

## Színek (tokenek a `:root`-ban)
`--pearl #F7F1F7` alap · `--powder #E9C5D9` · `--lavender #B8A3D8` · `--mist #9CB9C6` · `--ink #263432` · `--white`
Származtatott: `--lav-deep #6C5A97` (dőlt kiemelések, AA), `--mist-deep #46707F` (szemöldök), `--rose #C98FB0` (címkék), `--ink-soft #4C5957` (törzsszöveg).
Szekciósávok: gyöngyház → fehér (szolgáltatások) → gyöngyház–ködkék (vitrin) → gyöngyház → fehér → levendula-tint (vélemények) → gyöngyház → grafit lábléc.

## Térköz, rács
- Konténer 1240 px, oldalsáv `clamp(20px, 5vw, 56px)`, szekció `clamp(96px, 11vw, 168px)`.
- Szolgáltatások: 12 oszlopos aszimmetrikus „herbárium” (7/5, 5/6 eltolva, 5/7), széles kártyák vízszintesek; ≤980 px két oszlop eltolással, ≤640 px egy oszlop.

## Reszponzív
- ≤980 px: hamburger menü (teljes képernyős lap), hero sorrend: cím → szemüveg (kivágott viewBox) → szöveg → gombok.
- ≤759 px: alsó hívássáv (Hívás / Útvonal), a `body` alsó paddingje pontosan akkora, nem takar tartalmat; kategóriák vízszintes chipekként.
- Ellenőrizve: 360, 390, 430, 768, 1024, 1440, 1920 px — nincs vízszintes görgetés, nincs konzolhiba.

## Mozgás (GSAP 3 + ScrollTrigger, helyben: `js/`)
| Elem | Mit csinál | Indító | Átadás / reduced-motion |
|---|---|---|---|
| Hero keret | A keret körvonala megrajzolódik (stroke-dashoffset, 1,5 s), utána csillanás, karok | betöltés (CSS) | rögtön kész állapot |
| Hero cím | Soronként maszkból felcsúszik | betöltés | statikus |
| Lencse-élesség | Keret + clipPath + nagyított éles réteg követi az egeret / érintőn lassú pásztázás / görgetésre emelkedés | pointer, idő, scroll | statikus középen; rAF megáll, ha a hero nem látszik |
| Pasztell fényfoltok | 26–38 s-os lassú sodródás | folyamatos | nincs mozgás |
| Szekciócímek | Szavanként maszkból | scroll (86%) | statikus |
| Történet lapok | Alulról nyíló clip-path + kép kicsinyedés; levendulaág és fotólap parallax | scroll | statikus |
| Szolgáltatáskártyák | Csoportos felúszás; hoverre a rajz billen | scroll / hover | statikus |
| Vitrin | Kategóriaváltáskor a keret Y-tengely körül átfordul; egérre 3D-billenés | kattintás, nyilak / pointer | azonnali csere |
| Összehasonlító | Belépéskor egyszer „megmutatja” a csúszkát (50→28→66→50) | scroll | nincs bemutató |

Nincs blokkoló intro, nincs scrolljacking.

## Komponensek
`btn` (ink/line/small/wide) · `sheet` (herbáriumlap + címke) · `card` (+`--wide`) · `tabs`/`stage` (vitrin) · `compare` (csúszka: pointer + rejtett range a billentyűzethez) · `values` · `review` (+`--slot`) · `hours` (mai nap kiemelés, „Most nyitva” Europe/Budapest szerint) · `callbar`.

## Mi kell élesítéshez (és mi nincs benne)
- GSAP + ScrollTrigger: benne (ingyenes licenc). Three.js/WebGL, React Bits, HorizonX: **nincs használva**, nem is szükséges.
- React + TypeScript + Tailwind átírás opcionális; a mostani statikus felépítés komponensenként átvihető.
- Rajzok forrása: `_forras/rajzok.py` → `img/*.svg` (újragenerálható). Valódi fotó cseréje: az `img` `src`-je a `sheet`, `card__plate` és `stage__frame` elemekben.
- Adatkezelési tájékoztató, süti-sáv: még nincs.
