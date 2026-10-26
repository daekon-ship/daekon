# Non-Stop Autómentés Mohács – SEO-állapot és átállási terv (V3)

## 1. A jelenlegi oldal (automentesmohacs.hu) – mért állapot, 2026.10.26.

| Elem | Állapot | Teendő élesítéskor |
|---|---|---|
| Title | „Non-Stop Autómentés - Mohács \| 0-24 Autómentő Szolgáltatás” – minden aloldalon ugyanaz | Aloldalanként egyedi title |
| Meta description | „Gyors, megbízható autómentés Mohácson és környékén. Non-stop elérhetőség, 10 év tapasztalat…” – szintén közös | Aloldalanként egyedi |
| H1 | Két H1 egy oldalon (pl. „Non-Stop Autómentés” + „Galéria”) | Oldalanként egy H1 |
| Canonical | nincs | Önhivatkozó canonical minden oldalon |
| Open Graph | nincs | og:title / description / image / url |
| Strukturált adat | nincs | `AutomotiveBusiness` + `FAQPage` (a V3-ban kész minta) |
| Képek alt szövege | „Galéria kép 1…10” | Leíró alt (a V3-ban kész) |
| Képméret | Image01.webp 4080×3072 px, 1,2 MB | Újraexportálás, lásd 4. pont |
| Vélemények | 3 név szerinti ajánlás, forrás nélkül | Csak ellenőrizhető vélemény; a Facebook-oldalon jelenleg 0 értékelés |
| robots.txt, sitemap.xml | Innen nem volt lekérhető | Élesítés előtt ellenőrizni; sitemap az összes aloldallal |

Jelenlegi URL-ek: `/`, `/szolgaltatasok`, `/galeria`, `/rolunk`, `/kapcsolat`.

## 2. A V3 bemutató SEO-jelölése

- `noindex, nofollow` – a bemutató nem versenyez az ügyfél domainjével.
- `canonical` → `https://automentesmohacs.hu/` (a bemutató az eredetit jelöli meg).
- Egy H1 („Elakadtál? Mi indulunk.”), szekciónként H2, kártyánként H3.
- JSON-LD: `AutomotiveBusiness` (név, telefon, e-mail, Mohács / Baranya, 0–24 nyitvatartás, kiszolgált terület: Mohács, Baranya, M6, M60, alapító, Facebook), valamint `FAQPage` a GYIK-ből.
- Open Graph-címkék, leíró alt szövegek, magyar `lang`.
- Célkifejezések természetes szövegben, halmozás nélkül: autómentés Mohács, autómentő Mohács, non-stop autómentés Mohács, autómentés M6 / M60, baleseti mentés Mohács, járműszállítás Mohács.

## 3. URL-megőrzés és 301-es terv (élesítéshez)

**Javaslat: minden meglévő URL marad, így nem kell átirányítás.** A V3 kezdőoldala a `/` helyére kerül, a régi aloldalak tartalmilag bővített, önálló oldalak maradnak:

| Régi URL | Új cél | Átirányítás |
|---|---|---|
| `/` | V3 kezdőoldal | – |
| `/szolgaltatasok` | Szolgáltatások áttekintő oldal (a V3 kártyáiból) | – |
| `/galeria` | Galéria oldal (a V3 rácsa + nagyító) | – |
| `/rolunk` | Rólunk oldal | – |
| `/kapcsolat` | Kapcsolat oldal (hívás, e-mail, helymegosztás) | – |

Opcionális, külön kulcsszavakra célzott új aloldalak: `/autopalya-mentes-m6-m60`, `/baleseti-mentes-mohacs`, `/teherauto-munkagep-szallitas`, `/jarmuszallitas-belfold-kulfold`.

Ha az ügyfél mégis egyoldalas szerkezetet kér: `301 /szolgaltatasok → /`, `301 /galeria → /`, `301 /rolunk → /`, `301 /kapcsolat → /` (a #horgony nem adható át átirányításban). Ez SEO-szempontból gyengébb, ezért nem javasolt.

## 4. Képek élesítéshez

A sandboxból az ügyfél képei nem tölthetők le, ezért a bemutató az eredeti WebP-ket tölti be a saját domainjéről, lusta betöltéssel. Élesítéskor:
- hero: `Image09` → 640 / 1080 / 1600 px, AVIF + WebP + JPEG fallback, `srcset` + `sizes`;
- kártyák: 480 / 800 px; galéria: 600 / 1200 px; a nagyító az 1600 px-es változatot kapja;
- `Image01` (1,2 MB) kötelezően újraexportálandó (~150–250 KB).
