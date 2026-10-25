# Kalocsa GeoWorks – éles build és telepítés (kalocsageoworks.com)

Az éles oldal a jóváhagyott látványtervből (`../../`) **build-lépéssel** készül; a látványterv fájljai változatlanok maradnak. Titok (jelszó, FTP-/SMTP-adat, config) ebben a mappában nincs és nem is lehet.

## Jelenlegi éles állapot (telefonos bemutatkozó oldal)
- Nincs adatbekérés: az ajánlatkérő űrlap és a beküldő JS az éles buildből kikerül; a szerver minden POST/PUT/DELETE/PATCH kérést 405-tel elutasít (`tools/eles/htaccess`).
- Minden korábbi ajánlatkérő gomb hívógomb: `tel:+36704204170`.
- Indexelés tiltva: `noindex` meta + `X-Robots-Tag` + `robots.txt Disallow: /`. Végleges `robots-vegleges.txt` + `sitemap.xml` előkészítve.
- Térkép: Leaflet 1.9.4 saját tárhelyről (`tools/vendor/`, a build a hivatalos SRI-hash-sel ellenőrzi); kívülről csak az OpenStreetMap-csempék töltődnek.
- Ajánlatkérő- és statisztika-backend: `../backend/` – nincs telepítve.

## Build
```bash
KGW_SRC=<…>/public/latvanytervek/kalocsa-zoltan KGW_DIST=<kimeneti mappa> python -X utf8 -I tools/build.py
```
- Csak a ténylegesen hivatkozott fájlok kerülnek a kimenetbe (`_forras`, `ATADAS.md`, mintaoldalak, képernyőképek nem).
- Minden szövegcsere pontosan egyszer kell, hogy illeszkedjen – ha a látványterv változik, a build leáll és jelzi, melyik csere nem illeszkedik.
- Tiltott maradványok (bemutató feliratok, `[kitöltendő]`, `github`, „Ajánlatot kérek”) esetén leáll.
- A JS/CSS/videó 1 évig gyorsítótárazódik → változtatáskor a `?v=` értékeket emelni kell (build.py).
- Kell hozzá: Python 3 + Pillow (a megosztóképhez).

## Ajánlatkérő visszakapcsolása (később)
Előfeltétel: végleges, jogilag ellenőrzött adatkezelési tájékoztató `tools/eles/adatkezeles.html` néven (a build `[kitöltendő]` mezővel nem fogadja el), beállított SMTP (SPF/DKIM).
1. `../backend/config.example.php` → a szerveren `/_private/ajanlat-config.php` (csak ott!), `../backend/private.htaccess` → `/_private/.htaccess`, PHPMailer → `/_private/vendor/`; ellenőrizni: `/_private/…` → 403.
2. `../backend/ajanlat.php`, `meres-lib.php` → `/api/`. A `trusted_proxies` beállítását a valós `REMOTE_ADDR` alapján kell eldönteni.
3. `python -X utf8 -I tools/build.py --ajanlat` – automatikusan: űrlap vissza, végpont `/api/ajanlat.php`, a bemutató-ág kikerül, a POST-tiltásba bekerül az `/api/ajanlat.php` kivétel, CSP `form-action 'self'`, lábléc → adatkezelési tájékoztató.
4. Próbaküldés saját címre, majd jóváhagyással élesre.
Statisztika: `../backend/meres.php` + `statisztika.php` + `admin.htaccess` (lásd `../../ATADAS.md`).

## Telepítés (MHosting)
`tools/deploy.py <jelszófájl> <dist> <mentés-mappa>` – **egy** FTPS-kapcsolat: a felülírandó élő fájlok mentése → feltöltés (index.html és .htaccess utoljára) → méretellenőrzés → HTTPS-próba (hibánál a .htaccess visszavonása). A host és a felhasználó környezeti változóból jön (`KGW_FTP_HOST`, `KGW_FTP_USER`), a jelszó egy ideiglenes, projekten kívüli fájlból. Az MHosting brute-force védelme miatt: nincs párhuzamos kapcsolat, nincs automatikus újrapróbálkozás, hitelesítési hibánál azonnali leállás.

## Indexelés engedélyezése (a jogi és tartalmi feltételek rendezése után)
`robots-vegleges.txt` → `/robots.txt`, `sitemap.xml` → `/sitemap.xml`; a `noindex` meta törlése (`build.py`, `tools/eles/impresszum.html`) és az `X-Robots-Tag` sor törlése (`tools/eles/htaccess`); Google Search Console + sitemap beküldése. A GitHub Pages-előnézet maradjon `noindex`.
