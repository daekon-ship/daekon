"""KIRÁLY Autószerviz – 4 logókoncepció, 3. kör: autószerelős jelképek, egyszerű, prémium formában.
1 Dugattyúkorona · 2 Kulcskorona · 3 Gyújtógyertya-I · 4 Abroncs-embléma. Minden betű görbe.
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
ARANY = "#F2B705"
FEKETE = "#0A0B0D"
SUB = "AUTÓSZERVIZ · DUNAÚJVÁROS"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"


def poly(pts, fill):
    return f'<path d="{P(pts)}" fill="{fill}"/>'


def circ_path(cx, cy, r, rev=False):
    s = 0 if rev else 1
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 {s} {f(2 * r)} 0a{f(r)} {f(r)} 0 1 {s} {f(-2 * r)} 0Z"


def bounds_union(*bs):
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))


def word(s, size, wght, wdth, track, x, y, col, skew=0):
    d, b, _ = text("archivo", s, size, wght, wdth, track=track, x=x, y=y, skew_deg=skew)
    return f'<path d="{d}" fill="{col}"/>', b


def sub(s, width, x, y, col, track=0.4, wght=650):
    d, b, _ = fit_track("manrope", s, width, wght, track=track, x=x, y=y)
    return f'<path d="{d}" fill="{col}"/>', b


def lockup(mark, mb, fg, subc, gap=20, size=40, wght=620, wdth=118, track=0.1, sub_track=0.34, sep=None):
    """Jel balra, KIRÁLY + alcím jobbra, a jel magasságához igazítva."""
    mh = mb[3] - mb[1]
    cap = cap_height("archivo", size, wght, wdth)
    sub_cap = 9.2
    tot = cap + 13 + sub_cap
    top = mb[1] + (mh - tot) / 2 + 2
    x0 = mb[2] + gap
    g = ""
    if sep:
        g += f'<rect x="{f(mb[2] + gap / 2 + 2)}" y="{f(mb[1] + 6)}" width="1.1" height="{f(mh - 12)}" fill="{sep}"/>'
        x0 += 6
    w, b = word("KIRÁLY", size, wght, wdth, track, x0, top + cap, fg)
    s, b2 = sub(SUB, b[2] - b[0], b[0], top + cap + 13 + sub_cap, subc, track=sub_track)
    return mark + g + w + s, bounds_union(mb, b, b2)


# ------------------------------------------------ 1. DUGATTYÚKORONA
def dugattyu(cx, top, w, col, fej=None, bx=None, base=84):
    """Dugattyú hajtókarral: fej, két gyűrűhorony, szoknya csapszeg-furattal, hajtókar a forgattyúsig."""
    x = cx - w / 2
    h = 31
    g = ""
    bx = cx if bx is None else bx
    rod = [(cx - 3.4, top + h - 1), (cx + 3.4, top + h - 1), (bx + 4.8, base + 1), (bx - 4.8, base + 1)]
    g += poly(rod, col)
    g += f'<path d="M{f(x)} {f(top + 6.2)}V{f(top + 1.6)}Q{f(x)} {f(top)} {f(x + 1.6)} {f(top)}H{f(x + w - 1.6)}Q{f(x + w)} {f(top)} {f(x + w)} {f(top + 1.6)}V{f(top + 6.2)}Z" fill="{fej or col}"/>'
    g += f'<rect x="{f(x)}" y="{f(top + 8.4)}" width="{f(w)}" height="3" fill="{col}"/>'
    y3 = top + 13.6
    body = f"M{f(x)} {f(y3)}H{f(x + w)}V{f(top + h - 2.5)}Q{f(cx)} {f(top + h + 1.5)} {f(x)} {f(top + h - 2.5)}Z " + circ_path(cx, top + 21.5, 3.1, rev=True)
    g += f'<path d="{body}" fill="{col}" fill-rule="evenodd"/>'
    return g


def jel1(col, accent):
    g = dugattyu(29, 27, 22, col, bx=46)
    g += dugattyu(91, 27, 22, col, bx=74)
    g += dugattyu(60, 12, 24, col, fej=accent)
    g += f'<rect x="20" y="84" width="80" height="8" rx="1" fill="{col}"/>'
    return g, (18, 12, 102, 92)


# ------------------------------------------------ 2. KULCSKORONA
def kulcs(bx, by, length, R, sw, ang, col):
    """Villáskulcs: nyitott pofa felül, szár lefelé; (bx,by) körül elforgatva."""
    hx, hy = bx, by - length
    W = R * 0.92
    yt = -math.sqrt(R * R - (W / 2) ** 2)
    nd = -R * 0.08
    th_l = math.atan2(yt, -W / 2)
    th_r = math.atan2(yt, W / 2) - 2 * math.pi
    pts = [(hx - W / 2, hy + nd), (hx - W / 2, hy + yt)]
    for i in range(1, 48):
        a = th_l + (th_r - th_l) * i / 48
        pts.append((hx + R * math.cos(a), hy + R * math.sin(a)))
    pts += [(hx + W / 2, hy + yt), (hx + W / 2, hy + nd)]
    shaft = [(bx - sw / 2, hy + R * 0.55), (bx + sw / 2, hy + R * 0.55), (bx + sw / 2 * 0.85, by + 2), (bx - sw / 2 * 0.85, by + 2)]
    return f'<g transform="rotate({f(ang)} {f(bx)} {f(by)})">' + poly(pts, col) + poly(shaft, col) + "</g>"


def jel2(col, accent):
    g = kulcs(60, 84, 50, 13.5, 8.5, -26, col)
    g += kulcs(60, 84, 50, 13.5, 8.5, 26, col)
    g += kulcs(60, 84, 60, 15, 9.5, 0, accent)
    g += f'<rect x="38" y="80" width="44" height="9" fill="{col}"/>'
    return g, (22, 9, 98, 89)


# ------------------------------------------------ 3. GYÚJTÓGYERTYA-I
def gyertya(cx, top, H, col, spark):
    """Gyújtógyertya valós arányokkal (álló), H magasságban, mellette narancs szikra."""
    u = H / 100
    X = lambda v: f(cx + v * u)
    Y = lambda v: f(top + v * u)
    g = ""
    # csatlakozó anya + nyak
    g += f'<path d="M{X(-7)} {Y(0)}H{X(7)}V{Y(5)}H{X(3.2)}V{Y(10)}H{X(-3.2)}V{Y(5)}H{X(-7)}Z" fill="{col}"/>'
    # kerámia szigetelő 3 bordával
    ins = f"M{X(-8)} {Y(10)}H{X(8)}"
    for i in range(3):
        y0 = 10 + i * 9
        ins += f"V{Y(y0 + 3)}Q{X(11)} {Y(y0 + 5.5)} {X(8)} {Y(y0 + 8)}"
    ins += f"V{Y(42)}H{X(10)}V{Y(47)}H{X(-10)}V{Y(42)}H{X(-8)}"
    for i in range(3)[::-1]:
        y0 = 10 + i * 9
        ins += f"V{Y(y0 + 8)}Q{X(-11)} {Y(y0 + 5.5)} {X(-8)} {Y(y0 + 3)}"
    ins += "Z"
    g += f'<path d="{ins}" fill="{col}"/>'
    # hatlap (letört sarkokkal)
    g += f'<path d="M{X(-15)} {Y(51)}L{X(-12)} {Y(49)}H{X(12)}L{X(15)} {Y(51)}V{Y(62)}L{X(12)} {Y(64)}H{X(-12)}L{X(-15)} {Y(62)}Z" fill="{col}"/>'
    # menet: ferde lamellák
    for i in range(4):
        y0 = 67 + i * 5.2
        g += f'<path d="M{X(-9)} {Y(y0 + 1.2)}L{X(9)} {Y(y0)}V{Y(y0 + 3.4)}L{X(-9)} {Y(y0 + 4.6)}Z" fill="{col}"/>'
    # középelektróda + földelő kampó
    g += f'<rect x="{X(-2)}" y="{Y(88)}" width="{f(4 * u)}" height="{f(5 * u)}" fill="{col}"/>'
    g += f'<path d="M{X(6)} {Y(88)}H{X(9)}V{Y(100)}H{X(-4)}V{Y(97)}H{X(6)}Z" fill="{col}"/>'
    # szikra
    sx, sy = cx - 15 * u, top + 92 * u
    g += f'<path d="M{f(sx + 4 * u)} {f(sy - 9 * u)}L{f(sx - 3 * u)} {f(sy + 1 * u)}H{f(sx + 1.5 * u)}L{f(sx - 3.5 * u)} {f(sy + 10 * u)}L{f(sx + 6 * u)} {f(sy - 2 * u)}H{f(sx + 1.6 * u)}Z" fill="{spark}"/>'
    return g


def logo3(fg, subc, spark):
    m = gyertya(40, 8, 84, fg, spark)
    mb = (21, 8, 55, 92)
    return lockup(m, mb, fg, subc, gap=22, sep=None)


def jel3(fg, spark, bg=None):
    return gyertya(52, 8, 84, fg, spark), (33, 8, 67, 92)


# ------------------------------------------------ 4. ABRONCS-EMBLÉMA
def ring_text(s, r, size, wght, col, top=True, track=0.3, cx=100, cy=100):
    parts, advs = [], []
    for ch in s:
        advs.append(size * 0.32 if ch == " " else text("manrope", ch, size, wght)[2])
    total = sum(advs) + track * size * (len(s) - 1)
    a = -math.pi / 2 - (total / r) / 2 if top else math.pi / 2 + (total / r) / 2
    for ch, adv in zip(s, advs):
        mid = a + (adv / 2) / r * (1 if top else -1)
        if ch != " ":
            d, _, _ = text("manrope", ch, size, wght, x=-adv / 2, y=0)
            px, py = cx + r * math.cos(mid), cy + r * math.sin(mid)
            rot = math.degrees(mid) + (90 if top else -90)
            parts.append(f'<path transform="translate({f(px)} {f(py)}) rotate({f(rot)})" d="{d}" fill="{col}"/>')
        a += (adv + track * size) / r * (1 if top else -1)
    return "".join(parts)


def jel4(tire, txt, metal, hub, hubdark):
    cx = cy = 100
    pts = []
    n = 72
    for i in range(n):
        a0 = 2 * math.pi * i / n
        for k, rr in ((0, 96), (0.55, 96), (0.55, 92.5), (1, 92.5)):
            a = a0 + 2 * math.pi / n * k
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    g = f'<path d="{P(pts)} {circ_path(cx, cy, 66, rev=True)}" fill="{tire}" fill-rule="evenodd"/>'
    g += ring_text("KIRÁLY AUTÓSZERVIZ", 76, 10.4, 800, txt, top=True, track=0.26)
    g += ring_text("DUNAÚJVÁROS · 2008", 85.2, 10.4, 800, txt, top=False, track=0.26)
    g += f'<path d="{circ_path(cx, cy, 63)} {circ_path(cx, cy, 56, rev=True)}" fill="{metal}" fill-rule="evenodd"/>'
    for i in range(5):
        a = -math.pi / 2 + 2 * math.pi * i / 5
        ca, sa = math.cos(a), math.sin(a)
        nx, ny = -sa, ca
        r0, r1, w0, w1 = 12, 58, 4.2, 6.6
        sp = [(cx + ca * r0 + nx * w0, cy + sa * r0 + ny * w0), (cx + ca * r1 + nx * w1, cy + sa * r1 + ny * w1),
              (cx + ca * r1 - nx * w1, cy + sa * r1 - ny * w1), (cx + ca * r0 - nx * w0, cy + sa * r0 - ny * w0)]
        g += poly(sp, metal)
    g += f'<circle cx="{cx}" cy="{cy}" r="15" fill="{hub}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="5" fill="{hubdark}"/>'
    for i in range(5):
        a = -math.pi / 2 + math.pi / 5 + 2 * math.pi * i / 5
        g += f'<circle cx="{f(cx + 10 * math.cos(a))}" cy="{f(cy + 10 * math.sin(a))}" r="1.9" fill="{hubdark}"/>'
    return g, (4, 4, 196, 196)


def logo4(tire, txt, metal, hub, hubdark, fg, subc):
    m, mb = jel4(tire, txt, metal, hub, hubdark)
    m = f'<g transform="translate(0 0) scale(.5)">{m}</g>'
    mb = (2, 2, 98, 98)
    return lockup(m, mb, fg, subc, gap=22, size=40)


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
        gl = (f'<defs><radialGradient id="g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="{glow}" stop-opacity=".16"/>'
              f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs><rect width="{S}" height="{S}" fill="url(#g)"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}">'
            f'<rect width="{S}" height="{S}" fill="{bg}"/>{gl}{placed(body, bb, S, S, S * rel, S * rel)}</svg>\n')


def cover(body, bb, bg, txtc, accent, logo_w=700, logo_h=190):
    W, H = 1640, 624
    line = "MÁRKAFÜGGETLEN AUTÓSZERVIZ   ·   DÍZEL   ·   3D FUTÓMŰ   ·   +36 20 585 3234"
    lt, lb, _ = text("manrope", line, 17, 600, track=0.2)
    lw = lb[2] - lb[0]
    lt, lb, _ = text("manrope", line, 17, 600, track=0.2, x=W / 2 - lw / 2 - lb[0], y=470)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs><radialGradient id="g" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity=".07"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{W}" height="{H}" fill="{bg}"/><rect width="{W}" height="{H}" fill="url(#g)"/>'
            f'<rect x="{W / 2 - 20}" y="420" width="40" height="2" fill="{accent}"/>'
            f'{placed(body, bb, W, H, logo_w, logo_h, cy=275)}<path d="{lt}" fill="{txtc}"/></svg>\n')


def write(n, name, s):
    d = os.path.join(OUT, f"logo-{n}")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"kiraly-{n}-{name}.svg"), "w") as fh:
        fh.write(s)


def sorozat(n, T, vil, sot, mono, jel_s, jel_bg, prof_rel=0.5, glow=NARANCS, fo_bg=PAPIR, cov_bg=GRAFIT, cov_acc=NARANCS):
    b, bb = vil
    write(n, "vilagos", svg(b, bb, 12, title=T))
    write(n, "fo", svg(b, bb, 40, fo_bg, T))
    bd, bbd = sot
    write(n, "sotet", svg(bd, bbd, 12, title=T))
    write(n, "sotet-hatterrel", svg(bd, bbd, 40, cov_bg, T))
    write(n, "mono", svg(*mono, 12, title=T))
    j, jb = jel_s
    write(n, "jel", svg(j, jb, 16, jel_bg, T + " – jel"))
    write(n, "profilkep", social(j, jb, jel_bg, prof_rel, glow))
    write(n, "borito", cover(bd, bbd, cov_bg, HALK, cov_acc))


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    T = "KIRÁLY Autószerviz – logókoncepció"

    # 1 — Dugattyúkorona
    sorozat(1, T + " 1",
            lockup(*jel1(GRAFIT, NARANCS), GRAFIT, ACEL, sep="#C9CED2"),
            lockup(*jel1(FEHER, NARANCS), FEHER, HALK, sep="#3A4651"),
            lockup(*jel1("#000", "#000"), "#000", "#000", sep="#000"),
            jel1(FEHER, NARANCS), GRAFIT, 0.5)

    # 2 — Kulcskorona
    sorozat(2, T + " 2",
            lockup(*jel2(GRAFIT, NARANCS), GRAFIT, ACEL, sep="#C9CED2"),
            lockup(*jel2(FEHER, NARANCS), FEHER, HALK, sep="#3A4651"),
            lockup(*jel2("#000", "#000"), "#000", "#000", sep="#000"),
            jel2(FEHER, NARANCS), GRAFIT, 0.52)

    # 3 — Gyújtógyertya-I
    sorozat(3, T + " 3",
            logo3(GRAFIT, ACEL, NARANCS),
            logo3(FEHER, HALK, NARANCS),
            logo3("#000", "#000", "#000"),
            jel3(FEHER, NARANCS), GRAFIT, 0.5)

    # 4 — Abroncs-embléma (arany–fekete)
    vil = logo4("#1E2226", ARANY, "#9AA3AB", ARANY, "#1E2226", FEKETE, "#6B5A1E")
    sot = logo4("#2A2F35", ARANY, "#C9CED2", ARANY, FEKETE, FEHER, ARANY)
    mono = logo4("#000", "#fff", "#000", "#000", "#fff", "#000", "#000")
    j = jel4("#2A2F35", ARANY, "#C9CED2", ARANY, FEKETE)
    sorozat(4, T + " 4", vil, sot, mono, j, FEKETE, 0.8, ARANY, PAPIR, FEKETE, ARANY)
    b, bb = vil
    write(4, "sarga-hatterrel", svg(*logo4("#0A0B0D", ARANY, "#3A3A3A", "#0A0B0D", ARANY, FEKETE, FEKETE)[0:1], bb, 40, ARANY, T + " 4"))


if __name__ == "__main__":
    main()
