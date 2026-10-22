"""Gyálautó – éles (gyalauto.hu) build a repóban lévő GitHub Pages-forrásból.

    python -I build_eles.py --out <ÚJ, ÜRES mappa>

A forrás (GitHub Pages-előnézet) noindex marad, hogy ne legyen duplikált tartalom. Az éles build:
- csak a felsorolt fájlokat másolja (ATADAS.md, _jogi/, build_eles.py nem kerül ki);
- az indexelhető oldalakon a robots értéke: index, follow (a 404 noindex marad);
- Content-Security-Policy meta minden oldalra (a beágyazott szkriptek SHA-256 hash-ével);
- CSS/JS hivatkozás tartalomhash-sel (?v=…), hogy a hosszú gyorsítótár után is friss legyen;
- robots.txt + sitemap.xml;
- ellenőrzés: nincs látványterv-felirat, minden helyi hivatkozás létezik.
Hiba esetén nem 0 a kilépési kód – ilyenkor NEM élesíthető.
"""
import argparse
import base64
import datetime
import hashlib
import os
import re
import shutil
import sys

SRC = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://gyalauto.hu/'
FILES = ['index.html', 'impresszum.html', 'adatkezeles.html', '404.html', 'gyalauto.css', 'gyalauto.js',
         'js/gsap.min.js', 'js/ScrollTrigger.min.js', 'logo.svg', 'logo-jel.svg', 'favicon.svg', 'favicon-32.png',
         'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-gyalauto.jpg', 'site.webmanifest',
         'fonts/manrope-latin.woff2', 'fonts/manrope-latin-ext.woff2', 'fonts/space-grotesk-latin.woff2',
         'fonts/space-grotesk-latin-ext.woff2', 'fonts/OFL.txt']
INDEXED = ['index.html', 'impresszum.html', 'adatkezeles.html']
TEXT = ('.html', '.css', '.js', '.svg', '.txt', '.webmanifest', '.xml')
FORBIDDEN = [r'[Ll]átványterv', r'latvanyterv', r'daekon-ship\.github\.io', r'fonts\.googleapis', r'fonts\.gstatic', r'lorem ipsum']


def fail(msg):
    print('HIBA:', msg)
    sys.exit(1)


def short_hash(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:10]


def csp_for(html):
    hashes = []
    for m in re.finditer(r'<script(?![^>]*\bsrc=)(?![^>]*application/ld\+json)[^>]*>(.*?)</script>', html, re.S):
        digest = base64.b64encode(hashlib.sha256(m.group(1).encode('utf-8')).digest()).decode()
        hashes.append(f"'sha256-{digest}'")
    script = ' '.join(["'self'"] + hashes)
    return ("default-src 'self'; script-src " + script + "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
            "font-src 'self'; connect-src 'self'; frame-src https://maps.google.com https://www.google.com; "
            "object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    out = os.path.abspath(ap.parse_args().out)
    if os.path.exists(out) and os.listdir(out):
        fail(f'a kimeneti mappa nem üres: {out} (új, üres mappát adj meg – a script soha nem töröl)')
    os.makedirs(out, exist_ok=True)

    for rel in FILES:
        src = os.path.join(SRC, rel)
        if not os.path.isfile(src):
            fail(f'hiányzó forrásfájl: {rel}')
        dst = os.path.join(out, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if rel.endswith(TEXT):  # LF sorvég (Windows-checkout CRLF-et adhat)
            with open(src, encoding='utf-8') as f:
                data = f.read().replace('\r\n', '\n')
            with open(dst, 'w', encoding='utf-8', newline='\n') as f:
                f.write(data)
        else:
            shutil.copyfile(src, dst)

    ver = {'gyalauto.css': short_hash(os.path.join(out, 'gyalauto.css')),
           'gyalauto.js': short_hash(os.path.join(out, 'gyalauto.js'))}
    for rel in [f for f in FILES if f.endswith('.html')]:
        p = os.path.join(out, rel)
        with open(p, encoding='utf-8') as f:
            html = f.read()
        if rel in INDEXED:
            html, n = re.subn(r'<meta name="robots" content="[^"]*">',
                              '<meta name="robots" content="index, follow, max-image-preview:large">', html)
            if n != 1:
                fail(f'{rel}: robots meta nem található pontosan egyszer')
        for asset, h in ver.items():
            html = re.sub(r'((?:href|src)="/?)' + re.escape(asset) + r'"', r'\g<1>' + asset + '?v=' + h + '"', html)
        csp = f'<meta http-equiv="Content-Security-Policy" content="{csp_for(html)}">'
        html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + csp, 1)
        with open(p, 'w', encoding='utf-8', newline='\n') as f:
            f.write(html)

    today = datetime.date.today().isoformat()
    with open(os.path.join(out, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n')
    urls = [('', '1.0'), ('impresszum.html', '0.3'), ('adatkezeles.html', '0.3')]
    with open(os.path.join(out, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u, prio in urls:
            f.write(f'  <url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod><priority>{prio}</priority></url>\n')
        f.write('</urlset>\n')

    # ellenőrzések
    for root, _, names in os.walk(out):
        for n in names:
            p = os.path.join(root, n)
            rel = os.path.relpath(p, out).replace(os.sep, '/')
            if not n.endswith(TEXT) or rel == 'fonts/OFL.txt':
                continue
            with open(p, encoding='utf-8') as f:
                txt = f.read()
            for pat in FORBIDDEN:
                if re.search(pat, txt):
                    fail(f'{rel}: tiltott tartalom: {pat}')
            if n.endswith('.html'):
                base = '' if rel != '404.html' else '/'
                for ref in re.findall(r'(?:href|src)="([^"#:?]+)(?:\?[^"]*)?"', txt):
                    if ref in ('/', './'):
                        continue
                    target = os.path.join(out, ref.lstrip('/')) if ref.startswith('/') else os.path.join(os.path.dirname(p), ref)
                    if not os.path.exists(target):
                        fail(f'{rel}: hiányzó hivatkozott fájl: {ref}')
                robots = re.search(r'<meta name="robots" content="([^"]*)"', txt).group(1)
                if rel in INDEXED and 'noindex' in robots:
                    fail(f'{rel}: noindex maradt')
                if rel == '404.html' and 'noindex' not in robots:
                    fail('404.html: indexelhető lenne')
                if len(re.findall(r'<h1[ >]', txt)) != 1:
                    fail(f'{rel}: nem pontosan egy H1')
    print(f'KÉSZ: {out}  (css v={ver["gyalauto.css"]}, js v={ver["gyalauto.js"]}, {len(FILES) + 2} fájl)')


if __name__ == '__main__':
    main()
