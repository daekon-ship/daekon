# Nika Kozmetika – látványterv, átadás

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/nika-kozmetika/
**Állapot:** 4. kör (2026. 10. 27.) – a hero látogatókártyája és a lábléc „Hívás most” blokkja kikerült, a szövegek egyszerűbbek, kevésbé szlogenesek (a „Levél/Krém/Olaj” lista és a lábléc-idézet is ki). 3. kör: rajzos képhelyek ki, Cormorant Garamond + DM Sans. 2. kör: rózsa–mályva paletta.

> Miért nem külön repó? A brief a `nika-kozmetika-preview` repót javasolta. A DAEKON-ház-szabály szerint minden látványterv a `daekon-ship/daekon` → `public/latvanytervek/<ügyfél>/` mappába kerül, ugyanazon a GitHub Pages címen frissül körről körre. Új repót ezért nem hoztunk létre.

## Igazolt adatok (forrás: Ilcsi kozmetikakereső – https://ilcsi.com/hu-hu/kozmetikak/nika-kozmetika)
- Név: Nika Kozmetika · Cím: 6725 Szeged, Szabadkai út 9/C · Telefon: +36 30 866 1037 · E-mail: vanyoanyo2@gmail.com
- Az Ilcsi-adatlapon nyitvatartás nincs megadva; koordináta: 46.24075, 20.11996.
- Facebook-, Instagram-oldalt, Google-értékelést, saját fotót **nem találtunk**, amely egyértelműen ehhez a szalonhoz tartozna (keresés: név + Szeged, cím, telefonszám, e-mail, Nagy Annamária). Ezért az oldalon nincs vélemény, kép, ár, nyitvatartás és személynév.

## Koncepció – három irány, egy választás
1. **„Herbárium” (választott)** – préselt növények finom, egyvonalas rajzai porcelán papíron, zsályazöld alap, arany csak hajszálvonalnak. Vezérmotívum az íves (boltíves) képkeret arany kontúrral és a forgó „BEAUTY • CARE • HARMONY” pecsét az N-monogrammal. A rajzok betöltéskor/görgetéskor kirajzolódnak – ettől él az oldal saját fotók nélkül is, és nem kell hamis „szalonképet” mutatni.
2. „Spa-hotel csend” – teljes szélességű, fotóvezérelt, nagy képes oldal. Elvetve: kizárólag valós fotókkal működne, ilyenünk most nincs; stock-képpel hiteltelen lenne.
3. „Krémtextúra” – lágy, organikus foltok, üvegkártyák, pasztell. Elvetve: a sablonos „AI beauty” hatás pontosan ilyen; nem lenne egyedi.

## Arculati javaslat (jóváhagyandó)
- Szóvédjegy: **NIKA** Playfair Display 500, ritkítva (0,24 em); alatta arany hajszálvonal és kis, erősen ritkított **KOZMETIKA** (Manrope 600).
- N-monogram (`#mono` szimbólum az `index.html`-ben, `img/favicon.svg`): vékony szárak, telt átló, a jobb szárból kihajtó levél, boltíves arany keretben. Saját rajz, nem sablonikon.

## Szerkezet
Fejléc (görgetésre zsugorodik, üveges krém háttér) · Hero (aszimmetrikus: szöveg + boltíves látogatókártya) · Bemutatkozás (portréhely, jóváhagyandó bemutatkozó szöveg, 3 érték) · Kezelések (6 kártya, eltérő méretű/színű mozaik, mindegyik „Érdeklődöm” gombja előtölti az időpontkérő témáját) · Természetesen (sötét zöld blokk, Ilcsi-kozmetikakeresős említés linkkel – logó és partnerségi állítás nélkül – + Levél/Krém/Olaj számozott lista) · Vélemények (mintakártyák, kitalált vélemény nincs) · Időpontkérés (hívás elsődlegesen) · Kapcsolat (adatok, 3 gomb, kattintásra töltődő Google-térkép) · Lábléc (jogi oldalak helye párbeszédablakkal, „Látványterv – DAEKON”) · mobil alsó gyors-CTA.

