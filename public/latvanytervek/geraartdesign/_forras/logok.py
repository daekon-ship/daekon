"""geraartdesign – logóváltozatok, 5. kör: az 1-es (Szorító), 4-es (Derékszög), 5-ös (Évgyűrű) marad,
olvashatóbb névírással. A 2-es és 3-as kikerült (a függvényeik itt maradnak referenciának).

4. kör: felismerhetően ASZTALOS G-k.

Kérés: „kapcsolj hozzá valamit, hogy asztalos”. Minden G egy asztalosi tárgyból/szerkezetből:
1 Szorító (G-szorító), 2 Forgács (gyaluforgács), 3 Fecskefark (illesztés),
4 Derékszög (asztalos derékszög), 5 Évgyűrű (gerenda bütüje).
A név alatt kis „BÚTORASZTALOS · INTARZIA” sor. Csak a feliratok betűk (körvonalazva).
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
    'unb':  ('unbounded/Unbounded[wght].ttf', {'wght': 400}),
    'jos':  ('josefinsans/JosefinSans[wght].ttf', {'wght': 500}),
    'mich': ('michroma/Michroma-Regular.ttf', None),
    'urb':  ('urbanist/Urbanist[wght].ttf', {'wght': 600}),
    'exa':  ('lexendexa/LexendExa[wght].ttf', {'wght': 400}),
    'tag':  ('urbanist/Urbanist[wght].ttf', {'wght': 700}),
    'unbB': ('unbounded/Unbounded[wght].ttf', {'wght': 600}),
    'kumB': ('kumbhsans/KumbhSans[YOPQ,wght].ttf', {'wght': 700}),
    'kumL': ('kumbhsans/KumbhSans[YOPQ,wght].ttf', {'wght': 300}),
    'unbL': ('unbounded/Unbounded[wght].ttf', {'wght': 300}),
    'urbB': ('urbanist/Urbanist[wght].ttf', {'wght': 800}),
    'urbL': ('urbanist/Urbanist[wght].ttf', {'wght': 500}),
    'exaB': ('lexendexa/LexendExa[wght].ttf', {'wght': 600}),
    'exaL': ('lexendexa/LexendExa[wght].ttf', {'wght': 300}),
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
    sc = size / upm; names = [cmap[ord(ch)] for ch in s]
    adv = [hm[n][0] * sc for n in names]; tr = tracking * size
    w = sum(adv) + tr * (len(s) - 1)
    x = cx - w / 2
    pen = SVGPathPen(gs)
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (sc, 0, 0, -sc, x, baseline))); x += a + tr
    return pen.getCommands(), w

def f2(v): return f'{v:.2f}'.rstrip('0').rstrip('.')
def poly(pts): return 'M' + 'L'.join(f'{f2(x)} {f2(y)}' for x, y in pts) + 'Z'
def rect(x, y, w, h, fill, extra=''): return f'<rect x="{f2(x)}" y="{f2(y)}" width="{f2(w)}" height="{f2(h)}" fill="{fill}"{extra}/>'
_uid = [0]
def uid(p):
    _uid[0] += 1; return f'{p}{_uid[0]}'

# ================================================================ 1 · SZORÍTÓ
def G_szorito(c, cx, cy, s):
    """A G maga egy pillanatszorító: öntött íves test, menetes orsó, forgó nyomótalp (a G vízszintese), T-fogantyú."""
    H = s * 0.86; W = s * 0.9; t = H * 0.22
    lab = t * 1.25                                   # az orsó + fogantyú lelógása
    y0 = cy - (H + lab) / 2; y1 = y0 + H
    x0 = cx - W / 2; x1 = x0 + W
    R = H / 2; xc = x0 + R; r = R - t / 2
    out = (f'<path d="M{f2(x1)} {f2(y0 + t/2)}H{f2(xc)}A{f2(r)} {f2(r)} 0 0 0 {f2(xc)} {f2(y1 - t/2)}H{f2(x1)}" '
           f'fill="none" stroke="{c["g"]}" stroke-width="{f2(t)}"/>')
    # felső pofa: kissé megvastagodó ütközőfelület
    out += rect(x1 - t * 0.85, y0 + t * 0.98, t * 0.85, t * 0.26, c['g'])
    # orsó
    sx = x1 - t * 0.5; sw = t * 0.4
    my = y0 + H * 0.5 + t * 0.15                     # nyomótalp alja
    ya = y1 + lab * 0.72                             # orsó alja
    out += rect(sx - sw / 2, my, sw, ya - my, c['g'])
    # menet: ferde világos vonalkák a látható orsószakaszokon
    lw = f2(max(.7, sw * 0.16)); k = 0; yy = my + sw * 0.9
    while yy < ya - sw * 0.2:
        if not (y1 - t - sw * 0.2 < yy < y1 + sw * 0.1):
            out += f'<path d="M{f2(sx - sw/2)} {f2(yy + sw*0.22)}L{f2(sx + sw/2)} {f2(yy - sw*0.22)}" stroke="{c["bg2"]}" stroke-width="{lw}"/>'
        yy += sw * 0.62; k += 1
    # forgó csukló a talp alatt
    out += rect(sx - sw * 0.85, my, sw * 1.7, sw * 0.42, c['g'])
    # nyomótalp = a G vízszintes szára
    bx = cx - W * 0.05; th = t * 0.62
    out += rect(bx, my - th, x1 + t * 0.06 - bx, th, c['a'])
    # T-fogantyú, lekerekített végekkel
    fh = t * 0.34; fw = t * 2.3
    out += f'<rect x="{f2(sx - fw/2)}" y="{f2(ya)}" width="{f2(fw)}" height="{f2(fh)}" rx="{f2(fh/2)}" fill="{c["a"]}"/>'
    out += rect(sx - sw * 0.7, ya - sw * 0.15, sw * 1.4, fh + sw * 0.3, c['g'])
    return out

# ================================================================ 2 · FORGÁCS
def G_forgacs(c, cx, cy, s):
    """Gyaluforgács: keskenyedő, rostos szalag körbe fut, majd vízszintes nyelvként befelé hajlik – ez a G szára."""
    R = s * 0.42; w0 = s * 0.2
    N = 120; a0, a1 = -40, -360
    po, pi, mid = [], [], []
    for k in range(N + 1):
        p = k / N; a = math.radians(a0 + (a1 - a0) * p)
        w = w0 * (1 - 0.28 * p)
        ux, uy = math.cos(a), math.sin(a)
        po.append((cx + (R + w/2) * ux, cy + (R + w/2) * uy)); pi.append((cx + (R - w/2) * ux, cy + (R - w/2) * uy))
        mid.append((R, w, a))
    we = w0 * 0.72
    # nyelv: a jobb közép (0°) pontból vízszintesen befelé, enyhe lefelé kunkorral
    xr = cx + R + we/2; xi = cx + s * 0.02
    nyelv = (f'M{f2(xr)} {f2(cy)}L{f2(xr)} {f2(cy - we)}L{f2(xi + we*0.3)} {f2(cy - we)}'
             f'Q{f2(xi - we*0.5)} {f2(cy - we)} {f2(xi - we*0.45)} {f2(cy - we*0.1)}'
             f'Q{f2(xi - we*0.4)} {f2(cy + we*0.45)} {f2(xi + we*0.1)} {f2(cy + we*0.35)}'
             f'Q{f2(xi - we*0.05)} {f2(cy)} {f2(xi + we*0.35)} {f2(cy)}Z')
    gyuru = poly(po + pi[::-1])
    rost = ''
    for f in (-0.25, 0.05, 0.28):
        pts = [(cx + (r + f*w) * math.cos(a), cy + (r + f*w) * math.sin(a)) for r, w, a in mid[3:-2]]
        rost += '<path d="M' + 'L'.join(f'{f2(x)} {f2(y)}' for x, y in pts) + f'" fill="none" stroke="{c["g"]}" stroke-width="{f2(max(.6, s*0.005))}" stroke-opacity=".5"/>'
    for f in (0.3, 0.65):
        rost += f'<path d="M{f2(xr - 2)} {f2(cy - we*f)}H{f2(xi + we*0.4)}" stroke="{c["g"]}" stroke-width="{f2(max(.6, s*0.005))}" stroke-opacity=".5"/>'
    lw = f2(max(1, s * 0.011))
    return (f'<path d="{gyuru}" fill="{c["a"]}"/><path d="{nyelv}" fill="{c["a"]}"/>' + rost +
            f'<path d="{gyuru}" fill="none" stroke="{c["g"]}" stroke-width="{lw}" stroke-linejoin="round"/>'
            f'<path d="{nyelv}" fill="none" stroke="{c["g"]}" stroke-width="{lw}" stroke-linejoin="round"/>')

# ================================================================ 3 · FECSKEFARK
def fecskefark(x, y, t, n, dark, light, vertical=True):
    """t×t sarokmező fecskefarkas illesztéssel: n darab világos „farok” a sötét elembe."""
    out = rect(x, y, t, t, dark)
    h = t / n
    for k in range(n):
        y0 = y + k * h
        narrow, wide = h * 0.34, h * 0.92
        # a farok a mező jobb oldalától (keskeny) a bal oldalig (széles) nyúlik
        pts = [(x + t, y0 + (h - narrow) / 2), (x + t, y0 + (h + narrow) / 2),
               (x, y0 + (h + wide) / 2), (x, y0 + (h - wide) / 2)]
        out += f'<path d="{poly(pts)}" fill="{light}"/>'
    return out

def G_fecske(c, cx, cy, s):
    """Négyszögletes G, a bal sarkokban jól látható fecskefarkas illesztéssel (mint egy fiókoldal)."""
    S = s; t = S * 0.25
    x0, y0 = cx - S / 2, cy - S / 2; x1, y1 = x0 + S, y0 + S
    my = y0 + S * 0.5; bx = x0 + S * 0.48
    lw = f2(max(.8, S * 0.008)); st = f' stroke="{c["g"]}" stroke-width="{lw}"'
    g = rect(x0 + t, y0, x1 - x0 - t, t, c['a'], st)
    g += rect(x0 + t, y1 - t, x1 - x0 - t, t, c['a'], st)
    g += rect(x0, y0 + t, t, S - 2 * t, c['g'])
    g += fecskefark(x0, y0, t, 3, c['g'], c['a'])
    g += fecskefark(x0, y1 - t, t, 3, c['g'], c['a'])
    g += rect(x1 - t, my, t, y1 - t - my, c['g'])
    g += rect(bx, my, x1 - bx, t * 0.85, c['g'])
    return g

# ================================================================ 4 · DERÉKSZÖG
def G_derekszog(c, cx, cy, s):
    """A G jobb oldala egy asztalos derékszög: fa nyél (erezettel, sárgaréz szegecsekkel) + acél penge cm-beosztással."""
    S = s * 0.96; t = S * 0.17
    x0, y0 = cx - S / 2, cy - S / 2; x1, y1 = x0 + S, y0 + S
    g = (f'<path d="M{f2(x1)} {f2(y0 + t/2)}H{f2(x0 + t/2)}V{f2(y1 - t/2)}H{f2(x1 - t*1.35)}" '
         f'fill="none" stroke="{c["g"]}" stroke-width="{f2(t)}"/>')
    nw = t * 1.35; ny0 = cy - t * 0.25
    g += rect(x1 - nw, ny0, nw, y1 - ny0, c['a'])
    # fa erezet a nyélen
    for f in (0.28, 0.62):
        xx = x1 - nw + nw * f
        g += (f'<path d="M{f2(xx)} {f2(ny0 + 2)}C{f2(xx + nw*0.12)} {f2(ny0 + (y1-ny0)*0.35)} {f2(xx - nw*0.1)} {f2(ny0 + (y1-ny0)*0.65)} {f2(xx + nw*0.04)} {f2(y1 - 2)}" '
              f'fill="none" stroke="{c["a2"]}" stroke-width="{f2(max(.6, s*0.006))}"/>')
    # szegecsek
    for k in range(3):
        yy = ny0 + nw * 0.62 + k * (y1 - ny0 - nw * 1.1) / 2
        g += f'<circle cx="{f2(x1 - nw/2)}" cy="{f2(yy)}" r="{f2(nw*0.13)}" fill="{c["bg2"]}" stroke="{c["g"]}" stroke-width="{f2(max(.8, nw*0.06))}"/>'
    # acél penge
    pw = t * 0.5; px0 = cx - S * 0.1
    g += rect(px0, ny0, x1 - nw - px0, pw, c['g'])
    n = 12; L = x1 - nw - px0
    for k in range(1, n):
        xx = px0 + L * k / n
        h = pw * (0.62 if k % 4 == 0 else 0.38)
        g += f'<path d="M{f2(xx)} {f2(ny0)}v{f2(h)}" stroke="{c["bg2"]}" stroke-width="{f2(max(.6, s*0.006))}"/>'
    return g

# ================================================================ 5 · ÉVGYŰRŰ
def G_evgyuru(c, cx, cy, s):
    """Gerenda bütüje: a szögletes G-ben évgyűrűk (korai/késői pászta), bélsugarak, bütürepedés; a bél a bal alsó sarokban."""
    S = s * 0.96; t = S * 0.25
    x0, y0 = cx - S / 2, cy - S / 2; x1, y1 = x0 + S, y0 + S
    my = y0 + S * 0.44; bh = t * 0.8; bx = x0 + S * 0.5
    shape = poly([(x0, y0), (x1, y0), (x1, y0 + t), (x0 + t, y0 + t), (x0 + t, y1 - t), (x1 - t, y1 - t),
                  (x1 - t, my + bh), (bx, my + bh), (bx, my), (x1, my), (x1, y1), (x0, y1)])
    m = uid('e')
    px, py = x0 + t * 0.55, y1 - t * 0.5            # bél
    gy = ''; r = S * 0.05; k = 0
    while r < S * 1.45:
        dr = S * (0.042 + 0.022 * (((k * 5) % 7) / 6))        # változó gyűrűszélesség
        w = max(.7, S * (0.007 + 0.009 * (((k * 3) % 4) / 3)))   # késői pászta vastagsága
        gy += f'<circle cx="{f2(px)}" cy="{f2(py)}" r="{f2(r)}" fill="none" stroke="{c["ring"]}" stroke-width="{f2(w)}"/>'
        r += dr; k += 1
    sug = ''
    for a in (-80, -62, -40, -24, -8, 12):
        rad = math.radians(a)
        sug += f'<path d="M{f2(px + S*0.12*math.cos(rad))} {f2(py + S*0.12*math.sin(rad))}L{f2(px + S*1.5*math.cos(rad))} {f2(py + S*1.5*math.sin(rad))}" stroke="{c["ring"]}" stroke-opacity=".35" stroke-width="{f2(max(.5, S*0.004))}"/>'
    # bütürepedés: a béltől a bal felső szár felé, elvékonyodó ék
    a = math.radians(-100); a2 = math.radians(-96)
    crack = poly([(px, py), (px + S*0.7*math.cos(a), py + S*0.7*math.sin(a)), (px + S*0.55*math.cos(a2), py + S*0.55*math.sin(a2))])
    return (f'<defs><clipPath id="{m}"><path d="{shape}"/></clipPath></defs>'
            f'<g clip-path="url(#{m})"><rect x="{f2(x0)}" y="{f2(y0)}" width="{f2(S)}" height="{f2(S)}" fill="{c["a"]}"/>'
            f'{sug}{gy}<circle cx="{f2(px)}" cy="{f2(py)}" r="{f2(S*0.022)}" fill="{c["ring"]}"/><path d="{crack}" fill="{c["g"]}"/></g>'
            f'<path d="{shape}" fill="none" stroke="{c["g"]}" stroke-width="{f2(max(1.3, S*0.016))}" stroke-linejoin="miter"/>')

JEL = {1: G_szorito, 2: G_forgacs, 3: G_fecske, 4: G_derekszog, 5: G_evgyuru}
NEVEK = {1: 'Szorító', 2: 'Forgács', 3: 'Fecskefark', 4: 'Derékszög', 5: 'Évgyűrű'}
WM = {1: ('unb', 17, .1), 2: ('jos', 25, .14), 3: ('mich', 16.5, .14), 4: ('urb', 24, .2), 5: ('exa', 16.5, .08)}
TAG = 'BÚTORASZTALOS · INTARZIA'

SOTET = {'a2': '#9C7A57', 'ring': '#8A6747', 'g': '#ECE1D2', 'a': '#C9A47E', 'w': '#E4D7C6', 'f': '#9C8670', 't': '#C9A47E', 'bg': '#3A312A', 'bg2': '#3A312A'}
MONO = {'art': '#3A312A', 'a2': '#FFFFFF', 'ring': '#FFFFFF', 'g': '#3A312A', 'a': '#3A312A', 'w': '#3A312A', 'f': '#3A312A', 't': '#3A312A', 'bg': None, 'bg2': '#FFFFFF'}
MAIN = {'art': '#A97C52', 'a2': '#9E7752', 'ring': '#7E5B3D', 'g': '#4A3C31', 'a': '#C99B6E', 'w': '#4A3C31', 'f': '#BCA891', 't': '#9E7752', 'bg2': '#F4EDE3'}

KERET_NELKUL = {1}   # ügyfélkérésre: az 1-es (Szorító) keret nélkül

def keret(c, x, y, w, h, s=1.0, n=None):
    if n in KERET_NELKUL: return ''
    return f'<rect x="{f2(x)}" y="{f2(y)}" width="{f2(w)}" height="{f2(h)}" fill="none" stroke="{c["f"]}" stroke-width="{f2(1.2*s)}"/>'

def mono_fix(n, c):
    c = dict(c)
    if c.get('bg') is None and n in (2, 3, 5):   # monokrómban is legyen belső rajzolat
        c['a'] = '#FFFFFF'
        c['ring'] = '#3A312A'
    return c

# Névírás: „gera” erős, „artdesign” könnyebb – így a dupla „a” nem folyik össze, és jól olvasható.
WM2 = {1: ('kumB', 'kumL', .08), 4: ('urbB', 'urbL', .09), 5: ('exaB', 'exaL', .04),
       2: ('urbB', 'urbL', .03), 3: ('urbB', 'urbL', .03)}

def _merete(fk, s, size, tr):
    _, w = text(fk, s, size, 0, 0, 0)
    return w + tr * size * len(s)

def nevir(n, c, cx, base, cel_w):
    """GERA (vékony) · ART (vastag, karamell) · DESIGN (vékony) – az ART a kiemelt szó."""
    fb, fl, tr = WM2[n]
    reszek = [(fl, 'GERA', c['w']), (fb, 'ART', c.get('art', c['a'])), (fl, 'DESIGN', c['w'])]
    gap = 0.16   # szóköz a három szó között (em) – hogy ne csússzanak egymásba
    ws = [_merete(fk, t, 10, tr) for fk, t, _ in reszek]
    size = 10 * cel_w / (sum(ws) + 2 * gap * 10)
    ws = [w * size / 10 for w in ws]; g = gap * size
    x = cx - (sum(ws) + 2 * g) / 2; out = ''
    for (fk, t, col), w in zip(reszek, ws):
        d, _ = text(fk, t, size, tr, x + w / 2 - tr * size / 2, base)
        out += f'<path d="{d}" fill="{col}"/>'
        x += w + g
    return out, size

def tagsor(c, cx, base, cel_w):
    _, w = text('tag', TAG, 10, .24, 0, 0)
    size = 10 * cel_w / w
    d, _ = text('tag', TAG, size, .24, cx + size * .24 / 2, base)
    return f'<path d="{d}" fill="{c["t"]}"/>'

def fo(n, c):
    W, H = 320, 372
    wm, size = nevir(n, c, 160, 300, 232)
    return W, H, (keret(c, 10, 10, 300, 352, n=n) + JEL[n](c, 160, 140, 164) + wm +
                  tagsor(c, 160, 300 + size * 1.05, 232))

def kompakt(n, c):
    return 200, 200, keret(c, 8, 8, 184, 184, .9, n=n) + JEL[n](c, 100, 100, 118)

def fejlec(n, c):
    H = 76; cel = 176
    W = int(84 + cel + 22)
    wm, size = nevir(n, c, 84 + cel / 2, 41, cel)
    sep = f'<rect x="70" y="18" width=".8" height="40" fill="{c["f"]}"/>'
    return W, H, (keret(c, 3, 3, W - 6, H - 6, .7, n=n) + JEL[n](c, 37, 38, 42) + sep + wm +
                  tagsor(c, 84 + cel / 2, 57, cel * 0.94))

def svg(W, H, body, bg=None, pad=0, title=''):
    vb = f'{-pad} {-pad} {W+2*pad} {H+2*pad}'
    b = f'<rect x="{-pad}" y="{-pad}" width="{W+2*pad}" height="{H+2*pad}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{W+2*pad}" height="{H+2*pad}"><title>{title}</title>{b}{body}</svg>\n'

def build():
    import shutil
    for n in (2, 3):
        shutil.rmtree(os.path.join(OUT, f'logo-{n}'), ignore_errors=True)
    for n in (1, 4, 5):
        d = os.path.join(OUT, f'logo-{n}'); os.makedirs(d, exist_ok=True)
        for old in os.listdir(d): os.remove(os.path.join(d, old))
        m, dk, mo = dict(MAIN), dict(SOTET), mono_fix(n, MONO)
        nm = f'geraartdesign – {NEVEK[n]}'
        vil = dict(m, bg2='#FBF7F1')
        files = {
            'fo': svg(*fo(n, m), title=nm),
            'vilagos': svg(*fo(n, vil), bg='#FBF7F1', pad=40, title='világos háttéren'),
            'sotet': svg(*fo(n, dk), bg=dk['bg'], pad=40, title='sötét háttéren'),
            'sotet-atlatszo': svg(*fo(n, dk), title='sötét háttérre'),
            'mono': svg(*fo(n, mo), title='monokróm'),
            'kompakt': svg(*kompakt(n, m), title='kompakt'),
            'kompakt-sotet': svg(*kompakt(n, dk), title='kompakt, sötét'),
            'social': svg(*kompakt(n, dict(m, bg2='#EEE4D7')), bg='#EEE4D7', pad=64, title='profilkép'),
            'social-sotet': svg(*kompakt(n, dk), bg=dk['bg'], pad=64, title='profilkép, sötét'),
            'fejlec': svg(*fejlec(n, m), title='fejléc'),
            'fejlec-sotet': svg(*fejlec(n, dk), title='fejléc, sötét'),
        }
        for k, v in files.items():
            open(os.path.join(d, f'geraartdesign-{n}-{k}.svg'), 'w').write(v)
    print('kész')

if __name__ == '__main__':
    build()
