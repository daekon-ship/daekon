# Vályog-Mester — látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/
**Koncepció + arculat:** https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/koncepcio.html
**Állapot:** 4. kör – új nyitókép és paletta; 3. kör – üres helyőrzők nélkül; 2. kör (a jelenlegi oldal képeivel és Túró István bemutatkozó videójával), előzetes látványterv (noindex). A valyog-mester.hu élő oldal érintetlen.
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

## Képek és videó (2. kör)
A médiát egy egyszeri GitHub Actions futás töltötte le az élő oldalról (`_forras/media.py`, jelentés: `_forras/media-jelentes.json`), webp-re alakítva 900/1600/2400 px-ben (`img/foto/`).

| Fájl | Forrás | Hol látszik | Megjegyzés |
|---|---|---|---|
| `hero-*.webp` | https://valyog-mester.hu/images/hero.jpg (6048×4024) | hero, 1. kocka | ismeretlen eredetű, stock jellegű |
| `about-*.webp` | https://valyog-mester.hu/images/about.jpg (5100×3400) | hero, 2. kocka | ismeretlen eredetű |
| `service3-*.webp` | https://valyog-mester.hu/images/service3.jpg | hero, 3. kocka | ismeretlen eredetű |
| `service1-*.webp` | https://valyog-mester.hu/images/service1.jpg | Bemutatkozás | ismeretlen eredetű |
| `service2-*.webp` | https://valyog-mester.hu/images/service2.jpg | Problémák | ismeretlen eredetű |
| `video-1-720.mp4` (34 mp, 720×1280, hanggal, 6,8 MB), `video-1-poszter.webp` | a valyog-mester.hu-ba ágyazott Facebook-reel: https://www.facebook.com/reel/3101964210191311/ – feltöltő: Vályog-Mester, 2026.03.12. | A mester szekció | **a cég saját anyaga**, beégetett felirattal |
| `kocka-istvan/fal/munka.webp` | képkockák a videóból | hero videókártya, „Valódi munka” blokk, galéria első 2 eleme | **valódi munka** |

A régi logó (logo.png) nincs használva – új logó készült.

**Fontos:** az 5 állókép eredete ismeretlen (stock jellegű, a cég munkájaként sehol nem szerepelnek, csak hangulatképként). Éles publikálás előtt a jogosultságot az ügyféllel tisztázni kell, vagy saját fotóra cserélni. A videó és a képkockák a cég saját Facebook-oldaláról származnak.

**Videó viselkedése:** `preload="none"`; látótérben némítva, hurokban indul (a felirat be van égetve, hang nélkül is érthető), elhagyva megáll. „Lejátszás hanggal” gomb: elölről, hanggal, vezérlőkkel; jobb felül némítás. A hero videókártyája és a „Nézze meg a videót” link odagörget és hanggal indítja. `prefers-reduced-motion` esetén nincs automatikus lejátszás és nincs fotóáttűnés.

**A videó tartalma (a beégetett feliratokból):** Túró István, a TURPA BUILD Kft. ügyvezető igazgatója, vályogházakkal foglalkozik. Egy régi ház alapját, lábazatát le kellett verni, mert salétromos volt; eltávolították, szellőztetik, utána könnyű vakolatot, majd mészhabarcsot kap, hogy tudjon levegőzni. Nyílászárókat állítanak, térköveznek, vakolnak, falaznak, betonoznak, tetőt javítanak. Az ajánlatkérő kitöltését kéri, hogy minél hamarabb felmérhesse a bajokat. Ebből készült a „Salétromos lábazat, lélegző fal” blokk, és a kiegészítő munkák közé bekerült a nyílászáró-beépítés és a tetőjavítás.

## Egyeztetendő az ügyféllel
1. **Képek** – a galériában már csak valódi kép van: 3 képkocka a bemutatkozó videóból („Valódi munka”) és a jelenlegi oldal 5 fotója („A jelenlegi oldalról”). Rajzolt helyőrző és illusztrált előtte–utána csúszka nincs (3. kör). Az 5 fotó jogosultsága tisztázandó; további saját munkafotókkal a galéria bővíthető (`valyog.js` → `WORKS`). Csere: `valyog.js` → `WORKS` tömb, elemenként `src` + `alt`; ha van `src`, fotó jelenik meg rajz helyett. Előtte–utána párokhoz ugyanarról a falról két fotó kell.
2. **Túró István portréja** – most a videó képkockája áll a helyén; egy jobb minőségű fotó jól jönne.
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
Nyitókép (4. kör): maga a hero egy parasztház-homlokzat – meszelt fal háttér, a jelenlegi oldal fotói egy oromzat alakú „ablakban” váltakoznak (lassú áttűnés + kameramozgás, 7 mp), fölötte kék és agyag tetővonal, alul végigfutó kék „lábazat” sáv (20+ év, fő munkák, cégnév). Az oromzat betöltéskor alulról „felépül”, a tetővonal kirajzolódik. Túró István videókártyája az oromzat sarkára fut fel (mobilon a fotó alá). 5. kör: a fotó téglalap keretben, teljes egészében látszik (nincs levágott tető), fölötte külön rajzolt oromzat; a nagyítás csak középről, váltáskor ugrás nélkül. A „falmetszet” homlokzatrajz a Miért-szekcióba költözött: belépéskor kirajzolódik, a mész ráhúzódik a repedt vályogfalra, majd megjelennek a rétegfeliratok.

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

## Színek (4. kör – „meszelt ház”)
A zöld–agyag paletta helyett a magyar parasztház színei: meszelt fal, kék lábazat, égetett agyag, okker.
`--forest #1F3B5C` (parasztkék – sötét felületek, címek) · `--clay #B4532A` (agyag – fő gomb, fehér szöveggel 5:1) · `--clay-ink #9A421D` (agyag szöveg világoson) · `--okker #E2A93B` / `#EDB95A` (kiemelés kéken, 6,4:1) · `--terra #A8481F` · `--mesz #F3EDE2` (nyitókép) · `--ivory #F6F1E8` · `--sand #ECE2D0` · `--char #242521`.
Textúrák: `tx-kek.webp` (kék), `tx-mesz`, `tx-homok`, `tx-valyog`, `tx-vertfal`.
Sávok: mész nyitókép + kék lábazat → elefántcsont → homok (szolgáltatások) → elefántcsont → szén (munkáink) → homok (mester) → elefántcsont → kék (miért) → elefántcsont → homok (kapcsolat) → szén lábléc.

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
| Hero | fotók lassú áttűnése és nagyítása; cím szavanként, szöveg, gombok, videókártya beúszik | betöltés |
| Falmetszet-rajz (Miért) | 1) vonalak kirajzolódnak, 2) anyagok, repedt vályogfal, 3) mész ráhúzódik, repedés eltűnik, 4) metszet és feliratok – kb. 3,5 s | belépés a nézetbe (egyszer) |
| Videó | némított hurok látótérben, megáll elhagyva | görgetés |
| Cím-felfedés | szavanként alulról | belépés a nézetbe |
| Hero parallax | a szöveg gyorsabban mozog a háttérnél (csak desktop) | görgetés, scrub |
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
