# MultiCont Center Kft. — látványterv, átadás (12. kör: teljes újratervezés)

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/multicont/
Előző változat (11. kör) megtekinthető: `latvanytervek/multicont-v11/` · Git: commit `083a034` (helyi tag: `multicont-v11`).
A terv `noindex`.

## Fájlok
| Fájl | Mi ez |
|---|---|
| `index.html`, `rolunk.html`, `szolgaltatasok.html`, `hirek.html`, `cikk.html`, `tudastar.html`, `partnerek.html`, `kapcsolat.html` | Aloldalak — **generált fájlok**, ne kézzel szerkeszd |
| `admin.html` | Kezelőfelület **látványterve** (nem ment) |
| `_forras/build.py` | Oldalgenerátor: közös fejléc/lábléc, oldaltartalmak. Futtatás: `python3 _forras/build.py` |
| `tartalom.js` | **Minden változó tartalom**: cikkek, határidők, jogszabályi idővonal, dokumentumok, linkek, partnerek |
| `mc.css` / `mc.js` | Arculati rendszer / közös szkript (menü, modulok, kereső, kalkulátorok, űrlapok, admin-demó) |
| `dok/*.pdf` | Letölthető PDF-ek (adó- és járulékkulcsok 2026; ügyféladatlap – minta) |
| `logo.svg`, `logo-feher.svg`, `jel.svg` | Logó világos és sötét alapra, önálló jel (favicon) |
| `fonts/` | Literata + Source Sans 3 (OFL), latin + magyar ékezetek |

## Arculat
- **Színek:** Deep Navy #173550 (fejléc-menüsor, címek, lábléc), Professional Blue #346B95 (információs elemek), Soft Teal #639A9C (akcentus; szövegre a sötétebb #3E7375), Off White #F7F9FB, fehér, szöveg #293541. Színátmenet nincs; a három szín együtt csak a „háromszínű vonal” motívumban jelenik meg (címkejel, aktív menüpont, lábléc teteje, fotókeret).
- **Betűk:** Literata (címek – elegáns, jól olvasható serif) + Source Sans 3 (szöveg, 17 px alap – idősebb olvasóknak is). Mérsékelt címméretek (H1 max. 40 px).
- **Logó:** három sarokelem (sötétkék, kék, türkiz) egy közös középpont körül, az egyik sarok nyitva marad. Jelentés: *multi* = három terület, *cont* = a középpont, amit körülvesznek (számvitel, megállapodás), *center* = közös központ; a nyitott sarok a fejlődés és az új tevékenységek helye. Nincs érme, számológép vagy diagram. 24 px-en is olvasható, sötét alapon világos változattal. Szókép: **Multi**Cont (Literata) + CENTER KFT. (ritkított, türkiz). Az SVG-szövegek betűtípust kérnek – nyomdához görbésítendő.
- **Fotó:** nincs; Horváth Mária saját fotójának jelölt helye van (monogram + háromszínű keret). Generált arc vagy stockfotó nincs.

## Szerkezet
- **Fejléc 3 rétegben:** információs sáv (cégnév, telefon, e-mail, „Visszahívást kérek”) → fő fejléc (logó, kereső, telefon, Kapcsolat gomb) → sötétkék főmenü (Főoldal, Rólunk, Szolgáltatásaink, Szakmai hírek, Tudástár, Partnereink, Kapcsolat). Görgetéskor csak a menüsor marad fent. 1100 px alatt: logó + hamburger, teljes képernyős menü keresővel.
- **Főoldal – három hasáb** (272 px | rugalmas | 300 px, függőleges elválasztóvonalakkal):
  - *Bal – szakmai információk:* aktuális adóhírek (lista), fontos határidők (dátumcsempék), jogszabályi változások (idővonal; a tervezet szaggatott jelöléssel), könyvelési tudnivalók (számozott), friss szakmai cikkek. Minden modul más mintát használ.
  - *Közép – fő tartalom:* történet (2015, Horváth Mária útja, a név jelentése), szemlélet (saját idézetével), szolgáltatások szerkesztett listája, Horváth Mária bemutatása, „Kinek dolgozunk?”, konzultációs felhívás.
  - *Jobb – hasznos eszközök:* bérkalkulátor, letölthető dokumentumok, nyomtatványok, szakmai linkek, ajánlott partnerek, kapcsolat.
  - Alatta teljes szélességben: végelszámolás-szalag, partnerprogram-szalag. 1100 px alatt két hasáb, 900 px alatt egy (középső tartalom elöl, majd a szakmai információk, majd az eszközök).
