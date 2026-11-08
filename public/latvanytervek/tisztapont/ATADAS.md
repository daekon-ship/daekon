# TisztaPont – látványterv, átadás (2. kör – véglegesítő audit, 2026.11.07.)

**Ügyfél:** TisztaPont-Hungary Kft. · **Előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/tisztapont/
Bemutató prototípus: `noindex, nofollow`, nincs éles foglalás, nincs adatküldés (CSP-vel technikailag is tiltva).

> **Figyelem, élesítés előtt:** a ceginfo.hu (másodlagos forrás) szerint a TisztaPont-Hungary Kft.-nél **„hivatalból törlési eljárás indult”**. Hivatalos forrásból (e-cegjegyzek.hu) innen nem tudtam ellenőrizni. Az ügyféllel / a cégjegyzékben tisztázandó, mielőtt cégadat éles oldalra kerül.

## Koncepció – „Pontrács”

A logó egy pontból (cseppből, körökből) indul; az oldal ugyanígy épül fel: apró pontok, számozott sorok, hajszálvonalak, rendezett rács. Fehér és jégkék felületek, a logó tengerészkékje a szövegben, határozott kék a gombokon. Fotók nagy, nyugodt felületeken, aszimmetrikus párokban.

**Egyetlen karakteres mozgás:** a nyitófotó a mellette álló kék pontból, körként tárul fel („egy pontból kitisztul a tér”), 1,25 mp, egyszer, betöltéskor.

Három vizsgált irány:

| Irány | Lényeg | Döntés |
|---|---|---|
| **A – Pontrács** | Pont-motívum, számozott index, aszimmetrikus fotópárok, sötétkék zárás | **Választott.** Közvetlenül a logóból következik, vállalati és lakossági ügyfélnek egyaránt hiteles. |
| B – Tükörfény | Teljes szélességű fotók, matt üveg panelek | Elvetve: üvegkártyás sablonérzet, és a fotók felbontása nem bírja a teljes szélességet. |
| C – Svájci index | Tisztán tipográfiai lista, kevés kép | Elvetve önállóan – a szolgáltatáslistába beépítve él tovább. |

## Felépítés

Fejléc (ragadós, mobilon teljes képernyős menü) → Nyitó → Referenciaszalag → 01 Szolgáltatások (6 sor, mindegyik előtölti az időpontkérőt) → 02 Munkáink (szűrhető galéria + képnézegető) → 03 Így dolgozunk (4 lépés) → 04 Időpontegyeztetés (5 lépés, demó) → 05 Kapcsolat (sötétkék) → Lábléc.

## Tipográfia, színek, térközök

- **Hanken Grotesk** (változó, helyben) – címek 600, szöveg 400. **IBM Plex Mono** Medium – sorszámok, címkék. Fraunces nincs.
- Címméretek mérsékeltek: H1 max. 54 px, H2 max. 42 px, mobilon 32–34 px.
- Színek (a logóból mintavételezve): tengerészkék `#06183D`, gombkék `#1460CF` (fehér szöveggel 5,7:1), logókék `#0A8FEA` (csak díszítés), jégkék `#F2F7FC` / `#DDEBFA`, másodlagos szöveg `#4F6075`.
- Szekciótávolság `clamp(80px, 10vw, 144px)`, konténer 1240 px, lekerekítés 14 / 10 px, gombok kapszula alakúak.

## Mozgás (Motion 11.18.2, helyben)

| Elem | Indító | Mit csinál |
|---|---|---|
| Nyitófotó | betöltés | kör alakú feltárás a pontból + enyhe 1,06→1 léptékváltás |
| Nyitó szövegek | betöltés | 14 px-es felúszás, lépcsőzve |
| Szekciócímek, sorok | görgetés (inView) | 16 px-es felúszás, egyszer |
| Folyamat pontjai | görgetés | a négy pont egymás után kitöltődik |
| Szalag | folyamatos | két sor, ellentétes irányban (80 / 95 mp/kör CSS-animáció), a nevek fele-fele; gomb, egér és fókusz mindkettőt megállítja; képernyőolvasó minden nevet egyszer kap |
| Időpontkérő | lépésváltás | rövid vízszintes áttűnés |

