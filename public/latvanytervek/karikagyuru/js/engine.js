/* ==========================================================================
   Központi árkalkulációs motor – V2 (tiszta függvények, nincs mellékhatás).

   KÉT ÁRAZÁSI MÓD (admin: Felárak és munkadíjak → Árazás módja):
   A) „koltseg” – költségalapú:
        ( nemesfém + ötvözet + munkadíj + kőfoglalás + gravír + egyéb ) × (1 + fém/munka felár)
        + gyémánt × (1 + kőfelár)  → + ÁFA → kerekítés
   B) „gramm” – grammonkénti késztermékár (az ügyfél megbeszélésen használt módszere):
        kész tömeg × bruttó grammár (ez MÁR tartalmazza a fémet, a munkadíjat és az árrést)
        + ( gyémánt × (1 + kőfelár) + kőfoglalás + gravír + doboz/tanúsítvány ) × (1 + ÁFA)
      Itt a munkadíj és a fém-felár NEM adódik hozzá még egyszer.

   KÉT MÉRETSZÁMÍTÁS (admin: Árazás módja):
   - „tomeg”: a fém tömege arányos a mérettel (belső kerület) – a munkadíj nem változik.
   - „ar”: egyszerű árarányosítás – a gyűrű kő nélküli ára arányos a mérettel.
   Egyik sem végleges szakmai szabály: ügyféllel egyeztetendő.

   SZÍN: azonos anyagnál/karátnál az arany színe NEM módosítja az árat (ügyféligény).
   GYÉMÁNT: gyűrűnként szabály (stoneRule) – nem minden modell konfigurálható szabadon.
   Ha nincs megbízható ár, a végeredmény final = null és quote = true
   („Egyedi árajánlat szükséges”) – soha nem mutatunk megtévesztő árat.
   ========================================================================== */

/** Választható anyagok. dens = tömegszorzó a 14K-hoz képest (felülírható: S.density). */
export const METALS = {
  au14: { label: '14 karátos arany', short: '14K arany', stamp: '585', gold: true, fin: 0.585, ref: 'gold24' },
  au18: { label: '18 karátos arany', short: '18K arany', stamp: '750', gold: true, fin: 0.75, ref: 'gold24' },
  pt:   { label: 'Platina',          short: 'Platina',   stamp: 'Pt950', gold: false, fin: 0.95, ref: 'platinum' },
  pd:   { label: 'Palládium',        short: 'Palládium', stamp: 'Pd950', gold: false, fin: 0.95, ref: 'palladium' },
  ti:   { label: 'Titán',            short: 'Titán',     stamp: 'Ti', gold: false, fin: 1, ref: 'titanium' },
};
export const METAL_ORDER = ['au14', 'au18', 'pt', 'pd', 'ti'];
export const isGold = (m) => !!METALS[m]?.gold;

export const round2 = (n) => Math.round(n * 100) / 100;
const round1 = (n) => Math.round(n * 10) / 10;
const ok = (n) => typeof n === 'number' && Number.isFinite(n);

export function diamond(M, id) {
  return (M.diamonds || []).find((d) => d.id === id) || null;
}

export function roundUp(n, step) {
  if (!step || step <= 1) return Math.round(n);
  return Math.ceil(n / step) * step;
}

/* ---------------- Gyémántszabályok ---------------- */
/**
 * stoneRule: { mode: 'free' | 'fixed' | 'perSize' | 'quote', min, max, def, cats: [id], defCat, allowNone, demo }
 *  free    – a vásárló választ kőszámot min..max között
 *  fixed   – a kőszám kötött (a modell kialakítása miatt), csak a kőméret választható
 *  perSize – a kőszám a gyűrűmérettől függ (körbe foglalt gyűrű): def × méret / refméret, min..max közé szorítva
 *  quote   – ez a változat csak egyedi árajánlattal
 */
export function stoneCount(rule, size, refSize) {
  if (!rule) return 0;
  if (rule.mode === 'perSize') return clamp(Math.round(rule.def * (size || refSize) / refSize), rule.min, rule.max);
  return rule.def;
}
const clamp = (v, lo, hi) => Math.min(hi ?? v, Math.max(lo ?? v, v));

