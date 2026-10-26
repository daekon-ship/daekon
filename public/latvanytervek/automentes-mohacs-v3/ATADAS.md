# Non-Stop Autómentés Mohács – V3 látványterv, átadás

Ügyfél: **Non-Stop Autómentés – Bősze Márió**, Mohács · jelenlegi oldal: https://automentesmohacs.hu/
Előző DAEKON-változat (érintetlen): `../automentes-mohacs/` · SEO-terv: `SEO-TERV.md`
Statikus, build nélküli oldal: `index.html` (a `index.src.html`-ből generálva, lásd lent), `css/v3.css`, `js/v3.js`, `js/vendor/` (Motion), `fonts/`, `assets/`. `noindex`.

## 1. Koncepció: „Mentősárga éjszaka”

A cég valódi flottája sárga, piros-fehér hátsó jelöléssel (a saját galéria alapján: platós Mercedes autómentő, sárga MAN mentő-teherautó, munkagép-szállító). A V3 ezt a valós arculatot viszi tovább sötét, filmes grafit alapon: mentősárga (#F5C518) a hívás és a kiemelések színe, a piros-fehér csík csak elválasztóként jelenik meg (hero alja, kapcsolat-sáv, „Amíg odaérünk” keret).

| | Szín | Használat |
|---|---|---|
| Grafit | `#101318` / `#161B22` | alap, váltakozó szekciók |
| Sötétszürke | `#1C222B` / `#242C37` | kártyák, panelek |
| Mentősárga | `#F5C518` | hívógombok, kiemelés, kapcsolat-szekció |
| Kékesszürke | `#8A96A6`, szöveg `#B3BCC8` / `#8E99A8` | másodlagos szöveg |
| Jelzőpiros | `#D7262E` | csak a piros-fehér csíkban |

Betűk (helyben, woff): Archivo változó, szűkítve (címek, 72–86 %), IBM Plex Sans (szöveg), IBM Plex Mono (címkék). Méretek: H1 34–60 px, H2 27–40 px, törzs 16,5 px – mobilon sincs túlméretezett betű. Kontraszt: minden szövegpár ≥ 4,9:1.

## 2. Szerkezet

Hero (főcím, alcím, „Autómentő hívása” + „Szolgáltatásaink megtekintése”, valós fotó, 4 tény) → Szolgáltatások (6 kártya, 5 saját fotóval + autópálya-illusztráció) → Miért minket? (6 pont) → Rólunk (Bősze Márió) → A mentés menete (3 lépés, görgetésre haladó sáv, helymegosztás, „Amíg odaérünk”) → Működési terület (sematikus térkép) → Galéria (10 saját fotó, aszimmetrikus rács, nagyító) → GYIK → Kapcsolat → Lábléc. Mobilon rögzített hívássáv + helymegosztó gomb.

**Mobil első képernyő:** 360×740-en a hívógomb alja 403 px-nél van – a szolgáltatás, a telefonszám és a hívás görgetés nélkül látszik (375×667-en is).

## 3. Mozgás – Motion (motion.dev)

- **Hero belépése: CSS** (szöveg lépcsőzetesen, fotón lassú ráközelítés) – nem vár JavaScriptre, így nem rontja az LCP-t.
- **Motion 11.18.2** (helyben: `js/vendor/motion-11.18.2.min.js`, MIT): **lusta betöltés** az első görgetésnél, érintésnél vagy billentyűnél – a kezdeti betöltést nem terheli. Ezt hajtja:
  - szekcióelemek rugós beúszása (`inView` + spring), csak a még nem látott elemeknél;
  - „A mentés menete” sáv és a kis mentő a görgetéssel halad (`scroll`), mobilon függőlegesen;
  - térkép: M6/M60 kirajzolódik, Mohács tűje rugósan leesik;
  - mobil hívássáv rugós ki-be; gombok nyomásra „besüllyednek”; mobilmenü lépcsőzetes nyitás; GYIK-válasz becsúszik; nagyító rugós lapozás.
- Nincs preloader, nincs parallax, nincs 3D. A hívógombot semmi nem takarja (a hívássáv a Kapcsolat szekciónál eltűnik). `prefers-reduced-motion` esetén nincs animáció; Motion nélkül minden tartalom azonnal látszik.

## 4. Valós adatok és képek

Ellenőrzött (jelenlegi oldal): név, telefon, e-mail, Mohács / Baranya, 0–24 ünnepnap is, M6 / M60, belföld és külföld, személyautó / kisteher / motor, teherautó / munkagép / konténer 15 t-ig, családi vállalkozás, rakománybiztosítás. Facebook-bemutatkozás: „…autómentő szolgáltatás rakomány biztosítással 15t-ig”.

Képek: a jelenlegi galéria 10 saját fotója, az ügyfél domainjéről betöltve (`automentesmohacs.hu/galeria/Image01–10.webp`), leíró alt szövegekkel. Hero: `Image09` (sárga MAN mentő-teherautó, 158 KB). Ha egy kép nem tölthető be, a hero csíkos alapra, a galéria Facebook-hivatkozásra vált.

## 5. Ügyféllel egyeztetendő

1. **2015-ös indulás** – a jelenlegi Rólunk oldal állítja; megerősítendő.
2. A régi oldalon szereplő „10 év tapasztalat” és „több ezer mentés” **nem került** a V3-ba – ha az ügyfél megerősíti, beírható.
3. A konténerszállítás jelenleg is vállalt-e (a régi oldal szerint igen, ezért szerepel).
4. Pontos kiszállási körzet, külföldi célországok.
5. Engedély a saját fotók végleges használatára; jobb minőségű eredetik (különösen éjszakai, filmes hero-kép); portré Bősze Máriról, ha szeretné.
6. Google Cégprofil: ha vannak valós értékelések, beépíthetők (a Facebookon jelenleg 0 értékelés van).
7. Impresszum- és adatkezelési adatok (cégforma, székhely, adószám) – ezek nélkül szándékosan nincs jogi oldal.

## 6. Mérések (Playwright, Chromium)

| Teszt | Eredmény |
|---|---|
| Szélességek: 360, 375, 390, 430, 768, 1024, 1440, 1920 px | vízszintes görgetés 0, kilógó szöveg 0, konzolhiba 0 |
| Linkek | 12 db `tel:+36202590264`, 2 db `mailto:`, minden horgony él, külső: Facebook, daekon.hu |
| Akadálymentesség | 1 H1, nincs kihagyott címszint, minden képnek van alt, minden gombnak/linknek van neve, nincs duplikált id, billentyűzettel kezelhető menü és nagyító (Esc, nyilak, fókuszcsapda, fókusz vissza) |
| Érintési célok | mobilon minden link/gomb ≥ 40 px magas |
| Helymegosztás | engedéllyel: koordináta + SMS / térkép / másolás; elutasításnál érthető üzenet + hívás |
| Motion | lusta betöltés működik; tartalék (Motion nélkül) és csökkentett mozgás: minden elem látszik |
| Teljesítmény, mobil (4× CPU, Slow 4G, a hero helyett azonos méretű helyi kép) | FCP ≈ 1,1–1,2 s, LCP ≈ 1,1–1,2 s*, CLS 0, TBT ≈ 130–350 ms (szórás) |
| Teljesítmény, asztali | FCP ≈ 0,2 s, LCP ≈ 0,3 s, CLS 0,003, TBT ≈ 0–60 ms |

\* A helyi kép a hálózati lassítást megkerüli, ezért a valós LCP lassú 4G-n várhatóan 2–2,5 s. Lighthouse-t a sandboxban nem lehetett telepíteni; a pontos pontszám a publikált oldalon mérendő (PageSpeed Insights).

## 7. Fejlesztői jegyzet

- `index.html` generált: `sh build.sh` beilleszti a logójelet és a GYIK-ből a `FAQPage` JSON-LD-t az `index.src.html`-be. Kézi szerkesztés az `index.src.html`-ben.
- Logó: a végleges „Villogó 24” jel, a flotta sárgájához igazítva (#F5C518).
- Élesítéshez: SEO-TERV.md (URL-ek megtartása, képek újraexportálása AVIF/WebP/JPEG-re, `srcset`), noindex levétele, canonical az éles URL-ekre.