Csökkentett mozgásnál semmi nem animál, a szalag statikus, a másolata eltűnik. JS nélkül és Motion-hiba esetén minden látszik (az `anim` osztály csak sikeres betöltésnél marad, 2,5 mp-es biztonsági hálóval).

## Adatok és szerkesztés

Minden üzleti adat egy helyen: **`_forras/adatok.json`** (cégadatok, szolgáltatások, képek és feliratok, területek, referenciák, lépések, időpontkérő-opciók). Módosítás után:

```
python3 _forras/epites.py          # látványterv
python3 _forras/epites.py --eles   # csak közzétehető referenciák, egyeztetendő-jelölések nélkül
```

Ez generálja az `index.html`-t (sablon: `_forras/sablon.html`) és a `js/adatok.js`-t, és kiszámolja a CSP-hez a fejben lévő szkript hash-ét. Az oldal így JS nélkül is teljes tartalommal jelenik meg. **Az `index.html`-t ne szerkessze kézzel** – a következő építés felülírja. Gyorsítótár-verzió: `oldal.verzio`.

### Referenciaszalag – jóváhagyási állapotok

A szalag az ügyfél által megadott neveket szövegesen, logó nélkül mutatja, „Akiknél már dolgoztunk” címmel – ez **ellenőrizendő állítás**, ezért mellette a látványtervben látható jelölés áll: *„Az ügyfél által megadott lista – közzététel előtt egyeztetendő”*. Nem írunk „partnereink”-et, nem utalunk ajánlásra vagy hivatalos együttműködésre.

Minden tételnek `allapot` mezője van (`_forras/adatok.json` → `referenciak`):

| `allapot` | Látványterv | Éles (`--eles`) |
|---|---|---|
| `ugyfel_altal_megadott` | megjelenik, jelöléssel | **nem** |
| `nev_pontositando` | nem | nem |
| `igazolt` (munkakapcsolat igazolt, közzététel még nem engedélyezett) | megjelenik, jelöléssel | **nem** |
| `kozzeteheto` | megjelenik | igen |

További mezők: `kapcsolat` (`kozvetlen` / `alvallalkozo` / `korabbi_munkatarsi` / `null` – kis címkeként jelenik meg a név mellett), `leiras`, `logo_engedely`, `logo`. Logó csak `logo_engedely: true` **és** megadott fájl esetén. Jelenleg 11 tétel `ugyfel_altal_megadott`, a „Poller Tecnology” `nev_pontositando` (nem javítottuk találgatással). Ha egy tétel sem látható, a szalag a szolgáltatási területeket mutatja. Logót nem töltöttem le és nem rajzoltam.

### Időpontkérő

- 5 lépés: szolgáltatás → település + alapterület → dátum (múlt nem választható) + napszak → elérhetőség (név + telefon vagy e-mail) → összesítés, „Módosítom” linkekkel.
- Záró gomb: „Igény áttekintése”. Nincs „elküldve / lefoglalva” üzenet, nincs hálózati kérés, nincs localStorage / süti, nincs adat az URL-ben (tesztelve).
- A „Bemutató felület – az adatok nem kerülnek elküldésre.” jelzés három helyen látszik: a bal oszlopban, a kártyában minden lépésnél, és az összesítőben.
- Újratöltés és vissza/előre navigáció után az űrlap üres és az 1. lépésen áll (a böngésző se töltse vissza a beírt adatokat).
- A tartalombiztonsági szabályzat (`connect-src 'none'`, `form-action 'none'`) technikailag is megakadályozza az adatküldést – éles bekötéskor ezt a CSP-t az új végponttal együtt kell módosítani (`_forras/sablon.html`).
- Az éles bekötés helye kizárólag `js/foglalas-adapter.js` (`TPFoglalas.kuld`), a felülettől elválasztva; módváltás: `foglalas.mod: "eles"`.

