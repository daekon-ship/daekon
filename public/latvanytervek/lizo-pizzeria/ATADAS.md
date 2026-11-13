# Lizó Pizzéria és Ételbár — látványterv, átadás (A + B fázis)

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/lizo-pizzeria/
**Konyhai felület (demo):** https://daekon-ship.github.io/daekon/latvanytervek/lizo-pizzeria/admin.html
**Mappa:** `public/latvanytervek/lizo-pizzeria/` · **Állapot:** 2026.11.13., erőforrás-verzió `?v=14` · `noindex, nofollow`
**Belső anyagok:** `_kutatas/forrasok.md`, `_kutatas/etlap-adatok.md`, `_kutatas/egyeztetesi-lista.md`, `_kutatas/fizetes-saferpay-terv.md`

> **Őszinte állapot:** működő **front-end látványterv**. A kosár, a rendelés és a konyhai felület a böngésző `localStorage`-ében dolgozik: az étteremhez semmi nem jut el, fizetés nincs, és a konyhai felület **nem szinkronizál** más eszközzel (csak ugyanabban a böngészőben látja a próbarendeléseket). Ezt a felület ki is mondja (lábléc, visszaigazolás, admin felső sáv).
> A GitHub Pages cím nyilvános (nem indexelt) – **a nyilvános admin nem védett admin**. Valódi védelem az MHosting-aldomainen lesz (C fázis). API-kulcs, jelszó, kártyaadat a repóban nincs.

## 1. Ami teljesen elkészült (a látványterv keretein belül)

- **Arculat** a Lizó Facebook-megjelenéséből: fekete alap, piros fő gombok, arany részletek, törtfehér szöveg; az ügyfél vektoros logójának piros–arany változata (`img/lizo-logo-brand.svg`). Fotó nincs (nincs ügyfélfotó).
- **Étlap:** 63 tétel, 9 kategória, 32/50 cm-es pizzaárak a lizopizza.hu és a Falatozz alapján (`js/data.js`); egyszerre egy kategória látszik; fülek + „Étlap” panel a fejlécben (a panel csak navigál, nem tesz kosárba – a szövege ezt mondja); ékezetfüggetlen keresés név és összetevő szerint.
- **Termékablak:** méret, üdítőfajta, menü-üdítő, összetevő elvétele (ingyenes), feláras extra feltét (zöldség / hús / sajt), tétel-megjegyzés, mennyiség, élő ár.
- **Kosár:** mennyiség, sor módosítása (visszanyitja a beállítást), törlés, kosár ürítése, azonos konfiguráció összevonása, oldalfrissítés után megmarad.
- **Pénztár fiók nélkül:** kiszállítás / személyes átvétel, név, telefon (magyar formátum), település, cím, megjegyzés, ÁSZF-pipa, hibaüzenet + fókusz a hibás mezőn, dupla beküldés elleni védelem, minimum rendelés kiszállításnál, zárva tartáskor „Előrendelés”.
- **Végösszeg-kommunikáció:** a kiszállítási díj nincs véglegesítve, ezért kiszállításnál sehol nem jelenik meg félrevezető végösszeg: a gomb „részösszeg + díj”, a kosár és a visszaigazolás „a kiszállítási díj még nincs benne” szöveget mutat; átvételnél a fizetendő = részösszeg.
- **Mobil:** 320–430 px-en nincs kilógás, levágás, egymásra csúszás; a bezárás gombok mindig a képernyőn vannak; a hamburger-menü kis kijelzőn görgethető; iOS-re görgetészár a nyitott ablakok alatt; `dvh` egységek a mobil böngészősáv miatt.
- **Akadálymentesség (alapszint):** kontrasztok ≥ 4,5:1, minden vezérlőnek van neve, érintési célok ≥ 24 px (fő gombok 44–56 px), fókuszcsapda és Escape a panelben / termékablakban / kosárban, fókusz visszaadása, `prefers-reduced-motion` tiszteletben tartva.
- **Biztonság (front-end):** minden vevői szöveg escapelve (XSS-teszt: `<img onerror>` a névmezőben nem fut le sem a vevői, sem az admin oldalon), külső linkek `rel=noopener`, nincs titok a kódban.

## 2. Ami még demonstráció

