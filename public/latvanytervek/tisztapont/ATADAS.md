# TisztaPont – látványterv, átadás (1. kör, 2026.11.07.)

**Ügyfél:** TisztaPont-Hungary Kft. · **Előnézet:** https://daekon-ship.github.io/daekon/latvanytervek/tisztapont/
Bemutató prototípus: `noindex, nofollow`, nincs éles foglalás, nincs adatküldés.

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

Fejléc (ragadós, mobilon teljes képernyős menü) → Nyitó → Szolgáltatási-terület szalag → 01 Szolgáltatások (6 sor, mindegyik előtölti az időpontkérőt) → 02 Munkáink (szűrhető galéria + képnézegető) → 03 Így dolgozunk (4 lépés) → 04 Időpontegyeztetés (5 lépés, demó) → 05 Kapcsolat (sötétkék) → Lábléc.

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
| Szalag | folyamatos | 60 mp/kör CSS-animáció; gomb, egér és fókusz megállítja |
| Időpontkérő | lépésváltás | rövid vízszintes áttűnés |

Csökkentett mozgásnál semmi nem animál, a szalag statikus, a másolata eltűnik. JS nélkül és Motion-hiba esetén minden látszik (az `anim` osztály csak sikeres betöltésnél marad, 2,5 mp-es biztonsági hálóval).

## Adatok és szerkesztés

Minden üzleti adat egy helyen: **`_forras/adatok.json`** (cégadatok, szolgáltatások, képek és feliratok, területek, referenciák, lépések, időpontkérő-opciók). Módosítás után:

```
python3 _forras/epites.py
```

Ez generálja az `index.html`-t (a sablon: `_forras/sablon.html`) és a `js/adatok.js`-t. Az oldal így JS nélkül is teljes tartalommal jelenik meg.

### Referenciaszalag

- Alapállapot: a szalag a szolgáltatási területeket mutatja („Terek, ahol dolgozunk”).
- A `referenciak` tömb mezői: `nev`, `kapcsolat` (`kozvetlen` / `alvallalkozo` / `korabbi_munkatarsi` / `null`), `leiras`, `szoveg_jovahagyva`, `logo_engedely`, `logo`.
- Csak `szoveg_jovahagyva: true` tétel jelenik meg; ha van ilyen, a szalag címe „Referenciák” lesz. Logó csak `logo_engedely: true` mellett.
- **Az ügyfél által megadott, ellenőrizetlen névlista nincs ebben a nyilvános repóban** – külön, publikálatlan fájlként adtam át. Logót nem töltöttem le és nem rajzoltam.

### Időpontkérő

- 5 lépés: szolgáltatás → település + alapterület → dátum (múlt nem választható) + napszak → elérhetőség (név + telefon vagy e-mail) → összesítés, „Módosítom” linkekkel.
- Záró gomb: „Igény áttekintése”. Nincs „elküldve / lefoglalva” üzenet, nincs hálózati kérés, nincs localStorage / süti, nincs adat az URL-ben (tesztelve).
- Az éles bekötés helye kizárólag `js/foglalas-adapter.js` (`TPFoglalas.kuld`), a felülettől elválasztva; módváltás: `foglalas.mod: "eles"`.

## Logó és ikonok

- Az ügyfélnek nem volt külön logófájlja: a jelet és a feliratot a két Wolt-grafikájából emeltem ki, és **pontosan követve vektorizáltam** (`arculat/`), formát nem rajzoltam át. A színek a grafikából mintavételezve.
- A fejlécben vízszintes elrendezés (jel + felirat), a láblécben az eredeti szlogennel. **Egyeztetendő:** az ügyfél adjon eredeti vektoros logót, és hagyja jóvá a vízszintes elrendezést. A szlogen („Azonnal”) csak a logó része, az oldal szövegében nem ígérünk gyorsaságot.
- `favicon.ico` (16/32/48), `favicon.svg` (sötét módban fehér gyűrűk), `img/favicon-32.png`, `img/apple-touch-icon.png` (180×180), `img/icon-192.png`, `site.webmanifest` – mind relatív úton, alkönyvtárban tesztelve.

