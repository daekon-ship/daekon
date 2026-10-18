# MESTER+ CLOUD BACKUP

A meglévő helyi mentésre épül: ugyanaz a JSON (`BackupService.exportJson`), ugyanaz a teljes ellenőrzés (`parse`) és
ugyanaz az egy-tranzakciós visszaállítás (`restore`). Második mentés-implementáció nincs; a felhő csak titkosítva szállít és tárol.

## Folyamat

**Mentés:** export → gzip → AES-256-GCM (a telefonon) → `POST /api/v1/backups` (méret, SHA-256, verziók; Idempotency-Key) →
`PUT …/content` → szerver: méret + SHA-256 + `MPCB` fejléc + kulcsverzió → `READY` (különben `FAILED`, nem jelenik meg).
Állapotok: `UPLOADING → VERIFYING → READY | FAILED` (atomikus); 2 óránál régebbi félbemaradt feltöltés → `FAILED` + takarítás.

**Visszaállítás (FELHŐMENTÉSEK → Visszaállítás):** figyelmeztetés → letöltés → SHA-256 (lista + fejléc) → kulcs a fejléc
verziójához → visszafejtés (GCM-hitelesítés) → korlátozott kicsomagolás (100 MB) → `BackupService.parse` (teljes ellenőrzés) →
megerősítés a tartalommal (ügyfelek / projektek / tételek száma) → **biztonsági másolat a jelenlegi helyi adatokról**
(`biztonsagi_mentesek/visszaallitas_elott_*.json`, az utolsó 3) → tranzakciós csere. Bármely hibánál a helyi adat érintetlen.

## Titkosítási modell

| Réteg | Mit véd |
|---|---|
| TLS | szállítás |
| AES-256-GCM a telefonon, munkaterületenkénti véletlen 32 bájtos kulccsal (BK) | a szerver tárolója (fájlok, DB-dump, B2-másolat) nyílt adatot nem lát; egy bájt módosítása is kiderül |
| AAD = fejléc + munkaterület-azonosító | mentés nem csempészhető át másik fiókba, a fejléc nem írható át |
| BK a szerveren XChaCha20-Poly1305-tel burkolva a mesterkulccsal (KEK, `config/app.env`), AAD = munkaterület + kulcsverzió | DB-szivárgásból a BK nem nyerhető ki |
| BK lekérése csak hitelesített, Pro / restore jogosultságú munkamenettel, TLS-en | új telefonon belépés után visszaállítható |

Formátum v1: `"MPCB"` · formátum (1 bájt = 1) · kulcsverzió (uint32 BE) · nonce (12) · titkosított adat · GCM-tag (16).
Kulcsrotáció: BK → új `key_version` (a régi mentések a régi verzióval nyílnak); KEK → `rewrap-keys` (lásd `CLOUD_SECURITY.md`).
Kriptográfia: Dart `cryptography` (AesGcm), PHP libsodium – saját algoritmus nincs. Kereszt-ellenőrzés (2026-10-18): a Dart-titkosítást
a PHP/OpenSSL bájtra visszafejti, a módosított bájtot elutasítja.

## Csomag, kvóta, megőrzés (a `plans` táblában, nem a kódban)

| | FREE | PRO (tervezet) | TEAM (tervezet) |
|---|---|---|---|
| Felhőmentés | nincs | igen | igen |
| Kvóta (kemény) | – | 500 MB (80 %-nál figyelmeztetés) | 2 GB |
| Verziók | – | 30 | 60 |
| Megőrzés | – | 30 nap | 60 nap |
| Méretkorlát / mentés | – | 50 MB (`MP_BACKUP_MAX_BYTES`) | 50 MB |

A legfrissebb sikeres mentés automatikusan soha nem törlődik. Kvóta-túllépés: `413 QUOTA_EXCEEDED` (`used_bytes`, `quota_bytes`).
Lejárt előfizetés: új mentés nem, a meglévők 30 napig visszaállíthatók. Kézi / béta Pro-jogosultság a Pro szabályát kapja.

## Automatikus mentés

Nem háttérszolgáltatás és nem 5 percenkénti: amikor az app előtérbe kerül (15 mp-cel az indulás után, legfeljebb 10 percenként),
és legalább 24 óra telt el az utolsó sikeres mentés óta, **és a helyi adatok változtak** (ujjlenyomat), akkor ment. Hiba után
exponenciális várakozás: 15 → 30 → 60 perc … legfeljebb 24 óra. Nincs wake lock, nincs háttér-feladat; az indulást és a helyi
munkát nem lassítja. Kikapcsolható (Beállítások → Felhőmentés → Automatikus napi mentés). Valódi háttér-mentés (WorkManager,
Wi-Fi-preferencia) későbbi mérföldkő.

## Tárolás a VPS-en

`/srv/sites/api.mesterplus.daekon.hu/shared/cloud-backups/<munkaterület>/<mentés>.mpcb` (a webhely felhasználójáé, 0640; a
webrootból nem érhető el). Logikailag külön a VPS katasztrófa-mentésétől; a webhely napi helyi mentése és a B2 (restic) a
titkosított blobokat is viszi (a KEK-kel együtt a restic-titkosított tárolóban). Törölt felhasználó blobja a B2-ben legfeljebb
6 hónapig (a restic megőrzési szabálya) marad, titkosítva. Saját B2-prefix / bucket a felhasználói mentéseknek: a forgalom
növekedésekor (lásd `OPERATIONS.md`).
