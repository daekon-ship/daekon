# Lizó Pizzéria – online fizetés: Novopayment / Saferpay technikai terv (belső)

Állapot: **csak terv**, 2026-11-13. A látványtervben nincs fizetés, nincs kulcs, nincs éles hívás.
Ez a dokumentum váltja a korábbi Stripe-tervet (az ügyfél várható szolgáltatója Novopayment / Saferpay).

## Források és ellenőrzöttség

| Forrás | Mit adott | Állapot |
|---|---|---|
| novopayment.hu/ecom/#saferpay (a megbízó által megadott hivatalos leírás) | Novopayment-specifikus szerződés, díjak, onboarding | **Nem olvastam** – a DAEKON munkakörnyezetből a cím nem volt elérhető. Át kell nézni, mielőtt a C/D fázis indul. |
| https://saferpay.github.io/jsonapi (Saferpay JSON API, SpecVersion 1.55) | végpontok, fejlécek, hibakezelés, Assert/Capture szabályok | ellenőrizve 2026-11-13 |
| https://saferpay.github.io/sndbx/Integration_PP.html | Payment Page folyamat, NotifyUrl, ReturnUrl szabályok | ellenőrizve 2026-11-13 |
| https://saferpay.github.io/sndbx/Interfaces.html | licencek (eCommerce / Business), interfészek | ellenőrizve 2026-11-13 |

Ami a Saferpay-dokumentációban nem volt egyértelmű (pl. az összeg mértékegysége HUF-nál, a NotifyUrl hitelesítése), azt alább **nyitott kérdésként** jelölöm, nem tényként.

## Választott megoldás: Saferpay Payment Page (átirányításos)

- A kártyaadat **soha nem érinti** a Lizó szerverét: a vevő a Saferpay fizetőoldalán fizet (3-D Secure-t a Payment Page kezeli).
- eCommerce licenccel is működik. API-ból indított visszatérítéshez a Saferpay szerint **Business licenc** kell – ezt a Novopaymenttel tisztázni kell (licenc nélkül `PERMISSION_DENIED`).
- Tesztkörnyezet: `https://test.saferpay.com/api` · éles: `https://www.saferpay.com/api`.
- Hitelesítés: HTTP Basic (JSON API felhasználó a Saferpay Backoffice-ban), TLS 1.2+. **API-hívás csak szerverről**, kliens-JavaScriptből soha.

## Architektúra (MHosting: PHP 8 + MySQL)

```
Böngésző ──(rendelés: csak termékazonosítók, méret, extrák, mennyiség)──▶ PHP API
PHP API: ár újraszámolása a terméktörzsből → orders (status=pending_payment) → Saferpay Initialize
        ◀── RedirectUrl ──  böngésző átirányítás a Saferpay fizetőoldalra
Saferpay ──(NotifyUrl, szerver→szerver)──▶ PHP notify végpont → Assert → (Capture) → orders.status=paid → konyhára
Böngésző ──(ReturnUrl)──▶ köszönő oldal: CSAK a szerver adatbázis-állapotát mutatja, maga nem dönt
```

### Adatbázis (vázlat)

- `orders` – id, public_no, created_at, mode (delivery/pickup), customer_name, phone, area, street, door, note, subtotal_huf, delivery_fee_huf, total_huf, pay_method (cash/card_on_delivery/online), **status** (lásd állapotgép), kitchen_released_at (NULL, amíg nem mehet a konyhára), version (optimista zár).
- `order_items` – order_id, product_id, size, qty, unit_price_huf (szerver számolta), removed_json, extras_json, note.
- `payments` – id, order_id, provider='saferpay', **request_id** (UUID, egyedi), saferpay_token, token_expires_at, transaction_id, capture_id, amount_huf, currency='HUF', status, liability_shift, last_error_name, created_at, updated_at. Egyedi index: (order_id, status in nyitott állapot), request_id, transaction_id.
- `payment_events` – minden bejövő NotifyUrl-hívás és minden Saferpay-válasz nyersen (érzékeny adat nélkül), időbélyeggel: audit és hibakeresés.
- `products`, `product_sizes`, `extras`, `zones` (díj, minimum), `opening_hours`, `admin_users` (password_hash, szerepkör).

