/* ==========================================================================
   Központi árkalkulációs motor – tiszta függvények, nincs mellékhatás.
   Kalkulált ár =
     ( nemesfém + ötvözőanyag + munkadíj + kőfoglalás + gravírozás + egyéb )
       × (1 + fém/munka felár)
     + drágakövek × (1 + kőfelár)
     → + ÁFA → kerekítés → egyedi felülbírálás → minimumár-védelem
   A munkadíj fix forintösszeg: az arany árától NEM függ.
   ========================================================================== */

export const FINENESS = { 14: 0.585, 18: 0.75, 925: 0.925 };

export const round2 = (n) => Math.round(n * 100) / 100;

export function alloyPrice(color, M) {
  if (color === 'ketszinu') return (M.alloy.feher + M.alloy.sarga) / 2;
  return M.alloy[color] ?? M.alloy.sarga;
}

export function diamond(M, id) {
  return M.diamonds.find((d) => d.id === id) || null;
}

/** Egy gyűrű költségelemei (nettó, felár nélkül). */
export function ringCost(ring, opt, M, S) {
  const silver = opt.color === 'ezust';
  const karat = silver ? 925 : opt.karat;
  const fin = FINENESS[karat];
  const dens = karat === 18 ? S.density18 : 1;
  const sizeF = (opt.size || ring.refSize) / ring.refSize;
  const widthF = (opt.width || ring.refWidth) / ring.refWidth;
  const grams = ring.weight * sizeF * widthF * dens;
  const lossF = 1 + S.lossPct / 100;

  const pure = grams * fin;                                   // színfém-tartalom, g
  const metal = silver ? pure * M.silver * lossF : pure * M.gold24 * lossF;
  const alloy = silver ? 0 : grams * (1 - fin) * alloyPrice(opt.color, M) * lossF;

  let stones = 0, setting = 0, stoneInfo = null;
  if (ring.stones && opt.stones !== false) {
    const d = diamond(M, ring.stones.cat);
    if (d) {
      stones = d.price * ring.stones.count;
      setting = S.settingPerStone * ring.stones.count;
      stoneInfo = { ...d, count: ring.stones.count };
    }
  }
  const engraving = opt.engraving && opt.engraving.trim() ? S.engravingPrice : 0;

  return {
    grams: round2(grams), pure: round2(pure), fin, karat,
    metal, alloy, labor: ring.labor, setting, engraving, other: ring.other || 0,
    stones, stoneInfo,
  };
}

export function roundUp(n, step) {
  if (!step || step <= 1) return Math.round(n);
  return Math.ceil(n / step) * step;
}

/** Alapértelmezett konfiguráció egy termékhez. */
export function defaultConfig(p) {
  return {
    color: p.baseColor,
    karat: p.baseKarat,
    rings: p.rings.map((r) => ({
      size: r.refSize,
      width: r.refWidth,
      stones: !!r.stones,
      engraving: '',
    })),
  };
}

/** Teljes ár egy termékre és konfigurációra. */
export function priceProduct(p, cfg, M, S, { applyOverride = true } = {}) {
  cfg = cfg || defaultConfig(p);
  const parts = p.rings.map((ring, i) =>
    ringCost(ring, { color: cfg.color, karat: cfg.karat, ...cfg.rings[i] }, M, S));

  const sum = (k) => parts.reduce((a, x) => a + x[k], 0);
  const hasStones = parts.some((x) => x.stones > 0);
  const extras = S.boxCost + (hasStones ? S.certCost : 0);

  const metal = sum('metal'), alloy = sum('alloy'), labor = sum('labor'),
        setting = sum('setting'), engraving = sum('engraving'), other = sum('other') + extras,
        stones = sum('stones');

  const baseNet = metal + alloy + labor + setting + engraving + other;
  const cost = baseNet + stones;                                       // önköltség
  const net = baseNet * (1 + S.markupMetal / 100) + stones * (1 + S.markupStones / 100);
  const gross = net * (1 + S.vatPct / 100);
  const calculated = roundUp(gross, S.roundTo);

  let final = calculated, source = 'keplet';
  if (applyOverride && p.override) {
    if (p.override.type === 'fixed') { final = p.override.value; source = 'rogzitett'; }
    if (p.override.type === 'pct') { final = roundUp(calculated * (1 + p.override.value / 100), S.roundTo); source = 'modositott'; }
  }
  let minHit = false;
  if (p.minPrice && final < p.minPrice) { final = p.minPrice; minHit = true; }

  const finalNet = final / (1 + S.vatPct / 100);
  const marginPct = finalNet > 0 ? ((finalNet - cost) / finalNet) * 100 : 0;

  return {
    final, calculated, source, minHit,
    marginPct, lowMargin: marginPct < S.minMarginPct,
    breakdown: { metal, alloy, labor, setting, engraving, other, stones, cost, net, gross },
    parts,
    grams: round2(parts.reduce((a, x) => a + x.grams, 0)),
    pure: round2(parts.reduce((a, x) => a + x.pure, 0)),
  };
}

