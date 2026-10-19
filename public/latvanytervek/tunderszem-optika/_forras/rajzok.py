#!/usr/bin/env python3
"""Tündérszem Optika – rajzolt elemek (SVG), 2. kör: „prémium” stílus.

- Szemüvegkeretek: renderelt hatású acetát / fém keretek (színátmenet, csúcsfény,
  belső él, lencse-tükröződés, rozéarany szegecsek).
- Botanika, madár, utcakép, szolgáltatás-táblák: rézmetszet-stílusú vonalrajz
  (körvonal + vonalkázás), színfolt csak nagyon halványan.
Minden kép programból rajzolt, nem fotó és nem stock.

Futtatás (a tunderszem-optika mappából):  python3 _forras/rajzok.py
"""
import math, os, random, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import tunder

OUT = os.path.join(os.path.dirname(__file__), "..", "img")
os.makedirs(OUT, exist_ok=True)

INK = "#263432"
PAPER = "#FAF6FA"
PEARL = "#F7F1F7"
POWDER = "#E9C5D9"
LAV = "#B8A3D8"
LAV_D = "#6C5A97"
MIST = "#9CB9C6"
MIST_D = "#46707F"
GOLD_L = "#F0DCC8"
GOLD = "#B8937A"
GOLD_D = "#8C6B58"


def f(x):
    s = f"{x:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def svg(vb, body, w=None, h=None, extra=""):
    x, y, W, H = vb
    w = w or W
    h = h or H
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(W)} {f(H)}" width="{f(w)}" '
            f'height="{f(h)}" fill="none" stroke-linecap="round" stroke-linejoin="round"{extra}>\n{body}\n</svg>\n')


def save(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)


def scale_d(d, sx, sy, ox=0.0, oy=0.0):
    """Abszolút M/C/L/Z útvonal koordinátáinak skálázása (+eltolás)."""
    toks = re.findall(r"[MCLZ]|-?\d+(?:\.\d+)?", d)
    out, nums = [], []
    for t in toks:
        if t in "MCLZ":
            out.append(t)
        else:
            nums.append(float(t))
            if len(nums) == 2:
                out.append(f"{f(nums[0]*sx+ox)} {f(nums[1]*sy+oy)}")
                nums = []
    return " ".join(out)


# =====================================================================
# SZEMÜVEGKERETEK – renderelt hatás
# =====================================================================
def circle_d(r):
    k = 0.5523 * r
    return (f"M0 {f(-r)} C{f(k)} {f(-r)} {f(r)} {f(-k)} {f(r)} 0 C{f(r)} {f(k)} {f(k)} {f(r)} 0 {f(r)} "
            f"C{f(-k)} {f(r)} {f(-r)} {f(k)} {f(-r)} 0 C{f(-r)} {f(-k)} {f(-k)} {f(-r)} 0 {f(-r)}Z")


LENS = {
    "cateye": "M-95 -40 C-60 -62 40 -68 100 -62 C112 -60 118 -52 112 -36 C100 10 70 62 10 66 C-50 70 -96 40 -104 0 C-108 -20 -104 -34 -95 -40Z",
    "browline": "M-96 -46 L96 -46 C104 -46 106 -40 104 -30 C98 20 84 52 40 56 L-40 56 C-84 52 -98 20 -104 -30 C-106 -40 -104 -46 -96 -46Z",
    "kids": "M-88 -44 C-40 -64 40 -64 88 -44 C108 -34 110 0 96 26 C78 58 40 66 0 66 C-40 66 -78 58 -96 26 C-110 0 -108 -34 -88 -44Z",
    "round": circle_d(62),
    "geo": "M-56 -56 L56 -56 L98 -8 L74 50 L-74 50 L-98 -8Z",
}

# kind: dist, outer scale (sx, sy, oy), hinge (local), bridge path, material, rim type
FRAME = {
    "cateye": dict(d=124, outer=(1.11, 1.2, -3, 6), hinge=(128, -64),
                   bridge="M-20 -52 C-8 -59 8 -59 20 -52 L20 -37 C8 -44 -8 -44 -20 -37Z"),
    "browline": dict(d=122, outer=(1.035, 1.05, 0, 0), hinge=(110, -44),
                     bridge="M-28 -50 C-12 -62 12 -62 28 -50 L28 -38 C12 -49 -12 -49 -28 -38Z"),
    "kids": dict(d=122, outer=(1.08, 1.17, -2, 4), hinge=(112, -40),
                 bridge="M-16 -44 C-6 -53 6 -53 16 -44 L16 -30 C6 -38 -6 -38 -16 -30Z"),
    "round": dict(d=86, outer=(1.06, 1.06, 0, 0), hinge=(66, -8),
                  bridge=None),
    "geo": dict(d=124, outer=(1.12, 1.18, -2, 4), hinge=(108, -14),
                bridge="M-24 -40 C-12 -50 12 -50 24 -40 L24 -27 C12 -36 -12 -36 -24 -27Z"),
}

