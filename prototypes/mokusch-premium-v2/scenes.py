"""Mókusch B-változat – papírkivágásos (paper-cut) jelenetek SVG-ben.

Minden jelenet rétegekből áll (ég, távoli dombok, fák, közeli domb, tárgy, előtér),
a rétegek <g class="ly" data-d="…"> csoportok, így a Motion görgetésre és egérre
eltérő mélységben mozgatja őket. Fotó és generált kép nincs – minden vektoros rajz.
"""
import math
import random

C = {
    "paper": "#F4ECDD", "cream": "#FBF6EC", "sky": "#EFE3CF", "sky2": "#E8D6BC",
    "forest": "#24382B", "moss": "#3E5134", "olive": "#6B7449", "sage": "#9AAA86", "sage2": "#BCC5A6",
    "ochre": "#C68B3E", "honey": "#E2B868", "berry": "#7B3446", "berry2": "#9C4A5B",
    "rose": "#D9B4A6", "rose2": "#EBCFC3", "bark": "#5A3D2B", "bark2": "#7A5640", "ink": "#26201A",
}
W, H = 1600, 900

# a logó mókusa (120×120-as rajz) – a jelenetekben szereplő kabala
SQ_TAIL = "M58 106 C 78 108, 100 98, 104 74 C 107 56, 100 44, 102 30 C 104 16, 96 6, 84 7 C 72 8, 64 18, 68 28 C 71 35, 81 35, 82 27 C 82 33, 76 34, 74 30 C 72 24, 78 18, 85 19 C 92 21, 91 32, 87 43 C 82 57, 85 70, 79 84 C 75 93, 69 97, 62 99 Z"
SQ_BODY = "M30 106 C 26 104, 27 99, 32 98 C 33 92, 33 86, 36 80 C 33 78, 31 76, 31 73 C 28 70, 30 66, 34 66 C 37 63, 40 60, 42 56 C 37 56, 30 55, 26 51 C 22 49, 22 45, 25 43 C 28 40, 30 37, 34 35 C 37 33, 41 32, 44 33 L 46 24 C 46.6 21.6, 48.4 21.6, 49 24 L 50.5 34 C 55 37, 57 43, 56 50 C 61 56, 66 64, 69 74 C 72 86, 70 98, 64 104 C 60 107, 48 107, 30 106 Z"


def squirrel(x, y, s=1.0, fg=None, eye=None, flip=False, cls="sq"):
    fg = fg or C["bark"]
    eye = eye or C["cream"]
    fx = f" translate(120 0) scale(-1 1)" if flip else ""
    return (f'<g class="{cls}" transform="translate({x} {y}) scale({s}){fx}">'
            f'<path class="sq-tail" d="{SQ_TAIL}" fill="{fg}"/><path d="{SQ_BODY}" fill="{fg}"/>'
            f'<circle cx="36" cy="42.5" r="2" fill="{eye}"/>'
            f'<g transform="translate(29 63)"><ellipse cx="4" cy="6" rx="4.4" ry="5" fill="{C["ochre"]}"/>'
            f'<path d="M-0.8 3.6 C -0.6 0, 8.6 0, 8.8 3.6 Z" fill="{C["bark2"]}"/></g></g>')


def hills(y0, amp, n, seed, fill, w=W, h=H):
    r = random.Random(seed)
    pts = []
    step = (w + 400) / n
    for i in range(n + 1):
        pts.append((-200 + i * step, y0 - r.uniform(0.3, 1) * amp))
    d = f"M-200 {h} L{pts[0][0]:.0f} {pts[0][1]:.0f}"
    for i in range(1, len(pts)):
        x0, yA = pts[i - 1]
        x1, yB = pts[i]
        mx = (x0 + x1) / 2
        d += f" C {mx:.0f} {yA:.0f}, {mx:.0f} {yB:.0f}, {x1:.0f} {yB:.0f}"
    d += f" L{w + 200} {h} Z"
    return f'<path d="{d}" fill="{fill}"/>'


