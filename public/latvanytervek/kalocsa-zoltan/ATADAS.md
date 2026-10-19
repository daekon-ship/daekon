# Kalocsa Zoltán – gépi földmunka · látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/kalocsa-zoltan/
**Arculat + koncepció:** https://daekon-ship.github.io/daekon/latvanytervek/kalocsa-zoltan/koncepcio.html
**Állapot:** 1. kör, előzetes látványterv (noindex).
**Felépítés:** build nélküli statikus oldal (`index.html` + `kalocsa.css` + `kalocsa.js`), relatív útvonalak, külső könyvtár nélkül.

## Koncepció
„EARTH / ENGINEERED” – grafit (#111315) + munkavédelmi narancs (#FF6B2B), egyetlen papír szekció (#E9E5DE). Az ügyfél saját sötét–narancs mintája az alap; a bézs minta csak ellenpont. Három irányból választva (lásd `koncepcio.html`): A) Earth/Engineered – kiválasztva; B) világos kitűzőszalag – elvetve (az ügyfél sötétet kért); C) talajszelvény-oldal – a gondolat a hero alsó sávjába olvadt.

Jellegzetes elemek: árokszelvény-logójel (`logo-jel.svg`), kitűzési „nyomvonal” a bal margón (görgetésre halad, ≥1100 px), talajszelvény a nyitókép alján kirajzolódó árokprofillal, topografikus szintvonalak, műszaki vágójelek a fotón, felülnézeti vázlat a „Szűk hely? Nem akadály.” blokkban (kisgép a kaputól a kert végébe).

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
- **Betűméret:** a brief „óriás” címeket és kontúros „FÖLDMUNKA” háttérszöveget kért – DAEKON-házszabály szerint mérsékelt méret (H1 max. 66 px), a kontúrszöveg helyett szintvonal-textúra.
- **Szám:** a joszaki-profil egyes szám első személyben, tegezve ír, ezért a szöveg is így szól („vállalok”, „Rólam”, „Munkák”). Ha többes számot szeretne („Munkáink”, „Rólunk”), 1 perces csere.
- **Betűk:** Archivo (keskeny 72%, 800) + Manrope, helyben (a repó meglévő OFL-fájljai).

## Működik / bekötendő
| Funkció | Állapot |
|---|---|
| Ragadós, görgetésre vékonyodó fejléc, mobilmenü (Esc) | működik |
| tel: / mailto: linkek | működik |
| Galéria lightbox (nyilak, Esc, fókuszcsapda) | működik |
| Szolgáltatássorra kattintva az űrlap munkatípusa előválasztódik | működik |
| Mobil alsó sáv (Hívás / Ajánlatkérés), a kapcsolat blokknál elrejtve | működik |
| **Ajánlatkérő űrlap** | **látványterv-mód** (`KULDES.endpoint = null` a `kalocsa.js`-ben): nem küld adatot, ezt ki is írja, és előre kitöltött e-mailt vagy hívást kínál. |
| Adatkezelési tájékoztató, impresszum | [feltöltendő] |

## Mozgás
Betöltés ≈1 mp (cím soronként, fotó maszkkal, árokprofil kirajzolódik) · görgetés: nyomvonal, beúszások, galéria-maszk, kisgép végiggurul a vázlaton, kiszállási kör kinyílik · hover: narancs alsó vonal, nyíl. `prefers-reduced-motion` mellett minden statikus. GSAP/WebGL nem kell.

## Ellenőrzés
Playwright: 1440 / 768 / 390 / 360 px – nincs vízszintes túlcsordulás, nincs konzolhiba.

## Egyeztetendő az ügyféllel
1. Végleges névalak: „Kalocsa Zoltán” vagy „Kalocsa Zoltán Kevin”; van-e cégforma.
2. Egyes vagy többes szám a szövegben.
3. A képek mind saját munkák-e; ha van fotó a kisgépről közelről, a „Szűk hely” blokkba jó lenne.
4. Kért-e űrlapot, vagy elég a hívás + e-mail.
5. Adatkezelési tájékoztató, impresszum adatai.
6. Hívható időszak (ha ki szeretné írni).
