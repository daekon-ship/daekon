#!/usr/bin/env python3
"""Speciális lábápolás — előtte–utána párok kivágása (4:5, egységes méret).
Futtatás: python3 _forras/elotte_utana.py <mellékletek mappája>
Párosítás vizuális egyezés alapján (lábujjforma, nézőpont) — Beatrix megerősítésére vár."""
import sys, os
from PIL import Image, ImageOps
A = sys.argv[1]; OUT = 'img/elotte-utana'; os.makedirs(OUT, exist_ok=True)
# (forrás, kimenet, középpont x, középpont y, kivágás magassága a kép magasságához)
CROPS = [
 ('7067ac9c', 'par1-elotte', .53, .52, 1.0), ('d61eeb39', 'par1-utana', .63, .55, 1.0),
 ('afa924e9', 'par2-elotte', .45, .50, 1.0), ('76cc9629', 'par2-utana', .58, .52, 1.0),
 ('c1535ce3', 'par3-elotte', .36, .40, .78), ('0e26dd32', 'par3-utana', .60, .55, .78),
]
for src, name, cx, cy, hf in CROPS:
    im = ImageOps.exif_transpose(Image.open(f'{A}/{src}-image.jpg')).convert('RGB'); W, H = im.size
    h = round(H * hf); w = round(h * 4 / 5)
    if w > W: w = W; h = round(w * 5 / 4)
    x0 = min(max(round(cx * W - w / 2), 0), W - w); y0 = min(max(round(cy * H - h / 2), 0), H - h)
    c = im.crop((x0, y0, x0 + w, y0 + h))
    for suf, mx in (('', 1200), ('-k', 640)):
        t = c.resize((round(mx * 4 / 5), mx), Image.LANCZOS)
        t.save(f'{OUT}/{name}{suf}.jpg', quality=82, optimize=True, progressive=True)
    print(name, c.size)
