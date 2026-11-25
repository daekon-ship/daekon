#!/usr/bin/env bash
# Karikagyuru – a jelszóval védett bemutató telepítése a DAEKON VPS-re, a docs/TAVOLI_BEMUTATO.md lépései szerint (V5.10).
#
#   sudo bash vps-telepites.sh /tmp/kg-bemutato-csomag                   # ELLENŐRZÉS: semmit nem módosít, kiírja, mit tenne
#   sudo bash vps-telepites.sh /tmp/kg-bemutato-csomag --vegrehajt       # telepítés (csak ha minden ellenőrzés zöld)
#   sudo bash vps-telepites.sh --mentesproba                             # mentés + ellenőrzés + visszaállítás külön mappába
#
# A csomag: bash services/karikagyuru-api/dev/demo-csomag.sh /tmp/kg-bemutato-csomag (helyben), majd scp a VPS-re.
# Domain: KG_DOMAIN (alapból kg-bemutato.daekon.hu).
#
# Amit SOHA nem tesz:
#  - nem módosít DNS-t, meglévő webszerver- vagy PHP-beállítást (csak ÚJ fájlokat hoz létre, a saját nevén);
#  - nem telepít webszervert, nem indít újra szolgáltatást (csak „reload”, és csak sikeres konfigurációteszt után);
#  - nem ír meglévő mappába, felhasználóba vagy adatbázisba;
#  - a jelszavakat nem írja a képernyőre és naplóba: egy csak rootnak olvasható fájlba kerülnek.
# Ha bármelyik ellenőrzés nem zöld, megáll, és kiírja, mi kell (pl. DNS-rekord, jóváhagyás).
set -euo pipefail
DOMAIN="${KG_DOMAIN:-kg-bemutato.daekon.hu}"
ROOT=/srv/kg-bemutato; USR=kgdemo; JELSZO=/root/kg-bemutato-jelszavak.txt
say() { printf '%s\n' "$*"; }; ok() { say "  ok    $*"; }; bad() { say "  ÁLLJ  $*"; STOP=1; }; info() { say "  info  $*"; }
[ "$(id -u)" = 0 ] || { say "Rootként (sudo) kell futtatni."; exit 1; }

if [ "${1:-}" = "--mentesproba" ]; then
  API=$ROOT/karikagyuru-api; M=$ROOT/mentesek; P=$ROOT/proba-visszaallitas-$(date +%Y%m%d%H%M%S)
  sudo -u $USR KG_DATA=$ROOT/adat php $API/bin/mentes.php $M; L=$(ls -1d $M/kg-mentes-* | tail -1)
  sudo -u $USR php $API/bin/mentes-ellenorzes.php "$L"
  sudo -u $USR mkdir -m 700 "$P"; sudo -u $USR KG_DATA="$P/adat" php $API/bin/visszaallitas.php "$L" --bemutato
  stat -c '%a %U %n' $M $ROOT/adat "$P"
  say "Kész: mentés ($L) ellenőrizve, visszaállítva ide: $P (a próba-mappa törölhető: rm -r $P)"; exit 0
fi

PKG="${1:?Add meg a feltöltött csomag mappáját (benne: webgyoker/ és karikagyuru-api/)}"; DO="${2:-}"
STOP=0
say "== Ellenőrzés ($DOMAIN) =="
[ -f "$PKG/webgyoker/bemutato/kapu.php" ] && [ -f "$PKG/karikagyuru-api/bin/demo-install.php" ] && ok "a csomag teljes" || bad "a csomag hiányos: $PKG"
[ -e "$ROOT" ] && bad "$ROOT már létezik – nem írom felül" || ok "$ROOT szabad"
id "$USR" >/dev/null 2>&1 && bad "a(z) $USR felhasználó már létezik" || ok "$USR felhasználó szabad"
PHPV=$(ls -1d /etc/php/*/fpm 2>/dev/null | sed -E 's#/etc/php/([0-9.]+)/fpm#\1#' | sort -V | tail -1 || true)
[ -n "$PHPV" ] && ok "PHP-FPM $PHPV" || bad "nincs PHP-FPM (/etc/php/*/fpm) – telepítése rendszerszintű változás, előbb jóváhagyás kell"
if [ -n "$PHPV" ]; then
  for m in pdo_sqlite gd; do php$PHPV -m 2>/dev/null | grep -qx "$m" && ok "PHP-modul: $m" || bad "hiányzó PHP-modul: $m (php$PHPV-${m/pdo_/} csomag – jóváhagyás kell)"; done
  [ -e /etc/php/$PHPV/fpm/pool.d/$USR.conf ] && bad "a pool-fájl már létezik" || ok "pool-fájl szabad"
