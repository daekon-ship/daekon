"""Tündérszem Optika – a tündér (Rackham-hangulatú sziluett, irizáló, erezett szárnyak).

Két póz: ülő (a hero szemüvegkeretén) és repülő (logójel, díszítés).
A rajzokat a rajzok.py hívja; önállóan is futtatható.
"""
import math, os

INK = "#263432"
PAPER = "#FAF6FA"
MIST = "#9CB9C6"
LAV = "#B8A3D8"
POWDER = "#E9C5D9"
GOLD = "#B8937A"


def f(x):
    s = f"{x:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def iri_defs(u):
    return (f'<linearGradient id="{u}iri" x1="0" y1="1" x2="1" y2="0">'
            f'<stop offset="0" stop-color="{MIST}" stop-opacity=".55"/>'
            f'<stop offset=".45" stop-color="{LAV}" stop-opacity=".42"/>'
            f'<stop offset=".8" stop-color="{POWDER}" stop-opacity=".5"/>'
            f'<stop offset="1" stop-color="#FFFFFF" stop-opacity=".35"/></linearGradient>'
            f'<linearGradient id="{u}iri2" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{LAV}" stop-opacity=".32"/>'
            f'<stop offset="1" stop-color="{MIST}" stop-opacity=".22"/></linearGradient>')


def sparkle(x, y, r, col=GOLD, op=1.0, cls=""):
    k = r * .22
    c = f' class="{cls}"' if cls else ""
    return (f'<path{c} d="M{f(x)} {f(y-r)} Q{f(x+k)} {f(y-k)} {f(x+r)} {f(y)} Q{f(x+k)} {f(y+k)} {f(x)} {f(y+r)} '
            f'Q{f(x-k)} {f(y+k)} {f(x-r)} {f(y)} Q{f(x-k)} {f(y-k)} {f(x)} {f(y-r)}Z" fill="{col}" opacity="{op}"/>')


def dust(p0, p1, p2, n=14, r0=3.2, col=GOLD, cls="dust"):
    """Tündérpor: csökkenő méretű csillámok és pöttyök egy ív mentén."""
    out = []
    for i in range(n):
        t = i / (n - 1)
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        size = r0 * (1 - t * .75)
        if i % 3 == 0:
            out.append(sparkle(x, y, size, col, .95 - t * .5, f"{cls} {cls}{i % 4}"))
        else:
            out.append(f'<circle class="{cls} {cls}{i % 4}" cx="{f(x)}" cy="{f(y)}" r="{f(size * .28)}" fill="{col}" opacity="{f(.8 - t * .5)}"/>')
    return "".join(out)


def wing(d, veins, fill, sw=.7, ink=INK):
    v = " ".join(veins)
    return (f'<path d="{d}" fill="{fill}" stroke="{ink}" stroke-width="{sw}"/>'
            f'<path d="{v}" stroke="{ink}" stroke-width="{sw*.55}" opacity=".7" fill="none"/>')


# ---------------------------------------------------------------- ülő tündér
# 120 × 160, a keret pereme az y = 110 vonalon; balra (a híd felé) néz, lefelé, a lencsébe.
SIT_BODY = ("M50 19.5 C45 19.5 41.5 22.5 41.5 27 L39.6 30.2 L41.6 31.2 L41.2 33 L42 34.4 "
            "C42.4 36.6 44.4 38 46.6 38 C47 40.5 47.2 43 46.6 45.5 C44.4 47 43 50.5 43.4 54.5 "
            "C43.8 57.6 45.6 59 46 61 C46.4 65 46 69 46.8 73 C47.6 79 44.6 86 40.4 91 "
            "C34 93 26 92.5 21 94.5 C17.6 96 16.8 100 18.6 103 C19.2 110 17 118 13.6 126 "
            "C17 127.5 20 126 23.5 128.4 C26.6 126.6 29.6 127.8 32.4 126.6 C33.6 121 35 114 36.8 110.6 "
            "L56 110.6 C60 114 61 122 59.4 131 C62.6 127 65.6 122 66.6 115 C67.4 108 64.8 101 62.6 96 "
            "C60.6 90 60 84 59.4 78 C58.8 72 58.6 66 59.6 60 C60.6 55 61 50 58.6 46.8 "
            "C59.4 43.6 59.2 39.6 58.2 34 C58.6 25 55.4 19.5 50 19.5Z")