MATERIAL = {
    # (stops of the acetate gradient, top→bottom), rim edge colour
    "smoke": ([(0, "#25302E", 1), (.42, "#45405C", .97), (.78, "#8C79B5", .86), (1, "#CDBBE3", .78)], "#1B2322"),
    "graphite": ([(0, "#3E4946", 1), (.5, "#283230", 1), (1, "#1B2322", 1)], "#111816"),
    "mist": ([(0, "#4F7584", .97), (.6, "#86A9B8", .86), (1, "#C4D8E0", .78)], "#36525D"),
    "powder": ([(0, "#8E4F6E", .96), (.55, "#C98FB0", .86), (1, "#EDCFDF", .78)], "#6E3D55"),
    "gold": ([(0, "#F4E4D2", 1), (.3, "#C9A587", 1), (.55, "#F2DECA", 1), (.8, "#A9856C", 1), (1, "#E6CDB4", 1)], "#7D5F4E"),
}


def defs_common(u, mat):
    stops, edge = MATERIAL[mat]
    s = "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return f'''<linearGradient id="{u}ac" x1="0" y1="0" x2="0" y2="1">{s}</linearGradient>
<linearGradient id="{u}acd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{edge}"/><stop offset="1" stop-color="{edge}" stop-opacity=".55"/></linearGradient>
<linearGradient id="{u}spec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".22" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="{u}lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#9CB9C6" stop-opacity=".06"/><stop offset="1" stop-color="#B8A3D8" stop-opacity=".16"/></linearGradient>
<linearGradient id="{u}refl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="{u}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{GOLD_L}"/><stop offset=".45" stop-color="{GOLD}"/><stop offset=".7" stop-color="#F6E6D6"/><stop offset="1" stop-color="{GOLD_D}"/></linearGradient>'''


def frame_body(kind, mat, u, show_lens=True):
    cfg = FRAME[kind]
    d = cfg["d"]
    lens = LENS[kind]
    sx, sy, oy, ox = cfg["outer"]
    outer = scale_d(lens, sx, sy, ox, oy)
    inner_hi = scale_d(lens, 1.012, 1.02, 0, -0.6)
    hx, hy = cfg["hinge"]
    edge = MATERIAL[mat][1]
    metal = kind in ("round",)
    g = []
    # szárak (perspektivikusan hátrafelé)
    for s in (-1, 1):
        g.append(f'<path transform="scale({s} 1)" d="M{f(d+hx-4)} {f(hy-6)} L{f(d+hx+34)} {f(hy-27)} '
                 f'L{f(d+hx+36)} {f(hy-21)} L{f(d+hx-2)} {f(hy+6)}Z" fill="url(#{u}acd)"/>')
    for s in (-1, 1):
        g.append(f'<g transform="scale({s} 1) translate({d} 0)">')
        g.append(f'<clipPath id="{u}lc{s+1}"><path d="{lens}"/></clipPath>')
        if show_lens:
            g.append(f'<path d="{lens}" fill="url(#{u}lens)"/>')
            g.append(f'<g clip-path="url(#{u}lc{s+1})"><path d="M-70 -90 L-30 -90 L40 90 L0 90Z" fill="url(#{u}refl)" opacity=".55"/>'
                     f'<path d="M-6 -90 L6 -90 L76 90 L64 90Z" fill="url(#{u}refl)" opacity=".35"/></g>')
        if metal:
            g.append(f'<path d="{outer} {lens}" fill-rule="evenodd" fill="url(#{u}ac)"/>')
            g.append(f'<path d="{outer}" stroke="{edge}" stroke-width=".6" opacity=".7"/>')
            g.append(f'<path d="{lens}" stroke="{edge}" stroke-width=".6" opacity=".7"/>')
        else:
            g.append(f'<path d="{outer} {lens}" fill-rule="evenodd" fill="url(#{u}ac)"/>')
            g.append(f'<path d="{outer}" stroke="{edge}" stroke-width=".9" opacity=".55"/>')
            g.append(f'<path d="{lens}" stroke="{edge}" stroke-width="1" opacity=".6"/>')
            g.append(f'<path d="{inner_hi}" stroke="#fff" stroke-width="1.1" opacity=".38"/>')
            g.append(f'<path d="{scale_d(lens, (1+sx)/2, (1+sy)/2, ox/2, oy/2-0.6)}" stroke="url(#{u}spec)" stroke-width="1.5" opacity=".75"/>')
        g.append('</g>')
    # híd
    if kind == "round":
        g.append(f'<path d="M-24 -20 C-14 -36 14 -36 24 -20" stroke="url(#{u}ac)" stroke-width="3.2"/>')
        g.append(f'<path d="M-23 -11 C-12 -20 12 -20 23 -11" stroke="url(#{u}ac)" stroke-width="2.2"/>')
    else:
        g.append(f'<path d="{cfg["bridge"]}" fill="url(#{u}ac)" stroke="{edge}" stroke-width=".8" stroke-opacity=".5"/>')
        g.append(f'<path d="{scale_d(cfg["bridge"].split("L")[0], 1, 1, 0, 1.2)}" stroke="#fff" stroke-width="1.2" opacity=".5"/>')
    if kind == "browline":
        # fém alsó perem: arany vonal az acetát szemöldök alatt
        for s in (-1, 1):
            g.append(f'<g transform="scale({s} 1) translate({d} 0)"><path d="{scale_d(LENS["browline"], 1.02, 1.03)}" '
                     f'stroke="url(#{u}gold)" stroke-width="2.4"/>'
                     f'<path d="M-104 -30 C-106 -40 -104 -50 -96 -50 L96 -50 C104 -50 107 -40 104 -30 C100 -16 92 -14 82 -19 '
                     f'C40 -28 -40 -28 -82 -19 C-92 -14 -100 -16 -104 -30Z" fill="url(#{u}ac)" stroke="{edge}" stroke-width=".8"/>'
                     f'<path d="M-98 -44 C-60 -47 60 -47 98 -44" stroke="#fff" stroke-width="1.6" opacity=".35"/></g>')
    if kind in ("round", "browline"):
        for s in (-1, 1):
            g.append(f'<ellipse cx="{s*28}" cy="14" rx="3.4" ry="6" fill="#fff" fill-opacity=".25" stroke="url(#{u}gold)" stroke-width=".7" opacity=".8"/>')
    # zsanér + szegecsek (rozéarany)
    for s in (-1, 1):
        g.append(f'<g transform="scale({s} 1)">'
                 f'<rect x="{f(d+hx-2)}" y="{f(hy-6)}" width="12" height="11" rx="2" fill="url(#{u}gold)" transform="rotate(-24 {f(d+hx)} {f(hy)})"/>')
        if kind in ("cateye", "kids", "geo"):
            rx = d + hx - 22
            for i, (ax, ay) in enumerate(((rx - 8, hy + 3), (rx + 2, hy + 1))):
                g.append(f'<circle cx="{f(ax)}" cy="{f(ay)}" r="2.6" fill="url(#{u}gold)" stroke="{GOLD_D}" stroke-width=".5"/>'
                         f'<circle cx="{f(ax-.8)}" cy="{f(ay-.9)}" r=".8" fill="#fff" opacity=".85"/>')
        g.append('</g>')
    return "\n".join(g)


