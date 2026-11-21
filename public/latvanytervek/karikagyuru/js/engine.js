/* ==========================================================================
   Központi árkalkulációs motor – V2.1 (tiszta függvények, nincs mellékhatás).

   KÉT ÁRAZÁSI MÓD (admin: Felárak és munkadíjak → Árképzési mód):
   A) „gramm” – AZ ÖTVÖS SAJÁT MÓDSZERE (alapértelmezett), az ügyfél jegyzete szerint:
        kész tömeg (g) × késztermék-grammár (Ft/g, bruttó: fém + munka + árrés + ÁFA benne)
        + gyémántok darabára × darabszám + külön díjak (kőfoglalás, gravír, doboz) – mind bruttó
        Példa: 14K, 4,8 g × 47 000 = 225 600 Ft · platina 6,9 g × 55 000 = 379 500 Ft.
      Munkadíj, fém-felár és ÁFA itt NEM adódik hozzá még egyszer.
   B) „koltseg” – költségalapú összehasonlítás:
        ( alapanyag-referenciaár × tömeg × (1+veszteség) + munkadíj + díjak ) × (1+felár)
        + gyémánt × (1+kőfelár) → + ÁFA → kerekítés
   Az alapanyag-referenciaár (24K → 14K = ×0,585, 18K = ×0,75; platina; palládium) KÜLÖN mező a
   grammártól; grammáras módban csak tájékoztató (anyagköltség a részletes kalkulációban).

   MÉRET (admin: Méret hatása az árra):
   - „tomeg”: tömeg = referenciatömeg × méret / referenciaméret (pl. 60-as = 54-es × 60/54).
   - „ar”: egyszerű árarányosítás. Grammáras módban a kettő ugyanazt adja.

   TÖMEG ANYAGONKÉNT: ring.weights[anyag] (ha meg van adva), különben 14K tömeg × S.density[anyag]
   (a tömegarányok az ügyfél példatömegeiből: 4,8 / 5,4 / 6,9 / 4,0 / 1,5 g).

   SZÍN: azonos karátnál az arany színe NEM módosítja az árat.
   GYÉMÁNT: csak természetes; gyűrűnként szabály (stoneRule) + fizikai ellenőrzés
   (a kő átmérője elfér-e a szélességen, körbe foglalásnál a kerületen).
   Ha nincs megbízható ár, final = null („Egyedi árajánlat szükséges”) – soha nincs megtévesztő ár.
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

/** Alapanyag-referenciaár Ft/g ötvözetre: arany = 24K × finomság, egyébként a saját mezője. */
export function refPrice(metal, M) {
  const m = METALS[metal];
  if (!m) return null;
  const base = M[m.ref];
  if (!ok(base) || base <= 0) return null;
  return m.gold ? base * m.fin : base;
}

