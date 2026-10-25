// Kalocsa GeoWorks – a 2027-es aktiválási build (--ajanlat) űrlapjának böngészős tesztje, HELYI szerveren, csonk-levelezővel.
// Előkészítés és indítás: lásd tools/tesztek/README.md („Ajánlatkérő 2027 – böngészős teszt”). Valódi levél nem megy ki.
// Használat: node tools/tesztek/ajanlat_e2e.js <playwright-core> <url> <sent.txt útvonal> <tesztkép.jpg>
const pw = require(process.argv[2]);
const fs = require('fs');
const [URL, SENT, KEP] = process.argv.slice(3);
const hibak = []; let db = 0;
const ok = (f, msg) => { db++; console.log((f ? '  OK   ' : '  HIBA ') + msg); if (!f) hibak.push(msg); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const levelek = () => fs.existsSync(SENT) ? fs.readFileSync(SENT, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];

async function kitolt(page) {
  await page.evaluate(() => document.querySelector('#ajanlat').scrollIntoView());
  await page.fill('[name=nev]', 'Teszt Elek');
  await page.fill('[name=telefon]', '06 70 123 4567');
  await page.fill('[name=helyszin]', 'Kecskemét');
  await page.fill('[name=leiras]', 'Próba: árok mélysége <1 m.');
  await page.check('input[name=munka][value="Alapásás"]', { force: true });
  await page.check('input[name=munka][value="Tereprendezés"]', { force: true });
  await page.check('[name=adatkezeles]', { force: true });
}

(async () => {
  const b = await pw.chromium.launch();
  console.log(`Ajánlatkérő 2027 – böngészős teszt – ${URL}`);

  // 1) dupla kattintás → pontosan egy levél, mindkét munkatípussal; siker csak ok:true után
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const hiba = []; p.on('pageerror', e => hiba.push(e.message));
    await p.goto(URL, { waitUntil: 'load' }); await wait(3500); // a szerver 3 mp alatti kitöltést elutasít
    await kitolt(p);
    const elotte = levelek().length;
    await p.dblclick('#ajanlat-form button[type=submit]');
    await p.waitForSelector('#form-done:not([hidden])', { timeout: 15000 }).catch(() => {});
    await wait(800);
    const L = levelek().slice(elotte);
    ok(L.length === 1, `dupla kattintás → pontosan 1 levél (${L.length})`);
    ok(L[0] && /Alapásás, Tereprendezés/.test(L[0].body), 'két kijelölt munkatípus → mindkettő a levélben');
    ok(L[0] && /mélysége <1 m\./.test(L[0].body), 'a leírás „<” jellel csonkítatlanul érkezik');
    ok(await p.isVisible('#form-done') && /Köszönöm/.test(await p.textContent('#done-title')), 'sikeres válasz után „Köszönöm, megkaptam!”');
    ok(!hiba.length, `nincs JS-hiba ${JSON.stringify(hiba)}`);
    await ctx.close();
  }

  // 2) elveszett válasz (a kérés elmegy, a válasz nem jön meg) → nem hamis siker, és nem „próbáld újra”, hanem hívás
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.route('**/api/ajanlat.php', r => r.abort('connectionreset'));
    await p.goto(URL, { waitUntil: 'load' }); await wait(3500);
    await kitolt(p);
    await p.click('#ajanlat-form button[type=submit]'); await wait(1500);
    const s = await p.evaluate(() => ({ err: document.querySelector('#form-err').textContent, done: !document.querySelector('#form-done').hidden, btn: document.querySelector('#ajanlat-form button[type=submit]').disabled }));
    ok(!s.done && /visszaigazolás/.test(s.err) && /hívj/.test(s.err) && !s.btn, `elveszett válasz → nincs hamis siker, hívást javasol, a gomb újra használható ${JSON.stringify(s)}`);
    await p.unroute('**/api/ajanlat.php');
    // szerverhiba (502, ok:false) → „nem sikerült”, nincs siker
    await p.route('**/api/ajanlat.php', r => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"error":"mail"}' }));
    await p.click('#ajanlat-form button[type=submit]'); await wait(1000);
    const s2 = await p.evaluate(() => ({ err: document.querySelector('#form-err').textContent, done: !document.querySelector('#form-done').hidden }));
    ok(!s2.done && /nem sikerült/.test(s2.err), `szerverhiba (502) → hibaüzenet, nincs hamis siker ${JSON.stringify(s2)}`);
    // hibás (nem JSON) válasz
    await p.unroute('**/api/ajanlat.php');
    await p.route('**/api/ajanlat.php', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<html>proxy hiba</html>' }));
    await p.click('#ajanlat-form button[type=submit]'); await wait(1000);
    ok(await p.evaluate(() => document.querySelector('#form-done').hidden), 'nem JSON válasz (200 HTML) → nincs hamis siker');
    await ctx.close();
  }

  // 3) rosszindulatú fájlnév, hibás formátum, túl sok kép
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(); let alert = false; p.on('dialog', d => { alert = true; d.dismiss(); });
    await p.goto(URL, { waitUntil: 'load' }); await wait(800);
    const kep = fs.readFileSync(KEP);
    await p.setInputFiles('#fotok', [{ name: '"><img src=x onerror=alert(1)>.jpg', mimeType: 'image/jpeg', buffer: kep }]);
    await wait(500);
    const s = await p.evaluate(() => ({ injekt: !!document.querySelector('#upload-list img[src="x"]'), label: (document.querySelector('#upload-list button') || {}).ariaLabel }));
    ok(!s.injekt && !alert && /onerror/.test(s.label || ''), `HTML-t tartalmazó fájlnév szövegként jelenik meg, nem fut kód ${JSON.stringify(s)}`);
    await p.setInputFiles('#fotok', [{ name: 'dok.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }]); await wait(300);
    ok(/csak JPG/.test(await p.textContent('#upload-list')), 'PDF → „csak JPG, PNG, WEBP vagy HEIC” üzenet');
    await p.setInputFiles('#fotok', Array.from({ length: 7 }, (_, i) => ({ name: `k${i}.jpg`, mimeType: 'image/jpeg', buffer: kep }))); await wait(300);
    const db5 = await p.$$eval('#upload-list li:not(.err)', e => e.length);
    ok(db5 <= 5 && /Legfeljebb/.test(await p.textContent('#upload-list')), `túl sok kép → korlát és üzenet (${db5} kép a listán)`);
    await ctx.close();
  }
  await b.close();
  console.log(`\nÖsszesen ${db} ellenőrzés, ${hibak.length} hiba.`);
  hibak.forEach(x => console.log('  - ' + x));
  process.exit(hibak.length ? 1 : 0);
})().catch(e => { console.error('VÉGREHAJTÁSI HIBA:', e.message); process.exit(2); });