def frame_file(name, kind, mat, shadow=True):
    u = name.split(".")[0].replace("-", "")
    body = [f'<defs>{defs_common(u, mat)}<filter id="{u}sh" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="9"/></filter></defs>']
    if shadow:
        body.append(f'<ellipse cx="0" cy="118" rx="230" ry="11" fill="#263432" opacity=".16" filter="url(#{u}sh)"/>')
    body.append(frame_body(kind, mat, u))
    save(name, svg((-300, -110, 600, 250), "\n".join(body)))


frame_file("keret-noi.svg", "cateye", "smoke")
frame_file("keret-ferfi.svg", "browline", "graphite")
frame_file("keret-gyermek.svg", "kids", "mist")
frame_file("keret-klasszikus.svg", "round", "gold")
frame_file("keret-modern.svg", "geo", "powder")
# hero: ugyanaz a koordinátarendszer, mint az oldalon lévő vágómaszk (lencsék ±124-nél)
u = "hk"
save("hero-keret.svg", svg((-300, -160, 600, 320), f'<defs>{defs_common(u, "smoke")}</defs>\n' + frame_body("cateye", "smoke", u)))


# =====================================================================
# RÉZMETSZET-BOTANIKA
# =====================================================================
SW = 0.9


def bez(p, t):
    p0, p1, p2, p3 = p
    u_ = 1 - t
    return (u_**3*p0[0] + 3*u_*u_*t*p1[0] + 3*u_*t*t*p2[0] + t**3*p3[0],
            u_**3*p0[1] + 3*u_*u_*t*p1[1] + 3*u_*t*t*p2[1] + t**3*p3[1])


def bez_ang(p, t):
    a = bez(p, max(0, t - .01)); b = bez(p, min(1, t + .01))
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def leaf(x, y, ang, L, W, fill=PAPER, hatch=True):
    out = [f'<g transform="translate({f(x)} {f(y)}) rotate({f(ang)})">',
           f'<path d="M0 0 C{f(L*.25)} {f(-W*1.05)} {f(L*.7)} {f(-W*.95)} {f(L)} 0 C{f(L*.7)} {f(W*.95)} {f(L*.25)} {f(W*1.05)} 0 0Z" '
           f'fill="{fill}" stroke="{INK}" stroke-width="{SW}"/>',
           f'<path d="M1 0 Q{f(L*.5)} {f(-W*.05)} {f(L*.95)} 0" stroke="{INK}" stroke-width=".6"/>']
    if hatch:
        t = .12
        while t < .86:
            t2 = t + .07
            w2 = W * .9 * math.sin(math.pi * t2) ** .9
            out.append(f'<path d="M{f(t*L)} .6 L{f(t2*L)} {f(w2*.9)}" stroke="{INK}" stroke-width=".45" opacity=".85"/>')
            t += .05
        for t in (.22, .42, .62):
            w2 = W * .8 * math.sin(math.pi * (t + .14)) ** .9
            out.append(f'<path d="M{f(t*L)} -.4 Q{f((t+.08)*L)} {f(-w2*.5)} {f((t+.14)*L)} {f(-w2*.85)}" stroke="{INK}" stroke-width=".4" opacity=".6"/>')
    out.append('</g>')
    return "".join(out)


def stem(p, sw=1.0):
    p0, p1, p2, p3 = p
    d = f"M{f(p0[0])} {f(p0[1])} C{f(p1[0])} {f(p1[1])} {f(p2[0])} {f(p2[1])} {f(p3[0])} {f(p3[1])}"
    return (f'<path d="{d}" stroke="{INK}" stroke-width="{sw}"/>'
            f'<path d="{d}" stroke="{INK}" stroke-width=".4" transform="translate(1.6 .6)" opacity=".6"/>')


