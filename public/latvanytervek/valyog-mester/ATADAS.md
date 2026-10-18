# Vályog-Mester — látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/
**Koncepció + arculat:** https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/koncepcio.html
**Állapot:** 1. kör, előzetes látványterv (noindex). A valyog-mester.hu élő oldal érintetlen.
**Felépítés:** build nélküli statikus oldal a DAEKON-látványtervek házszabálya szerint (`index.html` + `valyog.css` + `valyog.js`), relatív útvonalakkal – bármilyen almappában működik. A briefben javasolt React + Vite + TS stacket szándékosan nem vezettem be: a repó összes látványterve build nélküli, és a Vite a `public/` tartalmát változatlanul másolja. Éles oldalhoz a komponensek 1:1 átvihetők React/Vite-ba (lásd „Komponensek”).

## Valós adatok (ellenőrizve)
| Adat | Forrás |
|---|---|
| TURPA BUILD Kft., ügyvezető: Túró István | megrendelői brief, valyog-mester.hu, Daibau |
| +36 30 966 9528 · valyog.mester@gmail.com | valyog-mester.hu (tel: és mailto: linkek) |
| 5231 Fegyvernek, Lelovich György út 8/A | onlinecegbazis.hu (címként), brief |
| 20+ év szakmai tapasztalat (a mesteré, nem a Kft.-é) | valyog-mester.hu, Túró István saját szövege |
| Kft. alapítása: 2018 | megrendelői brief (az onlinecegbazis.hu oldalán nem szerepelt) |
| 5 fős csapat, saját jármű és eszközök | Daibau-profil |
| Szolgáltatások (vályog, vert fal, vegyes falazat, aláfalazás, betonozás, vakolás, glettelés) | valyog-mester.hu; kiegészítők (bontás, térkövezés, kerítés): Daibau, onlinecegbazis |

**Szándékosan kihagyva** (nem igazolható): 145+ projekt, 98% elégedettség, 100% garancia, „az ország egyik legmegbecsültebb” – ezek a régi oldalon szerepeltek.

## Képek – felmérés
| Kép | Forrás-URL | Méret | Besorolás | Felhasználva |
|---|---|---|---|---|
| logo.png | https://valyog-mester.hu/images/logo.png | 940×788 | régi logó (kék clipart-építő) | nem – új logó készült |
| hero.jpg | https://valyog-mester.hu/images/hero.jpg | 6048×4024 | nádtetős skanzenház – stock jellegű, ismeretlen eredet | nem |
| about.jpg | https://valyog-mester.hu/images/about.jpg | 5100×3400 | nádtetős ház – stock jellegű | nem |
| service1.jpg | https://valyog-mester.hu/images/service1.jpg | 4160×6240 | külföldi stílusú cottage – stock jellegű | nem |
| service2.jpg | https://valyog-mester.hu/images/service2.jpg | 3990×5164 | cseréptetős kis ház – stock jellegű | nem |
| service3.jpg | https://valyog-mester.hu/images/service3.jpg | 4160×6240 | nádtetős fehér cottage – stock jellegű | nem |
| Daibau „Építkezés” | https://www.daibau.hu/showfile.php?id=87480 | 1900×790 | drónfotó mellényes csapatról födémen; „© TURPA BUILD KFT” jelöléssel, de nem vályogmunka, és stock jellegű | nem – egyeztetendő |

Egyik kép sem bizonyíthatóan a cég saját munkája, ezért (házszabály: nincs stock/„AI kép”) **minden látvány programból rajzolt**: `_forras/texturak.py` (anyagtextúrák: vályog szalmával, vert fal, mész, homok, erdőzöld, papírszemcse – `img/tx-*.webp`), a hero és a falrajz inline SVG. Törött kép nincs (ellenőrizve 1440/768/390/360 px-en).

