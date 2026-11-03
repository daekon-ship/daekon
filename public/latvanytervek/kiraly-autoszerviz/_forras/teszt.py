"""Böngészős ellenőrzés: képernyőképek, vízszintes túlcsordulás, konzolhibák, linkek.
python3 _forras/teszt.py <kimeneti_mappa> [oldal]   (előtte: python3 -m http.server 8765 a latvanytervek mappában)
"""
import sys, os, json
from playwright.sync_api import sync_playwright

OUT = sys.argv[1]
PAGE = sys.argv[2] if len(sys.argv) > 2 else "index.html"
BASE = "http://127.0.0.1:8765/kiraly-autoszerviz/" + PAGE
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mob in ((1440, 900, False), (768, 1024, True), (390, 844, True), (360, 740, True)):
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page()
        hibak = []
        pg.on("console", lambda m: hibak.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: hibak.append("PAGEERROR " + str(e)))
        pg.on("requestfailed", lambda r: hibak.append("REQFAIL " + r.url))
        pg.goto(BASE, wait_until="networkidle")
        pg.wait_for_timeout(2600)
        pg.screenshot(path=f"{OUT}/{w}-elso.png")
        # végiggörgetés, hogy minden belépő animáció lefusson
        H = pg.evaluate("document.documentElement.scrollHeight")
        y = 0
        while y < H:
            pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(120); y += h // 2
        pg.wait_for_timeout(1200)
        ov = pg.evaluate("""() => {const W=document.documentElement.clientWidth;const r=[];
          document.querySelectorAll('body *').forEach(e=>{const b=e.getBoundingClientRect();if(b.width&&b.right>W+1&&getComputedStyle(e).position!=='fixed'){r.push(e.tagName+'.'+e.className+' '+Math.round(b.right))}});
          return {sw:document.documentElement.scrollWidth,W,r:r.slice(0,8)}}""")
        rejtett = pg.evaluate("[...document.querySelectorAll('[data-be]')].filter(e=>getComputedStyle(e).opacity<0.9).length")
        pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(300)
        pg.screenshot(path=f"{OUT}/{w}-teljes.png", full_page=True)
        print(w, "scrollW", ov["sw"], "W", ov["W"], "túllógó:", ov["r"], "rejtett data-be:", rejtett)
        print("  konzol:", hibak[:6])
        ctx.close()
    b.close()
