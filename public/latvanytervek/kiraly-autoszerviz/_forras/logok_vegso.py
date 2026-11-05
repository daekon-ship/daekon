"""KIRÁLY Autószerviz – végleges prémium logók (arculat-vegso/). A korábbi mappákat nem érinti.
1 Kör alakú szervizembléma (éjkék–arany) · 2 Dugattyús pajzs (grafit–narancs) · 3 Szárnyas kormány (petrol–réz)
python3 _forras/logok_vegso.py
"""
import math, os, shutil, itertools
from betuk import text, cap_height

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-vegso")
_ID = itertools.count(1)

KONCEPCIOK = {
    1: dict(slug="1-kor-emblema", nev="Kör alakú szervizembléma", dark="#0E1B2C", panel="#13243A", acc="#C9A14F", light="#F6F2EA",
            ink_l="#0E1B2C", sub_l="#3E4E66", ink_d="#F6F2EA", sub_d="#C2CAD6"),
    2: dict(slug="2-muszer", nev="Precíziós műszer", dark="#12161B", panel="#1B2128", acc="#F26732", light="#F4F5F2", metal="#9AA3AC",
            ink_l="#12161B", sub_l="#46505B", ink_d="#F4F5F6", sub_d="#B4BCC4"),
    3: dict(slug="3-szarnyas-kormany", nev="Szárnyas kormány", dark="#0C2B33", panel="#123640", acc="#C48A5A", light="#F4F0EA",
            ink_l="#0C2B33", sub_l="#3D5A61", ink_d="#F4F0EA", sub_d="#B7C9CC"),
}


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"


def circ(cx, cy, r, rev=False):
    s = 0 if rev else 1
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 {s} {f(2 * r)} 0a{f(r)} {f(r)} 0 1 {s} {f(-2 * r)} 0Z"


def ring(cx, cy, r, w, col):
    return f'<path d="{circ(cx, cy, r + w / 2)} {circ(cx, cy, r - w / 2, True)}" fill="{col}" fill-rule="evenodd"/>'


def txt(s, key, size, wght, wdth, track, x, y, col, anchor="c"):
    d, b, _ = text(key, s, size, wght, wdth, track=track)
    w = b[2] - b[0]
    xx = x - w / 2 - b[0] if anchor == "c" else x - b[0]
    d, b, _ = text(key, s, size, wght, wdth, track=track, x=xx, y=y)
    return f'<path d="{d}" fill="{col}"/>', b


def arc_text(s, key, r, size, wght, wdth, col, top=True, track=.2, cx=0, cy=0, kern=None):
    """Ívre írt szöveg; top=True: felső ív, kifelé álló betűk; False: alsó ív, olvasható irányban."""
    advs = []
    for ch in s:
        advs.append(size * .3 if ch == " " else text(key, ch, size, wght, wdth)[2])
    kern = kern or {}
    kk = [kern.get(s[i:i + 2], 0) * size for i in range(len(s) - 1)] + [0]  # páronkénti optikai alávágás
    total = sum(advs) + track * size * (len(s) - 1) + sum(kk)
    a = -math.pi / 2 - (total / r) / 2 if top else math.pi / 2 + (total / r) / 2
    out = []
    capo = cap_height(key, size, wght, wdth) / 2
    for ch, adv, kv in zip(s, advs, kk):
        mid = a + (adv / 2) / r * (1 if top else -1)
        if ch != " ":
            # betű középre igazítva az ívre (alapvonal a cap-magasság felével eltolva)
            d, _, _ = text(key, ch, size, wght, wdth, x=-adv / 2, y=capo)
            px, py = cx + r * math.cos(mid), cy + r * math.sin(mid)
            rot = math.degrees(mid) + (90 if top else -90)
            out.append(f'<path transform="translate({f(px)} {f(py)}) rotate({f(rot)})" d="{d}" fill="{col}"/>')
        a += (adv + track * size + kv) / r * (1 if top else -1)
    return "".join(out)


