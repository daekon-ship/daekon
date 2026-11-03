"""KIRÁLY Autószerviz – 4 logókoncepció generálása (SVG, minden betű görbékké alakítva).
Futtatás: python3 _forras/logok.py   ->  arculat/logo-1..4/*.svg
"""
import math, os, json
from betuk import text, fit, fit_track, cap_height

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat")

GRAFIT = "#11161C"
ACEL = "#1C242D"
PAPIR = "#F4F5F2"
FEHER = "#F4F5F6"
HALK = "#A6B0B8"
NARANCS = "#F26732"
SARGA = "#FFC20E"
FEKETE = "#0B0D10"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def poly(pts, fill):
    return f'<path d="M{" L".join(f"{f(x)} {f(y)}" for x, y in pts)}Z" fill="{fill}"/>'


def arm(c, theta_deg, w, s0, y_end, up=True, offset=0.0):
    """Vastag kar: c-ből indul (s0 távolságban merőleges vágással), y_end-nél vízszintes vágás.
    offset: a kar középvonalának eltolása a normális irányában."""
    t = math.radians(theta_deg)
    sgn = -1 if up else 1
    u = (math.cos(t), sgn * math.sin(t))
    n = (math.sin(t), -sgn * math.cos(t))  # merőleges (felfelé menő karnál jobbra-le)
    pts = []
    for side in (-1, 1):
        o = offset + side * w / 2
        q = (c[0] + u[0] * s0 + n[0] * o, c[1] + u[1] * s0 + n[1] * o)
        tt = (y_end - q[1]) / u[1]
        e = (q[0] + u[0] * tt, y_end)
        pts.append((q, e))
    (q1, e1), (q2, e2) = pts
    return [q1, e1, e2, q2]


def bounds_union(*bs):
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))


# ---------------------------------------------------------------- 1. TENGELY
def jel1(col_k, col_pivot):
    """K-monogram: szár + két kar, a találkozásnál narancs gömbcsukló (futómű)."""
    g = [f'<rect x="14" y="12" width="20" height="76" fill="{col_k}"/>']
    c = (47.5, 50)
    g.append(poly(arm(c, 47, 19, 13.5, 12, up=True), col_k))
    g.append(poly(arm(c, 47, 19, 13.5, 88, up=False), col_k))
    g.append(f'<circle cx="{c[0]}" cy="{c[1]}" r="8.6" fill="{col_pivot}"/>')
    return "".join(g), (14, 12, 89.5, 88)


def logo1(fg, sub, mark, pivot):
    m, mb = jel1(mark, pivot)
    x0 = 122
    size = 62
    d, b, _ = text("archivo", "KIRÁLY", size, 800, 125, track=0.02, x=x0, y=64)
    wk = b[2] - b[0]
    d2, b2, _ = fit_track("archivo", "AUTÓSZERVIZ", wk, 600, 125, track=0.52, x=b[0], y=88)
    sep = f'<rect x="105" y="14" width="1.6" height="72" fill="{sub}" opacity=".55"/>'
    body = m + sep + f'<path d="{d}" fill="{fg}"/><path d="{d2}" fill="{sub}"/>'
    return body, bounds_union(mb, b, b2)


# ---------------------------------------------------------------- 2. SZÖG
def szog(ax, ay, L, col, line_col, thick):
    """Mért szög: vízszintes referencia + 28°-os narancs ékezetrúd + ív."""
    a = math.radians(28)
    t = thick
    # rúd (paralelogramma) a bázispontból
    p1 = (ax, ay)
    p2 = (ax + L * math.cos(a), ay - L * math.sin(a))
    nx, ny = math.sin(a) * t, math.cos(a) * t
    bar = poly([p1, p2, (p2[0] + nx, p2[1] + ny), (p1[0] + nx, p1[1] + ny)], col)
    hw = max(t * 0.24, 0.9)
    ref = f'<rect x="{f(ax)}" y="{f(ay + t * 0.5)}" width="{f(L * 0.98)}" height="{f(hw)}" fill="{line_col}"/>'
    r = L * 0.62
    s = (ax + r, ay + t * 0.5)
    e = (ax + r * math.cos(a), ay + t * 0.5 - r * math.sin(a))
    arc = f'<path d="M{f(s[0])} {f(s[1])} A{f(r)} {f(r)} 0 0 0 {f(e[0])} {f(e[1])}" fill="none" stroke="{line_col}" stroke-width="{f(hw)}"/>'
    return ref + arc + bar


