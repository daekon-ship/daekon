"""A 3 végleges logó 7 színvilágban + két nagy összesítő tabló (sötét, világos) -> arculat-vegso-szinek/"""
import os, shutil, glob, re
import logok_vegso as L
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-vegso-szinek")
FONTS = os.path.join(ROOT, "fonts")
PAL = [  # név, sötét, panel, kiemelő, világos, alcím világoson, alcím sötéten
    ("ejkek-arany", "Éjkék – arany", "#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA", "#3E4E66", "#C2CAD6"),
    ("versenyzold-sargarez", "Versenyzöld – sárgaréz", "#0F2A24", "#143630", "#C9A15A", "#F3F1EA", "#3F5A52", "#B7C6C0"),
    ("fekete-pezsgoarany", "Fekete – pezsgőarany", "#0B0B0C", "#161618", "#D8BE84", "#F5F1E8", "#4A4740", "#BDB8AE"),
    ("grafit-acelezust", "Grafit – acélezüst", "#16191D", "#1F2328", "#B9C1C9", "#F3F4F5", "#4E555D", "#B4BBC2"),
    ("petrol-rez", "Petrol – réz", "#0C2B33", "#123640", "#C48A5A", "#F4F0EA", "#3D5A61", "#B7C9CC"),
    ("tengereszkek-ezust", "Tengerészkék – ezüst", "#13294B", "#1A355E", "#C7CED6", "#F2F4F7", "#43567A", "#B6C2D3"),
    ("grafit-narancs", "Grafit – narancs", "#12161B", "#1B2128", "#F26732", "#F4F5F2", "#46505B", "#B4BCC4"),
]
ACC_VILAGOS = {"grafit-acelezust": "#7E8894", "tengereszkek-ezust": "#7A879C", "fekete-pezsgoarany": "#B39552"}
FORMAK = [("1", "Kör alakú szervizembléma", L.kor_emblema), ("2", "Precíziós műszer", L.muszer_emblema), ("3", "Szárnyas kormány", L.szarnyas_emblema)]


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    for slug, nev, dark, panel, acc, light, sub_l, sub_d in PAL:
        d = os.path.join(OUT, slug); os.makedirs(d)
        c = dict(dark=dark, panel=panel, acc=acc, light=light, ink_l=dark, sub_l=sub_l, ink_d=light, sub_d=sub_d, metal="#9AA3AC", nev=nev)
        for num, fnev, fn in FORMAK:
            for tag, dk in (("sotet-hatterre", True), ("vilagos-hatterre", False)):
                cc = dict(c)
                if not dk and slug in ACC_VILAGOS:
                    cc["acc"] = ACC_VILAGOS[slug]
                body, bb = fn(cc, dk)
                open(os.path.join(d, f"{num}-{tag}.svg"), "w").write(L.svg(body, bb, 6, f"KIRÁLY Autószerviz – {fnev} – {nev}"))
    tmp = os.path.join(ROOT, "_forras", "_vsz.html")
    font = (f"@font-face{{font-family:A;src:url(file://{FONTS}/archivo-var.woff);font-weight:500 900;font-stretch:100% 125%}}"
            f"@font-face{{font-family:M;src:url(file://{FONTS}/manrope-var.woff);font-weight:200 800}}")
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        for sv in sorted(glob.glob(OUT + "/*/*.svg")):
            v = re.search(r'viewBox="([^"]+)"', open(sv).read()).group(1).split(); w, h = float(v[2]), float(v[3])
            W = 1600; H = W * h / w
            open(tmp, "w").write(f'<html><body style="margin:0;background:transparent"><img src="file://{sv}" style="display:block;width:{W}px;height:{H}px"></body></html>')
            pg.set_viewport_size({"width": W, "height": int(round(H))}); pg.goto("file://" + tmp); pg.wait_for_timeout(40)
            pg.screenshot(path=sv[:-4] + ".png", omit_background=True)
        for tag, title in (("sotet-hatterre", "sötét háttéren"), ("vilagos-hatterre", "világos háttéren")):
            head = "".join(f"<th>{n}</th>" for _, n, _ in FORMAK)
            rows = ""
            for slug, nev, dark, panel, acc, light, *_ in PAL:
                bg = dark if tag.startswith("sotet") else light
                cells = "".join(f'<td style="background:{bg}"><img src="file://{OUT}/{slug}/{num}-{tag}.svg"></td>' for num, _, _ in FORMAK)
                dots = "".join(f'<i style="background:{x}"></i>' for x in (dark, acc, light))
                rows += f'<tr><th class="p"><span>{dots}</span>{nev}</th>{cells}</tr>'
            html = f"""<html><head><style>{font}*{{margin:0;box-sizing:border-box}}
            body{{background:#F2F0EB;font-family:M;color:#14171B;padding:70px 64px 56px;width:2000px}}
            .top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #14171B;padding-bottom:26px;margin-bottom:30px}}
            h1{{font:680 44px/1.05 A;font-stretch:114%}}.top p{{font:700 14px/1.7 M;letter-spacing:.22em;text-transform:uppercase;color:#5B6066;text-align:right}}
            table{{border-collapse:separate;border-spacing:14px;margin:0 -14px}}th{{font:700 15px M;letter-spacing:.16em;text-transform:uppercase;color:#5B6066;padding:4px 0 8px}}
            th.p{{text-align:left;width:250px;font:700 17px M;letter-spacing:.02em;text-transform:none;color:#14171B}}th.p span{{display:flex;gap:6px;margin-bottom:10px}}
            th.p i{{width:20px;height:20px;border-radius:50%;display:block;border:1px solid rgba(0,0,0,.15)}}
            td{{width:540px;height:400px;text-align:center;vertical-align:middle;padding:34px}}td img{{max-width:100%;max-height:330px}}
            .foot{{display:flex;justify-content:space-between;border-top:1px solid #14171B;padding-top:20px;margin-top:16px;font:600 15px M;color:#5B6066}}</style></head><body>
            <div class="top"><h1>KIRÁLY Autószerviz – logók hét színvilágban</h1><p>{title}<br>2026 · DAEKON</p></div>
            <table><tr><th></th>{head}</tr>{rows}</table><div class="foot"><span>Jóváhagyásra váró tervek</span><span>daekon.hu</span></div></body></html>"""
            open(tmp, "w").write(html)
            p2 = b.new_page(device_scale_factor=2, viewport={"width": 2000, "height": 1000})
            p2.goto("file://" + tmp); p2.wait_for_timeout(800)
            p2.screenshot(path=os.path.join(OUT, f"kiraly-logok-7-szin-{tag}.png"), full_page=True); p2.close()
        os.unlink(tmp); b.close()


if __name__ == "__main__":
    main()
