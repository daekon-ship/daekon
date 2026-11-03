import os, glob, re
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "arculat-premium")
tmp = os.path.join(ROOT, "_forras", "_pr.html")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for sv in sorted(glob.glob(OUT + "/*/*.svg")):
        v = re.search(r'viewBox="([^"]+)"', open(sv).read()).group(1).split(); w, h = float(v[2]), float(v[3])
        W = 1400; H = W * h / w
        open(tmp, "w").write(f'<html><body style="margin:0"><img src="file://{sv}" style="display:block;width:{W}px;height:{H}px"></body></html>')
        pg.set_viewport_size({"width": W, "height": int(round(H))}); pg.goto("file://" + tmp); pg.wait_for_timeout(50)
        pg.screenshot(path=sv[:-4] + ".png")
    for d in sorted(glob.glob(OUT + "/*/")):
        for t in ("sotet", "vilagos"):
            imgs = "".join(f'<div><img src="file://{f}"></div>' for f in sorted(glob.glob(d + f"*-{t}.svg")))
            open(tmp, "w").write(f'<html><style>body{{margin:0;padding:20px;background:#fff;display:grid;grid-template-columns:repeat(5,1fr);gap:16px;width:1800px}}div{{display:grid;place-items:center}}img{{width:100%;max-height:420px;object-fit:contain}}</style><body>{imgs}</body></html>')
            pg.set_viewport_size({"width": 1840, "height": 480}); pg.goto("file://" + tmp); pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(d, f"osszesito-{t}.png"), full_page=True)
    os.unlink(tmp); b.close()
