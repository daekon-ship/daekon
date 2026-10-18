#!/usr/bin/env python3
"""Tündérszem Optika – rajzolt elemek (SVG) generálója.

Minden kép programból rajzolt vonalas illusztráció, nem fotó és nem stock.
Futtatás:  python3 _forras/rajzok.py   (a tunderszem-optika mappából)
Kimenet:   img/*.svg
"""
import math, os

OUT = os.path.join(os.path.dirname(__file__), "..", "img")
os.makedirs(OUT, exist_ok=True)

INK = "#263432"
PEARL = "#F7F1F7"
POWDER = "#E9C5D9"
ROSE = "#C98FB0"        # mélyebb púder a részletekhez
LAV = "#B8A3D8"
LAV_D = "#8F7DB8"
MIST = "#9CB9C6"
MIST_D = "#6F93A3"
LEAF = "#A9BFB4"        # zsályazöld levelek (a ködös kék és a grafit közt)
LEAF_D = "#7E9A8C"
WHITE = "#FFFFFF"


def svg(w, h, body, extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" fill="none" stroke-linecap="round" '
            f'stroke-linejoin="round"{extra}>\n{body}\n</svg>\n')


def save(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)


def f2(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


# ---------------------------------------------------------------- botanika
def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
            u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1])


def bez_tan(p0, p1, p2, p3, t):
    u = 1 - t
    dx = 3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0])
    dy = 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])
    return math.degrees(math.atan2(dy, dx))


def leaf(x, y, ang, length, width, fill, stroke=INK, sw=1.2):
    L, W = length, width
    return (f'<g transform="translate({f2(x)} {f2(y)}) rotate({f2(ang)})">'
            f'<path d="M0 0 C{f2(L*.3)} {f2(-W)} {f2(L*.75)} {f2(-W*.9)} {f2(L)} 0 '
            f'C{f2(L*.75)} {f2(W*.8)} {f2(L*.3)} {f2(W*.9)} 0 0Z" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>'
            f'<path d="M2 0 Q{f2(L*.5)} {f2(-W*.12)} {f2(L*.9)} 0" stroke="{stroke}" '
            f'stroke-width="{sw*.6}" opacity=".55"/></g>')


def sprig(name, w, h, stem, leaves, top=None):
    p0, p1, p2, p3 = stem
    out = [f'<path d="M{f2(p0[0])} {f2(p0[1])} C{f2(p1[0])} {f2(p1[1])} '
           f'{f2(p2[0])} {f2(p2[1])} {f2(p3[0])} {f2(p3[1])}" stroke="{INK}" stroke-width="1.6"/>']
    for i, (t, side, ln, wd, col) in enumerate(leaves):
        x, y = bez(p0, p1, p2, p3, t)
        a = bez_tan(p0, p1, p2, p3, t) + side * 48
        out.append(leaf(x, y, a, ln, wd, col))
    if top:
        out.append(top(p0, p1, p2, p3))
    save(name, svg(w, h, "\n".join(out)))


def lavender_top(p0, p1, p2, p3):
    g = []
    for i in range(16):
        t = 0.62 + i * 0.024
        x, y = bez(p0, p1, p2, p3, min(t, 1))
        a = bez_tan(p0, p1, p2, p3, min(t, 1))
        for s in (-1, 1):
            r = math.radians(a + s * 70)
            d = 7 - i * 0.2
            cx, cy = x + math.cos(r) * d, y + math.sin(r) * d
            g.append(f'<ellipse cx="{f2(cx)}" cy="{f2(cy)}" rx="{f2(6.4 - i*.16)}" ry="{f2(4.2 - i*.1)}" '
                     f'transform="rotate({f2(a + s*30)} {f2(cx)} {f2(cy)})" fill="{LAV}" '
                     f'stroke="{LAV_D}" stroke-width=".8"/>')
    return "\n".join(g)


