# Beatrix Nails & Pedikűr (Balogh Beatrix) — átadási jegyzék

Látványterv, 3. kör — 2026.10.27. (2. kör: 10.26., 1. kör: 10.25.)
Előnézet: `https://daekon-ship.github.io/daekon/latvanytervek/balogh-beatrix/` (noindex)

> **Bemutató.** A foglalás és az admin a böngésző helyi tárolójával (localStorage) működik.
> Nincs központi adatbázis, nem megy ki e-mail, nem jön létre valódi időpont.

---

## 0. 3. kör — Beatrix saját anyagai (2026.10.27.)

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
| `index.html` | Hero, értékek, 3 kezeléskategória, szűrhető árlista óralappal, Rólam, „A szalonban”, galéria (szűrés, nagyítás, teljes képernyő, lapozás, swipe), ajándékutalvány (bemutató), GYIK (8), kapcsolat, térkép-helyőrző |
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
7. Fizetési módok; ajándékutalványt árul-e (és milyen feltételekkel).
8. Közösségi profilok, ha vannak (nem találtunk ki egyet sem).

## 8. Megjegyzések

- A Notino-, JóSzaki- és Callux-oldalak ebből a munkakörnyezetből nem voltak elérhetők; minden adat a briefben megadott, onnan összegyűjtött értékekből származik.
- Technológia: a DAEKON látványterv-rendje szerint build nélküli HTML/CSS/JS (nem React/Tailwind) — gyors, függőség nélkül publikálható; az éles változat komponensei (Stepper, Calendar, SlotPicker, ServiceCard, Dial, AdminCalendar) egy az egyben átültethetők React + TypeScript alá.
