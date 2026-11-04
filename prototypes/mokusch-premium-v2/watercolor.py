#!/usr/bin/env python3
"""Mókusch V2 – akvarell-anyagok generátora (maszkok, festékfoltok, papír).

Minden kimenet átlátszósági (alfa) maszk vagy finom textúra; a SZÍNEKET a CSS-változók adják
(a foltok egy háttérszínes elemre kerülnek mask-image-ként), így a színvilág központilag
cserélhető. Futtatás a repó gyökeréből:
    python3 prototypes/mokusch-premium-v2/watercolor.py
Kimenet: public/latvanytervek/mokusch-premium-v2/img/wc/
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "public/latvanytervek/mokusch-premium-v2/img/wc"
RNG = np.random.default_rng(7)


def smooth_noise(h, w, cell, rng=RNG):
    """Lágy értékzaj: kis rácson véletlen értékek, bikubikus felnagyítás, 0..1."""
    gh, gw = max(2, h // cell + 2), max(2, w // cell + 2)
    g = (rng.random((gh, gw)) * 255).astype(np.uint8)
    im = Image.fromarray(g, "L").resize((w, h), Image.BICUBIC)
    return np.asarray(im, dtype=np.float32) / 255.0


def fbm(h, w, cells=(160, 70, 28, 11), amps=(0.5, 0.28, 0.15, 0.07), rng=RNG):
    n = np.zeros((h, w), np.float32)
    for c, a in zip(cells, amps):
        n += smooth_noise(h, w, c, rng) * a
    return n / sum(amps)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def save_alpha(a, name, size=None, blur=0):
    a = np.clip(a, 0, 1)
    im = Image.fromarray((a * 255).astype(np.uint8), "L")
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    if size:
        im = im.resize(size, Image.LANCZOS)
    la = Image.merge("LA", (Image.new("L", im.size, 0), im))
    la.save(OUT / name, optimize=True)
    print(name, (OUT / name).stat().st_size // 1024, "KB")


def page_mask(w, h, edge=0.1, rough=0.055, seed=1, name="page.png", sides=(1, 1, 1, 1)):
    """Képlap festett, elmosódó szélekkel: belül teljesen fedő, a széleken szabálytalanul kifut."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    big = 10.0
    # távolság a szélektől (oldalanként ki/bekapcsolható – teljes szélességű jeleneteknél csak fent-lent)
    dl = x / w if sides[3] else big
    dr = (w - x) / w if sides[1] else big
    dt = y / h if sides[0] else big
    db = (h - y) / h if sides[2] else big
    d = np.minimum(np.minimum(dl, dr), np.minimum(dt, db))
    n1 = fbm(h, w, (int(w * .35), int(w * .14), int(w * .05)), (0.55, 0.3, 0.15), rng)
    n2 = fbm(h, w, (int(w * .03), int(w * .012)), (0.6, 0.4), rng)
    dd = d + (n1 - 0.5) * rough + (n2 - 0.5) * rough * 0.12
    a = smoothstep(edge * 0.05, edge, dd)
    # vízfolt-„virágzás”: a szél közelében itt-ott áttetszőbb foltok
    bloom = fbm(h, w, (int(w * .09), int(w * .035)), (0.7, 0.3), rng)
    near = 1 - smoothstep(edge * 0.6, edge * 2.4, dd)
    a = a * (1 - near * np.clip((bloom - 0.55) * 1.2, 0, 0.3))
    # pigment-granuláció a szélsávban
    gran = rng.random((h, w)).astype(np.float32)
    a = a * (1 - near * (gran * 0.035))
    save_alpha(a, name, blur=2.2)


def wash(w, h, seed, name, irregular=0.28, edge_dark=0.35, base=0.55):
    """Akvarell festékfolt: szabálytalan forma, sötétebb (pigmentgyűrűs) szél, granuláció."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    ang = np.arctan2(y - cy, x - cx)
    r = np.sqrt(((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2)
    # szabálytalan perem: szögtől függő sugár (több frekvencia)
    rad = 0.78
    for k, amp in ((2, 0.07), (3, 0.06), (5, 0.04), (9, 0.025), (17, 0.012)):
        rad = rad + amp * irregular / 0.28 * np.sin(k * ang + rng.uniform(0, 6.28))
    n = fbm(h, w, (int(w * .25), int(w * .1), int(w * .04)), (0.5, 0.3, 0.2), rng)
    rr = r + (n - 0.5) * 0.18
    inside = 1 - smoothstep(rad - 0.03, rad + 0.01, rr)
    ring = np.exp(-((rr - (rad - 0.035)) / 0.035) ** 2)          # pigment a perem mentén
    body = base * (0.75 + 0.5 * (n - 0.5))                          # egyenetlen festékréteg
    gran = fbm(h, w, (6, 3), (0.6, 0.4), rng)
    a = inside * (body + edge_dark * ring) * (0.85 + 0.3 * (gran - 0.5))
    # belső „víznyomok”: világosabb foltok
    holes = fbm(h, w, (int(w * .12), int(w * .05)), (0.7, 0.3), rng)
    a *= 1 - np.clip((holes - 0.62) * 2.2, 0, 0.5)
    save_alpha(a, name, blur=0.8)


def edge_strip(w, h, seed, name):
    """Vízszintes, festett szél (lábléc, szakaszhatár teteje): alul teljes, felül szabálytalanul kifut."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    n = fbm(h, w, (int(w * .12), int(w * .045), int(w * .015)), (0.55, 0.3, 0.15), rng)
    line = h * 0.55 + (n - 0.5) * h * 0.9
    a = smoothstep(line - h * 0.08, line + h * 0.14, y)
    gran = rng.random((h, w)).astype(np.float32)
    a *= 1 - (1 - smoothstep(line, line + h * .3, y)) * gran * 0.15
    save_alpha(a, name, blur=0.7)