def bloom_group(cx, cy, r, petals=6, fill=POWDER, rot=0, center=ROSE):
    g = [f'<g transform="translate({f2(cx)} {f2(cy)}) rotate({rot})">']
    for i in range(petals):
        a = 360 / petals * i
        g.append(f'<path transform="rotate({f2(a)})" d="M0 0 C{f2(r*.38)} {f2(-r*.32)} {f2(r*.42)} {f2(-r*.95)} 0 {f2(-r)} '
                 f'C{f2(-r*.42)} {f2(-r*.95)} {f2(-r*.38)} {f2(-r*.32)} 0 0Z" fill="{fill}" stroke="{INK}" stroke-width="1.1"/>')
        g.append(f'<path transform="rotate({f2(a)})" d="M0 {f2(-r*.25)} L0 {f2(-r*.7)}" stroke="{ROSE}" stroke-width=".8" opacity=".8"/>')
    g.append(f'<circle r="{f2(r*.2)}" fill="{center}" stroke="{INK}" stroke-width="1"/>')
    for i in range(7):
        a = math.radians(i * 51)
        g.append(f'<circle cx="{f2(math.cos(a)*r*.1)}" cy="{f2(math.sin(a)*r*.1)}" r="1" fill="{INK}"/>')
    g.append('</g>')
    return "\n".join(g)


def bloom_top(p0, p1, p2, p3):
    x, y = p3
    return bloom_group(x, y, 34, 6, POWDER, 12)


def bud_top(p0, p1, p2, p3):
    x, y = p3
    a = bez_tan(p0, p1, p2, p3, 1)
    return (f'<g transform="translate({f2(x)} {f2(y)}) rotate({f2(a+90)})">'
            f'<path d="M0 0 C9 -6 9 -20 0 -28 C-9 -20 -9 -6 0 0Z" fill="{MIST}" stroke="{INK}" stroke-width="1.1"/>'
            f'<path d="M0 -2 L0 -22" stroke="{MIST_D}" stroke-width=".8"/></g>')


sprig("ag-levendula.svg", 160, 420,
      ((80, 415), (70, 300), (100, 190), (84, 40)),
      [(0.1, 1, 62, 11, LEAF), (0.18, -1, 70, 12, LEAF), (0.28, 1, 60, 11, LEAF),
       (0.38, -1, 54, 10, LEAF), (0.48, 1, 46, 9, LEAF), (0.56, -1, 38, 8, LEAF)], lavender_top)

sprig("ag-eukaliptusz.svg", 340, 300,
      ((20, 285), (90, 200), (180, 120), (320, 40)),
      [(t, s, 58 - t*16, 27 - t*8, MIST if i % 2 else LEAF)
       for i, (t, s) in enumerate([(0.1, 1), (0.2, -1), (0.32, 1), (0.44, -1), (0.56, 1),
                                   (0.68, -1), (0.8, 1), (0.9, -1)])], bud_top)

sprig("ag-virag.svg", 200, 380,
      ((90, 375), (110, 280), (70, 170), (110, 70)),
      [(0.16, -1, 70, 16, LEAF), (0.3, 1, 76, 17, LEAF), (0.48, -1, 60, 14, LEAF),
       (0.64, 1, 48, 12, MIST)], bloom_top)

save("virag.svg", svg(120, 120, bloom_group(60, 60, 50, 6, POWDER, 8)))
save("virag-lila.svg", svg(120, 120, bloom_group(60, 60, 50, 5, LAV, 20, MIST)))


# ---------------------------------------------------------------- madár
def bird(fill=MIST, wing=MIST_D, ink=INK, sw=1.6):
    return f'''<g stroke="{ink}" stroke-width="{sw}">
<path d="M14 34 L40 50 L33 60 Z" fill="{wing}"/>
<path d="M28 56 C30 40 50 30 70 32 C78 26 88 24 94 28 C104 32 106 44 98 50 C92 66 72 74 52 72 C40 71 30 66 28 56Z" fill="{fill}"/>
<path d="M40 52 C50 42 68 44 76 53 C66 62 50 62 40 52Z" fill="{wing}"/>
<path d="M44 56 C52 52 60 53 66 57" stroke-width="{sw*.6}" opacity=".6"/>
<path d="M101 36 L113 40 L101 44" fill="{ROSE}"/>
<circle cx="92" cy="36" r="2.1" fill="{ink}" stroke="none"/>
<path d="M54 72 L52 82 M64 71 L65 82" />
</g>'''


save("madar.svg", svg(120, 90, bird()))


# ---------------------------------------------------------------- szemüvegkeretek
def cateye_lens():
    return ("M-95 -40 C-60 -62 40 -68 100 -62 C112 -60 118 -52 112 -36 "
            "C100 10 70 62 10 66 C-50 70 -96 40 -104 0 C-108 -20 -104 -34 -95 -40Z")


