# Karikagyuru.com – SEO: a hash-alapú oldalak korlátai és migrációs javaslat

**Állapot:** javaslat, nincs megvalósítva. A GitHub Pages bemutató `noindex` marad.

## 1. A mostani megoldás korlátai

Az oldal útvonalai `#/` (hash) alakúak: `…/#/kollekcio`, `…/#/gyuru/maz-81184-81185-w`.

- **Egyetlen URL a keresőnek.** A `#` utáni rész nem kerül el a szerverhez, és a keresők a hash-részt nem kezelik külön oldalként. Így a 115 termékoldal a keresők szemében egyetlen oldal (a főoldal).
- **Nincs oldalankénti cím és leírás.** A `<title>`, a `meta description`, a kanonikus URL és a megosztási kép (Open Graph) minden „oldalon” ugyanaz. Facebook- vagy Messenger-megosztásnál a termékoldal is a főoldal előnézetével jelenik meg.
- **A tartalom JavaScriptből épül.** A keresők többsége ma lefuttatja a JavaScriptet, de késve és nem garantáltan. Egyes előnézet-készítők pedig egyáltalán nem futtatják.
- **Sitemap.** A `sitemap.xml`-be nem írhatók be külön termékoldalak.
- **A régi oldal URL-jei.** A mostani karikagyuru.com valódi URL-jeinek (pl. `…/termek.php?…`) indexelt értékét csak külön, valódi célcímekre lehet 301-es átirányítással átvinni.

## 2. Javaslat: valódi útvonalak + szerveroldali „fej” (ajánlott)

A PHP-s tárhelyhez illik, nincs szükség build-lépésre vagy külön szerverre.

| Mostani | Új, indexelhető |
|---|---|
| `#/` | `/` |
| `#/kollekcio` | `/gyuruk/` |
| `#/gyuru/<azonosító>` | `/gyuruk/<azonosító>/` (pl. `/gyuruk/81184-81185-w/`) |
| `#/sajat` | `/sajat-otlet/` |
| `#/kapcsolat` | `/kapcsolat/` |
| `#/admin…` | `/kezelofelulet/…` (`noindex`, robots.txt-ben tiltva) |

**Lépések:**

1. **Útvonalkezelés a böngészőben.** A `js/app.js` routere a `location.pathname`-et olvassa, a linkek `history.pushState`-tel váltanak. A régi `#/…` linkek a betöltéskor `history.replaceState`-tel az új útra váltanak, így a meglévő megosztott linkek sem törnek el.
2. **Egy belépési pont a szerveren** (`.htaccess`): minden nem létező fájl a `site.php`-hoz kerül. Ez az `index.html`-t adja vissza, de előtte a mentett állapotból kitölti az oldal fejét:
   - `<title>` és `meta description` (pl. „81184 - 81185 W fehérarany karikagyűrű-pár – Karikagyuru.com”)
   - `<link rel="canonical">` a végleges domainre
   - Open Graph: cím, leírás, a termék fotója
   - JSON-LD `Product` (név, cikkszám, kép, márka). **Ár (`offers`) csak jóváhagyott számított vagy jóváhagyott fix árral** (V5.6: a régi listaár nem), a `shownPrice` szabályai szerint. Egyéb esetben ár nélkül.
   - JSON-LD `JewelryStore` a főoldalon, csak valós cégadatokkal
   - egy rövid, szerveren kiírt alaptartalom (név, cikkszám, fotó, rövid leírás), hogy a JavaScript nélküli előnézetek is lássanak valamit
3. **`sitemap.xml` a szerverről**, a mentett állapotból: a főoldal, a gyűrűk listája és minden **látható** gyűrű. Rejtett gyűrű nem kerül bele. A `lastmod` a gyűrű utolsó módosításának dátuma.
4. **`robots.txt`:** `Disallow: /api/`, `Disallow: /kezelofelulet/`, valamint a sitemap címe.
5. **404:** nem létező termékazonosítónál a `site.php` 404-es státuszt ad, nem 200-as „üres” oldalt.
6. **Régi URL-ek:** a jelenlegi oldal URL-listája (Search Console, sitemap) alapján egy megfeleltetési táblázat (régi → új), és 301-es átirányítás a `.htaccess`-ben vagy a `site.php` elején.
7. **Ellenőrzés:**
   - automata teszt: minden termék URL-je 200-at ad, saját címmel, leírással és kanonikus URL-lel;
   - a sitemapban csak látható gyűrű van;
   - JSON-LD-ben nem jóváhagyott ár nem szerepel;
   - a régi `#/` linkek átváltanak;
   - a régi URL-ek 301-gyel jó helyre mennek;
   - Google Rich Results Test és Search Console URL-vizsgálat élesítés után.

**Kockázat:** a hash nélküli útvonalakhoz a tárhelyen működnie kell az átirányításnak (Apache `mod_rewrite` vagy nginx `try_files`). Ezt a tárhely-hozzáférés után kell kipróbálni. A GitHub Pages bemutató maradhat hash-alapú.

## 3. Alternatíva: előre legyártott statikus termékoldalak

Egy build-szkript (Node) minden mentés után legyártja a `/gyuruk/<azonosító>/index.html` fájlokat, a fenti fej-adatokkal.

- **Előny:** a szerveren nem kell PHP-s útvonalkezelés.
- **Hátrány:** minden ár- és termékmódosítás után újra kell generálni. A tárhelyen futnia kell a generálásnak, vagy kézzel kell feltölteni. A kezelőfelület mentéséhez ez nem illeszkedik jól.

Ezért a 2. pontot javasoljuk.

## 4. Amit a döntéshez az ügyféltől kérni kell

- A végleges domain (www-vel vagy anélkül), és hogy marad-e a második oldal.
- A jelenlegi oldal Search Console-hozzáférése vagy URL-listája az átirányításokhoz.
- Termékenként rövid, saját leírás (opcionális, de a keresőben sokat számít).
