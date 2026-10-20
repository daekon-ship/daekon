# Kalocsa GeoWorks (Kalocsa Zoltán) – gépi földmunka · látványterv, átadás

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/kalocsa-zoltan/ (noindex)
**Állapot (2026.10.20., véglegesítő kör):** ügyfélnek bemutatható látványterv. Az éles működéshez szükséges integrációk előkészítve, de **nincsenek bekapcsolva** (lásd G).
**Felépítés:** build nélküli statikus oldal – `index.html`, `kalocsa.css`, `kalocsa.js`, `js/` (GSAP 3 + ScrollTrigger helyben), `video/`, `img/`, `fonts/`, `adatkezeles.html` és `impresszum.html` (vázlatok), `_forras/` (briefek, `video.sh`, `backend/`).

## A. Véglegesítő kör javításai
- **Nyitókép-vezérlés újraírva** (`heroInit`):
  - Videó → poszter → valódi fotós tartalék.
  - **Asztali gép:** görgetésre pörgő videó, rögzített nyitóképpel.
  - **Mobil:** rögzítés nélkül, némítva, hurokban játszik; a nyitóképből kigörgetve megáll.
  - **Csökkentett mozgás:** csak a poszter, „Szemléltető kép” címkével.
  - **Lassú (2G) kapcsolat vagy adatkímélés:** a videó nem töltődik le, Zoltán valódi munkafotói jönnek.
  - **Videóhiba, 10 mp-nél hosszabb betöltés vagy tiltott autoplay:** automatikusan a valódi fotós jelenetsorra vált.
  - A poszter HTML-ben, azonnal látszik (nincs fekete villanás). A tartalék fotók csak szükség esetén töltődnek le (`data-src`).
- **Videó:** az asztali változat újratömörítve, 3,9 → 3,0 MB, 4 kockánként kulcskockával; a mobil 0,45 MB. A felvétel szemléltető animációként jelölt.
  - A **vízszintes tükrözés** szándékos, csak asztali gépen: a generált felvételen az árok bal oldalon van, ami a főcím mögé esne; tükrözve az ásás jobbra kerül és látszik. Mobilon nincs tükrözés.
- **Térkép:**
  - jelmagyarázat (munkajelölő, Kecskemét, 45 km-es kör),
  - a narancs jelölő felirata „Munkajelölő – bemutató, nem valós helyszín” (nem állítja, hogy ott munka folyik),
  - két CDN-es betöltés (cdnjs → unpkg),
  - méret-újraszámolás a rögzített nyitókép miatt,
  - tartalék ábra, ha a térkép nem tölt be.
- **Ajánlatkérő:**
  - látható „bemutató változat” jelzés az elküldés gomb alatt,
  - kitöltési idő a spamszűréshez,
  - a kliens csak `{ok:true}` JSON-válaszra jelez sikert,
  - teljes PHP végpont előkészítve: `_forras/backend/ajanlat.php` és `config.example.php`.
- **Mérés:**
  - `ANALYTICS` beállítás: GA4 csak hozzájárulás-sávval tölt be, a GoatCounter süti nélküli; addig csak a `dataLayer`-be kerülnek az események,
  - eseménydefiníciók a kódban és lent,
  - plusz esemény: `hero_fallback` (miért nem ment a videó).
- **Jogi oldalak:** `adatkezeles.html` és `impresszum.html` vázlatként, `[kitöltendő]` mezőkkel; a lábléc és az űrlap ezekre mutat.
- **Rólam:** a portréhely letisztítva (logójel + „Portré”), szöveges magyarázat nélkül.
- **Teljesítmény:**
  - Archivo betűkészlet a használt tartományra szűkítve: 81 → 49 KB,
  - nagy képek újratömörítve (-7–13%),
  - a 11 px alatti szövegek megszüntetve (márkafelirat, címke, fázisjelző),
  - a mobil nyitókép feliratának tördelése javítva.

## B. Ügyfélkérések (Zoltán 2026.10.19–20.)
| # | Kérés | Állapot |
|---|---|---|
| 1–2 | Narancs–sötétszürke, fehér szöveg | ✅ |
| 3–4 | Valósághű munkagépes animáció, látható árok | ✅ szemléltető AI-animáció (Higgsfield), görgetéses / hurok |
| 5 | Gyors, mobilon jó | ✅ mérve, lásd E |
| 6–7 | Munkáim + Kiemelt munkáim fül, saját fotók | ✅ / kiemelt adatok egyeztetendők |
| 8 | Árok mélyebbnek | ✅ szerkesztett fénykép külön jelölve + eredeti + szemléltető metszet |
| 9–10 | Ajánlatkérő munkatípusokkal, fotófeltöltés | 🔶 felület kész, **továbbítás nincs bekötve** (végpont előkészítve) |
| 11 | Rögzített hívógomb | ✅ |
| 12–14 | Interaktív térkép, menüből elérhető, narancs jelölő | ✅ / a jelölő bemutató, valós hely jóváhagyásra vár |
| 15 | 3 lépéses folyamat | ✅ |
| 16 | Mérés (telefon, ajánlatkérés, munkák) | 🔶 események készek, **mérési fiók (GA4/GoatCounter) hiányzik** |
| 17 | Rólam saját portréval | 🔶 szöveg kész, **fotó hiányzik** |
| 18 | „Megkérdezem, befér-e” | ✅ (gomb → űrlap, fotófeltöltésre ugrik) |

