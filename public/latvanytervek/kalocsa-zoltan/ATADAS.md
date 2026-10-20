# Kalocsa GeoWorks (Kalocsa Zoltán) – gépi földmunka · látványterv, átadás

**Élő terv:** https://daekon-ship.github.io/daekon/latvanytervek/kalocsa-zoltan/
**Állapot:** 5. kör – „Ultimate cinematic redesign” brief (`_forras/brief-5-kor-cinematic.txt`) alapján: narancs–grafit arculat, filmszerű hero videóhellyel, 6 szolgáltatáskártya, Munkáim / Kiemelt munkáim fülek, interaktív térkép (45 km), ajánlatkérő űrlap, rögzített hívógomb, eseménymérés előkészítve. Előzetes látványterv (noindex), az éles domain érintetlen.
**Felépítés:** build nélküli statikus oldal (`index.html` + `kalocsa.css` + `kalocsa.js`), GSAP 3 + ScrollTrigger helyben (`js/`), Leaflet 1.9.4 cdnjs-ről igény szerint (görgetéskor) töltve.

## 1. Elemzés (a 4. körhöz képest)
- **Megtartva:** valódi munkafotók (6 db), 3 lépéses folyamat, „Szűk hely? Nem akadály” + „Megkérdezem, befér-e”, felülnézeti vázlat görgetésre guruló kisgéppel, logójel (kotrókar az árok fölött), Kalocsa GeoWorks név, tel:-linkek.
- **Újratervezve:** színvilág (bézs → narancs–grafit a brief szerint), hero (rajzolt kotró → valódi fotó / videóhely, filmszerű kompozíció), szolgáltatások (6 sötét kártya, „Ajánlatot kérek erre” → előválasztás), galéria (fülek + kiemelt nézet), Rólam (portréhely), térkép (Leaflet), lábléc.
- **Új:** ajánlatkérő, rögzített hívógomb, aktív menüjelölés, eseménymérés.
- **Javítva:** 60 km → **45 km** mindenhol.

## 2. Mi működik ténylegesen
| Funkció | Állapot |
|---|---|
| Sticky, áttetsző → tömör fejléc; aktív menüpont narancs (görgetés szerint) | működik |
| Mobil hamburger menü (animált, Esc, görgetészár) | működik |
| „Munkáim” / „Kiemelt munkák” menüpont a megfelelő fülre vált | működik |
| Galériafülek (egér, ←/→ billentyű, ARIA tablist) | működik |
| Lightbox (nyilak, Esc, fókuszcsapda) – galéria + kiemelt képek | működik |
| Kiemelt munka nézetváltó (valódi fotó ↔ szemléltető árokmetszet; 2 nézet a tereprendezésnél) | működik |
| Szolgáltatáskártya / „Ilyen munkát kérek” → űrlap, munkatípus előválasztva | működik |
| „Megkérdezem, befér-e” → űrlap, leírás előtöltve, fókusz a fotófeltöltésen | működik |
| Űrlap-validáció (kötelező mezők, telefonszám-formátum, e-mail, ≥1 munkatípus, adatkezelés), honeypot | működik |
| Fotófeltöltés kliensoldali ellenőrzése: JPG/PNG/WEBP/HEIC, max. 5 db, egyenként max. 8 MB, előnézet, törlés | működik |
| **Ajánlatkérés továbbítása e-mailben** | **NINCS bekötve** – `AJANLAT.endpoint = null` → „Bemutató mód” üzenet: hívás vagy előre kitöltött e-mail-piszkozat. Hamis „elküldve” üzenet nincs. |
| Rögzített hívógomb (desktop: jobb alsó pirula a heró után; mobil: középen „Hívás most”, safe-area, gépelés közben elrejtve) | működik |
| Interaktív térkép: Kecskemét központ, 45 km-es kör, narancs jelölő + felugró info, **szürke „Bemutató jelölő”** (nem valós munkahely) | működik élőben (cdnjs + CARTO csempék); ha nem tölt be, sematikus tartalékábra |
| Eseménymérés (`dataLayer`) | előkészítve – lásd 5. pont |
| `prefers-reduced-motion` | minden animáció és a Ken Burns kikapcsol |

## 3. Hero videó – specifikáció (a végleges videó ügyféljóváhagyás után készül)
**Most (6. kör, „filmszerű nyitókép” átmeneti megoldás):** a referenciavideó mechanikája Zoltán **valódi** fotóiból. Asztali gépen a nyitókép rögzül, és görgetésre „lepörög” 4 jeleneten (kisgép szűk helyen → tuskóeltávolítás → tereprendezés → közműárok-ásás): lassú ráközelítés, áttűnés, narancs fázisjelző (01–04) a kép alján, „Valódi munkafotók” címke. Mobilon nincs rögzítés, a jelenetek ~4 mp-enként maguktól váltanak. Képek: `img/hero-{kisgep,tusko,rendezes,arok}-{900,1425}.webp` (4:3 kivágások, retusálás nélkül). Csökkentett mozgásnál csak az első kép áll.
**Videó érkezésekor:** a `HERO_VIDEO` beállítással a videó a jelenetek fölé kerül (a jelenetek és a fázisjelző elrejtve). Görgetésre pörgetett változathoz (mint a referencián) a videót sűrű kulcskockákkal kell kódolni (`ffmpeg -g 1` vagy `-g 5`), hogy a `currentTime` léptetése akadásmentes legyen – ezt a videó megérkezése után kötöm be.

