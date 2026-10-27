# Beatrix Nails & Pedikűr (Balogh Beatrix) — átadási jegyzék

Látványterv, 3. kör — 2026.10.27. (2. kör: 10.26., 1. kör: 10.25.)
Előnézet: `https://daekon-ship.github.io/daekon/latvanytervek/balogh-beatrix/` (noindex)

> **Bemutató.** A foglalás és az admin a böngésző helyi tárolójával (localStorage) működik.
> Nincs központi adatbázis, nem megy ki e-mail, nem jön létre valódi időpont.

---

## 0. Bemutató változat — ügyfélbemutatóra kész (2026.10.28.)

Cél: biztonsággal bemutatható látványterv, **nem élesítés**. A dizájn, a színvilág, a logó és az oldalstruktúra változatlan.

**Előtte–utána galéria** (`specialis-labapolas.html#elotte-utana`, forrás: `_forras/elotte_utana.py`, képek: `img/elotte-utana/`)
- 3 pár, vizuális egyezés alapján (lábujjforma, nézőpont):
  - 1. pár: bal láb, lábujjak — 7067ac9c → d61eeb39;
  - 2. pár: jobb láb, lábujjak — afa924e9 → 76cc9629;
  - 3. pár: talp — c1535ce3 → 0e26dd32.
- **A párosítást Beatrix ellenőrzi.** Nem párosítható biztosan, ezért kimaradt:
  - 8b25086a (két láb, áttekintő);
  - d860efe2 (körömközeli);
  - 93f29616 (talp);
  - 12fff8db (talp, a háttérben a vendég keze).
- **Hozzájárulás:** a `js/config.js` → `beforeAfter.consentApproved: false`. Amíg nincs írásos vendég-hozzájárulás, a képek „Belső bemutató — jóváhagyásra vár” fátyol mögött vannak, a bélyegképek is elmosva; a „Megtekintés (bemutató)” gombbal nyithatók. `true` értéknél a fátyol eltűnik.
- Főoldalon problémás láb nincs (brief).

**Speciális lábápolás kiemelése:** új sötét szekció a főoldalon a kezelések után.
- Tartalom: lépések, árak Beatrix listájáról, telefonos CTA, link az előtte–utána galériára.
- Szöveg: „szépségápolási, komfortot szolgáló kezelés — nem helyettesíti az orvosi ellátást”. Gyógyító / orvosi állítás nincs.

**Galéria:** 8 egyedi kép. A közel azonos felvételek (ugyanaz a kéz, hasonló szög) kiszűrve. A fotószalag 6 egyedi képből áll.

**Jóváhagyási lista:** `jovahagyas.html` (lábléc → Tudnivalók). **Árat nem módosítottunk**, a lista csak jelöli az eltéréseket:
- két eltérő kézápolás-árlista;
- Notino-referenciaárak;
- becsült időtartamok;
- műköröm eltávolítás 6 500 Ft (Notino-forrás);
- cím, bemutatkozó szöveg, fizetés, lemondás, fotó-hozzájárulások.

**Javítások:**
- Asztali „Szolgáltatások” lenyíló: egérrel kattintva bezáródott (a rámutatás már kinyitotta) — javítva.
- Elavult GYIK-szövegek (régi kezelésnevek, 45–100 perc), oldalcímek és leírások, menüszámláló („8 kezelés”) frissítve.
- „Menete” címsor alatti nagy rés megszüntetve.
- Előtte–utána bélyegképek nyúlása javítva.
- Fotószalag: csak látható állapotban fut, és csak változáskor ír a DOM-ba. Görgetésnél nincs 50 ms feletti képkocka.
- A képek méretarányos szélesség/magasság attribútumai ellenőrizve (`magenta-3` javítva).
- Admin érintési célok mobilon nagyobbak. A lábléc logólinkje akadálymentes nevet kapott.

