# MultiCont Center Kft. – weboldal-látványterv · átadás (15. kör)

Élő látványterv: https://daekon-ship.github.io/daekon/latvanytervek/multicont/
Előző változat biztonsági másolata: `../multicont-v11/` (11. kör), a 12–13. kör a git-történetben.

## 1. Elkészült oldalak (22 HTML)

**Nyilvános oldalak (15 + 6 szolgáltatás)**

| Oldal | Fájl | Tartalom |
|---|---|---|
| Kezdőlap | `index.html` | Klasszikus háromoszlopos tagolás közvetlenül a felső menüsor alatt (Marcsi kérése, rlb.hu mintájára). Bal: aktuális adóhírek – kiemelve a KATA-változások –, határidők, jogszabályi idővonal, adózási témák, hivatalos oldalak · közép: nyitó blokk, a név jelentése (multi/cont/center), nyitottság új tevékenységekre, szolgáltatások, partnerközpont (partnerlinkek, ajánlói rendszer, kuponajánlat), szemlélet, szakmai vezető · jobb: kalkulátor, dokumentumtár, kuponajánlat, partnerek, kapcsolat |
| Rólunk | `rolunk.html` | Történet, Horváth Mária szakmai útja, a név és a logó jelentése, munkamód, cégadatok |
| Szolgáltatások | `szolgaltatasok.html` | 6 szolgáltatás váltakozó elrendezésben |
| Szolgáltatás részletező ×6 | `szolgaltatas-*.html` | Könyvelés, Bérszámfejtés, Adózási támogatás, NAV- és TB-képviselet, Online könyvelés, Végelszámolás: leírás, mit tartalmaz, kinek ajánljuk, GYIK, CTA, kapcsolódó cikk |
| Tudástár | `tudastar.html` | 11 téma, keresés, témaszűrő, rendezés, kiemelt cikk |
| Cikk részletező | `cikk.html?id=…` | Közzététel, ellenőrzés dátuma, hatályossági időszak, források, megosztás, olvasó mód, kapcsolódó cikkek |
| Kalkulátorok | `kalkulatorok.html#…` | Bruttó→nettó, nettó→bruttó, munkáltatói költség, ÁFA, KATA 2026, bevétel–kiadás, költségtervező, adózási formák (demo) |
| Dokumentumtár | `dokumentumtar.html` | Kategóriák, keresés, verziószám, dátum, archivált változatok |
| Partnereink | `partnerek.html` | Partnerlista, ajánlatok/kuponok lejárattal, ajánlói rendszer, 3 űrlap (ajánlatkérés, partner ajánlása, jelentkezés) |
| Partner részletező | `partner.html?id=…` | Bemutatkozás, szolgáltatások, „miért ajánljuk”, kuponok, ajánlatkérés |
| Kapcsolat | `kapcsolat.html` | Elérhetőségek, térkép (csak hozzájárulással), űrlap |

**Kezelőfelület (látványterv):** `admin-belepes.html` (belépés + kétlépcsős kód), `admin.html` (áttekintés + 5 tervezett modul leírása), `admin-cikkek.html`, `admin-dokumentumok.html`, `admin-partnerek.html`.

`hirek.html` → átirányít a Tudástárba (régi linkek miatt).

## 2. Designrendszer röviden

