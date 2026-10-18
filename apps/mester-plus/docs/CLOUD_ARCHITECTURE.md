# Mester+ Cloud – architektúra

Állapot: 2026-10-18, backend `20261018-mp2` (git `10c1d829c459`). Kapcsolódó: `CLOUD_SECURITY.md`, `CLOUD_BACKUP.md`,
`ONLINE_QUOTES.md`, `SUBSCRIPTIONS.md`, `CLOUD_SYNC_DESIGN.md`, `OPERATIONS.md`.

## Alapelv

**Offline-first marad.** Ügyfél, projekt, felmérés, árazás, ajánlat, PDF, pénzügy, munkanapló, anyaglista és a helyi mentés
internet és fiók nélkül működik; a helyi Drift/SQLCipher adatbázis az elsődleges adatforrás, a sémája NEM változott (v3).
A Cloud csak kiegészítés: opcionális Mester+ fiók, felhőmentés, online ajánlat, előfizetés.

```
MESTER+ FLUTTER APP ──HTTPS (csak api.mesterplus.daekon.hu)──► MESTER+ CLOUD API (PHP 8.4, Nginx, PHP-FPM)
   lib/cloud/ApiClient (egyetlen HTTP-réteg)                     ├─ accounts / workspaces / workspace_members
   CloudSession · Entitlements (offline gyorstár)                ├─ devices / sessions / refresh_tokens
   CloudBackupService (AES-256-GCM a telefonon)                  ├─ plans / subscriptions / subscription_events / entitlements
   OnlineQuoteService (pillanatkép, QuoteCalculator)             ├─ cloud_backups / backup_keys  ──► shared/cloud-backups (titkosított blobok)
   AutoBackup (előtérben, naponta, ha változott)                 ├─ quote_shares / quote_events  ──► /a/{token} publikus oldal
                                                                 ├─ webhook_events / idempotency_keys / rate_limit_state
                                                                 └─ audit_logs / metrics_hourly / mail_outbox
                                                                        │
                                                    MariaDB 10.11 (saját DB + saját user) · helyi napi mentés + B2 (restic)
```

## Stack-döntés

PHP 8.4 + MariaDB + Nginx – a VPS meglévő stackje (Hosting Factory `php_db` típus). **Keretrendszer és Composer-függőség
nélkül**, mert:
- a repó nyilvános és a backend kicsi: nincs ellátási lánc (supply chain) kockázat, nincs `vendor/` frissítési teher;
- a Hosting Factory feltöltés-validátora (titokkeresés, tiltott fájltípusok) változtatás nélkül átengedi;
- ami egy keretrendszerből kellene, az kicsi és tesztelt: útválasztó (`App.php`), validáció (`Auth`, `Quotes::normalize`),
  migrációk (`Migrator.php`, ellenőrzőösszeggel, romboló utasítás tiltásával), rate limit / idempotencia (`Guard.php`).
- Kriptográfia: a PHP beépített libsodium (XChaCha20-Poly1305) és `password_hash(PASSWORD_ARGON2ID)` – saját algoritmus nincs.
Node/NestJS bevezetésére nem volt ok.

## Kód

| Hely | Tartalom |
|---|---|
| `services/mester-plus-api/index.php` | webes belépési pont (minden kérés ide fut) |
| `services/mester-plus-api/src/` | `App` (útvonalak, HTTPS, fejlécek, hibaséma, napló), `Auth`, `Accounts`, `Entitlements`, `Backups`, `Quotes`, `QuoteCalculator`, `Billing`, `Guard`, `Pages`, `Mailer`, `Maintenance`, `Migrator`, `Db`, `Config`, `Log`, `Util`, `Clock`, `Http` |
| `services/mester-plus-api/migrations/` | verziózott migrációk (PHP-fájl, mert a validátor `.sql`-t nem enged a kiadásba) |
| `services/mester-plus-api/bin/cli.php` | `migrate`, `maint`, `status-file`, `stats`, `grant`, `rewrap-keys`, `health` |
| `services/mester-plus-api/tests/` | `run.php` (1752 ellenőrzés), `live_http.php` (élő HTTP-teszt) |
| `services/mester-plus-api/tool/build_release.sh` | kiadási ZIP (tesztek és titok nélkül) |
| `apps/mester-plus/lib/cloud/` | `ApiClient`, `CloudConfig`, `CloudSession`, `Entitlements`, `BackupCrypto`, `CloudBackupService`, `AutoBackup`, `OnlineQuoteService`, `cloud_providers` |
| `apps/mester-plus/lib/features/cloud/` | Fiók, Eszközeim, Felhőmentések, Beállítások-kártyák, Online ajánlat kártya, életciklus |

