"""Három új embléma a kedvelt elemekből (keresztezett kulcsok, kormány+kulcs). -> arculat-uj3/"""
import math, os, shutil
import logok_premium as LP
from logok_premium import P, txt, villaskulcs, kormany, shield_path, svg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-uj3")
LP.KORONA[0] = False


def place(body, bb, cx, cy, h):
    k = h / (bb[3] - bb[1])
    return f'<g transform="translate({cx - (bb[0] + bb[2]) / 2 * k:.2f} {cy - (bb[1] + bb[3]) / 2 * k:.2f}) scale({k:.4f})">{body}</g>'


def felirat(cx, y, txtc, sub, gold, size=19):
    p1, _ = txt("KIRÁLY", "archivo", size, 700, 112, .08, cx, y, txtc)
    p2, _ = txt("AUTÓSZERVIZ", "manrope", size * .36, 800, None, .42, cx, y + size * .64, sub)
    p3, _ = txt("DUNAÚJVÁROS", "manrope", size * .28, 700, None, .4, cx, y + size * 1.2, gold)
    return p1 + p2 + p3


# A) Pajzs keresztezett kulcsokkal – a címer korona nélkül, kulcsokkal
def pajzs_kulcs(fill, gold, inner, txtc, sub):
    cx = 100
    sx, sy, sw, sh = cx - 70, 6, 140, 176
    g = f'<path d="{shield_path(sx, sy, sw, sh)}" fill="{fill}"/>'
    g += f'<path d="{shield_path(sx, sy, sw, sh, 7)}" fill="none" stroke="{gold}" stroke-width="2.6"/>'
    g += villaskulcs(cx, 66, 74, -38, inner, 10.5) + villaskulcs(cx, 66, 74, 38, inner, 10.5)
    g += f'<rect x="58" y="112" width="84" height="1.2" fill="{gold}"/>'
    g += felirat(cx, 138, txtc, sub, gold, 20)
    return g, (sx, sy, sx + sw, sy + sh)


# B) Kör: kormány, mögötte keresztezett kulcsok, körbefutó felirat
def kor_kormany_kulcs(fill, gold, inner, txtc):
    cx = cy = 100
    g = f'<circle cx="100" cy="100" r="98" fill="{fill}"/>'
    g += f'<circle cx="100" cy="100" r="92" fill="none" stroke="{gold}" stroke-width="2.6"/>'
    g += f'<circle cx="100" cy="100" r="64" fill="none" stroke="{gold}" stroke-width="1.3"/>'
    g += LP.ring_text("KIRÁLY AUTÓSZERVIZ", 72, 14.5, 800, txtc, True, .2)
    g += LP.ring_text("DUNAÚJVÁROS · 2008", 81.5, 11, 700, gold, False, .3)
    g += villaskulcs(cx, cy, 104, -45, gold, 11) + villaskulcs(cx, cy, 104, 45, gold, 11)
    g += f'<circle cx="{cx}" cy="{cy}" r="31" fill="{fill}"/>'
    k, kb = kormany(inner, gold)
    g += place(k, kb, cx, cy, 54)
    return g, (2, 2, 198, 198)


# C) Csavaranya (hatszög) keresztezett kulcsokkal, középen a név sávban
def anya_kulcs(fill, gold, inner, txtc, sub):
    cx, cy = 100, 100
    hx = lambda R: [(cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))) for a in range(0, 360, 60)]
    g = f'<path d="{P(hx(98))}" fill="{fill}"/>'
    g += f'<path d="{P(hx(91))}" fill="none" stroke="{gold}" stroke-width="2.6" stroke-linejoin="round"/>'
    g += villaskulcs(cx, 92, 100, -42, inner, 11) + villaskulcs(cx, 92, 100, 42, inner, 11)
    g += f'<rect x="22" y="112" width="156" height="38" fill="{fill}"/>'
    g += f'<rect x="22" y="112" width="156" height="1.2" fill="{gold}"/><rect x="22" y="149" width="156" height="1.2" fill="{gold}"/>'
    p1, _ = txt("KIRÁLY", "archivo", 22, 700, 112, .08, cx, 137, txtc)
    p2, _ = txt("AUTÓSZERVIZ · DUNAÚJVÁROS", "manrope", 6.4, 800, None, .32, cx, 146.4, gold)
    return g + p1 + p2, (cx - 98, cy - 98 * math.sin(math.radians(60)), cx + 98, cy + 98 * math.sin(math.radians(60)))


PAL = {"ejkek-arany": ("#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA"),
       "fekete-pezsgoarany": ("#0B0B0C", "#161618", "#D8BE84", "#F5F1E8"),
       "versenyzold-sargarez": ("#0F2A24", "#143630", "#C9A15A", "#F3F1EA"),
       "petrol-rez": ("#0C2B33", "#123640", "#C48A5A", "#F4F0EA")}


def main():
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    for pal, (bg, panel, gold, cream) in PAL.items():
        for n, fn in (("A-pajzs-kulcsok", lambda: pajzs_kulcs(panel, gold, cream, cream, "#C2CAD6")),
                      ("B-kor-kormany-kulcsok", lambda: kor_kormany_kulcs(panel, gold, cream, cream)),
                      ("C-anya-kulcsok", lambda: anya_kulcs(panel, gold, cream, cream, "#C2CAD6"))):
            b, bb = fn()
            open(os.path.join(OUT, f"{n}-{pal}.svg"), "w").write(svg(b, bb, 20, bg, "KIRÁLY Autószerviz – embléma"))


if __name__ == "__main__":
    main()
