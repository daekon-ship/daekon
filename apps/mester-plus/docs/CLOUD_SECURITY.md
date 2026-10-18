# Mester+ Cloud – biztonság

## Hitelesítés és munkamenet

| Elem | Megoldás |
|---|---|
| Jelszó | Argon2id (`password_hash`, 64 MB, 3 kör), legalább 10 karakter, gyakori minták tiltva. Nyílt jelszó soha nem tárolódik / naplózódik. |
| Nem létező fiók | ugyanannyi munka (dummy Argon2id), azonos hibaüzenet – nem derül ki, létezik-e a cím |
| Brute force | IP-nként 20 / 15 perc, e-mail címenként 10 / 15 perc, 10 hibás jelszó után 15 perc zárolás |
| Access token | `mpa_` + 256 bit, 15 perc; a szerveren csak HMAC-SHA256 kivonat (szerver-bors: `MP_TOKEN_PEPPER`) |
| Refresh token | `mpr_` + 256 bit, 60 nap, **minden frissítéskor új** (rotáció); egy már felhasznált refresh token újbóli bemutatása = lopás-gyanú → az egész munkamenet visszavonva (`REFRESH_REUSE_DETECTED` audit). A kliens egyszerre csak egy frissítést futtat. |
| Eszközkötés | munkamenet = eszköz; eszköz visszavonása / kijelentkezés mindenhonnan azonnal hat; FREE: 1 eszköz, PRO: 3 |
| Jelszócsere | e-mailes, 1 órás, egyszer használható link; utána minden munkamenet visszavonva |
| Telefonon | tokenek a `flutter_secure_storage`-ben (Android Keystore) |

## Felhőmentés titkosítása

Lásd `CLOUD_BACKUP.md`. Röviden: a telefon titkosít (AES-256-GCM, AAD = fejléc + munkaterület), a munkaterületenkénti kulcs a
szerveren csak a mesterkulccsal (KEK, `config/app.env`, sosem Git / DB) burkolva van (XChaCha20-Poly1305). Tároló-, DB- vagy
B2-szivárgás önmagában nem ad nyílt adatot. **Tudatos határ:** aki a futó szervert (root) uralja, a KEK-kel a kulcsokat ki tudja
bontani – ez a „belépéssel új telefonon visszaállítható” követelmény ára (valódi végponttól végpontig titkosításhoz jelszó-alapú
kulcs kellene, ami jelszócserénél adatvesztést okozna). Később opcionális „saját mentési jelszó” bevezethető.

## Bemenet, web

| Védelem | Megoldás |
|---|---|
| SQL injection | kizárólag paraméterezett PDO (emulált prepare kikapcsolva), szigorú SQL-mód; tesztelve |
| XSS | minden kiírt érték HTML-escape; CSP `default-src 'none'`, stílus nonce-szal, **szkript nincs**; tesztelve |
| CSRF | publikus POST: SameSite=Strict + Secure + HttpOnly süti, rejtett mező, Origin-ellenőrzés, pillanatkép-kivonat |
| SSRF | a szerver soha nem kér le kliens által megadott URL-t; az ismeretlen mezők (pl. URL) a pillanatképből eldobva; tesztelve |
| Útvonal-trükk | azonosítók szigorú mintával (`[0-9a-z]{26}`, token 43 karakter); a tároló-kulcs a szerveren képződik |
| Felsorolás | véletlen 128 bites publikus azonosítók; idegen = nem létező (404) |
| Fájl-ellenőrzés | méretkorlát (50 MB), Content-Length = bejelentett méret, SHA-256, `MPCB` v1 fejléc + kulcsverzió; a kliens 100 MB-os kicsomagolási korláttal (zip-bomba) |
| Kliens-IP | csak `REMOTE_ADDR` – proxy nincs a VPS előtt, `X-Forwarded-For` soha nem számít |
| Fejlécek | API: `nosniff`, `no-store`, CSP, `Referrer-Policy: no-referrer`, HSTS; oldal: + `frame-ancestors 'none'`, `noindex` |
| HTTPS | productionben minden adatforgalom HTTPS (HTTP-n csak a titok nélküli `/` és `/api/v1/health`, a tanúsítvány előtti mérésekhez) |
| Admin | nincs webes admin-API; a tulajdonosi nézet a WebPanelben (Webmin-hitelesítés), csak összesítő számokkal |

## Rate limit (végpontonként külön)

belépés (IP 20/15p, e-mail 10/15p) · regisztráció (IP 5/óra) · jelszó-visszaállítás (IP 5/óra, cím 3/óra) · refresh (IP 60/15p) ·
mentés-feltöltés (fiók 20/óra) · letöltés (30/óra) · kulcs (30/óra) · ajánlat-létrehozás (60/óra) · publikus ajánlat (IP 120/10p,
hibás token 30/10p) · elfogadás / elutasítás (IP 20/óra) · billing ellenőrzés (20/óra) · webhook (IP 600/perc) · általános (fiók 600/10p).
Felette: az nginx IP-nkénti korlátja (30 kérés/mp, 40 egyidejű kapcsolat).

## Napló és audit

Strukturált JSON-napló (`logs/mester-plus-api.log`): idő, szint, request / correlation ID, útvonal **neve** (a publikus token nem),
állapotkód, időtartam, belső fiók- / munkaterület-azonosító. Kulcs-alapú szűrő: jelszó, token, e-mail, törzs, pillanatkép soha.
Audit (`audit_logs`): LOGIN, LOGIN_FAILED, LOGOUT(_ALL), DEVICE_REGISTERED / REVOKED, BACKUP_UPLOAD / DOWNLOAD / DELETED /
UPLOAD_REJECTED, QUOTE_CREATED / VIEWED / ACCEPTED (tartalom-kivonattal) / DECLINED / REVOKED, ENTITLEMENT_CHANGED,
SUBSCRIPTION_CHANGED, WEBHOOK_PROCESSED / REJECTED, ACCOUNT_DELETE_REQUEST / DELETED, PASSWORD_RESET(_REQUESTED),
EMAIL_VERIFIED, REFRESH_REUSE_DETECTED, DATA_EXPORT. IP csak HMAC-kivonatként.
**Ismert, nem blokkoló:** az nginx access-logja (root / adm, 14 nap) a publikus ajánlat-útvonalat (benne a tokent) tartalmazza.

## Titkok

`config/app.env` (root:<webhely> 0640): `MP_TOKEN_PEPPER`, `MP_KEK_<n>`, `MP_WEBHOOK_SANDBOX_SECRET` (csak staging).
`config/db.env`: a Hosting Factory hozza létre. A Gitben titok nincs; a CI gitleaks-szel (önteszttel) blokkol. A KEK cseréje:
új `MP_KEK_2`, `MP_KEK_CURRENT=2`, `php bin/cli.php rewrap-keys` (a mentések újratitkosítása nélkül).

## Fióktörlés és megőrzés

Lásd `OPERATIONS.md` → Megőrzés. Törléskor azonnal: munkamenetek, eszközök, mentés-fájlok, ajánlat-tartalom, e-mail, jelszó.
Marad (belső azonosítóval): audit (400 nap), előfizetési események (számviteli megőrzés – **OWNER LEGAL REVIEW REQUIRED**).

## Anti-tamper realitás

Tökéletes APK-másolásvédelem nincs és nem is célunk. A szerveres funkciókat a szerver minden kérésnél ellenőrzi; a kliens
jogosultság-gyorstára (7 nap) csak azt dönti el, mit mutat a felület. A helyi (offline) funkciók mindig szabadon használhatók.
