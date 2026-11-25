# Karikagyuru.com – első átadás: valós állapot (V5.10, 2026. 11. 25.)

Ez a dokumentum funkciónként mutatja, **meddig jutott** az egyes rész. Kétféle dolgot választ el: mi tartozik
az első (kb. 200 000 Ft-os) szakaszhoz, és mi későbbi, külön fejlesztés. A korábbi változat még azt írta,
hogy nincs e-mail-értesítés, és hogy a saját ötlethez csatolt kép nem töltődik fel. **Ez már nem igaz**
(lásd a táblázatot).

## V5.10 – ami változott (2026. 11. 25.)

- **Teljes böngészős végellenőrzés a telepítési csomagon** (`v510_vegso_e2e.py`, 124 ellenőrzés):
  - kapu és két belépés;
  - mind a 115 termékoldal, konfigurátor, űrlapok;
  - admin, végig;
  - 6 képernyőméret;
  - hálózati szivárgás;
  - mentés és visszaállítás.
- **Javított hibák:**
  - Több „Mentve” üzenet a szerver visszaigazolása előtt jelent meg: műhelymunka mentése és törlése, gyűrű felvétele és mentése, jóváhagyás és visszavonás. Most csak a visszaigazolás után; hiba esetén „NEM lett mentve”.
  - Az érdeklődés állapotváltása (Felhívom / Visszahívtam / Lezárás / ajánlati ár) szerverhibánál is sikert mutatott. Most visszaáll, és hibát ír ki.
  - A szerver PHP-feltöltési korlátja (alapból 2 MB) fölötti fotónál csak „A feltöltés nem sikerült” jelent meg. Most: „A kép túl nagy ehhez a szerverhez (legfeljebb N MB)”. A csomagban `.user.ini` 10 MB-os korláttal.
  - Mobilon az admin fülsora vízszintesen görgethető volt. Most sorba törik, minden fül látszik.
  - Mobilon a mentési sor a menüsáv alá csúszott.
  - Mobilon a „Kilépés” gomb 35 px magas volt; most 44 px.
  - Az „Érdeklődések megtekintése” felirat a számláló alá lógott.
  - Táblagépen (768 px) a katalógus alapból 6 oszlopos volt; most 3.
  - Kezelőfelület: „Szerveres mentés bekapcsolva · N. változat” helyett „A változások a szerverre mentődnek.”
- **Bemutató:**
  - 5 mintagyűrű: kő nélküli (79014 W, új), 0–3 köves (81184), kétszínű (81202), 20 köves és jóváhagyásra váró (79016), egyedi ajánlatos (81632);
  - a jelszókérő oldal kimondja az 5 tudnivalót;
  - egyoldalas útmutató az ötvösnek: `OTVOS_UTMUTATO.md`.
- **VPS:**
  - `dev/vps-felmeres.sh` csak olvasó felmérés;
  - `TAVOLI_BEMUTATO.md` V5.10 (nginx/Caddy, saját PHP-FPM pool, HTTPS-próba, mentési próba);
  - **a bemutató NINCS telepítve** – nem volt hozzáférés.
- **Fotók:** `FOTO_HIANYLISTA.md` – 30 helyi fotó igazoltan betölt; 85 a régi oldalról töltődik, innen nem ellenőrizhető. Élesítés előtt helyi másolat kell.
- **SEO:** `SEO_MIGRACIO.md` 5. pont – a régi oldal valós címszerkezete, javasolt 301-ek (ellenőrizendő).

## Az állapotok jelentése

| # | Állapot | Mit jelent |
|---|---|---|
| 1 | Megírva | a kód létezik a repositoryban |
| 2 | Automatikus teszt | a tesztek valódi böngészőben vagy valódi PHP-futtatással ellenőrzik (nem csak kódolvasás) |
| 3 | Helyi PHP-szerveren kipróbálva | a saját gépen, `php -S` szerverrel, SQLite-tal, a teljes folyamaton végigmentünk |
| 4 | GitHub Pages-en bemutatható | a nyilvános bemutató címen megnézhető (ott nincs szerver: minden csak a böngészőben ment) |
| 5 | Valódi tárhelyen kipróbálva | az ügyfél tárhelyén fut |
| 6 | Ügyfél jóváhagyta | az ötvös kifejezetten rábólintott |
| 7 | Élesítve | a karikagyuru.com-on, valódi vásárlóknak |

**Az 5., 6. és 7. állapotot egyetlen funkció sem érte el.** Tárhely nincs kiválasztva, és az ügyfél még semmit nem
hagyott jóvá. Az éles karikagyuru.com-hoz nem nyúltunk.

## A. Első átadás – funkciók

✔ = elérte · – = még nem · n. a. = nem értelmezhető

