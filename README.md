# DAEKON

**Egyedi szoftverfejlesztés — premium brand identity + élő rendszerfelület.**

🌐 **Élő oldal:** https://daekon-ship.github.io/daekon/

![DAEKON logó](brand/svg/daekon-logo-horizontal-dark.svg)

## Mi van itt?

| Mappa | Tartalom |
|---|---|
| `src/` | A weboldal: egyoldalas React + TypeScript + Vite „élő rendszerfelület" — valós óra, görgetési telemetria, rendelés-állapotgép demó, KIOSZ esettanulmány |
| `brand/svg/` | Teljes logórendszer (horizontal / stacked / mark / wordmark × light / dark / mono) |
| `brand/png/` | Használatra kész PNG-k (1200 px logók, ikonok, favicon.ico) |
| `brand/png/4k/` | 4K renderek: 3840 px-es bannerek, poszterek, logójel, social tile |
| `brand/build/` | Generátor szkriptek: glyph-kivonás, SVG/PNG export, pixel-QA (21/21 pass) |
| `brand/DAEKON-brand.html` | Önálló márkakézikönyv (minden benne: koncepció, szín, tipó, használat) |
| `brand/4k-gallery.html` | 4K galéria egyetlen fájlban (képek beágyazva) |
| `prototypes/` | Korai design prototípusok (a-editorial, c-living-interface) |

## Futtatás

```bash
npm install
npm run dev        # fejlesztői szerver
npm run build      # tsc + vite production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## A márka

- **Logójel:** „Split D" — grafitszár + kék bowl, nyitott varrattal; olvasódik D-ként, kapuként és kettévágott rendszerként is.
- **Színek:** DAEKON kék `#1636E7` (világos háttéren), fénykék `#2B50FF` (sötéten), grafit `#14161B`, éjszaka `#0E1013` — minden párosításon ellenőrzött kontraszttal.
- **Tipó:** Archivo (OFL 1.1), wght 640 — a wordmark kivont vektor, futásidejű font nélkül is pontos.

## Újra-generálás

```bash
cd brand/build
node generate.mjs    # összes SVG + PNG
node qa.mjs          # 21 pixel-teszt
node export4k.mjs    # 4K renderek
node gallery4k.mjs   # galéria HTML
node showcase.mjs    # márkakézikönyv HTML
```