# ---------------------------------------------------------------- közös elemek
def villaskulcs(cx, cy, L, ang, col, R):
    """Egyvégű villáskulcs (fent nyitott pofa, lent lekerekített nyél akasztófurattal), elforgatva."""
    mid = f"vk{next(_ID)}"
    hy = cy - L / 2
    head = circ(cx, hy, R)
    jaw = f"M{f(cx - R * .44)} {f(hy - R - 3)}H{f(cx + R * .44)}V{f(hy + R * .08)}H{f(cx - R * .44)}Z"
    shaft = (f"M{f(cx - R * .38)} {f(hy + R * .55)}H{f(cx + R * .38)}L{f(cx + R * .32)} {f(cy + L / 2)}"
             f"Q{f(cx)} {f(cy + L / 2 + R * .55)} {f(cx - R * .32)} {f(cy + L / 2)}Z")
    hole = circ(cx, cy + L / 2 - R * .12, R * .17)
    box = f'x="{f(cx - 300)}" y="{f(cy - 300)}" width="600" height="600"'
    m = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" {box}><rect {box} fill="#000"/>'
         f'<path d="{head}" fill="#fff"/><path d="{shaft}" fill="#fff"/><path d="{jaw}" fill="#000"/><path d="{hole}" fill="#000"/></mask>')
    return (f'<g transform="rotate({f(ang)} {f(cx)} {f(cy)})"><defs>{m}</defs>'
            f'<rect {box} fill="{col}" mask="url(#{mid})"/></g>')


def wordmark(x, top, ink, sub, acc, size=46, align="l", city=True, rule=True):
    """KIRÁLY / AUTÓSZERVIZ / – DUNAÚJVÁROS, optikailag igazítva."""
    w1 = 720
    cap1 = cap_height("archivo", size, w1, 112)
    s2 = size * .37
    cap2 = cap_height("manrope", s2, 750)
    s3 = size * .23
    cap3 = cap_height("manrope", s3, 700)
    y1 = top + cap1
    y2 = y1 + size * .22 + cap2
    y3 = y2 + size * .2 + cap3
    p1, b1 = txt("KIRÁLY", "archivo", size, w1, 112, .045, x, y1, ink, "c" if align == "c" else "l")
    W = b1[2] - b1[0]
    # AUTÓSZERVIZ a KIRÁLY teljes szélességére (betűköz számítva)
    _, bb, _ = text("manrope", "AUTÓSZERVIZ", s2, 750, None, track=0)
    tr = (W - (bb[2] - bb[0])) / 10 / s2
    p2, b2 = txt("AUTÓSZERVIZ", "manrope", s2, 750, None, tr, b1[0], y2, sub, "l")
    g = p1 + p2
    bb3 = b2
    if city:
        if align == "c":
            p3, b3 = txt("DUNAÚJVÁROS", "manrope", s3, 700, None, .34, b1[0] + W / 2, y3, acc, "c")
            if rule:
                ly = y3 - cap3 / 2 - .5
                g += (f'<rect x="{f(b1[0])}" y="{f(ly)}" width="{f(b3[0] - 8 - b1[0])}" height="1.1" fill="{acc}"/>'
                      f'<rect x="{f(b3[2] + 8)}" y="{f(ly)}" width="{f(b1[2] - b3[2] - 8)}" height="1.1" fill="{acc}"/>')
        else:
            dash = size * .26
            p3, b3 = txt("DUNAÚJVÁROS", "manrope", s3, 700, None, .34, b1[0] + dash + size * .14, y3, acc, "l")
            g += f'<rect x="{f(b1[0])}" y="{f(y3 - cap3 / 2 - .6)}" width="{f(dash)}" height="1.4" fill="{acc}"/>'
        g += p3
        bb3 = b3
    return g, (b1[0], b1[1], max(b1[2], b2[2], bb3[2]), bb3[3])


def place(body, bb, x, y, h):
    k = h / (bb[3] - bb[1])
    return f'<g transform="translate({f(x)} {f(y)}) scale({k:.5f}) translate({f(-bb[0])} {f(-bb[1])})">{body}</g>', (bb[2] - bb[0]) * k


