// Kalocsa GeoWorks – böngészős regressziós teszt (Playwright, csak olvas; valódi hívást nem indít).
// Használat: node tools/tesztek/bongeszo_teszt.js <playwright-core útvonal> [chromium|firefox|webkit] [url] [képernyőkép-mappa]
//   pl.: node tools/tesztek/bongeszo_teszt.js %LOCALAPPDATA%/Temp/node_modules/playwright-core chromium https://kalocsageoworks.com/
// Kilépési kód: 0 = minden rendben, 1 = hiba. Az eredmény szimulált böngészőben készül, nem valódi telefonon.
const pw = require(process.argv[2]);
const ENGINE = process.argv[3] || 'chromium';
const URL = process.argv[4] || 'https://kalocsageoworks.com/';
const SHOTS = process.argv[5] || '';
const TEL = 'tel:+36704204170', TEL_DB = 11;
const SZELESSEG = ENGINE === 'chromium'
  ? [320, 360, 375, 390, 414, 430, 480, 600, 768, 1024, 1280, 1440, 1920]
  : [390, 1440];
const hibak = []; let db = 0;
const ok = (f, msg) => { db++; console.log((f ? '  OK   ' : '  HIBA ') + msg); if (!f) hibak.push(msg); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function ujLap(browser, w, h, extra = {}) {
  const mobile = w <= 860;
  const opts = { viewport: { width: w, height: h }, ...extra };
  if (mobile && ENGINE !== 'firefox') Object.assign(opts, { isMobile: true, hasTouch: true });
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const hibalista = [];
  page.on('pageerror', e => hibalista.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') hibalista.push('console: ' + m.text().slice(0, 140)); });
  page.on('response', r => { if (r.status() >= 400 && !/tile\.openstreetmap/.test(r.url())) hibalista.push(r.status() + ' ' + r.url()); });
  return { ctx, page, hibalista };
}

async function vegiggorget(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * .7)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, document.documentElement.scrollHeight);
  });
  await wait(1200);
}

// Elemek, amelyek kilógnak a nézetből vagy a szülőjükből (szöveg-túlcsordulás)
const meres = () => {
  const W = innerWidth;
  const kilog = [...document.querySelectorAll('body *')].filter(el => {
    if (el.closest('.lb, .leaflet-container, .skip, .hero__media, script, style')) return false;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1);
  }).slice(0, 5).map(el => (el.className && el.className.baseVal === undefined ? el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] : el.tagName) + ' ' + Math.round(el.getBoundingClientRect().right));
  return {
    overflowX: document.documentElement.scrollWidth - W,
    kilog,
    torottKep: [...document.images].filter(i => !i.closest('#lb') && i.complete && i.currentSrc && i.naturalWidth === 0).map(i => i.currentSrc),
    kep: [...document.images].filter(i => !i.closest('#lb') && i.naturalWidth > 0).length,
    tel: [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')),
    urlap: document.querySelectorAll('form, input, textarea, select').length,
    video: [...document.querySelectorAll('video')].map(v => ({ rs: v.readyState, err: v.error && v.error.code, src: (v.currentSrc || '').split('/').pop().slice(0, 30) })),
    csempe: document.querySelectorAll('.leaflet-tile-loaded').length,
    aiJeloles: (() => { const t = document.querySelector('.hero__tag'); if (!t) return false; const r = t.getBoundingClientRect(), cs = getComputedStyle(t); return /Szemléltető/.test(t.textContent) && r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; })(),
    kicsiBetu: [...document.querySelectorAll('p, li, a, button, span, figcaption, small')].filter(el => el.offsetParent && el.textContent.trim() && !el.closest('.leaflet-container, .lb') && parseFloat(getComputedStyle(el).fontSize) < 11).length,
  };
};

