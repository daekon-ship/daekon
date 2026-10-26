#!/usr/bin/env python3
"""Ideiglenes felirat-logó (illusztráció nélkül), amíg nincs végleges logó.
Futtatás: python3 _forras/logo_nev.py"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from logo import text_path, svg, write, INK, PAPER, GOLD  # noqa: E402

def felirat(fname, ink, sub, bg=None):
    d1, w1 = text_path('Balogh', 440, 44, 0, 50)
    d2, w2 = text_path('Beatrix', 640, 44, w1 + 11, 50)
    wn = w1 + 11 + w2
    d3, w3 = text_path('KÉZ- ÉS LÁBÁPOLÁS', 600, 11.5, 1, 74, track=3.2)
    body = f'<path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{ink}"/><path d="{d3}" fill="{sub}"/>'
    write(fname, svg(max(wn, w3) + 4, 84, body, 'Balogh Beatrix — kéz- és lábápolás', bg))

def ikon():
    d, w = text_path('B', 680, 38, 0, 0)
    d, _ = text_path('B', 680, 38, 32 - w / 2, 45)
    write('favicon.svg', svg(64, 64, f'<rect width="64" height="64" rx="14" fill="{INK}"/><path d="{d}" fill="{PAPER}"/><circle cx="47" cy="44" r="3.2" fill="{GOLD}"/>', 'Balogh Beatrix'))

if __name__ == '__main__':
    felirat('logo-nev.svg', INK, '#8E6A50')
    felirat('logo-nev-sotet.svg', PAPER, '#CDB49C')
    ikon()
