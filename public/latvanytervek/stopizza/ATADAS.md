# STOPIZZA — átadási jegyzet

**Élő látványterv:** https://daekon-ship.github.io/daekon/latvanytervek/stopizza/
**Fájl:** `index.html` (önálló, build nélkül). Az étlap és a kedvencek a fájl végén lévő `MENU` tömbből renderelődnek.

## Koncepció

Kortárs nápolyi pizzéria, olasz editorial hangulattal. Pergamen alap, grafitfekete, paradicsompiros hangsúly, bazsalikomzöld csak jelzésként.
DM Serif Display (címek) + Schibsted Grotesk (UI). Fraunces nincs. A betűméretek mérsékeltek: a hero „STOPIZZA” legfeljebb 92 px.

Szekciók: hero (kilógó pizza + „32 cm” pecsét) · marquee · 4 állítás · A legkeresettebbek (vízszintesen húzható sor) · Hozzáállás (egyenes képsor) · Alapanyagok (5 kép + leírás) · Teljes étlap (ragadós kategóriasáv) · Non solo pizza · Vélemények (szerkezet) · Helyszín · Lábléc.

Rendelés: kosár-drawer (mobilon alsó lap), mennyiség, extrák, megjegyzés, minimumrendelés-sáv, összeg. Mobilon fix alsó sáv: Étlap | Rendelés | Hívás. A nyitvatartási állapot (Rendelést fogadunk / Zárva) budapesti idő szerint él.

## Ellenőrizve

- 320, 375, 390, 430, 768, 1024, 1180, 1440, 1920 px: nincs vízszintes túlcsordulás, nincs JS-hiba.
- Kontraszt: minden szövegszín legalább AA (legkisebb 4,7 : 1).
- Nincs görgetéshez kötött mozgatás (rögzítés, parallax), csak egyszerű megjelenési átmenetek — valós eszközön stabil.
- Érintési felületek legalább 44 px magasak. Mozgáscsökkentés (`prefers-reduced-motion`) mellett az animációk kikapcsolnak.

## Helyőrzők — egyeztetendő

| Hol | Mi a helyzet | Teendő |
|---|---|---|
| Minden fotó | Unsplash mintafotók (hotlink) | Eredeti STOPIZZA fotókra cserélni. A „Hozzáállás” blokkban egy jelölt képhely vár a kemencéről. |
| Árak | A Wolt-étlap árai alapján (2026. október) | Saját (nem Wolt-os) árakat bekérni. |
| Pizzanevek | A brief nevei. Összetevők: Margherita, Diavola és Gorgonzolás a briefből, a többi a Wolt-étlapról párosítva | Bruschetta összetevői és a Gorgonzolás ára feltételezés. |
| Pizzatekercsek | Nem szerepel a Wolton, 3 mintatétel | Valódi kínálat bekérése. |
| Extrák | Bivalymozzarella, rukkola, csípős olaj — helyőrző árak | Valódi extralista. |
| Vélemények | Csak szerkezet, „Minta” jelöléssel | Valódi Google/Wolt értékelések és átlagok. |
| Térkép | Sematikus rajz, nem valódi utcahálózat | Maradhat stílusos elemként, vagy egyedi térképre cserélhető. |
| ÁSZF, Adatvédelem | `#` | Ügyféltől. |

## Eltérések a forrásokban

- **Telefonszám:** a briefben `+36 70 997 0671` szerepel (ezt használja az oldal), a Woltón `+36 30 237 6696`.
- **Nyitvatartás:** a brief szerinti online rendelési idő szerepel (H–Szo 11:30–21:25, V 11:00–21:25). A Wolt „minden nap 11:00–21:30”-at ír.
- A tészta-állítások („nápolyi malomból származó liszt, hosszú érlelés, minimális élesztő, könnyen emészthető”, „tíztojásos friss tészta”) a pizzéria saját Wolt-leírásából valók.

## Élesítés saját domainen

1. A `noindex` meta sort törölni kell, és fel kell venni a canonical és az og:url címet.
2. Rendelési backend (vagy Wolt/saját rendelőrendszer bekötése) a „Rendelés folytatása” gombhoz.
