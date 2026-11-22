/* Árkalkulációs motor tesztjei – futtatás: node --test public/latvanytervek/karikagyuru/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDemoProducts as buildCatalog } from '../js/data.js';
// A nyilvános kódban nincs ár (V5.5): a tesztek a külön fejlesztői adatkészlettel számolnak.
const DS = JSON.parse(readFileSync(new URL('../../../../services/karikagyuru-api/dev/demo-dataset.json', import.meta.url), 'utf8'));
const DEMO_MATERIALS = DS.materials, DEMO_SETTINGS = DS.settings;
const buildDemoProducts = () => buildCatalog().map((p) => { p.rings.forEach((r) => { r.labor = DS.laborByStyle[p.style] ?? null; }); return p; });
import { refWeight, ctFmt, sizeSfx, isGold as isGoldM, priceProduct, defaultConfig, normalizeConfig, seedWeights, diffPrices, priceAll, encodeCfg, decodeCfg, stoneCount, exampleRing, refPrice, allowedCats, maxAround, diamond } from '../js/engine.js';

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
  assert.ok(Math.abs(b.grams / a.grams - 5.6 / 5.0) < 0.02);   // szemléltető példa: 5,0 g → 5,6 g
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
  const c4 = defaultConfig(pair); c4.rings[0].stones.cat = 'd10';     // nem megengedett kőméret
  assert.equal(normalizeConfig(pair, c4).cfg.rings[0].stones.cat, pair.rings[0].stoneRule.defCat);
});

test('5a. Grammáras mód: a gyémánt darabára pontosan egyszer, felár és ÁFA nélkül adódik hozzá', () => {
  const s = { ...S, pricingMode: 'gramm', roundTo: 1 };
  const without = price(pair, (c) => (c.rings[0].stones = null), s), withS = price(pair, null, s);
  const d = M.diamonds.find((x) => x.id === pair.rings[0].stoneRule.defCat), n = pair.rings[0].stoneRule.def;
  assert.equal(withS.final - without.final, (d.price + s.settingPerStone) * n + s.certCost);
});

test('5b. Költségalapú mód: a gyémánt ára pontosan egyszer számolódik', () => {
  const s = { ...S, pricingMode: 'koltseg', roundTo: 1 };
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
  const M2 = { ...M, sellPerGram: { ...M.sellPerGram, au14: 52000 } };
  const d = diffPrices(products, M, M2, S);
  assert.ok(d.count > 50 && d.avgPct > 0);
  const fixed = { ...plain, override: { type: 'fixed', value: 250000 } };
  assert.equal(priceProduct(fixed, null, M2, S).final, 250000);
});

test('8. Grammáras mód: munkadíj, felár és ÁFA nem adódik hozzá még egyszer', () => {
  const s = { ...S, pricingMode: 'gramm', roundTo: 1, boxCost: 3000 };
  const r = price(plain, null, s);
  const grams = r.parts.reduce((a, x) => a + x.gramsExact, 0);
  assert.equal(r.final, Math.round(grams * M.sellPerGram.au14 + 3000));
  const r2 = price(plain, null, { ...s, markupMetal: 99, markupStones: 99, lossPct: 50 });   // csak költségalapú módban hatnak
  assert.equal(r.final, r2.final);
  const r3 = price(plain, null, { ...s, vatPct: 5 });                                      // az ÁFA a grammárban van
  assert.equal(r.final, r3.final);
  const withLabor = clone(plain); withLabor.rings.forEach((x) => (x.labor = 999999));
  assert.equal(priceProduct(withLabor, null, M, s).final, r.final);                         // munkadíj nem számít bele
});

test('9. Hibás vagy hiányos adat nem ad megtévesztő árat', () => {
  const broken = clone(plain); broken.rings[0].weight = 0;
  assert.equal(priceProduct(broken, null, M, S).final, null);
  assert.equal(priceProduct({ ...plain, priceOnRequest: true }, null, M, S).final, null);
  const noPt = { ...M, sellPerGram: { ...M.sellPerGram, pt: null } };                    // grammáras mód: nincs grammár
  assert.equal(price(plain, (c) => (c.metal = 'pt'), S, noPt).final, null);
  assert.equal(price(plain, (c) => (c.metal = 'pt'), { ...S, pricingMode: 'koltseg' }, { ...M, platinum: null }).final, null);
  const quote = price(P('maz-81165-81166-y'), (c) => (c.rings[0].stones.cat = 'd04'));   // bizonytalan árú kőméret
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

/* ---------------- Az ötvös számítási módja – SZEMLÉLTETŐ számokkal (nem az ügyfél adatai) ---------------- */
const R1 = { ...S, pricingMode: 'gramm', roundTo: 1 };
const ex = (metal, weight, size, s = R1) => exampleRing({ metal, weight, size }, M, s).final;

