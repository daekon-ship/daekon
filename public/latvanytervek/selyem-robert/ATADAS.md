# Selyem Róbert E.V. — átadási jegyzet

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/selyem-robert/
**Fájlok:** `index.html` (önálló, build nélkül) + `img/` (anyagminták, megosztási kép)

## Ellenőrizve (2026. október)

- Képernyőméretek: 320, 390, 768, 1024, 1280, 1440, 1920 px. Nincs vízszintes görgetés, nincs JS-hiba, nincs dupla azonosító, nincs törött belső link.
- Működik: mobilmenü, burkolat-tervező (4 kiosztás × 5 anyag), előtte–utána csúszka (egérrel, érintéssel, billentyűzettel), GYIK lenyitás, alsó hívássáv mobilon.
- Linkek: `tel:+36202211366`, `mailto:apafoni@gmail.com`, „Készítette: DAEKON” → https://daekon.hu (új lapon).
- SEO: title, description, Open Graph + megosztási kép (`img/og.jpg`), favicon, LocalBusiness + Service + FAQPage strukturált adat.
- Csak hívás: nincs űrlap, nincs süti, nincs követőkód.

## Ami valós adat

Név, vállalkozási forma, Kéthely / Somogy megye, telefonszám, e-mail, szolgáltatások listája. Semmi más nincs kitalálva: nincs vélemény, statisztika, évszám, ár vagy helyszín.

## Helyőrzők — Róberttől kérendő

| Hol | Mi kell | Hogyan cserélhető |
|---|---|---|
| Referenciák (2 projekt) | Valódi munkafotók; a projektcímek („Fürdőszoba…”, „Konyha és nappali…”) a valódi munkákhoz igazítandók | `PROJECTS` tömb: `src:"img/…"`; a `type`, `scope`, `location` mezők |
| Előtte–utána | Egy képpár ugyanarról a helyről | `.ba-before` / `.ba-after` elemen `data-src="img/…"` |
| Rólam | Portréfotó | `.ab-ph` elemen `data-src="img/…"` |
| Munka közben (6 kép) | Részletfotók (anyag, kiosztás, vágás, szintezés, fuga, kész felület) | `CRAFT` tömb (képnél a rajz automatikusan eltűnik) |
| Szolgáltatás-előnézet | Opcionális fotók | `SERVICES` tömb |

Képformátum: WebP vagy AVIF, hosszabbik oldal max. 1600 px.

## Róberttel átnézendő szövegek

- **„Amire figyelek”** (4 pont) és a **GYIK** válaszai: az ő munkamódszerét írják le, tőle kell jóváhagyás.
- **„Parketta”** szolgáltatás: maradjon-e a listában.
- **Munkaterület:** „Somogy megye, más helyszín egyeztetéssel”, ez így pontos-e.

## Élesítés saját domainen

1. A `<meta name="robots" content="noindex">` sort törölni kell (most azért van bent, mert ez a DAEKON címén futó előnézet).
2. A `canonical`, az `og:url` és az `og:image` címét át kell írni az új domainre.
3. Impresszum és adatkezelési tájékoztató az ügyfél adataival (adószám, székhely). Ezek nincsenek kitalálva, Róberttől kell bekérni.
4. Google Cégprofil a telefonszámmal és a weboldallal.
5. Opcionálisan a betűtípusok saját tárhelyről (Inter Tight + Inter, OFL licenc) a Google Fonts helyett.
