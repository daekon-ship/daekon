# geraartdesign — átadás (1. kör, 2026.10.22.)

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
Valódi fotó nincs. **Minden kép programból rajzolt, nem fotó és nem AI-kép:**
- `img/furner-*.jpg` – 6 fafaj furnértextúrája (`_forras/furner.py`, FFT-zaj, csempézhető).
- Intarziaminták SVG-ben, futásidőben (`js/intarzia.js`): napsugár, iránytű, kocka, chevron-halszálka, sakktábla, keresztsávos tábla.
- Portré helye jelölve. Munkák: „Mintatanulmány” címkével; valódi fotó: `js/gera.js` → `PROJEKTEK[n].foto = 'img/munkak/…jpg'` (ekkor a minta helyett a kép jelenik meg).

## Három irány (elemzés után)
1. **„Intarzia” – kiválasztva.** A mesterségből születik: furnér, rostirány, berakás. A kért bézs–karamell paletta itt természetes (juhar, körte, cseresznye, dió). Művészi, nőiesebb finomság, mégis hiteles – nem barkácsos, nincs szerszámikon.
2. „Galéria” – múzeumi fehér tér, tárgyfotók címkékkel. Elvetve: fotó nélkül üres, hideg, sablonos.
3. „Műhelynapló” – vázlatok, mérethálók, kézírás. Elvetve: a brief kifejezetten nem kér iparos/barkács hatást.

## Logók (`arculat/logo-1…5/`, körvonalazott SVG, `_forras/logok.py`)
Mind: nagy G · alatta „geraartdesign” · vékony szögletes keret · pasztell bézs.
1. Klasszikus prémium – Libre Caslon Display G, dupla hajszálkeret, Commissioner 300 ritkítva.
2. Finom elegáns – Bodoni Moda G, Cormorant Garamond kurzív név, a keret alsó élét a név nyitja meg.
3. Modern minimál – saját rajzolású geometrikus G, Jost, egyvonalas keret.
4. Művészi – intarzia – Bodoni Moda 800 G legyezőfurnér-berakással, kettős szegély sarokkockákkal.
5. Extra letisztult luxus – Tenor Sans, fekvő keret kifutó sarkokkal.

Fájlok változatonként: `fo`, `vilagos`, `sotet`, `sotet-atlatszo`, `mono`, `kompakt`, `kompakt-sotet`, `social`, `social-sotet`, `fejlec`, `fejlec-sotet`. Betűk: Google Fonts (OFL).

## Designrendszer
- Betűk (helyben, WOFF, latin-ext): Libre Caslon Display (címek), Libre Caslon Text Italic (kiemelés), Commissioner változtatható (szöveg). Fraunces nincs.
- Méretek (`gera.css` :root): h1 30–50 px, h2 26–40 px, h3 20–24 px, törzs 16,5 px, címke 11,5 px nagybetűs, 0,22 em ritkítás. Szándékosan mérsékelt.
- Színek: papír `#FBF7F1`, krém `#F5EEE4`, homok `#EADFD0`, púder `#E3D3C1`, világos taupe `#C9B8A4`, taupe `#A08C77`, karamell `#B48A63` / `#9A7350`, mély taupe `#5E4D40`, dió (sötét blokkok, nem fekete) `#3B322B`.
- Térköz: konténer 1240 px, oldalmargó 20–64 px, szakasz 96–160 px.
- Töréspontok: 1080 (szolgáltatás-minták el), 900 (hamburger menü, egyoszlopos hero, tábla felül), 600 (mobil).

## Mozgás
| Elem | Mit csinál | Indító | Csökkentett mozgás |
|---|---|---|---|
| Hero intarziatábla | a furnérdarabok egyenként „berakódnak”, a legyező szeletei kinyílnak, a szegélyvonalak kirajzolódnak | betöltés | azonnal kész |
| Szöveg, blokkok | lágy felúszás | görgetés (ugrásbiztos ellenőrzés) | nincs |
| Munkák | krém fedőlap felhúzódik a kártyáról, hoverre lassú nagyítás | görgetés / hover | nincs |
| Szolgáltatás-index | cím elcsúszik, mintacsík becsúszik | hover (asztali) | – |
| Furnér-mintakönyv | a lapok legyezőszerűen kinyílnak; hover/koppintás kiemel egy lapot és kiírja a fafajt | görgetés / interakció | nyitott állapot |
| Gombok | sötétedő kitöltés balról, nyíl nyúlik | hover | – |

Mind vanilla JS + CSS; GSAP, Three.js, WebGL, React Bits, HorizonX **nincs** és nem szükséges.

## Nincs bekötve / élesítés előtt
- Űrlap: demó (nincs háttér, nincs e-mail). Élesítés: PHP vagy űrlapszolgáltatás, fájlfeltöltéssel.
- Adatkezelési tájékoztató, impresszum.
- Bemutatósáv eltávolítása; a választott logó beégetése.
- `noindex` levétele.

## Kérdések az ügyfélnek
1. Melyik logó (1–5)? Finomítás a választott irányban.
2. Valódi fotók: elkészült munkák (6–12 db), portré, műhely.
3. Cím, e-mail, működési terület; vállal-e ajtó-ablak gyártást?
4. A bemutatkozó szöveg és a kiemelt mondat rendben van-e?
5. Telefonos vagy űrlapos kapcsolatfelvételt szeretne elsődlegesen?