## Időpontkérő
- Elsődleges működő CTA: `tel:+36308661037` (fejléc, hero címsor alatt, mobil sáv, időpont-blokk, panel teteje).
- Panel: név*, telefon*, e-mail, téma, napszak (Délelőtt/Délután/Mindegy – nem nyitvatartás!), nap, üzenet, hozzájárulás*. Ellenőrzés után **a látogató saját e-mail-programját nyitja meg** kitöltött levéllel; a visszajelzés ezt őszintén mondja („csak akkor ér célba, ha elküldöd”). Backend, adattárolás nincs. Éleshez: foglalási motor vagy űrlap-szolgáltatás + adatkezelési tájékoztató egyeztetendő.

## Tipográfia – 3. kör
- Visszajelzés: „a betűtípus is legyen jobb” → **Cormorant Garamond** (címsor, 500–600, dőlt kiemelések) + **DM Sans** (szöveg, változtatható). Mindkettő a brief listájáról, OFL, helyben (`fonts/`, a google/fonts repóból latin + magyar ékezetes részhalmazra vágva).
- Fraunces nincs. Mérsékelt méretek: H1 max. 52 px (Cormorant kis x-magassága miatt ez kb. a korábbi 47 px-es Playfairnek felel meg), mobilon 35 px; H2 max. 42 px; kártyacím 26 px; törzs 16,5 px.

## Színek (`:root`) – 2. kör
Visszajelzés: „nem elég jók a színek, legyen nőiesebb” → a zöld kikerült, púderes rózsa–mályva–pezsgőarany lett (a brief zöld palettája helyett).
`--porcelain #FBF6F3` (alap) · `--beige #F3E7E2` (púder) · `--sage-l #F2DCDA` (halvány rózsa) · `--sage #9C5F67` (fő szín: mályvarózsa – a változónév maradt) · `--ink #3A272C` (mély szilva, szöveg és sötét blokkok) · `--rose-dark #4A3036` · `--gold #C9A47C` (pezsgőarany, csak vonal/ikon) · `--gold-d #8C6743` (arany szöveg) · növényrajzok `#A06A72`. Időpont-blokk: rózsa→mályva átmenet.

## Térközök, rács
Konténer 1240 px + `clamp(20px,4vw,44px)` oldalsáv; szakasztávolság `clamp(72px,8.5vw,116px)`; kártyarés 14–18 px; lekerekítés 18 px (boltív és „levél” sarkok 80–140 px).

## Reszponzív
- ≥1061: teljes menü. ≤1060: hamburger, teljes képernyős menü (Esc, fókuszcsapda).
- <900: hero egy oszlop (felirat → cím → szöveg → gombok → boltív), bemutatkozás egy oszlop.
- <768: alsó gyors-CTA (Hívás + Időpontot kérek) – a hero után jelenik meg, az időpont-blokknál, a láblécnél és nyitott panelnél/nagyítónál eltűnik.
- Ellenőrizve: 360, 390, 768, 1440, 1920 px – vízszintes görgetés nincs, konzolhiba nincs; csökkentett mozgásnál minden tartalom azonnal látszik.

## Animációk – Motion (motion.dev 11.18.2, helyben: `js/vendor/`)
| Elem | Mit csinál | Indító | Csökkentett mozgás |
|---|---|---|---|
| Hero cím | soronként alulról, maszkból becsúszik | betöltés | azonnal látszik |
| Boltív-keret | alulról felfedő vágás + 1,12→1 skála | betöltés | statikus |
| Arany kontúr, növények | kirajzolódnak (stroke) | betöltés 0,9–1,9 s | kész rajz |
| Pecsét | beforog, majd lassan körbe forog (CSS) | betöltés | áll |
| Hero parallax | növény 40 px le, kontúr és pecsét fel | görgetés (csak ≥900 px) | nincs |
| Hero háttér | lágy, lassú fénymozgás | folyamatos | nincs |
| Szakaszok | `data-r` elemek lépcsőzetes felúszása, a rajzok kirajzolódnak | `inView` | azonnal látszik |
| Portré | felülről lefelé feltáruló vágás | `inView` | statikus |
| Természet-blokk | háttérlevelek ellentétes irányba sodródnak | görgetés | nincs |
| Kártyák | emelkedés, a rajz finoman nagyobbodik/elfordul | egér | – |
| Panel / menü / nagyító | becsúszás, lépcsőzetes mezők, áttűnés | kattintás | azonnali |
| Haladásjelző | 2 px arany–zöld sáv felül | görgetés | rejtve |
Ha a Motion 2,5 s-on belül nem töltődik be, minden tartalom animáció nélkül látszik.