test('Példa: 14K, 5,0 g × 42 000 = 210 000 Ft', () => assert.equal(ex('au14', 5.0, 54), 210000));
test('Példa: platina, 7,1 g × 48 000 = 340 800 Ft', () => assert.equal(ex('pt', 7.1, 54), 340800));
test('Példa: platina 48-as méret ≈ 302 933 Ft (340 800 × 48/54)', () => assert.equal(ex('pt', 7.1, 48), 302933));
test('Példa: platina 60-as méret ≈ 378 667 Ft (340 800 × 60/54) – lineáris arányosítás', () => {
  assert.equal(ex('pt', 7.1, 60), 378667);
});
test('Méretmódszer grammáras módban mindkét beállítással ugyanazt adja', () => {
  assert.equal(ex('pt', 7.1, 60, { ...R1, sizeMethod: 'ar' }), 378667);
});
test('Kerekítés felfelé 100 Ft-ra (alapbeállítás)', () => {
  assert.equal(ex('au14', 5.0, 54, { ...S }), 210000);
  assert.equal(ex('pt', 7.1, 48, { ...S }), 303000);
});
test('Példa: tömegarányok – 14K 5,0 g → 18K 5,6 · Pt 7,1 · Pd 4,2 · Ti 1,6 g (54-es)', () => {
  const ring = { label: 'x', refSize: 54, refWidth: 4, weight: 5.0, labor: 0, other: 0, stoneRule: null };
  const p = { id: 't', code: 't', name: 't', kind: 's', metals: ['au14', 'au18', 'pt', 'pd', 'ti'], colors: ['sarga'], baseColor: 'sarga', widths: [4], rings: [ring] };
  const g = (m) => Math.round(refWeight(ring, m, S) * 100) / 100;
  assert.deepEqual(['au14', 'au18', 'pt', 'pd', 'ti'].map(g), [5, 5.6, 7.1, 4.2, 1.6]);
});
test('Példa: alapanyagárak – 24K 36 000 → 14K 21 060, 18K 27 000; Pt 13 000; Pd 11 000', () => {
  assert.deepEqual(['au14', 'au18', 'pt', 'pd'].map((m) => Math.round(refPrice(m, M))), [21060, 27000, 13000, 11000]);
});
test('Grammáras módban az alapanyagár nem változtatja az eladási árat, a grammár igen', () => {
  assert.equal(diffPrices(products, M, { ...M, gold24: 50000 }, S).count, 0);
  assert.ok(diffPrices(products, M, { ...M, sellPerGram: { ...M.sellPerGram, au14: 48000 } }, S).count > 30);
});
test('Példa: gyémántárak (természetes) – 0,01 → 5 500 · 0,015 → 8 000 · 0,02 → 11 000 · 0,03 → 16 500 Ft', () => {
  assert.deepEqual(['d01', 'd015', 'd02', 'd03'].map((id) => diamond(M, id).price), [5500, 8000, 11000, 16500]);
  assert.deepEqual(['d01', 'd015', 'd02', 'd03'].map((id) => diamond(M, id).src), ['demo', 'demo', 'demo', 'demo']);
});
test('A bizonytalan 0,04 és 0,05 ct nincs jóváhagyott árként kezelve → egyedi ajánlat', () => {
  for (const id of ['d04', 'd05']) {
    assert.equal(diamond(M, id).price, null); assert.equal(diamond(M, id).src, 'bizonytalan');
    const r = exampleRing({ metal: 'au14', weight: 5.0, width: 5, stones: { count: 1, cat: id } }, M, R1);
    assert.equal(r.final, null); assert.match(r.reason, /egyedi árajánlat/);
  }
});
test('Kő + gyűrű: 5,0 g 14K + 3 × 0,01 ct = 210 000 + 16 500 Ft', () => {
  assert.equal(exampleRing({ metal: 'au14', weight: 5.0, stones: { count: 3, cat: 'd01' } }, M, R1).final, 226500);
});
test('Fizikai korlát: a kő átmérője elfér a szélességen, körbe foglalásnál a kerületen', () => {
  const rule = { mode: 'free', min: 0, max: 3, def: 1, cats: ['d01', 'd02', 'd03'], defCat: 'd03', allowNone: true };
  assert.deepEqual(allowedCats(rule, 2.5, M, S), ['d01']);            // 2,5 mm − 1 mm perem = 1,5 mm
  assert.deepEqual(allowedCats(rule, 3, M, S), ['d01', 'd02', 'd03']);
  assert.equal(maxAround(diamond(M, 'd01'), 54, S), 40);              // 54 / (1,25 + 0,1)
  const narrow = clone(pair); narrow.widths = [2.5]; narrow.rings[0].refWidth = 2.5; narrow.rings[0].stoneRule = { ...rule };
  const c = defaultConfig(narrow); c.rings[0].stones = { count: 1, cat: 'd03' };
  const n = normalizeConfig(narrow, c, M, S);
  assert.equal(n.cfg.rings[0].stones.cat, 'd01'); assert.ok(n.warnings.length);
});
test('Minden termék alapkonfigurációja fizikailag lehetséges és van rá ár', () => {
  for (const p of products.filter((x) => x.listaAr)) {
    const r = priceProduct(p, null, M, S);
    assert.ok(r.final > 0, p.code);
    r.cfg.rings.forEach((rc, i) => { if (rc.stones) assert.ok(allowedCats(p.rings[i].stoneRule, rc.width, M, S).includes(rc.stones.cat), p.code); });
  }
});

/* ---------------- Kerekítés: nyers és megjelenő ár külön ---------------- */
const RS = (roundTo) => ({ ...S, pricingMode: 'gramm', roundTo });
const exR = (metal, weight, size, roundTo) => exampleRing({ metal, weight, size }, M, RS(roundTo));
const CASES = [            // [anyag, tömeg, méret, nyers, 100 Ft-ra, 1000 Ft-ra]
  ['au14', 5.0, 54, 210000, 210000, 210000],
  ['pt', 7.1, 54, 340800, 340800, 341000],
  ['pt', 7.1, 48, 302933, 303000, 303000],
  ['pt', 7.1, 60, 378667, 378700, 379000],
];
for (const [m, w, sz, raw, r100, r1000] of CASES) {
  test(`Kerekítés: ${m} ${sz}-es – nyers ${raw}, 100 Ft-ra ${r100}, 1000 Ft-ra ${r1000}, kerekítés nélkül ${raw}`, () => {
    const a = exR(m, w, sz, 100);
    assert.equal(a.raw, raw); assert.equal(a.final, r100); assert.equal(a.rounding, r100 - raw);
    assert.equal(exR(m, w, sz, 1000).final, r1000);
    assert.equal(exR(m, w, sz, 1).final, raw);
    assert.ok(a.rounding >= 0 && a.rounding < 100);       // mindig felfelé, egy lépésnél kevesebbel
  });
}
test('A kerekítés alapértelmezése demó, és az ügyfél jóváhagyásáig az marad', () => {
  assert.equal(S.roundTo, 100); assert.equal(S.src.roundTo, 'demo');
});
test('A szemléltető adatkészlet minden grammára „demo” jelölésű, a titánnak nincs grammára', () => {
  assert.deepEqual(['au14', 'au18', 'pt', 'pd'].map((m) => M.src[`sellPerGram.${m}`]), ['demo', 'demo', 'demo', 'demo']);
  assert.equal(M.sellPerGram.ti, null); assert.equal(M.src['sellPerGram.ti'], 'bizonytalan');   // titán: munkaalapú ár, nincs grammár
  assert.ok(!JSON.stringify(DS).includes('"pelda"'));   // V5.6: az ügyfél jegyzetének számai nincsenek a nyilvános adatkészletben
});

/* ---------------- Minden konfigurációban: tételek pontosan egyszer ---------------- */
test('Grammáras mód: minden termék × anyag × kő ki/be × gravír – a nyers ár pontosan a tételek összege', () => {
  const s = { ...S, pricingMode: 'gramm', settingPerStone: 1500, certCost: 4000, boxCost: 2500, engravingPrice: 6000 };
  let n = 0;
  for (const p of products.filter((x) => x.listaAr)) {
    for (const metal of p.metals) for (const stonesOn of [true, false]) for (const engr of [false, true]) {
      const c = defaultConfig(p); c.metal = metal; if (!isGoldM(metal)) c.color = null;
      c.rings.forEach((rc, i) => { if (!stonesOn && p.rings[i].stoneRule?.allowNone) rc.stones = null; if (engr) rc.engraving = 'Anna'; });
      const r = priceProduct(p, c, M, s);
      if (r.final === null) continue;
      let exp = s.boxCost, stoneCount = 0;
      r.parts.forEach((x, i) => {
        const rc = r.cfg.rings[i];
        exp += x.gramsExact * M.sellPerGram[metal];
        if (rc.stones) { exp += diamond(M, rc.stones.cat).price * rc.stones.count + s.settingPerStone * rc.stones.count; stoneCount += rc.stones.count; }
        if (rc.engraving) exp += s.engravingPrice;
      });
      if (stoneCount) exp += s.certCost;
      assert.equal(r.raw, Math.round(exp), `${p.code} ${metal} kő:${stonesOn} gravír:${engr}`);
      assert.equal(r.final, Math.ceil(r.raw / 100) * 100);                  // a megjelenő ár = a nyers ár felfelé kerekítve
      assert.equal(r.final % 100, 0);
      n++;
    }
  }
  assert.ok(n > 400, String(n));
});
test('Költségalapú mód: kő, foglalás, gravír egyszer – a kő nélküli különbség pontosan a kőtételek', () => {
  const s = { ...S, pricingMode: 'koltseg', roundTo: 1, settingPerStone: 1500, certCost: 0 };
  const a = price(pair, (c) => (c.rings[0].stones = null), s), b = price(pair, null, s);
  const st = b.cfg.rings[0].stones, d = diamond(M, st.cat), vf = 1 + s.vatPct / 100;
  const exp = (d.price * st.count * (1 + s.markupStones / 100) + s.settingPerStone * st.count * (1 + s.markupMetal / 100)) * vf;
  assert.ok(Math.abs(b.raw - a.raw - exp) <= 1, `${b.raw - a.raw} vs ${exp}`);
  const e = price(pair, (c) => (c.rings[0].engraving = 'X'), s);
  assert.ok(Math.abs(e.raw - b.raw - s.engravingPrice * (1 + s.markupMetal / 100) * vf) <= 1);
});
test('Gravír: gyűrűnként egyszer, üres szövegnél nem', () => {
  const s = { ...S, pricingMode: 'gramm', roundTo: 1 };
  const a = price(plain, null, s);
  const one = price(plain, (c) => (c.rings[0].engraving = 'A'), s);
  const both = price(plain, (c) => { c.rings[0].engraving = 'A'; c.rings[1].engraving = 'B'; }, s);
  const blank = price(plain, (c) => (c.rings[0].engraving = '   '), s);
  assert.equal(one.raw - a.raw, s.engravingPrice);
  assert.equal(both.raw - a.raw, 2 * s.engravingPrice);
  assert.equal(blank.raw, a.raw);
});

