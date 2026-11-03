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


def lockup(mark, mb, fg, subc, gap=24, size=40, wght=640, wdth=118, track=0.08, sub_track=0.34, sep=None, city=None):
    """Jel balra; jobbra három sor: KIRÁLY / AUTÓSZERVIZ (teljes szélességben) / — DUNAÚJVÁROS — vonalak között."""
    city = city or subc
    mh = mb[3] - mb[1]
    cap = cap_height("archivo", size, wght, wdth)
    x0 = mb[2] + gap
    w, b = word("KIRÁLY", size, wght, wdth, track, x0, 0, fg)
    W = b[2] - b[0]
    _, _, s2 = fit_track("manrope", "AUTÓSZERVIZ", W, 700, track=0.42)
    c2 = cap_height("manrope", s2, 700)
    s3 = 9.6
    c3 = cap_height("manrope", s3, 700)
    g1, g2 = 10, 9
    tot = cap + g1 + c2 + g2 + c3
    top = mb[1] + (mh - tot) / 2
    w, b = word("KIRÁLY", size, wght, wdth, track, x0, top + cap, fg)
    y2 = top + cap + g1 + c2
    d2, b2, _ = fit_track("manrope", "AUTÓSZERVIZ", W, 700, track=0.42, x=b[0], y=y2)
    y3 = y2 + g2 + c3
    d3, b3, _ = text("manrope", "DUNAÚJVÁROS", s3, 700, track=0.4, x=0, y=0)
    w3 = b3[2] - b3[0]
    cx = b[0] + W / 2
    d3, b3, _ = text("manrope", "DUNAÚJVÁROS", s3, 700, track=0.4, x=cx - w3 / 2 - b3[0], y=y3)
    ly = y3 - c3 / 2 - 0.5
    rules = (f'<rect x="{f(b[0])}" y="{f(ly)}" width="{f(cx - w3 / 2 - 7 - b[0])}" height="1" fill="{city}"/>'
             f'<rect x="{f(cx + w3 / 2 + 7)}" y="{f(ly)}" width="{f(b[0] + W - cx - w3 / 2 - 7)}" height="1" fill="{city}"/>')
    body = mark + w + f'<path d="{d2}" fill="{subc}"/><path d="{d3}" fill="{city}"/>' + rules
    return body, bounds_union(mb, b, b2, b3)


# ------------------------------------------------ 1. DUGATTYÚKORONA
def dugattyu(cx, top, w, col, fej=None, bx=None, base=84, acel=None):
    """Dugattyú hajtókarral: fej, két gyűrűhorony, szoknya csapszeg-furattal, hajtókar a forgattyúsig."""
    x = cx - w / 2
    h = 31
    g = ""
    bx = cx if bx is None else bx
    rod = [(cx - 3.4, top + h - 1), (cx + 3.4, top + h - 1), (bx + 4.8, base + 1), (bx - 4.8, base + 1)]
    g += poly(rod, acel or col)
    g += f'<path d="M{f(x)} {f(top + 6.2)}V{f(top + 1.6)}Q{f(x)} {f(top)} {f(x + 1.6)} {f(top)}H{f(x + w - 1.6)}Q{f(x + w)} {f(top)} {f(x + w)} {f(top + 1.6)}V{f(top + 6.2)}Z" fill="{fej or col}"/>'
    g += f'<rect x="{f(x)}" y="{f(top + 8.4)}" width="{f(w)}" height="3" fill="{col}"/>'
    y3 = top + 13.6
    body = f"M{f(x)} {f(y3)}H{f(x + w)}V{f(top + h - 2.5)}Q{f(cx)} {f(top + h + 1.5)} {f(x)} {f(top + h - 2.5)}Z " + circ_path(cx, top + 21.5, 3.1, rev=True)
    g += f'<path d="{body}" fill="{col}" fill-rule="evenodd"/>'
    return g


