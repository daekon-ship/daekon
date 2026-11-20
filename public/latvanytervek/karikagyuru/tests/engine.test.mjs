/* Árkalkulációs motor tesztjei – futtatás: node --test public/latvanytervek/karikagyuru/tests/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_MATERIALS, DEMO_SETTINGS, buildDemoProducts } from '../js/data.js';
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
  assert.ok(Math.abs(b.grams / a.grams - 5.4 / 4.8) < 0.02);   // ügyfélpélda: 4,8 g → 5,4 g
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

/* ---------------- Az ügyfél kézírásos jegyzetének számpéldái ---------------- */
const R1 = { ...S, pricingMode: 'gramm', roundTo: 1 };
const ex = (metal, weight, size, s = R1) => exampleRing({ metal, weight, size }, M, s).final;

test('Ügyfélpélda: 14K, 4,8 g × 47 000 = 225 600 Ft', () => assert.equal(ex('au14', 4.8, 54), 225600));
test('Ügyfélpélda: platina, 6,9 g × 55 000 = 379 500 Ft', () => assert.equal(ex('pt', 6.9, 54), 379500));
test('Ügyfélpélda: platina 48-as méret ≈ 337 333 Ft (379 500 × 48/54)', () => assert.equal(ex('pt', 6.9, 48), 337333));
test('Ügyfélpélda: platina 60-as méret ≈ 421 667 Ft (379 500 × 60/54), NEM a jegyzet 442 000 Ft-ja', () => {
  assert.equal(ex('pt', 6.9, 60), 421667);
  assert.notEqual(ex('pt', 6.9, 60), 442000);
});
test('Méretmódszer grammáras módban mindkét beállítással ugyanazt adja', () => {
  assert.equal(ex('pt', 6.9, 60, { ...R1, sizeMethod: 'ar' }), 421667);
});
test('Kerekítés felfelé 100 Ft-ra (alapbeállítás)', () => {
  assert.equal(ex('au14', 4.8, 54, { ...S }), 225600);
  assert.equal(ex('pt', 6.9, 48, { ...S }), 337400);
});
test('Ügyfélpélda: tömegarányok – 14K 4,8 g → 18K 5,4 · Pt 6,9 · Pd 4,0 · Ti 1,5 g (54-es)', () => {
  const ring = { label: 'x', refSize: 54, refWidth: 4, weight: 4.8, labor: 0, other: 0, stoneRule: null };
  const p = { id: 't', code: 't', name: 't', kind: 's', metals: ['au14', 'au18', 'pt', 'pd', 'ti'], colors: ['sarga'], baseColor: 'sarga', widths: [4], rings: [ring] };
  const g = (m) => Math.round(refWeight(ring, m, S) * 100) / 100;
  assert.deepEqual(['au14', 'au18', 'pt', 'pd', 'ti'].map(g), [4.8, 5.4, 6.9, 4, 1.5]);
});
test('Ügyfélpélda: alapanyagárak – 24K 40 000 → 14K 23 400, 18K 30 000; Pt 15 000; Pd 10 000', () => {
  assert.deepEqual(['au14', 'au18', 'pt', 'pd'].map((m) => Math.round(refPrice(m, M))), [23400, 30000, 15000, 10000]);
});
test('Grammáras módban az alapanyagár nem változtatja az eladási árat, a grammár igen', () => {
  assert.equal(diffPrices(products, M, { ...M, gold24: 50000 }, S).count, 0);
  assert.ok(diffPrices(products, M, { ...M, sellPerGram: { ...M.sellPerGram, au14: 48000 } }, S).count > 30);
});
test('Ügyfélpélda: gyémántárak (természetes) – 0,01 → 6 000 · 0,015 → 9 000 · 0,02 → 12 000 · 0,03 → 18 000 Ft', () => {
  assert.deepEqual(['d01', 'd015', 'd02', 'd03'].map((id) => diamond(M, id).price), [6000, 9000, 12000, 18000]);
  assert.deepEqual(['d01', 'd015', 'd02', 'd03'].map((id) => diamond(M, id).src), ['pelda', 'pelda', 'pelda', 'pelda']);
});
test('A bizonytalan 0,04 és 0,05 ct nincs jóváhagyott árként kezelve → egyedi ajánlat', () => {
  for (const id of ['d04', 'd05']) {
    assert.equal(diamond(M, id).price, null); assert.equal(diamond(M, id).src, 'bizonytalan');
    const r = exampleRing({ metal: 'au14', weight: 4.8, width: 5, stones: { count: 1, cat: id } }, M, R1);
    assert.equal(r.final, null); assert.match(r.reason, /egyedi árajánlat/);
  }
});
test('Kő + gyűrű: 4,8 g 14K + 3 × 0,01 ct = 225 600 + 18 000 Ft', () => {
  assert.equal(exampleRing({ metal: 'au14', weight: 4.8, stones: { count: 3, cat: 'd01' } }, M, R1).final, 243600);
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
  ['au14', 4.8, 54, 225600, 225600, 226000],
  ['pt', 6.9, 54, 379500, 379500, 380000],
  ['pt', 6.9, 48, 337333, 337400, 338000],
  ['pt', 6.9, 60, 421667, 421700, 422000],
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
test('A 18K, palládium és titán grammár demóként jelölt, a 14K és platina ügyfélpélda', () => {
  assert.deepEqual(['au18', 'pd'].map((m) => M.src[`sellPerGram.${m}`]), ['demo', 'demo']);
  assert.equal(M.sellPerGram.ti, null); assert.equal(M.src['sellPerGram.ti'], 'bizonytalan');   // titán: munkaalapú ár, nincs grammár
  assert.deepEqual(['au14', 'pt'].map((m) => M.src[`sellPerGram.${m}`]), ['pelda', 'pelda']);
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
test('Titán: nincs tömegalapú ár – egyedi ajánlat, érthető indoklással (ügyfél, 34:39–35:39)', () => {
  const p = products.find((x) => x.metals.includes('ti') && x.listaAr);
  const r = price(p, (c) => { c.metal = 'ti'; c.color = null; });
  assert.equal(r.final, null); assert.match(r.reason, /munkából adódik/);
});
test('A szélesség/profil nem választható online (ügyfél, 47:37–48:18)', () => {
  assert.deepEqual(products.filter((p) => !p.added && p.widths.length !== 1).map((p) => p.code), []);
});
test('Kétszínű modell nem készülhet platinából, palládiumból, titánból (ügyfél, 31:05)', () => {
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
test('Élesítési ellenőrzés: demó- és példaadatokkal nem élesíthető; teljes jóváhagyás után igen', () => {
  const st = { materials: clone(M), settings: clone(S), products: clone(products) };
  const r0 = readiness(st);
  assert.equal(r0.ready, false);
  const keys = r0.blockers.map((b) => b.key);
  for (const k of ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'd01', 'd04', 'roundTo', 'vatPct', 'engravingPrice']) assert.ok(keys.includes(k), k);
  assert.ok(r0.byGroup.gyuruk > 100);
  // az ügyfél példája sem számít jóváhagyottnak
  assert.equal(r0.blockers.find((b) => b.key === 'sellPerGram.au14').src, 'pelda');
  for (const b of r0.blockers) {
    if (b.group === 'arak') st.materials.src[b.key] = 'jovahagyott';
    if (b.group === 'gyemant') st.materials.diamonds.find((d) => d.id === b.key).src = 'jovahagyott';
    if (b.group === 'szabalyok') st.settings.src[b.key] = 'jovahagyott';
    if (b.group === 'gyuruk') st.products.find((p) => p.id === b.key).approved = true;
  }
  assert.equal(readiness(st).ready, true);
  st.settings.src.roundTo = 'demo';
  assert.deepEqual(readiness(st).blockers.map((b) => b.key), ['roundTo']);
});
test('Az ötvös számítási módszere változatlan (regresszió)', () => {
  assert.equal(exampleRing({ metal: 'au14', weight: 4.8, size: 54 }, M, R1).final, 225600);
  assert.equal(exampleRing({ metal: 'pt', weight: 6.9, size: 60 }, M, R1).final, 421667);
});