def lens_shape(kind):
    if kind == "cateye":
        return cateye_lens()
    if kind == "browline":
        return ("M-96 -46 L96 -46 C104 -46 106 -40 104 -30 C98 20 84 52 40 56 "
                "L-40 56 C-84 52 -98 20 -104 -30 C-106 -40 -104 -46 -96 -46Z")
    if kind == "kids":
        return ("M-88 -44 C-40 -64 40 -64 88 -44 C108 -34 110 0 96 26 "
                "C78 58 40 66 0 66 C-40 66 -78 58 -96 26 C-110 0 -108 -34 -88 -44Z")
    if kind == "round":
        return "M0 -64 A64 64 0 1 1 0 64 A64 64 0 1 1 0 -64Z"
    if kind == "geo":
        return "M-56 -56 L56 -56 L98 -8 L74 50 L-74 50 L-98 -8Z"
    raise ValueError(kind)


FRAMES = {
    # kind: (lens half-distance, frame color, stroke width, accent)
    "cateye": (124, INK, 9, ROSE),
    "browline": (122, INK, 3.4, None),
    "kids": (118, MIST_D, 10, None),
    "round": (86, "#A88762", 2.6, None),
    "geo": (124, LAV_D, 9, None),
}


def glasses(kind, lens_fill=True, dx=0):
    d, col, sw, acc = FRAMES[kind]
    lp = lens_shape(kind)
    g = []
    g.append('<defs><linearGradient id="lensTint" x1="0" y1="0" x2="1" y2="1">'
             f'<stop offset="0" stop-color="{WHITE}" stop-opacity=".55"/>'
             f'<stop offset="1" stop-color="{MIST}" stop-opacity=".28"/></linearGradient></defs>')
    for s in (-1, 1):
        tr = f'translate({d*s} 0) scale({s} 1)'
        if lens_fill:
            g.append(f'<path transform="{tr}" d="{lp}" fill="url(#lensTint)"/>')
            g.append(f'<path transform="{tr}" d="M-60 -30 L-20 -42 M-70 -10 L-40 -20" stroke="{WHITE}" stroke-width="5" opacity=".75"/>')
        g.append(f'<path transform="{tr}" d="{lp}" stroke="{col}" stroke-width="{sw}"/>')
        if kind == "browline":
            g.append(f'<path transform="{tr}" d="M-104 -30 C-106 -40 -104 -48 -96 -48 L96 -48 C104 -48 106 -40 104 -30 '
                     f'C100 -18 94 -16 84 -20 C40 -30 -40 -30 -84 -20 C-94 -16 -100 -18 -104 -30Z" fill="{INK}" stroke="{INK}" stroke-width="2"/>')
        if kind in ("cateye", "geo", "kids"):
            g.append(f'<path transform="{tr}" d="{lp}" stroke="{WHITE}" stroke-width="1.2" opacity=".35"/>')
    if kind == "round":
        g.append(f'<path d="M-24 -18 C-14 -34 14 -34 24 -18" stroke="{col}" stroke-width="{sw}"/>'
                 f'<path d="M-22 -10 C-12 -20 12 -20 22 -10" stroke="{col}" stroke-width="{sw*.8}"/>')
    elif kind == "browline":
        g.append(f'<path d="M-20 -40 C-10 -54 10 -54 20 -40" stroke="{INK}" stroke-width="7"/>')
    else:
        g.append(f'<path d="M-22 -36 C-12 -52 12 -52 22 -36" stroke="{col}" stroke-width="{sw}"/>')
    # temple stubs (perspective)
    ex = d + (66 if kind == "round" else 104)
    ty = -30 if kind in ("round",) else -48
    for s in (-1, 1):
        g.append(f'<path d="M{s*(ex-6)} {ty} L{s*(ex+22)} {ty-16}" stroke="{col}" stroke-width="{max(sw*.75,2.4)}"/>')
    if acc:
        for s in (-1, 1):
            g.append(f'<circle cx="{s*(d+104)}" cy="-52" r="4" fill="{acc}" stroke="{INK}" stroke-width="1.2"/>')
    return f'<g transform="translate({dx} 0)">' + "\n".join(g) + '</g>'


for kind, fname in [("cateye", "keret-noi"), ("browline", "keret-ferfi"), ("kids", "keret-gyermek"),
                    ("round", "keret-klasszikus"), ("geo", "keret-modern")]:
    save(fname + ".svg", svg(560, 200, f'<g transform="translate(280 100)">{glasses(kind)}</g>'))


