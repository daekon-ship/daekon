"""A két végleges logó PNG-i + a weboldal megosztási képe és telefonos ikonja.
Helyi szerver kell a látványterv mappájában: python3 -m http.server 8765
python3 _forras/vegleges_export.py
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = "http://localhost:8765/"
V = os.path.join(ROOT, "arculat-kombi", "VEGLEGES")
LOGOK = [("1-kiraly-logo-fekete-pezsgoarany", "#0B0B0C", "#F5F1E8"),
         ("2-kiraly-logo-ejkek-arany", "#0E1B2C", "#F6F2EA")]
TMP = os.path.join(ROOT, "_ve.html")


def shot(b, html, w, h, out, transparent=False, tag="x"):
    open(TMP, "w", encoding="utf-8").write(html)
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.goto(B + "_ve.html?" + tag); pg.wait_for_timeout(500)
    pg.screenshot(path=out, omit_background=transparent)
    pg.close()


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        for slug, dark, light in LOGOK:
            src = f"{B}arculat-kombi/VEGLEGES/{slug}.svg?{os.path.getmtime(os.path.join(V, slug + '.svg'))}"
            shot(b, f'<body style="margin:0;background:transparent"><img src="{src}" style="display:block;width:2000px;height:2000px"></body>',
                 2000, 2000, os.path.join(V, slug + "-atlatszo.png"), True, slug + "a")
            for bg, tag in ((dark, "sotet-hatter"), (light, "vilagos-hatter")):
                shot(b, f'<body style="margin:0;width:1600px;height:1200px;background:{bg};display:grid;place-items:center"><img src="{src}" style="width:780px;height:780px"></body>',
                     1600, 1200, os.path.join(V, f"{slug}-{tag}.png"), False, slug + tag)
        # megosztási kép és telefonos ikon (éjkék változat)
        em = f"{B}arculat-kombi/WEB/emblema-ejkek.svg?{os.path.getmtime(os.path.join(ROOT, 'arculat-kombi', 'WEB', 'emblema-ejkek.svg'))}"
        og = f'''<!doctype html><html><head><meta charset="utf-8"><style>@font-face{{font-family:A;src:url({B}fonts/archivo-var.woff);font-weight:500 900;font-stretch:100% 125%}}@font-face{{font-family:M;src:url({B}fonts/manrope-var.woff);font-weight:200 800}}
body{{margin:0;width:1200px;height:630px;background:radial-gradient(70% 90% at 22% 50%,#1A2D45 0,#0B1624 70%);display:flex;align-items:center;gap:70px;padding:0 90px;box-sizing:border-box;color:#F6F2EA;font-family:M}}
img{{width:380px;height:380px;filter:drop-shadow(0 30px 50px rgba(0,0,0,.55))}}
small{{font:800 15px M;letter-spacing:.24em;color:#C9A14F;text-transform:uppercase}}
h1{{font:740 62px/1.05 A;font-stretch:114%;margin:18px 0 22px}}p{{font:500 23px/1.5 M;color:#A9B4C2;margin:0;max-width:24ch}}
i{{display:block;width:60px;height:2px;background:#C9A14F;margin-top:30px}}</style></head>
<body><img src="{em}"><div><small>Dunaújváros · 2008 óta</small><h1>KIRÁLY<br>Autószerviz</h1><p>Dízelrendszer-javítás, 3D futóműállítás, diagnosztika – márkafüggetlenül.</p><i></i></div></body></html>'''
        shot(b, og, 1200, 630, os.path.join(ROOT, "img", "og-kiraly.png"), tag="og")
        shot(b, f'<body style="margin:0;width:180px;height:180px;background:#0E1B2C;display:grid;place-items:center"><img src="{em}" style="width:164px"></body>',
             180, 180, os.path.join(ROOT, "img", "apple-touch-icon.png"), tag="at")
        os.unlink(TMP)
        b.close()


if __name__ == "__main__":
    main()