SIT_HAIR = "M55.6 23.6 C63.4 29.6 65 40 62.6 50 C61.2 58 63.2 66 66.8 71 C60.8 68.6 58.4 60 58.6 52 C58.8 45 58.8 38 56 31Z"
SIT_ARM = ("M48 48 C44 56 38 70 30 84 C27 89 24 92 22 94 L24.6 95.6 C28 92.4 31.6 88.4 34.4 83.6 "
           "C40.8 72 46.4 60 50.8 51Z")
SIT_LEGS = ("M23.6 126 C22.6 134 22 142 19.6 150.4 C18.8 152 16.4 153 15.2 152.4 C16.6 151 18.4 150 18.6 148.4 "
            "C19.6 140 20 132 20.6 126Z "
            "M29.6 126 C29.2 134 27 141 24.6 147 C24 148.6 22.4 150 21.6 151.6 C24.4 151.2 26.4 149.2 27.4 147.4 "
            "C30.4 141 32.4 134 32.8 126Z")


def fairy_sit(u="ts", ink=INK, with_defs=True):
    g = []
    if with_defs:
        g.append(f"<defs>{iri_defs(u)}</defs>")
    g.append('<g transform="translate(2 4)">')
    g.append(wing("M60 47 C62 22 72 3 89 -3 C96 7 88 27 76 41 C70 47 64 50 60 48Z",
                  ["M60 47 Q72 26 86 2", "M61 46 Q76 34 88 12", "M62 46 Q72 40 82 26"], f"url(#{u}iri2)", .6, ink))
    g.append(wing("M60 53 C70 63 78 79 76 97 C66 97 61 82 59 70 C58 62 58 57 60 53Z",
                  ["M60 54 Q68 74 72 94", "M60 56 Q63 76 66 92"], f"url(#{u}iri2)", .6, ink))
    g.append(wing("M58 48 C70 20 96 2 117 3 C121 14 109 34 93 46 C81 54 67 54 58 50Z",
                  ["M58 49 Q84 22 115 5", "M59 49 Q88 32 110 20", "M60 50 Q84 42 100 36",
                   "M80 30 Q86 34 92 42", "M96 16 Q100 24 104 30"], f"url(#{u}iri)", .7, ink))
    g.append(wing("M58 53 C75 56 95 66 103 84 C93 91 77 83 67 71 C62 64 59 58 58 53Z",
                  ["M59 54 Q82 64 101 83", "M59 55 Q76 70 86 84", "M78 64 Q80 72 76 78"], f"url(#{u}iri)", .7, ink))
    g.append('</g>')
    g.append(f'<g fill="{ink}"><path d="{SIT_HAIR}"/><circle cx="57.6" cy="21.6" r="4.8"/>'
             f'<path d="{SIT_BODY}"/><path d="{SIT_ARM}"/><path d="{SIT_LEGS}"/></g>')
    g.append(sparkle(20.6, 95.4, 3.6, GOLD))
    g.append(dust((19, 99), (10, 112), (4, 138), 9, 2.6))
    return "\n".join(g)


# ---------------------------------------------------------------- repülő tündér
FLY_BODY = ("M108 20.5 C112.6 20.5 116 24 115.8 28.4 L117.8 30.6 L115.8 31.6 L116 33.2 "
            "C115 35.6 112.6 36.4 110.4 36 C109.8 38 108.6 39.6 106.8 40.8 "
            "C112 40.4 120 37 128.6 31.2 C130.6 30 132 30.6 131 32.2 C126 36.4 116 42.6 108 45.4 "
            "C104 48 99.4 51.8 94.6 55 C86 60 74 66 58 70 C46 73 32 78 20 84 "
            "C14 87 9 87 6 85.6 C10 84 14 82.4 18 80.6 C30 75 42 70 54 66 "
            "C66 62 76 58 82 54 C87 50.6 90.6 46.8 94 43.2 C97.6 40 100 36.6 101 33.2 C101 26 103.6 20.5 108 20.5Z")