**Teszt:**
- Végponttól végpontig (foglalás 6 lépés, ütközés, módosítás, lemondás, admin nézetek/szerkesztés): 53/53 valódi Motionnel, 53/53 Motion nélkül.
- Bejárás 11 oldal × 5 szélesség (360/390/768/1024/1440): 962 ellenőrzés, 0 hiba — linkek, horgonyok, képek, túlfolyás, láthatatlan elemek, konzolhibák, menük, előtte–utána, árlista-lenyitás.

**Nem aktív:** éles foglalás, e-mail/SMS, jogi dokumentumok.

## 0/3. 6. kör — új színvilág, csiszolás (2026.10.27.)

- **Színek:** a barna–homok–zsálya palettát lecseréltem. Az új paletta Beatrix munkáihoz és rózsaszín árlistáihoz igazodik:
  - alap: púderes, rózsás fehér (`#FBF6F5`);
  - szöveg és sötét blokkok: mély szilva-fekete (`#2A1F25`);
  - kiemelés: fáradt rózsa (`#C9849A` / szövegben `#9C4C68`);
  - második kísérőszín: levendula (`#A596C2`).
  - A virágmotívum is rózsaszínt kapott.
- **Árlista a főoldalon:** alapból 8 sor látszik, a többit a „Teljes árlista” gomb nyitja. Szűréskor minden találat látszik.
- A „régebbi árlista” belső megjegyzés lekerült a nyilvános oldalról (a configban kommentként megmaradt).
- Mobilon a szekciócímkék nem csúsznak ki a margóból.

## 0/2. 5. kör — sok Motion-effekt (2026.10.27.)

- **Motion helyben:** `js/vendor/motion-11.18.2.min.js` (MIT, licenc mellette). Nincs CDN-függés.
- **Logó vektorosan:** `_forras/logo_vektor.py` a JPG-ből kontúrkövetéssel SVG-t készít: `arculat/logo.svg`, `logo-vilagos.svg`, `logo-fejlec.svg`.
  - A Rólam-részben a teljes logó vonalanként **megrajzolódik**, majd kitöltődik. Ez ideiglenes, a portré beérkezéséig.
  - A fejléc-logó betöltéskor kinyílik.
- **Ikonok:** beágyazott SVG-útvonalak. Görgetésre megrajzolódnak, hoverre újrarajzolódnak.
- **Címek:** szavanként, maszk mögül, elmosásból úsznak be.
- **Nyitókép:** rétegzett fotók belépése, egérkövető mélység, görgetéses parallaxis, lebegő virág.
- **Fotószalag:** végtelen futás. A görgetés sebességére gyorsul és megdől, hoverre lelassul.
- **Interakció:** mágneses gombok, 3D-ben billenő kártyák fényfolttal, kurzorgyűrű („Nézd”, „Nagyítás”), fényvillanás a gombokon.
- **Komponensek:** csúszó szűrő-jelölő, rugós GYIK, a nagyító a bélyegképből nyílik ki, konfetti a sikeres foglalásnál.
- Érintőképernyőn és csökkentett mozgás kérésekor a mágnes, a billenés és a kurzor kikapcsol, illetve az animációk elmaradnak.
- Teszt valódi Motionnel és Motion nélkül: 53/53 + 53/53. Túlfolyás nincs.

## 0/1. 4. kör — látványosabb főoldal (2026.10.27.)

- **Nyitókép:** Beatrix fotóiból rétegzett kompozíció (íves nagy kép, kerek és szegélyes kiskép), mögötte a logó virágmotívuma (`arculat/virag-1*.png`, a logóból kivágva). Motion: kinyíló/ráközelítő belépés, görgetésre parallaxis, hoverre lassú zoom.
- **Gyorsfoglalás:** széles foglalósáv a nyitókép alján (kezelések 2×2 + 3 szabad időpont).
- **Fotószalag:** végtelenített, lassan futó szalag 8 munkafotóval (Motion; hoverre lelassul; csökkentett mozgásnál áll, görgethető).
- **Sötét szekció:** halvány virágmotívum, görgetésre lassan elfordul.

