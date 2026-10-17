# CB TAXI – Nyakas Péter — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/cb-taxi/
Fájlok: `index.html`, `cbtaxi.css`, `cbtaxi.js`, `logo.svg` (teljes logó alsorral), `logo-jel.svg` (csak a CB jel, favicon), `fonts/` (Sora + DM Sans, helyben, OFL).
Build és külső függőség nincs; a terv `noindex`.

## Koncepció: „A déli partról”
- Nincs saját fotó, stockot nem használunk, ezért a vizuális világ **rajzolt**: a heróban esti kilátás a déli partról a valódi északi parti sziluettel (Szigliget, a tanúhegyek, Badacsony asztalhegye), naplemente a nyugati part felett, nádas, part menti út. Betöltéskor egyszer végigúszik egy fényszórópár az úton, aztán megáll – nincs végtelen animáció.
- Konkrét autót nem mutatunk (nem ismert a típus), csak fényszórót / hátsó lámpát – így semmi nem sugall nem létező járművet.
- Paletta a brief szerint: Midnight Navy #071A2B, Deep Ocean #0B2638, Ivory #F5F4EF, Champagne #D3AE73 (gombok, útfelfestés), Lake Cyan #45BCD0 csak a vízen és a fókuszkereten, Soft Grey #E7EBED. Sötét és világos szekciók váltakoznak.
- Tipográfia: Sora (címek, max. 58 px a heróban, 38 px a szekciócímeknél) + DM Sans. Fraunces nincs.
- Visszatérő motívum: a szaggatott champagne útfelfestés – a logóban, a hero útján, az országúti szekcióban, a menetlevélen, a navigáció alján görgetésjelzőként és a záró CTA felett.

## Logó (javaslat, nem meglévő arculat)
- CB monogram: a C nyílásán át az útfelfestés fut be a B-be (előrehaladás, út). Mellette „CB TAXI”, alatta „Nyakas Péter, személyszállítás”.

## Szekciók
1. **Hero** – „A Balatontól bárhová.”, Taxi hívása (`tel:+36309978362`) + Fuvarajánlat kérése (az űrlaphoz ugrik). A koordináta (46,7° É / 17,4° K) csak díszítés, kerekítve.
2. **Szolgáltatások** – szerkesztett lista, asztalon mellette ragadós rajzkeret, ami a kiválasztott szolgáltatás rajzára vált. Mindegyik sor gombja az ajánlatkérőhöz ugrik, előválasztott típussal.
3. **Az utazás már az indulás előtt elkezdődik** – országút a horizontig; görgetésre az útfelfestés halad (nem scrolljacking). 3 lépés: Hív vagy ír → Egyeztetés → Indulás.
4. **Hová utazna?** – teljes ajánlatkérő: 4 fuvartípus, reptéri mezők (repülőtér, járatszám, érkezés/indulás) csak reptéri típusnál, dátum (múltbeli nem választható), időpont, utasok, csomagok, név, telefon, e-mail, megjegyzés; magyar hibaüzenetek, billentyűzettel kezelhető. Mellette **élő menetlevél**, ami gépelés közben töltődik.
   - **Demó:** küldéskor nem megy el semmi; a felület ezt ki is írja, és felajánlja: „Elküldöm e-mailben” (előre kitöltött levél a taxispeter@gmail.com címre) vagy „Inkább felhívom”. Éles oldalhoz valódi küldő végpont kell.
5. **Ismerős utak. Új úti célok.** – vázlatos Balaton-térkép (valós koordinátákból vetítve), fülekkel: Balatonmáriafürdő, Balatonkeresztúr, Marcali, A Balaton térsége; mindhez saját rajz. Felirat: a jelölt települések kiindulópontok, nem határok. Menetidő, útvonal nincs.
6. **Reptéri transzfer** – mini-űrlap; a gomb a teljes ajánlatkérőt tölti ki és odaugrik.
7. **Kapcsolat / névjegy** – brief szerinti bemutatkozó szöveg + sötét névjegykártya (telefon, e-mail, terület).
8. **Indulhatunk?** – záró CTA, lábléc, adatkezelési tájékoztató helye (párbeszédablak), „Előzetes látványterv – DAEKON”.

Mobilon (640 px alatt) alsó kezelősáv: Hívás | Ajánlatkérés. Csak a hero után jelenik meg, és eltűnik az ajánlatkérőnél, a záró CTA-nál és a láblécnél. `prefers-reduced-motion` esetén minden mozgás kikapcsol.
Ellenőrizve 360, 390, 768, 1440 px szélességen: nincs vízszintes túlcsordulás, nincs konzolhiba.

## Ügyféllel egyeztetendő
- **Reptéri transzfer**: vállalja-e, és mely repülőterekre (a listában: Liszt Ferenc, Hévíz–Balaton Airport, Bécs, Zágráb, egyéb).
- **Kapacitás**: az utasszámnál „7 vagy több” opció van, maximum nincs kiírva (7 és 9 fős adat is kering).
- **Vezetékes számok** (+36 85 575 175, +36 85 575 176): élnek-e még – az oldalon most csak a mobilszám szerepel.
- **Székhely** (8648 Balatonkeresztúr, Rákóczi Ferenc u. 72.): megjelenhet-e – most nincs kiírva.
- **Balatonmária vasútállomás** mint személyes elérési pont: így szerepeljen-e.
- **Fotók**: ha lesz saját autó- vagy portréfotó, a névjegy mellé és a szolgáltatás-rajzok helyére tehető.
- Adatkezelési tájékoztató szövege, e-mail-küldés módja az éles oldalon.
