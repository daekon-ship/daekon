# Teljes felhő-szinkron – terv (NEM implementált)

Ebben a körben szándékosan nincs valós idejű, több eszközös adatbázis-szinkron: a helyi Drift-adatbázis marad az egyetlen
forrás, a felhőmentés teljes pillanatkép. Ez a dokumentum azt rögzíti, mi kell majd a szinkronhoz – séma-migráció most NEM történt.

## Ami hiányzik a mai sémából

| Szükséges | Ma | Változtatás (később, egy migrációval) |
|---|---|---|
| Globálisan egyedi azonosító | `INTEGER autoIncrement` (eszközönként ütközik) | minden szinkronizált táblába `uuid TEXT UNIQUE` (UUIDv7, időrendezett); a helyi int marad belső kulcsnak, az FK-k mellett uuid-hivatkozás |
| Módosítási idő | `updatedAt` csak `customers`, `projects`, `priceItems` | minden táblába `updated_at` (UTC, ms) – minden írásnál a repository állítja |
| Szerver-revízió | nincs | `server_rev INTEGER` (a szerver monoton sorszáma), `dirty BOOLEAN` |
| Törlés | fizikai `DELETE` + cascade | tombstone: `deleted_at`; a cascade helyett a repository jelöl; takarítás a szerver visszaigazolása után |
| Eszköz | nincs | `device_id` (a Cloud eszköz-azonosító) az utolsó módosítónál |
| Kimenő sor | nincs | `outbox_mutations` (tábla, sor-uuid, művelet, mezők, idempotencia-kulcs, próbálkozás) |

## Protokoll

- Pull: `GET /api/v1/sync?since=<rev>` → változások revízió szerint, lapozva; Push: `POST /api/v1/sync` (Idempotency-Key) a kimenő
  sorral. A szerver munkaterület-szintű revíziót vezet (`sync_changes` tábla).
- Ütközés: mezőszintű „utolsó író nyer” `updated_at` + `device_id` döntetlen-feloldással; **pénzügyi és ajánlati sorok** (ajánlatszám,
  befizetés, kiadott ajánlat tételei) nem íródnak felül csendben: ütközésnél mindkét változat megmarad, a felület választ kér.
- Ajánlatszám: a szerver osztja ki (ma a telefon számlálója) – vagy eszközönkénti előtag.
- Offline mutációs sor: a helyi írás azonnal megtörténik; a sor háttérben, exponenciális visszalépéssel, idempotens kulccsal megy fel.
- Kezdeti feltöltés: a meglévő helyi adatból (a mai felhőmentés-formátummal azonos export alapján).

## Kockázatok, előfeltételek

Teljes Drift-migráció (v3 → v4) regressziós tesztekkel, a mentés-formátum v3-ra emelése, a `QuoteCalculator` érintetlen marad,
TEAM-jogosultságok (`workspace_members.role`) érvényesítése soronként. Becslés: önálló, nagyobb mérföldkő.
