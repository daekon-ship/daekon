# MultiCont Center Kft. — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/multicont/
Fájlok: `index.html`, `multicont.css`, `multicont.js`, `jel.svg` (favicon / jel), `fonts/` (Spectral + Manrope, helyben, OFL).
A terv `noindex` — élesítéskor a `robots` meta törlendő, és a canonical URL beállítandó.

## Koncepció
- **„Főkönyv”**: a vizuális nyelv a könyvelés saját eszközeiből épül — vonalazott főkönyvi lap margóvonallal, oszlopvonalak, és a **kettős aláhúzás**, ami a számvitelben a lezárt összeget jelöli. Ez ismétlődik a hero profilkártyán, a szakmai út utolsó során és a végelszámolás szekció vonalgrafikáján („lezárva”).
- **Nincs fotó.** Az ügyfélnek nincs saját irodai fotója, stockot nem használunk, portrét nem generálunk. A hero jobb oldalán valós adatokból összeállított „szakmai profil” kártya áll (végzettségek, 30 év, HU · DE), mögötte jégkék főkönyvi lap és vékony kék keret, rá úszik a mélykék „Kiemelt specialitás” fül. Ha később lesz valódi irodafotó, a `.folio-paper` helyére tehető.
- Paletta a brief szerint (#0C2340, #173E68, #28669D, #EDF4F9, #F7FAFC, #D7E3ED); mélykék felület csak a végelszámolás sávban és a láblécben.
- Betűk: **Spectral** (címek, light/italic) + **Manrope** (szöveg), helyben, latin + magyar ékezetek. Mérsékelt méretek: hero-cím max. 56 px, telefonon 32–40 px; h2 max. 40 px.
- Logó: saját rajzolású jel (négyzetbe zárt „T-számla” + kék kettős aláhúzás) + „MultiCont CENTER” szókép, alatta KÖNYVELÉS • ADÓTANÁCSADÁS. Csak javaslat, az ügyféllel egyeztetendő.

## Szekciók
Fejléc (görgetésre alacsonyabb, árnyékkal) → Hero + 4 kiemelés → Bemutatkozás (Horváth Mária, idézet a saját profiljából, szakmai út) → Szolgáltatások (6 kártya, a végelszámolás kiemelve) → Végelszámolás (mélykék) → Kiknek segítünk? → Miért a MultiCont Center? (8 pont, görgetésre kirajzolódó vonalak) → Kapcsolat (telefon, e-mail, térkép, útvonaltervezés, űrlap) → Lábléc (Impresszum / Cégadatok / Adatkezelési tájékoztató ablakban).
Menü: Kezdőlap · Rólunk (→ bemutatkozás) · Szolgáltatások · Szakmai tapasztalat (→ Miért a MultiCont Center?) · Kapcsolat + „Konzultációt kérek”.
Telefonon külön kompozíció: a profilkártya és a fül egymás alatt, egyoszlopos kártyák, és a hero után megjelenő ragadós alsó sáv (Hívás | Konzultáció).

## Űrlap
- Valódi ellenőrzés (név, e-mail formátum, nem kötelező telefon 8–15 számjeggyel, két legördülő, üzenet min. 10 karakter), magyar hibaüzenetek, hibás mezőre fókusz.
- **Nincs háttérszolgáltatás**: küldéskor az ügyfél e-mail-programja nyílik meg előre kitöltött üzenettel a konyvelde@gmail.com címre; az oldal ezt őszintén ki is írja, és „Üzenet másolása” gombot ad. Sikeres elküldést nem szimulálunk. Élesítéshez űrlapküldő szolgáltatás (pl. Formspree / saját PHP) bekötése javasolt.
- A szolgáltatások kártyái és a végelszámolás gomb előre kiválasztják a megfelelő szolgáltatást az űrlapon. A listába bekerült a „NAV- és TB-képviselet” is (a briefben nem szerepelt, de szolgáltatás).

## Forrás szerint, ellenőrizve
- Briefből: cégnév, megnevezés, Horváth Mária, cím, telefon, e-mail, nyelvek, 30 év, végzettségek, alapítás (2015. 09. 25.), adószám, cégjegyzékszám (csak az impresszumban).
- konyvelok.hu: szolgáltatások, specialitás (végelszámolás „nagy tapasztalattal”), költségvetési / magyar / nemzetközi háttér, **5 év** cafeteria-tanácsadás, biztosítások, a bemutatkozó idézet, „felelősségbiztosítással” címke.
- konyvelokiajanlo.hu: német nyelvű kommunikáció külföldi partnereknek; a végelszámolás „levesszük az Ön válláról” gondolata.
- companywall.hu: nem volt elérhető (túl sok lekérdezés), onnan nem vettünk át adatot.
- Kihagyva szándékosan: a konyvelok.hu „20 éve alapítottam” mondata (ütközik a 2015-ös cégalapítással), a munkacsoport létszáma, minden ár, értékelés, ügyfélszám.

## Egyeztetendő az ügyféllel
- Felelősségbiztosítás (csak a konyvelok.hu címkéje alapján szerepel).
- „A MultiCont Center Kft. szakmai vezetője” megnevezés.
- Impresszum: székhely, nyilvántartó bíróság, tárhelyszolgáltató — „jóváhagyásra vár”.
- Adatkezelési tájékoztató szövege — „jóváhagyásra vár”.
- Nyitvatartás nincs feltüntetve (nincs nyilvános adat).
- Logó.

## Ellenőrizve (2 kör)
- 1440 / 1024 / 768 / 390 / 320 px: nincs vízszintes kilógás, nincs levágott szöveg.
- Minden belső horgony létező szekcióra mutat; egyetlen `tel:+36204337811` és `mailto:konyvelde@gmail.com` az egész oldalon; útvonaltervezés Google Maps `dir` linkkel.
- Mobilmenü nyit/zár (Esc is), ablakok nyit/zár, űrlap-ellenőrzés és e-mail-piszkozat, JS-hiba nincs.
- `prefers-reduced-motion`: minden mozgás kikapcsol, tartalom azonnal látszik.