test('Méret toldaléka magyarul', () => {
  assert.deepEqual([40, 43, 45, 46, 48, 50, 54, 55, 56, 60, 63, 64, 66, 70, 80].map(sizeSfx),
    ['40-es', '43-as', '45-ös', '46-os', '48-as', '50-es', '54-es', '55-ös', '56-os', '60-as', '63-as', '64-es', '66-os', '70-es', '80-as']);
});
test('Kőméret kijelzése kerekítés nélkül', () => assert.deepEqual([0.005, 0.01, 0.015, 0.1].map(ctFmt), ['0,005', '0,01', '0,015', '0,1']));
test('Alapbeállítással minden gyűrű ára pontosan a weboldalon most feltüntetett ár', () => {
  const off = products.filter((p) => p.listaAr && priceProduct(p, null, M, S).final !== p.listaAr).map((p) => p.code);
  assert.deepEqual(off, []);
});

/* ---------------- Az átirat alapján (V3.2) ---------------- */
test('Titán: nincs tömegalapú ár – egyedi ajánlat, érthető indoklással', () => {
  const p = products.find((x) => x.metals.includes('ti') && x.listaAr);
  const r = price(p, (c) => { c.metal = 'ti'; c.color = null; });
  assert.equal(r.final, null); assert.match(r.reason, /munkából adódik/);
});
test('A szélesség/profil nem választható online', () => {
  assert.deepEqual(products.filter((p) => !p.added && p.widths.length !== 1).map((p) => p.code), []);
});
test('Kétszínű modell nem készülhet platinából, palládiumból, titánból', () => {
  const bi = products.filter((p) => ['ketszinu', 'feherrose', 'sargarose'].includes(p.baseColor));
  assert.ok(bi.length > 0); assert.ok(bi.every((p) => p.metals.every((m) => m === 'au14' || m === 'au18')));
});

/* ---------------- V3.3 ---------------- */
import { readiness } from '../js/engine.js';
test('Ár nélküli modell: a beállítások érvényesítve megmaradnak, az ár egyedi ajánlat', () => {
  const p = clone(products.find((x) => x.priceOnRequest && x.kind === 'p'));
  p.rings[0].stoneRule = { mode: 'free', min: 0, max: 3, def: 1, cats: ['d01', 'd02'], defCat: 'd01', allowNone: true };
  const c = defaultConfig(p); c.metal = 'au18'; c.rings[0].size = 58; c.rings[0].engraving = 'Anna'; c.rings[0].stones = { count: 999, cat: 'd10' };
  const r = priceProduct(p, c, M, S);
  assert.equal(r.final, null); assert.ok(r.quote);
  assert.equal(r.cfg.metal, 'au18'); assert.equal(r.cfg.rings[0].size, 58); assert.equal(r.cfg.rings[0].engraving, 'Anna');
  assert.deepEqual(r.cfg.rings[0].stones, { count: 3, cat: 'd01' });        // a modell korlátai ár nélkül is érvényesek
});
test('A szélesség online nem állítható: mindig a modell saját szélessége', () => {
  const c = defaultConfig(pair); c.rings[0].width = 9; c.rings[1].width = 2;
  const n = normalizeConfig(pair, c, M, S);
  assert.deepEqual(n.cfg.rings.map((r) => r.width), pair.rings.map((r) => r.refWidth));
  assert.ok(n.warnings.some((w) => /szélesség/i.test(w)));
  assert.equal(price(pair, (x) => (x.rings[0].width = 9)).final, price(pair).final);
});
/* Minden jóváhagyva ÉS minden szükséges adat kitöltve – ebből indulnak az élesítési tesztek. */
function readyState() {
  const st = { materials: clone(M), settings: clone(S), products: clone(products) };
  st.materials.diamonds.forEach((d) => { if (d.price == null) d.price = Math.round(d.ct * 600000); d.src = 'jovahagyott'; });
  Object.keys(st.materials.sellPerGram).forEach((k) => (st.materials.src[`sellPerGram.${k}`] = 'jovahagyott'));
  ['gold24', 'platinum', 'palladium', 'titanium'].forEach((k) => (st.materials.src[k] = 'jovahagyott'));
  Object.keys(st.settings).forEach((k) => (st.settings.src[k] = 'jovahagyott'));
  st.products.forEach((p) => (p.approved = true));
  return st;
}
const keysOf = (st, kind) => readiness(st).blockers.filter((b) => !kind || b.kind === kind).map((b) => b.key);

test('Élesítés: demó- és példaadatokkal nem élesíthető; a példa („pelda”) jelölés sem számít jóváhagyottnak', () => {
  const r0 = readiness({ materials: clone(M), settings: clone(S), products: clone(products) });
  assert.equal(r0.ready, false);
  const keys = r0.blockers.map((b) => b.key);
  for (const k of ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'd01', 'd04', 'roundTo', 'vatPct', 'engravingPrice']) assert.ok(keys.includes(k), k);
  assert.ok(r0.byGroup.gyuruk > 100);
  assert.equal(r0.blockers.find((b) => b.key === 'sellPerGram.au14' && b.kind === 'jovahagyas').src, 'demo');
  const m2 = clone(M); m2.src['sellPerGram.au14'] = 'pelda';
  assert.equal(readiness({ materials: m2, settings: clone(S), products: clone(products) }).blockers.find((b) => b.key === 'sellPerGram.au14').src, 'pelda');
  assert.ok(r0.invalid > 0 && r0.unapproved > 0);
});
test('Élesítés: minden érvényes és jóváhagyott → kész; egyetlen visszavont jóváhagyás blokkol', () => {
  const st = readyState();
  assert.deepEqual(readiness(st).blockers, []); assert.equal(readiness(st).ready, true);
  st.settings.src.roundTo = 'demo';
  assert.deepEqual(keysOf(st), ['roundTo']);
});

