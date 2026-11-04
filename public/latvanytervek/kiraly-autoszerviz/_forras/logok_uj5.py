"""5 új logó a kör-embléma és a szárnyas kormány irányából, egy-egy színben -> arculat-uj5/"""
import math, os, shutil
import logok_premium as LP
import logok_vegso as LV
from logok_premium import P, txt, villaskulcs, svg
from logok_vegso import ring, circ, kormany, kulcs_szarny, wordmark, arc_text

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-uj5")
C = {"ejkek": ("#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA", "#C2CAD6"),
     "petrol": ("#0C2B33", "#123640", "#C48A5A", "#F4F0EA", "#B7C9CC"),
     "fekete": ("#0B0B0C", "#161618", "#D8BE84", "#F5F1E8", "#BDB8AE"),
     "zold": ("#0F2A24", "#143630", "#C9A15A", "#F3F1EA", "#B7C6C0")}


def kulcs_kullos_kormany(cx, cy, R, col, acc):
    """Kormány, amelynek három küllője villáskulcs (a pofa a peremnél)."""
    g = ring(cx, cy, R * .92, R * .11, col)
    for ang in (180, 0, 90):
        a = math.radians(ang)
        L = R * .8
        mx, my = cx + math.cos(a) * (L / 2 + R * .04), cy + math.sin(a) * (L / 2 + R * .04)
        g += villaskulcs(mx, my, L, ang + 90, col, R * .2)
    g += f'<circle cx="{cx}" cy="{cy}" r="{R * .17:.2f}" fill="{col}"/><circle cx="{cx}" cy="{cy}" r="{R * .07:.2f}" fill="{acc}"/>'
    return g


# 1) Kulcs-küllős kormány kör emblémában – éjkék–arany
def n1():
    bg, pn, acc, ink, sub = C["ejkek"]
    g = f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 92, 3, acc) + ring(100, 100, 64, 1.4, acc)
    g += arc_text("KIRÁLY", "archivo", 77, 21, 760, 112, ink, True, .18, 100, 100)
    g += arc_text("AUTÓSZERVIZ · DUNAÚJVÁROS", "manrope", 78, 9.6, 800, None, acc, False, .2, 100, 100)
    for a in (180, 0):
        g += f'<circle cx="{100 + 78 * math.cos(math.radians(a)):.2f}" cy="100" r="2.2" fill="{acc}"/>'
    g += kulcs_kullos_kormany(100, 100, 56, ink, acc)
    return g, (2, 2, 198, 198), bg


# 2) Szárnyas kör: a kulcsos kör embléma kulcs-szárnyakkal – petrol–réz
def n2():
    bg, pn, acc, ink, sub = C["petrol"]
    cx, cy = 150, 70
    g = ""
    for s in (-1, 1):
        g += kulcs_szarny(cx + s * 52, cy - 11, 96, 10.5, s, acc)
        g += kulcs_szarny(cx + s * 52, cy + 11, 72, 8.5, s, acc)
    g += f'<circle cx="{cx}" cy="{cy}" r="60" fill="{pn}"/>' + ring(cx, cy, 56, 3, acc)
    g += arc_text("KIRÁLY", "archivo", 45, 15, 760, 112, ink, True, .16, cx, cy)
    g += villaskulcs(cx, cy + 8, 56, -40, ink, 8.5) + villaskulcs(cx, cy + 8, 56, 40, ink, 8.5)
    wm, wb = wordmark(cx, 148, ink, sub, acc, 30, "c")
    return g + wm, (cx - 152, cy - 62, cx + 152, wb[3]), bg


# 3) Szalagos kör: keresztezett kulcsok, a KIRÁLY egy vízszintes szalagon – fekete–pezsgőarany
def n3():
    bg, pn, acc, ink, sub = C["fekete"]
    g = f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 92, 3, acc) + ring(100, 100, 85, 1.2, acc)
    g += villaskulcs(100, 92, 92, -42, ink, 12) + villaskulcs(100, 92, 92, 42, ink, 12)
    g += f'<path d="{P([(-6, 80), (206, 80), (196, 98), (206, 116), (-6, 116), (4, 98)])}" fill="{acc}"/>'
    p, _ = txt("KIRÁLY", "archivo", 27, 760, 112, .1, 100, 108, pn)
    g += p
    p2, _ = txt("AUTÓSZERVIZ", "manrope", 9.4, 800, None, .42, 100, 146, acc)
    p3, _ = txt("DUNAÚJVÁROS · 2008", "manrope", 6.4, 700, None, .3, 100, 158, sub)
    return g + p + p2 + p3, (-8, 2, 208, 198), bg


# 4) Kormány + keresztezett kulcsok kör, körbefutó felirattal – versenyzöld–sárgaréz
def n4():
    bg, pn, acc, ink, sub = C["zold"]
    g = f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 92, 3, acc) + ring(100, 100, 64, 1.4, acc)
    g += arc_text("KIRÁLY", "archivo", 77, 21, 760, 112, ink, True, .18, 100, 100)
    g += arc_text("AUTÓSZERVIZ · DUNAÚJVÁROS", "manrope", 78, 9.6, 800, None, acc, False, .2, 100, 100)
    g += villaskulcs(100, 100, 108, -45, acc, 11) + villaskulcs(100, 100, 108, 45, acc, 11)
    g += f'<circle cx="100" cy="100" r="30" fill="{pn}"/>' + kormany(100, 100, 26, ink, acc)
    return g, (2, 2, 198, 198), bg


# 5) Vízszintes: kulcs-szárnyas kormány balra, felirat jobbra – éjkék–arany
def n5():
    bg, pn, acc, ink, sub = C["ejkek"]
    c = dict(panel=pn, dark=bg, acc=acc, light=ink)
    m, mb = LV.szarnyas(c, True)
    k = 96 / (mb[3] - mb[1])
    mw = (mb[2] - mb[0]) * k
    g = f'<g transform="scale({k:.4f}) translate({-mb[0]:.2f} {-mb[1]:.2f})">{m}</g>'
    wm, wb = wordmark(mw + 30, 14, ink, sub, acc, 46, "l")
    return g + wm, (0, 0, wb[2], 96), bg


def main():
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    for i, (fn, nev) in enumerate([(n1, "kulcs-kullos-kormany-ejkek-arany"), (n2, "szarnyas-kor-petrol-rez"),
                                   (n3, "szalagos-kor-fekete-pezsgoarany"), (n4, "kormany-kulcsok-kor-versenyzold"),
                                   (n5, "vizszintes-szarnyas-kormany-ejkek-arany")], 1):
        b, bb, bg = fn()
        open(os.path.join(OUT, f"{i}-{nev}.svg"), "w").write(svg(b, bb, 14, None, "KIRÁLY Autószerviz – logóterv"))
        open(os.path.join(OUT, f"{i}-{nev}.bg"), "w").write(bg)


if __name__ == "__main__":
    main()
