"""KIRÁLY Autószerviz – logók 2. generáció (arculat-v2). Az eredeti arculat/ mappát nem érinti.
01 Precision Tools · 02 Engineering · 03 Technical Precision
python3 _forras/logok_v2.py
"""
import math, os, shutil, itertools
from betuk import text, cap_height

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-v2")

GRAFIT, FEHER, NARANCS, FEM = "#11161C", "#F4F5F6", "#F26732", "#8B969F"
SOTET_SZINEK = dict(ink=FEHER, sub="#D3D9DE", city="#8B969F", metal="#8B969F", accent=NARANCS)
VILAGOS_SZINEK = dict(ink=GRAFIT, sub="#26303A", city="#66717B", metal="#7D8892", accent=NARANCS)
_id = itertools.count(1)


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"


def circ(cx, cy, r, rev=False):
    s = 0 if rev else 1
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 {s} {f(2 * r)} 0a{f(r)} {f(r)} 0 1 {s} {f(-2 * r)} 0Z"


def hexa(cx, cy, r, rot=0):
    return [(cx + r * math.cos(math.radians(a + rot)), cy + r * math.sin(math.radians(a + rot))) for a in range(0, 360, 60)]


def arm(c, theta, w, y_end, up=True):
    t = math.radians(theta)
    sg = -1 if up else 1
    u = (math.cos(t), sg * math.sin(t))
    n = (math.sin(t), -sg * math.cos(t))
    pts = []
    for side in (-1, 1):
        q = (c[0] + n[0] * side * w / 2, c[1] + n[1] * side * w / 2)
        tt = (y_end - q[1]) / u[1]
        pts.append((q, (q[0] + u[0] * tt, y_end)))
    (q1, e1), (q2, e2) = pts
    return [q1, e1, e2, q2]


# ------------------------------------------------------------ SZIMBÓLUMOK (100×100 körül)
def sym_tools(c):
    """01 – A K egy villáskulcs-fejből: szár + fej (agy), a két pofa a K két szára, a torokban furat,
    a pofák között narancs csavaranya."""
    mid = f"m{next(c['ids'])}"
    C = (45, 50)
    white = (f'<path d="M14.5 8H26.5Q29 8 29 10.5V83.5A8.5 8.5 0 0 1 12 83.5V10.5Q12 8 14.5 8Z" fill="#fff"/>'
             f'<circle cx="{C[0] + 2}" cy="{C[1]}" r="21" fill="#fff"/>'
             f'<path d="{P(arm(C, 54, 16.5, 8, True))}" fill="#fff"/>'
             f'<path d="{P(arm(C, 54, 16.5, 92, False))}" fill="#fff"/>')
    black = f'<circle cx="{C[0] + 10}" cy="{C[1]}" r="6.8" fill="#000"/>'
    black += f'<path d="{P([(C[0] + 10, C[1] - 6.8), (100, C[1] - 36), (100, C[1] + 36), (C[0] + 10, C[1] + 6.8)])}" fill="#000"/>'
    g = (f'<defs><mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
         f'<rect width="100" height="100" fill="#000"/>{white}{black}</mask></defs>'
         f'<rect width="100" height="100" fill="{c["ink"]}" mask="url(#{mid})"/>')
    g += f'<path d="{P(hexa(72, 50, 8.6, 30))} {circ(72, 50, 3.4, rev=True)}" fill="{c["accent"]}" fill-rule="evenodd"/>'
    return g, (12, 8, 81, 92)


def sym_piston(c):
    """02 – Egyetlen dugattyú hajtókarral: narancs fejrész, gyűrűhornyok, csapszeg, hajtókar, nagyfej furattal."""
    ink, met, acc = c["ink"], c["metal"], c["accent"]
    g = ""
    # hajtókar (a dugattyú mögött indul)
    g += f'<path d="{P([(43.5, 46), (56.5, 46), (59.5, 74), (40.5, 74)])}" fill="{met}"/>'
    g += f'<path d="{circ(50, 80, 15)} {circ(50, 80, 6.6, rev=True)}" fill="{met}" fill-rule="evenodd"/>'
    # dugattyú
    x0, x1, top = 22, 78, 6
    g += f'<path d="M{x0} {top + 9}V{top + 3}Q{x0} {top} {x0 + 3} {top}H{x1 - 3}Q{x1} {top} {x1} {top + 3}V{top + 9}Z" fill="{acc}"/>'
    g += f'<rect x="{x0}" y="{top + 12}" width="{x1 - x0}" height="5" fill="{ink}"/>'
    skirt = f"M{x0} {top + 20}H{x1}V{top + 43}Q{x1} {top + 48} {x1 - 5} {top + 48}H{x0 + 5}Q{x0} {top + 48} {x0} {top + 43}Z"
    g += f'<path d="{skirt} {circ(50, top + 33, 6.4, rev=True)}" fill="{ink}" fill-rule="evenodd"/>'
    return g, (22, 6, 78, 95)


