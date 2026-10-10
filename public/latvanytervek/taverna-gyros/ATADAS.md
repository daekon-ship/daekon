# Taverna Gyros Monor — átadási jegyzet

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/taverna-gyros/
**Régi (Freebuff) változat összehasonlításra, érintetlenül:** https://daekon-ship.github.io/taverna-gyros-latvanyterv/

Teljes újratervezés. A régi projektből csak adat került át (étlap, árak, elérhetőségek, kiszállítás, fotók, logó); layout, CSS, tipográfia, animáció nem.

## Koncepció — „a nyárs körül”

- **Forma:** mediterrán boltív (hero, élmény, közelről-színpad, térkép) + kerek „tányér” kivágás. A gombok is boltív alakúak.
- **Hero (3. kör):** a fő kép a Taverna fekete zsemlés burgere (a legprémiumabb saját fotó), a kör alakú tányér és a „Holnap is forog” zárósor kikerült; a szövegek egyszerű, leíró hangon. Korábbi mozgásmotívum: forgás. A hero tányér körüli felirat görgetésre fordul; a közelről-szakaszban kör alakú „tányér” átmenetek váltják a képeket.
- **Színek:** Taverna türkiz `#3FB8AF` (a logóból mintázva) nagy felületként, meleg szénfekete `#1C1612`, pita-krém `#F4EBDA`, mélytürkiz `#0F3B37`, lime `#C9DC3E` csak kiemelésre — a lime a Taverna saját asztalairól és szórólapjairól származik.
- **Betűk:** Archivo (keskeny, nehéz display, változó szélesség) + Figtree (szöveg). Helyben hosztolva (`fonts/`, OFL). Fraunces nincs. A hero címe legfeljebb 88 px.
- **Logó:** az eredeti logóból kivágott maszk (`img/logo-mask.webp`), CSS-sel bármilyen színre színezhető.

Szekciók: hero · kedvencek · teljes étlap · élmény (terasz, kávé) · közelről (ragadós, görgetésvezérelt) · galéria + lightbox · házhozszállítás (irány szerinti iránytű) · az asztali kártyáról (ajánlatok) · kapcsolat (térkép, nyitvatartás) · lábléc. Mobilon fix alsó sáv: Étlap | Hívás és rendelés.

## Technika

- Build nélküli: `index.html`, `taverna.css`, `taverna.js`, `js/etlap.js` (az étlap adatai), `js/gsap.min.js` + `js/ScrollTrigger.min.js` (GSAP 3.15, helyben).
- Képek: WebP + AVIF, 640/1100/1600 px változatok, `srcset`, lazy loading (a hero kép előtöltve).
- Mozgás csak `prefers-reduced-motion` nélkül; ilyenkor a közelről-szakasz gombokkal lapozható, minden tartalom látszik. Ha a szkript nem fut, 2,5 mp után a tartalom akkor is megjelenik.
- Nyitvatartás-jelző budapesti idő szerint (nyitva / rendelés lezárult / zárva, mikor nyit).

## Ellenőrizve

- 360, 390, 430, 768, 1024, 1440 px: nincs vízszintes túlcsordulás, nincs konzolhiba, minden kép betölt.
- Étlap: mind a 82 tétel megjelenik (8 fejezet); keresés ékezet nélkül is működik; fejezetváltás billentyűzettel (nyilak, Home/End).
- Galéria: mobilon húzható sáv, lightbox érintéses lapozással, Esc, nyilak, fókuszcsapda.
- Érintési célok legalább 44 px magasak; látható fókusz; mozgáscsökkentéssel tesztelve.
- **Képaudit (2. kör):** minden kép 320–1920 px között, görgetés közben 1/4 képernyőnként mérve: egyik kép sem hagy rést a keretében, egyik keret sem lóg ki a tartalomsávból, egyik kép sem takar szöveget. Javítva: hero-parallaxis rés, a kedvencek burgerképe rácsúszott a csirke feliratára, a csirkefotó külön kivágást kapott (`csirke-kozel`), a burgerfotón nem látszik a kar, a galéria új háromhasábos rácsa a képek saját arányához igazodik (nincs torz kivágás), a közelről-színpad 320–360 px-en nem lóg ki.
- **4. kör (ügyfél kérésére):** kikerült az asztali kártyás „Ajánlatok” szekció, a kitalált kiszállítási iránytű és az ismétlődő „Közelről” szekció. Mobilon kb. 12 900 px helyett 8 500 px az oldal.
- A Google-térkép a fejlesztői környezetben nem tölthető be (hálózati tiltás); élesben a beágyazás betölt, alatta tartalék link van.

