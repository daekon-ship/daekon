#!/usr/bin/env python3
"""Balogh Beatrix — 4. logókör: a BB monogram két lábnyom.

Egy tükrözött B (bal talp) és egy B (jobb talp): a B felső íve a talppárna,
az alsó a sarok, fölötte öt ujjpont. Futtatás: python3 _forras/logo_lab.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from logo import text_path, svg, write, INK, PAPER, GOLD, font  # noqa: E402
from fontTools.pens.boundsPen import BoundsPen  # noqa: E402

GOLD_INK = '#8E6A50'

def foot_b(ox, oy, s=1.0, mirror=False, col=INK, toe=GOLD, sw=9.0, tilt=7):
    """Lábnyom-B: egyenes gerinc (belső talpél), széles felső öböl (talppárna),
    keskenyebb alsó öböl (sarok), szűk derék (lábív) + öt ujjpont.
    Jobb láb: gerinc balra; mirror=True: bal láb. A talp kissé kifelé fordul (tilt)."""
    m = -1 if mirror else 1
    def P(x, y): return f'{x*m:.2f} {y:.2f}'
    d = (f'M{P(0,104)} L{P(0,4)} L{P(10,4)} '
         f'C{P(42,2)} {P(58,18)} {P(56,32)} C{P(54,46)} {P(36,52)} {P(14,54)} L{P(0,54)} '
         f'M{P(13,54)} C{P(30,55)} {P(39,66)} {P(39,80)} C{P(39,95)} {P(28,104)} {P(12,104)} L{P(0,104)}')
    g = f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{sw:.2f}" stroke-linejoin="round" stroke-linecap="round"/>'
    for x, y, r in [(8, -13, 7.6), (24, -19, 5.8), (37.5, -18.5, 5.0), (48, -13.5, 4.3), (55.5, -6, 3.7)]:
        g += f'<circle cx="{x*m:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{toe}"/>'
    return f'<g transform="translate({ox:.2f} {oy:.2f}) scale({s:.3f}) rotate({tilt*m:.1f} 0 104)">{g}</g>'

def mark(ox, oy, s=1.0, col=INK, toe=GOLD):
    """A pár: bal talp (tükrözött B) + jobb talp (B), a talpak között keskeny hézag."""
    gap = 16
    return (foot_b(ox + 60 * s, oy, s, mirror=True, col=col, toe=toe) +
            foot_b(ox + (60 + gap) * s, oy, s, col=col, toe=toe))

def name_paths(x, base, size, ink, weights=(430, 620)):
    d1, w1 = text_path('Balogh', weights[0], size, x, base)
    d2, w2 = text_path('Beatrix', weights[1], size, x + w1 + size * .26, base)
    return f'<path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{ink}"/>', w1 + size * .26 + w2

def logo_pair(fname, ink, toe, bg=None):
    s = .74
    m = mark(10, 34, s, ink, toe)
    body, wn = name_paths(132, 92, 40, ink)
    write(fname, svg(132 + wn + 14, 128, m + body, 'Balogh Beatrix', bg))

def logo_stacked(fname, ink, toe, bg=None):
    body, wn = name_paths(0, 0, 34, ink)
    W = max(wn, 140) + 40
    s = .9; mw = (60 + 16 + 60) * s
    m = mark((W - mw) / 2, 30, s, ink, toe)
    body, wn = name_paths((W - wn) / 2, 178, 34, ink)
    write(fname, svg(W, 196, m + body, 'Balogh Beatrix', bg))

def jel(fname, ink, toe, bg=None, size=140):
    s = 1.0
    write(fname, svg(size, size, (f'<rect width="{size}" height="{size}" rx="{size*.22:.0f}" fill="{bg}"/>' if bg else '') +
                     mark((size - 136 * s * .82) / 2, (size - 104 * s * .82) / 2 + 9, s * .82, ink, toe), 'Balogh Beatrix jel'))

def ujjpont_nev(fname, ink, toe, bg=None):
    """B változat: csak a név, a két nagy B fölött öt-öt ujjpont — a betűk kis talpakká válnak."""
    size, base, x0 = 48, 84, 14
    f = font(430); gs = f.getGlyphSet(); cm = f.getBestCmap(); sc = size / 1000
    out, x = '', x0
    for word, wt in (('Balogh', 430), ('Beatrix', 620)):
        d, w = text_path(word, wt, size, x, base)
        out += f'<path d="{d}" fill="{ink}"/>'
        # ujjpontok a B fölött (a B gerince balra van → nagyujj balra)
        ff = font(wt); g = ff.getGlyphSet()[ff.getBestCmap()[ord('B')]]
        bp = BoundsPen(ff.getGlyphSet()); g.draw(bp); xmin, _, xmax, ymax = bp.bounds
        bx0, bx1, top = x + xmin * sc, x + xmax * sc, base - ymax * sc
        bw = bx1 - bx0
        for fx, fy, r in ((.16, -7.2, 3.3), (.42, -9.0, 2.5), (.63, -8.2, 2.15), (.80, -5.9, 1.85), (.93, -2.6, 1.55)):
            out += f'<circle cx="{bx0 + fx * bw:.2f}" cy="{top + fy:.2f}" r="{r:.2f}" fill="{toe}"/>'
        x += w + size * .26
    write(fname, svg(x - size * .26 + 14, 104, out, 'Balogh Beatrix', bg))

def tiszta_nev(fname, ink, sub, bg=None):
    """C változat: jel nélkül — név + vékony alcím."""
    body, wn = name_paths(14, 62, 44, ink)
    d, w = text_path('KÉZ- ÉS LÁBÁPOLÁS', 560, 12, 0, 0, track=3.6)
    d, _ = text_path('KÉZ- ÉS LÁBÁPOLÁS', 560, 12, 14 + (wn - w) / 2, 92, track=3.6)
    line = f'<path d="M14 80.5 H{14 + (wn - w) / 2 - 10:.1f} M{14 + (wn + w) / 2 + 10:.1f} 80.5 H{14 + wn:.1f}" stroke="{sub}" stroke-width="1"/>'
    write(fname, svg(wn + 28, 104, body + line + f'<path d="{d}" fill="{sub}"/>', 'Balogh Beatrix — kéz- és lábápolás', bg))

if __name__ == '__main__':
    logo_pair('logo-lab.svg', INK, GOLD)
    logo_pair('logo-lab-sotet.svg', PAPER, GOLD, bg=INK)
    logo_stacked('logo-lab-allo.svg', INK, GOLD)
    logo_stacked('logo-lab-allo-sotet.svg', PAPER, GOLD, bg=INK)
    jel('jel-lab.svg', INK, GOLD)
    jel('ikon-lab-sotet.svg', PAPER, GOLD, bg=INK)
    jel('favicon.svg', INK, '#A57E60', bg=PAPER, size=140)
    ujjpont_nev('logo-ujjpont.svg', INK, GOLD)
    ujjpont_nev('logo-ujjpont-sotet.svg', PAPER, GOLD, bg=INK)
    tiszta_nev('logo-nev.svg', INK, GOLD_INK)
    tiszta_nev('logo-nev-sotet.svg', PAPER, '#CDB49C', bg=INK)