def cosmos(cx, cy, r, rot=0, petals=8, seed=1):
    rnd = random.Random(seed)
    g = [f'<g transform="translate({f(cx)} {f(cy)}) rotate({rot})">']
    pd = (f"M0 {f(-r*.18)} C{f(r*.3)} {f(-r*.35)} {f(r*.34)} {f(-r*.85)} {f(r*.17)} {f(-r)} L{f(r*.06)} {f(-r*.93)} "
          f"L0 {f(-r*.99)} L{f(-r*.06)} {f(-r*.93)} L{f(-r*.17)} {f(-r)} C{f(-r*.34)} {f(-r*.85)} {f(-r*.3)} {f(-r*.35)} 0 {f(-r*.18)}Z")
    for i in range(petals):
        a = 360 / petals * i + rnd.uniform(-5, 5)
        sc = rnd.uniform(.9, 1.04)
        g.append(f'<g transform="rotate({f(a)}) scale({f(sc)})"><path d="{pd}" fill="{PAPER}" stroke="{INK}" stroke-width="{SW}"/>'
                 f'<path d="M0 {f(-r*.24)} L0 {f(-r*.9)} M{f(-r*.04)} {f(-r*.28)} L{f(-r*.11)} {f(-r*.84)} M{f(r*.04)} {f(-r*.28)} L{f(r*.11)} {f(-r*.84)}" '
                 f'stroke="{INK}" stroke-width=".4" opacity=".7"/></g>')
    g.append(f'<circle r="{f(r*.2)}" fill="{PAPER}" stroke="{INK}" stroke-width="{SW}"/>')
    for i in range(40):
        a = i * 2.4
        rr = r * .17 * math.sqrt(i / 40)
        g.append(f'<circle cx="{f(math.cos(a)*rr)}" cy="{f(math.sin(a)*rr)}" r=".9" fill="{INK}"/>')
    g.append('</g>')
    return "".join(g)


def bud(x, y, ang, s=1):
    return (f'<g transform="translate({f(x)} {f(y)}) rotate({f(ang+90)}) scale({s})">'
            f'<path d="M0 0 C7 -5 8 -18 0 -26 C-8 -18 -7 -5 0 0Z" fill="{PAPER}" stroke="{INK}" stroke-width="{SW}"/>'
            f'<path d="M0 -3 L0 -22 M-3 -6 L-4 -18 M3 -6 L4 -18" stroke="{INK}" stroke-width=".4"/></g>')


def spray(name, vb, stems, leaves, extras=""):
    body = [stem(p) for p in stems]
    for (si, t, side, L, W) in leaves:
        p = stems[si]
        x, y = bez(p, t)
        body.append(leaf(x, y, bez_ang(p, t) + side * 46, L, W))
    body.append(extras)
    save(name, svg(vb, "\n".join(body)))


# eukaliptusz-szerű ág
p_main = ((20, 290), (100, 210), (190, 120), (330, 40))
spray("gravir-ag.svg", (0, 0, 350, 310), [p_main],
      [(0, t, s, 62 - t*22, 26 - t*9) for t, s in
       [(.08, 1), (.16, -1), (.27, 1), (.38, -1), (.49, 1), (.6, -1), (.71, 1), (.82, -1)]],
      bud(330, 40, -30))

# virág szárral
p_f = ((100, 400), (118, 300), (80, 190), (118, 92))
p_f2 = ((108, 310), (130, 280), (150, 250), (168, 222))
spray("gravir-virag.svg", (0, 0, 230, 410), [p_f, p_f2],
      [(0, .16, -1, 74, 17), (0, .3, 1, 80, 18), (0, .5, -1, 60, 14), (1, .5, 1, 40, 10)],
      cosmos(118, 86, 44, 8, 8, 3) + bud(168, 222, -55, .9))

# levendula
def lavender_svg():
    p = ((70, 430), (62, 320), (88, 200), (74, 30))
    out = [stem(p, 1.0)]
    for t, s, L, W in [(.08, 1, 66, 9), (.16, -1, 72, 10), (.26, 1, 60, 9), (.36, -1, 52, 8), (.46, 1, 42, 7)]:
        x, y = bez(p, t)
        out.append(leaf(x, y, bez_ang(p, t) + s * 32, L, W, hatch=False))
    for i in range(22):
        t = .6 + i * .0185
        x, y = bez(p, min(t, 1))
        a = bez_ang(p, min(t, 1))
        for s in (-1, 1):
            r_ = math.radians(a + s * 75)
            dd = 6.5 - i * .17
            cx, cy = x + math.cos(r_) * dd, y + math.sin(r_) * dd
            out.append(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(5.6 - i*.14)}" ry="{f(3.6 - i*.08)}" '
                       f'transform="rotate({f(a + s*28)} {f(cx)} {f(cy)})" fill="{PAPER}" stroke="{INK}" stroke-width=".7"/>')
    save("gravir-levendula.svg", svg((0, 0, 150, 440), "\n".join(out)))


lavender_svg()