def sym_dial(c):
    """03 – Mérőóra: peremgyűrű, letisztult skála (12 jel, 4 fő), narancs mutató és agy, felül rögzítőszár, alul mérőcsap."""
    ink, met, acc = c["ink"], c["metal"], c["accent"]
    cx, cy = 50, 51
    g = f'<path d="{circ(cx, cy, 39)} {circ(cx, cy, 31.5, rev=True)}" fill="{ink}" fill-rule="evenodd"/>'
    g += f'<rect x="45.5" y="2" width="9" height="11" rx="1.5" fill="{ink}"/>'
    g += f'<rect x="47.6" y="89" width="4.8" height="10" rx="1.2" fill="{ink}"/>'
    for i in range(8):
        a = math.radians(-90 + i * 45)
        major = i % 2 == 0
        r0, r1 = 27, (19 if major else 22.5)
        w = 3.6 if major else 2.6
        g += (f'<line x1="{f(cx + r0 * math.cos(a))}" y1="{f(cy + r0 * math.sin(a))}" x2="{f(cx + r1 * math.cos(a))}" '
              f'y2="{f(cy + r1 * math.sin(a))}" stroke="{ink if major else met}" stroke-width="{w}" stroke-linecap="round"/>')
    a = math.radians(-50)
    tip = (cx + 23 * math.cos(a), cy + 23 * math.sin(a))
    tail = (cx - 7 * math.cos(a), cy - 7 * math.sin(a))
    nx, ny = -math.sin(a), math.cos(a)
    g += f'<path d="{P([(tail[0] + nx * 2.2, tail[1] + ny * 2.2), tip, (tail[0] - nx * 2.2, tail[1] - ny * 2.2)])}" fill="{acc}"/>'
    g += f'<circle cx="{cx}" cy="{cy}" r="6" fill="{acc}"/><circle cx="{cx}" cy="{cy}" r="1.9" fill="{ink}"/>'
    return g, (11, 2, 89, 99)


SYMS = {1: ("01-precision-tools", "PRECISION TOOLS", sym_tools),
        2: ("02-engineering", "ENGINEERING", sym_piston),
        3: ("03-technical-precision", "TECHNICAL PRECISION", sym_dial)}


# ------------------------------------------------------------ TIPOGRÁFIA
def wordmark(x, top, c, size=46, align="left", cx=None, sub_k=0.36, city_k=0.25):
    w1, wd1, tr1 = 720, 112, 0.035
    cap1 = cap_height("archivo", size, w1, wd1)
    s2, s3 = size * sub_k, size * city_k
    cap2 = cap_height("manrope", s2, 800)
    cap3 = cap_height("manrope", s3, 650)
    g1, g2 = size * 0.2, size * 0.17
    y1 = top + cap1
    y2 = y1 + g1 + cap2
    y3 = y2 + g2 + cap3
    def put(s, key, sz, wg, wdth, tr, y, col):
        d, b, _ = text(key, s, sz, wg, wdth, track=tr)
        w = b[2] - b[0]
        if align == "center":
            xx = cx - w / 2 - b[0]
        else:
            xx = x - b[0]
        d, b, _ = text(key, s, sz, wg, wdth, track=tr, x=xx, y=y)
        return f'<path d="{d}" fill="{col}"/>', b
    p1, b1 = put("KIRÁLY", "archivo", size, w1, wd1, tr1, y1, c["ink"])
    p2, b2 = put("AUTÓSZERVIZ", "manrope", s2, 800, None, 0.15, y2, c["sub"])
    if align == "center":
        p3, b3 = put("DUNAÚJVÁROS", "manrope", s3, 650, None, 0.24, y3, c["city"])
        dash = ""
    else:
        p3, b3 = put("DUNAÚJVÁROS", "manrope", s3, 650, None, 0.24, y3, c["city"])
        # rövid narancs vonás a város előtt
        dl = size * 0.2
        d3, bb3, _ = text("manrope", "DUNAÚJVÁROS", s3, 650, track=0.24)
        p3, b3 = put("DUNAÚJVÁROS", "manrope", s3, 650, None, 0.24, y3, c["city"])
        p3 = p3.replace(f'<path d="', f'<path transform="translate({f(dl + size * 0.12)} 0)" d="', 1)
        b3 = (b3[0], b3[1], b3[2] + dl + size * 0.12, b3[3])
        dash = f'<rect x="{f(b1[0])}" y="{f(y3 - cap3 / 2 - 1)}" width="{f(dl)}" height="2" fill="{c["accent"]}"/>'
    body = p1 + p2 + p3 + dash
    return body, (min(b1[0], b2[0], b3[0]), b1[1], max(b1[2], b2[2], b3[2]), b3[3]), cap1