/** Fizikailag elfér-e a kő: átmérő ≤ gyűrűszélesség − perem. Ismeretlen méretű kő: nem tiltjuk. */
export function stoneFits(d, width, S = {}) {
  if (!d || !ok(d.mm) || !ok(width)) return true;
  return d.mm <= width - (S.stoneEdgeMm ?? 1.0) + 1e-9;
}
/** Körbe foglalásnál legfeljebb ennyi kő fér a kerületre (a méret = belső kerület mm-ben). */
export function maxAround(d, size, S = {}) {
  if (!d || !ok(d.mm)) return Infinity;
  return Math.floor(size / (d.mm + (S.stoneGapMm ?? 0.1)));
}
/** A modell szabálya ÉS a fizikai korlát szerint választható kőméretek. */
export function allowedCats(rule, width, M, S) {
  if (!rule) return [];
  return rule.cats.filter((c) => { const d = diamond(M || {}, c); return !M || (d && stoneFits(d, width, S)); });
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
export function normalizeConfig(p, cfg, M = null, S = {}) {
  const warnings = [];
  const out = JSON.parse(JSON.stringify(cfg));
  const metals = p.metals || ['au14'];
  if (!metals.includes(out.metal)) { warnings.push('Ez az anyag ennél a modellnél nem választható.'); out.metal = metals[0]; }
  if (!isGold(out.metal)) out.color = null;
  else if (!p.colors.includes(out.color)) out.color = p.baseColor;
  p.rings.forEach((ring, i) => {
    const rc = out.rings[i];
    if (!rc) return;
    const [smin, smax] = sizeRange(ring);
    if (!(rc.size >= 40 && rc.size <= 80)) rc.size = ring.refSize;
    else if (rc.size < smin || rc.size > smax) { warnings.push(`Ennél a modellnél ${smin}–${smax} közötti méret választható – ettől eltérőt személyes egyeztetéssel kérhetsz.`); rc.size = Math.min(smax, Math.max(smin, rc.size)); }
    // SZÉLESSÉG: alapból nem választható. Modellenként engedélyezhető, de csak az ötvös által jóváhagyott határokkal (p.opts.width).
    const wv = optionValues(p, 'width');
    if (!wv) { if (rc.width !== ring.refWidth) { if (rc.width != null) warnings.push('A szélesség ennél a modellnél online nem választható – más szélességet személyes egyeztetéssel kérhetsz.'); rc.width = ring.refWidth; } }
    else if (!wv.includes(rc.width)) { if (rc.width != null && rc.width !== ring.refWidth) warnings.push(`Ennél a modellnél ${fmtMm(wv[0])}–${fmtMm(wv[wv.length - 1])} mm közötti szélesség választható.`); rc.width = wv.includes(ring.refWidth) ? ring.refWidth : wv.reduce((a, b) => (Math.abs(b - ring.refWidth) < Math.abs(a - ring.refWidth) ? b : a)); }
    // VASTAGSÁG: csak ha a modellnél engedélyezett és jóváhagyott; különben a modell saját vastagsága (ha ismert).
    const tv = optionValues(p, 'thickness');
    const t0 = ring.thickness ?? null;
    if (!tv || t0 == null) rc.thick = t0;
    else if (!tv.includes(rc.thick)) rc.thick = tv.includes(t0) ? t0 : tv[0];
    const rule = ring.stoneRule;
    if (!rule) { rc.stones = null; return; }
    if (rc.stones === null || rc.stones === false) {
      if (!rule.allowNone) { rc.stones = { count: stoneCount(rule, rc.size, ring.refSize), cat: rule.defCat }; warnings.push('Ennél a gyűrűnél a kövek nem hagyhatók el.'); }
      else rc.stones = null;
      return;
    }
    const st = rc.stones;
    if (!rule.cats.includes(st.cat)) { st.cat = rule.defCat; warnings.push('Ez a kőméret ennél a modellnél nem választható.'); }
    if (M) {
      const ok2 = allowedCats(rule, rc.width, M, S);
      if (!ok2.includes(st.cat)) {
        if (ok2.length) { st.cat = ok2.includes(rule.defCat) ? rule.defCat : ok2[ok2.length - 1]; warnings.push(`Ennél a szélességnél (${String(rc.width).replace('.', ',')} mm) ez a kő nem fér el – a legnagyobb beférő kőméretre állítottuk.`); }
        else if (rule.allowNone) { rc.stones = null; warnings.push('Ennél a szélességnél egyik kőméret sem fér el – kő nélkül számolunk.'); return; }
      }
    }
    if (rule.mode === 'free') {
      const lo = Math.max(1, rule.min || 0);
      if (!(st.count >= lo && st.count <= rule.max)) { st.count = clamp(Math.round(st.count || rule.def), lo, rule.max); warnings.push(`A kövek száma ${lo} és ${rule.max} között lehet.`); }
    } else {
      st.count = stoneCount(rule, rc.size, ring.refSize);
      if (M && rule.mode === 'perSize') {
        const cap = maxAround(diamond(M, st.cat), rc.size || ring.refSize, S);
        if (st.count > cap) { st.count = cap; warnings.push(`Ebben a méretben legfeljebb ${cap} kő fér körbe.`); }
      }
    }
  });
  return { cfg: out, warnings };
}

/** Alapértelmezett konfiguráció: 14K arany (ha a modell engedi), a fotó színe, referenciaméret, alap kövek. */
const fmtMm = (v) => String(v).replace('.', ',');
/** Választható gyűrűméretek határa gyűrűnként (admin: sizeMin / sizeMax; alap: női 44–64, férfi 54–76). */
export function sizeRange(ring) {
  const d = ring.refSize < 60 ? [44, 64] : [54, 76];
  const lo = Number.isFinite(ring.sizeMin) ? ring.sizeMin : d[0], hi = Number.isFinite(ring.sizeMax) ? ring.sizeMax : d[1];
  return lo <= hi ? [lo, hi] : d;
}
/**
 * Modellenkénti, adminból állítható választási lehetőség (szélesség / vastagság).
 * p.opts.width = { enabled, min, max, step, approved } · p.opts.thickness = { enabled, values: [mm…], approved }
 * Csak akkor aktív, ha ENGEDÉLYEZETT ÉS az ötvös JÓVÁHAGYTA a határokat – különben marad a rögzített érték.
 * Visszaad: a választható értékek tömbje, vagy null (nem választható).
 */
export function optionValues(p, key) {
  const o = p.opts && p.opts[key];
  if (!o || !o.enabled || !o.approved) return null;
  if (key === 'thickness') { const v = (o.values || []).filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b); return v.length > 1 ? v : null; }
  const { min, max, step } = o;
  if (![min, max, step].every(Number.isFinite) || step <= 0 || min <= 0 || min >= max) return null;
  const out = []; for (let v = min; v <= max + 1e-9 && out.length < 40; v += step) out.push(Math.round(v * 100) / 100);
  return out.length > 1 ? out : null;
}
/** Miért nem választható (a vásárlónak kiírható ok), vagy null, ha választható. */
export function optionReason(p, key) {
  const o = p.opts && p.opts[key];
  if (optionValues(p, key)) return null;
  if (!o || !o.enabled) return 'ennél a modellnél nem állítható';
  if (!o.approved) return 'a határokat az ötvös még nem hagyta jóvá';
  return 'a megadott határok hiányosak';
}

