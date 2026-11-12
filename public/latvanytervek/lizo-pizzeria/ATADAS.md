# Lizó Pizzéria és Ételbár — látványterv, átadás (A + B fázis)

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/lizo-pizzeria/
**Konyhai felület:** https://daekon-ship.github.io/daekon/latvanytervek/lizo-pizzeria/admin.html
**Mappa:** `public/latvanytervek/lizo-pizzeria/` · **Kör:** 2. kör, 2026.11.12. · `noindex, nofollow`
**Belső kutatás:** `_kutatas/forrasok.md`, `_kutatas/etlap-adatok.md`, `_kutatas/egyeztetesi-lista.md`

> Őszinte állapot: ez működő **front-end látványterv**. A kosár, a rendelés és a konyhai felület a böngésző `localStorage`-ében dolgozik, az étteremhez semmi nem jut el, fizetés nincs. Ezt a felület két helyen ki is mondja (lábléc, visszaigazolás; admin felső sáv). Backend, adatbázis, bejelentkezés, e-mail és Stripe: C–D fázis.
> A „védett tesztcím” még nincs: a GitHub Pages cím nyilvános, de nem indexelt. Valódi jelszavas védelem az MHosting-aldomainen lesz (C fázis).

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

## Mit tud most

**Vásárlói oldal (`index.html`)**
- Hero az eredeti, vektoros Lizó-logóval; körülötte a 32 és az 50 cm-es pizza méretarányos körvonala (rajz, nem fotó).
- Élő nyitvatartás-állapot a fejlécben (Most nyitva · 21:40-ig / Zárva · holnap 11:00-tól), mai rendelésfelvétel, 60–90 perc, minimum.
- 9 kategória kártyán, sticky kategóriafülek mozgó jelölővel + scroll-követés, ékezetfüggetlen keresés név és összetevő szerint.
- Teljes, ellenőrzött étlap: 29 pizza (32/50 cm), édes pizza, 4 hamburger, 2 smash, 5 gyros, 10 menü, 4 palacsinta, 2 desszert, 6 üdítő.
- Pizzaalap színkódolva (paradicsomos / tejfölös / BBQ / tzatziki), csípős jelölés rajzolt ikonnal.
- Burgerek: az összetevőlistából generált, rajzolt réteg-ábra (a képhelyettesítő doboz helyett). A termékablakban elvett összetevő a rajzról is eltűnik.
- „Melyik méret?” blokk: bármely pizzára kiszámolja a különbséget és a Ft/100 cm² árat; egy gombbal 50 cm-ben nyitja meg.
- Termékablak: méret, fajta (üdítők), menü-üdítő, összetevők elvétele (ingyenes, felárat nem számol), tétel-megjegyzés, mennyiség, élő ár.
- Kosár: mennyiség, módosítás (visszanyitja a beállított tételt), törlés, azonos konfiguráció összevonása, perzisztens.
- Pénztár, fiók nélkül: kiszállítás/átvétel, név, telefon (magyar formátum-ellenőrzés), település (XVIII. / Gyál / Vecsés), cím, megjegyzés, átvételkori fizetés, ÁSZF-pipa. Minimum rendelés kiszállításnál blokkol és kiírja a hiányzó összeget.
- Visszaigazolás rendelésszámmal, tételes összesítővel és élő állapotsávval (Beérkezett → Elfogadva → Készül → Úton/Átvehető → Kiszállítva/Átvéve; elutasításnál telefonszám).
- Zárva tartás alatt „Előrendelés”-ként rögzít (szabály egyeztetendő, lásd lista 14.).
- SEO: title, description, OG, `Restaurant` strukturált adat (név, cím, telefon, nyitvatartás – csak ellenőrzött adat). `noindex` a látványterv miatt.

**Konyhai felület (`admin.html`, tabletre)**
- Rendelés-tábla 4 oszlopban: Új → Elfogadva → Készül → Kész/úton → Átadva; Elutasít gomb. A vevő visszaigazolása szinkronban frissül (storage esemény).
- Termékek: elérhető/elfogyott kapcsoló – a vásárlói oldalon azonnal „Most nem rendelhető”, kosárból kikerül.
- Beállítások: minimum rendelés szerkeszthető (a vásárlói oldal azonnal átveszi), nyitvatartás és területek megjelenítve.
- Előzmények: teljesített/elutasított rendelések táblázata.

## Kreatív irányok (A fázis)

