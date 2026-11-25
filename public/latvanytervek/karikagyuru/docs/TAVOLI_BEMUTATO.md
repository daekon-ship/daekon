# Karikagyuru.com – távoli ügyfélbemutató a DAEKON VPS-én (V5.10.1)

**Állapot: telepítésre kész, NINCS telepítve, NEM fut online.**
A V5.10-es munkamenetben nem volt hozzáférés a VPS-hez:
- nincs SSH-kulcs, jelszó, szerver-cím vagy vezérlőpult-hozzáférés;
- a fejlesztői környezet hálózata csak a GitHubot és a csomagtárakat éri el;
- a DNS-t sem lehetett módosítani.

Amíg az alábbi lépések le nem futnak, és a 7. pont próbája kívülről, HTTPS-en sikeres nem lesz, ne küldj címet az ötvösnek.

Ami a V5.10-ben ellenőrizve van, a telepítési csomag pontos másolatán, valódi PHP + SQLite háttérrel:
- végpontig tartó böngészős próba: `services/karikagyuru-api/tests/v510_vegso_e2e.py`, 124 ellenőrzés;
- mentés, visszaállítás üres mappába és sérült mentés felismerése.

Ami **nincs** kipróbálva: a webszerver (nginx/Caddy), a PHP-FPM pool, a HTTPS-tanúsítvány és a VPS-en végzett mentés.

## Gyors út – három parancs (V5.10)

A lenti lépéseket két szkript végzi el:

```sh
# 1. a laptopon (a repositoryból): csomag + feltöltés
bash services/karikagyuru-api/dev/demo-csomag.sh /tmp/kg-bemutato-csomag
scp -r /tmp/kg-bemutato-csomag services/karikagyuru-api/dev/vps-felmeres.sh services/karikagyuru-api/dev/vps-telepites.sh vps:/tmp/
# 2. a VPS-en: felmérés, majd ellenőrzés (semmit nem módosít), majd telepítés
ssh vps 'sudo bash /tmp/vps-felmeres.sh' > felmeres.txt
ssh vps 'sudo bash /tmp/vps-telepites.sh /tmp/kg-bemutato-csomag'               # kiírja: zöld, vagy mi hiányzik (ÁLLJ)
ssh vps 'sudo bash /tmp/vps-telepites.sh /tmp/kg-bemutato-csomag --vegrehajt'   # csak ha minden zöld
ssh vps 'sudo bash /tmp/vps-telepites.sh --mentesproba'                          # mentés + visszaállítás külön mappába
# 3. a laptopról, kívülről, HTTPS-en (a jelszavakat bekéri; a próbaadatot a végén visszaállítja)
python3 services/karikagyuru-api/dev/tavoli_proba.py https://kg-bemutato.daekon.hu/
```

A `vps-telepites.sh` kizárólag új fájlokat, felhasználót és mappát hoz létre, a saját nevén. Megáll, ha:
- nincs DNS-rekord;
- a DNS nem erre a gépre mutat;
- már létezik valami ugyanazzal a névvel;
- nem nginx vagy Caddy fut;
- a webszerver vagy a PHP-FPM konfigurációtesztje hibát ad. Ilyenkor a saját új fájljait visszaveszi.

A két jelszót a `/root/kg-bemutato-jelszavak.txt` fájlba írja (0600), a képernyőre nem.

**Kipróbálva:**
- az ellenőrző ága helyben, webszerver nélküli gépen: helyesen megáll, semmit nem változtat;
- a `tavoli_proba.py` a csomag helyi példányán: 34 ellenőrzés.

A telepítő ága valódi nginx/PHP-FPM-en még **nincs** kipróbálva.

## 0. Felmérés – előbb ez, csak olvas

```sh
scp services/karikagyuru-api/dev/vps-felmeres.sh vps:/tmp/ && ssh vps 'sudo bash /tmp/vps-felmeres.sh kg-bemutato.daekon.hu' > felmeres.txt
```