- **Színek (15. kör: fehérebb, kékebb):** fehér alap, kék felső sáv, kék oszlopfejlécek és kiemelések, világoskék lábléc. Mélykék `#16365F` (címek, szöveg) · Corporate Blue `#2764BD` (domináns: gombok, linkek, aktív állapot) · Soft Sky `#EAF3FC` · Mint Teal `#28B6A4` (másodlagos; szövegben `#13796D` a kontraszt miatt) · Warm Accent `#F3B85B` (csak célzottan: kiemelt szolgáltatás, kupon, logó közepe; szövegben `#8A5B12`) · Off White `#F8FAFD` · Dark Text `#202B38`. A három márkaszín együtt csak a logóban, a lábléc-sávban és a MULTI/CONT/CENTER hármasnál jelenik meg.
- **Betű:** Plus Jakarta Sans (OFL, helyben, magyar ékezetekkel szűkítve, `fonts/plusjakarta.woff`). H1 legfeljebb 46 px, H2 legfeljebb 32 px, törzsszöveg 16,5 px.
- **Logó (Marcsi kérése: 3 szín):** három elem, három szín – kék sarok = MULTI, türkiz sarok = CONT, arany középpont = CENTER. A két nyitott sarok a növekedést és az új kapcsolatokat jelzi. Változatok: `logo.svg` (világos), `logo-feher.svg` (sötét háttérre), `jel.svg` (favicon, önálló jel). Szerkeszthető SVG.
- **Rács:** 1280 px tartalomszélesség; kezdőlap 288 / rugalmas / 320 px oszlopok.
- **Elemek:** kártyák 10 px sarokkal, vékony keret, árnyék csak hoverre; címkék állapotjelzésre: kék = téma, türkiz = működik/érvényes, narancs = minta/demo/tervezet.
- **Mozgás:** csak CSS: hero vonalrajzolás, fejléc-háttérváltás görgetéskor, finom hover. Csökkentett mozgás beállításnál kikapcsol. Nincs parallax, 3D, üvegeffekt.
- **Reszponzív:** 360, 390, 430, 768, 1024, 1366, 1920 px-en tesztelve, vízszintes görgetés nélkül. Mobilon a kezdőlap sorrendje: középső tartalom → hírek → eszközök/partnerek. Alsó rögzített hívás/üzenet sáv.

## 3. Megvalósított interakciók (működnek)

- Ragadós fejléc háttérváltással, lenyíló almenük (egér, billentyűzet, Esc), mobil lenyíló menü.
- Kalkulátorok valódi számítással és „Hogyan számoltunk?” levezetéssel (SZJA 15%, TB 18,5%, szocho 13%, ÁFA 27/18/5%, KATA havi 50 000 Ft + 18 M Ft időarányos határ felett 40%). A fülek URL-ből linkelhetők.
- Költségtervező: sorok hozzáadása, törlése, havi/éves összeg (a böngésző munkamenetében megmarad).
- Tudástár: keresés ékezet nélkül is, témaszűrő, rendezés, URL-ben megosztható szűrés; cikk: link másolása, e-mail/Facebook/LinkedIn megosztás, olvasó mód.
- Dokumentumtár: kategóriák Marcsi szavaival (Formanyomtatványok, Szakmai anyagok, Hivatalos online felületek), keresés, archivált változatok.
- Határidők: a lejártakat automatikusan elrejti; kuponok: a lejártakat és a jóváhagyatlanokat nem mutatja; kuponkód másolása.
- Ajánlói kód: `kapcsolat.html?ajanlo=KÓD` → megjegyzi a munkamenetre és kitölti minden űrlapon. A partner oldaláról az ajánlatkérő űrlap előre kiválasztja a partnert.
- Űrlapok: mezőszintű ellenőrzés, rejtett csapdamező és időzítés-ellenőrzés. Küldéskor a levelezőprogram nyílik meg a kész üzenettel; az oldal **nem állítja**, hogy az üzenet elment.
- Süti-beállítások: a Google Térkép csak hozzájárulás vagy gombnyomás után töltődik be.
- Kezelőfelület: belépési folyamat (bemutató), cikkszerkesztő élő előnézettel és kötelező forrással, dokumentumfeltöltés verzióval és „nyilvános, jóváhagyott” megerősítéssel, új verziónál a régi archiválása, partner- és kuponjóváhagyási sor, kupon létrehozása lejárat-ellenőrzéssel. Minden csak a böngészőben él, nem ment el semmit – ezt a felület végig jelzi.
- SEO: oldalankénti cím és leírás, OG-adatok és megosztási kép (`og.png`), canonical, `sitemap.xml`, JSON-LD (AccountingService) csak ellenőrzött adatokkal. A látványterv `noindex` – élesítéskor törlendő (a `robots.txt` is).

## 4. Backendfejlesztést igénylő funkciók

