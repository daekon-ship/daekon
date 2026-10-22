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

# favicon: kompakt jel – két emelőoszlop, kék lámpa, G
write('favicon.svg', '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#080D14"/><rect x="7" y="17" width="6" height="40" fill="#A9B9CC"/><rect x="51" y="17" width="6" height="40" fill="#A9B9CC"/><rect x="17" y="8" width="30" height="4.5" rx="1" fill="#16B8FF"/><g transform="translate(16.95 52)"><path d="M15.56640625 0.390625C23.02734375 0.390625 28.37890625 -4.2578125 28.37890625 -12.03125V-15.859375H15.8984375V-10.80078125H21.71875C21.640625 -7.63671875 19.47265625 -5.6640625 15.625 -5.6640625C11.23046875 -5.6640625 8.65234375 -8.92578125 8.65234375 -14.58984375C8.65234375 -20.21484375 11.3671875 -23.4375 15.60546875 -23.4375C18.4765625 -23.4375 20.4296875 -22.01171875 21.09375 -19.609375H28.06640625C27.34375 -25.41015625 22.16796875 -29.4921875 15.48828125 -29.4921875C7.734375 -29.4921875 1.6015625 -24.00390625 1.6015625 -14.4921875C1.6015625 -5.29296875 7.24609375 0.390625 15.56640625 0.390625Z" fill="#F4F7FA"/></g></svg>''')
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
