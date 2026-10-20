# Vályog-Mester – átadás (10. kör: telefonos véglegesítés)

**Előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/ (noindex)
**Éles domain:** https://valyogmester.hu/ (DAEKON VPS, HTTPS kész – jelenleg „hamarosan” helyőrző) · **VPS-előnézet:** https://valyogmester.preview.daekon.hu/ (jelszavas, noindex)
**Telepítés:** lásd `TELEPITES.md` · **Éles csomag:** `python3 _forras/build_eles.py --out …`
**A régi valyog-mester.hu oldal nincs módosítva és nincs átirányítva.**

## Állapot röviden
| Terület | Állapot |
|---|---|
| Design (Archivo, fehér–grafit–terrakotta, valódi fotók) | kész |
| Cégadatok (adószám, cégjegyzékszám, bejegyzés) | kész – formailag ellenőrizve |
| Szolgáltatások (fő szakterület + minden felújítás és kőművesmunka, 37 tétel) | kész – a lista ügyféllel átnézendő |
| Kapcsolatfelvétel | **telefonos** (10. kör, a megrendelő döntése): ajánlatkérő űrlap, PHP-végpont, SMTP és fotófeltöltés eltávolítva; minden fő gomb `tel:+36309669528` |
| SEO (canonical, OG, strukturált adat, sitemap, robots) | kész – az éles build aktiválja |
| Adatkezelési tájékoztató + impresszum (`adatkezeles.html`) | tervezet – a jelölt részeket az ügyfélnek kell jóváhagynia |
| Éles build + telepítési terv | kész – a build szándékosan megáll, amíg a tájékoztató nincs jóváhagyva |

## Valós cégadatok
| Adat | Érték | Ellenőrzés |
|---|---|---|
| Vállalkozás | TURPA BUILD Kft. | régi oldal, Daibau, onlinecegbazis |
| Ügyvezető | Túró István | régi oldal, Daibau |
| Székhely | 5231 Fegyvernek, Lelovich György út 8/A | onlinecegbazis |
| Cégjegyzékszám | 16-09-018294 | megrendelő; a 16-os kód = Szolnoki Törvényszék Cégbírósága, egyezik a székhellyel |
| Adószám | 26584094-2-16 | megrendelő; az ellenőrző számjegy helyes, a 16-os megyekód egyezik |
| Bejegyzés | 2018. november 23. | megrendelő |
| Tapasztalat | 20+ év – **Túró István személyes szakmai tapasztalata**, nem a cégé | régi oldal, a mester saját szövege |
| Telefon | +36 30 966 9528 | régi oldal |
| E-mail a weboldalon | valyog.mester@gmail.com (változatlan) | régi oldal |

A cégadatokat online, független nyilvántartásban (e-cegjegyzek.hu) érdemes még egyszer megnézni – innen nem volt elérhető.

## Szolgáltatások
**A DAEKON kérésére (2026-10-20) az oldal mindenfajta felújítást és kőművesmunkát mutat** – már a nyitóképen is („Mindenfajta felújítás és kőművesmunka egy kézből”, munkacímkék, tényszalag), és a „Minden munka” blokkban (`#egyeb-munkak`, 6 csoport, 37 tétel).

- **Fő szakterület (Szolgáltatások, 6 tétel):** vályogházak felújítása · vert falú házak javítása · vegyes falazatú házak felújítása · aláfalazás és falmegerősítés · vakolás és felületképzés · régi házak teljes felújítása.
- **Minden munka:**
  - Kőművesmunkák: kisebb és nagyobb kőművesmunkák, falazás, átalakítás, aláfalazás, falmegerősítés, falrepedések, kézi vakolás, glettelés, lábazat, támfal, terasz és erkély
  - Felújítás: teljes ház, lakás, fürdőszoba, vályog-, vert falú és vegyes falazatú házak, tetőtér-beépítés, új ház
  - Alap, beton, szigetelés: alapozás, betonozás, zsaluzás, vízszigetelés és injektálás, talajszigetelés, földmunka, bontás
  - Tető és nyílászárók: ácsmunka, tetőfedés, tetőjavítás, előtető, ablak, ajtó
  - Térkövezés, udvar, kert: térkövezés, udvarrendezés, kertépítés, fa terasz, pergola
  - Kerítés és fémszerkezet: kerítés betonból vagy vasból, fém kerítés, rozsdamentes korlát, fémszerkezetes terasz, kocsibeálló

**Források:** a cég saját Daibau-profilja (30 tétel, a vállalkozás maga adta meg), a régi valyog-mester.hu oldal, az onlinecegbazis és a bemutatkozó videó. Kitalált tétel nincs.

