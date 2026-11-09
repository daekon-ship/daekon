# KIRÁLY Autószerviz – átadási állapot (2026-11-05)

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/kiraly-autoszerviz/
(noindex – keresőben nem jelenik meg, amíg nem élesítjük)

## Mi van kész
- Egyoldalas weboldal: nyitókép, szolgáltatások (3 szakterület + 8 lenyíló tétel), dízel, EGR-tisztítás, 3D futómű, miért minket, rólunk, értékelések, elérhetőség élő nyitvatartással, lábléc cégadatokkal.
- Végleges logó: **éjkék–arany** kombinált embléma (`arculat-kombi/VEGLEGES/2-…`; 2026-11-05-én az ügyfél erre váltott a fekete–pezsgőarany helyett). Fejlécben a valódi kerek logó pecsétként + KIRÁLY/AUTÓSZERVIZ felirat; görgetéskor kisebb lesz.
- Színek: #0E1B2C éjkék, #C9A14F arany, #F6F2EA krém; világos szekciókban #8A6A2C bronz kiemelés.
- Motion animációk (visszafogott), csökkentett mozgásnál kikapcsolnak.
- Megosztási kép (`img/og-kiraly.png`), favicon, telefonos ikon, strukturált adat (AutoRepair).
- Prémium névjegykártya a végleges logóval: `nyomdai/vegleges-ejkek/` – nyomdai PDF (90×50 mm + 3 mm kifutó, előlap + hátlap), mindkét oldal éjkék; előlap: logó keret nélkül; hátlap: bal oldali panel nagy logóval, arany választóvonal, jobbra a névjegy; bemutató PNG-k. Forrás: `_forras/nevjegy_vegleges.py`.
- Logócsomag az ügyfélnek: `arculat-kombi/kiraly-vegleges-logo-ejkek-csomag.zip` (a fekete változat csomagja is megmaradt).
- Ellenőrizve 390 / 1024 / 1200 / 1440 px szélességen: nincs vízszintes görgetés, nincs konzolhiba, nincs 404, minden belső link él, minden képnek van alt szövege.