def logo2(fg, sub, accent, line_col):
    size = 70
    y = 80
    # A betű helyének mérése
    _, bK, advK = text("archivo", "KIRAL", size, 900, 125, track=0.01, x=0, y=y)
    d, b, _ = text("archivo", "KIRALY", size, 900, 125, track=0.01, x=0, y=y)
    _, bA, _ = text("archivo", "A", size, 900, 125, x=0, y=y)
    _, bKIR, adv_kir = text("archivo", "KIR", size, 900, 125, track=0.01, x=0, y=y)
    ax0 = adv_kir + 0.01 * size - 0.015 * size  # 'RA' alávágás
    cap = cap_height("archivo", size, 900, 125)
    a_w = bA[2] - bA[0]
    L = a_w * 0.46
    acc = szog(ax0 + bA[0] + a_w * 0.5 - L * 0.42, y - cap - 7.5, L, accent, line_col, 7.4)
    wk = b[2] - b[0]
    d2, b2, _ = fit_track("manrope", "AUTÓSZERVIZ · DUNAÚJVÁROS", wk, 700, track=0.3, x=b[0], y=y + 27)
    body = f'<path d="{d}" fill="{fg}"/>' + acc + f'<path d="{d2}" fill="{sub}"/>'
    top = y - cap - 7.5 - L * math.sin(math.radians(28)) - 1
    return body, (b[0], top, b[2], b2[3])


def jel2(fg, accent, line_col):
    size = 74
    d, b, _ = text("archivo", "K", size, 900, 125, x=0, y=0)
    cap = cap_height("archivo", size, 900, 125)
    w = b[2] - b[0]
    ox = 50 - (b[0] + w / 2) - 7
    oy = 50 + cap / 2 + 7
    d, b, _ = text("archivo", "K", size, 900, 125, x=ox, y=oy)
    acc = szog(b[2] - 6, b[1] - 9, 24, accent, line_col, 5)
    return f'<path d="{d}" fill="{fg}"/>' + acc, (b[0], b[1] - 9 - 24 * math.sin(math.radians(28)) - 1, b[2] + 18, b[3])


# ---------------------------------------------------------------- 3. MŰHELYTÁBLA
def chamfer(x, y, w, h, c):
    return [(x + c, y), (x + w - c, y), (x + w, y + c), (x + w, y + h - c), (x + w - c, y + h), (x + c, y + h), (x, y + h - c), (x, y + c)]


def logo3(plate, border, fg, small, band, band_txt, rivet):
    W, H, c = 340, 176, 16
    g = [poly(chamfer(0, 0, W, H, c), plate)]
    i = 7
    pts = chamfer(i, i, W - 2 * i, H - 2 * i, c - 3)
    g.append(f'<path d="M{" L".join(f"{f(x)} {f(y)}" for x, y in pts)}Z" fill="none" stroke="{border}" stroke-width="1.6"/>')
    for (rx, ry) in [(22, 22), (W - 22, 22), (22, H - 22), (W - 22, H - 22)]:
        g.append(f'<circle cx="{rx}" cy="{ry}" r="3.6" fill="{rivet}"/>')
    d0, b0, _ = text("manrope", "DUNAÚJVÁROS  ·  2008 ÓTA", 10.5, 700, track=0.28, x=0, y=0)
    w0 = b0[2] - b0[0]
    d0, b0, _ = text("manrope", "DUNAÚJVÁROS  ·  2008 ÓTA", 10.5, 700, track=0.28, x=W / 2 - w0 / 2 - b0[0], y=38)
    g.append(f'<path d="{d0}" fill="{small}"/>')
    size = 66
    d, b, _ = text("archivo", "KIRÁLY", size, 900, 108, track=0.03, x=0, y=0)
    wk = b[2] - b[0]
    d, b, _ = text("archivo", "KIRÁLY", size, 900, 108, track=0.03, x=W / 2 - wk / 2 - b[0], y=108)
    g.append(f'<path d="{d}" fill="{fg}"/>')
    g.append(f'<rect x="38" y="122" width="{W - 76}" height="30" fill="{band}"/>')
    d2, b2, sz = fit_track("manrope", "AUTÓSZERVIZ", W - 76 - 44, 800, track=0.3, x=38 + 22, y=0, max_size=16.5)
    cap = cap_height("manrope", sz, 800)
    d2, b2, sz = fit_track("manrope", "AUTÓSZERVIZ", W - 76 - 44, 800, track=0.3, x=38 + 22, y=137 + cap / 2, max_size=16.5)
    g.append(f'<path d="{d2}" fill="{band_txt}"/>')
    return "".join(g), (0, 0, W, H)