- Rendelés leadása, rendelési állapot, konyhai felület: `localStorage`, csak ugyanabban a böngészőben; nincs szerver, e-mail, SMS.
- Admin: nincs bejelentkezés; a „figyelmet igényel” jelzés (3 percnél régebben elfogadatlan új rendelés), az elfogadás → készül → kész → átadva / elutasítás, termék kikapcsolása és a minimum átírása csak a böngészőben hat.
- Fizetés: csak „Átvételkor fizetek”; online fizetés nincs és nem is szimulálunk sikeres fizetést.
- Facebook-ajánlások: az összesítő („18 ember ajánlja”) a megbízó közlése; a lapozható ajánlássáv kész, de **üres, amíg nincs valódi, Facebookról átvett szöveg** – addig nem jelenik meg.

## 3. Amihez ügyféladat kell (részletesen: `_kutatas/egyeztetesi-lista.md`)

Kiszállítási díj és körzet zónánként · minimum zónánként és átvételnél · extra feltétek végleges listája és ára (most **ideiglenes**: zöldség 400, hús/sajt 800 Ft) · két gyanús 50 cm-es ár (Lizo kerék 8 435, Tenger gyümölcse 7 560) · köretek, menü-üdítők kiszerelése · fizetési módok átvételkor · nyitvatartás (lizopizza.hu vs. Wolt eltér) · előrendelés szabálya · cégadatok, saját ÁSZF/adatkezelés · saját ételfotók · Facebook-ajánlások szövege · hozzájárul-e a láblécbeli DAEKON-hivatkozáshoz.

## 4. Ami a backend-fejlesztés része (C fázis)

PHP 8 + MySQL az MHosting-tárhelyen (előbb felmérni: PHP/MySQL-verzió, cron, limitek, SMTP, SSL), védett tesztaldomain; szerveroldali árkalkuláció a terméktörzsből (a kliens csak azonosítókat küld); rendelési állapotgép és audit-napló; jogosultságkezelt admin (`password_hash`, szerepkörök, CSRF, biztonságos session, rate limit); valódi többeszközös konyhai felület hangjelzéssel; termék/ár/nyitvatartás/zóna/díj/minimum szerkesztése; e-mail-visszaigazolás; mentési és visszaállítási terv. Tesztek: PHPUnit + integrációs + a mostani Playwright-forgatókönyvek a valódi API ellen.

## 5. Ami a Saferpay-integrációhoz szükséges (D fázis) – lásd `_kutatas/fizetes-saferpay-terv.md`

A korábbi Stripe-terv helyett **Novopayment / Saferpay Payment Page**: rendelés szerveroldali rögzítése és árazása → Initialize → átirányítás → NotifyUrl (szerver–szerver, idempotens) → **Assert** → Capture → csak ezután mehet a konyhára, egyszer. A böngésző visszatérési URL-je soha nem jelent sikeres fizetést. Kezelendő: sikertelen / megszakított / duplikált fizetés, kapcsolatvesztés, késve érkező visszaigazolás (cron + Assert), összegeltérés, visszatérítés (Business licenc kérdése), napi egyeztetés, naplózás és riasztás. Kell hozzá: Novopayment-szerződés, licenc, teszt- és éles CustomerId/TerminalId/JSON API hozzáférés; a novopayment.hu/ecom leírást a DAEKON környezetéből nem lehetett megnyitni – át kell nézni. Éles fizetés csak külön tesztelés és a tulajdonos írásos jóváhagyása után.

## Design tokenek

- Színek (`css/lizo.css :root`): `--paper #0e0b0a`, `--card #1a1412`, `--ink #f3e8d4`, `--ink-2 #d8cab3`, `--muted #a8977f`, `--tomato #d3201f` (fő gombok), `--gold #d4a23c` / `--gold-l #e6bd62` (vonalak, keretek, kijelölés), `--err #ff7a6b`.
- Betű: **Young Serif** (címek, terméknevek) + **Bricolage Grotesque** 400/700 (szöveg, árak), OFL, saját hosztolás, latin-ext részhalmaz. Fraunces nincs. Méretek mérsékeltek: H1 28–42 px, H2 24–32 px, szöveg 16 px; minden űrlapmező 16 px (iOS nem nagyít).
- Térköz 8 / 16 / 24 / 40 / 64 / 104 px; gutter 16–40 px; max szélesség 1200 px; kártya 14 px, mező 10 px lekerekítés.
- Komponensek: `.btn`, `.etlapbtn`, `.catpanel`, `.tab`, `.mitem/.mrow`, `.sheet` (asztalon modal, mobilon alsó lap), `.seg`, `.chip` / `.chip--x` (extra) / `.chip--sel`, `.xg` (extra-csoport), `.qty`, `.drawer` (kosár → adatok → visszaigazolás), `.cartbar` (mobil), `.timeline`, `.hcard`, `.rvsum` + `.rv` (ajánlások), `.fbcard`.