/* --- 1. probléma: titán --- */
test('Élesítés/titán: nem kell jóváhagyott titán-grammár – a titán egyedi ajánlat', () => {
  const fresh = readiness({ materials: clone(M), settings: clone(S), products: clone(products) });
  assert.ok(!fresh.blockers.some((b) => b.key === 'sellPerGram.ti'));          // sem jóváhagyást, sem értéket nem követel
  const st = readyState();
  st.materials.src['sellPerGram.ti'] = 'bizonytalan';                          // jóváhagyás nélkül is kész
  assert.equal(st.materials.sellPerGram.ti, null); assert.equal(readiness(st).ready, true);
});
test('Élesítés/titán: ha valaki grammárat ad a titánhoz, az blokkol – jóváhagyott jelöléssel is', () => {
  const st = readyState();
  st.materials.sellPerGram.ti = 30000; st.materials.src['sellPerGram.ti'] = 'jovahagyott';
  const r = readiness(st);
  assert.equal(r.ready, false);
  assert.deepEqual(r.blockers.map((b) => [b.key, b.kind]), [['sellPerGram.ti', 'ervenytelen']]);
});
test('Titán: kitalált grammáras vagy anyagalapú ár semmilyen beállítással nem jelenhet meg', () => {
  const p = products.find((x) => x.metals.includes('ti') && x.listaAr);
  const Mti = { ...M, sellPerGram: { ...M.sellPerGram, ti: 30000 }, titanium: 80 };
  for (const mode of ['gramm', 'koltseg']) {
    const r = price(p, (c) => { c.metal = 'ti'; c.color = null; }, { ...S, pricingMode: mode }, Mti);
    assert.equal(r.final, null, mode); assert.ok(r.quote); assert.match(r.reason, /munkából adódik/);
  }
  assert.equal(exampleRing({ metal: 'ti', weight: 1.5 }, Mti, R1).final, null);
  assert.ok(price(p).final > 0);                                               // a többi anyag ára változatlanul számolódik
});

/* --- 2. probléma: tényleges érvényesség, nem csak jelölés --- */
const BREAK = [
  ['14K grammár = 0', (st) => (st.materials.sellPerGram.au14 = 0), 'sellPerGram.au14'],
  ['platina grammár hiányzik', (st) => (st.materials.sellPerGram.pt = null), 'sellPerGram.pt'],
  ['18K grammár nem szám', (st) => (st.materials.sellPerGram.au18 = 'sok'), 'sellPerGram.au18'],
  ['grammár NaN', (st) => (st.materials.sellPerGram.pd = NaN), 'sellPerGram.pd'],
  ['kőár hiányzik', (st) => (st.materials.diamonds.find((d) => d.id === 'd01').price = null), 'd01'],
  ['kőár negatív', (st) => (st.materials.diamonds.find((d) => d.id === 'd02').price = -5), 'd02'],
  ['kő átmérője hiányzik', (st) => (delete st.materials.diamonds.find((d) => d.id === 'd03').mm), 'd03'],
  ['kerekítés 0', (st) => (st.settings.roundTo = 0), 'roundTo'],
  ['ÁFA negatív', (st) => (st.settings.vatPct = -1), 'vatPct'],
  ['ÁFA 100 fölött', (st) => (st.settings.vatPct = 270), 'vatPct'],
  ['gravírdíj hiányzik', (st) => (delete st.settings.engravingPrice), 'engravingPrice'],
  ['foglalási díj nem szám', (st) => (st.settings.settingPerStone = '1500'), 'settingPerStone'],
  ['tömegarány 0', (st) => (st.settings.density.pt = 0), 'density.pt'],
  ['árképzési mód ismeretlen', (st) => (st.settings.pricingMode = 'valami'), 'pricingMode'],
  ['méretmód ismeretlen', (st) => (st.settings.sizeMethod = ''), 'sizeMethod'],
];
for (const [name, fn, key] of BREAK) {
  test(`Élesítés/érvényesség: ${name} → jóváhagyott jelöléssel sem kész`, () => {
    const st = readyState(); fn(st);
    const r = readiness(st);
    assert.equal(r.ready, false);
    assert.ok(r.blockers.every((b) => b.kind === 'ervenytelen'), JSON.stringify(r.blockers.slice(0, 2)));   // a jelölés mindenhol „jóváhagyott” maradt
    assert.ok(keysOf(st, 'ervenytelen').includes(key), `${key} / ${keysOf(st)}`);
  });
}
test('Élesítés/érvényesség: gyűrűadatok – hiányzó tömeg, hibás méret, hibás kőszabály', () => {
  const pid = pair.id;
  const cases = [
    (p) => (p.rings[0].weight = 0), (p) => (p.rings[1].weight = null), (p) => (p.rings[0].refSize = 5), (p) => (p.rings[0].refWidth = 0),
    (p) => (p.rings[0].stoneRule.defCat = 'nincs'), (p) => (p.rings[0].stoneRule.cats = []), (p) => { p.rings[0].stoneRule.min = 4; p.rings[0].stoneRule.max = 2; },
    (p) => (p.rings[0].stoneRule.def = 99), (p) => (p.metals = []),
  ];
  for (const fn of cases) {
    const st = readyState(); fn(st.products.find((p) => p.id === pid));
    const r = readiness(st);
    assert.equal(r.ready, false, fn.toString());
    assert.ok(r.blockers.some((b) => b.key === pid && b.kind === 'ervenytelen'), fn.toString());
  }
  const st = readyState(); const hidden = st.products.find((p) => p.id === pid); hidden.rings[0].weight = 0; hidden.visible = false;
  assert.equal(readiness(st).ready, true);                                     // rejtett gyűrű nem blokkol
  const st2 = readyState(); const q = st2.products.find((p) => p.priceOnRequest); q.rings.forEach((r) => (r.weight = 0));
  assert.equal(readiness(st2).ready, true);                                    // ár nélküli modellnél a tömeg nem kötelező
});
test('Élesítés/érvényesség: ismeretlen kőméret a modell listájában blokkol', () => {
  const st = readyState(); st.products.find((p) => p.id === pair.id).rings[0].stoneRule.cats.push('d99');
  assert.ok(keysOf(st, 'ervenytelen').includes('d99'));
});
test('Az ötvös számítási módszere változatlan (regresszió)', () => {
  assert.equal(exampleRing({ metal: 'au14', weight: 5.0, size: 54 }, M, R1).final, 210000);
  assert.equal(exampleRing({ metal: 'pt', weight: 7.1, size: 60 }, M, R1).final, 378667);
});