## Egyeztetendő az ügyféllel
1. **Saját munkafotók** – a „Munkanapló” 9 helye rajzolt helyőrző (jelölve). Csere: `valyog.js` → `WORKS` tömb, elemenként `src` + `alt`; ha van `src`, fotó jelenik meg rajz helyett. Előtte–utána párokhoz ugyanarról a falról két fotó kell.
2. **Túró István portréja** (valódi fotó; mesterségeset nem használtam).
3. **Cégjegyzékszám, adószám** – a láblécben „egyeztetendő”. Az onlinecegbazis.hu oldalán nem szerepeltek.
4. **Munkaterület** – a régi oldal „országos kiszállást” ír, a Daibau Fegyvernek + környék, más országrészek. A GYIK-ban Fegyvernek és Jász-Nagykun-Szolnok vármegye áll, távolabbra egyeztetéssel.
5. **Hívható időszak** (kapcsolat blokk).
6. **Adatkezelési tájékoztató** végleges szövege (a modálban vázlat).
7. A Daibau „Építkezés” fotó valóban a cég munkája-e.

## Működik / bekötendő
| Funkció | Állapot |
|---|---|
| Navigáció, mobilmenü (Esc, fókusz), horgonyok | működik |
| tel: és mailto: linkek | működik |
| Galéria: szűrés, lightbox (nyilak, Esc) | működik (helyőrzőkkel) |
| Előtte–utána csúszka (egér, érintés, billentyűzet) | működik (illusztráció) |
| GYIK (natív details) | működik |
| Ajánlatkérő: 6 lépés, haladásjelző, validáció, vissza, összegzés módosítás-linkekkel, fotó-előnézet (max. 6, 10 MB), hozzájárulás | működik |
| **Ajánlatkérő beküldése** | **tesztmód** – `KULDES.endpoint = null`. Nem küld adatot, ezt kiírja; hívást vagy előre kitöltött e-mail-piszkozatot kínál. Hamis „sikeresen elküldve” nincs. Éleshez: végpont megadása (`FormData` POST, fotókkal együtt, valódi siker/hiba visszajelzéssel – a kód kész). |
| Mobil hívássáv | működik; elrejtődik a heróban, a kapcsolat résznél és a láblécben |

## Art direction — „Falmetszet”
A tudás a falban van: építészeti homlokzatrajz egy alföldi parasztház oromfaláról, a jobb alsó sarkában metszettel. Fotó helyett az anyag maga a látvány: meszelt vakolat, szalmás vályogtégla, döngölt vert fal, égetett tégla, beton.

## Új logó (`arculat/`)
A V betű befelé lépcsőző vályogtéglákból épül, fölötte a parasztház tetővonala: monogram + falazat + tető egy jelben. A szöveg görbére alakítva (`_forras/logo.py`), betűtípus nélkül is pontos.
- `logo-vizszintes-vilagos.svg`, `logo-vizszintes-sotet.svg` – elsődleges
- `logo-allo-vilagos.svg`, `logo-allo-sotet.svg` – álló
- `logo-egyszinu.svg`, `emblema-egyszinu.svg` – hímzés, fóliavágás, pecsét
- `emblema-vilagos.svg`, `emblema-sotet.svg`
- `favicon.svg` (gyökérben is), `favicon-32.png`, `apple-touch-icon.png` (180), `favicon-512.png`
- OG-kép: `img/og.png` (1200×630)

## Tipográfia
| Szerep | Betű | Méret |
|---|---|---|
| H1 | Cormorant Garamond 500, második sor dőlt 450 | 2.25rem → 3.75rem |
| H2 | Cormorant Garamond 500 + dőlt kiemelés | 2rem → 3rem |
| H3 | Cormorant Garamond 600 | 1.4–1.85rem |
| Törzs | Manrope 450 | 1.0625rem / 1.68 |
| Címkék, gombok | Manrope 700, nagybetű, .12–.2em | .66–.8rem |

Mérsékelt méretek (nincs óriás tipó). Fraunces sehol. Betűk helyben (`fonts/`, OFL-licencek mellékelve).

