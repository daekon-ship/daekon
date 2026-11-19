/* Árkalkulációs motor tesztjei – futtatás: node --test public/latvanytervek/karikagyuru/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_MATERIALS, DEMO_SETTINGS, buildDemoProducts } from '../js/data.js';
import { priceProduct, defaultConfig, normalizeConfig, seedWeights, diffPrices, priceAll, encodeCfg, decodeCfg, stoneCount } from '../js/engine.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const M = clone(DEMO_MATERIALS), S = clone(DEMO_SETTINGS);
const products = seedWeights(buildDemoProducts(), M, S);
const P = (id) => products.find((p) => p.id === id);
const pair = P('maz-81184-81185-w');          // 3 kő, szabad (0–3)
const eternity = P('maz-79008-w');            // körbe foglalt, méretfüggő kőszám
const plain = products.find((p) => !p.priceOnRequest && !p.override && p.kind === 'p' && p.rings.every((r) => !r.stoneRule && !r.other) && p.metals.includes('pt'));
const price = (p, mut, s = S, m = M) => { const c = defaultConfig(p); mut?.(c); return priceProduct(p, c, m, s); };

test('1. Az aranyszín azonos karátnál nem módosítja az árat', () => {
  for (const mode of ['koltseg', 'gramm']) {
    const s = { ...S, pricingMode: mode };
    const a = price(pair, (c) => (c.color = 'sarga'), s).final;
    const b = price(pair, (c) => (c.color = 'feher'), s).final;
    const r = price(pair, (c) => (c.color = 'rose'), s).final;
    assert.equal(a, b); assert.equal(b, r);
  }
});

test('2. 18K nehezebb és drágább, mint 14K (tömeg és ár)', () => {
  const a = price(plain), b = price(plain, (c) => (c.metal = 'au18'));
  assert.ok(b.grams > a.grams * 1.15 && b.grams < a.grams * 1.2);
  assert.ok(b.final > a.final);
  assert.ok(Math.abs(b.pure / b.grams - 0.75) < 0.01 && Math.abs(a.pure / a.grams - 0.585) < 0.01);
});

test('3. Méretváltoztatás: nagyobb méret = több anyag és magasabb ár, mindkét módszerrel', () => {
  for (const sizeMethod of ['tomeg', 'ar']) {
    const s = { ...S, sizeMethod };
    const p48 = price(plain, (c) => (c.rings[0].size = 48), s), p54 = price(plain, null, s), p60 = price(plain, (c) => (c.rings[0].size = 60), s);
    assert.ok(p48.final < p54.final && p54.final < p60.final, sizeMethod);
    assert.ok(Math.abs(p60.parts[0].grams / p54.parts[0].grams - 60 / 54) < 0.01);
  }
});

test('4. A kőszám nem lépheti túl a modell korlátját', () => {
  const c = defaultConfig(pair); c.rings[0].stones.count = 50;
  const { cfg, warnings } = normalizeConfig(pair, c);
  assert.equal(cfg.rings[0].stones.count, pair.rings[0].stoneRule.max);
  assert.ok(warnings.length);
  const c2 = defaultConfig(eternity); c2.rings[0].stones.count = 3;   // körbe foglaltnál a kőszám a méretből jön
  assert.equal(normalizeConfig(eternity, c2).cfg.rings[0].stones.count, stoneCount(eternity.rings[0].stoneRule, 54, 54));
  const c3 = defaultConfig(eternity); c3.rings[0].stones = null;     // kő nem hagyható el
  assert.ok(normalizeConfig(eternity, c3).cfg.rings[0].stones);
  const c4 = defaultConfig(pair); c4.rings[0].stones.cat = 'd005';    // nem megengedett kőméret
  assert.equal(normalizeConfig(pair, c4).cfg.rings[0].stones.cat, pair.rings[0].stoneRule.defCat);
});

test('5. A gyémánt ára pontosan egyszer számolódik', () => {
  const s = { ...S, roundTo: 1 };
  const without = price(pair, (c) => (c.rings[0].stones = null), s);
  const withS = price(pair, null, s);
  const d = M.diamonds.find((x) => x.id === pair.rings[0].stoneRule.defCat);
  const n = pair.rings[0].stoneRule.def;
  const expected = (d.price * n * (1 + s.markupStones / 100) + (s.settingPerStone * n + s.certCost) * (1 + s.markupMetal / 100)) * (1 + s.vatPct / 100);
  assert.ok(Math.abs(withS.final - without.final - expected) <= 2, `${withS.final - without.final} vs ${expected}`);
  assert.equal(withS.breakdown.stones, d.price * n);
});

test('6. A női és a férfi gyűrű mérete külön számít', () => {
  const base = price(plain);
  const women = price(plain, (c) => (c.rings[0].size += 4));
  const men = price(plain, (c) => (c.rings[1].size += 4));
  assert.ok(women.final > base.final && men.final > base.final);
  assert.ok(women.parts[1].grams === base.parts[1].grams && men.parts[0].grams === base.parts[0].grams);
});

test('7. Alapanyagár-változás → minden érintett ár változik; a rögzített ár nem', () => {
  const M2 = { ...M, gold24: 45000 };
  const d = diffPrices(products, M, M2, S);
  assert.ok(d.count > 50 && d.avgPct > 0);
  const fixed = { ...plain, override: { type: 'fixed', value: 250000 } };
  assert.equal(priceProduct(fixed, null, M2, S).final, 250000);
});

test('8. Grammáras mód: a munkadíj és a fém-felár nem adódik hozzá még egyszer', () => {
  const s = { ...S, pricingMode: 'gramm', roundTo: 1 };
  const r = price(plain, null, s);
  const expected = r.grams * M.sellPerGram.au14 + s.boxCost * (1 + s.vatPct / 100);
  assert.ok(Math.abs(r.final - expected) <= 2, `${r.final} vs ${expected}`);
  const r2 = price(plain, null, { ...s, markupMetal: 99 });     // a fém-felár ebben a módban hatástalan
  assert.equal(r.final, r2.final);
});

test('9. Hibás vagy hiányos adat nem ad megtévesztő árat', () => {
  const broken = clone(plain); broken.rings[0].weight = 0;
  assert.equal(priceProduct(broken, null, M, S).final, null);
  assert.equal(priceProduct({ ...plain, priceOnRequest: true }, null, M, S).final, null);
  const noPt = { ...M, platinum: null };
  assert.equal(price(plain, (c) => (c.metal = 'pt'), S, noPt).final, null);
  const quote = price(pair, (c) => (c.rings[0].stones.cat = 'd10'));   // ár nélküli kőméret
  assert.equal(quote.final, null); assert.ok(quote.quote && quote.reason);
  const ti = price(pair, (c) => (c.metal = 'ti'));                    // nem engedett anyag → visszaáll
  assert.equal(ti.cfg.metal, 'au14');
});

test('10. A nem arany anyagnál nincs aranyszín, az alap 14K', () => {
  assert.equal(defaultConfig(plain).metal, 'au14');
  const pt = price(plain, (c) => (c.metal = 'pt'));
  assert.equal(pt.cfg.color, null);
  assert.ok(pt.final > 0);
});

test('11. Megosztható link oda-vissza', () => {
  const c = defaultConfig(pair); c.metal = 'au18'; c.rings[0].size = 50; c.rings[1].size = 66; c.rings[0].stones.count = 2; c.rings[0].engraving = 'Anna & Bence';
  const back = decodeCfg(encodeCfg(c), pair);
  assert.deepEqual(back.rings.map((r) => r.size), [50, 66]);
  assert.equal(back.metal, 'au18'); assert.equal(back.rings[0].stones.count, 2); assert.equal(back.rings[0].engraving, 'Anna & Bence');
});

test('12. Minden látható, áras termékhez van ár az alapbeállítással', () => {
  const all = priceAll(products, M, S);
  const missing = products.filter((p) => p.listaAr && all[p.id] === undefined).map((p) => p.code);
  assert.deepEqual(missing, []);
});
