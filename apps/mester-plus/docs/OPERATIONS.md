# Mester+ Cloud – üzemeltetés

VPS: `daekon-prod-01` (57.129.181.55), DAEKON Hosting Factory. Átadás: `C:\daekon-migration\VPS_HANDOFF.md` (000000/ZH).
Titok ebben a fájlban nincs.

## Webhelyek

| | Production | Staging |
|---|---|---|
| Domain | `api.mesterplus.daekon.hu` (+ alias `ajanlat.mesterplus.daekon.hu`) | `api-staging.mesterplus.daekon.hu` |
| Típus | Hosting Factory `php_db`: saját Linux-user, saját PHP-FPM pool (open_basedir, veszélyes függvények tiltva), saját MariaDB DB + user (csak a saját DB-hez), saját vhost és napló | ugyanaz, külön DB |
| `MP_ENV` | production (HTTPS kötelező, sandbox-billing tiltva) | staging (sandbox-billing be) |
| Mentés | napi helyi (fájl + DB) + napi B2 | napi B2 |
| Karbantartás | `daekon-site-…-mpmaint.timer`, 15 percenként, a webhely felhasználójaként (sandbox) | ugyanaz |

Konfig: `/srv/sites/<d>/config/db.env` (Hosting Factory) + `config/app.env` (root:<user> 0640; `MP_ENV`, `MP_TOKEN_PEPPER`, `MP_KEK_1`,
`MP_KEK_CURRENT`, `MP_STORAGE_DIR`, `MP_LOG_DIR`, `MP_PUBLIC_API_BASE`, `MP_PUBLIC_QUOTE_BASE`, `MP_MAIL_DRIVER=outbox`,
`MP_TRIAL_ENABLED=0`, `MP_BACKUP_MAX_BYTES`; stagingen `MP_BILLING_SANDBOX=1`, `MP_WEBHOOK_SANDBOX_SECRET`).
**A KEK elvesztése = a felhőmentések elvesztése.** A KEK a webhely mentésében (helyi + restic-titkosított B2) benne van; ajánlott
egy offline másolat a tulajdonos jelszókezelőjében (OWNER ACTION).

## Kiadás (BUILD → TEST → SECURITY → STAGING → HEALTH → PROMOTION → PRODUCTION)

1. CI zöld (`mester-plus.yml`: Flutter, backend MariaDB-vel, gitleaks, hálózati szabályzat).
2. `bash services/mester-plus-api/tool/build_release.sh <RID> <mappa>` → ZIP + SHA-256 (RELEASE = RID + git SHA).
3. A VPS-en: `unzip` egy ideiglenes mappába; **staging**: `runuser -u <user> -- env MP_CONFIG_DIR=/srv/sites/<d>/config php <mappa>/bin/cli.php migrate`,
   majd `daekon-site deploy <staging> <zip>` (koordinátor: egyszerre egy élesítés, előellenőrzés, QA, automatikus rollback).
4. Staging health + élő teszt (`php tests/live_http.php flow <url> 127.0.0.1`).
5. **Production**: DB-checkpoint `daekon-site db api.mesterplus.daekon.hu export`, migráció (csak előre haladó, romboló utasítás
   tiltva), `daekon-site deploy api.mesterplus.daekon.hu <zip>`.
6. Rollback: `daekon-site rollback api.mesterplus.daekon.hu [--to KIADÁS]` (a migrációk visszafelé kompatibilisek – kibővítés,
   nem törlés); DB: `daekon-site restore <d> --file <export> --mod adatbazis --confirm <d>`.

## Monitoring és incidensek

- DAEKON Site Health: 5 perces mérés a `/api/v1/health`-en (`health_path` a nyilvántartásban) – app, DB, tároló; 3 egymás utáni
  hiba → SITE DOWN (= API DOWN). Óránként: SSL, DNS, mentés, tárhely, napló + **az API állapotfájlja** (`logs/app-status.json`,
  a karbantartó írja, személyes adat nélkül): MP_DB_DOWN, MP_STORAGE_DOWN (kritikus), MP_BACKUP_FAILURE_SPIKE, MP_AUTH_FAILURE_SPIKE,
  MP_BILLING_WEBHOOK_FAILURE, MP_API_ERRORS, APP_STATUS_STALE (a karbantartó 45 percnél régebben futott). A kritikus incidens a
  hostchecken át a központi incidenskezelőbe kerül. Külön UptimeRobot-monitor nem kell (nincs duplikáció); a DNS után opcionális.
- Metrikák (`metrics_hourly`, 90 nap): http_5xx, auth_fail, backup_upload_ok/fail, storage_error, db_error, billing_webhook_fail, rate_limited.
- Tulajdonosi nézet: WebPanel → **MESTER+ CLOUD** (`mpcloud.cgi`, Webmin-hitelesítés): fiókok, előfizetések, eszközök, mentések,
  tárhely, ajánlatok, rendszer-állapot, hibás billing-események, levélsor – csak számok.

## Megőrzés (karbantartó, 15 percenként)

munkamenet: lejárat / visszavonás után 30 nap · refresh token: lejárat / felhasználás után 30 nap · idempotencia-kulcs: 24 óra ·
rate-limit ablak: 2 nap · e-mail token: lejárat után 7 nap · levélsor: 7 nap · ajánlat-esemény IP-kivonata: 30 nap ·
metrika: 90 nap · audit: 400 nap · felhőmentés: csomag szerint (lásd CLOUD_BACKUP) · félbemaradt feltöltés: 2 óra ·
törölt fiók: azonnali törlés / anonimizálás, a félbemaradtat a karbantartó befejezi · előfizetési esemény: megmarad (számviteli –
OWNER LEGAL REVIEW). B2 (restic): 7 napi / 4 heti / 6 havi pillanatkép.

## E-mail

`MP_MAIL_DRIVER=outbox`: a megerősítő és jelszó-visszaállító levél a `mail_outbox` táblába kerül, **nem megy ki** (a VPS-en
nincs MTA, a DAEKON OS levelezési kapcsolóihoz nem nyúltunk). Amíg nincs kézbesítő: a regisztráció és a belépés működik, az
e-mail megerősítése és az elfelejtett jelszó e-mailben nem. **OWNER ACTION:** kézbesítő kiválasztása (pl. a DAEKON saját SMTP-je
vagy egy tranzakciós levélszolgáltató – fizetős lehet), SPF/DKIM a küldő domainhez; utána az `smtp` meghajtó bekötése.

## DNS (OWNER ACTION – a production kívülről ennek hiányában nem érhető el)

A `daekon.hu` zónában (tarhely.com): `api.mesterplus`, `ajanlat.mesterplus`, `api-staging.mesterplus` → `A 57.129.181.55`
(vagy egy `*.mesterplus  A  57.129.181.55`). AAAA ne legyen (vagy `2001:41d0:801:2000::57c4`). A tanúsítványt a Hosting Factory a
DNS beállta után automatikusan kéri (5 percenként ellenőrzi); kézi lépés nincs.

## Hasznos parancsok

```
sudo daekon-site status api.mesterplus.daekon.hu
sudo runuser -u <user> -- php /srv/sites/api.mesterplus.daekon.hu/current/bin/cli.php stats      # összesítő
sudo runuser -u <user> -- php …/bin/cli.php grant --email E --plan pro --days 30                    # béta Pro
sudo runuser -u <user> -- php …/bin/cli.php migrate --status
sudo daekon-site health site api.mesterplus.daekon.hu
```
(`<user>`: `grep site_user /etc/daekon-sites/sites/api.mesterplus.daekon.hu.conf`)
