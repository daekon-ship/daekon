# Karikagyuru.com – szerveroldali kezelőfelület-API (fejlesztői váz)

**Állapot: bekötve és helyben végig tesztelve, valódi tárhelyen még nem futott.**
A weboldal (`public/latvanytervek/karikagyuru/`) két módban működik:

- **Helyi mód** – ha az `index.html`-ben `<meta name="kg-api" content="">` (pl. GitHub Pages):
  minden a böngészőben marad, mint eddig.
- **Szerver mód** – ha `<meta name="kg-api" content="api/">`: az oldal a szerverről tölti az árakat,
  a kezelőfelület jelszót kér, minden mentés a szerverre megy (változatként), az érdeklődések
  a szerveren gyűlnek, a fotókból a szerver optimalizált JPEG-et készít (legfeljebb 2400 px, EXIF nélkül – az eredeti fájl nem marad meg; ha kell, ez külön funkcióként tervezhető). A mentés állapota a kezelőfelületen végig látszik
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
| `GET /api/state` | bárki: nyilvános nézet · admin: teljes állapot | látogatónak csak jóváhagyott árak és a nyilvános oldalhoz szükséges adatok (beszerzési ár, felár, árnapló, érdeklődés nélkül) |
| `POST /api/inquiry` | bárki | ajánlatkérés rögzítése (ellenőrzés, robotcsapda, óránként 5/IP) |
| `GET /api/photo/<név>.jpg` | bárki | feltöltött termékfotó |
| `POST /api/login`, `POST /api/logout`, `GET /api/me` | – | belépés jelszóval, munkamenet |
| `PUT /api/state` | admin + CSRF | mentés új változatként; ütközésnél 409, nem ír felül |
| `GET /api/versions`, `POST /api/revert` | admin | változatok listája, visszaállítás |
| `GET /api/inquiries`, `POST /api/inquiry-status` | admin | érdeklődések, állapotuk, e-mail-értesítés állapota |
| `GET /api/mail-status`, `POST /api/mail-test` | admin (+CSRF) | e-mail-beállítás állapota (jelszó nélkül), próbalevél gombnyomásra |
| `POST /api/photo` | admin + CSRF | képfeltöltés (JPG/PNG/WebP, max. 8 MB → optimalizált JPEG, max. 2400 px, az eredeti nem marad meg) |