1. **Kezelőfelület hitelesítése:** szerveroldali belépés, kétlépcsős azonosítás, szerepkörök (admin/szerkesztő), munkamenet-kezelés, naplózás. A mostani belépés csak a folyamatot mutatja.
2. **Tartalomtárolás:** cikkek, dokumentumok, partnerek, ajánlatok adatbázisban (a `tartalom.js` szerkezete a séma alapja); piszkozat/közzététel, verziótörténet.
3. **Fájlfeltöltés:** PDF-ellenőrzés, méretkorlát, vírusellenőrzés, biztonságos tárolás; csak nyilvános anyag. Bizalmas ügyféliratokhoz **külön** rendszer kell.
4. **Űrlapok szerveroldali küldése:** e-mail-továbbítás, spamszűrés (sebességkorlát, szükség szerint captcha), tárolás a „Megkeresések” modulban, adatmegőrzési idő.
5. **Ajánlói rendszer:** kódgenerálás, ajánlott érdeklődők nyilvántartása, jóváhagyás, statisztika.
6. **Kuponok:** lejárat szerveroldali kezelése, felhasználás követése (ha kell).
7. **Kalkulátor-kulcsok** adminból szerkeszthetően, hatálybalépési dátummal; az „adózási formák összehasonlítása” könyvelői ellenőrzés után élesíthető.
8. **Határidő-naptár** frissítése (évente vagy hivatalos forrásból).

## 5. Közzététel előtt ellenőrizendő adatok

- Cégadatok: adószám (25378669-2-13), cégjegyzékszám (13-09-177232), alapítás (2015. 09. 25.), **székhely** (a 2040 Budaörs, Meredek u. 2. iroda vagy székhely is?), képviselő, nyilvántartó bíróság, tárhelyszolgáltató.
- Horváth Mária végzettségei (mérlegképes könyvelő, adótanácsadó, TB- és bérügyintéző), a „30 év” és az „5 év cafeteria-tanácsadás”, a felelősségbiztosítás megléte.
- A szolgáltatáslista (különösen NAV- és TB-képviselet, végelszámolás) és a részletező oldalak „Mit tartalmaz?” pontjai.
- Az idézet szövege („Megbízható, rugalmas, magas színvonalú szolgáltatást nyújtok kisvállalkozók részére.”).
- Saját fotó Horváth Máriáról (helye jelölve; kitalált portré nincs).
- Valódi partnerek, ajánlatok, kuponkódok – most mind **minta**.
- Ügyféladatlap (v0.9, minta) jóváhagyása; adatkezelési tájékoztató, impresszum, süti-tájékoztató végleges szövege.
- Szakmai cikkek: a 2027-es KATA-tervezet státusza (elfogadták-e), a határidők frissítése; minden cikk forrása és ellenőrzési dátuma.

## 6. Fájlszerkezet

- `_forras/build.py` – generátor (`common.py`, `p_home.py`, `p_svc.py`, `p_content.py`, `p_admin.py`). Futtatás: `python3 _forras/build.py`.
- `tartalom.js` – minden változó tartalom (CMS-adatszerkezet, közzétételi folyamat leírásával).
- `mc.css`, `mc.js` – nyilvános oldalak; `admin.css`, `admin.js` – kezelőfelület.
- `dok/` – letölthető PDF-ek (Plus Jakarta Sans, új arculat, verziószámmal).

## 7. Marcsi levelének pontjai → hol vannak

| Kérés | Megvalósítás |
|---|---|
| Klasszikus 3 oszlopos első oldal, felül menüsorral (rlb.hu) | Kezdőlap: menüsor, alatta azonnal 3 oszlop |
| Vidám, de kellemes, szakmára jellemző színek, legyen kék | Fehér–kék alap, türkiz és arany kiemelés |
| Logó 3 színnel | Kék + türkiz + arany, három elem |
| Multi = sokoldalúság, sokféleség, növekedési potenciál | Kezdőlap „A nevünk” blokk, Rólunk |
| Cont = contír (könyvelés) és contract (szerződés) | Ugyanott, az ő szavaival |
| Nem kizárólag könyvelésre jött létre, nyitott új tevékenységekre | Kezdőlap „Nyitottak vagyunk az újra”, Rólunk, admin: új oldal/menüpont |
| Kapcsolat más cégekkel: átlinkelés, ajánlói rendszer, kuponajánlat | Kezdőlap Partnerközpont, Partnereink oldal, partner-aloldalak |
| Aktuális hírek adózási információkkal, pl. KATA-változások | Bal oszlop: kiemelt KATA-hír + további adóhírek; Tudástár |
| Kalkulátorok | Kezdőlap jobb oszlop + Kalkulátorok oldal (8 db) |
| Dokumentumtár formanyomtatványoknak, szakmai anyagoknak | Dokumentumtár ezekkel a kategóriákkal |
| Nyitott a további fejlesztésre, rugalmasan szerkeszthető, ő is fel tud tenni anyagokat | Kezelőfelület: cikkek, dokumentumfeltöltés, partnerek, oldalak (látványterv; éleshez backend kell) |

