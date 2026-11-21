# Karikagyuru.com – szerveroldali kezelőfelület-API (fejlesztői váz)

**Állapot: bekötve és helyben végig tesztelve, valódi tárhelyen még nem futott.**
A weboldal (`public/latvanytervek/karikagyuru/`) két módban működik:

- **Helyi mód** – ha az `index.html`-ben `<meta name="kg-api" content="">` (pl. GitHub Pages):
  minden a böngészőben marad, mint eddig.
- **Szerver mód** – ha `<meta name="kg-api" content="api/">`: az oldal a szerverről tölti az árakat,
  a kezelőfelület jelszót kér, minden mentés a szerverre megy (változatként), az érdeklődések
  a szerveren gyűlnek, a fotók feltöltődnek. A mentés állapota a kezelőfelületen végig látszik
  („Mentve a szerverre 14:32” / piros hibaüzenet, ha nem sikerült).

## Miért PHP + SQLite

- A jelenlegi karikagyuru.com PHP-t futtat (`index.php`), tehát a tárhelyen jó eséllyel van PHP.
  A tárhely pontos típusát, PHP-verzióját és bővítményeit **nem ismerjük** – ehhez hozzáférés kell.
- Nem kell hozzá külön adatbázis-szolgáltatás, Node-szerver vagy fizetős külső szolgáltatás.
- Nincs külső csomag (Composer sem): egy fájlnyi kód, könnyen átnézhető.
- Ha a tárhelyen nincs `pdo_sqlite`, a tárolóréteg MySQL-re átírható (ugyanaz a PDO).

Szükséges: PHP 8.1+, `pdo_sqlite`, `gd`, `session`, `json`.

## Mit tud

| Végpont | Ki érheti el | Mire való |
|---|---|---|
| `GET /api/health` | bárki | él-e, be van-e állítva jelszó |
| `GET /api/state` | bárki | árak, gyűrűk, szabályok (érdeklődőadat nélkül) |
| `POST /api/inquiry` | bárki | ajánlatkérés rögzítése (ellenőrzés, robotcsapda, óránként 5/IP) |
| `GET /api/photo/<név>.jpg` | bárki | feltöltött termékfotó |
| `POST /api/login`, `POST /api/logout`, `GET /api/me` | – | belépés jelszóval, munkamenet |
| `PUT /api/state` | admin + CSRF | mentés új változatként; ütközésnél 409, nem ír felül |
| `GET /api/versions`, `POST /api/revert` | admin | változatok listája, visszaállítás |
| `GET /api/inquiries`, `POST /api/inquiry-status` | admin | érdeklődések, állapotuk |
| `POST /api/photo` | admin + CSRF | képfeltöltés (JPG/PNG/WebP, max. 8 MB, mindig újrakódolva) |

Biztonság: jelszó `password_hash`-sel tárolva; HttpOnly + SameSite=Strict süti (HTTPS-en Secure);
CSRF-jel minden módosításnál; 5 hibás belépés után 15 perc zárolás; a látogató nem kap sütit;
IP-cím helyett napi sózott lenyomat; a feltöltött kép újrakódolva (EXIF nélkül), véletlen néven;
az adatmappa a webgyökéren kívül. E-mail-küldés **szándékosan nincs** benne.

A szerver csak szerkezetet és értéktartományt ellenőriz (pl. nincs negatív grammár, titánnak nincs grammára).
Ez **nem szakmai jóváhagyás** – azt továbbra is az ötvös adja.

## Helyi futtatás

```sh
export KG_DATA=/tmp/kg-adat            # a webgyökéren kívül!
php bin/setup.php                      # bekéri az admin jelszót (min. 12 karakter)
php -S 127.0.0.1:8790 -t public public/index.php
curl http://127.0.0.1:8790/api/health
```

Weboldallal együtt, szerver módban (ahogy a tárhelyen lesz):

```sh
KG_DATA=/tmp/kg-adat php -S 127.0.0.1:8792 dev/router.php
# → http://127.0.0.1:8792/  (a router kitölti a kg-api metát)
```

## Teszt

```sh
python3 tests/api_test.py              # 60 végpont-ellenőrzés, saját ideiglenes adatmappával
python3 tests/server_mode_e2e.py       # 18 böngészős ellenőrzés: oldal + API együtt
```

`api_test.py`: telepítés, jogosultság, CSRF, mentés/ütközés/visszaállítás, hibás adatok elutasítása,
érdeklődések (rögzített árral), képfeltöltés (álcázott PHP-fájl elutasítása), kilépés, zárolás.

`server_mode_e2e.py`: belépés (hibás/helyes jelszó), árváltoztatás → másik böngésző a szerverről kapja,
újratöltés után is megmarad, látogatói érdeklődés → megjelenik a kezelőfelületen, fotófeltöltés →
a látogató a szerverről kapja, két admin ütközése (a második nem ír felül, egyértelmű hiba), kilépés.

## Telepítés a tárhelyre (ha meglesz a hozzáférés)

1. A weboldal fájljai a webgyökérbe; ez a mappa `public/` tartalma a webgyökér `api/` alá
   (`index.php`, `.htaccess`); az `src/` és `bin/` a webgyökéren **kívül**, és az `index.php`
   `require` útvonalát ehhez kell igazítani.
2. `KG_DATA` környezeti változó: írható mappa a webgyökéren kívül.
3. `php bin/setup.php` – admin jelszó beállítása.
4. `index.html`: `<meta name="kg-api" content="api/">`.
5. HTTPS kötelező (a süti csak így kapja meg a Secure jelzőt).
6. Kipróbálás a tárhelyen: belépés, egy ármódosítás, egy érdeklődés, egy kép – és visszaállítás.

## Ami még hiányzik az éles használathoz

1. ~~A weboldal bekötése az API-ra~~ – kész (`js/api.js`).
2. Kipróbálás a tényleges tárhelyen (PHP-verzió, írási jog, HTTPS, `.htaccess`/nginx átirányítás).
3. Mentési rend az adatmappára (napi másolat), és annak kipróbált visszatöltése.
4. Adatkezelési tájékoztató és megőrzési idő az érdeklődőadatokra (az ügyféllel és jogilag egyeztetve).
5. Értesítés új érdeklődésről (e-mail) – csak jóváhagyás és valódi tesztlevél után.
6. Független biztonsági átnézés élesítés előtt.
