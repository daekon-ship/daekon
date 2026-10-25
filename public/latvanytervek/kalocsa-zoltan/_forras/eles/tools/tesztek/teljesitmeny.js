// Kalocsa GeoWorks – teljesítménymérés (Chromium + CDP). Laboratóriumi mérés, nem valós felhasználói (CrUX) adat.
// Használat: node tools/tesztek/teljesitmeny.js <playwright-core útvonal> [url] [ismétlés=3]
// Mobil: 390×844, 4× CPU-lassítás, ~„lassú 4G” (1,6 Mb/s le, 150 ms RTT). Asztali: 1440×900, lassítás nélkül.
const pw = require(process.argv[2]);
const URL = process.argv[3] || 'https://kalocsageoworks.com/';
const N = +(process.argv[4] || 3);

async function egy(browser, mobil) {
  const ctx = await browser.newContext(mobil ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (mobil) {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  const atvitel = {}; let keres = 0;
  cdp.on('Network.loadingFinished', e => { atvitel[e.requestId] = e.encodedDataLength; });
  const tipus = {};
  cdp.on('Network.responseReceived', e => { keres++; tipus[e.requestId] = e.type; });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0, lcpEl: '' };
    new PerformanceObserver(l => { const e = l.getEntries().at(-1); window.__m.lcp = e.startTime; window.__m.lcpEl = e.element ? e.element.tagName + '.' + e.element.className : e.url; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000);
  const m = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0], fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { ttfb: Math.round(n.responseStart), fcp: Math.round(fcp ? fcp.startTime : 0), lcp: Math.round(window.__m.lcp), lcpEl: window.__m.lcpEl, cls: +window.__m.cls.toFixed(3), load: Math.round(n.loadEventEnd), dom: document.getElementsByTagName('*').length };
  });
  const kb = t => Math.round(Object.entries(atvitel).filter(([id]) => !t || tipus[id] === t).reduce((a, [, v]) => a + v, 0) / 1024);
  Object.assign(m, { keres, osszKB: kb(), jsKB: kb('Script'), cssKB: kb('Stylesheet'), kepKB: kb('Image'), mediaKB: kb('Media'), betuKB: kb('Font') });
  await ctx.close();
  return m;
}

(async () => {
  const browser = await pw.chromium.launch();
  console.log(`Teljesítmény – ${URL} – ${new Date().toISOString()} – ${N} mérés/nézet, medián`);
  for (const mobil of [true, false]) {
    const r = [];
    for (let i = 0; i < N; i++) r.push(await egy(browser, mobil));
    const med = k => { const v = r.map(x => x[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
    const out = {}; for (const k of Object.keys(r[0])) out[k] = typeof r[0][k] === 'number' ? med(k) : r[0][k];
    console.log((mobil ? 'MOBIL  ' : 'ASZTALI') + ' ' + JSON.stringify(out));
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(2); });
