# Látványtervek

Ügyfél-látványtervek gyűjtőmappája. Minden terv egy önálló, build nélküli `index.html` a saját mappájában; a Vite a `public/` tartalmát változatlanul másolja a kész oldalba.

- **Lista:** https://daekon-ship.github.io/daekon/latvanytervek/
- **Új terv:** `public/latvanytervek/<ugyfel-neve>/index.html`, majd egy új sor a `public/latvanytervek/index.html` listájába.
- **Élő cím:** `https://daekon-ship.github.io/daekon/latvanytervek/<ugyfel-neve>/`

## Tervek

| Mappa | Ügyfél | Megjegyzés |
|---|---|---|
| `godzsak-tamas/` | Godzsák Tamás E.V. — teljes lakás- és házfelújítás, Budapest | Sötét, rajzlap-alapú art direction. Nincs valódi fotó: a képhelyeken generált anyagtextúra + vázlat, a `PROJECTS` / `REVIEWS` / `CRAFT` tömbökben `src`-vel cserélhető. Az értékelés-idézetek helyőrzők (5,0 / 2 értékelés valós). Űrlap még nincs bekötve. |
| `selyem-robert/` | Selyem Róbert E.V. — burkolás, Kéthely | A Godzsák-oldal rendszerére épül (sötét rajzasztal, keretes rajzlap-hero infósávval, görgetésre épülő rétegrend, lámpafény, intró, szavankénti címek), burkolásra szabva: a hero fürdőszobai kiosztási terv, a rétegrend fal–padló csatlakozás (aljzat → kiegyenlítés → vízszigetelés → ragasztó → burkolat, élzáró profil). Interaktív burkolat-tervező (4 kiosztás × 5 anyag, szemléltetés, `#kiosztas`), a hero-padló a kezdőponttól lapról lapra burkolódik. Anyagminták: `img/*.webp` (programból rajzolt, nem fotó). Inter Tight + Inter (Fraunces tilos). Tartalom a `PROJECTS` / `SERVICES` / `CRAFT` tömbökben, valódi fotó `src`-vel cserélhető; minden képhelyen „Fotók hamarosan”. Az előtte–utána csúszka látható (utána-oldal: `img/marble-white.webp` anyagminta), képpárnál `data-src` a `.ba-before` / `.ba-after` elemre. Ajánlatkérő űrlap nincs: minden CTA telefonhívás (`tel:+36202211366`). |
| `art-ert/` | ART ÉRT Alapítvány / patakinfo.hu — kulturális, művészeti, oktatási szervezet, Sárospatak | Kezdőoldal, 14 szekció, külön mobilterv. Newsreader + Instrument Sans. A fotók Unsplash-helyőrzők (hotlink), a valódi intézményi fotókra cserélendők. Helyőrző adatok: adószám (`18000000-1-05`), telefonszámok, pontos címek, a történet évszámai/eseményei (1999–2026), a mottó szövege, a pályázatok és a dokumentumok listája — mind ügyféltől egyeztetendő. Az űrlapok és a Bertalan-ház érdeklődő sáv nincsenek bekötve. |