## C. Funkcionális tesztek (Playwright, helyi szerver, byte-range-dzsel)
| Teszt | Eredmény |
|---|---|
| Asztali görgetéses videó (currentTime) | 0 → 2,7 → 5,5 → 7,9 mp |
| Mobil videó | lejátszik, némítva, hurokban; nincs rögzítés |
| Menü → Munkaterület | a szekció 88 px-re (fejléc alá) ugrik; az aktív menüpont „Munkaterület” |
| Mobil hamburger menü | nyílik, navigál |
| Fülek egérrel és ←/→ billentyűvel | működik |
| Lightbox | nyit, → következő, Esc zár |
| Űrlap | üres → hibaüzenet; rossz telefon/e-mail jelölve; 6 képből 5 marad + üzenet; PDF elutasítva; szolgáltatáskártya → munkatípus előválasztva; beküldés → „Bemutató mód” (nincs hamis siker) |
| Hívógomb | mobilon látszik, gépelés közben elrejtőzik |
| Csökkentett mozgás | nincs videó, poszter + „Szemléltető kép” |
| Videóhiba (letöltés megszakítva) | valódi fotós jelenetsor, „Valódi munkafotók” |
| Adatkímélő mód | videókérés 0 db, fotós jelenetsor |
| JS-hiba, 4xx/5xx válasz | 0 (mind a 8 szélességen) |

A Chromium tesztböngésző nem játszik le H.264-et, ezért a teszt a videók WebM-másolatával futott. A valódi böngészőkben az MP4 megy.

A térkép a tesztkörnyezetből nem érhető el (cdnjs/CARTO blokkolva), így ott csak a tartalék ábra látszott; élőben kézzel ellenőrizendő.

## D. Mobil / kijelzőméretek
360, 375, 390, 430, 768, 1024, 1440, 1920 px: vízszintes túlcsordulás 0; 11 px alatti szöveg 0 (javítás után).

## E. Teljesítmény (mérve – nem Lighthouse)
Lighthouse ebben a környezetben nem futtatható. Playwright + Chrome DevTools-hálózat- és CPU-lassítással, helyi szerverről mérve:

| Profil | FCP | LCP | CLS | Első betöltés |
|---|---|---|---|---|
| Mobil, lassú 4G (1,6 Mbit/s, 150 ms), 4× CPU | 1,32 s | 1,32 s | 0,00 | ≈ 357 KB, 7 kérés (+ a 0,45 MB-os hurokvideó) |
| Asztali, 10 Mbit/s | 0,37 s | 1,32 s* | 0 | a 3 MB-os görgetéses videóval együtt |

\* Az asztali LCP a bevezető szöveg animált megjelenése. A GitHub Pages / CDN-mérés (Lighthouse, PageSpeed Insights) élesítéskor ajánlott.

## F. Zoltántól elkérendő
1. **Portré** (álló, jó fényben) a Rólam részbe.
2. **„Kalocsa GeoWorks” név:** jóváhagyja-e így (a DAEKON közölte 2026.10.20-án), és van-e hivatalos cégforma.
3. **Hivatalos adatok** az impresszumhoz és az adatkezeléshez: vállalkozási forma, székhely, adószám, nyilvántartási szám, megőrzési idő.
4. **Kiemelt munkák:** mely 2–3 munka, település (publikálható-e), rövid leírás. A meglévő fotókhoz most nincs megerősített helyszín és méret.
5. **Térképes munkapont:** jóváhagyott, nem lakcím-pontosságú helyszín (pl. település szintű), vagy maradjon csak a körzet.
6. **Videó:** jóváhagyja-e a szemléltető animációt (és a „Szemléltető animáció” címkét).

## G. Élesítéshez szükséges
- **Tárhely és domain:**
  - saját domain és PHP 8.1+ tárhely (vagy szervermentes függvény),
  - HTTPS,
  - `noindex` levétele csak jóváhagyás után.
