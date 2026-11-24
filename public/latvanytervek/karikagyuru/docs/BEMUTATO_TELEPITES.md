# Jelszóval védett online bemutató – telepítés

**Állapot (V5.8, 2026. 11. 22.):** a laptopos bemutató ki van próbálva: a `KG_MARAD=1 bash services/karikagyuru-api/dev/bemutato.sh` parancs telepít, kiírja a két jelszót, jelszó nélkül 401-et ad, újraindításkor a meglévő adatmappát használja (automata teszt: `bemutato_e2e.py`, 65 ellenőrzés). A bemutató a saját gépen ugyanúgy fut, mint a tárhelyen (`demo/kapu.php`), és a telepítési csomag elkészül.
**Online még nincs fent.** Nincs hozzá tárhely-hozzáférés. Más DAEKON-ügyfél tárhelyére nem telepítjük.

## Laptopos bemutató – pontos indítás

**Előfeltétel:** PHP 8.1 vagy újabb, `pdo_sqlite` és `gd` bővítménnyel. Node nem kell. A katalógus 85 fotója a régi karikagyuru.com-ról töltődik, ezért ehhez internet kell; internet nélkül ezeknél „Fotó hamarosan” látszik, minden más működik.

### Mac
1. Egyszer: `brew install php` (ha nincs Homebrew: https://brew.sh).
2. A repository mappájában:
   ```sh
   KG_MARAD=1 bash services/karikagyuru-api/dev/bemutato.sh
   ```
3. Kiírja a **bemutató jelszavát** és az **admin jelszót**. Jegyezd fel őket, mert csak az első indításkor jelennek meg (`KG_MARAD=1` mellett az adatok és a jelszavak megmaradnak).
4. Böngésző: `http://127.0.0.1:8792/` – a jelszókérő után a weboldal; a kezelőfelület: `http://127.0.0.1:8792/#/admin`.

### Windows (PowerShell)
1. Egyszer: PHP letöltése (https://windows.php.net/download), kicsomagolás pl. `C:\php`-be. A `php.ini-development` fájlt másold `php.ini`-re, és vedd ki a `;` jelet ezek elől: `extension=pdo_sqlite`, `extension=sqlite3`, `extension=gd`.
2. A repository mappájában:
   ```powershell
   $env:KG_DATA = "$env:USERPROFILE\kg-bemutato-adat"
   C:\php\php.exe services\karikagyuru-api\bin\demo-install.php
   C:\php\php.exe -S 127.0.0.1:8792 services\karikagyuru-api\demo\kapu.php
   ```
   A második sor csak az első alkalommal kell; az kiírja a két jelszót.
3. Böngésző: `http://127.0.0.1:8792/`.

### A bemutató előtti estén
- Indítsd el egyszer, lépj be mindkét jelszóval, és menj végig a forgatókönyvön.
- Utána állítsd vissza:
  - Mac: `KG_DATA=$HOME/.kg-bemutato-adat php services/karikagyuru-api/bin/demo-reset.php`
  - Windows: `C:\php\php.exe services\karikagyuru-api\bin\demo-reset.php` (a `$env:KG_DATA` beállítása után).
- Ha van idő és internet: `node services/karikagyuru-api/dev/foto-ellenorzes.mjs` letölti a karikagyuru.com-os fotókat helyi, optimalizált másolatba, így a bemutatón internet nélkül is minden kép látszik. Ehhez Node és `npm i sharp` kell.

### Telefonos próba ugyanazon a Wi-Fi-n

1. **Csak saját, jelszavas Wi-Fi-n** (otthon, iroda) vagy a saját telefon hotspotján. **Kávézó, szálloda, nyilvános Wi-Fi: soha.** A kapcsolat itt sima `http`, titkosítás nélkül: egy idegen hálózaton más is láthatná a beírt jelszót.
2. Indítás: `KG_HOST=0.0.0.0 KG_MARAD=1 bash services/karikagyuru-api/dev/bemutato.sh`
3. A laptop címe:
   - Mac: `ipconfig getifaddr en0` (pl. `192.168.1.23`);
   - Windows: `ipconfig` → „IPv4-cím”.
4. A telefon böngészőjébe: `http://192.168.1.23:8792/` (a saját címeddel). Először a bemutató jelszavát kéri.
5. Ha nem tölt be:
   - a laptop tűzfala kérdezhet („Engedélyezed a bejövő kapcsolatot a php-nak?”) → csak a saját hálózaton engedélyezd;
   - a telefon ugyanazon a Wi-Fi-n legyen, ne mobilneten.
6. **A bemutató után azonnal: Ctrl+C.** Amíg fut, a hálózaton bárki elérheti a jelszókérőt. A jelszó nélkül semmi nem látszik, 5 hibás próbálkozás után 15 percre zárol.
7. Az ügyfél telefonján **ne** mentsétek el a jelszót, és ne küldjétek el üzenetben.

### Az ötvös 14 saját próbája (a bemutatón ő csinálja, mi csak mutatjuk az utat)

| # | Feladat | Hol | Automata teszt |
|---|---|---|---|
| 1 | Megnyitja a katalógust | weboldal → Gyűrűk | bemutato_e2e, v58 |
| 2 | Kiválaszt egy mintagyűrűt (pl. 81184 - 81185 W) | keresés cikkszámra | bemutato_e2e |
| 3 | Méretet vált | termékoldal → Méret | bemutato_e2e |
| 4 | Engedélyezett anyagot választ (platina) | termékoldal → Anyag | bemutato_e2e |
| 5 | Kőszámot változtat | termékoldal → Gyémánt | bemutato_e2e |
| 6 | Látja, hogy változik a szemléltető ár | ármező | bemutato_e2e |
| 7 | Belép a kezelőfelületre | `#/admin`, admin jelszó | bemutato_e2e |
| 8 | Átír egy grammárat | Árak | bemutato_e2e |
| 9 | Látja az előtte–utána összevetést | Árak, mentés előtt | bemutato_e2e, v4 |
| 10 | Visszaállítja az előző árverziót | Árak → korábbi verziók | bemutato_e2e (V5.8), v4 |
| 11 | Jóváhagy egy gyűrűt | Jóváhagyás sorban | bemutato_e2e |
| 12 | Új műhelymunkát vesz fel | Műhelymunkák → + Új | bemutato_e2e (V5.8) |
| 13 | Fotót csatol hozzá | ugyanott, Fotók hozzáadása | bemutato_e2e (V5.8) |
| 14 | Megnéz egy próba-érdeklődést (képpel) | Érdeklődések | bemutato_e2e |

Minden adat szemléltető. A bemutató után a `demo-reset.php` mindent visszaállít; semmi nem kerül jóváhagyott, éles adatként sehova.
Az **Ügyféljóváhagyások** oldalon (Kezelőfelület → További) a kérdések egyben átnézhetők és kinyomtathatók. A bemutatón beírt válaszok is csak a bemutató adatbázisában maradnak.

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
| Egyszerű visszaállítás | `KG_DATA=… php bin/demo-reset.php`: kiinduló mintaadat, érdeklődések és képek törölve, a jelszavak maradnak. **Csak kézzel, az ügyfélnek előre szólva** (V5.9: automatikus éjjeli törlés nincs – az ügyfél próbái megmaradnak). |
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
7. **Nincs automatikus visszaállítás** (V5.9): az ötvös otthoni próbái megmaradnak. Visszaállítás csak kézzel, előre egyeztetve.
   Napi biztonsági mentés viszont legyen (törlés nélkül):
   ```
   20 3 * * * KG_DATA=/home/FELHASZNALO/kg-bemutato-adat php /home/FELHASZNALO/karikagyuru-api/bin/mentes.php /home/FELHASZNALO/kg-bemutato-mentesek
   ```
   VPS-re (HTTPS-sel) a pontos lépések: **`TAVOLI_BEMUTATO.md`**.

**Eltávolítás:** a `bemutato/` mappa, a `karikagyuru-api/` és az adatmappa törlése. Más nem marad utána.
