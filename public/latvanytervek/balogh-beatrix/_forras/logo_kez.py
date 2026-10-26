#!/usr/bin/env python3
"""Balogh Beatrix — 5. logókör: elegáns kéz lakkozott körmökkel (klasszikus szalonlogó-műfaj, saját rajz).

Futtatás a balogh-beatrix mappából:  python3 _forras/logo_kez.py
"""
import math, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from logo import svg, write  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.varLib.instancer import instantiateVariableFont  # noqa: E402
from fontTools.pens.svgPathPen import SVGPathPen  # noqa: E402
from fontTools.pens.transformPen import TransformPen  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
INK, PAPER, GOLD = '#2B2725', '#F7F4EF', '#BE9A7B'
ROSE = ('#E0938A', '#C46A66', '#9E4B4F')        # lakk: púderes rózsa
SUB = '#8E6A50'

# ---------------------------------------------------------------- betűk
_F = {}
def fnt(file, axes=None):
    k = (file, tuple(sorted((axes or {}).items())))
    if k not in _F:
        f = TTFont(ROOT / 'fonts' / file)
        _F[k] = instantiateVariableFont(f, axes, inplace=False) if axes else f
    return _F[k]

def text(s, file, axes, size, x, y, track=0, anchor='start'):
    f = fnt(file, axes); cm = f.getBestCmap(); gs = f.getGlyphSet(); hm = f['hmtx']
    sc = size / f['head'].unitsPerEm
    names = [cm[ord(c)] for c in s]
    width = sum(hm[g][0] for g in names) * sc + track * (len(names) - 1)
    if anchor == 'middle': x -= width / 2
    pen = SVGPathPen(gs, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.')); cx = x
    for g in names:
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, cx, y))); cx += hm[g][0] * sc + track
    return pen.getCommands(), width

SERIF = ('bodonimoda-var.woff', {'wght': 520, 'opsz': 48})
SERIF_I = ('bodonimoda-italic-var.woff', {'wght': 480, 'opsz': 48})
SANS = ('jost-var.woff', {'wght': 480})

# ---------------------------------------------------------------- kéz
def rot(px, py, a):
    c, s = math.cos(a), math.sin(a); return px * c - py * s, px * s + py * c

def finger(kx, ky, ang, L, w0, w1, bend=0.0):
    """Ujj a bütyöktől (kx,ky) ang irányba; enyhe hajlítással; kerek ujjbegy."""
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a); nx, ny = -uy, ux
    mx, my = kx + ux * L * .55 + nx * bend, ky + uy * L * .55 + ny * bend
    tx, ty = kx + ux * L, ky + uy * L
    p = lambda x, y: '%.2f %.2f' % (x, y)
    d = (f'M{p(kx + nx*w0/2, ky + ny*w0/2)} '
         f'Q{p(mx + nx*(w0+w1)/4*1.05, my + ny*(w0+w1)/4*1.05)} {p(tx + nx*w1/2, ty + ny*w1/2)} '
         f'A{w1/2:.2f} {w1/2:.2f} 0 0 0 {p(tx - nx*w1/2, ty - ny*w1/2)} '
         f'Q{p(mx - nx*(w0+w1)/4*1.05, my - ny*(w0+w1)/4*1.05)} {p(kx - nx*w0/2, ky - ny*w0/2)} Z')
    return d, (tx, ty, ux, uy, nx, ny, w1)