def horizontal(n, c):
    sym, sb = SYMS[n][2](c)
    # a teljes szövegblokk magasságához méretezett jel
    body, tb, _ = wordmark(0, 0, c)
    th = tb[3] - tb[1]
    sh = sb[3] - sb[1]
    k = th * 1.18 / sh
    gx = th * 0.36
    sym_g = f'<g transform="translate(0 {f(-th * 0.09)}) scale({k:.5f}) translate({f(-sb[0])} {f(-sb[1])})">{sym}</g>'
    sw = (sb[2] - sb[0]) * k
    body, tb, _ = wordmark(sw + gx, 0, c)
    return sym_g + body, (0, -th * 0.09, tb[2], -th * 0.09 + sh * k)


def compact(n, c):
    """Négyzetes: jel felül, KIRÁLY + AUTÓSZERVIZ + DUNAÚJVÁROS középre zárva."""
    sym, sb = SYMS[n][2](c)
    S = 300
    sh = 130
    k = sh / (sb[3] - sb[1])
    sw = (sb[2] - sb[0]) * k
    body, tb, _ = wordmark(0, 0, c, size=58, align="center", cx=S / 2, sub_k=0.4, city_k=0.29)
    th = tb[3] - tb[1]
    gap = 22
    top = (S - sh - gap - th) / 2
    sym_g = f'<g transform="translate({f(S / 2 - sw / 2)} {f(top)}) scale({k:.5f}) translate({f(-sb[0])} {f(-sb[1])})">{sym}</g>'
    body, tb, _ = wordmark(0, top + sh + gap, c, size=58, align="center", cx=S / 2, sub_k=0.4, city_k=0.29)
    return sym_g + body, (0, 0, S, S)


def svg(body, bb, pad=0, bg=None, title="KIRÁLY Autószerviz – logóterv"):
    x0, y0, x1, y1 = bb
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    w, h = x1 - x0, y1 - y0
    r = f'<rect x="{f(x0)}" y="{f(y0)}" width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x0)} {f(y0)} {f(w)} {f(h)}" width="{f(w * 4)}" height="{f(h * 4)}">'
            f'<title>{title}</title>{r}{body}</svg>\n')


def mono(col):
    return dict(ink=col, sub=col, city=col, metal=col, accent=col)


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    for n, (slug, nev, fn) in SYMS.items():
        d = os.path.join(OUT, slug)
        os.makedirs(d)
        def w(name, s):
            open(os.path.join(d, name + ".svg"), "w").write(s)
        for tag, cols in (("vilagos-hatterre", VILAGOS_SZINEK), ("sotet-hatterre", SOTET_SZINEK)):
            c = dict(cols, ids=itertools.count(1))
            b, bb = horizontal(n, c)
            w(f"logo-{tag}", svg(b, bb, 8))
            s, sb = fn(dict(cols, ids=itertools.count(1)))
            w(f"jel-{tag}", svg(s, sb, 4))
            b, bb = compact(n, dict(cols, ids=itertools.count(1)))
            w(f"kompakt-{tag}", svg(b, bb))
        for tag, col in (("fekete", "#000000"), ("feher", "#FFFFFF")):
            b, bb = horizontal(n, dict(mono(col), ids=itertools.count(1)))
            w(f"logo-mono-{tag}", svg(b, bb, 8))
            s, sb = fn(dict(mono(col), ids=itertools.count(1)))
            w(f"jel-mono-{tag}", svg(s, sb, 4))


if __name__ == "__main__":
    main()
