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

# favicon: a logó autós jele (autó elölnézetből) sötét alapon
write('favicon.svg', '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#111D2D"/><g transform="translate(4 5) scale(.92)"><g class="lg-wrench" transform="translate(51 47) rotate(-38) scale(1.02)"><rect x="-40" y="-5.5" width="80" height="11" rx="5.5" fill="#16B8FF"/><circle cx="-47" cy="0" r="13" fill="#16B8FF"/><circle cx="47" cy="0" r="13" fill="#16B8FF"/><path d="M47 -5.2H64V5.2H47Z" fill="#111D2D"/><circle cx="47" cy="0" r="5.2" fill="#111D2D"/><path d="M-47 -5.2H-64V5.2H-47Z" fill="#111D2D"/><circle cx="-47" cy="0" r="5.2" fill="#111D2D"/></g><g transform="translate(10 10) scale(.8)"><g stroke="#111D2D" stroke-width="8" stroke-linejoin="round"><path d="M29 39L35.5 24.5C37 21.5 39.5 20 43 20H57C60.5 20 63 21.5 64.5 24.5L71 39Z" fill="#111D2D"/><path d="M34.6 37L39.2 26.6C39.8 25.4 40.8 24.8 42.2 24.8H57.8C59.2 24.8 60.2 25.4 60.8 26.6L65.4 37Z" fill="#111D2D"/><rect x="17" y="37" width="66" height="26" rx="8" fill="#111D2D"/><rect x="12" y="34" width="8" height="5" rx="2" fill="#111D2D"/><rect x="80" y="34" width="8" height="5" rx="2" fill="#111D2D"/><rect x="22.5" y="43" width="13" height="7" rx="3.5" fill="#111D2D"/><rect x="64.5" y="43" width="13" height="7" rx="3.5" fill="#111D2D"/><rect x="40" y="44" width="20" height="9" rx="2.5" fill="#111D2D"/><path d="M42.5 47H57.5M42.5 50H57.5" stroke="#111D2D" stroke-width="1.3"/><rect x="24" y="57" width="52" height="2" rx="1" fill="#111D2D"/><rect x="21" y="61" width="12" height="10" rx="3" fill="#111D2D"/><rect x="67" y="61" width="12" height="10" rx="3" fill="#111D2D"/></g><path d="M29 39L35.5 24.5C37 21.5 39.5 20 43 20H57C60.5 20 63 21.5 64.5 24.5L71 39Z" fill="#F4F7FA"/><path d="M34.6 37L39.2 26.6C39.8 25.4 40.8 24.8 42.2 24.8H57.8C59.2 24.8 60.2 25.4 60.8 26.6L65.4 37Z" fill="#111D2D"/><rect x="17" y="37" width="66" height="26" rx="8" fill="#F4F7FA"/><rect x="12" y="34" width="8" height="5" rx="2" fill="#F4F7FA"/><rect x="80" y="34" width="8" height="5" rx="2" fill="#F4F7FA"/><rect x="22.5" y="43" width="13" height="7" rx="3.5" fill="#16B8FF" class="lg-light"/><rect x="64.5" y="43" width="13" height="7" rx="3.5" fill="#16B8FF" class="lg-light"/><rect x="40" y="44" width="20" height="9" rx="2.5" fill="#111D2D"/><path d="M42.5 47H57.5M42.5 50H57.5" stroke="#F4F7FA" stroke-width="1.3"/><rect x="24" y="57" width="52" height="2" rx="1" fill="#111D2D"/><rect x="21" y="61" width="12" height="10" rx="3" fill="#F4F7FA"/><rect x="67" y="61" width="12" height="10" rx="3" fill="#F4F7FA"/></g></g></svg>''')
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