def jel1(col, accent, acel=None):
    g = dugattyu(29, 27, 22, col, bx=46, acel=acel)
    g += dugattyu(91, 27, 22, col, bx=74, acel=acel)
    g += dugattyu(60, 12, 24, col, fej=accent, acel=acel)
    g += f'<rect x="20" y="84" width="80" height="8" rx="2" fill="{col}"/>'
    for x in (46, 60, 74):
        g += f'<circle cx="{x}" cy="88" r="2" fill="{acel or col}" opacity="{1 if acel else 0}"/>'
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


def jel2(col, accent, acel=None):
    g = kulcs(60, 84, 50, 13.5, 8.5, -26, acel or col)
    g += kulcs(60, 84, 50, 13.5, 8.5, 26, acel or col)
    g += kulcs(60, 84, 60, 15, 9.5, 0, accent)
    g += f'<rect x="36" y="80" width="48" height="9" rx="2" fill="{col}"/>'
    return g, (22, 9, 98, 89)


# ------------------------------------------------ 3. GYÚJTÓGYERTYA-I
def gyertya(cx, top, H, col, spark, acel=None):
    """Gyújtógyertya valós arányokkal (álló), H magasságban, mellette narancs szikra."""
    u = H / 100
    X = lambda v: f(cx + v * u)
    Y = lambda v: f(top + v * u)
    g = ""
    m = acel or col
    # csatlakozó anya + nyak
    g += f'<path d="M{X(-7)} {Y(0)}H{X(7)}V{Y(5)}H{X(3.2)}V{Y(10)}H{X(-3.2)}V{Y(5)}H{X(-7)}Z" fill="{m}"/>'
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
        g += f'<path d="M{X(-9)} {Y(y0 + 1.2)}L{X(9)} {Y(y0)}V{Y(y0 + 3.4)}L{X(-9)} {Y(y0 + 4.6)}Z" fill="{m}"/>'
    # középelektróda + földelő kampó
    g += f'<rect x="{X(-2)}" y="{Y(88)}" width="{f(4 * u)}" height="{f(5 * u)}" fill="{m}"/>'
    g += f'<path d="M{X(6)} {Y(88)}H{X(9)}V{Y(100)}H{X(-4)}V{Y(97)}H{X(6)}Z" fill="{m}"/>'
    # szikra
    sx, sy = cx - 16.5 * u, top + 90 * u
    u = u * 1.35
    g += f'<path d="M{f(sx + 4 * u)} {f(sy - 9 * u)}L{f(sx - 3 * u)} {f(sy + 1 * u)}H{f(sx + 1.5 * u)}L{f(sx - 3.5 * u)} {f(sy + 10 * u)}L{f(sx + 6 * u)} {f(sy - 2 * u)}H{f(sx + 1.6 * u)}Z" fill="{spark}"/>'
    return g


def logo3(fg, subc, spark, acel=None):
    m = gyertya(40, 8, 84, fg, spark, acel)
    mb = (21, 8, 55, 92)
    return lockup(m, mb, fg, subc, gap=22, sep=None)


def jel3(fg, spark, acel=None):
    return gyertya(52, 8, 84, fg, spark, acel), (33, 8, 67, 92)


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


def jel4(col, hub=None):
    """Fogaskerék-korona: félkör fogaskerék hét foggal – a középső a legmagasabb, mint a korona csúcsa –,
    hatlap alakú agyfurattal, talpsávon."""
    cx, cy = 60, 74
    r_out = 34
    teeth = [(-165, 42), (-140, 42), (-115, 42.5), (-90, 46.5), (-65, 42.5), (-40, 42), (-15, 42)]
    def pt(ang, r):
        a = math.radians(ang)
        return (cx + r * math.cos(a), cy + r * math.sin(a))
    pts = [pt(-180, r_out)]
    ang = -180.0
    for tc, rt in teeth:
        hb, ht = 8.2, 6.0
        for i in range(1, 5):
            pts.append(pt(ang + (tc - hb - ang) * i / 4, r_out))
        pts += [pt(tc - ht, rt), pt(tc + ht, rt), pt(tc + hb, r_out)]
        ang = tc + hb
    for i in range(1, 5):
        pts.append(pt(ang + (0 - ang) * i / 4, r_out))
    pts += [(cx + r_out + 4, cy), (cx + r_out + 4, cy + 11), (cx - r_out - 4, cy + 11), (cx - r_out - 4, cy)]
    hexa = [(cx + 9.5 * math.cos(math.radians(a)), cy - 10 + 9.5 * math.sin(math.radians(a))) for a in range(0, 360, 60)][::-1]
    g = f'<path d="{P(pts)} {P(hexa)}" fill="{col}" fill-rule="evenodd"/>'
    if hub:
        g += f'<rect x="{f(cx - r_out - 4)}" y="{f(cy + 4)}" width="{f(2 * r_out + 8)}" height="2.2" fill="{hub}"/>'
    return g, (cx - r_out - 6, cy - 47, cx + r_out + 6, cy + 11)