Biztonság: jelszó `password_hash`-sel tárolva; HttpOnly + SameSite=Strict süti (HTTPS-en Secure);
CSRF-jel minden módosításnál; 5 hibás belépés után 15 perc zárolás; a látogató nem kap sütit;
IP-cím helyett napi sózott lenyomat; a feltöltött kép újrakódolva (EXIF nélkül), véletlen néven;
az adatmappa a webgyökéren kívül. E-mail-értesítés új érdeklődésről: `src/Mailer.php`, alapból kikapcsolva (beállítás: `TELEPITES.md` 7. pont).

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
python3 tests/api_test.py              # 112 végpont-ellenőrzés (nyilvános nézet szivárgásvizsgálata; V5.9: fejlesztői adat elzárása, romboló mentés tiltása, fejlesztői visszaállítás), saját ideiglenes adatmappával
python3 tests/server_mode_e2e.py       # 32 böngészős ellenőrzés: oldal + API együtt (referenciaképes érdeklődéssel)
python3 tests/mail_test.py             # 24 ellenőrzés: e-mail-értesítés helyi SMTP-álszerverrel (valódi levél nem megy ki)
python3 tests/server_failures_e2e.py   # 17 ellenőrzés: API-kiesés, sikertelen mentés, lejárt belépés, sikertelen érdeklődés
python3 tests/upload_test.py           # 22 ellenőrzés: ügyfél-referenciakép feltöltése, privát tárolás, törlés, megőrzés
python3 tests/demo_e2e.py              # 18 böngészős ellenőrzés: a nem éles bemutató példány
python3 tests/demo_kapu_test.py        # 49 ellenőrzés: jelszóval védett bemutató (kapu, noindex, e-mail tiltás, külön admin, visszaállítás, éles adat védelme)
python3 tests/bemutato_e2e.py          # 71 böngészős ellenőrzés: a bemutató végig a kapun át, 360/390/430 px + admin (V5.8: árverzió-visszaállítás, új műhelymunka fotóval, ügyféljóváhagyási központ)
python3 tests/foto_test.py             # 16 ellenőrzés: termékfotó-ellenőrző és -letöltő eszköz helyi álszerverrel
python3 tests/mentes_test.py           # 87 ellenőrzés (rootként, tmpfs-sel): mentés, teljes visszaállítás és újraindítás, 13 valóban előidézett hibaeset, párhuzamos írás, megőrzés
python3 tests/admin_v59_e2e.py         # 17 ellenőrzés: V5.9 admin szerver módban (régi címek belépés nélkül, valós mentés-visszaigazolás, mentési hiba, fénykép, romboló mentés tiltása)
python3 tests/v510_vegso_e2e.py        # 124 ellenőrzés (V5.10): a TELEPÍTÉSI CSOMAG végig böngészőben – kapu, 115 termékoldal, konfigurátor, űrlapok, admin, kilépés/belépés, fotó, műhelymunka, 6 képernyőméret, hálózati szivárgás, mentés + visszaállítás üres mappába (KG_V510_KEPEK=mappa: képernyőképek)
```

`api_test.py`: telepítés, jogosultság, CSRF, mentés/ütközés/visszaállítás, hibás adatok elutasítása,
érdeklődések (rögzített árral), képfeltöltés (álcázott PHP-fájl elutasítása), kilépés, zárolás.

`server_mode_e2e.py`: belépés (hibás/helyes jelszó), árváltoztatás → másik böngésző a szerverről kapja,
újratöltés után is megmarad, látogatói érdeklődés → megjelenik a kezelőfelületen, fotófeltöltés →
a látogató a szerverről kapja, két admin ütközése (a második nem ír felül, egyértelmű hiba), kilépés.

## Ügyfél-referenciaképek (V5.5)

- Feltöltés az érdeklődéssel egy kérésben (`multipart`: `payload` JSON + `images[]`), legfeljebb 3 kép, egyenként 8 MB,
  JPG/PNG/WebP. A szerver ellenőrzi és újrakódolja (JPEG, max. 2000 px, EXIF nélkül); ha bármelyik hibás,
  az érdeklődés sem jön létre, és a látogató érthető hibaüzenetet kap.
- Tárolás: `$KG_DATA/inquiry-files/<azonosító>/` – nem a termékfotók között, nem a webgyökérben.
  Megtekintés csak belépett adminnak: `GET /api/inquiry-file/s<id>/<név>.jpg` (`no-store`).
- Törlés: `POST /api/inquiry-delete` (admin), vagy megőrzési idő szerint: `php bin/purge.php <napok> [--minden]`
  (alapból csak a lezárt érdeklődéseket törli; cron-ra tehető, a napok száma ügyféllel egyeztetendő).

## Jelszóval védett bemutató (V5.6)

```sh
bash dev/bemutato.sh        # helyben: http://127.0.0.1:8792/ – bemutató jelszó + külön admin jelszó (kiírja)
```

- `demo/kapu.php`: egyetlen belépési pont a teljes bemutatóhoz (weboldal + API); `src/DemoGate.php`: jelszókapu.
- `bin/demo-install.php` (csak üres adatmappába), `bin/demo-reset.php` (csak bemutató-adatbázison), `dev/demo-csomag.sh` (feltöltésre kész mappák).
- Bemutató módban (`KG_DEMO=1`) minden mentés „demo” jelölést kap, e-mail nem megy ki; éles módban „demo” adat nem menthető (422).
- Mintaadat: `demo/minta-allapot.json` (a `dev/make-demo-state.mjs` állítja elő a szemléltető `dev/demo-dataset.json`-ból).
- Részletek, biztonsági modell, tárhelyre telepítés: `public/latvanytervek/karikagyuru/docs/BEMUTATO_TELEPITES.md`.
- A `demo/`, `dev/`, `tests/` és a `bin/demo-*` **nem** kerül az éles tárhelyre.

## Termékfotók (V5.6)

`node dev/foto-ellenorzes.mjs` – mind a 115 termék fotójának ellenőrzése; a karikagyuru.com-os képek letöltése és optimalizálása
(1600/800 px JPEG) az `img/termekek/` mappába; jelentés: `docs/KATALOGUS_JELENTES.json` és `.md`. Kell hozzá: Node 18+, `sharp`.

## Telepítés a tárhelyre (ha meglesz a hozzáférés)

Részletes ellenőrzőlista: `public/latvanytervek/karikagyuru/docs/TELEPITES.md`. Röviden:

1. A weboldal fájljai a webgyökérbe; ez a mappa `public/` tartalma a webgyökér `api/` alá
   (`index.php`, `.htaccess`); az `src/` és `bin/` a webgyökéren **kívül**, és az `index.php`
   `require` útvonalát ehhez kell igazítani.
2. `KG_DATA` környezeti változó: írható mappa a webgyökéren kívül.
3. `php bin/setup.php` – admin jelszó beállítása.
4. `index.html`: `<meta name="kg-api" content="api/">`.
5. HTTPS kötelező (a süti csak így kapja meg a Secure jelzőt).
6. Kipróbálás a tárhelyen: belépés, egy ármódosítás, egy érdeklődés, egy kép – és visszaállítás.

## Fejlesztői műveletek (V5.9)

| Parancs / beállítás | Feladat |
|---|---|
| `KG_DATA=… php bin/fejlesztoi-dontesek.php lista \| export \| beallit <tétel> <nyitott\|valasz\|atvezetve> "<válasz>"` | a 25 tisztázandó kérdés (az admin API nem adja ki) |
| `KG_FEJLESZTOI_VISSZAALLITAS=1` | csak ezzel él a `POST /revert` (teljes változat-visszaállítás); élesben ne legyen bekapcsolva |
| `PUT /state` | V5.9: elutasítja, ha gyűrű eltűnne, egyszerre több műhelymunka törlődne, vagy a korábbi árak eltűnnének (422) |
| `POST /inquiry-status` | állapotok: `uj`, `hivando` (visszahívásra vár), `visszahivva`, `elfogadva`, `lezarva` |

## Biztonsági mentés és visszaállítás (V5.8.1)

| Parancs | Feladat |
|---|---|
| `KG_DATA=… php bin/mentes.php <célmappa> [--letrehoz] [--hianyos-engedve]` | mentés zárolással, ellenőrzött másolással; kilépési kód 0/1/2/3/4/5 |
| `php bin/mentes-ellenorzes.php <mentésmappa>` | kész mentés ellenőrzése visszaállítás nélkül |
| `KG_DATA=<új, üres mappa> php bin/visszaallitas.php <mentésmappa> [--bemutato]` | visszaállítás, meglévő adatot nem ír felül |
| `php bin/mentes-torles.php <mappa> --napok N [--megtart K] [--torles]` | régi mentések törlése (alapból csak próbafuttatás; N az ügyféllel egyeztetendő) |

A logika: `src/Backup.php` (külső függőség nélkül). Az író végpontok mentés közben várnak (`KG_MENTES_VARAKOZAS`, alapból 20 mp), utána 503.
Részletek: `public/latvanytervek/karikagyuru/docs/MENTES_ES_VISSZAALLITAS.md`.

## Ami még hiányzik az éles használathoz

1. ~~A weboldal bekötése az API-ra~~ – kész (`js/api.js`).
2. Kipróbálás a tényleges tárhelyen (PHP-verzió, írási jog, HTTPS, `.htaccess`/nginx átirányítás).
3. Mentési rend az adatmappára (napi másolat), és annak kipróbált visszatöltése.
4. Az ügyfél végleges adatkezelési tájékoztatójának címe (`BUSINESS.adatkezeles`), és a megőrzési idő az érdeklődőadatokra és képekre (a `bin/purge.php` kész hozzá).
5. ~~Értesítés új érdeklődésről~~ – megírva; bekapcsolni csak jóváhagyott címmel és SMTP-adatokkal, próbalevéllel.
6. Független biztonsági átnézés élesítés előtt.
