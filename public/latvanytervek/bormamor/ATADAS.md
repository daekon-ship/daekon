# Bormámor Monor — látványterv, átadás

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/bormamor/
**Esemény-kártya minta (csak bemutatáshoz):** …/bormamor/?esemenyminta=1
**Régi verzió összehasonlításhoz (érintetlen):** https://daekon-ship.github.io/bormamor-monor/

Teljes újratervezés. A régi (Freebuff/Codebuff) oldalból csak adat és szöveg került át, dizájn, szerkezet és animáció nem.

## Koncepció — „A kulcs nálunk van”

Egyetlen, a márkából vett vizuális gondolat fut végig: a logó **kulcslyuka**, benne a **borospohárral**.
Minden logó-elem az ügyfél eredeti vektoros PDF-jéből (`client-assets/bomamor_logo_final.pdf`, Marcell Szűcs, 2020) lett kivágva — nincs újrarajzolt logó.

- A hero-ban a kulcslyuk ablak: mögötte egy kulcslyukas dugó fotója, a logó pohara pedig betöltéskor megtelik borral.
- A borstílusok képei ugyanabban a kulcslyuk-formában ülnek.
- A kulcs (a logó külön eleme) a „Kulcs a minőséghez” szekcióban görgetésre megrajzolódik.

## Designrendszer

| Szerep | Érték |
|---|---|
| Bordó (logó) | `#6B0F1A` |
| Mély must (hero, menü) | `#3B0C14` |
| Éjbordó (kóstolók, lábléc) | `#1E0A0F` |
| Kőszürke (logó) | `#BBB7B0` |
| Világos kő | `#E6E2DC` |
| Papír | `#F2EFEA` |
| Dugó (csak fókuszkeret) | `#C49A6C` |

Arany nincs — a „prémium” hatást a tipográfia és a logó-színek adják.

- **Címek:** Instrument Serif (OFL), mérsékelt méretek: H1 36→64 px, H2 30→46 px.
- **Szöveg:** Outfit (OFL) — geometrikus, rokon a logó Gotham-betűjével.
- Mindkettő helyben (`fonts/`), magyar ő/ű-vel ellenőrizve. Fraunces nincs.

## Animációk (GSAP 3.15 + ScrollTrigger, helyben)

1. **Kulcslyuk-belépő** — a kulcslyuk körvonala megrajzolódik, a fotó beúszik, a pohár megtelik (≈2 s, nem blokkol, a gombok azonnal kattinthatók).
2. **Címsor-feltárás** — a szekciócímek soronként emelkednek elő.
3. **Borstílus-váltás** — fülváltáskor az új kép alulról „feltöltődik” a kulcslyukban.
4. **Kulcs-rajzolás** — görgetéssel arányosan rajzolódik ki a kulcs.
5. **Maszkos képfeltárás** — történet-fotó oldalról, kóstoló-panoráma középről kinyílva, galéria- és csempeképek mind más irányból.
6. **Mikrointerakciók** — gombkitöltés balról, menü-aláhúzás, lightbox-képváltás, finom parallax (hero, Monor).

`prefers-reduced-motion` esetén minden statikus. JS nélkül minden tartalom látszik.

## Felhasznált képek (`img/`)

Kizárólag az ügyfél `client-assets` mappájából, a beégetett feliratok kivágásával:

| Fájl | Forrás | Hol |
|---|---|---|
| `dugo-kulcslyuk.webp` | elemek-08 | hero kulcslyuk |
| `pohar-feher/rose/siller/voros.webp` | elemek-05 (a négy pohár egyenként) | borstílusok |
| `poharak(-m).webp` | elemek-05 | kóstolók, galéria |
| `palack-kez(-m, -allo).webp` | elemek-07 | Kulcs a minőséghez, galéria |
| `dugok.webp`, `dugok-bal.webp` | elemek-06 | Több mint bor, galéria |
| `palackok-felulrol.webp` | FB_IMG_1581839014017 | Több mint bor, galéria |
| `dugohuzo(-m).webp`, `kulcslyuk-dugok(-m).webp` | elemek-08, elemek-10 | galéria |

Nincs stock-, nincs generált kép, nincs kitalált címke.

## Ellenőrizendő az ügyféllel — publikálás előtt

1. **Nyitvatartás:** péntek 10–18, szombat 9–14 (más napra nincs adat — az oldal ezt írja: „Más napokon telefonon érdeklődj”).
2. **Képjogok:** az arculati fotók (dugók, poharak, kéz+palack) a grafikus kompozíciói — tisztázandó, hogy a háttérfotók licence webre is szól-e.
3. **Kulcslyukas dugó és címkés palack:** valódi termék vagy csak arculati látványterv? (A felirat óvatosan „a Bormámor arculatából”.)
4. **Programtípusok:** borkóstoló, pálinka-, whisky-, pezsgőkóstoló, sörvacsora, gasztroest — a régi, ügyfél által jóváhagyott szövegből. A **csoportos (céges, baráti) program** új elem, megerősítendő.
5. **Monor szekció:** „Strázsahegy pincesorai” — helyi névhasználat megerősítendő.
6. **Lénárd László neve** a szövegben aláírásként szerepel — hozzájárulás kell.
7. **Adatkezelési tájékoztató** szövege hiányzik (a lábléc jelzi).
8. **Alkoholos termékek:** a lábléc 18+ és felelős fogyasztás mondata maradjon; reklám- és fogyasztóvédelmi átnézés javasolt.
9. Ügyfél korábban kivetette a galériát a régi oldalról (V9). Az új brief kéri — dönteni kell, maradjon-e.

