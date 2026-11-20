# Karikagyuru.com – szerveroldali kezelőfelület-API (fejlesztői váz)

**Állapot: nincs élesítve, és a látványterv még nem ezt használja.** A bemutató oldal
(`public/latvanytervek/karikagyuru/`) továbbra is a böngésző `localStorage`-ába ment.
Ez a mappa azt a szerveroldalt tartalmazza, amelyre az éles kezelőfelület épülhet –
helyi gépen kipróbálva, automata teszttel, de valódi tárhelyen még nem futott.

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

## Teszt

```sh
python3 tests/api_test.py              # saját ideiglenes adatmappával indít szervert
```

58 ellenőrzés: telepítés, jogosultság, CSRF, mentés/ütközés/visszaállítás, hibás adatok elutasítása,
érdeklődések, képfeltöltés (álcázott PHP-fájl elutasítása), kilépés, zárolás.

## Ami még hiányzik az éles használathoz

1. A látványterv `js/store.js` tárolójának bekötése erre az API-ra (betöltés, mentés, belépőképernyő, hibajelzés).
2. Kipróbálás a tényleges tárhelyen (PHP-verzió, írási jog, HTTPS, `.htaccess`/nginx átirányítás).
3. Mentési rend az adatmappára (napi másolat), és annak kipróbált visszatöltése.
4. Adatkezelési tájékoztató és megőrzési idő az érdeklődőadatokra (az ügyféllel és jogilag egyeztetve).
5. Értesítés új érdeklődésről (e-mail) – csak jóváhagyás és valódi tesztlevél után.
6. Független biztonsági átnézés élesítés előtt.
