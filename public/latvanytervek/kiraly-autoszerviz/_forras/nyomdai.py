"""Névjegykártya (90×50 mm + 3 mm kifutó) és újsághirdetés (95×125 mm) mind a 4 logóhoz.
python3 _forras/nyomdai.py  ->  nyomdai/logo-N/{nevjegykartya.pdf, nevjegy-elo.png, nevjegy-hat.png, ujsaghirdetes.pdf, ujsaghirdetes.png}
"""
import os, re, pathlib
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BETU = os.path.join(ROOT, "_forras", "betu")

TEMAK = {
    1: dict(sotet="#11161C", felulet="#1C242D", vilagos="#F4F5F2", kiemel="#F26732", kiemel_szoveg="#11161C",
            halk="#A6B0B8", logo_sotet="kiraly-1-sotet.svg", logo_vilagos="kiraly-1-vilagos.svg", jel="kiraly-1-jel.svg", logo_w=60),
    2: dict(sotet="#11161C", felulet="#1C242D", vilagos="#F4F5F2", kiemel="#F26732", kiemel_szoveg="#11161C",
            halk="#A6B0B8", logo_sotet="kiraly-2-sotet.svg", logo_vilagos="kiraly-2-vilagos.svg", jel="kiraly-2-jel.svg", logo_w=58),
    3: dict(sotet="#1C242D", felulet="#11161C", vilagos="#F4F5F2", kiemel="#F26732", kiemel_szoveg="#11161C",
            halk="#A6B0B8", logo_sotet="kiraly-3-sotet.svg", logo_vilagos="kiraly-3-vilagos.svg", jel="kiraly-3-jel.svg", logo_w=27),
    4: dict(sotet="#0A0B0D", felulet="#17191D", vilagos="#FFFFFF", kiemel="#F2B705", kiemel_szoveg="#0A0B0D",
            halk="#B4B8BE", logo_sotet="kiraly-4-sotet.svg", logo_vilagos="kiraly-4-vilagos.svg", jel="kiraly-4-jel.svg", logo_w=60),
}

SZOLG = ["Márkafüggetlen szerviz", "Személy- és kishaszonjármű", "Teljes körű diagnosztika", "Dízelrendszer-javítás",
         "Adagoló, porlasztó javítás", "3D futóműállítás", "Önindító, generátor javítás", "Műszakira felkészítés",
         "Szívósor-, EGR-tisztítás"]


def svg_inline(n, name):
    s = pathlib.Path(ROOT, "arculat", f"logo-{n}", name).read_text()
    s = re.sub(r' width="[^"]+" height="[^"]+"', "", s, count=1)
    return s


FONTOK = f"""
@font-face{{font-family:Archivo;src:url(file://{BETU}/statikus/archivo-800.ttf);font-weight:100 900}}
@font-face{{font-family:Manrope;src:url(file://{BETU}/statikus/manrope-500.ttf);font-weight:500}}
@font-face{{font-family:Manrope;src:url(file://{BETU}/statikus/manrope-600.ttf);font-weight:600}}
@font-face{{font-family:Manrope;src:url(file://{BETU}/statikus/manrope-700.ttf);font-weight:700 800}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{font-family:Manrope,sans-serif;font-feature-settings:"tnum"}}
svg{{display:block;width:100%;height:auto}}
"""