Minden `src/` és `migrations/` fájl webről hívva 404 (`MP_API` őr), a `bin/` csak CLI-ből fut.

## API (v1)

JSON, UTF-8, egységes hiba: `{"error":{"code","message","request_id"}}` (a `message` magyar, belső részlet soha).
Minden válasz: `X-Request-ID`; a kliens `X-Request-ID`-je `X-Correlation-ID`-ként visszajön.

| Végpont | Leírás |
|---|---|
| `GET /api/v1/health` | app / database / storage (titok nélkül) |
| `GET /api/v1/plans` | csomagok (árak DRAFT jelöléssel) |
| `POST /api/v1/auth/register` · `login` · `refresh` · `logout` · `logout-all` | fiók és munkamenet |
| `POST /api/v1/auth/password/forgot` · `email/resend` | levél a sorba (lásd OPERATIONS: kézbesítő) |
| `GET /api/v1/me` · `GET /api/v1/devices` · `DELETE /api/v1/devices/{id}` | fiók, jogosultság, eszközök |
| `GET /api/v1/account/export` · `POST /api/v1/account/delete` | adatexport, fióktörlés |
| `GET /api/v1/subscription` · `POST /api/v1/subscription/trial` | előfizetés-állapot, próbaidő (alapból KI) |
| `GET /api/v1/backups/key` · `POST /api/v1/backups`* · `PUT …/{id}/content` · `GET /api/v1/backups` · `GET …/{id}/content` · `DELETE …/{id}` | felhőmentés |
| `POST /api/v1/quotes`* · `GET /api/v1/quotes[?quote_number]` · `GET …/{id}` · `POST …/{id}/revoke` | online ajánlat |
| `POST /api/v1/billing/google-play/verify`* · `…/sandbox/verify`* · `POST /api/v1/billing/webhook/{sandbox|google-play}` | előfizetés |
| `GET /a/{token}` · `/a/{token}/elfogadom` · `/a/{token}/nem-kerem` (GET megerősítés, POST döntés) | publikus ajánlat |
| `GET/POST /v/{token}` · `GET/POST /r/{token}` | e-mail megerősítés, új jelszó (webes) |

`*` = kötelező `Idempotency-Key` fejléc.

## Környezetek

| Környezet | Cím | Webhely a VPS-en | DB |
|---|---|---|---|
| production | `https://api.mesterplus.daekon.hu` (+ alias `ajanlat.mesterplus.daekon.hu`) | `/srv/sites/api.mesterplus.daekon.hu` | saját |
| staging | `https://api-staging.mesterplus.daekon.hu` | `/srv/sites/api-staging.mesterplus.daekon.hu` | saját (külön) |
| development | csak `--dart-define=MP_API_BASE=…` nem-release buildben | – | – |

A kiadott (release) app kizárólag a production címet használhatja (`CloudConfig`; a CI a kész AAB-n is ellenőrzi).
**DNS:** a `mesterplus.daekon.hu` alnevek még nem léteznek (tulajdonosi teendő, lásd OPERATIONS) – a tanúsítvány a DNS beállta
után automatikusan érkezik (Hosting Factory, 5 percenként ellenőrzi).

## Multi-tenant

Minden felhőadat munkaterülethez (workspace) kötött; regisztrációkor egy saját munkaterület jön létre (tulajdonos szerepkör).
Minden lekérdezés a hitelesített munkamenet `workspace_id`-jével szűr; idegen azonosító = 404 (a létezés sem derül ki).
Regressziós teszt: `tests/cases/30_tenant.php` – A fiók tokenje B minden erőforrására (mentés letöltés / feltöltés / törlés,
ajánlat lekérés / visszavonás, eszköz visszavonás, lista, export) 403/404, B adata érintetlen.
TEAM (több tag egy munkaterületen) később: a `workspace_members.role` már létezik.
