#!/usr/bin/env python3
"""Beatrix logójának vektorizálása (kontúrkövetés) → arculat/logo.svg, arculat/embléma.svg
A rajzolódó (Motion pathLength) animációhoz minden alakzat külön <path>.
Futtatás: python3 _forras/logo_vektor.py <eredeti logó jpg>"""
import sys, numpy as np, cv2
SRC = sys.argv[1]
L = cv2.imread(SRC, cv2.IMREAD_GRAYSCALE).astype(np.float32)
a = np.clip((229 - L) / 189, 0, 1)
a[560:617, 990:1040] = 0                       # kósza jel a B szára fölött
S = 3                                          # felskálázás a sima kontúrokért
a = cv2.resize(a, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
a = cv2.GaussianBlur(a, (0, 0), 1.2)
m = (a > .42).astype(np.uint8)
m[1244 * S:] = (a[1244 * S:] > .16)            # a vékony, szürke alcím alacsonyabb küszöbbel
# apró szennyeződések ki
n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
for i in range(1, n):
    lim = 6 if st[i, cv2.CC_STAT_TOP] > 1244 * S else 40
    if st[i, cv2.CC_STAT_AREA] < lim * S * S: m[lab == i] = 0
X0, Y0, X1, Y1 = 592, 440, 1545, 1306          # a teljes logó doboza (eredeti px)
def smooth_path(pts):
    """Catmull-Rom → köbös Bézier, zárt görbe."""
    p = pts.astype(float); n = len(p); d = []
    d.append(f'M{p[0][0]:.1f} {p[0][1]:.1f}')
    for i in range(n):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % n], p[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        d.append(f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}')
    return ''.join(d) + 'Z'
cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
hier = hier[0]
groups = {'emblem': [], 'word': [], 'sub': []}
for i, c in enumerate(cs):
    if hier[i][3] != -1: continue              # lyukat a szülőjével együtt írjuk
    parts = [c] ; j = hier[i][2]
    while j != -1: parts.append(cs[j]); j = hier[j][0]
    d = ''
    for pc in parts:
        ap = cv2.approxPolyDP(pc, 1.3, True).reshape(-1, 2)
        if len(ap) < 3: continue
        ap = ap / S - [X0, Y0]
        d += smooth_path(ap)
    if not d: continue
    y = c[:, 0, 1].mean() / S
    g = 'emblem' if y < 1146 else ("word" if y < 1244 else 'sub')
    x = c[:, 0, 0].min()
    groups[g].append((x, d))
W, H = X1 - X0, Y1 - Y0
def paths(g): return ''.join(f'<path d="{d}"/>' for _, d in sorted(groups[g]))
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Beatrix Nails &amp; Pedikűr">'
       f'<title>Beatrix Nails &amp; Pedikűr</title><g fill="currentColor" fill-rule="evenodd">'
       f'<g class="lg-emblem">{paths("emblem")}</g><g class="lg-word">{paths("word")}</g><g class="lg-sub" opacity=".78">{paths("sub")}</g></g></svg>\n')
open('arculat/logo.svg', 'w').write(svg)
print({k: len(v) for k, v in groups.items()}, len(svg) // 1024, 'KB')

# ---- fejléc-változat (embléma balra, felirat jobbra) + világos változatok ----
import re
def bbox(g):
    xs, ys = [], []
    for _, d in groups[g]:
        nums = list(map(float, re.findall(r'-?\d+\.?\d*', d)))
        xs += nums[0::2]; ys += nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)
ex0, ey0, ex1, ey1 = bbox('emblem')
wx0, wy0, wx1, wy1 = bbox('word'); sx0, sy0, sx1, sy1 = bbox('sub')
tx0, ty0, tx1, ty1 = min(wx0, sx0), wy0, max(wx1, sx1), sy1
EH = ey1 - ey0; k = (EH * .40) / (ty1 - ty0); gap = EH * .06
EW = ex1 - ex0; TW = (tx1 - tx0) * k
LW, LH = EW + gap + TW, EH
ty = (EH - (ty1 - ty0) * k) / 2 + EH * .03
head = (f'<svg xmlns="http://www.w3.org/2000/svg" class="logo logo--svg" viewBox="0 0 {LW:.0f} {LH:.0f}" role="img" aria-label="Beatrix Nails &amp; Pedikűr">'
        f'<g fill="currentColor" fill-rule="evenodd"><g class="lg-emblem" transform="translate({-ex0:.1f} {-ey0:.1f})">{paths("emblem")}</g>'
        f'<g transform="translate({EW + gap:.1f} {ty:.1f}) scale({k:.4f}) translate({-tx0:.1f} {-ty0:.1f})"><g class="lg-word">{paths("word")}</g><g class="lg-sub" opacity=".78">{paths("sub")}</g></g></g></svg>')
open('arculat/logo-fejlec.svg', 'w').write(head.replace(' class="logo logo--svg"', '') + '\n')
open('_forras/logo-fejlec.inline.svg', 'w').write(head)
open('arculat/logo-vilagos.svg', 'w').write(svg.replace('fill="currentColor"', 'fill="#F7F4EF"'))
open('arculat/logo.svg', 'w').write(svg.replace('fill="currentColor"', 'fill="#2B2725"'))
open('_forras/logo.inline.svg', 'w').write(svg.replace('<svg xmlns', '<svg class="logo-draw" xmlns'))
print('lockup', round(LW), round(LH))
