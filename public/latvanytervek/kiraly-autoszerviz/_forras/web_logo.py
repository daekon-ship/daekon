"""A végleges fekete–pezsgőarany logó webes változatai a látványtervhez -> arculat-kombi/WEB/
- jel.svg            kis jel felirat nélkül (fejléc, favicon, profilkép-kicsi)
- fejlec-sotet.svg   jel + egyenes KIRÁLY / AUTÓSZERVIZ felirat sötét háttérre
- emblema.svg        a teljes, kör alakú végleges logó (lábléc)
python3 _forras/web_logo.py
"""
import os, shutil
from logok_premium import villaskulcs, svg
from logok_vegso import ring, horizontal
from logok_kombi import PAL, emblema, plug

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-kombi", "WEB")
bg, pn, gold, cream = PAL["fekete-pezsgoarany"]


def jel():
    """Felirat nélküli jel: gyűrű + keresztezett kulcsok + gyertya, két színnel (arany fém a gyertyán)."""
    inner = (villaskulcs(100, 101, 96, -42, gold, 11) + villaskulcs(100, 101, 96, 42, gold, 11)
             + plug(100, 50, 92, cream, gold, gold, halo=pn))
    g = (f'<circle cx="100" cy="100" r="98" fill="{pn}"/>' + ring(100, 100, 91, 4.2, gold)
         + f'<g transform="translate(100 100) scale(1.42) translate(-100 -100)">{inner}</g>')
    return g, (2, 2, 198, 198)


def main():
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    jb, jbb = jel()
    open(os.path.join(OUT, "jel.svg"), "w").write(svg(jb, jbb, 0, None, "KIRÁLY Autószerviz – jel"))
    hb, hbb = horizontal(jb, jbb, {"acc": gold}, cream, gold, city=False)
    open(os.path.join(OUT, "fejlec-sotet.svg"), "w").write(svg(hb, hbb, 1, None, "KIRÁLY Autószerviz"))
    eb, ebb = emblema(pn, gold, cream, gold, "A")
    open(os.path.join(OUT, "emblema.svg"), "w").write(svg(eb, ebb, 0, None, "KIRÁLY Autószerviz – logó"))


if __name__ == "__main__":
    main()