## Logó és ikonok

- Az ügyfélnek nem volt külön logófájlja: a jelet és a feliratot a két Wolt-grafikájából emeltem ki, és **pontosan követve vektorizáltam** (`arculat/`), formát nem rajzoltam át. A színek a grafikából mintavételezve.
- A fejlécben vízszintes elrendezés (jel + felirat), a láblécben az eredeti szlogennel. **Egyeztetendő:** az ügyfél adjon eredeti vektoros logót, és hagyja jóvá a vízszintes elrendezést. A szlogen („Azonnal”) csak a logó része, az oldal szövegében nem ígérünk gyorsaságot.
- `favicon.ico` (16/32/48, fehér lekerekített alapon – sötét böngészősávon is látszik), `favicon.svg` (sötét módban fehér gyűrűk), `img/apple-touch-icon.png` (180×180), `img/icon-192.png`, `img/icon-512.png` (maskable), `site.webmanifest` – mind relatív úton, verziózott (`?v=`), alkönyvtárban tesztelve.
- Megosztási kép: `img/og-tisztapont.jpg` (1200×630, logó + nyitófotó) – Messengeren / Facebookon ez jelenik meg a link előnézeteként.
- `arculat/` – logókészlet: jel (sötét/világos), felirat (sötét/világos), szlogen (sötét/világos).

## Fotók

Felhasznált fotók (7): előszoba (nyitókép), étkezősarok, fürdőszoba, nappali, nappali más szögből, vendéglátóhelyi konyha, vendéglátó pavilon esti világításban (a két utóbbi 2026.11.08-án érkezett / került be).

- A pavilonfotóról levágtam a felső cégfeliratot (más vállalkozás neve). Az ablakon lévő árak és ételképek a helyszín részei, retus nélkül maradtak. A pult mögött egy kéz részlete látszik, ez nem azonosítható. Nem állítjuk, hogy a konyhafotó ugyanerről a pavilonról készült.
- A galéria sorrendje mobilon: konyha · 2 kép · nappali (teljes szélesség) · 2 kép · pavilon (teljes szélesség). A képnézegető ebben a látható sorrendben lapoz.

- **Nem használt:** a két Wolt-promóciós grafika (generált képek, Airbnb-/Wolt-/Kia-jelzések, taxis téma) – csak a logó forrásai.
- A konyhafotóból kivágtam a bal oldali árlistát, a hűtő feliratát (más vállalkozás neve) és a bal felső sarkot (letakart arc); jobb szélről a sárga felirat. Retus nincs.
- A nappali fotója kisebb felbontású (768 px), ezért kisebb méretben jelenik meg.
- Előtte–utána blokk nincs: nem volt azonos helyszínről készült képpár.
- Feliratok tényszerűek, helyszín- vagy megrendelőnév nélkül. Formátumok: AVIF + WebP + JPG, rögzített képarány, a nyitókép előtöltve, a többi lusta betöltésű.

## Technikai jegyzetek

- **Biztonság:** CSP meta (`default-src 'self'`, szkript csak saját + hash, `connect-src 'none'`, `form-action 'none'`, `base-uri 'none'`, `object-src 'none'`), `referrer` szabály. Külső szkript, font, követőkód, térkép nincs. (GitHub Pages fejlécet nem enged, ezért meta-CSP.)
- **Kompatibilitás:** a kiválasztott opciók kiemelése `:has()`-szal megy, régebbi Firefoxon / Samsung Interneten JS-osztályos tartalékkal; `matchMedia` régi Safari-tartalékkal; a `dialog` hiányában `open` attribútum.
- **Elrendezés:** a nyitófotó magassága asztali nézetben a képernyőhöz igazodik (1366×768-on is teljesen látszik); minden kép rögzített arányú, nincs layout shift.
- **Függőség:** egyetlen könyvtár, a Motion 11.18.2 (helyben, MIT). Nincs build-függőség az oldal futtatásához; az építéshez Python 3 + Jinja2 kell.

