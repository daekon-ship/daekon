#!/bin/bash
# Mester+ Cloud API – kiadási csomag (a Hosting Factory `daekon-site deploy <d> <zip>` ezt kapja).
#   bash tool/build_release.sh <release-id> <kimeneti mappa>
# A csomagban: index.php, src/, migrations/, bin/, RELEASE (release-id + git SHA). NINCS benne: tests/, tool/,
# dokumentáció, titok. A config (config/db.env, config/app.env) a szerveren van, nem a csomagban.
set -euo pipefail
RID=${1:?release-id kell}
OUT=${2:?kimeneti mappa kell}
[[ $RID =~ ^[A-Za-z0-9._-]{3,64}$ ]] || { echo "hibás release-id" >&2; exit 1; }
cd "$(dirname "$0")/.."
SHA=$(git rev-parse --short=12 HEAD 2>/dev/null || echo nogit)
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/pkg"
cp index.php "$STAGE/pkg/"
cp -r src migrations bin "$STAGE/pkg/"
printf '%s %s\n' "$RID" "$SHA" > "$STAGE/pkg/RELEASE"
# Biztonsági ellenőrzés a csomagon: minden belső PHP-fájl védett, nincs titok-szerű fájl.
for f in "$STAGE"/pkg/src/*.php "$STAGE"/pkg/migrations/*.php; do
  grep -q "if (!defined('MP_API'))" "$f" || { echo "védelem nélküli fájl: $f" >&2; exit 1; }
done
if find "$STAGE/pkg" \( -name '.env*' -o -name '*.pem' -o -name '*.key' -o -name '*.sql' -o -name '*.sql.gz' \) | grep -q .; then
  echo "tiltott fájl a csomagban" >&2; exit 1
fi
mkdir -p "$OUT"
OUTABS=$(cd "$OUT" && pwd)
if command -v zip >/dev/null 2>&1; then
  ( cd "$STAGE/pkg" && find . -type f | sort > ../files.txt && zip -q -X -r "$OUTABS/mester-plus-api-$RID.zip" . )
else
  PY=$(command -v python3 || command -v python)
  ( cd "$STAGE/pkg" && find . -type f | sort > ../files.txt && "$PY" -c 'import sys,zipfile
with zipfile.ZipFile(sys.argv[1], "w", zipfile.ZIP_DEFLATED) as z:
    for f in open("../files.txt").read().split():
        z.write(f, f[2:])' "$OUTABS/mester-plus-api-$RID.zip" )
fi
( cd "$OUT" && sha256sum "mester-plus-api-$RID.zip" > "mester-plus-api-$RID.zip.sha256" )
echo "kész: $OUT/mester-plus-api-$RID.zip ($(wc -l < "$STAGE/files.txt") fájl, git $SHA)"