## 0/0. 3. kör — Beatrix saját anyagai (2026.10.27.)

Beatrix elküldte a logóját, az árlistáit és a munkafotóit. Ezekre épül most az oldal.

**Márka és logó**
- Név: **Beatrix Nails & Pedikűr** (a logóról). A korábbi „Foot & Nail Studio” javaslat megszűnt.
- A logó egy 2000×2000-es JPG-ből készült, átlátszó PNG-ként:
  - `arculat/logo-beatrix(-vilagos).png`: teljes, álló változat (lábléc).
  - `arculat/logo-fejlec(-vilagos).png`: vízszintes fejléc-változat. A B-embléma és a felirat ugyanazokból az elemekből van egymás mellé téve.
  - `img/favicon-48.png`, `apple-touch-icon.png`, `ikon-512.png`.
- Takarítás a logón: a B felső szára fölötti kósza apró jelet, illetve a felirat fölé belógó levélvégeket eltávolítottam.
- **Élesítéshez kérni kell az eredeti vektoros (SVG/PDF) logót**, mert a raszteres változat kis méretben elmosódik (főleg a „NAILS & PEDIKŰR” alcím).
- Forrás és feldolgozás: `_forras/kepek.py` (újrafuttatható). Az előző ideiglenes felirat-logó és SVG-k törölve.

**Árlista** (`js/config.js`). Forrás: Beatrix árlista-képei.
- Lábápolás: esztétikai pedikűr négy változatban, lábgéllakk, eltávolítás + mini pedikűr, talpmasszázs, paraffinos lábápolás.
- Wellness pedikűr csomagok: Frissítő (60 perc), Relax (90 perc), Deluxe (120 perc).
- Kézápolás: orosz gépi manikűr, paraffinos kézápolás, géllakk eltávolítás, erősített géllakk XS/S, műköröm XS/S/M (a töltés ára a leírásban).
- Díszítés: körömenkénti árak a manikűr aloldalon.
- Speciális: konzultáció, speciális pedikűr, gombás köröm, benőtt köröm, körömprotézis. Mind telefonos egyeztetésű.
- ⚠ **Két különböző Kézápolás-árlista érkezett.** Az A4-es, magasabb árú változatot használtam (5 500 / 6 500 / 9 000 / 10 000 Ft…), mert az egyezik a Notino-árakkal. Hogy melyik az érvényes, egyeztetni kell. Az L méretű műköröm, a rágott körömre építés (+2 000 Ft) és a műköröm eltávolítás 5 500 Ft-os ára csak a régebbi listán szerepel.
- ⚠ **Időtartam** csak a talpmasszázsnál és a wellness csomagoknál volt megadva. A többi **becsült** (`estimate: true`), és Beatrix-szel egyeztetendő, mert a foglalási naptár ebből számol.

**Fotók** (`img/munkak/`, 17 kép: teljes 1600 px + `-k` 760 px). Mind Beatrix saját munkája.
- Adatvédelem: a háttérben látható arcot, állat és nyakat minden képről levágtam.
- **A vendégek hozzájárulását a megjelenéshez kérjük írásban** (kéz/láb fotó is személyes adat lehet).
- Főoldal:
  - csak kézfotók szerepelnek: egy fotósáv a nyitókép alatt, és a galéria 10 képe;
  - a galéria színcsalád szerint szűrhető: élénk, pasztell, natúr.
- Pedikűr aloldal: 2 kezelés utáni, rendezett lábfotó.
- **Kihagyva:** a kezelés előtti lábfotók (bőrkeményedés, elszíneződött köröm). A brief szerint problémás lábat nem mutatunk a főoldalon. Ha Beatrix „előtte–utána” blokkot szeretne a speciális oldalra, ahhoz kifejezett vendéghozzájárulás és orvosi állítás nélküli szöveg kell.
- Nem használtam: a Facebook-képernyőképet (gyenge minőség, felület-elemek) és a két stock logó-képernyőképet (azok csak minták voltak).
- Portré: még nincs, a helye megmaradt.