# fecske (a márka kék madara, felnőttesen)
def swallow(ink=INK, sw=1.0, wash=True):
    w = f' fill="{MIST}" fill-opacity=".28"' if wash else ' fill="none"'
    return f'''<g stroke="{ink}" stroke-width="{sw}">
<path d="M58 41 C46 27 27 17 5 15 C22 23 37 34 49 45Z"{w}/>
<path d="M68 38 C80 22 98 11 118 8 C100 19 86 31 74 45Z"{w}/>
<path d="M48 45 C55 36 70 34 81 37 C88 39 91 43 86 46 C78 51 60 51 48 45Z" fill="{PAPER}"/>
<path d="M53 46 C45 53 36 59 24 66 C38 62 47 57 56 50Z" fill="{PAPER}"/>
<path d="M56 48 C50 57 45 64 38 73 C49 65 55 58 60 50Z" fill="{PAPER}"/>
<path d="M86 41 L93 41.6 L86 43" fill="{ink}"/>
<circle cx="82.5" cy="40.4" r="1.1" fill="{ink}" stroke="none"/>
<path d="M20 20 L44 36 M28 20 L48 34 M90 18 L72 36 M98 15 L78 34 M106 12 L84 32" stroke-width="{sw*.45}" opacity=".7"/>
</g>'''


save("fecske.svg", svg((0, 0, 124, 80), swallow(INK, .8)))


# =====================================================================
# SZOLGÁLTATÁS-TÁBLÁK (vonalrajz)
# =====================================================================
def plate(name, body):
    save(name, svg((0, 0, 320, 220), body))


def ln(d, w=1.0, op=1, col=INK):
    return f'<path d="{d}" stroke="{col}" stroke-width="{w}" opacity="{op}"/>'


plate("szolg-vizsgalat.svg", f'''
<rect x="164" y="28" width="120" height="166" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
<rect x="169" y="33" width="110" height="156" stroke="{INK}" stroke-width=".4"/>
<g fill="{INK}" font-family="Bodoni Moda, Didot, Georgia, serif" text-anchor="middle">
<text x="224" y="80" font-size="36">T</text><text x="224" y="108" font-size="21" letter-spacing="6">Ü N</text>
<text x="224" y="130" font-size="14" letter-spacing="5">D É R</text><text x="224" y="147" font-size="10" letter-spacing="4">S Z E M</text>
<text x="224" y="161" font-size="7" letter-spacing="3">O P T I K A</text></g>
{ln("M184 174 H264", .6, 1, GOLD)}
<path d="M24 112 C54 74 104 74 134 112 C104 150 54 150 24 112Z" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
<circle cx="79" cy="112" r="23" stroke="{INK}" stroke-width="1" fill="{MIST}" fill-opacity=".22"/>
<circle cx="79" cy="112" r="9" fill="{INK}"/><circle cx="74" cy="107" r="3" fill="#fff"/>
{"".join(ln(f"M{f(79+math.cos(a)*12)} {f(112+math.sin(a)*12)} L{f(79+math.cos(a)*22)} {f(112+math.sin(a)*22)}", .4, .7) for a in [i*math.pi/14 for i in range(28)])}
{ln("M34 96 L26 86 M50 84 L46 72 M72 79 L71 66 M94 81 L98 69 M116 91 L124 81", .8)}
''')

plate("szolg-keszites.svg", f'''
<circle cx="122" cy="110" r="84" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
<circle cx="122" cy="110" r="78" stroke="{INK}" stroke-width=".4"/>
<path transform="translate(122 112) scale(.6)" d="{LENS["cateye"]}" stroke="{INK}" stroke-width="1.6" stroke-dasharray="5 5"/>
{"".join(ln(f"M{f(122+math.cos(a)*84)} {f(110+math.sin(a)*84)} L{f(122+math.cos(a)*(78 if i%3 else 72))} {f(110+math.sin(a)*(78 if i%3 else 72))}", .5) for i, a in enumerate([i*math.pi/24 for i in range(48)]))}
{ln("M122 22 V198 M34 110 H210", .4, .5, GOLD)}
<circle cx="122" cy="110" r="2.4" fill="{GOLD}"/>
{ln("M236 46 V178 M236 46 H292 M236 178 H292 M252 46 V30 M276 46 V30", 1)}
{ln("M246 76 H286 M246 92 H278 M246 108 H286 M246 124 H270 M246 140 H282", .5, .7)}
''')


def mini_frame(kind, x, y, sc, col=INK):
    cfg = FRAME[kind]
    d = cfg["d"]
    lp = LENS[kind]
    sx, sy, oy, ox = cfg["outer"]
    o = scale_d(lp, sx, sy, ox, oy)
    s = [f'<g transform="translate({x} {y}) scale({sc})" stroke="{col}">']
    for k in (-1, 1):
        s.append(f'<g transform="scale({k} 1) translate({d} 0)"><path d="{o}" stroke-width="{1/sc:.2f}" fill="{PAPER}"/>'
                 f'<path d="{lp}" stroke-width="{.9/sc:.2f}" fill="{MIST}" fill-opacity=".12"/></g>')
    if cfg["bridge"]:
        s.append(f'<path d="{cfg["bridge"]}" stroke-width="{1/sc:.2f}" fill="{PAPER}"/>')
    else:
        s.append(f'<path d="M-24 -20 C-14 -36 14 -36 24 -20" stroke-width="{1.2/sc:.2f}"/>')
    s.append('</g>')
    return "".join(s)


plate("szolg-keretek.svg", mini_frame("geo", 170, 58, .44) + mini_frame("round", 150, 110, .5) + mini_frame("cateye", 168, 164, .44))

