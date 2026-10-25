# geraartdesign — átadás (10. kör, 2026.10.25.)

**10. kör – „Katalógus”** (ügyfél: „nagyon AI, nem elég prémium, letisztult”). Teljes egyszerűsítés:
- világos, egyetlen háttérszín (#F6F2EC), sötét blokkok nélkül; a lábléc is világos;
- nincsenek AI-sablon jelek: színes kulcsszavak a címekben, vonalas nagybetűs „eyebrow”-k, 01/02 számozás mindenhol, ikonos kártyák, körös nyilak, chipek, hero-infósáv;
- egy betű (Kumbh Sans), vékony címek, mérsékelt méretek, hajszálvonalak, sok levegő;
- képek helyett monokróm vonalas 3D-vázlatok tónusos táblákon (`Muhely3D`, `arnyek: .55`), „Fotó helye” jelöléssel; a hero tálalója finoman forgatható;
- szövegek rövidebbek, első személyűek; az űrlap egyszerű, aláhúzott mezőkkel.

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
Valódi fotó nincs; stock/AI kép nincs. Minden kép a saját SVG-alapú 3D-rajzolóval készül (`js/muhely3d.js`), monokróm vonalas stílusban:
- Hero: tálaló kihúzott fiókkal (egérre/húzásra finoman fordul).
- Munkák: konyha, gardrób, étkezőasztal, komód – „Fotó helye” jelöléssel; valódi kép: `js/gera.js` → `MUNKAK[n].foto`.
- Rólam: portré helye jelölve.

## Koncepció: „Katalógus”
Mint egy bútorkatalógus vagy egy kis műhely nyomtatott prospektusa: csendes, világos, sok levegővel. A munkák (később a fotók) a főszereplők, a szöveg rövid és személyes.

## Logók (`arculat/logo-1`, `logo-4`, `logo-5`; `_forras/logok.py`) — 5. kör
Az ügyfél az 1-es, 4-es és 5-ös irányt fogadta el; a 2-es (Forgács) és 3-as (Fecskefark) kikerült (a rajzoló függvények a forrásban maradtak).
1. Szorító – a G maga egy pillanatszorító: íves test, menetes orsó, forgó csukló, karamell nyomótalp, lekerekített T-fogantyú.
4. Derékszög – a G szára asztalos derékszög: erezett fa nyél, sárgaréz-hatású szegecsek, acél penge cm-beosztással.
5. Évgyűrű – gerenda bütüje: változó szélességű évgyűrűk, bélsugarak, a bél a bal alsó sarokban, onnan induló bütürepedés.

Névírás (ügyfélkérésre nagybetűs, ART kiemelve): „GERA**ART**DESIGN” – a GERA és a DESIGN vékony, az ART vastag és karamell, így a név három szóra esik szét. A három szó között kis szóköz van, hogy ne csússzanak egymásba. 1: Kumbh Sans 300/700, 4: Urbanist 500/800, 5: Lexend Exa 300/600. Alatta „BÚTORASZTALOS · INTARZIA” (Urbanist 700, ritkított), a névvel azonos szélességben.

Fájlok változatonként: `fo`, `vilagos`, `sotet`, `sotet-atlatszo`, `mono`, `kompakt`, `kompakt-sotet`, `social`, `social-sotet`, `fejlec`, `fejlec-sotet` (SVG, körvonalazott).

## Designrendszer
- Betű: **Kumbh Sans** (helyben) – címek 300, szöveg 400, kiemelés 500. Nincs színes kulcsszó, nincs nagybetűs ritkított címke.
- Méretek: h1 30–44 px, h2 24–32 px, h3 17–19 px, törzs 16,5 px, bevezető 17,5–19,5 px.
- Színek: háttér `#F6F2EC`, tábla `#ECE6DC`, hajszálvonal `#D8CEC1`, tinta `#1F1915`, szöveg `#2A231E`, másodlagos `#665A4F`; karamell `#A9774A` csak hover/apró részlet.
- Konténer 1320 px, szakasztávolság 96–176 px; töréspontok 1000 / 860 / 600.

## Mozgás
| Elem | Mit csinál | Indító | Csökkentett mozgás |
|---|---|---|---|
| Hero-vázlat | finom fordulás az egér felé, húzással forgatható | egér / húzás | álló kép |
| Szakaszok | lassú, kis felúszás | görgetés | nincs |
| Linkek, menü | aláhúzás kihúzódik | hover | – |

Vanilla JS + SVG; GSAP / Three.js / WebGL nincs és nem kell.

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