def logo4(col, hub, fg, subc):
    m, mb = jel4(col, hub)
    return lockup(m, mb, fg, subc, gap=22, sep=None)


# ------------------------------------------------ 5. JELVÉNY – KIRÁLY + AUTÓSZERVIZ egy egységben
def mini_korona(cx, base, col, accent):
    """Három kis dugattyúfej (korona) – a jelvény tetején, a keretvonalat megszakítva."""
    g = ""
    for dx, h, w, c in ((-17, 13, 12, col), (0, 19, 14, accent), (17, 13, 12, col)):
        x, top = cx + dx - w / 2, base - h
        g += f'<rect x="{f(x)}" y="{f(top)}" width="{f(w)}" height="3.6" rx=".8" fill="{c}"/>'
        g += f'<rect x="{f(x)}" y="{f(top + 5.2)}" width="{f(w)}" height="1.6" fill="{c}"/>'
        g += f'<path d="M{f(x)} {f(top + 8.4)}H{f(x + w)}V{f(base)}H{f(x)}Z {circ_path(cx + dx, top + 8.4 + (base - top - 8.4) / 2, w * .14, rev=True)}" fill="{c}" fill-rule="evenodd"/>'
    return g


def logo5(fg, accent, bar_txt, small):
    W, H, c = 300, 132, 12
    top = 14
    pts = [(c, top), (W - c, top), (W, top + c), (W, top + H - c), (W - c, top + H), (c, top + H), (0, top + H - c), (0, top + c)]
    gap = 44
    # keret, a tetején rés a koronának
    frame = (f'<path d="M{f(W / 2 + gap)} {f(top)}H{f(W - c)}L{f(W)} {f(top + c)}V{f(top + H - c)}L{f(W - c)} {f(top + H)}'
             f'H{f(c)}L0 {f(top + H - c)}V{f(top + c)}L{f(c)} {f(top)}H{f(W / 2 - gap)}" fill="none" stroke="{fg}" stroke-width="2.6"/>')
    g = frame + f'<g transform="translate({f(W / 2)} {f(top + 6)}) scale(1.75) translate({f(-W / 2)} {f(-(top + 6))})">' + mini_korona(W / 2, top + 6, fg, accent) + "</g>"
    size = 52
    d, b, _ = text("archivo", "KIRÁLY", size, 660, 120, track=0.07)
    wk = b[2] - b[0]
    cap = cap_height("archivo", size, 660, 120)
    yb = top + 26 + cap
    d, b, _ = text("archivo", "KIRÁLY", size, 660, 120, track=0.07, x=W / 2 - wk / 2 - b[0], y=yb)
    g += f'<path d="{d}" fill="{fg}"/>'
    bx0, bx1, by0, bh = 22, W - 22, yb + 11, 25
    g += f'<path d="M{f(bx0)} {f(by0)}H{f(bx1)}V{f(by0 + bh)}H{f(bx0)}Z" fill="{accent}"/>'
    _, _, sz = fit_track("manrope", "AUTÓSZERVIZ", bx1 - bx0 - 40, 800, track=0.46)
    cp = cap_height("manrope", sz, 800)
    d2, b2, _ = fit_track("manrope", "AUTÓSZERVIZ", bx1 - bx0 - 40, 800, track=0.46, x=bx0 + 20, y=by0 + bh / 2 + cp / 2)
    g += f'<path d="{d2}" fill="{bar_txt}"/>'
    s3 = 9.8
    d3, b3, _ = text("manrope", "DUNAÚJVÁROS  ·  2008 ÓTA", s3, 700, track=0.38)
    w3 = b3[2] - b3[0]
    d3, b3, _ = text("manrope", "DUNAÚJVÁROS  ·  2008 ÓTA", s3, 700, track=0.38, x=W / 2 - w3 / 2 - b3[0], y=by0 + bh + 16)
    g += f'<path d="{d3}" fill="{small}"/>'
    return g, (-1.5, top - 28, W + 1.5, top + H + 1.5)


