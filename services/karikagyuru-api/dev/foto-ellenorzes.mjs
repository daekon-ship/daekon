#!/usr/bin/env node
/**
 * Karikagyuru.com – termékfotók ellenőrzése, letöltése és optimalizálása (V5.6).
 *
 *   node services/karikagyuru-api/dev/foto-ellenorzes.mjs            # ellenőrzés + letöltés, ahol lehet
 *   node services/karikagyuru-api/dev/foto-ellenorzes.mjs --csak-ellenorzes
 *
 * Mit csinál:
 *  - végigmegy mind a katalógus termékén (js/data.js → buildDemoProducts),
 *  - helyi képnél: megvan-e a nagy (1600 px) és a kártyaméretű (-800) fájl, és érvényes kép-e,
 *  - külső képnél (karikagyuru.com): letölti, ellenőrzi, hogy valódi kép, és két méretben
 *    elmenti az img/termekek/ mappába (1600 px termékoldalra, 800 px kártyára, JPEG, metaadat nélkül),
 *  - a sikeresen letöltött fájlokat beírja a js/photos.js-be → a weboldal ezután a helyi fájlt használja,
 *  - géppel olvasható jelentést ír: docs/KATALOGUS_JELENTES.json és .md.
 *
 * Csak az ügyfél saját weboldalán lévő, a saját termékeit ábrázoló fotókat tölti le.
 * Mesterséges képet nem készít; ami nem érhető el, az „Fotó hamarosan” helykitöltővel marad a katalógusban.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// A sharp lehet helyi (npm i sharp) vagy globális telepítés is.
const require = createRequire(import.meta.url);
const sharp = (() => { try { return require('sharp'); } catch { return require(require.resolve('sharp', { paths: (process.env.NODE_PATH || '').split(':').concat('/opt/npm-tools/node_modules') })); } })();

const here = path.dirname(fileURLToPath(import.meta.url));
// KG_SITE / KG_FOTO_FORRAS: csak a teszthez (másolt weboldalmappa, helyi álszerver) – élesben nem kell megadni.
const SITE = process.env.KG_SITE || path.resolve(here, '../../../public/latvanytervek/karikagyuru');
const IMG_DIR = path.join(SITE, 'img/termekek');
const ONLY_CHECK = process.argv.includes('--csak-ellenorzes');
const TIMEOUT = 20000;

const { buildDemoProducts, REMOTE_IMG } = await import(path.join(SITE, 'js/data.js'));
const products = buildDemoProducts();
const SOURCE = process.env.KG_FOTO_FORRAS || REMOTE_IMG;

async function validImage(file) {
  try { const m = await sharp(file).metadata(); return m.width > 0 && m.height > 0 ? m : null; } catch { return null; }
}

async function saveSizes(buf, name) {
  const base = path.join(IMG_DIR, name);
  const img = sharp(buf, { failOn: 'error' }).rotate();          // EXIF-forgatás, a metaadat nem kerül át
  await img.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(base);
  await img.clone().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(base.replace(/\.jpg$/, '-800.jpg'));
}

async function download(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'DAEKON-foto-ellenorzes/1.0' } });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const type = r.headers.get('content-type') || '';
    if (!/^image\//.test(type)) return { error: `nem kép (${type || 'ismeretlen típus'})` };
    const buf = Buffer.from(await r.arrayBuffer());
    const m = await sharp(buf).metadata().catch(() => null);
    if (!m?.width) return { error: 'sérült képfájl' };
    return { buf, width: m.width, height: m.height };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'időtúllépés' : `hálózati hiba: ${e.cause?.code || e.cause?.message || e.message}` };
  } finally { clearTimeout(t); }
}

// A korábbi futásokból már helyben lévő (letöltött) fájlok megmaradnak.
let localFiles = new Set();
try { localFiles = new Set((await import(path.join(SITE, 'js/photos.js'))).LOCAL_FILES); } catch { /* első futás */ }

