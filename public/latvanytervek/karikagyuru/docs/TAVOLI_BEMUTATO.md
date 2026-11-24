# Karikagyuru.com – távoli ügyfélteszt a DAEKON saját szerverén (V5.9)

**Állapot: telepítésre kész, NINCS telepítve.** Ebben a fejlesztési munkamenetben nem volt hozzáférés a DAEKON VPS-éhez,
ezért a távoli bemutató **nem fut online**. Az alábbi lépésekkel 20–30 perc alatt telepíthető. Minden része helyben ki van próbálva:
- `bemutato_e2e.py`: kapu, 14 ügyfélfeladat, visszaállítás;
- `admin_v59_e2e.py`: az új admin szerver módban;
- `mentes_test.py`: mentés és visszaállítás.

Az ötvös otthonról, a saját gépén vagy telefonján, **valódi szerveres mentéssel** próbálhatja ki: a változtatásai újratöltés után és másnap is megmaradnak.

## Mi garantált

| Követelmény | Megoldás |
|---|---|
| Külön tesztkörnyezet | Saját aldomain a DAEKON szerverén. Nem az ügyfél tárhelye, és nem más ügyfélé. |
| Külön adatbázis | Saját, üres adatmappa (`demo-install.php` nem üres mappába nem telepít). A kapu csak „bemutató” jelölésű adatbázissal indul. |
| HTTPS | Caddy automatikus tanúsítvánnyal. HTTPS-en a sütik Secure jelzést kapnak. |
| Külön bemutatóbelépés és adminbelépés | Két külön, véletlen jelszó. A bemutató jelszava a kezelőfelületet nem nyitja. 5 hibás próba után 15 perc zárolás. |
| Tartós szerveres mentés | SQLite a szerveren. Minden mentés új változat, a korábbi árak visszaállíthatók. |
| Szemléltető árak jelölése | Az oldal tetején „Zárt bemutató – az árak szemléltető mintaadatok” sáv. |
| Éles e-mail tiltva | A kapu minden beállítást felülírva `KG_MAIL_MODE=off`-ot állít. |
| Keresőindexelés tiltva | `X-Robots-Tag: noindex` minden válaszon, `robots.txt` mindent tilt, jelszó nélkül semmi nem látszik. |
| Nincs bejelentés nélküli éjszakai törlés | **Nincs automatikus visszaállítás.** Csak napi biztonsági mentés fut (az nem töröl). |
| Az ügyfél változtatásai megmaradnak | A visszaállítás csak kézzel, előre egyeztetve fut. |
| A fejlesztő biztonságosan visszaállíthat | `demo-reset.php` (a jelszavak maradnak). Előtte `mentes.php`, így a próbák vissza is hozhatók. |
| A 25 belső kérdés nem látszik | A tulajdonosi admin és az API nem adja ki. Fejlesztőnek: `bin/fejlesztoi-dontesek.php lista`. |

## Telepítés (Debian/Ubuntu VPS, Caddy + PHP-FPM)

Előfeltétel: DNS-rekord, pl. `kg-bemutato.daekon.hu → a VPS IP-címe` (a pontos név DAEKON-döntés).

```sh
# 1. csomagok (ha még nincsenek)
sudo apt install caddy php8.2-fpm php8.2-sqlite3 php8.2-gd
# 2. a bemutató csomag (a repositoryban, helyben)
bash services/karikagyuru-api/dev/demo-csomag.sh /tmp/kg-bemutato-csomag
#    feltöltés: scp -r /tmp/kg-bemutato-csomag vps:/srv/kg-bemutato
# 3. a VPS-en: külön felhasználó és adatmappa, a webgyökéren kívül
sudo useradd --system --home /srv/kg-bemutato kgdemo
sudo mkdir -p /srv/kg-bemutato/adat /srv/kg-bemutato/mentesek && sudo chown -R kgdemo: /srv/kg-bemutato && sudo chmod 700 /srv/kg-bemutato/adat /srv/kg-bemutato/mentesek
# 4. config.php (a kapu.php mellé): data = /srv/kg-bemutato/adat, site = …/webgyoker/bemutato/site, src = /srv/kg-bemutato/karikagyuru-api/src
# 5. telepítés – a két jelszót EGYSZER írja ki
sudo -u kgdemo KG_DATA=/srv/kg-bemutato/adat php /srv/kg-bemutato/karikagyuru-api/bin/demo-install.php
```

PHP-FPM pool (`/etc/php/8.2/fpm/pool.d/kgdemo.conf`): `user = kgdemo`, `listen = /run/php/kgdemo.sock`, `listen.owner = caddy`.

Caddyfile:
```
kg-bemutato.daekon.hu {
	root * /srv/kg-bemutato/webgyoker/bemutato
	header X-Robots-Tag "noindex, nofollow, noarchive"
	# minden kérés a kapun át (a kapu szolgálja ki a weboldalt és az API-t, jelszó után)
	rewrite * /kapu.php
	php_fastcgi unix//run/php/kgdemo.sock
}
```
`sudo systemctl reload php8.2-fpm caddy`

> A Caddy- és PHP-FPM-beállítás a VPS-en még nincs kipróbálva (helyben `php -S … kapu.php` fut). Az első telepítéskor az „Átadás előtti próba” öt pontja kötelező.

Napi biztonsági mentés (törlés nélkül; crontab -u kgdemo):
```
20 3 * * * KG_DATA=/srv/kg-bemutato/adat php /srv/kg-bemutato/karikagyuru-api/bin/mentes.php /srv/kg-bemutato/mentesek
```

## Átadás előtti próba (5 perc)

1. `https://kg-bemutato.daekon.hu/` jelszó nélkül → jelszókérő; `…/robots.txt` → `Disallow: /`; a válaszfejlécben `X-Robots-Tag: noindex`.
2. Bemutató jelszóval be → katalógus, felül a „Zárt bemutató” sáv.
3. `#/admin` → külön admin jelszó. Grammár átírása → „Az árak sikeresen mentve.” → újratöltés után is megvan.
4. Ajánlatkérés képpel → az adminban megjelenik; levél nem megy ki.
5. `mentes.php` lefut, `mentes-ellenorzes.php` rendben.

## Mit kap az ötvös

- A címet és a **bemutató jelszavát** (külön üzenetben).
- Az **admin jelszót** (külön üzenetben vagy telefonon).
- Egy mondatot: „A kezelőfelületen próbáljon ki bármit – semmi nem kerül a valódi weboldalra, és nem vész el: minden mentés megmarad.”

## Visszaállítás és eltávolítás (fejlesztő)

- Bemutató visszaállítása (előtte szólj az ügyfélnek, és ments):
  `mentes.php …` majd `sudo -u kgdemo KG_DATA=/srv/kg-bemutato/adat php …/bin/demo-reset.php`
- Eltávolítás: a Caddy-blokk, a pool, a cron és a `/srv/kg-bemutato` törlése.
