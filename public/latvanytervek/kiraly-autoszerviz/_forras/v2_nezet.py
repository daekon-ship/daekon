"""Áttekintő a v2 SVG-kről: python3 _forras/v2_nezet.py <kimenet.png>"""
import sys, os, glob
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = ""
for d in sorted(glob.glob(os.path.join(ROOT, "arculat-v2", "0*"))):
    cells = ""
    for p in sorted(glob.glob(d + "/*.svg")):
        bg = "#11161C" if ("sotet" in p or "feher" in p) else "#F4F5F2"
        cells += f'<figure><div style="background:{bg}"><img src="file://{p}"></div><figcaption>{os.path.basename(p)}</figcaption></figure>'
    rows += f"<section>{cells}</section>"
html = """<html><style>body{margin:0;font:12px sans-serif}section{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px;border-bottom:2px solid #000}
figure{margin:0}div{height:170px;display:grid;place-items:center;padding:10px}img{max-width:100%;max-height:150px}</style><body>""" + rows
tmp = os.path.join(ROOT, "_forras", "_v2.html"); open(tmp, "w").write(html)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1600, "height": 800})
    pg.goto("file://" + tmp); pg.wait_for_timeout(400); pg.screenshot(path=sys.argv[1], full_page=True); b.close()
os.unlink(tmp)
