const { chromium } = require('playwright');
const sites = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const s of sites) {
    const i = s.indexOf('='); const name = s.slice(0, i), url = s.slice(i + 1);
    for (const [tag, vp, mob] of [['d', {width:1440,height:900}, false], ['m', {width:390,height:844}, true]]) {
      const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, locale: 'en-US',
        userAgent: mob ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined });
      const p = await ctx.newPage();
      try {
        await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await p.waitForTimeout(5000);
        for (const sel of ['#onetrust-accept-btn-handler','#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll','button:has-text("Accept all")','button:has-text("Accept")','button:has-text("Alle akzeptieren")','button:has-text("Allow all")','button:has-text("I agree")']) { try { await p.click(sel, { timeout: 700 }); break; } catch (e) {} }
        await p.waitForTimeout(1000);
        const H = await p.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < Math.min(H, 9000); y += 500) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(250); }
        await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500);
        await p.screenshot({ path: `${name}-${tag}-hero.jpg`, type: 'jpeg', quality: 70 });
        await p.screenshot({ path: `${name}-${tag}-full.jpg`, type: 'jpeg', quality: 50, fullPage: true }).catch(e => console.log('fullfail', name));
      } catch (e) { console.log('FAIL', name, tag, e.message); }
      await ctx.close();
    }
  }
  await b.close();
})();
