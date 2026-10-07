# Mester+ – Fejlesztési terv (M2–M11)

Állapot: **javaslat, jóváhagyásra vár.** Minden mérföldkő külön jóváhagyással indul.
Alapelvek, amelyek minden mérföldkőre érvényesek:
- offline-first;
- egész forint, és egyetlen számítási forrás;
- az app nem talál ki árat;
- prémium, visszafogott megjelenés.

## Ahol most tartunk (v0.2)

**Kész:**
- ügyfél → projekt → felmérés → tételek → saját árazás → kalkuláció → ajánlat;
- PDF ajánlat, megosztás, nyomtatás;
- projekt másolása, keresés;
- biztonsági mentés és visszaállítás.

**Kockázat:** a fordítás és a kódgenerálás még nincs igazolva egy valódi gépen. Ez az M2 előfeltétele.

---

## M2 – Anyagszükséglet és anyaglista (burkoló/kőműves fókusz)

A szaki legnagyobb időnyelője, és az ajánlat pontosságának kulcsa.
- Burkolásnál:
  - lapméret és vágási ráhagyás (%, mintánként, pl. egyenes 5%, átlós 15%);
  - a doboz-mennyiség felfelé kerekítve.
- Ragasztó, fuga, alapozó és vízszigetelés fogyása a **szaki által megadott** normákkal (kg/m²). Gyári adatot nem találunk ki.
- Projekt-szintű anyaglista: mennyiség, kiszerelés, a saját beszerzési ár (ha megadta).
  Exportálható PDF-be és szövegbe, a vásárláshoz.
- **Döntés kell:** induljon-e az app néhány „üres” normasablonnal (megnevezés + mértékegység, érték nélkül), ugyanúgy, mint az árlista?

## M3 – Fotók és jegyzetek a felméréshez

- Helyiségenként fotók (kamera / galéria), a készüléken tárolva, tömörítve.
- Fotó csatolása az ajánlat PDF-jéhez (opcionális melléklet-oldal).
- A biztonsági mentés kiterjesztése a fotókra (ZIP formátum).

## M4 – Elfogadott munka kezelése

- Kezdés és várható befejezés dátuma, egyszerű naptárnézet a munkákról.
- Előleg és részfizetések nyilvántartása (nem számla!), a kintlévőség az Áttekintésen.
- Munkanapló: napi bejegyzés, fotó, ledolgozott óra.
- Pótmunka: külön tételcsoport az eredeti ajánlat mellett, saját összesítővel.

## M5 – Ügyfélkommunikáció

- Ajánlat-szövegsablonok (kísérő üzenet e-mailhez / Viberhez).
- Emlékeztető a lejáró ajánlatokra (helyi értesítés, internet nélkül).
- Ajánlat-verziók: módosítás után új verzió (MP-2026-003/2), a régi megmarad.

## M6 – Felhő-szinkron és automatikus mentés

- **Döntés kell:** Supabase vagy saját NestJS backend.
  Szempontok: üzemeltetési teher, költség, GDPR (EU-s adattárolás), offline-ütközéskezelés.
- Automatikus, titkosított mentés. Több eszköz (telefon + tablet) szinkronban.
- Addig a v0.2-es kézi mentés a védelem.

## M7 – Számlázó-integráció

- Saját számlázót **nem** készítünk (NAV-megfelelés, felelősség).
  Helyette integráció egy meglévő számlázóval (pl. Számlázz.hu vagy Billingo API).
- Az elfogadott ajánlatból egy gombnyomással számla-piszkozat készül.
- **Döntés kell:** melyik számlázót használod te és a célközönség.

## M8 – Statisztika

- Nyerési arány, átlagos ajánlati érték, átlagos m²-ár szakmánként és időszakonként.
- Csak a saját adataidból számol, nincs külső „piaci ár”.

## M9 – Brigád / több felhasználó

- Szerepkörök (tulajdonos, munkavezető), megosztott ügyfél- és projektlista.
- Előfeltétele az M6 backend.

## M10 – Előfizetés

- **Döntés kell:** fizetési szolgáltató (Stripe, Barion vagy áruházi előfizetés) és a csomagok.

## M11 – Áruház-kiadás

- Google Play és App Store: ikon, áruházi képek, adatvédelmi nyilatkozat, onboarding.
- Béta-tesztelés néhány valódi szakival kiadás előtt.

---

## Javasolt sorrend és indoklás

1. **M2 (anyagszükséglet).** Közvetlenül pontosabbá és gyorsabbá teszi az ajánlatot, backend nélkül.
2. **M4 (elfogadott munka).** Az ajánlat utáni folyamat nélkül az app csak félig hasznos.
3. **M3 (fotók).** Kicsi, de a felmérésnél azonnal érezhető.
4. **M6 (felhő).** Az M6–M10 a backend-döntésen múlik, ezért azt érdemes időben meghozni.

## Nyitott döntések összesítve

| # | Döntés | Mikorra kell |
|---|---|---|
| 1 | Normasablonok az anyagszükséglethez (üres, ár/érték nélkül)? | M2 előtt |
| 2 | Backend: Supabase vs. saját NestJS | M6 előtt |
| 3 | Számlázó: Számlázz.hu / Billingo / más | M7 előtt |
| 4 | Fizetési szolgáltató és csomagok | M10 előtt |