def paper(size=384, seed=3, name="paper.png"):
    """Tükrözés nélkül csempézhető papírszemcse (periodikus zaj FFT-szűréssel), meleg barna, nagyon halvány."""
    rng = np.random.default_rng(seed)
    def periodic(scale):
        wn = rng.standard_normal((size, size))
        f = np.fft.fft2(wn)
        ky = np.fft.fftfreq(size)[:, None]; kx = np.fft.fftfreq(size)[None, :]
        k = np.sqrt(kx ** 2 + ky ** 2)
        filt = np.exp(-(k * scale) ** 2)
        out = np.real(np.fft.ifft2(f * filt))
        return (out - out.mean()) / (out.std() + 1e-6)
    g = periodic(60) * 0.45 + periodic(12) * 0.35 + periodic(2.5) * 0.2
    # rostok: elnyújtott zaj
    fib = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((size, size))) *
                               np.exp(-((np.fft.fftfreq(size)[:, None] * 6) ** 2 + (np.fft.fftfreq(size)[None, :] * 16) ** 2))))
    fib = (fib - fib.mean()) / (fib.std() + 1e-6)
    a = np.clip(0.018 + g * 0.013 + np.clip(fib, 0, None) * 0.008, 0, 0.06)
    rgb = np.zeros((size, size, 4), np.uint8)
    rgb[..., 0], rgb[..., 1], rgb[..., 2] = 92, 70, 48
    rgb[..., 3] = (a * 255).astype(np.uint8)
    Image.fromarray(rgb, "RGBA").save(OUT / name, optimize=True)
    print(name, (OUT / name).stat().st_size // 1024, "KB")


def scene_desk(w=900, h=800, seed=15, name="scene-desk.png", edges=(0.07, 0.035, 0.07, 0.34)):
    """Asztali jelenet: a festmény bal széle hosszan, lágyan kifut a papírba (ott a szöveg),
    a többi szél rövidebb, szabálytalan, festékszerű. edges = (fent, jobb, lent, bal) arányban."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    et, er, eb, el = edges
    d = np.minimum.reduce([(y / h) / et, ((w - x) / w) / er, ((h - y) / h) / eb, (x / w) / el])
    n1 = fbm(h, w, (int(w * .3), int(w * .12), int(w * .045)), (0.55, 0.3, 0.15), rng)
    dd = d + (n1 - 0.5) * 0.7
    a = smoothstep(0.05, 1.0, dd)
    bloom = fbm(h, w, (int(w * .08), int(w * .03)), (0.7, 0.3), rng)
    near = 1 - smoothstep(0.6, 1.8, dd)
    a = a * (1 - near * np.clip((bloom - 0.55) * 1.2, 0, 0.3))
    save_alpha(a, name, blur=2.4)


def bloom(size=600, seed=41, name="bloom.png"):
    """Akvarell „virágzás”: középen teljesen fedő, szabálytalan, festékszerű szélű folt. A következő jelenet
    ebből a foltból nyílik ki, mintha a festék szétfutna a papíron (a CSS maszk méretét a JS növeli)."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.hypot(x - size / 2, y - size / 2) / (size / 2)
    ang = np.arctan2(y - size / 2, x - size / 2)
    lobes = 0.045 * np.sin(ang * 5 + 1.3) + 0.03 * np.sin(ang * 9 + 0.4) + 0.015 * np.sin(ang * 17 + 2.2)
    n1 = fbm(size, size, (int(size * .18), int(size * .07), int(size * .025)), (0.55, 0.3, 0.15), rng)
    rr = r + lobes + (n1 - 0.5) * 0.3
    a = 1 - smoothstep(0.62, 0.9, rr)
    tide = 1 - smoothstep(0.03, 0.09, np.abs(rr - 0.74))      # festékperem: a szél felé enyhe sötétedés helyett halvány gyűrű
    a = np.clip(a * (1 - 0.12 * tide), 0, 1)
    save_alpha(a, name, blur=1.6)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    page_mask(400, 600, seed=11, name="page.png")                       # álló képlap (2:3, 3:4, 4:5 is jó)
    page_mask(600, 420, seed=12, name="page-wide.png")                  # fekvő képlap
    page_mask(420, 900, edge=0.11, rough=0.08, seed=13, name="scene-tall.png", sides=(1, 0, 1, 0))  # mobil teljes jelenet: fent-lent fut ki
    page_mask(900, 560, edge=0.12, rough=0.07, seed=14, name="scene-wide.png")  # asztali nagy jelenetlap
    wash(520, 440, 21, "wash-1.png")
    wash(480, 520, 22, "wash-2.png", irregular=0.34)
    wash(560, 380, 23, "wash-3.png", irregular=0.22, base=0.5)
    edge_strip(1200, 90, 31, "edge.png")
    paper()
    scene_desk()
    scene_desk(1000, 640, seed=16, name="scene-full.png", edges=(0.06, 0.035, 0.06, 0.035))      # teljes képernyős jelenet (asztal)
    scene_desk(480, 900, seed=17, name="scene-full-tall.png", edges=(0.035, 0.05, 0.05, 0.05))   # teljes képernyős jelenet (mobil)
    bloom()
    # a teljes képernyős jelenetek széle egyetlen álló „papírkeretként” kerül a képek fölé (inverz maszk) – így a mozgó
    # képeken nincs maszk, a görgetés gyorsabb
    from PIL import Image as _I
    for n in ("scene-full", "scene-full-tall"):
        im = _I.open(OUT / f"{n}.png"); l, a = im.split()
        _I.merge("LA", (l, a.point(lambda v: 255 - v))).save(OUT / f"{n}-inv.png", optimize=True)