### Rendelési/fizetési állapotgép

`draft → pending_payment → paid → accepted → cooking → ready → done`
Mellékágak: `payment_failed`, `payment_aborted`, `expired`, `rejected`, `refunded` / `partially_refunded`.
**Konyhára csak `paid` (online) vagy `accepted` (átvételkori fizetés) állapotú rendelés kerülhet**, egyszer: `kitchen_released_at` csak NULL-ról állítható (atomi UPDATE … WHERE kitchen_released_at IS NULL).

## Folyamat lépésről lépésre

1. **Rendelés rögzítése (szerver):** a kliens csak azonosítókat küld. A PHP a `products`/`extras`/`zones` táblából számolja a tételárakat, a kiszállítási díjat és a végösszeget; a kliens által küldött árat figyelmen kívül hagyja. Minimum- és nyitvatartás-ellenőrzés itt is.
2. **Végösszeg közlése:** a fizetés megerősítése előtt a vevő a **teljes fizetendő összeget** látja (részösszeg + kiszállítási díj). Amíg a díj nincs meg, online fizetés nem indítható.
3. **Initialize:** `POST /Payment/v1/PaymentPage/Initialize` – RequestHeader (SpecVersion 1.55, CustomerId, egyedi RequestId, RetryIndicator 0), TerminalId, Payment.Amount (Value + CurrencyCode `HUF`), Payment.OrderId = public_no, Description, ReturnUrl (saját köszönő oldal `?o=<public_no>`), Notification NotifyUrl. A Token mentése a `payments` sorba.
   - *Nyitott:* HUF esetén az `Amount.Value` mértékegysége (fillér vagy forint) – a Novopaymenttel / tesztkörnyezetben ellenőrizni.
4. **Átirányítás:** a RedirectUrl **csak egyszer** hívható (Saferpay-szabály). Dupla kattintásnál a második kattintás nem indít új Initialize-t: ugyanarra a nyitott `payments` sorra mutat, vagy ha lejárt, új RequestId-vel újat (a régit `expired`-re zárva).
5. **NotifyUrl (szerver→szerver):** a Saferpay sikeres fizetés után GET-tel hívja, és ha nem kap HTTP 200-at, összesen háromszor próbálja. A végpont:
   - idempotens: ha a rendelés már `paid`, csak 200-at ad vissza, nem küldi újra a konyhára;
   - nem a hívás tényéből dönt, hanem **Assert**-et hív a tárolt Tokennel;
   - *Nyitott:* a NotifyUrl hitelesítése a dokumentációban nem szerepel → a URL-be egyszer használatos, kitalálhatatlan azonosító kerül, és a döntés mindig az Assert-válaszon alapul.
6. **Assert:** `POST /Payment/v1/PaymentPage/Assert` – a tranzakció eredménye (Transaction.Id, Status, Amount, Liability). Szabályok: a visszakapott összegnek és devizának **egyeznie kell** a szerveren tárolt végösszeggel; eltérésnél Cancel és riasztás.
7. **Capture / Cancel:** `Status = AUTHORIZED` → `POST /Payment/v1/Transaction/Capture` (enélkül nincs terhelés); `CAPTURED` → nincs teendő. Ha az étterem elutasítja a rendelést még Capture előtt → `POST /Payment/v1/Transaction/Cancel`. Capture után már csak visszatérítés lehetséges.
8. **ReturnUrl (böngésző):** a Saferpay a visszatérési címre **nem küld adatot**, és azt mindig a vevő böngészője hívja → a köszönő oldal csak a szerver állapotát olvassa ki. Ha a Notify még nem jött meg, az oldal maga hív egy Assert-et (szerveroldalon), és „fizetés feldolgozás alatt” állapotot mutat – **a böngésző visszatérése önmagában soha nem jelent sikeres fizetést.**

## Hibaesetek

