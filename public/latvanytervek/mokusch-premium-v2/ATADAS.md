# Mókusch – prémium látványterv v2 · átadás

Élő előnézet: https://daekon-ship.github.io/daekon/latvanytervek/mokusch-premium-v2/
Előző változat (érintetlen, összehasonlításhoz): https://daekon-ship.github.io/mokusch/

## Betű-javítás (2026. október 27., délután)

Az Amatic SC több helyen alig volt olvasható, ezért kikerült. Címek: **Playfair Display** (dőlt kiemelésekkel); gombok, menü, címkék és szöveg: **Manrope**; **Dancing Script** csak nagy, rövid díszként marad (logó, fejezetszámok, alcímek, futó szalag). A nyitóidézet, az ajánló sorok és a folyamat-lépések Playfair dőltre váltottak.

## Motion-réteg (js/motion-fx.js)

Minden alábbi effekt a Motion (motion.dev) könyvtárral fut. Két mód van: **teljes**, és – ha az eszköz csökkentett mozgást kér – **visszafogott** (áttűnések, feltárások, ikonmozgás marad; parallax, hulló levelek, futó szalag, görgetéshez kötött mozgás kimarad). A lábléc „Animációk” kapcsolójával a látogató bármikor átválthat (teljes / ki); érintőképernyőn a kurzoros effektek kimaradnak.

| Effekt | Kiváltó | Mit csinál |
|---|---|---|
| Görgetésjelző | görgetés | bordó–púder csík a lap tetején |
| Nyitócím | betöltés | szavanként, elmosódásból élesedve emelkedik be |
| Fejezetcímek | láthatóvá válás | szavanként, enyhe billenéssel bukkannak elő |
| Kézírásos számok | láthatóvá válás | balról „berajzolódnak” |
| Nyitókép | betöltés + egér | jobbról kinyíló függöny, egérkövető parallax, lassú nagyítás |
| Hulló levelek | folyamatos | 6–11 levél/szirom lassan hullik a nyitóképen |
| Pecsét | betöltés + görgetés | rugóval beforog, egérrel együtt mozdul, görgetésre forog |
| Könyvlap-képek | láthatóvá válás + görgetés | oldalról kinyíló feltárás, közben kicsinyedő kép; görgetésre lassú nagyítás |
| Betétképek | láthatóvá válás + görgetés | rugóval, billenve érkeznek, görgetésre lebegnek |
| Szövegoszlop | görgetés | finom ellenirányú parallax (desktop) |
| Gombok, címkék, portrék | láthatóvá válás | rugós, lépcsőzetes beugrás |
| Futó szalag | görgetés | a görgetés sebességére gyorsul, irányt vált, megdől |
| Torta-finálé | görgetés | háttér lassú zoom, lépések sorban beúsznak |
| Tortarendelés gombok | rámutatás / kattintás | szív- és virágkonfetti robban ki |
| Mókus-ikon | folyamatos + rámutatás | a farok lengedez, rámutatáskor nagyot csóvál; a logó rugóval beugrik |
| Tortaikon | folyamatos | lobogó gyertyaláng |
| Kurzor | egér | rugós kör, képek fölött „mese” felirattal megnő |
| Mágneses gombok | egér | a gomb a kurzor felé húzódik |
| 3D döntés | egér | képek, kártyák, cetlik a kurzor felé dőlnek |
| Aloldali rácsok | láthatóvá válás | kártyák rugós, lépcsőzetes megjelenése |
| Varázsló | kattintás | kiválasztott opció „kattan”, a folyamatjelző pulzál |

## 3. kör (2026. október 27.) – közelebb a Wixhez, látványosabban, kevesebb szöveggel

- **Wanda betűi:** Amatic SC a címekben és a pirulagombokban, Dancing Script a kézírásos alcímekben és a logó feliratában (a Wix-oldal betűi, saját tárhelyről).
- **Wix-színek és felhők:** púder fejléc felhős alsó szegéllyel, olíva nyitó, púder lábléc felhőkkel; felhőszegélyek a szakaszok között.
- **Filmszerű elrendezés:** minden fejezet félig kifutó, teljes magasságú kép + rövid szöveg (könyvlap), váltakozó oldalon; nyitókép lassú „Ken Burns” nagyítással; képek alulról kinyíló feltárása; futó kézírásos szalag.
- **Kevesebb szöveg:** fejezetenként egy mondat; a magyarázó jegyzetek a főoldalról kikerültek (ez az átadás tartalmazza őket).
- A tortarendelés helyei megmaradtak (fejléc, menü, torta-szalag, finálé, lábléc, aloldalak, mobil lebegő gomb).

