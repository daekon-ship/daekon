"""Prémium névjegykártya a végleges éjkék–arany logóval.
90×50 mm vágott méret + 3 mm kifutó (96×56 mm), nyomdakész PDF + bemutató PNG-k.
python3 _forras/nevjegy_vegleges.py  ->  nyomdai/vegleges-ejkek/
Előtte futtass egy helyi szervert a látványterv mappájában: python3 -m http.server 8765
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "nyomdai", "vegleges-ejkek")
B = "http://localhost:8765/"
NAVY, NAVY2, GOLD, CREAM, INK2 = "#0E1B2C", "#13243A", "#C9A14F", "#F6F2EA", "#46556A"

FONT = f"""@font-face{{font-family:A;src:url({B}fonts/archivo-var.woff);font-weight:500 900;font-stretch:100% 125%}}
@font-face{{font-family:M;src:url({B}fonts/manrope-var.woff);font-weight:200 800}}"""

IK = {
    "tel": '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    "hely": '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "ora": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
}


def ik(k, c):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">{IK[k]}</svg>'


SZOLG = ["Teljes körű autószerviz", "Autódiagnosztika", "Dízelrendszer-javítás", "Adagoló- és porlasztójavítás",
         "3D futóműállítás", "Önindító- és generátorjavítás", "Műszaki vizsgára felkészítés",
         "Szívósor- és EGR-tisztítás", "Ford garanciális szervizelés"]  # a weboldal szolgáltatáslistája alapján


def elo():
    """Előlap: balra a szolgáltatások listája, jobbra világosabb panel a logóval (a hátlap tükörképe)."""
    li = "".join(f"<li>{x}</li>" for x in SZOLG)
    return f"""<div class="lap elo2">
  <div class="szlista">
    <div class="szcim">Szolgáltatásaink</div>
    <ul>{li}</ul>
    <div class="szlab">Márkafüggetlen · személyautó és kishaszonjármű</div>
  </div>
  <div class="valaszto jobb"></div>
  <div class="panel jobb"><img class="nagyjel" src="{B}arculat-kombi/VEGLEGES/2-kiraly-logo-ejkek-arany-atlatszo.png"></div>
</div>"""


def hat(sotet=True, ceges=False):
    """Hátlap (logó nélkül – a logó csak a szolgáltatások oldalán van): cégnév-felirat, név (vagy céges kártyán szlogen), elérhetőségek."""
    return f"""<div class="lap hat3{' ceges' if ceges else ''}">
  <div class="bal">
    <img class="szojel" src="{B}arculat-kombi/WEB/fejlec-felirat-ejkek.svg">
    {'<div class="szemely ceg"><i></i><div class="beo">Dunaújváros · 2008 óta</div></div>' if ceges else '<div class="szemely"><div class="nev">Király István</div><div class="beo">Ügyvezető</div></div>'}
  </div>
  <div class="valaszto kozep"></div>
  <div class="jobbo">
    <div class="s tel">{ik("tel", GOLD)}<span>+36 20 585 3234</span></div>
    <div class="s">{ik("mail", GOLD)}<span>kiralyautoszervizkft@gmail.com</span></div>
    <div class="s ket">{ik("hely", GOLD)}<span>2400 Dunaújváros,<br>Budai Nagy Antal út 27/C</span></div>
    <div class="s hal">{ik("ora", GOLD)}<span>H–P: 8–12 és 13–17</span></div>
  </div>
