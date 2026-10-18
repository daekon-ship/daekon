# ONLINE AJÁNLAT

A PDF-ajánlat változatlanul megmarad; az online ajánlat egy plusz küldési mód (Pro). Feltétel: kiküldött (ajánlatszámos) ajánlat.

## Pillanatkép (snapshot)

Az app nem élő projektet küld, hanem egy megváltoztathatatlan pillanatképet (`OnlineQuoteService.buildPayload`):
ajánlatszám, kiállítás és érvényesség napja, eladó (cégnév, kapcsolattartó, cím, adószám, telefon, e-mail), az **ügyfél neve**,
projekt címe és helyszíne, tételek (név, egység, mennyiség, munkadíj, anyagár), kedvezmény / felár, ÁFA, lábléc + összesítő.
Az ügyfél telefonja, e-mailje, megjegyzése és a többi ügyfél soha nem kerül fel.

**Egy pénzügyi szabály:** az összesítőt az app a meglévő `QuoteCalculator`-ral számolja (`totalsFor`); a szerver
(`QuoteCalculator.php`, ugyanaz a szabály, half-up, túlcsordulás-biztos) újraszámolja, és **1 Ft eltérésnél is elutasítja**
(`422 TOTALS_MISMATCH`). Közös tesztesetek: `apps/mester-plus/test/fixtures/quote_totals.json` (53 eset, független
Python-referenciával generálva) – a Dart és a PHP teszt is ezt futtatja. Ár nélküli tétel: `422 UNPRICED_LINES`.
A szerver a pillanatképet kanonikusra normalizálja (ismeretlen mező eldobva), SHA-256 kivonatot tárol, a verziót ő osztja ki;
ugyanannak az ajánlatnak új változata a régi linket visszavonja.

## Link

`https://ajanlat.mesterplus.daekon.hu/a/<token>` – 256 bites véletlen token, a DB-ben csak HMAC-kivonat. Kitalálni irreális
(2^256), a hibás próbálkozás IP-nként rate-limitelt. Referer nem szivárog (`no-referrer`). A link a telefonon (biztonságos
tárolóban) marad meg; új telefonon új változat küldhető.

## Ügyfél-oldal

Mobil-first, magyar, szkript nélkül: vállalkozó, projekt, ajánlatszám, dátum, érvényesség, tételek, nettó / ÁFA / bruttó, feltételek;
gombok: **ELFOGADOM**, **NEM KÉREM**, **KÉRDÉSEM VAN** (hívás / e-mail a vállalkozónak). Elfogadás: megerősítő oldal kötelező
jelölőnégyzettel, CSRF-védelem, a POST a pillanatkép-kivonatot is hordozza; atomikus állapotváltás (`ACTIVE` és érvényes) – dupla
kattintás / utólagos elutasítás nem ír felül; szerver-időbélyeg, audit (`QUOTE_ACCEPTED` + tartalom-kivonat).
Szöveg: „Ajánlat elfogadva” – **nem minősített elektronikus aláírás** (az oldal ezt ki is írja).
QA (2026-10-18, valódi szerver által renderelt oldalak): megnyitott / megerősítő / elfogadott / lejárt / hibás link × 360, 390, 412,
430 px – túlcsordulás és levágott elem nincs, minden gomb ≥ 44 px.

## Események és állapot

`quote_events`: CREATED, OPENED (első, utána legfeljebb óránként; link-előnézet robotok nem számítanak), ACCEPTED, DECLINED,
EXPIRED (karbantartó, 15 percenként), REVOKED. IP csak HMAC-kivonat, 30 nap után törölve. App-állapot: Nem küldött · Elérhető ·
Megnyitva · Elfogadva · Elutasítva · Lejárt · Visszavonva – frissítés az ajánlat megnyitásakor és gombra; offline a legutóbbi
ismert állapot látszik. Push-értesítés: későbbi mérföldkő (Firebase nincs, nem feltétel).
