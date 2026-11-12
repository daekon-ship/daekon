# Lizó Pizzéria – kutatási források (belső)

Ellenőrzés ideje: **2026-11-12, 12:05–12:20 (Budapest)**. Minden adat a publikus felületen ezekből jön.

| # | Forrás | Mit adott | Megjegyzés |
|---|--------|-----------|------------|
| F1 | https://lizopizza.hu/ | név, cím, telefon, nyitvatartás, kategóriák, app-linkek, ÁSZF/adatkezelés linkek | Falatozz.hu motorral futó oldal |
| F2 | https://lizopizza.hu/etlap | teljes tételek és 32 cm-es kezdőárak, minimum 3 000 Ft („kerületenként eltérhet”) | |
| F3 | https://falatozz.hu/rendeles/Budapest-XVIII./Lizo-Pizzeria-es-Etelbar/ | összetevők, 32 + 50 cm-es árak, kiszállítási idő 60–90 perc, online fizetési módok (bankkártya, SZÉP) | a „3 000 Ft” címke nélkül jelenik meg |
| F4 | https://falatozz.hu/rendeles/Gyal/Lizo-Pizzeria-es-Etelbar/ | ugyanaz az étlap Gyálra | szállítási terület bizonyítéka |
| F5 | falatozz.hu/rendeles/vecses/Lizo-Pizzeria-es-Etelbar/ (keresési találat) | Vecsés is szerepel | csak keresőtalálat, oldal nem volt megnyitva |
| F6 | Google Play: hu.lizopizza; App Store id6807824590 | saját rendelő app létezik (Falatozz) | |
| F7 | `lizo_attila_v2_vector_final.pdf` (ügyféltől) | eredeti vektoros logó (Illustrator 29.8, 2026-04-28) | → `img/lizo-logo.svg`, `img/lizo-logo-paper.svg` |

## Nem sikerült / nem elérhető

- **Wolt-adatlap:** a Wolt keresőben és a webes keresésben nem találtam „Lizó/Lizo” XVIII. kerületi adatlapot. Lehet, hogy nincs, vagy más néven fut → ügyféltől kérdezni.
- **Facebook / Instagram:** nyilvános oldal nem jött fel a keresésben; a lizopizza.hu nem linkel közösségi oldalt.
- **Google Cégprofil (értékelések):** nem kértem le; értékelést, csillagot a látványterv szándékosan nem mutat.
- **Ételfotók:** a lizopizza.hu-n nincs saját ételfotó. A Falatozz `introimage.png` / `ogimage.png` eredete és licence ismeretlen → nem használtam.
- A lizopizza.hu a munkakörnyezet hálózatáról közvetlenül (curl) nem volt elérhető, csak a webes lekérő eszközzel.

## Azonos nevű helyek – NEM ez az ügyfél

- „Liszo” (falatozz.hu/ettermek/liszo) – más étterem.
- Lizse (Városliget), Monalizza stb. – keresési zaj.
