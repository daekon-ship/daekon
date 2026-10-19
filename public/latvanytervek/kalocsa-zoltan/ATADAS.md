# Kalocsa Zoltán – gépi földmunka · látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/kalocsa-zoltan/
**Arculat + koncepció:** https://daekon-ship.github.io/daekon/latvanytervek/kalocsa-zoltan/koncepcio.html
**Állapot:** 3. kör – teljes átrajzolás az ügyfél által küldött sötét–narancs minta szerint (lapos grafit #2A2A2A, narancs nagybetűs címek, lekerekített narancs gombok, középre igazított narancs ikonok, szürke kotrógép a nyitóképen). Csak hívás, kompakt tipográfia, GSAP-mozgás. Előzetes látványterv (noindex).
**Felépítés:** build nélküli statikus oldal (`index.html` + `kalocsa.css` + `kalocsa.js`), relatív útvonalak; GSAP 3 + ScrollTrigger helyben (`js/`).

## Koncepció
„EARTH / ENGINEERED” – grafit (#111315) + munkavédelmi narancs (#FF6B2B), egyetlen papír szekció (#E9E5DE). Az ügyfél saját sötét–narancs mintája az alap; a bézs minta csak ellenpont. Három irányból választva (lásd `koncepcio.html`): A) Earth/Engineered – kiválasztva; B) világos kitűzőszalag – elvetve (az ügyfél sötétet kért); C) talajszelvény-oldal – a gondolat a hero alsó sávjába olvadt.

Jellegzetes elemek: árokszelvény-logójel (`logo-jel.svg`), kitűzési „nyomvonal” a bal margón (görgetésre halad, ≥1100 px), lézer-szintvonal a nyitófotón, topografikus szintvonalak, műszaki vágójelek a fotón, felülnézeti vázlat a „Szűk hely? Nem akadály.” blokkban (kisgép a kaputól a kert végébe).

## Valós adatok
| Adat | Forrás |
|---|---|
| Kalocsa Zoltán (a joszaki.hu-n „Kalocsa Zoltán Kevin” aláírással) | brief, joszaki.hu |
| +36 70 420 4170 · zkalocsa8@gmail.com | brief, joszaki.hu (telefon) |
| Kecskemét és 60 km-es körzete | joszaki.hu |
| Alapásás, közműárok, nyomvonalásás, tuskóeltávolítás, egyéb földmunka kertben/udvaron/telken; tereprendezés | joszaki.hu, brief |
| „Kis géppel dolgozom, így szűk helyekre is bejutok!” · „gyorsan és korrekt áron” · „Építkezel? Kertet újítasz? Nem akarsz ásni napokig?” | joszaki.hu – saját szövege, idézetként használva |

**Nem szerepel (nincs igazolva):** cégforma, telephely, adószám, géptípus/márka, gépszélesség, évek, projektszám, értékelés, ár, garancia, ingyenes felmérés. A hero koordinátái Kecskemét városé (46,91° É, 19,69° K), nem telephely. Kalocsa városra nincs utalás.

## Képek
Csak az ügyfél 6 saját munkafotója, a csomagban kapott forgatott változatból, 720/1200 px webp-re méretezve (`img/`), retusálás nélkül. A két stílusreferencia nincs az oldalon.

| Fájl | Hol | Felirat |
|---|---|---|
| `kozmuarok` | hero + galéria 01 (kiemelt) | Árokásás – közműárok, nyomvonal |
| `tusko` | galéria 02 (kiemelt) | Tuskó és gyökérzet |
| `fas-terulet-1` | galéria 03 | Földmunka fás területen |
| `talajrendezes-1`, `-2` | galéria 04, 05 | Terület-előkészítés (ugyanaz a terület, két nézet) |
| `fas-terulet-2` | „Szűk hely” blokk + galéria 06 | Kisgép munka közben |

Előtte–utána párosítás nincs. A szolgáltatássorokhoz nem rendeltünk fotót, hogy ne állítsunk konkrét munka–kép kapcsolatot. Hero-illusztráció helyett valódi fotó áll (a briefben megengedett gépillusztráció nem kellett).

## Eltérések a brieftől (szándékosan)
- **Betűméret:** a brief „óriás” címeket és kontúros „FÖLDMUNKA” háttérszöveget kért – az ügyfél kérésére kompakt méret (H1 max. 48 px), a kontúrszöveg helyett szintvonal-textúra.
- **Szám:** a joszaki-profil egyes szám első személyben, tegezve ír, ezért a szöveg is így szól („vállalok”, „Rólam”, „Munkák”). Ha többes számot szeretne („Munkáink”, „Rólunk”), 1 perces csere.
- **Betűk:** Archivo (keskeny 72%, 800) + Manrope, helyben (a repó meglévő OFL-fájljai).

## 3. kör – „Nem hasonlít rá, küldtem milyennek kéne lennie”
A minta (01_STYLE_REFERENCE_SOTET_NARANCS) szerkezete és stílusa 1:1 irány: bal oldalt narancs nagybetűs főcím + szürke szöveg + lekerekített narancs gomb, jobb oldalt szürke kotrógép, amely kilóg a fotókeretből; „SZOLGÁLTATÁSOK” narancs cím alatt középre igazított narancs ikonok (3 + 2), narancs alcímek, szürke szöveg; a végén nagy, jobbra igazított „HÍVÁS MOST” gomb. A minta stock-kotrógépe helyett **rajzolt (SVG) kisgép** – animálva ás –, a keretben Zoltán saját közműárok-fotója szürkeárnyalatosan, „Illusztráció · a keretben valódi munkafotó” jelöléssel. Az előző kör ornamentikája (szintvonalak, margóvonal, lézer, papírszekció, árokszelvény-logó a fejlécben) kikerült; a fejléc a mintához hasonlóan kétsoros szöveges név.

## 2. kör – ügyfél-visszajelzés
- „Az a csík nem kell” → a hero alján lévő talajszelvény-sáv (narancs árokprofil) és az alatta futó szolgáltatás-szalag (ticker) is törölve; CSS/JS verziózva (`?v=3`), hogy a böngésző ne a régit mutassa.
- „Kevés az animáció” → GSAP-alapú mozgásrendszer (lásd lent és `koncepcio.html`).
- „Ajánlatkérő se kell, elég hívni” → űrlap törölve; minden gomb `tel:` link (fejléc, hero, szolgáltatások, kiszállás, kapcsolat, mobil alsó sáv). Az e-mail csak kis betűvel a kapcsolat-kártyán és a láblécben maradt.
- „Minden túl nagy, főleg a betűk” → teljes léptékcsökkentés: H1 32–48 px (volt 40–66), H2 23–32 px, szöveg 15,5 px, gombok 46 px, fejléc 72/58 px, szekciótávolság 64–116 px, mobilon H1 28–36 px.

## Működik
| Funkció | Állapot |
|---|---|
| Ragadós, görgetésre vékonyodó fejléc, mobilmenü (Esc) | működik |
| tel: / mailto: linkek | működik |
| Galéria lightbox (nyilak, Esc, fókuszcsapda) | működik |
| Mobil alsó hívássáv a hero után, a kapcsolat blokknál elrejtve | működik |
| Adatkezelés, impresszum | [feltöltendő] |

## Mozgás (GSAP + ScrollTrigger, helyben)
Betöltés ≈1,5 mp (fotó feltárul, cím soronként, vágójelek, méretvonal) · lézer-szintvonal a fotón · hero parallaxis + egérre mozduló szintvonalak · szavanként beemelkedő címek · kirajzolódó szolgáltatás-ikonok · görgetésre végigguruló kisgép a vázlaton, ásó karral és kitelő árokkal · galéria maszk + belső parallaxis · húzódó kitűzési vonal karókkal · radarnyaláb, 0→60 km számláló · mágneses gombok. `prefers-reduced-motion` mellett minden statikus; ha a GSAP nem töltődik be, a tartalom akkor is látszik.

## Ellenőrzés
Playwright: 1440 / 768 / 390 / 360 px – nincs vízszintes túlcsordulás, nincs konzolhiba.

## Egyeztetendő az ügyféllel
1. Végleges névalak: „Kalocsa Zoltán” vagy „Kalocsa Zoltán Kevin”; van-e cégforma.
2. Egyes vagy többes szám a szövegben.
3. A képek mind saját munkák-e; ha van fotó a kisgépről közelről, a „Szűk hely” blokkba jó lenne.
4. Adatkezelési tájékoztató, impresszum adatai.
5. Hívható időszak (ha ki szeretné írni).