Teszt: **55/55** (Motion-helyettesítővel) és **53/53** (Motion nélkül). Túlfolyás: 12 oldal × 4 szélesség, nincs.

## 0/a. 2. kör — mi változott (ügyfél-visszajelzés: „gyenge képek”, „rossz betű”)

- **Betű:** Hanken Grotesk egyetlen családként (cím + szöveg), mérsékelt méretek; talpas betű nincs. (Elvetett: Spectral, Bodoni Moda, Instrument Serif, Plus Jakarta — lásd `iranyok.html`, `betuk.html`.)
- **Illusztrációk törölve** (`js/art.js` megszűnt). Nincs stock és AI-kép sem.
- **Nyitókép:** élő gyorsfoglaló kártya — kezelésválasztás, 3 legközelebbi szabad időpont, egy kattintással az Adatok lépésre visz (`foglalas.html?kezeles=…&nap=…&ido=…`).
- **Kezelések:** színkódolt kártyák (pedikűr homok, manikűr zsálya, speciális eszpresszó). Árlista, GYIK, értékek: lekerekített fehér kártyák.
- **Galéria:** 8 fotóhely („Saját fotó helye”), a `js/site.js` `GALLERY` tömbjében `src` megadásával cserélhető; szűrés, nagyítás, lapozás működik.
- **Aloldalak:** kép helyett kezelés- és árösszegző kártya.
- Gombok mondatkezdő betűvel, nem csupa nagybetű.
- Teszt: **52/52** (új: gyorsfoglaló mélylink), túlfolyás 12 oldal × 4 szélesség: nincs.

## 0/b. Logó — lezárva (3. kör)

- Beatrix saját logója van kint, lásd fent. A korábbi kódból rajzolt kísérletek és az ideiglenes felirat törölve.

## 0/c. Animációk — Motion (motion.dev), 2026.10.26.

- Könyvtár: **Motion vanilla JS** (`window.Motion`), `motion@11.18.2`, jsDelivr CDN-ről, rögzített verzióval. Az animációs réteg: `js/motion-fx.js`.
- Tartalék: ha a Motion nem tölt be, vagy a látogató csökkentett mozgást kért, a korábbi CSS-animációk futnak — az oldal mindkét esetben teljes értékű.
- Mit animál a Motion:
  - **Betöltés:** a nyitószöveg lépcsőzve felúszik, a gyorsfoglaló kártya rugós mozgással érkezik, a kezeléssorok egymás után beúsznak.
  - **Görgetés (`inView`):** blokkok testvérenként lépcsőzve; képhelyek `clip-path` kinyílással; az időtartam-óralapok körívei megrajzolódnak. A fejlécben arany csík mutatja az előrehaladást (`scroll`).
  - **Interakció:** `press` (gombok, időpontok, kártyák 0,97-re nyomódnak, rugóval vissza), `hover` (kártyák 3 px-et emelkednek); a szűrésnél és a kezelésváltásnál az elemek felbukkannak; nagyításkor a kép finoman ráközelít.
  - **Foglalás:** lépésváltás oldalirányú beúszással, siker-képernyőn körív, pipa és jegy; értesítések rugós beúszással.
  - **Admin:** a KPI-számok felpörögnek, a modálok rugósan nyílnak.
- Élesítéskor ajánlott a `motion.js` fájlt a projektbe másolni (helyi kiszolgálás + SRI), és ugyanazt a verziót rögzíteni.
- Tesztelés: a helyi gépről a CDN nem volt elérhető, ezért a teljes tesztsor egy Motion-API-helyettesítővel (55/55) és Motion nélkül (53/53) is lefutott; az éles CDN-betöltést a publikált oldalon ellenőrizni kell.