def pine(x, base, hgt, fill, trunk=None):
    w = hgt * 0.42
    t = f'<rect x="{x - hgt*0.025:.1f}" y="{base - hgt*0.12:.1f}" width="{hgt*0.05:.1f}" height="{hgt*0.14:.1f}" fill="{trunk or C["bark"]}"/>' if trunk else ""
    tiers = ""
    for k in range(3):
        top = base - hgt + k * hgt * 0.22
        bot = base - hgt * 0.1 - (2 - k) * hgt * 0.18
        ww = w * (0.55 + k * 0.22)
        tiers += (f'<path d="M{x:.1f} {top:.1f} C {x + ww*0.2:.1f} {top + (bot-top)*0.4:.1f}, {x + ww*0.5:.1f} {bot - 6:.1f}, {x + ww*0.55:.1f} {bot:.1f} '
                  f'L{x - ww*0.55:.1f} {bot:.1f} C {x - ww*0.5:.1f} {bot - 6:.1f}, {x - ww*0.2:.1f} {top + (bot-top)*0.4:.1f}, {x:.1f} {top:.1f} Z" fill="{fill}"/>')
    return t + tiers


def round_tree(x, base, hgt, fill, trunk):
    r = hgt * 0.3
    return (f'<path d="M{x-6:.0f} {base:.0f} L{x-4:.0f} {base-hgt*0.5:.0f} L{x+4:.0f} {base-hgt*0.5:.0f} L{x+6:.0f} {base:.0f} Z" fill="{trunk}"/>'
            f'<circle cx="{x:.0f}" cy="{base-hgt*0.62:.0f}" r="{r:.0f}" fill="{fill}"/>'
            f'<circle cx="{x-r*0.6:.0f}" cy="{base-hgt*0.5:.0f}" r="{r*0.7:.0f}" fill="{fill}"/>'
            f'<circle cx="{x+r*0.65:.0f}" cy="{base-hgt*0.52:.0f}" r="{r*0.72:.0f}" fill="{fill}"/>')


def mushroom(x, y, s, cap):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<path d="M-7 0 C -8 -14, -5 -22, 0 -24 C 5 -22, 8 -14, 7 0 Z" fill="{C["cream"]}"/>'
            f'<path d="M-26 -20 C -24 -40, 24 -40, 26 -20 C 14 -16, -14 -16, -26 -20 Z" fill="{cap}"/>'
            f'<circle cx="-10" cy="-28" r="3" fill="{C["cream"]}"/><circle cx="6" cy="-31" r="2.6" fill="{C["cream"]}"/><circle cx="14" cy="-24" r="2" fill="{C["cream"]}"/></g>')


def fern(x, y, s, fill, flip=False):
    sc = f"scale({-s} {s})" if flip else f"scale({s})"
    blades = ""
    for i, (ang, ln) in enumerate([(-38, 150), (-18, 175), (2, 190), (20, 170), (40, 140)]):
        blades += (f'<path d="M0 0 C {ln*0.25:.0f} {-ln*0.35:.0f}, {ln*0.2:.0f} {-ln*0.8:.0f}, 0 {-ln} C {-ln*0.2:.0f} {-ln*0.8:.0f}, {-ln*0.25:.0f} {-ln*0.35:.0f}, 0 0 Z" '
                   f'fill="{fill}" transform="rotate({ang})" opacity="{0.85 + 0.03*i:.2f}"/>')
    return f'<g transform="translate({x} {y}) {sc}">{blades}</g>'


def stars(seed, n, color):
    r = random.Random(seed)
    return "".join(f'<circle cx="{r.uniform(0,W):.0f}" cy="{r.uniform(40,380):.0f}" r="{r.uniform(1.2,2.8):.1f}" fill="{color}" opacity="{r.uniform(.35,.8):.2f}"/>' for _ in range(n))


def lantern(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<path d="M0 -60 L0 -30" stroke="{C["ink"]}" stroke-width="3"/>'
            f'<circle cx="0" cy="0" r="46" fill="{C["honey"]}" opacity=".25"/>'
            f'<path d="M-16 -30 L16 -30 L22 -22 L-22 -22 Z" fill="{C["ink"]}"/>'
            f'<rect x="-15" y="-22" width="30" height="40" rx="3" fill="{C["honey"]}"/>'
            f'<path d="M-15 -22 L-15 18 M0 -22 L0 18 M15 -22 L15 18" stroke="{C["ink"]}" stroke-width="2.5"/>'
            f'<path d="M-20 18 L20 18 L14 26 L-14 26 Z" fill="{C["ink"]}"/></g>')


