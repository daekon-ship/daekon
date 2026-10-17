# CB TAXI – Nyakas Péter — látványterv, átadás

Élő cím (változatlan): https://daekon-ship.github.io/daekon/latvanytervek/cb-taxi/
Fájlok: `index.html`, `cbtaxi.css`, `cbtaxi.js`, `js/` (GSAP 3 + ScrollTrigger, helyben), `fonts/` (Sora + Inter, helyben, OFL), `logo.svg`, `logo-jel.svg`.
Build nincs (a Vite a `public/` mappát változatlanul másolja); a terv `noindex`.

## 7. kör — csiszolás
- **Mobil hívássáv:** nem lebeg, hanem alulra dokkolt, középre rendezett sáv (ikon + „Taxi hívása” + szám), a telefon biztonsági sávjához igazodva. Elrejtőzik, amikor a térképnél lévő vagy a záró hívógomb látszik, így nincs két hívógomb egymáson.
- **Éjszakai út:** a jelenetek szövegei görgetés közben átúsznak egymásba (nem csúsznak egymásra félig).
- A térkép alatti hívógomb mobilon teljes szélességű; a „jármű illusztráció” jelölés mobilon csak a nyitóképnél marad.

## 6. kör — kidolgozottabb látvány (autó, jelenetek, nyitókép, térkép, zárás)
- **Kisbusz újrarajzolva:** fémes fényezés tükröződő sávval, krómozott ablak- és övvonal, tolóajtó-sín és kilincsek, tetősín, tükör, LED-es nappali fény és hátsó lámpa, mély kerékjáratok, ötküllős felnik gumioldalfallal (forognak), fénytócsa az úton előtte, piros derengés mögötte. Továbbra is egyetlen autó.
- **Jelenetek:** minden utcai lámpának fénykúpja és csíkos tükröződése van a nedves aszfalton, a horizonton pára, a háttérben egy lassabban mozgó távoli hegyvonulat ad mélységet (parallax).
- **Nyitókép:** finom vignetta, pára a víz felett, éjszakára a parti fények tükröződnek a vízen; a hívógomb alatt útvonal-motívum a három kiindulóponttal (Balatonmáriafürdő – Balatonkeresztúr – Marcali), mobilon függőlegesen.
- **Térkép:** papír hatású kártya szintvonalakkal a tó körül; minden településfülhöz saját esti rajz.
- **Zárás:** esti tópart Szigliget–Badacsony sziluettel és fényekkel, holdfény a vízen, móló, két lámpa; a szöveg és a hívókártya üveghatású panelen.

## 5. kör — kevesebb autó, csak hívás (a 4. kör felülírva)
- **Egyetlen jármű:** csak a szolgáltatásokon végiggördülő kisbusz maradt (asztalon és mobilon is vízszintes, görgetésre haladó út, ahogy a 2. körben). A heróból, a záró jelenetből és a mobilos jelenetekből kikerült a többi autó; a heróban újra csak a távolból közelítő fényszóró látszik.
- **Csak hívás:** az ajánlatkérő űrlap, a „Fuvarajánlat kérése” gombok és az e-mail-cím teljesen kikerült. Minden gomb a +36 30 997 8362-t hívja; mobilon alul egyetlen „Hívás” sáv.
- Megmaradt: brief-paletta (navy, champagne, lake blue), Sora + Inter, a javított térkép és a gombhiba javítása.

## 4. kör (előzmény) — teljes átdolgozás a „Complete visual redesign” brief alapján
**Újratervezve**
- **Jármű:** a korábbi személyautó helyett elegáns, sötét **személyszállító kisbusz** (Vito / Tourneo / Caravelle kategória ihlette, márka és típus nélkül). Hosszú, többablakos utastér, tolóajtó-vonal, meleg belső fény. Mindenhol „A jármű illusztráció” felirat jelzi, hogy nem a valódi autó.
- **Hero:** „A Balatontól bárhová.” + a brief alcíme; két gomb: **Taxi hívása** (tel:) és **Fuvarajánlat kérése** (az ajánlatkérőhöz ugrik és a első üres mezőre fókuszál). Betöltéskor a kisbusz begurul a part menti útra; görgetésre a naplemente éjszakába vált (csillagok, hold, kigyúló fények Szigligeten és Badacsonyon), a fényszóró erősödik, a végén a busz továbbhajt. A rögzítés rövidebb lett (0,8 képernyő).
- **Szolgáltatások:** 4 saját karakterű jelenet (falu este / M7-es országút / Balatonmária állomás vonattal / repülőtér). Mindegyikben **Taxi hívása** + az adott típusú ajánlatkérés (előválasztja a fuvartípust az űrlapon). A szövegek kiemelik a több utas / csomag lehetőségét, férőhelyszám nélkül.
  - Asztalon és tableten (768 px felett) vízszintes, görgetésre haladó út.
  - **Mobilon nincs rögzítés**: a jelenetek egymás alatt, kivágott, a lényegre fókuszáló képpel, felúszó kisbusszal.
