"""Végleges logók: átlátszó PNG-k, mérettesztek, mobilfejléc-próbák és az ügyfélbemutató kép."""
import os, glob, re
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(ROOT, "arculat-vegso")
FONTS = os.path.join(ROOT, "fonts")
K = [("1-kor-emblema", "01", "Kör alakú szervizembléma", "Éjkék · arany", ["#0E1B2C", "#C9A14F", "#F6F2EA"]),
     ("2-dugattyus-pajzs", "02", "Dugattyús pajzs", "Grafit · narancs", ["#12161B", "#F26732", "#F4F5F2"]),
     ("3-szarnyas-kormany", "03", "Szárnyas kormány", "Petrol · réz", ["#0C2B33", "#C48A5A", "#F4F0EA"])]
FONT = (f"<style>@font-face{{font-family:A;src:url(file://{FONTS}/archivo-var.woff);font-weight:500 900;font-stretch:100% 125%}}"
        f"@font-face{{font-family:M;src:url(file://{FONTS}/manrope-var.woff);font-weight:200 800}}*{{margin:0;padding:0;box-sizing:border-box}}</style>")
TMP = os.path.join(ROOT, "_forras", "_ve.html")


def vb(p):
    v = re.search(r'viewBox="([^"]+)"', open(p).read()).group(1).split()
    return float(v[2]), float(v[3])