## Mozgás (Motion 11.18, `js/vendor/`, MIT; `js/fx.js`)

| Elem | Trigger | Mit csinál |
|---|---|---|
| Hero szövegek, címsor | betöltés | felúszás; a címsor szavanként élesedik (~0,9 s összesen) |
| Szikra-háttér (canvas) | betöltés | lassan felszálló parázs; képernyőn kívül leáll |
| „Az étlapon:” forgó szó | 2,2 s-onként | valódi tételnevek váltakoznak |
| Kategóriaváltás | kattintás | a tételek rövid lépcsőzéssel beúsznak |
| Étlap-panel, termékablak, kosár | kattintás | mobilon alulról felcsúszik, asztalon finom megjelenés |
| Kosárba tétel | kattintás | arany szikra + pötty a kosárhoz, toast |
| Fő gombok / sorok (csak egérrel) | kurzor | mágneses gomb, arany fényfolt a sorokon |
| Görgetésjelző | görgetés | vékony piros–arany csík a fejléc alján |
| Visszaigazolás | leadás | a pecsét megrajzolódik |

`prefers-reduced-motion` mellett mindez kimarad (a tartalom azonnal látszik). Kivett effektek (az ügyfél kérésére vagy mert nem segítették a rendelést): mozgó kategóriaszalag, méret-összehasonlító, rajzolt burgerek, számláló, billenő kártya.

## Tesztek – ténylegesen lefuttatva 2026.11.13., Playwright 1.63 / Chromium, helyi szerveren

Tesztcsomag: 89 ellenőrzés, végső futás **89/89 PASS** (előtte két futás hibákat talált, ezeket javítottuk – lásd lent).
- **Nézetek (14 ellenőrzés):** 320, 360, 375, 390, 430, 768, 1024, 1440, 1920 px – oldal-, panel-, termékablak-, kosár- és pénztár-túlcsordulás 0; fejléc-elemek nem fedik egymást; bezárás gomb görgetés után is látszik; a gombok szövege nem lóg ki; a hamburger-menü elfér; 0 konzol- és 0 hálózati hiba.
- **Kosár/pénztár (25):** 32/50 cm ár; elvétel nem változtat árat; +400 / +800 extra és levétele; mennyiség; dupla kattintás (kosárba és leadás) egyszer; azonos konfiguráció összevonva, eltérő külön sorban; menü-üdítő és üdítőfajta; részösszeg = a terméktörzsből független számítás; sor módosítása (méretcsere) + újraszámolás; +/−, 0 → törlés; oldalfrissítés; hibás telefonszám és hiányzó cím (üzenet + fókusz); kiszállítás ↔ átvétel; nincs félrevezető végösszeg; minimum (1 410 Ft hiány kiírva, átvételnél engedi); kosár ürítése; zárvatartás 03:00-kor (órát a teszt állítja) → „Előrendelés leadása”, előrendelésként rögzítve.
- **Étlap (10):** keresés „fustolt”, „füstölt”, „GOMBA”, „gyros”, „tukortojas”; nincs találat; mind a 9 fül tételszáma; panel navigál, nem tesz kosárba; minden kiírt ár = terméktörzs.
- **Admin (11):** új rendelések; életciklus elfogad → készül → kész → átadva; elutasítás; előzmények; 3 percnél régebbi új rendelés kiemelve + darabszám a böngészőfül címében; termék kikapcsolása (nem nyitható meg); minimum átírása átvezetődik; demo-felirat; tableten (768 px) a gombok ≥ 44 px; XSS nem fut.
- **Akadálymentesség (17):** 8 színpár kontrasztja (pl. halvány szöveg 6,91:1, fehér a piroson 5,26:1); nevek, alt; érintési célok; első Tab = „Ugrás az étlapra”; fókuszcsapda + Escape + fókusz-visszaadás a panelben, termékablakban, kosárban; csökkentett mozgás.
- **Hálózat/teljesítmény (5):** 11 kérés, ~348 KB (legnagyobbak: Motion 68 KB, logó-SVG 57 KB, app.js 39 KB), helyi szerveren DCL ~110 ms, LCP ~100–130 ms, CLS 0–0,03 (futásonként 0,036 alatt). *Helyi szerveres mérés – valódi mobilhálózaton lassabb.*
- **Tartalom/biztonság (7):** tiltott kifejezések (TODO, demo, placeholder, hamarosan, egyeztetendő stb.) 0 találat mindkét oldalon; `noindex` mindkét oldalon; `rel=noopener`; nincs kulcs/jelszó a JS-ben. Külső linkek: lizopizza.hu ÁSZF és Adatvédelem betölt (2026.11.13.); a daekon.hu-t a DAEKON munkakörnyezetből nem lehetett ellenőrizni.