| Funkció | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Megjegyzés |
|---|---|---|---|---|---|---|---|---|
| Új weboldal (főoldal, ötvös, saját ötlet, műhelymunkák, kapcsolat), mobilon is | ✔ | ✔ | ✔ | ✔ | – | – | – | a szövegek és a tegezés jóváhagyásra várnak |
| Katalógus: 115 gyűrű, szűrés, keresés, termékoldal, nagyítás | ✔ | ✔ | ✔ | ✔ | – | – | – | 30 gyűrűnek saját, optimalizált fotója van; 85 fotó a régi oldalról töltődik (lásd `KATALOGUS_JELENTES.md`) |
| Központi árkezelés: grammár, előtte–utána, árverziók, visszaállítás | ✔ | ✔ | ✔ | ✔ | – | – | – | az ötvös módszerével számol; **egy ár sincs jóváhagyva**, ezért a vásárló „Egyedi árajánlat”-ot lát |
| Gyűrűnkénti szakmai jóváhagyás (hiányzó/becsült adat blokkol) | ✔ | ✔ | ✔ | ✔ | – | – | – | 0 / 115 gyűrű jóváhagyott (a bemutató mintaadatában 2 szemléltető) |
| Konfigurátor: anyag, finomság, szín, méret, kő, gravírozási kérés | ✔ | ✔ | ✔ | ✔ | – | – | – | csak jóváhagyott gyűrűn; a gravírozás ára nincs megadva → az oldal kiírja, hogy az ár nem tartalmazza |
| Ajánlatkérés, időpontkérés, saját ötlet | ✔ | ✔ | ✔ | ✔* | – | – | – | *Pages-en az üzenet NEM jut el az ötvöshöz – ezt az űrlap előtte és utána is kiírja |
| Saját ötlethez csatolt referenciakép feltöltése (védett, csak az adminban látszik) | ✔ | ✔ | ✔ | – | – | – | – | Pages-en nincs szerver, ott a kép nem töltődik fel |
| E-mail-értesítés új érdeklődésről | ✔ | ✔ | ✔** | – | – | – | – | **csak „fájlba írás” módban; valódi levél nem ment ki (nincs jóváhagyott cím és SMTP) |
| Kezelőfelület (V5.9: 6 főmenü – Áttekintés, Gyűrűk, Árak, Műhelymunkák, Érdeklődések, Beállítások) | ✔ | ✔ | ✔ | ✔ | – | – | – | Pages-en jelszó nélkül, csak a böngészőben ment; szerveren belépéssel, változatokkal. Útmutató: `ADMIN_UTMUTATO.md`, felmérés: `ADMIN_FELMERES_V5_9.md` |
| Árlista: vásárlói (csak jóváhagyott ár) és belső kalkuláció („nem végleges” jelöléssel) | ✔ | ✔ | ✔ | ✔ | – | – | – | V5.9 |
| Fejlesztői nyilvántartás – 25 tisztázandó kérdés (V5.8 központ) | ✔ | ✔ | ✔ | n. a. | – | – | – | V5.9: nem része a tulajdonosi adminnak; szerveren csak parancssorból (`bin/fejlesztoi-dontesek.php`), az admin API nem adja ki |
| Távoli ügyfélteszt a DAEKON szerverén (HTTPS, jelszó, tartós mentés) | ✔ | ✔ | ✔ | n. a. | – | – | – | telepítésre kész csomag + leírás (`TAVOLI_BEMUTATO.md`), **nincs telepítve** – nem volt szerver-hozzáférés |
| Bejelentkezés, CSRF, zárolás 5 hibás próbálkozás után | ✔ | ✔ | ✔ | n. a. | – | – | – | |
| Zárt, jelszavas bemutató a laptopon (`bemutato.sh`) | ✔ | ✔ | ✔ | n. a. | – | – | – | mintaadatokkal, levélküldés nélkül; egy paranccsal visszaállítható |
| Biztonsági mentés és visszaállítás (`bin/mentes.php`, `bin/visszaallitas.php`) | ✔ | ✔ | ✔ | n. a. | – | – | – | V5.8.1: konzisztens, ellenőrzött; teljes visszaállítási próba helyben sikeres; a tárhelyen egyszer végig kell csinálni (`MENTES_ES_VISSZAALLITAS.md`) |
| Érdeklődések törlése megőrzési idő után (`bin/purge.php`) | ✔ | ✔ | ✔ | n. a. | – | – | – | a megőrzési időt az adatkezelési tájékoztatónak kell megadnia |
| Két arculati változat (A/B) | ✔ | ✔ | ✔ | ✔ | – | – | – | `arculat.html`; az ügyfél még nem választott |
| SEO-alapok (cím, leírás, noindex a bemutatón) | ✔ | ✔ | – | ✔ | – | – | – | az élesítés előfeltételei: `SEO_MIGRACIO.md` |
| Régi címek átirányítása (301) | – | – | – | – | – | – | – | nincs meg a régi címek listája – előfeltétel |

## B. Mi kell még az első szakasz lezárásához

1. **Ügyfél-jóváhagyások** – a kezelőfelület „Ügyféljóváhagyások” oldala tételesen sorolja (grammárak, kőárak, gravírozás,
   előleg, határidő, fizetési mód, jótállás, logó, megszólítás, acél/titán stb.).
2. **Tárhely** kiválasztása és telepítés (`TELEPITES.md`), mentés és visszaállítás kipróbálása ott.
3. **E-mail**: az értesítési cím és az SMTP-fiók megadása, egy próbalevél – csak az ügyfél engedélyével.
4. **Jogi szövegek**: az adatkezelési tájékoztató frissítése (képfeltöltés, megőrzési idő), az ÁSZF átnézése.
5. **Fotók**: a 85 régi oldali fotó eredetije (vagy legalább a letöltés engedélye).
6. **Átirányítások**: a régi címek listája vagy Search Console-hozzáférés.
7. Átadás előtti teljes ellenőrzés a valódi tárhelyen, a jóváhagyott adatokkal.

**Nem része az első szakasznak:** webshop, kosár, online fizetés, automatikus rendelés.

## C. Későbbi, külön fejlesztések

| Fejlesztés | Megjegyzés |
|---|---|
| Rhino-alapú 3D-megjelenítés | adatmodell előkészítve (`models3d`); folyamat: `RHINO_3D.md`. Eredeti CAD-fájlok és műszaki ellenőrzés nélkül nincs kipróbálva, és nem ígérünk gyártható fájlt |
| Parametrikus tervező | Grasshopper + Rhino.Compute; folyamatos szerverköltség, külön üzemeltetés |
| Összetettebb admin | több felhasználó, jogosultságok, import/export, statisztika, időzített árváltozás |
| Egyéb | idegen nyelv, naptáras időpontfoglalás, hírlevél |