- **Ajánlatkérő:**
  - `_forras/backend/ajanlat.php` feltöltése (pl. `/api/ajanlat.php`),
  - `composer require phpmailer/phpmailer`,
  - a `config.example.php` alapján a `private/ajanlat-config.php` a **webgyökéren kívül**, SMTP-adatokkal (SPF/DKIM),
  - írható, nem nyilvános `ratelimit` mappa,
  - majd `kalocsa.js` → `AJANLAT.endpoint = '/api/ajanlat.php'`.
  - Tesztküldés **saját címre** először; Zoltánnak csak jóváhagyás után.
- **Mérés:** GA4-azonosító (és a süti-sáv szövegének jóváhagyása) vagy süti nélküli GoatCounter-fiók → `kalocsa.js` → `ANALYTICS`.
  - Riport: `phone_click` (gombhasználat, nem bizonyított hívás), `quote_submit_success` (csak sikeres szerverválasz után), `portfolio_view` (a Munkáim szekció első, ≥25%-os megjelenése vagy képnagyítás), `featured_project_open`.
- **Jogi oldalak:** az adatkezelési tájékoztató és az impresszum kitöltése (jogi ellenőrzés javasolt).
- **Ellenőrzés élesben:** a térkép, és PageSpeed Insights mérés a végleges domainen.

## Videó-újragenerálás / csere
`bash _forras/video.sh <nyers.mp4>` → `video/hero-scrub.mp4`, `video/hero-loop-mobil.mp4`, `video/hero-poster*.webp`. A nyers Higgsfield-fájl nincs a repóban.

---
# Előzmények (körök)
# 7. kör – munkagépes videó beépítve (2026.10.20.)
- Forrás: Higgsfield (Starter csomag; állókép Soul Cinema modellel, videó Seedance 2.0 Fast, 8 mp, 1280×720, vízjel nélkül), prompt: `_forras/brief-5-kor-cinematic.txt` + a beszélgetésben használt két prompt. AI-illusztráció, nem Zoltán gépe → a heróban „Szemléltető animáció” címke (törölhető `HERO_VIDEO.tag`).
- Feldolgozás: `bash _forras/video.sh <nyers.mp4>` → `video/hero-scrub.mp4` (3,8 MB, 4 kockánként kulcskocka, asztali görgetéshez), `video/hero-loop-mobil.mp4` (≈0,5 MB, 768×640 kivágás, a végén 0,6 mp áttűnés az első kockába = varrat nélküli hurok), `video/hero-poster*.webp`.
- Működés: asztali gépen a nyitókép rögzül, a videó görgetésre pörög (ásás → kanál tele → kiemelés → föld a kupacra, a fázisjelző követi); mobilon némítva hurokban játszik. Adatkímélő mód / csökkentett mozgás esetén a fotós jelenetsor marad. A nyers Higgsfield-fájl nincs a repóban.

# 6. kör – Zoltán saját kéréslistája alapján (2026.10.20.)
- **Árok mélyebbnek:** `img/kozmuarok-melyebb-*.webp` – ugyanaz a fénykép, a talpa és a falai árnyékolással mélyítve (nem retusált tárgy, nem hozzáadott földréteg). A Kiemelt munkáimban alapnézet, „Szerkesztett fénykép – mélyebb hatás” jelöléssel; az eredeti és a szemléltető metszet is választható. A hero és az „Összes munka” az eredetit mutatja.
- **Ne legyen túl sötét:** világosabb grafit tónusok (#2B3137 / #323940 / #3C444C).
- **Narancs pont a térképen („épp ott van egy munka”):** narancs, pulzáló jelölő „Itt épp munka folyik” felugró ablakkal (példa – valódi helyszín jóváhagyással); Kecskemét középpont világosszürke. Leaflet cdnjs → unpkg tartalékkal.
- **Még nyitott, ügyféltől/döntéstől függ:** valódi animáció (videó), űrlap tényleges küldése, mérés megjelenítése (fiók kell), portré.

# Korábbi körök
## 4. kör – „Valami jó logót találj ki felülre”, „hogy néz az úgy egybe ki?”, „ez a színvilág jobb”
- **Logó:** `logo-jel.svg` (jel) és `logo.svg` (jel + név): lekerekített homokszínű négyzet, benne sötétbarna kotrókar és kanál az árok-szelvény fölött. A fejlécben és a láblécben; hoverre a kar „ás” egyet.
- **Nyitókép:** a fotó + ráhelyezett rajz keveréke helyett egyetlen rajzolt jelenet: keretben homokszínű ég és dombok, a kisgép (lánctalp, tolólap, fülke, gém, kar, kanál) a minta szerint kilóg a keretből, a kanál a földkupacba ás. A valódi fotók a Munkák galériában.
- **Színvilág:** bézs #EADBB8 alap, sötétbarna #3A2A1B címek és ikonok, homok/karamell #C9A066–#B98547 gombok sötétbarna felirattal, sötétbarna lábléc.

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