## Mi hiányzik / mi demó

- **Facebook-fotók és események:** a Facebook-oldal ebből a környezetből nem volt elérhető, így **egyetlen FB-fotó vagy esemény sem került be**. Az eseménylista ezért az igényes üres állapotot mutatja. Nincs kitalált esemény.
- **Bolt-, kóstoló- és pincefalu-fotó nincs** az anyagok között — ezek a szekciók most tipográfiával és a logóval állnak meg; ha jönnek fotók, a helyük kész (`js/adatok.js`, galéria és esemény `kep` mező).
- **Jelentkezési űrlap:** valódi mezőellenőrzés, spamcsapda, dupla-beküldés-figyelés, de **beküldéskor e-mail-piszkozatot nyit** (mailto). Ez az oldalon is jelölve van. Nincs automatikus visszaigazolás.
- **Asztalfoglalás:** szándékosan nincs (nincs igazolt szolgáltatás).
- **Webshop / online rendelés:** szándékosan nincs.

### A valódi jelentkezéshez kell (javaslat)

GitHub Pages statikus, ezért a háttér külön szolgáltatás legyen:
- Űrlap → szerverless függvény (pl. Cloudflare Worker vagy Netlify Function) → tranzakciós e-mail (pl. Postmark/Resend): értesítés a boltnak + visszaigazolás a jelentkezőnek.
- Adattárolás EU-s régióban (pl. Supabase EU), duplikátum-szűrés e-mail+esemény kulcson, rate limit, captcha (Turnstile).
- **Admin:** külön, hitelesített felület (Supabase Auth vagy Cloudflare Access): esemény felvétele/módosítása/törlése/lezárása, fotófeltöltés, jelentkezők listája és CSV-export. Jelszó, kulcs vagy személyes adat a statikus oldalon **nem** tárolható.
- Addig az események kézzel frissíthetők a `js/adatok.js` fájlban (a formátum a fájl elején le van írva; a múltbeli dátumú események automatikusan archívumba kerülnek).

## Mért eredmények (2026-10-09)

**Szélesség-mátrix** (Chromium, Playwright): 320, 360, 375, 390, 412, 430, 768, 1024, 1440, 1920 px —
mind a 10 szélességen **0 vízszintes túllógás**, 0 konzolhiba, 0 sikertelen kérés. Minden kattintható elem ≥ 44 px, kivéve az adatkezelési jelölőnégyzet (24×24 px, a teljes címke kattintható — WCAG 2.5.8 szerint megfelel).

**Teljesítmény** (helyi szerver, saját mérés PerformanceObserverrel — nem Lighthouse):
- Mobil, 4× CPU-lassítás, ~1,6 Mbps, 150 ms RTT: FCP 0,84 s, **LCP 1,44 s**, **CLS 0**.
- Desktop: LCP < 0,1 s, CLS 0.
- Teljes oldal: kód ~216 KB (tömörítetlen, ebből GSAP ~110 KB), képek 644 KB (WebP, lusta betöltés), fontok 128 KB.

**Lighthouse-pontszám nincs mérve** — ebben a környezetben a Lighthouse nem volt telepíthető. Publikálás után a PageSpeed Insights-szal mérendő.

**Funkciótesztek:** fülváltás (egér + nyilak), mobilmenü (Esc, fókuszcsapda), űrlap hibaüzenetek és sikeres ág, lightbox (nyilak, Esc, swipe), térkép kattintásra töltése, esemény-archívum múltbeli dátummal, csökkentett mozgás — mind lefutott.

## Mobil-audit javítások (2. kör, 2026-10-09)

Telefon-emulációval (érintés, 2× pixelsűrűség), képernyőnként görgetve átnézve 320, 390 és 768 px-en:
- **Galéria:** a képek többé nem vágódnak álló formára — hármas sorokban, saját arányukban állnak (asztalon), mobilon egymás alatt teljes képpel.
- **Kóstoló-panoráma:** mobilon külön, közelebbi vágás (`poharak-kozel.webp`), nincs rácsúszó cím, nincs görgetéshez kötött vágás.
- **Fejléc:** görgetéskor azonnal tömör háttért kap, a hero szövege nem látszik át alatta.
- **Gyorssáv (Hívás/Útvonal):** lefelé görgetéskor elbújik, az űrlapnál, a kapcsolatnál, a láblécnél és gépelés közben nem jelenik meg.
- **Több mint bor:** 380 px alatt a fotócsempék kerete megszűnt (belső margó hiba), 370 px alatt egyoszlopos.
- **Tablet (641–860 px):** a hero kétoszlopos maradt, a kulcslyuk a szöveg mellett áll.
- Parallax csak 861 px fölött.

## Fájlok

```
index.html        oldal (inline SVG logó-szimbólumokkal)
bormamor.css      design system + layout
bormamor.js       interakciók, animációk
js/adatok.js      ESEMÉNYEK, BORSTÍLUSOK, GALÉRIA — itt frissíthető
js/gsap.min.js, js/ScrollTrigger.min.js
fonts/            Instrument Serif, Outfit (WOFF, latin + latin-ext) + OFL licencek
img/              WebP képek, favicon.svg, og.jpg
```
