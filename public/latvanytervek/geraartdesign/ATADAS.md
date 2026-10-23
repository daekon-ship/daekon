# geraartdesign — átadás (9. kör, 2026.10.23.)

**9. kör:** az intarziás doboz kikerült („nem kell”); az Intarzia rész tipográfiai sáv lett kép nélkül. A szövegek kontrasztja jóval erősebb (a szöveg „beleolvadt”): sötét alapon #EFE5D8, világos alapon #2F2620 / #54463B, nagyobb törzs (17 px) és bevezető (18–20 px), sötétebb címkék.

**8. kör:** a rozetta („hülyeség”) helyett **intarziás doboz** 3D-ben: a fedél berakása görgetésre darabonként a helyére kerül, a „Kinyitom” gombra a fedél felnyílik (üreges test, sötét bélés). A „tanulmány / görgetésre áll össze” meta-feliratok és a gombnak látszó címkék kikerültek. Az összes szöveg átírva: konkrétabb, ügyfélnek szóló, első személyű.

**7. kör:** „túl egybe van, tűnjön művészibbnek” → új sötét **Intarzia** szakasz görgetésre darabonként összeálló rozettával (No. 02), múzeumi tárgycímkék (No. 01–06) a 3D-rajzokon, aszimmetrikus kijelentés függőleges sínnel, lépcsőzetes munkák-galéria, mobilon a hero-sáv 2×2-es és nem lóg ki a margóból.

**6. kör: a weboldal újratervezése „Műhely” koncepcióval** (ügyfél: „a látványterv nagyon gyenge még”). A lapos vektor-illusztrációk, ikonos kártyák és nagy üres képhelyek kikerültek; helyettük saját, forgatható 3D-rajzok (fecskefarkas kötés, épülő tálaló), sötét dió hero, szerkesztett szolgáltatás-mutató. Betű: Kumbh Sans, a logó névírásával egyezően.

Gera Péter (Gera Art Design) — bútorasztalos és intarziakészítő. Látványterv + 3 logóváltozat (1, 4, 5).

- Weboldal: `index.html` → https://daekon-ship.github.io/daekon/latvanytervek/geraartdesign/
- Logóválasztó: `logo.html` → https://daekon-ship.github.io/daekon/latvanytervek/geraartdesign/logo.html
- A weboldalon bal lent „Logó 1 · 4 · 5” bemutatósáv: a logók élőben kipróbálhatók (`?logo=4` is működik). **Élesítéskor törlendő.**

## Ügyféladatok – mi igazolt, mi nem

| Adat | Forrás | Állapot |
|---|---|---|
| Név: Gera Péter, „bútorasztalos-intarzia készítő” | geraartdesign.hu (fejlesztés alatti WordPress) | igazolt |
| Telefon: +36 20 276 7939 | geraartdesign.hu + cegx.hu | igazolt |
| Budapest (1133 Váci út 52), Pest | cegx.hu címtár | **egyeztetendő** (oldalon pontozott aláhúzással jelölve) |
| E-mail: gera.peter@gmail.com | cegx.hu címtár | **egyeztetendő**, az oldalon nem szerepel |
| Szolgáltatások: egyedi bútor, konyha, beépített szekrény, ajtó-ablak, felújítás | cegx.hu | ajtó–ablak jelölve egyeztetendőnek |
| JóSzaki-profil (17 pozitív értékelés) | joszaki.hu | **nem biztos, hogy ugyanaz a személy** – nem használtam fel |
| Bemutatkozó és szolgáltatás-szövegek, „Egy kézben – a tervtől a beépítésig” | szövegjavaslat | **jóváhagyandó** — a „gyerekkora óta a fával dolgozik” gondolat a cegx leírásából |

Nincs kitalált vélemény, ár, statisztika, évszám.

## Képek
Valódi fotó nincs; stock/AI kép nincs. Minden kép a saját 3D-rajzolóval készül (`js/muhely3d.js`): ortografikus vetítés, festő-algoritmus, lapfény a normálisokból, SVG-ben – nem fotó, nem WebGL.
- Hero: átmenő fecskefarkas kötés (karamell farokdeszka + világos csapdeszka).
- Így dolgozom: tálalószekrény, amely görgetésre 4 lépésben épül fel.
- Munkák: 4 fotóhely vonalas 3D-vázlattal (konyha, gardrób, asztal, komód), „Fotó helye” felirattal. Valódi kép: `js/gera.js` → `MUNKAK[n].foto`.
- Intarzia: kép nélküli szöveges sáv (a `Muhely3D.doboz` modell a forrásban maradt, nincs használatban).
- Rólam: portré helye jelölve.