# ---------------------------------------------------------------- szolgáltatás-táblák
def plate(name, body, w=320, h=220):
    save(name, svg(w, h, body))


plate("szolg-vizsgalat.svg", f'''
<rect x="150" y="26" width="128" height="168" rx="4" fill="{WHITE}" stroke="{INK}" stroke-width="1.4"/>
<g fill="{INK}" font-family="Georgia, serif" text-anchor="middle">
<text x="214" y="78" font-size="38">T</text>
<text x="214" y="110" font-size="24" letter-spacing="6">Ü N</text>
<text x="214" y="134" font-size="16" letter-spacing="5">D É R</text>
<text x="214" y="152" font-size="11" letter-spacing="4">S Z E M</text>
<text x="214" y="167" font-size="7" letter-spacing="3">O P T I K A</text></g>
<path d="M164 178 H264" stroke="{ROSE}" stroke-width="1.2"/>
<path d="M22 112 C52 70 102 70 132 112 C102 154 52 154 22 112Z" fill="{PEARL}" stroke="{INK}" stroke-width="1.6"/>
<circle cx="77" cy="112" r="24" fill="{MIST}" stroke="{INK}" stroke-width="1.4"/>
<circle cx="77" cy="112" r="10" fill="{INK}"/>
<circle cx="70" cy="105" r="4" fill="{WHITE}"/>
<path d="M30 92 L22 82 M48 80 L44 68 M70 76 L70 63 M92 78 L96 66 M114 88 L122 78" stroke="{INK}" stroke-width="1.2"/>
''')

plate("szolg-keszites.svg", f'''
<circle cx="120" cy="110" r="84" fill="{PEARL}" stroke="{INK}" stroke-width="1.4"/>
<circle cx="120" cy="110" r="84" stroke="{MIST}" stroke-width="6" opacity=".35"/>
<path transform="translate(120 112) scale(.62)" d="{cateye_lens()}" fill="{WHITE}" stroke="{INK}" stroke-width="2.4" stroke-dasharray="7 6"/>
<path d="M120 20 V40 M120 180 V200 M30 110 H50 M190 110 H210" stroke="{ROSE}" stroke-width="1.2"/>
<circle cx="120" cy="110" r="3" fill="{ROSE}"/>
<path d="M228 52 L292 52 M228 52 L228 168 M228 168 L292 168" stroke="{INK}" stroke-width="1.4"/>
<path d="M248 52 V36 M272 52 V36" stroke="{INK}" stroke-width="1.4"/>
<path d="M240 82 H284 M240 98 H276 M240 114 H284 M240 130 H268" stroke="{LAV_D}" stroke-width="1.2" opacity=".8"/>
''')

plate("szolg-keretek.svg", f'''
<g transform="translate(170 62) scale(.46)">{glasses("geo")}</g>
<g transform="translate(150 112) scale(.48)">{glasses("round")}</g>
<g transform="translate(166 166) scale(.46)">{glasses("cateye")}</g>
''')

plate("szolg-javitas.svg", f'''
<path d="M30 70 C60 56 110 54 150 62 C160 64 166 74 162 88 L154 112" stroke="{INK}" stroke-width="9"/>
<rect x="148" y="66" width="34" height="22" rx="3" fill="{POWDER}" stroke="{INK}" stroke-width="1.4"/>
<path d="M182 76 L292 112" stroke="{INK}" stroke-width="7"/>
<path d="M290 111 C300 116 302 128 292 134" stroke="{INK}" stroke-width="7"/>
<circle cx="165" cy="77" r="5" fill="{WHITE}" stroke="{INK}" stroke-width="1.4"/>
<path d="M162 77 H168" stroke="{INK}" stroke-width="1.2"/>
<g transform="translate(166 82) rotate(48)">
<path d="M0 10 V58" stroke="{INK}" stroke-width="2.6"/>
<rect x="-7" y="58" width="14" height="70" rx="7" fill="{LAV}" stroke="{INK}" stroke-width="1.4"/>
<path d="M-2 70 V118 M2 70 V118" stroke="{INK}" stroke-width=".8" opacity=".5"/></g>
<path d="M40 150 C80 146 100 170 140 170" stroke="{ROSE}" stroke-width="1.2" stroke-dasharray="3 5"/>
''')