1. **„Nyomott étlap”** – ✅ VÁLASZTOTT. Törtfehér papír (#f3ecdf), barnás-fekete tinta (#1a1512), paradicsompiros kiemelés (#a8341d), bazsalikomzöld (#3e5739) csak állapotjelzésre, kéregbarna (#c58546) a rajzokon. A logó metszetszerű vonalvilágából építkezik: vékony és pontozott körök, hajszálvonalas étlap-sorok, rajzolt burger-rétegek. Miért: a logó fekete-fehér, klasszikus; ehhez a papír-tinta ad természetes, meleg keretet, és fotók nélkül is véglegesnek hat.
2. „Esti ételbár” – sötét faszén alap, meleg borostyán fények, nagy kontrasztú fehér logó. Elvetve: fotók nélkül nehéz, könnyen arany-fekete luxussablonba csúszik (a brief kifejezetten kerülni kéri).
3. „Kerületi street food” – erős színblokkok, matricás címkék. Elvetve: ütközik a logó klasszikus, babérkoszorús karakterével.

## Design tokenek

- Betű: **Young Serif** (címek, terméknevek; OFL) + **Bricolage Grotesque** 400/700 (szöveg, árak; OFL). Saját hosztolás, `fonts/`, latin + latin-ext részhalmaz (ő, ű). Fraunces nincs.
- Méretek (mérsékelt): H1 28–42 px, H2 24–32 px, terméknév 18 px, szöveg 16 px, árak tabular számokkal.
- Térköz-skála: 8 / 16 / 24 / 40 / 64 / 104 px; oldalgutter 16–40 px; max szélesség 1200 px.
- Lekerekítés: 14 px kártya, 10 px mező, gombok pirula alakúak; érintési cél ≥ 40–48 px.
- Komponensek: `.btn` (ink / line / tomato), `.mitem` étlapsor, `.bcard` burgerkártya + `.stack`, `.seg` szegmentált választó, `.chip` összetevő-kapcsoló, `.qty`, `.sheet` (asztali modal / mobil alsó lap), `.drawer` (asztali oldalpanel / mobil alsó lap), `.cartbar` (csak mobil, csak nem üres kosárnál, a tartalmat `padding-bottom` védi), `.timeline`.

## Mozgás (Motion 11.18, `js/vendor/`, MIT)

| Elem | Trigger | Mit csinál | Átadás |
|---|---|---|---|
| Hero szövegek | betöltés | 14 px-es felúszás, 80 ms-os lépcső | – |
| Hero logó + körök | betöltés | logó 0,94→1 skála; a 32 és 50 cm-es kör megrajzolódik (stroke-dashoffset), a pontozott kör 8°-ot fordul a helyére, majd a feliratok | a rajz a méret-blokk koraira utal |
| Kategóriák, kártyák, kapcsolat | görgetés (inView) | 18 px-es felúszás, gyerekelemek lépcsőzve | – |
| Étlap-szekciók | görgetés | az első 14 sor 30 ms-onként úszik be | – |
| Méret-blokk | görgetés / választás | a két kör megrajzolódik; pizzaváltáskor az árak felúsznak | „50 cm-ben” gomb → termékablak |
| Kategória-fül | kattintás / görgetés | a sötét pirula rugós mozgással a fülre csúszik | a lap a szekcióhoz görget |
| Termékablak | kattintás | asztalon finom skála+fade, mobilon alulról felcsúszik | „Kosárba” → bezár |
| Kosárba tétel | kattintás | piros pötty ívben a kosárhoz repül, a kosár ikon „ugrik”, toast | – |
| Kosár/pénztár | kattintás | panel oldalról (asztal) / alulról (mobil); lépésváltáskor 12 px-es oldalirányú beúszás | – |
| Visszaigazolás | leadás | a pecsét köre és pipája megrajzolódik | – |

`prefers-reduced-motion: reduce` mellett minden Motion-animáció kimarad, a CSS-átmenetek 0,01 ms-ra rövidülnek. Nincs parallax, nincs folyamatos mozgás, nincs scrolljacking.

## Képek

Fotó **nincs** (az ügyféltől nem jött, a weben talált Falatozz-képek eredete ismeretlen). Helyette: eredeti logó, rajzolt méret-körök, generált burger-rétegek, rajzolt ikonok. Ha jönnek saját ételfotók: a hero jobb oldala (`.hero__art`) és a burgerkártyák `.stack` eleme cserélhető képre, a pizzasorokhoz bal oldali bélyegkép adható.

## Tesztek (ténylegesen lefuttatva, 2026.11.12., Playwright/Chromium)

Automata folyamat-teszt (mobil 390 px, érintés): **14/14 OK**
- Hawaii 50 cm × 2, ananász nélkül = 13 440 Ft ✔ · dupla kattintás a „Kosárba” gombon egyszer ad hozzá ✔
- Kosár összeg 13 440 + 5 000 + 5 200 = 23 640 Ft ✔ · mennyiség csökkentése után 16 920 Ft ✔
- Keresés („csirkecomb” → 10 találat; értelmetlen kifejezés → üres állapot szöveg) ✔
- Üres űrlap leadása blokkolva, hibaüzenet + fókusz ✔ · rendelés tárolva, részösszeg 16 920 ✔
- Admin: Elfogad → Készítés indul; a vevő visszaigazolásán „Készül” jelenik meg ✔ · termék kikapcsolása a vásárlói oldalon látszik ✔
- 0 konzolhiba ✔ · tiltott-szó ellenőrzés a látható szövegen és attribútumokon (TODO, Demo, Placeholder, Lorem, hamarosan, egyeztetendő, generált stb.) mindkét oldalon: 0 találat ✔

Nézetek (vízszintes túlcsordulás oldalon, termékablakban, pénztárban, adminban): 320, 375, 390, 430, 768, 1024, 1280, 1920 px – mind 0 px ✔ (320 px-en a termékablak lábléce 6 px-szel kilógott → javítva, újramérve 0).
Billentyűzet: Tab-sorrend (Ugrás az étlapra → logó → menü…), Enter megnyitja a termékablakot, fókusz a Bezárás gombra kerül, Escape bezár és visszaadja a fókuszt a sorra ✔.
Csökkentett mozgás: hibamentes, a tartalom azonnal látható ✔.

**Nem tesztelve:** valódi iOS Safari és Android Chrome készüléken (csak Chromium mobil-emulációval), képernyőolvasóval, valamint hálózatkimaradás – ez utóbbi a backend nélkül értelmetlen, a C/D fázis tesztterve tartalmazza.

## Ismert korlátok / döntések

- Szállítási díj nincs a felületen kiszámolva (nincs ellenőrzött adat) – a kosár és a visszaigazolás ezt nyíltan jelzi.
- Feltét hozzáadása feláras extrával nincs (nincs ellenőrzött árlista) – csak elvétel.
- Online kártyás fizetés a látványtervben nincs, és nem is szimulál sikeres fizetést.
- ÁSZF és Adatkezelés a jelenlegi lizopizza.hu oldalaira mutat – az új rendszerhez saját dokumentum kell.
- A belső `_kutatas/` mappa a Pages-en elérhető (a repó nyilvános) – nincs benne személyes vagy titkos adat.

## Következő fázis terve (C → D → E)

**C – rendelőrendszer (MHosting)**
1. Tárhely felmérése: PHP-, MySQL-verzió, cron, limitek, SMTP, SSL; védett aldomain HTTP-auth-tal.
2. Architektúra: a mostani build-mentes front (vagy React + TS build statikus fájlként, Node-folyamat nélkül) + PHP 8 REST API + MySQL. PDO prepared statement, CSRF-token, szerveroldali validáció, `password_hash` alapú admin-belépés szerepkörökkel, biztonságos session-cookie, rate limit.
3. Adatmodell: products, product_sizes, ingredients (elvehető?), extras (ha lesz), zones (díj, minimum), opening_hours, orders, order_items, order_events (audit), admin_users.
4. Az ár **mindig szerveren** számolódik a terméktörzsből; a kliens csak azonosítókat küld.
5. Admin: rendelés-életciklus, hangjelzés új rendelésnél, termék/ár/elérhetőség, nyitvatartás, zónák és díjak, minimum, előzmények.
6. E-mail: visszaigazolás vevőnek, értesítés konyhának.
7. Tesztek: PHPUnit (árkalkuláció, validáció), integráció (API + DB), Playwright E2E a mostani forgatókönyvekkel.

**D – Stripe Checkout** (csak C után, tesztkulcsokkal)
- Checkout Session szerveroldalon, `metadata.order_id`, idempotencia-kulcs a dupla kattintás ellen.
- Webhook (`checkout.session.completed`, `…async_payment_failed`, `charge.refunded`) aláírás-ellenőrzéssel; esemény-azonosító tárolása → duplikált webhook nem küldi kétszer a konyhára.
- Rendelés csak `paid` állapotban kerül a konyhára; késve érkező webhookot is kezel; visszatérítés az adminból.
- Kulcsok környezeti változóban, a forráskódban soha. Éles kulcs csak tulajdonosi jóváhagyás után.
- Tesztek: dupla kattintás, elutasított kártya (4000 0000 0000 0002), 3DS, webhook újraküldés, hálózatkimaradás a visszairányítás előtt, visszatérítés.

**E – átadás előtti audit:** design, funkció, mobil (valódi eszközök), teljesítmény (Lighthouse), biztonság, adatkezelés (GDPR), élesítési és visszaállítási terv. A lizopizza.hu domainhez, a Falatozz-rendszerhez és a DNS-hez eddig nem nyúltunk.
