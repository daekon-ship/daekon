# Taverna Gyros Monor — átadási jegyzet

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/taverna-gyros/
**Régi (Freebuff) változat összehasonlításra, érintetlenül:** https://daekon-ship.github.io/taverna-gyros-latvanyterv/

Teljes újratervezés. A régi projektből csak adat került át (étlap, árak, elérhetőségek, kiszállítás, fotók, logó); layout, CSS, tipográfia, animáció nem.

## Koncepció — „a nyárs körül”

- **Forma:** mediterrán boltív (hero, élmény, közelről-színpad, térkép) + kerek „tányér” kivágás. A gombok is boltív alakúak.
- **Mozgásmotívum:** forgás. A hero tányér körüli felirat görgetésre fordul; a közelről-szakaszban kör alakú „tányér” átmenetek váltják a képeket.
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
