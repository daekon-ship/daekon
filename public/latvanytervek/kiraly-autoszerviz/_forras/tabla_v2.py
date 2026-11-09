"""Műhelytábla 80×55 cm – két új irány (A: arany telefonsáv, B: krém–éjkék), nyomdai PDF + előnézet + falpróba.
Helyi szerver kell: python3 -m http.server 8765 (a látványterv mappájában), és előbb a tabla.py-nak
le kell gyártania a nyomdai/tabla/_logo-8000.png-t.
python3 _forras/tabla_v2.py  ->  nyomdai/tabla/
"""
import os
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
from tabla import FONT, TEL, HELY, NAVY, GOLD, CREAM, W, H, KI, B, OUT, ROOT

ORA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>'
FOTO = "/mnt/user-data/attachments/6b148991-afde-5494-ae47-8be068f16e3b/8b56676f-image.jpg"
CIM, TELSZAM = "Budai Nagy Antal u. 25.", "20/585-3234"


def alap(belso, extra_css):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONT}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:{W + 2 * KI}mm {H + 2 * KI}mm;margin:0}}
html,body{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.t{{width:{W + 2 * KI}mm;height:{H + 2 * KI}mm;position:relative;overflow:hidden;font-family:A;font-stretch:100%}}
.sor{{display:flex;align-items:center}}.sor svg{{flex:none}}
{extra_css}</style></head><body><div class="t">{belso}</div></body></html>"""


def valtozat_a(logo):
    """A – arany telefonsáv: felül logó + név + cím + nyitvatartás, alul teljes szélességű arany sáv a telefonszámmal."""
    sav = 178  # mm, az alsó arany sáv magassága (kifutóval együtt lent)
    css = f"""
.t{{background:radial-gradient(60% 90% at 22% 35%,#1C3251 0,#13243A 45%,{NAVY} 85%);color:{CREAM}}}
.logo{{position:absolute;left:{KI + 40}mm;top:{KI + 34}mm;width:300mm;height:300mm}}
.fent{{position:absolute;left:{KI + 372}mm;right:{KI + 40}mm;top:{KI + 44}mm}}
.nev{{font-weight:840;font-size:96mm;line-height:.86;letter-spacing:.03em}}
.al{{font-weight:760;font-size:27mm;letter-spacing:.215em;color:{GOLD};margin-top:9mm;white-space:nowrap}}
.adat{{margin-top:24mm;display:grid;gap:9mm}}
.adat .sor{{gap:9mm;font-weight:700;font-size:27mm;white-space:nowrap}}
.adat svg{{width:23mm;height:23mm;color:{GOLD}}}
.adat .zar{{color:#C3CCD8;font-size:23mm;margin-left:32mm;margin-top:-5mm}}
.sav{{position:absolute;left:0;right:0;bottom:0;height:{sav + KI}mm;background:linear-gradient(180deg,#DDBB72,{GOLD} 55%,#B9924A);
     display:flex;align-items:center;justify-content:center;gap:14mm;color:{NAVY};padding-bottom:{KI}mm}}
.sav svg{{width:56mm;height:56mm}}
.sav span{{font-weight:860;font-size:86mm;letter-spacing:.02em;line-height:1;white-space:nowrap}}
.sav::before{{content:"";position:absolute;left:0;right:0;top:0;height:2.2mm;background:{NAVY};opacity:.35}}
"""
    belso = f"""<img class="logo" src="{logo}">
<div class="fent"><div class="nev">KIRÁLY</div><div class="al">AUTÓSZERVIZ KFT.</div>
  <div class="adat"><div class="sor">{HELY}<span>{CIM}</span></div>
  <div class="sor">{ORA}<span>Hétfő–péntek 8–17</span></div>
  <div class="sor zar"><span>Szombat–vasárnap zárva</span></div></div></div>
<div class="sav">{TEL}<span>{TELSZAM}</span></div>"""
    return alap(belso, css)


def valtozat_b(logo):
    """B – krém–éjkék: balra világos krém mező sötét, nagy betűkkel (napfényben is olvasható), jobbra éjkék mező a logóval."""
    css = f"""
.t{{background:#F6F2EA;color:{NAVY}}}
.jobb{{position:absolute;top:0;bottom:0;right:0;width:{KI + 300}mm;background:radial-gradient(70% 60% at 50% 50%,#1C3251 0,#13243A 50%,{NAVY} 90%)}}
.jobb .logo{{position:absolute;left:50%;top:50%;width:250mm;height:250mm;transform:translate(-50%,-50%) translateX(-{KI / 2}mm)}}
.vonal{{position:absolute;top:0;bottom:0;right:{KI + 300}mm;width:5mm;background:linear-gradient(180deg,#DDBB72,{GOLD} 50%,#B38B3A)}}
.bal{{position:absolute;left:{KI + 46}mm;width:420mm;top:50%;transform:translateY(-50%)}}
.nev{{font-weight:860;font-size:94mm;line-height:.86;letter-spacing:.025em}}
.al{{font-weight:780;font-size:26.5mm;letter-spacing:.2em;color:#8A6A2C;margin-top:9mm;white-space:nowrap}}
.tel{{margin-top:22mm;gap:10mm}}
.tel svg{{width:36mm;height:36mm;color:#8A6A2C}}
.tel span{{font-weight:860;font-size:52mm;letter-spacing:.015em;white-space:nowrap}}
.adat{{margin-top:18mm;padding-top:14mm;border-top:1.2mm solid rgba(14,27,44,.18);display:grid;gap:7mm}}
.adat .sor{{gap:8mm;font-weight:700;font-size:25mm;white-space:nowrap}}
.adat svg{{width:21mm;height:21mm;color:#8A6A2C}}
.adat .zar{{color:#46556A;font-size:22mm;margin-left:29mm;margin-top:-4mm}}
"""
    belso = f"""<div class="vonal"></div><div class="jobb"><img class="logo" src="{logo}"></div>
<div class="bal"><div class="nev">KIRÁLY</div><div class="al">AUTÓSZERVIZ KFT.</div>
  <div class="sor tel">{TEL}<span>{TELSZAM}</span></div>
  <div class="adat"><div class="sor">{HELY}<span>{CIM}</span></div>
  <div class="sor">{ORA}<span>Hétfő–péntek 8–17</span></div>
  <div class="sor zar"><span>Szombat–vasárnap zárva</span></div></div></div>"""
    return alap(belso, css)


def falra(elonezet, cel):
    foto = Image.open(FOTO).convert("RGB")
    k = 1080 / 1032
    quad = [(272 * k, 347 * k), (751 * k, 349 * k), (749 * k, 690 * k), (284 * k, 694 * k)]
    t = Image.open(elonezet).convert("RGB"); w, h = t.size
    A, Bv = [], []
    for (x, y), (X, Y) in zip(quad, [(0, 0), (w, 0), (w, h), (0, h)]):
        A += [[x, y, 1, 0, 0, 0, -X * x, -X * y], [0, 0, 0, x, y, 1, -Y * x, -Y * y]]; Bv += [X, Y]
    c = np.linalg.solve(np.array(A, float), np.array(Bv, float)).tolist()
    warp = t.transform(foto.size, Image.PERSPECTIVE, c, Image.BICUBIC)
    mask = Image.new("L", (w, h), 255).transform(foto.size, Image.PERSPECTIVE, c, Image.BICUBIC)
    out = foto.copy(); out.paste(warp, (0, 0), mask)
    out.crop((int(66 * k), int(338 * k), int(966 * k), int(1536 * k))).save(cel, quality=90)


def main():
    tmp = os.path.join(ROOT, "_tabla2.html")
    logo = f"{B}nyomdai/tabla/_logo-8000.png"
    pxmm = 96 / 25.4
    with sync_playwright() as p:
        b = p.chromium.launch()
        for nev, fn in (("A-arany-telefonsav", valtozat_a), ("B-krem-ejkek", valtozat_b)):
            html = fn(logo)
            open(tmp, "w", encoding="utf-8").write(html)
            pg = b.new_page(); pg.goto(B + f"_tabla2.html?{nev}pdf"); pg.wait_for_timeout(1500)
            pg.pdf(path=os.path.join(OUT, f"kiraly-tabla-{nev}-80x55cm-nyomdai-{W + 2 * KI}x{H + 2 * KI}mm.pdf"),
                   width=f"{W + 2 * KI}mm", height=f"{H + 2 * KI}mm", print_background=True)
            pg.close()
            open(tmp, "w", encoding="utf-8").write(html.replace("<body>", f'<body style="zoom:{3 / pxmm:.5f}">'))
            pg = b.new_page(viewport={"width": int((W + 2 * KI) * 3), "height": int((H + 2 * KI) * 3)})
            pg.goto(B + f"_tabla2.html?{nev}png"); pg.wait_for_timeout(1500)
            el = os.path.join(OUT, f"kiraly-tabla-{nev}-elonezet.png")
            pg.screenshot(path=el, clip={"x": KI * 3, "y": KI * 3, "width": W * 3, "height": H * 3}); pg.close()
            falra(el, os.path.join(OUT, f"kiraly-tabla-{nev}-a-falon.jpg"))
        os.unlink(tmp)
        b.close()


if __name__ == "__main__":
    main()