FLY_HAIR = "M103 25.6 C96 22.6 87 23.6 79 28.4 C86.6 28.8 92.6 30.6 98 33 C93 35.6 88.6 39.6 85 44.6 C92 41 97.6 37.4 103 32.6Z"
FLY_SKIRT = "M88 54 C78 63 64 71 46 76 C56 78.4 66 77 74 73.6 C66 81 56 85.6 44 89.6 C61 89.6 78 81 92 60Z"


def fairy_fly(u="tf", ink=INK, with_defs=True, dust_trail=True, wash=True):
    g = []
    if with_defs and wash:
        g.append(f"<defs>{iri_defs(u)}</defs>")
    f1 = f"url(#{u}iri)" if wash else "none"
    f2 = f"url(#{u}iri2)" if wash else "none"
    g.append(wing("M95 40 C94 19 86 1 70 -5 C64 5 70 25 86 41Z", ["M94 40 Q84 18 72 -3", "M92 41 Q78 25 68 9"], f2, .6, ink))
    g.append(wing("M96 40 C92 18 76 2 56 0 C54 12 66 30 86 43Z",
                  ["M95 41 Q76 17 58 2", "M93 42 Q72 29 57 15", "M90 43 Q76 37 66 29", "M74 17 Q70 23 68 29"], f1, .7, ink))
    g.append(wing("M94 45 C82 46 66 52 58 64 C70 67 84 59 94 48Z", ["M93 46 Q74 51 61 62", "M92 47 Q80 55 70 61"], f1, .7, ink))
    g.append(f'<g fill="{ink}"><path d="{FLY_HAIR}"/><path d="{FLY_BODY}"/><path d="{FLY_SKIRT}"/></g>')
    g.append(sparkle(135, 29, 4.2, GOLD))
    if dust_trail:
        g.append(dust((8, 88), (-20, 98), (-46, 86), 9, 2.4))
    return "\n".join(g)


# ---------------------------------------------------------------- logójel (vastagabb, kis méretre)
def fairy_mark(ink="currentColor"):
    return (f'<g fill="none" stroke="{ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M96 40 C92 18 76 2 56 0 C54 12 66 30 86 43Z" fill="#B8A3D8" fill-opacity=".5"/>'
            f'<path d="M94 45 C82 46 66 52 58 64 C70 67 84 59 94 48Z" fill="#9CB9C6" fill-opacity=".5"/></g>'
            f'<g fill="{ink}"><path d="{FLY_HAIR}"/><path d="{FLY_BODY}"/><path d="{FLY_SKIRT}"/></g>'
            f'<path d="M138 21 Q139.6 26.4 145 28 Q139.6 29.6 138 35 Q136.4 29.6 131 28 Q136.4 26.4 138 21Z" fill="#B8937A"/>')


STYLE = ("<style>.dust{animation:tw 3.2s ease-in-out infinite}.dust1{animation-delay:.8s}.dust2{animation-delay:1.6s}"
         ".dust3{animation-delay:2.4s}@keyframes tw{0%,100%{opacity:1}50%{opacity:.2}}"
         "@media (prefers-reduced-motion:reduce){.dust{animation:none}}</style>")


def svg(vb, body):
    x, y, w, h = vb
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}" fill="none" '
            f'stroke-linecap="round" stroke-linejoin="round">{STYLE}\n{body}\n</svg>\n')


def write_all(out):
    with open(os.path.join(out, "tunder-ul.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg((0, -8, 124, 168), fairy_sit()))
    with open(os.path.join(out, "tunder-repul.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg((-52, -8, 196, 112), fairy_fly()))
    with open(os.path.join(out, "tunder-repul-vonal.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg((-52, -8, 196, 112), fairy_fly("tv", "#F7F1F7", True, True, True)))
    with open(os.path.join(out, "tunder-jel.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg((4, -4, 144, 94), fairy_mark("#263432")))


if __name__ == "__main__":
    write_all(os.path.join(os.path.dirname(__file__), "..", "img"))
