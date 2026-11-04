import sys, os, glob
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pat = sys.argv[2] if len(sys.argv) > 2 else "*"
rows = ""
for d in sorted(glob.glob(os.path.join(ROOT, "arculat-vegso", "[123]-*"))):
    cells = ""
    for p in sorted(glob.glob(d + f"/{pat}.svg")):
        bg = "#1a1d22" if ("sotet" in p or "feher" in p) else "#F4F2EE"
        cells += f'<figure><div style="background:{bg}"><img src="file://{p}"></div><figcaption>{os.path.basename(p)}</figcaption></figure>'
    rows += f"<section>{cells}</section>"
html = """<html><style>body{margin:0;font:11px sans-serif}section{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px;border-bottom:2px solid #000}
figure{margin:0}div{height:200px;display:grid;place-items:center;padding:12px}img{max-width:100%;max-height:176px}</style><body>""" + rows
tmp = os.path.join(ROOT, "_forras", "_vn.html"); open(tmp, "w").write(html)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1600, "height": 800})
    pg.goto("file://" + tmp); pg.wait_for_timeout(500); pg.screenshot(path=sys.argv[1], full_page=True); b.close()
os.unlink(tmp)