/** Alapár (alapkonfiguráció), az összes termékre. */
export function priceAll(products, M, S) {
  const out = {};
  for (const p of products) out[p.id] = priceProduct(p, null, M, S).final;
  return out;
}

/** Mely termékeket érinti egy alapanyagár-változás – a két állapot összevetése. */
export function diffPrices(products, M0, M1, S) {
  const a = priceAll(products, M0, S), b = priceAll(products, M1, S);
  const rows = products.map((p) => ({ id: p.id, code: p.code, name: p.name, img: p.img, color: p.baseColor,
    old: a[p.id], now: b[p.id], delta: b[p.id] - a[p.id], pct: a[p.id] ? ((b[p.id] - a[p.id]) / a[p.id]) * 100 : 0 }))
    .filter((r) => r.delta !== 0);
  const total = rows.reduce((s, r) => s + r.delta, 0);
  const avgPct = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
  return { rows, count: rows.length, total, avgPct };
}

/**
 * Demó-tömegek visszaszámolása: a gyűrűk tömegét úgy állítjuk be, hogy
 * a kezdő demóárakkal a kalkulált ár a mostani weboldali ár közelében legyen.
 * Az ár a tömegben lineáris, ezért két pontból pontosan megoldható.
 */
export function seedWeights(products, M, S) {
  for (const p of products) {
    if (p.fixedWeight || !p.listaAr) continue;
    const set = (W) => p.rings.forEach((r) => { r.weight = W * r.share; });
    const gross = (W) => { set(W); return priceProduct(p, null, M, { ...S, roundTo: 1 }, { applyOverride: false }).breakdown.gross; };
    const lo = p.kind === 'p' ? 3.6 : 2, hi = p.kind === 'p' ? 18 : 8;
    let W = lo;
    for (let guard = 0; guard < 40; guard++) {
      const g0 = gross(0), g1 = gross(10);
      W = ((p.listaAr - g0) / (g1 - g0)) * 10;
      const st = p.rings.find((r) => r.stones);
      if (W >= lo || !st) break;
      // túl drága demó-kőbeállítás: előbb kisebb kőkategória, végső esetben kevesebb kő
      const cats = [...M.diamonds].sort((a, b) => a.price - b.price);
      const i = cats.findIndex((d) => d.id === st.stones.cat);
      if (i > 0) st.stones.cat = cats[i - 1].id;
      else if (st.stones.count > 1) st.stones.count -= 1;
      else break;
    }
    W = Math.max(lo, Math.min(W, hi));
    p.rings.forEach((r) => { r.weight = round1(W * r.share); });
  }
  return products;
}
const round1 = (n) => Math.round(n * 10) / 10;

/* --- Magyar formázás --- */
const nf = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
export const ft = (n) => nf.format(Math.round(n)).replace(/ |\s/g, ' ') + ' Ft';
export const num = (n) => nf.format(Math.round(n)).replace(/ |\s/g, ' ');
export const dec = (n) => nf2.format(n);
export const pct = (n, sign = true) => (sign && n > 0 ? '+' : '') + nf2.format(Math.round(n * 10) / 10) + '%';