## Élesítés (FTP)
1. Töltsd ki: `_forras/eles_adatok.json` – `domain` (https://…), `tarhely_nev`, `tarhely_szekhely`, `tarhely_email`.
2. Futtasd: `python3 _forras/eles_csomag.py` → `_eles/` + `kiraly-autoszerviz-eles.zip` (gyökerében `index.html`). A szkript kiírja a státuszt: üres mezőnél „ELESITESRE-VAR”, és megáll, ha látványterv-maradványt (github.io, /latvanytervek/, demo-sáv, noindex) talál.
3. Az éles csomagban: nincs „Látványterv · DAEKON” sáv (HTML és CSS is ki), `index, follow`, canonical, `og:url`/`og:image` abszolút, sitemap.xml, robots.txt (Allow: /), JSON-LD `url`/`image`/`logo` a domainre. A lábléc „Weboldal: DAEKON” kreditje marad.
4. A ZIP tartalma közvetlenül a webgyökérbe megy. A két ZIP (`_eles/`, `kiraly-autoszerviz-eles.zip`) nincs a repóban (.gitignore), mert helykitöltő domaint tartalmazhat.
- Animáció hibatűrés: ha a Motion nem tölt be, a kiraly.js nem fut, vagy indulás közben hibát dob, a tartalom animáció nélkül azonnal / legkésőbb 2,5 mp után látszik.
- Jogi aloldalak: `impresszum.html` (nyilvántartó cégbíróság: Székesfehérvári Törvényszék Cégbírósága – a 07-es cégjegyzékszám-előtagból), `adatkezeles.html` (az oldal nem gyűjt adatot, nincs süti/űrlap).
- Kontraszt ellenőrizve (WCAG AA): halvány szöveg #8291A6, bronz kiemelés #7C5E24.

## Élesítés előtt az ügyféllel egyeztetni
- Valódi műhelyfotók (ha szeretne képeket – jelenleg szándékosan nincs kép).
- Turul Auto minősítések (2021–2026) és a 4,5 / 44 értékelés feltüntetése – Turul felhasználási engedély.
- Az impresszum és az adatkezelési tájékoztató átnézése (tárhelyszolgáltató adatai).
- Domain, tárhely, Google Cégprofil link; a `noindex` levétele élesítéskor.

---

## Korábbi körök naplója
# KIRÁLY Autószerviz – átadás (2. kör, 2026.11.03.)

## 10. kör – végleges logók (`arculat-vegso/`)
Három kidolgozott irány: 1 kör alakú szervizembléma (éjkék–arany), 2 precíziós műszer (grafit–acél–narancs; a dugattyús pajzs kikerült), 3 szárnyas kormány kulcs-szárnyakkal (petrol–réz). Embléma, vízszintes, kis méretű vízszintes (város nélkül), kompakt, ikon, egyszínű – SVG + átlátszó PNG; mérettesztek és fejlécpróbák a `probak/` mappákban; ügyfélbemutató: `arculat-vegso/kiraly-arculati-javaslat.png`. Generátor: `_forras/logok_vegso.py`, export: `_forras/vegso_export.py`.

## 9. kör – 6 logó
Végleges sor: 1 Dugattyúkorona, 2 Kulcskorona, 3 Gyújtógyertya, 4 Autóemelő, 5 Mérőóra (a v2 jele a közös felirattal), 6 **Acél-anya koronával** (saját javaslat: hatlapú csavaranya – Dunaújváros, az acélváros –, a furat helyén kivágott korona, narancs pánttal). Mindegyikhez névjegy. Online kutatás: a nyilvános adatlapok (Turul Auto, europethrob, nyitva.hu) nem adnak új tényt; a Facebook-oldal robotok elől zárt.

## 8. kör – arculat-v2 (három kiforrott koncepció, külön mappa)
`arculat-v2/` – az eredeti `arculat/` érintetlen. Generátor: `_forras/logok_v2.py`, exportok: `_forras/v2_export.py`. Bemutató: `arculat-v2/index.html`, ügyfélkép: `arculat-v2/kiraly-logokoncepciok-osszehasonlitas.png`.
- 01 PRECISION TOOLS (fő ajánlás): K-monogram villáskulcsból (nyél = szár, nyitott pofa = két kar), narancs csavaranya a pofában.
- 02 ENGINEERING: egy dugattyú hajtókarral, narancs fej, gyűrűhornyok, csapszeg.
- 03 TECHNICAL PRECISION: mérőóra, tüskék nélkül, 8 jeles skála, narancs mutató.
- Tipográfia: KIRÁLY (Archivo 720, 112% szél., +3,5% betűköz) / AUTÓSZERVIZ (Manrope 800, 36%) / – DUNAÚJVÁROS (Manrope 650, 25%, narancs vonással).
- Mindegyikhez: logó sötét/világos háttérre, jel, kompakt négyzetes, fekete és fehér mono – SVG (valódi vektor, görbékké alakított betűk) + átlátszó PNG (2400/1600 px) + weboldal- és mobilfejléc-bemutató.
- Ellenőrzés: 30 SVG XML-validálva és böngészőben betöltve (0 hiba); PNG-k átlátszósága ellenőrizve; jelek 24/32 px-en (a mérőóra skálája ezért 12-ről 8 jelre egyszerűsítve); logó 160 px széles fejlécben: KIRÁLY és AUTÓSZERVIZ olvasható, a DUNAÚJVÁROS ott már nagyon kicsi (kis méretre a jel vagy a kompakt változat ajánlott).

## 7. kör – új 4. és 5. logó, új névjegyek
4. **Rugóstag-király** – sakk-király futómű-rugóstagból (kereszt, felső tartó, narancs spirálrugó, lengéscsillapító, kétlépcsős talp). 5. **Műszer-korona** – fordulatszámmérő íve, a 3 fő skálajel koronacsúcs, narancs mutató. (A fogaskerék-korona és a jelvény kikerült.)
Névjegy újratervezve: előlap sötét, narancs él a bal szélen, nagy tónusos jel kifutóval, logó balra; hátlap világos rács – név, beosztás, jel-csempe, vonal, ikonos elérhetőségek két oszlopban, alul szolgáltatássor.

## 6. kör – 5 logó + 5 névjegy, a többi kivéve
Új 5. logó: **Jelvény** (letört sarkú keret, KIRÁLY + narancs AUTÓSZERVIZ sáv, DUNAÚJVÁROS · 2008 ÓTA, tetején dugattyú-korona). Az ügyfél kérésére kikerült az újsághirdetés, a Facebook-képek és a mono/egyéb változatok; a `logo.html` csak az 5 logót és az 5 névjegykártyát mutatja. Weboldalon `?logo=1..5`.

## 5. kör – logók csiszolása
Kétszínű jelek (acélszürke hajtókarok / oldalsó kulcsok / a gyertya fémrészei), lekerekített talpak. Új, nagyobb felirat: KIRÁLY / AUTÓSZERVIZ teljes szélességben / DUNAÚJVÁROS két vonal között. Elválasztó vonal elhagyva.

## 4. kör – letisztítás
Az ügyfél-oldali visszajelzés: „túl AI, értelmetlen animációk”. Kikerült: pontrács-háttér, fénycsík, kódolt számok, mágneses gombok, fényfolt, kurzorkövető kártyafény, futó szolgáltatássáv, forgó felirat, filmszemcse, szavankénti elmosódás, felszámlálás, a hero átfedő fotóhelye. Marad (Motion): a 3D futómű kerekeinek beállása, az előtte/utána kapcsoló, a lenyíló sorok és egy finom beúszás. Nyugodtabb felületek, könnyebb címsúly, több levegő, visszafogott demó-sáv.

## 3. kör (2026.11.03.) – autós jelképek
Az ügyfél-oldali visszajelzés: „ne csak egy K legyen, legyen autószereléshez kapcsolódó”. Új logók, mind a város nevével (alcím: AUTÓSZERVIZ · DUNAÚJVÁROS):
1. **Dugattyúkorona** (javaslat) – három dugattyú hajtókarral, a középső magasabb, narancs fejjel → korona.
2. **Kulcskorona** – három villáskulcs legyezőben, a középső narancs → korona.
3. **Gyújtógyertya** – valós arányú gyertya narancs szikrával.
4. **Fogaskerék-korona** (arany–fekete) – félkör fogaskerék hét foggal, a középső a legmagasabb (korona), hatlap agyfurat, talpsáv. (Az ügyfél-oldali kérésre a kerék-embléma helyett.)
Névjegyek, hirdetések, Facebook-képek, ZIP, logóválasztó és a weboldal fejléce frissítve.

## 2. kör – mi változott
- **Logók újratervezve:** egyszerűbb, prémiumabb irány – vékonyabb vonalak, Archivo 540–620 súly (a korábbi 800–900 helyett), levegős betűköz. 1 Tengely (K-monogram + gömbcsukló), 2 Ékezet (szóvédjegy, narancs ékezetvágás), 3 Pecsét (kör alakú embléma körbefutó felirattal), 4 Csavaranya (hatszög + K, arany #F2B705–fekete). Profilképek finom fényudvarral, borítók új elrendezéssel. Névjegy, hirdetés, ZIP újragenerálva.
- ~~Weboldal – React Bits-mintájú effektek~~ (a 4. körben kivéve) (statikus oldal, ezért saját, könnyű kód a komponensek mintájára, Motionnel): Dot Grid + Grid Scan (egérre reagáló pontrács, pásztázó fény a heróban, canvas, láthatóság szerint szünetel), Shiny Text (a hero kiemelt sora, a szöveg mindig látható), Decrypted Text (a mért értékek „kódolva” pörögnek, majd beállnak), Spotlight Card / Magic Bento (kurzorkövető fény és szegély a kártyákon), Glare Hover (fő gombok), Magnet (CTA-k, csak egérrel), Blur Text (szekciócímek szavanként élesednek), Count Up (értékelés), Scroll Velocity (görgetésre gyorsuló szolgáltatássáv), Circular Text (forgó felirat a Rólunk képhelyen), Noise (5%-os filmszemcse). Mind kikapcsol `prefers-reduced-motion` esetén.
- sitereel.ai: promptgyűjtemény – onnan csak a sötét, filmszerű hangulat az inspiráció.


Díjmentes, kötelezettségmentes DAEKON-bemutató. Nem éles, `noindex`, nem gyűjt adatot, nincs űrlap.

- Weboldal-látványterv: `index.html` (logóváltozat: `index.html?logo=1..4`)
- Logóválasztó az ügyfélnek: `logo.html` (4 koncepció + Facebook-képek + névjegy + hirdetés, letöltésekkel)
- Minden fájl egyben: `kiraly-arculat.zip`

## Ellenőrzött tények és források

| Adat | Érték | Forrás |
|---|---|---|
| Cégnév | KIRÁLY Autószervíz Kft. | brief, cégadatok |
| Ügyvezető | Király István | brief |
| Telefon | +36 20 585 3234 | ügyfél névjegye + hirdetése, europethrob |
| E-mail | kiralyautoszervizkft@gmail.com | ügyfél névjegye, e-mailje |
| Adószám / cégjegyzékszám | 14589535-2-07 / 07-09-015684 | brief |
| Alapítás | 2008. 12. 18. | brief |
| Nyitvatartás | H–P 8–12 és 13–17 (ebédszünet igazolt) | ügyfél saját hirdetése + europethrob |
| Szolgáltatások | a brief 11 tétele | ügyfél névjegye, europethrob, Turul Auto |
| **Új** szolgáltatások | dióőrleményes szívósor- és EGR-tisztítás; Ford garanciális időn belüli általános szervizelés gyári Ford alkatrészekkel, online szervizkönyvvel | ügyfél saját újsághirdetése (2026.11.03-i e-mail) |
| Értékelés | 4,5 / 5, 44 értékelés | Turul Auto adatlap (2026.11.) |

## Egyeztetendő az ügyféllel

1. **Cím: 25 vagy 27/C?** A nyilvános adatlapok (nyitva.hu, europethrob, Turul Auto) a műhelyt a **25.** szám alá teszik; az ügyfél saját névjegye és hirdetése (szolgáltatás helye!) **27/C**-t ír. Minden anyagban 27/C áll; az „Útvonaltervezés” cégnévre keres, így a Google-adatlap tűjéhez visz. Egy szóval cserélhető.
2. Turul Auto minősítések (2026 ezüst, 2025 ezüst, 2024 bronz, 2023 ezüst, 2021 bronz) – csak jóváhagyással maradhatnak („Felhasználás egyeztetendő” címke).
3. Google-értékelésszám (a brief 46-ot említ) – csak link, szám nélkül.
4. Ünnepnapi nyitvatartás, Facebook-oldal címe.
5. Saját fotók: műhelyépület, bejárat, szerelőállás, 3D futóműállító, dízelmunka, ügyvezető. A fotóhelyek jelölve (hero, Rólunk).
6. Impresszum és adatkezelési tájékoztató – helyük megtervezve, tartalom még nincs.

## Három irány (az erősebb lett kiválasztva)

1. **Mérőlap (KIVÁLASZTVA)** – grafit + narancs, mérnöki rajzlap: kamerás 3D futóműmérés a heróban, porlasztó-rajz a dízelnél, előtte/utána futómű-szemléltető. A három üzleti prioritást rajzban mutatja meg – fotó nélkül is hiteles, AI-kép nélkül.
2. Műhelytábla – meleg, világos, zománctábla-hangulat; barátságos, de a dízel/futómű szakértelmet gyengébben adja át.
3. Sárga–fekete – az ügyfél mostani világa; harsány, a weben könnyen olcsóvá válik. Ezért csak logóirányként (4.) él, ami a weboldal kiemelő színét is sárgára váltja.

## Logók (`arculat/logo-1..4/`)

Minden betű görbe (nincs betűtípus-függés). Generátor: `_forras/logok.py`, PNG: `_forras/render.py osszes`.
Fájlok: `fo` (háttérrel), `vilagos`/`sotet` (átlátszó), `sotet-hatterrel`, `mono`, `jel`, `profilkep` (1080²), `borito` (1640×624 Facebook).

1. **Tengely** (javaslat) – K-monogram, narancs gömbcsukló; Archivo Expanded 800.
2. **Szögmérés** – az Á ékezete mért szög (vonalzó + ív).
3. **Műhelytábla** – letört sarkú, szegecselt adattábla, „Dunaújváros · 2008 óta”.
4. **Ikercsík** – döntött, ikercsíkos K, sárga–fekete.

## Nyomdai anyagok (`nyomdai/logo-1..4/`) – `_forras/nyomdai.py`

- Névjegykártya 90×50 mm + 3 mm kifutó, 2 oldal, PDF (beágyazott TrueType betűk) + 300 dpi PNG.
- Újsághirdetés 95×125 mm PDF + 300 dpi PNG. A Szuperinfó pontos modulméretét kérni kell, a sablon méretre igazítható. RGB-PDF: a nyomda/lap konvertálja CMYK-ra.

## Design-rendszer

- Színek: háttér `#11161C`, felület `#1C242D`, mély `#0B0F14`, szöveg `#F4F5F6`, másodlagos `#A6B0B8`, kiemelő `#F26732` (4. logónál `#FFC20E`), világos szekció `#F4F5F2`.
- Betűk (helyben, OFL): Archivo változó (wght 500–900, wdth 100–125; címek 112%-os szélességgel, 760), Manrope változó (szöveg). Fraunces nincs.
- Méretek mérsékeltek: H1 31–50 px, H2 25–38 px, törzs 16,5 px. Konténer 1200 px, oldalmargó 16–40 px, szekciótávolság 76–132 px.
- Komponensek: ragadós fejléc + mobil teljes képernyős menü; bizalmi sáv; kiemelt rács (7+5 oszlop); lenyíló szolgáltatáslista (8 sor); dízel tünetrács + lépések; futómű-kapcsoló (előtte/utána); érem-sor; nyitvatartás-táblázat élő „most nyitva” jelzéssel (budapesti idő); mobil alsó hívássáv (a body alsó paddinggel kompenzál, nem takar).

## Mozgás (Motion 11.18.2, helyben: `js/vendor/`)

- Betöltés: a hero szövege és gombjai azonnal láthatók. 0,5 s után a mérőlapon a két első kerék 1,6 s alatt „beáll” (−4°/+3° → 0°), az értékek lefutnak, a státusz zöldre vált.
- Görgetés: `[data-be]` elemek 16 px-es felúszással jelennek meg (Motion `inView`); a futómű-kártya láthatóvá válva 1,1 s múlva magától „beállítás utánra” vált (ha a látogató még nem kattintott).
- Interakció: lenyíló sorok magasság-animációval; mobilmenü elemei lépcsőzetesen.
- Folyamatos: porlasztási kép szaggatott vonalai.
- SVG-elemeken a Motion értéket animál, a stílust (`rotate`, `opacity`) a kód írja – így minden böngészőben megbízható.
- `prefers-reduced-motion`: minden azonnal végállapotban; ha a Motion nem tölt be 2,5 s-on belül, semmi sem marad rejtve.
- GSAP / Three.js / WebGL / React Bits / HorizonX nincs és nem kell.

## Tesztelés (Playwright, Chromium)

- 1440, 768, 390, 360 px: nincs vízszintes túlcsordulás, nincs konzolhiba, minden `data-be` elem megjelenik (`_forras/teszt.py`).
- Kipróbálva: lenyíló sorok nyitás/zárás, futómű-kapcsoló, hero-animáció végállapota, mobilmenü nyitás + horgony + zárás, `?logo=4` sárga változat, `logo.html` mind a 4 méreten.
- Nem tesztelve valódi eszközön: Samsung Internet, Facebook/Messenger beépített böngésző, iOS Safari.
- Linkek: `tel:+36205853234`, `mailto:`, Google Térkép keresés/útvonal cégnévre.

## 2026-11-04 – végleges logó a látványtervben
- Az ügyfél a fekete–pezsgőarany kombinált emblémát (VEGLEGES/1) választotta; bekerült a látványtervbe.
- Webes változatok: `arculat-kombi/WEB/` (`jel.svg` felirat nélküli jel, kétszínű gyertyával; `fejlec-sotet.svg` jel + KIRÁLY / AUTÓSZERVIZ; `emblema.svg` a teljes logó a láblécben). Forrás: `_forras/web_logo.py`.
- Az oldal színei a logóhoz igazítva: fekete #161618 / #0B0B0C, pezsgőarany #D8BE84, krém #F5F1E8; világos szekciókban sötétebb bronz kiemelés (#8C6D32) az olvashatóságért.
- A régi `?logo=1..6` logóváltó kikerült az oldalból (a logo.html megmaradt).

## 2026-11-04 – prémium mozgásréteg (Motion)
- Hero: a címsorok alulról kicsúsznak, a többi elem lépcsőzetesen érkezik, a 3D mérőlap felülről lefelé tárul fel; asztalon görgetéskor finom mélység (parallax).
- Fejléc: görgetéskor sötétebb és árnyékot kap; alján vékony arany görgetésjelző vonal.
- Belépők: az egyszerre beérkező elemek lépcsőzetesen jönnek; a rajzlapok (porlasztó, futómű, fotóhely) függönyszerűen nyílnak; a címkék vonala kirajzolódik.
- A porlasztó műszaki rajza „megrajzolódik”, amikor a nézetbe ér. Címkék a rajzon belülre igazítva (eddig levágódtak).
- Gombok: finom fényvillanás hoverre, nyomásra enyhe besüllyedés; szolgáltatás-sorok felett arany vonal; kártyák enyhén megemelkednek.
- Nagyon finom szemcsés textúra az egész oldalon; a Rólunk fotóhelyén halvány pecsét-vízjel.
- Csökkentett mozgás beállításnál minden animáció kikapcsol.

## 2026-11-04 – szemléltető képek ki
- Kérésre kikerült: Rólunk fotóhely, futómű „Szemléltetés” (előtte/utána), porlasztó rajz. A dízel, futómű és rólunk szekció kétoszlopos: bal oldalt cím (asztalon rögzül görgetéskor), jobb oldalt tartalom.

## 2026-11-04 – további prémium csiszolás
- Hero: a futóműmérés-rajz helyett a végleges embléma, veretes plakettként (halvány arany fény, kettős gyűrű, egyszeri fényvillanás betöltéskor, finom parallax).
- Fém hatású arany gombok; kiemelt kártyákon arany sarokvonal hoverre; a dízel kártyán a porlasztórajz helyett halvány jel-vízjel.

## 2026-11-04 – új fejléc-logó
- Fejlécben tömör arany „érme” (sötét kulcsok + gyertya) + vékony arany elválasztó + KIRÁLY / AUTÓSZERVIZ. Forrás: `_forras/fejlec_logo.py`, fájl: `arculat-kombi/WEB/fejlec-erme-vonallal.svg`; favicon: `jel-erme.svg`.

## 2026-11-04 – prémiumabb szövegek
- Az összes szekció szövege átírva magabiztosabb, letisztultabb hangra (valótlan állítás, kitalált szám nélkül). Új főcím: „Precíz autójavítás. Becsülettel, 2008 óta.”

## 2026-11-04 – hero nagy logó ki
- Kérésre a nyitóképről kikerült a nagy embléma; a hero csak szöveg. A logó a fejlécben és a láblécben marad.

- 2026-11-05: fejléc-logó a fejlécen belül, állandó méretben (gépen 56 px, telefonon 46 px), nem lóg le és nem változik görgetéskor.

- 2026-11-05: kompaktabb oldal (~30%-kal rövidebb): kiemelt kártyák, bizalmi sáv, EGR-doboz, futómű-fogalmak és Rólunk cégadat-sor ki (a cégadat a láblécben van); kisebb szekció-térközök; dízel lépések egy sorban.

- 2026-11-05: logó javítva – a KIRÁLY felirat Á ékezete nem ér a gyűrűhöz (felirat kicsit beljebb/kisebb, éjkék változatban a vékony gyűrű kijjebb). Minden PNG, webes fájl, névjegy, megosztási kép újragenerálva. Export: `_forras/vegleges_export.py`.
- 2026-11-05: KIRÁLY körfelirat finomítva (Archivo normál szélesség, 800-as vastagság, L–Y alávágás) – a Y már nem lóg ki furcsán. `arc_text` kapott `kern` paramétert.
- 2026-11-05: több levegő a KIRÁLY körül: belső gyűrű r63, felirat 17,5-ös méret r76,5-ön (mindkét gyűrűtől egyenlő távolság), alsó körfelirat r77,5; a kulcs+gyertya jel 88%-ra kicsinyítve, hogy a belső körön belül maradjon.
- 2026-11-05: névjegy betűi a logóhoz igazítva: név nagybetűs Archivo 800, ritkítva (mint a KIRÁLY); beosztás Manrope 800 ritkítva (mint az alsó körfelirat); telefonszám Archivo 800.
- 2026-11-05: a névjegy hátlapján minden szöveg a logó betűtípusával (Archivo) szedve.
- 2026-11-07: névjegy előlapja: balra a weboldal 9 szolgáltatása (vizsgafelkészítés, EGR, Ford garanciális is), jobbra logópanel – a hátlap tükörképe.
- 2026-11-07: logó csak a szolgáltatások oldalán; az elérhetőségek oldalán logó helyett KIRÁLY / AUTÓSZERVIZ felirat, név, arany függőleges vonal, elérhetőségek.
- 2026-11-07: céges (általános) névjegy is: név és beosztás nélkül, KIRÁLY / AUTÓSZERVIZ + „Dunaújváros · 2008 óta”. Fájlok: `nevjegykartya-ejkek-ceges-nyomdai-96x56mm.pdf`, `nevjegy-hatlap-ceges.png`, `nevjegy-bemutato-ceges.png`.
- 2026-11-09: műhelytábla 80×55 cm (fekvő), 3 mm kifutóval: `nyomdai/tabla/` – nyomdai PDF (806×556 mm), előnézet, falra illesztett próba az ügyfél fotóján. Tartalom a régi tábla szerint, de a házszám az ügyfél kérésére (2026-11-09) Budai Nagy Antal u. 27/C;, 20/585-3234, H–P 8–17, Szo–V zárva. Forrás: `_forras/tabla.py`.
- 2026-11-09: tábla – adatok jóval nagyobbak (telefon 50 mm, cím és nyitvatartás 27–28 mm betűméret), logó 26 cm.
- 2026-11-09: tábla két új iránya: A – arany telefonsáv (alul teljes szélességű arany sáv a telefonszámmal), B – krém–éjkék (világos mező nagy sötét betűkkel, jobbra éjkék mező a logóval). `_forras/tabla_v2.py`.
- 2026-11-09: VÉGLEGES tábla: az első (sötétkék, keretes) irány, telefonszám 28 mm, ugyanakkora, mint a cím és a nyitvatartás; JPG: `kiraly-tabla-80x55cm-nyomdai-250dpi.jpg` (8000 px). Fájl: `nyomdai/tabla/kiraly-tabla-80x55cm-nyomdai-806x556mm.pdf`. Az A/B irány tartaléknak megmaradt.
