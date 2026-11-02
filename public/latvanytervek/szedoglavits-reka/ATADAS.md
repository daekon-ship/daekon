# Dr. Szedoglavits Réka – látványterv, átadás

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/szedoglavits-reka/
**Állapot:** 4. kör (2026. 10. 27.) – bővített Motion-animációk; korábban: Libre Baskerville, kompaktabb térközök, középre igazított portré.

> Miért nem külön repó? A brief a `daekon-ship/szedoglavits-reka-preview` repót javasolta, de ebben a munkamenetben új repót nem lehetett létrehozni (a GitHub-token nem érvényes repó-létrehozásra). Ezért a ház-szabály szerinti helyre került: `daekon-ship/daekon` → `public/latvanytervek/szedoglavits-reka/`. A cím állandó, nem jár le, bejelentkezést nem kér, a további körök ugyanezen a címen jelennek meg.
> A korábbi terv a **privát** `daekon-ship/dr-szedoglavits-reka-latvanyterv` repóban van – valószínűleg ezért nem tudta az ügyvédnő újra megnyitni. Azt a repót nem módosítottuk.

## Koncepció – három irány, egy választás
1. **„Levélpapír” (választott)** – nyugodt, szerkesztőségi rend, krém–bézs alap, bordó csak hangsúlynak, arany csak hajszálvonalnak. Vezérmotívum az ügyvédnő saját SzR-aláírásának íve: a hero alatt kirajzolódik, a bemutatkozás aláírásként zárul vele, a Tudástár borítóin visszatér. Személyes, nőiesen kifinomult, mégis tekintélyt sugároz.
2. „Nappali” – lekerekített, puha bézs panelek, nagyon meleg hangulat. Elvetve: wellness-szalonra emlékeztet, kevés a tekintély.
3. „Bordó éj” – sötét bordó alap, drámai portré. Elvetve: családjogi ügyekben nyomasztó, és túl „luxus”.

## Szerkezet
Fejléc (sticky, görgetésre zsugorodó, üveges krém háttér) · Hero (aszimmetrikus, portré passe-partout keretben) · témasor · Bemutatkozás (levél + 6 érték + „Röviden” adatsor) · Szakterületek (családjogi blokk 2×2 kiemelve + polgári jog oszlop, mind kattintható részletablakkal) · Családjog (6 témás, billentyűzettel is kezelhető fülrendszer) · Konzultáció menete (4 lépés, görgetésre telő vonal) · Tudástár (5 tervezett cikk, vázlat-ablakkal) · Időpontkérés (bordó blokk, hívás/e-mail + demó űrlap) · Kapcsolat (kattintásra betöltődő Google-térkép, útvonaltervezés) · Lábléc · mobil gyors-CTA.

## Tipográfia
- Címsor: **Libre Baskerville** 400 (helyben, `fonts/`, OFL) – 3. kör: a Cormorant, majd a Playfair után a komolyabb, klasszikus ügyvédi hatás miatt; a hero második sora egyenes bordó, nem dőlt. Szöveg: **Manrope** változtatható (helyben).
- Fraunces nincs. Nagy, „display” méret nincs: H1 max. 40 px, H2 max. 30 px, kártyacím 16,5–17 px, törzs 16,5 px.

## Színek (`:root`)
`--bordo #542938` · `--cream #F8F5F0` · `--paper #FCFAF7` · `--beige #E9E0D4` · `--gold #C5A477` (csak vonal/ikon) · `--gold-d #8C6B42` (arany szöveg, kontraszt miatt) · `--ink #242326` · `--muted #6E6569`.

## Térközök, rács
Konténer 1200 px + `clamp(20px,4vw,40px)` oldalsáv; szakasztávolság `clamp(56px,7vw,96px)` (2. kör: kompaktabb); kártyarés 12–14 px.

## Reszponzív
- ≥1080: teljes menü. <1080: hamburger, teljes képernyős menü (Esc, fókuszcsapda).
- <900: a hero újrarendeződik: felirat → cím → aláírás-ív → portré → szöveg → gombok.
- <768: alsó gyors-CTA (Hívás + Konzultáció) – a hero után jelenik meg, az időpontkérő/kapcsolat szakasznál eltűnik, a lábléc alá helyet hagy.
- <720: a családjogi fülek vízszintesen görgethető sávvá válnak.
- Ellenőrizve: 320, 375, 390, 430, 768, 1024, 1440, 1920 px – vízszintes görgetés nincs, konzolhiba nincs.