## Fotók

Felhasznált (az ügyfél 7 csatolmányából 5): előszoba (nyitókép), étkezősarok, fürdőszoba, nappali, vendéglátóhelyi konyha.

- **Nem használt:** a két Wolt-promóciós grafika (generált képek, Airbnb-/Wolt-/Kia-jelzések, taxis téma) – csak a logó forrásai.
- A konyhafotóból kivágtam a bal oldali árlistát, a hűtő feliratát (más vállalkozás neve) és a bal felső sarkot (letakart arc); jobb szélről a sárga felirat. Retus nincs.
- A nappali fotója kisebb felbontású (768 px), ezért kisebb méretben jelenik meg.
- Előtte–utána blokk nincs: nem volt azonos helyszínről készült képpár.
- Feliratok tényszerűek, helyszín- vagy megrendelőnév nélkül. Formátumok: AVIF + WebP + JPG, rögzített képarány, a nyitókép előtöltve, a többi lusta betöltésű.

## Elvégzett ellenőrzések (Playwright, Chrome, `/daekon/latvanytervek/tisztapont/` alútvonalon)

- 1440 / 1024 / 768 / 390 / 360 px: nincs vízszintes csúszás, nincs konzolhiba, nincs 404, minden `data-rv` elem látható.
- Mobilmenü (nyitás, Esc, fókusz vissza), horgonyok nem bújnak a fejléc alá.
- Galéria: szűrés, érintéses nyitás, billentyűzet (Enter, nyilak), fókusz a dialógusban marad, Esc bezár, fókusz visszatér, nincs oldalugrás.
- Időpontkérő: hibajelzések, múltbeli dátum elutasítva, előválasztás a szolgáltatáslistából, összesítő, nulla hálózati kérés, nulla tárolás.
- Csökkentett mozgás, kikapcsolt JS, favicon / apple-touch / manifest útvonalak.
- **Nem ellenőrizhető itt:** valódi iOS Safari és Android eszköz, képernyőolvasóval végzett kézi teszt.

## Élesítés előtt tisztázandó

1. **Szolgáltatási terület** – Baranya (régi címtár) vagy Budapest (Wolt) vagy mindkettő; addig a semleges mondat áll.
2. **Végleges szolgáltatások** és rövid leírásaik.
3. **Ügyfélfogadási / telefonos elérhetőségi idő** (`ceg.elerhetoseg_ideje`) – a Wolt kiszállítási ideje nem az.
4. **Végleges cégadatok** (cégnév, székhely, adószám, cégjegyzékszám) ellenőrzése; a székhely nem ügyfélfogadó iroda.
5. **Kapcsolattartó** (Kontrecz Márk) megjelenjen-e az oldalon.
6. **Referenciák munkakapcsolata** tételenként: közvetlen megbízás, alvállalkozói munka vagy munkatársak korábbi tapasztalata; a „Poller Tecnology” pontos neve.
7. **Referenciák közzétehetősége**, esetleges titoktartás (különösen rendvédelmi és egészségügyi intézményeknél).
8. **Külön logóhasználati engedélyek** – írásban, szervezetenként.
9. **Fotók publikálhatósága** – az ügyfél készítette-e, és a helyszínek tulajdonosai hozzájárulnak-e.
10. **Valódi időpontfoglalás működése** – e-mail, űrlapkezelő vagy foglalási rendszer; ehhez adatkezelési tájékoztató és impresszum (tárhelyszolgáltatóval) kell, ezeket most szándékosan nem készítettem el.
11. **Eredeti vektoros logó** és a vízszintes elrendezés jóváhagyása.
12. **Wolt-link** – szerepeljen-e az oldalon, ha a felület elkészül.