**Nem tesztelve (nem állítjuk, hogy megtörtént):** valódi iOS Safari és Android Chrome készülék (csak Chromium-emuláció), képernyőolvasó, valódi mobilhálózat, Lighthouse-pontszám, hálózatkimaradás (backend nélkül nem értelmezhető – a C/D fázis tesztterve tartalmazza).

## Ismert korlátok

- A `localStorage` adatai eszközönként külön élnek; privát módban üres lehet.
- Az ÁSZF és az Adatkezelés a jelenlegi lizopizza.hu oldalakra mutat (adatkezelő ott: Szekrényes és Gombos DBP Kft.) – az új rendszerhez saját dokumentum kell.
- A `_kutatas/` mappa a nyilvános repó része (személyes vagy titkos adat nincs benne).
- Betűk `woff` formátumban (a `woff2`-tömörítő nem volt elérhető) – élesítéskor `woff2`-re cserélendő (~30% kisebb).

---

# Körök naplója

## 11. kör (2026.11.13.) – teljes javító és tesztelő kör

**Talált hibák és javításuk:**
1. **Cache-hiba:** a `store.js` (benne az extrák árszámítása és a kosársor-kulcs) `?v=5`-tel töltődött, az admin a `data.js`-t is `?v=5`-tel – aki a régi fájlt tárolta, annál az extra feltétek ára kimaradhatott, és eltérő extrájú sorok összevonódhattak. → Minden erőforrás egységesen `?v=14`.
2. **Félrevezető végösszeg:** a pénztár gombja kiszállításnál a részösszeget végösszegként mutatta, a szöveg pedig „a visszaigazolásban jelezzük” ígéretet tett, amit a felület nem teljesít. → „részösszeg + díj”, „még nincs benne”, „Fizetendő” sor.
3. **Ellenőrizetlen állítás:** „Átvételnél nincs minimum.” – ügyfél nem hagyta jóvá. → törölve, egyeztetési pontként maradt.
4. **A kategóriapanel szövege** azt ígérte, hogy a tételek „egy koppintással kerülnek kosárba” – valójában navigál. → pontos szöveg.
5. „Most rendelhető:” zárva tartáskor is ezt mondta. → „Az étlapon:”.
6. **iOS Safari:** a nyitott ablakok alatt görgethető maradt volna az oldal (`overflow:hidden` nem elég). → pozíciórögzítő görgetészár, `dvh` egységek.
7. **Fókusz:** a kategóriapanel nem volt fókuszcsapdában, és Escape után nem adta vissza a fókuszt. → javítva.
8. 320 px-en a hamburger-menü alja lelóghatott volna, a pénztár gombjának szövege levágódott. → görgethető menü, törhető gombfelirat.
9. **Tiltott gomb kontrasztja** (fehér a világosbarnán ~2:1). → sötét tiltott állapot 4,5:1.
10. **Térkép-link érintési célja** 19 px magas volt. → 44 px.
11. **Admin:** „Összesen” felirat a díj nélküli részösszegen; nem látszott, melyik rendelés vár régóta; a demo-felirat nem mondta ki, hogy nem védett és nem szinkronizál. → „Részösszeg + kiszállítási díj”, kiemelés + idő, darabszám a fül címében, pontos felirat.
12. **Holt kód:** kivett szekciók CSS-e (méret-blokk, kategórialista, szalag, tények), JS-függvények (számláló, szalag, billenés), elavult kommentek (`data.js` „extrák nincsenek”, CSS-fejléc a régi papír-arculattal). → eltávolítva.
13. A címsor belépő animációja ~1,5 s-ig elmosódott volt. → ~0,9 s.
14. Kosár ürítése gomb (2+ sornál), DAEKON-hivatkozás a láblécben (diszkréten; ügyféllel egyeztetendő).
15. Saját hiba a javítás közben: a CSS-tisztítás egy regexe két blokkot nyitva hagyott (a panel pozíciója elromlott) – a második tesztfutás megfogta, javítva, a szelektorok listáját a korábbi verzióval összevetettük.