def cup(x, y, s=1, color=None):
    color = color or C["cream"]
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<ellipse cx="0" cy="44" rx="80" ry="12" fill="{C["bark"]}" opacity=".25"/>'
            f'<ellipse cx="0" cy="38" rx="72" ry="14" fill="{color}"/>'
            f'<path d="M-50 -30 L50 -30 C 50 10, 34 34, 0 34 C -34 34, -50 10, -50 -30 Z" fill="{color}"/>'
            f'<path d="M48 -18 C 78 -20, 78 18, 40 14" fill="none" stroke="{color}" stroke-width="10" stroke-linecap="round"/>'
            f'<ellipse cx="0" cy="-30" rx="50" ry="9" fill="{C["bark"]}"/>'
            f'<path d="M-50 -10 C -16 -2, 16 -2, 50 -10" stroke="{C["berry"]}" stroke-width="5" fill="none"/>'
            f'<g class="steam" fill="none" stroke="{C["cream"]}" stroke-width="5" stroke-linecap="round" opacity=".85">'
            f'<path d="M-18 -50 C -30 -70, -6 -80, -18 -100"/><path d="M4 -48 C -8 -72, 16 -82, 4 -110"/><path d="M24 -50 C 12 -70, 36 -80, 24 -98"/></g></g>')


def cake(x, y, s=1, candle=True):
    tiers = ""
    for i, (w, h, col) in enumerate([(220, 70, C["cream"]), (170, 62, C["rose2"]), (120, 56, C["cream"])]):
        top = -sum([70, 62, 56][:i + 1])
        tiers += (f'<rect x="{-w/2}" y="{top}" width="{w}" height="{h}" rx="10" fill="{col}"/>'
                  f'<path d="M{-w/2} {top+12} ' + " ".join(
                      f"Q {-w/2 + (k+0.5)*w/8:.0f} {top+30 + (k%2)*10}, {-w/2 + (k+1)*w/8:.0f} {top+12}" for k in range(8)) +
                  f' L{w/2} {top} L{-w/2} {top} Z" fill="{C["berry"] if i != 1 else C["cream"]}" opacity="{0.9 if i != 1 else 1}"/>')
    flowers = "".join(f'<g transform="translate({px} {py})"><circle r="9" fill="{C["rose"]}"/><circle r="4" fill="{C["honey"]}"/></g>'
                      for px, py in [(-60, -132), (-30, -128), (52, -140), (-14, -188), (30, -184)])
    leaves = "".join(f'<ellipse cx="{px}" cy="{py}" rx="10" ry="5" fill="{C["olive"]}" transform="rotate({rot} {px} {py})"/>'
                     for px, py, rot in [(-74, -128, -20), (66, -134, 25), (-2, -192, -30), (44, -190, 30)])
    c = (f'<rect x="-4" y="-232" width="8" height="44" rx="3" fill="{C["rose"]}"/>'
         f'<path class="flame" d="M0 -264 C 9 -250, 7 -240, 0 -236 C -7 -240, -9 -250, 0 -264 Z" fill="{C["honey"]}"/>') if candle else ""
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<ellipse cx="0" cy="8" rx="150" ry="16" fill="{C["bark"]}" opacity=".22"/>'
            f'<path d="M-140 0 L140 0 L120 14 L-120 14 Z" fill="{C["bark2"]}"/>'
            f'{tiers}{leaves}{flowers}{c}</g>')


def pot(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<ellipse cx="0" cy="96" rx="140" ry="14" fill="{C["bark"]}" opacity=".25"/>'
            f'<path d="M-30 96 L-50 140 M30 96 L50 140" stroke="{C["ink"]}" stroke-width="8"/>'
            f'<path d="M-110 -10 C -120 70, -60 100, 0 100 C 60 100, 120 70, 110 -10 Z" fill="{C["ink"]}"/>'
            f'<ellipse cx="0" cy="-10" rx="114" ry="20" fill="{C["moss"]}"/>'
            f'<ellipse cx="0" cy="-12" rx="100" ry="14" fill="{C["sage"]}"/>'
            f'<g class="bubbles" fill="{C["sage2"]}"><circle cx="-40" cy="-16" r="8"/><circle cx="18" cy="-18" r="6"/><circle cx="50" cy="-14" r="5"/></g>'
            f'<g class="steam" fill="none" stroke="{C["cream"]}" stroke-width="6" stroke-linecap="round" opacity=".8">'
            f'<path d="M-40 -40 C -60 -80, -20 -100, -40 -150"/><path d="M10 -40 C -10 -90, 30 -110, 10 -170"/><path d="M56 -40 C 40 -80, 76 -100, 56 -140"/></g></g>')