const rows = [];
for (const p of products) {
  const row = { id: p.id, code: p.code, visible: p.visible !== false };
  if (!p.img) { rows.push({ ...row, status: 'hianyzik', reason: 'nincs megadva fotó' }); continue; }
  if (!/^https?:/.test(p.img)) {
    const big = path.join(SITE, p.img), card = big.replace(/\.jpg$/, '-800.jpg');
    const ok1 = fs.existsSync(big) && await validImage(big), ok2 = fs.existsSync(card) && await validImage(card);
    rows.push(ok1 && ok2 ? { ...row, status: 'helyi', file: p.img }
      : { ...row, status: 'torott', file: p.img, reason: !ok1 ? 'hiányzik vagy sérült a nagy kép' : 'hiányzik vagy sérült a kártyakép' });
    continue;
  }
  const name = decodeURIComponent(p.img.slice(REMOTE_IMG.length)).toLowerCase();
  if (ONLY_CHECK) { rows.push({ ...row, status: 'kulso', url: p.img, reason: 'letöltést nem kértünk (--csak-ellenorzes)' }); continue; }
  const url = SOURCE + p.img.slice(REMOTE_IMG.length);
  const d = await download(url);
  if (d.error) { rows.push({ ...row, status: 'kulso', url, downloadError: d.error }); continue; }
  await saveSizes(d.buf, name);
  localFiles.add(name);
  rows.push({ ...row, status: 'helyi', file: 'img/termekek/' + name, downloaded: true, source: url, original: `${d.width}×${d.height}` });
  process.stdout.write('.');
}

fs.writeFileSync(path.join(SITE, 'js/photos.js'),
  `/* A dev/foto-ellenorzes.mjs írja: azok a karikagyuru.com-os termékfotók, amelyek már helyben, optimalizálva megvannak\n   (img/termekek/<név>.jpg és <név>-800.jpg). Ami nincs itt, az még a karikagyuru.com-ról töltődik. */\n` +
  `export const LOCAL_FILES = ${JSON.stringify([...localFiles].sort(), null, 2)};\n`);

const count = (s) => rows.filter((r) => r.status === s).length;
const report = {
  generated: new Date().toISOString(),
  osszes_termek: rows.length,
  katalogusban_lathato: rows.filter((r) => r.visible).length,
  helyi_foto: count('helyi'),
  kulso_foto: count('kulso'),
  hianyzo_foto: count('hianyzik'),
  torott_utvonal: rows.filter((r) => r.status === 'torott').map((r) => ({ code: r.code, file: r.file, reason: r.reason })),
  sikertelen_letoltes: rows.filter((r) => r.downloadError).map((r) => ({ code: r.code, url: r.url, error: r.downloadError })),
  most_letoltve: rows.filter((r) => r.downloaded).length,
  megjegyzes: 'A külső fotók elérhetőségét csak a letöltés igazolja. Ami „kulso”, annak elérhetősége ebben a futásban nem igazolt; a katalógusban „Fotó hamarosan” helykitöltő jelenik meg, ha a böngészőben nem tölt be.',
  termekek: rows,
};
fs.writeFileSync(path.join(SITE, 'docs/KATALOGUS_JELENTES.json'), JSON.stringify(report, null, 2) + '\n');

const errs = {}; report.sikertelen_letoltes.forEach((x) => { errs[x.error] = (errs[x.error] || 0) + 1; });
const md = `# Katalógus- és fotójelentés

Készült: ${report.generated} · géppel olvasható változat: \`KATALOGUS_JELENTES.json\`
Újrafuttatás: \`node services/karikagyuru-api/dev/foto-ellenorzes.mjs\`

| | darab |
|---|---|
| Összes termék | ${report.osszes_termek} |
| Katalógusban látható (kép nélkül is) | ${report.katalogusban_lathato} |
| Helyi, optimalizált fotó (1600 + 800 px) | ${report.helyi_foto} |
| Külső fotó (karikagyuru.com-ról töltődik) | ${report.kulso_foto} |
| Hiányzó fotó | ${report.hianyzo_foto} |
| Törött helyi útvonal | ${report.torott_utvonal.length} |
| Sikertelen letöltés | ${report.sikertelen_letoltes.length} |
| Ebben a futásban letöltve | ${report.most_letoltve} |

${Object.keys(errs).length ? `**Sikertelen letöltések oka:** ${Object.entries(errs).map(([k, v]) => `${k} (${v})`).join(', ')}.\n` : ''}
${report.torott_utvonal.length ? `**Törött útvonalak:**\n\n${report.torott_utvonal.map((x) => `- ${x.code}: \`${x.file}\` – ${x.reason}`).join('\n')}\n` : ''}
${report.megjegyzes}
`;
fs.writeFileSync(path.join(SITE, 'docs/KATALOGUS_JELENTES.md'), md);
console.log(`\n${report.osszes_termek} termék · helyi ${report.helyi_foto} · külső ${report.kulso_foto} · hiányzó ${report.hianyzo_foto} · törött ${report.torott_utvonal.length} · sikertelen letöltés ${report.sikertelen_letoltes.length} · most letöltve ${report.most_letoltve}`);
process.exitCode = report.torott_utvonal.length ? 1 : 0;