plate("szolg-kontakt.svg", f'''
<path d="M70 92 C96 52 168 52 194 92" stroke="{INK}" stroke-width="1.8" fill="{MIST}" fill-opacity=".35"/>
<path d="M78 92 C104 62 160 62 186 92" stroke="{WHITE}" stroke-width="3" opacity=".8"/>
<path d="M70 92 C100 98 164 98 194 92" stroke="{INK}" stroke-width="1.2" opacity=".5"/>
<path d="M232 40 C232 40 250 66 250 78 A18 18 0 0 1 214 78 C214 66 232 40 232 40Z" fill="{WHITE}" stroke="{INK}" stroke-width="1.4"/>
<path d="M226 74 C226 80 230 84 236 84" stroke="{MIST_D}" stroke-width="1.2"/>
<rect x="56" y="132" width="208" height="54" rx="27" fill="{PEARL}" stroke="{INK}" stroke-width="1.4"/>
<circle cx="104" cy="159" r="21" fill="{WHITE}" stroke="{INK}" stroke-width="1.4"/>
<circle cx="216" cy="159" r="21" fill="{WHITE}" stroke="{INK}" stroke-width="1.4"/>
<g fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="600" text-anchor="middle">
<text x="104" y="164">L</text><text x="216" y="164">R</text></g>
''')

plate("szolg-lencsek.svg", f'''
<defs><linearGradient id="zones" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="{MIST}" stop-opacity=".45"/><stop offset=".55" stop-color="{LAV}" stop-opacity=".35"/>
<stop offset="1" stop-color="{POWDER}" stop-opacity=".6"/></linearGradient></defs>
<path transform="translate(118 112) scale(.9)" d="{cateye_lens()}" fill="url(#zones)" stroke="{INK}" stroke-width="1.8"/>
<path d="M44 92 C80 100 156 100 196 88" stroke="{INK}" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>
<path d="M60 128 C90 136 146 136 176 124" stroke="{INK}" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>
<g fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="11" letter-spacing="1.5">
<text x="230" y="76">TÁVOL</text><text x="230" y="114">KÖZTES</text><text x="230" y="152">KÖZEL</text></g>
<path d="M190 72 H224 M196 110 H224 M168 148 H224" stroke="{ROSE}" stroke-width="1"/>
''')


# ---------------------------------------------------------------- történet: próbakeret
def trial_frame():
    g = []
    for cx in (110, 290):
        g.append(f'<circle cx="{cx}" cy="150" r="78" fill="{PEARL}" stroke="{INK}" stroke-width="2"/>')
        g.append(f'<circle cx="{cx}" cy="150" r="60" fill="{MIST}" fill-opacity=".22" stroke="{INK}" stroke-width="1.4"/>')
        for i in range(0, 180, 10):
            a = math.radians(180 + i)
            r1, r2 = 70, (78 if i % 30 == 0 else 74)
            g.append(f'<path d="M{f2(cx+math.cos(a)*r1)} {f2(150+math.sin(a)*r1)} L{f2(cx+math.cos(a)*r2)} {f2(150+math.sin(a)*r2)}" stroke="{INK}" stroke-width="1"/>')
        for k, r in enumerate((44, 30)):
            g.append(f'<circle cx="{cx}" cy="150" r="{r}" stroke="{[LAV_D, ROSE][k]}" stroke-width="1" opacity=".7"/>')
        g.append(f'<path d="M{cx-50} 150 H{cx+50}" stroke="{INK}" stroke-width="1" opacity=".4"/>')
        g.append(f'<circle cx="{cx}" cy="58" r="9" fill="{POWDER}" stroke="{INK}" stroke-width="1.4"/>')
    g.append(f'<path d="M188 128 C196 104 204 104 212 128" stroke="{INK}" stroke-width="3"/>')
    g.append(f'<path d="M184 186 C194 200 206 200 216 186" stroke="{INK}" stroke-width="1.6"/>')
    g.append(f'<path d="M32 140 L6 120 M368 140 L394 120" stroke="{INK}" stroke-width="3"/>')
    g.append(f'<path d="M200 40 V96" stroke="{INK}" stroke-width="1.4"/><circle cx="200" cy="34" r="7" fill="{LAV}" stroke="{INK}" stroke-width="1.4"/>')
    g.append(f'<g fill="{INK}" font-family="Helvetica, Arial, sans-serif" font-size="9" text-anchor="middle">'
             f'<text x="110" y="248">0  ·  90  ·  180</text><text x="290" y="248">0  ·  90  ·  180</text></g>')
    return "\n".join(g)