def jel5(fg, accent, bar_txt):
    S, c = 100, 9
    g = f'<path d="M{c} 0H{S - c}L{S} {c}V{S - c}L{S - c} {S}H{c}L0 {S - c}V{c}Z" fill="{fg}"/>'
    g += f'<g transform="translate(50 58) scale(1.9) translate(-50 -58)">' + mini_korona(50, 58, bar_txt, accent) + "</g>"
    g += f'<rect x="16" y="66" width="68" height="13" fill="{accent}"/>'
    return g, (0, 0, S, S)


# ------------------------------------------------ ÚJ 4. RUGÓSTAG-KIRÁLY (sakk-király futómű-rugóstagból)
def jel_rugo(col, spring, acel=None):
    m = acel or col
    cx = 40
    g = ""
    # kereszt (a sakk-király jele)
    g += f'<rect x="{cx - 2.6}" y="0" width="5.2" height="15" rx="1" fill="{spring}"/>'
    g += f'<rect x="{cx - 7.5}" y="4.6" width="15" height="5.2" rx="1" fill="{spring}"/>'
    # felső csapágy / toronyfej (a király „feje”)
    g += f'<path d="M{cx - 15} 18H{cx + 15}L{cx + 12} 26H{cx - 12}Z" fill="{col}"/>'
    # dugattyúrúd
    g += f'<rect x="{cx - 2.8}" y="26" width="5.6" height="9" fill="{m}"/>'
    # felső rugótányér
    g += f'<rect x="{cx - 17}" y="35" width="34" height="4" rx="1.2" fill="{col}"/>'
    # spirálrugó: ferde menetek
    for i in range(6):
        y = 41.5 + i * 5.4
        g += f'<path d="M{cx - 14} {y + 2.2}L{cx + 14} {y - 1.2}V{y + 1.8}L{cx - 14} {y + 5.2}Z" fill="{spring}"/>'
    # alsó rugótányér
    g += f'<rect x="{cx - 18}" y="76" width="36" height="4" rx="1.2" fill="{col}"/>'
    # lengéscsillapító-test
    g += f'<path d="M{cx - 8} 80H{cx + 8}V91H{cx - 8}Z" fill="{m}"/>'
    # talp (sakkbábu-talp, kétlépcsős)
    g += f'<path d="M{cx - 15} 91H{cx + 15}L{cx + 17} 95H{cx - 17}Z" fill="{col}"/>'
    g += f'<rect x="{cx - 21}" y="95" width="42" height="6" rx="1.5" fill="{col}"/>'
    return g, (cx - 21, 0, cx + 21, 101)


# ------------------------------------------------ ÚJ 5. GUMIMINTA-KORONA
_MID = [0]