## 1. Ami elkészült

| Oldal | Tartalom |
|---|---|
| `index.html` | Hero, értékek, 3 kezeléskategória, szűrhető árlista óralappal, Rólam, „A szalonban”, galéria (szűrés, nagyítás, teljes képernyő, lapozás, swipe), GYIK (8), kapcsolat, térkép-helyőrző |
| `pedikur.html`, `manikur.html` | Kategória-aloldal: kártyák (leírás, időtartam, ár, foglalás), „Melyiket válasszam?”, továbbvezetés |
| `specialis-labapolas.html` | Telefonos egyeztetés, menete, „nem orvosi kezelés” tájékoztatás |
| `foglalas.html` | 6 lépés: kezelés → nap → időpont → adatok → összesítés → kész. Foglalásaim, módosítás, lemondás, .ics |
| `admin.html` | Áttekintés (5 KPI), naptár (nap/hét/hónap), új/módosít/lemond, szünet, lezárás, szabadság, munkaidő, szolgáltatások, vendégek (keresés, helyesbítés, törlés), értesítések (szimulált), beállítások |
| `adatkezeles.html`, `impresszum.html`, `feltetelek.html` | **Tervezet helyei**, nem jogi szövegek |
| `koncepcio.html` | 3 kreatív irány és az indoklás |

## 2. Forrásfájlok

- `js/config.js` — **minden üzleti adat**: név, telefon, két lehetséges cím (`activeLocation`, `addressConfirmed`), kategóriák, árlista, bemutató munkarend.
- `js/core.js` — demó adattár + foglalási motor (szabad időpontok, ütközés, puffer, szünet, lezárás, előfutás).
- `js/booking.js`, `js/admin.js`, `js/site.js` (közös), `js/art.js` (rajzolt csendéletek).
- `css/bb.css` (designrendszer), `css/app.css` (foglalás + admin).
- `_forras/build.py` — a statikus oldalak generátora (közös fejléc/lábléc/ikonok). Futtatás: `python3 _forras/build.py`.

**Cím váltása:** `config.js` → `activeLocation: 'nagykata'` vagy `'budapest'`; ha megerősített: `addressConfirmed: true` (eltűnnek az „Egyeztetés alatt” jelölések).
**Árak:** `config.js` → `services`. A sávos árhoz `priceMax` + `priceNote`.

## 3. Kreatív irány — „Rituálé”

Csendes, editorial szalonhangulat; a lábápolás és a nyugalom áll középen, nem a műköröm.
Jelmotívum: **óralap** — minden kezelés időtartama vékony körív (árlista, kártyák, foglalás, összesítő).
Nyomdai vágójelek a fő képek körül, hajszálvonalak, sorszámozott fejezetek (01–03).

### Színek
| Token | Érték | Használat |
|---|---|---|
| `--paper` | #F7F4EF | alap |
| `--paper-2` / `--cream` | #F1EBE3 / #E8DFD5 | váltott szekció, képhely |
| `--ink` | #2B2725 | szöveg, elsődleges gomb, sötét blokk |
| `--gold` | #BE9A7B | vonalak, óralap, díszítés (szövegre nem — kontraszt) |
| `--gold-ink` | #85654C | arany színű szöveg (AA kontraszt) |
| `--sage` / `--sage-ink` | #929B89 / #5A6353 | kézápolás jelölése, állapotok |

### Tipográfia
- **Hanken Grotesk** változó (100–900), helyben hostolva — címek 650, alcímek 600, szöveg 400. Fraunces sehol.
- Mérsékelt méretek: H1 32–44 px, H2 26–34 px, törzs 16,5 px / 1,65.

