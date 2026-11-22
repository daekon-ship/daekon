# Karikagyuru.com – első átadás: valós állapot (V5.8, 2026. 11. 22.)

Ez a dokumentum funkciónként mutatja, **meddig jutott** az egyes rész. Kétféle dolgot választ el: mi tartozik
az első (kb. 200 000 Ft-os) szakaszhoz, és mi későbbi, külön fejlesztés. A korábbi változat még azt írta,
hogy nincs e-mail-értesítés, és hogy a saját ötlethez csatolt kép nem töltődik fel. **Ez már nem igaz**
(lásd a táblázatot).

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
| Kezelőfelület: árak, gyűrűk, fotók, műhelymunkák, szabályok, érdeklődések | ✔ | ✔ | ✔ | ✔ | – | – | – | Pages-en jelszó nélkül, csak a böngészőben ment; szerveren belépéssel, változatokkal |
| Ügyféljóváhagyási központ (V5.8) | ✔ | ✔ | ✔ | ✔ | – | – | – | 25 kérdés, mind nyitott; a válasz semmit nem ír át magától |
| Bejelentkezés, CSRF, zárolás 5 hibás próbálkozás után | ✔ | ✔ | ✔ | n. a. | – | – | – | |
| Zárt, jelszavas bemutató a laptopon (`bemutato.sh`) | ✔ | ✔ | ✔ | n. a. | – | – | – | mintaadatokkal, levélküldés nélkül; egy paranccsal visszaállítható |
| Biztonsági mentés (`bin/mentes.php`) | ✔ | ✔ | ✔ | n. a. | – | – | – | adatbázis + fotók + referenciaképek; a visszaállítást a tárhelyen is ki kell próbálni |
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
