#!/usr/bin/env bash
# Karikagyuru – a DAEKON VPS felmérése a bemutató telepítése ELŐTT (V5.10). CSAK OLVAS: semmit nem telepít, nem indít újra,
# nem ír fájlt, nem módosít beállítást. Futtatás a VPS-en:   bash vps-felmeres.sh [kg-bemutato.daekon.hu]  > felmeres.txt
# A kimenetben jelszó nem szerepel; a webszerver-beállításokból csak a domainneveket és a portokat listázza.
set -u
DOMAIN="${1:-kg-bemutato.daekon.hu}"
h() { printf '\n== %s ==\n' "$1"; }
has() { command -v "$1" >/dev/null 2>&1; }

h "Rendszer"
. /etc/os-release 2>/dev/null && echo "OS: ${PRETTY_NAME:-?}"; uname -srm; uptime -p 2>/dev/null
echo "CPU: $(nproc 2>/dev/null) mag · memória: $(free -h 2>/dev/null | awk '/Mem:/{print $2" összes, "$7" szabad"}')"

h "Szabad tárhely"
df -h / /srv /var /home 2>/dev/null | awk 'NR==1 || !seen[$1]++'

h "Webszerverek (melyik fut, mi figyel a 80/443-on)"
for s in nginx apache2 httpd caddy lighttpd traefik; do has "$s" && echo "telepítve: $s"; done
if has systemctl; then systemctl list-units --type=service --state=running --no-legend 2>/dev/null | awk '{print $1}' | grep -Ei 'nginx|apache|httpd|caddy|php|fpm|docker|traefik|mysql|maria|postgres|redis|node|pm2' ; fi
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | awk 'NR==1 || /:80 |:443 |:8[0-9]{3} /'

h "PHP"
if has php; then php -v | head -1; php -m 2>/dev/null | grep -Ei '^(pdo_sqlite|sqlite3|gd|mbstring|json|fileinfo|openssl)$' | tr '\n' ' '; echo
  php -r 'echo "upload_max_filesize=", ini_get("upload_max_filesize"), " post_max_size=", ini_get("post_max_size"), " memory_limit=", ini_get("memory_limit"), PHP_EOL;'
  php -r 'echo "GD JPEG/WebP: ", function_exists("imagecreatefromjpeg") ? "jpeg " : "-", function_exists("imagecreatefromwebp") ? "webp" : "-", PHP_EOL;'
else echo "php nincs telepítve"; fi
ls -d /etc/php/*/fpm/pool.d 2>/dev/null && for d in /etc/php/*/fpm/pool.d; do echo "-- $d"; ls "$d"; done
ls /run/php/ 2>/dev/null

h "SQLite"
has sqlite3 && sqlite3 --version || echo "sqlite3 parancs nincs (a PHP pdo_sqlite elég)"

h "Meglévő oldalak / domainek (csak nevek)"
for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do [ -f "$f" ] && echo "$f: $(grep -hoE 'server_name[^;]+' "$f" | sed 's/server_name//' | tr -s ' ' | tr '\n' ' ')"; done 2>/dev/null
for f in /etc/apache2/sites-enabled/*; do [ -f "$f" ] && echo "$f: $(grep -hoiE '(ServerName|ServerAlias) .+' "$f" | tr '\n' ' ')"; done 2>/dev/null
[ -f /etc/caddy/Caddyfile ] && { echo "/etc/caddy/Caddyfile blokkjai:"; grep -E '^[^#[:space:]][^{]*\{' /etc/caddy/Caddyfile; }
has docker && { echo "docker konténerek:"; docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null; }

h "HTTPS-tanúsítványok"
has certbot && certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry' || echo "certbot nincs (vagy nincs jogosultság)"
ls /var/lib/caddy/.local/share/caddy/certificates/*/ 2>/dev/null | head -20

h "Tűzfal"
has ufw && ufw status 2>/dev/null | head -20
has nft && nft list ruleset 2>/dev/null | grep -cE 'dport' | sed 's/^/nftables dport-szabályok: /'
has iptables && iptables -S 2>/dev/null | grep -c -- '--dport' | sed 's/^/iptables dport-szabályok: /'

h "DNS: $DOMAIN"
IP4=$(curl -s4 --max-time 5 https://ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
echo "a VPS nyilvános IP-címe: ${IP4:-?}"
if has dig; then echo "A-rekord: $(dig +short A "$DOMAIN" | tr '\n' ' ')"; else getent hosts "$DOMAIN" || echo "nincs DNS-rekord (vagy nincs dig)"; fi

h "Ütközés: van-e már ilyen név vagy mappa"
grep -rls "$DOMAIN" /etc/nginx /etc/apache2 /etc/caddy 2>/dev/null || echo "a webszerver-beállításokban nincs $DOMAIN"
for d in /srv/kg-bemutato /var/www/kg-bemutato; do [ -e "$d" ] && echo "MÁR LÉTEZIK: $d" ; done
id kgdemo 2>/dev/null && echo "a kgdemo felhasználó már létezik" || echo "kgdemo felhasználó nincs (szabad)"

h "Biztonsági mentés"
ls /etc/cron.d 2>/dev/null; crontab -l 2>/dev/null | grep -v '^#' | head
echo
echo "Kész. A felmérés semmit nem módosított."
