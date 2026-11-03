"""SVG -> PNG (Chromiummal), és áttekintő lap a logókról.
python3 _forras/render.py attekintes <kimenet.png>
python3 _forras/render.py png <svg> <png> [szelesseg]
"""
import sys, os, glob, pathlib
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def show(page, html):
    import tempfile
    fd = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, dir=ROOT + "/_forras")
    fd.write(html); fd.close()
    page.goto("file://" + fd.name)
    page.wait_for_timeout(250)
    os.unlink(fd.name)


def png(page, svg_path, out, width=None):
    s = pathlib.Path(svg_path).read_text()
    import re
    vb = re.search(r'viewBox="([^"]+)"', s).group(1).split()
    w, h = float(vb[2]), float(vb[3])
    W = width or w
    H = W * h / w
    page.set_viewport_size({"width": int(round(W)), "height": int(round(H))})
    show(page, f'<html><body style="margin:0;background:transparent">'
                     f'<img src="file://{os.path.abspath(svg_path)}" style="display:block;width:{W}px;height:{H}px"></body></html>')
    page.wait_for_timeout(80)
    page.screenshot(path=out, omit_background=True, full_page=False)


def attekintes(page, out):
    rows = ""
    for n in range(1, 5):
        files = sorted(glob.glob(os.path.join(ROOT, "arculat", f"logo-{n}", "*.svg")))
        cells = "".join(
            f'<figure><div style="background:{"#11161C" if "sotet" in p and "hatter" not in p else ("#ccd" if "mono" in p else "#e9eae6")}">'
            f'<img src="file://{p}"></div><figcaption>{os.path.basename(p)}</figcaption></figure>' for p in files)
        rows += f"<section>{cells}</section>"
    page.set_viewport_size({"width": 1800, "height": 900})
    show(page, """<html><style>body{margin:0;font:12px sans-serif;background:#fff}
    section{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:10px;border-bottom:2px solid #000}
    figure{margin:0}div{height:200px;display:grid;place-items:center;padding:8px}img{max-width:100%;max-height:184px}</style><body>""" + rows)
    page.wait_for_timeout(300)
    page.screenshot(path=out, full_page=True)


if __name__ == "__main__" and sys.argv[1] != "osszes":
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        if sys.argv[1] == "attekintes":
            attekintes(pg, sys.argv[2])
        else:
            png(pg, sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else None)
        b.close()


def osszes():
    """Minden arculati SVG mellé PNG (közösségi méretekben)."""
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        for sv in sorted(glob.glob(os.path.join(ROOT, "arculat", "logo-*", "*.svg"))):
            w = 1080 if "profilkep" in sv else 1640 if "borito" in sv else 1600
            png(pg, sv, sv[:-4] + ".png", w)
        b.close()


if __name__ == "__main__" and sys.argv[1] == "osszes":
    osszes()
