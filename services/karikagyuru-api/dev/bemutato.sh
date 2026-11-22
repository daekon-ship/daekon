#!/usr/bin/env bash
# Karikagyuru – a JELSZÓVAL VÉDETT bemutató futtatása a saját gépen, pontosan úgy, ahogy a tárhelyen futna (demo/kapu.php).
# Kell hozzá: PHP 8.1+ (pdo_sqlite, gd). Nem tölt fel semmit, nem küld levelet, a keresők elől el van zárva.
#
#   bash services/karikagyuru-api/dev/bemutato.sh            → http://127.0.0.1:8792/
#   KG_PORT=9000 bash services/karikagyuru-api/dev/bemutato.sh
#   KG_MARAD=1 bash …                                         → az adatmappa kilépés után megmarad (újraindításnál is)
#
# Az adatok egy külön, ideiglenes mappába kerülnek (alapból kilépéskor törlődnek) – éles adattal nem keveredhet.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; API="$(dirname "$HERE")"
PORT="${KG_PORT:-8792}"
HOST="${KG_HOST:-127.0.0.1}"   # telefonos próbához saját Wi-Fi-n: KG_HOST=0.0.0.0
if [ -n "${KG_MARAD:-}" ]; then
  export KG_DATA="${KG_DATA:-$HOME/.kg-bemutato-adat}"
else
  export KG_DATA="$(mktemp -d -t kg-bemutato-XXXXXX)"; rmdir "$KG_DATA"
  trap 'rm -rf "$KG_DATA"' EXIT
fi
if [ ! -f "$KG_DATA/demo-kapu.json" ]; then php "$API/bin/demo-install.php"; else echo "Meglévő bemutató-adatmappa: $KG_DATA (visszaállítás: KG_DATA=$KG_DATA php $API/bin/demo-reset.php)"; fi
echo
echo "  Bemutató:        http://127.0.0.1:$PORT/   (először a bemutató jelszavát kéri)"
echo "  Kezelőfelület:   http://127.0.0.1:$PORT/#/admin   (utána az admin jelszót)"
echo "  Forgatókönyv:    a DAEKON nem nyilvános bemutató-forgatókönyve (nincs a repositoryban)"
echo "  Leállítás: Ctrl+C"
echo
php -S "$HOST:$PORT" "$API/demo/kapu.php"
