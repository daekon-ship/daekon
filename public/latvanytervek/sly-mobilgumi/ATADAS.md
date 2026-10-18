# SLY Mobil Gumiszerviz — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/sly-mobilgumi/
Fájlok: `index.html`, `sly.css`, `sly.js` (függőség nélkül), `fonts/hanken-var.woff` (Hanken Grotesk, OFL).

## Koncepció (8. kör – tiszta újraírás, szerkesztett stílus)
A korábbi körök effektjei (rajzolt gumi, rajzfilmes szervizautó, 3D út, metszetrajz, belépő animáció, egyedi kurzor, futószalag) „gépi”, olcsó hatást keltettek – ezek mind kikerültek.
- Világos papír alap (#F4F3EF), tintafekete szöveg, hajszálvonalak; a márkapiros csak az S.O.S.-hez és apró jelölésekhez. Az S.O.S.-blokk, a kalkulátor-összegző és a lábléc sötét.
- Egyetlen betűcsalád (Hanken Grotesk), mérsékelt méretek, szoros betűköz a címeken.
- Nincs rajzolt illusztráció: csak a cég saját fotói, natív méret közelében, enyhe színkezeléssel. A valódi logó fehér háttere a papíron eltűnik (multiply).
- Szerkezet: hero (fotó + kulcsadatok sora) → két út (tervezett / S.O.S.) → 4 lépés → 13 tételes szolgáltatás-index (asztalon a sor fölött saját fotó) → a szervizautó felszereltsége (fotó + specifikációs sorok) → S.O.S. → árlista (6 fül, nettó/bruttó) + díjkalkulátor → munkáink (galéria + „A terepről” + partnerek) → flották + ajánlatkérő → GYIK → kapcsolat + időpontkérő → lábléc.
- Mozgás: csak finom beúszás és képnagyítás rámutatásra; `prefers-reduced-motion` esetén semmi.

## 9. kör – sötét, filmszerű nyitás
- A hero sötét: a saját munkafotó egy lassan forgó abroncs ablakán át látszik (ezüst oldalfal-felirat, monokróm). Asztalon görgetésre az ablak kitágul, a fotó kitölti a képernyőt, majd: „A műhely jön. Te maradsz.” Mobilon statikus kerék-ablak, alatta a szöveg és a gombok. GSAP nélkül, saját könnyű kóddal; `prefers-reduced-motion` esetén statikus.
- Alatta a 8. kör tiszta, rendezett oldala (kulcsadatok sora, két út, lépések, szolgáltatások, árak, munkák, flotta, GYIK, kapcsolat).

## 10. kör – a saját szervizautó a főszereplő
- Hero: a jelenlegi honlap saját, 2560 px-es fotója (`2021/11/IMG_3709-scaled.jpg`) – sárga SLY Ford Transit (SLY-220) a soproni Tűztorony előtt. Asztalon a szöveg sötét sávban balra, az autó szabadon jobbra; mobilon felül a kép, alatta szöveg és gombok.
- A márka valódi színei: Transit-sárga (#F5B700), logópiros (#D7141A), fekete. A fotók színesek (nincs szürkítés).
- Hero alatt teljes szélességű, színes 7 képes fotósáv (mobilon húzható), nagyítóval.
- **Egyeztetendő:** a nyilvános posztok barna Transitot említenek – ha a sárga autó már nem aktuális, friss autós fotó kell a herohoz.

## 11. kör – minden tartalom a jelenlegi honlapról
- Új **Tudástár** szekció (sötét, 4 fül: Gumicsere / Centrírozás / Defektjavítás / Csapdák kerékcserénél) a honlap hosszú szakmai cikkeiből tömörítve: 1,6 mm / 3 mm profilmélység, kopásjelző és kétszeres fékút, 4 egyforma gumi, forgatás 5–10 ezer km-enként, 7 °C, négyévszakos gumi jelölése, centrírozás minden szezonban, felnis garnitúrával 8–10 ezer Ft megtakarítás/szezon, defektjavító spray, a jó javítás menete, pótkerék és defekttűrő 80 km/h, ZP/SSR/ROF/EMT/RF/BSR jelölések, defekttűrő↔normál csere szabályai, egy gumi cseréje.
- Felszereltséghez: „képzett szerelő, számos mentéssel és szervizeléssel” (a honlap állítása).
- Minimum kiszállási díj magyarázata a honlapról; lábléc: „Balesetmentes közlekedést kívánunk! – a SLY Mobilgumi csapata”.
- **Szándékosan kihagyva:** a honlap „defektnél ne állj le azonnal, enyhén gyorsíts” tanácsa (közlekedésbiztonsági szempontból ellenőrizetlen).
- A honlapon a „Partnerek” között a DesignBySchmidt (a mostani honlapkészítő) is szerepel.

## Mi van ellenőrizve
- Árak: a brief árlistája tételesen (2025. 02. 01-től visszavonásig). Bruttó = nettó × 1,27, kerekítve.
- Kalkulátor: csak közzétett árak; felárak csak gumiszerelésnél; +50% a szolgáltatásdíjra munkaidőn túl; körzeten kívüli kiszállást nem számol.
- Telefonok: `tel:+36707321908`, `tel:+436765221185`; e-mail: `sly.mobilgumi@gmail.com`; Facebook: facebook.com/Slymobilgumi (a jelenlegi honlapról).
- Vízszintes túlcsordulás nincs 360 / 390 / 430 / 768 / 1440 px-en (géppel mérve). `prefers-reduced-motion` kezelve.

## Ügyféllel egyeztetendő
1. **Fotók:** a jelenlegi honlap 7 munkafotója csak 500×500 px-es eredetiben létezik (WP médiatár). A terv a slymobilgumi.hu-ról tölti be őket (hotlink, nincs helyi másolat — a sandbox nem érte el a domaint). Kellenek nagyobb felbontású saját képek, különösen a **barna Ford Transitról** (hero-jelölt). A sárga szervizautót „archív / korábbi” felirattal mutatjuk.
2. **Képjogok:** az impresszum a fotókra Schmidt Bálint (designbyschmidt.eu) szerzői jogát hirdeti → éles használat előtt engedély kell.
3. **Logó:** a jelenlegi `cropped-logouj.png` világos „rendszámtábla” keretben; vektoros logó kérendő.
4. **Cégadatok:** cégforma (Kft.?), telephely (Bánfalvi út 190. vs. Baross út 24/A) — a terv nem mutat címet. Kétféle e-mail él (gmail és info@slymobilgumi.hu).
5. **Árak 2026-ra:** megerősítendők; a „16 colig / 16 coltól” átfedés változatlanul maradt.
6. **Vélemények:** ellenőrizhető értékelést nem találtunk, ezért nincs véleményszekció. A „terepről” lista a nyilvános FB-bejegyzések munkatípusait foglalja össze idézet nélkül.
7. **Partnerlogók** (Dini Felni, DBS, Nilo, Kir Schnell, Staycar): a régi oldalról — aktuális-e.
8. **Jogi oldalak:** impresszum és adatkezelés ügyféljóváhagyás után (régi adatkezelő: Simon Szilveszter — elavult lehet).
9. **Űrlapok:** bemutató mód — nem küldenek, e-mail-piszkozatot nyitnak. Éleshez háttér kell.
10. A GYIK szakmai állításai (7 °C ökölszabály, osztrák téligumi-szabály nov. 1.–ápr. 15., 1,6 mm profilmélység) a tulajdonossal átnézendők.
