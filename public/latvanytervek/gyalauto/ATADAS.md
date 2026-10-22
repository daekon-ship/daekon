# GYÁLAUTÓ (STABILTERV Kft.) — látványterv, átadás

**ÉLES: https://gyalauto.hu** (DAEKON VPS, Site Factory; 2026-10-22). Ez a mappa a forrás; a GitHub Pages-változat
(https://daekon-ship.github.io/daekon/latvanytervek/gyalauto/) előnézet marad: `noindex`, a canonical a gyalauto.hu-ra mutat.
Fájlok: `index.html`, `impresszum.html`, `adatkezeles.html`, `404.html`, `gyalauto.css`, `gyalauto.js`, `js/` (GSAP 3 + ScrollTrigger),
`fonts/` (Manrope + Space Grotesk, helyben, OFL), ikonok, `og-gyalauto.jpg`, `site.webmanifest`.

## Éles build és élesítés
1. Jogi oldalak / 404 / favicon újragenerálása, ha a fejléc, lábléc vagy a `_jogi/*.body.html` változott: `python -I _jogi/gen.py`
2. Éles build (új, üres mappába; noindex → index, CSP-meta hash-sel, CSS/JS `?v=hash`, robots.txt, sitemap.xml, ellenőrzések):
   `python -I build_eles.py --out <új mappa>` – ha hibát ad, NEM élesíthető.
3. `tar --owner=0 --group=0 -czf gyalauto.tgz -C <mappa> .` → VPS: `sudo daekon-site deploy gyalauto.hu /tmp/gyalauto.tgz`
   Visszaállítás: `sudo daekon-site rollback gyalauto.hu --to <kiadás>`. Jegyzőkönyv: `C:\daekon-migration\GYALAUTO_ELESITES.md`.

## Élesítési véglegesítés (2026-10-22)
- Látványterv-felirat a láblécből le; Impresszum + Adatkezelési tájékoztató és sütik oldal, saját 404.
- Betűk helyben (nincs Google Fonts-kérés); a Google Térkép csak kattintásra töltődik (előtte nincs Google-kérés, nincs süti) → cookie-banner nem kell.
- SEO: title/description, OG-kép, favicon/ikonok, JSON-LD (AutoRepair, szolgáltatáskatalógus, adószám; az alapítás dátuma kikerült a JSON-LD-ből – ellenőrizetlen).
- Akadálymentesség: logó akadálymentes neve, mobil alsó sáv `nav`, szolgáltatás-fülek ARIA-szerkezete, lábléc-linkek érintési mérete, 320 px-en a levágott „Útvonaltervezés” gomb.
- CLS: a nyitvatartás-jelző helye előre lefoglalva (0,13/0,19 → 0,00/0,03).

## Koncepció
- **„Műszaki rajz”**: nincs saját műhelyfotó, stockfotót nem használunk, ezért egyetlen, saját rajzolású kombi vezet végig az oldalon: a heróban emelőn áll (felülvilágítás, padlófény, szkennelő vonal), a diagnosztikai szekcióban ugyanaz az autó „átvilágítva” mutatja a rendszereket, a műhely-szekció képkockái pedig ugyanennek a rajznak közeli kameraállásai.
- Paletta a brief szerint: grafit #080D14 + acélkék #111D2D dominál; elektromos kék #16B8FF a fő gombokon, jeges cián #91E7FF csak jelölésre; piros #F05A4F csak figyelmeztetésre és hibaüzenetre. Egy világos szekció (Miért a Gyálautó?) töri meg a sötétet.
- Tipográfia: Space Grotesk (címek) + Manrope (szöveg), Google Fontsról. Mérsékelt címméretek (hero max. 58 px, mobilon 32–40 px). A brief csupa nagybetűs főcímei mondatkezdő írásmóddal szerepelnek (olvashatóbb, prémiumabb); a „GYÁL • Q-SERVICE PARTNER” jelölő és a diagnosztika-fülek maradtak nagybetűsek.

## Hero-cím (8. kör)
- „Precíz javítás. Biztos utak.” helyett: **„Megnézzük. Megjavítjuk.”** — egyszerű, szerelői hangon; rímel a diagnosztika „Megkeressük a hiba okát” címére.
- Felette: „AUTÓSZERVIZ GYÁL • Q-SERVICE PARTNER” (a keresőszó a hero tetején marad).

## Hívásra optimalizálás (7. kör)
- Élő nyitvatartás-jelző a heróban, a mobilmenüben és a Kapcsolatnál (budapesti idő szerint): „Most nyitva · 16:30-ig”, zárás előtti órában „még X percig”, zárva „ma / holnap / hétfőn 8:00-kor nyitunk”. Ünnepnapokat nem kezel — élesítés előtt egyeztetendő, kell-e (pl. ünnepi lista).
- Telefonon a hero fő gombja „Hívás most”, mellette „Időpontkérés”; a „Szolgáltatásaink” gomb csak asztalon van.
- A diagnosztika húzható fülsora a jobb szélen halványodik (jelzi, hogy húzható), a végére érve a halványodás eltűnik.

## Tömör telefonos nézet (6. kör)
- Telefonon az oldal 6957 → 4443 px (−36%), 390 px szélességen mérve.
- Szolgáltatások: induláskor minden kategória csukva (6 sor), koppintásra nyílik.
- Diagnosztika: a fülek egy sorban, oldalra húzhatók; a kapcsolódó szolgáltatások kis címkékként.
- Miért minket?: kétoszlopos pipás lista, rövidebb bevezető.
- Időpontkérő: márka / típus / évjárat egy sorban, telefon és e-mail egymás mellett, kisebb választógombok; a telefon/e-mail/nyitvatartás lista telefonon nem ismétlődik (a Kapcsolat részben megvan).
- A záró „Hívjon” sáv telefonon rejtve (az alsó Hívás | Útvonal sáv kiváltja); lábléc tömörebb.

## Műhely-szekció törölve (5. kör)
- Az „Ismerje meg a műhelyt” szekció, a „A műhely” menüpont (asztali és mobil) és a képnagyító kikerült. A menü: Főoldal | Szolgáltatások | Miért minket? | Kapcsolat + Időpontkérés.
- Ha később lesznek saját műhelyfotók, egy galéria a „Miért minket?” után visszatehető.

## Logó (4. kör – végleges koncepció)
- Saját rajzolású, betűtípustól független szókép: GYÁLAUTÓ egyenes vonalú, ferdén levágott sarkú betűkkel, 10°-os dőléssel (mozgás, sebesség). A **GYÁL** törtfehér, az **AUTÓ** acélszürke, az ékezetek és a G keresztszára elektromos kék.
- Jel: ferde, levágott sarkú lemez, benne átlós villás-csillagkulcs; a csillagvégben kék hatlapfejű anya. Önállóan is használható (favicon, profilkép, matrica).
- Fájlok: `logo.svg` (teljes logó alsorral), `logo-jel.svg` (csak a jel). Mindkettő vektoros, nyomdai/matricás felhasználásra is alkalmas.
- Betöltéskor a jel beúszik és a kulcs „ráhúz” (elfordul a helyére), a betűk egyenként megjelennek; rámutatáskor az anya kivilágosodik.

## Teljes vizuális javítás (3. kör)
- Egységes formavilág a logó csavaranyájából: a fő gombok kétsarkú, gépelt „lemez” formát kaptak (ferdén levágott sarkok, fényes élsúrolás rámutatáskor), a többi elem 4–6 px-es szögletes sarok — eltűntek a lekerekített „pill” gombok és dobozok.
- Műszaki rajz-motívum: regisztrációs sarokjelek a szolgáltatáspanelen, az űrlapon, a térképen és a képkockákon; a listapontok és a folyamat lépésszámai hatszögek.
- Hero: lámpatest felfüggesztéssel, lágy (elmosott) fénykúp, fényes él a karosszéria vállvonalán.
- Szolgáltatásrajzok nagyobbak, rácsháttér helyett lágy fényfolt.
- Diagnosztika: az inaktív pontok is látszanak.
- Műhely: 6 helyett 4 erősebb képkocka (egy nagy + 3 „átvilágított” közeli: motortér, fék és kerék, futómű).
- Mobil: tömörebb kapcsolat-blokk, gombok egymás mellett.

## Kompaktabb elrendezés (2. kör)
- Hero nem tölti ki kötelezően a képernyőt: asztalon kb. 550 px, mobilon az autó, a cím, a két gomb és a telefonszám egy képernyőn.
- Szekciótávolságok kb. harmadával kisebbek; kisebb címek (h2 max. 34 px), gombok, mezők, listasorok.
- Szolgáltatáspanel: rajz és szöveg egymás mellett (kb. fele magasság). Mobilon a tételek két oszlopban.
- Oldalhossz: asztalon ~7450 → ~5600 px.

## Szekciók
Hero → Szolgáltatások (6 kategória: asztalon index + nagy panel saját rajzzal, mobilon harmonika) → Diagnosztika (5 fül + kattintható pontok az autón) → Miért a Gyálautó? → A műhely (6 képkocka, nagyítás, mobilon lapozós sáv) → Időpontkérés folyamata (görgetésre töltődő vonal) → Időpontkérő → Kapcsolat + térkép → záró CTA. Mobilon ragadós alsó sáv: Hívás | Útvonal (safe-area kezelve).

## Ellenőrizve
- Adatok a Q-SERVICE adatlapról (cím, telefon, e-mail, nyitvatartás, kapcsolattartó, szolgáltatáslista) és a briefből (székhely, alapítás 1996. 04. 17.). A műhely nyitási évét nem állítjuk.
- Minden telefonlink azonos: `tel:+36203746783`. E-mail: `mailto:stabilterv@gmail.com`. Útvonaltervezés: Google Maps `dir` link a szervizcímre.
- Menü (asztali + hamburger, Esc-re zár), minden menüpont létező szekcióra mutat; aktív menüpont görgetéskor.
- Szolgáltatásválasztó (egér + nyilak/Home/End), diagnosztika-fülek (egér + nyilak) és pontok, „Időpontot kérek erre” gombok előválasztják a szolgáltatást az űrlapon.
- Űrlap: kötelező mezők, évszám-, telefon- és e-mail-ellenőrzés, magyar hibaüzenetek, fókusz az első hibás mezőre. Sikeres kitöltés után **nem** ír „elküldtük”-et: összesítőt mutat, és hívást vagy előre kitöltött e-mailt kínál.
- Nagyítás: nyilak, Esc, swipe, fókuszcsapda.
- Vízszintes túlcsordulás nincs 320 / 375 / 390 / 430 / 768 / 1440 px-en (géppel mérve). `prefers-reduced-motion`: minden animáció kikapcsol, a tartalom teljes.
- Strukturált adat: `AutoRepair` (csak valós adatokkal, értékelés nélkül).

## Élesítés előtt — ügyféllel egyeztetendő / háttér kell
1. **Fotók:** kellenek a gyáli műhely saját képei (műhelytér, emelő, diagnosztika, kerékszerelés, motortér). Csere: `gyalauto.js` → `SHOTS[n].src` kitöltése; a rajz helyett a fotó jelenik meg. A hero rajzos marad, vagy fotóra cserélhető.
2. **Cím írásmódja:** a Q-SERVICE adatlapon „Vállalkozó út 8.”, a briefben „Vállalkozó utca 8.” — a terv „utca”-t használ, egyeztetni kell. A térkép a Q-SERVICE adatlap koordinátáit mutatja (47.37157, 19.21250).
3. **Időpontkérés:** jelenleg demó (hívás / e-mail-piszkozat). Valódi küldéshez háttér (űrlapszolgáltatás vagy szerver) és adatkezelési tájékoztató kell; utána jöhet visszaigazoló üzenet.
4. **Q-SERVICE logó:** csak szöveg szerepel. Logó csak az Inter Cars által adott, hiteles fájlból, engedéllyel.
5. **Vélemények:** nincs kitalált értékelés. Ellenőrzött (pl. Google) véleményekhez kész a hely: `gyalauto.js` → `REVIEWS` tömb; amíg üres, a blokk rejtve marad.
6. **Szövegek:** a szolgáltatás-leírások és a diagnosztika-szövegek általános szakmai megfogalmazások — a tulajdonossal átnézendők (pl. „hivatalos diagnosztikai eszközök” a Q-SERVICE adatlapról).
7. **Jogi oldalak:** impresszum, adatkezelés, sütikezelés (Google Térkép és Google Fonts külső szolgáltatás).
8. **Domain/SEO:** a canonical `https://gyalauto.hu/`; élesítéskor a `noindex` levételével együtt OG-kép készítendő.
