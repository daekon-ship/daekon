"""Szöveg -> SVG útvonal (betűk görbékké alakítva), hogy a logók betűtípus nélkül is pontosak legyenek."""
import math, os
from functools import lru_cache
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = {
    "archivo": os.path.join(HERE, "betu", "archivo-var-teljes.woff"),
    "manrope": os.path.join(HERE, "betu", "manrope-var.woff"),
}

# kézi alávágás (em-ben) nagybetűs párokra
KERN = {
    "LY": -0.07, "AV": -0.06, "VA": -0.06, "TA": -0.05, "AT": -0.05,
    "ÁL": 0.0, "RÁ": -0.015, "RA": -0.015, "KI": 0.0, "YI": 0.0,
}


@lru_cache(maxsize=None)
def instance(key, wght, wdth=None):
    f = TTFont(FONTS[key])
    loc = {"wght": wght}
    if wdth is not None:
        loc["wdth"] = wdth
    return instantiateVariableFont(f, loc, inplace=False)


def text(key, s, size, wght, wdth=None, track=0.0, x=0.0, y=0.0, skew_deg=0.0, kern=True):
    """Visszaad: (path_d, ink_bounds(x0,y0,x1,y1), advance_width).
    y = alapvonal; skew_deg>0 jobbra dönti (oblique)."""
    f = instance(key, wght, wdth)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    upem = f["head"].unitsPerEm
    sc = size / upem
    sk = math.tan(math.radians(skew_deg))
    pen = SVGPathPen(gs)
    bp = BoundsPen(gs)
    cx = x
    for i, ch in enumerate(s):
        if ch == " ":
            cx += f["hmtx"]["space"][0] * sc + track * size
            continue
        gn = cmap[ord(ch)]
        t = (sc, 0, sc * sk, -sc, cx, y)
        gs[gn].draw(TransformPen(pen, t))
        gs[gn].draw(TransformPen(bp, t))
        cx += f["hmtx"][gn][0] * sc
        if i < len(s) - 1:
            cx += track * size
            if kern:
                cx += KERN.get(s[i:i + 2], 0) * size
    return pen.getCommands(), bp.bounds, cx - x


def fit(key, s, width, wght, wdth=None, size=None, x=0, y=0, base_track=0.0):
    """Betűköz kiszámítása úgy, hogy a szöveg tintaszélessége pontosan `width` legyen."""
    d, b, _ = text(key, s, size, wght, wdth, track=base_track, x=0, y=0)
    ink = b[2] - b[0]
    gaps = len(s) - 1
    tr = base_track + (width - ink) / gaps / size
    d, b, _ = text(key, s, size, wght, wdth, track=tr, x=0, y=0)
    # igazítás: a tinta bal széle x-re
    d, b2, adv = text(key, s, size, wght, wdth, track=tr, x=x - b[0], y=y)
    return d, b2, tr


def cap_height(key, size, wght, wdth=None):
    f = instance(key, wght, wdth)
    return f["OS/2"].sCapHeight * size / f["head"].unitsPerEm


def fit_track(key, s, width, wght, wdth=None, track=0.3, x=0, y=0, max_size=None, skew_deg=0.0):
    """Betűméret kiszámítása adott betűközhöz úgy, hogy a tintaszélesség `width` legyen."""
    _, b1, _ = text(key, s, 100, wght, wdth, track=0, kern=True)
    k = (b1[2] - b1[0]) / 100
    gaps = len(s) - 1
    size = width / (k + gaps * track)
    if max_size and size > max_size:
        size = max_size
        track = (width / size - k) / gaps
    _, b, _ = text(key, s, size, wght, wdth, track=track, skew_deg=skew_deg)
    d, b2, _ = text(key, s, size, wght, wdth, track=track, x=x - b[0], y=y, skew_deg=skew_deg)
    return d, b2, size