**Átadás előtt Túró Istvánnal érdemes egyszer végignézni** – főleg azokat, amelyek csak a Daibau-profilon szerepelnek: új építésű ház, fémszerkezetes munkák, injektálás és talajszigetelés, ácsmunka és tetőfedés, kertépítés és pergola. Ha valamit nem vállal, törölni kell: `index.html` (catalog), az ajánlatkérő 2. lépése és az `api/ajanlat.php` `MUNKA` listája.

## Képek és videó – hitelesség
| Anyag | Eredet | Hol látszik | Jelölés |
|---|---|---|---|
| `kocka-*.webp` (5 képkocka) | Túró István bemutatkozó videója (Facebook, 2026. március) | „Salétromos lábazat” blokk, bemutatkozás, két szolgáltatás (a képkocka-galéria kérésre törölve) (a „Miért” szekcióban kérésre nincs kép) | **Saját munka** |
| `video-1-720.mp4` + poszter | ugyanez a videó | A mester szekció | forrásmegjelöléssel |
| `service1`, `hero`, `about`, `service2` | a régi valyog-mester.hu oldal állóképei – **eredetük ismeretlen** | nyitókép, négy szolgáltatás, problémák | **Hangulatkép** |

- A galéria kizárólag saját anyagot tartalmaz. A hangulatképek nem szerepelnek referenciaként, és mindenhol jelölve vannak.
- Hamis előtte–utána, kitalált referencia vagy AI-kép nincs.
- **Felhasználási engedély szükséges:** a videóra és a képkockákra (Túró István hozzájárulása; a felvételen szereplő munkatársaké), valamint a hangulatképekre – ezeket ajánlott saját munkafotókra cserélni. Csere: `index.html` (nyitókép `slide`-ok, `svc-photo`), `valyog.js` → `WORKS` tömb.

## Telefonos kapcsolatfelvétel (10. kör)
- **Döntés:** az ügyfél telefonon fogadja az érdeklődőket – nincs űrlap, nincs SMTP, nincs fotófeltöltés. Eltávolítva: a 6 lépéses varázsló (HTML, JS ~160 sor, CSS),
  az `_eles/api/` (PHP), `user.ini`, `valyog-ajanlat.ini.minta`; a VPS-ről a régi `config/valyog-ajanlat.ini` (mentés: a webhely `backups/` mappájában).
- **Gombok:** fejléc „Hívjon most”, nyitókép „Hívjon most” + „Mit vállalunk?”, Minden munka „Beszéljünk a felújításról”, Tünetek „Kérjen telefonos
  egyeztetést”, kapcsolat-kártya „Hívjon most: +36 30 966 9528”, mobilmenü, lábléc. Mind a 14 hívólink ugyanaz: `tel:+36309669528`.
- **Mobil hívássáv:** egy terrakotta gomb („Hívjon most | +36 30 966 9528”); a nyitóképen, a kapcsolat-szekciónál, a láblécnél és nyitott menünél elrejtőzik.
- **„Ingyenes felmérés”:** a feltételei nem igazoltak, ezért mindenhol „helyszíni felmérés – egyeztetés telefonon” / „a felmérés feltételeit telefonon
  egyeztetjük” szerepel helyette. Ha Túró István megerősíti, hogy a felmérés ingyenes (és milyen távolságig), visszaírható.

## SEO
- **Előnézet:** `noindex, nofollow`; a canonical már az új domainre (`https://valyogmester.hu/`) mutat.
- **Az éles build állítja be:** `index, follow`; az og:url, az og:image és a strukturált adat URL-jei az új domainre kerülnek; elkészül a `robots.txt` (Disallow: /api/) és a `sitemap.xml`.
- **Strukturált adat:** `HomeAndConstructionBusiness` – cégnév, adószám, cégjegyzékszám, bejegyzés dátuma, cím, terület, szakterületek; a logó PNG-ben.
- **Cím és leírás:** a helyi kulcsszavak természetes szövegben szerepelnek: vályogház felújítás, vert fal javítás, Fegyvernek, Jász-Nagykun-Szolnok vármegye.

## Teljesítmény és technika
- GSAP és ScrollTrigger kikerült (−~110 KB JS), a nyitóanimáció CSS-ből megy.
- Betű: egy fájl, woff2, latin + magyar ékezetek, a használt tengelyekre szűkítve – 85 KB → 42 KB.
- **Képek:** a nyitókép előtöltve, a többi lusta betöltésű; a nem használt képek, textúrák és régi betűk törölve.
- **Videó:** csak kattintásra töltődik be (`preload="none"`), automatikus lejátszás nincs.
- **Animációk nélkül is működik:** `prefers-reduced-motion` esetén minden elem azonnal látszik, minden vezérlő billentyűzetről is elérhető.