def jel3(plate, border, fg, band, rivet):
    W = H = 100
    c = 11
    g = [poly(chamfer(0, 0, W, H, c), plate)]
    pts = chamfer(5, 5, W - 10, H - 10, c - 2.5)
    g.append(f'<path d="M{" L".join(f"{f(x)} {f(y)}" for x, y in pts)}Z" fill="none" stroke="{border}" stroke-width="1.3"/>')
    for (rx, ry) in [(15, 15), (85, 15)]:
        g.append(f'<circle cx="{rx}" cy="{ry}" r="2.8" fill="{rivet}"/>')
    d, b, _ = text("archivo", "K", 58, 900, 108, x=0, y=0)
    w = b[2] - b[0]
    d, b, _ = text("archivo", "K", 58, 900, 108, x=50 - w / 2 - b[0], y=70)
    g.append(f'<path d="{d}" fill="{fg}"/>')
    g.append(f'<rect x="24" y="77" width="52" height="8" fill="{band}"/>')
    return "".join(g), (0, 0, W, H)


# ---------------------------------------------------------------- 4. CSÍK (sárga–fekete)
SK = math.tan(math.radians(12))


def jel4(col):
    """Ikercsíkos, döntött K – a mostani sárga–fekete világ továbbgondolása."""
    g = []
    for x in (12, 25):
        g.append(f'<rect x="{x}" y="10" width="9" height="80" fill="{col}"/>')
    c = (38.5, 50)
    for up, ye in ((True, 10), (False, 90)):
        for off in (-6.5, 6.5):
            g.append(poly(arm(c, 50, 9, 12.5, ye, up=up, offset=off), col))
    inner = "".join(g)
    # döntés az alsó él (y=90) körül
    return f'<g transform="matrix(1 0 {-SK:.4f} 1 {90 * SK:.3f} 0)">{inner}</g>', (12, 10, 12 + 0 + 82 + 0, 90)


def logo4(fg, sub, mark, stripe):
    m, mb = jel4(mark)
    x0 = 104
    size = 60
    d, b, _ = text("archivo", "KIRÁLY", size, 900, 100, track=0.015, x=x0, y=66, skew_deg=12)
    wk = b[2] - b[0]
    d2, b2, _ = fit_track("manrope", "AUTÓSZERVIZ", wk - 34, 800, track=0.36, x=b[0] - 4, y=88, skew_deg=12)
    # ikercsík a felirat után
    sx = b2[2] + 8
    st = "".join(
        f'<g transform="matrix(1 0 {-SK:.4f} 1 {88 * SK:.3f} 0)"><rect x="{f(sx + k * 9)}" y="76" width="5.5" height="12" fill="{stripe}"/></g>'
        for k in range(2))
    body = m + f'<path d="{d}" fill="{fg}"/><path d="{d2}" fill="{sub}"/>' + st
    return body, bounds_union(mb, b, (b2[0], b2[1], sx + 20, b2[3]))


# ---------------------------------------------------------------- KIMENETEK
def svg(body, bb, pad, bg=None, title=""):
    x0, y0, x1, y1 = bb
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    r = f'<rect x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(h)}" '
            f'width="{f(w * 4)}" height="{f(h * 4)}" role="img"><title>{title}</title>{r}{body}</svg>\n')


def placed(body, bb, box_w, box_h, target_w=None, target_h=None, cx=None, cy=None):
    """A body-t a (box) közepére / adott pontra skálázza."""
    x0, y0, x1, y1 = bb
    w, h = x1 - x0, y1 - y0
    s = min(target_w / w if target_w else 1e9, target_h / h if target_h else 1e9)
    cx = box_w / 2 if cx is None else cx
    cy = box_h / 2 if cy is None else cy
    tx = cx - (x0 + w / 2) * s
    ty = cy - (y0 + h / 2) * s
    return f'<g transform="translate({f(tx)} {f(ty)}) scale({s:.5f})">{body}</g>'


def social(body, bb, bg, rel=0.62):
    S = 1080
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}">'
            f'<rect width="{S}" height="{S}" fill="{bg}"/>{placed(body, bb, S, S, S * rel, S * rel)}</svg>\n')


def cover(body, bb, bg, line_col, line_txt_col, accent):
    W, H = 1640, 624
    lt, lb, _ = text("manrope", "MÁRKAFÜGGETLEN AUTÓSZERVIZ  ·  DUNAÚJVÁROS  ·  +36 20 585 3234", 19, 600, track=0.16, x=0, y=0)
    lw = lb[2] - lb[0]
    lt, lb, _ = text("manrope", "MÁRKAFÜGGETLEN AUTÓSZERVIZ  ·  DUNAÚJVÁROS  ·  +36 20 585 3234", 19, 600, track=0.16, x=W / 2 - lw / 2 - lb[0], y=470)
    grid = "".join(f'<rect x="{x}" y="0" width="1" height="{H}" fill="{line_col}" opacity=".5"/>' for x in range(0, W, 82))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<rect width="{W}" height="{H}" fill="{bg}"/>{grid}'
            f'<rect x="{W / 2 - 28}" y="420" width="56" height="3" fill="{accent}"/>'
            f'{placed(body, bb, W, H, 760, 230, cy=282)}<path d="{lt}" fill="{line_txt_col}"/></svg>\n')


