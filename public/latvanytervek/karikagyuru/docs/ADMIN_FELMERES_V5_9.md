# Kezelőfelület – felmérés és átalakítás (V5.9, 2026. 11. 24.)

## A régi admin (V5.8.1) oldalanként

Jelmagyarázat: N = naponta, R = ritkán, S = soha (fejlesztői).

| Régi oldal | Mire szolgált / mit módosított | Kell az ötvösnek? | Gyakoriság | Ismétlődés | Veszélyes véletlenül? | Érthető név? | Látszott a mentés? | Hatás a vásárlói oldalra | Becsült/jóvá nem hagyott adat | Új helye (V5.9) |
|---|---|---|---|---|---|---|---|---|---|---|
| Főmenü | 10 csempe, nyitott kérdések, 25 kérdéses központ, árnapló, aranyár-grafikon | igen, de egyszerűbben | N | minden más oldal tartalmát ismételte | nem | igen | – | nincs | „Tisztázandó” lista, 0/115 jóváhagyás | **Áttekintés**: 4 teendő + 3 legutóbbi érdeklődés |
| Árak | grammár, 24K/Pt/Pd/Ti alapanyagár, gyémántok, grafikon, %-gombok | igen | N | Árszámítás, Jóváhagyásra vár | igen (minden ár) | félig („árverzió”, „referenciaár”) | szerver módban csak „folyamatban” | minden jóváhagyott ár | demo/példa jelölések | **Árak → Árak módosítása**: 4 grammár + gyémántok; a beszerzési ár és a grafikon lenyitható |
| Gyűrűk | lista, keresés, szűrés, árlista nyomtatás/CSV | igen | N | Szabályok, Fotók | nem | igen | – | – | a listaár mellett a nem jóváhagyott belső ár „ár”-ként | **Gyűrűk → Gyűrűk listája**: weboldalon látható ár és belső számítás külön |
| Gyűrű szerkesztése | 40+ mező egy oldalon, 3D-mezők | igen | N | Szabályok, Jóváhagyás sorban | igen (szakmai adatok) | félig | igen | jóváhagyás után | becsült tömeg, fotóról becsült kőszabály | egyszerű nézet + „Részletes gyűrűbeállítások”; 3D csak fejlesztői nézetben |
| Fotók | képcsere rácsban, betöltés-ellenőrzés | igen | R | Gyűrű szerkesztése | nem | igen | csak toast | azonnali | – | **Gyűrűk → Fotók kezelése** + fénykép cseréje a gyűrű adatlapján |
| Műhelymunkák | egyedi munkák fotókkal | igen | R | – | törlés megerősítéssel | igen | igen | látható munka | – | **Műhelymunkák** (változatlan) |
| Szabályok | gyűrűnként mit állíthat a vásárló (lista) | a szerkesztőben | R | Gyűrű szerkesztése | nem | félig | – | – | jóváhagyási állapot | megszűnt külön oldalként → a gyűrű szerkesztőjében |
| Érdeklődések | kérések, „Visszahívtam”, ár rögzítése = „elfogadva” | igen | N | – | törlés | igen | igen | – | **nem jóváhagyott belső ár rögzíthető volt ajánlatként** (gyors árszámításból) | **Érdeklődések**: 4 csoport, Felhívom / Visszahívtam / Lezárás; az ajánlati ár külön, csak jóváhagyott árból |
| Ügyféljóváhagyások | 25 fejlesztési kérdés | nem | S | – | nem | nem (fejlesztői) | igen | nincs | – | **fejlesztői nyilvántartás**: menüből, áttekintésből és a tulajdonosi API-ból kivéve; parancssorból |
| Jóváhagyás sorban | gyűrűnkénti szakmai jóváhagyás | igen | R | Gyűrű szerkesztése | igen | igen | igen | jóváhagyás után ár | becslések | **Gyűrűk → Adatok ellenőrzése** |
| Árszámítás | telefonos ár, „Felírom ajánlatnak” | igen | R | – | **igen: jóváhagyatlan árat rögzített** | igen | igen | – | belső ár „Ár”-ként | **Árak → Ár kipróbálása**: látható és belső ár külön, csak jóváhagyott ár rögzíthető |
| Felárak és munkadíjak | árszámítási mód, díjak, tömegarány, kerekítés | ritkán | R | Beállítások (kerekítés) | **igen (minden ár)** | nem („felár”, „költségalapú mód”) | toast | minden ár | demo jelölések | **Beállítások → Haladó árképzés** (magyarázatokkal) |
| Árváltozások naplója | minden változás, visszaállítás | igen | R | Árak (verziók) | visszaállítás megerősítéssel | félig | toast | minden ár | – | **Árak → Korábbi árak**: visszaállítás előtt a pontos következmény |
| Jóváhagyásra vár | árelemek jóváhagyása, „Élesítésre kész” gomb, nyitott kérdések | ritkán | R | Árak | jóváhagyás | nem | toast | jóváhagyott elem | mind | **Beállítások → Árelemek jóváhagyása** (élesítési gomb nélkül); a grammár jóváhagyása az Árak oldalon is |
| Beállítások | kerekítés, árrés, nagy változás, e-mail, **Alapállapot visszaállítása** | ritkán | R | Felárak | **igen: teljes adatállapot törlése** | félig | toast | minden adat | – | **Beállítások**: csak a figyelmeztetési határ, e-mail-állapot, adattárolás; a teljes visszaállítás nem tulajdonosi művelet |

## A legnagyobb problémák

1. **Túl sok belépési pont:** 14 menüpont, és ugyanaz a feladat 2–3 helyen.
2. **A háromféle ár összemosódott.** A belső számított ár „Ár”-ként jelent meg, és a gyors árszámításból jóváhagyatlan összeg rögzülhetett ajánlati árként.
3. **Veszélyes gomb a hétköznapi beállítások között:** az „Alapállapot visszaállítása” szerver módban mindent felülírt volna. Ezt a szerver sem tiltotta.
4. **Fejlesztői tartalom az ügyfél kezdőképernyőjén:** 25 kérdés, „Tisztázandó” lista, élesítési ellenőrzés.

## Új felépítés

```
Áttekintés
Gyűrűk        – Gyűrűk listája · Adatok ellenőrzése · Fotók kezelése · (gyűrű adatlapja: egyszerű + részletes nézet, fénykép cseréje)
Árak          – Árak módosítása · Ár kipróbálása · Korábbi árak · Árlista (vásárlóknak / belső)
Műhelymunkák
Érdeklődések  – Új · Visszahívásra várnak · Már felkeresett · Lezárt
Beállítások   – Általános · Haladó árképzés · Árelemek jóváhagyása
```

A régi címek (`#/admin/alapanyag`, `sorban`, `keplet`, `elozmenyek`, `jovahagyas`, `arszamitas`, `szabalyok`, `fotok`) az új helyükre irányítanak, de **csak a belépés ellenőrzése után** (teszt: `admin_v59_e2e.py`, 19 cím).

Csak fejlesztőnek, a tulajdonosi felületen nincs:
- 25 kérdés → `bin/fejlesztoi-dontesek.php`;
- teljes állapot-visszaállítás → `POST /revert` csak `KG_FEJLESZTOI_VISSZAALLITAS=1`-gyel;
- bemutató visszaállítása → `bin/demo-reset.php`;
- 3D-mezők és a böngészős bemutató visszaállítása → helyi fejlesztői nézet (`#/admin/fejleszto`, nem biztonsági határ).
