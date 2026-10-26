#!/usr/bin/env python3
"""Balogh Beatrix — 3. logókör: lakkozott köröm, betű nélkül; csak a név.

Futtatás a balogh-beatrix mappából:  python3 _forras/logo_lakk.py
Kimenet: arculat/*.svg  (a szöveg Hanken Grotesk görbékből, betű nélkül is pontos)
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from logo import text_path, svg, write, INK, PAPER, GOLD  # noqa: E402

# lakk: rosé-nude / karamell, a pezsgőaranyhoz hangolva
POL = ('#E6BBA2', '#C68A6B', '#9A5D45')
BARE, BARE_EDGE, SKIN = '#F4E4D9', '#DCC2B1', '#EBD3C3'
NAME_GOLD = '#8E6A50'
_u = [0]

def uid():
    _u[0] += 1; return 'n%d' % _u[0]

def nail_d(x, y, w, h, inset=0):
    """Ápolt, mandulavégű körömlemez; a tő felé enyhén keskenyedik, a cuticula felől U-ív."""
    x += w * inset; w -= 2 * w * inset; h -= h * inset * 1.4
    P = lambda a, b: '%.2f %.2f' % (x + a * w, y + b * h)
    return ('M%s C%s %s %s C%s %s %s C%s %s %s C%s %s %s C%s %s %sZ' % (
        P(.5, 0), P(.78, 0), P(.97, .20), P(1, .46),
        P(1.02, .70), P(.98, .86), P(.88, .95),
        P(.76, 1.02), P(.24, 1.02), P(.12, .95),
        P(.02, .86), P(-.02, .70), P(0, .46),
        P(.03, .20), P(.22, 0), P(.5, 0)))

def finger(i, x, y, w, h):
    """Ujjbegy a köröm mögött: bőrszínű, lefelé elhalványuló."""
    fx, fw = x - w * .24, w * 1.48
    top = y + h * .30
    d = (f'M{fx:.2f} {y + h*1.45:.2f} L{fx:.2f} {top + fw*.42:.2f} '
         f'C{fx:.2f} {top - fw*.10:.2f} {fx + fw:.2f} {top - fw*.10:.2f} {fx + fw:.2f} {top + fw*.42:.2f} '
         f'L{fx + fw:.2f} {y + h*1.45:.2f}Z')
    return (f'<linearGradient id="{i}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EED7C8"/><stop offset=".62" stop-color="#EBD2C2"/><stop offset="1" stop-color="#EBD2C2" stop-opacity="0"/></linearGradient>'
            f'<path d="{d}" fill="url(#{i}f)"/>')

def defs(i):
    return ('<defs>'
            f'<linearGradient id="{i}p" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="{POL[0]}"/><stop offset=".55" stop-color="{POL[1]}"/><stop offset="1" stop-color="{POL[2]}"/></linearGradient>'
            f'<linearGradient id="{i}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".85"/><stop offset=".75" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            f'<linearGradient id="{i}s" x1="0" y1="0" x2="1" y2="0"><stop offset=".7" stop-color="#5A3021" stop-opacity="0"/><stop offset="1" stop-color="#5A3021" stop-opacity=".28"/></linearGradient>'
            f'<linearGradient id="{i}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3330"/><stop offset="1" stop-color="#1E1B1A"/></linearGradient>'
            '</defs>')

def gloss(i, x, y, w, h):
    """Fényes lakk: bal oldali csíkfény + csúcsfény + jobb oldali árnyék."""
    P = lambda a, b: '%.2f %.2f' % (x + a * w, y + b * h)
    streak = f'<path d="M{P(.17,.20)} C{P(.12,.38)} {P(.12,.60)} {P(.17,.80)} L{P(.25,.80)} C{P(.21,.60)} {P(.21,.38)} {P(.26,.20)}Z" fill="url(#{i}h)"/>'
    dot = f'<ellipse cx="{x + .66 * w:.2f}" cy="{y + .13 * h:.2f}" rx="{.07 * w:.2f}" ry="{.035 * h:.2f}" fill="#fff" opacity=".55" transform="rotate(25 {x + .66 * w:.2f} {y + .13 * h:.2f})"/>'
    shade = f'<path d="{nail_d(x, y, w, h)}" fill="url(#{i}s)"/>'
    return shade + streak + dot

def nail_lakk(x, y, w, h, with_finger=True):
    """Kifestett, fényes köröm az ujjbegyen; vékony szabad sáv a cuticula mentén."""
    i = uid()
    return (defs(i) + (finger(i, x, y, w, h) if with_finger else '') +
            f'<path d="{nail_d(x, y, w, h)}" fill="{BARE}"/>'
            f'<path d="{nail_d(x, y, w, h, inset=.06)}" fill="url(#{i}p)"/>' + gloss(i, x + w*.06, y, w*.88, h*.93) +
            f'<path d="{nail_d(x, y, w, h)}" fill="none" stroke="#C9A58F" stroke-opacity=".55" stroke-width="{w*.018:.2f}"/>')

def nail_festes(x, y, w, h, brush=True):
    """Festés közben: a lakk alulról félig fent, nedves hullámos széllel, ecset a szélénél."""
    i = uid()
    edge = y + h * .40
    P = lambda a, b: '%.2f %.2f' % (x + a * w, b)
    wave = (f'M{P(-.1, edge + h*.04)} C{P(.18, edge - h*.05)} {P(.36, edge + h*.07)} {P(.56, edge)} '
            f'C{P(.74, edge - h*.06)} {P(.90, edge + h*.03)} {P(1.1, edge - h*.02)} L{P(1.1, y + h*1.1)} L{P(-.1, y + h*1.1)}Z')
    out = (defs(i) + f'<clipPath id="{i}c"><path d="{wave}"/></clipPath>'
           + finger(i, x, y, w, h) +
           f'<path d="{nail_d(x, y, w, h)}" fill="{BARE}" stroke="#C9A58F" stroke-opacity=".55" stroke-width="{w*.018:.2f}"/>'
           f'<g clip-path="url(#{i}c)"><path d="{nail_d(x, y, w, h, inset=.06)}" fill="url(#{i}p)"/>' + gloss(i, x + w*.06, y, w*.88, h*.93) + '</g>')
    if brush:
        # ecset: a nyél kifut jobbra fel, a sörte vége a nedves szélen
        tipx, tipy = x + w * .60, edge + h * .02
        s = w * .62
        out += (f'<g transform="translate({tipx:.2f} {tipy:.2f}) rotate(-42)">'
                f'<path d="M0 0 C{s*.10:.2f} {-s*.07:.2f} {s*.24:.2f} {-s*.10:.2f} {s*.40:.2f} {-s*.10:.2f} L{s*.40:.2f} {s*.10:.2f} C{s*.24:.2f} {s*.10:.2f} {s*.10:.2f} {s*.07:.2f} 0 0Z" fill="url(#{i}p)"/>'
                f'<rect x="{s*.40:.2f}" y="{-s*.11:.2f}" width="{s*.16:.2f}" height="{s*.22:.2f}" rx="{s*.03:.2f}" fill="{GOLD}"/>'
                f'<path d="M{s*.56:.2f} {-s*.085:.2f} L{s*1.55:.2f} {-s*.06:.2f} C{s*1.6:.2f} {-s*.06:.2f} {s*1.6:.2f} {s*.06:.2f} {s*1.55:.2f} {s*.06:.2f} L{s*.56:.2f} {s*.085:.2f}Z" fill="url(#{i}b)"/>'
                f'<path d="M{s*.62:.2f} {-s*.045:.2f} L{s*1.5:.2f} {-s*.03:.2f}" stroke="#fff" stroke-opacity=".22" stroke-width="{s*.018:.2f}" stroke-linecap="round"/>'
                '</g>')
    return out

def name(x, base, size, ink, accent=None):
    """„Balogh Beatrix” — a Balogh könnyebb, a Beatrix teltebb súllyal."""
    d1, w1 = text_path('Balogh', 430, size, x, base)
    d2, w2 = text_path('Beatrix', 620, size, x + w1 + size * .26, base)
    return f'<path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{accent or ink}"/>', w1 + size * .26 + w2

def logo(kind, fname, ink, bg=None):
    H = 120
    mark = nail_lakk(22, 10, 46, 78) if kind == 'lakk' else nail_festes(22, 10, 46, 78)
    xn = 100 if kind == 'lakk' else 118
    body, wn = name(xn, 76, 44, ink)
    write(fname, svg(xn + wn + 14, H, mark + body, 'Balogh Beatrix', bg))

def jelek():
    write('jel-lakk.svg', svg(100, 140, nail_lakk(25, 10, 50, 86), 'Balogh Beatrix — köröm'))
    write('jel-festes.svg', svg(130, 140, nail_festes(25, 10, 50, 86), 'Balogh Beatrix — köröm festés közben'))
    # ikon / favicon: lakkozott köröm törtfehér lapon
    write('favicon.svg', svg(64, 64, f'<rect width="64" height="64" rx="15" fill="{PAPER}"/>' + nail_lakk(21, 7, 22, 40), 'Balogh Beatrix'))
    write('ikon-sotet.svg', svg(64, 64, f'<rect width="64" height="64" rx="15" fill="{INK}"/>' + nail_lakk(21, 7, 22, 40), 'Balogh Beatrix'))

def ecsetvonas(fname, ink, bg=None):
    """Csak a név, alatta egy körömlakk-ecsetvonás."""
    i = uid()
    body, wn = name(14, 70, 46, ink)
    x0, x1, y = 14 + wn * .40, 14 + wn + 2, 88
    stroke = (defs(i) +
              f'<path d="M{x0:.1f} {y+2:.1f} C{x0+40:.1f} {y-7:.1f} {x1-60:.1f} {y-9:.1f} {x1:.1f} {y-4:.1f} '
              f'C{x1+3:.1f} {y-3.4:.1f} {x1+3:.1f} {y-.6:.1f} {x1:.1f} {y-.2:.1f} C{x1-70:.1f} {y-1:.1f} {x0+50:.1f} {y+4:.1f} {x0+4:.1f} {y+9:.1f} '
              f'C{x0-3:.1f} {y+9.5:.1f} {x0-4:.1f} {y+3:.1f} {x0:.1f} {y+2:.1f}Z" fill="url(#{i}p)"/>'
              f'<path d="M{x0+16:.1f} {y+1:.1f} C{x0+70:.1f} {y-5:.1f} {x1-80:.1f} {y-6.5:.1f} {x1-12:.1f} {y-4:.1f}" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" fill="none" stroke-linecap="round"/>')
    write(fname, svg(14 + wn + 20, 108, body + stroke, 'Balogh Beatrix', bg))

if __name__ == '__main__':
    logo('lakk', 'logo-lakk.svg', INK)
    logo('lakk', 'logo-lakk-sotet.svg', PAPER, bg=INK)
    logo('festes', 'logo-festes.svg', INK)
    logo('festes', 'logo-festes-sotet.svg', PAPER, bg=INK)
    ecsetvonas('logo-ecset.svg', INK)
    ecsetvonas('logo-ecset-sotet.svg', PAPER, bg=INK)
    jelek()