/* ---------------- V4: gyűrűnkénti szakmai lehetőségek ---------------- */
import { optionValues, optionReason, sizeRange } from '../js/engine.js';
const withOpts = (fn) => { const p = clone(plain); p.rings.forEach((r) => { r.refWidth = 4; r.thickness = 1.6; }); p.widths = [4]; fn(p); return p; };
test('Szélesség: alapból egyik gyűrűnél sem választható (az eredeti viselkedés marad)', () => {
  assert.ok(products.every((p) => optionValues(p, 'width') === null && optionValues(p, 'thickness') === null));
  assert.equal(optionReason(plain, 'width'), 'ennél a modellnél nem állítható');
});
test('Szélesség: engedélyezve, de jóváhagyás nélkül továbbra sem választható', () => {
  const p = withOpts((x) => (x.opts.width = { enabled: true, min: 3.5, max: 6, step: 0.5, approved: false }));
  assert.equal(optionValues(p, 'width'), null);
  assert.equal(optionReason(p, 'width'), 'a határokat az ötvös még nem hagyta jóvá');
  const c = defaultConfig(p); c.rings[0].width = 5;
  assert.equal(normalizeConfig(p, c, M, S).cfg.rings[0].width, 4);
});
test('Szélesség: jóváhagyott határokkal 0,5 mm-es lépésekben választható, a tömeg és az ár arányosan változik', () => {
  const p = withOpts((x) => (x.opts.width = { enabled: true, min: 3.5, max: 6, step: 0.5, approved: true }));
  assert.deepEqual(optionValues(p, 'width'), [3.5, 4, 4.5, 5, 5.5, 6]);
  const s1 = { ...S, roundTo: 1 };
  const base = priceProduct(p, null, M, s1), wide = price(p, (c) => (c.rings[0].width = 5), s1);
  assert.equal(wide.cfg.rings[0].width, 5); assert.equal(wide.cfg.rings[1].width, 4);                 // gyűrűnként külön
  assert.ok(Math.abs(wide.parts[0].gramsExact / base.parts[0].gramsExact - 5 / 4) < 1e-9);
  assert.ok(wide.final > base.final);
  for (const w of [2, 3.7, 9]) { const n = normalizeConfig(p, (() => { const c = defaultConfig(p); c.rings[0].width = w; return c; })(), M, S); assert.equal(n.cfg.rings[0].width, 4, String(w)); assert.ok(n.warnings.length); }
  const back = decodeCfg(encodeCfg(wide.cfg), p); assert.equal(back.rings[0].width, 5);                // megosztható linkben megmarad
});
test('Vastagság: csak jóváhagyott értékekből választható; arányos tömeg', () => {
  const off = withOpts((x) => (x.opts.thickness = { enabled: true, values: [1.6, 1.8, 2], approved: false }));
  assert.equal(optionValues(off, 'thickness'), null);
  const p = withOpts((x) => (x.opts.thickness = { enabled: true, values: [1.6, 1.8, 2], approved: true }));
  const base = priceProduct(p, null, M, S), thick = price(p, (c) => (c.rings[0].thick = 2));
  assert.equal(thick.cfg.rings[0].thick, 2);
  assert.ok(Math.abs(thick.parts[0].gramsExact / base.parts[0].gramsExact - 2 / 1.6) < 1e-9);
  assert.equal(price(p, (c) => (c.rings[0].thick = 1.2)).cfg.rings[0].thick, 1.6);                      // nem engedélyezett érték → a modell sajátja
  assert.equal(decodeCfg(encodeCfg(thick.cfg), p).rings[0].thick, 2);
});
test('Méret: gyűrűnként beállított tartomány érvényesül', () => {
  const p = clone(plain); p.rings[0].sizeMin = 50; p.rings[0].sizeMax = 58;
  assert.deepEqual(sizeRange(p.rings[0]), [50, 58]);
  const n = normalizeConfig(p, (() => { const c = defaultConfig(p); c.rings[0].size = 62; return c; })(), M, S);
  assert.equal(n.cfg.rings[0].size, 58); assert.ok(n.warnings.some((w) => /50–58/.test(w)));
  assert.deepEqual(sizeRange(plain.rings[0]), [44, 64]); assert.deepEqual(sizeRange(plain.rings[1]), [54, 76]);
});
test('Élesítés: engedélyezett, de jóvá nem hagyott vagy hibás szélességhatár blokkol', () => {
  const st = readyState(); const p = st.products.find((x) => x.id === plain.id);
  p.opts.width = { enabled: true, min: 3.5, max: 6, step: 0.5, approved: false };
  assert.ok(readiness(st).blockers.some((b) => b.key === p.id && b.kind === 'jovahagyas'));
  p.opts.width = { enabled: true, min: 6, max: 3, step: 0.5, approved: true };
  assert.ok(readiness(st).blockers.some((b) => b.key === p.id && b.kind === 'ervenytelen'));
  p.opts.width = { enabled: true, min: Math.min(...p.rings.map((r) => r.refWidth)), max: 8, step: 0.5, approved: true };
  assert.equal(readiness(st).ready, true);
});

/* ---------- V5.3: jóváhagyott / nem jóváhagyott ár ---------- */
import { priceTrust, shownPrice } from '../js/engine.js';
{
  const products = buildDemoProducts();
  seedWeights(products, DEMO_MATERIALS, DEMO_SETTINGS);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const M0 = clone(DEMO_MATERIALS), S0 = clone(DEMO_SETTINGS);
  const approveAll = (M, S) => {
    M.src = Object.fromEntries(Object.keys(M.src || {}).map((k) => [k, 'jovahagyott']));
    ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'sellPerGram.pd'].forEach((k) => (M.src[k] = 'jovahagyott'));
    M.diamonds.forEach((d) => { if (d.price) d.src = 'jovahagyott'; });
    S.src = Object.fromEntries(Object.keys(S.src || {}).map((k) => [k, 'jovahagyott']));
  };
  const plain = clone(products.find((p) => p.listaAr && !p.priceOnRequest && !p.rings.some((r) => r.stoneRule)));
  const stoned = clone(products.find((p) => p.listaAr && !p.priceOnRequest && p.rings.some((r) => r.stoneRule && r.stoneRule.def > 0)));

  test('V5.6: nem jóváhagyott gyűrű alapváltozata → egyedi árajánlat (a régi listaár NEM jelenik meg)', () => {
    const r = shownPrice(plain, defaultConfig(plain), M0, S0);
    assert.ok(plain.listaAr > 0);
    assert.equal(r.kind, 'quote'); assert.equal(r.final, null);
    assert.equal(priceTrust(plain, r.cfg, M0, S0).ok, false);
  });
  test('V5.3: nem jóváhagyott gyűrű módosított beállítása → egyedi ajánlat, ár nélkül', () => {
    const c = defaultConfig(plain); c.rings[0].size = c.rings[0].size + 4;
    const r = shownPrice(plain, c, M0, S0);
    assert.equal(r.kind, 'quote'); assert.equal(r.final, null); assert.ok(r.reason);
  });
  test('V5.3: jóváhagyott gyűrű, de nem jóváhagyott grammár → nem számolt ár', () => {
    const p = clone(plain); p.approved = true;
    const c = defaultConfig(p); c.rings[0].size += 2;
    const r = shownPrice(p, c, M0, S0);
    assert.equal(r.kind, 'quote'); assert.match(r.reason, /grammára/);
  });
  test('V5.3: minden jóváhagyva → számolt ár, a motor számítása változatlan', () => {
    const M = clone(M0), S = clone(S0); approveAll(M, S);
    const p = clone(plain); p.approved = true;
    const c = defaultConfig(p); c.rings[0].size += 2;
    const r = shownPrice(p, c, M, S);
    assert.equal(r.kind, 'calc'); assert.equal(r.final, priceProduct(p, c, M, S).final);
  });
  test('V5.3: kő esetén a kőár jóváhagyása is kell', () => {
    const M = clone(M0), S = clone(S0); approveAll(M, S);
    const p = clone(stoned); p.approved = true;
    const c = defaultConfig(p);
    const cat = c.rings.find((r) => r.stones && r.stones.count).stones.cat;
    M.diamonds.find((d) => d.id === cat).src = 'pelda';
    c.rings[0].size += 1;
    const r = shownPrice(p, c, M, S);
    assert.equal(r.kind, 'quote'); assert.match(r.reason, /kőméret/);
  });
  test('V5.3: titán soha nem kap számolt árat', () => {
    const M = clone(M0), S = clone(S0); approveAll(M, S);
    const p = clone(products.find((x) => (x.metals || []).includes('ti')) || plain); p.approved = true;
    if (!(p.metals || []).includes('ti')) return;
    const c = defaultConfig(p); c.metal = 'ti';
    assert.equal(shownPrice(p, c, M, S).final, null);
  });
}