def shelf(x, y, w, items):
    return (f'<g transform="translate({x} {y})"><rect x="0" y="0" width="{w}" height="16" rx="3" fill="{C["bark2"]}"/>'
            f'<path d="M30 16 L46 50 L58 16 M{w-58} 16 L{w-46} 50 L{w-30} 16" fill="{C["bark"]}"/>{items}</g>')


def jar(x, h, w, fill, lid):
    return (f'<rect x="{x}" y="{-h}" width="{w}" height="{h}" rx="{w*0.22:.0f}" fill="{fill}"/>'
            f'<rect x="{x-3}" y="{-h-10}" width="{w+6}" height="12" rx="3" fill="{lid}"/>'
            f'<rect x="{x+w*0.18:.0f}" y="{-h*0.62:.0f}" width="{w*0.64:.0f}" height="{h*0.3:.0f}" rx="3" fill="{C["cream"]}" opacity=".85"/>')


def bunny(x, s, fill):
    return (f'<g transform="translate({x} 0) scale({s})">'
            f'<ellipse cx="0" cy="-34" rx="30" ry="34" fill="{fill}"/>'
            f'<circle cx="-4" cy="-78" r="20" fill="{fill}"/>'
            f'<path class="ear" d="M-14 -92 C -22 -130, -8 -138, -6 -96 Z" fill="{fill}"/>'
            f'<path class="ear" d="M2 -94 C 4 -134, 20 -130, 8 -92 Z" fill="{fill}"/>'
            f'<circle cx="-12" cy="-80" r="2.4" fill="{C["ink"]}"/><circle cx="26" cy="-20" r="9" fill="{C["cream"]}"/></g>')


def teapot(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<path d="M-46 -10 C -60 -70, 60 -70, 46 -10 Z" fill="{C["berry"]}"/>'
            f'<path d="M-46 -40 C -76 -40, -78 -8, -90 -20" stroke="{C["berry"]}" stroke-width="10" fill="none" stroke-linecap="round"/>'
            f'<path d="M44 -44 C 70 -50, 70 -18, 46 -18" stroke="{C["berry"]}" stroke-width="9" fill="none"/>'
            f'<ellipse cx="0" cy="-62" rx="22" ry="6" fill="{C["berry2"]}"/><circle cx="0" cy="-70" r="7" fill="{C["berry2"]}"/>'
            f'<path d="M-30 -30 C -10 -24, 10 -24, 30 -30" stroke="{C["cream"]}" stroke-width="4" fill="none"/></g>')


def books(x, y, s=1):
    spec = [(150, 30, C["berry"]), (130, 26, C["olive"]), (160, 34, C["ochre"]), (120, 24, C["rose"])]
    out, yy = "", 0
    for i, (w, h, col) in enumerate(spec):
        off = [-6, 10, -12, 4][i]
        yy -= h
        out += f'<rect x="{-w/2 + off}" y="{yy}" width="{w}" height="{h}" rx="4" fill="{col}"/><rect x="{-w/2 + off + 10}" y="{yy + h/2 - 2}" width="{w-20}" height="3" fill="{C["cream"]}" opacity=".7"/>'
    return f'<g transform="translate({x} {y}) scale({s})">{out}</g>'


def armchair(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<path d="M-110 0 L-100 40 M100 0 L110 40" stroke="{C["bark"]}" stroke-width="10"/>'
            f'<path d="M-100 -150 C -100 -200, 100 -200, 100 -150 L100 -40 L-100 -40 Z" fill="{C["moss"]}"/>'
            f'<rect x="-130" y="-90" width="50" height="100" rx="24" fill="{C["olive"]}"/><rect x="80" y="-90" width="50" height="100" rx="24" fill="{C["olive"]}"/>'
            f'<rect x="-92" y="-60" width="184" height="64" rx="18" fill="{C["olive"]}"/></g>')


