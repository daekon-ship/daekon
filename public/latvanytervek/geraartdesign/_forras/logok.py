"""geraartdesign – 5 logóváltozat generálása (körvonalazott betűkkel, SVG).

Futtatás:  python3 _forras/logok.py   (a geraartdesign mappából)
Betűk: Google Fonts (OFL) – a google/fonts repó ofl/ mappájából, lásd FONT_DIR.
Kimenet:  arculat/logo-<n>/geraartdesign-<n>-<valtozat>.svg
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

FONT_DIR = os.environ.get('FONT_DIR', '/home/claude/google/fonts/ofl/')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'arculat')

_cache = {}
def font(path, axes=None):
    key = (path, tuple(sorted((axes or {}).items())))
    if key not in _cache:
        f = TTFont(FONT_DIR + path)
        if axes:
            f = instancer.instantiateVariableFont(f, axes)
        _cache[key] = f
    return _cache[key]

FONTS = {
    'caslon':   ('librecaslondisplay/LibreCaslonDisplay-Regular.ttf', None),
    'bodoni':   ('bodonimoda/BodoniModa[opsz,wght].ttf', {'opsz': 96, 'wght': 400}),
    'bodoniB':  ('bodonimoda/BodoniModa[opsz,wght].ttf', {'opsz': 96, 'wght': 800}),
    'corm_it':  ('cormorantgaramond/CormorantGaramond-Italic[wght].ttf', {'wght': 500}),
    'comm300':  ('commissioner/Commissioner[FLAR,VOLM,slnt,wght].ttf', {'wght': 300, 'FLAR': 0, 'VOLM': 0, 'slnt': 0}),
    'comm450':  ('commissioner/Commissioner[FLAR,VOLM,slnt,wght].ttf', {'wght': 450, 'FLAR': 0, 'VOLM': 0, 'slnt': 0}),
    'jost':     ('jost/Jost[wght].ttf', {'wght': 350}),
    'tenor':    ('tenorsans/TenorSans-Regular.ttf', None),
}

def text(fkey, s, size, tracking=0.0, cx=0, baseline=0, align='center'):
    """Szöveg -> SVG path d (körvonalazva). tracking: em-ben."""
    p, ax = FONTS[fkey]
    f = font(p, ax)
    upm = f['head'].unitsPerEm
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); hmtx = f['hmtx']
    sc = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [hmtx[n][0] * sc for n in names]
    tr = tracking * size
    width = sum(adv) + tr * (len(s) - 1)
    x = cx - width / 2 if align == 'center' else cx
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        tp = TransformPen(pen, (sc, 0, 0, -sc, x, baseline))
        gs[n].draw(tp)
        x += a + tr
    return pen.getCommands(), width

def glyph_G(fkey, cap, cx, baseline):
    """Egy nagy G, optikailag középre (a tényleges kontúr szerint)."""
    p, ax = FONTS[fkey]
    f = font(p, ax)
    gs = f.getGlyphSet(); n = f.getBestCmap()[ord('G')]
    capH = getattr(f['OS/2'], 'sCapHeight', 0) or f['head'].unitsPerEm * 0.7
    sc = cap / capH
    bp = BoundsPen(gs); gs[n].draw(bp)
    xmin, ymin, xmax, ymax = bp.bounds
    ox = cx - (xmin + xmax) / 2 * sc
    pen = SVGPathPen(gs)
    gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, ox, baseline)))
    box = (ox + xmin * sc, baseline - ymax * sc, ox + xmax * sc, baseline - ymin * sc)
    return pen.getCommands(), box

def r(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')

# ---------------------------------------------------------------- paletták
PAL = {
    'fo': None,  # változatonként saját
    'sotet': {'g': '#EADDCB', 'w': '#E2D3BF', 'f': '#B79E83', 'a': '#D9BE99', 'b': '#A8865F', 'bg': '#3B322B'},
    'mono':  {'g': '#3E342D', 'w': '#3E342D', 'f': '#3E342D', 'a': '#3E342D', 'b': 'none', 'bg': None},
}
MAIN = {
    1: {'g': '#5E4D40', 'w': '#5E4D40', 'f': '#B8A48D'},
    2: {'g': '#A07B58', 'w': '#7A6150', 'f': '#CDB8A0'},
    3: {'g': '#7C6957', 'w': '#7C6957', 'f': '#7C6957'},
    4: {'g': '#8E6E52', 'w': '#6E5A49', 'f': '#A88E74', 'a': '#C29A70', 'b': '#E6CFAE'},
    5: {'g': '#7E6B5A', 'w': '#8C7864', 'f': '#B3A18C'},
}
LIGHT_BG = '#FBF7F1'

# ---------------------------------------------------------------- változatok
def v1(c, compact=False):
    if compact:
        W = H = 200
        G, _ = glyph_G('caslon', 90, 100, 145)
        body = (f'<rect x="8" y="8" width="184" height="184" fill="none" stroke="{c["f"]}" stroke-width="1.4"/>'
                f'<rect x="14" y="14" width="172" height="172" fill="none" stroke="{c["f"]}" stroke-width=".6"/>'
                f'<path d="{G}" fill="{c["g"]}"/>')
        return W, H, body
    W, H = 320, 400
    G, _ = glyph_G('caslon', 168, 160, 246)
    t, _ = text('comm300', 'geraartdesign', 18.5, .26, 160, 316)
    body = (f'<rect x="10" y="10" width="300" height="380" fill="none" stroke="{c["f"]}" stroke-width="1.4"/>'
            f'<rect x="17" y="17" width="286" height="366" fill="none" stroke="{c["f"]}" stroke-width=".6"/>'
            f'<path d="{G}" fill="{c["g"]}"/>'
            f'<rect x="146" y="279" width="28" height=".8" fill="{c["f"]}"/>'
            f'<path d="{t}" fill="{c["w"]}"/>')
    return W, H, body

def v2(c, compact=False):
    if compact:
        W = H = 200
        G, _ = glyph_G('bodoni', 102, 100, 151)
        body = (f'<rect x="10" y="10" width="180" height="180" fill="none" stroke="{c["f"]}" stroke-width=".9"/>'
                f'<path d="{G}" fill="{c["g"]}"/>')
        return W, H, body
    W, H = 320, 392
    G, _ = glyph_G('bodoni', 196, 160, 262)
    t, tw = text('corm_it', 'geraartdesign', 31, .015, 160, 364)
    y = 356  # a keret alsó éle – a felirat megszakítja
    gap = tw / 2 + 12
    frame = (f'M{r(160-gap)} {y}H12V12H308V{y}H{r(160+gap)}')
    body = (f'<path d="{frame}" fill="none" stroke="{c["f"]}" stroke-width=".9"/>'
            f'<path d="{G}" fill="{c["g"]}"/>'
            f'<path d="{t}" fill="{c["w"]}"/>')
    return W, H, body

def geo_G(cx, cy, R, sw, color):
    a = math.radians(42)
    sx, sy = cx + R * math.cos(a), cy - R * math.sin(a)
    ex, ey = cx + R, cy
    arc = f'M{r(sx)} {r(sy)}A{R} {R} 0 1 0 {r(ex)} {r(ey)}'
    bar = f'M{r(cx + R + sw/2)} {r(cy)}H{r(cx + 6)}'
    spur = f'M{r(cx + R)} {r(cy - sw*0.31)}V{r(cy + R*0.34)}'
    return (f'<path d="{arc}" fill="none" stroke="{color}" stroke-width="{sw}"/>'
            f'<path d="{bar}" fill="none" stroke="{color}" stroke-width="{sw*0.62}"/>'
            f'<path d="{spur}" fill="none" stroke="{color}" stroke-width="{sw*0.62}"/>')

def v3(c, compact=False):
    if compact:
        W = H = 200
        body = (f'<rect x="9" y="9" width="182" height="182" fill="none" stroke="{c["f"]}" stroke-width="2"/>'
                + geo_G(100, 100, 44, 9, c['g']))
        return W, H, body
    W, H = 300, 420
    t, _ = text('jost', 'geraartdesign', 22, .13, 150, 356)
    body = (f'<rect x="10" y="10" width="280" height="400" fill="none" stroke="{c["f"]}" stroke-width="2"/>'
            + geo_G(150, 172, 74, 13, c['g']) +
            f'<path d="{t}" fill="{c["w"]}"/>')
    return W, H, body

def inlay_G(fkey, cap, cx, baseline, c, uid):
    G, (x0, y0, x1, y1) = glyph_G(fkey, cap, cx, baseline)
    # legyezőfurnér (napsugár) – a G-n belül váltakozó két fafurnér-tónus
    ox, oy = (x0 + x1) / 2, y1 + 40
    wedges = []
    n = 22
    Rr = (y1 - y0) * 2.2
    for i in range(n):
        a0 = math.radians(200 + i * (140 / n)); a1 = math.radians(200 + (i + 1) * (140 / n))
        p = (f'M{r(ox)} {r(oy)}L{r(ox + Rr*math.cos(a0))} {r(oy + Rr*math.sin(a0))}'
             f'L{r(ox + Rr*math.cos(a1))} {r(oy + Rr*math.sin(a1))}Z')
        wedges.append(f'<path d="{p}" fill="{c["a"] if i % 2 else c["b"]}"/>')
    return (f'<defs><clipPath id="{uid}"><path d="{G}"/></clipPath></defs>'
            f'<g clip-path="url(#{uid})">{"".join(wedges)}</g>'
            f'<path d="{G}" fill="none" stroke="{c["g"]}" stroke-width=".9"/>')

def inlay_frame(x, y, w, h, c, outer=1, inset=(8, 12), sq=7):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c["f"]}" stroke-width="{outer}"/>'
    for d in inset:
        s += f'<rect x="{x+d}" y="{y+d}" width="{w-2*d}" height="{h-2*d}" fill="none" stroke="{c["f"]}" stroke-width=".6"/>'
    d0 = inset[0]
    for (qx, qy) in [(x+d0, y+d0), (x+w-d0-sq, y+d0), (x+d0, y+h-d0-sq), (x+w-d0-sq, y+h-d0-sq)]:
        s += f'<rect x="{qx}" y="{qy}" width="{sq}" height="{sq}" fill="{c["a"]}"/>'
    return s

def v4(c, compact=False, uid='g4'):
    if compact:
        W = H = 200
        body = inlay_frame(6, 6, 188, 188, c, inset=(7, 10), sq=6) + inlay_G('bodoniB', 90, 100, 146, c, uid)
        return W, H, body
    W, H = 320, 400
    t, _ = text('comm450', 'geraartdesign', 16.5, .3, 160, 322)
    body = (inlay_frame(8, 8, 304, 384, c) + inlay_G('bodoniB', 178, 160, 252, c, uid) +
            f'<path d="{t}" fill="{c["w"]}"/>')
    return W, H, body

def crop_frame(x, y, w, h, ext, color, sw):
    return (f'<path d="M{x-ext} {y}H{x+w+ext}M{x-ext} {y+h}H{x+w+ext}M{x} {y-ext}V{y+h+ext}M{x+w} {y-ext}V{y+h+ext}" '
            f'fill="none" stroke="{color}" stroke-width="{sw}"/>')

def v5(c, compact=False):
    if compact:
        W = H = 200
        G, _ = glyph_G('tenor', 78, 100, 139)
        return W, H, crop_frame(18, 18, 164, 164, 12, c['f'], .7) + f'<path d="{G}" fill="{c["g"]}"/>'
    W, H = 460, 300
    G, _ = glyph_G('tenor', 104, 230, 162)
    t, _ = text('tenor', 'geraartdesign', 15, .5, 230 + 15*.5/2, 232)
    body = (crop_frame(22, 22, 416, 256, 13, c['f'], .7) +
            f'<path d="{G}" fill="{c["g"]}"/><path d="{t}" fill="{c["w"]}"/>')
    return W, H, body


# ---------------------------------------------------------------- fejléc-változat (vízszintes, keretben)
WM = {1: ('comm300', 15, .24), 2: ('corm_it', 25, .01), 3: ('jost', 17.5, .12),
      4: ('comm450', 13.5, .26), 5: ('tenor', 13, .42)}
def fejlec(n, c, uid='h'):
    W, H = 320, 76
    fk, size, tr = WM[n]
    if n == 3:
        g = geo_G(40, 38, 19, 4.2, c['g'])
    elif n == 4:
        g = inlay_G('bodoniB', 40, 40, 58, c, uid)
    else:
        key = {1: 'caslon', 2: 'bodoni', 5: 'tenor'}[n]
        G, _ = glyph_G(key, 40 if n != 5 else 35, 36, 58 if n != 5 else 56)
        g = f'<path d="{G}" fill="{c["g"]}"/>'
    base = 46 if n != 2 else 47
    t, tw = text(fk, 'geraartdesign', size, tr, 82, base, align='left')
    W = int(82 + tw + 26)
    if n == 4:
        fr = inlay_frame(3, 3, W - 6, H - 6, c, outer=.9, inset=(5, 7), sq=4)
    elif n == 5:
        fr = crop_frame(8, 8, W - 16, H - 16, 6, c['f'], .7)
    elif n == 1:
        fr = (f'<rect x="3" y="3" width="{W-6}" height="{H-6}" fill="none" stroke="{c["f"]}" stroke-width="1.1"/>'
              f'<rect x="7" y="7" width="{W-14}" height="{H-14}" fill="none" stroke="{c["f"]}" stroke-width=".5"/>')
    else:
        fr = f'<rect x="3" y="3" width="{W-6}" height="{H-6}" fill="none" stroke="{c["f"]}" stroke-width="{1.6 if n == 3 else .8}"/>'
    sep = f'<rect x="68" y="22" width=".7" height="32" fill="{c["f"]}"/>' if n in (1, 2, 5) else ''
    return W, H, fr + g + sep + f'<path d="{t}" fill="{c["w"]}"/>'

FNS = {1: v1, 2: v2, 3: v3, 4: v4, 5: v5}
NEVEK = {1: 'Klasszikus prémium', 2: 'Finom elegáns', 3: 'Modern minimál',
         4: 'Művészi – intarzia', 5: 'Extra letisztult luxus'}

def svg(W, H, body, bg=None, pad=0, title=''):
    vb = f'{-pad} {-pad} {W+2*pad} {H+2*pad}'
    bgr = f'<rect x="{-pad}" y="{-pad}" width="{W+2*pad}" height="{H+2*pad}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W+2*pad}" height="{H+2*pad}">'
            f'<title>{title}</title>{bgr}{body}</svg>\n')

def build():
    for n, fn in FNS.items():
        d = os.path.join(OUT, f'logo-{n}'); os.makedirs(d, exist_ok=True)
        base = f'geraartdesign-{n}'
        main = dict(MAIN[n]); dark = dict(PAL['sotet']); mono = dict(PAL['mono'])
        if n == 3:
            dark['f'] = dark['g']
        kw = lambda k: {'uid': f'g4{k}'} if n == 4 else {}
        files = {
            'fo':        svg(*fn(main, **kw('a')), title=f'geraartdesign – {NEVEK[n]}'),
            'vilagos':   svg(*fn(main, **kw('b')), bg=LIGHT_BG, pad=40, title='világos háttéren'),
            'sotet':     svg(*fn(dark, **kw('c')), bg=dark['bg'], pad=40, title='sötét háttéren'),
            'sotet-atlatszo': svg(*fn(dark, **kw('d')), title='sötét háttérre, átlátszó'),
            'mono':      svg(*fn(mono, **kw('e')), title='monokróm'),
            'kompakt':   svg(*fn(main, compact=True, **kw('f')), title='kompakt'),
            'kompakt-sotet': svg(*fn(dark, compact=True, **kw('g')), title='kompakt, sötét'),
        }
        files['fejlec'] = svg(*fejlec(n, main, uid='h4a'), title='fejléc')
        files['fejlec-sotet'] = svg(*fejlec(n, dark, uid='h4b'), title='fejléc, sötét')
        # közösségi profilkép (négyzetes, kitöltött háttér)
        W, H, body = fn(main, compact=True, **kw('h'))
        files['social'] = svg(W, H, body, bg='#EFE5D8', pad=70, title='közösségi profilkép')
        W, H, body = fn(dark, compact=True, **kw('i'))
        files['social-sotet'] = svg(W, H, body, bg=dark['bg'], pad=70, title='közösségi profilkép, sötét')
        for k, s in files.items():
            with open(os.path.join(d, f'{base}-{k}.svg'), 'w') as fh:
                fh.write(s)
    print('kész:', OUT)

if __name__ == '__main__':
    build()