/* ---------- V5.4: minden árat befolyásoló beállítás jóváhagyáshoz kötve ---------- */
{
  const products = buildDemoProducts();
  seedWeights(products, DEMO_MATERIALS, DEMO_SETTINGS);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const allOk = () => {
    const M = clone(DEMO_MATERIALS), S = clone(DEMO_SETTINGS);
    Object.keys(M.src).forEach((k) => (M.src[k] = 'jovahagyott'));
    M.diamonds.forEach((d) => { if (d.price) d.src = 'jovahagyott'; });
    Object.keys(S.src).forEach((k) => (S.src[k] = 'jovahagyott'));
    return { M, S };
  };
  const plain = clone(products.find((p) => p.listaAr && !p.priceOnRequest && !p.rings.some((r) => r.stoneRule))); plain.approved = true;
  const stoned = clone(products.find((p) => p.listaAr && !p.priceOnRequest && p.rings.some((r) => r.stoneRule && r.stoneRule.def > 0))); stoned.approved = true;
  const changed = (p) => { const c = defaultConfig(p); c.rings[0].size += 1; return c; };

  test('V5.4: minden jóváhagyva → számolt ár (kiindulás)', () => {
    const { M, S } = allOk();
    assert.equal(shownPrice(plain, changed(plain), M, S).kind, 'calc');
    assert.equal(shownPrice(stoned, changed(stoned), M, S).kind, 'calc');
  });
  for (const [key, who, label] of [
    ['density', 'plain', 'anyagonkénti tömegarány'], ['boxCost', 'plain', 'csomagolás díja (akkor is, ha 0)'],
    ['pricingMode', 'plain', 'számítási mód'], ['sizeMethod', 'plain', 'méretezés'], ['roundTo', 'plain', 'kerekítés'],
    ['settingPerStone', 'stoned', 'kőfoglalási díj (akkor is, ha 0)'], ['certCost', 'stoned', 'tanúsítvány díja'],
    ['stonesGross', 'stoned', 'kőár bruttó/nettó kezelése'], ['stoneEdgeMm', 'stoned', 'kő elférési szabálya (perem)'], ['stoneGapMm', 'stoned', 'kő elférési szabálya (távolság)'],
  ]) {
    test(`V5.4: nem jóváhagyott ${label} → nincs számolt ár`, () => {
      const { M, S } = allOk(); S.src[key] = 'demo';
      const p = who === 'plain' ? plain : stoned;
      const r = shownPrice(p, changed(p), M, S);
      assert.notEqual(r.kind, 'calc'); assert.equal(r.final, null);
    });
  }
  test('V5.4: nettó kőár esetén az ÁFA és a kőfelár jóváhagyása is kell', () => {
    const { M, S } = allOk(); S.stonesGross = false; S.src.vatPct = 'demo';
    assert.equal(shownPrice(stoned, changed(stoned), M, S).final, null);
    const b = allOk(); b.S.stonesGross = false; b.S.src.markupStones = 'demo';
    assert.equal(shownPrice(stoned, changed(stoned), b.M, b.S).final, null);
  });
  test('V5.4: bruttó kőárnál az ÁFA nem hat az árra, ezért nem blokkol', () => {
    const { M, S } = allOk(); S.src.vatPct = 'demo';
    const a = shownPrice(stoned, changed(stoned), M, S);
    const S2 = clone(S); S2.vatPct = 5;
    assert.equal(a.kind, 'calc'); assert.equal(priceProduct(stoned, changed(stoned), M, S2).final, a.final);
  });
  test('V5.4: gravírozás díja csak gravírozással kell', () => {
    const { M, S } = allOk(); S.src.engravingPrice = 'demo';
    const c = changed(plain);
    assert.equal(shownPrice(plain, c, M, S).kind, 'calc');
    c.rings[0].engraving = 'R & A';
    assert.equal(shownPrice(plain, c, M, S).final, null);
  });
  test('V5.4: költségalapú módban a referenciaár, munkadíj, felár és ÁFA jóváhagyása kell', () => {
    for (const k of ['lossPct', 'laborFactor', 'markupMetal', 'vatPct']) {
      const { M, S } = allOk(); S.pricingMode = 'koltseg'; S.src[k] = 'demo';
      assert.equal(shownPrice(plain, changed(plain), M, S).final, null, k);
    }
    const { M, S } = allOk(); S.pricingMode = 'koltseg'; M.src.gold24 = 'demo';
    assert.equal(shownPrice(plain, changed(plain), M, S).final, null, 'gold24');
  });
  test('V5.4: rögzített ár csak jóváhagyott gyűrűn számít jóváhagyottnak', () => {
    const { M, S } = allOk();
    const p = clone(plain); p.override = { type: 'fixed', value: 333000 };
    assert.equal(shownPrice(p, changed(p), M, S).final, 333000);
    p.approved = false;
    assert.notEqual(shownPrice(p, changed(p), M, S).kind, 'calc');
  });
  test('V5.4: nem jóváhagyott kőméret → nincs számolt ár, akkor sem, ha minden más jóváhagyott', () => {
    const { M, S } = allOk(); M.diamonds.forEach((d) => (d.src = 'pelda'));
    assert.equal(shownPrice(stoned, changed(stoned), M, S).final, null);
  });
}