def horizontal(icon, ib, c, ink, sub, size=46, gap_k=.42, city=True):
    wm, wb = wordmark(0, 0, ink, sub, c["acc"], size, city=city)
    th = wb[3] - wb[1]
    ih = th * 1.22
    ic, iw = place(icon, ib, 0, -(ih - th) / 2, ih)
    gap = th * gap_k
    wm, wb = wordmark(iw + gap, 0, ink, sub, c["acc"], size, city=city)
    return ic + wm, (0, -(ih - th) / 2, wb[2], -(ih - th) / 2 + ih)


def compact(icon, ib, c, ink, sub):
    """Álló, kompakt: ikon felül, KIRÁLY + AUTÓSZERVIZ középre zárva (város nélkül – kis méretre)."""
    wm, wb = wordmark(0, 0, ink, sub, c["acc"], 52, "c", city=False)
    W = wb[2] - wb[0]
    ih = W * .62
    ic, iw = place(icon, ib, wb[0] + W / 2 - (ib[2] - ib[0]) * ih / (ib[3] - ib[1]) / 2, 0, ih)
    wm, wb2 = wordmark(wb[0] + W / 2, ih + 18, ink, sub, c["acc"], 52, "c", city=False)
    return ic + wm, (min(wb2[0], wb[0]), 0, max(wb2[2], wb[2]), wb2[3])


# ---------------------------------------------------------------- 1) KÖR ALAKÚ SZERVIZEMBLÉMA
def kor_emblema(c, dark=True, mono=None):
    fill = mono and "none" or c["panel" if dark else "dark"]
    acc = mono or c["acc"]
    ink = mono or c["light"]
    cx = cy = 100
    g = "" if mono else f'<circle cx="100" cy="100" r="99" fill="{fill}"/>'
    g += ring(cx, cy, 93, 3.2, acc)
    g += ring(cx, cy, 63, 1.6, acc)
    g += arc_text("KIRÁLY", "archivo", 77, 21, 760, 112, ink, True, .18, cx, cy)
    g += arc_text("AUTÓSZERVIZ · DUNAÚJVÁROS", "manrope", 78, 9.6, 800, None, acc, False, .2, cx, cy)
    for a in (180, 0):
        x, y = cx + 78 * math.cos(math.radians(a)), cy + 78 * math.sin(math.radians(a))
        g += f'<circle cx="{f(x)}" cy="{f(y)}" r="2.2" fill="{acc}"/>'
    g += villaskulcs(cx, 98, 74, -40, ink, 10.5)
    g += villaskulcs(cx, 98, 74, 40, ink, 10.5)
    return g, (1, 1, 199, 199)


def kor_ikon(c, dark=True, mono=None):
    fill = c["panel" if dark else "dark"]
    acc = mono or c["acc"]
    ink = mono or c["light"]
    g = "" if mono else f'<circle cx="50" cy="50" r="49" fill="{fill}"/>'
    g += ring(50, 50, 44, 4.2, acc)
    g += villaskulcs(50, 51, 58, -40, ink, 9)
    g += villaskulcs(50, 51, 58, 40, ink, 9)
    return g, (1, 1, 99, 99)


# ---------------------------------------------------------------- 2) DUGATTYÚS PAJZS
def pajzs_forma(w, h, x=0, y=0, inset=0):
    """Geometrikus pajzs: letört felső sarkok, egyenes oldalak, két egyenes szakaszból álló hegy."""
    x += inset; y += inset; w -= 2 * inset; h -= 2 * inset
    ch = w * .14
    return [(x + ch, y), (x + w - ch, y), (x + w, y + ch), (x + w, y + h * .56), (x + w / 2, y + h), (x, y + h * .56), (x, y + ch)]


