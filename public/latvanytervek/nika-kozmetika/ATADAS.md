# Nika Kozmetika – látványterv, átadás

**Élő előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/nika-kozmetika/
**Állapot:** 10. kör (2026. 10. 27.) – a hero jobb oldali gömb/monogram kompozíciója kikerült (ügyfél-visszajelzés: nem kell), a hero egyoszlopos. Tesztek újra: 139/139. 9. kör: prémium véglegesítés.

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

## 5. kör – szerkezet
Hero (név + cím, két gomb) · Kezelések (6 soros lista, soronként „Érdeklődöm” → időpontkérő panel előtöltve) · Ilcsi kozmetikakereső (egy mondat + link) · Időpontkérés · Elérhetőség + térkép · Lábléc. Bemutatkozás, vélemények, galéria akkor kerül vissza, ha a tulajdonos ad hozzá valós szöveget, fotót, véleményt.

## 6. kör – Motion (motion.dev 11.18.2, helyben)
Kérés: „használj nagyon sok mindent a Motionből, legyen látványos”.
- **Logó:** az új, vonalas N-monogram (boltív, vékony szárak, telt átló, levél) betöltéskor kirajzolódik; a NIKA betűi rugóval billennek be; a „KOZMETIKA” ritkításból szűkül. A láblécben görgetésre rajzolódik ki. Favicon frissítve.
- **Hero:** a cím betűnként, elmosódásból élesedve, 3D-ben billenve, rugóval érkezik; az alcím szavanként; a gombok rugósan pattannak be. Három púderes fényfolt végtelenül lebeg, és rugóval követi az egeret. Görgetésre a hero tartalma felúszik és halványul, a háttér nagyobbodik.
- **Mágneses gombok** (egérrel) és **rugós lenyomás** minden gombon, soron, linken.
- **Egyéni kurzor:** pont + rugóval követő gyűrű, interaktív elem fölött kinyílik (csak egérrel).
- **Fejléc:** lefelé görgetésre eltűnik, felfelé rugóval visszajön; a haladásjelző rugóval simított.
- **Horgonylinkek:** Motion-nel animált, lassuló görgetés.
- **Szakaszcímek:** betűnként, rugóval, enyhe forgással.
- **Kezelések:** sorok balról, kivágásból; a számok pörögve érkeznek; egér alatt rugós, követő kiemelés-sáv, a cím elcsúszik; bal oldalt görgetésre telő arany vonal (széles kijelzőn).
- **Ilcsi-blokk:** görgetésre kitágul (lekerekített kivágásból teljes szélességre), a háttér-monogram görgetésre kirajzolódik és forog, a mondat szavanként világosodik.
- **Időpontkártya:** rugós felbukkanás, 3D billenés és fényfolt az egér alatt.
- **Kapcsolat:** sorok lépcsőzetesen; a térkép vonalai kirajzolódnak, a tű rugóval „leesik”, lüktető gyűrűk.
- **Panel:** rugós becsúszás, választógombok pattannak, a kész-jel kirajzolódik és beforog.
- Csökkentett mozgás beállításnál semmi nem mozog; minden tartalom azonnal látszik. Mobilon az egérhez kötött effektek (kurzor, mágnes, billenés, követés) kikapcsolnak.

## 9. kör – véglegesítés (2026. 10. 27.)

### Módosítások
- **Hero:** kétoszlopos, kiegyensúlyozott elrendezés. Bal: „Kozmetika Szegeden” felirat, „Nika Kozmetika” főcím, dőlt cím-sor, barátságos alcím, nagy „Időpontot kérek” + telefon gomb, alattuk cím és „Időpont egyeztetéssel”. (A 9. körben készült jobb oldali gömb/monogram kompozíció a 10. körben kikerült.)
- **Kezelések:** cím + rövid, személyes bevezető egy sorban; finomabb sorköz, hover-kiemelés, fókuszkeret billentyűzethez. Kattintásra a panel nyílik, a kezelés előre kiválasztva (megvillan a mező).
- **Személyesség:** közvetlen, tegező szövegek; az Ilcsi-blokk csak annyit mond, hogy a szalon a kozmetikakeresőben is megtalálható (partner/tanúsítvány állítás nincs). Az időpont-blokk 3 lépést mutat: Hívj vagy írj → Egyeztetünk → Várunk.
- **Időpontkérő panel:** mezőnkénti hibaüzenetek (aria-invalid), telefon- és e-mail-formátum ellenőrzés, kattintható adatkezelési link, **magyar napválasztó** (Mindegy + a következő 14 nap, pl. „SZE 28 okt.”; JS nélkül sima dátummező), jól látható tájékoztató, hogy a gomb e-mail-programot nyit és ez nem automatikus foglalás; a visszajelzés is ezt mondja („Az időpont akkor él, ha visszaigazoltuk”); „Vissza az űrlaphoz” gomb; görgetés zárolva a panel alatt; Esc, fókuszcsapda, fókusz visszaadása.
- **Animációk:** visszafogottabbak és gyorsabbak (a hero kb. 1,3 s alatt kész). Kivéve: a hero szövegének görgetésre halványulása (eltűnő tartalom) és az Ilcsi-mondat szavankénti „világosodása”. Mobilon nincs betűnkénti animáció, kitágulás, kurzor, mágnes, billenés. Menüpontra kattintva a fejléc látható marad. `prefers-reduced-motion` mellett semmi nem mozog.
- **Jogi ablakok:** „Demonstrációs helykitöltő” címke, világos szöveg arról, hogy a látványterv nem éles és nem gyűjt adatot. Lábléc: „Látványterv (demó), nem éles weboldal – DAEKON”.

