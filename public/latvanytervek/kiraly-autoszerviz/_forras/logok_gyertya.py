"""Gyújtógyertyás változatok: B) kör alakú, körbefutó felirattal; C) hatszög keresztezett kulcsokkal a gyertya mögött."""
import math, os
import logok_premium as LP
from logok_premium import P, txt, villaskulcs, svg, gyertya_tiszta
from logok_vegso import ring, arc_text

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "arculat-gyertya")
PAL = {"fekete-pezsgoarany": ("#0B0B0C", "#161618", "#D8BE84", "#F5F1E8"),
       "ejkek-arany": ("#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA")}


def kor(pn, gold, cream):
    g = f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 92, 2.2, gold) + ring(100, 100, 66, 1.2, gold)
    g += arc_text("KIRÁLY", "archivo", 79, 21, 760, 112, cream, True, .18, 100, 100)
    g += arc_text("AUTÓSZERVIZ · DUNAÚJVÁROS", "manrope", 79, 9.4, 800, None, gold, False, .2, 100, 100)
    g += gyertya_tiszta(100, 52, 96, cream, gold, "#8C9AAC")
    return g, (2, 2, 198, 198)


def hatszog_kulcs(pn, gold, cream):
    cx = cy = 100
    hx = lambda R: [(cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    g = f'<path d="{P(hx(98))}" fill="{pn}"/>' + f'<path d="{P(hx(91))}" fill="none" stroke="{gold}" stroke-width="2.4" stroke-linejoin="round"/>'
    g += villaskulcs(cx, 86, 82, -40, gold, 9) + villaskulcs(cx, 86, 82, 40, gold, 9)
    g += f'<rect x="{cx - 13}" y="44" width="26" height="80" fill="{pn}"/>'
    g += gyertya_tiszta(cx, 46, 72, cream, gold, "#8C9AAC")
    g += f'<rect x="52" y="128" width="96" height="1" fill="{gold}"/>'
    p1, _ = txt("KIRÁLY", "archivo", 19, 700, 112, .08, cx, 150, cream)
    p2, _ = txt("AUTÓSZERVIZ", "manrope", 6.6, 800, None, .42, cx, 162, "#B9C2CE")
    p3, _ = txt("DUNAÚJVÁROS", "manrope", 5.4, 700, None, .4, cx, 172, gold)
    return g + p1 + p2 + p3, (cx - 98 * math.cos(math.radians(30)), 2, cx + 98 * math.cos(math.radians(30)), 198)


def main():
    os.makedirs(OUT, exist_ok=True)
    for pal, (bg, pn, gold, cream) in PAL.items():
        for nev, fn in (("kor", kor), ("hatszog-kulcsok", hatszog_kulcs)):
            b, bb = fn(pn, gold, cream)
            open(os.path.join(OUT, f"{nev}-{pal}.svg"), "w").write(svg(b, bb, 16, None, "KIRÁLY Autószerviz – gyújtógyertyás embléma"))
            open(os.path.join(OUT, f"{nev}-{pal}.bg"), "w").write(bg)


if __name__ == "__main__":
    main()
