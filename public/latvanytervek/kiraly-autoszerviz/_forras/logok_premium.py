"""KIRÁLY – prémium emblémák (arculat-premium/). Címer, kerek jelvény, vízszintes. Minden betű görbe.
python3 _forras/logok_premium.py
"""
import math, os, shutil
from betuk import text, cap_height

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-premium")

NAVY, GOLD, CREAM, INK = "#0E1B2C", "#C9A14F", "#F6F2EA", "#0E1B2C"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"


def circ(cx, cy, r, rev=False):
    s = 0 if rev else 1
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 {s} {f(2 * r)} 0a{f(r)} {f(r)} 0 1 {s} {f(-2 * r)} 0Z"


def txt(s, key, size, wght, wdth, track, cx, y, col, anchor="c"):
    d, b, _ = text(key, s, size, wght, wdth, track=track)
    w = b[2] - b[0]
    x = cx - w / 2 - b[0] if anchor == "c" else cx - b[0]
    d, b, _ = text(key, s, size, wght, wdth, track=track, x=x, y=y)
    return f'<path d="{d}" fill="{col}"/>', b


def shield_path(x, y, w, h, inset=0):
    x += inset; y += inset; w -= 2 * inset; h -= 2 * inset
    cx = x + w / 2
    return (f"M{f(x)} {f(y)}H{f(x + w)}V{f(y + h * .46)}"
            f"C{f(x + w)} {f(y + h * .76)} {f(cx + w * .2)} {f(y + h * .92)} {f(cx)} {f(y + h)}"
            f"C{f(cx - w * .2)} {f(y + h * .92)} {f(x)} {f(y + h * .76)} {f(x)} {f(y + h * .46)}Z")


def crown(cx, base, w, h, col):
    pts = [(cx - w / 2, base), (cx - w / 2, base - h * .72), (cx - w / 4, base - h * .32), (cx, base - h),
           (cx + w / 4, base - h * .32), (cx + w / 2, base - h * .72), (cx + w / 2, base)]
    g = f'<path d="{P(pts)}" fill="{col}"/>'
    g += f'<rect x="{f(cx - w / 2)}" y="{f(base + h * .1)}" width="{f(w)}" height="{f(h * .16)}" fill="{col}"/>'
    for x, y in ((cx - w / 2, base - h * .72), (cx, base - h), (cx + w / 2, base - h * .72)):
        g += f'<circle cx="{f(x)}" cy="{f(y - h * .1)}" r="{f(h * .11)}" fill="{col}"/>'
    return g


def piston(cx, top, w, col, cut):
    """Finom, egyvonalas dugattyú hajtókarral (a címer közepére)."""
    x0, x1 = cx - w / 2, cx + w / 2
    h = w * .82
    g = f'<path d="M{f(x0)} {f(top + h * .16)}V{f(top + h * .05)}Q{f(x0)} {f(top)} {f(x0 + w * .05)} {f(top)}H{f(x1 - w * .05)}Q{f(x1)} {f(top)} {f(x1)} {f(top + h * .05)}V{f(top + h * .16)}Z" fill="{col}"/>'
    g += f'<rect x="{f(x0)}" y="{f(top + h * .21)}" width="{f(w)}" height="{f(h * .07)}" fill="{col}"/>'
    sk = (f"M{f(x0)} {f(top + h * .33)}H{f(x1)}V{f(top + h * .78)}Q{f(x1)} {f(top + h * .86)} {f(x1 - w * .08)} {f(top + h * .86)}"
          f"H{f(x0 + w * .08)}Q{f(x0)} {f(top + h * .86)} {f(x0)} {f(top + h * .78)}Z")
    g += f'<path d="{sk} {circ(cx, top + h * .56, w * .1, True)}" fill="{col}" fill-rule="evenodd"/>'
    ry0, ry1 = top + h * .86, top + h * 1.42
    g += f'<path d="M{f(cx - w * .11)} {f(ry0)}H{f(cx + w * .11)}L{f(cx + w * .16)} {f(ry1)}H{f(cx - w * .16)}Z" fill="{col}"/>'
    g += f'<path d="{circ(cx, ry1 + w * .12, w * .26)} {circ(cx, ry1 + w * .12, w * .11, True)}" fill="{col}" fill-rule="evenodd"/>'
    return g