### Térköz, rács
Konténer 1240 px + `clamp(20px, 4.2vw, 56px)` margó; szekciótávolság `clamp(76px, 9vw, 132px)`. Töréspontok: 1080 (mobilmenü + fix sáv), 980, 900, 820, 640, 520.

### Animációk
| Mi | Kiváltó | Leírás |
|---|---|---|
| Hero főcím | betöltés | soronként alulról felcsúszik (1,1 s, 0,12 s lépcső) |
| Képek | görgetés | `clip-path` fentről lefelé kinyílik (1,3 s) — a szülőt figyeli az observer |
| Szövegblokkok | görgetés | 18 px felúszás + áttűnés |
| Óralap | görgetés | körív 0-ról a perc-arányig rajzolódik |
| Gombok | hover | finom fénycsík áthalad |
| Képek | hover | 3,5% lassú nagyítás |
| Oldalváltás | belső link | 200 ms áttűnés |
| Foglalás lépések | lépésváltás | 14 px oldalirányú beúszás, lépcsőzve |
| Megerősítés | kész | arany kör körbefut, majd a pipa megrajzolódik |

`prefers-reduced-motion`: minden animáció kikapcsol, a tartalom azonnal látszik. Nincs scrolljacking, nincs blokkoló betöltő. Külső könyvtár nincs (GSAP / Three.js / WebGL nem kell és nincs benne).

### Képek
**Nincs stock és nincs AI-fotó.** Minden képhelyen programból rajzolt SVG-csendélet (`js/art.js`: lábfürdő, törölközők, lakkok, kövek, paraffin, kézápolás, sterilizáló tasak) — jelölve, hogy illusztráció. Csere saját fotóra: az elemhez `data-src="img/foto.jpg"`. A galéria minden eleme „Illusztráció” feliratot visel; demóképet referenciaként nem tüntet fel.

## 4. Foglalási logika (bemutató)

- Kezdési időpontok `slotStep` (30 p) lépésközzel; csak ha a kezelés belefér a nyitvatartásba.
- Ütközik, ha `[kezdés, vége + saját puffer)` metszi egy foglalás `[kezdés, vége + puffer)` sávját, ha szünetbe lóg, ha lezárt/szabadságos napra esik.
- Aznapra legkorábban `leadMinutes` (180 p) múlva; előre `horizonDays` (75) napig.
- Véglegesítés előtt újraellenőrzés (párhuzamos foglalás szimulálva → visszadob az időpontokhoz).
- Speciális lábápolás: online nem foglalható, telefonos panel.
- Adatok: név, e-mail, telefon; megjegyzés opcionális, egészségügyi adat kifejezetten nem kért. Adatkezelési elfogadás kötelező, marketing külön és alapból üres.

## 5. Tesztelés (Playwright, 2026.10.25.)

**51/51 automatikus ellenőrzés átment.** Túlfolyás 12 oldalon × 360 / 390 / 768 / 1440 px: nincs. Konzolhiba: nincs.

1. Mobil 360 és 390 px — megjelenés, fix sáv, mobilmenü (Esc is) ✔
2. Tablet 768 px ✔ (hero sorrend javítva: szöveg előre)
3. Desktop 1440 px ✔
4. Teljes foglalás billentyűzettel (naptár nyilakkal) ✔
5. Foglalt időpontok kizárása — a felkínált időpontok a motorral egyezve ütközésmentesek; közben foglalt időpont elutasítva ✔
6. Mind a 8 kezelés ára és időtartama a referencia szerint; sávos ár megjegyzéssel ✔
7. Módosítás (ugyanazzal az azonosítóval) és lemondás ✔
8. Admin: nap/hét/hónap nézet, új időpont, módosítás, lemondás, szünet (foglalásra nem tehető), szabadság, munkaidő ✔
9. Üres állapotok és hibák: űrlap-hibaösszesítő, hibás e-mail, betelt nap, üres naptár, nincs találat ✔
10. Billentyűzet: fókuszállapotok, galéria nyilak/Esc, modális fókuszcsapda, admin fül-nyilak ✔
11. Mobilmenü és fix foglalási sáv (a tartalmat nem takarja: alsó térköz) ✔
12. Konfiguráció: szolgáltatás ár/idő módosítása és címváltás azonnal megjelenik a nyilvános oldalon ✔