plate("szolg-javitas.svg", f'''
<path d="M24 74 C60 58 112 56 150 64 C160 66 166 76 162 90 L156 112" stroke="{INK}" stroke-width="1" fill="none"/>
<path d="M24 82 C60 66 112 64 148 72 C154 74 157 80 155 88 L150 108" stroke="{INK}" stroke-width="1"/>
<rect x="148" y="66" width="34" height="22" rx="2" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
{ln("M152 72 H178 M152 77 H178 M152 82 H178", .35, .7)}
<path d="M182 72 L294 108 M182 82 L290 116" stroke="{INK}" stroke-width="1"/>
<path d="M294 108 C304 114 304 128 292 134 M290 116 C296 120 296 126 290 129" stroke="{INK}" stroke-width="1"/>
<circle cx="165" cy="77" r="5" fill="#fff" stroke="{INK}" stroke-width="1"/>{ln("M162 77 H168", .8)}
<g transform="translate(168 84) rotate(48)">
{ln("M0 8 V58", 1.2)}<rect x="-6" y="58" width="12" height="72" rx="6" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
{ln("M-2 66 V122 M2 66 V122", .35, .7)}{ln("M-6 74 H6 M-6 80 H6", .35)}</g>
{ln("M40 152 C80 148 100 172 140 172", .6, .8, GOLD)}
''')

plate("szolg-kontakt.svg", f'''
<path d="M70 96 C96 54 168 54 194 96" stroke="{INK}" stroke-width="1" fill="{MIST}" fill-opacity=".14"/>
<path d="M80 92 C106 64 158 64 184 92" stroke="{INK}" stroke-width=".4" opacity=".7"/>
<path d="M70 96 C100 103 164 103 194 96" stroke="{INK}" stroke-width=".8"/>
<path d="M234 38 C234 38 252 64 252 76 A18 18 0 0 1 216 76 C216 64 234 38 234 38Z" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
{ln("M226 72 C226 80 230 84 238 84", .5)}
<rect x="56" y="134" width="208" height="52" rx="26" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>
<circle cx="104" cy="160" r="20" fill="#fff" stroke="{INK}" stroke-width="1"/><circle cx="216" cy="160" r="20" fill="#fff" stroke="{INK}" stroke-width="1"/>
<g fill="{INK}" font-family="Bodoni Moda, Didot, Georgia, serif" font-size="16" text-anchor="middle"><text x="104" y="166">L</text><text x="216" y="166">R</text></g>
''')

plate("szolg-lencsek.svg", f'''
<defs><linearGradient id="z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{MIST}" stop-opacity=".25"/>
<stop offset=".55" stop-color="{LAV}" stop-opacity=".18"/><stop offset="1" stop-color="{POWDER}" stop-opacity=".35"/></linearGradient></defs>
<path transform="translate(118 112) scale(.9)" d="{LENS["cateye"]}" fill="url(#z)" stroke="{INK}" stroke-width="1.1"/>
{ln("M44 92 C80 100 156 100 196 88 M60 128 C90 136 146 136 176 124", .6, .7)}
<g fill="{INK}" font-family="Jost, Futura, Helvetica, Arial, sans-serif" font-size="9" letter-spacing="2.4">
<text x="232" y="75">TÁVOL</text><text x="232" y="113">KÖZTES</text><text x="232" y="151">KÖZEL</text></g>
{ln("M186 72 H226 M196 110 H226 M166 148 H226", .5, 1, GOLD)}
''')


# próbakeret (rézmetszet)
def trial_frame():
    g = []
    for cx in (110, 290):
        g.append(f'<circle cx="{cx}" cy="150" r="80" fill="{PAPER}" stroke="{INK}" stroke-width="1.1"/>')
        g.append(f'<circle cx="{cx}" cy="150" r="72" stroke="{INK}" stroke-width=".5"/>')
        g.append(f'<circle cx="{cx}" cy="150" r="60" fill="{MIST}" fill-opacity=".1" stroke="{INK}" stroke-width=".9"/>')
        for i in range(0, 181, 5):
            a = math.radians(180 + i)
            r2 = 80 if i % 30 == 0 else (77 if i % 10 == 0 else 75)
            g.append(ln(f"M{f(cx+math.cos(a)*72)} {f(150+math.sin(a)*72)} L{f(cx+math.cos(a)*r2)} {f(150+math.sin(a)*r2)}", .5))
        for k, r in enumerate((46, 32, 18)):
            g.append(f'<circle cx="{cx}" cy="150" r="{r}" stroke="{[LAV_D, GOLD, INK][k]}" stroke-width=".5" opacity=".6"/>')
        g.append(ln(f"M{cx-56} 150 H{cx+56}", .4, .5))
        g.append(f'<circle cx="{cx}" cy="58" r="8" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>')
        g.append(ln(f"M{cx-4} 58 H{cx+4} M{cx} 54 V62", .5))
    g.append(ln("M188 130 C196 104 204 104 212 130", 2))
    g.append(ln("M184 188 C194 202 206 202 216 188", 1))
    g.append(ln("M30 140 L4 118 M370 140 L396 118", 2))
    g.append(ln("M200 42 V98", 1))
    g.append(f'<circle cx="200" cy="36" r="6" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>')
    g.append(f'<g fill="{INK}" font-family="Jost, Futura, Helvetica, Arial, sans-serif" font-size="7" letter-spacing="1.5" text-anchor="middle">'
             f'<text x="110" y="252">0 · 90 · 180</text><text x="290" y="252">0 · 90 · 180</text></g>')
    return "\n".join(g)


