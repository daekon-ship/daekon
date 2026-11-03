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


KORONA = [True]


def dísz(cx, base, w, h, col):
    y = base - h * .45
    r = h * .2
    g = f'<path d="{P([(cx, y - r), (cx + r, y), (cx, y + r), (cx - r, y)])}" fill="{col}"/>'
    g += f'<rect x="{f(cx - w * .62)}" y="{f(y - .6)}" width="{f(w * .62 - r * 1.8)}" height="1.2" fill="{col}"/>'
    g += f'<rect x="{f(cx + r * 1.8)}" y="{f(y - .6)}" width="{f(w * .62 - r * 1.8)}" height="1.2" fill="{col}"/>'
    return g


def crown(cx, base, w, h, col):
    if not KORONA[0]:
        return dísz(cx, base, w, h, col)
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


# ---------------------------------------------------------- közös kiegészítők
_UID = [0]


def uid(p):
    _UID[0] += 1
    return f"{p}{_UID[0]}"


def villaskulcs(cx, cy, L, ang, col, R=11):
    """Egyvégű villáskulcs (fej felül, nyitott pofa), forgatva cx,cy körül."""
    mid = uid("vk")
    hy = cy - L / 2
    head = circ(cx, hy, R)
    jaw = f"M{f(cx - R * .42)} {f(hy - R - 2)}H{f(cx + R * .42)}V{f(hy + R * .05)}H{f(cx - R * .42)}Z"
    shaft = f"M{f(cx - R * .36)} {f(hy + R * .5)}H{f(cx + R * .36)}L{f(cx + R * .3)} {f(cy + L / 2)}Q{f(cx)} {f(cy + L / 2 + R * .5)} {f(cx - R * .3)} {f(cy + L / 2)}Z"
    m = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="{f(cx - 200)}" y="{f(cy - 200)}" width="400" height="400">'
         f'<rect x="{f(cx - 200)}" y="{f(cy - 200)}" width="400" height="400" fill="#000"/><path d="{head}" fill="#fff"/><path d="{shaft}" fill="#fff"/>'
         f'<path d="{jaw}" fill="#000"/><circle cx="{f(cx)}" cy="{f(cy + L / 2 - R * .2)}" r="{f(R * .2)}" fill="#000"/></mask>')
    return (f'<g transform="rotate({f(ang)} {f(cx)} {f(cy)})"><defs>{m}</defs>'
            f'<rect x="{f(cx - 200)}" y="{f(cy - 200)}" width="400" height="400" fill="{col}" mask="url(#{mid})"/></g>')


def lab_szoveg(cx, y, word_col, sub_col, gold, size=50):
    p1, b1 = txt("KIRÁLY", "archivo", size, 700, 112, .06, cx, y, word_col)
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", size * .29, 700, None, .42, cx, y + size * .56, sub_col)
    p3, b3 = txt("DUNAÚJVÁROS", "manrope", size * .2, 650, None, .4, cx, y + size * 1.0, gold)
    ly = y + size * 1.0 - size * .07
    w3 = b3[2] - b3[0]
    rules = (f'<rect x="{f(b1[0])}" y="{f(ly)}" width="{f(cx - w3 / 2 - 10 - b1[0])}" height="1" fill="{gold}"/>'
             f'<rect x="{f(cx + w3 / 2 + 10)}" y="{f(ly)}" width="{f(b1[2] - cx - w3 / 2 - 10)}" height="1" fill="{gold}"/>')
    return p1 + p2 + p3 + rules, (b1[0], b1[1], b1[2], b3[3])


# ---------------------------------------------------------- 2) KEREK PECSÉT – keresztbe tett kulcsok + korona
def pecset(fill, gold, inner, txtc):
    cx = cy = 100
    g = f'<circle cx="100" cy="100" r="98" fill="{fill}"/>'
    g += f'<circle cx="100" cy="100" r="92" fill="none" stroke="{gold}" stroke-width="2.4"/>'
    g += f'<circle cx="100" cy="100" r="88" fill="none" stroke="{gold}" stroke-width=".8"/>'
    g += f'<circle cx="100" cy="100" r="62" fill="none" stroke="{gold}" stroke-width="1.4"/>'
    g += ring_text("KIRÁLY AUTÓSZERVIZ", 71, 14.5, 800, txtc, True, .2)
    g += ring_text("DUNAÚJVÁROS", 81, 11.5, 700, gold, False, .34)
    for a in (180, 0):
        x = cx + 76 * math.cos(math.radians(a)); y = cy
        g += f'<path d="{P([(x, y - 4), (x + 4, y), (x, y + 4), (x - 4, y)])}" fill="{gold}"/>'
    g += villaskulcs(cx, 112, 70, -38, inner, 10)
    g += villaskulcs(cx, 112, 70, 38, inner, 10)
    g += crown(cx, 70, 40, 21, gold)
    p, _ = txt("2008", "manrope", 9, 700, None, .35, cx, 150, gold)
    return g + p, (2, 2, 198, 198)


