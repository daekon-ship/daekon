# Non-Stop Autómentés Mohács — látványterv, átadás

Ügyfél: **Non-Stop Autómentés – Bősze Márió**, Mohács (Baranya vármegye)
Jelenlegi oldal: https://automentesmohacs.hu/ · Facebook: https://www.facebook.com/automentesmohacson
Készült: 2026. október, DAEKON · Build nélküli statikus oldal (`index.html` + `css/` + `js/` + `fonts/` + `assets/`), `noindex`.

## 1. Elemzés

- **Közönség:** sürgős helyzetben, telefonról érkező autós (gyakran éjjel, úton, M6/M60), illetve tervezett szállítást kérő cég (munkagép, konténer, vásári jármű).
- **Cél:** egy mozdulat a hívásig. Minden képernyőn elérhető a `tel:+36202590264`.
- **A jelenlegi oldal gyengéi:** sablonos szerkezet, általános szövegek, ellenőrizhetetlen (generikus nevű) vélemények, gyenge mobilos hívásút.
- **Ellenőrzött adatok (a saját oldalról):** 0–24, ünnepnap is · 2015-ben indult, Bősze Márió és felesége, családi vállalkozás · 10 év tapasztalat, „több ezer mentés” · személyautó, kisteher, motor · teherautó, munkagép, konténer 15 t-ig · M6 és M60, belföld és külföld · rendezvényekre, vásárokra járműszállítás · rakománybiztosítás, modern felszerelés · telefonos árajánlat · tel. +36 20 259 0264 · mantga9317@gmail.com.

## 2. Három irány

| | Irány | Ötlet | Értékelés |
|---|---|---|---|
| A | **Éjszakai útjelző** ✅ | Aszfalt + grafit, borostyán villogófény (a mentőautók valódi fényszíne). Rajzolt éjszakai út, a mentő begördül és megáll, a villogóhíd felváltva villan. Szekciók „km-kő” címkékkel (km 01…08). | Erősen autómentős, megjegyezhető, gyorsan betölt, fotó nélkül is egyedi. **Ezt választottam.** |
| B | Diszpécserpult | Élő műszerfal, állapotlámpák, térkép-központú hero. | Látványos, de technokrata – egy családi vállalkozáshoz hidegebb. Elemeiből megmaradt az „Most is ügyeletben · óra” jelző. |
| C | Duna-parti család | Világos, meleg, mohácsi identitás, portré-központú. | Hiteles, de valódi portréfotó nélkül üres maradna, és nem üzeni a sürgősséget. |

## 3. Tipográfia, színek, térközök

- **Betűk (helyben, woff, latin + latin-ext):** Archivo változó (szűkített: `font-stretch` 70–84%) a címekhez · IBM Plex Sans a szöveghez · IBM Plex Mono az adatokhoz. Nincs Fraunces.
- **Méretek (mérsékelt):** H1 36–62 px · H2 25–46 px · törzs 16,5 px · gombfelirat 16–21 px.
- **Színek:** `--asphalt #0d0f12` · `--graphite #15181c` · `--anth #202429` · `--paper #f2f0eb` · `--ink #121418` · `--beacon #ffb200` (kiemelés, hívógomb). Ritmus: sötét → borostyán sáv → papír → sötét → grafit → papír → sötét → grafit → papír → borostyán kapcsolat.
- **Térköz:** szekció 76–128 px, oldalmargó 18–44 px, max. szélesség 1200 px.

## 4. Mozgás

| Elem | Mit csinál | Indító | Átadás |
|---|---|---|---|
| Hero mentő | 1,7 s alatt balról begördül, kerekek forognak, útfelfestés halad, majd megáll | betöltés | megállás után csak a villogó él tovább |
| Villogóhíd | két lámpa felváltva villan + a háttérben borostyán fénykör „lélegzik” | folyamatos | — |
| Élő pont, óra | zöld pulzáló pont; budapesti idő 20 mp-enként frissül | folyamatos | — |
| Szekcióelemek | 18 px-ről beúszás, lépcsőzetes késleltetéssel | görgetés | — |
| Mentés menete | az út vonala balról jobbra kirajzolódik a három lépés fölött | görgetés | — |
| Térkép | Mohács pontja körül borostyán pulzálás | folyamatos | — |
| Mobil hívássáv | a hero után felcsúszik, a Kapcsolat szekciónál eltűnik (nem takar CTA-t) | görgetés | — |

`prefers-reduced-motion` esetén minden animáció kikapcsol, a tartalom azonnal látszik. Nincs betöltő képernyő, nincs görgetés-eltérítés. Külső JS-könyvtár nincs (GSAP / Three.js / WebGL nem szükséges).

## 5. Komponensek

Fejléc + mobilmenü · hero (illusztráció, státuszjelző, XL hívógomb, 3 tény) · bizalmi sáv · szolgáltatáskártyák (kiemelt + 5) · „Miért minket” A–D · Rólunk tábla + 4 adat · 3 lépés + „Amíg odaérünk” biztonsági doboz · sematikus térkép · galéria + nagyító · GYIK (`<details>`) · Kapcsolat · lábléc · mobil hívássáv.

## 6. Képek

- **Nincs stock / AI kép.** A hero és a szolgáltatások saját rajzú SVG-illusztrációk; a mentő **illusztráció, nem az ügyfél járműve**, nincs rajta név, rendszám.
- **Galéria:** az ügyfél saját, jelenlegi galériájának 10 képét közvetlenül a `automentesmohacs.hu/galeria/Image01–10.webp` címről tölti be (max. 9 jelenik meg). Ha a képek nem tölthetők be, a szekció egy Facebook-hivatkozásra vált – üres rács nem marad.
- **Élesítéshez:** a képeket eredetiben kérjük el és tegyük az `assets/` mappába; a hero illusztráció helyére jöhet egy éjszakai fotó az ügyfél saját mentőjéről.

## 7. Ügyféllel egyeztetendő

1. A saját autómentő(k) fotói, színe, matricázása – a dizájn ehhez igazítható.
2. Pontos kiszállási körzet, településlista, külföldi célországok.
3. A jelenlegi oldal 3 véleményének forrása (nem került át, mert nem ellenőrizhető). Google- vagy Facebook-értékelések átvehetők, ha valósak.
4. Logó: új javaslat (2. kör, `arculat/`) – az ügyfélnek eddig nem volt logója; jóváhagyásig munkaváltozat.
5. Impresszum / adatkezelés adatai (cégforma, székhely, adószám) – ezek nélkül szándékosan nincs jogi oldal.
6. Kell-e űrlap: jelenleg csak telefon, e-mail és Facebook (működő linkek), űrlap nincs.

## 8. Tesztek

Playwright, 1440 / 768 / 390 / 360 px: vízszintes túlcsordulás 0, konzolhiba 0, minden belső horgony létező szekcióra mutat, 8 db `tel:+36202590264`, 2 db `mailto:`, 4 db Facebook-link. A galéria betöltött és sikertelen állapota is ellenőrizve.

## 9. Logó (végleges választás)

- **„Villogó 24”**: borostyán mentővillogó, benne a „24”. Ez az egyetlen logó; a többi próba (Plató, Horgos M, álló és negatív változat) kikerült.
- Fájlok (`arculat/`): `logo-lampa-sotet.svg` (fő logó), `logo-lampa-vilagos.svg` (világos háttér), `jel-lampa.svg` (profilkép, ikon, favicon). A feliratok görbére alakítva (Archivo, szűkített, 800).
- Bemutató: `arculat/index.html` (lábléc: „Logójavaslat”). A weboldal fejléce, a favicon és a telefonos ikon ezt használja.