def lamp(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<circle cx="0" cy="-200" r="90" fill="{C["honey"]}" opacity=".18"/>'
            f'<path d="M0 0 L0 -170" stroke="{C["ink"]}" stroke-width="6"/><ellipse cx="0" cy="2" rx="40" ry="8" fill="{C["ink"]}"/>'
            f'<path d="M-50 -170 L50 -170 L30 -236 L-30 -236 Z" fill="{C["honey"]}"/></g>')


def bottle(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s}) rotate(-18)">'
            f'<path d="M-40 -40 C -40 -80, 40 -80, 40 -40 L40 90 C 40 110, -40 110, -40 90 Z" fill="{C["sage2"]}" opacity=".9"/>'
            f'<rect x="-16" y="-120" width="32" height="50" rx="6" fill="{C["sage2"]}" opacity=".9"/>'
            f'<rect x="-14" y="-136" width="28" height="22" rx="4" fill="{C["bark2"]}"/>'
            f'<rect x="-22" y="-30" width="44" height="100" rx="4" fill="{C["cream"]}" transform="rotate(8)"/>'
            f'<path d="M-12 -10 L14 -6 M-14 6 L12 10 M-16 22 L10 26" stroke="{C["bark"]}" stroke-width="3" transform="rotate(8)"/>'
            f'<path d="M-6 50 C 4 44, 12 52, 4 60 C -4 66, -14 58, -6 50 Z" fill="{C["berry"]}" transform="rotate(8)"/></g>')


def waves(y, fill, seed, amp=18):
    r = random.Random(seed)
    d = f"M-100 {H} L-100 {y}"
    x = -100
    while x < W + 100:
        w = r.uniform(120, 200)
        d += f" q {w/4:.0f} {-amp} {w/2:.0f} 0 t {w/2:.0f} 0"
        x += w
    d += f" L{W+100} {H} Z"
    return f'<path d="{d}" fill="{fill}"/>'


def cafe_front(x, y, s=1):
    stripes = "".join(f'<path d="M{-160 + i*40} -230 L{-140 + i*40} -230 L{-140 + i*40 + 6} -180 C {-150 + i*40} -168, {-166 + i*40} -168, {-174 + i*40 + 6} -180 Z" fill="{C["berry"] if i % 2 == 0 else C["cream"]}"/>' for i in range(8))
    return (f'<g transform="translate({x} {y}) scale({s})">'
            f'<rect x="-190" y="-380" width="380" height="380" rx="8" fill="{C["rose2"]}"/>'
            f'<path d="M-210 -380 L0 -470 L210 -380 Z" fill="{C["bark"]}"/>'
            f'<rect x="-60" y="-160" width="120" height="160" rx="60" fill="{C["forest"]}"/>'
            f'<circle cx="34" cy="-80" r="6" fill="{C["honey"]}"/>'
            f'<rect x="-160" y="-300" width="90" height="70" rx="6" fill="{C["honey"]}" opacity=".9"/><rect x="70" y="-300" width="90" height="70" rx="6" fill="{C["honey"]}" opacity=".9"/>'
            f'<path d="M-115 -300 L-115 -230 M-160 -265 L-70 -265 M115 -300 L115 -230 M70 -265 L160 -265" stroke="{C["bark"]}" stroke-width="4"/>'
            f'{stripes}'
            f'<rect x="-90" y="-350" width="180" height="36" rx="18" fill="{C["cream"]}"/>'
            f'<text x="0" y="-325" text-anchor="middle" font-family="Literata, Georgia, serif" font-style="italic" font-size="24" fill="{C["bark"]}">Mókusch</text>'
            f'</g>')


