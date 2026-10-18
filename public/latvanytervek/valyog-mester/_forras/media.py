"""A valyog-mester.hu összes képének és videójának felderítése és letöltése.

GitHub Actions-ben fut (lásd .github/workflows/valyog-media.yml):
1. Playwright-tal megnyitja az élő oldalt (és az aloldalakat), végiggörget,
   kigyűjti az img/srcset/source/video/poster/CSS-háttér forrásokat.
2. Letölti őket, a képeket webp-re alakítja 3 méretben (900/1600/2400 px).
3. Videót változatlanul ment (max. 60 MB).
4. Jelentést ír: _forras/media-jelentes.json
"""
import json, re, urllib.request
from pathlib import Path
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "img" / "foto"
OUT.mkdir(parents=True, exist_ok=True)
PAGES = ["https://valyog-mester.hu/", "https://valyog-mester.hu/adatvedelem", "https://valyog-mester.hu/sutik"]
JS = """() => {
  const s = new Set();
  const add = u => { if (u && !u.startsWith('data:')) s.add(new URL(u, location.href).href); };
  document.querySelectorAll('img').forEach(i => { add(i.currentSrc || i.src); (i.srcset||'').split(',').forEach(p => add(p.trim().split(' ')[0])); });
  document.querySelectorAll('source').forEach(x => { add(x.src); (x.srcset||'').split(',').forEach(p => add(p.trim().split(' ')[0])); });
  document.querySelectorAll('video').forEach(v => { add(v.currentSrc || v.src); add(v.poster); });
  document.querySelectorAll('*').forEach(e => { const b = getComputedStyle(e).backgroundImage; (b.match(/url\\(["']?([^"')]+)/g)||[]).forEach(m => add(m.replace(/url\\(["']?/, ''))); });
  document.querySelectorAll('iframe').forEach(f => add(f.src));
  return [...s];
}"""

found, media_req = set(), set()
with sync_playwright() as p:
    b = p.chromium.launch()
    for url in PAGES:
        for vw in (1440, 390):
            pg = b.new_page(viewport={"width": vw, "height": 900})
            pg.on("response", lambda r: media_req.add(r.url) if re.search(r"\.(jpe?g|png|webp|avif|gif|svg|mp4|webm|mov|m4v)(\?|$)", r.url, re.I) else None)
            pg.goto(url, wait_until="networkidle")
            h = pg.evaluate("document.body.scrollHeight")
            for y in range(0, h + 900, 400):
                pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(150)
            pg.wait_for_timeout(1500)
            found.update(pg.evaluate(JS))
            pg.close()
    b.close()

allm = sorted(u for u in (found | media_req) if "valyog-mester.hu" in u or re.search(r"\.(mp4|webm|mov)", u, re.I))
report = []
for u in allm:
    name = re.sub(r"[^a-zA-Z0-9._-]", "_", u.split("/")[-1].split("?")[0]) or "fajl"
    item = {"url": u, "file": None}
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (DAEKON latvanyterv)"})
        data = urllib.request.urlopen(req, timeout=60).read()
        item["bytes"] = len(data)
        if re.search(r"\.(mp4|webm|mov|m4v)$", name, re.I):
            if len(data) < 60 * 1024 * 1024:
                (OUT / name).write_bytes(data); item["file"] = f"img/foto/{name}"
            else:
                item["note"] = "túl nagy, nem mentve"
        elif name.lower().endswith(".svg"):
            (OUT / name).write_bytes(data); item["file"] = f"img/foto/{name}"
        else:
            im = Image.open(BytesIO(data)); im.load()
            item["size"] = im.size
            stem = Path(name).stem
            rgb = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
            files = []
            for w in (900, 1600, 2400):
                if w > im.size[0] * 1.05 and w != 900:
                    continue
                r = rgb.copy(); r.thumbnail((w, w * 10), Image.LANCZOS)
                fn = f"{stem}-{w}.webp"; r.save(OUT / fn, "WEBP", quality=78, method=6); files.append(f"img/foto/{fn}")
            item["file"] = files
    except Exception as e:  # noqa
        item["error"] = str(e)
    report.append(item)
    print(item)

(ROOT / "_forras" / "media-jelentes.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
