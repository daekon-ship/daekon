# Látványtervek

Ügyfél-látványtervek gyűjtőmappája. Minden terv egy önálló, build nélküli `index.html` a saját mappájában; a Vite a `public/` tartalmát változatlanul másolja a kész oldalba.

- **Lista:** https://daekon-ship.github.io/daekon/latvanytervek/
- **Új terv:** `public/latvanytervek/<ugyfel-neve>/index.html`, majd egy új sor a `public/latvanytervek/index.html` listájába.
- **Élő cím:** `https://daekon-ship.github.io/daekon/latvanytervek/<ugyfel-neve>/`

## Tervek

| Mappa | Ügyfél | Megjegyzés |
|---|---|---|
| `godzsak-tamas/` | Godzsák Tamás E.V. — teljes lakás- és házfelújítás, Budapest | Sötét, rajzlap-alapú art direction. Nincs valódi fotó: a képhelyeken generált anyagtextúra + vázlat, a `PROJECTS` / `REVIEWS` / `CRAFT` tömbökben `src`-vel cserélhető. Az értékelés-idézetek helyőrzők (5,0 / 2 értékelés valós). Űrlap még nincs bekötve. |
| `selyem-robert/` | Selyem Róbert E.V. — burkolás, Kéthely | „Márvány showroom” koncepció: elefántcsont–kő–espresso paletta sárgaréz kiemeléssel, Inter Tight + Inter (Fraunces tilos). A képhelyeken programból rajzolt anyagminták (`img/marble-*.webp`, `img/concrete.webp`) „Fotók hamarosan” jelzéssel; nem AI-fotók, nem valódi munkák. Valódi fotónál az adott elemre `background-image`, a `.soon` törlendő. Előtte–utána csúszkák (vadlak.hu-mintára): képpárnál `<img>` a `.ba-b` / `.ba-a` rétegbe. Ajánlatkérő űrlap nincs: minden CTA telefonhívás (`tel:+36202211366`). |
| `art-ert/` | ART ÉRT Alapítvány / patakinfo.hu — kulturális, művészeti, oktatási szervezet, Sárospatak | Kezdőoldal, 14 szekció, külön mobilterv. Newsreader + Instrument Sans. A fotók Unsplash-helyőrzők (hotlink), a valódi intézményi fotókra cserélendők. Helyőrző adatok: adószám (`18000000-1-05`), telefonszámok, pontos címek, a történet évszámai/eseményei (1999–2026), a mottó szövege, a pályázatok és a dokumentumok listája — mind ügyféltől egyeztetendő. Az űrlapok és a Bertalan-ház érdeklődő sáv nincsenek bekötve. |