def nevjegy_html(n, t):
    lista = "".join(f"<li>{s}</li>" for s in SZOLG)
    return f"""<!doctype html><html lang="hu"><head><meta charset="utf-8"><style>{FONTOK}
@page{{size:96mm 56mm;margin:0}}
.lap{{width:96mm;height:56mm;position:relative;overflow:hidden;break-after:page}}.lap:last-child{{break-after:auto}}
.elo{{background:{t['sotet']};display:grid;place-items:center}}
.elo .logo{{width:{t['logo_w']}mm;margin-top:-3mm}}
.elo .alja{{position:absolute;left:0;right:0;bottom:9mm;text-align:center;font:600 5.6pt/1 Manrope;letter-spacing:.24em;color:{t['halk']};text-transform:uppercase}}
.elo .vonal{{position:absolute;left:50%;bottom:13.4mm;width:7mm;height:.6mm;margin-left:-3.5mm;background:{t['kiemel']}}}
.hat{{background:{t['vilagos']};color:{t['sotet'] if n != 3 else '#11161C'}}}
.belso{{position:absolute;left:3mm;top:3mm;width:90mm;height:50mm;padding:6.4mm 5mm 5.6mm 6mm;display:grid;grid-template-columns:1fr 34mm;gap:4mm}}
.nev{{font:760 10pt/1.1 Archivo;font-stretch:112%;letter-spacing:.01em}}
.beo{{font:600 6.2pt/1.2 Manrope;letter-spacing:.14em;text-transform:uppercase;opacity:.62;margin-top:1.1mm}}
.tel{{font:760 11pt/1 Archivo;font-stretch:106%;margin-top:6.6mm;letter-spacing:.01em;white-space:nowrap}}
.tel i{{display:inline-block;width:1.6mm;height:1.6mm;background:{t['kiemel'] if n != 4 else '#0B0D10'};margin-right:1.6mm;vertical-align:.35mm;font-style:normal}}
.adat{{font:500 6.4pt/1.45 Manrope;margin-top:2.6mm}}
.adat b{{font-weight:700}}
.jobb{{border-left:.25mm solid rgba(17,22,28,.22);padding-left:3.2mm}}
.cimke{{font:700 5.4pt/1 Manrope;letter-spacing:.2em;text-transform:uppercase;color:{t['kiemel'] if n != 4 else '#0B0D10'};margin-bottom:2mm;{'' if n != 4 else 'background:#F2B705;display:inline-block;padding:.8mm 1.2mm .7mm;'}}}
ul{{list-style:none;font:500 5.9pt/1.44 Manrope;white-space:nowrap}}
</style></head><body>
<section class="lap elo"><div class="logo">{svg_inline(n, t['logo_sotet'])}</div><span class="vonal"></span><div class="alja">{"Márkafüggetlen autószerviz · Dunaújváros" if n == 3 else "Márkafüggetlen autószerviz · 2008 óta"}</div></section>
<section class="lap hat"><div class="belso">
 <div><div class="nev">Király István</div><div class="beo">ügyvezető</div>
 <div class="tel"><i></i>+36 20 585 3234</div>
 <div class="adat">kiralyautoszervizkft@gmail.com<br>2400 Dunaújváros,<br>Budai Nagy Antal út 27/C<br><b>H–P: 8–12 és 13–17</b></div></div>
 <div class="jobb"><div class="cimke">Szolgáltatások</div><ul>{lista}</ul></div>
</div></section>
</body></html>"""


