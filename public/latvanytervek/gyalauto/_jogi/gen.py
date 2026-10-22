"""Gyálautó – jogi aloldalak és 404 generálása az index.html fejlécéből/láblécéből.

Futtatás (a gyalauto mappából):  python -I _jogi/gen.py
A kimenet (impresszum.html, adatkezeles.html, 404.html, favicon.svg, site.webmanifest) a repóban marad,
így a GitHub Pages-előnézet is mutatja (noindex). Az éles build (build_eles.py) teszi indexelhetővé.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = os.path.join(ROOT, '_jogi')


def read(p):
    with open(p, encoding='utf-8-sig') as f:
        return f.read().replace('\r\n', '\n')


def write(p, s):
    with open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


idx = read(os.path.join(ROOT, 'index.html'))
logo = re.search(r'<svg class="logo" viewBox.*?</svg>', idx, re.S).group(0)
foot = re.search(r'<footer class="foot">.*?</footer>', idx, re.S).group(0)
favicon = re.search(r'<link rel="icon" href="favicon\.svg"', idx)
assert favicon, 'index.html: favicon.svg link hiányzik'

PAGES = {
    'impresszum.html': ('Impresszum – Gyálautó, STABILTERV Kft.',
                        'A gyalauto.hu szolgáltatójának adatai: STABILTERV Kft., 2360 Gyál, cégjegyzékszám, adószám, elérhetőség és tárhelyszolgáltató.',
                        'impresszum.body.html'),
    'adatkezeles.html': ('Adatkezelési tájékoztató és sütik – Gyálautó',
                         'Hogyan kezeli a Gyálautó (STABILTERV Kft.) a kapcsolatfelvétel és az időpontkérés adatait, milyen külső szolgáltatásokat és sütiket használ a weboldal.',
                         'adatkezeles.body.html'),
    '404.html': ('Az oldal nem található – Gyálautó', 'A keresett oldal nem található a gyalauto.hu-n.', '404.body.html'),
}


def page(name, title, desc, body):
    is404 = name == '404.html'
    # a 404 bármely útvonalon megjelenhet → gyökérhez képesti hivatkozások
    base = '/' if is404 else ''
    home = '/' if is404 else './'
    f = foot.replace('href="#', 'href="' + home + '#').replace('href="impresszum.html"', 'href="' + base + 'impresszum.html"') \
            .replace('href="adatkezeles.html"', 'href="' + base + 'adatkezeles.html"')
    canon = '' if is404 else f'<link rel="canonical" href="https://gyalauto.hu/{name}">\n'
    robots = 'noindex, follow' if is404 else 'noindex, nofollow'
    b = body.replace('href="adatkezeles.html"', 'href="' + base + 'adatkezeles.html"')
    return f'''<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#080D14">
{canon}<link rel="preload" href="{base}fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{base}fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}gyalauto.css">
<link rel="icon" href="{base}favicon.svg" type="image/svg+xml">
<link rel="icon" href="{base}favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{base}apple-touch-icon.png">
</head>
<body>
<a class="skip" href="#tartalom">Ugrás a tartalomhoz</a>
<header class="lnav">
  <div class="nav-in wrap">
    <a class="brand" href="{home}" aria-label="Gyálautó – főoldal">{logo}</a>
    <a class="back" href="{home}">← Vissza a főoldalra</a>
  </div>
</header>
<main id="tartalom" class="legal">
  <div class="wrap">
{b.strip()}
  </div>
</main>
{f}
</body>
</html>
'''


for name, (title, desc, src) in PAGES.items():
    write(name, page(name, title, desc, read(os.path.join(J, src))))

# favicon: a logójel (villáskulcs + kék anya) sötét, lekerekített alapon
write('favicon.svg', '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 56 56"><rect x="-6" y="-4" width="56" height="56" rx="11" fill="#080D14"/><g class="lg-mark" transform="translate(0 0) scale(1)"><mask id="mf" maskUnits="userSpaceOnUse" x="-10" y="-10" width="70" height="70"><rect x="-10" y="-10" width="70" height="70" fill="#fff"/><g transform="rotate(-15 21 20)"><path d="M19.4 14.2H44V25.8H19.4Z" fill="#000"/></g></mask><g mask="url(#mf)" fill="#F4F7FA"><circle cx="21" cy="20" r="16"/><path d="M10.2 27L16.4 33.2L6.2 43.4A4.38 4.38 0 0 1 0 37.2Z"/></g><g class="lg-nut" transform="rotate(-15 21 20)"><polygon points="32.30,20.00 28.95,25.80 22.25,25.80 18.90,20.00 22.25,14.20 28.95,14.20" fill="#16B8FF"/><circle cx="25.6" cy="20" r="2.5" fill="#080D14"/></g></g></svg>''')
write('site.webmanifest', '''{
  "name": "Gyálautó – autószerviz Gyál",
  "short_name": "Gyálautó",
  "lang": "hu",
  "start_url": "/",
  "display": "browser",
  "background_color": "#080D14",
  "theme_color": "#080D14",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
''')
print('kész:', ', '.join(PAGES), '+ favicon.svg, site.webmanifest')
