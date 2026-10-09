# Bormámor Monor — látványterv, átadás

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/bormamor/
**Esemény-kártya minta (csak bemutatáshoz):** …/bormamor/?esemenyminta=1
**Régi verzió összehasonlításhoz (érintetlen):** https://daekon-ship.github.io/bormamor-monor/

Teljes újratervezés. A régi (Freebuff/Codebuff) oldalból csak adat és szöveg került át, dizájn, szerkezet és animáció nem.

## Koncepció — 5. változat: sötét, filmszerű („A kulcs nálunk van”)

Az ügyfél választása alapján: sötét vászon, teljes képernyős jelenetek görgetésre, kevés szöveg, filmszemcse. Minden logó-elem az eredeti PDF-vektorokból.

1. **Nyitójelenet (rögzítve görgetés közben):** fekete képernyő, a logó kulcslyuka. Mögötte a fotó úgy áll, hogy a palack címkéjén lévő kulcslyuk pont a mi kulcslyukunkba essen. Görgetésre a kulcslyuk kinyílik, és kitárul a teljes kép (kéz nyúl a palackért — „kézből ajánlva”).
2. **Kóstolósor (asztalon rögzítve):** szélesvásznú (2,39:1) keretben a négy pohár. Görgetésre a kamera pohárról pohárra halad (fehér → rosé → siller → vörös), a választott pohár megvilágítva, alatta felirat és haladásjelző; a végén pezsgő: a logó pohara buborékokkal. A fülek a megfelelő pontra ugranak. Mobilon érintésre vált.
3. **Kulcs a minőséghez:** teljes szélességű kép (dugóhúzó, kulcslyuk a dugón), lassú ráközelítés; a fő mondat olvasás közben szavanként gyullad ki.
4. **Több mint bor:** kulcslyuk alakú dugó-fotó, mellette a kínálat sorai — mindig az a sor világít, amelyik a képernyő közepén van.
5. **Kóstolók** (mustszín), **események**, **jelentkezés**, **Monor** (szavanként kigyúló felirat), **kapcsolat** — mind sötét alapon.

## 7. kör — „cinematic luxury” brief szerint