/** Konfiguráció érvényesítése: lehetetlen összeállítást nem engedünk (szorítás + figyelmeztetés). */
export function normalizeConfig(p, cfg) {
  const warnings = [];
  const out = JSON.parse(JSON.stringify(cfg));
  const metals = p.metals || ['au14'];
  if (!metals.includes(out.metal)) { warnings.push('Ez az anyag ennél a modellnél nem választható.'); out.metal = metals[0]; }
  if (!isGold(out.metal)) out.color = null;
  else if (!p.colors.includes(out.color)) out.color = p.baseColor;
  p.rings.forEach((ring, i) => {
    const rc = out.rings[i];
    if (!rc) return;
    if (!(rc.size >= 40 && rc.size <= 80)) rc.size = ring.refSize;
    if (p.widths && !p.widths.includes(rc.width)) rc.width = ring.refWidth;
    const rule = ring.stoneRule;
    if (!rule) { rc.stones = null; return; }
    if (rc.stones === null || rc.stones === false) {
      if (!rule.allowNone) { rc.stones = { count: stoneCount(rule, rc.size, ring.refSize), cat: rule.defCat }; warnings.push('Ennél a gyűrűnél a kövek nem hagyhatók el.'); }
      else rc.stones = null;
      return;
    }
    const st = rc.stones;
    if (!rule.cats.includes(st.cat)) { st.cat = rule.defCat; warnings.push('Ez a kőméret ennél a modellnél nem választható.'); }
    if (rule.mode === 'free') {
      const lo = Math.max(1, rule.min || 0);
      if (!(st.count >= lo && st.count <= rule.max)) { st.count = clamp(Math.round(st.count || rule.def), lo, rule.max); warnings.push(`A kövek száma ${lo} és ${rule.max} között lehet.`); }
    } else {
      st.count = stoneCount(rule, rc.size, ring.refSize);
    }
  });
  return { cfg: out, warnings };
}

/** Alapértelmezett konfiguráció: 14K arany (ha a modell engedi), a fotó színe, referenciaméret, alap kövek. */
export function defaultConfig(p) {
  const metals = p.metals || ['au14'];
  return {
    metal: metals.includes('au14') ? 'au14' : metals[0],
    color: p.baseColor,
    rings: p.rings.map((r) => ({
      size: r.refSize,
      width: r.refWidth,
      stones: r.stoneRule ? { count: stoneCount(r.stoneRule, r.refSize, r.refSize), cat: r.stoneRule.defCat } : null,
      engraving: '',
      sizeUnknown: false,
      font: 0,
    })),
  };
}

/* ---------------- Egy gyűrű ---------------- */
function density(metal, S) {
  const d = S.density || {};
  if (metal === 'au18') return d.au18 ?? S.density18 ?? 1.17;
  return d[metal] ?? { au14: 1, pt: 1.65, pd: 0.92, ti: 0.35 }[metal] ?? 1;
}

