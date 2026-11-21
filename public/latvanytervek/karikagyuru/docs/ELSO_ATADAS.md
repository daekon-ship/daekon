# Karikagyuru.com – első átadás és későbbi fejlesztések

Ez a dokumentum elválasztja, mi tartozik az **első átadáshoz**, és mi **későbbi, külön fejlesztés**.
Az állapotok tényszerűek: „demó” = a látványtervben működik, de csak a böngészőben ment;
„váz” = megírva és helyben tesztelve, de nincs bekötve/élesítve.

## A. Első átadás

| Rész | Mit jelent | Mai állapot |
|---|---|---|
| Új weboldal | főoldal, ötvös bemutatása, saját ötlet, kapcsolat, mobilon is | demó – kész a bemutatásra; a szövegeket és a tegeződést az ügyfélnek jóvá kell hagynia |
| Gyűrűkatalógus | 115 modell, szűrés, keresés, termékoldal | demó – a jelenlegi oldal adataiból; a képek 600×600-asak, élesebbhez az eredetik kellenek |
| Árkezelés | eladási grammár fémenként, gyémánt darabár, előtte–utána összevetés, megerősítés, árverzió, visszaállítás, hiányzó adat jelzése | kész, az ötvös számítási módszerével; **az árak nem jóváhagyottak** – ezért a vásárló még nem lát számolt árat (lásd lent) |
| Kezelőfelület | 5 fő feladat: árak, gyűrűk, fotók, szabályok, érdeklődések; belépés, szerveres mentés változatokkal, mentésjelző | kész és helyben tesztelve (szerver módban is); valódi tárhelyen még nem futott |
| Szakmailag korlátozott konfigurálás | gyűrűnként: fémek, színek, mérettartomány, szélesség/vastagság csak ha engedélyezett és jóváhagyott, kőszabály, egyeztetést igénylő módosítások | kész; **0 / 115 gyűrű jóváhagyott** – a jóváhagyás a kezelőfelület „Jóváhagyás sorban” oldalán megy, gyűrűnként |
| Fokozatos jóváhagyás | nem jóváhagyott gyűrű: a katalógusban marad, a jelenlegi listaárral (csak alapváltozat) vagy „egyedi ajánlat”-tal, online beállítás nélkül; jóváhagyott gyűrű: beállítható, és számolt árat kap, de csak ha a felhasznált grammár, kőár és számítási szabály is jóváhagyott | kész, helyben tesztelve |
| Árajánlatkérés | a beállítás az ajánlatkéréssel együtt megy; saját ötlet | szerver módban a szerveren rögzül és a kezelőfelületen látszik; **e-mail-értesítés még nincs**; a saját ötlethez csatolt kép nem töltődik fel |

**Ami az első átadáshoz még el kell készüljön (fejlesztés):**

1. ~~A kezelőfelület bekötése a szerveroldali API-ra~~ – kész, helyben tesztelve.
2. Telepítés és kipróbálás a tényleges tárhelyen, mentési renddel.
3. Érdeklődés-értesítés (e-mail) – valódi tesztlevéllel, az ügyfél saját címére.
4. Adatkezelési tájékoztató, sütikezelés, impresszum a végleges adatokkal.
5. A régi oldal címeinek átirányítása, hogy a keresőből érkezők ne vesszenek el.
6. Átadás előtti teljes ellenőrzés a végleges, jóváhagyott adatokkal.

**Nem része (és nem is lesz az elsőnek):** webshop, kosár, bankkártyás fizetés, automatikus rendelés.

## B. Későbbi, külön fejlesztések

| Fejlesztés | Megjegyzés |
|---|---|
| Rhino-alapú 3D-megjelenítés | adatmodell előkészítve (`models3d`); folyamat: `docs/RHINO_3D.md`; valódi modell nélkül nincs kipróbálva |
| Fejlettebb parametrikus tervező | Grasshopper + Rhino.Compute; folyamatos szerverköltség, külön üzemeltetés |
| Rhino-fájl generálása a vásárló beállításából | a kapott fájl kiindulás, nem kész gyártási terv – ötvösi ellenőrzés kell |
| Összetettebb adminfunkciók | több felhasználó és jogosultság, tömeges szerkesztés, import/export, statisztika, időzített árváltozás |
| Egyéb | második oldal (a neve nincs eldöntve), idegen nyelv, időpontfoglalás naptárral, hírlevél |

## C. Mi kell az élesítéshez

Részletes, végrehajtható lista: **`TELEPITES.md`** (PHP/SQLite, jogosultságok, HTTPS, belépés, napi mentés
és kipróbált visszaállítás, érdeklődések, e-mail, jogi szövegek, átirányítások, SEO, mobiltesztek).
**Amíg nincs tárhely-hozzáférés, a rendszer nem élesítésre kész.**

### Hozzáférések

- Tárhely: szolgáltató, kezelőfelület vagy FTP/SSH, PHP-verzió, van-e SQLite/MySQL, HTTPS.
- Domain/DNS: ki kezeli a karikagyuru.com-ot, hol módosítható.
- A jelenlegi oldal fájljai és adatbázisa (mentéshez, átirányításokhoz). **A jelenlegi éles oldalhoz nem nyúltunk.**
- E-mail: melyik címre menjenek az érdeklődések, és honnan küldhet levelet az oldal.
- Ha van: Google Search Console / Analytics / cégprofil.

### Adatok az ügyféltől

- Eredeti, nagy felbontású termékfotók; műhely- és portréfotók.
- Modellenként a tényleges súly (54-es méretre) és a kőszabály (hány kő, mekkora).
- Mely modelleknél állítható a szélesség/vastagság, milyen határok között; mi igényel egyeztetést.
- Cégadatok az impresszumhoz, nyitvatartás, elérhetőségek, ÁSZF/adatkezelési szöveg.

### Hiányzó jóváhagyások és nyitott kérdések

- 18K és palládium eladási grammár (most bemutató érték).
- Titán: marad-e egyedi, munkaalapú ajánlat (most így van).
- 0,04 és 0,05 ct kő ára (most „egyedi árajánlat”); 0,005 és 0,10 ct bemutató érték.
- A 60-as méret példaára: a jegyzetben 442 000 Ft, a számítás 421 700 Ft – melyik a helyes?
- Kerekítés (most 100 Ft-ra felfelé, bemutató beállítás).
- Gravírozás: kínálja-e, és mennyiért. Foglalási díj: van-e.
- A tegeződő megszólítás és a szövegek; a kolléga/gyártó említése.
- Mind a 115 gyűrű szabálya (most 0 jóváhagyott).

A kezelőfelület „Jóváhagyásra vár” oldala tételesen mutatja a hiányzó jóváhagyásokat. Ez **előzetes
ellenőrzés a látványtervben**, nem élesítési engedély.
