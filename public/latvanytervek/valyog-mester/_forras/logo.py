"""Vályog-Mester – logócsalád generálása (vektoros, szöveg görbére alakítva).

Futtatás a valyog-mester mappából:  python3 _forras/logo.py
Kimenet:  arculat/*.svg, favicon.svg, arculat/favicon-*.png, img/og.png
Koncepció: a V betű egymásra rakott, befelé lépcsőző vályogtéglákból épül,
fölötte a parasztház oromzatának tetővonala. Tető + falazat + monogram egy jelben.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "arculat"
ART.mkdir(exist_ok=True)

C = dict(forest="#17191B", clay="#B4532A", sand="#FFFFFF", ivory="#FFFFFF",
         char="#242521", terra="#A8481F")

# ---------- embléma geometria (100 × 100 egység) ----------
ROOF = "M50 3.5 L97.5 39.5 L86 39.5 L50 13 L14 39.5 L2.5 39.5Z"
BLOCKS = [  # x, y, w, h   – 4 sor, befelé lépcsőzve, alul záró kőként egy hosszú tégla
    (7, 45.5, 23, 10.5), (70, 45.5, 23, 10.5),
    (15.5, 58.5, 23, 10.5), (61.5, 58.5, 23, 10.5),
    (24, 71.5, 22.5, 10.5), (53.5, 71.5, 22.5, 10.5),
    (33, 84.5, 34, 10.5),
]


def emblem(roof, block, x=0, y=0, s=1.0):
    t = f'transform="translate({x} {y}) scale({s})"'
    rects = "".join(f'<rect x="{a}" y="{b}" width="{w}" height="{h}" rx=".6"/>' for a, b, w, h in BLOCKS)
    return f'<g {t}><path d="{ROOF}" fill="{roof}"/><g fill="{block}">{rects}</g></g>'


# ---------- szöveg görbére ----------
def load(path, wght, wdth=None):
    f = TTFont(path)
    if "fvar" in f:
        axes = {"wght": wght}
        if wdth and any(a.axisTag == "wdth" for a in f["fvar"].axes):
            axes["wdth"] = wdth
        f = instantiateVariableFont(f, axes)
    return f


def text_path(font, text, size, tracking=0.0):
    """Visszaad: (svg path d, szélesség, magasság-adatok) – bal-alapvonal 0,0."""
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font["head"].unitsPerEm
    sc = size / upm
    pen = SVGPathPen(gs, ntos=lambda v: (f"{v:.2f}").rstrip("0").rstrip("."))
    x = 0.0
    hmtx = font["hmtx"]
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None:
            x += size * .3; continue
        tp = TransformPen(pen, (sc, 0, 0, -sc, x, 0))
        gs[g].draw(tp)
        x += hmtx[g][0] * sc + tracking * size
    return pen.getCommands(), x - tracking * size


CORM = load(ROOT / "_forras/betu/archivo-var-teljes.woff", 700, 88)
MANR = load(ROOT / "_forras/betu/archivo-var-teljes.woff", 500, 100)

WORD, WW = text_path(CORM, "VÁLYOG-MESTER", 36, 0.02)
SUB, SW = text_path(MANR, "VÁLYOGHÁZAK · RÉGI FALAK FELÚJÍTÁSA", 8.4, 0.12)


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def horizontal(roof, block, word, sub, bg=None):
    # embléma 64 egység magas, szöveg mellette
    es = .7
    gap = 18
    tx = 100 * es + gap
    w = tx + max(WW, SW) + 2
    h = 70
    body = ""
    if bg:
        body += f'<rect width="{w+24:.1f}" height="{h+24:.1f}" x="-12" y="-12" fill="{bg}"/>'
    body += emblem(roof, block, 0, 1, es)
    body += f'<path transform="translate({tx} 40)" d="{WORD}" fill="{word}"/>'
    body += f'<path transform="translate({tx} 64)" d="{SUB}" fill="{sub}"/>'
    if bg:
        return svg(w + 24, h + 24, f'<g transform="translate(12 12)">{body.replace(f"x=\"-12\" y=\"-12\"", "x=\"-12\" y=\"-12\"")}</g>', "Vályog-Mester")
    return svg(w, h, body, "Vályog-Mester")


def stacked(roof, block, word, sub):
    es = 1.1
    w = max(WW, SW, 110) + 4
    ex = (w - 110) / 2
    body = emblem(roof, block, ex, 0, es)
    body += f'<path transform="translate({(w-WW)/2:.1f} 156)" d="{WORD}" fill="{word}"/>'
    body += f'<path transform="translate({(w-SW)/2:.1f} 176)" d="{SUB}" fill="{sub}"/>'
    return svg(w, 182, body, "Vályog-Mester")


files = {
    "logo-vizszintes-vilagos.svg": horizontal(C["forest"], C["clay"], C["forest"], "#6B6E72"),
    "logo-vizszintes-sotet.svg": horizontal("#FFFFFF", C["clay"], "#FFFFFF", "#B9BBBE"),
    "logo-allo-vilagos.svg": stacked(C["forest"], C["clay"], C["forest"], "#6B6E72"),
    "logo-allo-sotet.svg": stacked("#FFFFFF", C["clay"], "#FFFFFF", "#B9BBBE"),
    "logo-egyszinu.svg": horizontal(C["char"], C["char"], C["char"], C["char"]),
    "embléma-vilagos.svg": svg(100, 100, emblem(C["forest"], C["clay"]), "Vályog-Mester embléma"),
    "embléma-sotet.svg": svg(100, 100, emblem(C["sand"], C["clay"]), "Vályog-Mester embléma"),
    "embléma-egyszinu.svg": svg(100, 100, emblem(C["char"], C["char"]), "Vályog-Mester embléma"),
}
for name, data in files.items():
    (ART / name.replace("é", "e")).write_text(data, encoding="utf-8")
    print("arculat/" + name.replace("é", "e"))

# favicon: erdőzöld alap, homok tető, agyag téglák – kis méretben is olvasható
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
       f'<rect width="100" height="100" rx="22" fill="{C["forest"]}"/>'
       f'{emblem(C["sand"], C["clay"], 13, 11, .74)}</svg>\n')
(ROOT / "favicon.svg").write_text(fav, encoding="utf-8")
(ART / "favicon.svg").write_text(fav, encoding="utf-8")

# inline változat az oldalhoz (currentColor-alapú, CSS-ből színezhető)
sym = (f'<symbol id="vm-jel" viewBox="0 0 100 100"><path class="jel-teto" d="{ROOF}"/>'
       f'<g class="jel-tegla">' + "".join(f'<rect x="{a}" y="{b}" width="{w}" height="{h}" rx=".6"/>' for a, b, w, h in BLOCKS) +
       '</g></symbol>'
       f'<symbol id="vm-szo" viewBox="0 -32 {WW:.1f} 34"><path d="{WORD}"/></symbol>'
       f'<symbol id="vm-al" viewBox="0 -7 {SW:.1f} 8"><path d="{SUB}"/></symbol>')
(ROOT / "_forras/logo-symbols.svg").write_text(sym, encoding="utf-8")
print("WW", round(WW, 1), "SW", round(SW, 1))