// A lebegő hívógomb takar-e kattintható elemet: minden gombot/linket a képernyő közepére görgetünk
// (ahogy a látogató tenné), és megnézzük, hogy ott, illetve az oldal legalján elérhető-e.
const fabTakar = async page => page.evaluate(async () => {
  const fab = document.querySelector('#fab'); if (!fab) return [];
  const talalat = [];
  const takart = el => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return false;
    const f = fab.getBoundingClientRect(), cs = getComputedStyle(fab);
    if (!f.width || cs.visibility === 'hidden' || +cs.opacity < .1) return false;
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 6, r.top + r.height / 2], [r.right - 6, r.top + r.height / 2]];
    return !pts.some(([x, y]) => { const t = document.elementFromPoint(x, y); return t && (t === el || el.contains(t)); });
  };
  for (const el of document.querySelectorAll('a, button')) {
    if (el === fab || fab.contains(el) || el.closest('#lb, .leaflet-control-container, .skip, #nav, header')) continue;
    if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
    el.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise(r => setTimeout(r, 60));
    // a lebegő gomb be-/kicsúszó animációja alatt átmeneti átfedés lehet → csak akkor hiba, ha 0,6 mp múlva is takar
    if (takart(el)) { await new Promise(r => setTimeout(r, 600)); if (takart(el)) talalat.push((el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 40)); }
  }
  scrollTo(0, 0);
  return talalat;
});