## 2. kör (2026. október 27.) – mi változott

- **Új logó** (mókus makkal + mesekönyv-betűs felirat): fekvő, álló, sötét, pecsét, jel, ikon – `img/logo/`, bemutató oldal: `arculat/`. Generátor: `prototypes/mokusch-premium-v2/logo.py` (a feliratok görbékké alakítva).
- **Prémiumabb rendszer:** Playfair Display címbetű (egy rövid Cormorant-próba után visszaállítva), paszpartus képlapok sárgaréz hajszálvonallal, minden döntés (ferde kép, ferde cetli, egymásra csúszó tortaképek) megszüntetve – rácsra igazítva.
- **Tortarendelés több helyen:** fejléc gomb (tortaikonnal), nyitó kártya, tartalomjegyzék kiemelt 9. sora, Finomságok-link, bordó torta-szalag az 5. fejezet után, 9. fejezet (3 lépéses folyamat + gombok), lábléc-felhívás, menü, minden aloldal alján torta-sáv, mobilon lebegő gomb (a hero után jelenik meg, a torta-blokkoknál és a láblécnél eltűnik, nem takar).
- Felső sáv: „Most nyitva / zárva” a Wix-nyitvatartás alapján.

Generátor: `prototypes/mokusch-premium-v2/build.py` (a repó gyökeréből: `python3 prototypes/mokusch-premium-v2/build.py`).
A HTML-oldalakat ez írja; a CSS (`css/site.css`) és a JS (`js/site.js`) közvetlenül szerkeszthető.

## 1. A két forrás összevetése

| | Wix (Wanda) | DAEKON v1 | v2 – amit átvettünk |
|---|---|---|---|
| Szerkezet | 9 számozott nagy szekció, mindegyikben 1–4 gomb aloldalra | 8 témaszekció saját logika szerint | **Wanda 9 fejezete, eredeti sorrendben és címekkel** |
| Navigáció | finomságok · tortarendelés–esküvő · asztalfoglalás · könyvek · hol vagyunk? | horgonyos menü + Tortát rendelek | Wix menüpontjai + kiemelt Tortarendelés gomb + „Fejezetek” tartalomjegyzék |
| Aloldalak | 11 létező URL, mind Wix-sablonszöveg (még üres) | nincs | **19 aloldal**, mind kidolgozott elrendezéssel |
| Képek | festett, illusztrációs hatású képek (Wanda válogatása) | stock fotók (a README szerint is helyettesítők) | Wix-képek illusztrációként, jelölve; stock nincs |
| Színek | olíva #817E56, púderrózsa #C3AA9B, krém #F3E5DA, barna #6A482D | papír, erdőzöld, bordó | Wix-színek finomítva + bordó/erdőzöld a briefből |
| Betűk | Dancing Script + Amatic SC | Playfair Display + Manrope | Playfair Display (dőlt kiemelésekkel) + Manrope |
| Logó | szöveges felirat | szöveges felirat | **új mókusos logó** (arculat/) |
| Tortarendelés | csak gomb | 8 lépéses varázsló | továbbfejlesztett 8 lépéses varázsló + esküvői ajánlatkérő |
| Hangulat | felhős fejlécperem, mesekönyv | prémium szerkesztőségi | mesekönyv-lapok: albumsarkos képek, fodros perem, tartalomjegyzék |

A v1 olyan állításait (pl. saját gyűjtés, 4,7-es Google-értékelés, szezonális naptár) **nem vettük át**, mert nem ellenőrzöttek.

## 2. Három irány – és a választás

1. **Mesekönyv-lapok (választott).** Minden téma egy fejezet, a képek albumsarkos, enyhén döntött lapokon, illusztráció-felirattal. Wanda számozott szerkezete változatlanul felismerhető, a DAEKON-tipográfia emeli prémiummá.
2. **Erdei herbárium.** Préselt növényes címkék, katalóguskártyák. Szép, de hűvösebb, és a kártyák sokasága sablonos hatást kelt.
3. **Esti kirakat.** Sötét, lámpafényes oldal, üvegen át látott pult. Erős, de eltávolodik a Wix világos, olívás-púderes színeitől – Wanda nehezebben ismerné fel.

