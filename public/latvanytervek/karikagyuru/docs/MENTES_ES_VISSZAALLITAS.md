# Karikagyuru.com – biztonsági mentés és visszaállítás (V5.8.1)

**Állapot:** megírva, és helyben, valódi PHP-futtatással tesztelve (`services/karikagyuru-api/tests/mentes_test.py`, 85 ellenőrzés):
mentés futó weboldal mellett, teljes visszaállítás új mappába, a visszaállított rendszer indítása és újraindítása, 13 hibaeset.
**Valódi tárhelyen még nem futott** – ott az első telepítéskor egyszer végig kell csinálni a 4. pontot.

## 1. Mit ment, és mit nem

| Benne van | Nincs benne |
|---|---|
| Az adatbázis (`kg.sqlite`): minden árverzió, gyűrű, jóváhagyás, műhelymunka, ügyféldöntés, érdeklődés, admin jelszó (titkosított lenyomatként) | A weboldal fájljai (azok a repositoryban vannak) |
| Feltöltött termék- és műhelyfotók (`photos/`) | A próbalevelek (`outbox/`) |
| Az érdeklődésekhez csatolt **privát** referenciaképek (`inquiry-files/`) | Munkamenetek (újra be kell lépni) |
| Beállítások: `salt`, és ha van: `mail.json` (SMTP-jelszót is tartalmazhat), `demo-kapu.json` | |

A mentés **személyes adatot tartalmaz** (érdeklődők neve, telefonszáma, képei). Ezért:
- a mappák 0700, a fájlok 0600 jogosultságot kapnak;
- a mentés nem kerülhet az adatmappába, és webről elérhető mappába sem (a program elutasítja);
- a naplóba (`mentes-naplo.log`) csak darabszám, méret, időtartam és hibakód kerül, név vagy elérhetőség nem.

## 2. Hogyan biztosítja, hogy a mentés egy időpont állapota legyen

Az adatbázis és a képfájlok külön fájlok. Ha mentés közben valaki képet tölt fel vagy érdeklődést töröl, a kettő eltérhetne.
Ezt **zárolás** zárja ki:

1. a mentés kizárólagos zárat vesz az adatmappa `.mentes.lock` fájlján;
2. minden író művelet (ármentés, érdeklődés, fotófeltöltés, törlés, megőrzési törlés, bemutató-visszaállítás) megosztott zárat kér. A már futó írás befejeződik, mielőtt a mentés elindul. Az új írás **megvárja** a mentés végét (`KG_MENTES_VARAKOZAS`, alapból 20 mp);
3. ha a mentés ennél tovább tart, az író kérés 503-at kap („Biztonsági mentés folyamatban. Kérjük, próbálja újra egy perc múlva.”), és **semmi nem íródik félig**;
4. a zár alatt: adatbázis-pillanatkép (`VACUUM INTO`), az összes fájl másolása, minden másolat méretének és SHA-256 ellenőrzőösszegének összevetése a forrással;
5. ellenőrzi, hogy a pillanatképben hivatkozott minden fotó és referenciakép benne van-e a mentésben.

Teszttel igazolva: mentés közben indított új ajánlatkérés (képpel) és érdeklődés-törlés megvárta a mentést, majd sikerült.
A mentés a változás előtti állapotot tartalmazza, minden hivatkozott képpel együtt.

**Javaslat:** éjszakára ütemezve fusson (pl. 03:15), akkor a várakozást senki nem veszi észre.

## 3. Napi mentés

```sh
# egyszer: a mentések mappája a webgyökéren és az adatmappán KÍVÜL (ha lehet, másik lemezen)
mkdir -m 700 /home/<fiók>/kg-mentesek

# kézzel
KG_DATA=/home/<fiók>/kg-adat php /home/<fiók>/kg-app/bin/mentes.php /home/<fiók>/kg-mentesek

# cron (minden nap 03:15) – a hibát a cron e-mailben jelzi, ha a tárhely ezt támogatja
15 3 * * * KG_DATA=/home/<fiók>/kg-adat php /home/<fiók>/kg-app/bin/mentes.php /home/<fiók>/kg-mentesek >/dev/null
```

Eredmény: `kg-mentesek/kg-mentes-ÉÉÉÉHHNN-ÓÓPPMM/` (UTC-idő), benne `manifest.json` (ellenőrzőösszegek, rekordszámok, személyes adat nélkül).

