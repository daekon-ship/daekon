#!/usr/bin/env python3
"""Karikagyuru.com – arányhű vektoros újrarajzolás (JAVASLAT, nem jóváhagyott végleges logó).
Forrás: az ügyfél e-mailben küldött kocka.jpg (V embléma, 17 négyzet) és gyémántos kék logó.png (gyémánt a V közepén).
A V geometriája és szürke árnyalatai a kocka.jpg-ből mérve; a gyémánt helye és mérete a kék logóból."""
import math, sys, os

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

D = 100.0                 # egy elforgatott négyzet átlója (rácsegység)
GAP = 0.07                # rés a négyzetek között (az eredeti világos elválasztó vonala)
# Árnyalatok a kocka.jpg-ből mérve (tip = alsó közös négyzet, L/R kar a csúcstól felfelé, h = horog)
TIP = (105, 105, 105)
LEFT = [(122,) * 3, (130,) * 3, (136,) * 3, (134,) * 3, (134,) * 3, (126,) * 3]
LHOOK = [(121,) * 3, (117,) * 3]
RIGHT = [(88,) * 3, (71,) * 3, (63,) * 3, (66,) * 3, (64,) * 3, (55,) * 3]
RHOOK = [(71,) * 3, (66,) * 3]

def hexc(c): return '#%02x%02x%02x' % c

OUTLINE = None
def square(cx, cy, col, d=D):
    r = d / 2 * (1 - GAP)
    st = f' stroke="{OUTLINE}" stroke-width="{D * 0.035:.2f}"' if OUTLINE else ''
    return f'<path d="M{cx:.2f} {cy - r:.2f} L{cx + r:.2f} {cy:.2f} L{cx:.2f} {cy + r:.2f} L{cx - r:.2f} {cy:.2f}Z" fill="{hexc(col)}"{st}/>'

def v_mark(ox, oy):
    """ox, oy: a csúcsnégyzet középpontja."""
    h = D / 2
    out = [square(ox, oy, TIP)]
    for k, col in enumerate(LEFT, 1): out.append(square(ox - k * h, oy - k * h, col))
    cx, cy = ox - 6 * h, oy - 6 * h
    for j, col in enumerate(LHOOK, 1): out.append(square(cx + j * h, cy - j * h, col))
    for k, col in enumerate(RIGHT, 1): out.append(square(ox + k * h, oy - k * h, col))
    cx, cy = ox + 6 * h, oy - 6 * h
    for j, col in enumerate(RHOOK, 1): out.append(square(cx - j * h, cy - j * h, col))
    return '\n'.join(out)

def diamond(cx, top, w, stroke='#262b2e', fill='#ffffff'):
    """Vonalas briliáns: korona (tábla + háromszögek), rundiszt, pavilon a csúcsig – a kék logó rajza szerint."""
    hgt = w * 1.08
    g = top + hgt * 0.30           # rundiszt
    x0, x1 = cx - w / 2, cx + w / 2
    t0, t1 = cx - w * 0.24, cx + w * 0.24
    tip = (cx, top + hgt)
    sw = w * 0.045
    outline = f'M{t0:.2f} {top:.2f} L{t1:.2f} {top:.2f} L{x1:.2f} {g:.2f} L{tip[0]:.2f} {tip[1]:.2f} L{x0:.2f} {g:.2f} Z'
    q = [x0 + (x1 - x0) * f for f in (0.25, 0.5, 0.75)]
    facets = [
        f'M{x0:.2f} {g:.2f} L{x1:.2f} {g:.2f}',                                         # rundiszt
        f'M{t0:.2f} {top:.2f} L{q[0]:.2f} {g:.2f} L{cx:.2f} {top:.2f} L{q[2]:.2f} {g:.2f} L{t1:.2f} {top:.2f}',  # korona
        f'M{q[0]:.2f} {g:.2f} L{tip[0]:.2f} {tip[1]:.2f} M{q[2]:.2f} {g:.2f} L{tip[0]:.2f} {tip[1]:.2f}',        # pavilon
        f'M{cx:.2f} {g:.2f} L{tip[0]:.2f} {tip[1]:.2f}',
    ]
    return (f'<path d="{outline}" fill="{fill}" stroke="{stroke}" stroke-width="{sw:.2f}" stroke-linejoin="round"/>'
            f'<path d="{" ".join(facets)}" fill="none" stroke="{stroke}" stroke-width="{sw * 0.8:.2f}" stroke-linejoin="round" stroke-linecap="round"/>')

