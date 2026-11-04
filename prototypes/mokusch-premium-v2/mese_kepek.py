"""Vanda 11 festményének helyi, reszponzív sorozata a 4K-ra felskálázott képekből.

Forrás: a `kepek-4k` ág `out4k/` mappája (GitHub Actions, Real-ESRGAN x4plus, majd 3840 px
hosszabb oldal). Ugyanazok a festmények, csak nagyobb felbontásban – új tartalom nincs bennük.

Használat:  python3 mese_kepek.py <out4k-mappa>
Kimenet:    public/latvanytervek/mokusch-premium-v2/img/mese/<kulcs>-<szélesség>.webp
            + <kulcs>-24.webp (apró, elmosódó háttérhez) és mese_kepek.json (méretek)
"""
import json
import sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "public/latvanytervek/mokusch-premium-v2/img/mese"
WIDTHS = (480, 720, 1080, 1600, 2200)


def main(src):
    OUT.mkdir(parents=True, exist_ok=True)
    sizes = {}
    for f in sorted(Path(src).glob("*.webp")):
        k = f.stem
        im = Image.open(f).convert("RGB")
        W, H = im.size
        for w in [w for w in WIDTHS if w < W] + [W]:
            r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
            q = 86 if w <= 1080 else 84
            r.save(OUT / f"{k}-{w}.webp", quality=q, method=6)
        im.resize((24, round(H * 24 / W)), Image.LANCZOS).save(OUT / f"{k}-24.webp", quality=70)
        sizes[k] = [W, H]
        print(k, W, H)
    (HERE / "mese_kepek.json").write_text(json.dumps(sizes, indent=1))


if __name__ == "__main__":
    main(sys.argv[1])
