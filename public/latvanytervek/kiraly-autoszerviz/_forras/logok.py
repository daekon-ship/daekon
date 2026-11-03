"""KIRÁLY Autószerviz – 4 logókoncepció, 2. kör: egyszerűbb, prémium irány
(vékonyabb vonalak, levegős betűköz, visszafogott szín). Minden betű görbe.
Futtatás: python3 _forras/logok.py   ->  arculat/logo-1..4/*.svg
"""
import math, os, shutil
from betuk import text, fit_track, cap_height

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat")

GRAFIT = "#11161C"
PAPIR = "#F4F5F2"
FEHER = "#F4F5F6"
HALK = "#A6B0B8"
ACEL = "#4A5560"
NARANCS = "#F26732"
ARANY = "#F2B705"      # mélyebb, „prémium” sárga a 4. irányhoz
FEKETE = "#0A0B0D"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def poly(pts, fill):
    return f'<path d="M{" L".join(f"{f(x)} {f(y)}" for x, y in pts)}Z" fill="{fill}"/>'


def bounds_union(*bs):
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))


def arm(c, theta_deg, w, s0, y_end, up=True):
    t = math.radians(theta_deg)
    sgn = -1 if up else 1
    u = (math.cos(t), sgn * math.sin(t))
    n = (math.sin(t), -sgn * math.cos(t))
    pts = []
    for side in (-1, 1):
        o = side * w / 2
        q = (c[0] + u[0] * s0 + n[0] * o, c[1] + u[1] * s0 + n[1] * o)
        tt = (y_end - q[1]) / u[1]
        pts.append((q, (q[0] + u[0] * tt, y_end)))
    (q1, e1), (q2, e2) = pts
    return [q1, e1, e2, q2]


def kmono(col, pivot, w=11, top=16, bot=84, x0=24, cx=None, theta=48, s0=10.5, r=6.2):
    """Finom K-monogram: szár + két kar, a találkozásnál gömbcsukló-pont."""
    cx = cx if cx is not None else x0 + w + 13
    c = (cx, (top + bot) / 2)
    g = f'<rect x="{f(x0)}" y="{f(top)}" width="{f(w)}" height="{f(bot - top)}" fill="{col}"/>'
    a1 = arm(c, theta, w, s0, top, True)
    a2 = arm(c, theta, w, s0, bot, False)
    g += poly(a1, col) + poly(a2, col)
    if pivot:
        g += f'<circle cx="{f(c[0])}" cy="{f(c[1])}" r="{f(r)}" fill="{pivot}"/>'
    right = max(p[0] for p in a1 + a2)
    return g, (x0, top, right, bot)


def word(s, size, wght, wdth, track, x, y, col, skew=0):
    d, b, _ = text("archivo", s, size, wght, wdth, track=track, x=x, y=y, skew_deg=skew)
    return f'<path d="{d}" fill="{col}"/>', b


def sub(s, width, x, y, col, track=0.5, wght=600):
    d, b, _ = fit_track("manrope", s, width, wght, track=track, x=x, y=y)
    return f'<path d="{d}" fill="{col}"/>', b


# ------------------------------------------------ 1. TENGELY – monogram + szóvédjegy
def logo1(fg, subc, mark, pivot, line):
    m, mb = kmono(mark, pivot)
    sep = f'<rect x="{f(mb[2] + 17)}" y="22" width="1.2" height="56" fill="{line}"/>'
    x0 = mb[2] + 35
    w, b = word("KIRÁLY", 40, 600, 125, 0.13, x0, 59, fg)
    s, b2 = sub("AUTÓSZERVIZ", b[2] - b[0], b[0], 78.5, subc, track=0.62, wght=600)
    return m + sep + w + s, bounds_union(mb, b, b2)


def jel1(mark, pivot):
    return kmono(mark, pivot)


