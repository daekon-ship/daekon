# Kalocsa GeoWorks – regressziós tesztcsomag

Mindegyik teszt csak olvas: az élő oldalon adatot nem módosít, valódi hívást vagy levelet nem indít, valódi ügyféladatot nem használ.
A kérések egymás után mennek, így a szervert nem terhelik. Kilépési kód: 0 = rendben, 1 = hiba.

A parancsok a `kalocsageoworks` mappából (a build gyökeréből) futnak. Ahol `<pw>` szerepel, az a `playwright-core` csomag útvonala
(pl. `npm i playwright-core` után `./node_modules/playwright-core`; böngészők: `npx playwright-core install chromium firefox webkit`).

| Teszt | Parancs | Mit ellenőriz |
|---|---|---|
| HTTP – élő | `python -X utf8 -I tools/tesztek/http_teszt.py` | kezdőlap, 11 hívólink, nincs űrlap, noindex, canonical, title/description hossza, minden helyi erőforrás 200, 404-oldal, impresszum, robots, sitemap állapota, http/www → https egy lépésben, nyílt átirányítás, biztonsági fejlécek, POST/PUT/PATCH/DELETE/OPTIONS → 405 (több címen, hibás JSON/multipart), rejtett és belső fájlok (.env, .git, _private, admin, mentések) → 403/404 |
| HTTP – helyi build | `python -m http.server 8765 -d dist` majd `python -X utf8 -I tools/tesztek/http_teszt.py http://127.0.0.1:8765 --helyi` | a fenti tartalmi rész (.htaccess nélkül) |
| Böngésző | `node tools/tesztek/bongeszo_teszt.js <pw> chromium https://kalocsageoworks.com/ [képmappa]` (és `firefox`, `webkit`) | 13 szélesség (320–1920 px; Firefox/WebKit: 390, 1440): vízszintes túlcsordulás, képek, hívólinkek, űrlap hiánya, videó, AI-jelölés, betűméret, a lebegő hívógomb nem takar, konzol-/hálózati hiba; mobilmenü (gyors nyitás-zárás, Escape, menüpont, forgatás nyitott menüvel); képnagyító (Enter, nyilak, Tab-csapda, Escape, fókusz vissza, dupla kattintás); videó és térkép-csempék nélkül; csökkentett mozgás; JavaScript nélkül; billentyűzet (skip link, fókuszjelzés, minden szakasz elérhető) |
| Teljesítmény | `node tools/tesztek/teljesitmeny.js <pw> https://kalocsageoworks.com/ 3` | TTFB, FCP, LCP, CLS, letöltött méret típusonként (mobil: 4× CPU, lassú 4G; asztali: lassítás nélkül) – laboratóriumi mérés |
| Kontraszt | `node tools/tesztek/kontraszt.js <pw> https://kalocsageoworks.com/ 320 390 768 1440 1920` | minden látható szöveg kontrasztja (WCAG 2.2 AA: 4,5:1, nagy szövegnél 3:1) csökkentett mozgással, így a görgetésre beúszó szövegek is; kép/videó feletti szöveget kihagy |
| Ajánlatkérő 2027 – végpont | `python -X utf8 -I tools/tesztek/ajanlat_teszt.py <_forras/backend mappa>` | helyi PHP-szerveren, csonk-levelezővel: metódus, Origin, honeypot, kitöltési idő, JSON/sérült törzs, kötelező mezők, e-mail/telefon, munka[] több értékkel, fejléc-befecskendezés, „<” a leírásban, hamis kép, 8 MB és tárhelykorlát feletti kép, 5 képes korlát, SMTP-hiba, 6. kérés → 429 |
| Ajánlatkérő 2027 – böngésző | lásd lent | dupla kattintás → 1 levél, mindkét munkatípus, elveszett válasz / 502 / nem JSON válasz → nincs hamis siker, rosszindulatú fájlnév, PDF, túl sok kép |

## Ajánlatkérő 2027 – böngészős teszt (kézi előkészítés, csak helyben)

1. Ideiglenes mappába másold a `tools` mappát, és tegyél bele egy próba `tools/eles/adatkezeles.html`-t (csak a teszthez, ne töltsd fel).
2. `KGW_SRC=<forrás> KGW_DIST=<tmp>/site KGW_READY=<tmp>/ready python -X utf8 -I <tmp>/tools/build.py --ajanlat`
3. `<tmp>/site/api/` ← `ajanlat.php`, `meres-lib.php`; `<tmp>/site/_private/` ← az `ajanlat_teszt.py`-ban lévő `STUB` (stub-autoload.php) és `CONFIG` (ajanlat-config.php, `allowed_origins` = a helyi cím).
4. `php -d upload_max_filesize=10M -d post_max_size=50M -S 127.0.0.1:8796 -t <tmp>/site`
5. `node tools/tesztek/ajanlat_e2e.js <pw> http://127.0.0.1:8796/ <tmp>/site/_private/sent.txt <egy kis jpg>`
6. A szerver leállítása után az ideiglenes mappa törlése.

Ismert korlát: a Windows-os WebKit-port Tabbal nem lép linkre (a Safari is csak Option+Tabbal), ezért a billentyűzetes link-bejárást
Chromiumon és Firefoxon ellenőrizzük. Valódi iPhone/Android készüléken a tesztek nem futnak – a mobil eredmény emulált.
