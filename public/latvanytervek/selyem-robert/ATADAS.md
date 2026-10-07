# Selyem Róbert E.V. — átadási jegyzet

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/selyem-robert/
**Fájlok:** `index.html` (önálló, build nélkül) + `img/` (anyagminták, megosztási kép)

## Koncepció

Szlogen: **„Lapozzunk!”** (lap = burkolólap). Ez végigfut az oldalon: intró, hero cím, „Lapozzunk a galériába” gomb, a galéria „Lapozzunk →” gombja, a kapcsolat címe, a lábléc és a mobil hívássáv.

- Narancs a domináns szín, mellette sötét és krém.
- Rövid oldal, négy blokk: Hero, Galéria, Rólam (benne az előtte–utána csúszka), Kapcsolat.
- A hero csempefala lapozásszerűen fordul át a négy anyagon.
- A galéria négy kategóriára lapozható: Hidegburkolás, Melegburkolás, Térburkolat, Kőszőnyeg. Működik fülekkel, gombbal és mobilon húzással.

## Ellenőrizve

- Képernyőméretek: 320–1920 px. Nincs vízszintes görgetés, nincs JS-hiba, nincs dupla azonosító, nincs törött link.
- Működik: menü, galérialapozás (fül, gomb, húzás), csempefal-lapozás, előtte–utána csúszka (egér, érintés, billentyűzet).
- Csak hívás: nincs űrlap, nincs süti.

## Helyőrzők — Róberttől kérendő

| Hol | Mi kell | Hogyan cserélhető |
|---|---|---|
| Galéria | Kategóriánként 5 fotó (hideg, meleg, térburkolat, kőszőnyeg) | `CATS[].tex` tömb → a fájlnevek az `img/` mappában; a „Fotók hamarosan” jelzés törölhető |
| Előtte–utána | Egy képpár | `.ba-b` (előtte) / `.ba-a` (utána) háttere; a `.ba-soon` törölhető |

Az anyagminták (`img/*.webp`) programból rajzolt felületek, nem fotók és nem valódi munkák.

## Róberttel egyeztetendő

- **Kőszőnyeg:** az ügyfél üzenetében „törszönyeg” szerepelt, ezt kőszőnyegnek értelmeztük.
- **Kategórialeírások:** a négy egysoros leírás pontos-e.
- **Munkaterület:** „Kéthely és Somogy megye, máshol egyeztetéssel”.

## Élesítés saját domainen

1. A `noindex` meta sort törölni kell.
2. A `canonical`, az `og:url` és az `og:image` címét az új domainre kell írni.
3. Impresszum és adatkezelési tájékoztató az ügyfél adataival (adószám, székhely). Ezeket tőle kell bekérni.
4. Google Cégprofil a telefonszámmal és a weboldallal.
