"""Vályog-Mester – programból rajzolt anyagtextúrák (nem fotók).

Futtatás:  python3 _forras/texturak.py   (a valyog-mester mappából)
Kimenet:   img/tx-*.webp  – csempézhető (tileable) textúrák
"""
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "img"
OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(7)


def fbm(size, octaves=6, base=4, persistence=0.55, seed=0):
    """Csempézhető fraktál zaj (bilineáris interpolált rácsokból)."""
    r = np.random.default_rng(seed)
    acc = np.zeros((size, size))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cells = base * 2 ** o
        grid = r.random((cells, cells))
        # csempézhető: körbeérő rács
        y = np.linspace(0, cells, size, endpoint=False)
        x = np.linspace(0, cells, size, endpoint=False)
        y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int)
        fy = (y - y0)[:, None]; fx = (x - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        y1 = (y0 + 1) % cells; x1 = (x0 + 1) % cells
        a = grid[y0][:, x0]; b = grid[y0][:, x1]
        c = grid[y1][:, x0]; d = grid[y1][:, x1]
        v = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
        acc += v * amp
        total += amp
        amp *= persistence
    return acc / total


def colorize(n, c0, c1):
    c0 = np.array(c0, float); c1 = np.array(c1, float)
    return (c0[None, None, :] * (1 - n[..., None]) + c1[None, None, :] * n[..., None])


def save(arr, name, q=78):
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    img.save(OUT / name, "WEBP", quality=q, method=6)
    print(name, img.size, (OUT / name).stat().st_size // 1024, "KB")


S = 512

# 1) Papírszemcse – világos alapokra (szürkeárnyalatos, átlátszó overlayként használva)
n = fbm(S, 7, 16, 0.6, 1)
grain = (rng.random((S, S)) - .5) * .35
g = np.clip((n - n.mean()) * 1.6 + grain + .5, 0, 1) * 255
img = Image.fromarray(g.astype(np.uint8), "L")
img.save(OUT / "tx-szemcse.webp", "WEBP", quality=70)
print("tx-szemcse.webp")

# 2) Meszelt vakolat – egyenetlen fehér
n = fbm(S, 7, 3, 0.58, 2)
d = fbm(S, 5, 24, 0.5, 3)
v = np.clip(n * .75 + d * .25, 0, 1)
arr = colorize(v, (226, 218, 203), (250, 247, 240))
arr += (rng.random((S, S, 1)) - .5) * 7
save(arr, "tx-mesz.webp")

# 3) Vályog (agyag + szalma) – meleg agyagbarna, szalmaszálakkal
n = fbm(S, 7, 6, 0.55, 4)
arr = colorize(n, (150, 92, 58), (196, 138, 95))
arr += (rng.random((S, S, 1)) - .5) * 14
straw = Image.new("L", (S, S), 0)
from PIL import ImageDraw
dr = ImageDraw.Draw(straw)
for _ in range(900):
    x, y = rng.random() * S, rng.random() * S
    ang = rng.normal(0, .5)
    ln = rng.uniform(4, 16)
    for dx in (-S, 0, S):
        for dy in (-S, 0, S):
            dr.line([(x + dx, y + dy), (x + dx + np.cos(ang) * ln, y + dy + np.sin(ang) * ln)],
                    fill=int(rng.uniform(90, 200)), width=1)
straw = np.asarray(straw.filter(ImageFilter.GaussianBlur(.4)), float)[..., None] / 255
arr = arr * (1 - straw * .55) + np.array([224, 190, 120]) * straw * .55
save(arr, "tx-valyog.webp")

# 4) Vert fal – vízszintes döngölt rétegek
n = fbm(S, 6, 5, 0.55, 5)
yy = np.linspace(0, 1, S, endpoint=False)[:, None]
layers = (np.sin(yy * np.pi * 2 * 9 + n * 2.2) * .5 + .5) ** 3
v = np.clip(n * .7 + layers * .3, 0, 1)
arr = colorize(v, (139, 99, 70), (186, 150, 112))
arr += (rng.random((S, S, 1)) - .5) * 16
save(arr, "tx-vertfal.webp")

# 5) Sötét erdőzöld anyag – hero és lábléc háttér
n = fbm(S, 7, 4, 0.6, 6)
arr = colorize(n, (30, 44, 36), (44, 61, 51))
arr += (rng.random((S, S, 1)) - .5) * 6
save(arr, "tx-erdo.webp", 72)

# 6) Homok – égetett agyag hatású meleg felület
n = fbm(S, 7, 5, 0.58, 8)
arr = colorize(n, (222, 207, 186), (238, 228, 212))
arr += (rng.random((S, S, 1)) - .5) * 6
save(arr, "tx-homok.webp", 74)
