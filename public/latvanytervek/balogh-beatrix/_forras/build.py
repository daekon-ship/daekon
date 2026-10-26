#!/usr/bin/env python3
"""Balogh Beatrix látványterv — statikus oldalak generálása.

Futtatás:  python3 _forras/build.py   (a balogh-beatrix mappából)
A közös fejléc, lábléc, ikonkészlet és menü itt van egy helyen; a tartalmi
szakaszok a PAGES szótárban. Az üzleti adatok (telefon, cím, árak) NEM itt
vannak, hanem a js/config.js-ben — azokat a böngésző tölti be.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
V = '20261026b'
# Motion (https://motion.dev) — vanilla JS build, rögzített verzió; ha nem tölt be, CSS-tartalék fut
MOTION_TAG = '\n<script src="https://cdn.jsdelivr.net/npm/motion@11.18.2/dist/motion.js" crossorigin="anonymous"></script>'  # gyorsítótár-törő verzió

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
    return f'<svg class="ico {cls}" aria-hidden="true"><use href="#i-{name}"/></svg>'

def head(title, desc, extra_css=''):
    return f'''<!doctype html>
<html lang="hu" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F7F4EF">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="img/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
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
SUBS = [('Pedikűr és lábápolás', 'pedikur.html', '4 kezelés'), ('Manikűr és géllakk', 'manikur.html', '4 kezelés'),
        ('Speciális lábápolás', 'specialis-labapolas.html', 'telefonos egyeztetés')]

def link(href, is_index):
    if is_index and href.startswith('index.html#'):
        return href[len('index.html'):]
    return href

def header(current, is_index=False):
    items = []
    for label, href, key in NAV:
        if href is None:
            subs = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if current == h else ""}><span>{l}</span><small>{m}</small></a>' for l, h, m in SUBS)
            subs += f'<a href="{link("index.html#arak", is_index)}"><span>Teljes árlista</span><small>8 kezelés</small></a>'
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
    <a class="brand" href="index.html" aria-label="Balogh Beatrix — kezdőlap"><img class="logo" src="arculat/logo-kez-fejlec.svg" alt="Balogh Beatrix — kéz- és lábápolás" width="400" height="124"></a>
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
        <a class="brand" href="index.html" style="margin-bottom:22px"><img class="logo" src="arculat/logo-kez-fejlec-sotet.svg" alt="Balogh Beatrix — kéz- és lábápolás" width="400" height="124"></a>
        <p style="max-width:24em">Kéz- és lábápolás előre egyeztetett időpontban.</p>
        <p><a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a><br><span data-bind="addr-line2">1111 Budapest</span>, <span data-bind="addr-line1">Bertalan Lajos utca 19.</span> <span class="tag" data-addr-status>Egyeztetés alatt</span></p>
      </div>
      <div><h4>Kezelések</h4><ul>
        <li><a href="pedikur.html">Pedikűr és lábápolás</a></li><li><a href="manikur.html">Manikűr és géllakk</a></li>
        <li><a href="specialis-labapolas.html">Speciális lábápolás</a></li><li><a href="{l('index.html#arak')}">Árlista</a></li>
        <li><a href="{l('index.html#utalvany')}">Ajándékutalvány</a></li></ul></div>
      <div><h4>Foglalás</h4><ul>
        <li><a href="foglalas.html">Időpontfoglalás</a></li><li><a href="foglalas.html#foglalasaim">Foglalásaim (demó)</a></li>
        <li><a href="{l('index.html#gyik')}">Gyakori kérdések</a></li><li><a href="admin.html">Admin demó</a></li></ul></div>
      <div><h4>Tudnivalók</h4><ul>
        <li><a href="adatkezeles.html">Adatkezelési tájékoztató</a></li><li><a href="feltetelek.html">Foglalási és lemondási feltételek</a></li>
        <li><a href="impresszum.html">Impresszum</a></li><li><a href="arculat/">Logó és arculat</a></li><li><a href="koncepcio.html">Tervezési koncepció</a></li></ul></div>
    </div>
    <div class="ftr-bot">
      <span>© <span data-year>2026</span> Balogh Beatrix · látványterv, nem éles weboldal</span>
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

STREETS = '''<svg class="streets" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#CDBFAF" stroke-width="10" stroke-linecap="round"><path d="M-20 120 C 120 140, 260 90, 620 130"/><path d="M80 -20 L 140 420"/><path d="M-20 300 L 620 260"/><path d="M360 -20 C 340 120, 400 260, 380 420"/><path d="M500 -20 L 470 420"/></g><g fill="none" stroke="#DFD4C7" stroke-width="4"><path d="M-20 210 L 620 200"/><path d="M240 -20 L 260 420"/><path d="M-20 40 L 300 0"/></g><circle cx="300" cy="200" r="7" fill="#BE9A7B"/><circle cx="300" cy="200" r="20" fill="none" stroke="#BE9A7B" opacity=".5"/></svg>'''

# ======================================================================
# KEZDŐLAP
# ======================================================================
FAQ = [
    ('Hogyan foglalhatok időpontot?',
     '<p>Az oldalon pár lépésben: kiválasztod a kezelést, a napot és a szabad időpontot, majd megadod a neved, e-mail-címed és telefonszámod. Regisztráció nem kell. Ha inkább beszélnél, hívj a <a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a> számon.</p>'
     '<p class="small muted">Ez a bemutató változat valódi időpontot nem rögzít.</p>'),
    ('Milyen pedikűrkezelést válasszak?',
     '<p><b>Klasszikus pedikűr</b> (80 perc): alapos láb- és körömápolás. <b>Vizes pedikűr géllakkozással</b> (100 perc): áztatással induló teljes kezelés, tartós színnel. Ha csak a régi lakkot vinnéd le egy frissítő ápolással, a <b>lábgéllakk eltávolítás + mini pedikűr</b> (90 perc) a jó választás. Bizonytalan vagy? Hívj, és együtt kiválasztjuk.</p>'),
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
     '<p>45 és 100 perc között — minden kezelésnél előre látod az időtartamot az <a href="#arak">árlistában</a>. A foglalási rendszer csak olyan kezdési időpontot kínál, amelybe a teljes kezelés belefér.</p>'),
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
      <aside class="qb rv" style="--d:.2s" aria-labelledby="qb-h">
        <div class="qb-head"><h2 id="qb-h">Gyorsfoglalás</h2><span>Bemutató</span></div>
        <div class="qb-svcs" role="radiogroup" aria-label="Kezelés"></div>
        <p class="qb-sub">Legközelebbi szabad időpontok</p>
        <div class="qb-slots"></div>
        <a class="btn qb-go" href="foglalas.html">Tovább a foglaláshoz</a>
        <p class="qb-note">A szabad időpontok mintaadatok — valódi foglalás nem történik.</p>
      </aside>
    </div>
  </div>
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
        <div><div class="cat-top"><span class="num">01</span><span class="small muted">4 kezelés</span></div>
        <h3>Pedikűr és lábápolás</h3>
        <p>Klasszikus és vizes pedikűr, lábgéllakk és eltávolítás — esztétika és komfort, alaposan.</p>
        <ul data-cat-list="pedikur"></ul>
        <div class="cat-actions"><a class="link" href="pedikur.html">Részletek {ico('arrow')}</a><a class="link" href="foglalas.html?kategoria=pedikur">Foglalás</a></div></div>
      </article>
      <article class="cat cat--2 rv" style="--d:.08s">
        <div><div class="cat-top"><span class="num">02</span><span class="small muted">4 kezelés</span></div>
        <h3>Manikűr és géllakk</h3>
        <p>Gépi manikűr, erősített géllakk, paraffinos kézápolás — tartós szín, visszafogott elegancia.</p>
        <ul data-cat-list="manikur"></ul>
        <div class="cat-actions"><a class="link" href="manikur.html">Részletek {ico('arrow')}</a><a class="link" href="foglalas.html?kategoria=manikur">Foglalás</a></div></div>
      </article>
      <article class="cat cat--3 rv" style="--d:.16s">
        <div><div class="cat-top"><span class="num">03</span><span class="small muted">Telefonos egyeztetés</span></div>
        <h3>Speciális lábápolás</h3>
        <p>Ha a lábad több figyelmet kér, előbb beszéljük át telefonon. Az időpontot és a kezelés menetét ehhez igazítjuk.</p>
        <ul><li><span>Ár és időtartam</span><span>egyeztetés után</span></li><li><span>Foglalás</span><span>telefonon</span></li></ul>
        <div class="cat-actions"><a class="link" href="specialis-labapolas.html">Részletek {ico('arrow')}</a><a class="link" data-tel href="tel:+36706146070">Hívás</a></div></div>
      </article>
    </div>
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
    <p class="prices-note">{tag("Referenciaárak")} A Notino-profilon szereplő árak alapján — a végleges árlistát Beatrix hagyja jóvá.</p>
  </div>
</section>

<section class="sec" id="rolam" aria-labelledby="rol-h">
  <div class="wrap about">
    <div class="portrait rv-img">
      <span class="frame-label">Portré helye</span>
      <div class="portrait-inner"><img src="arculat/jel-kez.svg" alt="" width="96" height="96" style="margin:0 auto 12px"><p>Ide Beatrix saját portréja kerül, a szalonban, természetes fényben.</p></div>
    </div>
    <div>
      <p class="eyebrow rv">Rólam</p>
      <h2 id="rol-h" class="rv" style="margin-bottom:26px">Balogh Beatrix</h2>
      <blockquote class="rv">„Nálam a kezelés nem rohanás: időt szánok rá, hogy minden részlet a helyére kerüljön.”</blockquote>
      <div class="rv">
      <p>A szalonomban nyugodt, személyes légkörben dolgozom. Fontos számomra a gondos, igényes munka és a higiénikus környezet — hogy a kezelés alatt valóban kikapcsolhass. Lábápolásra nőket és férfiakat egyaránt szívesen várok.</p>
      <ul class="about-list"><li>Klasszikus és esztétikai pedikűr</li><li>Lábgéllakkozás</li><li>Gépi manikűr, erősített géllakk</li><li>Paraffinos kézápolás</li></ul>
      <p class="about-sign">Beatrix</p>
      <p style="margin-top:22px">{tag("Jóváhagyandó bemutatkozó szöveg")}</p>
      </div>
    </div>
  </div>
</section>

<section class="sec sec--dark" aria-labelledby="elo-h">
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
      <p class="rv muted">Ide Beatrix saját munkafotói kerülnek — a szűrés, a nagyítás és a lapozás már működik. Az éles változatban a képek az adminból tölthetők fel.</p>
    </div>
    <div class="chips chips--scroll" id="galleryChips" role="group" aria-label="Galéria szűrése">
      <button class="chip" type="button" data-filter="all" aria-pressed="true">Mind</button>
      <button class="chip" type="button" data-filter="pedikur" aria-pressed="false">Pedikűr</button>
      <button class="chip" type="button" data-filter="manikur" aria-pressed="false">Manikűr</button>
      <button class="chip" type="button" data-filter="gellakk" aria-pressed="false">Géllakk</button>
      <button class="chip" type="button" data-filter="szalon" aria-pressed="false">Szalon</button>
    </div>
    <div class="gallery" id="gallery"></div>
  </div>
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Galéria nagyítva" aria-hidden="true">
    <div class="lb-top"><span class="lb-count" aria-live="polite"></span><div class="lb-nav"><button class="lb-btn lb-fs" type="button" aria-label="Teljes képernyő">{ico('expand')}</button><button class="lb-btn lb-close" type="button" aria-label="Bezárás">{ico('x')}</button></div></div>
    <div class="lb-stage"></div>
    <div class="lb-bot"><div class="lb-cap"></div><div class="lb-nav"><button class="lb-btn lb-prev" type="button" aria-label="Előző kép">{ico('chev-l')}</button><button class="lb-btn lb-next" type="button" aria-label="Következő kép">{ico('chev-r')}</button></div></div>
  </div>
</section>

<section class="sec sec--cream" id="utalvany" aria-labelledby="ut-h">
  <div class="wrap voucher-wrap">
    <div class="voucher rv" aria-hidden="true">
      <div class="voucher-top"><img src="arculat/jel-kez.svg" alt="" style="height:48px;width:48px"><small>Ajándékutalvány<br>N° 0001</small></div>
      <h3>Egy nyugodt óra,<br>neked szánva.</h3>
      <div class="voucher-bot"><span>Érvényes egy választott kezelésre</span><b>Balogh Beatrix</b></div>
    </div>
    <div>
      <p class="eyebrow rv">Ajándék</p>
      <h2 id="ut-h" class="rv" style="margin-bottom:20px">Ajándékozz egy <em>nyugodt órát</em>.</h2>
      <p class="rv">Utalvány egy kiválasztott kezelésre — pedikűrre, manikűrre vagy paraffinos kézápolásra. Elegáns, kézbe adható ajándék szülinapra, névnapra, vagy csak úgy.</p>
      <p class="rv small muted">Az online vásárlás és fizetés egy későbbi, külön jóváhagyott fejlesztés. Addig az utalványról telefonon lehet érdeklődni.</p>
      <p class="rv">{tag("Bemutató szekció · ügyféllel egyeztetendő")}</p>
      <div class="rv" style="margin-top:24px"><a class="btn btn--ghost" data-tel href="tel:+36706146070">{ico('phone')}Érdeklődöm telefonon</a></div>
    </div>
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
def cat_page(num, cat, h1, lead, art, tone, guide, callout):
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
<section class="sec sec--cream" id="kezelesek-lista" aria-labelledby="kl-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow rv">Kezelések</p><h2 id="kl-h" class="rv">Válaszd ki a <em>hozzád illőt</em>.</h2></div>
    <p class="rv muted">Ár és időtartam minden kártyán — a foglalásnál a kiválasztott kezelés már előre be lesz jelölve. {tag("Referenciaárak")}</p></div>
    <div class="svc-cards" data-svc-cards="{cat}"></div>
  </div>
</section>
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
    'Ápolt, könnyű lábak — esztétikusan és kényelmesen. Minden kezelésnél előre látod az időtartamot és az árat, a foglalás pedig pár lépés.',
    'labfurdo', 'light',
    [('Alapos ápolást szeretnél', 'A <b>klasszikus pedikűr</b> a láb és a lábkörmök teljes ápolása — szín nélkül, 80 percben.'),
     ('Színt is kérnél', 'A <b>vizes pedikűr géllakkozással</b> a legteljesebb kezelés. Ha a lábad rendben van és csak szín kell, elég a <b>géllakkozás lábra</b>.'),
     ('Lekerülne a régi lakk', 'A <b>lábgéllakk eltávolítás + mini pedikűr</b> kíméletesen leszedi a régi lakkot, és egy rövidebb ápolással frissít.')],
    f'<div><h2>Egyéni igényed van?</h2><p>Ha a lábad több figyelmet igényel, a <a href="specialis-labapolas.html">speciális lábápolást</a> telefonon egyeztetjük.</p></div><div class="acts"><a class="btn" data-tel href="tel:+36706146070">{ico("phone")}Hívás</a><a class="btn btn--ghost" href="specialis-labapolas.html">Bővebben</a></div>')

MANIKUR = cat_page('02', 'manikur', 'Manikűr és <em>géllakk</em>',
    'Ápolt kéz, tartós szín, egy kis csend a nap közepén. Gépi manikűr, erősített géllakk és paraffinos kézápolás.',
    'kezpihi', 'cream',
    [('Ápolt, natúr kéz', 'A <b>gépi manikűr</b> rendbe teszi a körmöket és a bőrt, formára igazítva — 45 perc.'),
     ('Tartós szín', 'Az <b>erősített géllakk</b> a saját körmön készül, erősítő alapréteggel. Az ár 9 000–10 000 Ft között, a köröm hosszától és állapotától függően.'),
     ('Egy kis pihenés', 'A <b>paraffinos kézápolás</b> meleg pakolás a kéz bőrének. Önmagában vagy manikűr mellé is jó választás.')],
    f'<div><h2>Műkörmöt viselsz?</h2><p>A <b>műköröm eltávolítás</b> külön kezelés — kíméletesen leszedjük, és előkészítjük a saját körmöd.</p></div><div class="acts"><a class="btn" href="foglalas.html?kezeles=mukorom-eltavolitas">{ico("calendar")}Eltávolítást foglalok</a></div>')

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
        <p class="rv small muted" style="margin-top:16px">Ár és időtartam: egyeztetés után. {tag("Jóváhagyásra vár")}</p>
      </div>
      <aside class="sumcard rv" style="--d:.15s"><p class="qb-sub" style="margin-top:0">Időpont egyeztetése</p><a class="contact-phone" data-tel href="tel:+36706146070" data-bind="phone" style="margin:4px 0 14px">+36 70 614 6070</a><p class="small muted" style="margin:0">Ár és időtartam az egyeztetés után derül ki. Online nem kérünk egészségügyi adatot.</p></aside>
    </div>
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
    [('Eldöntendő kérdések', '<ul><li>Meddig lehet díjmentesen lemondani vagy módosítani (pl. 24 órával előtte)?</li><li>Mi történik késés esetén — rövidül a kezelés, vagy új időpont kell?</li><li>Van-e következménye az előzetes lemondás nélküli távolmaradásnak?</li><li>Kell-e előleg bármelyik kezeléshez? (A bemutató nem kezel fizetést.)</li><li>Milyen fizetési módok elérhetők a helyszínen?</li><li>Ajándékutalvány: érvényesség, beválthatóság.</li></ul>'),
     ('A tervezett rendszer működése', '<p>Foglalás után visszaigazoló e-mail egyedi foglalási azonosítóval, naptármeghívóval és egy biztonságos módosítási/lemondási linkkel; a kezelés előtt emlékeztető. Regisztráció nem szükséges.</p>')])

# ======================================================================
# KONCEPCIÓ
# ======================================================================
KONCEPCIO = f'''
<section class="page-hero">
  <div class="wrap legal">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><span aria-current="page">Tervezési koncepció</span></nav>
    <p class="eyebrow">DAEKON · látványterv · 2. kör</p>
    <h1>Tiszta, meleg, <em>könnyen foglalható</em>.</h1>
    <p class="lead" style="margin-top:18px">Az első kör rajzolt illusztrációit és talpas betűit elvetettük. A második kör egyetlen, jól olvasható betűvel (Hanken Grotesk) és kép nélküli, színekkel tagolt felülettel dolgozik — a nyitóképen maga a foglalás áll. A fotóhelyekre Beatrix saját képei kerülnek.</p>
    <h2>Mi változott</h2>
    <ul><li>Betű: Hanken Grotesk mindenhol, mérsékelt méretekkel.</li><li>Nyitókép: élő gyorsfoglaló kártya kezelésválasztással és a legközelebbi szabad időpontokkal.</li><li>Kezelések: színkódolt kártyák (pedikűr — homok, manikűr — zsálya, speciális — eszpresszó).</li><li>Illusztrációk törölve; galéria és portré csak saját fotóval.</li></ul>
    <p class="small muted">Korábbi anyagok: <a href="iranyok.html">három irány</a> · <a href="betuk.html">betűválasztó</a>. Részletes átadás: <code>ATADAS.md</code>.</p>
  </div>
</section>'''

PAGES = [
    ('index.html', 'Balogh Beatrix | Pedikűr, lábápolás és manikűr — időpontfoglalás',
     'Személyre szabott kéz- és lábápolás: klasszikus és vizes pedikűr, lábgéllakk, gépi manikűr, erősített géllakk, paraffinos kézápolás. Foglalj időpontot online.', INDEX, True),
    ('pedikur.html', 'Pedikűr és lábápolás | Balogh Beatrix',
     'Klasszikus pedikűr, vizes pedikűr géllakkozással, lábgéllakk és eltávolítás — időtartamok, árak és online időpontfoglalás.', PEDIKUR, False),
    ('manikur.html', 'Manikűr és géllakk | Balogh Beatrix',
     'Gépi manikűr, erősített géllakk, paraffinos kézápolás és műköröm eltávolítás — árak, időtartamok, online foglalás.', MANIKUR, False),
    ('specialis-labapolas.html', 'Speciális lábápolás — telefonos egyeztetés | Balogh Beatrix',
     'Egyéni figyelmet igénylő lábápolás előzetes telefonos egyeztetéssel. Ár és időtartam egyeztetés után.', SPECIALIS, False),
    ('adatkezeles.html', 'Adatkezelési tájékoztató | Balogh Beatrix', 'Adatkezelési tájékoztató — tervezet helye.', ADATKEZELES, False),
    ('impresszum.html', 'Impresszum | Balogh Beatrix', 'Impresszum — tervezet helye.', IMPRESSZUM, False),
    ('feltetelek.html', 'Foglalási és lemondási feltételek | Balogh Beatrix', 'Foglalási és lemondási feltételek — tervezet helye.', FELTETELEK, False),
    ('koncepcio.html', 'Tervezési koncepció | Balogh Beatrix látványterv', 'Három kreatív irány és a választás indoklása.', KONCEPCIO, False),
]

if __name__ == '__main__':
    for fname, title, desc, body, is_index in PAGES:
        page(fname, title, desc, body, is_index=is_index)
    # a foglalás és az admin saját vázat kap (booking.py / admin.py)
    import booking_page, admin_page  # noqa
    booking_page.build(globals())
    admin_page.build(globals())