save("probakeret.svg", svg(400, 270, trial_frame()))


# ---------------------------------------------------------------- városkép a csúszkához
def town():
    W, H = 1200, 640
    g = [f'''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#E4EEF2"/><stop offset=".7" stop-color="{PEARL}"/></linearGradient>
<linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#D9D6DE"/><stop offset="1" stop-color="#C7C3CE"/></linearGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>''']
    # felhők
    for (x, y, s) in [(140, 190, .9), (1010, 175, .7)]:
        g.append(f'<g transform="translate({x} {y}) scale({s})" fill="{WHITE}" stroke="{INK}" stroke-width="1" opacity=".9">'
                 '<path d="M0 30 C0 14 18 6 30 14 C36 -2 66 -4 72 14 C88 8 104 18 100 30Z"/></g>')
    # távoli fasor
    tl = "M0 380 " + " ".join(f"Q{x+30} {350 + (x*7) % 22} {x+60} 380" for x in range(0, 1200, 60)) + " V420 H0Z"
    g.append(f'<path d="{tl}" fill="{LEAF}" stroke="{INK}" stroke-width="1" opacity=".7"/>')
    # templom
    g.append(f'''<g stroke="{INK}" stroke-width="1.6">
<rect x="236" y="250" width="74" height="170" fill="{WHITE}"/>
<path d="M236 250 L273 196 L310 250Z" fill="{MIST}"/>
<path d="M273 196 L273 120" /><path d="M262 140 H284" /><path d="M273 120 L273 104"/>
<path d="M266 104 H280 M273 96 V112" stroke-width="2"/>
<circle cx="273" cy="232" r="10" fill="{PEARL}"/><path d="M273 232 V225 M273 232 L278 235" stroke-width="1.2"/>
<path d="M262 300 C262 284 284 284 284 300 V330 H262Z" fill="{LAV}" fill-opacity=".5"/>
<rect x="310" y="320" width="140" height="100" fill="{WHITE}"/>
<path d="M300 320 L380 282 L460 320Z" fill="{MIST}"/>
<path d="M332 350 C332 340 346 340 346 350 V380 H332Z M372 350 C372 340 386 340 386 350 V380 H372Z M412 350 C412 340 426 340 426 350 V380 H412Z" fill="{LAV}" fill-opacity=".5"/>
</g>''')
    # házsor
    houses = [(0, 150, POWDER, 300), (470, 170, "#F1E3C8", 300), (650, 260, WHITE, 280),
              (920, 150, "#DCE7E4", 310), (1075, 140, POWDER, 300)]
    for (x, w, col, top) in houses:
        roof_h = 70
        g.append(f'<g stroke="{INK}" stroke-width="1.6">'
                 f'<rect x="{x}" y="{top+roof_h}" width="{w}" height="{470-top-roof_h}" fill="{col}"/>'
                 f'<path d="M{x-8} {top+roof_h} L{x+w/2} {top} L{x+w+8} {top+roof_h}Z" fill="#C59A8C" fill-opacity=".75"/>'
                 '</g>')
        n = max(1, int(w // 75))
        for i in range(n):
            wx = x + (w / n) * i + (w / n) / 2 - 18
            g.append(f'<g stroke="{INK}" stroke-width="1.3"><rect x="{f2(wx)}" y="{top+roof_h+40}" width="36" height="50" fill="{MIST}" fill-opacity=".45"/>'
                     f'<path d="M{f2(wx+18)} {top+roof_h+40} V{top+roof_h+90} M{f2(wx)} {top+roof_h+62} H{f2(wx+36)}"/></g>')
    # az üzlet (középen) – napellenző + cégtábla
    g.append(f'''<g stroke="{INK}" stroke-width="1.6">
<rect x="664" y="300" width="232" height="44" fill="{WHITE}"/>
<path d="M650 356 L910 356 L896 396 L664 396Z" fill="{LAV}"/>
<path d="M690 356 L682 396 M730 356 L726 396 M770 356 L770 396 M810 356 L814 396 M850 356 L858 396" stroke-width="1.1"/>
<rect x="680" y="404" width="96" height="66" fill="{MIST}" fill-opacity=".35"/>
<rect x="796" y="404" width="64" height="66" fill="{POWDER}"/>
<circle cx="848" cy="440" r="2.5" fill="{INK}"/>
</g>
<g fill="{INK}" text-anchor="middle">
<text x="780" y="322" font-family="Georgia, serif" font-style="italic" font-size="21">Tündérszem</text>
<text x="780" y="338" font-family="Helvetica, Arial, sans-serif" font-size="9" letter-spacing="4">OPTIKA</text></g>
<g transform="translate(728 446) scale(.22)" stroke="{INK}" stroke-width="7" fill="none">
<path d="{cateye_lens()}" transform="translate(-124 0) scale(-1 1)"/><path d="{cateye_lens()}" transform="translate(124 0)"/>
<path d="M-22 -36 C-12 -52 12 -52 22 -36"/></g>''')
    # járda és út
    g.append(f'<rect x="0" y="470" width="{W}" height="26" fill="#ECE6EE" stroke="{INK}" stroke-width="1.4"/>')
    g.append(f'<rect x="0" y="496" width="{W}" height="{H-496}" fill="url(#road)"/>')
    for x in range(30, W, 150):
        g.append(f'<rect x="{x}" y="566" width="80" height="8" rx="4" fill="{WHITE}" opacity=".9"/>')
    # fák
    for (x, s) in [(130, 1), (585, .9), (1010, 1.05)]:
        g.append(f'<g transform="translate({x} 470) scale({s})" stroke="{INK}" stroke-width="1.5">'
                 f'<path d="M0 0 V-90" stroke-width="5"/>'
                 f'<circle cx="0" cy="-130" r="58" fill="{LEAF}"/><circle cx="-34" cy="-104" r="34" fill="{LEAF_D}" fill-opacity=".6"/>'
                 f'<circle cx="30" cy="-150" r="30" fill="{LEAF}" /></g>')
    # utcanévtábla
    g.append(f'''<g stroke="{INK}" stroke-width="1.6">
<path d="M560 478 V330" stroke-width="4"/>
<rect x="476" y="300" width="168" height="34" rx="3" fill="#2F5D8A"/>
<rect x="481" y="305" width="158" height="24" rx="2" stroke="{WHITE}" stroke-width="1.2"/></g>
<text x="560" y="322" fill="{WHITE}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="600" letter-spacing=".5">Damjanich út</text>''')
    # pad, kerékpár egyszerűen
    g.append(f'''<g stroke="{INK}" stroke-width="1.6">
<path d="M380 452 H460 M384 440 H456 M392 452 V470 M448 452 V470" stroke-width="3"/></g>''')
    # madár a vezetéken
    g.append(f'<path d="M0 170 Q600 230 1200 160" stroke="{INK}" stroke-width="1" opacity=".55"/>')
    g.append(f'<g transform="translate(905 155) scale(.42)">{bird()}</g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 84 {W} 556" width="{W}" height="556" fill="none" '
            f'stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid slice">\n' + "\n".join(g) + '\n</svg>\n')


save("varoskep.svg", town())


# ---------------------------------------------------------------- portál (fotóhely helyén)
save("portal.svg", svg(400, 300, f'''
<rect width="400" height="300" fill="{PEARL}"/>
<g stroke="{INK}" stroke-width="1.6">
<rect x="40" y="70" width="320" height="200" fill="{WHITE}"/>
<path d="M30 110 L370 110 L356 148 L44 148Z" fill="{LAV}"/>
<path d="M80 110 L74 148 M130 110 L126 148 M180 110 L178 148 M220 110 L222 148 M270 110 L274 148 M320 110 L326 148" stroke-width="1.1"/>
<rect x="64" y="166" width="170" height="104" fill="{MIST}" fill-opacity=".3"/>
<rect x="256" y="166" width="80" height="104" fill="{POWDER}"/>
<path d="M64 218 H234" stroke-width="1.1"/></g>
<g transform="translate(112 200) scale(.2)" stroke="{INK}" stroke-width="8">
<path d="{cateye_lens()}" transform="translate(-124 0) scale(-1 1)"/><path d="{cateye_lens()}" transform="translate(124 0)"/></g>
<g transform="translate(186 200) scale(.2)" stroke="{LAV_D}" stroke-width="8">
<path d="{lens_shape("round")}" transform="translate(-86 0)"/><path d="{lens_shape("round")}" transform="translate(86 0)"/></g>
<g fill="{INK}" text-anchor="middle"><text x="200" y="96" font-family="Georgia, serif" font-style="italic" font-size="22">Tündérszem</text></g>
'''))

print("kész:", sorted(os.listdir(OUT)))
