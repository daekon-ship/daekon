# geraartdesign — átadás (2. kör, 2026.10.22.)

**2. kör: teljes újratervezés** az ügyfél visszajelzése alapján („logók, betűk, minden gyenge”). Kért irány: erős, modern, geometrikus. A fa-/intarziaminták, a Caslon-betűk és a betűtípusból vett G-k kikerültek.

Gera Péter (Gera Art Design) — bútorasztalos és intarziakészítő. Látványterv + 5 logóváltozat.

- Weboldal: `index.html` → https://daekon-ship.github.io/daekon/latvanytervek/geraartdesign/
- Logóválasztó: `logo.html` → https://daekon-ship.github.io/daekon/latvanytervek/geraartdesign/logo.html
- A weboldalon bal lent „Logó 1–5” bemutatósáv: bármelyik logót ki lehet próbálni élőben (`?logo=3` is működik). **Élesítéskor törlendő.**

## Ügyféladatok – mi igazolt, mi nem

| Adat | Forrás | Állapot |
|---|---|---|
| Név: Gera Péter, „bútorasztalos-intarzia készítő” | geraartdesign.hu (fejlesztés alatti WordPress) | igazolt |
| Telefon: +36 20 276 7939 | geraartdesign.hu + cegx.hu | igazolt |
| Budapest (1133 Váci út 52), Pest | cegx.hu címtár | **egyeztetendő** (oldalon pontozott aláhúzással jelölve) |
| E-mail: gera.peter@gmail.com | cegx.hu címtár | **egyeztetendő**, az oldalon nem szerepel |
| Szolgáltatások: egyedi bútor, konyha, beépített szekrény, ajtó-ablak, felújítás | cegx.hu | ajtó–ablak jelölve egyeztetendőnek |
| JóSzaki-profil (17 pozitív értékelés) | joszaki.hu | **nem biztos, hogy ugyanaz a személy** – nem használtam fel |
| Bemutatkozó szöveg, kiemelt mondat (idézet) | szövegjavaslat | jóváhagyandó — a „gyerekkora óta szereti a fát” gondolat a cegx leírásából |

Nincs kitalált vélemény, ár, statisztika, évszám.

## Képek
Valódi fotó nincs; stock/AI kép nincs. A hero egy kódból rajzolt, lapos geometrikus látványrajz (tálaló, tükör, méretvonalak) – illusztráció, nem munka. A munkák helyein kategóriánként egyszerű nézetrajz + „saját kép kerül ide” felirat; valódi kép: `js/gera.js` → `MUNKAK[n].foto`. Portré helye jelölve.

## Koncepció: „Arány”
Építészeti, geometrikus: látható 12 hasábos tartórács a hero mögött, számozott szakaszok, hajszálvonalas rácsba rendezett szolgáltatások saját geometrikus jelekkel, sötét dió blokk a műhelynek, görgetésre haladó folyamatvonal.

## Logók (`arculat/logo-1`, `logo-4`, `logo-5`; `_forras/logok.py`) — 5. kör
Az ügyfél az 1-es, 4-es és 5-ös irányt fogadta el; a 2-es (Forgács) és 3-as (Fecskefark) kikerült (a rajzoló függvények a forrásban maradtak).
1. Szorító – a G maga egy pillanatszorító (íves test, orsó, karamell nyomótalp).
4. Derékszög – a G szára asztalos derékszög (fa nyél, szegecsek, acél penge beosztással).
5. Évgyűrű – gerenda bütüje évgyűrűkkel és bütürepedéssel.

Névírás (ügyfélkérésre nagybetűs, ART kiemelve): „GERA**ART**DESIGN” – a GERA és a DESIGN vékony, az ART vastag és karamell, így a név három szóra esik szét. 1: Unbounded 600/300, 4: Urbanist 800/500, 5: Lexend Exa 600/300. Alatta „BÚTORASZTALOS · INTARZIA” (Urbanist 700, ritkított), a névvel azonos szélességben.

Fájlok változatonként: `fo`, `vilagos`, `sotet`, `sotet-atlatszo`, `mono`, `kompakt`, `kompakt-sotet`, `social`, `social-sotet`, `fejlec`, `fejlec-sotet` (SVG, körvonalazott).

## Designrendszer
- Betűk (helyben, WOFF): **Unbounded** 250–500 (címek, 300-as súlyon) + **Urbanist** 300–700 (szöveg). Fraunces nincs.
- Méretek: h1 27–44 px, h2 23–34 px, h3 16–19 px, törzs 17 px, címke 11,5 px nagybetűs. Szándékosan mérsékelt.
- Színek: papír `#FBF7F1`, krém `#F4EDE3`, homok `#EADFD1`, púder `#E0D1BF`, világos taupe `#C8B6A1`, taupe `#9C8670`, karamell `#BE9670`/`#9E7752`, mély taupe `#4F4136`, dió `#3A312A`.
- Konténer 1280 px; töréspontok 1080 / 900 / 600.

## Mozgás
| Elem | Mit csinál | Indító | Csökkentett mozgás |
|---|---|---|---|
| Hero-látványrajz | elemek egymás után felépülnek, méretvonalak kirajzolódnak; egérre a rétegek finoman eltolódnak (mélység) | betöltés / egér (csak finom mutató) | azonnal kész, mozgás nélkül |
| Szakaszok | lágy felúszás, lépcsőzetesen | görgetés | nincs |
| Szolgáltatás-csempe | háttér alulról kitöltődik, a jel eleme elmozdul | hover | – |
| Munkák | szűrő gombok; hoverre a rajz finoman emelkedik | kattintás / hover | – |
| Folyamat | a vonal görgetéssel töltődik, a lépésszámok sötétre váltanak | görgetés | – |

Vanilla JS + CSS; GSAP / Three.js / WebGL / React Bits / HorizonX nincs és nem kell.

## Nincs bekötve / élesítés előtt
- Űrlap: demó (nincs háttér, nincs e-mail). Élesítés: PHP vagy űrlapszolgáltatás, fájlfeltöltéssel.
- Adatkezelési tájékoztató, impresszum.
- Bemutatósáv eltávolítása; a választott logó beégetése.
- `noindex` levétele.

## Kérdések az ügyfélnek
1. Melyik logó (1, 4 vagy 5)? Finomítás a választott irányban (súly, arány, keret).
2. Valódi fotók: elkészült munkák (6–12 db), portré, műhely.
3. Cím, e-mail, működési terület; vállal-e ajtó-ablak gyártást?
4. A bemutatkozó szöveg és a kiemelt mondat rendben van-e?
5. Telefonos vagy űrlapos kapcsolatfelvételt szeretne elsődlegesen?