- **Színek:** pezsgőarany (#C9A86C) hajszálvonalakhoz, aktív menüponthoz, kiemelésekhez; krémszínű szöveg (#EEE5D4). Arany csak vonalakban és kiemelésekben, felületként nem.
- **Fejléc:** görgetésre alacsonyabb és sötét üveghatású lesz, arany aláhúzás, aktív szekció arannyal; mobilmenü függönyként nyílik, a pontok lépcsőzetesen érkeznek.
- **Hero (rögzítés nélkül):** sötétből a címke kulcslyukán át nyílik ki a kép (~2,5 s, közben minden kattintható), lassú közelítés, a BORMÁMOR betűnként érkezik (az eredeti logó betűi), arany vonal és arany keret rajzolódik ki, egérmozgásra finom mélység; görgetésre a kép közelebb jön, elsötétül, a szöveg gyorsabban halad. Az átmenet transformmal megy, layout shift 0.
- **Borok:** asztalon rögzített kóstolósor-jelenet (sticky storytelling) maradt, kategóriánként más fény a keret mögött (fehér: arany, rosé: rózsaszín, siller: rubin, vörös: mély bordó, pezsgő: pezsgőszín), arany keret, hoverre fényesedés. **Mobilon külön kompozíció:** egymás alatti borkártyák, mindegyik a saját poharára vágott nagy képpel, maszkos feltárással.
- **Ajándékcsomag-összeállító:** 4 lépés (Kinek? → Tételek → Csomagolás és átvétel → Összegzés), animált folyamatjelző, kártyaváltás, kártyás választók (címzett, csomagolás, átvételi nap), prémium összegző kártya. A kosár alulról felcsúszó lapként megmaradt; „Tovább a véglegesítéshez” az összegzés lépésre visz.
- **Események:** üres állapotban kirajzolódó arany kulcslyuk „A következő alkalom — Hamarosan” felirattal; ha lesz esemény, aszimmetrikus, váltakozó kép–szöveg elrendezés, képfeltárás, görgetésre érkező dátum.
- **Szekciók között** arany hajszálvonalak rajzolódnak ki.
- **Betűméret:** a brief „nagy” címeket kér; a mérsékelt méretet tartottam (a korábbi szabály szerint) — kérésre növelhető.

## Összeállító (kosár, átvétel a boltban) — 6. kör

Webshopszerű összeállító, **kiszállítás és online fizetés nélkül**: a vevő összeállítja, mi előkészítjük, a boltban veszi át.

- **Hol:** saját szekció (`#osszeallito`) a választható kategóriákkal; a borstílusoknál „+ Kosárba”, a polc soraiban „Kosárba” gomb.
- **Kosár:** alulról felcsúszó lap (asztalon és mobilon is). Ha van tétel, alul sáv mutatja a darabszámot és a tartalmat („Tovább”); a fejléc „Kosár” gombja is ezt nyitja. Esc, háttérre kattintás vagy lehúzás zárja.
- **Mit választ:** kategóriát (5 borstílus + 5 egyéb), mennyiséget (léptető), és tételenként keretet („Mindegy”, „5 000 Ft-ig”, „5–10 000 Ft”, „10 000 Ft felett”). **Nincsenek kitalált termékek és árak** — a pontos tételeket a bolt ajánlja. Ha lesz valódi terméklista, a `js/adatok.js` → `osszeallito.termekek` tömbbe kerülhet.
- **Ajándék:** címzett, üzenet a kártyára (max. 160 karakter), csomagolás (Nem kell / Díszdoboz / Szalag és kártya).
- **Átvétel:** csak nyitvatartási napok (a következő 6 péntek/szombat, a holnapi naptól).
- **Kötelező:** név, telefon, e-mail, 18 év feletti nyilatkozat, adatkezelés elfogadása.
- **Küldés most:** e-mail-piszkozat a bormamormonor@gmail.com címre a teljes összeállítással (demó, az oldalon jelölve). A kosár a böngészőben megmarad.
- **Egyeztetendő:** fizetés átvételkor (feltételezés); a keret-sávok; a csomagolási lehetőségek és díjuk; meddig tartják félre az összeállítást; alkoholértékesítési és fogyasztóvédelmi szabályok (online megrendelés átvétellel).
- **Élesítéshez:** a jelentkezési űrlappal közös háttérrendszer (értesítés a boltnak, visszaigazolás a vevőnek, admin-lista az összeállításokról, státusz: „előkészítve / átvéve”).

## Képminőség — 6. kör

A forrásképek legfeljebb 1640 px szélesek voltak. Mind a négy használt fotót helyben, egy nyílt Real-ESRGAN-típusú (SRVGGNet, Upscayl „lite” x4) modellel 4×-esre nagyítottam, ami a JPEG-zajt is eltünteti; ezekből 1×/2× (a nyitóképből 4K, 3840 px) WebP készült, `srcset`-tel. A felskálázás élesít és tisztít, de **nem pótolja az eredeti nagy felbontású fájlt** — ha a grafikus (Marcell Szűcs) meg tudja adni az eredeti fotókat, azokra kell cserélni. A közösségimédia-grafikákat (palackok felülről, kulcslyuk dugókból) kivettem — beégetett logós posztok voltak. A filmszemcse is kikerült.

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

1. **Kulcslyuk-feltárás (hero)** — a címke kulcslyukán át nyílik ki a fotó (≈2,5 s, a gombok közben kattinthatók).
2. **Címsor-feltárás** — a szekciócímek soronként emelkednek elő.
3. **Borstílus-váltó** — kamera a poharak között: kihúzás a teljes sorra (névcímkékkel), ráközelítés a választottra, reflektor a pohárra. Pezsgőnél külön nézet: a logó pohara, benne felszálló buborékok.
4. **Kulcs** — a „Kulcs a minőséghez” mellett a logó kulcsa felülről előtűnik.
5. **Maszkos képfeltárás** — a szekciók fotói más-más irányból nyílnak, enyhe ráközelítéssel.
6. **Mikrointerakciók** — gombkitöltés, menü-aláhúzás, közös képnézegető, parallax (csak széles kijelzőn).

`prefers-reduced-motion` esetén minden statikus. JS nélkül minden tartalom és kép látszik.

## Felhasznált képek (`img/`) — minden kép egyszer, a tartalmához illő helyen

| Szekció | Fájl | Forrás | Miért ide |
|---|---|---|---|
| Hero | `kez-palack(-m).webp` | elemek-07 (a beégetett BORMÁMOR felirat kiretusálva) | „kézből ajánlva” — kéz nyúl a palackért |
| Borok | `poharak.webp` | elemek-05 | a négy pohár pontosan a négy borstílus |
| Kulcs a minőséghez | `dugohuzo.webp`, mobilon `dugo-par.webp` | elemek-08 | a kulcslyuk a dugón is |
| Több mint bor | `dugok.webp` | elemek-06 | „ahány dugó, annyi palack” |
| Kóstolók | `palackok-felulrol.webp` | FB_IMG_1581839014017 | kóstolóra váró palackok |
| Események (üres állapot) | `kulcslyuk-dugok(-m).webp` | elemek-10 | „zárva, amíg nincs időpont” |

Minden fotó alatt rövid képaláírás mondja meg, mit lát a látogató. Nincs stock-, nincs generált kép, nincs kitalált címke.
Pezsgőről nincs fotó az anyagokban — a pezsgő nézet ezért a logó poharát mutatja buborékokkal. **Egy valódi pezsgős fotó a legjobb csere.**

## Ellenőrizendő az ügyféllel — publikálás előtt

1. **Nyitvatartás:** péntek 10–18, szombat 9–14 (más napra nincs adat — az oldal ezt írja: „Más napokon telefonon érdeklődj”).
2. **Képjogok:** az arculati fotók (dugók, poharak, kéz+palack) a grafikus kompozíciói — tisztázandó, hogy a háttérfotók licence webre is szól-e.
3. **Kulcslyukas dugó és címkés palack:** valódi termék vagy csak arculati látványterv? (A felirat óvatosan „a Bormámor arculatából”.)
4. **Programtípusok:** borkóstoló, pálinka-, whisky-, pezsgőkóstoló, sörvacsora, gasztroest — a régi, ügyfél által jóváhagyott szövegből. A **csoportos (céges, baráti) program** új elem, megerősítendő.
5. **Monor szekció:** „Strázsahegy pincesorai” — helyi névhasználat megerősítendő.
6. **Lénárd László neve** a szövegben aláírásként szerepel — hozzájárulás kell.
7. **Adatkezelési tájékoztató** szövege hiányzik (a lábléc jelzi).
8. **Alkoholos termékek:** a lábléc 18+ és felelős fogyasztás mondata maradjon; reklám- és fogyasztóvédelmi átnézés javasolt.
9. Külön galéria-blokk nincs (az ügyfél a régi oldalon is kivetette); a képnézegető a szekciókba szétosztott fotókon működik.

10. **Retus:** a hero kéz+palack fotójáról a grafikus által beégetett BORMÁMOR feliratot eltávolítottam (sötét fa háttérrel pótolva) — ezt az ügyféllel jóvá kell hagyatni.

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
js/adatok.js      ESEMÉNYEK, BORSTÍLUSOK (a poharak helyével) — itt frissíthető
js/gsap.min.js, js/ScrollTrigger.min.js
fonts/            Instrument Serif, Outfit (WOFF, latin + latin-ext) + OFL licencek
img/              WebP képek, favicon.svg, og.jpg
```
