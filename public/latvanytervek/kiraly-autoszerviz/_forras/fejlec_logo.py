"""Új fejléc-logó a látványterv számára -> arculat-kombi/WEB/fejlec-*.svg
Tömör arany „érme” (kulcsok + gyertya sötétben kivágva) + erős, egyenes felirat.
python3 _forras/fejlec_logo.py
"""
import os
from logok_premium import villaskulcs, svg, txt
from logok_vegso import ring
from logok_kombi import PAL, plug
from betuk import cap_height

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-kombi", "WEB")
bg, pn, gold, cream = PAL["fekete-pezsgoarany"]


def erme(base=gold, ink=pn):
    """Tömör arany kör, belső vékony sötét gyűrű, sötét kulcsok és gyertya."""
    inner = (villaskulcs(100, 101, 96, -42, ink, 11.5) + villaskulcs(100, 101, 96, 42, ink, 11.5)
             + plug(100, 50, 92, ink, ink, ink, halo=base))
    return (f'<circle cx="100" cy="100" r="98" fill="{base}"/>' + ring(100, 100, 88, 1.6, ink)
            + f'<g transform="translate(100 100) scale(1.2) translate(-100 -100)">{inner}</g>'), (2, 2, 198, 198)


def felirat(x, ink, sub, size=60, rule=None):
    """KIRÁLY nagyban, alatta AUTÓSZERVIZ arányos betűközzel, balra zárva."""
    c1 = cap_height("archivo", size, 760, 112)
    p1, b1 = txt("KIRÁLY", "archivo", size, 760, 112, .03, x, c1, ink, "l")
    s2 = size * .30
    c2 = cap_height("manrope", s2, 800)
    y2 = c1 + size * .26 + c2
    W = b1[2] - b1[0]
    # betűköz úgy, hogy az AUTÓSZERVIZ pontosan a KIRÁLY szélességéig érjen, de ne legyen túl ritka
    from betuk import text
    _, bb, _ = text("manrope", "AUTÓSZERVIZ", s2, 800, None, track=0)
    tr = max(.06, min(.42, (W - (bb[2] - bb[0])) / 10 / s2))
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", s2, 800, None, tr, b1[0], y2, sub, "l")
    return p1 + p2, (b1[0], 0, max(b1[2], b2[2]), b2[3])


def lockup(divider=True):
    eb, ebb = erme()
    fb, fbb = felirat(0, cream, gold)
    th = fbb[3]
    ih = th * 1.32                       # az érme kicsit magasabb, mint a felirat
    k = ih / 196
    y0 = -(ih - th) / 2
    g = f'<g transform="translate(0 {y0:.2f}) scale({k:.5f}) translate(-2 -2)">{eb}</g>'
    x = ih + th * .36
    if divider:
        g += f'<rect x="{x:.2f}" y="{y0 + ih * .14:.2f}" width="1.6" height="{ih * .72:.2f}" fill="{gold}" opacity=".55"/>'
        x += th * .36
    fb, fbb = felirat(x, cream, gold)
    return g + fb, (0, y0, fbb[2], y0 + ih)


def main():
    os.makedirs(OUT, exist_ok=True)
    eb, ebb = erme()
    open(os.path.join(OUT, "jel-erme.svg"), "w").write(svg(eb, ebb, 0, None, "KIRÁLY Autószerviz – jel"))
    for div, nev in ((True, "fejlec-erme-vonallal.svg"), (False, "fejlec-erme.svg")):
        b, bb = lockup(div)
        open(os.path.join(OUT, nev), "w").write(svg(b, bb, 1, None, "KIRÁLY Autószerviz"))


if __name__ == "__main__":
    main()