### Tesztek (Playwright, Chromium) – 139/139 sikeres
- **8 szélesség:** 320, 360, 375, 390, 412, 768, 1024, 1440 px – mindegyiken: nincs vízszintes túlcsordulás, nincs konzolhiba, minden erőforrás betöltődik, görgetés után minden tartalom látható, betűméret ≥ 13 px és H1 ≤ 60 px, minden gomb ≥ 40 px magas, a főcím a képernyőn belül, mobilmenü nyílik és a menüpont a szakaszhoz görget, a panel elfér, alatta nem görget az oldal, Esc-re bezárul.
- **Navigáció:** a menüpontok a megfelelő szakaszhoz visznek, a logó a tetejére.
- **Időpontkérés:** mind a 11 időpontkérő gomb megnyitja a panelt; mind a 6 kezelés előre kiválasztódik; általános gombnál „Még nem tudom” az alap; validáció (üres űrlap, hibás telefon/e-mail, hiányzó hozzájárulás) jelez és nem enged tovább; a magyar napválasztó 15 elemű; az e-mail a vanyoanyo2@gmail.com címre, minden kitöltött mezővel áll össze; őszinte visszajelzés; „Vissza” megtartja az adatokat; Tab a panelen belül marad; bezáráskor a fókusz visszakerül.
- **Jogi ablakok:** mind a 3 nyílik a helyes címmel és demó-jelöléssel, és bezárul; a panelből is megnyitható.
- **Térkép:** kattintásra a Google-térkép a pontos címmel töltődik be.
- **Hivatkozások:** minden telefonlink tel:+36308661037, minden e-mail-link vanyoanyo2@gmail.com, az útvonaltervezés a 6725 Szeged, Szabadkai út 9/C címre, az Ilcsi-link a hivatalos adatlapra mutat; a cím legalább 3 helyen egyezik; nincs partner/tanúsítvány/referencia szó; noindex.
- **Akadálymentesség:** egy H1, lang=hu, skip-link, minden gomb/link felirattal, minden mező címkével; kontraszt: törzsszöveg 6,3:1, gomb 4,9:1, arany szöveg 4,7:1, sötét blokk 13,0:1.
- **Csökkentett mozgás:** nincs animációs állapot, minden azonnal látszik.

### Jóváhagyandó / egyeztetendő (ügyfél)
1. **Kezelések listája** – egyik sem igazolt (az Ilcsi-adatlapon nincs szolgáltatáslista): személyre szabott arckezelés, hidratáló-tápláló kezelés, bőrtisztítás, arcápolási tanácsadás, szemöldök- és szempillaápolás, egyéb. Árak, időtartamok sincsenek.
2. **Nyitvatartás** (az Ilcsi-adatlapon üres) – addig „Időpont egyeztetéssel” szerepel.
3. **Saját fotók** (szalon, kezelés, portré) – a hero-kompozíció mellé/helyére kerülhetnek.
4. **Nagy Annamária szerepe** és egy rövid, saját bemutatkozás.
5. **Valós vendégvélemények** (pl. Google-profil), engedéllyel.
6. **Időpontkérés módja élesben** – marad-e az e-mail-program, vagy űrlapküldő / foglalási rendszer kell (adatkezelési tájékoztatóval).
7. **Jogi oldalak** – impresszum, adatkezelési és sütikezelési tájékoztató a vállalkozás adataival.
8. **„Visszahívunk” ígéret** – a tulajdonos vállalja-e.

### Ismert korlátok, kockázatok
- Az e-mail-alapú időpontkérés csak akkor működik, ha a látogató eszközén be van állítva levelezőprogram (főleg asztali gépen lehet gond); ezért a telefon az elsődleges.
- A Google-térkép csak kattintásra töltődik (sütik miatt); a tesztkörnyezetben a Google maga nem volt elérhető, csak a beágyazás címét ellenőriztük.
- A tesztek Chromiumban futottak; Safari/iOS valós eszközön érdemes egyszer végignézni (backdrop-filter, napválasztó görgetése).
- Az egyéni kurzor csak egeres eszközön jelenik meg; tesztkörnyezetben a fej nélküli böngésző egérnek jelzi magát.