## 8. 16. kör – kreatív irányok és a választás

Keret (Marcsi kérése, nem vita tárgya): klasszikus 3 oszlop felső menüsorral, fehér–kék, 3 színű logó.

| Irány | Lényeg | Értékelés |
|---|---|---|
| **A – „Főkönyv”** (választott) | Szerkesztőségi portál: oszlopvonalak dobozok helyett, sorszámozott rovatok (01–05), dátumsáv valós dátummal és a következő határidővel, szolgáltatás-index sorokban, a logó sarokmotívuma mint vezető grafikai elem | Pont az, amit Marcsi az rlb.hu-ban szeret (rendezett, sűrű, hírportál-jellegű), de egyedi; a könyvelő munkájához (főkönyv, sorok, dátumok) kötődik |
| B – „Kék rács” | Svájci rács: kék hálós alap, moduláris blokkok, tervrajz-hatás | Túl technikai, hűvös; a „vidám, de kellemes” kéréshez kevés |
| C – „Három pont” | A logó három eleme interaktív hálózatként mozog végig az oldalon | Látványos, de egy könyvelőnél figyelemelterelő, és a 3 oszlopos portált szétfeszítené |

A választott irányból átvettük C legjobb elemét: a név rajza (MULTI–CONT–CENTER) a 01-es rovatban marad.

### Mozgásleírás

| Elem | Mit csinál | Indító | Átmenet | Csökkentett mozgásnál |
|---|---|---|---|---|
| Logó a fejlécben | A kék sarok balról fentről, a türkiz jobbról lentről csúszik be, az arany négyzet középről nő ki | Betöltés | Utána a dátumsáv már statikusan áll | Azonnal kész állapot |
| Rovatvonal | Minden középső rovat felső vonala balról jobbra kirajzolódik, a tartalom 10 px-ről felúszik | Görgetés (a rovat belép a képbe) | A vonal köti össze az előző rovattal | Vonal és tartalom azonnal látszik |
| Szolgáltatássor | A sor bal felső sarkán kék, jobb alsó sarkán türkiz „L” rajzolódik ki (a logó két sarka), a nyíl jobbra lép | Egér / billentyűfókusz | Visszahúzódik, ha elhagyja | Csak a színváltás marad |
| Név-rajz (01) | Az összekötő vonalak kirajzolódnak, a csomópontok beúsznak, a középpont mögött halk lüktetés | Betöltés | – | Statikus rajz |
| Fejléc | Görgetéskor alacsonyabb lesz és árnyékot kap | Görgetés | – | Ugyanígy, animáció nélkül |

Mind tiszta CSS + kevés JS (IntersectionObserver). **Nem kell hozzá** GSAP, Three.js/WebGL, React Bits vagy licencelt HorizonX-komponens. Ha később 3D-s fejlécjel készülne (pl. a logó térbeli forgatása), az Three.js-t igényelne – ez nincs beépítve.

### Dátumsáv
A mai dátum és a következő határidő a `tartalom.js` határidőlistájából számolódik (hány nap van hátra); a lejárt határidők automatikusan kiesnek.

## 9. 17. kör – ritkítás, mobil, visszahívás
- Kezdőlap ritkítva: bal oszlop 4 modul (kiemelt KATA-hír, 3 adóhír, 3 határidő, 4 hivatalos link), közép 4 rovat (név, szolgáltatások, partnerközpont, szakmai vezető idézettel) + felhívás, jobb oszlop: bérkalkulátor, 3 dokumentum, partnerajánlat, kapcsolat.
- Mobil: dátumsáv rejtve; a nyitó blokk teljes szélességű; a név rajza helyett 3 soros magyarázat; bal/jobb oszlopból csak a lényeg (KATA-hír, határidők, kalkulátor, dokumentumok); lábléc rövidítve. Hossz: ~9200 px → ~5700 px.
- **Visszahívást kérek:** valódi ablak minden oldalon (felső sáv, mobil alsó sáv, lábléc, felhívás): név, telefon (kötelező), mikor hívjuk, téma, hozzájárulás, spamvédelem. Küldéskor e-mail-piszkozat nyílik; nem állítja, hogy elküldte. Élesben szerveroldali küldés kell (lásd 4. pont).
