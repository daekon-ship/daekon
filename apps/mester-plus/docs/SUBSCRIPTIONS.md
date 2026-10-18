# Előfizetés és jogosultság

## Csomagok (`plans` tábla – az árak egyetlen forrása)

| Kód | Név | Ár | Állapot | Jogosultságok |
|---|---|---|---|---|
| `free` | Mester+ Offline | 0 | – | – (minden helyi funkció) |
| `pro` | Mester+ Pro | 4 990 Ft / hó · 49 900 Ft / év | **DRAFT** (nincs jóváhagyva) | cloud_backup, cloud_restore, online_quotes, multiple_devices |
| `team` | Mester+ Team | – | **DRAFT** | + team |

Az ár nem jelenik meg a landingen, és nem aktív, amíg a tulajdonos jóvá nem hagyja (`pricing_status = APPROVED`).
Próbaidő: `pro.trial_days = 14` (tervezet), **alapból kikapcsolva** (`MP_TRIAL_ENABLED=0`); munkaterületenként egyszer.

## Központi jogosultság-feloldó

Szerver: `Entitlements::resolve()` – aktív előfizetés (TRIAL / ACTIVE / GRACE) csomagjának jogosultságai + kézi / béta
jogosultságok (`entitlements` tábla) + lejárat utáni 30 napos visszaállítás. Minden Pro-végpont ezt ellenőrzi (`403 PRO_REQUIRED`).
App: `Entitlements` (`canUseCloudBackup()`, `canUseCloudRestore()`, `canUseOnlineQuotes()`, `canUseMultiDevice()`) – a felület
csak ezekre épít, nincs szétszórt `plan == 'pro'`.

**Offline:** az app a szerver válaszát gyorsítótárazza a szerver által adott `cache_until`-ig (7 nap). Közben internet nélkül is
látszik a Pro, utána újra kell kapcsolódni. Visszaállított telefon-óra → érvénytelen. A helyi funkciók ettől soha nem függenek,
a szerveres Pro-funkciókat pedig a szerver minden kérésnél maga ellenőrzi.

## Állapotok (külön a fiók-állapottól)

Fiók: ACTIVE · SUSPENDED · DELETION_PENDING · DELETED. Előfizetés: TRIAL · ACTIVE · GRACE · PAST_DUE · CANCELLED · EXPIRED.

| Esemény | Hatás |
|---|---|
| PURCHASED / RENEWED / RECOVERED | ACTIVE, új időszakvég |
| IN_GRACE_PERIOD | GRACE (hozzáférés marad a türelmi idő végéig) |
| ON_HOLD | PAST_DUE (nincs hozzáférés – Play „account hold”) |
| CANCELED | automatikus megújítás ki; a kifizetett időszak végéig marad; utána CANCELLED |
| REVOKED (visszatérítés) | azonnal EXPIRED |
| EXPIRED / időszak vége (karbantartó) | EXPIRED vagy CANCELLED |

Minden váltás: `subscription_events` + audit (`SUBSCRIPTION_CHANGED`, `ENTITLEMENT_CHANGED`).

## Szolgáltatók

- **google_play** – éles. Hitelesítő adat nélkül **kikapcsolva** (`503 BILLING_NOT_CONFIGURED`); kitalált credential nincs.
- **sandbox** – csak nem-production környezetben (`MP_BILLING_SANDBOX=1`): teljes életciklus tesztelhető (staging, teszt).
- **manual** – tulajdonosi / béta jogosultság: `php bin/cli.php grant --email E --plan pro --days N`.

Ugyanaz a vásárlás nem köthető két fiókhoz (`409 PURCHASE_IN_USE`).

## Webhook

`POST /api/v1/billing/webhook/sandbox`: HMAC-SHA256 aláírás (`X-MP-Timestamp` + `X-MP-Signature`, időbélyeg ± 5 perc),
egyedi esemény-azonosító (`webhook_events`, egyedi kulcs) → ismételt kézbesítés: `duplicate`, nem dolgozza fel újra; ugyanaz az
azonosító más tartalommal: 409; feldolgozási hiba: `FAILED`, az újraküldés újra feldolgozza; minden eredmény auditált.
`…/webhook/google-play`: a Play RTDN (Pub/Sub push, OIDC-token ellenőrzéssel) beállításáig 503.

## Google Play Billing – élesítés terve

Követelmény (2026-10): a Play Billing Library 7 határideje (új appok / frissítések) 2026-08-31 volt (hosszabbítással 11-01),
a PBL 8-é 2027-08-31 – **PBL 8 vagy újabb** kell (ellenőrizd a Play Console-ban).
1. Flutter: hivatalos `in_app_purchase` plugin (Android-implementációja PBL 8+), termékek: `mester_plus_pro_monthly`,
   `mester_plus_pro_yearly` (a `plans.play_product_ids`-ben). A vásárlás után az app a purchase tokent elküldi:
   `POST /api/v1/billing/google-play/verify` – a jogosultságot a SZERVER adja, nem a kliens.
2. Szerver: Google Play Developer API `purchases.subscriptionsv2.get` (szolgáltatásfiók-JWT → OAuth), acknowledge, állapot-leképezés
   (fenti tábla); RTDN: Pub/Sub push → `…/webhook/google-play` (OIDC audience + kibocsátó ellenőrzése).
3. Tesztelés: Play license tesztelők + belső teszt sáv.

**OWNER ACTION (élő számlázáshoz):** Play Console fiók és az app létrehozása; előfizetési termékek (ID-k fent, ár, próbaidő);
Google Cloud projekt + szolgáltatásfiók „Pénzügyi adatok megtekintése / rendelések kezelése” jogosultsággal, a JSON-kulcs a
szerverre (`/srv/sites/api.mesterplus.daekon.hu/config/`, 0640) – **nem a Gitbe**; Pub/Sub téma + push-előfizetés; árazás
jóváhagyása (`pricing_status`); ÁSZF / adatvédelem jogi jóváhagyása; fizetési profil / adószám a Play Console-ban.

## Bevételi mutatók

A rendszer a `subscriptions` / `subscription_events` táblákból később számolhat ACTIVE SUBSCRIPTIONS, MRR, ARR, TRIAL → PRO,
CANCELLED, FAILED PAYMENT, CHURN mutatókat. Amíg nincs éles számlázás, a tulajdonosi nézet ezt írja: „Nincs még éles számlázási adat.”
