"""Műhelytábla 80×55 cm (fekvő) + 3 mm kifutó, a végleges éjkék–arany logóval.
Tartalom a régi tábla alapján: név, cím, telefon, nyitvatartás.
Helyi szerver kell a látványterv mappájában: python3 -m http.server 8765
python3 _forras/tabla.py  ->  nyomdai/tabla/
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "nyomdai", "tabla")
B = "http://localhost:8765/"
NAVY, GOLD, CREAM, MUTED = "#0E1B2C", "#C9A14F", "#F6F2EA", "#A9B4C2"
W, H, KI = 800, 550, 3  # mm, vágott méret + kifutó
LOGO_PNG = os.path.join(OUT, "_logo-8000.png")

FONT = f"""@font-face{{font-family:A;src:url({B}fonts/archivo-var.woff);font-weight:500 900;font-stretch:100% 125%}}"""
TEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>'
HELY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'


def tabla_html(logo_src):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONT}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:{W + 2 * KI}mm {H + 2 * KI}mm;margin:0}}
html,body{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.t{{width:{W + 2 * KI}mm;height:{H + 2 * KI}mm;position:relative;overflow:hidden;color:{CREAM};font-family:A;font-stretch:100%;
   background:radial-gradient(55% 75% at 26% 50%,#1C3251 0,#13243A 45%,{NAVY} 80%)}}
/* vékony arany keret a vágás alatt 22 mm-re (biztonsági zónán belül) */
.k{{position:absolute;left:{KI + 22}mm;top:{KI + 22}mm;right:{KI + 22}mm;bottom:{KI + 22}mm;border:1.6mm solid {GOLD};opacity:.9}}
.k::after{{content:"";position:absolute;inset:4mm;border:.6mm solid rgba(201,161,79,.45)}}
.logo{{position:absolute;left:{KI + 46}mm;top:50%;width:262mm;height:262mm;transform:translateY(-50%)}}
.v{{position:absolute;left:{KI + 334}mm;top:{KI + 70}mm;bottom:{KI + 70}mm;width:1.2mm;background:linear-gradient(180deg,#DDBB72,{GOLD} 50%,#B38B3A)}}
.j{{position:absolute;left:{KI + 362}mm;right:{KI + 44}mm;top:50%;transform:translateY(-50%)}}
.nev{{font-weight:820;font-size:82mm;line-height:.9;letter-spacing:.035em}}
.al{{font-weight:750;font-size:24mm;letter-spacing:.235em;color:{GOLD};margin-top:8mm;white-space:nowrap}}
.sor{{display:flex;align-items:center;gap:7mm}}
.sor svg{{flex:none;color:{GOLD}}}
.cim{{margin-top:22mm;font-weight:700;font-size:28mm;letter-spacing:.01em}}
.cim svg{{width:24mm;height:24mm}}
.tel{{margin-top:12mm;font-weight:800;font-size:34mm;letter-spacing:.02em;white-space:nowrap}}
.tel svg{{width:23mm;height:23mm}}
.ny{{margin-top:16mm;padding-top:12mm;border-top:.8mm solid rgba(201,161,79,.55)}}
.ny .c{{font-weight:750;font-size:17mm;letter-spacing:.22em;color:{GOLD};margin-bottom:5mm}}
.ny table{{border-collapse:collapse;font-size:27mm;font-weight:700}}
.ny td{{padding:1.5mm 0}}.ny td:first-child{{padding-right:16mm}}
.ny .z{{color:#C3CCD8}}
</style></head><body><div class="t">
<div class="k"></div>
<img class="logo" src="{logo_src}">
<div class="v"></div>
<div class="j">
  <div class="nev">KIRÁLY</div>
  <div class="al">AUTÓSZERVIZ KFT.</div>
  <div class="sor cim">{HELY}<span>Budai Nagy Antal u. 25.</span></div>
  <div class="sor tel">{TEL}<span>20/585-3234</span></div>
  <div class="ny"><div class="c">NYITVA</div>
    <table><tr><td>Hétfő–péntek</td><td>8–17</td></tr><tr class="z"><td>Szombat–vasárnap</td><td>ZÁRVA</td></tr></table>
  </div>
</div>
</div></body></html>"""


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(ROOT, "_tabla.html")
    with sync_playwright() as p:
        b = p.chromium.launch()
        # 1) logó 8000 px-es PNG-ként: 33 cm-en ~615 dpi, és nincs SVG-maszk-hiba a nyomdai RIP-ben
        svg = f"{B}arculat-kombi/VEGLEGES/2-kiraly-logo-ejkek-arany.svg?t"
        open(tmp, "w").write(f'<body style="margin:0;background:transparent"><img src="{svg}" style="display:block;width:8000px;height:8000px"></body>')
        pg = b.new_page(viewport={"width": 8000, "height": 8000}); pg.goto(B + "_tabla.html?logo"); pg.wait_for_timeout(1500)
        pg.screenshot(path=LOGO_PNG, omit_background=True); pg.close()
        logo = f"{B}nyomdai/tabla/_logo-8000.png"
        # 2) nyomdai PDF
        open(tmp, "w", encoding="utf-8").write(tabla_html(logo))
        pg = b.new_page(); pg.goto(B + "_tabla.html?pdf"); pg.wait_for_timeout(1500)
        pg.pdf(path=os.path.join(OUT, f"kiraly-tabla-80x55cm-nyomdai-{W + 2 * KI}x{H + 2 * KI}mm.pdf"),
               width=f"{W + 2 * KI}mm", height=f"{H + 2 * KI}mm", print_background=True)
        pg.close()
        # 3) előnézet PNG (vágott méret), 1 mm = 3 px
        z = 3 * 96 / 25.4 / (96 / 25.4)  # 3 px / mm
        pxmm = 96 / 25.4
        pg = b.new_page(viewport={"width": int((W + 2 * KI) * 3), "height": int((H + 2 * KI) * 3)})
        open(tmp, "w", encoding="utf-8").write(tabla_html(logo).replace('<body>', f'<body style="zoom:{3 / pxmm:.5f}">'))
        pg.goto(B + "_tabla.html?png"); pg.wait_for_timeout(1500)
        pg.screenshot(path=os.path.join(OUT, "kiraly-tabla-elonezet.png"), clip={"x": KI * 3, "y": KI * 3, "width": W * 3, "height": H * 3})
        pg.close()
        os.unlink(tmp)
        b.close()


if __name__ == "__main__":
    main()