# ---------------------------------------------------------- A) CÍMER (álló)
def cimer(bg_shield, gold, inner_col, word_col, sub_col):
    W = 260
    cx = W / 2
    g = crown(cx, 40, 64, 34, gold)
    sx, sy, sw, sh = cx - 62, 50, 124, 150
    g += f'<path d="{shield_path(sx, sy, sw, sh)}" fill="{bg_shield}"/>'
    g += f'<path d="{shield_path(sx, sy, sw, sh, 7)}" fill="none" stroke="{gold}" stroke-width="2.6"/>'
    g += f'<path d="{shield_path(sx, sy, sw, sh, 12)}" fill="none" stroke="{gold}" stroke-width="1" opacity=".7"/>'
    g += piston(cx, 78, 52, inner_col, bg_shield)
    # 2008 a pajzs alján
    p, _ = txt("2008", "manrope", 9.5, 700, None, .35, cx, 170, gold)
    g += p
    # wordmark alatta
    p1, b1 = txt("KIRÁLY", "archivo", 50, 700, 112, .06, cx, 262, word_col)
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", 14.5, 700, None, .42, cx, 290, sub_col)
    p3, b3 = txt("DUNAÚJVÁROS", "manrope", 10, 650, None, .4, cx, 312, gold)
    lw = (b1[2] - b1[0])
    rules = (f'<rect x="{f(b1[0])}" y="{f(308.4)}" width="{f(cx - (b3[2] - b3[0]) / 2 - 10 - b1[0])}" height="1" fill="{gold}"/>'
             f'<rect x="{f(cx + (b3[2] - b3[0]) / 2 + 10)}" y="{f(308.4)}" width="{f(b1[2] - cx - (b3[2] - b3[0]) / 2 - 10)}" height="1" fill="{gold}"/>')
    g += p1 + p2 + p3 + rules
    return g, (min(b1[0], sx), 2, max(b1[2], sx + sw), 316)


def cimer_jel(bg_shield, gold, inner_col):
    cx = 80
    g = crown(cx, 40, 64, 34, gold)
    sx, sy, sw, sh = cx - 62, 50, 124, 150
    g += f'<path d="{shield_path(sx, sy, sw, sh)}" fill="{bg_shield}"/>'
    g += f'<path d="{shield_path(sx, sy, sw, sh, 7)}" fill="none" stroke="{gold}" stroke-width="2.6"/>'
    g += f'<path d="{shield_path(sx, sy, sw, sh, 12)}" fill="none" stroke="{gold}" stroke-width="1" opacity=".7"/>'
    g += piston(cx, 78, 52, inner_col, bg_shield)
    p, _ = txt("2008", "manrope", 9.5, 700, None, .35, cx, 170, gold)
    return g + p, (sx, 2, sx + sw, 200)


# ---------------------------------------------------------- B) KEREK JELVÉNY
def ring_text(s, r, size, wght, col, top=True, track=.3, cx=100, cy=100):
    out, advs = [], []
    for ch in s:
        advs.append(size * .32 if ch == " " else text("manrope", ch, size, wght)[2])
    total = sum(advs) + track * size * (len(s) - 1)
    a = -math.pi / 2 - (total / r) / 2 if top else math.pi / 2 + (total / r) / 2
    for ch, adv in zip(s, advs):
        mid = a + (adv / 2) / r * (1 if top else -1)
        if ch != " ":
            d, _, _ = text("manrope", ch, size, wght, x=-adv / 2, y=0)
            px, py = cx + r * math.cos(mid), cy + r * math.sin(mid)
            rot = math.degrees(mid) + (90 if top else -90)
            out.append(f'<path transform="translate({f(px)} {f(py)}) rotate({f(rot)})" d="{d}" fill="{col}"/>')
        a += (adv + track * size) / r * (1 if top else -1)
    return "".join(out)