# ------------------------------------------------ 2. ÉKEZET – tiszta szóvédjegy
def logo2(fg, subc, accent):
    size, y = 46, 70
    w, b = word("KIRALY", size, 540, 125, 0.2, 0, y, fg)
    # az A pontos helye
    _, bk, _ = text("archivo", "KIR", size, 540, 125, track=0.2, x=0, y=y)
    _, ba, _ = text("archivo", "A", size, 540, 125, x=0, y=y)
    adv_kir = text("archivo", "KIR", size, 540, 125, track=0.2)[2] + 0.2 * size - 0.015 * size
    cap = cap_height("archivo", size, 540, 125)
    ax = adv_kir + (ba[0] + ba[2]) / 2
    L, t, ang = 15, 3.2, math.radians(28)
    p1 = (ax - L * math.cos(ang) * 0.35, y - cap - 6.5)
    p2 = (p1[0] + L * math.cos(ang), p1[1] - L * math.sin(ang))
    nx, ny = math.sin(ang) * t, math.cos(ang) * t
    acc = poly([p1, p2, (p2[0] + nx, p2[1] + ny), (p1[0] + nx, p1[1] + ny)], accent)
    s, b2 = sub("AUTÓSZERVIZ  ·  DUNAÚJVÁROS", b[2] - b[0], b[0], y + 22, subc, track=0.42, wght=600)
    return w + acc + s, (b[0], p2[1] - 1, b[2], b2[3])


def jel2(fg, accent, frame):
    g = f'<rect x="8" y="8" width="84" height="84" fill="none" stroke="{frame}" stroke-width="1.6"/>'
    d, b, _ = text("archivo", "K", 50, 540, 125, x=0, y=0)
    w = b[2] - b[0]
    cap = cap_height("archivo", 50, 540, 125)
    d, b, _ = text("archivo", "K", 50, 540, 125, x=50 - w / 2 - b[0], y=50 + cap / 2 + 3)
    g += f'<path d="{d}" fill="{fg}"/>'
    ang = math.radians(28)
    p1 = (60, 24)
    p2 = (p1[0] + 12 * math.cos(ang), p1[1] - 12 * math.sin(ang))
    nx, ny = math.sin(ang) * 2.8, math.cos(ang) * 2.8
    g += poly([p1, p2, (p2[0] + nx, p2[1] + ny), (p1[0] + nx, p1[1] + ny)], accent)
    return g, (8, 8, 92, 92)


# ------------------------------------------------ 3. PECSÉT – kör alakú embléma
def ring_text(s, r, size, wght, col, top=True, track=0.32, cx=100, cy=100):
    """Szöveg körív mentén. top=True: felső ív (kifelé álló betűk), False: alsó ív."""
    parts = []
    advs = []
    for ch in s:
        if ch == " ":
            advs.append(size * 0.32)
            continue
        _, b, adv = text("manrope", ch, size, wght)
        advs.append(adv)
    total = sum(advs) + track * size * (len(s) - 1)
    span = total / r
    a = -math.pi / 2 - span / 2 if top else math.pi / 2 + span / 2
    for ch, adv in zip(s, advs):
        mid = a + (adv / 2) / r * (1 if top else -1)
        if ch != " ":
            d, b, _ = text("manrope", ch, size, wght, x=-adv / 2, y=0)
            px, py = cx + r * math.cos(mid), cy + r * math.sin(mid)
            rot = math.degrees(mid) + 90 if top else math.degrees(mid) - 90
            parts.append(f'<path transform="translate({f(px)} {f(py)}) rotate({f(rot)})" d="{d}" fill="{col}"/>')
        a += (adv + track * size) / r * (1 if top else -1)
    return "".join(parts)


def logo3(ring, txt, mark, pivot, dot, bg=None):
    g = ""
    if bg:
        g += f'<circle cx="100" cy="100" r="97" fill="{bg}"/>'
    g += f'<circle cx="100" cy="100" r="96" fill="none" stroke="{ring}" stroke-width="2.4"/>'
    g += f'<circle cx="100" cy="100" r="70" fill="none" stroke="{ring}" stroke-width="1"/>'
    g += ring_text("KIRÁLY AUTÓSZERVIZ", 79.5, 10.6, 700, txt, top=True, track=0.3)
    g += ring_text("DUNAÚJVÁROS · 2008", 88.4, 10.6, 700, txt, top=False, track=0.3)
    for x in (17.5, 182.5):
        g += f'<circle cx="{x}" cy="100" r="2.6" fill="{dot}"/>'
    m, _ = kmono(mark, pivot, w=10.5, top=70, bot=130, x0=77, cx=None, theta=48, s0=9.5, r=5.6)
    g += m
    return g, (2, 2, 198, 198)