| Kilépési kód | Jelentés |
|---|---|
| 0 | kész és ellenőrizve |
| 1 | hibás használat vagy tiltott cél (adatmappa, webgyökér, nem létező mappa, azonos nevű mentés) |
| 2 | másolási vagy ellenőrzési hiba (betelt tárhely, nem írható cél, olvashatatlan fájl, sérült adatbázis) |
| 3 | nem sikerült zárolni (egy másik mentés fut) |
| 4 | a forrásból hivatkozott fájl hiányzik – nincs mentés; `--hianyos-engedve` kapcsolóval `-HIANYOS` végű mentés készül |
| 5 | megszakítva (Ctrl+C) – a félkész mappa törölve |

Hibánál **nincs** `kg-mentes-…` nevű mappa. A félkész munkamappa (`.kg-mentes-….reszleges`) törlődik; ha a folyamatot erővel leállították (kill -9), a következő mentés a 10 percnél régebbit eltakarítja. Félkész mappát a visszaállítás nem fogad el.

**Ellenőrzés visszaállítás nélkül:** `php bin/mentes-ellenorzes.php <mentésmappa>` → 0 = rendben.
Ajánlott hetente: a legutóbbi mentést ezzel ellenőrizni, és a naplót (`mentes-naplo.log`) átnézni, van-e `HIBA` sor.

## 4. Visszaállítás – lépésről lépésre

**Szabály: meglévő adatmappát a program soha nem ír felül.** Mindig új, üres mappába állít vissza, és csak utána cseréljük le.

1. **Ellenőrizze a mentést:** `php bin/mentes-ellenorzes.php /home/<fiók>/kg-mentesek/kg-mentes-20261122-031500`
2. **Állítsa vissza új mappába:**
   ```sh
   KG_DATA=/home/<fiók>/kg-adat-visszaallitott php bin/visszaallitas.php /home/<fiók>/kg-mentesek/kg-mentes-20261122-031500
   ```
   Előbb a teljes mentést ellenőrzi (méret, SHA-256, adatbázis-épség, rekordszámok). Hibánál a cél nem jön létre.
3. **Próbálja ki külön:** ideiglenesen egy próbacímen, vagy `php -S 127.0.0.1:8800` a visszaállított mappával. Lépjen be, nézze meg az árakat, a gyűrűket és az érdeklődéseket, és nyisson meg egy referenciaképet.
4. **Csere:** állítsa le az oldalt (vagy tegye karbantartó módba). A régi adatmappát **nevezze át, ne törölje** (pl. `kg-adat-regi-20261122`). Az új mappát nevezze `kg-adat`-ra (vagy állítsa rá a `KG_DATA`-t).
5. Indítás, ellenőrzés, és csak napok múlva a régi mappa törlése.

A régi admin jelszó a visszaállítás után is érvényes, mert a mentésben van. Bemutató (minta)adat mentését a program éles adatmappába nem állítja vissza: ehhez a `--bemutato` kapcsoló kell, éles mentéshez pedig az nem használható.

## 5. Megőrzés – a régi mentések törlése

**A megőrzési időt az ügyféllel kell egyeztetni** (adatkezelési tájékoztató). A rendszer ezért **nem töröl automatikusan**, és nincs alapértelmezett időtartam.

```sh
# próbafuttatás: csak kiírja, mi lenne törölhető
php bin/mentes-torles.php /home/<fiók>/kg-mentesek --napok <N> --megtart 7
# törlés
php bin/mentes-torles.php /home/<fiók>/kg-mentesek --napok <N> --megtart 7 --torles
```

- Csak a `kg-mentes-ÉÉÉÉHHNN-ÓÓPPMM` nevű, `manifest.json`-t tartalmazó mappákhoz nyúl, más mappához nem.
- A legújabb K mentés (`--megtart`) mindig megmarad.
- Minden törlés bekerül a naplóba.
- Cronba csak az ügyfél jóváhagyott megőrzési idejével kerülhet.

## 6. Ami a tárhelyen még teendő

- ☐ A mentések mappája lehetőleg másik lemezen vagy tárhelyen legyen. Egy lemezhiba így nem viszi el az adatot és a mentést is.
- ☐ Napi cron beállítása, és az első hét mentéseinek ellenőrzése.
- ☐ **Egy valódi visszaállítási próba a tárhelyen** (4. pont, 1–3. lépés), az idejét és az eredményét le kell írni (`TELEPITES.md` 5. pont).
- ☐ A megőrzési idő egyeztetése az ügyféllel. Utána a `mentes-torles.php` cronba tehető.
- ☐ Ha a tárhely PHP-ja nem támogatja a `pcntl`-t, a Ctrl+C-s megszakítás után a félkész mappát a következő mentés takarítja el. A kész mentést ez nem érinti.