## Fájlok
`index.html` · `css/site.css` · `js/site.js` · `js/vendor/motion-11.18.2.min.js` (+ licenc) · `fonts/` (Playfair, Manrope + OFL) · `img/favicon.svg`. A botanikai rajzok `<symbol>`-ként az `index.html`-ben (`#b-olive`, `#b-fern`, `#b-chamomile`, `#b-rosemary`, `#b-eucalyptus`, `#b-grass`).

## Képanyag – 3. kör
Visszajelzés: „ezek nem kellenek” (rajzolt képhelyek, boltíves rajzos keret, forgó pecsét) → mind kikerült, a galéria szakasz is. Az oldal most kép nélkül, tipográfiával és színfelületekkel működik: a hero jobb oldalán boltíves **látogatókártya** (cím, telefon, Hívom/Útvonal gomb), a kezelések szöveges kártyamozaik. Ha megjönnek a szalon saját fotói, a galéria és a képes elemek visszaépíthetők. Stock- vagy generált kép továbbra sincs.

## Még egyeztetendő tartalmak
1. **Fotók** (a legfontosabb): hero-kép, portré, a szalon belső tere, kezelés közbeni képek, részletek – és felhasználási hozzájárulás.
2. **Nagy Annamária szerepe** – tulajdonos/kozmetikus? Csak megerősítés után kerül név az oldalra; bemutatkozó szöveg, szakmai háttér (csak valós végzettség).
3. **Kezelések végleges listája** – mind a hat kategória helyőrző; különösen: *Szemöldök- és szempillaápolás* (van-e ilyen), *Egyéb szolgáltatások*. Árak, időtartamok csak a tulajdonostól.
4. **Ilcsi-termékhasználat** – milyen mértékben dolgozik Ilcsi-termékekkel; addig csak a kozmetikakeresős megjelenés szerepel.
5. **Nyitvatartás** (az Ilcsi-adatlapon is üres).
6. **Vendégvélemények** – csak valós, engedéllyel közölt (pl. Google-profil, ha lesz).
7. **Időpontkérés módja** – csak telefon, vagy űrlap/foglalási rendszer is; adatkezelési tájékoztató.
8. **Jogi oldalak** – impresszum (vállalkozás adatai), adatkezelési, sütikezelési tájékoztató.
9. **Logó** – az N-monogram és a szóvédjegy jóváhagyása; a „BEAUTY • CARE • HARMONY” pecsét maradjon-e.
10. **Közösségi oldalak**, ha vannak (Facebook/Instagram linkek a láblécbe).

## Élesítéshez
- `noindex` levétele, kanonikus URL, a `BeautySalon` strukturált adat bővítése (nyitvatartás, képek).
- SEO-cím és meta leírás a brief szerint már az oldalon van.
- Nem tartalmaz és nem igényel GSAP-ot, Three.js/WebGL-t, React Bitset vagy licencelt HorizonX-elemet – minden mozgás a Motion vanilla csomagjával és CSS-sel készült.

## 4. kör – szövegek
Visszajelzés: „a szövegek is túl AI-osak” → rövid, tényszerű mondatok: hero „Kozmetika Szegeden, a Szabadkai úton”, bemutatkozás „Pár szó a szalonról”, kezelésenként egy egyszerű mondat, Ilcsi-blokk csak a tényekkel. A végleges szövegeket a tulajdonossal érdemes egyeztetni.
