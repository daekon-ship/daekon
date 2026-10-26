"""Kalocsa GeoWorks – HTTP-regressziós teszt (csak olvas, egymás után küldött kérések, adatot nem módosít).

Használat:
  python -X utf8 -I tools/tesztek/http_teszt.py                      # élő oldal (https://kalocsageoworks.com)
  python -X utf8 -I tools/tesztek/http_teszt.py http://127.0.0.1:8765 --helyi   # helyben kiszolgált dist/ (csak tartalom; .htaccess nélkül)
Kilépési kód: 0 = minden rendben, 1 = legalább egy hiba.
"""
import http.client, re, sys, time, urllib.parse
from html.parser import HTMLParser

BASE = (sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'https://kalocsageoworks.com').rstrip('/')
HELYI = '--helyi' in sys.argv
TEL = 'tel:+36704204170'
TEL_DB = 11
UA = {'User-Agent': 'KGW-regresszios-teszt/1.0'}
hibak, db = [], 0


def ok(feltetel, leiras):
    global db
    db += 1
    print(('  OK   ' if feltetel else '  HIBA ') + leiras)
    if not feltetel:
        hibak.append(leiras)


def kerdes(url, metodus='GET', body=None, fejlec=None):
    """Egy kérés átirányítás követése nélkül → (státusz, fejlécek dict, törzs bytes)."""
    u = urllib.parse.urlsplit(url)
    C = http.client.HTTPSConnection if u.scheme == 'https' else http.client.HTTPConnection
    c = C(u.netloc, timeout=30)
    try:
        c.request(metodus, (u.path or '/') + ('?' + u.query if u.query else ''), body=body, headers={**UA, **(fejlec or {})})
        r = c.getresponse()
        return r.status, {k.lower(): v for k, v in r.getheaders()}, r.read()
    finally:
        c.close()


def lanc(url, max_lepes=6):
    """Átirányítási lánc → [(url, státusz)], a végén a végső cél."""
    out = []
    for _ in range(max_lepes):
        s, h, _ = kerdes(url, 'HEAD')
        out.append((url, s))
        if s in (301, 302, 307, 308) and 'location' in h:
            url = urllib.parse.urljoin(url, h['location'])
        else:
            break
    return out