</div>"""


CSS = f"""{FONT}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:96mm 56mm;margin:0}}
html,body{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.lap{{width:96mm;height:56mm;position:relative;overflow:hidden;break-after:page}}
.elo{{background:radial-gradient(60% 85% at 50% 48%,#1A2D45 0,{NAVY} 70%)}}
.elo .keret{{position:absolute;left:7.6mm;top:7.6mm;right:7.6mm;bottom:7.6mm;border:.22mm solid rgba(201,161,79,.55)}}
.elo .keret::after{{content:"";position:absolute;inset:.9mm;border:.12mm solid rgba(201,161,79,.25)}}
.elo .emb{{position:absolute;left:50%;top:50%;width:36mm;height:36mm;transform:translate(-50%,-50%)}}
.arany-el{{position:absolute;left:0;top:0;bottom:0;width:5.6mm;background:linear-gradient(180deg,#DDBB72,{GOLD} 50%,#B38B3A)}}
.belso{{position:absolute;left:3mm;top:3mm;width:90mm;height:50mm;padding:5.6mm 6mm 4.6mm 9.2mm;display:flex;flex-direction:column}}
.fej{{display:flex;justify-content:space-between;align-items:flex-start}}
.nev{{font:800 12.4pt/1 A;font-stretch:100%;letter-spacing:.1em;text-transform:uppercase}}
.beo{{font:700 5.8pt/1 A;font-stretch:100%;letter-spacing:.28em;text-transform:uppercase;margin-top:2.1mm}}
.jel{{width:11.5mm;height:11.5mm;margin-top:-.6mm}}
.vonal{{height:.22mm;margin:3.6mm 0 3.1mm}}
.sorok{{display:grid;gap:1.55mm}}
.s{{display:flex;gap:2mm;align-items:center;font:600 6.4pt/1.2 A;font-stretch:100%;letter-spacing:.02em}}
.s svg{{width:2.8mm;height:2.8mm;flex:none}}
.s.tel{{font:800 9pt/1 A;font-stretch:100%;letter-spacing:.05em}}
.s.tel svg{{width:3.1mm;height:3.1mm}}
.hat2{{background:{NAVY};color:{CREAM}}}
.panel{{position:absolute;left:0;top:0;bottom:0;width:39mm;background:radial-gradient(90% 70% at 55% 50%,#1C3251,#13243A 75%)}}
.nagyjel{{position:absolute;left:21mm;top:50%;width:27mm;height:27mm;transform:translate(-50%,-50%)}}
.valaszto{{position:absolute;left:39mm;top:0;bottom:0;width:.35mm;background:linear-gradient(180deg,#DDBB72,{GOLD} 50%,#B38B3A)}}
.adat{{position:absolute;left:44.5mm;right:6mm;top:50%;transform:translateY(-50%)}}
.adat .nev{{font-size:10.4pt}}
.adat .beo{{color:{GOLD}}}
.vonal2{{height:.22mm;width:10mm;background:{GOLD};margin:3mm 0 3.2mm}}
.adat .s{{margin-top:1.5mm;color:{CREAM}}}
.adat .s.ket{{align-items:flex-start;line-height:1.3}}
.adat .s.ket svg{{margin-top:.2mm}}
.adat .s.hal{{color:#A9B4C2}}
.elo2{{background:{NAVY};color:{CREAM}}}
.panel.jobb{{left:auto;right:0;width:39mm}}
.panel.jobb .nagyjel{{left:auto;right:21mm;transform:translate(50%,-50%)}}
.valaszto.jobb{{left:auto;right:39mm}}
.szlista{{position:absolute;left:9mm;top:50%;transform:translateY(-50%);width:46mm}}
.szcim{{font:700 5.6pt/1 A;font-stretch:100%;letter-spacing:.28em;text-transform:uppercase;color:{GOLD};margin-bottom:2.6mm}}
.szlista ul{{list-style:none;margin:0;padding:0;display:grid;gap:1.05mm}}
.szlista li{{font:600 6.3pt/1.15 A;font-stretch:100%;letter-spacing:.015em;display:flex;align-items:center;gap:1.8mm;white-space:nowrap}}
.szlista li::before{{content:"";width:1.1mm;height:1.1mm;background:{GOLD};transform:rotate(45deg);flex:none}}
.szlab{{margin-top:2.6mm;font:600 4.9pt/1.2 A;font-stretch:100%;letter-spacing:.08em;color:#A9B4C2}}
.hat3{{background:radial-gradient(80% 90% at 20% 50%,#15263B,{NAVY} 70%);color:{CREAM}}}
.hat3 .bal{{position:absolute;left:9mm;top:9.5mm;bottom:9.5mm;width:30mm;display:flex;flex-direction:column;justify-content:space-between}}
.szojel{{width:27mm;height:auto;display:block}}
.hat3 .nev{{font-size:9.6pt}}
.hat3 .beo{{color:{GOLD}}}
.valaszto.kozep{{left:43mm;top:9.5mm;bottom:9.5mm;width:.3mm}}
.jobbo{{position:absolute;left:47mm;right:5.5mm;top:50%;transform:translateY(-50%);display:grid;gap:1.9mm}}
.jobbo .s{{color:{CREAM}}}
.jobbo .s.ket{{align-items:flex-start;line-height:1.3}}
.jobbo .s.ket svg{{margin-top:.2mm}}
.jobbo .s.hal{{color:#A9B4C2}}
.hat3.ceges .bal{{justify-content:center;gap:5mm}}
.hat3.ceges .szojel{{width:31mm}}
.szemely.ceg i{{display:block;width:9mm;height:.25mm;background:{GOLD};margin-bottom:2.6mm}}
.szemely.ceg .beo{{margin-top:0;color:#A9B4C2;font-size:5pt;letter-spacing:.16em;white-space:nowrap}}
.szolg{{margin-top:auto;font:800 4.9pt/1 M;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}}
.szolg i{{display:inline-block;width:.9mm;height:.9mm;border-radius:50%;margin:0 1.6mm;vertical-align:.3mm}}
"""


def page(body):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(ROOT, "_nv.html")
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(device_scale_factor=1)
        for nev, body in (("ejkek", elo() + hat(True)), ("ejkek-ceges", elo() + hat(True, ceges=True))):
            open(tmp, "w", encoding="utf-8").write(page(body))
            pg.goto(B + "_nv.html?" + nev); pg.wait_for_timeout(700)
            pg.pdf(path=os.path.join(OUT, f"nevjegykartya-{nev}-nyomdai-96x56mm.pdf"), width="96mm", height="56mm", print_background=True)
        # bemutató PNG-k: vágott méret (90×50 mm), 1 mm = 12 px
        sh = b.new_page(viewport={"width": 1152, "height": 672}, device_scale_factor=1)
        for nev, body in (("elolap", elo()), ("hatlap", hat(True)), ("hatlap-ceges", hat(True, ceges=True))):
            html = page(f'<div style="zoom:3.1496">{body}</div>')  # 96mm -> ~1152 px
            open(tmp, "w", encoding="utf-8").write(html)
            sh.goto(B + "_nv.html?" + nev); sh.wait_for_timeout(600)
            sh.screenshot(path=os.path.join(OUT, f"nevjegy-{nev}.png"), clip={"x": 36, "y": 36, "width": 1080, "height": 600})
        # bemutató képek: két kártya egy asztalon (személyes és céges)
        cards = lambda f: f'{B}nyomdai/vegleges-ejkek/nevjegy-{f}.png'
        for cel, hl in (("nevjegy-bemutato.png", "hatlap"), ("nevjegy-bemutato-ceges.png", "hatlap-ceges")):
            html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONT}
            body{{margin:0;width:1600px;height:1100px;background:radial-gradient(80% 80% at 50% 40%,#E9E4DA,#D6D0C4);position:relative;overflow:hidden;font-family:M}}
            img{{position:absolute;width:760px;border-radius:6px;box-shadow:0 2px 3px rgba(0,0,0,.18),0 30px 60px -20px rgba(0,0,0,.45)}}
            .a{{left:150px;top:150px;transform:rotate(-5deg)}}.b{{left:700px;top:470px;transform:rotate(4deg)}}
            p{{position:absolute;left:60px;bottom:40px;font:700 18px M;letter-spacing:.2em;color:#6b6457;text-transform:uppercase}}</style></head>
            <body><img class="a" src="{cards('elolap')}"><img class="b" src="{cards(hl)}"><p>KIRÁLY Autószerviz · névjegykártya · 90×50 mm</p></body></html>"""
            open(tmp, "w", encoding="utf-8").write(html)
            bm = b.new_page(viewport={"width": 1600, "height": 1100}); bm.goto(B + "_nv.html?" + cel); bm.wait_for_timeout(800)
            bm.screenshot(path=os.path.join(OUT, cel)); bm.close()
        os.unlink(tmp)
        b.close()


if __name__ == "__main__":
    main()