# --- Szóvédjegy: szögletes, egyvonalas betűk (az eredeti „techno” jellegű, ritkított feliratához igazítva) ---
CAP = 10.0
def glyph(ch):
    """Pálya egy 10 egység magas cellában; visszaad (path, szélesség)."""
    W = 8.0; r = 1.6   # lekerekítés
    if ch == 'K': return ('M0 0 V10 M0 5.4 H2.2 L8 0 M2.2 5.4 L8 10', W)
    if ch == 'A': return (f'M0 10 V{r} Q0 0 {r} 0 H{W - r} Q{W} 0 {W} {r} V10 M0 5.6 H{W}', W)
    if ch == 'R': return (f'M0 10 V0 H{W - r} Q{W} 0 {W} {r} V{5.4 - r} Q{W} 5.4 {W - r} 5.4 H0 M4.2 5.4 L{W} 10', W)
    if ch == 'I': return ('M0 0 V10', 0.0)
    if ch == 'G': return (f'M{W} {r} Q{W} 0 {W - r} 0 H{r} Q0 0 0 {r} V{10 - r} Q0 10 {r} 10 H{W - r} Q{W} 10 {W} {10 - r} V5.2 H4.4', W)
    if ch == 'Y': return (f'M0 0 V{4.4 - r} Q0 5.2 {r} 5.2 H{W - r} Q{W} 5.2 {W} {4.4 - r} V0 M4 5.2 V10', W)
    if ch == 'U': return (f'M0 0 V{10 - r} Q0 10 {r} 10 H{W - r} Q{W} 10 {W} {10 - r} V0', W)
    if ch == 'C': return (f'M{W} 0 H{r} Q0 0 0 {r} V{10 - r} Q0 10 {r} 10 H{W}', W)
    if ch == 'O': return (f'M{r} 0 H{W - r} Q{W} 0 {W} {r} V{10 - r} Q{W} 10 {W - r} 10 H{r} Q0 10 0 {10 - r} V{r} Q0 0 {r} 0 Z', W)
    if ch == 'M': return (f'M0 10 V{r} Q0 0 {r} 0 H{10 - r} Q10 0 10 {r} V10 M5 0 V10', 10.0)
    if ch == '.': return ('M0 9.3 V10', 0.0)
    raise ValueError(ch)

def wordmark(x, y, width, color, cap_px, text='KARIKAGYURU.COM'):
    """Kifeszített, erősen ritkított felirat. y = betűk felső éle; cap_px = betűmagasság (az eredetiben 0,43 egység)."""
    gl = [glyph(c) for c in text]
    k = cap_px / CAP
    raw = width / k
    track = (raw - sum(g[1] for g in gl)) / (len(gl) - 1)
    sw = 1.25
    parts, cx = [], 0.0
    for (p, w) in gl:
        parts.append(f'<path transform="translate({cx:.3f} 0)" d="{p}"/>')
        cx += w + track
    return (f'<g transform="translate({x:.2f} {y:.2f}) scale({k:.4f})" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="square" stroke-linejoin="miter">{"".join(parts)}</g>', cap_px)

def logo(mode='light', with_diamond=True, with_text=True, bg=None, text_color=None):
    """mode: light = sötét felirat (világos háttérre), dark = fehér felirat (sötét/kék háttérre)."""
    vw, vh = 7 * D, 5 * D
    pad = D * 0.35
    W = (1.66 * vw if with_text else vw) + 2 * pad
    tip_cx, tip_cy = W / 2, pad + 4.5 * D
    v_left = tip_cx - 3.5 * D
    top_v = tip_cy - 4.5 * D
    global OUTLINE
    OUTLINE = '#ffffff' if mode == 'dark' else None   # a kék eredetin a négyzeteket vékony fehér vonal keretezi
    body = [v_mark(tip_cx, tip_cy)]
    if with_diamond:
        dw = 2.45 * D   # a kék logóból mérve: 2,45 négyzetátló széles, teteje 0,67 egységgel a V teteje alatt
        body.append(diamond(tip_cx, top_v + D * 0.67, dw, stroke='#262b2e' if mode == 'light' else '#1c2226'))
    H = top_v + vh + pad
    if with_text:
        ty = tip_cy + D * 0.5 + D * 0.55
        wm, th = wordmark(pad + 0.02 * vw, ty, 1.62 * vw, text_color or ('#1f2427' if mode == 'light' else '#ffffff'), 0.43 * D)
        body.append(wm); H = ty + th + pad
    rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.1f} {H:.1f}" width="{W:.0f}" height="{H:.0f}" role="img" aria-label="KARIKAGYURU.COM">'
            f'<title>KARIKAGYURU.COM</title>{rect}{"".join(body)}</svg>')

files = {
    'karikagyuru-logo-gyemant.svg': logo('light', True, True),                    # A KÉRT: sima logó + gyémánt, átlátszó
    'karikagyuru-logo-gyemant-sotet-alapra.svg': logo('dark', True, True),         # ugyanez sötét / kék háttérre (fehér felirat)
    'karikagyuru-jel-gyemant.svg': logo('light', True, False),                     # csak az embléma (fejléc, favicon)
    'karikagyuru-logo-kek-alapon.svg': logo('dark', True, True, bg='#00bfde', text_color='#1f2427'),   # a kék logó arányhű vektoros változata (sötét felirat, mint az eredetin)
}
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s)
print('\n'.join(files))