A szkript semmit nem telepít, nem módosít és nem indít újra. Ezt listázza:
- OS, tárhely;
- melyik webszerver figyel a 80/443-as porton;
- PHP és modulok, PHP-FPM poolok;
- domainek (csak nevek), tanúsítványok, tűzfal;
- DNS, ütközések, cron.

**Döntés a felmérés alapján:**

| Ha a 80/443-at már… | Akkor |
|---|---|
| **nginx** szolgálja ki (DAEKON OS, más oldalak) | Új `server` blokk (lent: 3/A), tanúsítvány certbottal. **Második webszervert NEM telepítünk.** |
| **Caddy** szolgálja ki | Új blokk a Caddyfile-ba (3/B). |
| **Apache** szolgálja ki | Új VirtualHost + PHP-FPM proxy; a csomag `.htaccess`-e kész. |
| Semmi | Caddy (automatikus HTTPS) – csak ha a gépen tényleg semmi más nem fut. |

Ha a felmérés szerint a DAEKON OS vagy más ügyfél szolgáltatása ugyanazt a PHP-FPM poolt, felhasználót vagy mappát használná, **állj meg**. A bemutató mindenhol saját nevet kap: `kgdemo` felhasználó, `/srv/kg-bemutato`, saját pool és socket.

## 1. DNS (külön jóváhagyás kell)

Új A-rekord: `kg-bemutato.daekon.hu → a VPS IP-címe`. A pontos név DAEKON-döntés; a meglévő rekordokhoz ne nyúlj.
Ellenőrzés: `dig +short kg-bemutato.daekon.hu`.

## 2. Csomag, felhasználó, adatmappa (a webgyökéren kívül)

```sh
# helyben (a repositoryból):
bash services/karikagyuru-api/dev/demo-csomag.sh /tmp/kg-bemutato-csomag
scp -r /tmp/kg-bemutato-csomag vps:/tmp/
# a VPS-en:
sudo useradd --system --home /srv/kg-bemutato --shell /usr/sbin/nologin kgdemo
sudo mkdir -p /srv/kg-bemutato && sudo cp -r /tmp/kg-bemutato-csomag/* /srv/kg-bemutato/
sudo mkdir -p /srv/kg-bemutato/adat /srv/kg-bemutato/mentesek /srv/kg-bemutato/munkamenet
sudo chown -R root:kgdemo /srv/kg-bemutato && sudo chmod -R g-w,o-rwx /srv/kg-bemutato
sudo chown kgdemo: /srv/kg-bemutato/adat /srv/kg-bemutato/mentesek /srv/kg-bemutato/munkamenet
sudo chmod 700 /srv/kg-bemutato/adat /srv/kg-bemutato/mentesek /srv/kg-bemutato/munkamenet
# config.php a kapu.php mellé (NEM kerül gitbe):
sudo tee /srv/kg-bemutato/webgyoker/bemutato/config.php >/dev/null <<'PHP'
<?php return ['data' => '/srv/kg-bemutato/adat', 'site' => __DIR__ . '/site', 'src' => '/srv/kg-bemutato/karikagyuru-api/src'];
PHP
# telepítés: a két jelszót EGYSZER írja ki – jegyezd fel jelszókezelőbe, ne naplóba, ne gitbe
sudo -u kgdemo KG_DATA=/srv/kg-bemutato/adat php /srv/kg-bemutato/karikagyuru-api/bin/demo-install.php
```

Így a webszerver csak a `webgyoker/bemutato` mappát látja. Az adatbázis, a feltöltött fotók, a referenciaképek, a mentések és az API forrása kívül esik rajta.

**Saját PHP-FPM pool** – `/etc/php/<verzió>/fpm/pool.d/kgdemo.conf`; a verzió a felmérésből derül ki, Ubuntu 24.04-en 8.3:

```ini
[kgdemo]
user = kgdemo
group = kgdemo
listen = /run/php/kgdemo.sock
listen.owner = www-data        ; nginx/Apache: www-data · Caddy: caddy
listen.group = www-data
listen.mode = 0660
pm = ondemand
pm.max_children = 4
pm.process_idle_timeout = 60s
php_admin_value[open_basedir] = /srv/kg-bemutato/:/tmp/
php_admin_value[session.save_path] = /srv/kg-bemutato/munkamenet
php_admin_value[upload_max_filesize] = 10M     ; 8 MB-os fotók – az alapértelmezett 2 MB kevés!
php_admin_value[post_max_size] = 32M           ; ajánlatkérés legfeljebb 3 képpel
php_admin_value[memory_limit] = 256M           ; nagy fotók átméretezése (GD)
php_admin_flag[expose_php] = off
php_admin_value[disable_functions] = exec,passthru,shell_exec,system,proc_open,popen
```

A csomagban a `.user.ini` ugyanezeket a feltöltési korlátokat adja, tartaléknak. Ha a korlát mégis kicsi, a V5.10-től az admin és az ajánlatkérő érthetően kiírja: „A kép túl nagy ehhez a szerverhez (legfeljebb N MB)”. Nem jelez hamisan sikert.

## 3/A. nginx (ha már ez fut)

`/etc/nginx/sites-available/kg-bemutato.daekon.hu` → `ln -s` a `sites-enabled`-be:

```nginx
server {
    listen 80; listen [::]:80;
    server_name kg-bemutato.daekon.hu;
    root /srv/kg-bemutato/webgyoker/bemutato;
    client_max_body_size 32m;
    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
    # MINDEN kérés a kapun át (weboldal, API, robots.txt); más fájl közvetlenül nem érhető el
    location / {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root/kapu.php;
        fastcgi_param SCRIPT_NAME /kapu.php;
        fastcgi_pass unix:/run/php/kgdemo.sock;
    }
}
```

Utána:
1. `sudo nginx -t`. **Csak hibátlan eredménynél** jöhet a `sudo systemctl reload nginx`.
2. HTTPS: `sudo certbot --nginx -d kg-bemutato.daekon.hu`. Csak ezt az egy domaint add meg; a meglévő tanúsítványokhoz ne nyúlj.

## 3/B. Caddy (ha már ez fut)

```
kg-bemutato.daekon.hu {
	root * /srv/kg-bemutato/webgyoker/bemutato
	header X-Robots-Tag "noindex, nofollow, noarchive"
	request_body { max_size 32MB }
	rewrite * /kapu.php
	php_fastcgi unix//run/php/kgdemo.sock
}
```

Utána: `sudo caddy validate --config /etc/caddy/Caddyfile`, majd `sudo systemctl reload caddy`.

## 4. Tűzfal

Csak a 80/443 kell, ami a meglévő oldalak miatt már nyitva van. Új portot nem nyitunk; a PHP-FPM unix socketen fut.

## 5. Napi mentés (törlés nélkül)

```sh
sudo crontab -u kgdemo -e
20 3 * * * KG_DATA=/srv/kg-bemutato/adat php /srv/kg-bemutato/karikagyuru-api/bin/mentes.php /srv/kg-bemutato/mentesek >> /srv/kg-bemutato/mentesek/naplo.txt 2>&1
```

- A mentés tartalma: adatbázis, termékfotók, referenciaképek, beállítások, SHA-256 ellenőrzőösszegekkel.
- Régi mentést a cron nem töröl. Törölni csak kézzel, engedéllyel lehet: `mentes-torles.php`. Alapból csak kiírja, mi törölhető; ténylegesen csak a `--torles` kapcsolóval töröl.

## 6. Mentés- és visszaállítási próba a VPS-en (kötelező, egyszer)