## Ellenőrzés (10. kör, 2026-10-20)
| Teszt | Eredmény |
|---|---|
| Viewportok 320 / 360 / 390 / 430 / 768 / 1024 / 1440 / 1920 (Chromium) | nincs vízszintes túlcsordulás, levágott cím/gomb, törött kép, konzolhiba, 4xx erőforrás; 0 űrlap, 0 fájlmező |
| Hívásgombok | 14 db, mind `tel:+36309669528`; mobilon a gombok ≥ 44 px (a lábléc linkjei is) |
| Mobil | menü nyit / Esc-re zár, a menüben hívásgomb; a hívássáv görgetés közben látszik, nem takar tartalmat |
| Videó | csak kattintásra tölt (`preload="none"`), nincs automatikus lejátszás, vezérlőkkel játszik |
| Reduced motion | minden tartalom azonnal látszik (0 rejtett blokk) |
| Teljesítmény (mobil, 4× CPU, 150 ms / 1,6 Mbit/s, tömörítés nélkül, 3 futás) | FCP 1,9 s · LCP 1,9 s · CLS 0 · interakció ~55 ms · 613 KB; a VPS-en gzip (CSS 8,8 KB) |
| VPS-előnézet (HTTPS) | jelszó nélkül 401, jelszóval 200; noindex fejléc + robots; `/api/`, `_forras/`, `*.md`, `koncepcio.html`, `.htaccess` → 404; saját 404-oldal |
| Éles build | a csomag kész, egyetlen akadálya a 8 jóváhagyandó adatkezelési pont (szándékos védelem) |

## Ügyféltől még szükséges (a nyilvános indulás feltétele)
1. **Adatkezelési tájékoztató jóváhagyása** – a 8 jelölt pont: adatvédelmi kapcsolattartó e-mail, szerződéses/számlázási adatkezelés, megőrzési idő,
   adatfeldolgozói megállapodás a DAEKON-nal, a postafiók szolgáltatója, hatálybalépés.
2. **Képek és videó felhasználási engedélye** – a videó és a képkockák (Túró István és a felvételen szereplő munkatársak); a „Hangulatkép” jelölésű
   képek eredete ismeretlen (a régi oldalról) – megerősítés, hogy használhatók, vagy saját munkafotó helyettük.
3. **Szolgáltatáslista** – főleg a csak a Daibau-profilon szereplő tételek (új ház, fémszerkezet, injektálás, talajszigetelés, ács, tetőfedés, kertépítés, pergola).
4. **Ügyfél által megerősítendő állítások:** „5 fős csapat, saját járművel, saját eszközökkel” (Daibau-profil), munkaterület (Fegyvernek és környéke,
   távolabb egyeztetéssel), a felmérés feltételei (ingyenes-e).
5. Hozzájárulás a lábléc „Weboldal: DAEKON” hivatkozásához.

## Fájlok
`index.html`, `valyog.css`, `valyog.js`, `adatkezeles.html` – az oldal · `fonts/` · `img/foto/` · `arculat/` (logócsalád, favicon, `logo-allo-vilagos.png`) · `_eles/` (htaccess, robots, 404 – csak az éles csomagba kerülnek) · `_forras/` (`build_eles.py`, `logo.py`, `media.py`, `og.html`, forrásbetű) · `koncepcio.html` (az 1. kör irányai + a végleges rendszer).

## Élesítés (2026-10-20)
- **Adatkezelési tájékoztató:** a TURPA BUILD Kft. mind a 6 pontot jóváhagyta (adatvédelmi e-mail: valyog.mester@gmail.com; szerződés 5 év,
  számviteli bizonylat 8 év; megkeresés legfeljebb 1 év; aláírt adatfeldolgozói megállapodás a DAEKON-nal; Google Ireland Ltd.; hatály: 2026. október 20.) –
  a DAEKON 2026-10-20-i közlése alapján.
- **Képek / videó:** az ügyfél felhasználási jóváhagyása a DAEKON közlése szerint rendelkezésre áll (saját anyag: bemutatkozó videó és képkockái). Az
  **ismeretlen eredetű „Hangulatkép” fotók (`service1`, `hero`, `about`, `service2`) a DAEKON döntésére lekerültek** – a jóváhagyás harmadik fél anyagára nem
  terjedhetett ki igazoltan. Helyettük kizárólag saját képkockák szerepelnek (nyitókép, szolgáltatások, tünetek).

## Előzmények
**10.: telefonos véglegesítés** – űrlap, PHP, SMTP eltávolítva; hívásgombok, mobil hívássáv, egyszerűsített adatkezelés; VPS-előnézet. 1. kör: rajzolt „Falmetszet” · 2–3.: a régi oldal képei és a videó, a helyőrzők törölve · 4–6.: paletták · 7.: letisztult Archivo-irány · 8.: képkeretek, teljes munkalista · **9.: véglegesítés** – hitelesített adatok, igazolt szolgáltatások, működő backend, SEO, éles build.