(async () => {
  console.log(`Kalocsa GeoWorks böngészőteszt – ${ENGINE} – ${URL} – ${new Date().toISOString()}`);
  const browser = await pw[ENGINE].launch();

  // 1) Szélességek: túlcsordulás, képek, hívólinkek, űrlap, konzol, lebegő gomb
  for (const w of SZELESSEG) {
    const h = w <= 860 ? (w < 400 ? 740 : 900) : 900;
    const { ctx, page, hibalista } = await ujLap(browser, w, h);
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await wait(1500);
    await vegiggorget(page);
    const m = await page.evaluate(meres);
    const takart = w <= 860 ? await fabTakar(page) : [];
    ok(m.overflowX <= 0 && !m.kilog.length, `${w}px: nincs vízszintes túlcsordulás (${m.overflowX}px; kilógó: ${JSON.stringify(m.kilog)})`);
    ok(!m.torottKep.length && m.kep >= 14, `${w}px: ${m.kep} kép betöltve, törött: ${m.torottKep.length}`);
    ok(m.tel.length === TEL_DB && m.tel.every(t => t === TEL), `${w}px: ${m.tel.length} hívólink, mind ${TEL}`);
    ok(m.urlap === 0, `${w}px: nincs űrlapelem (${m.urlap})`);
    ok(!m.video.some(v => v.err), `${w}px: videó hiba nélkül ${JSON.stringify(m.video)}`);
    ok(m.aiJeloles, `${w}px: a nyitóvideón látható a „Szemléltető animáció” jelölés`);
    ok(m.kicsiBetu === 0, `${w}px: nincs 11px-nél kisebb szöveg (${m.kicsiBetu})`);
    ok(!takart.length, `${w}px: a lebegő hívógomb nem takar el kattintható elemet ${JSON.stringify(takart)}`);
    ok(!hibalista.length, `${w}px: nincs konzol-/hálózati hiba ${JSON.stringify(hibalista.slice(0, 4))}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${ENGINE}-${w}.png` });
    await ctx.close();
  }

  // 2) Mobilmenü: nyitás, zárás (gomb, Escape, menüpont), görgetés visszaáll, forgatás
  {
    const { ctx, page, hibalista } = await ujLap(browser, 390, 844);
    await page.goto(URL, { waitUntil: 'load' }); await wait(800);
    const allapot = () => page.evaluate(() => ({ nyitva: document.querySelector('#nav').classList.contains('is-open'), aria: document.querySelector('#burger').getAttribute('aria-expanded'), ovf: document.body.style.overflow, lathato: (() => { const r = document.querySelector('#nav').getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(document.querySelector('#nav')).visibility !== 'hidden'; })() }));
    for (let i = 0; i < 3; i++) { await page.click('#burger'); await wait(150); await page.click('#burger'); await wait(150); }
    let s = await allapot(); ok(!s.nyitva && s.aria === 'false' && s.ovf === '', `menü: 3× gyors nyitás-zárás után zárva, görgetés engedve ${JSON.stringify(s)}`);
    await page.click('#burger'); await wait(400); s = await allapot();
    ok(s.nyitva && s.aria === 'true' && s.lathato, `menü: megnyílik, látható ${JSON.stringify(s)}`);
    await page.keyboard.press('Escape'); await wait(300); s = await allapot();
    const fokusz = await page.evaluate(() => document.activeElement && document.activeElement.id);
    ok(!s.nyitva && s.ovf === '' && fokusz === 'burger', `menü: Escape bezárja, fókusz a menügombra (${fokusz})`);
    await page.click('#burger'); await wait(400);
    const link = await page.$('#nav a[href^="#"]'); const cel = await link.getAttribute('href');
    await link.click(); await wait(1500); s = await allapot();
    const celPoz = await page.evaluate(c => Math.round(document.querySelector(c).getBoundingClientRect().top), cel);
    ok(!s.nyitva && s.ovf === '' && Math.abs(celPoz) < 140, `menü: menüpont (${cel}) bezárja és odagörget (cél teteje: ${celPoz}px)`);
    // forgatás / átméretezés nyitott menüvel: tabletről asztali szélességre
    await page.setViewportSize({ width: 1024, height: 768 }); await page.evaluate(() => scrollTo(0, 0)); await wait(300);
    if (await page.isVisible('#burger')) { await page.click('#burger'); await wait(300); }
    await page.setViewportSize({ width: 1366, height: 1024 }); await wait(600);
    s = await allapot();
    const gorget = await page.evaluate(async () => { const y = scrollY; scrollBy(0, 600); await new Promise(r => setTimeout(r, 300)); return scrollY - y; });
    ok(s.ovf === '' && gorget > 0, `menü: nyitott menüvel szélesre forgatva az oldal görgethető marad (overflow='${s.ovf}', görgetés: ${gorget}px)`);
    // Vélemények menüpont: a mobilmenüből a szakaszhoz görget, a menü bezárul
    await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => scrollTo(0, 0)); await wait(300);
    await page.click('#burger'); await wait(400); await page.click('#nav a[href="#velemenyek"]'); await wait(1500);
    const vp = await page.evaluate(() => ({ top: Math.round(document.querySelector('#velemenyek').getBoundingClientRect().top), nyitva: document.querySelector('#nav').classList.contains('is-open') }));
    ok(!vp.nyitva && Math.abs(vp.top) < 140, `menü: „Vélemények” a szakaszhoz görget (${vp.top}px), a menü bezárul`);
    ok(!hibalista.length, `menü: nincs konzolhiba ${JSON.stringify(hibalista.slice(0, 3))}`);
    await ctx.close();
  }

  // 3) Galéria / képnagyító: billentyűzet, nyilak, Escape, fókusz-visszaadás, egyszerre egy
  for (const w of [390, 1440]) {
    const { ctx, page, hibalista } = await ujLap(browser, w, w < 800 ? 844 : 900);
    await page.goto(URL, { waitUntil: 'load' }); await wait(800);
    const db8 = await page.$$eval('[data-full]', e => e.length);
    await page.evaluate(() => document.querySelector('#kiemelt-munkak').scrollIntoView()); await wait(800);
    await page.focus('.ftile__img >> nth=0'); await page.keyboard.press('Enter'); await wait(700);
    let s = await page.evaluate(() => ({ nyitva: !document.querySelector('#lb').hidden, kep: document.querySelector('#lb img').naturalWidth, src: document.querySelector('#lb img').getAttribute('src'), fokusz: document.activeElement.className, ovf: document.body.style.overflow, lb: document.querySelectorAll('.lb:not([hidden])').length }));
    ok(s.nyitva && s.kep > 0 && s.fokusz.includes('lb__x') && s.ovf === 'hidden' && s.lb === 1, `${w}px galéria: Enterrel nyílik, kép betölt (${s.kep}px), fókusz a bezárón, háttér nem görög ${JSON.stringify(s)}`);
    const elso = s.src;
    await page.keyboard.press('ArrowRight'); await wait(400);
    const masodik = await page.getAttribute('#lb img', 'src');
    await page.keyboard.press('ArrowLeft'); await wait(300);
    ok(masodik !== elso && (await page.getAttribute('#lb img', 'src')) === elso, `${w}px galéria: nyilakkal lapoz (${db8} elem)`);
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    const benn = await page.evaluate(() => !!document.activeElement.closest('#lb'));
    ok(benn, `${w}px galéria: Tab a nagyítón belül marad`);
    await page.keyboard.press('Escape'); await wait(300);
    s = await page.evaluate(() => ({ zarva: document.querySelector('#lb').hidden, ovf: document.body.style.overflow, fokusz: document.activeElement.className }));
    ok(s.zarva && s.ovf === '' && s.fokusz.includes('ftile__img'), `${w}px galéria: Escape bezárja, fókusz visszakerül ${JSON.stringify(s)}`);
    // dupla kattintás, majd bezárás gombbal
    await page.dblclick('.ftile__img >> nth=1'); await wait(500);
    ok((await page.$$eval('.lb:not([hidden])', e => e.length)) === 1, `${w}px galéria: dupla kattintásra is egyetlen nagyító`);
    if (await page.isVisible('.lb__x')) { await page.click('.lb__x'); await wait(300); }
    ok(await page.evaluate(() => document.querySelector('#lb').hidden && document.body.style.overflow === ''), `${w}px galéria: bezáró gomb működik, háttér újra görgethető`);
    ok(!hibalista.length, `${w}px galéria: nincs konzolhiba ${JSON.stringify(hibalista.slice(0, 3))}`);
    await ctx.close();
  }

  // 4) Hibaesetek: videó nem tölt be, térkép-csempék nem érhetők el, csökkentett mozgás, JS nélkül
  {
    const { ctx, page, hibalista } = await ujLap(browser, 390, 844);
    await page.route(/\.mp4/, r => r.abort());
    await page.route(/tile\.openstreetmap\.org/, r => r.abort());
    await page.goto(URL, { waitUntil: 'load' }); await wait(2000);
    const s = await page.evaluate(() => {
      const p = document.querySelector('.hero__poster img, .hero__poster, img[src*="hero-poster"], [style*="hero-poster"]');
      const h1 = document.querySelector('h1'), r = h1.getBoundingClientRect(), cs = getComputedStyle(h1);
      return { poszter: !!p && (p.naturalWidth === undefined || p.naturalWidth > 0), h1: r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > .9, cta: [...document.querySelectorAll('.hero a[href^="tel:"]')].length };
    });
    ok(s.poszter && s.h1 && s.cta >= 1, `videó nélkül: poszterkép, olvasható főcím, hívógomb a hero-ban ${JSON.stringify(s)}`);
    await page.evaluate(() => document.querySelector('#map').scrollIntoView()); await wait(2500);
    const gorget = await page.evaluate(async () => { const y = scrollY; scrollBy(0, 400); await new Promise(r => setTimeout(r, 200)); return scrollY - y; });
    ok(gorget > 0 && !hibalista.filter(x => x.startsWith('pageerror')).length, `térkép-csempék nélkül: nincs JS-hiba, az oldal görgethető (${gorget}px) ${JSON.stringify(hibalista.filter(x => x.startsWith('pageerror')))}`);
    await ctx.close();
  }
  {
    const { ctx, page, hibalista } = await ujLap(browser, 390, 844, { reducedMotion: 'reduce' });
    await page.goto(URL, { waitUntil: 'load' }); await wait(1500); await vegiggorget(page);
    const s = await page.evaluate(() => ({ rejtett: [...document.querySelectorAll('h1, h2, .card, .feat, .btn')].filter(e => +getComputedStyle(e).opacity < .5).length, video: [...document.querySelectorAll('video')].filter(v => !v.paused).length }));
    ok(s.rejtett === 0, `csökkentett mozgás: minden tartalom látható (rejtett: ${s.rejtett}), futó videó: ${s.video}`);
    ok(!hibalista.length, `csökkentett mozgás: nincs hiba ${JSON.stringify(hibalista.slice(0, 3))}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await ujLap(browser, 390, 844, { javaScriptEnabled: false });
    await page.goto(URL, { waitUntil: 'load' }); await wait(800);
    const s = await page.evaluate(() => ({ rejtett: [...document.querySelectorAll('h1, h2, .card, .btn')].filter(e => +getComputedStyle(e).opacity < .5 || getComputedStyle(e).visibility === 'hidden').length, tel: document.querySelectorAll('a[href^="tel:"]').length, kep: [...document.images].filter(i => i.complete && i.naturalWidth > 0).length }));
    ok(s.rejtett === 0 && s.tel === TEL_DB, `JavaScript nélkül: tartalom látható (rejtett: ${s.rejtett}), ${s.tel} hívólink, ${s.kep} kép`);
    await ctx.close();
  }

  // 5) Billentyűzet: skip link, látható fókusz (Safari/WebKit alapból csak Option+Tabbal lép a linkekre)
  const TAB = 'Tab';
  if (ENGINE === 'webkit') console.log('  NEM TESZTELT billentyűzetes link-bejárás: a Windows-os WebKit-port Tabbal nem lép linkre (Safari: Option+Tab) – Chromiumon és Firefoxon ellenőrizve');
  else {
    const { ctx, page } = await ujLap(browser, 1440, 900);
    await page.goto(URL, { waitUntil: 'load' }); await wait(800);
    await page.keyboard.press(TAB);
    const skip = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { cls: a.className, latszik: r.top >= 0 && r.bottom <= innerHeight && r.width > 10 }; });
    ok(skip.cls.includes('skip') && skip.latszik, `billentyűzet: első Tab a „Tovább a tartalomra” linkre, látható ${JSON.stringify(skip)}`);
    let fokuszNelkul = [], ut = [];
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press(TAB);
      const f = await page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { tag: a.tagName, hol: (a.closest('[id]') || {}).id || '', href: a.getAttribute('href') || '', el: (a.getAttribute('aria-label') || a.textContent.trim()).slice(0, 30), jel: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none' }; });
      if (f.tag === 'BODY') break;
      ut.push(f);
      if (!f.jel) fokuszNelkul.push(f.el);
    }
    ok(!fokuszNelkul.length, `billentyűzet: ${ut.length} Tab-lépés, mindegyiknél látható fókuszjelzés ${JSON.stringify(fokuszNelkul.slice(0, 5))}`);
    ok(ut.some(f => f.hol === 'ajanlat-tel' && f.href === 'tel:+36704204170'), 'billentyűzet: a Kapcsolat panel hívógombja Tabbal elérhető');
    ok(ut.some(f => /impresszum/.test(f.href)), 'billentyűzet: a lábléc impresszumlinkje Tabbal elérhető');
    ok(ut.some(f => f.hol === 'rolam'), 'billentyűzet: a Rólam szakasz elérhető');
    await ctx.close();
  }

  await browser.close();
  console.log(`\nÖsszesen ${db} ellenőrzés, ${hibak.length} hiba.`);
  hibak.forEach(x => console.log('  - ' + x));
  process.exit(hibak.length ? 1 : 0);
})().catch(e => { console.error('VÉGREHAJTÁSI HIBA:', e.message); process.exit(2); });
