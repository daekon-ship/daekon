"""Furnértextúrák programból (nem fotó!) – csempézhető, 512 px.

FFT-alapú, irányított zaj -> periodikus, ezért varrat nélkül ismételhető.
Kimenet: img/furner-<faj>.jpg
"""
import os
import numpy as np
from PIL import Image

N = 512
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'img')
rng = np.random.default_rng(7)

def fft_noise(sx, sy, seed):
    """Periodikus zaj; sx, sy: a megtartott frekvenciák szélessége (kicsi = sima)."""
    r = np.random.default_rng(seed)
    w = r.standard_normal((N, N))
    fx = np.fft.fftfreq(N)[None, :] * N
    fy = np.fft.fftfreq(N)[:, None] * N
    filt = np.exp(-(fx / sx) ** 2 - (fy / sy) ** 2)
    out = np.real(np.fft.ifft2(np.fft.fft2(w) * filt))
    return (out - out.mean()) / (out.std() + 1e-9)

def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float)

# faj: (világos tónus, sötét tónus, csíkok száma/tile, hullámzás, rost-erősség, sugárfolt)
FAJOK = {
    'juhar':      ('#F2E7D5', '#E0CDB0', 44, .35, .10, 0),
    'koris':      ('#ECDFC8', '#CBB291', 30, .7, .14, 0),
    'korte':      ('#E8CDB2', '#D4B093', 40, .3, .07, 0),
    'cseresznye': ('#CC9C78', '#A87556', 36, .55, .11, 0),
    'tolgy':      ('#DCC29C', '#B39169', 28, .8, .16, 1),
    'dio':        ('#8E705A', '#5F4938', 32, .9, .13, 0),
}

def make(nev, light, dark, stripes, wave, fiber, ray, seed):
    y, x = np.mgrid[0:N, 0:N] / N
    warp = fft_noise(2.5, 1.0, seed) * wave * 0.03 + fft_noise(7, 1.5, seed + 1) * wave * 0.006
    phase = 2 * np.pi * stripes * (x + warp)
    rings = 0.5 + 0.5 * np.sin(phase)
    rings = rings ** 2.2                          # éles késői pászta, lágy korai pászta
    fib = fft_noise(N / 3, 6, seed + 2) * fiber   # finom, hosszanti rostok
    blot = fft_noise(5, 5, seed + 3) * 0.07       # enyhe tónuskülönbség
    t = np.clip(rings * 0.62 + fib + blot + 0.14, 0, 1)
    if ray:  # tölgy: rövid, keresztirányú bélsugár-foltok
        rays = np.clip(fft_noise(3, 40, seed + 4) - 1.6, 0, None) * 0.35
        t = np.clip(t - rays, 0, 1)
    L, D = hexrgb(light), hexrgb(dark)
    img = L[None, None, :] * (1 - t[..., None]) + D[None, None, :] * t[..., None]
    # fénycsillogás (chatoyance) nagyon finoman
    img *= (1 + fft_noise(2, 6, seed + 5)[..., None] * 0.018)
    Image.fromarray(np.clip(img, 0, 255).astype('uint8')).save(
        os.path.join(OUT, f'furner-{nev}.jpg'), quality=84, optimize=True, progressive=True)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for i, (k, v) in enumerate(FAJOK.items()):
        make(k, *v, seed=11 + i * 10)
    print('kész')