save("probakeret.svg", svg((0, 0, 400, 270), trial_frame()))


# =====================================================================
# UTCAKÉP – építészeti vonalrajz (rézmetszet hangulat)
# =====================================================================
def roof_hatch(x0, x1, top_x, top_y, base_y, step=5):
    g = []
    y = top_y + step
    while y < base_y:
        t = (y - top_y) / (base_y - top_y)
        a = top_x - (top_x - x0) * t
        b = top_x + (x1 - top_x) * t
        g.append(f"M{f(a+1.5)} {f(y)} L{f(b-1.5)} {f(y)}")
        y += step
    return ln(" ".join(g), .45, .75)


def window(x, y, w, h, arch=False):
    s = []
    if arch:
        s.append(f'<path d="M{x} {y+h} V{y+w/2} A{w/2} {w/2} 0 0 1 {x+w} {y+w/2} V{y+h}Z" fill="{MIST}" fill-opacity=".14" stroke="{INK}" stroke-width=".9"/>')
    else:
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{MIST}" fill-opacity=".14" stroke="{INK}" stroke-width=".9"/>')
        s.append(ln(f"M{x-3} {y+h+3} H{x+w+3}", .9))
        s.append(ln(f"M{x-2} {y-4} H{x+w+2}", .6))
    s.append(ln(f"M{f(x+w/2)} {y+(w/2 if arch else 0)} V{y+h} M{x} {f(y+h*.45)} H{x+w}", .5))
    s.append(ln(" ".join(f"M{f(x+2+i*3.2)} {y+h-2} L{f(x+w*0.45)} {f(y+h*0.5+i*2)}" for i in range(3)), .3, .5))
    return "".join(s)


