#!/usr/bin/env python3
"""Balogh Beatrix látványterv — statikus oldalak generálása.

Futtatás:  python3 _forras/build.py   (a balogh-beatrix mappából)
A közös fejléc, lábléc, ikonkészlet és menü itt van egy helyen; a tartalmi
szakaszok a PAGES szótárban. Az üzleti adatok (telefon, cím, árak) NEM itt
vannak, hanem a js/config.js-ben — azokat a böngésző tölti be.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
V = '20261028e'
# Motion (https://motion.dev) — vanilla JS build, rögzített verzió; ha nem tölt be, CSS-tartalék fut
MOTION_TAG = '\n<script src="js/vendor/motion-11.18.2.min.js"></script>'  # Motion (motion.dev), helyben kiszolgálva, MIT  # gyorsítótár-törő verzió

ICONS = {
    'phone': '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-l': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'chev': '<path d="M6 9l6 6 6-6"/>',
    'chev-l': '<path d="M15 6l-6 6 6 6"/>',
    'chev-r': '<path d="M9 6l6 6-6 6"/>',
    'check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'x': '<path d="M6 6l12 12M18 6L6 18"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'pin': '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    'leaf': '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7"/>',
    'shield': '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2"/>',
    'gift': '<rect x="3" y="8" width="18" height="4"/><rect x="5" y="12" width="14" height="9"/><path d="M12 8v13M12 8c-2-4-6-4-6-1.5S9 8 12 8c3 0 6-.5 6-3s-4-1-6 3"/>',
    'bell': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    'sliders': '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    'grid': '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    'list': '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r=".8"/><circle cx="5" cy="12" r=".8"/><circle cx="5" cy="18" r=".8"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'edit': '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    'trash': '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    'alert': '<path d="M12 3.5l9 16.5H3z"/><path d="M12 10v4M12 17v.01"/>',
    'expand': '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    'pause': '<path d="M9 5v14M15 5v14"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'home': '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    'download': '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    'refresh': '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
    'camera': '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
}

def sprite():
    syms = ''.join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
    return f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">{syms}</svg>'

def ico(name, cls=''):
    # beágyazott útvonalak (nem <use>), hogy a Motion meg tudja „rajzolni" őket
    return f'<svg class="ico {cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'

def head(title, desc, extra_css=''):
    return f'''<!doctype html>
<html lang="hu" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#FBF6F5">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="img/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="img/favicon-48.png" type="image/png">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="preload" href="fonts/hanken-var.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="css/bb.css?v={V}">{extra_css}
<script>document.documentElement.classList.remove('no-js')</script>
</head>'''

def demo_strip():
    return '''<div class="demo-strip" role="note"><div class="wrap">
  <span><b>Látványterv</b>Bemutató verzió — a foglalás nem rögzít valódi időpontot.<span class="hide-sm"> Az adatok jóváhagyásra várnak.</span></span>
  <a href="admin.html">Admin demó →</a>
</div></div>'''

NAV = [('Kezdőlap', 'index.html', ''), ('Szolgáltatások', None, 'kezelesek'), ('Rólam', 'index.html#rolam', 'rolam'),
       ('Galéria', 'index.html#galeria', 'galeria'), ('Árak', 'index.html#arak', 'arak'), ('Kapcsolat', 'index.html#kapcsolat', 'kapcsolat')]
SUBS = [('Pedikűr és lábápolás', 'pedikur.html', '11 kezelés'), ('Manikűr és géllakk', 'manikur.html', '9 kezelés'),
        ('Speciális lábápolás', 'specialis-labapolas.html', 'telefonos egyeztetés'), ('Előtte – utána', 'specialis-labapolas.html#elotte-utana', 'bemutató')]

def link(href, is_index):
    if is_index and href.startswith('index.html#'):
        return href[len('index.html'):]
    return href

def header(current, is_index=False):
    items = []
    for label, href, key in NAV:
        if href is None:
            subs = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if current == h else ""}><span>{l}</span><small>{m}</small></a>' for l, h, m in SUBS)
            subs += f'<a href="{link("index.html#arak", is_index)}"><span>Teljes árlista</span><small>25 tétel</small></a>'
            items.append(f'<div class="nav-dd"><button type="button" class="nav-dd-btn" aria-expanded="false" aria-controls="dd-svc">{label}<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9l6 6 6-6"/></svg></button><div class="nav-dd-panel" id="dd-svc">{subs}</div></div>')
        else:
            cur = ' aria-current="page"' if (current == href) else ''
            items.append(f'<a href="{link(href, is_index)}"{cur}>{label}</a>')
    nav = ''.join(items)

    m_items = []
    for i, (label, href, key) in enumerate(NAV):
        n = f'<span class="num">0{i+1}</span>'
        if href is None:
            subs = ''.join(f'<a href="{h}">{l}</a>' for l, h, _ in SUBS)
            m_items.append(f'<div><span>{label}{n}</span><div class="sub">{subs}<a href="{link("index.html#arak", is_index)}">Teljes árlista</a></div></div>')
        else:
            m_items.append(f'<a href="{link(href, is_index)}">{label}{n}</a>')
    return f'''<a class="skip" href="#main">Ugrás a tartalomra</a>
{demo_strip()}
<header class="hdr">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Beatrix Nails &amp; Pedikűr — kezdőlap"><img class="logo" src="arculat/logo-fejlec.svg" alt="Beatrix Nails &amp; Pedikűr" width="2388" height="717"></a>
    <nav class="nav" aria-label="Fő navigáció">{nav}</nav>
    <div class="hdr-cta">
      <a class="hdr-call" data-tel href="tel:+36706146070" aria-label="Hívás: +36 70 614 6070">{ico('phone')}</a>
      <a class="btn btn--book" href="foglalas.html">{ico('calendar')}Időpontfoglalás</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Menü megnyitása"><span></span></button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav">
  <nav aria-label="Mobil navigáció">{''.join(m_items)}</nav>
  <div class="mnav-actions">
    <a class="btn" href="foglalas.html">{ico('calendar')}Időpontfoglalás</a>
    <a class="btn btn--ghost" data-tel href="tel:+36706146070">{ico('phone')}<span data-bind="phone">+36 70 614 6070</span></a>
  </div>
  <p class="mnav-meta"><span data-bind="opening">Előre egyeztetett időpontok alapján</span> · <a href="foglalas.html#foglalasaim">Foglalásaim (demó)</a> · <a href="admin.html">Admin demó</a></p>
</div>'''

def footer(is_index=False, mbar=True):
    l = lambda h: link(h, is_index)
    bar = f'''<div class="mbar" role="region" aria-label="Gyors foglalás">
  <a class="btn btn--ghost" data-tel href="tel:+36706146070" aria-label="Hívás">{ico('phone')}Hívás</a>
  <a class="btn" href="foglalas.html">{ico('calendar')}Időpontfoglalás</a>
</div>''' if mbar else ''
    return f'''<footer class="ftr">
  <div class="wrap">
    <div class="ftr-grid">
      <div>
        <a class="brand" href="index.html" aria-label="Beatrix Nails &amp; Pedikűr — kezdőlap" style="margin-bottom:22px"><img class="logo logo--full" src="arculat/logo-vilagos.svg" alt="Beatrix Nails &amp; Pedikűr" width="953" height="866"></a>
        <p style="max-width:24em">Kéz- és lábápolás előre egyeztetett időpontban.</p>
        <p><a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a><br><span data-bind="addr-line2">1111 Budapest</span>, <span data-bind="addr-line1">Bertalan Lajos utca 19.</span> <span class="tag" data-addr-status>Egyeztetés alatt</span></p>
      </div>
      <div><h4>Kezelések</h4><ul>
        <li><a href="pedikur.html">Pedikűr és lábápolás</a></li><li><a href="manikur.html">Manikűr és géllakk</a></li>
        <li><a href="specialis-labapolas.html">Speciális lábápolás</a></li><li><a href="{l('index.html#arak')}">Árlista</a></li></ul></div>
      <div><h4>Foglalás</h4><ul>
        <li><a href="foglalas.html">Időpontfoglalás</a></li><li><a href="foglalas.html#foglalasaim">Foglalásaim (demó)</a></li>
        <li><a href="{l('index.html#gyik')}">Gyakori kérdések</a></li><li><a href="admin.html">Admin demó</a></li></ul></div>
      <div><h4>Tudnivalók</h4><ul>
        <li><a href="adatkezeles.html">Adatkezelési tájékoztató</a></li><li><a href="feltetelek.html">Foglalási és lemondási feltételek</a></li>
        <li><a href="impresszum.html">Impresszum</a></li><li><a href="koncepcio.html">Tervezési koncepció</a></li><li><a href="jovahagyas.html">Jóváhagyási lista</a></li></ul></div>
    </div>
    <div class="ftr-bot">
      <span>© <span data-year>2026</span> Beatrix Nails &amp; Pedikűr · Balogh Beatrix · látványterv, nem éles weboldal</span>
      <span>Tervezte: <a href="https://daekon.hu" rel="noopener">DAEKON</a></span>
    </div>
  </div>
</footer>
{bar}'''

def scripts(*extra):
    base = ['js/config.js', 'js/core.js', 'MOTION', 'js/site.js', 'js/motion-fx.js'] + list(extra)
    return ''.join(MOTION_TAG if s == 'MOTION' else f'\n<script src="{s}?v={V}"></script>' for s in base)

def page(fname, title, desc, body, current=None, is_index=False, mbar=True, extra_js=()):
    html = head(title, desc) + f'\n<body class="{"has-mbar" if mbar else ""}">\n' + sprite() + '\n' + header(current or fname, is_index) + \
        f'\n<main id="main">\n{body}\n</main>\n' + footer(is_index, mbar) + scripts(*extra_js) + '\n</body>\n</html>\n'
    (ROOT / fname).write_text(html, encoding='utf-8')
    print('írva:', fname)

def tag(t, sage=False):
    return f'<span class="tag{" tag--sage" if sage else ""}">{t}</span>'

def frame(art, tone='light', cls='', label=None, extra=''):
    lab = f'<span class="frame-label">{label}</span>' if label else ''
    return f'<div class="frame zoomable {cls}" data-art="{art}" data-tone="{tone}"{extra}></div>' if not lab else \
        f'<div class="frame zoomable {cls}" style="position:relative"><div class="frame" style="position:absolute;inset:0" data-art="{art}" data-tone="{tone}"></div>{lab}</div>'

def shots(items, cls=''):
    """Beatrix saját munkafotói egy sorban: [(fájlnév, alt, szélesség, magasság)]."""
    f = ''.join(f'<figure class="shot rv-img" style="--d:{i*.07:.2f}s"><img src="img/munkak/{n}-k.jpg" alt="{a}" width="{w}" height="{h}" loading="lazy" decoding="async"></figure>'
                for i, (n, a, w, h) in enumerate(items))
    return f'<div class="shots {cls}">{f}</div>'

MARQUEE = [('levendula-3', 'Levendula géllakk', 750, 760), ('gyongyhaz-4', 'Gyöngyházfényű géllakk', 760, 365), ('neon-2', 'Neon pink géllakk', 760, 709),
           ('csokolade-1', 'Csokoládébarna géllakk', 760, 527), ('magenta-1', 'Magenta géllakk', 760, 273), ('gyongyhaz-1', 'Gyöngyház, szögletes forma', 760, 428)]
def marquee_items():
    one = lambda hidden: ''.join(f'<figure class="mq"{" aria-hidden=\"true\"" if hidden else ""}><img src="img/munkak/{n}-k.jpg" alt="{"" if hidden else a + " — Beatrix munkája"}" width="{w}" height="{h}" decoding="async"></figure>' for n, a, w, h in MARQUEE)
    return one(False) + one(True)

BA_PAIRS = [
    ('par1', 'Lábujjak és körmök', 'bal láb'),
    ('par2', 'Lábujjak és körmök', 'jobb láb'),
    ('par3', 'Talp', 'bőrkeményedés'),
]
def ba_html():
    tabs = ''.join(f'<button type="button" role="tab" class="ba-tab" id="ba-tab-{k}" aria-controls="ba-panel" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}" data-pair="{k}">'
                   f'<span class="ba-thumbs" aria-hidden="true"><img src="img/elotte-utana/{k}-elotte-k.jpg" alt="" width="512" height="640" loading="lazy"><img src="img/elotte-utana/{k}-utana-k.jpg" alt="" width="512" height="640" loading="lazy"></span>'
                   f'<span class="ba-tab-t"><span class="num">{i+1:02d}</span><b>{t}</b><small>{sub}</small></span></button>' for i, (k, t, sub) in enumerate(BA_PAIRS))
    pairs = ''.join(f'<div class="ba-pair{" is-on" if i == 0 else ""}" data-pair="{k}"{"" if i == 0 else " hidden"}>'
                    f'<figure class="ba-fig"><img src="img/elotte-utana/{k}-elotte.jpg" alt="{t} ({sub}) — kezelés előtt" width="960" height="1200" loading="lazy" decoding="async"><figcaption>Előtte</figcaption></figure>'
                    f'<span class="ba-arrow" aria-hidden="true">{ico("arrow")}</span>'
                    f'<figure class="ba-fig ba-fig--after"><img src="img/elotte-utana/{k}-utana.jpg" alt="{t} ({sub}) — kezelés után" width="960" height="1200" loading="lazy" decoding="async"><figcaption>Utána</figcaption></figure></div>'
                    for i, (k, t, sub) in enumerate(BA_PAIRS))
    return f'''<div class="ba rv" data-ba>
      <div class="ba-tabs" role="tablist" aria-label="Előtte–utána párok">{tabs}</div>
      <div class="ba-stage" id="ba-panel" role="tabpanel" aria-live="polite">
        {pairs}
        <div class="ba-veil" data-ba-veil>
          <span class="ba-veil-ico">{ico('lock')}</span>
          <b>Belső bemutató — jóváhagyásra vár</b>
          <p>A kezelés előtti fotók nyilvános közzététele csak a vendég <b>írásos hozzájárulásával</b> lehetséges. A párosítást Beatrix ellenőrzi.</p>
          <button type="button" class="btn btn--light" data-ba-show>Megtekintés (bemutató)</button>
        </div>
      </div>
      <ul class="ba-status">
        <li><span class="dot dot--warn"></span>Vendég-hozzájárulás: <b>függőben</b></li>
        <li><span class="dot dot--warn"></span>Párosítás: <b>Beatrix megerősítésére vár</b></li>
        <li><span class="dot"></span>Arc, személyes adat nem látható</li>
      </ul>
    </div>'''
BA_HTML = ba_html()

LOGO_INLINE = (ROOT / '_forras' / 'logo.inline.svg').read_text().strip()

STREETS = '''<svg class="streets" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#D8C3C8" stroke-width="10" stroke-linecap="round"><path d="M-20 120 C 120 140, 260 90, 620 130"/><path d="M80 -20 L 140 420"/><path d="M-20 300 L 620 260"/><path d="M360 -20 C 340 120, 400 260, 380 420"/><path d="M500 -20 L 470 420"/></g><g fill="none" stroke="#E6D6D8" stroke-width="4"><path d="M-20 210 L 620 200"/><path d="M240 -20 L 260 420"/><path d="M-20 40 L 300 0"/></g><circle cx="300" cy="200" r="7" fill="#C9849A"/><circle cx="300" cy="200" r="20" fill="none" stroke="#C9849A" opacity=".5"/></svg>'''

# ======================================================================
# KEZDŐLAP
# ======================================================================
FAQ = [
    ('Hogyan foglalhatok időpontot?',
     '<p>Az oldalon pár lépésben: kiválasztod a kezelést, a napot és a szabad időpontot, majd megadod a neved, e-mail-címed és telefonszámod. Regisztráció nem kell. Ha inkább beszélnél, hívj a <a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a> számon.</p>'
     '<p class="small muted">Ez a bemutató változat valódi időpontot nem rögzít.</p>'),
    ('Milyen pedikűrkezelést válasszak?',
     '<p>Az alap a <b>klasszikus esztétikai pedikűr</b>: bőrkeményedés eltávolítása, a körmök rövidítése és rendbetétele, peeling, tápláló krémezés. Kérhető <b>lábgéllakkal</b> és/vagy <b>talpmasszázzsal</b>. Kényeztetőbb alkalomhoz a <b>wellness pedikűr csomagok</b> (Frissítő, Relax, Deluxe) valók. Ha csak a régi lakk kerülne le, a <b>lábgéllakk végleges eltávolítása + mini pedikűr</b> a jó választás. Bizonytalan vagy? Hívj, és együtt kiválasztjuk.</p>'),
    ('Mi történik, ha módosítanám a foglalásomat?',
     '<p>A tervezett rendszerben a visszaigazoló e-mailben egyedi link lesz, amellyel a foglalást módosíthatod vagy lemondhatod — belépés nélkül. Telefonon is szólhatsz.</p>'
     f'<p>{tag("Megerősítendő")} A lemondási határidőt és a késésre vonatkozó szabályt Beatrix-szel még egyeztetjük.</p>'),
    ('Férfiak is foglalhatnak?',
     '<p>Igen. A lábápolás nőknek és férfiaknak egyaránt szól — férfi vendégeket is szívesen várok.</p>'),
    ('Mivel érdemes készülni a kezelésre?',
     '<p>Ha géllakk vagy műköröm van a körmödön, válaszd a foglalásnál az eltávolítást is tartalmazó kezelést, vagy jelezd megjegyzésben. Pedikűrhöz kényelmes, könnyen feltűrhető nadrág a praktikus.</p>'
     f'<p>{tag("Megerősítendő")} További kéréseket (pl. érkezés előtt mennyivel) Beatrix határoz meg.</p>'),
    ('Hogyan egyeztethetek speciális lábápolási igényről?',
     '<p>Telefonon, időpontfoglalás előtt. Online nem kérünk egészségügyi adatot, ezért az egyéni igényeket személyesen beszéljük át, és ehhez igazítjuk az időpontot. <a href="specialis-labapolas.html">Bővebben a speciális lábápolásról</a></p>'),
    ('Mennyi ideig tartanak a kezelések?',
     '<p>Nagyjából 30 és 120 perc között — minden kezelésnél előre látod az időtartamot az <a href="#arak">árlistában</a>. A foglalási rendszer csak olyan kezdési időpontot kínál, amelybe a teljes kezelés belefér.</p>'
     f'<p>{tag("Megerősítendő")} Az árlistán csak a talpmasszázs és a wellness csomagok ideje szerepel; a többi becslés.</p>'),
    ('Hogyan fizethetek?',
     f'<p>{tag("Megerősítendő")} A fizetési módokat (készpénz, kártya, átutalás) a végleges oldal előtt Beatrix-szel egyeztetjük.</p>'),
]

def faq_html():
    out = []
    for i, (q, a) in enumerate(FAQ):
        out.append(f'<details{" open" if i == 0 else ""}><summary><span class="num">{i+1:02d}</span><span>{q}</span><span class="pm" aria-hidden="true"></span></summary><div class="ans">{a}</div></details>')
    return '\n'.join(out)

INDEX = f'''
<section class="hero" id="kezdolap" aria-labelledby="hero-h">
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="eyebrow rv">Kéz- és lábápolás · időpontra</p>
        <h1 id="hero-h" class="rv" style="--d:.1s">Az ápoltság a <em>részleteknél</em> kezdődik.</h1>
        <p class="lead rv" style="--d:.25s">Személyre szabott kéz- és lábápolás, ahol a szépség és a nyugalom találkozik.</p>
        <div class="hero-cta rv" style="--d:.35s">
          <a class="btn" href="foglalas.html">{ico('calendar')}Időpontot foglalok</a>
          <a class="btn btn--ghost" href="#kezelesek">Fedezd fel a kezeléseket</a>
        </div>
        <dl class="hero-facts rv" style="--d:.45s">
          <div><dt>Telefon</dt><dd><a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a></dd></div>
          <div><dt>Időpont</dt><dd>Előre egyeztetve</dd></div>
          <div><dt>Helyszín</dt><dd><span data-bind="addr-label">Budapest XI.</span> <span class="tag" data-addr-status>Egyeztetés alatt</span></dd></div>
        </dl>
      </div>
      <div class="hero-stage" aria-label="Beatrix munkáiból">
        <span class="hs-glow hs-glow--a" aria-hidden="true"></span>
        <span class="hs-glow hs-glow--b" aria-hidden="true"></span>
        <svg class="hs-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="hsRing" d="M100 100m-82 0a82 82 0 1 1 164 0a82 82 0 1 1-164 0"/></defs><circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" stroke-width=".6" opacity=".45"/><image href="arculat/emblema.svg" x="66" y="64" width="68" height="72"/><text><textPath href="#hsRing">BEATRIX · NAILS &amp; PEDIKŰR · KÉZ- ÉS LÁBÁPOLÁS ·</textPath></text></svg>
        <figure class="hs-main"><img src="img/munkak/levendula-1.jpg" alt="Levendula géllakk — Beatrix munkája" width="1452" height="1600" fetchpriority="high"></figure>
        <figure class="hs-sub"><img src="img/munkak/magenta-3-k.jpg" alt="Magenta géllakk — Beatrix munkája" width="760" height="408"></figure>
        <figure class="hs-mini"><img src="img/munkak/gyongyhaz-2-k.jpg" alt="Gyöngyházfényű géllakk — Beatrix munkája" width="760" height="456"></figure>
        <p class="hs-tag"><span>Beatrix saját munkái</span></p>
      </div>
    </div>
    <aside class="qb qb--bar rv" style="--d:.2s" aria-labelledby="qb-h">
      <div class="qb-head"><h2 id="qb-h">Gyorsfoglalás</h2><span>Bemutató</span></div>
      <div class="qb-svcs" role="radiogroup" aria-label="Kezelés"></div>
      <div class="qb-right">
        <p class="qb-sub">Legközelebbi szabad időpontok</p>
        <div class="qb-slots"></div>
        <a class="btn qb-go" href="foglalas.html">Tovább a foglaláshoz</a>
      </div>
      <p class="qb-note">A szabad időpontok mintaadatok — valódi foglalás nem történik.</p>
    </aside>
  </div>
</section>

<section class="ribbon-sec" aria-label="Beatrix munkáiból">
  <div class="marquee" data-marquee>
    <div class="marquee-track">{marquee_items()}</div>
  </div>
  <div class="wrap"><p class="ribbon-cap rv"><span>Beatrix saját munkái — mind a szalonban készült</span><a class="link" href="#galeria">Galéria {ico('arrow')}</a></p></div>
</section>

<section aria-label="Értékek">
  <div class="wrap">
    <div class="values">
      <div class="rv">{ico('leaf')}<div><h3>Nyugodt, személyes alkalom</h3><p>A kezelés a te időpontod: kapkodás nélkül, a részletekre figyelve.</p></div></div>
      <div class="rv" style="--d:.08s">{ico('shield')}<div><h3>Higiénikus kezelés</h3><p>Tiszta, rendezett munkakörnyezet és gondosan előkészített eszközök.</p></div></div>
      <div class="rv" style="--d:.16s">{ico('users')}<div><h3>Nőknek és férfiaknak</h3><p>Az igényes lábápolás mindenkinek jár — férfi vendégeket is szívesen várok.</p></div></div>
    </div>
  </div>
</section>

<section class="sec" id="kezelesek" aria-labelledby="kez-h" style="padding-top:clamp(64px,7vw,104px)">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow rv">Kezelések</p><h2 id="kez-h" class="rv">Lábtól a kézig, <em>gondosan</em>.</h2></div>
      <p class="lead rv">A hangsúly a lábápoláson van, a klasszikus pedikűrtől a lábgéllakkig. Mellette kézápolás és géllakk — egyéni igényekre pedig előzetes telefonos egyeztetés.</p>
    </div>
    <div class="cats">
      <article class="cat cat--1 rv">
        <div><div class="cat-top"><span class="num">01</span><span class="small muted">11 kezelés</span></div>
        <h3>Pedikűr és lábápolás</h3>
        <p>Esztétikai pedikűr, lábgéllakk, talpmasszázs és három wellness pedikűr csomag — esztétika és komfort, alaposan.</p>
        <ul data-cat-list="pedikur" data-limit="5"></ul>
        <div class="cat-actions"><a class="link" href="pedikur.html">Részletek {ico('arrow')}</a><a class="link" href="foglalas.html?kategoria=pedikur">Foglalás</a></div></div>
      </article>
      <article class="cat cat--2 rv" style="--d:.08s">
        <div><div class="cat-top"><span class="num">02</span><span class="small muted">9 kezelés</span></div>
        <h3>Manikűr és géllakk</h3>
        <p>Orosz gépi manikűr, erősített géllakk, műköröm szalonformába és díszítés — tartós szín, gondos kidolgozás.</p>
        <ul data-cat-list="manikur" data-limit="5"></ul>
        <div class="cat-actions"><a class="link" href="manikur.html">Részletek {ico('arrow')}</a><a class="link" href="foglalas.html?kategoria=manikur">Foglalás</a></div></div>
      </article>
      <article class="cat cat--3 rv" style="--d:.16s">
        <div><div class="cat-top"><span class="num">03</span><span class="small muted">Telefonos egyeztetés</span></div>
        <h3>Speciális lábápolás</h3>
        <p>Ha a lábad több figyelmet kér, előbb beszéljük át telefonon. Az időpontot és a kezelés menetét ehhez igazítjuk.</p>
        <ul data-cat-list="specialis" data-limit="3"></ul>
        <div class="cat-actions"><a class="link" href="specialis-labapolas.html">Részletek {ico('arrow')}</a><a class="link" data-tel href="tel:+36706146070">Hívás</a></div></div>
      </article>
    </div>
  </div>
</section>

<section class="sec sec--dark sec--spec" id="specialis" aria-labelledby="sp-h">
  <span class="sec-glow" aria-hidden="true"></span>
  <div class="wrap spec">
    <div class="spec-copy">
      <p class="eyebrow rv">Speciális lábápolás · 03</p>
      <h2 id="sp-h" class="rv">Ha a lábad <em>több figyelmet</em> kér.</h2>
      <p class="lead rv">Vastag bőrkeményedés, tyúkszem, benőtt köröm, repedezett, száraz sarok: ezeknél a kezelés egy rövid beszélgetéssel kezdődik. Telefonon átbeszéljük, mire van szükséged, és az időpontot ehhez igazítjuk.</p>
      <ol class="spec-steps rv">
        <li><span class="num">01</span><b>Felhívsz</b><small>röviden elmondod, mire van szükséged</small></li>
        <li><span class="num">02</span><b>Állapotfelmérés</b><small>személyesen, a szalonban</small></li>
        <li><span class="num">03</span><b>Kezelés, kapkodás nélkül</b><small>a te tempódban</small></li>
      </ol>
      <div class="spec-cta rv">
        <a class="btn btn--light" data-tel href="tel:+36706146070">{ico('phone')}Egyeztetek telefonon</a>
        <a class="link link--light" href="specialis-labapolas.html#elotte-utana">Előtte – utána képek {ico('arrow')}</a>
      </div>
      <p class="spec-note rv">Szépségápolási, komfortot szolgáló kezelés — nem helyettesíti az orvosi ellátást. Online nem kérünk egészségügyi adatot.</p>
    </div>
    <aside class="spec-card rv" aria-label="Speciális lábápolás árai">
      <p class="qb-sub" style="margin-top:0">Beatrix árlistája</p>
      <ul class="sum-list" data-cat-list="specialis"></ul>
      <p class="small" style="margin:14px 0 0;opacity:.75">Időpont csak telefonos egyeztetéssel.</p>
    </aside>
  </div>
</section>

<section class="sec sec--cream" id="arak" aria-labelledby="ar-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow rv">Árak és időtartamok</p><h2 id="ar-h" class="rv">Árlista</h2></div>
      <p class="lead rv">Az óralap minden kezelésnél a hosszt mutatja — így könnyebb beosztani a napod. Bármelyik sorból egy kattintással foglalhatsz.</p>
    </div>
    <div class="chips" id="priceChips" role="group" aria-label="Szűrés kategóriára">
      <button class="chip" type="button" data-filter="all" aria-pressed="true">Mind</button>
      <button class="chip" type="button" data-filter="pedikur" aria-pressed="false">Pedikűr és láb</button>
      <button class="chip" type="button" data-filter="manikur" aria-pressed="false">Manikűr és kéz</button>
      <button class="chip" type="button" data-filter="specialis" aria-pressed="false">Speciális</button>
    </div>
    <p class="sr-only" id="priceLive" aria-live="polite"></p>
    <div class="prices" id="priceList"></div>
    <p class="prices-note">{tag("Beatrix árlistája")} Az árak Beatrix saját árlistájáról valók. Ahol az árlistán nincs időtartam, ott a percek becsült értékek, a véglegesítésig egyeztetendők.</p>
  </div>
</section>

<section class="sec" id="rolam" aria-labelledby="rol-h">
  <div class="wrap about about--solo">
    <div>
      <p class="eyebrow rv">Rólam</p>
      <h2 id="rol-h" class="rv" style="margin-bottom:26px">Balogh Beatrix</h2>
      <blockquote class="rv">„Nálam a kezelés nem rohanás: időt szánok rá, hogy minden részlet a helyére kerüljön.”</blockquote>
      <div class="rv">
      <p>A szalonomban nyugodt, személyes légkörben dolgozom. Fontos számomra a gondos, igényes munka és a higiénikus környezet — hogy a kezelés alatt valóban kikapcsolhass. Lábápolásra nőket és férfiakat egyaránt szívesen várok.</p>
      <ul class="about-list"><li>Esztétikai és wellness pedikűr</li><li>Lábgéllakk, talpmasszázs</li><li>Orosz gépi manikűr, erősített géllakk</li><li>Műköröm szalonformába</li></ul>
      <p class="about-sign">Beatrix</p>
      <p style="margin-top:22px">{tag("Jóváhagyandó bemutatkozó szöveg")}</p>
      </div>
    </div>
  </div>
</section>

<section class="sec sec--dark sec--flower" aria-labelledby="elo-h">
  <span class="sec-glow" aria-hidden="true"></span>
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow rv">A szalonban</p><h2 id="elo-h" class="rv">Amire <em style="color:var(--gold)">számíthatsz</em>.</h2></div>
      <p class="rv muted">Nem ígéretek, hanem a szalon alapelvei — a végleges megfogalmazást Beatrix-szel véglegesítjük.</p>
    </div>
    <div class="perks">
      <div class="perk rv"><span class="num">01</span><h3>Személyes figyelem</h3><p>Egyeztetett időpontra érkezel, a kezelés pedig a te tempódhoz igazodik.</p></div>
      <div class="perk rv" style="--d:.08s"><span class="num">02</span><h3>Higiénikus munka</h3><p>Rendezett, tiszta munkakörnyezet és gondosan előkészített eszközök minden vendég előtt.</p><p>{tag("Részletei egyeztetendők")}</p></div>
      <div class="perk rv" style="--d:.16s"><span class="num">03</span><h3>Kényelmes foglalás</h3><p>Online pár lépésben, regisztráció nélkül — vagy telefonon, ahogy neked egyszerűbb.</p></div>
    </div>
  </div>
</section>

<section class="sec" id="galeria" aria-labelledby="gal-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow rv">Galéria</p><h2 id="gal-h" class="rv">Munkáim</h2></div>
      <p class="rv muted">Beatrix saját munkái. Koppints egy képre a nagyításhoz — lapozni nyilakkal vagy húzással lehet.</p>
    </div>
    <div class="chips chips--scroll" id="galleryChips" role="group" aria-label="Galéria szűrése">
      <button class="chip" type="button" data-filter="all" aria-pressed="true">Mind</button>
      <button class="chip" type="button" data-filter="elenk" aria-pressed="false">Élénk színek</button>
      <button class="chip" type="button" data-filter="pasztell" aria-pressed="false">Pasztell</button>
      <button class="chip" type="button" data-filter="natur" aria-pressed="false">Natúr és elegáns</button>
    </div>
    <div class="gallery" id="gallery"></div>
  </div>
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Galéria nagyítva" aria-hidden="true">
    <div class="lb-top"><span class="lb-count" aria-live="polite"></span><div class="lb-nav"><button class="lb-btn lb-fs" type="button" aria-label="Teljes képernyő">{ico('expand')}</button><button class="lb-btn lb-close" type="button" aria-label="Bezárás">{ico('x')}</button></div></div>
    <div class="lb-stage"></div>
    <div class="lb-bot"><div class="lb-cap"></div><div class="lb-nav"><button class="lb-btn lb-prev" type="button" aria-label="Előző kép">{ico('chev-l')}</button><button class="lb-btn lb-next" type="button" aria-label="Következő kép">{ico('chev-r')}</button></div></div>
  </div>
</section>

<section class="sec" id="gyik" aria-labelledby="gyik-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow rv">Gyakori kérdések</p><h2 id="gyik-h" class="rv">Mielőtt <em>foglalsz</em>.</h2></div>
      <p class="rv muted">Ahol a válasz még Beatrix döntésére vár, ott jelöltük.</p>
    </div>
    <div class="faq rv">{faq_html()}</div>
  </div>
</section>

<section class="sec sec--cream" id="kapcsolat" aria-labelledby="kap-h">
  <div class="wrap contact">
    <div>
      <p class="eyebrow rv">Kapcsolat</p>
      <h2 id="kap-h" class="rv">Időpont egy hívásra, <em>vagy pár kattintásra</em>.</h2>
      <a class="contact-phone rv" data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a>
      <dl class="rv">
        <dt>Helyszín</dt><dd><span data-bind="addr-line2">1111 Budapest</span>, <span data-bind="addr-line1">Bertalan Lajos utca 19.</span><br><span class="tag" data-addr-status>Egyeztetés alatt</span></dd>
        <dt>Nyitvatartás</dt><dd data-bind="opening">Előre egyeztetett időpontok alapján</dd>
        <dt>Foglalás</dt><dd>Online, regisztráció nélkül, vagy telefonon</dd>
      </dl>
      <div class="rv" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:28px">
        <a class="btn" href="foglalas.html">{ico('calendar')}Időpontot foglalok</a>
        <a class="btn btn--ghost" data-tel href="tel:+36706146070">{ico('phone')}Hívás</a>
      </div>
    </div>
    <div class="mapph rv-img">
      {STREETS}
      <div class="inner">{ico('pin')}<h3 style="margin-top:10px">Térkép a helyszín megerősítése után</h3><p>A pontos cím jóváhagyásáig nem élesítünk térképet, útvonaltervezést és parkolási tájékoztatót, hogy senkit ne vezessünk rossz helyre.</p></div>
    </div>
  </div>
</section>
'''

# ======================================================================
# KATEGÓRIA-ALOLDALAK
# ======================================================================
def cat_page(num, cat, h1, lead, art, tone, guide, callout, photos='', extra=''):
    g = ''.join(f'<div class="rv" style="--d:{i*.08}s"><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(guide))
    return f'''
<section class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><a href="index.html#kezelesek">Kezelések</a><span aria-hidden="true">/</span><span aria-current="page">{h1.replace("<em>","").replace("</em>","")}</span></nav>
    <div class="page-hero-grid">
      <div>
        <p class="eyebrow rv">Kezelések · {num}</p>
        <h1 class="rv">{h1}</h1>
        <p class="lead rv">{lead}</p>
        <div class="hero-cta rv" style="margin:28px 0 0"><a class="btn" href="foglalas.html?kategoria={cat}">{ico('calendar')}Időpontot foglalok</a><a class="btn btn--ghost" href="#kezelesek-lista">Kezelések és árak</a></div>
      </div>
      <aside class="sumcard rv" style="--d:.15s"><p class="qb-sub" style="margin-top:0">Kezelések és árak</p><ul class="sum-list" data-cat-list="{cat}"></ul><a class="btn qb-go" href="foglalas.html?kategoria={cat}">{ico('calendar')}Időpontot foglalok</a></aside>
    </div>
  </div>
</section>
{photos}
<section class="sec sec--cream" id="kezelesek-lista" aria-labelledby="kl-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow rv">Kezelések</p><h2 id="kl-h" class="rv">Válaszd ki a <em>hozzád illőt</em>.</h2></div>
    <p class="rv muted">Ár és időtartam minden kártyán — a foglalásnál a kiválasztott kezelés már előre be lesz jelölve. {tag("Időtartam: becsült")}</p></div>
    <div class="svc-cards" data-svc-cards="{cat}"></div>
  </div>
</section>{extra}
<section class="sec" aria-labelledby="g-h">
  <div class="wrap">
    <div class="sec-head sec-head--single"><p class="eyebrow rv">Segítség a választáshoz</p><h2 id="g-h" class="rv">Melyiket <em>válasszam</em>?</h2></div>
    <div class="guide">{g}</div>
  </div>
</section>
<section class="sec" style="padding-top:0">
  <div class="wrap"><div class="callout rv">{callout}</div></div>
</section>'''

PEDIKUR = cat_page('01', 'pedikur', 'Pedikűr és <em>lábápolás</em>',
    'Ápolt, könnyű lábak — esztétikusan és kényelmesen. Esztétikai pedikűr, lábgéllakk, talpmasszázs és három wellness csomag.',
    'labfurdo', 'light',
    [('Alapos ápolást szeretnél', 'A <b>klasszikus esztétikai pedikűr</b>: bőrkeményedés eltávolítása, a körmök rendbetétele, peeling és tápláló krémezés.'),
     ('Színt vagy masszázst is kérnél', 'Az esztétikai pedikűr kérhető <b>lábgéllakkal</b>, <b>talpmasszázzsal</b>, vagy mindkettővel egy alkalommal.'),
     ('Egy kis kényeztetés', 'A <b>wellness pedikűr csomagok</b> (Frissítő, Relax, Deluxe) lábfürdővel, pakolással és hosszabb masszázzsal készülnek, 60–120 percben.')],
    f'<div><h2>Egyéni igényed van?</h2><p>Bőrkeményedés, tyúkszem, benőtt köröm, repedezett sarok: a <a href="specialis-labapolas.html">speciális lábápolást</a> telefonon egyeztetjük.</p></div><div class="acts"><a class="btn" data-tel href="tel:+36706146070">{ico("phone")}Hívás</a><a class="btn btn--ghost" href="specialis-labapolas.html">Bővebben</a></div>',
    photos=f'''<section class="sec" style="padding-bottom:0" aria-label="Beatrix pedikűr munkáiból"><div class="wrap">{shots([('pedikur-1', 'Ápolt lábkörmök pedikűr után — Beatrix munkája', 760, 410), ('pedikur-2', 'Rendezett lábkörmök pedikűr után — Beatrix munkája', 760, 410)], 'shots--two')}</div></section>''')

def extras_html():
    """Díszítés-árlista a manikűr oldalra (forrás: js/config.js extras — itt a statikus változata)."""
    rows = [('Ombre, babyboomer', '250 Ft / köröm'), ('Festett francia', '150 Ft / köröm'),
            ('Egyszerű díszítés <small>porok, matrica, nyomda</small>', '100–300 Ft / köröm'),
            ('Bonyolultabb díszítés <small>porcelán virág, 3D minta</small>', '300–800 Ft / köröm'),
            ('Köröm ékszer', '250–400 Ft / köröm'), ('Teli kövezés', '500–1 100 Ft / köröm'),
            ('Köröm pótlása', 'a szolgáltatás 10%-a / köröm')]
    li = ''.join(f'<li><span>{n}</span><span>{p}</span></li>' for n, p in rows)
    return f'''
<section class="sec" aria-labelledby="dsz-h">
  <div class="wrap extras">
    <div><p class="eyebrow rv">Díszítés</p><h2 id="dsz-h" class="rv">Egy kis <em>extra</em>.</h2>
    <p class="rv">A géllakk és a műköröm ára <b>2 köröm tetszőleges díszítését</b> tartalmazza. Nem tartalmazza a teli kövezést, a festett franciát, az ombre és a babyboomer technikát — ezek árai körmönként:</p></div>
    <ul class="sum-list rv">{li}</ul>
  </div>
</section>'''

MANIKUR = cat_page('02', 'manikur', 'Manikűr és <em>géllakk</em>',
    'Ápolt kéz, tartós szín, gondos kidolgozás. Orosz gépi manikűr, erősített géllakk, műköröm szalonformába és díszítés.',
    'kezpihi', 'cream',
    [('Ápolt, natúr kéz', 'Az <b>orosz gépi manikűr</b> rendbe teszi a körmöket és a bőrt. Mellé jó választás a <b>paraffinos kézápolás</b>.'),
     ('Tartós szín a saját körmön', 'Az <b>erősített géllakk</b> orosz manikűrrel készül, XS vagy S méretben (9 000 / 10 000 Ft). Két köröm díszítése benne van.'),
     ('Hosszabb köröm', 'A <b>műköröm szalonformába</b> XS, S és M méretben készül; a töltés külön kezelés, kedvezőbb áron.')],
    f'<div><h2>Lekerülne a régi?</h2><p>A <b>géllakk eltávolítás manikűrrel</b> és a <b>műköröm eltávolítás</b> külön kezelés — kíméletesen leszedjük, és rendbe tesszük a saját körmöd.</p></div><div class="acts"><a class="btn" href="foglalas.html?kezeles=gellakk-eltavolitas">{ico("calendar")}Eltávolítást foglalok</a></div>',
    photos=f'''<section class="sec" style="padding-bottom:0" aria-label="Beatrix manikűr munkáiból"><div class="wrap">{shots([('magenta-3', 'Magenta géllakk — Beatrix munkája', 760, 408), ('levendula-1', 'Levendula géllakk — Beatrix munkája', 690, 760), ('gyongyhaz-2', 'Gyöngyházfényű géllakk — Beatrix munkája', 760, 456)])}</div></section>''',
    extra=extras_html())

SPECIALIS = f'''
<section class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><a href="index.html#kezelesek">Kezelések</a><span aria-hidden="true">/</span><span aria-current="page">Speciális lábápolás</span></nav>
    <div class="page-hero-grid">
      <div>
        <p class="eyebrow rv">Kezelések · 03</p>
        <h1 class="rv">Speciális <em>lábápolás</em></h1>
        <p class="lead rv">Ha a lábad több figyelmet igényel, a kezelés egy beszélgetéssel kezdődik. Telefonon átbeszéljük, mire van szükséged, és ehhez igazítjuk az időpontot.</p>
        <div class="hero-cta rv" style="margin:28px 0 0"><a class="btn" data-tel href="tel:+36706146070">{ico('phone')}<span data-bind="phone">+36 70 614 6070</span></a></div>
        <p class="rv small muted" style="margin-top:16px">Időpont telefonos egyeztetéssel. <a href="#elotte-utana">Előtte – utána képek</a></p>
      </div>
      <aside class="sumcard rv" style="--d:.15s"><p class="qb-sub" style="margin-top:0">Beatrix árlistája</p><ul class="sum-list" data-cat-list="specialis"></ul><a class="btn qb-go" data-tel href="tel:+36706146070">{ico('phone')}Időpontot egyeztetek</a><p class="small muted" style="margin:12px 0 0">Online nem kérünk egészségügyi adatot.</p></aside>
    </div>
  </div>
</section>
<section class="sec sec--ba" id="elotte-utana" aria-labelledby="ba-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow rv">Előtte – utána</p><h2 id="ba-h" class="rv">Ápolt lábak, <em>egy alkalom után</em>.</h2></div>
      <p class="rv muted">Beatrix saját munkái a speciális pedikűrből, a kezelés előtt és után. Az eredmény a láb állapotától függően egyénenként eltér; a kezelés esztétikai, nem orvosi.</p>
    </div>
    {BA_HTML}
  </div>
</section>

<section class="sec sec--cream" aria-labelledby="hz-h">
  <div class="wrap">
    <div class="sec-head sec-head--single"><p class="eyebrow rv">Menete</p><h2 id="hz-h" class="rv">Így <em>zajlik</em>.</h2></div>
    <div class="guide">
      <div class="rv"><span class="num">01</span><h3 style="margin-top:12px">Felhívsz</h3><p>Elmondod röviden, mire van szükséged. Online nem kérünk egészségügyi adatot — ezért ezt személyesen beszéljük meg.</p></div>
      <div class="rv" style="--d:.08s"><span class="num">02</span><h3 style="margin-top:12px">Közösen döntünk</h3><p>Megbeszéljük, mennyi időt szánjunk rá, és egyeztetünk egy nyugodt időpontot.</p></div>
      <div class="rv" style="--d:.16s"><span class="num">03</span><h3 style="margin-top:12px">Kezelés, kapkodás nélkül</h3><p>A kezelés a te tempódban zajlik, gondos, higiénikus körülmények között.</p></div>
    </div>
  </div>
</section>
<section class="sec" aria-labelledby="fo-h">
  <div class="wrap" style="display:grid;gap:clamp(24px,4vw,56px);grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))">
    <div class="rv">
      <p class="eyebrow">Fontos tudnivaló</p>
      <h2 id="fo-h" style="margin-bottom:18px">Szépségápolás, <em>nem orvosi kezelés</em>.</h2>
      <p>A lábápolás esztétikai és komfortot szolgáló szolgáltatás. Seb, gyulladás, erős fájdalom vagy bármilyen egészségügyi panasz esetén előbb fordulj orvoshoz.</p>
    </div>
    <div class="rv callout" style="grid-template-columns:1fr">
      <div><h2>Cukorbeteg vendég vagy?</h2><p>Kérdezz bátran — telefonon átbeszéljük, mire figyeljünk a kezelés során.</p><p style="margin-top:14px">{tag("Megerősítendő megfogalmazás")}</p></div>
      <div class="acts"><a class="btn" data-tel href="tel:+36706146070">{ico('phone')}Hívás</a></div>
    </div>
  </div>
</section>'''

# ======================================================================
# JOGI HELYŐRZŐK
# ======================================================================
def legal(title, intro, sections):
    s = ''.join(f'<h2>{h}</h2>{b}' for h, b in sections)
    return f'''
<section class="page-hero" style="padding-bottom:var(--sec)">
  <div class="wrap">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
    <div class="legal">
      <p class="eyebrow">Tudnivalók</p>
      <h1>{title}</h1>
      <div class="box"><p style="margin:0"><b>Tervezet helye — nem végleges jogi dokumentum.</b> {intro}</p></div>
      {s}
    </div>
  </div>
</section>'''

ADATKEZELES = legal('Adatkezelési tájékoztató',
    'A végleges szöveget az adatkezelő (Balogh Beatrix vagy vállalkozása) adataival, jogi szakember bevonásával kell elkészíteni. Az alábbi vázlat azt mutatja, mi kerül majd ide.',
    [('Ebben a bemutatóban', '<p>A bemutató foglalás <b>semmilyen adatot nem továbbít</b>: amit beírsz, az csak a saját böngésződ helyi tárolójában marad, és bármikor törölhető. Nem küldünk e-mailt és nem rögzítünk valódi időpontot.</p>'),
     ('Adatkezelő', '<ul><li>Név, székhely, elérhetőség — <i>ügyféltől bekérendő</i></li></ul>'),
     ('Milyen adatokat kér a foglalás', '<ul><li>Név, e-mail-cím, telefonszám — a foglalás teljesítéséhez és visszaigazolásához</li><li>Megjegyzés (nem kötelező) — kifejezetten nem egészségügyi adat céljára</li><li>Marketing-hozzájárulás — külön, önkéntes, alapból nincs bejelölve</li></ul><p>Születési dátumot, egészségügyi előzményt vagy diagnózist a rendszer nem kér és nem tárol.</p>'),
     ('Cél, jogalap, megőrzési idő', '<p><i>Jogi szakember által véglegesítendő.</i></p>'),
     ('Adatfeldolgozók', '<ul><li>Tárhelyszolgáltató — <i>kiválasztandó</i></li><li>Tranzakciós e-mail küldő szolgáltatás — <i>kiválasztandó</i></li></ul>'),
     ('Jogaid', '<p>Hozzáférés, helyesbítés, törlés, korlátozás, tiltakozás, adathordozhatóság; panasz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál. <i>Pontos megfogalmazás véglegesítendő.</i></p>'),
     ('Sütik', '<p>A bemutató nem használ követő vagy marketing sütit. Az éles oldalon sütitájékoztató csak akkor kell, ha ténylegesen lesz ilyen süti (pl. analitika).</p>')])

IMPRESSZUM = legal('Impresszum',
    'A szolgáltató hivatalos adatait az ügyféltől kell bekérni és ellenőrizni.',
    [('Szolgáltató', '<ul><li>Név: Balogh Beatrix — <i>vállalkozási forma és hivatalos név megerősítendő</i></li><li>Székhely, adószám, nyilvántartási szám — <i>bekérendő</i></li><li>Telefon: <a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a></li><li>E-mail — <i>bekérendő</i></li></ul>'),
     ('Tárhelyszolgáltató', '<p><i>Kiválasztandó.</i></p>'),
     ('A weboldal készítője', '<p>DAEKON — <a href="https://daekon.hu" rel="noopener">daekon.hu</a></p>')])

FELTETELEK = legal('Foglalási és lemondási feltételek',
    'A szabályokat Beatrix határozza meg; az alábbi kérdésekre kell válasz a végleges szöveghez.',
    [('Eldöntendő kérdések', '<ul><li>Meddig lehet díjmentesen lemondani vagy módosítani (pl. 24 órával előtte)?</li><li>Mi történik késés esetén — rövidül a kezelés, vagy új időpont kell?</li><li>Van-e következménye az előzetes lemondás nélküli távolmaradásnak?</li><li>Kell-e előleg bármelyik kezeléshez? (A bemutató nem kezel fizetést.)</li><li>Milyen fizetési módok elérhetők a helyszínen?</li></ul>'),
     ('A tervezett rendszer működése', '<p>Foglalás után visszaigazoló e-mail egyedi foglalási azonosítóval, naptármeghívóval és egy biztonságos módosítási/lemondási linkkel; a kezelés előtt emlékeztető. Regisztráció nem szükséges.</p>')])

# ======================================================================
# KONCEPCIÓ
# ======================================================================
KONCEPCIO = f'''
<section class="page-hero" style="padding-bottom:var(--sec)">
  <div class="wrap legal">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><span aria-current="page">Tervezési koncepció</span></nav>
    <p class="eyebrow">DAEKON · látványterv · bemutató változat</p>
    <h1>Púderes, nyugodt, <em>Beatrix saját munkáival</em>.</h1>
    <p class="lead" style="margin-top:18px">A látványterv Beatrix logójára, árlistájára és munkafotóira épül. A színvilág (púderes fehér, mély szilva, fáradt rózsa, levendula) a körmök és az árlista hangulatát követi; a betű egyetlen, jól olvasható család (Hanken Grotesk).</p>
    <h2>Mi van a bemutató változatban</h2>
    <ul>
      <li>Nyitókép Beatrix fotóiból, forgó feliratos jelvénnyel és élő gyorsfoglalóval.</li>
      <li>Árlista Beatrix saját árlistájáról (25 tétel), szűrhető, egy kattintással foglalható.</li>
      <li>Kiemelt speciális lábápolás; az előtte–utána képek külön, jóváhagyáshoz kötött galériában.</li>
      <li>Hatlépéses foglalás ütközésellenőrzéssel és admin demó — mindkettő csak bemutató, éles foglalás és e-mail nincs.</li>
      <li>Animációk: Motion (motion.dev), csökkentett mozgás kérésekor kikapcsolnak.</li>
    </ul>
    <h2>Mi nem aktív</h2>
    <ul><li>Éles foglalás, e-mail- és SMS-küldés.</li><li>Jogi dokumentumok (csak vázlat helyek).</li><li>Térkép, amíg a pontos cím nincs jóváhagyva.</li></ul>
    <p class="small muted">Jóváhagyandó tételek: <a href="jovahagyas.html">jóváhagyási lista</a>. Korábbi anyagok: <a href="iranyok.html">irányok</a> · <a href="betuk.html">betűválasztó</a>.</p>
  </div>
</section>'''



JOVAHAGYAS = '''
<section class="page-hero" style="padding-bottom:var(--sec)">
  <div class="wrap">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><span aria-current="page">Jóváhagyási lista</span></nav>
    <div class="legal legal--wide">
      <p class="eyebrow">Látványterv · Beatrix jóváhagyására vár</p>
      <h1>Jóváhagyási lista</h1>
      <div class="box"><p style="margin:0"><b>Egyetlen árat sem módosítottunk önállóan.</b> Az oldalon Beatrix A4-es kézápolás-árlistája és a lábápolási / wellness / díszítés árlistái szerepelnek. Ahol két forrás eltér, azt itt jelöljük — a döntés Beatrixé.</p></div>
      <h2>1. Kézápolás — két eltérő árlista</h2><div class="apr-wrap"><table class="apr"><thead><tr><th scope="col">Tétel</th><th scope="col">Az oldalon most<br><small>(A4-es lista)</small></th><th scope="col">Másik árlista<br><small>(régebbi, álló)</small></th><th scope="col">Állapot</th></tr></thead><tbody><tr><td>Orosz gépi manikűr</td><td>5 500 Ft</td><td>5 000 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Paraffinos kézápolás</td><td>6 500 Ft</td><td>5 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Géllakk eltávolítás manikűrrel</td><td>6 500 Ft</td><td>5 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Erősített géllakk — XS</td><td>9 000 Ft</td><td>8 000 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Erősített géllakk — S</td><td>10 000 Ft</td><td>8 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Műköröm XS — építés / töltés</td><td>9 500 / 8 500 Ft</td><td>8 500 / 8 000 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Műköröm S — építés / töltés</td><td>12 000 / 11 000 Ft</td><td>10 000 / 9 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Műköröm M — építés / töltés</td><td>14 000 / 13 000 Ft</td><td>11 000 / 10 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Műköröm L — építés / töltés</td><td><i>nem szerepel</i></td><td>13 000 / 12 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Rágott körömre építés</td><td><i>nem szerepel</i></td><td>+2 000 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Műköröm eltávolítás manikűrrel</td><td>6 500 Ft <small>(Notino-profilról, Beatrix listáin így nincs)</small></td><td>5 500 Ft</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Köröm pótlása</td><td>a szolgáltatás 10%-a / köröm</td><td>ugyanaz</td><td><span class="pill-s">Megerősítendő</span></td></tr></tbody></table></div>
      <h2>2. Notino-profil — régi referenciaárak</h2><p>A Notino-profilon más árak és kezelésnevek szerepelnek. Az oldal Beatrix saját árlistáját követi; javasolt a Notino-adatlap frissítése.</p><div class="apr-wrap"><table class="apr"><thead><tr><th scope="col">Tétel a Notino-profilon</th><th scope="col">Notino</th><th scope="col">Beatrix árlistája (az oldalon)</th><th scope="col">Javaslat</th></tr></thead><tbody><tr><td>Klasszikus pedikűr (80 perc)</td><td>9 500 Ft</td><td>Klasszikus esztétikai pedikűr — 8 500 Ft</td><td>Notino frissítése</td></tr><tr><td>Vizes pedikűr géllakkozással (100 perc)</td><td>13 500 Ft</td><td>Esztétikai pedikűr + lábgéllakk — 12 500 Ft</td><td>Notino frissítése</td></tr><tr><td>Géllakkozás lábra</td><td>8 500 Ft</td><td>Lábgéllakk — 7 500 Ft</td><td>Notino frissítése</td></tr><tr><td>Lábgéllakk eltávolítás + mini pedikűr (90 perc)</td><td>8 500 Ft</td><td>6 500 Ft</td><td>Notino frissítése</td></tr></tbody></table></div>
      <h2>3. Időtartamok</h2><p>A foglalási naptár ezekből számol, ezért a becsült értékeket pontosítani kell.</p><div class="apr-wrap"><table class="apr"><thead><tr><th scope="col">Kezelés</th><th scope="col">Becsült idő az oldalon</th><th scope="col">Forrás</th></tr></thead><tbody><tr><td>Klasszikus esztétikai pedikűr</td><td>60 perc</td><td>becslés</td></tr><tr><td>Esztétikai pedikűr + lábgéllakk</td><td>90 perc</td><td>becslés</td></tr><tr><td>Esztétikai pedikűr + talpmasszázs</td><td>90 perc</td><td>becslés</td></tr><tr><td>Esztétikai pedikűr + talpmasszázs + lábgéllakk</td><td>120 perc</td><td>becslés</td></tr><tr><td>Lábgéllakk (teli szín vagy francia)</td><td>60 perc</td><td>becslés</td></tr><tr><td>Lábgéllakk végleges eltávolítása + mini pedikűr</td><td>60 perc</td><td>becslés</td></tr><tr><td>Paraffinos lábápolás</td><td>30 perc</td><td>becslés</td></tr><tr><td>Orosz gépi manikűr</td><td>45 perc</td><td>becslés</td></tr><tr><td>Paraffinos kézápolás</td><td>45 perc</td><td>becslés</td></tr><tr><td>Géllakk eltávolítás manikűrrel</td><td>60 perc</td><td>becslés</td></tr><tr><td>Erősített géllakk XS / S</td><td>90 / 100 perc</td><td>becslés</td></tr><tr><td>Műköröm XS / S / M</td><td>120 / 135 / 150 perc</td><td>becslés</td></tr><tr><td>Műköröm eltávolítás manikűrrel</td><td>60 perc</td><td>becslés</td></tr><tr><td>Talpmasszázs</td><td>30 perc</td><td>Beatrix árlistája ✓</td></tr><tr><td>Wellness Frissítő / Relax / Deluxe</td><td>60 / 90 / 120 perc</td><td>Beatrix árlistája ✓</td></tr><tr><td>Speciális tételek (5)</td><td>— (telefonos egyeztetés)</td><td>megerősítendő</td></tr></tbody></table></div>
      <h2>4. Szövegek, cím, egyéb adatok</h2><div class="apr-wrap"><table class="apr"><thead><tr><th scope="col">Téma</th><th scope="col">Jelenleg az oldalon</th><th scope="col">Állapot</th></tr></thead><tbody><tr><td>Pontos cím</td><td>Budapest XI., Bertalan Lajos u. 19. — „egyeztetés alatt” címkével. Másik ismert cím: Nagykáta, Dózsa György út 21. Térkép nincs élesítve.</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Bemutatkozó szöveg és idézet</td><td>„Rólam” rész — „Jóváhagyandó bemutatkozó szöveg” címkével</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Márkanév</td><td>Beatrix Nails &amp; Pedikűr (a logó alapján), mellette Balogh Beatrix</td><td><span class="pill-s">Megerősítendő</span></td></tr><tr><td>Logó</td><td>A küldött JPG-ből vektorizált SVG; élesítéshez az eredeti vektoros fájl kell</td><td><span class="pill-s">Megerősítendő</span></td></tr><tr><td>Nyitvatartás, munkarend, 15 perces puffer</td><td>Bemutató értékek a foglalási naptárban</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Fizetési módok, lemondási határidő</td><td>GYIK-ben „Megerősítendő” címkével</td><td><span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Cukorbeteg vendégekre vonatkozó mondat</td><td>Speciális lábápolás oldal, „Megerősítendő megfogalmazás”</td><td><span class="pill-s">Megerősítendő</span></td></tr><tr><td>Wellness Deluxe: „francia vagy téli szín”</td><td>Az oldalon „teli szín” — valószínű elírás az árlistán</td><td><span class="pill-s">Megerősítendő</span></td></tr><tr><td>Ajándékutalvány</td><td>Levéve (nem ismert, hogy Beatrix árul-e)</td><td><span class="pill-s">Megerősítendő</span></td></tr></tbody></table></div>
      <h2>5. Fotók és hozzájárulás</h2><div class="apr-wrap"><table class="apr"><thead><tr><th scope="col">Képcsoport</th><th scope="col">Hol látszik</th><th scope="col">Állapot</th></tr></thead><tbody><tr><td>Manikűr / géllakk fotók (12 db, arcok kivágva)</td><td>Főoldal: nyitókép, fotószalag, galéria; manikűr oldal</td><td>Vendég-hozzájárulás <span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Pedikűr utáni lábfotók (2 db)</td><td>Pedikűr oldal</td><td>Vendég-hozzájárulás <span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Előtte–utána párok (3 pár)</td><td>Csak a speciális lábápolás oldalon, „belső bemutató” fátyol mögött</td><td>Hozzájárulás + párosítás <span class="pill-s pill-s--warn">Döntés kell</span></td></tr><tr><td>Nem párosítható biztosan (4 kép)</td><td>Nem szerepel az oldalon</td><td>Beatrix döntése: pár vagy kihagyás</td></tr><tr><td>Problémás láb a főoldalon</td><td>Nincs (a brief szerint)</td><td>✓</td></tr></tbody></table></div>
      <h2>6. Szándékosan nem aktív</h2><div class="apr-wrap"><table class="apr"><thead><tr><th scope="col">Funkció</th><th scope="col">Állapot</th></tr></thead><tbody><tr><td>Online foglalás</td><td>Bemutató — a böngészőben tárolt mintaadatok, valódi időpont nem jön létre <span class="pill-s pill-s--off">Nem aktív</span></td></tr><tr><td>Visszaigazoló e-mail, emlékeztető</td><td>Nincs küldés, csak szimulált értesítés az adminban <span class="pill-s pill-s--off">Nem aktív</span></td></tr><tr><td>Admin felület</td><td>Bejelentkezés nélküli demó, mintaadatokkal <span class="pill-s pill-s--off">Nem aktív</span></td></tr><tr><td>Adatkezelési tájékoztató, feltételek, impresszum</td><td>Vázlat helyek, jogi szakember bevonásával készítendők <span class="pill-s pill-s--off">Nem aktív</span></td></tr></tbody></table></div>
    </div>
  </div>
</section>'''

PAGES = [
    ('index.html', 'Beatrix Nails & Pedikűr | Pedikűr, lábápolás, manikűr — Balogh Beatrix',
     'Esztétikai és wellness pedikűr, lábgéllakk, talpmasszázs, orosz gépi manikűr, erősített géllakk, műköröm és speciális lábápolás. Foglalj időpontot online.', INDEX, True),
    ('pedikur.html', 'Pedikűr és lábápolás | Beatrix Nails & Pedikűr',
     'Esztétikai pedikűr, lábgéllakk, talpmasszázs, paraffinos lábápolás és wellness pedikűr csomagok — árak és online időpontfoglalás.', PEDIKUR, False),
    ('manikur.html', 'Manikűr és géllakk | Beatrix Nails & Pedikűr',
     'Orosz gépi manikűr, erősített géllakk, műköröm szalonformába, díszítés és paraffinos kézápolás — árak és online foglalás.', MANIKUR, False),
    ('specialis-labapolas.html', 'Speciális lábápolás — telefonos egyeztetés | Beatrix Nails & Pedikűr',
     'Speciális pedikűr, állapotfelmérés, benőtt köröm, körömkorrekció — előzetes telefonos egyeztetéssel. Esztétikai kezelés, nem orvosi ellátás.', SPECIALIS, False),
    ('adatkezeles.html', 'Adatkezelési tájékoztató | Beatrix Nails & Pedikűr', 'Adatkezelési tájékoztató — tervezet helye.', ADATKEZELES, False),
    ('impresszum.html', 'Impresszum | Beatrix Nails & Pedikűr', 'Impresszum — tervezet helye.', IMPRESSZUM, False),
    ('feltetelek.html', 'Foglalási és lemondási feltételek | Beatrix Nails & Pedikűr', 'Foglalási és lemondási feltételek — tervezet helye.', FELTETELEK, False),
    ('koncepcio.html', 'Tervezési koncepció | Beatrix Nails & Pedikűr látványterv', 'A látványterv irányai és az aktuális kör változásai.', KONCEPCIO, False),
    ('jovahagyas.html', 'Jóváhagyási lista | Beatrix Nails & Pedikűr látványterv', 'Árak, időtartamok, szövegek és fotók — Beatrix jóváhagyására váró tételek.', JOVAHAGYAS, False),
]

if __name__ == '__main__':
    for fname, title, desc, body, is_index in PAGES:
        page(fname, title, desc, body, is_index=is_index)
    # a foglalás és az admin saját vázat kap (booking.py / admin.py)
    import booking_page, admin_page  # noqa
    booking_page.build(globals())
    admin_page.build(globals())
