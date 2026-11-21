#!/usr/bin/env bash
# Karikagyuru – NEM NYILVÁNOS bemutatópéldány 3 mintagyűrűvel, a saját gépen.
# Kell hozzá: PHP 8.1+ (pdo_sqlite, gd) és Node.js 18+. Nem tölt fel semmit, nem küld levelet.
#
#   bash services/karikagyuru-api/dev/bemutato.sh            → http://127.0.0.1:8792/
#   KG_PORT=9000 bash services/karikagyuru-api/dev/bemutato.sh
#
# Az adatok egy ideiglenes mappába kerülnek (kilépéskor törlődnek), így a mintaadat sehol nem keveredik
# éles adattal. A belépési jelszót a script írja ki ebbe az ablakba.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; API="$(dirname "$HERE")"
PORT="${KG_PORT:-8792}"
export KG_DATA="$(mktemp -d -t kg-bemutato-XXXXXX)"
export KG_MAIL_MODE=off
trap 'rm -rf "$KG_DATA"' EXIT
PW="bemutato-$(php -r 'echo bin2hex(random_bytes(5));')"
KG_ADMIN_PASSWORD="$PW" php "$API/bin/setup.php" >/dev/null
node "$HERE/make-demo-state.mjs" > "$KG_DATA/allapot.json"
php "$API/bin/demo-seed.php" "$KG_DATA/allapot.json"
rm -f "$KG_DATA/allapot.json"
echo
echo "  Bemutató:        http://127.0.0.1:$PORT/"
echo "  Kezelőfelület:   http://127.0.0.1:$PORT/#/admin   (jelszó: $PW)"
echo "  Mintagyűrűk: 81184 - 81185 W és 81202 - 81203 W/Y (jóváhagyott), 79016 - 79017 (jóváhagyásra vár)"
echo "  Leállítás: Ctrl+C (az adatok törlődnek)"
echo
php -S "127.0.0.1:$PORT" "$HERE/router.php"
