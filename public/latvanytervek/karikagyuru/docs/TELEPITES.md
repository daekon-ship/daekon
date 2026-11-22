# Karikagyuru.com – telepítési és élesítési ellenőrzőlista

**Állapot (2026. november 22., V5.8): NEM élesítésre kész.** Tárhely-hozzáférés nélkül a rendszer csak helyi
gépen futott (PHP beépített szerverével, automata tesztekkel). Az alábbi lista minden pontját a valódi
tárhelyen kell elvégezni és kipróbálni. A jelenlegi karikagyuru.com oldalt ez a munka nem érintette.

Jelölés: ☐ = elvégzendő · minden pont mellé írandó: ki, mikor, mi lett az eredmény.

## 0. Előfeltételek az ügyféltől

- ☐ Tárhely-hozzáférés (kezelőfelület vagy SFTP/SSH), a szolgáltató neve
- ☐ Domain/DNS hozzáférés vagy a kezelő elérhetősége
- ☐ A jelenlegi oldal teljes mentése (fájlok + adatbázis), **mielőtt bármi változik**
- ☐ Az érdeklődések fogadó e-mail-címe (írásban jóváhagyva)
- ☐ Cégadatok az impresszumhoz, adatkezelési tájékoztató szövege (jogilag átnézve)
- ☐ A jóváhagyott árak és gyűrűadatok (lásd `ELSO_ATADAS.md`, C pont)

## 1. Szerverkövetelmények

- ☐ PHP **8.1 vagy újabb** (`php -v`; a helyi tesztek 8.3-mal futottak)
- ☐ Bővítmények: `pdo_sqlite`, `sqlite3`, `gd` (JPEG, PNG, WebP támogatással), `session`, `json`, `fileinfo`
  - ellenőrzés: `php -m`, illetve `php -r 'var_dump(gd_info());'` → `JPEG Support`, `PNG Support`, `WebP Support` = true
- ☐ Ha nincs `pdo_sqlite`: a tárolóréteg MySQL-re állítása (külön fejlesztés, ugyanaz a PDO-kód)
- ☐ `upload_max_filesize` ≥ 8M, `post_max_size` ≥ 10M, `memory_limit` ≥ 256M (a képátméretezéshez)
- ☐ Apache esetén `mod_rewrite` és `.htaccess` engedélyezve; nginx esetén a `/api/` → `api/index.php` átirányítás beállítva

## 2. Könyvtárszerkezet és jogosultságok

```
/home/<fiók>/
├── kg-app/            ← webgyökéren KÍVÜL: src/, bin/ (services/karikagyuru-api)
├── kg-adat/           ← webgyökéren KÍVÜL: SQLite-adatbázis, feltöltött fotók, só  (KG_DATA)
└── public_html/       ← webgyökér: a weboldal fájljai
    └── api/           ← csak index.php + .htaccess
```

- ☐ Az `api/index.php` `require` útvonala a `kg-app/src/App.php`-ra mutat
- ☐ `KG_DATA` környezeti változó beállítva (`.htaccess`: `SetEnv KG_DATA /home/<fiók>/kg-adat`, vagy a PHP-FPM poolban)
- ☐ `kg-adat/` csak a PHP-folyamat felhasználójának írható (`chmod 700`), a webről **nem** érhető el
  - próba: `https://<domain>/kg-adat/kg.sqlite` és minden hasonló URL → 404
- ☐ A webgyökérben nincs `src/`, `bin/`, `tests/`, `dev/`, `.git`, `*.sqlite`, `*.md` fájl
- ☐ Könyvtárlistázás tiltva (`Options -Indexes`)

## 3. HTTPS

