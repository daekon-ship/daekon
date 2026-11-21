# Jelszóval védett online bemutató – telepítés

**Állapot (V5.6):** a bemutató a saját gépen ugyanúgy fut, mint a tárhelyen (`demo/kapu.php`), és a telepítési csomag elkészül.
**Online még nincs fent.** Nincs hozzá tárhely-hozzáférés. Más DAEKON-ügyfél tárhelyére nem telepítjük.

## Helyben (most is működik)

```sh
bash services/karikagyuru-api/dev/bemutato.sh          # → http://127.0.0.1:8792/  (kiírja a két jelszót)
KG_MARAD=1 bash services/karikagyuru-api/dev/bemutato.sh   # az adatok megmaradnak a következő indításig
```

Kell hozzá: PHP 8.1+ (pdo_sqlite, gd). Node nem kell.

## Hogyan védi magát

| Követelmény | Megoldás |
|---|---|
| Soha nem használ éles ügyféladatot | Saját, üres adatmappa. A `demo-install.php` nem üres mappába nem telepít. A kapu csak „demo” jelölésű adatbázissal indul: éles adatmappára állítva 503-mal leáll. A `demo-reset.php` éles adatbázist nem töröl (teszt: `demo_kapu_test.py`). |
| Külön adatbázis | `KG_DATA` = a bemutató saját mappája (pl. `kg-bemutato-adat`), a webgyökéren kívül. |
| Szemléltető árak jelölve | Felül sáv minden oldalon: „Zárt bemutató – az árak szemléltető mintaadatok, nem az ötvös árai”. Az ár mellett: „szemléltető mintaár”. A jelszókérő is kimondja. |
| Nem küld valódi e-mailt | A kapu `KG_MAIL_MODE=off`-ot állít. Ez minden levélbeállítást felülír, akkor is, ha az adatmappában van `mail.json`. |
| Nem indexelhető | `X-Robots-Tag: noindex, nofollow, noarchive` minden válaszon, `<meta name="robots">`, a `robots.txt` mindent tilt, és jelszó nélkül semmi nem látszik. |
| Jelszóval védett hozzáférés | Az egész oldal (weboldal, képek, JavaScript, API) a bemutató jelszava mögött van. Aláírt, 12 órás, HttpOnly süti; 5 hibás próbálkozás után 15 perc zárolás. |
| Az admin külön védett | A kezelőfelülethez külön admin jelszó kell (a bemutató jelszava nem nyitja, és fordítva). Saját munkamenet, CSRF-jel, zárolás. |
| Egyszerű visszaállítás | `KG_DATA=… php bin/demo-reset.php`: kiinduló mintaadat, érdeklődések és képek törölve, a jelszavak maradnak. Éjjeli cronra is tehető. |
| A demó nem kerül észrevétlenül élesbe | Éles módban „demo” jelölésű adat nem menthető (422). Bemutató módban minden mentés „demo” jelölést kap. Az élesítési ellenőrzés demó adattal tilt. A demo-fájlok (`demo/`, `bin/demo-*`, `dev/`) nem részei az éles feltöltésnek (TELEPITES.md 13. pont). |

A teszt kiszolgálja a weboldalt, de a `tests/`, `docs/`, `.md`, `.py`, `.php` fájlokat nem.

## Telepítés tárhelyre (ha lesz hozzáférés)

**Ajánlott:** külön aldomain, pl. `bemutato.<daekon-domain>`, vagy egy alkönyvtár a DAEKON saját tárhelyén. **Ne** az ügyfél éles tárhelye, és **ne** más ügyfél tárhelye legyen.

**Feltételek:** PHP 8.1+ (pdo_sqlite, gd), Apache `mod_rewrite` (nginx esetén: minden kérés a `kapu.php`-ra), HTTPS, SSH vagy cron/parancs futtatási lehetőség.

1. A csomag összeállítása:
   ```sh
   bash services/karikagyuru-api/dev/demo-csomag.sh /tmp/kg-bemutato-csomag
   ```
2. Feltöltés:
   - `webgyoker/bemutato/` → a webgyökérbe (pl. `public_html/bemutato/`);
   - `karikagyuru-api/` → a webgyökéren **kívülre**.
3. Külön, üres adatmappa a webgyökéren kívül, pl. `/home/FELHASZNALO/kg-bemutato-adat`.
4. `config.minta.php` → `config.php`, benne a három útvonal: data, site, src.
5. Telepítés:
   ```sh
   KG_DATA=/home/FELHASZNALO/kg-bemutato-adat php karikagyuru-api/bin/demo-install.php
   ```
   A két jelszót egyszer írja ki. A bemutató jelszavát kapja az ötvös, az admin jelszót a bemutatás előtt add meg neki.
6. Kipróbálás:
   - jelszó nélkül a jelszókérő jelenik meg;
   - `…/robots.txt` mindent tilt;
   - belépés után a teljes katalógus látszik;
   - a kezelőfelület külön jelszót kér;
   - egy érdeklődés képpel beérkezik;
   - nem megy ki levél;
   - `demo-reset.php` után minden visszaáll.
7. Opcionális éjjeli visszaállítás:
   ```
   0 4 * * * KG_DATA=/home/FELHASZNALO/kg-bemutato-adat php /home/FELHASZNALO/karikagyuru-api/bin/demo-reset.php
   ```

**Eltávolítás:** a `bemutato/` mappa, a `karikagyuru-api/` és az adatmappa törlése. Más nem marad utána.