# ---------------------------------------------------------- 3) HATSZÖG – gyújtógyertya + korona
def hatszog(fill, gold, inner, txtc):
    from logok import gyertya
    cx, cy = 100, 100
    hx = lambda R: [(cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    g = f'<path d="{P(hx(98))}" fill="{fill}"/>'
    g += f'<path d="{P(hx(91))}" fill="none" stroke="{gold}" stroke-width="2.4" stroke-linejoin="round"/>'
    g += f'<path d="{P(hx(86))}" fill="none" stroke="{gold}" stroke-width=".8" stroke-linejoin="round"/>'
    g += crown(cx, 44, 34, 18, gold)
    g += gyertya(cx + 2.5, 54, 62, inner, gold, "#8C9AAC")
    g += f'<rect x="52" y="124" width="96" height="1" fill="{gold}"/>'
    p1, b1 = txt("KIRÁLY", "archivo", 19, 700, 112, .08, cx, 146, txtc)
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", 6.6, 800, None, .42, cx, 158, "#B9C2CE")
    p3, b3 = txt("DUNAÚJVÁROS", "manrope", 5.4, 700, None, .4, cx, 169, gold)
    p2 += p3
    return g + p1 + p2, (cx - 98 * math.cos(math.radians(30)), 2, cx + 98 * math.cos(math.radians(30)), 198)


def kormany(col, accent):
    from logok import circ_path
    cx, cy, R, r = 50, 50, 34, 26
    g = f'<path d="{circ_path(cx, cy, R)} {circ_path(cx, cy, r, rev=True)}" fill="{col}" fill-rule="evenodd"/>'
    g += f'<path d="M{cx - r - 1} {cy - 3.2}H{cx - 8}L{cx - 6} {cy + 4}H{cx - r + 0.5}Z" fill="{col}"/>'
    g += f'<path d="M{cx + r + 1} {cy - 3.2}H{cx + 8}L{cx + 6} {cy + 4}H{cx + r - 0.5}Z" fill="{col}"/>'
    g += f'<path d="M{cx - 4.5} {cy + 8}H{cx + 4.5}L{cx + 5.5} {cy + r + 1}H{cx - 5.5}Z" fill="{col}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="10" fill="{col}"/><circle cx="{cx}" cy="{cy}" r="4.2" fill="{accent}"/>'
    return g, (cx - R, cy - R, cx + R, cy + R)


# ---------------------------------------------------------- 4) SZÁRNYAS JELVÉNY – kormány + korona
def szarnyas(fill, gold, inner, txtc):
    from logok import jel_anya
    cx, cy = 150, 78
    g = ""
    for side in (-1, 1):
        for i in range(5):
            y = cy - 14 + i * 9
            x0 = cx + side * 48
            ln = 92 - i * 14
            t = 7.2 - i * .6
            x1 = x0 + side * ln
            g += f'<path d="{P([(x0, y), (x1, y - 6 + i * 1.2), (x1 - side * 6, y + t - 6 + i * 1.2), (x0, y + t)])}" fill="{gold}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="50" fill="{fill}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="45" fill="none" stroke="{gold}" stroke-width="2.4"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="41.5" fill="none" stroke="{gold}" stroke-width=".8"/>'
    if KORONA[0]:
        m, mb = jel_anya(inner, gold)
    else:
        m, mb = kormany(inner, gold)
    k = 64 / (mb[3] - mb[1])
    g += f'<g transform="translate({f(cx - (mb[0] + mb[2]) / 2 * k)} {f(cy - (mb[1] + mb[3]) / 2 * k)}) scale({k:.4f})">{m}</g>'
    t, tb = lab_szoveg(cx, 168, txtc, "#B9C2CE" if txtc != NAVY else "#4A5A70", gold, 44)
    return g + t, (min(cx - 140, tb[0]), 18, max(cx + 140, tb[2]), tb[3])


# ---------------------------------------------------------- 5) ÍVES TÁBLA – mérőóra + korona
def tabla(fill, gold, inner, txtc):
    from logok_v2 import sym_dial
    import itertools
    W, H = 220, 250
    x0, y0 = 0, 0
    def plaque(i):
        x, y, w, h = x0 + i, y0 + i, W - 2 * i, H - 2 * i
        r = w / 2
        return f"M{f(x)} {f(y + r)}A{f(r)} {f(r)} 0 0 1 {f(x + w)} {f(y + r)}V{f(y + h - 8)}Q{f(x + w)} {f(y + h)} {f(x + w - 8)} {f(y + h)}H{f(x + 8)}Q{f(x)} {f(y + h)} {f(x)} {f(y + h - 8)}Z"
    g = f'<path d="{plaque(0)}" fill="{fill}"/>'
    g += f'<path d="{plaque(7)}" fill="none" stroke="{gold}" stroke-width="2.4"/>'
    g += f'<path d="{plaque(11.5)}" fill="none" stroke="{gold}" stroke-width=".8"/>'
    g += crown(W / 2, 46, 44, 23, gold)
    d, db = sym_dial(dict(ink=inner, metal="#8C9AAC", accent=gold, ids=itertools.count(1)))
    k = 86 / (db[3] - db[1])
    g += f'<g transform="translate({f(W / 2 - (db[0] + db[2]) / 2 * k)} {f(56 - db[1] * k)}) scale({k:.4f})">{d}</g>'
    g += f'<rect x="22" y="160" width="{W - 44}" height="1.2" fill="{gold}"/>'
    p1, b1 = txt("KIRÁLY", "archivo", 30, 700, 112, .07, W / 2, 194, txtc)
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", 9.4, 800, None, .42, W / 2, 211, "#B9C2CE")
    p3, b3 = txt("DUNAÚJVÁROS · 2008", "manrope", 7.6, 700, None, .36, W / 2, 229, gold)
    return g + p1 + p2 + p3, (0, 0, W, H)


def svg(body, bb, pad, bg=None, title="KIRÁLY Autószerviz – prémium embléma"):
    x0, y0, x1, y1 = bb
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    r = f'<rect x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(h)}" width="{f(w * 4)}" height="{f(h * 4)}"><title>{title}</title>{r}{body}</svg>\n'


PALETTAK = {
    "ejkek-arany": ("#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA"),
    "versenyzold-sargarez": ("#0F2A24", "#143630", "#C9A15A", "#F3F1EA"),
    "fekete-pezsgoarany": ("#0B0B0C", "#151517", "#D8BE84", "#F5F1E8"),
}
TIPUSOK = [("1-cimer", cimer, 30), ("2-pecset", pecset, 24), ("3-hatszog", hatszog, 24), ("4-szarnyas", szarnyas, 26), ("5-tabla", tabla, 26)]


def main():
    global NAVY, GOLD, CREAM
    shutil.rmtree(OUT, ignore_errors=True)
    for pal, (navy, d, gold, cream) in PALETTAK.items():
        for korona in (True, False):
            KORONA[0] = korona
            mappa = os.path.join(OUT, f"{pal}-{'koronaval' if korona else 'korona-nelkul'}")
            os.makedirs(mappa)
            NAVY, GOLD, CREAM = navy, gold, cream
            for nev, fn, pad in TIPUSOK:
                if nev == "1-cimer":
                    sd, vl = fn(d, gold, cream, cream, "#B9C2CE"), fn(navy, gold, cream, navy, "#4A5A70")
                elif nev == "4-szarnyas":
                    sd, vl = fn(d, gold, cream, cream), fn(navy, gold, cream, navy)
                else:
                    sd, vl = fn(d, gold, cream, cream), fn(navy, gold, cream, cream)
                open(os.path.join(mappa, f"{nev}-sotet.svg"), "w").write(svg(*sd, pad, navy))
                open(os.path.join(mappa, f"{nev}-vilagos.svg"), "w").write(svg(*vl, pad, cream))

if __name__ == "__main__":
    main()
