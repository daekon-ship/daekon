"""geraartdesign – 5 logóváltozat, 3. kör: asztalosi szerkezetekből épített G-k.

Nincs kör alapú G (a 2. kör „Google-hatású” volt). Minden G egy bútorasztalos
szerkezetből indul: gérvágás, rétegelt lemez, boltív, modulok, egy vonal.
Csak a „geraartdesign” felirat betű (körvonalazva).
Futtatás:  python3 _forras/logok.py   (a geraartdesign mappából)
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT_DIR = os.environ.get('FONT_DIR', '/home/claude/google/fonts/ofl/')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'arculat')

FONTS = {
    'mich':   ('michroma/Michroma-Regular.ttf', None),
    'unb5':   ('unbounded/Unbounded[wght].ttf', {'wght': 500}),
    'unb2':   ('unbounded/Unbounded[wght].ttf', {'wght': 250}),
    'jos':    ('josefinsans/JosefinSans[wght].ttf', {'wght': 400}),
    'exa':    ('lexendexa/LexendExa[wght].ttf', {'wght': 400}),
    'urb':    ('urbanist/Urbanist[wght].ttf', {'wght': 500}),
}
_c = {}
def font(k):
    if k not in _c:
        p, ax = FONTS[k]
        f = TTFont(FONT_DIR + p)
        _c[k] = instancer.instantiateVariableFont(f, ax) if ax else f
    return _c[k]

def run(fk, s, size, tracking):
    f = font(fk); upm = f['head'].unitsPerEm
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); hm = f['hmtx']
    sc = size / upm; names = [cmap[ord(c)] for c in s]
    adv = [hm[n][0] * sc for n in names]
    return f, gs, sc, names, adv

def text_parts(parts, size, tracking, cx, baseline):
    """parts: [(fontkulcs, szöveg)] – egymás után, közös ritkítással, középre."""
    tr = tracking * size
    runs = [run(fk, s, size, tracking) for fk, s in parts]
    total = sum(sum(r[4]) for r in runs) + tr * (sum(len(s) for _, s in parts) - 1)
    x = cx - total / 2
    ds = []
    for (f, gs, sc, names, adv) in runs:
        pen = SVGPathPen(gs)
        for n, a in zip(names, adv):
            gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, x, baseline))); x += a + tr
        ds.append(pen.getCommands())
    return ds, total

def f2(v): return f'{v:.2f}'.rstrip('0').rstrip('.')
def poly(pts): return 'M' + 'L'.join(f'{f2(x)} {f2(y)}' for x, y in pts) + 'Z'
_uid = [0]
def uid(p):
    _uid[0] += 1; return f'{p}{_uid[0]}'

# ---------------------------------------------------------------- G-k
# Mindegyik: jel(c, cx, cy, s) – s: a jel befoglaló mérete (magasság).

def G_ger(c, cx, cy, s):
    """1 · Gér: négyszögletes G gérbe vágott sarkokkal, hajszálnyi illesztési réssel."""
    S = s; t = S * 0.2; g = max(1.2, S * 0.018)
    x0, y0 = cx - S / 2, cy - S / 2; x1, y1 = x0 + S, y0 + S
    my = y0 + S * 0.52; bx = x0 + S * 0.5
    darabok = [
        poly([(x0, y0), (x1, y0), (x1, y0 + t), (x0 + t, y0 + t)]),                 # felső
        poly([(x0, y0), (x0 + t, y0 + t), (x0 + t, y1 - t), (x0, y1)]),             # bal
        poly([(x0, y1), (x0 + t, y1 - t), (x1 - t, y1 - t), (x1, y1)]),             # alsó
        poly([(x1, y1), (x1 - t, y1 - t), (x1 - t, my), (x1, my - t)]),             # jobb szár
        poly([(bx, my - t), (x1, my - t), (x1 - t, my), (bx, my)]),                 # befelé
    ]
    vagas = [(x0, y0, x0 + t, y0 + t), (x0, y1, x0 + t, y1 - t), (x1, y1, x1 - t, y1 - t), (x1, my - t, x1 - t, my)]
    m = uid('m')
    lines = ''.join(f'<path d="M{f2(a - (c2 - a) * .3)} {f2(b - (d - b) * .3)}L{f2(c2 + (c2 - a) * .3)} {f2(d + (d - b) * .3)}" stroke="#000" stroke-width="{f2(g)}"/>' for a, b, c2, d in vagas)
    return (f'<defs><mask id="{m}" maskUnits="userSpaceOnUse" x="{f2(x0-5)}" y="{f2(y0-5)}" width="{f2(S+10)}" height="{f2(S+10)}">'
            f'<rect x="{f2(x0-5)}" y="{f2(y0-5)}" width="{f2(S+10)}" height="{f2(S+10)}" fill="#fff"/>{lines}</mask></defs>'
            f'<g mask="url(#{m})" fill="{c["g"]}">' + ''.join(f'<path d="{d}"/>' for d in darabok[:4]) +
            f'<path d="{darabok[4]}" fill="{c["a"]}"/></g>')

def G_retegelt(c, cx, cy, s):
    """2 · Rétegelt: balra félkörös, jobbra szögletes G, vízszintes lemezrétegekből."""
    H = s; W = s * 0.92; t = H * 0.2
    x0, y0 = cx - W / 2, cy - H / 2; x1, y1 = x0 + W, y0 + H
    R = H / 2; xc = x0 + R
    r = R - t / 2
    my = y0 + H / 7 * 4.5; bx = cx - W * 0.02
    d = (f'M{f2(x1)} {f2(y0 + t/2)}H{f2(xc)}A{f2(r)} {f2(r)} 0 0 0 {f2(xc)} {f2(y1 - t/2)}'
         f'H{f2(x1 - t/2)}V{f2(my)}H{f2(bx)}')
    m = uid('r')
    n = 7; band = H / n; gap = max(1.2, H * 0.03)
    rects = ''.join(f'<rect x="{f2(x0-2)}" y="{f2(y0 + k*band + (gap/2 if k else 0))}" width="{f2(W+4)}" height="{f2(band - (gap/2 if k else 0) - (gap/2 if k < n-1 else 0))}" fill="{c["a"] if k == 4 else c["g"]}"/>' for k in range(n))
    return (f'<defs><mask id="{m}" maskUnits="userSpaceOnUse" x="{f2(x0-4)}" y="{f2(y0-4)}" width="{f2(W+8)}" height="{f2(H+8)}">'
            f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{f2(t)}" stroke-linejoin="miter"/></mask></defs>'
            f'<g mask="url(#{m})">{rects}</g>')

def G_iv(c, cx, cy, s):
    """3 · Ív: boltíves ajtó/tükör formájú, magas G."""
    H = s; W = s * 0.74; t = W * 0.2
    x0, y0 = cx - W / 2, cy - H / 2; x1, y1 = x0 + W, y0 + H
    R = W / 2 - t / 2; ac = y0 + W / 2
    a = math.radians(-32)
    sx, sy = cx + R * math.cos(a), ac + R * math.sin(a)
    my = y0 + H * 0.62
    d = (f'M{f2(sx)} {f2(sy)}A{f2(R)} {f2(R)} 0 0 0 {f2(cx - R)} {f2(ac)}'
         f'V{f2(y1 - t/2)}H{f2(cx + R)}V{f2(my)}H{f2(cx - W*0.02)}')
    return (f'<path d="{d}" fill="none" stroke="{c["g"]}" stroke-width="{f2(t)}" stroke-linejoin="miter"/>'
            f'<rect x="{f2(cx - W*0.02 - t*0.9)}" y="{f2(my - t/2)}" width="{f2(t*0.9)}" height="{f2(t)}" fill="{c["a"]}"/>')

def G_modul(c, cx, cy, s):
    """4 · Modul: négy külön elemből összerakott G, mint a korpuszbútor."""
    S = s; t = S * 0.22; g = S * 0.045
    x0, y0 = cx - S / 2, cy - S / 2; x1, y1 = x0 + S, y0 + S
    R = S / 2
    # bal felső negyedív-gyűrű
    rO, rI = R - g / 2, R - g / 2 - t
    ox, oy = x0 + R - g / 2, y0 + R - g / 2
    q = (f'M{f2(x0)} {f2(oy)}A{f2(rO)} {f2(rO)} 0 0 1 {f2(ox)} {f2(y0)}'
         f'H{f2(x1)}V{f2(y0 + t)}H{f2(ox)}A{f2(rI)} {f2(rI)} 0 0 0 {f2(x0 + t)} {f2(oy)}Z')
    L = poly([(x0, oy + g), (x0 + t, oy + g), (x0 + t, y1 - t), (x1 - t - g, y1 - t), (x1 - t - g, y1), (x0, y1)])
    sz = poly([(x1 - t, y1), (x1, y1), (x1, y0 + S * 0.5), (x1 - t, y0 + S * 0.5)])
    blokk = poly([(x0 + S * 0.47, y0 + S * 0.5), (x1 - t - g, y0 + S * 0.5), (x1 - t - g, y0 + S * 0.5 + t), (x0 + S * 0.47, y0 + S * 0.5 + t)])
    return (f'<path d="{q}" fill="{c["g"]}"/><path d="{L}" fill="{c["g"]}"/>'
            f'<path d="{sz}" fill="{c["g"]}"/><path d="{blokk}" fill="{c["a"]}"/>')

def G_szal(c, cx, cy, s, keret_jobb=None):
    """5 · Szál: egyetlen vonal – a G felső szára a keret jobb éléig fut és belekapaszkodik."""
    S = s; sw = max(2.2, S * 0.05)
    x0, y0 = cx - S / 2, cy - S / 2; x1, y1 = x0 + S, y0 + S
    my = y0 + S * 0.55
    r = S * 0.22
    top_end = keret_jobb if keret_jobb is not None else x1
    d = (f'M{f2(top_end)} {f2(y0)}H{f2(x0 + r)}A{f2(r)} {f2(r)} 0 0 0 {f2(x0)} {f2(y0 + r)}'
         f'V{f2(y1)}H{f2(x1)}V{f2(my)}H{f2(cx)}')
    return (f'<path d="{d}" fill="none" stroke="{c["g"]}" stroke-width="{f2(sw)}" stroke-linejoin="miter"/>'
            f'<rect x="{f2(cx - sw*1.8)}" y="{f2(my - sw*1.8)}" width="{f2(sw*3.6)}" height="{f2(sw*3.6)}" fill="{c["a"]}"/>')

JEL = {1: G_ger, 2: G_retegelt, 3: G_iv, 4: G_modul, 5: G_szal}
NEVEK = {1: 'Gér', 2: 'Rétegelt', 3: 'Ív', 4: 'Modul', 5: 'Szál'}
WM = {
    1: ([('mich', 'geraartdesign')], 17, .18),
    2: ([('unb5', 'gera'), ('unb2', 'artdesign')], 18.5, .06),
    3: ([('jos', 'geraartdesign')], 26, .22),
    4: ([('exa', 'geraartdesign')], 17, .08),
    5: ([('urb', 'geraartdesign')], 23, .32),
}

# ---------------------------------------------------------------- paletták
SOTET = {'g': '#ECE1D2', 'a': '#C9A47E', 'w': '#E4D7C6', 'f': '#9C8670', 'bg': '#3A312A'}
MONO = {'g': '#3A312A', 'a': '#3A312A', 'w': '#3A312A', 'f': '#3A312A', 'bg': None}
MAIN = {
    1: {'g': '#4F4136', 'a': '#B98D63', 'w': '#4F4136', 'f': '#BCA891'},
    2: {'g': '#4F4136', 'a': '#B98D63', 'w': '#4F4136', 'f': '#BCA891'},
    3: {'g': '#5A4A3E', 'a': '#B98D63', 'w': '#5A4A3E', 'f': '#C2AE97'},
    4: {'g': '#4F4136', 'a': '#B98D63', 'w': '#4F4136', 'f': '#BCA891'},
    5: {'g': '#4F4136', 'a': '#B98D63', 'w': '#4F4136', 'f': '#4F4136'},
}

def keret(n, c, x, y, w, h, s=1.0):
    sw = {1: 1.1, 2: 1.1, 3: 1.0, 4: 1.1, 5: 1.6}[n] * s
    return f'<rect x="{f2(x)}" y="{f2(y)}" width="{f2(w)}" height="{f2(h)}" fill="none" stroke="{c["f"]}" stroke-width="{f2(sw)}"/>'

def wordmark(n, c, cx, base, scale=1.0):
    parts, size, tr = WM[n]
    ds, w = text_parts(parts, size * scale, tr, cx, base)
    return ''.join(f'<path d="{d}" fill="{c["w"]}"/>' for d in ds), w

def jel(n, c, cx, cy, s, kj=None):
    if n == 5:
        return G_szal(c, cx, cy, s, kj)
    return JEL[n](c, cx, cy, s)

def fo(n, c):
    W, H = 320, 372
    wm, _ = wordmark(n, c, 160, 318)
    return W, H, keret(n, c, 10, 10, 300, 352) + jel(n, c, 160, 152, 170, kj=310) + wm

def kompakt(n, c):
    return 200, 200, keret(n, c, 8, 8, 184, 184, .9) + jel(n, c, 100, 100, 112, kj=192)

def fejlec(n, c):
    H = 76
    parts, size, tr = WM[n]
    sc = 0.72
    _, w = text_parts(parts, size * sc, tr, 0, 0)
    W = int(84 + w + 30)
    wm, _ = wordmark(n, c, 84 + w / 2, 43 + size * sc * .36, sc)
    sep = f'<rect x="70" y="20" width=".8" height="36" fill="{c["f"]}"/>'
    return W, H, keret(n, c, 3, 3, W - 6, H - 6, .7) + jel(n, c, 37, 38, 40, kj=None) + sep + wm

def svg(W, H, body, bg=None, pad=0, title=''):
    vb = f'{-pad} {-pad} {W+2*pad} {H+2*pad}'
    b = f'<rect x="{-pad}" y="{-pad}" width="{W+2*pad}" height="{H+2*pad}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W+2*pad}" height="{H+2*pad}"><title>{title}</title>{b}{body}</svg>\n'

def build():
    for n in range(1, 6):
        d = os.path.join(OUT, f'logo-{n}'); os.makedirs(d, exist_ok=True)
        for old in os.listdir(d): os.remove(os.path.join(d, old))
        m = dict(MAIN[n]); dk = dict(SOTET)
        if n == 5: dk['f'] = dk['g']
        nm = f'geraartdesign – {NEVEK[n]}'
        files = {
            'fo': svg(*fo(n, m), title=nm),
            'vilagos': svg(*fo(n, m), bg='#FBF7F1', pad=40, title='világos háttéren'),
            'sotet': svg(*fo(n, dk), bg=dk['bg'], pad=40, title='sötét háttéren'),
            'sotet-atlatszo': svg(*fo(n, dk), title='sötét háttérre'),
            'mono': svg(*fo(n, MONO), title='monokróm'),
            'kompakt': svg(*kompakt(n, m), title='kompakt'),
            'kompakt-sotet': svg(*kompakt(n, dk), title='kompakt, sötét'),
            'social': svg(*kompakt(n, m), bg='#EEE4D7', pad=64, title='profilkép'),
            'social-sotet': svg(*kompakt(n, dk), bg=dk['bg'], pad=64, title='profilkép, sötét'),
            'fejlec': svg(*fejlec(n, m), title='fejléc'),
            'fejlec-sotet': svg(*fejlec(n, dk), title='fejléc, sötét'),
        }
        for k, s in files.items():
            open(os.path.join(d, f'geraartdesign-{n}-{k}.svg'), 'w').write(s)
    print('kész')

if __name__ == '__main__':
    build()
