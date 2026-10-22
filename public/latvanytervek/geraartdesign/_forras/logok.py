"""geraartdesign – 5 logóváltozat, 2. kör: saját szerkesztésű, geometrikus G-k.

A G-k NEM betűtípusból jönnek: körből, négyzetből, sávokból szerkesztett formák.
Csak a „geraartdesign” felirat betű (körvonalazva), változatonként más geometrikus groteszk.
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
    'unb':   ('unbounded/Unbounded[wght].ttf', {'wght': 400}),
    'mich':  ('michroma/Michroma-Regular.ttf', None),
    'zetta': ('lexendzetta/LexendZetta[wght].ttf', {'wght': 400}),
    'jos':   ('josefinsans/JosefinSans[wght].ttf', {'wght': 400}),
    'urb':   ('urbanist/Urbanist[wght].ttf', {'wght': 500}),
}
_c = {}
def font(k):
    if k not in _c:
        p, ax = FONTS[k]
        f = TTFont(FONT_DIR + p)
        _c[k] = instancer.instantiateVariableFont(f, ax) if ax else f
    return _c[k]

def text(fk, s, size, tracking, cx, baseline):
    f = font(fk); upm = f['head'].unitsPerEm
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); hm = f['hmtx']
    sc = size / upm; names = [cmap[ord(c)] for c in s]
    adv = [hm[n][0] * sc for n in names]; tr = tracking * size
    w = sum(adv) + tr * (len(s) - 1)
    x = cx - w / 2
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, x, baseline))); x += a + tr
    return pen.getCommands(), w

def f2(v): return f'{v:.2f}'.rstrip('0').rstrip('.')
def pt(cx, cy, r, deg):
    a = math.radians(deg); return cx + r * math.cos(a), cy + r * math.sin(a)

# ---------------------------------------------------------------- G-szerkesztések
def G_kor(cx, cy, Ro, t, nyit=None, bar_x=None, bar_h=None):
    """Vastag gyűrű-G egyetlen zárt pályával; a felső végződés vízszintesen elvágva."""
    Ri = Ro - t
    bar_h = bar_h or t * 0.86
    bx = cx + (bar_x if bar_x is not None else 4)
    Y = cy - Ri * 0.78                       # vízszintes vágás magassága
    so = (cx + math.sqrt(Ro*Ro - (cy-Y)**2), Y)
    si = (cx + math.sqrt(Ri*Ri - (cy-Y)**2), Y)
    return (f'M{f2(so[0])} {f2(so[1])}'
            f'A{Ro} {Ro} 0 1 0 {f2(cx + Ro)} {f2(cy)}'
            f'V{f2(cy - bar_h)}H{f2(bx)}V{f2(cy)}H{f2(cx + Ri)}'
            f'A{Ri} {Ri} 0 1 1 {f2(si[0])} {f2(si[1])}Z')

def G_negyzet(x0, y0, S, t, bar=0.5):
    """Négyzetből szerkesztett G – egyetlen, nem metsző kontúr."""
    x1, y1 = x0 + S, y0 + S
    my = y0 + S * bar
    bx = x0 + S * 0.5
    return (f'M{f2(x0)} {f2(y0)}H{f2(x1)}V{f2(y0 + t)}H{f2(x0 + t)}V{f2(y1 - t)}H{f2(x1 - t)}'
            f'V{f2(my)}H{f2(bx)}V{f2(my - t)}H{f2(x1)}V{f2(y1)}H{f2(x0)}Z')

def G_stencil(cx, cy, Ro, t, gap=6, nyit=-42):
    """Gyűrű-G sablonvágásokkal: három szelet + leválasztott szár."""
    Ri = Ro - t
    def szelet(a0, a1):
        o0, o1 = pt(cx, cy, Ro, a0), pt(cx, cy, Ro, a1)
        i0, i1 = pt(cx, cy, Ri, a0), pt(cx, cy, Ri, a1)
        large = 1 if abs(a1 - a0) > 180 else 0
        return (f'M{f2(o0[0])} {f2(o0[1])}A{Ro} {Ro} 0 {large} 0 {f2(o1[0])} {f2(o1[1])}'
                f'L{f2(i1[0])} {f2(i1[1])}A{Ri} {Ri} 0 {large} 1 {f2(i0[0])} {f2(i0[1])}Z')
    g = math.degrees(gap / ((Ro + Ri) / 2))
    d = szelet(nyit, -180 + g / 2) + szelet(-180 - g / 2, -270 + g / 2) + szelet(-270 - g / 2, -360)
    bh = t * 0.86
    d += f'M{f2(cx + Ro)} {f2(cy - bh - gap)}V{f2(cy - gap)}H{f2(cx + 4)}V{f2(cy - bh - gap)}Z'
    return d

# ---------------------------------------------------------------- paletták
SOTET = {'g': '#ECE1D2', 'g2': '#C9A47E', 'w': '#E4D7C6', 'f': '#9C8670', 'bg': '#3A312A'}
MONO = {'g': '#3A312A', 'g2': '#3A312A', 'w': '#3A312A', 'f': '#3A312A', 'bg': None}
MAIN = {
    1: {'g': '#4F4136', 'w': '#4F4136', 'f': '#BCA891'},
    2: {'g': '#5A4A3E', 'w': '#5A4A3E', 'f': '#5A4A3E'},
    3: {'g': '#6E5C4D', 'w': '#6E5C4D', 'f': '#C2AE97'},
    4: {'g': '#9A7552', 'w': '#6E5C4D', 'f': '#C9B49B'},
    5: {'g': '#5A4A3E', 'g2': '#B98D63', 'w': '#5A4A3E', 'f': '#BCA891'},
}
NEVEK = {1: 'Monolit', 2: 'Négyzet', 3: 'Sablon', 4: 'Vonal', 5: 'Szerkesztés'}
WM = {1: ('unb', 19, .22), 2: ('mich', 16, .22), 3: ('zetta', 14.5, .10), 4: ('jos', 25, .24), 5: ('urb', 23, .34)}

def wordmark(n, c, cx, base, scale=1.0):
    fk, size, tr = WM[n]
    t, w = text(fk, 'geraartdesign', size * scale, tr, cx + size * scale * tr / 2, base)
    return f'<path d="{t}" fill="{c["w"]}"/>', w

_uid = [0]
def jel(n, c, cx, cy, R):
    if n == 1:
        return f'<path d="{G_kor(cx, cy, R, R*0.36)}" fill="{c["g"]}"/>'
    if n == 2:
        S = R * 1.84
        return f'<path d="{G_negyzet(cx - S/2, cy - S/2, S, S*0.17)}" fill="{c["g"]}"/>'
    if n == 3:
        return f'<path d="{G_stencil(cx, cy, R, R*0.32, gap=max(3, R*0.07))}" fill="{c["g"]}"/>'
    if n == 4:
        sw = max(1.4, R * 0.03)
        return f'<path d="{G_kor(cx, cy, R, R*0.30)}" fill="none" stroke="{c["g"]}" stroke-width="{f2(sw)}"/>'
    if n == 5:
        t = R * 0.34
        d = G_kor(cx, cy, R, t)
        _uid[0] += 1
        clip = f'gc{_uid[0]}'
        ring = R * 1.16
        ext = R * 0.12
        return (f'<defs><clipPath id="{clip}"><rect x="{f2(cx - R*2)}" y="{f2(cy)}" width="{f2(R*4)}" height="{f2(R*2)}"/></clipPath></defs>'
                f'<circle cx="{f2(cx)}" cy="{f2(cy)}" r="{f2(ring)}" fill="none" stroke="{c["f"]}" stroke-width="{f2(max(.6, R*.011))}"/>'
                f'<path d="M{f2(cx - ring - ext)} {f2(cy)}H{f2(cx + ring + ext)}M{f2(cx)} {f2(cy - ring - ext)}V{f2(cy + ring + ext)}" stroke="{c["f"]}" stroke-width="{f2(max(.5, R*.008))}"/>'
                f'<path d="{d}" fill="{c["g"]}"/>'
                f'<path d="{d}" fill="{c["g2"]}" clip-path="url(#{clip})"/>')

def keret(n, c, x, y, w, h, s=1.0):
    if n == 1:
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c["f"]}" stroke-width="{f2(1.2*s)}"/>'
    if n == 2:
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c["f"]}" stroke-width="{f2(2.2*s)}"/>'
    if n == 3:
        L = 14 * s; sw = 2.4 * s
        cs = ''.join(f'<path d="M{a} {f2(b+dy*L)}V{b}H{f2(a+dx*L)}" fill="none" stroke="{c["g"]}" stroke-width="{f2(sw)}"/>'
                     for a, b, dx, dy in [(x, y, 1, 1), (x+w, y, -1, 1), (x, y+h, 1, -1), (x+w, y+h, -1, -1)])
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c["f"]}" stroke-width="{f2(.8*s)}"/>' + cs
    if n == 4:
        d = 5 * s
        return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c["f"]}" stroke-width="{f2(.8*s)}"/>'
                f'<rect x="{f2(x+d)}" y="{f2(y+d)}" width="{f2(w-2*d)}" height="{f2(h-2*d)}" fill="none" stroke="{c["f"]}" stroke-width="{f2(.8*s)}"/>')
    if n == 5:
        ticks = ''.join(f'<path d="M{f2(x + w*k/8)} {y}v{f2(5*s if k % 4 else 9*s)}" stroke="{c["f"]}" stroke-width="{f2(.8*s)}"/>' for k in range(1, 8))
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c["f"]}" stroke-width="{f2(1*s)}"/>' + ticks

def fo(n, c):
    W, H = 320, 372
    wm, _ = wordmark(n, c, 160, 318)
    return W, H, keret(n, c, 10, 10, 300, 352) + jel(n, c, 160, 158, 88) + wm

def kompakt(n, c):
    return 200, 200, keret(n, c, 8, 8, 184, 184, .9) + jel(n, c, 100, 100, 52)

def fejlec(n, c):
    H = 76
    fk, size, tr = WM[n]
    sc = 0.74
    _, w = text(fk, 'geraartdesign', size * sc, tr, 0, 0)
    W = int(84 + w + 30)
    wm, _ = wordmark(n, c, 84 + w / 2, 43 + size * sc * .36, sc)
    sep = f'<rect x="70" y="20" width=".8" height="36" fill="{c["f"]}"/>'
    return W, H, keret(n, c, 3, 3, W - 6, H - 6, .7) + jel(n, c, 38, 38, 21) + sep + wm

def svg(W, H, body, bg=None, pad=0, title=''):
    vb = f'{-pad} {-pad} {W+2*pad} {H+2*pad}'
    b = f'<rect x="{-pad}" y="{-pad}" width="{W+2*pad}" height="{H+2*pad}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W+2*pad}" height="{H+2*pad}"><title>{title}</title>{b}{body}</svg>\n'

def build():
    for n in range(1, 6):
        d = os.path.join(OUT, f'logo-{n}'); os.makedirs(d, exist_ok=True)
        for old in os.listdir(d): os.remove(os.path.join(d, old))
        m = dict(MAIN[n]); m.setdefault('g2', m['g'])
        dk = dict(SOTET)
        if n == 2: dk['f'] = dk['g']
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
