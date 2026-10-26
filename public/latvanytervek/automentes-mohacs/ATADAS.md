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

## 4. Mozgás – Motion (motion.dev)

A mozgásokat a **Motion 11.18.2** (vanilla JS) hajtja. Helyben van, CDN nélkül: `js/vendor/motion-11.18.2.min.js` (~69 KB, gzip ~25 KB). A hivatalos forrásból (`motiondivision/motion`, v11.18.2 tag) tsc + bun építette, MIT licenc: `js/vendor/MOTION-LICENSE.md`. Élesítéskor lecserélhető az npm `motion` csomagra.

| Elem | Mit csinál | Indító | Motion API |
|---|---|---|---|
| Hero szöveg | állapotjelző, két címsor, alcím, gombok, tények 70 ms-os lépcsővel úsznak be | betöltés | `animate` + `stagger` |
| Hero mentő | rugós fizikával begördül és megáll (1,5 s, enyhe ráhúzás); fékezéskor a szállított autó előrebillen | betöltés | `animate`, `type: "spring"` |
| Hero görgetés | a mentő görgetéssel továbbgördül a képből | görgetés (scroll-linked) | `scroll(animate(...))` |
| Szekcióelemek | csoportonként, rugós beúszás, 80 ms lépcső | belépés a nézetbe | `inView` + spring |
| A mentés menete | az út vonala pontosan a görgetéssel együtt rajzolódik ki | görgetés (scroll-linked) | `scroll`, `strokeDashoffset` |
| Térkép | az M6 és M60 kirajzolódik, majd Mohács tűje rugósan leesik | belépés a nézetbe | `inView` + spring |
| Mobil hívássáv | rugós felcsúszás a hero után, eltűnik a Kapcsolatnál | görgetés | spring |
| Hívógombok | nyomásra 0,96-ra „besüllyednek” (tapintható visszajelzés) | érintés / kattintás | spring |
| Mobilmenü, GYIK, galéria, nagyító | a menüpontok lépcsőzetesen jelennek meg; a válasz becsúszik; a képek elhalványulva érkeznek | interakció | `animate` |

**Biztonsági háló:** ha a Motion nem tölt be vagy hibát dob, natív tartalék fut (Web Animations + IntersectionObserver), a tartalom mindig megjelenik. A hero szövegét egy 3 mp-es időzítő akkor is láthatóvá teszi, ha minden szkript elhasal. `prefers-reduced-motion` esetén nincs mozgás. Nincs betöltő képernyő, nincs görgetés-eltérítés.

Tesztelve (Playwright, 1440 és 390 px): Motion-ág, Motion nélküli tartalék és csökkentett mozgás – mindhárom hibamentes, minden elem láthatóra áll; a görgetéshez kötött animációk köztes állásai is mérve.

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