## 3. Elkészült oldalak

Főoldal – 9 fejezet + tartalomjegyzék:
1. Hagyd magad mögött a várost → A Mókusch meséje · Álmok, vágyak, tervek · Mesebeli programok
2. Akik életre keltik minden nap → Válogatott társaság
3. Mit művelünk mi itt? → Képek · Sztorik
4. Finomságok → Enni · Inni
5. Ez a mi kis boszorkánykonyhánk → Néhány ártatlan recept · Tippek-trükkök
6. A híres nyuszis polc → …és ezt is mind ti csináltátok?
7. Varázslatos akármicsodák → Könyvek · Csodás csecsebecsék
8. Palackposta (+ Hol vagyunk?) → Üzenek! · Asztalfoglalás · Üzenetek · Mókásságok
9. Torták és romantika → Tortarendelés · Esküvő

Minden aloldalon: vissza-link a saját főoldali fejezethez, előző/következő lap.

## 4. Működő vs. szimulált

| Funkció | Állapot |
|---|---|
| Navigáció, fejezetmenü (billentyűzettel, Esc, fókuszcsapda) | működik |
| Telefon, e-mail, térkép, Facebook, Instagram linkek | működik (valódi) |
| Képek szűrése (Képek aloldal) | működik |
| Tortarendelő: lépések, visszalépés, ellenőrzés, összegzés, javítás | működik |
| Tortarendelő: adatmegőrzés lépések között és frissítéskor | működik (böngésző munkamenet, sessionStorage) |
| Referenciakép-előnézet | csak a böngészőben, **nincs feltöltés** |
| Tortarendelés / esküvői ajánlatkérés / asztalfoglalás / üzenet elküldése | **szimulált** – semmi nem megy el, ezt a felület is kiírja |
| Asztalfoglalás időpontjai | a Wix-nyitvatartásból számolva, **egyeztetendő** |
| Dátum-korlát a tortánál | csak múltbeli dátum tiltva; minimális előrendelési idő **egyeztetendő** |
| Webshop | **nincs** – a terv nem feltételez vásárlást |

Külön fejlesztési lépés: e-mail-küldés, adatmentés/admin, képfeltöltés tárhellyel, GDPR-szöveg, esetleges fizetés, programok/sztorik/receptek szerkesztőfelülete.

## 5. Képek – csere- és eredetlista

**Stock/AI fotó nincs a tervben.** A v1 összes képe stock helyettesítő volt – egyik sem került át.

A Wix-oldal képei (Wanda saját válogatása) festett, illusztrációs hatásúak; a tervben **illusztrációként jelölve** szerepelnek, sosem valódi termék- vagy üzletfotóként. Jelenleg a Wix tárhelyéről töltődnek (static.wixstatic.com) – élesítés előtt saját tárhelyre kell tenni.

| Kulcs | Hol | Megjegyzés |
|---|---|---|
| osveny | 1. fejezet, nyitó | illusztráció |
| udvar | 2. fejezet | illusztráció |
| bolt | 3. fejezet, mozaik | illusztráció |
| pult1, pult2 | 4. fejezet | illusztráció |
| konyha | 5. fejezet | illusztráció |
| polc1, polc2 | 6. fejezet | illusztráció |
| olvaso | 7. fejezet | illusztráció |
| posta | 8. fejezet | **eredete bizonytalan** (fotószerű, szűrővel) – Wandával egyeztetendő, valódi fotó-e |
| kepfal | 9. fejezet | illusztráció |

Kérdés Wandának: ezek AI-val készült képek? Ha igen, illusztrációként maradhatnak, de valódi fotókkal fokozatosan cserélhetők.

**Valódi fotóra váró helyek** (kódok a felületen is látszanak):
- K-01…K-06: kávéfőzés, sütés, tortadíszítés, kézművesség, kész torta, terem
- P-01…P-03: a három alapító portréja (+ csapattagok, hozzájárulással)
- T-01, T-02: kiemelt torta, esküvői torta (9. fejezet)
- E-01…E-06: esküvői torták
- N-01…N-06: nyuszis polc darabjai · C-01…C-03: csecsebecsék · B-01…B-03: könyvborítók
- S-01…S-03: sztorik · R-01: recept