def pajzs(c, dark=True, mono=None):
    acc = mono or c["acc"]
    ink = mono or c["light"]
    W, H = 100, 124
    g = ""
    if not mono:
        g += f'<path d="{P(pajzs_forma(W, H))}" fill="{c["panel"] if dark else c["dark"]}"/>'
    g += f'<path d="{P(pajzs_forma(W, H, inset=1.8))}" fill="none" stroke="{acc}" stroke-width="3.4" stroke-linejoin="miter"/>'
    cx = 50
    # dugattyú: korona (narancs) – két gyűrűhorony – szoknya csapszeg-furattal
    x0, x1, top = 24, 76, 20
    g += f'<path d="M{x0} {top + 8}V{top + 2}Q{x0} {top} {x0 + 2} {top}H{x1 - 2}Q{x1} {top} {x1} {top + 2}V{top + 8}Z" fill="{acc}"/>'
    g += f'<rect x="{x0}" y="{top + 11}" width="{x1 - x0}" height="3.6" fill="{ink}"/>'
    g += f'<rect x="{x0}" y="{top + 17}" width="{x1 - x0}" height="3.6" fill="{ink}"/>'
    sk = f"M{x0} {top + 23.6}H{x1}V{top + 44}L{x1 - 6} {top + 50}H{x0 + 6}L{x0} {top + 44}Z"
    g += f'<path d="{sk} {circ(cx, top + 36, 5.6, True)}" fill="{ink}" fill-rule="evenodd"/>'
    # hajtókar a pajzs hegye felé, nagyfej a hegyben
    g += f'<path d="M{cx - 5} {top + 50}H{cx + 5}L{cx + 7} {top + 74}H{cx - 7}Z" fill="{ink}"/>'
    g += f'<path d="{circ(cx, top + 82, 11)} {circ(cx, top + 82, 4.6, True)}" fill="{ink}" fill-rule="evenodd"/>'
    return g, (0, 0, W, H)


def pajzs_emblema(c, dark=True, mono=None):
    ink = mono or (c["ink_d"] if dark else c["ink_l"])
    sub = mono or (c["sub_d"] if dark else c["sub_l"])
    acc = mono or c["acc"]
    sh, sb = pajzs(c, dark, mono)
    ic, iw = place(sh, sb, 0, 0, 150)
    wm, wb = wordmark(0, 0, ink, sub, acc, 50, "c")
    W = wb[2] - wb[0]
    ic, iw = place(sh, sb, W / 2 - iw / 2 + wb[0], 0, 150)
    wm, wb = wordmark(wb[0] + W / 2, 172, ink, sub, acc, 50, "c")
    return ic + wm, (wb[0], 0, wb[2], wb[3])


# ---------------------------------------------------------------- 2) PRECÍZIÓS MŰSZER
def muszer(c, dark=True, mono=None):
    """Mérőműszer: acél perem, 240°-os skála (fő- és osztásjelek), narancs határzóna, narancs mutató, agy."""
    acc = mono or c["acc"]
    ink = mono or c["light"]
    met = mono or c["metal"]
    cx = cy = 50
    g = "" if mono else f'<circle cx="50" cy="50" r="49" fill="{c["panel"] if dark else c["dark"]}"/>'
    g += ring(cx, cy, 45, 4.6, met)
    g += ring(cx, cy, 40.2, 1, met)
    a0, a1 = 150, 390  # 240°-os ív, alul nyitott
    n = 16
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        major = i % 4 == 0
        r0, r1 = 36, (27 if major else 31.5)
        col = acc if i >= 14 else ink
        g += (f'<line x1="{f(cx + r0 * math.cos(a))}" y1="{f(cy + r0 * math.sin(a))}" x2="{f(cx + r1 * math.cos(a))}" y2="{f(cy + r1 * math.sin(a))}" '
              f'stroke="{col}" stroke-width="{3.6 if major else 2}" stroke-linecap="butt"/>')
    # narancs határzóna-ív a skála végén
    za, zb = math.radians(a0 + (a1 - a0) * 14 / n), math.radians(a1)
    r = 37.8
    g += (f'<path d="M{f(cx + r * math.cos(za))} {f(cy + r * math.sin(za))} A{r} {r} 0 0 1 {f(cx + r * math.cos(zb))} {f(cy + r * math.sin(zb))}" '
          f'fill="none" stroke="{acc}" stroke-width="2"/>')
    # mutató
    am = math.radians(a0 + (a1 - a0) * .62)
    tip = (cx + 31 * math.cos(am), cy + 31 * math.sin(am))
    tail = (cx - 8 * math.cos(am), cy - 8 * math.sin(am))
    nx, ny = -math.sin(am), math.cos(am)
    g += f'<path d="{P([(tail[0] + nx * 2.4, tail[1] + ny * 2.4), tip, (tail[0] - nx * 2.4, tail[1] - ny * 2.4)])}" fill="{acc}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="6.4" fill="{ink}"/><circle cx="{cx}" cy="{cy}" r="2.6" fill="{acc}"/>'
    # alsó nyílásban apró jelölés: két rövid vonal
    g += f'<rect x="{cx - 7}" y="{cy + 25}" width="14" height="1.6" fill="{met}"/>'
    return g, (1, 1, 99, 99)