def shot(b, html, w, h, out, scale=1, transparent=False, full=False):
    open(TMP, "w").write(html)
    pg = b.new_page(device_scale_factor=scale, viewport={"width": int(w), "height": int(h)})
    pg.goto("file://" + TMP); pg.wait_for_timeout(250)
    pg.screenshot(path=out, omit_background=transparent, full_page=full)
    pg.close()


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        # 1) átlátszó PNG minden SVG-ből
        for sv in sorted(glob.glob(V + "/[123]-*/*.svg")):
            w, h = vb(sv)
            name = os.path.basename(sv)
            W = 1024 if name.startswith("ikon") else 2400 if name.startswith("vizszintes") else 1600
            H = W * h / w
            shot(b, f'<html><body style="background:transparent"><img src="file://{sv}" style="display:block;width:{W}px;height:{H}px"></body></html>',
                 W, H, sv[:-4] + ".png", transparent=True)
        # 2) mérettesztek koncepciónként
        for slug, num, nev, pal, sw in K:
            d = os.path.join(V, slug, "probak"); os.makedirs(d, exist_ok=True)
            S = os.path.join(V, slug)
            cells = ""
            for bg, tag in (("#FFFFFF", "vilagos-hatterre"), (sw[0], "sotet-hatterre")):
                cells += (f'<div class="r" style="background:{bg}"><img src="file://{S}/ikon-{tag}.svg" style="width:32px;height:32px">'
                          f'<img src="file://{S}/ikon-{tag}.svg" style="width:64px;height:64px">'
                          f'<img src="file://{S}/vizszintes-kis-meret-{tag}.svg" style="width:160px">'
                          f'<img src="file://{S}/vizszintes-{tag}.svg" style="width:240px"></div>')
            html = (f'<html><head>{FONT}<style>body{{background:#fff;font:600 12px M;color:#555}}.r{{display:flex;gap:28px;align-items:center;padding:18px 22px}}'
                    f'.l{{display:flex;gap:28px;padding:8px 22px 0}}.l span{{display:inline-block}}</style></head><body>'
                    f'<div class="l"><span style="width:32px">32 px</span><span style="width:64px">64 px</span><span style="width:160px">160 px, város nélkül</span><span>logó 240 px</span></div>{cells}</body></html>')
            shot(b, html, 640, 260, os.path.join(d, "meretproba-32-64-160-240.png"), scale=1, full=True)
            # mobil fejléc (390 px, 2×)
            for bg, tag, line in (("#FFFFFF", "vilagos-hatterre", "rgba(0,0,0,.1)"), (sw[0], "sotet-hatterre", "rgba(255,255,255,.12)")):
                html = (f'<html><head>{FONT}<style>body{{background:{bg}}}header{{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid {line}}}'
                        f'header img{{height:42px}}.g{{display:flex;gap:8px}}.g i{{width:44px;height:44px;border-radius:4px;display:block}}</style></head><body>'
                        f'<header><img src="file://{S}/vizszintes-kis-meret-{tag}.svg"><div class="g"><i style="background:{sw[1]}"></i><i style="border:1px solid {line}"></i></div></header></body></html>')
                shot(b, html, 390, 65, os.path.join(d, f"mobil-fejlec-{tag}.png"), scale=2)
            # asztali fejléc
            html = (f'<html><head>{FONT}<style>body{{background:#fff}}header{{height:92px;display:flex;align-items:center;justify-content:space-between;padding:0 72px;border-bottom:1px solid rgba(0,0,0,.08)}}'
                    f'header img{{height:58px}}nav{{display:flex;gap:30px;font:600 15px M;color:#333}}.c{{background:{sw[1]};color:{"#11161C" if num != "01" else sw[0]};font:700 15px M;padding:14px 20px;border-radius:3px}}</style></head><body>'
                    f'<header><img src="file://{S}/vizszintes-vilagos-hatterre.svg"><nav><span>Szolgáltatások</span><span>Dízel</span><span>Futómű</span><span>Rólunk</span><span>Elérhetőség</span></nav><span class="c">Hívás most</span></header></body></html>')
            shot(b, html, 1440, 93, os.path.join(d, "weboldal-fejlec.png"), scale=1)
        # 3) ügyfélbemutató kép (álló, telefonon is olvasható)
        blocks = ""
        for slug, num, nev, pal, sw in K:
            S = os.path.join(V, slug)
            dots = "".join(f'<i style="background:{c}"></i>' for c in sw)
            blocks += f"""<section>
              <div class="cim"><b>{num}</b><h2>{nev}</h2><span class="pal">{dots}<em>{pal}</em></span></div>
              <div class="hero" style="background:{sw[0]}"><img src="file://{S}/emblema-sotet-hatterre.svg"></div>
              <div class="sor">
                <div class="lap" style="background:{sw[2]}"><img class="h" src="file://{S}/vizszintes-vilagos-hatterre.svg"></div>
                <div class="lap ik" style="background:{sw[2]}"><img src="file://{S}/ikon-vilagos-hatterre.svg"><img src="file://{S}/ikon-egyszinu-fekete.svg"></div>
              </div></section>"""
        html = f"""<html><head>{FONT}<style>
        body{{width:1200px;background:#F2F0EB;color:#14171B;font-family:M;padding:90px 80px 70px}}
        .top{{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:30px;border-bottom:1px solid #14171B;margin-bottom:56px}}
        .top h1{{font:680 46px/1.05 A;font-stretch:114%;letter-spacing:-.005em}}.top p{{font:700 13px/1.7 M;letter-spacing:.24em;text-transform:uppercase;text-align:right;color:#5B6066}}
        section{{margin-bottom:64px}}.cim{{display:flex;align-items:baseline;gap:18px;margin-bottom:18px}}.cim b{{font:700 15px M;letter-spacing:.2em;color:#8A8F95}}
        .cim h2{{font:660 28px A;font-stretch:112%}}.pal{{margin-left:auto;display:flex;align-items:center;gap:6px}}.pal i{{width:18px;height:18px;border-radius:50%;display:block;border:1px solid rgba(0,0,0,.12)}}
        .pal em{{font:600 13px M;font-style:normal;letter-spacing:.14em;text-transform:uppercase;color:#5B6066;margin-left:8px}}
        .hero{{height:520px;display:grid;place-items:center;border-radius:2px}}.hero img{{max-height:400px;max-width:760px}}
        .sor{{display:grid;grid-template-columns:1.6fr 1fr;gap:14px;margin-top:14px}}.lap{{height:190px;display:grid;place-items:center;padding:30px;border:1px solid rgba(0,0,0,.08)}}
        .lap img.h{{max-width:100%;max-height:110px}}.lap.ik{{display:flex;justify-content:center;gap:34px;align-items:center}}.lap.ik img{{height:96px}}
        .foot{{display:flex;justify-content:space-between;border-top:1px solid #14171B;padding-top:22px;font:600 14px M;color:#5B6066;letter-spacing:.06em}}
        </style></head><body><div class="top"><h1>KIRÁLY Autószerviz<br>arculati javaslat</h1><p>Három végleges irány<br>2026 · DAEKON</p></div>{blocks}
        <div class="foot"><span>Jóváhagyásra váró tervek</span><span>daekon.hu</span></div></body></html>"""
        shot(b, html, 1200, 1000, os.path.join(V, "kiraly-arculati-javaslat.png"), scale=2, full=True)
        os.unlink(TMP)
        b.close()


if __name__ == "__main__":
    main()