def hirdetes_html(n, t):
    egyeb = ["Teljes körű diagnosztika", "Dízel, adagoló, porlasztó", "3D futóműállítás",
             "Műszakira felkészítés", "Önindító, generátor", "Kishaszonjárművek is"]
    lista = "".join(f"<li>{s}</li>" for s in egyeb)
    return f"""<!doctype html><html lang="hu"><head><meta charset="utf-8"><style>{FONTOK}
@page{{size:95mm 125mm;margin:0}}
.hird{{width:95mm;height:125mm;background:{t['sotet']};color:#F4F5F6;position:relative;overflow:hidden;display:flex;flex-direction:column}}
.fej{{display:flex;justify-content:space-between;align-items:center;padding:5.4mm 6mm 0}}
.fej .logo{{width:{min(t['logo_w'], 50) if n != 3 else 22}mm}}
.fej .ota{{font:600 6pt/1.35 Manrope;letter-spacing:.18em;text-transform:uppercase;color:{t['halk']};text-align:right}}
.tor{{padding:5mm 6mm 0}}
.kicker{{font:700 6.6pt/1 Manrope;letter-spacing:.22em;text-transform:uppercase;color:{t['kiemel']}}}
h1{{font:800 16.4pt/1.06 Archivo;margin-top:2.2mm;letter-spacing:-.003em}}
.lead{{font:500 7.4pt/1.42 Manrope;color:#D3D8DC;margin-top:2.2mm;max-width:82mm}}
.ford{{margin:3.8mm 6mm 0;padding:2.8mm 3.4mm 3mm;background:{t['felulet']};border-left:1.2mm solid {t['kiemel']}}}
.ford b{{display:block;font:800 8.8pt/1.22 Archivo}}
.ford span{{display:block;font:500 7.1pt/1.4 Manrope;color:#D3D8DC;margin-top:1mm}}
ul{{list-style:none;columns:2;column-gap:4mm;padding:3.6mm 6mm 3.2mm;font:600 6.9pt/1.5 Manrope;color:#E7EAEC}}
li{{break-inside:avoid;padding-left:2.8mm;position:relative}}
li:before{{content:"";position:absolute;left:0;top:1.55mm;width:1.2mm;height:1.2mm;background:{t['kiemel']}}}
.kapcs{{margin-top:auto;background:{t['kiemel']};color:{t['kiemel_szoveg']};padding:3.4mm 6mm 3.8mm}}
.kapcs .k1{{font:700 6.6pt/1 Manrope;letter-spacing:.16em;text-transform:uppercase}}
.kapcs .tel{{font:800 19pt/1 Archivo;margin-top:1.6mm;letter-spacing:.005em}}
.kapcs .sor{{display:flex;justify-content:space-between;gap:3mm;font:600 7.2pt/1.35 Manrope;margin-top:2mm}}
</style></head><body>
<div class="hird">
 <div class="fej"><div class="logo">{svg_inline(n, t['logo_sotet'])}</div>{'<div class="ota">Dunaújváros<br>2008 óta</div>' if n != 3 else '<div class="ota">Márkafüggetlen autószerviz<br>személy- és kishaszonjárművek</div>'}</div>
 <div class="tor">
  <div class="kicker">Bővült a szolgáltatásunk</div>
  <h1>Dióőrleményes szívósor- és EGR-tisztítás</h1>
  <p class="lead">Ha az autó erőtlen, rángat, egyenetlenül jár vagy füstöl, gyakran a szívóoldalon és az EGR-szelepben lerakódott koksz az oka. Átvizsgáljuk, és megtisztítjuk.</p>
 </div>
 <div class="ford"><b>Ford gépjárművek garanciális időn belüli általános szervizelése</b><span>Gyári Ford alkatrészekkel, online szervizkönyv-vezetéssel.</span></div>
 <ul>{lista}</ul>
 <div class="kapcs"><div class="k1">Érdeklődjön személyesen vagy telefonon</div><div class="tel">+36 20 585 3234</div>
 <div class="sor"><span>Hétfő–péntek: 8–12 és 13–17</span><span>Budai Nagy Antal út 27/C</span></div></div>
</div></body></html>"""


def main():
    S = 300 / 96
    with sync_playwright() as p:
        b = p.chromium.launch()
        for n, t in TEMAK.items():
            out = os.path.join(ROOT, "nyomdai", f"logo-{n}")
            os.makedirs(out, exist_ok=True)
            for nev, html, w, h in (("nevjegykartya", nevjegy_html(n, t), "96mm", "56mm"),
                                    ("ujsaghirdetes", hirdetes_html(n, t), "95mm", "125mm")):
                tmp = os.path.join(ROOT, "_forras", f"_tmp_{nev}.html")
                pathlib.Path(tmp).write_text(html)
                pg = b.new_page(device_scale_factor=S, viewport={"width": 400, "height": 520})
                pg.goto("file://" + tmp)
                pg.evaluate("document.fonts.ready")
                pg.wait_for_timeout(250)
                ov = pg.evaluate("[...document.querySelectorAll('.lap,.hird,.belso')].map(e=>e.scrollHeight-e.clientHeight)")
                if any(v > 1 for v in ov):
                    print("TÚLCSORDULÁS", n, nev, ov)
                pg.emulate_media(media="print")
                ov = pg.evaluate("[...document.querySelectorAll('.lap,.hird,.belso')].map(e=>e.scrollHeight-e.clientHeight)")
                if any(v > 1 for v in ov):
                    print("TÚLCSORDULÁS (print)", n, nev, ov)
                pg.emulate_media(media="screen")
                pg.pdf(path=os.path.join(out, nev + ".pdf"), width=w, height=h, print_background=True)
                if nev == "nevjegykartya":
                    els = pg.query_selector_all(".lap")
                    els[0].screenshot(path=os.path.join(out, "nevjegy-elo.png"))
                    els[1].screenshot(path=os.path.join(out, "nevjegy-hat.png"))
                else:
                    pg.query_selector(".hird").screenshot(path=os.path.join(out, "ujsaghirdetes.png"))
                pg.close()
                os.unlink(tmp)
        b.close()


if __name__ == "__main__":
    main()