## Koncepció: „Műhely”
Sötét dió (#2A221D) + krém, karamell hangsúly. A fő vizuális elem nem dísz, hanem asztalosi szerkezet: a hero fecskefarkas kötése egérrel forgatható és szétszedhető, a folyamatnál egy bútor épül fel felméréstől beépítésig. A címek a logó névírását követik: vékony szöveg, a kulcsszó vastag karamell.

## Logók (`arculat/logo-1`, `logo-4`, `logo-5`; `_forras/logok.py`) — 5. kör
Az ügyfél az 1-es, 4-es és 5-ös irányt fogadta el; a 2-es (Forgács) és 3-as (Fecskefark) kikerült (a rajzoló függvények a forrásban maradtak).
1. Szorító – a G maga egy pillanatszorító: íves test, menetes orsó, forgó csukló, karamell nyomótalp, lekerekített T-fogantyú.
4. Derékszög – a G szára asztalos derékszög: erezett fa nyél, sárgaréz-hatású szegecsek, acél penge cm-beosztással.
5. Évgyűrű – gerenda bütüje: változó szélességű évgyűrűk, bélsugarak, a bél a bal alsó sarokban, onnan induló bütürepedés.

Névírás (ügyfélkérésre nagybetűs, ART kiemelve): „GERA**ART**DESIGN” – a GERA és a DESIGN vékony, az ART vastag és karamell, így a név három szóra esik szét. A három szó között kis szóköz van, hogy ne csússzanak egymásba. 1: Kumbh Sans 300/700, 4: Urbanist 500/800, 5: Lexend Exa 300/600. Alatta „BÚTORASZTALOS · INTARZIA” (Urbanist 700, ritkított), a névvel azonos szélességben.

Fájlok változatonként: `fo`, `vilagos`, `sotet`, `sotet-atlatszo`, `mono`, `kompakt`, `kompakt-sotet`, `social`, `social-sotet`, `fejlec`, `fejlec-sotet` (SVG, körvonalazott).

## Designrendszer
- Betű (helyben, WOFF, latin-ext): **Kumbh Sans** változtatható 300–700 – címek 300 + kiemelés 700, szöveg 400. Fraunces nincs.
- Méretek: h1 30–48 px, h2 25–38 px, h3 18–21 px, törzs 16,5 px, címke 11,5 px nagybetűs, 0,24 em ritkítás. Szándékosan mérsékelt.
- Színek: dió `#2A221D` / `#352B25`, világos `#F0E4D4`, papír `#FAF6F0`, krém `#F3ECE2`, homok `#E9DED0`, púder `#DFD0BD`, taupe `#9A846E`, karamell `#C08A5A` / `#A6744A`, mély `#3F332A`.
- Konténer 1280 px; töréspontok 1080 / 900 / 600. Mobilon a folyamat 3D-képe a fejléc alá ragad, a lépések alatta görögnek.

## Mozgás
| Elem | Mit csinál | Indító | Csökkentett mozgás |
|---|---|---|---|
| Hero – fecskefarkas kötés | betöltéskor a két deszka összecsúszik; egérre finoman fordul; húzással forgatható; „Szétszedem” gomb szétválasztja, feliratokkal | betöltés / egér / húzás / kattintás | összerakva, mozgás nélkül |
| Így dolgozom – tálaló | ragadós kép; a lépések görgetésével 4 állapot: méretvonalas körvonal → korpusz → ajtó, fiókok, kihúzott fiók → lábak, fogantyúk, karamell frontok, sötét fedlap; közben lassan fordul | görgetés | állapotváltás animáció nélkül |
| Munkák | a vázlat hoverre elfordul | hover (finom mutató) | – |
| Szolgáltatás-mutató | cím elcsúszik, karamell alsó vonal, nyíl elfordul | hover | – |
| Szakaszok | lágy felúszás | görgetés | nincs |

Vanilla JS + SVG; GSAP / Three.js / WebGL / React Bits / HorizonX nincs és nem kell.

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
