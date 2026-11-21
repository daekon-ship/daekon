#!/usr/bin/env node
/**
 * Bemutató- és tesztállapot előállítása a fejlesztői adatkészletből (demo-dataset.json).
 * NEM éles adat: az állapot „demo: true” jelölést kap – a kezelőfelület ezt kiírja, az élesítési
 * ellenőrzés tilt, és a bin/demo-seed.php csak üres adatbázisba tölti be.
 *
 *   node dev/make-demo-state.mjs            → mind a 115 gyűrű látszik; 3 mintagyűrű (2 jóváhagyott, 1 jóváhagyásra vár), szemléltető árak jóváhagyva
 *   node dev/make-demo-state.mjs --mind     → minden gyűrű látszik, semmi nincs jóváhagyva, az árak az adatkészlet szerinti
 *                                             (példa/bemutató) jelöléssel – automata tesztekhez
 */
import { readFileSync } from 'node:fs';
const site = new URL('../../../public/latvanytervek/karikagyuru/js/', import.meta.url);
const { buildDemoProducts } = await import(new URL('data.js', site));
const { seedWeights } = await import(new URL('engine.js', site));
const ds = JSON.parse(readFileSync(new URL('./demo-dataset.json', import.meta.url), 'utf8'));
const all = process.argv.includes('--mind');
const clone = (x) => JSON.parse(JSON.stringify(x));

const materials = clone(ds.materials), settings = clone(ds.settings);
let products = buildDemoProducts();
products.forEach((p) => p.rings.forEach((r) => { r.labor = ds.laborByStyle[p.style] ?? null; }));
products = seedWeights(products, materials, settings);

if (!all) {
  const ok = 'jovahagyott';
  // V5.6: a teljes katalógus látszik (115 gyűrű); a 3 mintagyűrű közül 2 jóváhagyott (beállítható, szemléltető árral),
  // 1 jóváhagyásra vár. A többi gyűrű nincs jóváhagyva → a mostani nyilvános listaárát vagy „egyedi ajánlat”-ot mutat.
  products.forEach((p) => { p.visible = true; p.approved = ds.samples.approved.includes(p.id); });
  for (const k of Object.keys(materials.sellPerGram)) if (materials.sellPerGram[k] != null) materials.src[`sellPerGram.${k}`] = ok;
  materials.diamonds.forEach((d) => { if (d.price != null) d.src = ok; });
  for (const k of Object.keys(settings.src)) settings.src[k] = ok;
}
const at = new Date().toISOString();
const state = {
  v: 15, demo: true, products, materials, settings, inquiries: [], lastChange: null,
  history: [{ id: 'demo-start', at, validFrom: at, by: 'Rendszer', kind: 'start', title: 'Bemutató mintaadatok betöltve – NEM éles árak, NEM jóváhagyott ügyféladat', count: 0, total: 0 }],
};
process.stdout.write(JSON.stringify(state));