def jelveny(fill, gold, inner_col, txt_col):
    cx = cy = 100
    g = f'<circle cx="100" cy="100" r="98" fill="{fill}"/>'
    g += f'<circle cx="100" cy="100" r="92" fill="none" stroke="{gold}" stroke-width="2.4"/>'
    g += f'<circle cx="100" cy="100" r="64" fill="none" stroke="{gold}" stroke-width="1.2"/>'
    g += ring_text("KIRÁLY AUTÓSZERVIZ", 73, 15, 800, txt_col, True, .2)
    g += ring_text("DUNAÚJVÁROS · 2008", 82.5, 11.5, 700, gold, False, .3)
    for a in (180, 0):
        x = cx + 78 * math.cos(math.radians(a)); y = cy + 78 * math.sin(math.radians(a))
        g += f'<path d="{P([(x, y - 4), (x + 4, y), (x, y + 4), (x - 4, y)])}" fill="{gold}"/>'
    g += crown(cx, 74, 40, 21, gold)
    g += piston(cx, 82, 34, inner_col, fill)
    return g, (2, 2, 198, 198)


# ---------------------------------------------------------- C) VÍZSZINTES (címer + szöveg)
def vizszintes(bg_shield, gold, inner_col, word_col, sub_col):
    m, mb = cimer_jel(bg_shield, gold, inner_col)
    k = 0.62
    mark = f'<g transform="scale({k})">{m}</g>'
    mw = (mb[2]) * k
    x0 = mw + 22
    p1, b1 = txt("KIRÁLY", "archivo", 52, 700, 112, .06, x0, 74, word_col, anchor="l")
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", 16, 700, None, .42, x0, 100, sub_col, anchor="l")
    p3, b3 = txt("DUNAÚJVÁROS", "manrope", 11, 650, None, .4, x0 + 26, 121, gold, anchor="l")
    rule = f'<rect x="{f(b1[0])}" y="{f(116.5)}" width="18" height="1.2" fill="{gold}"/>'
    return mark + p1 + p2 + p3 + rule, (mb[0] * k, 0, max(b1[2], b2[2]), 200 * k)


def svg(body, bb, pad, bg=None, title="KIRÁLY Autószerviz – prémium embléma"):
    x0, y0, x1, y1 = bb
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    r = f'<rect x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(h)}" width="{f(w * 4)}" height="{f(h * 4)}"><title>{title}</title>{r}{body}</svg>\n'


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    def w(n, s): open(os.path.join(OUT, n + ".svg"), "w").write(s)
    # világos háttér: navy pajzs, arany, krém dugattyú
    w("A-cimer-vilagos", svg(*cimer(NAVY, GOLD, CREAM, NAVY, "#4A5A70"), 30, CREAM))
    w("A-cimer-sotet", svg(*cimer("#13243A", GOLD, CREAM, CREAM, "#B9C2CE"), 30, NAVY))
    w("B-jelveny-vilagos", svg(*jelveny(NAVY, GOLD, CREAM, CREAM), 24, CREAM))
    w("B-jelveny-sotet", svg(*jelveny("#13243A", GOLD, CREAM, CREAM), 24, NAVY))
    w("C-vizszintes-vilagos", svg(*vizszintes(NAVY, GOLD, CREAM, NAVY, "#4A5A70"), 30, CREAM))
    w("C-vizszintes-sotet", svg(*vizszintes("#13243A", GOLD, CREAM, CREAM, "#B9C2CE"), 30, NAVY))


if __name__ == "__main__":
    main()