/** Egy gyűrű elemei nettóban (felár és ÁFA nélkül). Hiba esetén { error }. */
export function ringCost(ring, rc, metal, M, S) {
  const m = METALS[metal];
  if (!m) return { error: 'Ismeretlen anyag.' };
  if (!ok(ring.weight) || ring.weight <= 0) return { error: 'Hiányzó tömegadat.' };
  const sizeF = (rc.size || ring.refSize) / ring.refSize;
  const widthF = (rc.width || ring.refWidth) / (ring.refWidth || 1);
  const grams = ring.weight * sizeF * widthF * density(metal, S);
  const gramsRef = ring.weight * widthF * density(metal, S);          // referenciaméretben
  const pure = grams * m.fin;
  const lossF = 1 + (S.lossPct || 0) / 100;
  const laborF = (S.laborFactor && S.laborFactor[metal]) || 1;
  const sizeMethod = S.sizeMethod || 'tomeg';
  const priceGrams = sizeMethod === 'ar' ? gramsRef : grams;
  const priceF = sizeMethod === 'ar' ? sizeF : 1;                    // árarányosítás: a teljes kő nélküli rész

  let metalCost = 0, alloy = 0, labor = 0, gramSell = 0;
  if ((S.pricingMode || 'koltseg') === 'gramm') {
    const g = M.sellPerGram && M.sellPerGram[metal];
    if (!ok(g) || g <= 0) return { error: `Nincs grammár: ${m.label}.` };
    gramSell = priceGrams * g * priceF;                              // bruttó, munkadíjjal és árréssel
  } else {
    const ref = M[m.ref];
    if (!ok(ref) || ref <= 0) return { error: `Nincs referenciaár: ${m.label}.` };
    metalCost = priceGrams * m.fin * ref * lossF * priceF;
    alloy = m.gold ? priceGrams * (1 - m.fin) * (M.alloyAll ?? 0) * lossF * priceF : 0;
    labor = (ring.labor || 0) * laborF * priceF;
  }

  let stones = 0, setting = 0, stoneInfo = null, quote = null;
  if (ring.stoneRule && rc.stones) {
    const rule = ring.stoneRule;
    if (rule.mode === 'quote') quote = 'Ennél a kőbeállításnál egyedi árajánlat szükséges.';
    const d = diamond(M, rc.stones.cat);
    if (!d || !ok(d.price)) quote = 'Ehhez a kőmérethez nincs ár – egyedi árajánlat szükséges.';
    else {
      stones = d.price * rc.stones.count;
      setting = (S.settingPerStone || 0) * rc.stones.count;
      stoneInfo = { ...d, count: rc.stones.count };
    }
  }
  const engraving = rc.engraving && rc.engraving.trim() ? (S.engravingPrice || 0) : 0;

  return {
    grams: round2(grams), pure: round2(pure), fin: m.fin, metal,
    metal_: metalCost, metalCost, alloy, labor, gramSell, setting, engraving, other: (ring.other || 0) * priceF,
    stones, stoneInfo, quote,
  };
}

/* ---------------- Teljes termék ---------------- */
/**
 * Visszaad: { final (Ft vagy null), quote (bool), reason, calculated, source, breakdown, parts, grams, pure, marginPct, lowMargin, warnings }
 */
export function priceProduct(p, cfgIn, M, S, { applyOverride = true } = {}) {
  const { cfg, warnings } = normalizeConfig(p, cfgIn || defaultConfig(p));
  const empty = (reason) => ({ final: null, quote: true, reason, calculated: null, source: 'ajanlat', breakdown: null, parts: [], grams: 0, pure: 0, marginPct: null, lowMargin: false, warnings, cfg });

  if (p.priceOnRequest && !(applyOverride && p.override?.type === 'fixed')) return empty('Ennél a modellnél egyedi árajánlatot adunk.');

  const parts = p.rings.map((ring, i) => ringCost(ring, cfg.rings[i], cfg.metal, M, S));
  const err = parts.find((x) => x.error);
  if (err) return empty(err.error);

  const sum = (k) => parts.reduce((a, x) => a + (x[k] || 0), 0);
  const hasStones = parts.some((x) => x.stones > 0);
  const extras = (S.boxCost || 0) + (hasStones ? (S.certCost || 0) : 0);
  const metalCost = sum('metalCost'), alloy = sum('alloy'), labor = sum('labor'), gramSell = sum('gramSell'),
        setting = sum('setting'), engraving = sum('engraving'), other = sum('other') + extras, stones = sum('stones');
  const vatF = 1 + (S.vatPct || 0) / 100;
  const mode = S.pricingMode || 'koltseg';

  let net, cost, gross;
  if (mode === 'gramm') {
    const metalNet = gramSell / vatF;                    // a grammár bruttó → nettó
    net = metalNet + stones * (1 + (S.markupStones || 0) / 100) + setting + engraving + other;
    cost = null;                                          // a grammár mögötti önköltség nem ismert
    gross = net * vatF;
  } else {
    const baseNet = metalCost + alloy + labor + setting + engraving + other;
    cost = baseNet + stones;
    net = baseNet * (1 + (S.markupMetal || 0) / 100) + stones * (1 + (S.markupStones || 0) / 100);
    gross = net * vatF;
  }
  const calculated = roundUp(gross, S.roundTo);

  const quoteMsg = parts.find((x) => x.quote)?.quote || null;
  let final = calculated, source = 'keplet';
  if (applyOverride && p.override) {
    if (p.override.type === 'fixed') { final = p.override.value; source = 'rogzitett'; }
    if (p.override.type === 'pct') { final = roundUp(calculated * (1 + p.override.value / 100), S.roundTo); source = 'modositott'; }
  }
  if (quoteMsg && source !== 'rogzitett') return { ...empty(quoteMsg), parts };
  let minHit = false;
  if (p.minPrice && final < p.minPrice) { final = p.minPrice; minHit = true; }

  const finalNet = final / vatF;
  const marginPct = cost === null ? null : (finalNet > 0 ? ((finalNet - cost) / finalNet) * 100 : 0);

  return {
    final, quote: false, reason: null, calculated, source, minHit,
    marginPct, lowMargin: marginPct !== null && marginPct < S.minMarginPct,
    breakdown: { metal: metalCost, alloy, labor, gramSell, setting, engraving, other, stones, cost, net, gross, mode },
    parts, warnings, cfg,
    grams: round2(parts.reduce((a, x) => a + x.grams, 0)),
    pure: round2(parts.reduce((a, x) => a + x.pure, 0)),
  };
}