def nail(tip, length_k=1.0):
    """Mandula alakú, a begyen túlnyúló köröm az ujj végén."""
    tx, ty, ux, uy, nx, ny, w = tip
    L = w * 1.62 * length_k; W = w * .9
    bx, by = tx - ux * L * .52, ty - uy * L * .52          # köröm töve
    ex, ey = tx + ux * L * .48, ty + uy * L * .48          # mandulacsúcs a begy előtt
    p = lambda x, y: '%.2f %.2f' % (x, y)
    d = (f'M{p(bx + nx*W/2*.86, by + ny*W/2*.86)} '
         f'C{p(bx + nx*W/2*1.05 + ux*L*.45, by + ny*W/2*1.05 + uy*L*.45)} {p(ex + nx*W*.32, ey + ny*W*.32)} {p(ex, ey)} '
         f'C{p(ex - nx*W*.32, ey - ny*W*.32)} {p(bx - nx*W/2*1.05 + ux*L*.45, by - ny*W/2*1.05 + uy*L*.45)} {p(bx - nx*W/2*.86, by - ny*W/2*.86)} '
         f'Q{p(bx - ux*W*.28, by - uy*W*.28)} {p(bx + nx*W/2*.86, by + ny*W/2*.86)} Z')
    hl = (f'M{p(bx + nx*W*.18 + ux*L*.18, by + ny*W*.18 + uy*L*.18)} '
          f'Q{p(bx + nx*W*.24 + ux*L*.55, by + ny*W*.24 + uy*L*.55)} {p(bx + nx*W*.06 + ux*L*.82, by + ny*W*.06 + uy*L*.82)}')
    return d, hl