class Gyujto(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ref, self.a, self.meta, self.link, self.form, self.h1, self.img_alt = set(), [], {}, {}, 0, 0, []
        self._h1 = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in ('form', 'input', 'textarea', 'select'):
            self.form += 1
        if tag == 'h1':
            self.h1 += 1
        if tag == 'a':
            self.a.append(d.get('href') or '')
        if tag == 'meta' and d.get('name'):
            self.meta[d['name']] = d.get('content', '')
        if tag == 'link' and d.get('rel'):
            self.link[d['rel']] = d.get('href', '')
        if tag == 'img':
            self.img_alt.append(d.get('alt'))
        for k in ('src', 'href', 'poster', 'data-src', 'data-full'):
            v = d.get(k)
            if v:
                self.ref.add(v)
        for k in ('srcset', 'data-srcset'):
            for part in (d.get(k) or '').split(','):
                if part.strip():
                    self.ref.add(part.strip().split()[0])


def helyi_eroforrasok(g, html):
    # a JS/CSS-ben hivatkozott videók, képek is
    extra = set(re.findall(r'''["'(]((?:video|img|fonts|js|vendor)/[^"')?\s]+)''', html))
    out = set()
    for r in g.ref | extra:
        if r.startswith(('http:', 'https:', 'tel:', 'mailto:', '#', 'data:', '//')):
            continue
        out.add('/' + r.split('?')[0].split('#')[0].lstrip('/'))
    return sorted(x for x in out if not x.endswith('/'))  # a '/'-re végződő csak útvonal-előtag (pl. Leaflet alapcím)


print(f'Kalocsa GeoWorks HTTP-teszt – {BASE} – {time.strftime("%Y-%m-%d %H:%M:%S")}' + (' (helyi mód)' if HELYI else ''))

# 1) Kezdőlap
print('\n[1] Kezdőlap és tartalom')
s, h, b = kerdes(BASE + '/')
html = b.decode('utf-8', 'replace')
ok(s == 200, f'GET / → 200 (kapott: {s})')
g = Gyujto(); g.feed(html)
tel = [a for a in g.a if a.startswith('tel:')]
ok(len(tel) == TEL_DB and all(a == TEL for a in tel), f'{TEL_DB} hívólink, mind {TEL} (kapott: {len(tel)}, eltérő: {sorted(set(tel) - {TEL})})')
ok(g.form == 0, f'nincs űrlapelem (form/input/textarea/select: {g.form})')
ok('noindex' in g.meta.get('robots', ''), f'robots meta noindex ({g.meta.get("robots")!r})')
ok(g.link.get('canonical') == 'https://kalocsageoworks.com/', f'canonical = https://kalocsageoworks.com/ ({g.link.get("canonical")!r})')
ok(50 <= len(g.meta.get('description', '')) <= 160, f'meta description 50–160 karakter ({len(g.meta.get("description", ""))})')
ok('<title>' in html and len(re.search(r'<title>(.*?)</title>', html).group(1)) <= 70, 'title legfeljebb 70 karakter')
ok(g.h1 == 1, f'pontosan egy h1 ({g.h1})')
ok(all(a is not None for a in g.img_alt), f'minden img-nek van alt attribútuma ({sum(a is None for a in g.img_alt)} hiányzik)')
ok('http://' not in re.sub(r'http://www\.w3\.org[^"\']*', '', html), 'nincs http:// (vegyes tartalom) hivatkozás')
ok(not re.search(r'(?<!\d)(06|\+36)[\s-]?(?!70[\s-]?420[\s-]?4170)\d{2}[\s-]?\d{3}[\s-]?\d{3,4}', html), 'nincs más telefonszám a forrásban')
ok('/api/' not in html and 'ajanlat.php' not in html, 'nincs ajánlatkérő-végpont a HTML-ben')
ok('kalocsageoworks@gmail.com' in html, 'e-mail-cím szerepel')
GPROF = 'https://www.google.com/maps?cid=7775453738665952318'
ok('id="velemenyek"' in html and '<a href="#velemenyek">Vélemények</a>' in html and html.count('href="#velemenyek"') >= 2, 'Vélemények szakasz + menüpont + lábléclink')
ok(f'href="{GPROF}" target="_blank" rel="noopener noreferrer"' in html, 'a Google-gomb az igazolt cégprofilra mutat, új lapon, noopener')
ok(not re.search(r'<script[^>]+src="https?://', html) and 'googleapis' not in html and 'maps.google' not in html.replace(GPROF, ''), 'nincs külső (Google) szkript vagy beágyazás')
ok('rcard' not in html or 'Forrás: Google' in html, 'véleménykártya csak forrásmegjelöléssel')
ok(html.count('class="brand__word"') == 1 and html.count('class="ftr__logo"') == 1 and 'brand__txt' not in html, 'új logó: fejléc jel + kétsoros felirat, lábléc álló logó (LOGO.png elrendezés)')
for _u in ('/img/og-kalocsageoworks-logo.jpg', '/apple-touch-icon.png', '/logo-jel.svg'):
    _s, _h, _b = kerdes(BASE + _u)
    ok(_s == 200 and len(_b) > 300, f'{_u} → 200 ({_s}, {len(_b)} bájt)')
ok('og-kalocsageoworks-logo.jpg' in html, 'megosztókép: az új logós kép van megadva')

# 2) Erőforrások
print('\n[2] Helyi erőforrások (képek, videók, betűk, szkriptek)')
for p in ('kalocsa.js', 'kalocsa.css'):
    m = re.search(p.replace('.', r'\.') + r'\?v=[^"\']+', html)
    if m:
        _, _, jb = kerdes(BASE + '/' + m.group(0))
        html += jb.decode('utf-8', 'replace')
eroforras = helyi_eroforrasok(g, html)
hibas = []
for p in eroforras:
    s, h, _ = kerdes(BASE + p, 'HEAD')
    if s != 200:
        hibas.append(f'{p} → {s}')
ok(not hibas, f'{len(eroforras)} helyi erőforrás mind 200' + (f' – HIBÁS: {hibas}' if hibas else ''))
for p, tipus in (('/video/hero-loop-mobil.mp4', 'video/mp4'), ('/video/hero-scrub.mp4', 'video/mp4'), ('/fonts/manrope-var.woff', 'font/woff'), ('/img/portre-720.webp', 'image/webp')):
    s, h, _ = kerdes(BASE + p, 'HEAD')
    ok(s == 200 and h.get('content-type', '').startswith(tipus), f'{p} → 200 {tipus} ({s} {h.get("content-type")})')

# 3) Kiegészítő oldalak
print('\n[3] 404, impresszum, robots, sitemap')
s, h, b = kerdes(BASE + '/nincs-ilyen-oldal-' + str(int(time.time())))
ok(s == 404, f'nem létező oldal → 404 ({s})')
if not HELYI:
    ok('Kalocsa GeoWorks' in b.decode('utf-8', 'replace') and 'tel:' in b.decode('utf-8', 'replace'), 'saját 404-oldal, hívólinkkel')
s, h, b = kerdes(BASE + '/impresszum.html')
ok(s == 200 and b'noindex' in b, f'impresszum 200 + noindex ({s})')
s, h, b = kerdes(BASE + '/robots.txt')
ok(s == 200 and re.search(rb'Disallow:\s*/\s*$', b, re.M), f'robots.txt: Disallow: / ({s})')
s, *_ = kerdes(BASE + '/sitemap.xml')
ok(s == 404, f'sitemap.xml még nincs fent (szándékos, indexelésig) ({s})')

if HELYI:
    print(f'\nÖsszesen {db} ellenőrzés, {len(hibak)} hiba.')
    sys.exit(1 if hibak else 0)

# 4) Domain-változatok és átirányítások
print('\n[4] HTTPS, www, átirányítások')
for u in ('http://kalocsageoworks.com/', 'http://www.kalocsageoworks.com/', 'https://www.kalocsageoworks.com/', 'https://kalocsageoworks.com/index.html'):
    l = lanc(u)
    ok(l[-1] == ('https://kalocsageoworks.com/', 200) and len(l) == 2, f'{u} → ' + ' → '.join(f'{x[1]}' for x in l) + f' → {l[-1][0]} (1 lépés)')
l = lanc('http://www.kalocsageoworks.com/impresszum.html?x=1')
ok(l[-1] == ('https://kalocsageoworks.com/impresszum.html?x=1', 200), f'útvonal és lekérdezés megmarad átirányításkor ({l[-1]})')
l = lanc('https://kalocsageoworks.com//evil.example.com/')
ok(all('evil.example.com' not in urllib.parse.urlsplit(x[0]).netloc for x in l), f'nincs nyílt átirányítás ({l})')

# 5) Biztonsági fejlécek
print('\n[5] Biztonsági fejlécek')
s, h, _ = kerdes(BASE + '/')
for k, minta in (('strict-transport-security', 'max-age='), ('content-security-policy', "default-src 'self'"), ('x-content-type-options', 'nosniff'),
                 ('referrer-policy', 'strict-origin'), ('x-frame-options', 'SAMEORIGIN'), ('permissions-policy', 'camera=()'), ('x-robots-tag', 'noindex')):
    ok(minta in h.get(k, ''), f'{k}: {h.get(k, "(hiányzik)")[:70]}')
ok("form-action 'none'" in h.get('content-security-policy', ''), "CSP form-action 'none' (űrlap kikapcsolva)")
ok('x-powered-by' not in h, f'nincs X-Powered-By ({h.get("x-powered-by")})')

# 6) Adatküldés tiltása
print('\n[6] Adatküldés tiltása (minden metódus, több cím)')
for p in ('/', '/index.html', '/api/ajanlat.php', '/ajanlat.php', '/api/meres.php', '/admin/statisztika.php'):
    for m in ('POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'):
        body = b'nev=Teszt&telefon=1' if m in ('POST', 'PUT', 'PATCH') else None
        s, *_ = kerdes(BASE + p, m, body, {'Content-Type': 'application/x-www-form-urlencoded', 'Origin': 'https://kalocsageoworks.com'} if body else None)
        ok(s == 405, f'{m:7} {p} → 405 ({s})')
s, *_ = kerdes(BASE + '/', 'POST', b'{"a":', {'Content-Type': 'application/json'})
ok(s == 405, f'POST hibás JSON → 405 ({s})')
s, *_ = kerdes(BASE + '/', 'POST', b'--x\r\n', {'Content-Type': 'multipart/form-data; boundary=x'})
ok(s in (400, 405), f'POST sérült multipart → elutasítva 400/405 ({s})')
s, *_ = kerdes(BASE + '/', 'HEAD')
ok(s == 200, f'HEAD / → 200 (legitim olvasás engedélyezett) ({s})')

# 7) Rejtett / érzékeny fájlok
print('\n[7] Érzékeny és belső útvonalak elérhetetlenek')
for p in ('/.htaccess', '/.env', '/.git/config', '/.git/HEAD', '/.ftpquota', '/api/', '/api/ajanlat.php', '/admin/', '/admin/statisztika.php', '/_private/', '/_private/ajanlat-config.php',
          '/_forras/', '/HELYI-FTP.md', '/ELESITES.md', '/README.md', '/build.py', '/backup.zip', '/backup.tar.gz', '/index.html.bak', '/kalocsa.js.orig', '/error_log', '/php.ini',
          '/img/', '/js/', '/video/', '/fonts/', '/vendor/', '/vendor/leaflet/', '/aktivalashoz/', '/indexeleshez-kesz/', '/dist/', '/../etc/passwd', '/%2e%2e/%2e%2e/etc/passwd'):
    s, h, b = kerdes(BASE + p)
    ok(s in (400, 403, 404), f'{p} → {s}')  # 400: az nginx előtét már elutasítja

print(f'\nÖsszesen {db} ellenőrzés, {len(hibak)} hiba.')
for x in hibak:
    print('  - ' + x)
sys.exit(1 if hibak else 0)