fi
WEB=""; for s in nginx caddy apache2; do systemctl is-active --quiet "$s" 2>/dev/null && WEB="$WEB $s"; done; WEB=$(echo $WEB)
case "$WEB" in
  nginx) ok "webszerver: nginx" ;; caddy) ok "webszerver: Caddy" ;;
  "") bad "nem fut webszerver – új webszerver telepítése külön jóváhagyást igényel" ;;
  *) bad "webszerver: $WEB – ehhez a telepítéshez csak nginx vagy Caddy van előkészítve (kézi lépés kell)" ;;
esac
grep -rqs "$DOMAIN" /etc/nginx /etc/caddy /etc/apache2 && bad "$DOMAIN már szerepel egy webszerver-beállításban" || ok "$DOMAIN nincs használatban"
IP=$(curl -s4 --max-time 5 https://ifconfig.me || true); DNS=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)
if [ -z "$DNS" ]; then bad "nincs DNS-rekord: kell egy A-rekord: $DOMAIN → ${IP:-a VPS IP-címe} (DNS-módosítás – jóváhagyás kell)"
elif [ "$DNS" != "$IP" ]; then bad "$DOMAIN → $DNS, de a VPS: $IP – a DNS nem ide mutat"
else ok "DNS: $DOMAIN → $IP"; fi
if [ "$WEB" = nginx ]; then command -v certbot >/dev/null && ok "certbot megvan" || bad "nincs certbot – HTTPS-tanúsítványhoz kell (telepítése jóváhagyást igényel)"; fi
if [ "$WEB" = caddy ]; then grep -Eq '^\s*import\s+/etc/caddy/(sites|conf\.d)' /etc/caddy/Caddyfile && ok "a Caddyfile külön mappát importál" || bad "a Caddyfile nem importál külön mappát – a meglévő Caddyfile-t nem írom át (kézi lépés)"; fi
FREE=$(df -Pm /srv 2>/dev/null | awk 'NR==2{print $4}'); [ "${FREE:-0}" -gt 2048 ] && ok "szabad hely: ${FREE} MB" || bad "kevés szabad hely: ${FREE:-?} MB"

[ "$STOP" = 0 ] || { say; say "Nem telepítek: a fenti ÁLLJ pontok előbb rendezendők. Semmi nem változott."; exit 2; }
[ "$DO" = "--vegrehajt" ] || { say; say "Minden zöld. Telepítés:  sudo bash $0 $PKG --vegrehajt"; exit 0; }

say "== Telepítés =="
SOCKU=www-data; [ "$WEB" = caddy ] && SOCKU=caddy
useradd --system --home-dir $ROOT --no-create-home --shell /usr/sbin/nologin $USR
mkdir -p $ROOT && cp -r "$PKG/webgyoker" "$PKG/karikagyuru-api" $ROOT/
mkdir -p $ROOT/adat $ROOT/mentesek $ROOT/munkamenet
chown -R root:$USR $ROOT && chmod -R g-w,o-rwx $ROOT && chmod 750 $ROOT
chown $USR: $ROOT/adat $ROOT/mentesek $ROOT/munkamenet && chmod 700 $ROOT/adat $ROOT/mentesek $ROOT/munkamenet
# a webszerver csak a webgyökeret olvashatja (nyilvános fájlok); az API forrása, az adatok és a mentések csak a kgdemo-é
chmod o+x $ROOT && chmod -R o+rX $ROOT/webgyoker
cat > $ROOT/webgyoker/bemutato/config.php <<PHP
<?php return ['data' => '$ROOT/adat', 'site' => __DIR__ . '/site', 'src' => '$ROOT/karikagyuru-api/src'];
PHP
chown root:$USR $ROOT/webgyoker/bemutato/config.php && chmod 640 $ROOT/webgyoker/bemutato/config.php; ok "fájlok a helyükön"

POOL=/etc/php/$PHPV/fpm/pool.d/$USR.conf
cat > $POOL <<INI
[$USR]
user = $USR
group = $USR
listen = /run/php/$USR.sock
listen.owner = $SOCKU
listen.group = $SOCKU
listen.mode = 0660
pm = ondemand
pm.max_children = 4
pm.process_idle_timeout = 60s
php_admin_value[open_basedir] = $ROOT/:/tmp/
php_admin_value[session.save_path] = $ROOT/munkamenet
php_admin_value[upload_max_filesize] = 10M
php_admin_value[post_max_size] = 32M
php_admin_value[memory_limit] = 256M
php_admin_flag[expose_php] = off
php_admin_value[disable_functions] = exec,passthru,shell_exec,system,proc_open,popen
INI
if php-fpm$PHPV -t 2>/dev/null; then systemctl reload php$PHPV-fpm; ok "saját PHP-FPM pool ($POOL), reload"
else rm -f $POOL; say "  HIBA a PHP-FPM beállítás nem érvényes – a pool-fájl eltávolítva, semmi más nem változott"; exit 3; fi
for _ in $(seq 20); do [ -S /run/php/$USR.sock ] && break; sleep 0.5; done

if [ "$WEB" = nginx ]; then
  V=/etc/nginx/sites-available/$DOMAIN
  cat > $V <<NGX
server {
    listen 80; listen [::]:80;
    server_name $DOMAIN;
    root $ROOT/webgyoker/bemutato;
    client_max_body_size 32m;
    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
    location / {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root/kapu.php;
        fastcgi_param SCRIPT_NAME /kapu.php;
        fastcgi_pass unix:/run/php/$USR.sock;
    }
}
NGX
  ln -s $V /etc/nginx/sites-enabled/$DOMAIN
  if nginx -t 2>/dev/null; then systemctl reload nginx; ok "nginx: új server-blokk ($V), reload"
  else rm -f /etc/nginx/sites-enabled/$DOMAIN $V; say "  HIBA nginx -t nem fogadta el – az új fájlok eltávolítva, a meglévő beállítás érintetlen"; exit 3; fi
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect -m hello@daekon.hu --no-eff-email && ok "HTTPS-tanúsítvány ($DOMAIN)" || say "  HIBA a tanúsítvány nem készült el – a bemutató HTTP-n sem nyilvános jelszó nélkül, de HTTPS nélkül NE add át"
else
  D=$(grep -Eo '^\s*import\s+/etc/caddy/(sites|conf\.d)[^ ]*' /etc/caddy/Caddyfile | awk '{print $2}' | head -1); F="$(dirname "$D")/$DOMAIN.caddy"
  cat > "$F" <<CAD
$DOMAIN {
	root * $ROOT/webgyoker/bemutato
	header X-Robots-Tag "noindex, nofollow, noarchive"
	request_body { max_size 32MB }
	rewrite * /kapu.php
	php_fastcgi unix//run/php/$USR.sock
}
CAD
  if caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then systemctl reload caddy; ok "Caddy: új blokk ($F), reload (automatikus HTTPS)"
  else rm -f "$F"; say "  HIBA caddy validate nem fogadta el – az új fájl eltávolítva"; exit 3; fi
fi

umask 077
sudo -u $USR KG_DATA=$ROOT/adat php $ROOT/karikagyuru-api/bin/demo-install.php > $JELSZO 2>&1
chmod 600 $JELSZO; ok "bemutató telepítve; a két jelszó itt (csak root olvashatja): $JELSZO"
( crontab -u $USR -l 2>/dev/null; echo "20 3 * * * KG_DATA=$ROOT/adat php $ROOT/karikagyuru-api/bin/mentes.php $ROOT/mentesek >> $ROOT/mentesek/naplo.txt 2>&1" ) | crontab -u $USR -
ok "napi mentés 03:20-kor (törlés nélkül)"

say "== Gyors ellenőrzés =="
H=$(curl -sI --max-time 10 "https://$DOMAIN/" || true)
echo "$H" | head -1; echo "$H" | grep -i '^x-robots-tag' || true
curl -s --max-time 10 "https://$DOMAIN/robots.txt" | head -2
say "Következő: a laptopról  python3 services/karikagyuru-api/dev/tavoli_proba.py https://$DOMAIN/  majd itt: sudo bash $0 --mentesproba"
