#!/usr/bin/env bash
# CI-segéd: lefuttat egy lépést; hiba esetén a kimenet utolsó 80 sorát GitHub
# hiba-megjegyzésként (annotation) is kiírja, így a napló letöltése nélkül is látszik.
# Használat: tool/ci_step.sh "Lépés neve" parancs [arg...]
name="$1"; shift
log="$(mktemp)"
set -o pipefail
"$@" 2>&1 | tee "$log"
code=${PIPESTATUS[0]}
if [ "$code" -ne 0 ]; then
  msg="$(tail -n 80 "$log" | sed -e 's/%/%25/g' -e 's/\r//g' | awk '{printf "%s%%0A", $0}')"
  echo "::error title=${name} (kilépési kód: ${code})::${msg}"
fi
exit "$code"
