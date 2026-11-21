# Karikagyuru.com – telepítési és élesítési ellenőrzőlista

**Állapot (2026. november 21.): NEM élesítésre kész.** Tárhely-hozzáférés nélkül a rendszer csak helyi
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
- ☐ Az `index.html`-ben `<meta name="kg-api" content="api/">` (enélkül az oldal böngészős módban fut!)

## 5. Adatbázis, mentés, visszaállítás

- ☐ Az SQLite-fájl a `kg-adat/` mappában, webgyökéren kívül (2. pont)
- ☐ **Napi mentés** a `kg-adat/` teljes tartalmáról a tárhelyen kívülre (a szolgáltató mentése mellé is),
  legalább 14 napig megőrizve. Biztonságos másolat futó rendszerről: `sqlite3 kg.sqlite ".backup kg-<dátum>.sqlite"`
- ☐ **Visszaállítás kipróbálva:** egy mentést egy külön mappába visszatöltve a rendszer elindul, és a
  benne lévő árak és érdeklődések látszanak. Ennek ideje és eredménye leírva.
- ☐ A kezelőfelület saját változatkezelése (minden mentés új változat, utolsó 200 megmarad) **nem
  helyettesíti** a napi mentést

## 6. Érdeklődések

- ☐ Próba a valódi tárhelyen: érdeklődés telefonról és gépről → megjelenik a kezelőfelületen, a gyűrű cikkszámával és a beállításokkal
- ☐ Próba: hibás adat (név nélkül, hibás e-mail) → érthető hibaüzenet, nem „sikeres”
- ☐ Próba: a szerver leállítva → a látogató hibaüzenetet és telefonszámot kap, nem „sikeres” visszajelzést
- ☐ Robotvédelem: a csapdamező és az óránkénti korlát (5/IP) működik; ha spam jön, külön döntés kell (pl. Cloudflare Turnstile – az ügyfél jóváhagyásával)

## 7. E-mail-értesítés (még nincs megírva)

- ☐ Fejlesztés: új érdeklődésnél levél a jóváhagyott címre (a tárhely SMTP-jével vagy tranzakciós levelezővel)
- ☐ SPF/DKIM beállítás a küldő domainre, hogy a levél ne menjen spambe
- ☐ **Tesztlevél csak az ügyfél által jóváhagyott, saját címre** – valódi vásárlónak automatikus tesztlevél nem mehet
- ☐ Próba: a levél megérkezik, nem spam, a tartalom helyes, személyes adatot csak a szükséges mértékben tartalmaz

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

## 10. SEO (élesítéskor – a GitHub Pages látványterv `noindex` marad)

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