## 6. Hiányzó ügyféladatok

- A másik két alapító neve és szerepe; Wanda szerepe pontosan
- A Mókusch meséje, álmok/vágyak/tervek szövege
- Étlap és itallap (tételek, leírások, allergének, árak)
- Tortakínálat: méretek/szeletszámok, ízek, díszítési stílusok, minimális előrendelési idő, átvételi módok, szállítás
- Esküvői referenciák fotói és hozzájárulás a közléshez
- Programok, receptek, tippek, sztorik, könyvlista, polc-darabok
- Asztalfoglalás: online kérik-e, foglalható sávok, max. létszám
- TikTok-cím (a Wix láblécében szerepel, URL nélkül)
- Nyitvatartás, telefon, e-mail élesítés előtti megerősítése
- Kell-e webshop a könyvekhez/csecsebecsékhez

## 7. Rendszer

**Színek:** paper #F6EFE4 · paper-2 #ECE1D2 · rose #C9AFA0 · rose-soft #E6D6CB · moss #64613F (Wix-olíva sötétítve, kontraszt 5,5:1 krém szöveggel) · forest #263A2D · berry #793F49 · bark #4A3527 · ink #2E241C.

**Betűk:** Playfair Display 400–900 + dőlt (címek), Manrope 200–800 (szöveg, gombok), Dancing Script 400–700 (csak logó, fejezetszám, alcím), saját tárhely. Skála: h1 max 3,1rem, h2 max 2,5rem, h3 max 1,38rem.

**Térköz:** 0,5 · 0,75 · 1 · 1,5 · 2 · 3 · 4,5 · 6,5 rem; fejezetek 4–7,5rem függőleges ritmus.

**Komponensek:** `.plate` (paszpartus képlap), `.slot` (fotóhely kóddal), `.kicker` (fejezetszám), `.note` (ügyfélnek szóló margójegyzet), `.tag--minta`, `.pin` (kitűzött cetli), `.recipe-card`, `.bookshelf`, `.cakes`, varázsló (`.steps`, `.panel`, `.summary`), `.choice`, `.drop`.

**Reszponzív:** mobil-first; 760 / 880 / 980 / 1080 px töréspontok; mobilon a Tortarendelés gomb a fejlécben marad (rövid felirattal), a teljes menü egy tartalomjegyzékes lap.

## 8. Animációk (Motion 11.18.2, saját tárhely)

| Mi | Kiváltó | Viselkedés | Reduced-motion |
|---|---|---|---|
| Nyitócím | betöltés | két sor egymás után emelkedik be (1,1 s) | azonnal látszik |
| Rajzolt páfrányok | láthatóvá válás | vonalak kirajzolódnak, utána CSS-sel lassan ringanak | statikus |
| Szekcióelemek | görgetés (inView) | 18 px emelkedés + áttűnés, kis lépcsőzéssel | azonnal látszik |
| Képparallax | görgetés | a kép ±4%-ot mozdul a kereten belül | nincs |
| Hover | egér | kép 3,5%-os lassú nagyítás, gomb nyíl elmozdul | CSS marad, mozgás minimális |
| Tortakompozíció | láthatóvá válás | a középső lap emelkedik ki, a két szélső oldalról csúszik be | statikus |
| Pecsét a nyitóképen | görgetés | lassan 120°-ot fordul | statikus |
| Lebegő tortagomb (mobil) | görgetés | alulról becsúszik / eltűnik | azonnali |
| Varázsló | lépésváltás | oldalirányú áttűnés | azonnali váltás |
| Fejezetmenü | kattintás | panel becsúszik, tételek lépcsőzve | azonnali |

GSAP, Three.js/WebGL, React Bits, HorizonX **nincs** a tervben, és nem is szükséges hozzá.

## 9. Minőségellenőrzés

Playwright, 360 / 390 / 768 / 1024 / 1440 / 1920 px: vízszintes túlcsordulás nincs egyik oldalon sem, konzolhiba nincs; a tortarendelő végigkattintva (hibaüzenetek, frissítés utáni visszatöltés, összegzés, szimulált küldés) és az asztalfoglalás időpontjai tesztelve.