## Animációk – Motion (motion.dev 11.18.2, helyben: `js/vendor/`), 4. kör: bővített réteg a `js/motion.js`-ben
| Elem | Mit csinál | Indító |
|---|---|---|
| Fejléc-logó | az SzR-aláírás balról jobbra „kiíródik” (clip-path), menüpontok lépcsőzetesen leereszkednek | betöltés |
| Hero cím | betűnként, maszk mögül, elmosásból élesedve | betöltés |
| Hero felirat | a betűköz összehúzódik | betöltés |
| Aláírás-ív, keret | az ív kirajzolódik, a portré kerete középről kinyílik | betöltés |
| Portré | függönyszerű felfedés + lassú zoom, fénycsík végigfut; egérre 3D-ben dől, a fény követi | betöltés / egér |
| Hero háttér | a bézs panel jobbról becsúszik; arany fényfolt követi az egeret | betöltés / egér |
| Hero kifelé görgetés | a szöveg feljebb úszik és halványul, a portré lassabban mozog és kicsit kisebb lesz | görgetés |
| Témasor | görgetésre vízszintesen sodródik | görgetés |
| Gombok | mágneses húzás az egér felé, rugós lenyomás | egér |
| Szakaszcímek | szavanként, maszk mögül, enyhe elfordulásból | inView |
| Szemöldök-feliratok | a betűköz összehúzódik | inView |
| Értékek | jobbról beúsznak, az ikonok kirajzolódnak; egérre az ikon megbillen és újrarajzolódik | inView / egér |
| Aláírás (bemutatkozás, lábléc) | „kiíródik” | inView |
| Szakterület-kártyák | 3D-ben felbillennek, ikonok kirajzolódnak; egérre dőlnek és arany fény követi a kurzort | inView / egér |
| Családjogi fülek | csúszó jelölő (asztali: függőleges sáv, mobil: bordó kapszula), a panel elmosásból érkezik | kattintás |
| Folyamat | a vonal görgetésre telik, a számok rugósan „bepattannak” | görgetés |
| Tudástár | kártyák elfordulásból érkeznek, a borító felülről nyílik, az ív kirajzolódik, egérre dőlnek | inView / egér |
| Időpontkérés | a bordó szakasz lekerekített „ablakból” teljes szélességre nyílik; reflektor követi az egeret; űrlapmezők fókuszra emelkednek; sikeres küldésnél a pipa kirajzolódik | görgetés / egér |
| Kapcsolat | a térkép utcái kirajzolódnak, a tű rugósan leesik | inView |
| Párbeszédablak | rugós, 3D-s nyitás, a sorok beúsznak | kattintás |
| Görgetés-jelző | 2 px arany–bordó sáv felül | görgetés |

Csökkentett mozgásnál (prefers-reduced-motion) és ha a Motion nem tölt be, semmi nem mozog, minden tartalom azonnal látszik. Egérkövető hatások csak asztali gépen futnak, mobilon nem terhelik a telefont.

## Fájlok
`index.html` · `css/site.css` · `js/site.js` · `js/motion.js` · `js/vendor/motion-11.18.2.min.js` (+ licenc) · `fonts/` · `img/`

## Képanyag – forráslista és státusz
| Fájl | Forrás | Státusz |
|---|---|---|
| `img/portre.jpg/.webp`, `portre-420.webp` | A korábbi DAEKON-terv (`dr-szedoglavits-reka-latvanyterv`, privát) `portrait-about.jpg` – az ügyvédnő saját stúdióportréja, eredetileg a nyilvános Facebook-oldaláról | **Jóváhagyásra vár.** Roland döntése alapján szerepel a nyilvános előnézetben; publikálás előtt az ügyvédnő írásos hozzájárulása és a fotós felhasználási engedélye kell. Retusálás nincs, csak méretezés. |
| `img/logo-bordo/light/gold.png` | Ugyanott `logo-mark.png` – az ügyvédnő saját SzR-logója | Jóváhagyásra vár; csak átszínezve (bordó, krém, arany), a forma változatlan. |
| `img/favicon.png` | A logó „Sz” részéből | Jóváhagyásra vár. |
| drszatmari.hu régi portré | https://www.drszatmari.hu/img/dr.Szedoglavits_Reka.jpg | **Nem használtuk** (régebbi, korábbi munkahely oldala; a munkamenetből nem is volt elérhető). |
| Facebook-album / fotók | facebook.com/100089123183306 | A Facebook a munkamenetből nem volt olvasható – irodai és épületfotót nem találtunk. |
Stock-, Unsplash- vagy generált kép nincs az oldalon.

## Ellenőrzött adatok
- Név, cím (5600 Békéscsaba, Kinizsi u. 4–6. II/26.), mobil (+36 70 678 6718), e-mail, „Egyéni ügyvéd”: **Gyulai Ügyvédi Kamara névjegyzéke** (zárva: 2026.10.07.).
- Végzettség (PPKE JÁK), korábbi munka (Békés Megyei Kormányhivatal, járási gyámhivatal, jogi előadó, családjogi ügyek, 2013–2015), szakterületek, „hivatás, nem üzlet” hitvallás: a régi drszatmari.hu bemutatkozás (korábbi munkahely – az oldal ezt nem állítja jelenleginek).
- A „Csaba Office Irodaház” név a briefből származik, nyilvános forrásban nem találtuk – egyeztetendő.

## Ügyféllel egyeztetendő / hiányzó adatok
1. Portré és logó felhasználásának írásos jóváhagyása (fotós neve, engedély).
2. Irodai / épületfotók (ha szeretne) – most nincs.
3. Fogadási rend (most: „előzetesen egyeztetett időpontban”), online konzultáció lehetősége.
4. Szakterület-részletek pontosítása (pl. végrendelet-készítés, mediáció, ellenjegyzés vállalása).
5. A bemutatkozó szöveg első személyű megfogalmazásának jóváhagyása.
6. A Tudástár 5 cikkének szövege – most csak „Tervezett cikk” vázlat, a végleges szöveget az ügyvédnő írja/hagyja jóvá.
7. Impresszum, adatkezelési tájékoztató, süti-kezelés – az éles indulás előtt kell elkészíteni.
8. Az ügyvédi reklámszabályok (MÜK szabályzat) szerinti végső ellenőrzés.
9. Facebook-link a láblécbe (ha kéri).

## Űrlap
Csak látványterv: nem küld és nem tárol adatot. Nem kér ügyrészleteket (név, elérhetőség, téma, időszak). Sikeres kitöltés után visszaigazoló panel + előre kitöltött e-mail-piszkozat (csak név és téma). Éles működéshez háttérrendszer, adatkezelési tájékoztató és ügyféljóváhagyás kell.

## Éles megvalósításhoz
Motion elég, GSAP / Three.js / WebGL / React Bits / HorizonX nem kell és nincs benne. Éles indulás előtt: `robots` → `index, follow`, kanonikus URL, OG-kép, sitemap, Google Business adatok egyeztetése.