def muszer_emblema(c, dark=True, mono=None):
    ink = mono or (c["ink_d"] if dark else c["ink_l"])
    sub = mono or (c["sub_d"] if dark else c["sub_l"])
    acc = mono or c["acc"]
    ic, ib = muszer(c, dark, mono)
    wm, wb = wordmark(0, 0, ink, sub, acc, 50, "c")
    W = wb[2] - wb[0]
    ih = 150
    icg, iw = place(ic, ib, wb[0] + W / 2 - ih / 2, 0, ih)
    wm, wb = wordmark(wb[0] + W / 2, ih + 26, ink, sub, acc, 50, "c")
    return icg + wm, (wb[0], 0, wb[2], wb[3])


# ---------------------------------------------------------------- 3) SZÁRNYAS KORMÁNY (kulcs-szárnyakkal)
def kormany(cx, cy, R, col, acc):
    r = R * .76
    g = f'<path d="{circ(cx, cy, R)} {circ(cx, cy, r, True)}" fill="{col}" fill-rule="evenodd"/>'
    k = R / 34
    g += f'<path d="M{f(cx - r - 1)} {f(cy - 3 * k)}H{f(cx - 8 * k)}L{f(cx - 6 * k)} {f(cy + 4 * k)}H{f(cx - r + .5)}Z" fill="{col}"/>'
    g += f'<path d="M{f(cx + r + 1)} {f(cy - 3 * k)}H{f(cx + 8 * k)}L{f(cx + 6 * k)} {f(cy + 4 * k)}H{f(cx + r - .5)}Z" fill="{col}"/>'
    g += f'<path d="M{f(cx - 4.5 * k)} {f(cy + 8 * k)}H{f(cx + 4.5 * k)}L{f(cx + 5.5 * k)} {f(cy + r + 1)}H{f(cx - 5.5 * k)}Z" fill="{col}"/>'
    g += f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(10 * k)}" fill="{col}"/><circle cx="{f(cx)}" cy="{f(cy)}" r="{f(4 * k)}" fill="{acc}"/>'
    return g


def kulcs_szarny(cx, cy, L, h, side, col):
    """Vízszintes villáskulcs-szárny: szár a kormány felől elvékonyodva, kifelé nyitott pofájú fej."""
    mid = f"ksz{next(_ID)}"
    R = h * 1.05
    hx = cx + side * (L - R)
    x_in = cx
    shaft = P([(x_in, cy - h / 2), (hx, cy - h * .32), (hx, cy + h * .32), (x_in, cy + h / 2)])
    jaw = P([(hx + side * R * 1.3, cy - R * .5), (hx + side * R * .05, cy - R * .4), (hx + side * R * .05, cy + R * .4), (hx + side * R * 1.3, cy + R * .5)])
    box = f'x="{f(cx - 400)}" y="{f(cy - 400)}" width="800" height="800"'
    m = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" {box}><rect {box} fill="#000"/><path d="{shaft}" fill="#fff"/>'
         f'<path d="{circ(hx, cy, R)}" fill="#fff"/><path d="{jaw}" fill="#000"/></mask>')
    return f'<defs>{m}</defs><rect {box} fill="{col}" mask="url(#{mid})"/>'


