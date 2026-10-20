# Vályog-Mester – átadás (9. kör: véglegesítés, élesítés előkészítése)

**Előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/ (noindex)
**Tervezett éles domain:** https://valyogmester.hu/
**Telepítés:** lásd `TELEPITES.md` · **Éles csomag:** `python3 _forras/build_eles.py --out …`
**A régi valyog-mester.hu oldal nincs módosítva és nincs átirányítva.**

## Állapot röviden
| Terület | Állapot |
|---|---|
| Design (Archivo, fehér–grafit–terrakotta, valódi fotók) | kész |
| Cégadatok (adószám, cégjegyzékszám, bejegyzés) | kész – formailag ellenőrizve |
| Szolgáltatások (fő szakterület + minden felújítás és kőművesmunka, 37 tétel) | kész – a lista ügyféllel átnézendő |
| Ajánlatkérő frontend (6 lépés, validáció, képkicsinyítés, állapotok) | kész, tesztelve |
| Ajánlatkérő backend (`_eles/api/ajanlat.php`) | kész, tesztelve helyi SMTP-vel – élesben a fogadó cím és az SMTP-fiók hiányzik |
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
| `kocka-*.webp` (6 képkocka) | Túró István bemutatkozó videója (Facebook, 2026. március) | galéria, „Salétromos lábazat” blokk, bemutatkozás, két szolgáltatás (a „Miért” szekcióban kérésre nincs kép) | **Saját munka** |
| `video-1-720.mp4` + poszter | ugyanez a videó | A mester szekció | forrásmegjelöléssel |
| `service1`, `hero`, `about`, `service2` | a régi valyog-mester.hu oldal állóképei – **eredetük ismeretlen** | nyitókép, négy szolgáltatás, problémák | **Hangulatkép** |

- A galéria kizárólag saját anyagot tartalmaz. A hangulatképek nem szerepelnek referenciaként, és mindenhol jelölve vannak.
- Hamis előtte–utána, kitalált referencia vagy AI-kép nincs.
- **Felhasználási engedély szükséges:** a videóra és a képkockákra (Túró István hozzájárulása; a felvételen szereplő munkatársaké), valamint a hangulatképekre – ezeket ajánlott saját munkafotókra cserélni. Csere: `index.html` (nyitókép `slide`-ok, `svc-photo`), `valyog.js` → `WORKS` tömb.

## Ajánlatkérő
- **Előnézet:** nincs `data-endpoint`, ezért előnézeti módban fut: semmit nem küld, ezt egyértelműen kiírja, és hívást vagy e-mail-piszkozatot kínál.
- **Éles:** a build beállítja a `data-endpoint="api/ajanlat.php"` attribútumot, és kiveszi az előnézeti blokkot.
- **Kliens:** 6 lépés, lépésenkénti validáció, visszalépés, összegzés módosítás-linkekkel. Fotó: JPG/PNG/WEBP/HEIC, max. 6 db, egyenként 10 MB; a nagy fotókat feltöltés előtt 2000 px-es JPEG-re kicsinyíti (3,5 MB → 0,84 MB). Dupla kattintás ellen védett, 60 mp-es időkorlát van. Siker csak valódi `200 {ok:true}` válaszra jelenik meg; hibánál az adatok megmaradnak, és újrapróbálható.
- **Szerver** (`_eles/api/ajanlat.php`, függőség nélkül):
  - fehérlistás mezővalidáció;
  - csapdamező, 4 mp-es időcsapda, 5 kérés / IP / óra (az IP-ből csak sózott kivonat készül);
  - egyszeri token: ugyanaz a kérés nem megy ki kétszer;
  - fájlok valódi típusellenőrzéssel (finfo + képfejléc), 10 MB / db, 40 MB összesen, anonimizált mellékletnévvel (`foto-1.jpg`);
  - **nincs tárolás**: a képek csak e-mail-mellékletként mennek tovább;
  - SMTP (STARTTLS/SSL) vagy `mail()`, a hitelesítő adatok környezeti változóból vagy webgyökéren kívüli ini-fájlból jönnek;
  - beállítás nélkül 503-at ad, SMTP-hibánál 502-t – hamis sikert soha nem jelez.

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

