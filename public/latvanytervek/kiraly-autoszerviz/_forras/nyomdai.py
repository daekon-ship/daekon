"""Névjegykártya (90×50 mm + 3 mm kifutó) és újsághirdetés (95×125 mm) mind a 4 logóhoz.
python3 _forras/nyomdai.py  ->  nyomdai/logo-N/{nevjegykartya.pdf, nevjegy-elo.png, nevjegy-hat.png, ujsaghirdetes.pdf, ujsaghirdetes.png}
"""
import os, re, pathlib
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BETU = os.path.join(ROOT, "_forras", "betu")

TEMAK = {n: dict(sotet="#11161C", felulet="#1C242D", vilagos="#F4F5F2", kiemel="#F26732", halk="#A6B0B8",
                 logo_sotet=f"kiraly-{n}-sotet.svg", jel=f"kiraly-{n}-jel-tiszta.svg", jel_tile=f"kiraly-{n}-jel.svg",
                 logo_w={1: 52, 2: 50, 3: 50, 4: 50, 5: 52}[n]) for n in range(1, 6)}

SZOLG = ["Márkafüggetlen szerviz", "Személy- és kishaszonjármű", "Teljes körű diagnosztika", "Dízelrendszer-javítás",
         "Adagoló, porlasztó javítás", "3D futóműállítás", "Önindító, generátor javítás", "Műszakira felkészítés",
         "Szívósor-, EGR-tisztítás"]


_INL = [0]


def svg_inline(n, name):
    s = pathlib.Path(ROOT, "arculat", f"logo-{n}", name).read_text()
    _INL[0] += 1
    pre = f"i{_INL[0]}_"
    s = re.sub(r'id="([^"]+)"', lambda m: f'id="{pre}{m.group(1)}"', s)
    s = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{pre}{m.group(1)})', s)
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


IKON = {
    "tel": '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "ora": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
}


def ikon(k, c):
    return f'<svg class="ik" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">{IKON[k]}</svg>'


def nevjegy_html(n, t):
    k = t["kiemel"]
    return f"""<!doctype html><html lang="hu"><head><meta charset="utf-8"><style>{FONTOK}
@page{{size:96mm 56mm;margin:0}}
.lap{{width:96mm;height:56mm;position:relative;overflow:hidden;break-after:page}}
.lap:last-child{{break-after:auto}}
/* ELŐLAP: sötét, nagy tónusos jel kifutóval, logó balra, narancs él */
.elo{{background:{t['sotet']}}}
.elo .vizjel{{position:absolute;right:-9mm;top:50%;width:{ {3: '30mm', 4: '58mm'}.get(n, '52mm') };transform:translateY(-50%);opacity:.07;filter:grayscale(1) brightness(1.6)}}
.elo .el{{position:absolute;left:0;top:0;bottom:0;width:4.8mm;background:{k}}}
.elo .logo{{position:absolute;left:11mm;top:50%;width:{t['logo_w']}mm;transform:translateY(-50%)}}
/* HÁTLAP: világos, rendezett rács */
.hat{{background:{t['vilagos']};color:#11161C}}
.belso{{position:absolute;left:3mm;top:3mm;width:90mm;height:50mm;padding:6mm 6mm 5mm 7mm;display:flex;flex-direction:column}}
.fej{{display:flex;justify-content:space-between;align-items:flex-start}}
.nev{{font:800 11pt/1.05 Archivo;letter-spacing:.005em}}
.beo{{font:700 5.6pt/1 Manrope;letter-spacing:.22em;text-transform:uppercase;color:{k};margin-top:1.8mm}}
.tile{{width:10.5mm;height:10.5mm;border-radius:1.6mm;overflow:hidden}}
.vonal{{height:.25mm;background:rgba(17,22,28,.14);margin:4.2mm 0 3.6mm}}
.racs{{display:grid;grid-template-columns:1.08fr 1fr;gap:2.2mm 4mm}}
.s{{display:flex;gap:1.8mm;align-items:flex-start;font:600 6.4pt/1.35 Manrope;color:#11161C}}
.s .ik{{width:2.9mm;height:2.9mm;flex:none;margin-top:.15mm}}
.s.tel{{font:800 8.6pt/1.1 Archivo;letter-spacing:.01em}}
.s.tel .ik{{width:3.2mm;height:3.2mm;margin-top:0}}
.s small{{display:block;font:600 5.6pt/1.3 Manrope;color:#55616B}}
.szolg{{margin-top:auto;font:700 5.1pt/1 Manrope;letter-spacing:.16em;text-transform:uppercase;color:#55616B;white-space:nowrap}}
.szolg i{{display:inline-block;width:1mm;height:1mm;background:{k};margin:0 1.6mm;vertical-align:.25mm}}
</style></head><body>
<section class="lap elo"><span class="el"></span><div class="vizjel">{svg_inline(n, t['jel'])}</div><div class="logo">{svg_inline(n, t['logo_sotet'])}</div></section>
<section class="lap hat"><div class="belso">
 <div class="fej"><div><div class="nev">Király István</div><div class="beo">ügyvezető</div></div><div class="tile">{svg_inline(n, t['jel_tile'])}</div></div>
 <div class="vonal"></div>
 <div class="racs">
  <div class="s tel">{ikon("tel", k)}<span>+36 20 585 3234</span></div>
  <div class="s">{ikon("pin", k)}<span>2400 Dunaújváros,<br>Budai Nagy Antal út 27/C</span></div>
  <div class="s">{ikon("mail", k)}<span>kiralyautoszervizkft@gmail.com</span></div>
  <div class="s">{ikon("ora", k)}<span>Hétfő–péntek<small>8–12 és 13–17</small></span></div>
 </div>
 <div class="szolg">Diagnosztika<i></i>Dízel<i></i>Adagoló, porlasztó<i></i>3D futómű</div>
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
.fej .logo{{width:{min(t['logo_w'], 52)}mm}}
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
 <div class="fej"><div class="logo">{svg_inline(n, t['logo_sotet'])}</div><div class="ota">2008 óta</div></div>
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
    import shutil
    shutil.rmtree(os.path.join(ROOT, "nyomdai"), ignore_errors=True)
    S = 300 / 96
    with sync_playwright() as p:
        b = p.chromium.launch()
        for n, t in TEMAK.items():
            out = os.path.join(ROOT, "nyomdai", f"logo-{n}")
            os.makedirs(out, exist_ok=True)
            for nev, html, w, h in (("nevjegykartya", nevjegy_html(n, t), "96mm", "56mm"),):
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