def szarnyas(c, dark=True, mono=None):
    acc = mono or c["acc"]
    ink = mono or c["light"]
    cx, cy = 150, 60
    g = ""
    for side in (-1, 1):
        g += kulcs_szarny(cx + side * 40, cy - 10, 94, 10.5, side, acc)
        g += kulcs_szarny(cx + side * 40, cy + 10, 70, 8.5, side, acc)
    if not mono:
        g += f'<circle cx="{cx}" cy="{cy}" r="46" fill="{c["panel"] if dark else c["dark"]}"/>'
    g += ring(cx, cy, 42, 3.2, acc)
    g += kormany(cx, cy, 30, ink, acc)
    return g, (cx - 140, cy - 46, cx + 140, cy + 46)


def szarnyas_ikon(c, dark=True, mono=None):
    acc = mono or c["acc"]
    ink = mono or c["light"]
    g = "" if mono else f'<circle cx="50" cy="50" r="49" fill="{c["panel"] if dark else c["dark"]}"/>'
    g += ring(50, 50, 44, 4.2, acc)
    g += kormany(50, 50, 32, ink, acc)
    return g, (1, 1, 99, 99)


def szarnyas_emblema(c, dark=True, mono=None):
    ink = mono or (c["ink_d"] if dark else c["ink_l"])
    sub = mono or (c["sub_d"] if dark else c["sub_l"])
    acc = mono or c["acc"]
    m, mb = szarnyas(c, dark, mono)
    wm, wb = wordmark(150, 128, ink, sub, acc, 50, "c")
    return m + wm, (min(mb[0], wb[0]), mb[1], max(mb[2], wb[2]), wb[3])


# ---------------------------------------------------------------- kimenetek
def svg(body, bb, pad=0, title=""):
    x0, y0, x1, y1 = bb
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(h)}" width="{f(w * 4)}" height="{f(h * 4)}">'
            f'<title>{title}</title>{body}</svg>\n')


def build(n):
    c = KONCEPCIOK[n]
    d = os.path.join(OUT, c["slug"])
    os.makedirs(d, exist_ok=True)
    T = f"KIRÁLY Autószerviz – {c['nev']}"
    def w(name, body, bb, pad=6):
        open(os.path.join(d, name + ".svg"), "w").write(svg(body, bb, pad, T))
    for tag, dark in (("sotet-hatterre", True), ("vilagos-hatterre", False)):
        ink = c["ink_d"] if dark else c["ink_l"]
        sub = c["sub_d"] if dark else c["sub_l"]
        if n == 1:
            em = kor_emblema(c, dark); ic = kor_ikon(c, dark)
        elif n == 2:
            em = muszer_emblema(c, dark); ic = muszer(c, dark)
        else:
            em = szarnyas_emblema(c, dark); ic = szarnyas_ikon(c, dark)
        w(f"emblema-{tag}", *em)
        w(f"ikon-{tag}", *ic, pad=2)
        w(f"vizszintes-{tag}", *horizontal(*ic, c, ink, sub))
        w(f"vizszintes-kis-meret-{tag}", *horizontal(*ic, c, ink, sub, city=False))
        w(f"kompakt-{tag}", *compact(*ic, c, ink, sub))
    for tag, col in (("fekete", "#000000"), ("feher", "#FFFFFF")):
        if n == 1:
            em = kor_emblema(c, mono=col); ic = kor_ikon(c, mono=col)
        elif n == 2:
            em = muszer_emblema(c, mono=col); ic = muszer(c, mono=col)
        else:
            em = szarnyas_emblema(c, mono=col); ic = szarnyas_ikon(c, mono=col)
        w(f"emblema-egyszinu-{tag}", *em)
        w(f"ikon-egyszinu-{tag}", *ic, pad=2)
        w(f"vizszintes-egyszinu-{tag}", *horizontal(*ic, dict(c, acc=col), col, col))


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    for n in KONCEPCIOK:
        build(n)


if __name__ == "__main__":
    main()