def write(n, name, s):
    d = os.path.join(OUT, f"logo-{n}")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"kiraly-{n}-{name}.svg"), "w") as fh:
        fh.write(s)


def main():
    T = "KIRÁLY Autószerviz – logókoncepció"
    meta = {}

    # 1 — Tengely
    b, bb = logo1(GRAFIT, "#3A4651", GRAFIT, NARANCS)
    write(1, "vilagos", svg(b, bb, 14, title=T + " 1"))
    write(1, "fo", svg(b, bb, 30, PAPIR, T + " 1"))
    bd, bbd = logo1(FEHER, HALK, FEHER, NARANCS)
    write(1, "sotet", svg(bd, bbd, 14, title=T + " 1"))
    write(1, "sotet-hatterrel", svg(bd, bbd, 30, GRAFIT, T + " 1"))
    write(1, "mono", svg(*logo1("#000", "#000", "#000", "#000"), 14, title=T + " 1"))
    j, jb = jel1(FEHER, NARANCS)
    write(1, "jel", svg(j, jb, 10, GRAFIT, T + " 1 – jel"))
    write(1, "profilkep", social(j, jb, GRAFIT, 0.52))
    write(1, "borito", cover(bd, bbd, GRAFIT, ACEL, HALK, NARANCS))

    # 2 — Szög
    b, bb = logo2(GRAFIT, "#3A4651", NARANCS, "#8A96A0")
    write(2, "vilagos", svg(b, bb, 14, title=T + " 2"))
    write(2, "fo", svg(b, bb, 30, PAPIR, T + " 2"))
    bd, bbd = logo2(FEHER, HALK, NARANCS, "#5C6873")
    write(2, "sotet", svg(bd, bbd, 14, title=T + " 2"))
    write(2, "sotet-hatterrel", svg(bd, bbd, 30, GRAFIT, T + " 2"))
    write(2, "mono", svg(*logo2("#000", "#000", "#000", "#000"), 14, title=T + " 2"))
    j, jb = jel2(FEHER, NARANCS, "#5C6873")
    write(2, "jel", svg(j, jb, 12, GRAFIT, T + " 2 – jel"))
    write(2, "profilkep", social(j, jb, GRAFIT, 0.56))
    write(2, "borito", cover(bd, bbd, GRAFIT, ACEL, HALK, NARANCS))

    # 3 — Műhelytábla
    b, bb = logo3(GRAFIT, "#3A4651", FEHER, HALK, NARANCS, GRAFIT, "#5C6873")
    write(3, "fo", svg(b, bb, 30, PAPIR, T + " 3"))
    write(3, "vilagos", svg(b, bb, 6, title=T + " 3"))
    write(3, "sotet", svg(b, bb, 6, title=T + " 3"))
    write(3, "sotet-hatterrel", svg(b, bb, 30, ACEL, T + " 3"))
    write(3, "mono", svg(*logo3("#000", "#fff", "#fff", "#fff", "#fff", "#000", "#fff"), 6, title=T + " 3"))
    j, jb = jel3(GRAFIT, "#3A4651", FEHER, NARANCS, "#5C6873")
    write(3, "jel", svg(j, jb, 6, title=T + " 3 – jel"))
    write(3, "profilkep", social(j, jb, ACEL, 0.6))
    write(3, "borito", cover(b, bb, ACEL, GRAFIT, HALK, NARANCS))

    # 4 — Csík
    bd, bbd = logo4(SARGA, FEHER, SARGA, SARGA)
    write(4, "fo", svg(bd, bbd, 30, FEKETE, T + " 4"))
    write(4, "sotet", svg(bd, bbd, 14, title=T + " 4"))
    write(4, "sotet-hatterrel", svg(bd, bbd, 30, FEKETE, T + " 4"))
    b, bb = logo4(FEKETE, FEKETE, FEKETE, FEKETE)
    write(4, "vilagos", svg(b, bb, 14, title=T + " 4"))
    write(4, "sarga-hatterrel", svg(b, bb, 30, SARGA, T + " 4"))
    write(4, "mono", svg(b, bb, 14, title=T + " 4"))
    j, jb = jel4(SARGA)
    write(4, "jel", svg(j, (jb[0] - 2, jb[1], jb[2] + 8, jb[3]), 10, FEKETE, T + " 4 – jel"))
    write(4, "profilkep", social(j, (jb[0] - 2, jb[1], jb[2] + 8, jb[3]), FEKETE, 0.54))
    write(4, "borito", cover(bd, bbd, FEKETE, "#1A1C20", HALK, SARGA))


if __name__ == "__main__":
    main()
