# Karikagyuru.com – biztonsági és adatkezelési áttekintés (V5.9, 2026. 11. 24.)

A kódban ellenőrzött állapot. Valódi tárhelyen még semmi nem futott, ezért élesítés előtt a tárhelyen újra ki
kell próbálni (`TELEPITES.md`). Ez az áttekintés nem jogi vélemény.

| Terület | Megoldás | Ellenőrizve | Élesítés előtt teendő |
|---|---|---|---|
| Admin belépés | jelszó `password_hash`-sel; munkamenet-süti: HttpOnly, SameSite=Strict, HTTPS-en Secure; böngésző bezárásakor lejár | api_test, server_failures_e2e (lejárt belépés) | erős jelszó az ötvösnek, HTTPS kötelező |
| Próbálkozások | 5 hibás belépés / 15 perc → zárolás; a gépek IP-címét csak kivonatként (hash) tároljuk | api_test, demo_kapu_test | – |
| Jogosultság | minden módosító és bizalmas végpont (mentés, árverziók, érdeklődések, referenciaképek, fotófeltöltés, levélbeállítás) csak belépve; a régi admin címek a belépés-ellenőrzés után irányítanak át | api_test, admin_v59_e2e (19 cím) | – |
| Fejlesztői adat elkülönítése (V5.9) | a 25 kérdés válaszai (`clientDecisions`) a tulajdonosi admin API-nak sem mennek ki; a tulajdonosi mentés nem írhatja felül és nem törölheti; írás/olvasás csak parancssorból (`bin/fejlesztoi-dontesek.php`). Külön szerepkör nincs: a határ a szerver shell-hozzáférése | api_test, admin_v59_e2e, mentes_test | – |
| Romboló mentés tiltása (V5.9) | a szerver elutasítja azt a mentést, amely meglévő gyűrűt törölne, egyszerre több műhelymunkát törölne, vagy eltüntetné a korábbi árakat (előzményeket) – így a „teljes alapállapot” sem a felületről, sem közvetlen API-hívással nem indítható. Teljes változat-visszaállítás (`POST /revert`) csak `KG_FEJLESZTOI_VISSZAALLITAS=1`-gyel | api_test, admin_v59_e2e | – |
| CSRF | módosító kéréshez `X-CSRF-Token`, időzítés-biztos összevetéssel | api_test | – |
| Adatbázis | SQLite a webgyökéren kívül (`KG_DATA`), előkészített lekérdezések | api_test | próba: a `kg.sqlite` URL-ről 404 |
| Nyilvános adat | a látogató csak jóváhagyott árat, látható gyűrűt, látható műhelymunkát kap; a régi listaár, a belső felárak, a nyitott kérdések és az ügyféldöntések nem mennek ki | api_test (V5.8: ügyféldöntések is) | – |
| Referenciaképek (saját ötlet) | újrakódolva (GD), EXIF nélkül, véletlen fájlnévvel, csak belépett adminnak szolgálva ki | upload_test, bemutato_e2e | – |
| Feltöltés | csak JPEG/PNG/WebP, valódi képként megnyitva, méretkorlát, legfeljebb 3 kép | upload_test | `upload_max_filesize` a tárhelyen |
| Érdeklődések | szerkezeti ellenőrzés, méretkorlát, robotcsapda-mező | api_test | – |
| E-mail | alapból kikapcsolva; valódi levél csak az ügyfél jóváhagyott címével és SMTP-adataival; a bemutató minden beállítást felülírva kikapcsolja | mail_test, demo_kapu_test | jóváhagyott cím, próbalevél engedéllyel |
| Megőrzés | `bin/purge.php <nap>` törli a régi érdeklődéseket a képeikkel | api_test | a napok számát az adatkezelési tájékoztató adja meg |
| Mentés és visszaállítás | `bin/mentes.php` (V5.8.1): zárolással konzisztens; minden fájl méret- és SHA-256-ellenőrzéssel; a célt kanonikus útvonalon ellenőrzi (adatmappa, webgyökér, symlink tiltva); hibánál nincs kész mappa; 0700/0600; napló személyes adat nélkül. `bin/visszaallitas.php` csak új, üres mappába, előzetes ellenőrzéssel. Leírás: `MENTES_ES_VISSZAALLITAS.md` | mentes_test (85) | napi cron, a régi mentések törlése, visszaállítás kipróbálása |
| Bemutató elkülönítése | külön adatmappa, „demo” jelölés; éles módban demo adat nem menthető; a bemutató saját jelszava nem nyitja az admint | demo_kapu_test, bemutato_e2e | a `demo/`, `bin/demo-*`, `dev/` mappa nem kerül az éles tárhelyre |
| Nyilvános repository | nincs benne az ötvös kézírásos jegyzete, eredeti CAD-fájl, ügyféllevél vagy jelszó; a bemutató jelszavai minden telepítéskor véletlenszerűek | privát ellenőrző szkript (nem része a repónak) | a git-előzmény korábbi változatában maradt mintaszámok kezelése külön döntés (nem írtuk át automatikusan) |

## Nyitott kérdések

- **Adatkezelési tájékoztató:** az új funkciók (referenciakép-feltöltés, ajánlatkérés tárolása, e-mail-értesítés) miatt frissíteni kell, és meg kell adni a megőrzési időt. Ez az ügyfél (adatkezelő) feladata, jogi átnézéssel.
- **Sütik:** az oldal csak működéshez szükséges sütit használ (admin munkamenet, bemutató-kapu), követő vagy reklámsütit nem. Ha később analitika kerül rá, sütitájékoztató kell.
- **Telefonos bemutató Wi-Fi-n:** sima `http` – csak saját hálózaton (`BEMUTATO_TELEPITES.md`).