## Egyeztetendő

| Hol | Helyzet | Teendő |
|---|---|---|
| Árak (mind a 82 tétel) | A régi látványterv árai, forrásuk nem igazolt | Aktuális nyomtatott étlap bekérése |
| Gyros Box ára | Régi lista: 2 300 Ft; az asztali kártyán más ár (kb. 1 7x0 Ft, nem olvasható) | Ügyféltől |
| Pita menü cheddar sajtos hasábbal | Csak az asztali kártya fotóján: 2 690 Ft, dátum ismeretlen | Él-e még az ajánlat? |
| Csavart fagyi | Krétatábla-fotó: kicsi 890 / nagy 1 190 Ft — egyezik a listával | — |
| Facebook-tartalom | A Facebook automatikusan nem olvasható, onnan nem töltöttünk le képet | Napi menü / friss posztok és képek átadása |
| Kiszállítás | Monor 3 500 Ft felett ingyenes; a többi településé telefonon | Díjtáblázat, ha van |
| Iránytű | Irány szerinti vázlat, nem méretarányos | Jóváhagyás |
| Hiányzó fotók | Gyros pitában / tálon tányéron, étterembelső, pult, kávék, desszertek (baklava, marlenka, palacsinta), frissensültek | Saját fotók bekérése |
| Értékelések | Nincsenek az oldalon (kitalált vélemény tilos) | Ha kell: valódi Google/Facebook idézetek engedéllyel |
| Élesítés | `noindex` | Törölni, canonical + og címek |


## Prémium véglegesítés (2026-10-09)

Mentés előtte: `taverna-mentes-2026-10-09` ág a repóban.

- Hero: nagyobb, domináns 4K burgerfotó (asztali nézetben max. 560 px), precízebb címméret, rövid maszkos képbeúszás és soronkénti cím-belépés, asztalon nagyon finom mélység görgetéskor. Mobilon a gombok közvetlenül a kép alatt.
- Hero-tények: nyitvatartás, ingyenes házhozszállítás, cím (a kapcsolatra ugrik).
- Animációk: GSAP, rövid felfedés (átlátszóság + 18 px), stagger a kártyákon, kis képbeállás a kereteken belül; nincs scroll-jacking, nincs szövegmaszk görgetéskor; reduced-motion mellett minden statikus.
- Kártyák: árnyék, hover-zoom a valódi fotókon.
- Étlap: keresésmező törlés-gombbal, elegánsabb panelváltás; mind a 82 tétel és ár változatlan.
- Galéria: a főoldalon nincs galériablokk; a Galéria menüpont képnézegetőt nyit bélyegképsorral, lapozással (nyíl, húzás, billentyű), előtöltéssel, a kijelzőhöz illő képmérettel. JS nélkül egyszerű képlista.
- Mobil alsó sáv: elmosott háttér, egyforma magas gombok, safe-area.
- Billentyűzet: jól látható fókusz, fókuszcsapda a képnézegetőben, fókusz-visszaadás.
- Ellenőrizve: 360/390/430/768/1024/1440 px, konzolhiba 0, hiányzó kép/hivatkozás 0, LCP helyben ~0,3–0,4 s, kezdeti letöltés ~650 KB.

## Vizuális finomítás (2026-10-10)

- Mobil hero: a burgerkép széltől szélig, négyzetes kivágással (tableten 4:3), élesített 4K-változatokkal; a nagy felbontású telefonok 2160 px-es képet kapnak.
- Asztali hero: kicsit nagyobb kép (max. 480 px), kisebb üres sáv.
- Házhoz: a települések keretes „Szállítási terület” blokkban; mobilon rögtön a cím alatt.
- Tablet (760–899 px): az étlap és a terasz egy hasábban, a keresőmező nem vágódik le.
- Étterem-fotó: levágva a fotó tetején látszó illesztési csík az égen.

## Mobil látvány (2026-10-10, 2. kör)

- Hero mobilon: a filmszerű (átmenetes, a képre írt címes) változat az ügyfél kérésére visszakerült az előzőre — cím fölül, alatta a széltől szélig érő, színhű burgerkép.
- Kedvencek mobilon: oldalra lapozható kártyasor (scroll-snap) haladásjelzővel.
- Étlap mobilon: egysoros, vízszintesen görgethető fejezetsáv, amely görgetéskor a képernyő tetején marad; fejezetváltáskor a sáv a kiválasztott fejezetre ugrik, a lista eleje látható marad.
- Nyitvatartás: kártyába került, a mai nap „MA” jelölést kap.
- Kis telefonon (320–379 px) a két hero-gomb egy sorban marad.
