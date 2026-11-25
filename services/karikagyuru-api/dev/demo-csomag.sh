#!/usr/bin/env bash
# Karikagyuru – a jelszóval védett bemutató telepítési csomagja: feltöltésre kész mappaszerkezet (V5.6).
#
#   bash services/karikagyuru-api/dev/demo-csomag.sh /utvonal/kg-bemutato-csomag
#
# Eredmény (a tárhelyen így kell elhelyezni – részletek: docs/BEMUTATO_TELEPITES.md):
#   webgyoker/bemutato/      → a webgyökérbe (pl. public_html/bemutato/): kapu.php, .htaccess, config.minta.php, site/ (a weboldal)
#   karikagyuru-api/         → a webgyökéren KÍVÜLRE: src/, bin/ (demo-install, demo-reset, purge), demo/minta-allapot.json
# Nem kerül bele: tesztek, dokumentáció, fejlesztői adatkészlet, fotóellenőrző, éles telepítő, adat.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; API="$(dirname "$HERE")"; SITE="$(cd "$API/../../public/latvanytervek/karikagyuru" && pwd)"
OUT="${1:?Add meg a célmappát: bash dev/demo-csomag.sh /utvonal/celmappa}"
[ -e "$OUT" ] && { echo "Hiba: a célmappa már létezik: $OUT" >&2; exit 1; }
W="$OUT/webgyoker/bemutato"; A="$OUT/karikagyuru-api"
mkdir -p "$W/site" "$A/bin" "$A/demo"
cp "$API/demo/kapu.php" "$API/demo/.htaccess" "$API/demo/.user.ini" "$API/demo/config.minta.php" "$W/"
cp -R "$SITE/index.html" "$SITE/css" "$SITE/js" "$SITE/img" "$SITE/fonts" "$W/site/"
cp -R "$API/src" "$A/"
cp "$API/bin/demo-install.php" "$API/bin/demo-reset.php" "$API/bin/purge.php" "$API/bin/mentes.php" "$API/bin/mentes-ellenorzes.php" "$API/bin/visszaallitas.php" "$API/bin/fejlesztoi-dontesek.php" "$A/bin/"
cp "$API/demo/minta-allapot.json" "$A/demo/"
# A kapu.php a src-t a config.php-ból veszi (a csomagban a webgyökéren kívül van).
cat > "$OUT/OLVASS_EL.txt" <<TXT
Karikagyuru – jelszóval védett bemutató (V5.6). Részletes leírás: docs/BEMUTATO_TELEPITES.md a repositoryban.
1. webgyoker/bemutato  → feltöltés a webgyökérbe (pl. public_html/bemutato/)
2. karikagyuru-api     → feltöltés a webgyökéren KÍVÜLRE (pl. /home/FELHASZNALO/karikagyuru-api/)
3. Külön, üres adatmappa a webgyökéren kívül (pl. /home/FELHASZNALO/kg-bemutato-adat) – SOHA nem az éles adatmappa.
4. bemutato/config.minta.php → config.php, benne a három útvonal (data, site, src).
5. Telepítés (SSH vagy a tárhely cron/parancs felülete):  KG_DATA=/home/FELHASZNALO/kg-bemutato-adat php karikagyuru-api/bin/demo-install.php
   → kiírja a bemutató jelszavát és az admin jelszót (egyszer).
6. Visszaállítás (CSAK kézzel, az ügyfélnek előre szólva – automatikus éjjeli törlés NINCS):  KG_DATA=… php karikagyuru-api/bin/demo-reset.php
7. Napi biztonsági mentés (ez törlés nélkül fut):  KG_DATA=… php karikagyuru-api/bin/mentes.php /home/FELHASZNALO/kg-bemutato-mentesek
TXT
find "$OUT" -name '.DS_Store' -delete
echo "Kész: $OUT"; (cd "$OUT" && find . -maxdepth 3 -type d | sort)
