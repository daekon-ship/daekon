#!/usr/bin/env python3
"""Beatrix saját logójának és munkafotóinak feldolgozása.
Futtatás: python3 _forras/kepek.py <mellékletek mappája> <balogh-beatrix mappa>
A bemeneti fájlnevek az ügyfél által küldött eredeti képek azonosítói."""
import sys, numpy as np
from PIL import Image, ImageOps
A, OUT = sys.argv[1], sys.argv[2]
import os; os.makedirs(OUT+'/img/munkak', exist_ok=True); os.makedirs(OUT+'/arculat', exist_ok=True)
def load(i): return ImageOps.exif_transpose(Image.open(f'{A}/{i}-image.jpg')).convert('RGB')

# ---- logó: tinta → alfa ----
L = np.array(Image.open(f'{A}/75376d8c-image.jpg').convert('L')).astype(float)
L[560:617, 990:1040] = 229  # kósza „A" jel a B szára fölött
alpha = np.clip((229 - L) / (229 - 40), 0, 1)
alpha[alpha < .06] = 0
from scipy import ndimage
# kósza apró jelek a B felső szára körül
lab, n = ndimage.label(alpha > .05)
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    ys, xs = sl
    if ys.start > 570 and ys.stop < 650 and xs.start > 900 and xs.stop < 1060 and (lab[sl] == i).sum() < 400:
        alpha[lab == i] = 0
def mk(col, a, name, box, h):
    rgba = np.zeros(a.shape + (4,), np.uint8); rgba[..., :3] = col; rgba[..., 3] = (a * 255).astype(np.uint8)
    im = Image.fromarray(rgba).crop(box); w = round(im.width * h / im.height)
    im.resize((w, h), Image.LANCZOS).save(f'{OUT}/arculat/{name}', optimize=True); return w
INK, CREAM = (43, 39, 37), (247, 244, 239)
FULL = (592, 448, 1542, 1306)
for col, n in ((INK, 'logo-beatrix.png'), (CREAM, 'logo-beatrix-vilagos.png')): print(n, mk(col, alpha, n, FULL, 600))
# vízszintes fejléc-változat: B-embléma balra, BEATRIX + alcím jobbra (az eredeti elemekből)
def lockup(col, name):
    rgba = np.zeros(alpha.shape + (4,), np.uint8); rgba[..., :3] = col; rgba[..., 3] = (alpha * 255).astype(np.uint8)
    src = Image.fromarray(rgba)
    mark = src.crop((640, 445, 1260, 1145))          # B + virágok
    wa = alpha[1130:1300, 600:1530].copy()
    lab, n = ndimage.label(wa > .03)
    cap = int(np.argmax((wa > .3).sum(1) > 250))      # a BEATRIX nagybetűk felső széle
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl[0].start < 4: (wa[:cap - 1])[lab[:cap - 1] == i] = 0   # belelógó levél a felirat fölött
    wa[:max(cap - 3, 0)] = 0
    lab, n = ndimage.label(wa > .03)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl[0].start < cap + 40 and sl[0].stop < cap + 60 and (lab == i).sum() < 900: wa[lab == i] = 0
    wr = np.zeros(wa.shape + (4,), np.uint8); wr[..., :3] = col; wr[..., 3] = (wa * 255).astype(np.uint8)
    word = Image.fromarray(wr).crop((0, max(cap - 3, 0), wa.shape[1], wa.shape[0]))
    H = 240; mw = round(mark.width * H / mark.height); mark = mark.resize((mw, H), Image.LANCZOS)
    WH = 112; ww = round(word.width * WH / word.height); word = word.resize((ww, WH), Image.LANCZOS)
    gap = 26; can = Image.new('RGBA', (mw + gap + ww, H), (0, 0, 0, 0))
    can.paste(mark, (0, 0), mark); can.paste(word, (mw + gap, (H - WH) // 2 + 8), word)
    can.save(f'{OUT}/arculat/{name}', optimize=True); print(name, can.size)
lockup(INK, 'logo-fejlec.png'); lockup(CREAM, 'logo-fejlec-vilagos.png')
# favicon / ikon: B embléma krémes alapon
rgba = np.zeros(alpha.shape + (4,), np.uint8); rgba[..., :3] = INK; rgba[..., 3] = (alpha * 255).astype(np.uint8)
m = Image.fromarray(rgba).crop((640, 445, 1260, 1145)); s = 512
bg = Image.new('RGBA', (s, s), (234, 229, 223, 255)); mm = m.copy(); mm.thumbnail((400, 400), Image.LANCZOS)
bg.paste(mm, ((s - mm.width) // 2, (s - mm.height) // 2), mm); bg.convert('RGB').save(f'{OUT}/img/ikon-512.png')
bg.resize((180, 180), Image.LANCZOS).convert('RGB').save(f'{OUT}/img/apple-touch-icon.png')
bg.resize((48, 48), Image.LANCZOS).save(f'{OUT}/img/favicon-48.png')

# ---- munkafotók: (forrás, kimenet, kivágás arányokban x0,y0,x1,y1) ----
# Arcok, nyak, áll levágva; kézfotók és kezelés utáni, rendezett lábfotók.
PICS = [
 ('9e4042fd', 'magenta-1', (0, .34, 1, 1)),
 ('b1194264', 'magenta-2', (0, .27, 1, 1)),
 ('7daa8ed4', 'magenta-3', (0, .16, .92, 1)),
 ('47e9a5e4', 'levendula-1', (0, .04, 1, .96)),
 ('b9743407', 'levendula-2', (0, .08, 1, .92)),
 ('72e812c4', 'levendula-3', (0, .1, 1, .95)),
 ('b6837c6d', 'levendula-4', (0, .12, 1, 1)),
 ('fab05fb2', 'gyongyhaz-1', (0, .22, 1, 1)),
 ('f5b56168', 'gyongyhaz-2', (0, .08, 1, 1)),
 ('56f1490c', 'gyongyhaz-3', (0, .24, 1, 1)),
 ('fff694e5', 'gyongyhaz-4', (0, .2, 1, 1)),
 ('c7915bd6', 'gyongyhaz-5', (0, .12, 1, 1)),
 ('0154c950', 'csokolade-1', (0, 0, 1, 1)),
 ('e0bb54e9', 'neon-1', (0, .27, 1, 1)),
 ('efb2cacd', 'neon-2', (0, .22, 1, 1)),
 ('76cc9629', 'pedikur-1', (0, 0, 1, 1)),
 ('d61eeb39', 'pedikur-2', (0, 0, 1, 1)),
]
for src, name, (x0, y0, x1, y1) in PICS:
    im = load(src); W, H = im.size
    im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
    for suf, mx in (('', 1600), ('-k', 760)):
        c = im.copy(); c.thumbnail((mx, mx), Image.LANCZOS)
        c.save(f'{OUT}/img/munkak/{name}{suf}.jpg', quality=80 if suf else 76, optimize=True, progressive=True)
    print(name, im.size, c.size)
# összesítő a vizuális ellenőrzéshez
