"""Vanda 11 festményének helyi, nagy felbontású sorozata (a 11 jelenetes mesehez és az aloldalakhoz).

Forrás (`kepek-4k` ág): `orig/` = Vanda eredeti Wix-képei, `out4k/` = Real-ESRGAN x4plus felskálázás.
A tiszta Real-ESRGAN a vízfestéken szögletes, „kristályos” foltokat hagy (pixelesnek hat), ezért:
  kép = 80% Lanczos-nagyítás (enyhe élesítéssel, megtartja a papír- és ecsettextúrát)
      + 20% Real-ESRGAN (tisztább kontúrok).
A kivágások ugyanazok, mint a Wix „fill, al_c” kivágásai voltak (középre igazítva), így a jelenetek
kompozíciója nem csúszik el:
  <kulcs>-d-<w>.webp  asztali 16:10       <kulcs>-m-<w>.webp  mobil 2:3
  <kulcs>-<w>.webp    teljes kép (aloldalak)   <kulcs>-24.webp  apró háttérkép
Használat:  python3 mese_kepek.py <kepek-4k ág mappája>
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "public/latvanytervek/mokusch-premium-v2/img/mese"
DESK_W = (1280, 1920, 2560)
MOB_W = (640, 960, 1280, 1600)
FULL_W = (480, 720, 1080, 1600)


def crop_c(im, ratio):
    W, H = im.size
    if W / H > ratio:
        w = round(H * ratio); x = (W - w) // 2
        return im.crop((x, 0, x + w, H))
    h = round(W / ratio); y = (H - h) // 2
    return im.crop((0, y, W, y + h))


def save_set(im, key, tag, widths, q=86, full=True):
    W, H = im.size
    out = []
    for w in [w for w in widths if w < W] + ([W] if full else []):
        r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        r.save(OUT / f"{key}{tag}{w}.webp", quality=q, method=6)
        out.append(w)
    return out


def main(src):
    src = Path(src)
    for old in OUT.glob("*.webp"):
        old.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for e in sorted((src / "out4k").glob("*.webp")):
        k = e.stem
        o = next((src / "orig").glob(k + ".*"))
        big = Image.open(e).convert("RGB")
        W, H = big.size
        lan = Image.open(o).convert("RGB").resize((W, H), Image.LANCZOS)
        lan = lan.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
        im = Image.blend(lan, big, 0.2)
        d = crop_c(im, 16 / 10)
        m = crop_c(im, 2 / 3)
        meta[k] = {"full": [W, H], "d": save_set(d, k, "-d-", DESK_W), "dh": d.size[1],
                   "m": save_set(m, k, "-m-", MOB_W, full=False), "mh": m.size[1], "f": save_set(im, k, "-", FULL_W, full=False)}
        im.resize((24, round(H * 24 / W)), Image.LANCZOS).save(OUT / f"{k}-24.webp", quality=70)
        print(k, W, H, d.size, m.size, flush=True)
    (HERE / "mese_kepek.json").write_text(json.dumps(meta, indent=1))


if __name__ == "__main__":
    main(sys.argv[1])