def tree(cx, base, s=1.0, seed=1):
    rnd = random.Random(seed)
    g = [f'<g transform="translate({cx} {base}) scale({s})">']
    g.append(f'<path d="M-4 0 C-3 -40 -5 -70 -2 -96 M4 0 C3 -40 5 -70 2 -96" stroke="{INK}" stroke-width="1"/>')
    g.append(ln("M-2 -70 C-14 -86 -20 -96 -30 -104 M2 -80 C14 -92 22 -100 30 -106", .8))
    # lombkorona: hullámos körvonal
    pts = []
    n = 26
    for i in range(n + 1):
        a = 2 * math.pi * i / n
        r = 62 + rnd.uniform(-6, 6)
        pts.append((math.cos(a) * r * 1.05, -140 + math.sin(a) * r * .9))
    d = f"M{f(pts[0][0])} {f(pts[0][1])} " + " ".join(
        f"Q{f((pts[i][0]+pts[i+1][0])/2*1.08)} {f((pts[i][1]+140)*1.08-140)} {f(pts[i+1][0])} {f(pts[i+1][1])}" for i in range(n)) + "Z"
    g.append(f'<path d="{d}" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>')
    # árnyék-vonalkázás: rendezett, párhuzamos rövid vonalak a jobb alsó félben
    hs = []
    for gy in range(-190, -86, 7):
        for gx in range(-56, 60, 9):
            x = gx + ((gy // 7) % 2) * 4.5
            y = gy
            dx, dy = x / 58, (y + 140) / 50
            if dx * dx + dy * dy < .82 and (x * .7 + (y + 140)) > 6 and rnd.random() > .15:
                hs.append(f"M{f(x)} {f(y)} l6 -3.2")
    g.append(ln(" ".join(hs), .45, .75))
    for i in range(10):
        a = rnd.uniform(3.4, 5.6)
        r = rnd.uniform(16, 44)
        x, y = math.cos(a) * r, -140 + math.sin(a) * r * .85
        g.append(f'<path d="M{f(x)} {f(y)} c3 -3 6 -3 9 0" stroke="{INK}" stroke-width=".5" opacity=".55"/>')
    g.append('</g>')
    return "".join(g)


def town():
    W = 1200
    g = [f'<rect x="0" y="84" width="{W}" height="556" fill="{PAPER}"/>']
    # távoli dombvonal + madarak
    g.append(ln("M0 400 C200 388 360 396 520 390 C700 384 900 396 1200 386", .6, .6))
    g.append(ln("M0 186 Q600 250 1200 176", .5, .6))
    g.append(f'<defs>{tunder.iri_defs("tw")}</defs><g transform="translate(925 228) scale(.5)">{tunder.fairy_fly("tw", INK, False, True, True)}</g>')
    g.append(f'<g transform="translate(220 128) scale(.28) rotate(-8)">{swallow(INK, 3, False)}</g>')
    # templom
    g.append(f'''<g stroke="{INK}" stroke-width="1" fill="{PAPER}">
<rect x="232" y="248" width="80" height="222"/><rect x="226" y="242" width="92" height="8"/>
<path d="M232 248 L272 186 L312 248Z"/><path d="M272 186 V118"/><path d="M262 140 H282"/>
<path d="M266 110 H278 M272 102 V118" stroke-width="1.4"/>
<circle cx="272" cy="226" r="12"/><circle cx="272" cy="226" r="9" stroke-width=".4"/>
<rect x="312" y="322" width="150" height="148"/><path d="M302 322 L387 280 L472 322Z"/>
<path d="M256 470 V430 A16 16 0 0 1 288 430 V470"/>
</g>''')
    g.append(roof_hatch(232, 312, 272, 186, 248))
    g.append(roof_hatch(302, 472, 387, 280, 322))
    g.append(ln("M272 220 V226 L277 229", .7))
    for (x, y, w, h, a) in [(258, 280, 28, 56, True), (334, 352, 22, 52, True), (376, 352, 22, 52, True), (418, 352, 22, 52, True)]:
        g.append(window(x, y, w, h, a))
    # házsor
    houses = [(-10, 190, 292), (480, 160, 300), (930, 150, 304), (1084, 130, 290)]
    for (x, w, top) in houses:
        rh = 64
        g.append(f'<g stroke="{INK}" stroke-width="1" fill="{PAPER}"><rect x="{x}" y="{top+rh}" width="{w}" height="{470-top-rh}"/>'
                 f'<path d="M{x-8} {top+rh} L{f(x+w/2)} {top} L{x+w+8} {top+rh}Z"/>'
                 f'<path d="M{x-4} {top+rh+6} H{x+w+4}" stroke-width=".5"/></g>')
        g.append(roof_hatch(x - 8, x + w + 8, x + w / 2, top, top + rh, 6))
        n = max(1, int(w // 72))
        for i in range(n):
            wx = x + (w / n) * i + (w / n) / 2 - 16
            g.append(window(round(wx, 1), top + rh + 36, 32, 48))
        g.append(ln(f"M{x} 460 H{x+w}", .4, .6))
    # az üzlet
    g.append(f'''<g stroke="{INK}" stroke-width="1" fill="{PAPER}">
<rect x="650" y="262" width="270" height="208"/><path d="M640 262 L785 214 L930 262Z"/>
<rect x="672" y="292" width="226" height="44"/><rect x="676" y="296" width="218" height="36" stroke-width=".4"/>
<path d="M660 348 L910 348 L898 384 L672 384Z" fill="{LAV}" fill-opacity=".28"/>
<rect x="680" y="392" width="112" height="78" fill="{MIST}" fill-opacity=".14"/>
<rect x="808" y="392" width="72" height="78"/><circle cx="868" cy="432" r="2"/>
</g>''')
    g.append(roof_hatch(640, 930, 785, 214, 262, 6))
    g.append(ln(" ".join(f"M{x} 348 L{x-4 if x < 785 else x+4} 384" for x in range(684, 900, 24)), .6))
    g.append(f'''<g fill="{INK}" text-anchor="middle"><text x="785" y="321" font-family="Bodoni Moda, Didot, Georgia, serif" font-size="19" letter-spacing="5">TÜNDÉRSZEM</text>
<text x="785" y="331" font-family="Jost, Futura, Helvetica, Arial, sans-serif" font-size="6" letter-spacing="4">O P T I K A</text></g>''')
    g.append(f'<g transform="translate(736 424) scale(.2)">' + "".join(
        f'<path transform="translate({k*124} 0) scale({k} 1)" d="{LENS["cateye"]}" stroke="{INK}" stroke-width="6"/>' for k in (-1, 1)) + '</g>')
    g.append(ln(" ".join(f"M{x} 400 L{x+30} 470" for x in range(684, 790, 18)), .3, .35))
    # járda, út
    g.append(ln("M0 470 H1200 M0 494 H1200", 1))
    g.append(ln(" ".join(f"M{x} 470 V494" for x in range(0, 1200, 60)), .4, .6))
    g.append(ln(" ".join(f"M{x} 568 H{x+70}" for x in range(30, 1200, 150)), 1.2, .55))
    g.append(ln(" ".join(f"M{x} {y} h{l}" for x, y, l in [(120, 520, 40), (400, 610, 60), (700, 530, 30), (980, 600, 50), (260, 590, 24)]), .4, .5))
    # fák
    g.append(tree(140, 470, 1, 3))
    g.append(tree(588, 470, .86, 7))
    g.append(tree(1030, 470, 1.02, 11))
    # utcanévtábla
    g.append(f'''<g stroke="{INK}" stroke-width="1"><path d="M560 470 V328 M564 470 V328"/>
<rect x="480" y="298" width="164" height="32" rx="2" fill="#2F5D8A" fill-opacity=".9"/>
<rect x="485" y="303" width="154" height="22" rx="1" stroke="#fff" stroke-width=".8"/></g>
<text x="562" y="319" fill="#fff" text-anchor="middle" font-family="Jost, Futura, Helvetica, Arial, sans-serif" font-size="12.5" font-weight="600" letter-spacing=".6">Damjanich út</text>''')
    # pad
    g.append(ln("M396 450 H462 M398 440 H460 M404 450 V470 M454 450 V470", 1.4))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 84 {W} 556" width="{W}" height="556" fill="none" '
            f'stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid slice">\n' + "\n".join(g) + '\n</svg>\n')


save("varoskep.svg", town())

# régi, már nem használt fájlok törlése
for old in ["ag-eukaliptusz.svg", "ag-levendula.svg", "ag-virag.svg", "virag.svg", "virag-lila.svg", "madar.svg", "portal.svg"]:
    p = os.path.join(OUT, old)
    if os.path.exists(p):
        os.remove(p)

tunder.write_all(OUT)
print("kész:", sorted(os.listdir(OUT)))