## 10. kör (2026.11.12.)
- **Fejléc:** a „Most nyitva” felirat kikerült a fejlécből (a nyitóképi kártyán és a Kapcsolatnál megmaradt). Helyette piros **„Étlap”** gomb a kosár és a menü mellett.
- **Étlap-panel:** az „Étlap” gomb (és a hero „Online rendelés – étlap” gombja, valamint a mobil menü) egy panelt nyit mind a 9 kategóriával: rajzolt ikon, tételszám, „-tól” ár. Mobilon alulról felcsúszik, asztalon középen. Kategóriára koppintva az étlap arra a kategóriára ugrik.
- **Facebook-ajánlások:** összesítő sáv – „18 ember ajánlja a Lizót a Facebookon” (a megbízó közlése) – és lapozható ajánlás-sáv (húzással, nyilakkal, pöttyökkel, billentyűzettel). A sáv csak akkor jelenik meg, ha a `js/data.js` → `facebook.reviews` tömbben van valódi, Facebookról átvett ajánlás; addig csak az összesítő és a Facebook-kártya látszik.

## 9. kör (2026.11.12.)
- Kikerült a mozgó kategóriaszalag és a „Melyik méret?” blokk (32/50 cm kör-rajz, cm²- és Ft/cm²-számítás), valamint a termékablakból a „2,4-szer akkora” megjegyzés és a menüpont. A méretválasztás a termékablakban marad.

## 8. kör (2026.11.12.) – audit és finomítás
Teljes vizuális bejárás 320–1920 px-en, kosár → adatok → visszaigazolás mobilon és asztalon. Javítva:
- Lábléc-logó (és minden kép) magassága: a `height` attribútum miatt mobilon ~300 px üres sáv volt → `img{height:auto}`.
- Asztali hero jobb oldala üres volt → arany keretes „mai rendelés” kártya (állapot, ma, kiszállítás, minimum, hová, átvétel, hívás); mobilon a gombok alatt.
- Termékablak: a bezárás gomb görgetéskor rácsúszott a tartalomra → külön fejléc a címmel és a bezárással.
- „Melyik méret?” választó szövege alig látszott; címke-szín egységesítve aranyra.
- Kapcsolat: Cím/Telefon sorok egy rácsban; „Rendelésfelvétel” cím egy szintben a „Kapcsolat”-tal; nyitvatartás-táblázat széle igazítva.
- „2–10.” házszám nem törik el sor végén.
- Kiválasztott méret, átvételi mód, fizetés, pipa: egységes arany kijelölés.
- Visszaigazolás: az extra feltétek és az elvett összetevők a tételsor alatt is látszanak.
Tesztek: folyamat 15/15 OK, nézetek 8/8 túlcsordulás nélkül, 0 konzolhiba, tiltott-szó szűrés 0 találat.

## 7. kör (2026.11.12.) – feláras extra feltétek
- Pizzáknál, hamburgereknél, smash burgereknél és gyrosnál a termékablakban „Extra feltét” rész: Zöldség / Hús / Sajt csoport, lenyitható, koppintásra ki-be kapcsolható.
- **Ideiglenes árak** (a megbízó szerint, az ügyfél pontosítja): zöldség **400 Ft**, hús **800 Ft**, sajt **800 Ft** feltétenként, mindkét pizzaméretnél ugyanannyi.
- A lista az étlapon szereplő összetevőkből áll (pl. gomba, kukorica, jalapeño … / sonka, bacon, gyros hús, tonhal … / mozzarella, feta, cheddar, extra Ammerlander sajt …). Egy helyen szerkeszthető: `js/data.js` → `extraGroups`.
- Az ár élőben frissül, a kosárban, a visszaigazoláson és a konyhai kártyán „+ extra: …” sorként látszik; az árat továbbra is a terméktörzsből számolja (C fázisban szerveroldalon).
- Teszt: Hawaii 50 cm + gomba + bacon = 7 920 Ft ✔; Sonkás 32 cm + gomba + kukorica = 5 200 Ft ✔; Hústorony + feta a konyhán „+ extra: feta (+800 Ft)”, 5 750 Ft ✔.

