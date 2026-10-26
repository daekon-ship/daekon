# geraartdesign — átadás (12. kör, 2026.10.26.)

**12. kör – „Rajzlap”** (ügyfél: „gyenge, semmitmondó, nem elég prémium; induljon úgy, mint a gt-lakasfelujitas.hu; legyen sokkal látványosabb, mégis letisztult”).
- Sötét, meleg alap (`body.s`: háttér `#12100E`, szöveg `#EFE7DB`, homok `#D9C3A3`, bronz `#B4875B`); a logóválasztó (`logo.html`) marad világos.
- Indítás a GT-oldal mintájára: sötét intró a logóval, kihúzódó vonal, „Bútorasztalos · intarzia”, majd függönyszerűen felhúzódik; mögötte egy keretes, teljes képernyős **rajzlap** nyílik ki.
- A rajzlapon egy tálaló műszaki elölnézete rajzolódik ki vonalanként (bútor → részletek → méretvonalak → fecskefarkas nagyító), majd a feliratok; A/B/C – 1/2 koordináták, alul rajzi szövegmező (Készítő, Szakma, Felmérés, Hívás).
- Lámpafény: az egér körül kivilágosodik a rácsháló és a rajz (érintős eszközön magától vándorol); a rajz finoman billen az egér felé; görgetéskor a rajzlap hátrébb lép.
- Csiszolás (12b): a hero címe két sorban; az Intarzia mellé „Rajzlap 02” – kockamintás berakás három fa színével, ami görgetésre darabonként összeáll (illusztráció, nem valódi munka); a folyamatnál a vonal görgetésre kihúzódik, a lépésjelölők kitelnek; a fotóhelyeken vágójelek; a lábak/munkalapok fa színűek; a logóválasztó alapból összecsukva.
- Utána: kijelentés, ragadós „Egy bútor, közelről” (sötét vonalas tálaló, Arány / Anyag / Illesztés), szolgáltatás-index, munkák sötét táblákon, intarzia szavas felgyúlással, folyamat, rólam, kapcsolat (lámpafénnyel).

(11. kör:)
# geraartdesign — átadás (11. kör, 2026.10.26.)

**11. kör – Motion (motion.dev), ügyfélkérésre.** A „Katalógus” alap marad, a mozgásokat a Motion könyvtár adja (vanilla JS, `window.Motion`, `https://cdn.jsdelivr.net/npm/motion@11.11.13/dist/motion.js`, rögzített verzió). Élesítéskor a fájlt érdemes helyben tárolni. Ha a Motion nem töltődik be, minden tartalom látszik, a görgetéses rész saját tartalékkal megy.
- Hero: a cím szavanként felcsúszik (`animate` + `stagger`), a bevezető és a linkek utána; a kép tábla alulról kinyílik (clip-path); a fecskefarkas kötés két deszkája összecsúszik (`animate` számértékre, `onUpdate`); görgetésre lassan elfordul, húzással forgatható és visszarugózik.
- Új „Egy bútor, közelről” rész: ragadós, 340 vh magas; görgetésre (`scroll`, target + offset) a tálaló elfordul, a 2. harmadban a frontok és a fedlap fa színt kapnak, a 3.-ban a felső fiók kinyílik; bal oldalt Arány / Anyag / Illesztés felirat vált, alatta vékony haladásjelző.
- Munkák: a táblák alulról kinyílnak, a vázlat lassan a helyére skálázódik (`inView`); hoverre a vázlat elfordul.
- Listák, lépések: lépcsőzetes belépés; elválasztó vonalak kihúzódnak.
- Intarzia: a fő mondat szavai görgetésre egyenként kigyúlnak.
- Fejléc: lefelé görgetve elbújik, felfelé előjön.
- Ellenőrzés: a valódi Motion a fejlesztői környezetből nem volt elérhető, ezért a kód a Motion API-ját utánzó helyi teszttel és Motion nélkül (tartalék) lett kipróbálva 390 és 1440 px-en; élőben telefonon is meg kell nézni.

(10. kör:)
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
