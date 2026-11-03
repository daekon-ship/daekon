"""Mind a 6 logó több színvilágban -> arculat-szinek/<paletta>/kiraly-N-{vilagos,sotet}.svg/.png + összesítő képek.
python3 _forras/szinvariaciok.py
"""
import os, shutil, itertools, glob, re
from logok import jel1, jel2, jel3, jel_emelo, jel_anya, lockup, svg
from logok_v2 import sym_dial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-szinek")

# paletta: sötét alap, világos alap, kiemelő, fém (sötéten / világoson), alcím (sötéten / világoson), város
PALETTAK = {
    "1-grafit-narancs": dict(nev="Grafit – narancs", dark="#11161C", light="#F4F5F2", ink_l="#11161C", ink_d="#F4F5F6",
                             acc="#F26732", met_l="#8B959E", met_d="#7C8792", sub_l="#4A5560", sub_d="#A6B0B8", city_l="#4A5560", city_d="#A6B0B8"),
    "2-ejkek-arany": dict(nev="Éjkék – arany", dark="#0E1B2C", light="#F6F2EA", ink_l="#0E1B2C", ink_d="#F6F2EA",
                          acc="#D2A64A", met_l="#7F8C9D", met_d="#6E7D91", sub_l="#46556A", sub_d="#B9C2CE", city_l="#8A7440", city_d="#D2A64A"),
    "3-versenyzold-sargarez": dict(nev="Versenyzöld – sárgaréz", dark="#0F2A24", light="#F3F1EA", ink_l="#0F2A24", ink_d="#F3F1EA",
                                   acc="#C9A15A", met_l="#7E918A", met_d="#6F8680", sub_l="#3F5A52", sub_d="#B7C6C0", city_l="#8C7140", city_d="#C9A15A"),
    "4-antracit-kiralypiros": dict(nev="Antracit – királypiros", dark="#17181B", light="#F5F4F2", ink_l="#17181B", ink_d="#F5F4F2",
                                   acc="#C8102E", met_l="#8D9096", met_d="#7A7E86", sub_l="#4E5157", sub_d="#AEB1B6", city_l="#4E5157", city_d="#AEB1B6"),
    "5-acelkek-sarga": dict(nev="Acélkék – jelzősárga", dark="#13202E", light="#F2F4F6", ink_l="#13202E", ink_d="#F2F4F6",
                            acc="#F2B705", met_l="#7F8E9E", met_d="#6C7D8F", sub_l="#435368", sub_d="#AFBBC8", city_l="#435368", city_d="#AFBBC8"),
}
NEVEK = {1: "Dugattyúkorona", 2: "Kulcskorona", 3: "Gyújtógyertya", 4: "Autóemelő", 5: "Mérőóra", 6: "Kormány-korona"}


def mark(n, ink, acc, met):
    if n == 1: return jel1(ink, acc, met)
    if n == 2: return jel2(ink, acc, met)
    if n == 3: return jel3(ink, acc, met)
    if n == 4: return jel_emelo(ink, acc, met)
    if n == 5: return sym_dial(dict(ink=ink, metal=met, accent=acc, ids=itertools.count(1)))
    return jel_anya(ink, acc)


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    for slug, p in PALETTAK.items():
        d = os.path.join(OUT, slug)
        os.makedirs(d)
        for n in range(1, 7):
            for tag, bg, ink, met, sub, city in (("vilagos", p["light"], p["ink_l"], p["met_l"], p["sub_l"], p["city_l"]),
                                                 ("sotet", p["dark"], p["ink_d"], p["met_d"], p["sub_d"], p["city_d"])):
                b, bb = lockup(*mark(n, ink, p["acc"], met), ink, sub, city=city)
                open(os.path.join(d, f"kiraly-{n}-{tag}.svg"), "w").write(svg(b, bb, 40, bg, f"KIRÁLY Autószerviz – {NEVEK[n]} – {p['nev']}"))
    render()


def render():
    from playwright.sync_api import sync_playwright
    def vb(path):
        v = re.search(r'viewBox="([^"]+)"', open(path).read()).group(1).split()
        return float(v[2]), float(v[3])
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page()
        tmp = os.path.join(ROOT, "_forras", "_sz.html")
        for sv in sorted(glob.glob(OUT + "/*/*.svg")):
            w, h = vb(sv)
            W = 1600; H = W * h / w
            open(tmp, "w").write(f'<html><body style="margin:0"><img src="file://{sv}" style="display:block;width:{W}px;height:{H}px"></body></html>')
            pg.set_viewport_size({"width": W, "height": int(round(H))})
            pg.goto("file://" + tmp); pg.wait_for_timeout(60)
            pg.screenshot(path=sv[:-4] + ".png")
        # összesítő: soronként egy logó, oszloponként egy paletta (sötét felül, világos alul)
        for tag in ("sotet", "vilagos"):
            head = "".join(f"<th>{p['nev']}</th>" for p in PALETTAK.values())
            rows = ""
            for n in range(1, 7):
                cells = "".join(f'<td><img src="file://{OUT}/{slug}/kiraly-{n}-{tag}.svg"></td>' for slug in PALETTAK)
                rows += f"<tr><th class=n>{n}<br><small>{NEVEK[n]}</small></th>{cells}</tr>"
            html = (f"<html><style>body{{margin:0;background:#fff;font:600 15px sans-serif;padding:24px}}table{{border-collapse:separate;border-spacing:10px}}"
                    f"th{{text-align:center;padding:6px;color:#222}}th.n{{width:120px;text-align:left;font-size:22px}}th.n small{{font-size:12px;color:#666}}"
                    f"td img{{width:300px;display:block}}</style><body><table><tr><th></th>{head}</tr>{rows}</table></body></html>")
            open(tmp, "w").write(html)
            pg.set_viewport_size({"width": 1760, "height": 900})
            pg.goto("file://" + tmp); pg.wait_for_timeout(500)
            pg.screenshot(path=os.path.join(OUT, f"osszesito-{tag}.png"), full_page=True)
        os.unlink(tmp)
        b.close()


if __name__ == "__main__":
    main()
