# Taverna Gyros Monor — átadási jegyzet

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/taverna-gyros/
**Régi (Freebuff) változat összehasonlításra, érintetlenül:** https://daekon-ship.github.io/taverna-gyros-latvanyterv/

Teljes újratervezés. A régi projektből csak adat került át (étlap, árak, elérhetőségek, kiszállítás, fotók, logó); layout, CSS, tipográfia, animáció nem.

## Koncepció — 2. irány: „esti pult” (a Godzsák-terv nyelvén)

- **Alap:** meleg grafit (`#141311`), mészkő-fehér szöveg, hajszálvonalak, finom szemcse. Egyetlen kiemelőszín: a Taverna türkize (`#3FB8AF`). Egy világos sáv (A Taverna) ad kontrasztot.
- **Tipográfia:** mérsékelt, nyugodt címek (Archivo 500), kétsoros cím: fehér állítás + halvány folytatás. Apró, ritkított címkék, sorszámozott listák. Fraunces nincs, túlméretes betű nincs (hero max. ~74 px).
- **Hero:** keretezett lap — szöveg + a fekete zsemlés burger sarokjelölt fotókeretben, alatta nyitvatartás / rendelés / kiszállítás sáv.
- **Rétegről rétegre:** a gyros pita vonalrajza öt rétegben (pita, hús, 4 féle saláta, paradicsom, lilahagyma — az étlap szerint), görgetésre szétnyílik, a rétegek sorban kiemelődnek.
- **Fotók:** sarokjelölt keretek, súroló fény, felirat + sorszám. Csak a Taverna saját képei.
- **Mobil:** türkiz alsó hívássáv, mind a 8 étlapfül egyszerre látszik (2 oszlop), kedvencek és galéria lapozható sávban.
- Az 1. irány (türkiz felületű, boltíves) forrása a commit-történetben megvan.

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
