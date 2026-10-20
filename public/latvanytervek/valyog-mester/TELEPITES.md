# Vályog-Mester – telepítési terv (valyogmester.hu)

Az éles oldal a látványtervből **egy paranccsal** előállítható, önálló csomag. Nem függ a GitHub Pages előnézeti útvonalától, és nem kell hozzá build eszköz (Node, Vite).

## 1. Előfeltételek

| Mi | Követelmény |
|---|---|
| Domain | `valyogmester.hu` (regisztráció visszaigazolva – a DNS és a tárhely beállítását ellenőrizni kell) |
| Tárhely | Apache 2.4 (`mod_rewrite`, `mod_headers`, `mod_deflate`) **vagy** nginx – PHP 8.1+ (`fileinfo`, `openssl`, `mbstring`) |
| HTTPS | Érvényes tanúsítvány a `valyogmester.hu` és a `www.valyogmester.hu` nevekre (pl. Let's Encrypt) |
| Levélküldés | SMTP-fiók (pl. `ajanlat@valyogmester.hu`) – SPF, DKIM és DMARC rekorddal, hogy a levelek ne kerüljenek a spambe |
| Fogadó cím | **Az ügyféllel megerősítendő** (valyog.mester@gmail.com / istvanturo06@gmail.com / turpabuildkft@gmail.com) |

## 2. Csomag előállítása

A repó gyökeréből:

```bash
python3 public/latvanytervek/valyog-mester/_forras/build_eles.py --out ../valyogmester-eles
```

A szkript **nem ad ki csomagot**, ha bármi maradt benne, ami élesben nem lehet: előnézeti URL, régi domain, „Látványterv”, „egyeztetendő”, jóváhagyásra váró adatkezelési rész, tesztmód-szöveg, illetve nem létező fájlra mutató hivatkozás. Jelenleg az adatkezelési tájékoztató ügyféloldali adatai hiányoznak, ezért éles módban szándékosan hibát ad.

Tesztcsomag (noindex, robots: Disallow, a jóváhagyandó részek csak figyelmeztetnek):

```bash
python3 public/latvanytervek/valyog-mester/_forras/build_eles.py --out /tmp/valyogmester-teszt --vazlat
```

A csomag tartalma: `index.html`, `adatkezeles.html`, `404.html`, `valyog.css`, `valyog.js`, `fonts/`, `img/`, `arculat/`, `favicon.svg`, `api/ajanlat.php` (+ `api/.htaccess`), `.htaccess`, `.user.ini`, `robots.txt`, `sitemap.xml`.

## 3. Feltöltés

1. A csomag tartalmát a webgyökérbe kell másolni (pl. `/home/<felh>/valyogmester.hu/public_html/`), például `rsync -av --delete`.
2. A konfigurációt a **webgyökéren kívülre** kell tenni: `_eles/valyog-ajanlat.ini.minta` → `/home/<felh>/private/valyog-ajanlat.ini` (`chmod 600`), és ki kell tölteni. Ha a mappa nem a webgyökér szülőjében van, a `VALYOG_CONFIG` környezeti változóval adható meg az útvonal. Minden kulcs környezeti változóként is megadható (PHP-FPM pool: `env[MAIL_TO] = …`).
3. A `DATA_DIR` legyen írható a PHP számára, és ne legyen a webgyökérben. Csak egyszeri tokenek és IP-kivonatok kerülnek bele, személyes adat nem; a 24 óránál régebbieket a szkript magától törli.

### nginx esetén (a `.htaccess` helyett)

```nginx
server {
  listen 443 ssl http2; server_name valyogmester.hu;
  root /var/www/valyogmester.hu; index index.html;
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
  # CSP: a script-hash a build által generált .htaccess-ből másolandó
  client_max_body_size 48m;
  error_page 404 /404.html;
  location ~ /\.(?!well-known) { deny all; }
  location /api/ { location = /api/ajanlat.php { include fastcgi_params; fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; fastcgi_pass unix:/run/php/php8.3-fpm.sock; } return 403; }
  location ~* \.(webp|png|svg|woff2|mp4)$ { expires 30d; }
  location ~* \.(css|js)$ { expires 7d; }
}
server { listen 80; listen 443 ssl; server_name www.valyogmester.hu valyogmester.hu; return 301 https://valyogmester.hu$request_uri; }
```

## 4. DNS

- `valyogmester.hu` A/AAAA → a DAEKON szerver IP-címe; `www` CNAME → `valyogmester.hu`.
- Levelezés: SPF (`v=spf1 include:<smtp-szolgáltató> ~all`), DKIM a szolgáltató szerint, DMARC (`v=DMARC1; p=none; rua=mailto:…`) – később szigorítható.
- A HSTS csak akkor maradjon bekapcsolva, ha a HTTPS stabilan működik mindkét néven.

## 5. Élesítés utáni ellenőrzés

1. `https://valyogmester.hu/` betölt, `http://` és `www` 301-gyel átirányít.
2. Konzolhiba és 404-es erőforrás nincs (a CSP nem tilt le semmit).
3. Próba-ajánlatkérés 1–2 fotóval → megérkezik a fogadó postafiókba, a fotók mellékletként; a válasz-cím az ügyfél e-mailje.
4. Ugyanaz a beküldés még egyszer (vissza gomb + újraküldés) nem megy ki kétszer.
5. `https://valyogmester.hu/api/` és `/.user.ini` → 403; `/nincs-ilyen` → 404-es oldal.
6. `robots.txt` és `sitemap.xml` elérhető; a forrásban `index, follow` szerepel.
7. Google Search Console: a domain hitelesítése, a sitemap beküldése. Ezután mérendő a Lighthouse érték éles környezetben.

## 6. Mit NEM csinál a csomag

- A régi `valyog-mester.hu` oldalt nem módosítja és nem irányítja át. Átirányítás (301 → valyogmester.hu) csak az ügyfél kifejezett kérésére, a régi tárhely (Emergent) beállításaiban.
- Nem használ sütit, analitikát, külső betűtípust vagy beágyazott videót, ezért sütibanner nem kell. Ha később analitika kerül rá, előbb hozzájáruláskezelés és a tájékoztató frissítése szükséges.