/** Árösszetétel a végső bruttó árban (arany/fém – gyémánt – munkadíj – egyéb). */
export function composition(r, S) {
  const b = r.breakdown;
  if (!b) return { metal: 0, stones: 0, labor: 0, other: 0 };
  const vatF = 1 + (S.vatPct || 0) / 100;
  if (b.mode === 'gramm') {
    const raw = { stones: b.stones * (1 + S.markupStones / 100) * vatF, labor: b.setting * vatF, other: (b.engraving + b.other) * vatF };
    raw.metal = Math.max(0, r.final - raw.stones - raw.labor - raw.other);   // grammár: fém + munka + árrés együtt
    return raw;
  }
  const k1 = (1 + S.markupMetal / 100) * vatF;
  const raw = { stones: b.stones * (1 + S.markupStones / 100) * vatF, labor: (b.labor + b.setting) * k1, other: (b.engraving + b.other) * k1 };
  raw.metal = Math.max(0, r.final - raw.stones - raw.labor - raw.other);
  return raw;
}

/** Pároknál a végső ár megosztása a két gyűrű között (tájékoztató, kerekítve). */
export function ringSplit(p, cfg, r, S) {
  if (!r.final) return p.rings.map(() => null);
  const k1 = 1 + (S.markupMetal || 0) / 100, k2 = 1 + (S.markupStones || 0) / 100;
  const raw = r.parts.map((x) => (x.metalCost + x.alloy + x.labor + x.setting + x.engraving + x.other) * k1 + x.gramSell + x.stones * k2);
  const tot = raw.reduce((a, x) => a + x, 0) || 1;
  const step = Math.max(S.roundTo || 1, 500);
  const out = raw.map((x) => Math.round((r.final * x) / tot / step) * step);
  out[out.length - 1] = r.final - out.slice(0, -1).reduce((a, x) => a + x, 0);
  return out;
}

/* ---------------- Megosztható link ---------------- */
export function encodeCfg(cfg) {
  const o = { m: cfg.metal, c: cfg.color, r: cfg.rings.map((x) => [x.size, x.width, x.stones ? x.stones.count : -1, x.stones ? x.stones.cat : '', x.engraving || '', x.font || 0, x.sizeUnknown ? 1 : 0]) };
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeCfg(str, p) {
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/')))));
    const cfg = defaultConfig(p);
    if (o.m) cfg.metal = o.m;
    if (o.c) cfg.color = o.c;
    (o.r || []).forEach((x, i) => {
      const r = cfg.rings[i]; if (!r) return;
      r.size = Number(x[0]) || r.size; r.width = Number(x[1]) || r.width;
      r.stones = x[2] === -1 ? null : (p.rings[i].stoneRule ? { count: Number(x[2]), cat: String(x[3]) } : null);
      r.engraving = String(x[4] || '').slice(0, 24); r.font = x[5] ? 1 : 0;
      if (x[6]) { r.sizeUnknown = true; r.size = p.rings[i].refSize; }
    });
    return normalizeConfig(p, cfg).cfg;
  } catch { return null; }
}