test('V5.6: nyilvános nézet (nem jóváhagyott grammár üres) – a listaár nem jelenik meg, egyedi árajánlat', () => {
  const products = buildDemoProducts(); seedWeights(products, DEMO_MATERIALS, DEMO_SETTINGS);
  const p = JSON.parse(JSON.stringify(products.find((x) => x.listaAr && !x.priceOnRequest)));
  const M = JSON.parse(JSON.stringify(DEMO_MATERIALS)); Object.keys(M.sellPerGram).forEach((k) => (M.sellPerGram[k] = null)); M.src = {};
  const r = shownPrice(p, defaultConfig(p), M, DEMO_SETTINGS);
  assert.equal(r.kind, 'quote'); assert.equal(r.final, null);
  const c = defaultConfig(p); c.rings[0].size += 1;
  assert.equal(shownPrice(p, c, M, DEMO_SETTINGS).final, null);
});

/* ---------- V5.5: szakmai módosítás visszavonja a jóváhagyást ---------- */
import { professionalKey, approvalLoss } from '../js/engine.js';
{
  const products = buildDemoProducts();
  const base = JSON.parse(JSON.stringify(products.find((p) => p.rings.some((r) => r.stoneRule))));
  base.approved = true;
  const mod = (fn) => { const p = JSON.parse(JSON.stringify(base)); fn(p); return approvalLoss(base, p); };
  for (const [label, fn] of [
    ['listaár', (p) => { p.listaAr = (p.listaAr || 0) + 1000; }],
    ['rögzített ár', (p) => { p.override = { type: 'fixed', value: 123000 }; }],
    ['minimumár', (p) => { p.minPrice = 99000; }],
    ['tömeg', (p) => { p.rings[0].weight = (p.rings[0].weight || 3) + 0.1; }],
    ['referenciaméret', (p) => { p.rings[0].refSize += 1; }],
    ['szélesség', (p) => { p.rings[0].refWidth += 0.5; }],
    ['vastagság', (p) => { p.rings[0].thickness = 1.8; }],
    ['kőszabály', (p) => { const r = p.rings.find((x) => x.stoneRule); r.stoneRule = { ...r.stoneRule, max: (r.stoneRule.max || 1) + 3 }; }],
    ['mérettartomány', (p) => { p.rings[0].sizeMax = 70; }],
    ['anyagok', (p) => { p.metals = [...p.metals, 'pd'].filter((v, i, a) => a.indexOf(v) === i); if (p.metals.length === base.metals.length) p.metals = p.metals.slice(1); }],
    ['színek', (p) => { p.colors = p.colors.length > 1 ? p.colors.slice(1) : [...p.colors, 'rozsa']; }],
    ['választható szélesség', (p) => { p.opts = { ...p.opts, width: { ...(p.opts?.width || {}), enabled: true, min: 3, max: 5, step: 0.5 } }; }],
    ['egyedi munkadíj', (p) => { p.rings[0].labor = 50000; }],
  ]) {
    test(`V5.5: jóváhagyott gyűrű – ${label} módosítása visszavonja a jóváhagyást`, () => assert.equal(mod(fn).product, true));
  }
  for (const [label, fn] of [
    ['fotó', (p) => { p.img = 'img/uj-foto.jpg'; }],
    ['név', (p) => { p.name = 'Új név'; }],
    ['stílus', (p) => { p.style = 'klasszikus'; }],
    ['egyeztetési megjegyzés', (p) => { p.consult = ['Gravírozás egyeztetéssel']; }],
    ['láthatóság', (p) => { p.visible = false; }],
    ['cikkszám-írásmód', (p) => { p.code = p.code + ' '; }],
  ]) {
    test(`V5.5: jóváhagyott gyűrű – ${label} módosítása NEM vonja vissza`, () => assert.equal(mod(fn).product, false));
  }
  test('V5.5: nem jóváhagyott gyűrűnél nincs mit visszavonni', () => {
    const p0 = JSON.parse(JSON.stringify(base)); p0.approved = false;
    const p1 = JSON.parse(JSON.stringify(p0)); p1.rings[0].weight = 9;
    assert.equal(approvalLoss(p0, p1).product, false);
  });
  test('V5.5: jóváhagyott szélességhatár módosítása a szélesség-jóváhagyást is visszavonja, a vastagságét nem', () => {
    const p0 = JSON.parse(JSON.stringify(base));
    p0.opts = { width: { enabled: true, min: 3, max: 5, step: 0.5, approved: true }, thickness: { enabled: true, values: [1.5, 1.8], approved: true } };
    const p1 = JSON.parse(JSON.stringify(p0)); p1.opts.width.max = 6;
    const l = approvalLoss(p0, p1);
    assert.equal(l.width, true); assert.equal(l.thickness, false); assert.equal(l.product, true);
  });
  test('V5.5: a kulcs mezősorrendtől független', () => {
    const a = JSON.parse(JSON.stringify(base)); const b = JSON.parse(JSON.stringify(base));
    b.rings[0] = Object.fromEntries(Object.entries(b.rings[0]).reverse());
    assert.equal(professionalKey(a), professionalKey(b));
  });
}

