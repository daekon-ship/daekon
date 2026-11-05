"""Kombinált embléma: kör pecsét + keresztezett kulcsok + gyújtógyertya. -> arculat-kombi/"""
import math, os, shutil
from logok_premium import txt, villaskulcs, svg, gyertya_tiszta
from logok_vegso import ring, arc_text

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "arculat-kombi")
PAL = {"fekete-pezsgoarany": ("#0B0B0C", "#161618", "#D8BE84", "#F5F1E8"),
       "ejkek-arany": ("#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA")}


def plug(cx, top, H, col, spark, met, halo=None):
    g = ""
    if halo:  # sötét körvonal, hogy a gyertya tisztán elváljon a kulcsoktól
        for dx, dy in ((-2.2, 0), (2.2, 0), (0, -2.2), (0, 2.2), (-1.6, -1.6), (1.6, 1.6), (-1.6, 1.6), (1.6, -1.6)):
            g += f'<g transform="translate({dx} {dy})">' + gyertya_tiszta(cx, top, H, halo, halo, halo) + "</g>"
    return g + gyertya_tiszta(cx, top, H, col, spark, met)


def emblema(pn, gold, cream, kulcs_szin, variant="A"):
    cx = cy = 100
    if variant == "B":  # dupla külső gyűrű, belső kör nélkül
        g = f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 94, 2.2, gold) + ring(100, 100, 90.6, .8, gold) + ring(100, 100, 66, .9, gold)
    else:
        g = f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 93, 2.6, gold) + ring(100, 100, 66, 1.1, gold)
    g += arc_text("KIRÁLY", "archivo", 76, 19.5, 760, 112, cream, True, .22, 100, 100)  # az Á ékezete ne érjen a gyűrűhöz
    g += arc_text("AUTÓSZERVIZ · DUNAÚJVÁROS", "manrope", 79.5, 8.8, 800, None, gold, False, .22, 100, 100)
    # 20 · 08 két oldalt
    for x, s in ((21.5, "20"), (178.5, "08")):
        p, _ = txt(s, "manrope", 8.4, 800, None, .1, x, 103, gold)
        g += p
    # kulcsok, gyertya
    g += villaskulcs(cx, 101, 96, -42, kulcs_szin, 11) + villaskulcs(cx, 101, 96, 42, kulcs_szin, 11)
    g += plug(cx, 50, 92, cream, gold, "#8C9AAC", halo=pn)
    return g, (2, 2, 198, 198)


def vegleges():
    d = os.path.join(OUT, "VEGLEGES"); os.makedirs(d, exist_ok=True)
    bg, pn, gold, cream = PAL["fekete-pezsgoarany"]
    b, bb = emblema(pn, gold, cream, gold, "A")
    open(os.path.join(d, "1-kiraly-logo-fekete-pezsgoarany.svg"), "w").write(svg(b, bb, 0, None, "KIRÁLY Autószerviz – logó"))
    bg, pn, gold, cream = PAL["ejkek-arany"]
    b, bb = emblema(pn, gold, cream, cream, "B")
    open(os.path.join(d, "2-kiraly-logo-ejkek-arany.svg"), "w").write(svg(b, bb, 0, None, "KIRÁLY Autószerviz – logó"))


def main():
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    for pal, (bg, pn, gold, cream) in PAL.items():
        for v, ks in (("A-arany-kulcsok", gold), ("B-feher-kulcsok", cream)):
            b, bb = emblema(pn, gold, cream, ks)
            open(os.path.join(OUT, f"{v}-{pal}.svg"), "w").write(svg(b, bb, 16, None, "KIRÁLY Autószerviz – embléma"))
            open(os.path.join(OUT, f"{v}-{pal}.bg"), "w").write(bg)


if __name__ == "__main__":
    main()
    vegleges()
