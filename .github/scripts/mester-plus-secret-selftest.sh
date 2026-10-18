#!/bin/bash
# A titokkereső önellenőrzése: futás közben generált (véletlen, soha nem commitolt) mintatitkokat
# kell felismernie. Ha bármelyiket nem találja, a CI elbukik – így egy elrontott szabályfájl sem
# „zöldít” csendben.  Használat: mester-plus-secret-selftest.sh <gitleaks> <config>
set -u
GL=$1
CFG=$2
d=$(mktemp -d)
trap 'rm -rf "$d"' EXIT
rnd() { head -c 8192 /dev/urandom | tr -dc "$1" | head -c "$2"; }
mkdir -p "$d/aws" "$d/kek" "$d/b2" "$d/keystore" "$d/pem" "$d/gsa"
printf 'aws_access_key_id = AKIA%s\naws_secret_access_key = %s\n' "$(rnd 'A-Z2-7' 16)" "$(rnd 'A-Za-z0-9/+' 40)" > "$d/aws/creds.txt"
printf 'MP_KEK_1=%s\n' "$(head -c 32 /dev/urandom | base64 | tr -d '\n')" > "$d/kek/app.env"
printf 'B2_APPLICATION_KEY=K00%s\n' "$(rnd 'A-Za-z0-9' 28)" > "$d/b2/restic.txt"
printf 'storePassword=%s\nkeyPassword=%s\n' "$(rnd 'A-Za-z0-9' 14)" "$(rnd 'A-Za-z0-9' 14)" > "$d/keystore/key.properties"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$d/pem/id.pem" 2>/dev/null
printf '{"type": "service_account", "private_key_id": "%s"}\n' "$(rnd 'a-f0-9' 40)" > "$d/gsa/play.json"
fail=0
for sub in aws kek b2 keystore pem gsa; do
  "$GL" dir "$d/$sub" --config "$CFG" --no-banner --redact --exit-code 7 >/dev/null 2>&1
  if [ $? -ne 7 ]; then
    echo "A titokkereső NEM ismerte fel: $sub"
    fail=1
  fi
done
[ $fail -eq 0 ] && echo "önteszt: mind a 6 mintatitkot felismerte"
exit $fail