Közben javított hibák: a felfedő animáció miatt a képek láthatatlanok maradtak (observer javítva); 360 px-en 12 px túlfolyás a foglalásnál; a monogram két sorba tört; a sávos ár tördelődött; tableten a hero elvitte az első képernyőt; a „Vissza” gomb az 1. lépésen is látszott.

## 6. Élesítéshez szükséges backend

- Adatbázis (pl. PostgreSQL): `services`, `bookings`, `customers` (csak név/e-mail/telefon), `schedule`, `closures`, `breaks`, `notifications`, `audit_log`.
- **Atomi foglalás:** tranzakció + átfedést kizáró megkötés (pl. `EXCLUDE USING gist` időtartományra) vagy sorzár; a szabad időpontot a szerver számolja.
- Admin hitelesítés (jelszó + 2FA vagy magic link), szerepkörök; frontendben tárolt jelszó nem.
- Tranzakciós e-mail (visszaigazolás, .ics, módosítás, lemondás), időzített emlékeztető (pl. 24 órával előtte), sikertelen küldés naplózása és újrapróbálás.
- Egyedi, aláírt, lejáró módosítási/lemondási link (belépés nélkül).
- **Europe/Budapest** időzóna a szerveren; tárolás UTC-ben; óraátállítás napjainak tesztelése (márc./okt. utolsó vasárnap).
- Spam- és visszaélésvédelem: rate limit, honeypot vagy Turnstile, telefonszám-normalizálás.
- Naplózás, napi mentés, GDPR: törlés/helyesbítés naplózott folyamata, megőrzési idő.
- Galéria: képfeltöltés adminból, automatikus átméretezés (AVIF/WebP, `srcset`).
- SEO élesítéskor: `noindex` le, sitemap, kanonikus URL-ek, `BeautySalon` strukturált adat **csak a megerősített címmel**.

## 7. A tulajdonostól bekérendő

1. **Melyik a végleges cím** (Budapest XI., Bertalan Lajos u. 19. vagy Nagykáta, Dózsa György út 21.)? Parkolás, megközelítés.
2. Heti munkarend, szünetek, pufferidő kezelésenként, lemondási határidő, késés szabálya.
3. Végleges árlista (a mostani a Notino-profil referenciája), speciális lábápolás ára/időtartama.
4. Saját fotók: portré, szalon, munkafotók (pedikűr, manikűr, géllakk) — jogtisztán.
5. Hivatalos név, vállalkozási forma, adószám, székhely, e-mail-cím (impresszum, adatkezelés).
6. Jóváhagyás: bemutatkozó szöveg, érvényes kézápolás-árlista, becsült időtartamok, cukorbeteg vendégekre vonatkozó mondat; vendéghozzájárulás a fotókhoz; vektoros logó.
7. Fizetési módok. (Az ajándékutalvány-szekciót 2026.10.27-én levettük — nem ismert, hogy Beatrix árul-e ilyet.)
8. Közösségi profilok, ha vannak (nem találtunk ki egyet sem).

## 8. Megjegyzések

- A Notino-, JóSzaki- és Callux-oldalak ebből a munkakörnyezetből nem voltak elérhetők; minden adat a briefben megadott, onnan összegyűjtött értékekből származik.
- Technológia: a DAEKON látványterv-rendje szerint build nélküli HTML/CSS/JS (nem React/Tailwind) — gyors, függőség nélkül publikálható; az éles változat komponensei (Stepper, Calendar, SlotPicker, ServiceCard, Dial, AdminCalendar) egy az egyben átültethetők React + TypeScript alá.
