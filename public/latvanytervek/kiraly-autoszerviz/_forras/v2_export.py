"""PNG-exportok, fejléc-bemutatók és ügyfél-összehasonlító kép az arculat-v2 SVG-kből."""
import os, glob, re
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V2 = os.path.join(ROOT, "arculat-v2")
BETU = os.path.join(ROOT, "fonts")
K = [("01-precision-tools", "01", "PRECISION TOOLS"), ("02-engineering", "02", "ENGINEERING"), ("03-technical-precision", "03", "TECHNICAL PRECISION")]


def vb(p):
    v = re.search(r'viewBox="([^"]+)"', open(p).read()).group(1).split()
    return float(v[2]), float(v[3])


def page(pg, html, w, h, out, transparent=False, scale=1):
    tmp = os.path.join(ROOT, "_forras", "_exp.html")
    open(tmp, "w").write(html)
    pg.set_viewport_size({"width": int(w), "height": int(h)})
    pg.goto("file://" + tmp); pg.wait_for_timeout(200)
    pg.screenshot(path=out, omit_background=transparent)
    os.unlink(tmp)


FONT = f"""<style>@font-face{{font-family:A;src:url(file://{BETU}/archivo-var.woff);font-weight:500 900;font-stretch:100% 125%}}
@font-face{{font-family:M;src:url(file://{BETU}/manrope-var.woff);font-weight:200 800}}*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:M}}</style>"""


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(device_scale_factor=1)
        # 1) nagy felbontású, átlátszó PNG minden SVG-ből
        for sv in sorted(glob.glob(V2 + "/0*/*.svg")):
            w, h = vb(sv)
            W = 2400 if sv.split("/")[-1].startswith("logo") else 1600
            H = W * h / w
            page(pg, f'<html><body style="margin:0;background:transparent"><img src="file://{sv}" style="display:block;width:{W}px;height:{H}px"></body></html>',
                 W, H, sv[:-4] + ".png", transparent=True)
        # 2) fejléc-bemutatók (asztali 1440 + mobil 390)
        for slug, num, nev in K:
            d = os.path.join(V2, slug, "bemutato")
            os.makedirs(d, exist_ok=True)
            for theme, bg, ink, logo in (("sotet", "#11161C", "#F4F5F6", "logo-sotet-hatterre.svg"), ("vilagos", "#FFFFFF", "#11161C", "logo-vilagos-hatterre.svg")):
                L = os.path.join(V2, slug, logo)
                nav = "".join(f'<span>{t}</span>' for t in ("Szolgáltatások", "Dízel", "Futómű", "Rólunk", "Elérhetőség"))
                html = f"""<html><head>{FONT}<style>body{{background:{bg};color:{ink}}}
                header{{height:88px;display:flex;align-items:center;justify-content:space-between;padding:0 120px;border-bottom:1px solid {'rgba(255,255,255,.1)' if theme=='sotet' else 'rgba(0,0,0,.1)'}}}
                header img{{height:54px}}nav{{display:flex;gap:34px;font:600 15px M;opacity:.75}}.cta{{background:#F26732;color:#11161C;font:700 15px M;padding:14px 20px;border-radius:3px}}
                .hero{{padding:90px 120px;font:640 46px/1.1 A;font-stretch:116%;max-width:900px}}</style></head><body>
                <header><img src="file://{L}"><nav>{nav}</nav><span class="cta">Hívás most</span></header><div class="hero">Precíz autójavítás.<br><span style="color:#F26732">Megbízható kezekben.</span></div></body></html>"""
                page(pg, html, 1440, 360, os.path.join(d, f"weboldal-fejlec-{theme}.png"))
                html = f"""<html><head>{FONT}<style>body{{background:{bg}}}header{{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid {'rgba(255,255,255,.1)' if theme=='sotet' else 'rgba(0,0,0,.1)'}}}
                header img{{height:40px}}.g{{display:flex;gap:8px}}.g i{{width:44px;height:44px;border-radius:3px;display:block}}</style></head><body>
                <header><img src="file://{L}"><div class="g"><i style="background:#F26732"></i><i style="border:1px solid {'rgba(255,255,255,.25)' if theme=='sotet' else 'rgba(0,0,0,.2)'}"></i></div></header></body></html>"""
                pg.set_viewport_size({"width": 390, "height": 140})
                tmp = os.path.join(ROOT, "_forras", "_exp.html"); open(tmp, "w").write(html)
                pg2 = b.new_page(device_scale_factor=2, viewport={"width": 390, "height": 65}); pg2.goto("file://" + tmp); pg2.wait_for_timeout(200)
                pg2.screenshot(path=os.path.join(d, f"mobil-fejlec-{theme}.png")); pg2.close(); os.unlink(tmp)
        # 3) ügyfélnek küldhető összehasonlító kép (álló, mobilon is olvasható)
        cards = ""
        for slug, num, nev in K:
            cards += f"""<section><div class="c"><b>{num}</b><span>{nev}</span></div>
            <div class="row"><div class="tile dark"><img src="file://{V2}/{slug}/logo-sotet-hatterre.svg"></div>
            <div class="tile light"><img src="file://{V2}/{slug}/logo-vilagos-hatterre.svg"></div></div></section>"""
        html = f"""<html><head>{FONT}<style>body{{background:#0D1116;color:#F4F5F6;width:1080px;padding:84px 72px 64px}}
        .top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid rgba(255,255,255,.14);padding-bottom:28px;margin-bottom:44px}}
        .top h1{{font:660 40px/1.1 A;font-stretch:116%}}.top p{{font:700 14px M;letter-spacing:.2em;text-transform:uppercase;color:#8B969F;text-align:right;line-height:1.6}}
        section{{margin-bottom:44px}}.c{{display:flex;gap:16px;align-items:baseline;margin-bottom:16px}}.c b{{font:700 18px M;color:#F26732;letter-spacing:.1em}}.c span{{font:700 18px M;letter-spacing:.22em}}
        .row{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}.tile{{height:260px;display:grid;place-items:center;padding:36px}}.tile img{{width:100%;max-height:170px;object-fit:contain}}
        .dark{{background:#11161C;border:1px solid rgba(255,255,255,.1)}}.light{{background:#F4F5F2}}
        .foot{{display:flex;justify-content:space-between;font:600 14px M;color:#8B969F;letter-spacing:.06em;border-top:1px solid rgba(255,255,255,.14);padding-top:24px}}</style></head><body>
        <div class="top"><h1>KIRÁLY Autószerviz<br>logókoncepciók</h1><p>Arculati terv<br>2026 · DAEKON</p></div>{cards}
        <div class="foot"><span>Jóváhagyásra váró tervek</span><span>daekon.hu</span></div></body></html>"""
        tmp = os.path.join(ROOT, "_forras", "_exp.html"); open(tmp, "w").write(html)
        pg3 = b.new_page(device_scale_factor=2, viewport={"width": 1080, "height": 1000}); pg3.goto("file://" + tmp); pg3.wait_for_timeout(300)
        pg3.screenshot(path=os.path.join(V2, "kiraly-logokoncepciok-osszehasonlitas.png"), full_page=True); pg3.close(); os.unlink(tmp)
        b.close()


if __name__ == "__main__":
    main()
