// Kalocsa GeoWorks – szövegkontraszt-mérés (WCAG 2.2 AA 1.4.3) az összes látható szövegre, csökkentett mozgással
// (így a görgetésre beúszó szövegek is láthatók). Kép/videó feletti szöveget kihagyja (ott a háttér nem egyszínű).
// Használat: node tools/tesztek/kontraszt.js <playwright-core> [url] [szélesség...]
const pw = require(process.argv[2]);
const URL = process.argv[3] || 'https://kalocsageoworks.com/';
const W = process.argv.slice(4).map(Number).filter(Boolean);
(async () => {
  const b = await pw.chromium.launch(); let hiba = 0;
  for (const w of (W.length ? W : [390, 1440])) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' })).newPage();
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null; };
      const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
      const mix = (f, bg) => { const a = f[3] ?? 1; return [0, 1, 2].map(i => f[i] * a + bg[i] * (1 - a)); };
      const hatter = el => {
        const reteg = [];
        for (let e = el; e; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.backgroundImage !== 'none' || ['IMG', 'VIDEO', 'PICTURE'].some(t => e.querySelector(':scope > ' + t.toLowerCase()) && e !== el && e.classList.contains('hero'))) return null;
          const c = rgb(cs.backgroundColor); if (c && (c[3] ?? 1) > 0) { reteg.push(c); if ((c[3] ?? 1) >= 1) break; }
        }
        let bg = [255, 255, 255]; for (const c of reteg.reverse()) bg = mix(c, bg); return bg;
      };
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('.hero__media, .lb, .leaflet-container, script, style, svg, [aria-hidden=true], .skip')) continue;
        const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(''); if (!t) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < .1 || !el.getClientRects().length) continue;
        if (el.closest('.hero') && !el.closest('.hero__foot')) continue; // videó/kép feletti szöveg
        const bg = hatter(el); if (!bg) continue;
        const fg = mix(rgb(cs.color), bg); const L1 = lum(fg), L2 = lum(bg);
        const k = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        const px = parseFloat(cs.fontSize), nagy = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
        if (k < (nagy ? 3 : 4.5)) out.push({ el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], hol: (el.closest('section[id], footer, header') || {}).id || el.closest('footer, header')?.tagName, szoveg: t.slice(0, 24), szin: cs.color, hatter: 'rgb(' + bg.map(Math.round) + ')', k: +k.toFixed(2), px });
      }
      return out;
    });
    console.log(`${w}px: ${r.length} kontraszthiba`); r.forEach(x => console.log('   ', JSON.stringify(x))); hiba += r.length;
  }
  await b.close(); process.exit(hiba ? 1 : 0);
})();