# ------------------------------------------------ 4. CSAVARANYA – hatszög + K (arany–fekete)
def hexagon(cx, cy, r):
    return [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(0, 360, 60)]


def jel4(col, ringcol, inner):
    pts = hexagon(50, 50, 44)
    outer = "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"
    pts2 = hexagon(50, 50, 37.5)
    inn = "M" + " L".join(f"{f(x)} {f(y)}" for x, y in reversed(pts2)) + "Z"
    g = f'<path d="{outer} {inn}" fill="{col}" fill-rule="evenodd"/>'
    g += f'<circle cx="50" cy="50" r="31.5" fill="none" stroke="{ringcol}" stroke-width="1"/>'
    m, _ = kmono(inner, None, w=8.6, top=31, bot=69, x0=37, cx=37 + 8.6 + 6, theta=50, s0=6.4)
    g += m
    return g, (6, 11.9, 94, 88.1)


def logo4(hexc, ring, k, fg, subc):
    m, mb = jel4(hexc, ring, k)
    x0 = mb[2] + 22
    w, b = word("KIRÁLY", 40, 620, 118, 0.12, x0, 58, fg)
    s, b2 = sub("AUTÓSZERVIZ", b[2] - b[0], b[0], 77, subc, track=0.6, wght=700)
    return m + w + s, bounds_union(mb, b, b2)


# ------------------------------------------------ KIMENETEK
def svg(body, bb, pad, bg=None, title=""):
    x0, y0, x1, y1 = bb
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    r = f'<rect x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(h)}" '
            f'width="{f(w * 4)}" height="{f(h * 4)}" role="img"><title>{title}</title>{r}{body}</svg>\n')


def placed(body, bb, box_w, box_h, target_w=None, target_h=None, cx=None, cy=None):
    x0, y0, x1, y1 = bb
    w, h = x1 - x0, y1 - y0
    s = min(target_w / w if target_w else 1e9, target_h / h if target_h else 1e9)
    cx = box_w / 2 if cx is None else cx
    cy = box_h / 2 if cy is None else cy
    return f'<g transform="translate({f(cx - (x0 + w / 2) * s)} {f(cy - (y0 + h / 2) * s)}) scale({s:.5f})">{body}</g>'


def social(body, bb, bg, rel=0.5, glow=None):
    S = 1080
    gl = ""
    if glow:
        gl = (f'<defs><radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="{glow}" stop-opacity=".16"/>'
              f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs><rect width="{S}" height="{S}" fill="url(#g)"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}">'
            f'<rect width="{S}" height="{S}" fill="{bg}"/>{gl}{placed(body, bb, S, S, S * rel, S * rel)}</svg>\n')


def cover(body, bb, bg, txtc, accent, logo_w=640, logo_h=200):
    W, H = 1640, 624
    line = "MÁRKAFÜGGETLEN AUTÓSZERVIZ   ·   DUNAÚJVÁROS   ·   +36 20 585 3234"
    lt, lb, _ = text("manrope", line, 17, 600, track=0.22)
    lw = lb[2] - lb[0]
    lt, lb, _ = text("manrope", line, 17, 600, track=0.22, x=W / 2 - lw / 2 - lb[0], y=462)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs><radialGradient id="g" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity=".07"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{W}" height="{H}" fill="{bg}"/><rect width="{W}" height="{H}" fill="url(#g)"/>'
            f'<rect x="{W / 2 - 20}" y="414" width="40" height="2" fill="{accent}"/>'
            f'{placed(body, bb, W, H, logo_w, logo_h, cy=272)}<path d="{lt}" fill="{txtc}"/></svg>\n')