```sh
M=/srv/kg-bemutato/mentesek
sudo -u kgdemo KG_DATA=/srv/kg-bemutato/adat php /srv/kg-bemutato/karikagyuru-api/bin/mentes.php $M          # 0 = kész
sudo -u kgdemo php /srv/kg-bemutato/karikagyuru-api/bin/mentes-ellenorzes.php $M/kg-mentes-*                    # 0 = rendben
sudo -u kgdemo mkdir /srv/kg-bemutato/proba-visszaallitas && sudo chmod 700 /srv/kg-bemutato/proba-visszaallitas
sudo -u kgdemo KG_DATA=/srv/kg-bemutato/proba-visszaallitas/adat php /srv/kg-bemutato/karikagyuru-api/bin/visszaallitas.php $M/kg-mentes-* --bemutato
stat -c '%a %U %n' $M /srv/kg-bemutato/adat           # 700 kgdemo – más felhasználó nem olvashatja
sudo systemctl restart php*-fpm && curl -s -o /dev/null -w '%{http_code}\n' https://kg-bemutato.daekon.hu/   # újraindítás után is 200
```

A próba-visszaállítás mappáját utána a fejlesztő törli; a valódi mentésekhez ne nyúlj.

## 7. Átadás előtti próba – kívülről, HTTPS-en (enélkül NEM kész)

1. `curl -sI https://kg-bemutato.daekon.hu/`:
   - érvényes tanúsítvány;
   - `X-Robots-Tag: noindex`;
   - jelszókérő oldal.
2. `curl -s https://kg-bemutato.daekon.hu/robots.txt` → `Disallow: /`.
   `curl -sI https://kg-bemutato.daekon.hu/config.php` → nem a config tartalma (a kapu válaszol).
3. Telefonon, mobilneten: bemutató jelszó → katalógus, felül „Zárt bemutató”. Egy mintagyűrű beállítása, majd ajánlatkérés képpel.
4. `#/admin` → külön admin jelszó:
   - grammár átírása → „Az árak sikeresen mentve.” → kilépés, újra belépés → megvan;
   - korábbi ár visszaállítása;
   - fotócsere egy 5–8 MB-os telefonos fotóval.
5. A böngésző fejlesztői eszközében:
   - a `kg_admin` és a `kg_demo_kapu` süti `Secure` és `HttpOnly`;
   - a `kg_admin` `SameSite=Strict`.
6. A 6. pont mentési próbája lefutott.
7. A teljes próba után futtasd le a `demo-reset.php`-t, előtte mentéssel. Így az ötvös tiszta állapotot kap.

Csak ha mind a hét pont rendben van, akkor mehet a cím az ötvösnek: `docs/OTVOS_UTMUTATO.md`, egy oldal.

## Mi garantált a kódban (ellenőrizve)

| Követelmény | Megoldás |
|---|---|
| Külön adatbázis | `demo-install.php` csak üres mappába telepít. A kapu csak „bemutató” jelölésű adatbázissal indul, éles adatmappával megtagadja a működést. |
| Két külön belépés | A bemutató jelszava a kezelőfelületet nem nyitja; 5 hibás próba után 15 perc zárolás (mindkettőnél). |
| Munkamenet | `HttpOnly`, admin `SameSite=Strict`, HTTPS-en `Secure`, belépéskor új azonosító, 2 óra tétlenség után lejár. |
| CSRF | Minden író kéréshez a belépéskor kapott CSRF-token kell. |
| E-mail | A kapu `KG_MAIL_MODE=off`-ot állít – bemutatóból levél nem mehet ki. |
| Indexelés | `X-Robots-Tag: noindex` minden válaszon, `robots.txt` mindent tilt, jelszó nélkül semmi nem látszik. |
| Megmaradó módosítások | SQLite a szerveren. Automatikus visszaállítás nincs, csak kézi `demo-reset.php`, előtte mentéssel. |
| A 25 belső kérdés | Az admin és az API nem adja ki. Fejlesztőnek: `bin/fejlesztoi-dontesek.php lista`. |
| Éles oldal | A bemutató a karikagyuru.com-ra semmit nem küld. A böngésző onnan csak a 85 még nem helyben tárolt termékfotót tölti le, olvasásra. |
