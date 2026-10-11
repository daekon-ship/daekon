# GYÁLAUTÓ (STABILTERV Kft.) — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/gyalauto/
Fájlok: `index.html`, `gyalauto.css`, `gyalauto.js`, `js/` (GSAP 3 + ScrollTrigger, helyben).
Az éles gyalauto.hu-hoz nem nyúltunk; a terv `noindex`.

## Koncepció
- **„Műszaki rajz”**: nincs saját műhelyfotó, stockfotót nem használunk, ezért egyetlen, saját rajzolású kombi vezet végig az oldalon: a heróban emelőn áll (felülvilágítás, padlófény, szkennelő vonal), a diagnosztikai szekcióban ugyanaz az autó „átvilágítva” mutatja a rendszereket, a műhely-szekció képkockái pedig ugyanennek a rajznak közeli kameraállásai.
- Paletta a brief szerint: grafit #080D14 + acélkék #111D2D dominál; elektromos kék #16B8FF a fő gombokon, jeges cián #91E7FF csak jelölésre; piros #F05A4F csak figyelmeztetésre és hibaüzenetre. Egy világos szekció (Miért a Gyálautó?) töri meg a sötétet.
- Tipográfia: Space Grotesk (címek) + Manrope (szöveg), Google Fontsról. Mérsékelt címméretek (hero max. 58 px, mobilon 32–40 px). A brief csupa nagybetűs főcímei mondatkezdő írásmóddal szerepelnek (olvashatóbb, prémiumabb); a „GYÁL • Q-SERVICE PARTNER” jelölő és a diagnosztika-fülek maradtak nagybetűsek.

## Szekciók
Hero → Szolgáltatások (6 kategória: asztalon index + nagy panel saját rajzzal, mobilon harmonika) → Diagnosztika (5 fül + kattintható pontok az autón) → Miért a Gyálautó? → A műhely (6 képkocka, nagyítás, mobilon lapozós sáv) → Időpontkérés folyamata (görgetésre töltődő vonal) → Időpontkérő → Kapcsolat + térkép → záró CTA. Mobilon ragadós alsó sáv: Hívás | Útvonal (safe-area kezelve).

## Ellenőrizve
- Adatok a Q-SERVICE adatlapról (cím, telefon, e-mail, nyitvatartás, kapcsolattartó, szolgáltatáslista) és a briefből (székhely, alapítás 1996. 04. 17.). A műhely nyitási évét nem állítjuk.
- Minden telefonlink azonos: `tel:+36204038056`. E-mail: `mailto:stabilterv@gmail.com`. Útvonaltervezés: Google Maps `dir` link a szervizcímre.
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