export function defaultConfig(p) {
  const metals = p.metals || ['au14'];
  return {
    metal: metals.includes('au14') ? 'au14' : metals[0],
    color: p.baseColor,
    rings: p.rings.map((r) => ({
      size: r.refSize,
      width: r.refWidth,
      thick: r.thickness ?? null,
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
  return d[metal] ?? { au14: 1, au18: 1.125, pt: 1.4375, pd: 0.833333, ti: 0.3125 }[metal] ?? 1;
}
/** Referenciaméretű, referenciaszélességű tömeg az adott anyagból (g). */
export function refWeight(ring, metal, S) {
  const w = ring.weights && ring.weights[metal];
  if (ok(w) && w > 0) return w;
  if (!ok(ring.weight) || ring.weight <= 0) return null;
  return ring.weight * density(metal, S);
}

/** Egy gyűrű elemei nettóban (felár és ÁFA nélkül). Hiba esetén { error }. */
export function ringCost(ring, rc, metal, M, S) {
  const m = METALS[metal];
  if (!m) return { error: 'Ismeretlen anyag.' };
  // TITÁN: az ár a munkából adódik, nem a tömegből – soha nem számolunk hozzá grammáras vagy anyagalapú árat.
  if (metal === 'ti') return { error: 'A titángyűrű ára a munkából adódik, nem a tömegéből – egyedi árajánlat szükséges.' };
  const w0 = refWeight(ring, metal, S);
  if (!w0) return { error: 'Hiányzó tömegadat.' };
  const sizeF = (rc.size || ring.refSize) / ring.refSize;
  const widthF = (rc.width || ring.refWidth) / (ring.refWidth || 1);
  // vastagság: csak akkor hat a tömegre, ha a modellnél választható és ismert a saját vastagsága (arányos becslés, demó szabály)
  const thickF = rc.thick && ring.thickness ? rc.thick / ring.thickness : 1;
  const grams = w0 * sizeF * widthF * thickF;
  const gramsRef = w0 * widthF * thickF;                                       // referenciaméretben
  const pure = grams * m.fin;
  const lossF = 1 + (S.lossPct || 0) / 100;
  const laborF = (S.laborFactor && S.laborFactor[metal]) || 1;
  const sizeMethod = S.sizeMethod || 'tomeg';
  const priceGrams = sizeMethod === 'ar' ? gramsRef : grams;
  const priceF = sizeMethod === 'ar' ? sizeF : 1;                    // árarányosítás: a teljes kő nélküli rész

  let metalCost = 0, alloy = 0, labor = 0, gramSell = 0, sellPerGram = null;
  const rp = refPrice(metal, M);
  const materialCost = rp ? grams * rp : null;                        // tájékoztató anyagköltség (veszteség nélkül)
  if ((S.pricingMode || 'gramm') === 'gramm') {
    const g = M.sellPerGram && M.sellPerGram[metal];
    if (!ok(g) || g <= 0) return { error: metal === 'ti' ? 'A titángyűrű ára a munkából adódik, nem a tömegéből – egyedi árajánlat szükséges.' : `Nincs megadva grammár: ${m.label}.` };
    sellPerGram = g;
    gramSell = priceGrams * g * priceF;                              // bruttó, munkadíjjal és árréssel
  } else {
    if (!rp) return { error: `Nincs alapanyag-referenciaár: ${m.label}.` };
    metalCost = priceGrams * rp * lossF * priceF;                     // arany: 24K × finomság (az ötvözet benne)
    labor = (ring.labor || 0) * laborF * priceF;
  }

  let stones = 0, setting = 0, stoneInfo = null, quote = null;
  if (ring.stoneRule && rc.stones) {
    const rule = ring.stoneRule;
    if (rule.mode === 'quote') quote = 'Ennél a kőbeállításnál egyedi árajánlat szükséges.';
    const d = diamond(M, rc.stones.cat);
    if (!d || !ok(d.price)) quote = `Ehhez a kőmérethez${d ? ` (${String(d.ct).replace('.', ',')} ct)` : ''} nincs megerősített ár – egyedi árajánlat szükséges.`;
    else if (!stoneFits(d, rc.width || ring.refWidth, S)) quote = 'Ez a kő ennél a szélességnél nem fér el – egyedi árajánlat szükséges.';
    else {
      stones = d.price * rc.stones.count;
      setting = (S.settingPerStone || 0) * rc.stones.count;
      stoneInfo = { ...d, count: rc.stones.count };
    }
  }
  const engraving = rc.engraving && rc.engraving.trim() ? (S.engravingPrice || 0) : 0;

  return {
    grams: round2(grams), gramsExact: grams, refGrams: w0, sizeF, widthF, pure: round2(pure), fin: m.fin, metal,
    sellPerGram, refPrice: rp, materialCost,
    metal_: metalCost, metalCost, alloy, labor, gramSell, setting, engraving, other: (ring.other || 0) * priceF,
    stones, stoneInfo, quote,
  };
}

/* ---------------- Teljes termék ---------------- */
/**
 * Visszaad: { final (Ft vagy null), quote (bool), reason, raw (nyers, kerekítés előtti bruttó), calculated (kerekített), rounding, source, breakdown, parts, grams, pure, marginPct, lowMargin, warnings }
 */
export function priceProduct(p, cfgIn, M, S, { applyOverride = true } = {}) {
  const { cfg, warnings } = normalizeConfig(p, cfgIn || defaultConfig(p), M, S);
  const empty = (reason) => ({ final: null, quote: true, reason, raw: null, rounding: 0, calculated: null, source: 'ajanlat', breakdown: null, parts: [], grams: 0, pure: 0, marginPct: null, lowMargin: false, warnings, cfg });

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
  const mode = S.pricingMode || 'gramm';
  const materialCost = parts.every((x) => x.materialCost !== null) ? sum('materialCost') : null;

  let net, cost, gross, stonesGross = 0;
  if (mode === 'gramm') {
    // Minden tétel végső (bruttó) ár: grammár × tömeg + kövek + díjak. Nincs újabb felár vagy ÁFA.
    stonesGross = S.stonesGross === false ? stones * (1 + (S.markupStones || 0) / 100) * vatF : stones;
    gross = gramSell + stonesGross + setting + engraving + other;
    net = gross / vatF;
    cost = null;                                          // a munkadíj a grammárban van, külön nem ismert
  } else {
    const baseNet = metalCost + alloy + labor + setting + engraving + other;
    cost = baseNet + stones;
    net = baseNet * (1 + (S.markupMetal || 0) / 100) + stones * (1 + (S.markupStones || 0) / 100);
    gross = net * vatF;
  }
  const raw = Math.round(gross);                       // nyers számított ár (egész forintra)
  const calculated = roundUp(raw, S.roundTo);            // kerekített (megjelenő) ár – a kijelzett nyers árból, hogy a kettő mindig egyezzen

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
    final, quote: false, reason: null, raw, calculated, rounding: calculated - raw, source, minHit,
    marginPct, lowMargin: marginPct !== null && marginPct < S.minMarginPct,
    breakdown: { metal: metalCost, alloy, labor, gramSell, setting, engraving, other, stones, stonesGross, cost, net, gross, mode, materialCost },
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
    const raw = { stones: b.stonesGross, labor: b.setting, other: b.engraving + b.other };
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
  const gm = r.breakdown?.mode === 'gramm', sg = S.stonesGross === false ? k2 : 1;
  const raw = r.parts.map((x) => gm ? x.gramSell + x.stones * sg + x.setting + x.engraving + x.other
    : (x.metalCost + x.alloy + x.labor + x.setting + x.engraving + x.other) * k1 + x.stones * k2);
  const tot = raw.reduce((a, x) => a + x, 0) || 1;
  const step = Math.max(S.roundTo || 1, 500);
  const out = raw.map((x) => Math.round((r.final * x) / tot / step) * step);
  out[out.length - 1] = r.final - out.slice(0, -1).reduce((a, x) => a + x, 0);
  return out;
}

/* ---------------- Megosztható link ---------------- */
export function encodeCfg(cfg) {
  const o = { m: cfg.metal, c: cfg.color, r: cfg.rings.map((x) => [x.size, x.width, x.stones ? x.stones.count : -1, x.stones ? x.stones.cat : '', x.engraving || '', x.font || 0, x.sizeUnknown ? 1 : 0, x.thick ?? 0]) };
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
      if (Number(x[7]) > 0) r.thick = Number(x[7]);
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
 * BECSÜLT tömegek: a modell valós tömege nem ismert, ezért a 14K tömeget a mostani weboldali
 * árból számoljuk vissza a beállított módszerrel (grammáras módban: (ár − kövek) / 47 000 Ft/g).
 * Ez becslés, nem jóváhagyott adat – a termék „approved: false”, amíg az ötvös meg nem adja.
 */
export function seedWeights(products, M, S) {
  const Sk = { ...S, sizeMethod: 'tomeg', roundTo: 1 };
  const pricedAll = [...M.diamonds].filter((d) => ok(d.price)).sort((a, b) => a.ct - b.ct);
  for (const p of products) {
    // ár nélküli alap kőméret (pl. 0,05 ct) helyett a legnagyobb megerősített árú kisebb kő az alapértelmezett
    for (const r of p.rings) {
      const rule = r.stoneRule; if (!rule) continue;
      const d = diamond(M, rule.defCat);
      if (!d || !ok(d.price)) { const alt = [...pricedAll].reverse().find((x) => !d || x.ct < d.ct) || pricedAll[0]; rule.defCat = alt.id; if (!rule.cats.includes(alt.id)) rule.cats.unshift(alt.id); }
      const fit = allowedCats(rule, r.refWidth, M, S);
      if (fit.length && !fit.includes(rule.defCat)) rule.defCat = fit.filter((c) => ok(diamond(M, c).price)).pop() || fit[0];
    }
    if (p.fixedWeight || !p.listaAr) continue;
    const cfg = defaultConfig(p);
    const set = (W) => p.rings.forEach((r) => { r.weight = W * r.share; });
    const gross = (W) => { set(W); return priceProduct({ ...p, priceOnRequest: false }, cfg, M, Sk, { applyOverride: false }).breakdown?.gross ?? 0; };
    const lo = p.kind === 'p' ? 3.2 : 2, hi = p.kind === 'p' ? 30 : 10;
    const priced = pricedAll;
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
    // 3 tizedesre lefelé: így a kerekített ár pontosan a weboldali ár marad (nem csúszik 100 Ft-tal fölé)
    p.rings.forEach((r) => { r.weight = Math.floor(W * r.share * 1000 + 1e-6) / 1000; });
  }
  return products;
}

/* ---------------- Magyar formázás ---------------- */
const nf = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
export const ft = (n) => (n === null || n === undefined ? 'Egyedi ajánlat' : nf.format(Math.round(n)).replace(/ |\s/g, ' ') + ' Ft');
export const num = (n) => nf.format(Math.round(n)).replace(/ |\s/g, ' ');
export const dec = (n) => nf2.format(n);
/** Karát pontosan, kerekítés nélkül (0,005 · 0,015 ct) – a kőméret nem kerekíthető. */
export const ctFmt = (ct) => String(ct).replace('.', ',');
export const pct = (n, sign = true) => (sign && n > 0 ? '+' : '') + nf2.format(Math.round(n * 10) / 10) + '%';

/**
 * Az ötvös számítási példáihoz: egyetlen gyűrű megadott anyaggal és tömeggel (54-es méretben).
 * Pl. exampleRing({ metal: 'pt', weight: 6.9, size: 60 }) → 6,9 × 60/54 × 55 000.
 */
export function exampleRing({ metal = 'au14', weight, size = 54, refSize = 54, width = 4, stones = null }, M, S) {
  const p = {
    id: 'pelda', code: 'Példa', name: 'Számítási példa', kind: 's', metals: [metal], colors: ['sarga'], baseColor: 'sarga', widths: [width],
    rings: [{ label: 'Gyűrű', refSize, refWidth: width, weights: { [metal]: weight }, weight: 1, labor: 0, other: 0,
      stoneRule: stones ? { mode: 'free', min: 1, max: 99, def: stones.count, cats: [stones.cat], defCat: stones.cat, allowNone: true } : null }],
  };
  const cfg = defaultConfig(p);
  cfg.metal = metal; cfg.color = isGold(metal) ? 'sarga' : null; cfg.rings[0].size = size;
  if (stones) cfg.rings[0].stones = { ...stones };
  return priceProduct(p, cfg, M, S);
}

/** Magyar toldalék a gyűrűmérethez: 54-es, 55-ös, 56-os, 58-as, 60-as, 63-as, 70-es… */
export function sizeSfx(n) {
  const k = Math.round(n), last = k % 10, tens = Math.floor(k / 10) % 10;
  if (last === 0) return k + ([6, 8, 3].includes(tens) ? '-as' : tens === 1 || tens === 4 || tens === 5 || tens === 7 || tens === 9 || tens === 2 ? '-es' : '-as');
  return k + ({ 3: '-as', 5: '-ös', 6: '-os', 8: '-as' }[last] || '-es');
}

/**
 * ELŐZETES ÉLESÍTÉSI ELLENŐRZÉS (a látványtervben csak tájékoztató – valódi élesítéshez szerveroldali
 * ellenőrzés és hitelesített admin kell). Két dolgot néz, egymástól függetlenül:
 *   1) jóváhagyás: minden árat befolyásoló adat forrása „jovahagyott”-e (kind: 'jovahagyas');
 *   2) érvényesség: a szükséges árak, tömegek, kőadatok és paraméterek valódi, értelmes számok-e (kind: 'ervenytelen').
 * Hiányzó vagy hibás érték jóváhagyott jelöléssel is blokkol.
 * TITÁN: nincs grammára (az ötvös munkadíj alapján ad egyedi ajánlatot) – jóváhagyott grammárat nem követelünk,
 * hanem azt ellenőrizzük, hogy NINCS megadva hozzá grammár.
 * Visszaad: { ready, blockers: [{ group, key, label, kind, src? }], byGroup, invalid, unapproved }.
 */
export function readiness(state) {
  const M = state.materials || {}, S = state.settings || {}, ms = M.src || {}, ss = S.src || {};
  const vis = (state.products || []).filter((p) => p.visible !== false);
  const blockers = [];
  const num = (v) => typeof v === 'number' && Number.isFinite(v);
  const bad = (group, key, label) => blockers.push({ group, key, label, kind: 'ervenytelen' });
  const need = (group, key, label, src) => { if (src !== 'jovahagyott') blockers.push({ group, key, label, kind: 'jovahagyas', src: src || 'demo' }); };
  const gm = (S.pricingMode || 'gramm') === 'gramm';
  const metals = METAL_ORDER.filter((m) => vis.some((p) => (p.metals || []).includes(m)));

  // --- Árak ---
  if (!['gramm', 'koltseg'].includes(S.pricingMode)) bad('szabalyok', 'pricingMode', 'Árképzési mód: ismeretlen érték');
  if (!['tomeg', 'ar'].includes(S.sizeMethod)) bad('szabalyok', 'sizeMethod', 'Méret hatása: ismeretlen érték');
  for (const m of metals) {
    if (m === 'ti') {                                         // titán: egyedi ajánlat, grammár nélkül
      const g = M.sellPerGram && M.sellPerGram.ti;
      if (g !== null && g !== undefined) bad('arak', 'sellPerGram.ti', 'Titán: grammár van megadva, pedig a titán ára egyedi ajánlat (munkadíj alapján)');
      continue;
    }
    if (gm) {
      const g = M.sellPerGram && M.sellPerGram[m];
      if (!num(g) || g <= 0) bad('arak', `sellPerGram.${m}`, `${METALS[m].short} – késztermék-grammár hiányzik vagy hibás`);
      need('arak', `sellPerGram.${m}`, `${METALS[m].short} – késztermék-grammár`, ms[`sellPerGram.${m}`]);
    } else {
      const k = METALS[m].ref;
      if (blockers.some((b) => b.key === k)) continue;
      if (!num(M[k]) || M[k] <= 0) bad('arak', k, `Alapanyagár (${k}) hiányzik vagy hibás`);
      need('arak', k, `Alapanyagár – ${k}`, ms[k]);
    }
    const dn = S.density && S.density[m];
    if (!num(dn) || dn <= 0) bad('szabalyok', `density.${m}`, `${METALS[m].short} – tömegarány hiányzik vagy hibás`);
  }

  // --- Gyémántok (csak amit látható modell felkínál) ---
  const cats = new Set(vis.flatMap((p) => (p.rings || []).flatMap((r) => (r.stoneRule ? r.stoneRule.cats || [] : []))));
  for (const id of cats) {
    const d = (M.diamonds || []).find((x) => x.id === id);
    if (!d) { bad('gyemant', id, `Ismeretlen kőméret: ${id}`); continue; }
    if (!num(d.price) || d.price <= 0) bad('gyemant', id, `${d.name} – nincs érvényes darabár (vagy ne legyen választható)`);
    if (!num(d.mm) || d.mm <= 0 || !num(d.ct) || d.ct <= 0) bad('gyemant', id, `${d.name} – hiányzó átmérő vagy karát`);
    need('gyemant', id, `${d.name} – darabár`, d.src);
  }

  // --- Számítási paraméterek ---
  const P = [['roundTo', 'Kerekítés', (v) => num(v) && v >= 1], ['vatPct', 'ÁFA-beállítás', (v) => num(v) && v >= 0 && v <= 100],
    ['engravingPrice', 'Gravírozás díja', (v) => num(v) && v >= 0], ['settingPerStone', 'Kőfoglalás díja', (v) => num(v) && v >= 0],
    ['boxCost', 'Díszdoboz', (v) => num(v) && v >= 0], ['certCost', 'Kőtanúsítvány', (v) => num(v) && v >= 0],
    ['stonesGross', 'A kő darabára végső ár', (v) => typeof v === 'boolean'], ['stoneEdgeMm', 'Kő és gyűrűszél közti perem', (v) => num(v) && v >= 0], ['stoneGapMm', 'Kövek közti hézag', (v) => num(v) && v >= 0]];
  for (const [k, label, okf] of P) { if (!okf(S[k])) bad('szabalyok', k, `${label} – hiányzó vagy hibás érték`); need('szabalyok', k, label, ss[k]); }
  need('szabalyok', 'pricingMode', 'Árképzési mód', ss.pricingMode);
  need('szabalyok', 'sizeMethod', 'Méret hatása az árra', ss.sizeMethod);
  need('szabalyok', 'density', 'Tömegarányok anyagonként', ss.density);

  // --- Gyűrűk: tömeg, méret, kőszabály ---
  for (const p of vis) {
    const errs = [];
    if (!(p.metals || []).length) errs.push('nincs választható anyag');
    (p.rings || []).forEach((r) => {
      if (!num(r.refSize) || r.refSize < 40 || r.refSize > 80) errs.push(`${r.label}: hibás referenciaméret`);
      if (!num(r.refWidth) || r.refWidth <= 0) errs.push(`${r.label}: hibás szélesség`);
      if (!p.priceOnRequest && p.override?.type !== 'fixed' && (!num(r.weight) || r.weight <= 0)) errs.push(`${r.label}: hiányzó tömeg`);
      const rule = r.stoneRule;
      if (rule) {
        if (!['free', 'fixed', 'perSize', 'quote'].includes(rule.mode)) errs.push(`${r.label}: ismeretlen kőszabály`);
        if (!(rule.cats || []).length || !rule.cats.includes(rule.defCat)) errs.push(`${r.label}: hibás kőméret-lista`);
        if (!num(rule.def) || rule.def < (rule.mode === 'free' ? 0 : 1)) errs.push(`${r.label}: hibás kőszám`);
        if (rule.mode !== 'fixed' && rule.mode !== 'quote' && (!num(rule.min) || !num(rule.max) || rule.min > rule.max || (rule.mode === 'free' && (rule.def < rule.min || rule.def > rule.max)))) errs.push(`${r.label}: hibás kőszám-határok`);
      }
    });
    const ow = p.opts && p.opts.width, ot = p.opts && p.opts.thickness;
    if (ow && ow.enabled) {
      if (![ow.min, ow.max, ow.step].every(num) || ow.step <= 0 || ow.min <= 0 || ow.min >= ow.max) errs.push('szélességválasztás: hibás határok');
      else if (!(p.rings || []).every((r) => r.refWidth >= ow.min - 1e-9 && r.refWidth <= ow.max + 1e-9)) errs.push('szélességválasztás: a modell saját szélessége kívül esik a határokon');
      if (!ow.approved) blockers.push({ group: 'gyuruk', key: p.id, label: `${p.code} – szélességhatárok`, kind: 'jovahagyas', src: 'demo' });
    }
    if (ot && ot.enabled) {
      if (!(ot.values || []).length || !ot.values.every((v) => num(v) && v > 0) || !(p.rings || []).every((r) => num(r.thickness) && r.thickness > 0)) errs.push('vastagságválasztás: hiányzó vagy hibás értékek');
      if (!ot.approved) blockers.push({ group: 'gyuruk', key: p.id, label: `${p.code} – vastagságértékek`, kind: 'jovahagyas', src: 'demo' });
    }
    if (p.override && (!num(p.override.value) || (p.override.type === 'fixed' && p.override.value <= 0))) errs.push('hibás egyedi ár');
    if (errs.length) bad('gyuruk', p.id, `${p.code} – ${errs.join('; ')}`);
    if (!p.approved) blockers.push({ group: 'gyuruk', key: p.id, label: `${p.code} – tömeg- és kőadatok`, kind: 'jovahagyas', src: 'demo' });
  }

  const byGroup = {}; blockers.forEach((b) => (byGroup[b.group] = (byGroup[b.group] || 0) + 1));
  const invalid = blockers.filter((b) => b.kind === 'ervenytelen').length;
  return { ready: blockers.length === 0, blockers, byGroup, invalid, unapproved: blockers.length - invalid };
}

/* ==========================================================================
   Megjeleníthető-e a számolt ár? (V5.3)
   A számolt ár csak akkor „ár”, ha az ötvös jóváhagyta a gyűrű adatait ÉS
   minden árelemet, amit ez a beállítás felhasznál. Különben a vásárló a
   jelenlegi weboldalon közzétett listaárat látja (csak az alapváltozatra),
   vagy egyedi ajánlatot kér.
   ========================================================================== */
export function priceTrust(p, cfg, M, S) {
  const ms = (M && M.src) || {}, ss = (S && S.src) || {};
  const ok = (v) => v === 'jovahagyott';
  const reasons = [];
  const need = (key, msg) => { if (!ok(ss[key])) reasons.push(msg); };
  if (!p.approved) reasons.push('A gyűrű adatait az ötvös még nem hagyta jóvá.');
  // Rögzített ár: a tulajdonos maga adta meg a gyűrűnél – a gyűrű jóváhagyása elég.
  if (p.override?.type === 'fixed') return { ok: reasons.length === 0, reasons };
  const metal = cfg && cfg.metal;
  const gm = (S?.pricingMode || 'gramm') === 'gramm';
  const rings = (cfg && cfg.rings) || [];
  const stoned = rings.some((r) => r.stones && r.stones.count > 0);
  const engraved = rings.some((r) => r.engraving && String(r.engraving).trim());
  const SET = 'Az árszámítás beállításai még nincsenek jóváhagyva.';

  // Anyag
  if (metal === 'ti') reasons.push('A titángyűrű ára egyedi ajánlat.');
  else if (metal) {
    const key = gm ? `sellPerGram.${metal}` : METALS[metal]?.ref;
    if (!ok(ms[key])) reasons.push(`A(z) ${METALS[metal]?.short || metal} grammára még nincs jóváhagyva.`);
  }
  // Mindig ható beállítások: számítási mód, méretezés, anyagonkénti tömegarány, kerekítés, csomagolás díja
  for (const k of ['pricingMode', 'sizeMethod', 'density', 'roundTo', 'boxCost']) need(k, SET);
  // Kövek: kőár, foglalás, tanúsítvány, bruttó/nettó kezelés, elférési szabály
  if (stoned) {
    for (const r of rings) {
      if (!r.stones || !r.stones.count) continue;
      const d = (M?.diamonds || []).find((x) => x.id === r.stones.cat);
      if (!d || !ok(d.src)) { reasons.push('A választott kőméret ára még nincs jóváhagyva.'); break; }
    }
    need('settingPerStone', 'A kőfoglalás díja (vagy hogy nincs külön díj) még nincs jóváhagyva.');
    need('certCost', SET);
    need('stonesGross', SET);
    if (S?.stonesGross === false) { need('markupStones', SET); need('vatPct', 'Az ÁFA-beállítás még nincs jóváhagyva.'); }
    need('stoneEdgeMm', SET); need('stoneGapMm', SET);
  }
  if (engraved) need('engravingPrice', 'A gravírozás díja még nincs jóváhagyva.');
  // Költségalapú mód: anyagveszteség, munkadíj, felárak, ÁFA
  if (!gm) {
    for (const k of ['lossPct', 'laborFactor', 'markupMetal', 'vatPct']) need(k, SET);
    if (stoned) need('markupStones', SET);
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)] };
}

/**
 * A vásárlónak mutatott ár. kind: 'calc' (jóváhagyott, számolt) | 'list' (a jelenlegi weboldal
 * listaára, csak az alapváltozatra, nem jóváhagyott modellnél) | 'quote' (egyedi ajánlat).
 */
export function shownPrice(p, cfgIn, M, S) {
  const r = priceProduct(p, cfgIn, M, S);
  const t = priceTrust(p, r.cfg, M, S);
  if (t.ok && r.final !== null) return { ...r, kind: 'calc', trust: t };
  // Nem megbízható számolt ár: az alapváltozatnál a közzétett listaár (akkor is, ha a nyilvános nézetben
  // a nem jóváhagyott grammár üres, és a motor ezért nem tud számolni), egyébként egyedi ajánlat.
  const base = normalizeConfig(p, defaultConfig(p), M, S).cfg;
  const isBase = encodeCfg(base) === encodeCfg(r.cfg);
  if (!t.ok && isBase && p.listaAr && !p.priceOnRequest) return { ...r, final: p.listaAr, raw: p.listaAr, kind: 'list', trust: t, quote: false };
  return { ...r, final: null, quote: true, kind: 'quote', reason: r.final === null ? r.reason : t.reasons[0], trust: t };
}