- ☐ Érvényes tanúsítvány (pl. Let's Encrypt a tárhelyen), automatikus megújítással
- ☐ Minden `http://` kérés 301-gyel `https://`-re megy
- ☐ HSTS fejléc (`Strict-Transport-Security: max-age=15552000`) – csak ha a HTTPS stabilan működik
- ☐ A kezelőfelület sütije `Secure` jelzőt kap (böngésző fejlesztői eszközeiben ellenőrizve)

## 4. Adminbejelentkezés

- ☐ `php bin/setup.php` a szerveren, **legalább 16 karakteres**, máshol nem használt jelszóval (a program 12-t fogad el, a gyakorlatban hosszabb legyen)
- ☐ A jelszót az ügyfél kapja meg személyesen vagy jelszókezelőben – e-mailben, chatben nem
- ☐ Próba: hibás jelszó → hibaüzenet; 5 hibás próbálkozás → 15 perc zárolás; helyes jelszó → belépés
- ☐ Próba: kilépés után a kezelőfelület újra jelszót kér
- ☐ Próba: 2 óra tétlenség után a mentés „Lejárt a belépés” üzenetet ad, és nem ment
- ☐ Az `index.html`-ben `<meta name="kg-api" content="api/">` (enélkül az oldal böngészős módban fut, és az érdeklődés NEM jut el az ötvöshöz!)
- ☐ Próba: látogatóként a `https://<domain>/api/state` válaszában nincs beszerzési ár (`gold24`, `platinum`), felár (`markup`), árnapló (`history`), érdeklődés, és csak „jovahagyott” jelölés szerepel

## 5. Adatbázis, mentés, visszaállítás

- ☐ Az SQLite-fájl a `kg-adat/` mappában, webgyökéren kívül (2. pont)
- ☐ **Napi mentés** (V5.8.1): `KG_DATA=/home/<fiók>/kg-adat php kg-app/bin/mentes.php /home/<fiók>/kg-mentesek`, cronból éjszaka.
  Lehetőleg másik lemezre, a szolgáltató mentése mellé. Zárolással konzisztens, minden fájl ellenőrzőösszeggel ellenőrizve,
  hibánál nem jelez sikert (kilépési kódok, napló). Teljes leírás: **`docs/MENTES_ES_VISSZAALLITAS.md`**.
  Helyben tesztelve (`tests/mentes_test.py`, 85 ellenőrzés), tárhelyen még nem.
- ☐ A régi mentések törlése: `bin/mentes-torles.php` – **a megőrzési időt az ügyféllel kell egyeztetni**; addig nem kerül cronba
- ☐ **Visszaállítás kipróbálva a tárhelyen:** `bin/visszaallitas.php` új, üres mappába, a rendszer elindul,
  az árak, az érdeklődések és egy referenciakép látszanak. Ennek ideje és eredménye leírva.
  (Helyben igazolva: a visszaállított rendszer bájtra azonos állapotot, árverziókat, érdeklődéseket és képeket ad, újraindítás után is.)
- ☐ A kezelőfelület saját változatkezelése (minden mentés új változat, utolsó 200 megmarad) **nem
  helyettesíti** a napi mentést

## 6. Érdeklődések

- ☐ Próba a valódi tárhelyen: érdeklődés telefonról és gépről → megjelenik a kezelőfelületen, a gyűrű cikkszámával és a beállításokkal
- ☐ Próba: hibás adat (név nélkül, hibás e-mail) → érthető hibaüzenet, nem „sikeres”
- ☐ Próba: a szerver leállítva → a látogató hibaüzenetet és telefonszámot kap, nem „sikeres” visszajelzést
- ☐ Robotvédelem: a csapdamező és az óránkénti korlát (5/IP) működik; ha spam jön, külön döntés kell (pl. Cloudflare Turnstile – az ügyfél jóváhagyásával)

## 7. E-mail-értesítés (megírva, alapból kikapcsolva)

A program kész (`services/karikagyuru-api/src/Mailer.php`, külső csomag nélkül), helyben tesztelve egy
helyi SMTP-álszerverrel (`tests/mail_test.py`). **Valódi levél még nem ment ki, és cím sincs beállítva.**

- ☐ Az ügyfél írásban megadja az értesítési címet (`to`) és azt, hogy melyik címről menjen (`from`)
- ☐ SMTP-adatok a tárhelytől (szerver, port, titkosítás, felhasználó, jelszó) – ezeket nem találjuk ki
- ☐ Beállítás az **adatmappában** (`kg-adat/mail.json`, `chmod 600`), a webgyökéren kívül:
  ```json
  { "mode": "smtp", "to": "<jóváhagyott cím>", "from": "<feladó cím a saját domainen>",
    "host": "<smtp szerver>", "port": 587, "secure": "tls", "user": "<felhasználó>", "pass": "<jelszó>" }
  ```
  `mode`: `off` (alapértelmezett, nem küld) · `file` (csak fájlba ír: `kg-adat/outbox/`, fejlesztéshez) · `smtp`.
  Titkosítatlan SMTP (`"secure": "none"`) csak helyi géppel engedett. Környezeti változókkal (`KG_MAIL_*`) is megadható.
- ☐ Opcionális: `KG_SITE_URL` (pl. `https://karikagyuru.com/`) – ha meg van adva, a levélben link lesz a kezelőfelületre. Enélkül nincs link (a kérés fejlécéből szándékosan nem rakunk össze címet).
- ☐ SPF/DKIM a feladó domainjére, hogy a levél ne menjen spambe
- ☐ Kezelőfelület → Beállítások → „E-mail-értesítés”: az állapot „Bekapcsolva”; a **„Próbalevél küldése”** gombot csak az ügyfél jelenlétében / engedélyével nyomjuk meg, és csak a jóváhagyott címre megy
- ☐ Próba egy valódi érdeklődéssel (az ügyfél saját adataival): a levél megérkezik, nem spam
- ☐ Sikertelen küldés: az érdeklődés **akkor is megmarad** a kezelőfelületen, mellette piros jelzés („Az e-mail-értesítés erről nem ment el”); a hiba a PHP-naplóba kerül, személyes adat nélkül
- A levél tartalma: típus, név, telefon, e-mail, gyűrű cikkszáma, időpont, üzenet. Ár és beállítások csak a kezelőfelületen.
- Valódi vásárlónak automatikus levél nem megy (visszaigazoló levél nincs a rendszerben).

## 8. Jogi és cégadatok

- ☐ Impresszum (cégnév, székhely, adószám, nyilvántartási szám, elérhetőség) – a végleges adatokkal
- ☐ Adatkezelési tájékoztató: mit gyűjt az űrlap, mire, meddig őrzi, ki fér hozzá, érintetti jogok
- ☐ Az érdeklődések megőrzési ideje eldöntve, és a régiek törlésének módja kialakítva
- ☐ Sütik: a kezelőfelület sütije technikailag szükséges; ha analitika kerül az oldalra, sütihozzájárulás kell
- ☐ A tegeződő szövegek és minden állítás az ügyféllel jóváhagyva

## 9. Régi URL-ek átirányítása

- ☐ A jelenlegi karikagyuru.com összes indexelt URL-jének listája (Search Console, sitemap, vagy feltérképezés)
- ☐ Megfeleltetési táblázat: régi URL → új URL (termékoldalak cikkszám alapján: `#/gyuru/<azonosító>`)
- ☐ 301-es átirányítások a szerveren (`.htaccess` vagy nginx), mind kipróbálva
- ☐ A régi oldal mentése megmarad az átállás után is legalább 3 hónapig

**Figyelem:** a mostani oldal `#/` (hash) útvonalakat használ. A keresők ezeket nem indexelik külön
oldalként. Élesítés előtt el kell dönteni, kell-e termékoldalanként indexelhető URL – ha igen, ez
külön fejlesztés (szerveroldali vagy előre generált termékoldalak, valódi útvonalakkal).

## 10. SEO (élesítéskor – a GitHub Pages bemutató `noindex` marad)

- ☐ A `<meta name="robots" content="noindex">` **eltávolítva** az éles `index.html`-ből (a látványtervben marad!)
- ☐ `robots.txt` és `sitemap.xml` a végleges domainnel; a `/api/` kizárva a robots.txt-ben
- ☐ Kanonikus URL (`<link rel="canonical">`) a végleges domainre
- ☐ Oldalcím és leírás oldalanként (főoldal, gyűrűk, saját ötlet, az ötvös, kapcsolat)
- ☐ Open Graph adatok (cím, leírás, kép) megosztáshoz
- ☐ Strukturált adat: `JewelryStore` / `LocalBusiness` (cím, telefon, nyitvatartás – csak valós adattal)
- ☐ A termékárakat strukturált adatként csak jóváhagyott árral szabad közölni
- ☐ Google Search Console: domain ellenőrzése, sitemap beküldése, régi URL-ek átirányításának figyelése
- ☐ Google Cégprofil: a webcím frissítése

## 11. Mobil- és böngészőtesztek a valódi domainen

- ☐ iPhone (Safari) és Android (Chrome) valódi készüléken: főoldal, katalógus, termékoldal, érdeklődés, saját ötlet
- ☐ Asztali Chrome, Firefox, Safari, Edge
- ☐ Nincs oldalirányú görgetés 360 px szélességen
- ☐ PageSpeed Insights / Lighthouse mobilon: mérve és dokumentálva (cél: Teljesítmény ≥ 80, Akadálymentesség ≥ 90)
- ☐ A kezelőfelület telefonon is használható (ár módosítása, gyűrű jóváhagyása, érdeklődés megnyitása)
- ☐ Az automata tesztek a valódi szerver ellen is lefutnak (`tests/server_mode_e2e.py` a `B` címet átírva, **külön tesztadatbázissal**, nem az éles adatokkal)

## 12. Utolsó lépések élesítés előtt

- ☐ Minden fenti pont kipróbálva és dokumentálva
- ☐ A kezelőfelület „Jóváhagyásra vár” oldalán az élesítési ellenőrzés zöld (vagy a hiányzó tételeknél tudatos döntés, hogy egyedi ajánlat marad)
- ☐ Független biztonsági átnézés (legalább: belépés, feltöltés, jogosultság)
- ☐ **Az ügyfél írásos jóváhagyása az élesítésre**
- ☐ Visszaállítási terv: ha az új oldal hibás, mennyi idő alatt és hogyan áll vissza a régi

## Melléklet: GitHub Pages bemutató és PHP-s szerver mód különbségei

| | GitHub Pages (bemutató, `kg-api` üres) | PHP-s tárhely (szerver mód, `kg-api` = `api/`) |
|---|---|---|
| Adatok helye | csak a látogató saját böngészőjében | a szerveren (SQLite), változatkezelve |
| Árak, gyűrűk | a beépített kiinduló adatok; amit valaki az adminban átír, csak nála változik | amit az ötvös a kezelőfelületen ment |
| Érdeklődés | **nem jut el az ötvöshöz** – az űrlap előre és beküldés után is kiírja, és telefonszámot, e-mail-címet ad | a szerverre kerül, a kezelőfelületen látszik; bekapcsolva e-mail-értesítés |
| Kezelőfelület | jelszó nélkül megnyitható, de csak a saját böngésző adatait látja és módosítja | jelszóval; hiba vagy kiesés esetén zárol |
| Képfeltöltés | 900 px-es kép a böngészőben | optimalizált JPEG (max. 2400 px) a szerveren |
| Látogatónak kiadott adat | a JavaScript-fájlokban lévő kiinduló (bemutató) adatok – ezek nyilvánosak | csak a nyilvános nézet (jóváhagyott árak, beszerzési ár és felár nélkül) |
| Keresők | `noindex` | élesítéskor indexelhető (10. pont) |

**V5.5 óta:** a `js/data.js` csak semleges kiinduló adatot tartalmaz (gyémántméretek, árak nélkül,
munkadíj nélkül). Belső beszerzési ár, munkadíjszabály, felár és a jegyzet számai nincsenek a nyilvános kódban
(az `engine.test.mjs` ezt ellenőrzi). Ezért a Pages bemutatón nincs számolt ár: listaár vagy „egyedi ajánlat”.
A fejlesztői és bemutató adatkészlet a `services/karikagyuru-api/dev/demo-dataset.json`-ban van, a `public/` mappán kívül.

## 13. V5.5 – amit a feltöltésnél külön figyelni kell

- ☐ Az éles tárhelyre **nem** kerül fel: `services/karikagyuru-api/dev/`, `demo/`, `bin/demo-*.php`, `tests/`, `docs/`, `demo-dataset.json`; éles környezetben `KG_DEMO` nincs beállítva.
- ☐ Az adatbázis üres induláskor a semleges adatokkal indul; a `bin/demo-seed.php`-t éles adatmappán **nem** futtatjuk
  (egyébként a `demo: true` jelzés miatt az élesítési ellenőrzés piros marad).
- ☐ `js/data.js` → `BUSINESS.adatkezeles`: az **ügyfél végleges** adatkezelési tájékoztatójának címe (nem a DAEKON-é).
  Az űrlapok mellett ez a link jelenik meg.
- ☐ A régi oldal jogi linkjei (`aszf.php`, `adatkezeles.php`) innen nem voltak elérhetők, tartalmukat nem ellenőriztük –
  élesítés előtt meg kell nézni, élnek-e, és hova irányítjuk őket (9. pont).
- ☐ Referenciaképek: a `$KG_DATA/inquiry-files/` mappa a webgyökéren kívül; a megőrzési idő ügyféllel egyeztetve;
  cron, pl. `0 3 * * * php /útvonal/bin/purge.php 365` (a napok száma csak példa).
- ☐ Jótállás: a weboldal csak általános, jogszabályra hivatkozó szöveget ír; a pontos feltételek a jótállási jegyen –
  ezt az ügyfélnek jóvá kell hagynia.
- ☐ SEO: a termékoldalak hash-alapúak, külön nem indexelhetők – javaslat: `docs/SEO_MIGRACIO.md`.
- ☐ Termékfotók: élesítés előtt `node services/karikagyuru-api/dev/foto-ellenorzes.mjs` internetkapcsolattal – a karikagyuru.com-os fotók helyi, optimalizált másolata; a jelentésben 0 törött útvonal és 0 sikertelen letöltés legyen (vagy a hiányzók pótlása az ügyféltől).
- ☐ A jelszóval védett bemutató külön tárhelyen/alkönyvtárban, külön adatmappával: `docs/BEMUTATO_TELEPITES.md`.

## 14. V5.8 – ügyféljóváhagyási központ és állapotjelölés

- A kezelőfelület „Ügyféljóváhagyások” oldala (`#/admin/kozpont`) a még eldöntendő kérdéseket gyűjti. A válaszok a
  mentett állapot `clientDecisions` mezőjébe kerülnek; a nyilvános nézet ezt nem kapja meg (teszt: `api_test.py`).
- A beírt válasz **semmit nem ír át** (árat, gyűrűszabályt, jogi szöveget). Élesítés előtt minden tételnél nézzük meg,
  hogy „Átvezetve”-e, és ha igen, valóban át van-e vezetve.
- Az egyes funkciók valós állapota (megírva → … → élesítve): `ELSO_ATADAS.md`.