def write(n, name, s):
    d = os.path.join(OUT, f"logo-{n}")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"kiraly-{n}-{name}.svg"), "w") as fh:
        fh.write(s)


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    T = "KIRÁLY Autószerviz – logókoncepció"

    # 1 — Tengely
    b, bb = logo1(GRAFIT, ACEL, GRAFIT, NARANCS, "#C9CED2")
    write(1, "vilagos", svg(b, bb, 12, title=T + " 1"))
    write(1, "fo", svg(b, bb, 40, PAPIR, T + " 1"))
    bd, bbd = logo1(FEHER, HALK, FEHER, NARANCS, "#3A4651")
    write(1, "sotet", svg(bd, bbd, 12, title=T + " 1"))
    write(1, "sotet-hatterrel", svg(bd, bbd, 40, GRAFIT, T + " 1"))
    write(1, "mono", svg(*logo1("#000", "#000", "#000", "#000", "#000"), 12, title=T + " 1"))
    j, jb = jel1(FEHER, NARANCS)
    write(1, "jel", svg(j, jb, 18, GRAFIT, T + " 1 – jel"))
    write(1, "profilkep", social(j, jb, GRAFIT, 0.42, NARANCS))
    write(1, "borito", cover(bd, bbd, GRAFIT, HALK, NARANCS))

    # 2 — Ékezet
    b, bb = logo2(GRAFIT, ACEL, NARANCS)
    write(2, "vilagos", svg(b, bb, 12, title=T + " 2"))
    write(2, "fo", svg(b, bb, 40, PAPIR, T + " 2"))
    bd, bbd = logo2(FEHER, HALK, NARANCS)
    write(2, "sotet", svg(bd, bbd, 12, title=T + " 2"))
    write(2, "sotet-hatterrel", svg(bd, bbd, 40, GRAFIT, T + " 2"))
    write(2, "mono", svg(*logo2("#000", "#000", "#000"), 12, title=T + " 2"))
    j, jb = jel2(FEHER, NARANCS, "#3A4651")
    write(2, "jel", svg(j, jb, 0, GRAFIT, T + " 2 – jel"))
    write(2, "profilkep", social(j, jb, GRAFIT, 0.5, NARANCS))
    write(2, "borito", cover(bd, bbd, GRAFIT, HALK, NARANCS, 700, 170))

    # 3 — Pecsét
    b, bb = logo3(GRAFIT, GRAFIT, GRAFIT, NARANCS, NARANCS)
    write(3, "vilagos", svg(b, bb, 4, title=T + " 3"))
    write(3, "fo", svg(b, bb, 34, PAPIR, T + " 3"))
    bd, bbd = logo3(FEHER, FEHER, FEHER, NARANCS, NARANCS)
    write(3, "sotet", svg(bd, bbd, 4, title=T + " 3"))
    write(3, "sotet-hatterrel", svg(bd, bbd, 34, GRAFIT, T + " 3"))
    write(3, "mono", svg(*logo3("#000", "#000", "#000", "#000", "#000"), 4, title=T + " 3"))
    write(3, "jel", svg(bd, bbd, 20, GRAFIT, T + " 3 – jel"))
    write(3, "profilkep", social(bd, bbd, GRAFIT, 0.74, NARANCS))
    write(3, "borito", cover(bd, bbd, GRAFIT, HALK, NARANCS, 300, 300))

    # 4 — Csavaranya
    bd, bbd = logo4(ARANY, "#3B3420", FEHER, FEHER, ARANY)
    write(4, "sotet", svg(bd, bbd, 12, title=T + " 4"))
    write(4, "fo", svg(bd, bbd, 40, FEKETE, T + " 4"))
    write(4, "sotet-hatterrel", svg(bd, bbd, 40, FEKETE, T + " 4"))
    b, bb = logo4(FEKETE, "#D9D3BF", FEKETE, FEKETE, "#7A6A2E")
    write(4, "vilagos", svg(b, bb, 12, title=T + " 4"))
    b2, bb2 = logo4(FEKETE, "#9C7C04", FEKETE, FEKETE, FEKETE)
    write(4, "sarga-hatterrel", svg(b2, bb2, 40, ARANY, T + " 4"))
    write(4, "mono", svg(*logo4("#000", "#000", "#000", "#000", "#000"), 12, title=T + " 4"))
    j, jb = jel4(ARANY, "#3B3420", FEHER)
    write(4, "jel", svg(j, jb, 16, FEKETE, T + " 4 – jel"))
    write(4, "profilkep", social(j, jb, FEKETE, 0.5, ARANY))
    write(4, "borito", cover(bd, bbd, FEKETE, HALK, ARANY))


if __name__ == "__main__":
    main()