| Eset | Kezelés |
|---|---|
| Sikeres fizetés | Notify/Assert → (Capture) → `paid` → egyszer konyhára; e-mail/SMS visszaigazolás. |
| Sikertelen / elutasított kártya | Assert nem-200 válasz (pl. `3DS_AUTHENTICATION_FAILED`) → `payment_failed`; a vevő új fizetést indíthat vagy átvételkori fizetést választhat. Konyhára nem kerül. |
| Megszakított tranzakció | `TRANSACTION_ABORTED` → `payment_aborted`; a kosár megmarad. |
| A vevő nem indította el | `TRANSACTION_NOT_STARTED` → később újrapróbálható (Behavior `RETRY_LATER`). |
| Duplikált fizetési próbálkozás / dupla kattintás | rendelésenként egy nyitott `payments` sor (egyedi index); RequestId + RetryIndicator a Saferpay-hívásoknál; a gomb a válaszig tiltva. |
| Duplikált Notify | idempotens végpont, `payment_events` napló; állapotváltás csak `pending_payment → paid` irányban, atomi UPDATE-tel. |
| Internetkapcsolat megszakad (vevő) | a Notify szerver–szerver érkezik; a köszönő oldal újratöltéskor a szerver állapotát mutatja. |
| Internetkapcsolat / időtúllépés (szerver→Saferpay) | ugyanazzal a RequestId-vel, RetryIndicator növelésével újrapróbálás; `Behavior` = `DO_NOT_RETRY` esetén nem. API-időkorlát: 100 s. |
| Késve érkező visszaigazolás | Assert az Initialize után 24 órán belül hívható; cron (pl. 5 percenként) a `pending_payment` sorokra, ahol nincs Notify, egyszeri Assert-tel lezár (`paid` / `expired`). Nem pollingol folyamatosan (a Saferpay kéri). |
| Összegeltérés Assert-nél | Cancel (ha még nincs Capture) vagy visszatérítés + riasztás; konyhára nem kerül. |
| Visszatérítés | adminból, szerepkörhöz kötve: `POST /Payment/v1/Transaction/Refund` (CaptureReference + összeg) → szükség szerint Capture a refundra; `refunded`/`partially_refunded`; napló. **Business licenc kell** – egyeztetni. |
| Rendelés-egyeztetés | napi riport: `paid` rendelések vs. Saferpay Backoffice tranzakciók (OrderId alapján); eltérés → e-mail a tulajdonosnak és a DAEKON-nak. |

## Naplózás, riasztás, biztonság

- Minden Saferpay-kérés/-válasz és Notify a `payment_events` táblába (kártyaadat nincs, nem is érkezhet).
- Riasztás e-mailben: Assert-hiba, összegeltérés, 15 percnél régebbi `pending_payment`, Capture-hiba.
- Kulcsok (CustomerId, TerminalId, JSON API felhasználó/jelszó) **csak környezeti változóban / a webgyökéren kívüli konfigban**, soha nem a repóban és nem a GitHub Pages-en.
- PDO prepared statement, CSRF-token az admin műveletekhez, `password_hash` + szerepkörök, rate limit a rendelés- és fizetési végpontokon.

## Tesztelés és élesítés

1. Saferpay **teszt**fiók (Business funkciók tesztben alapból engedélyezettek) + a Novopaymenttől kapott teszt-terminál.
2. Automatizált tesztek: árkalkuláció (PHPUnit), állapotgép, idempotens Notify (ugyanaz a Notify 3×), dupla kattintás, megszakítás, elutasított kártya, 3-D Secure, Assert-összegeltérés, késve érkező Notify (cron), Capture-hiba, visszatérítés.
3. Kézi teszt valódi telefonon (iOS Safari, Android Chrome) a teljes fizetési úttal, tesztkártyákkal.
4. Dokumentált élesítési ellenőrzőlista; **éles kulcs csak a tulajdonos írásos jóváhagyása után**, kis összegű éles próbafizetéssel és azonnali visszatérítéssel.

## Az ügyféltől / Novopaymenttől szükséges

- Szerződés és licenc típusa (eCommerce vagy Business – a visszatérítés miatt).
- Teszt- és éles CustomerId, TerminalId, JSON API hozzáférés (a Lizó vállalkozása nevén).
- Engedélyezett fizetési módok (kártya, Apple Pay / Google Pay, SZÉP-kártya?) és díjak.
- A novopayment.hu/ecom leírás szerinti Novopayment-specifikus lépések (onboarding, Backoffice-hozzáférés).
- Ki kezeli a visszatérítést és az elutasított rendelések visszautalását.