**Bekötés:** `kalocsa.js` eleje → `HERO_VIDEO = { mp4: 'video/hero-1920.mp4', webm: 'video/hero-1920.webm', mobileMp4: 'video/hero-720x900.mp4', poster: 'img/hero-poster.webp' }`. A kód automatikusan beteszi (muted, loop, autoplay, playsinline), a poszter alatta marad, `saveData` és csökkentett mozgás esetén nem tölt be videót.

**Jelenet (6–10 mp, varratmentes hurok):** kompakt sárga–narancs kotró a kép jobb oldalán, bal oldalon üres tér a címnek. 1) kanál hidraulikusan leereszkedik → 2) homokos talajba hatol → 3) teli kanállal emel → 4) kiemeli az árokból → 5) oldalra üríti a kupacra → 6) visszatér; az árok végig jól láthatóan mély (talajrétegek, árnyékos fal, kupac). Stabil kamera, nagyon lassú oldalirányú csúszás; meleg, alacsony napfény; grafit–narancs színkorrekció; finom por. Tilos: rajzfilmszerűség, deformálódó gép/kanál, lebegő föld, szöveg, logó, vízjel.
**Technika:** desktop 1920×1080, H.264 MP4 ≤ 4 MB + WebM (VP9) ≤ 3 MB; mobil 720×900 (4:5, gép + árok középen-jobbra) ≤ 2 MB; 24–30 fps, hang nélkül; poszter = első képkocka (WebP, ≤ 150 KB). A brief angol videógeneráló promptja: `_forras/brief-5-kor-cinematic.txt` 2. pont.
**Fontos:** AI-videó nem készült. A végleges videó csak a telefonos egyeztetés és jóváhagyás után kezdhető (esetleg külön díjas).

## 4. Ajánlatkérő – élesítés
- Végpont: `AJANLAT.endpoint` (pl. saját PHP mailer a tárhelyen, vagy űrlapszolgáltatás). A kód `FormData`-t küld POST-tal: `nev, telefon, helyszin, munka[] (több), leiras, email, mikor, fotok[] (fájlok), adatkezeles, weboldal (honeypot – üresnek kell lennie)`.
- Szerveroldalon kötelező: mezőellenőrzés, honeypot + rate limit / reCAPTCHA vagy Turnstile, fájltípus- és méretellenőrzés (MIME sniffing), fájlok nem nyilvános helyen / csak e-mail-mellékletként, címzett: **zkalocsa8@gmail.com**, válasz 2xx esetén a kliens kiírja a „Köszönöm, megkaptam!” üzenetet és csak ekkor méri a `quote_submit_success` eseményt.
- Adatkezelési tájékoztató szövege és linkje [feltöltendő].

## 5. Eseménymérés (GA4-kompatibilis, `window.dataLayer` + `gtag`, ha jelen van)
| Esemény | Mikor | Paraméter |
|---|---|---|
| `phone_click` | bármely `tel:` link kattintása (nem bizonyított hívás!) | `location` |
| `quote_submit_success` | csak valódi, sikeres szerverválasz után (bemutató módban nem fut) | `munka` |
| `portfolio_view` | a Munkáim szekció első megtekintése / lightbox nyitás | `via`, `image` |
| `featured_project_open` | a Kiemelt munkáim fül első megnyitása, nézetváltás | `project`, `view` |
GA4 és süti-hozzájárulás kezelő (pl. Consent Mode v2) még nincs beépítve – élesítéskor együtt kell bekötni.

## 6. Hiányzó anyagok, jóváhagyandó
1. **Hero videó** – telefonos egyeztetés, jóváhagyás (3. pont).
2. **Zoltán portréja** (Rólam) – most elegáns, jelölt képhely; arcot nem generáltunk.
3. **Kiemelt munkák** – mely munkák, helyszín (publikálható-e), rövid leírás. Most 3 előkészített kártya a meglévő fotókkal, helyszín „egyeztetendő”.
4. **Térképes munkapontok** – csak engedéllyel; most egy egyértelműen jelölt bemutató jelölő.
5. **Árok mélyebbnek mutatása** – a valódi fotó változatlan; mellette külön „Szemléltető metszet” ábra (jelölve: „nem a valós munka mérete”).
6. **Főcím** – a brief javaslata áll: „A nehéz munkát ránk bízhatod.” A korábban választott „Építkezel? Kertet újítasz? Nem akarsz ásni napokig?” a Szolgáltatások bevezetőjébe került. Alternatíva: „Precíz földmunka. Biztos alapok.”
7. Cégforma, adószám, impresszum, adatkezelési tájékoztató.
8. Ajánlatkérő végpont + e-mail-integráció, GA4 + hozzájárulás.

## 7. Élesítéshez szükséges
Saját domain + tárhely (PHP vagy szerverless függvény az űrlaphoz), SSL, adatkezelési tájékoztató, GA4 + consent, videó elkészítése és tömörítése, portré, `noindex` levétele, sitemap/robots, Search Console, Google Cégprofil.

## Ellenőrzés (Playwright)
1440 / 768 / 390 / 360 px: nincs vízszintes túlcsordulás, nincs JS-hiba (a sandboxból a cdnjs/CARTO nem érhető el, ott a tartalék ábra látszik). Tesztelve: menü (mobil is), fülváltás menüből, kiemelt nézetváltó, szolgáltatás → űrlap előválasztás, validációs hibák, bemutató-mód visszajelzés, `dataLayer` események, hívógomb.

---
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