def jel_minta(col, accent, acel=None):
    """Műszer-korona: fordulatszámmérő íve, a három fő skálajel koronacsúcsként nő ki, narancs mutató."""
    m = acel or col
    cx, cy = 60, 74
    def pt(a, r):
        t = math.radians(a)
        return (cx + r * math.cos(t), cy + r * math.sin(t))
    g = ""
    # vastag ív
    r0, r1 = 37, 45
    arc = [pt(-180 + i * 180 / 60, r1) for i in range(61)] + [pt(0 - i * 180 / 60, r0) for i in range(61)]
    g += poly(arc, col)
    # koronacsúcsok (fő skálajelek)
    for a, h, w in ((-150, 15, 7), (-90, 21, 8), (-30, 15, 7)):
        g += poly([pt(a - w, r1 - .5), pt(a, r1 + h), pt(a + w, r1 - .5)], col)
    # kis skálajelek
    for a in range(-170, -9, 10):
        if a in (-150, -90, -30):
            continue
        p0, p1 = pt(a, r0 - 3), pt(a, r0 - 8 if a % 30 == 0 else r0 - 6)
        g += f'<line x1="{f(p0[0])}" y1="{f(p0[1])}" x2="{f(p1[0])}" y2="{f(p1[1])}" stroke="{m}" stroke-width="2"/>'
    # mutató
    tip = pt(-58, 31)
    n = (math.cos(math.radians(32)), math.sin(math.radians(32)))
    g += poly([(cx - 3.2 * n[0], cy - 3.2 * n[1]), tip, (cx + 3.2 * n[0], cy + 3.2 * n[1])], accent)
    g += f'<circle cx="{cx}" cy="{cy}" r="6.5" fill="{accent}"/><circle cx="{cx}" cy="{cy}" r="2.4" fill="{col}"/>'
    # talpsáv
    g += f'<rect x="{cx - 49}" y="{cy + 3}" width="98" height="8" rx="1.5" fill="{col}"/>'
    return g, (cx - 49, cy - r1 - 21, cx + 49, cy + 11)


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
    write(n, "jel-tiszta", svg(j, jb, 2, title=T + " – jel"))
    write(n, "profilkep", social(j, jb, jel_bg, prof_rel, glow))
    write(n, "borito", cover(bd, bbd, cov_bg, HALK, cov_acc))


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    T = "KIRÁLY Autószerviz – logókoncepció"

    # 1 — Dugattyúkorona
    sorozat(1, T + " 1",
            lockup(*jel1(GRAFIT, NARANCS, "#8B959E"), GRAFIT, ACEL),
            lockup(*jel1(FEHER, NARANCS, "#7C8792"), FEHER, HALK),
            lockup(*jel1("#000", "#000"), "#000", "#000"),
            jel1(FEHER, NARANCS, "#7C8792"), GRAFIT, 0.5)

    # 2 — Kulcskorona
    sorozat(2, T + " 2",
            lockup(*jel2(GRAFIT, NARANCS, "#8B959E"), GRAFIT, ACEL),
            lockup(*jel2(FEHER, NARANCS, "#7C8792"), FEHER, HALK),
            lockup(*jel2("#000", "#000"), "#000", "#000"),
            jel2(FEHER, NARANCS, "#7C8792"), GRAFIT, 0.52)

    # 3 — Gyújtógyertya-I
    sorozat(3, T + " 3",
            logo3(GRAFIT, ACEL, NARANCS, "#8B959E"),
            logo3(FEHER, HALK, NARANCS, "#7C8792"),
            logo3("#000", "#000", "#000"),
            jel3(FEHER, NARANCS, "#7C8792"), GRAFIT, 0.5)

    # 4 — Rugóstag-király
    LA, DA = "#8B959E", "#7C8792"
    sorozat(4, T + " 4",
            lockup(*jel_rugo(GRAFIT, NARANCS, LA), GRAFIT, ACEL),
            lockup(*jel_rugo(FEHER, NARANCS, DA), FEHER, HALK),
            lockup(*jel_rugo("#000", "#000"), "#000", "#000"),
            jel_rugo(FEHER, NARANCS, DA), GRAFIT, 0.5)

    # 5 — Műszer-korona
    sorozat(5, T + " 5",
            lockup(*jel_minta(GRAFIT, NARANCS, LA), GRAFIT, ACEL),
            lockup(*jel_minta(FEHER, NARANCS, DA), FEHER, HALK),
            lockup(*jel_minta("#000", "#000"), "#000", "#000"),
            jel_minta(FEHER, NARANCS, DA), GRAFIT, 0.52)
    # csak a szükséges fájlok maradnak
    for n in range(1, 6):
        d = os.path.join(OUT, f"logo-{n}")
        for fn in os.listdir(d):
            if not any(fn.endswith(k + ".svg") for k in ("-fo", "-sotet", "-vilagos", "-jel", "-jel-tiszta", "-sotet-hatterrel")):
                os.remove(os.path.join(d, fn))

if __name__ == "__main__":
    main()
