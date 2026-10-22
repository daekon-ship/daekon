"""Kalocsa GeoWorks – logócsalád (az ügyfél X-jelének tiszta, vektoros újrarajzolása).

Futtatás a kalocsa-zoltan mappából:  python3 _forras/logo.py
Az eredeti jel: fekete átlós rúd + alsó szár, és egy rövid, levált felső szár (ez eddig arany/barna volt → narancs).
Az újrarajzolásban a két szár pontosan egy egyenesre esik, a szögek 45°-osak, a tompaszögű sarkok lekerekítettek,
a felirat görbére alakítva (Archivo), így bármilyen méretben éles.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "arculat"; ART.mkdir(exist_ok=True)
INK, ORANGE, LIGHT, GRAPH = "#1E2226", "#F27A21", "#F2F3F4", "#2B3137"

# ---------- jel: 102 × 100 egység ----------
def rpath(pts, rad):
    """Sokszög lekerekített sarkokkal (rad: sarkonkénti sugár, 0 = éles)."""
    import math
    n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        r = rad[i]
        if not r:
            out.append(("L", p1)); continue
        def toward(a, b, d):
            L = math.dist(a, b); return (a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L)
        out.append(("L", toward(p1, p0, r))); out.append(("Q", p1, toward(p1, p2, r)))
    s = f"M{out[0][1][0]:.2f} {out[0][1][1]:.2f}"
    for o in out[1:]:
        s += f"L{o[1][0]:.2f} {o[1][1]:.2f}" if o[0] == "L" else f"Q{o[1][0]:.2f} {o[1][1]:.2f} {o[2][0]:.2f} {o[2][1]:.2f}"
    return s + "Z"

BAR = rpath([(0, 85), (17, 85), (102, 0), (85, 0)], [0, 5, 0, 5])              # fő átló
LEG = rpath([(29.75, 63.75), (38.25, 55.25), (83, 100), (66, 100)], [0, 0, 0, 5])  # alsó szár (a rúdba fut)
TIP = rpath([(0, 34), (17, 34), (30.5, 47.5), (22, 56)], [0, 5, 0, 0])         # felső, levált szár – NARANCS

# finom, „fémes” színátmenetek (prémium hatás, kis méretben is tiszta marad)
GRAD = {
    ORANGE: ("#F89545", "#E0620E"),
    INK: ("#30363C", "#15181B"),
    LIGHT: ("#FFFFFF", "#D3D8DD"),
}
def defs(*cols):
    out = ""
    for c in cols:
        if c in GRAD:
            a, b = GRAD[c]
            out += (f'<linearGradient id="kg{c[1:]}" x1="0" y1="0" x2="1" y2="1">'
                    f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
    return f"<defs>{out}</defs>" if out else ""
def paint(c):
    return f"url(#kg{c[1:]})" if c in GRAD else c
def mark(main, accent, x=0, y=0, s=1.0):
    return (f'<g transform="translate({x:.2f} {y:.2f}) scale({s})">'
            f'<path d="{BAR}" fill="{paint(main)}"/><path d="{LEG}" fill="{paint(main)}"/><path d="{TIP}" fill="{paint(accent)}"/></g>')

# ---------- felirat görbére ----------
def load(wght, wdth):
    return instantiateVariableFont(TTFont(ROOT / "_forras/betu/archivo-var-teljes.woff"), {"wght": wght, "wdth": wdth})
def text_path(font, text, size, tracking=0.0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); sc = size / font["head"].unitsPerEm; hmtx = font["hmtx"]
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip(".")); x = 0.0
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None: x += size * .3; continue
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, x, 0))); x += hmtx[g][0] * sc + tracking * size
    return pen.getCommands(), x - tracking * size

HEAVY = load(860, 112); MED = load(600, 100)
K, KW = text_path(HEAVY, "KALOCSA", 30, .045)
G, GW = text_path(HEAVY, "GEOWORKS", 30, .045)
S, SW = text_path(MED, "GÉPI FÖLDMUNKA", 9.6, .2)

def svg(w, h, body, title="Kalocsa GeoWorks"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{defs(ORANGE, INK, LIGHT)}{body}</svg>\n')

def stacked(main, accent, word, sub, bg=None):
    # az eredeti elrendezés: nagy jel, a név a rúd alatt, az alsó szártól balra (kétsoros, balra zárt)
    m = 3.0; ts = .7                      # jel- és szövegméret-szorzó
    w, h = 102 * m, 100 * m + 34
    y1 = 85 * m + 12 + 30 * ts * .74 + 6     # első sor alapvonala a rúd alatt
    b = (f'<rect width="{w+80:.1f}" height="{h+80:.1f}" x="-40" y="-40" fill="{bg}"/>' if bg else "")
    b += mark(main, accent, 0, 0, m)
    b += f'<g transform="translate(1 {y1:.1f}) scale({ts})"><path d="{K}" fill="{word}"/><path transform="translate(0 33)" d="{G}" fill="{accent}"/>'
    b += f'<path transform="translate(1 {33+24:.1f}) scale(1.25)" d="{S}" fill="{sub}"/></g>'
    return svg(w + 80, h + 80, f'<g transform="translate(40 40)">{b}</g>') if bg else svg(w, h, b)

def horizontal(main, accent, word, sub):
    s = .62; tx = 102 * s + 16; w = tx + max(KW + 10 + GW, SW) * .8 + 2
    b = mark(main, accent, 0, 0, s)
    b += f'<g transform="translate({tx:.1f} 32) scale(.8)"><path d="{K}" fill="{word}"/><path transform="translate({KW+9:.1f} 0)" d="{G}" fill="{accent}"/></g>'
    b += f'<path transform="translate({tx+1:.1f} 56) scale(.95)" d="{S}" fill="{sub}"/>'
    return svg(w, 62, b)

files = {
    "logo-allo-vilagos.svg": stacked(INK, ORANGE, INK, "#5B636B"),
    "logo-allo-sotet.svg": stacked(LIGHT, ORANGE, LIGHT, "#A9B0B7"),
    "logo-allo-feher-alapon.svg": stacked(INK, ORANGE, INK, "#5B636B", "#FFFFFF"),
    "logo-fekvo-vilagos.svg": horizontal(INK, ORANGE, INK, "#5B636B"),
    "logo-fekvo-sotet.svg": horizontal(LIGHT, ORANGE, LIGHT, "#A9B0B7"),
    "jel-vilagos.svg": svg(102, 100, mark(INK, ORANGE)),
    "jel-sotet.svg": svg(102, 100, mark(LIGHT, ORANGE)),
}
for n, data in files.items(): (ART / n).write_text(data, encoding="utf-8"); print("arculat/" + n)
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{defs(ORANGE, LIGHT)}<rect width="100" height="100" rx="20" fill="{GRAPH}"/>'
       f'{mark(LIGHT, ORANGE, 17.5, 18, .64)}</svg>\n')
(ROOT / "logo-jel.svg").write_text(fav, encoding="utf-8")
(ROOT / "logo.svg").write_text(files["logo-fekvo-sotet.svg"], encoding="utf-8")
# inline jel az oldalhoz (CSS-ből színezhető: .km-a = fő szín, .km-b = narancs szár)
(ROOT / "_forras/jel-inline.txt").write_text(
    f'<svg class="brand__mark" viewBox="0 0 102 100" aria-hidden="true"><path class="km-a" d="{BAR}"/><path class="km-a" d="{LEG}"/><path class="km-b" d="{TIP}"/></svg>', encoding="utf-8")
print("KW GW SW", round(KW), round(GW), round(SW))