def frame(x, y, w, h, inner):
    return (f'<g transform="translate({x} {y})"><rect x="-8" y="-8" width="{w+16}" height="{h+16}" rx="6" fill="{C["ochre"]}"/>'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="3" fill="{C["cream"]}"/>{inner}</g>')


PAPER_DEFS = (
    '<defs>'
    '<filter id="pc" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#2b1d12" flood-opacity=".28"/></filter>'
    '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 .07 0"/></filter>'
    '<radialGradient id="glow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF6DD" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6DD" stop-opacity="0"/></radialGradient>'
    '</defs>')


def layer(d, body, extra=""):
    return f'<g class="ly" data-d="{d}" filter="url(#pc)"{extra}>{body}</g>'


def svg_wrap(key, inner, sky, label, slice_=True):
    par = "xMidYMid slice" if slice_ else "xMidYMid meet"
    return (f'<svg class="scene scene--{key}" viewBox="0 0 {W} {H}" preserveAspectRatio="{par}" role="img" aria-label="{label}">'
            f'{PAPER_DEFS}<rect width="{W}" height="{H}" fill="{sky}"/>'
            f'<ellipse cx="{W/2}" cy="{H*0.36}" rx="{W*0.45}" ry="{H*0.42}" fill="url(#glow)"/>'
            f'{inner}<rect width="{W}" height="{H}" filter="url(#grain)" opacity=".9" pointer-events="none"/></svg>')


def forest_back(seed, palette="day"):
    p = {"day": (C["sage2"], C["sage"], C["olive"], C["moss"]),
         "dusk": ("#C9B7A0", "#A99A80", C["moss"], C["forest"]),
         "rose": (C["rose2"], C["rose"], C["sage"], C["olive"])}[palette]
    r = random.Random(seed)
    far = hills(560, 120, 7, seed, p[0])
    trees_far = "".join(pine(r.uniform(0, W), r.uniform(560, 610), r.uniform(150, 230), p[1]) for _ in range(14))
    mid = hills(660, 90, 6, seed + 1, p[1])
    trees_mid = "".join((pine if r.random() < .6 else lambda x, b, h, f: round_tree(x, b, h, f, C["bark"]))(r.uniform(-50, W + 50), r.uniform(680, 720), r.uniform(240, 330), p[2]) for _ in range(9))
    return layer(0.15, far + trees_far), layer(0.3, mid + trees_mid), p


def scene(key):
    r = random.Random(hash(key) % 1000)
    if key == "osveny":  # nyitó: erdei ösvény a Mókusch-táblával, mókus a domboldalon
        a, b, p = forest_back(3, "day")
        near = hills(770, 60, 5, 8, C["moss"])
        path = f'<path d="M700 {H} C 760 820, 860 790, 820 740 C 790 710, 860 690, 900 680 L940 682 C 900 700, 870 720, 900 750 C 940 800, 900 850, 980 {H} Z" fill="{C["honey"]}" opacity=".85"/>'
        sign = (f'<g transform="translate(1000 780) scale(1.35)"><rect x="-6" y="-120" width="12" height="130" fill="{C["bark"]}"/>'
                f'<rect x="-110" y="-150" width="220" height="64" rx="12" fill="{C["bark2"]}"/>'
                f'<text x="0" y="-108" text-anchor="middle" font-family="Literata, Georgia, serif" font-style="italic" font-size="36" fill="{C["cream"]}">Mókusch</text></g>')
        front = (fern(150, H, 1.5, C["forest"]) + fern(1460, H, 1.4, C["forest"], True) + mushroom(330, 880, 2.6, C["berry"]) + mushroom(420, 890, 1.6, C["ochre"]) +
                 mushroom(1300, 890, 2.0, C["berry"]))
        inner = a + b + layer(0.45, near + path) + layer(0.55, sign + squirrel(1200, 520, 2.3, cls="sq hero-sq")) + layer(0.8, front)
        return svg_wrap(key, inner, C["sky"], "Rajzolt jelenet: erdei ösvény Mókusch feliratú táblával és egy mókussal")
    if key == "udvar":  # kávézó homlokzat lámpással
        a, b, p = forest_back(5, "dusk")
        inner = (a + b + layer(0.4, hills(800, 30, 4, 9, C["moss"]) + cafe_front(800, 800, 1.05)) +
                 layer(0.6, lantern(480, 330, 1.4) + lantern(1120, 330, 1.4) + squirrel(1000, 640, 1.4, flip=True)) +
                 layer(0.85, fern(120, H, 1.3, C["forest"]) + fern(1500, H, 1.2, C["forest"], True)) + stars(4, 30, C["cream"]))
        return svg_wrap(key, inner, "#E3CDB3", "Rajzolt jelenet: a Mókusch kis kávézója lámpásokkal az erdő szélén")
    if key in ("bolt", "kepek"):  # mindennapok: pult csészével és tortával
        a, b, p = forest_back(7, "rose")
        counter = f'<rect x="200" y="700" width="1200" height="220" rx="16" fill="{C["bark2"]}"/><rect x="180" y="680" width="1240" height="34" rx="10" fill="{C["bark"]}"/>'
        inner = (a + b + layer(0.45, counter) + layer(0.6, cup(520, 610, 1.9) + cake(1070, 690, 1.4) + squirrel(720, 500, 1.6)) +
                 layer(0.85, fern(80, H, 1.2, C["forest"]) + fern(1530, H, 1.1, C["forest"], True)))
        return svg_wrap(key, inner, C["rose2"], "Rajzolt jelenet: pult egy gőzölgő csészével és egy virágos tortával")
    if key in ("pult1", "pult2", "finom"):  # finomságok
        a, b, p = forest_back(11, "day")
        table = f'<ellipse cx="800" cy="760" rx="560" ry="80" fill="{C["bark2"]}"/><rect x="760" y="760" width="80" height="160" fill="{C["bark"]}"/>'
        cookies = "".join(f'<circle cx="{x}" cy="{y}" r="22" fill="{C["ochre"]}"/><circle cx="{x-6}" cy="{y-4}" r="3" fill="{C["bark"]}"/><circle cx="{x+7}" cy="{y+5}" r="3" fill="{C["bark"]}"/>' for x, y in [(1060, 712), (1110, 722), (1084, 690)])
        plate = f'<ellipse cx="1090" cy="728" rx="90" ry="16" fill="{C["cream"]}"/>'
        inner = a + b + layer(0.45, table) + layer(0.6, cup(560, 650, 1.7, C["rose2"]) + f'<g transform="translate(-60 -20) scale(1.25) translate(-220 -150)">' + plate + cookies + '</g>' + cake(880, 740, 0.95, candle=False)) + layer(0.85, fern(120, H, 1.2, C["forest"]) + mushroom(1420, 880, 1.4, C["berry"]))
        return svg_wrap(key, inner, C["sky"], "Rajzolt jelenet: kávéscsésze, kekszek és egy kis torta egy kerek asztalon")
    if key == "konyha":  # boszorkánykonyha: üst
        a, b, p = forest_back(13, "dusk")
        herbs = "".join(f'<g transform="translate({x} 120)"><path d="M0 0 L0 60" stroke="{C["ink"]}" stroke-width="3"/>' + "".join(
            f'<ellipse cx="{dx}" cy="{60+dy}" rx="8" ry="16" fill="{col}" transform="rotate({rot} {dx} {60+dy})"/>' for dx, dy, rot in [(-8, 10, -20), (8, 12, 20), (0, 26, 0), (-6, 36, -10), (6, 38, 10)]) + '</g>'
            for x, col in [(380, C["olive"]), (480, C["sage"]), (1140, C["olive"]), (1240, C["berry2"])])
        fire = f'<g class="fire"><path d="M700 860 C 720 790, 760 800, 770 760 C 790 800, 820 790, 830 760 C 850 800, 900 800, 900 860 Z" fill="{C["ochre"]}"/><path d="M740 860 C 760 820, 780 830, 790 800 C 810 830, 840 830, 860 860 Z" fill="{C["honey"]}"/></g>'
        inner = a + b + layer(0.35, herbs) + layer(0.5, hills(840, 20, 3, 4, C["bark"]) + fire + pot(800, 650, 1.35)) + layer(0.7, squirrel(1090, 600, 1.6, flip=True)) + layer(0.85, fern(150, H, 1.3, C["forest"]) + fern(1460, H, 1.3, C["forest"], True))
        return svg_wrap(key, inner, "#E2CFB4", "Rajzolt jelenet: gőzölgő üst tűz fölött, szárított gyógynövények lógnak fölötte")
    if key in ("polc1", "polc2"):  # nyuszis polc
        a, b, p = forest_back(17, "rose")
        items1 = jar(40, 110, 70, C["honey"], C["berry"]) + jar(130, 140, 80, C["rose"], C["bark"]) + bunny(330, 1.1, C["cream"]) + jar(430, 90, 66, C["sage"], C["berry"]) + f'<g transform="translate(620 0)">{teapot(0, 0, 1.2)}</g>' + jar(720, 120, 74, C["ochre"], C["bark"])
        items2 = jar(60, 90, 64, C["berry2"], C["bark"]) + jar(150, 120, 70, C["honey"], C["olive"]) + books(400, 0, 0.8) + jar(560, 100, 70, C["rose"], C["berry"]) + jar(660, 130, 76, C["sage2"], C["bark"])
        inner = (a + b + layer(0.45, f'<rect x="0" y="0" width="{W}" height="{H}" fill="{C["rose2"]}" opacity=".55"/>') +
                 layer(0.6, '<g transform="translate(-180 -150) scale(1.22)">' + shelf(380, 470, 840, items1) + shelf(380, 760, 840, items2) + '</g>') + layer(0.8, squirrel(1250, 260, 1.4, flip=True)))
        return svg_wrap(key, inner, C["rose2"], "Rajzolt jelenet: két fa polc befőttesüvegekkel, egy teáskannával, könyvekkel és egy nyuszival")
    if key == "olvaso":  # akármicsodák: olvasósarok
        a, b, p = forest_back(19, "dusk")
        inner = (a + b + layer(0.4, f'<rect x="0" y="0" width="{W}" height="{H}" fill="{C["forest"]}" opacity=".55"/>' + stars(9, 40, C["honey"])) +
                 layer(0.55, lamp(500, 860, 1.4) + armchair(860, 860, 1.4)) + layer(0.7, books(1230, 860, 1.6) + squirrel(1150, 520, 1.5, fg=C["ochre"], eye=C["ink"])) +
                 layer(0.85, fern(120, H, 1.2, C["moss"])))
        return svg_wrap(key, inner, C["forest"], "Rajzolt jelenet: olvasósarok zöld fotellel, állólámpával és egy könyvhalommal")
    if key == "posta":  # palackposta
        sea = waves(600, C["sage"], 2) + waves(680, C["olive"], 3, 22)
        inner = (layer(0.15, hills(560, 140, 6, 21, C["sage2"])) + layer(0.3, sea) + layer(0.55, bottle(800, 520, 2.0)) +
                 layer(0.75, waves(780, C["moss"], 5, 26)) + layer(0.9, squirrel(1230, 560, 1.6, flip=True) + mushroom(260, 890, 2.2, C["berry"])))
        return svg_wrap(key, inner, C["sky"], "Rajzolt jelenet: levelet rejtő palack a hullámokon")
    if key in ("kepfal", "torta"):  # torták és romantika
        hearts = "".join(f'<path d="M{x} {y} c -10 -14, -32 -2, 0 22 c 32 -24, 10 -36, 0 -22 Z" fill="{C["rose"]}" opacity=".7"/>' for x, y in [(300, 220), (1310, 260), (420, 420), (1180, 140), (1380, 470)])
        garland = "".join(f'<circle cx="{x}" cy="{90 + 30*math.sin(x/120)}" r="10" fill="{[C["rose"], C["cream"], C["honey"]][i%3]}"/>' for i, x in enumerate(range(60, 1560, 70)))
        inner = (layer(0.15, f'<path d="M0 90 C 400 160, 1200 160, {W} 90" stroke="{C["cream"]}" stroke-width="3" fill="none"/>' + garland + hearts) +
                 layer(0.35, hills(780, 40, 5, 31, C["berry"])) + layer(0.6, cake(800, 820, 1.6)) +
                 layer(0.8, squirrel(1150, 600, 1.6, flip=True) + fern(150, H, 1.2, C["berry2"]) + fern(1470, H, 1.2, C["berry2"], True)))
        return svg_wrap(key, inner, C["berry2"], "Rajzolt jelenet: háromszintes virágos torta égő gyertyával, füzérrel és szívekkel")
    # tartalék
    a, b, p = forest_back(1, "day")
    return svg_wrap(key, a + b, C["sky"], "Rajzolt erdei jelenet")


KEYS = ["osveny", "udvar", "bolt", "pult1", "pult2", "konyha", "polc1", "polc2", "olvaso", "posta", "kepfal"]

if __name__ == "__main__":
    import sys, os
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for k in KEYS:
        s = scene(k).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
        open(os.path.join(out, k + ".svg"), "w").write(s)
    print("ok", len(KEYS))