- **Aloldalak:** Rólunk (történet, szakmai út, a név jelentése, cégadatok), Szolgáltatásaink (ragadós tartalomjegyzék + szerkesztőségi szekciók, a végelszámolás kiemelve), Szakmai hírek (kereső, kategóriaszűrő darabszámmal, kiemelt cikk, lista) + cikkoldal (dátum, kategória, forrásdoboz, „forrás ellenőrizve” dátum, kapcsolódó cikkek), Tudástár (kalkulátorok + dokumentumtár + linkek), Partnereink (kereső, kategóriaszűrő, partnerkártyák, ajánlói rendszer, jelentkezés), Kapcsolat (adatok, térkép, űrlap).
- **Lábléc:** ellenőrzött cégadatok (cégnév, iroda, adószám, cégjegyzékszám, alapítás), oldalak, szakmai tartalom, elérhetőség; Impresszum és Adatkezelési tájékoztató ablakban.

## Tartalom és hitelesség
- Csak forrással igazolt adat szerepel. Minden cikknél: megjelenés dátuma, forrás(ok) linkkel és dátummal, „Forrás ellenőrizve: 2026. október 14.”, és jogi figyelmeztetés.
- **Cikkek (8):** új KATA-tervezet 2027-től (*tervezet* jelöléssel; Telex, Kontroll), KATA 2026 szabályai (Financera), határidők nov–dec. (Accace Adónaptár), alanyi ÁFA-határ, átalányadó, minimálbér, adókulcsok, anyák SZJA-mentessége (TaxHungary).
- **NAV-információk** kategória üres: a NAV oldalai a fejlesztői környezetből nem töltődtek be, ezért onnan nem vettünk át közleményt. A kategória üres állapotot mutat.
- **Szolgáltatások:** csak az igazoltak (konyvelok.hu, konyvelokiajanlo.hu, brief): könyvelés, bérszámfejtés, adótanácsadás, NAV- és TB-képviselet, online könyvelés, végelszámolás; felelősségbiztosítás, német nyelv. A briefben javasolt „adminisztratív támogatás” és „számviteli tanácsadás” **nem került be**, mert nincs rá igazolás – az ügyféllel egyeztetendő.

## Mi működik ténylegesen
- Navigáció, mobilmenü, fejléc-kereső (→ Szakmai hírek keresés), hírkereső és kategóriaszűrő (URL-ben megmarad), cikkoldal, kapcsolódó cikkek.
- **Kalkulátorok** ellenőrzött 2026-os kulcsokkal, géppel tesztelve: bruttó–nettó bér (SZJA 15%, TB 18,5%, szocho 13%, SZJA-mentes kapcsoló), munkáltatói költség (+ „mennyi bruttó fér a keretbe”), KATA 2026 (egész évre: 600 000 Ft + 40% a 18 M Ft feletti részre), ÁFA (27/18/5%). Az **átalányadó-kalkulátor előkészítés alatt**: nem mutat eredményt.
- **Dokumentumtár:** keresés, csoportszűrő, letöltés (2 valódi PDF), közzététel dátuma, visszavont dokumentumok kezelése (áthúzva, letöltés nélkül; „Visszavontak is” kapcsoló). Jelenleg nincs visszavont tétel.
- **Partnerlista:** kereső + kategóriaszűrő; a 3 kártya **MINTA**, valódi partner nincs.
- **Ajánlói alapverzió:** `kapcsolat.html?ajanlo=KÓD` (vagy bármely oldal `?ajanlo=`) → az oldal megjegyzi, és kitölti a kapcsolati űrlap „Ajánlói kód” mezőjét; a kód bekerül az e-mailbe.
- **Űrlapok** (kapcsolat, partnerjelentkezés): valódi ellenőrzés, magyar hibaüzenetek, visszahívás kérésekor kötelező telefonszám; küldés = előre kitöltött e-mail a konyvelde@gmail.com címre (nincs szerveroldali küldés, és ezt az oldal ki is írja).
- Impresszum / Adatkezelés ablak, ragadós mobil hívássáv.