## 6. kör (2026.11.12.) – látványelemek + Facebook
Ihlet: motion.dev, React Bits (Count Up, Rotating Text, Click Spark, Magnet, Logo Loop, Light Rays, spotlight kártya), sitereel.ai – saját megvalósítás `js/fx.js`-ben, külső komponens nincs.
| Effekt | Hol | Trigger |
|---|---|---|
| Parázs-szikrák (canvas, a Facebook-logó kemencéjének lángja) | hero háttér | betöltés; képernyőn kívül megáll |
| Szavanként élesedő címsor (blur → éles) | hero H1 | betöltés |
| Forgó szó: „Most rendelhető: …” (valódi tételek) | hero | 2,2 mp-enként |
| Végtelen kategóriaszalag | hero alatt | folyamatos, hoverre megáll |
| Count Up | méret-blokk cm² számai | görgetés |
| Arany szikra-kitörés | „+”, Kosárba, fő gomb | kattintás |
| Mágneses gombok | hero gombok | egér (érintésen nincs) |
| Kurzorkövető arany fényfolt | étlapsorok, kártyák | egér |
| Billenő méret-kártya | méret-blokk | egér |
| Görgetésjelző piros→arany csík | fejléc alja | görgetés |
Minden kikapcsol `prefers-reduced-motion` mellett.
- **Facebook-link** (az ügyfél által küldött: facebook.com/share/1F5R1QhTbu): fejléc (asztal), mobil menü, Vélemények szekció kártyája, Kapcsolat gomb, lábléc.
- Vélemények szekció most mindig látszik: Facebook-kártya a profilhoz. Konkrét véleményszöveg csak a Facebookról átvett valódi ajánlásból kerülhet be (`js/data.js` → `facebook.reviews`) – ehhez képernyőkép kell.

## 5. kör (2026.11.12.)
- A nyitóképről kikerült a logó (mobilon fél képernyőt elvitt); a logó csak a fejlécben van.
- Az étlap egyszerre egy kategóriát mutat (Pizza alapból); a fülekkel vagy a menüből lehet váltani. Keresésnél minden kategóriában keres. A mobil oldal ~40%-kal rövidebb.
- A hamburger-menüben ott van mind a 9 ételkategória.
- A „Mit ennél ma?” kategórialista kikerült (ugyanazt tudják a fülek és a menü).
- CSS/JS fájlok verziózva (`?v=5`), hogy a telefon ne a régit mutassa.

## 3–4. kör (2026.11.12.)
- Mobil menügomb (hamburger) a fejlécben; kosárikon mobilon is mindig látszik; a nyitóképen „Online rendelés – étlap” + „Kosár” (a telefonos gomb kikerült).
- **Színek a Lizó Facebook-arculatából** (az ügyfél képernyőképe alapján): fekete alap #0e0b0a, piros #d3201f (fő gombok, aktív fül, kosársáv), arany #d4a23c (vonalak, keretek, címkék), krém szöveg #f3e8d4. A vektoros logó piros feliratú, arany babéros változata: `img/lizo-logo-brand.svg` (ugyanaz a rajz, csak átszínezve). Asztalon a hero mellett mérsékelt méretben, mobilon csak a fejlécben.
- Facebook-ajánlások blokk elkészült, de üres → nem látszik; valódi ajánlásokra vár (`js/data.js` → `facebook.reviews`).

## 2. kör (2026.11.12.) – az ügyfél kérésére
- A nyitóképről kikerült a nagy logós, méretköröket mutató rajz (fél képernyőt elvitt); a hero kompakt, szöveg + gombok + tények.
- A burgerek rajzolt réteg-ábrái kikerültek, a burgerek is étlapsorként jelennek meg.
- A kategóriafülek nem lógnak ki: mind látszik, tördelve (mobilon nem ragadnak a fejléc alá, hogy ne foglaljanak sok helyet).
- A kiemelőszínek (paradicsompiros, zöld, kéregbarna, alap-színpöttyök) kikerültek; semleges fekete-törtfehér, amíg a Lizó Facebook-színei meg nem érkeznek. A szín egy helyen (`--tomato` token a `lizo.css` elején) cserélhető. Hibaüzenetek pirosak maradtak (`--err`).
- Következő: Facebook-színek és Facebook-ajánlások blokk – képernyőképre vár (a Facebook a gépi lekérést tiltja).

