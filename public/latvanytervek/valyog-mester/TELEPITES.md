# Vályog-Mester – telepítési terv (valyogmester.hu)

> 10. kör (2026-10-20): az oldal **telefonos** – nincs ajánlatkérő űrlap, nincs PHP, nincs SMTP. Az éles csomag tisztán statikus.

Az éles oldal a látványtervből **egy paranccsal** előállítható, önálló csomag. Nem függ a GitHub Pages előnézeti útvonalától, és nem kell hozzá build eszköz (Node, Vite).

## 1. Előfeltételek

| Mi | Állapot |
|---|---|
| Domain | `valyogmester.hu` – Cloudflare DNS (DNS only), A → 57.129.181.55, `www` CNAME |
| Tárhely | DAEKON VPS (OVH, nginx), DAEKON Site Factory – `/srv/sites/valyogmester.hu/` |
| HTTPS | Let's Encrypt, valyogmester.hu + www (automatikus megújítás) |
| Levélküldés | **nem kell** – az oldal nem küld levelet |
| Jóváhagyás | az adatkezelési tájékoztató jelölt részei (`adatkezeles.html`) – amíg hiányoznak, az éles build szándékosan megáll |

## 2. Csomag előállítása

A repó gyökeréből:

```bash
python3 public/latvanytervek/valyog-mester/_forras/build_eles.py --out /tmp/vm           # éles
python3 public/latvanytervek/valyog-mester/_forras/build_eles.py --out /tmp/vm --vazlat  # teszt: noindex, robots Disallow
```

A szkript **nem ad ki éles csomagot**, ha bármi maradt benne, ami élesben nem lehet: előnézeti URL, régi domain, „Látványterv”, „egyeztetendő”,
jóváhagyásra váró adatkezelési rész, tesztmód-szöveg, ajánlatkérő-maradvány (űrlap, `#ajanlat`, `api/`), PHP-fájl, illetve nem létező fájlra mutató hivatkozás.

A csomag tartalma: `index.html`, `adatkezeles.html`, `404.html`, `valyog.css`, `valyog.js`, `fonts/`, `img/`, `arculat/`, `favicon.svg`,
`robots.txt`, `sitemap.xml`, `.htaccess` (csak Apache-tárhelyhez; nginx alatt hatástalan).

## 3. Telepítés a DAEKON VPS-re (Site Factory)

```bash
rm -f /tmp/vm/.htaccess
tar --owner=0 --group=0 -czf /tmp/vm.tgz -C /tmp/vm .
# a VPS-en:
sudo daekon-site deploy valyogmester.hu /tmp/vm.tgz --preview   # jelszavas előnézet (valyogmester.preview.daekon.hu)
sudo daekon-site promote valyogmester.hu                       # a preview-n ellenőrzött kiadás élesítése
sudo daekon-site rollback valyogmester.hu [--to <kiadás>]      # visszaállítás
```

A feltöltést a Factory validátora (titokkeresés, tiltott fájlok) ellenőrzi; az élesítés a DAEKON Deploy Orchestratoron át, atomikusan történik,
utána automatikus QA fut, kritikus hibánál automatikus visszaállítással. A biztonsági fejléceket (nosniff, X-Frame-Options, Referrer-Policy,
Permissions-Policy, HSTS) az nginx-vhost adja.

## 4. Élesítés utáni ellenőrzés

1. `https://valyogmester.hu/` 200; `http://` és `www` 301-gyel a `https://valyogmester.hu/` címre.
2. Konzolhiba és 404-es erőforrás nincs; a mobil hívássáv és minden hívásgomb a `tel:+36309669528` számot hívja.
3. `/nincs-ilyen` → saját 404-oldal; `/api/`, `/_forras/…`, `*.md` → 404.
4. A forrásban `index, follow`; `robots.txt` és `sitemap.xml` elérhető.
5. Google Search Console: domain-tulajdon DNS TXT-rekorddal (Cloudflare), sitemap beküldése: `https://valyogmester.hu/sitemap.xml`; Lighthouse az éles címen.

## 5. Mit NEM csinál a csomag

- A régi `valyog-mester.hu` oldalt nem módosítja és nem irányítja át.
- Nem használ sütit, analitikát, külső betűtípust vagy beágyazott külső videót, ezért sütibanner nem kell. Ha később ilyen kerül rá,
  előbb hozzájáruláskezelés és a tájékoztató frissítése szükséges.