/* ---------- V5.5: a nyilvános kódban nincs belső árazási adat ---------- */
{
  const src = ['data.js', 'engine.js', 'store.js', 'views-public.js', 'views-admin.js', 'ui.js', 'app.js', 'api.js']
    .map((f) => readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8')).join('\n');
  test('V5.5/V5.6: nyilvános JS – a bemutató adatkészlet árai, tömegei, munkadíjai nincsenek benne', () => {
    // Az ügyfél saját jegyzetének számait szándékosan NEM soroljuk fel ebben a nyilvános tesztben (V5.6) –
    // azokat a nem nyilvános ellenőrzőlista nézi. Itt: a szemléltető adatkészlet egyetlen ára sem szivárog a weboldal kódjába.
    const nums = new Set();
    const walk = (o) => { if (o && typeof o === 'object') Object.values(o).forEach(walk); else if (typeof o === 'number' && o >= 1000) nums.add(o); };
    walk(DS.materials); walk(DS.laborByStyle);
    for (const n of nums) {
      for (const form of [String(n), n.toLocaleString('hu-HU').replace(/\s/g, ' ')]) {
        const re = new RegExp(`(?<![\\d])${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d])`);
        assert.ok(!re.test(src), `a nyilvános kódban szerepel: ${form}`);
      }
    }
    for (const bad of ['DEMO_LABOR', 'DEMO_MATERIALS', 'EXAMPLE_WEIGHTS = {', 'laborByStyle']) assert.ok(!src.includes(bad), bad);
  });
  test('V5.5: a nyilvános kiinduló adatokban minden ár üres és semmi nincs jóváhagyva', async () => {
    const d = await import('../js/data.js');
    assert.ok(Object.values(d.BASE_MATERIALS.sellPerGram).every((v) => v === null));
    assert.ok(d.BASE_MATERIALS.diamonds.every((x) => x.price === null));
    assert.deepEqual(d.BASE_MATERIALS.src, {}); assert.deepEqual(d.BASE_SETTINGS.src, {});
    assert.ok(d.buildDemoProducts().every((p) => p.rings.every((r) => r.labor === null) && p.approved === false));
  });
  test('V5.5/V5.6: semleges adatokkal minden gyűrű egyedi ajánlat – nincs számolt ár, nincs listaár', async () => {
    const d = await import('../js/data.js');
    const ps = seedWeights(d.buildDemoProducts(), d.BASE_MATERIALS, d.BASE_SETTINGS);
    for (const p of ps.slice(0, 30)) {
      const r = shownPrice(p, defaultConfig(p), d.BASE_MATERIALS, d.BASE_SETTINGS);
      assert.equal(r.kind, 'quote'); assert.equal(r.final, null);
    }
  });
}

/* ---------- V5.6: árállapotok – régi listaár, jóváhagyott fix ár, jóváhagyott számított ár, egyedi ajánlat ---------- */
import { priceStatus } from '../js/engine.js';
{
  const MA = clone(M); MA.src = Object.fromEntries(Object.keys(MA.src).map((k) => [k, 'jovahagyott'])); MA.diamonds.forEach((d) => { if (d.price) d.src = 'jovahagyott'; });
  const SA = clone(S); SA.src = Object.fromEntries(Object.keys(SA.src).map((k) => [k, 'jovahagyott']));
  test('V5.6: árállapot – nem jóváhagyott gyűrű: egyedi ajánlat, a régi listaár csak „legacy”', () => {
    const p = clone(plain); p.approved = false;
    const st = priceStatus(p, MA, SA);
    assert.equal(st.kind, 'quote'); assert.equal(st.value, null); assert.equal(st.legacy, p.listaAr); assert.equal(st.label, 'egyedi árajánlat');
  });
  test('V5.6: árállapot – jóváhagyott gyűrű, jóváhagyott árelemek: számított ár, nem a listaár', () => {
    const p = clone(plain); p.approved = true;
    const st = priceStatus(p, MA, SA);
    assert.equal(st.kind, 'calc'); assert.ok(st.value > 0); assert.equal(st.label, 'jóváhagyott számított ár');
  });
  test('V5.6: árállapot – rögzített ár jóváhagyott gyűrűn: fix ár; nem jóváhagyott gyűrűn: egyedi ajánlat', () => {
    const p = clone(plain); p.override = { type: 'fixed', value: 333300 };
    assert.equal(priceStatus(p, MA, SA).kind, 'quote');
    p.approved = true;
    const st = priceStatus(p, MA, SA);
    assert.equal(st.kind, 'fixed'); assert.equal(st.value, 333300); assert.equal(st.label, 'jóváhagyott fix ár');
  });
  test('V5.6: jóváhagyott grammár módosítása → a jóváhagyott gyűrű számított ára azonnal követi', () => {
    const p = clone(plain); p.approved = true;
    const a = priceStatus(p, MA, SA).value;
    const M2 = clone(MA); M2.sellPerGram.au14 += 4000;
    const b = priceStatus(p, M2, SA).value;
    assert.ok(b > a);
  });
  test('V5.6: hibás tömeg (0 vagy negatív) jóváhagyott gyűrűnél sem ad számított árat', () => {
    for (const w of [0, -2, null]) {
      const p = clone(plain); p.approved = true; p.rings.forEach((r) => (r.weight = w));
      assert.notEqual(priceStatus(p, MA, SA).kind, 'calc', String(w));
    }
  });
}

/* ---------- V5.6: szakmai jóváhagyás – kötelező és becsült adatok ---------- */
import { approvalCheck } from '../js/engine.js';
{
  const full = () => { const p = clone(pair); p.rings.forEach((r) => { r.thickness = 1.7; r.weightChecked = true; if (r.stoneRule) r.stoneRule.demo = false; }); return p; };
  test('V5.6: minden kötelező adat megvan → jóváhagyható, nincs becsült adat', () => {
    const c = approvalCheck(full(), M, S); assert.equal(c.ok, true); assert.deepEqual(c.missing, []); assert.deepEqual(c.estimated, []);
  });
  test('V5.6: hiányzó vastagság, szélesség, referenciaméret, tömeg, anyag → nem hagyható jóvá, mindegyik megnevezve', () => {
    for (const [what, fn, label] of [
      ['vastagság', (p) => { p.rings[0].thickness = null; }, 'vastagság'],
      ['szélesség', (p) => { p.rings[0].refWidth = 0; }, 'szélesség'],
      ['referenciaméret', (p) => { p.rings[1].refSize = null; }, 'referenciaméret'],
      ['tömeg', (p) => { p.rings[0].weight = 0; }, 'tömeg'],
      ['anyag', (p) => { p.metals = []; }, 'Elérhető anyagok'],
    ]) { const p = full(); fn(p); const c = approvalCheck(p, M, S); assert.equal(c.ok, false, what); assert.ok(c.missing.some((m) => m.label.includes(label)), what); }
  });
  test('V5.6: hibás kőadat (nincs kőméret, rossz kőszám, ismeretlen foglalás, nem fér el) → nem hagyható jóvá', () => {
    const cases = [
      (r) => { r.stoneRule.cats = []; },
      (r) => { r.stoneRule.mode = 'free'; r.stoneRule.min = 4; r.stoneRule.max = 2; },
      (r) => { r.stoneRule.mode = 'valami'; },
      (r) => { r.refWidth = 1.2; },
    ];
    for (const fn of cases) { const p = full(); const r = p.rings.find((x) => x.stoneRule); fn(r); assert.equal(approvalCheck(p, M, S).ok, false, fn.toString()); }
  });
  test('V5.6: becsült tömeg (régi listaárból) és fotóról becsült kőszabály → „becsült”, megerősítés kell', () => {
    const p = full(); p.rings[0].weightChecked = false; p.rings.find((r) => r.stoneRule).stoneRule.demo = true;
    const c = approvalCheck(p, M, S);
    assert.equal(c.ok, true); assert.equal(c.estimated.length, 2);
  });
  test('V5.6: választható szélesség/vastagság bekapcsolva, de hiányos vagy nem jóváhagyott → nem hagyható jóvá', () => {
    const a = full(); a.opts = { width: { enabled: true, min: 3, max: null, step: 0.5, approved: true } }; assert.equal(approvalCheck(a, M, S).ok, false);
    const b = full(); b.opts = { width: { enabled: true, min: 3, max: 5, step: 0.5, approved: false } }; assert.equal(approvalCheck(b, M, S).ok, false);
    const c = full(); c.opts = { thickness: { enabled: true, values: [], approved: true } }; assert.equal(approvalCheck(c, M, S).ok, false);
    const d = full(); d.opts = { width: { enabled: true, min: 3, max: 5, step: 0.5, approved: true }, thickness: { enabled: true, values: [1.6, 1.8], approved: true } }; assert.equal(approvalCheck(d, M, S).ok, true);
  });
  test('V5.6: nincs általános határérték – keskeny (2,5 mm) kő nélküli gyűrű is jóváhagyható, ha minden adat megvan', () => {
    const p = clone(plain); p.rings.forEach((r) => { r.refWidth = 2.5; r.thickness = 1.4; r.weightChecked = true; });
    assert.equal(approvalCheck(p, M, S).ok, true);
  });
  test('V5.6: kötelező adat a kiinduló katalógusban – egyik gyűrűnél sincs vastagság, így egyik sem hagyható jóvá véletlenül', () => {
    assert.ok(products.every((p) => !approvalCheck(p, M, S).ok));
  });
}