def hand(ox=0, oy=0, s=1.0):
    """Kézfej hátulnézetből, ujjak jobbra fel, kecsesen szétnyitva. Vissza: (alakzatok, körmök)."""
    T = lambda x, y: (ox + x * s, oy + y * s)
    shapes, nails = [], []
    # tenyér + csukló (lágy blob)
    pts = [(14, 244), (22, 196), (32, 160), (48, 132), (70, 112), (96, 104), (116, 110), (128, 126), (122, 150), (104, 180), (84, 244)]
    pts = [T(*q) for q in pts]
    d = 'M%.2f %.2f ' % pts[0]
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]; x1, y1 = pts[i + 1]
        d += 'Q%.2f %.2f %.2f %.2f ' % (x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    d += 'L%.2f %.2f Z' % pts[-1]
    shapes.append(d)
    # ujjak: (bütyök x,y, szög, hossz, tőszél, begyszél, hajlítás)
    F = [(72, 118, -76, 110, 19, 13.5, 3),     # mutató
         (90, 112, -65, 122, 19.5, 13.5, 4),   # középső
         (106, 118, -54, 110, 18.5, 13, 4),    # gyűrűs
         (118, 130, -43, 88, 16.5, 11.5, 3)]   # kisujj
    for kx, ky, a, L, w0, w1, b in F:
        k = T(kx, ky)
        fd, tip = finger(k[0], k[1], a, L * s, w0 * s, w1 * s, b * s)
        shapes.append(fd); nails.append(nail(tip))
    # hüvelykujj: balra fel, rövidebb, kifelé hajlik
    k = T(46, 146)
    fd, tip = finger(k[0], k[1], -98, 74 * s, 22 * s, 14 * s, -5 * s)
    shapes.append(fd); nails.append(nail(tip, .9))
    return shapes, nails

def grads(i):
    return (f'<linearGradient id="{i}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{ROSE[0]}"/><stop offset=".55" stop-color="{ROSE[1]}"/><stop offset="1" stop-color="{ROSE[2]}"/></linearGradient>')

def draw_hand(i, ox, oy, s, mode='line', ink=INK, fill=PAPER, sw=3.2):
    shapes, nails = hand(ox, oy, s)
    out = ''
    if mode == 'line':        # vonalas: vastag körvonal alul, kitöltés felül → egybefüggő kontúr; a csukló elhalványul
        y0, y1 = oy + 150 * s, oy + 236 * s
        out += (f'<linearGradient id="{i}fade" gradientUnits="userSpaceOnUse" x1="0" y1="{y0:.1f}" x2="0" y2="{y1:.1f}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
                f'<mask id="{i}m" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000"><rect x="-1000" y="-1000" width="3000" height="{1000 + y0:.1f}" fill="#fff"/><rect x="-1000" y="{y0:.1f}" width="3000" height="{y1 - y0:.1f}" fill="url(#{i}fade)"/></mask><g mask="url(#{i}m)">')
        out += ''.join(f'<path d="{d}" fill="{ink}" stroke="{ink}" stroke-width="{sw*2:.2f}" stroke-linejoin="round"/>' for d in shapes)
        out += ''.join(f'<path d="{d}" fill="{fill}" stroke="{fill}" stroke-width=".6"/>' for d in shapes)
        out += '</g>'
    else:                     # sziluett
        out += ''.join(f'<path d="{d}" fill="{fill}"/>' for d in shapes)
    for d, hl in nails:
        out += f'<path d="{d}" fill="url(#{i}r)"/>'
        out += f'<path d="{hl}" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="{1.5*s:.2f}" stroke-linecap="round"/>'
    return out

def brush(x, y, s, ang, i, ink=INK):
    """Körömlakk-ecset: nyél + gyűrű + sörte lakkal, a végén csepp."""
    g = (f'<g transform="translate({x:.2f} {y:.2f}) rotate({ang}) scale({s:.3f})">'
         f'<rect x="-6" y="-70" width="12" height="44" rx="3" fill="{ink}"/>'
         f'<rect x="-4.5" y="-27" width="9" height="6" rx="1" fill="{GOLD}"/>'
         f'<path d="M-4.5 -21 C-4.5 -10 -2.2 -2 0 3 C2.2 -2 4.5 -10 4.5 -21Z" fill="url(#{i}r)"/>'
         f'<rect x="-3.8" y="-66" width="2" height="36" rx="1" fill="#fff" opacity=".22"/>'
         '</g>')
    return g

def sparkle(x, y, r, col):
    k = r * .22
    return (f'<path d="M{x:.2f} {y-r:.2f} Q{x+k:.2f} {y-k:.2f} {x+r:.2f} {y:.2f} Q{x+k:.2f} {y+k:.2f} {x:.2f} {y+r:.2f} '
            f'Q{x-k:.2f} {y+k:.2f} {x-r:.2f} {y:.2f} Q{x-k:.2f} {y-k:.2f} {x:.2f} {y-r:.2f}Z" fill="{col}"/>')

# ---------------------------------------------------------------- logók
def name_block(cx, top, ink, sub, size=46, anchor='middle'):
    d1, w1 = text('Balogh Beatrix', *SERIF, size, cx, top + size * .8, anchor=anchor)
    d2, w2 = text('KÉZ- ÉS LÁBÁPOLÁS', *SANS, size * .27, cx, top + size * 1.32, track=size * .1, anchor=anchor)
    return f'<path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{sub}"/>', max(w1, w2)

def logo_kor(fname, circle=INK, handfill=PAPER, ink=INK, sub=SUB, bg=None):
    """A — kör alakú embléma, benne kéz-sziluett lakkozott körmökkel; alatta név."""
    i = 'k1'
    W, R, cx, cy = 380, 78, 190, 92
    hnd = draw_hand(i, cx - 66, cy - 62, .62, mode='fill', fill=handfill)
    clip = f'<clipPath id="{i}c"><circle cx="{cx}" cy="{cy}" r="{R}"/></clipPath>'
    em = f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{circle}"/><g clip-path="url(#{i}c)">{hnd}</g>'
    em += sparkle(cx - 46, cy - 40, 7, GOLD) + sparkle(cx - 58, cy - 18, 3.6, GOLD) + sparkle(cx + 52, cy + 30, 3.2, GOLD)
    nb, _ = name_block(cx, cy + R + 16, ink, sub)
    write(fname, svg(W, cy + R + 16 + 46 * 1.32 + 16, f'<defs>{grads(i)}{clip}</defs>' + em + nb, 'Balogh Beatrix — kéz- és lábápolás', bg))

def logo_vonal(fname, ink=INK, sub=SUB, fill=PAPER, bg=None):
    """B — vonalas kéz + ecset + csillogás, mellette a név (fekvő)."""
    i = 'k2'
    hnd = draw_hand(i, 26, 40, .62, mode='line', ink=ink, fill=fill, sw=2.6)
    br = brush(84, 50, .78, -38, i, ink)
    sp = sparkle(136, 52, 6.5, GOLD) + sparkle(150, 70, 3.4, GOLD) + sparkle(22, 110, 3, GOLD)
    nb, w = name_block(0, 84, ink, sub, size=44, anchor='start')
    nb = f'<g transform="translate(170 0)">{nb}</g>'
    write(fname, svg(170 + w + 16, 200, f'<defs>{grads(i)}</defs>' + hnd + br + sp + nb, 'Balogh Beatrix — kéz- és lábápolás', bg))

def logo_fejlec(fname, ink=INK, sub=SUB, fill=PAPER, bg=None):
    """Fejléc-változat: kisebb kéz, hangsúlyosabb név (kis magasságban is olvasható)."""
    i = 'k5' + fname[-9:-4]
    hnd = draw_hand(i, 10, 30, .40, mode='line', ink=ink, fill=fill, sw=2.2)
    br = brush(48, 37, .52, -38, i, ink)
    sp = sparkle(86, 30, 4.6, GOLD) + sparkle(95, 43, 2.4, GOLD)
    nb, w = name_block(0, 30, ink, sub, size=44, anchor='start')
    write(fname, svg(108 + w + 10, 124, f'<defs>{grads(i)}</defs>' + hnd + br + sp + f'<g transform="translate(108 0)">{nb}</g>', 'Balogh Beatrix — kéz- és lábápolás', bg))

def logo_allo(fname, ink=INK, sub=SUB, fill=PAPER, bg=None):
    """C — álló: vonalas kéz középen, alatta név; névjegyre, ajtóra."""
    i = 'k3'
    hnd = draw_hand(i, 128, 6, .64, mode='line', ink=ink, fill=fill, sw=2.6)
    sp = sparkle(108, 40, 7, GOLD) + sparkle(96, 62, 3.6, GOLD) + sparkle(268, 96, 3.2, GOLD)
    nb, _ = name_block(200, 178, ink, sub, size=44)
    write(fname, svg(400, 250, f'<defs>{grads(i)}</defs>' + hnd + sp + nb, 'Balogh Beatrix — kéz- és lábápolás', bg))

def jel(fname, circle=INK, handfill=PAPER, bg=None, size=120):
    i = 'k4'
    R = size / 2 - 2; cx = cy = size / 2
    hnd = draw_hand(i, cx - 66 * (R / 78), cy - 62 * (R / 78), .62 * (R / 78), mode='fill', fill=handfill)
    clip = f'<clipPath id="{i}c"><circle cx="{cx}" cy="{cy}" r="{R}"/></clipPath>'
    body = f'<defs>{grads(i)}{clip}</defs><circle cx="{cx}" cy="{cy}" r="{R}" fill="{circle}"/><g clip-path="url(#{i}c)">{hnd}</g>'
    body += sparkle(cx - 46 * R / 78, cy - 40 * R / 78, 7 * R / 78, GOLD)
    write(fname, svg(size, size, body, 'Balogh Beatrix'))

if __name__ == '__main__':
    logo_kor('logo-kez-kor.svg')
    logo_kor('logo-kez-kor-sotet.svg', circle='#3A3330', ink=PAPER, sub='#CDB49C', bg=INK)
    logo_vonal('logo-kez.svg')
    logo_vonal('logo-kez-sotet.svg', ink=PAPER, sub='#CDB49C', fill=INK, bg=INK)
    logo_allo('logo-kez-allo.svg')
    logo_fejlec('logo-kez-fejlec.svg')
    logo_fejlec('logo-kez-fejlec-sotet.svg', ink=PAPER, sub='#CDB49C', fill=INK)
    jel('jel-kez.svg')
    jel('favicon.svg', size=64)