## Háttérfejlesztést igényel (követelmények)
1. **Bejelentkezés:** egy adminisztrátor (Horváth Mária), erős jelszó + kétlépcsős azonosítás, jelszó-visszaállítás e-mailben.
2. **Adatbázis-táblák:** `cikkek` (cím, slug, dátum, kategória, összefoglaló, törzs, állapot: piszkozat/közzétett/tervezet, kiemelt, források[név, URL, dátum] – **forrás nélkül nem közzétehető**), `dokumentumok` (cím, csoport, fájl, méret, közzététel dátuma, állapot: aktív/visszavont, visszavonás dátuma), `partnerek` (név, kategória, leírás, logó, URL, település, állapot: jelentkezett/jóváhagyott/inaktív), `ajanlasok` (ajánlói kód, partner, kuponkód, érdeklődő, dátum, állapot), `kampanyok` (név, kezdet, vég, kedvezmény, érintett partnerek), `szolgaltatasok`, `oldalszovegek`, `fooldali_beallitasok`.
3. **Fájltárolás:** PDF/Word/Excel feltöltés (max. 20 MB), képfeltöltés átméretezéssel (Mária fotója, partnerlogók).
4. **Űrlapok szerveroldali küldése:** e-mail az irodának + automatikus visszaigazolás, spamvédelem, adatkezelési hozzájárulás naplózása; a partnerjelentkezés az admin „Jelentkezések” listájába kerül.
5. **Ajánlói rendszer:** kódgenerálás partnerenként, kuponkód hozzárendelés, érdeklődő ↔ kód rögzítése, jóváhagyás, kampányok, statisztika.
6. **Kezelőfelület:** az `admin.html` szerinti 8 menü (hírek, dokumentumok, partnerek, ajánlások, szolgáltatások, szövegek és képek, főoldali kiemelések, új modul), magyar nyelven.
7. **Javasolt megvalósítás:** a mostani statikus szerkezet megtartható; a `tartalom.js` szerkezete 1:1 megfelel a fenti tábláknak. Lehetőségek: (a) WordPress egyedi sablonnal és egyedi tartalomtípusokkal; (b) headless CMS (pl. Directus, Strapi) + a mostani frontend; (c) egyszerű egyedi admin (pl. Laravel). Döntés az ügyféllel / tárhellyel.

## Egyeztetendő az ügyféllel
- Horváth Mária fotója; a logó jóváhagyása.
- Felelősségbiztosítás (a konyvelok.hu címkéje alapján szerepel).
- Partnerek, ajánlói program feltételei, kuponok.
- Székhely, nyilvántartó bíróság, tárhelyszolgáltató, adatkezelési tájékoztató.
- Az ügyféladatlap (PDF, MINTA) mezői.
- További szolgáltatások (adminisztratív támogatás, számviteli tanácsadás) – csak igazolás után.
- A hivatalos linkek végigkattintása élesítés előtt.

## Ellenőrizve
- 9 oldal × 360 / 390 / 768 / 1024 / 1440 px: nincs vízszintes kilógás, nincs JS-hiba.
- Minden belső link és horgony él; PDF-ek letölthetők (application/pdf).
- Funkcionális teszt: kereső, szűrők, cikkoldal, kalkulátorok (kézi ellenőrzéssel), dokumentumkereső, partnerszűrő, ajánlói kód átadása, űrlap-ellenőrzés, mobilmenü, kezelőfelület-nézetek, párbeszédablakok.
- Kontraszt: törzsszöveg 11:1, másodlagos szöveg 6:1, türkiz szöveg 5,2:1.
- `prefers-reduced-motion`: mozgás kikapcsol.