/* ---------------- Tömeges számítások ---------------- */
/** Alapár (alapkonfiguráció) termékenként; ár nélküli termék kimarad. */
export function priceAll(products, M, S) {
  const out = {};
  for (const p of products) { const r = priceProduct(p, null, M, S); if (r.final !== null) out[p.id] = r.final; }
  return out;
}

/** Mely termékeket érinti egy alapanyagár- vagy beállítás-változás. */
export function diffPrices(products, M0, M1, S0, S1 = S0) {
  const a = priceAll(products, M0, S0), b = priceAll(products, M1, S1);
  const rows = products.filter((p) => a[p.id] !== undefined && b[p.id] !== undefined).map((p) => ({ id: p.id, code: p.code, name: p.name, img: p.img, color: p.baseColor,
    old: a[p.id], now: b[p.id], delta: b[p.id] - a[p.id], pct: a[p.id] ? ((b[p.id] - a[p.id]) / a[p.id]) * 100 : 0 }))
    .filter((r) => r.delta !== 0);
  const total = rows.reduce((s, r) => s + r.delta, 0);
  const avgPct = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
  // ár nélkül maradó termékek (pl. törölt kőár) – ezekre figyelmeztetni kell, nem csendben kihagyni
  const lost = products.filter((p) => a[p.id] !== undefined && b[p.id] === undefined).map((p) => ({ id: p.id, code: p.code, name: p.name }));
  return { rows, count: rows.length, total, avgPct, lost };
}

/**
 * Demó-tömegek visszaszámolása: a 14K tömeget úgy állítjuk be, hogy költségalapú módban,
 * a kezdő demóárakkal a kalkulált ár a mostani weboldali ár közelében legyen.
 */
export function seedWeights(products, M, S) {
  const Sk = { ...S, pricingMode: 'koltseg', sizeMethod: 'tomeg', roundTo: 1 };
  for (const p of products) {
    if (p.fixedWeight || !p.listaAr) continue;
    const cfg = defaultConfig(p);
    const set = (W) => p.rings.forEach((r) => { r.weight = W * r.share; });
    const gross = (W) => { set(W); return priceProduct({ ...p, priceOnRequest: false }, cfg, M, Sk, { applyOverride: false }).breakdown?.gross ?? 0; };
    const lo = p.kind === 'p' ? 3.2 : 2, hi = p.kind === 'p' ? 30 : 10;
    const priced = [...M.diamonds].filter((d) => ok(d.price)).sort((a, b) => a.ct - b.ct);
    let W = lo;
    for (let guard = 0; guard < 12; guard++) {
      const c = defaultConfig(p);
      const g0 = (cfg.rings = c.rings, gross(0.0001)), g1 = gross(10);
      W = ((p.listaAr - g0) / (g1 - g0)) * 10;
      const ring = p.rings.find((r) => r.stoneRule);
      if (W >= lo || !ring) break;
      // a demó-kőbeállítás túl drága a mostani árhoz: kisebb kőméret, végső esetben kevesebb kő
      const rule = ring.stoneRule;
      const i = priced.findIndex((d) => d.id === rule.defCat);
      if (i > 0) { rule.defCat = priced[i - 1].id; if (!rule.cats.includes(rule.defCat)) rule.cats.unshift(rule.defCat); }
      else if (rule.def > 1) { rule.def -= 1; if (rule.mode !== 'free') { rule.min = Math.min(rule.min, rule.def); rule.max = Math.max(rule.def, rule.mode === 'perSize' ? rule.max : rule.def); } }
      else break;
    }
    W = Math.max(lo, Math.min(W, hi));
    p.rings.forEach((r) => { r.weight = round1(W * r.share); });
  }
  return products;
}

/* ---------------- Magyar formázás ---------------- */
const nf = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
export const ft = (n) => (n === null || n === undefined ? 'Egyedi ajánlat' : nf.format(Math.round(n)).replace(/ |\s/g, ' ') + ' Ft');
export const num = (n) => nf.format(Math.round(n)).replace(/ |\s/g, ' ');
export const dec = (n) => nf2.format(n);
export const pct = (n, sign = true) => (sign && n > 0 ? '+' : '') + nf2.format(Math.round(n * 10) / 10) + '%';