## Ellenőrzés (9. kör)
| Teszt | Eredmény |
|---|---|
| Viewportok 320 / 360 / 390 / 430 / 768 / 1024 / 1440 | nincs vízszintes görgetés, nincs törött kép, nincs konzolhiba vagy 404-es erőforrás; a 320 px-es túlcsordulás (hosszú e-mail-cím) javítva |
| Képkeretek | minden kép a keretében marad, nincs nagyítás vagy eltolás (géppel mérve, 3 méreten) |
| Mobil | a dokk az űrlapnál és gépelés közben elrejtőzik; a menü bezárható gombbal, Esc-kel és linkre kattintással; a címkék betűmérete legalább 11 px |
| Ajánlatkérő, böngészőben (1440 és 390) | sikeres küldés 2 fotóval → 1 levél, 2 melléklet (3,5 MB-os fotó → 0,84 MB); dupla kattintás → 1 levél; túl nagy fájl → kliensoldali hiba; hálózati hiba → hibaüzenet, az adatok megmaradnak, az újrapróbálás sikeres; 503 és 502 → hibaüzenet, hamis siker nincs |
| Ajánlatkérő, szerveren (curl) | hibás telefon → 422; rossz épület, hiányzó elfogadás → 422; 11 MB-os kép → 413; álcázott nem-kép → 422; csapdamező → csendes elnyelés; túl gyors kitöltés → 422; ugyanaz a token → nincs második levél; 6. kérés egy órán belül → 429 |
| Kiküldött levél | UTF-8 tárgy és törzs, Reply-To az ügyfél e-mailje, magyar idő, anonimizált mellékletnév; az adatmappában nincs személyes adat |
| CSP (éles fejléc) | nincs letiltott erőforrás, az inline szkript a hash alapján fut |
| Animációk nélkül, billentyűzettel | minden tartalom látszik; a fókuszsorrend helyes, a lépésváltáskor a fókusz a kérdésre ugrik |
| Teljesítmény | Chrome, mobilemuláció, 4× CPU, lassú 4G (150 ms / 1,6 Mbit/s), tömörítés nélkül, 3 futás mediánja: **FCP 1,5 s · LCP 2,1 s · CLS 0 · TBT 0 ms · 639 KB**. Lighthouse nem futtatható ebből a környezetből (npm nem érhető el) – élesítés után a valyogmester.hu címen mérendő. |

## Ügyféltől még szükséges
1. **Ajánlatfogadó e-mail-cím** – valyog.mester@gmail.com, istvanturo06@gmail.com vagy turpabuildkft@gmail.com? Az oldalon látható cím is ehhez igazodjon.
2. **Munkaterület és kiszállás:** a régi oldal „országos kiszállást” írt, az új oldalon „Fegyvernek és Jász-Nagykun-Szolnok vármegye, távolabb egyeztetéssel” szerepel. Az **ingyenes felmérés** feltételei (van-e kiszállási díj távolabb?) – addig az „ingyenes” szó a régi oldal saját állítása alapján marad.
3. **Képek és videó felhasználási engedélye**, illetve saját munkafotók (előtte–utána párok is).
4. **Szolgáltatáslista** átnézése (különösen a csak Daibau-profilon szereplő tételek).
5. **Adatkezelési adatok:** adatvédelmi kapcsolattartó, megőrzési idő, tárhely- és e-mail-szolgáltató, hatályba lépés dátuma.
6. **Hozzáférések:** tárhely, DNS, SMTP-fiók (vagy a DAEKON biztosítja).
7. Hozzájárulás a lábléc diszkrét „Weboldal: DAEKON” hivatkozásához.

## Fájlok
`index.html`, `valyog.css`, `valyog.js`, `adatkezeles.html` – az oldal · `fonts/` · `img/foto/` · `arculat/` (logócsalád, favicon, `logo-allo-vilagos.png`) · `_eles/` (api, htaccess, user.ini, robots, 404, ini-minta – csak az éles csomagba kerülnek) · `_forras/` (`build_eles.py`, `logo.py`, `media.py`, `og.html`, forrásbetű) · `koncepcio.html` (az 1. kör irányai + a végleges rendszer).

## Előzmények
1. kör: rajzolt „Falmetszet” · 2–3.: a régi oldal képei és a videó, a helyőrzők törölve · 4–6.: paletták · 7.: letisztult Archivo-irány · 8.: képkeretek, teljes munkalista · **9.: véglegesítés** – hitelesített adatok, igazolt szolgáltatások, működő backend, SEO, éles build.