## Automatikus tesztek

`_forras/teszt.py` (Playwright + Chrome/Chromium) – futtatás a fájl elején leírva. 70 ellenőrzés, legutóbb **mind rendben** (2026.11.07.):

- forrás: noindex, CSP, nincs „partnereink”, nincs hamis siker, nincs külső szkript, nincs Fraunces; `--eles` szűrés;
- 360 / 390 / 768 / 1024 / 1366 / 1440 / 1920 px: vízszintes csúszás, konzolhiba, hiányzó fájl, rejtve maradt elem, 40 px alatti érintési cél;
- mobilmenü, horgonyok, előválasztás, időpontkérő teljes útja (hibák, múltbeli dátum, visszalépés, összesítő, Módosítom), nulla kérés / tárolás / URL-adat, újratöltés utáni tiszta űrlap;
- galéria: érintés, húzásos lapozás, billentyűzet, fókuszcsapda, Esc, fókusz vissza, oldalugrás; szűrők;
- szalag megállítása, képernyőolvasó-duplikáció; csökkentett mozgás; JS nélkül; közvetlen link (`#idopont`); vissza navigáció; ikonok és OG-kép elérhetősége.

**Nem futtatható ebben a környezetben (nem állítunk róla sikeres tesztet):** Firefox, Safari / iOS Safari, Samsung Internet, Edge, valódi Android/iOS eszköz, képernyőolvasós kézi teszt, az élő GitHub Pages-cím megnyitása. Ezeket kódszinten átnéztem (lásd Kompatibilitás), de valódi eszközön érdemes egyszer végigkattintani küldés előtt.

## Élesítés előtt tisztázandó

1. **Szolgáltatási terület** – Baranya (régi címtár) vagy Budapest (Wolt) vagy mindkettő; addig a semleges mondat áll.
2. **Végleges szolgáltatások** és rövid leírásaik.
3. **Ügyfélfogadási / telefonos elérhetőségi idő** (`ceg.elerhetoseg_ideje`) – a Wolt kiszállítási ideje nem az.
4. **Végleges cégadatok** (cégnév, székhely, adószám, cégjegyzékszám) ellenőrzése hivatalos forrásból; a székhely nem ügyfélfogadó iroda. **A céginfo.hu szerinti hivatalbóli törlési eljárás tisztázása.** Az oldalon a cégadatok „Élesítés előtt ellenőrizendő” jelöléssel szerepelnek.
5. **Kapcsolattartó** (Kontrecz Márk) megjelenjen-e az oldalon.
6. **Referenciák munkakapcsolata** tételenként: közvetlen megbízás, alvállalkozói munka vagy munkatársak korábbi tapasztalata; a „Poller Tecnology” pontos neve.
7. **Referenciák közzétehetősége**, esetleges titoktartás (különösen rendvédelmi és egészségügyi intézményeknél).
8. **Külön logóhasználati engedélyek** – írásban, szervezetenként.
9. **Fotók publikálhatósága** – az ügyfél készítette-e, és a helyszínek tulajdonosai hozzájárulnak-e.
10. **Valódi időpontfoglalás működése** – e-mail, űrlapkezelő vagy foglalási rendszer; ehhez adatkezelési tájékoztató és impresszum (tárhelyszolgáltatóval) kell, ezeket most szándékosan nem készítettem el.
11. **Eredeti vektoros logó** és a vízszintes elrendezés jóváhagyása.
12. **Wolt-link** – jelenleg nem szerepel (az ügyfél szerint fejlesztés alatt áll, innen nem volt ellenőrizhető). Ha a felület kész, egy sorral felvehető.
13. **Meglévő tisztaponthungary.hu oldal** – a keresés szerint létezik ilyen domain „Magyarország egész területén” típusú állítással. Tisztázandó, hogy az ügyfél oldala-e, és erre a domainre kerül-e az új oldal (a lefedettségi állítást az új oldal szándékosan nem veszi át).