## Színek
`--forest #25352C` · `--clay #B76E45` · `--terra #9E5639` · `--sand #E9DDCC` · `--ivory #F8F5EF` · `--char #242521`
Származtatott: `--clay-ink #8E4F2C` (agyag szöveg világos alapon, AA), `#E3A27B` (agyag kiemelés sötét alapon), `--ink-soft #4F524A`.
Sávok: erdőzöld hero → elefántcsont bemutatkozás → homok szolgáltatások → elefántcsont problémák → szén munkanapló → terrakotta mester → elefántcsont folyamat → erdőzöld „miért” → elefántcsont GYIK → homok kapcsolat → szén lábléc.

## Térköz, rács
`--sec: clamp(5rem, 3.2rem + 6vw, 9rem)` szekciótávolság; konténer 1240 px, oldalmargó `clamp(1.25rem, … , 3rem)`; skála `.5 / 1 / 1.5 / 2 / 3 / 4.5 / 7rem`. Aszimmetrikus 5:7, 4:6, 6:5 oszlopok, 900 px alatt egy oszlop.

## Reszponzív
- **1100 px alatt:** menü burgerbe, telefon a fejlécben marad.
- **900 px alatt:** hero újrakomponálva (rajz felül, a metszet 3 felirattal; szöveg alatta; gombok teljes szélességben); a falrajz ragadós sávként a lista fölött; folyamat függőleges idővonal; mobil hívássáv.
- **601–900 px:** hero-rajz 600 px-ben középen.
- Ellenőrizve: 1440, 768, 390, 360 – nincs vízszintes túlcsordulás, nincs konzolhiba.

## Mozgás
| Elem | Mit csinál | Kiváltó |
|---|---|---|
| Hero | 1) ház vonalai kirajzolódnak (stroke), 2) anyagok beúsznak, megjelenik a repedt vályogfal, 3) a mész balról jobbra ráhúzódik (maszk), a repedés eltűnik, 4) a metszet széle és a feliratok sorban megjelennek – kb. 3,7 s | betöltés (GSAP idővonal) |
| Cím-felfedés | szavanként alulról | belépés a nézetbe |
| Hero parallax | rajz lassabban, szöveg gyorsabban mozog (csak desktop) | görgetés, scrub |
| Falrajz | az aktív szolgáltatás zónája kiemelődik, a többi halványul | görgetés (képernyő közepe) / egér |
| Folyamatvonal | agyagszínű vonal kitöltődik a 4 lépésen | görgetés, scrub |
| Képek, kártyák | felúszás, a portréhely clip-path nyitással | belépés |
| Menü | erdőzöld felület alulról felhúzódik, menüpontok lépcsőzve | kattintás |
| Gombok | sötét/világos kitöltés alulról, nyíl elcsúszik | hover |
| Haladásjelző | felső agyag csík | görgetés |

`prefers-reduced-motion`: minden végállapotban jelenik meg, animáció nélkül. Nincs blokkoló betöltő, nincs scrolljacking.

## Komponensek (React-átültetéshez)
`Header` (2 logóállapot), `MobileMenu`, `HeroElevation` (SVG + idővonal), `Ledger`, `FactsBar`, `WallSection` + `ServiceList` (zóna-kapcsolat `data-zone`), `SymptomList`, `WorkGallery` (szűrő + lightbox, `WORKS` adat), `BeforeAfter`, `MasterQuote`, `ProcessSteps`, `WhyList`, `FaqAccordion`, `QuoteWizard` (`KULDES` konfig), `Footer`, `MobileDock`, `Modal`.

## Technika
- GSAP + ScrollTrigger helyben (`js/`), csak hero-idővonal, parallax és folyamatvonal. Three.js/WebGL nem kell és nincs benne; React Bits / HorizonX komponens nincs benne.
- SEO: meta title/description, canonical (élő domainre), Open Graph, `HomeAndConstructionBusiness` strukturált adat. A terv maga `noindex`.
- Akadálymentesség: skip-link, szemantikus szekciók, aria-címkék, fókuszkezelés a varázslóban és a menüben, látható fókusz, AA kontraszt.
- Textúrák összesen ~60 KB webp; minden rajz vektoros.

## Forrásfájlok
`_forras/texturak.py` (textúrák), `_forras/logo.py` (logócsalád + favicon), `_forras/og.html` (OG-kép forrása), `_forras/logo-symbols.svg` (inline szimbólumok).