- **„Hová utazna?” ajánlatkérő visszakerült:** fuvartípus, indulás, úti cél, dátum (múltbeli nem választható), időpont, utasok, csomagok, név, telefon, e-mail, megjegyzés; reptéri típusnál repülőtér, járatszám, érkezés/indulás. Élő menetlevél. Magyar hibaüzenetek, billentyűzettel kezelhető. Gomb: **Egyedi ajánlatot kérek**.
- **Paletta a brief szerint:** Midnight Navy #071A2B, Deep Blue #102A40, Champagne #D6B279 (csak a fő gombokon és apró jelölőkön – nem „aranyos”), Off White #F5F4EF, Lake Blue #57BDD0. Finom filmszemcse, meleg horizont-dereng.
- **Tipográfia:** Sora (címek) + Inter (szöveg), helyben, mérsékelt méretek.
- **Térkép:** finoman kirajzolódó tókontúr és Marcali–Keresztúr–Máriafürdő útvonal-motívum (díszítés: menetidő, ár nincs), pulzáló jelölő, olvasható feliratok.
- **Mobil sáv:** Hívás | Fuvarigénylés; az ajánlatkérőnél, a kapcsolatnál és a láblécnél elrejtőzik, így nem takar mezőt.

**Javított hibák (átvizsgálás)**
- A szolgáltatásgombok fényes „csillanás” rétege kilógott a gombból, és a szomszédos jeleneten egy szürke fénysávként látszott – javítva.
- Mobilon a vízszintes rögzített út túl hosszú görgetést kért – mobilon megszüntetve.
- A térkép feliratai a sötét tavon olvashatatlanok voltak – áthelyezve, kontúrral.
- Átlátszó fejléc a világos szekciók felett szürkén mosódott – erősebb háttér.
- A fejléc-menüből hiányzott a Fuvarigénylés – pótolva.
- Ellenőrizve: 390, 768, 1440 px és csökkentett mozgás mellett; nincs vízszintes túlcsordulás, nincs konzolhiba, minden `<use>` hivatkozás létezik, mind a 10 telefonos link `tel:+36309978362`, a menüpontok létező szekciókra mutatnak.

**Ténylegesen működik**
- Hívás minden gombról; e-mail-link; menü-navigáció; településválasztó térkép (egér és nyilak).
- Az ajánlatkérő ellenőrzése, majd küldéskor **előre kitöltött e-mail** nyílik a taxispeter@gmail.com címre (tárgy + minden adat). Mellette „Szöveg másolása” és „Inkább felhívom”.
- **Nincs háttérrendszer**, ezért az oldal sehol nem jelez „sikeresen elküldve” állapotot – csak azt, hogy a levél a látogató levelezőjében nyílt meg. Éles oldalon egy valódi küldő végpont (pl. PHP mail / Formspree / saját API) köthető be a `submit` kezelőbe.

## Fotók cseréje
- Saját fotó nincs; stock vagy generált kép nem került az oldalra (DAEKON-szabály). Minden jelenet rajzolt.
- Ha megérkezik a valódi autó fotója: a `.hero-van` elem (index.html, „A jármű illusztráció” megjegyzésnél) helyére egy `<img>` tehető ugyanazzal az osztállyal; a szolgáltatás-jelenetek kisbusza a `#van` szimbólumból jön, egy helyen cserélhető.

## Ügyféllel egyeztetendő
- **Jármű:** pontos típus és fotó; utaskapacitás (7 vagy 9 fő) – az oldalon most nincs szám, csak „7 vagy több” választható az űrlapon.
- **Reptéri transzfer:** vállalja-e, és mely repülőterekre (lista: Liszt Ferenc, Hévíz–Balaton Airport, Bécs, Zágráb, egyéb).
- Vezetékes számok (+36 85 575 175 / 176) és székhelycím – most nincsenek kint.
- „Balatonmária vasútállomás” mint személyes elérési pont.
- Adatkezelési tájékoztató szövege; az ajánlatkérő éles e-mail-küldése.
