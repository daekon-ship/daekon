#!/usr/bin/env python3
"""Balogh Beatrix — logóváltozatok generálása (vektoros, betű nélkül is működő SVG-k).

Futtatás a balogh-beatrix mappából:  python3 _forras/logo.py
Kimenet: arculat/*.svg
A szövegek a Hanken Grotesk görbéiből készülnek (OFL), így az SVG-k
betűtípus telepítése nélkül is pontosan jelennek meg.
"""
import pathlib, io
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'arculat'; OUT.mkdir(exist_ok=True)
SRC = ROOT / 'fonts' / 'hanken-var.woff'

INK, GOLD, PAPER, SAGE = '#2B2725', '#BE9A7B', '#F7F4EF', '#929B89'
GOLD_DARK = '#9C7A5E'

_cache = {}
def font(w):
    if w not in _cache:
        f = TTFont(SRC)
        _cache[w] = instantiateVariableFont(f, {'wght': w}, inplace=False)
    return _cache[w]

def kern_table(f):
    """GPOS PairPos (format 1) kerning → dict[(g1,g2)] = adjust (best effort)."""
    k = {}
    if 'GPOS' not in f: return k
    for lookup in f['GPOS'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            st = getattr(st, 'ExtSubTable', st)
            if getattr(st, 'Format', None) == 1 and hasattr(st, 'PairSet'):
                cov = st.Coverage.glyphs
                for i, ps in enumerate(st.PairSet):
                    for rec in ps.PairValueRecord:
                        v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        if v: k[(cov[i], rec.SecondGlyph)] = v
            elif getattr(st, 'Format', None) == 2 and hasattr(st, 'Class1Record'):
                cov = set(st.Coverage.glyphs)
                c1 = st.ClassDef1.classDefs; c2 = st.ClassDef2.classDefs
                for g1 in cov:
                    r1 = st.Class1Record[c1.get(g1, 0)]
                    for g2, cl in list(c2.items()):
                        rec = r1.Class2Record[cl]
                        v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        if v: k.setdefault((g1, g2), v)
    return k

_kern = {}
def text_path(s, weight, size, x=0, y=0, track=0):
    """Szöveg → SVG path 'd' (alapvonal y-on), visszaadja (d, szélesség)."""
    f = font(weight)
    if weight not in _kern: _kern[weight] = kern_table(f)
    cmap = f.getBestCmap(); gs = f.getGlyphSet(); hmtx = f['hmtx']
    upm = f['head'].unitsPerEm; sc = size / upm
    names = [cmap[ord(c)] for c in s]
    pen = SVGPathPen(gs, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.')); cx = 0
    for i, g in enumerate(names):
        tp = TransformPen(pen, (sc, 0, 0, -sc, x + cx * sc, y))
        gs[g].draw(tp)
        adv = hmtx[g][0]
        if i + 1 < len(names): adv += _kern[weight].get((g, names[i + 1]), 0)
        cx += adv + track / sc if i + 1 < len(names) else adv
    return pen.getCommands(), cx * sc

def almond(cx, top, h, fill=None, stroke=None, sw=0):
    """Mandula körmöt idéző forma: keskeny, kerek csúcs, telt alap."""
    w = h * .62; l = cx - w / 2
    P = lambda a, b: f'{l + a * w:.2f} {top + b * h:.2f}'
    d = (f'M{P(.5, 0)} C{P(.84, 0)} {P(1, .30)} {P(1, .60)} L{P(1, .80)} C{P(1, .94)} {P(.80, 1)} {P(.5, 1)} '
         f'C{P(.20, 1)} {P(0, .94)} {P(0, .80)} L{P(0, .60)} C{P(0, .30)} {P(.16, 0)} {P(.5, 0)}Z')
    a = f'fill="{fill}"' if fill else 'fill="none"'
    if stroke: a += f' stroke="{stroke}" stroke-width="{sw}"'
    return f'<path d="{d}" {a}/>'

def svg(w, h, body, title, bg=None):
    title = title.replace('&', '&amp;')
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{b}{body}</svg>\n')

def write(name, content):
    (OUT / name).write_text(content, encoding='utf-8'); print('írva: arculat/' + name)

# ---------------------------------------------------------------------------
# 1 · „Mandula" — szóvédjegy: beatrix, az i pontja mandula alakú köröm
# ---------------------------------------------------------------------------
def mandula(ink, gold, sub, name, bg=None):
    size = 100
    d1, w1 = text_path('beatr', 560, size, 0, 100)
    _, wi = text_path('ı', 560, size)
    d2, w2 = text_path('ıx', 560, size, w1, 100)
    # a pontnélküli ı szára közepe fölé kerül a mandula
    f = font(560); gs = f.getGlyphSet(); sc = size / 1000
    from fontTools.pens.boundsPen import BoundsPen
    bp = BoundsPen(gs); gs[f.getBestCmap()[ord('ı')]].draw(bp)
    xmin, _, xmax, ymax = bp.bounds
    icx = w1 + (xmin + xmax) / 2 * sc
    stem_top = 100 - ymax * sc
    nail = almond(icx, stem_top - 30, 24, fill=gold)
    total = w1 + w2
    d3, w3 = text_path('BALOGH  ·  FOOT & NAIL STUDIO', 560, 15.5, 0, 140, track=3.1)
    x3 = (total - w3) / 2
    d3, _ = text_path('BALOGH  ·  FOOT & NAIL STUDIO', 560, 15.5, x3, 140, track=3.1)
    pad = 18
    body = (f'<g transform="translate({pad} {pad})"><path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{ink}"/>{nail}'
            f'<path d="{d3}" fill="{sub}"/></g>')
    write(name, svg(total + pad * 2, 140 + pad * 2 + 4, body, 'Balogh Beatrix — Foot & Nail Studio', bg))
    return total

# ---------------------------------------------------------------------------
# 2 · „Öt pont" — öt, fokozatosan kisebb pont ívben (lábujjak) + név
# ---------------------------------------------------------------------------
def otpont(ink, gold, sub, name, bg=None):
    dots = ''
    import math
    toes = [(14, 44, 9.2), (33, 31.5, 6.6), (49.5, 29, 5.8), (64, 32.5, 5.0), (76, 39.5, 4.3)]
    for x, y, r in toes:
        dots += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{gold}"/>'
    d1, w1 = text_path('Balogh Beatrix', 600, 40, 96, 58)
    d2, w2 = text_path('FOOT & NAIL STUDIO', 600, 12.5, 97, 80, track=3.4)
    body = f'{dots}<path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{sub}"/>'
    write(name, svg(96 + max(w1, w2) + 14, 96, body, 'Balogh Beatrix — Foot & Nail Studio', bg))

# ---------------------------------------------------------------------------
# 3 · „Monogram" — mandula keret, benne kisbetűs b
# ---------------------------------------------------------------------------
def jel(ink, gold, paper, name, filled=True, bg=None):
    H = 120
    if filled:
        shape = almond(50, 6, H - 12, fill=ink) + almond(50, 13, H - 26, stroke=gold, sw=1.4)
        col = paper
    else:
        shape = almond(50, 6, H - 12, stroke=ink, sw=2.2)
        col = ink
    d, w = text_path('b', 600, 54, 0, 0)
    d, _ = text_path('b', 600, 54, 50 - w / 2, 92)
    body = shape + f'<path d="{d}" fill="{col}"/>'
    write(name, svg(100, H, body, 'Balogh Beatrix jel', bg))

def favicon():
    H = 64
    body = (f'<rect width="64" height="64" rx="14" fill="{INK}"/>' + almond(32, 9, 46, fill='none', stroke=GOLD, sw=2.2))
    d, w = text_path('b', 640, 30, 0, 0)
    d, _ = text_path('b', 640, 30, 32 - w / 2, 47)
    body += f'<path d="{d}" fill="{PAPER}"/>'
    write('favicon.svg', svg(64, 64, body, 'Balogh Beatrix'))

def kombinalt(name, ink, gold, sub, paper, bg=None):
    """Fejléc-logó: jel + Balogh Beatrix + alcím, egy sorban."""
    H = 64
    mark = almond(22, 4, 56, fill=ink) + almond(22, 8.5, 47, stroke=gold, sw=1.1)
    d, w = text_path('b', 620, 26, 0, 0)
    d, _ = text_path('b', 620, 26, 22 - w / 2, 46)
    mark += f'<path d="{d}" fill="{paper}"/>'
    t1, w1 = text_path('Balogh Beatrix', 600, 25, 58, 33)
    t2, w2 = text_path('FOOT & NAIL STUDIO', 600, 9.6, 58.5, 50, track=2.7)
    body = mark + f'<path d="{t1}" fill="{ink}"/><path d="{t2}" fill="{sub}"/>'
    write(name, svg(58 + max(w1, w2) + 6, H, body, 'Balogh Beatrix — Foot & Nail Studio', bg))

if __name__ == '__main__':
    # 3. kör óta a logók forrása: logo_lakk.py (a fenti segédfüggvényeket használja)
    import runpy
    runpy.run_path(str(pathlib.Path(__file__).with_name('logo_lakk.py')), run_name='__main__')
