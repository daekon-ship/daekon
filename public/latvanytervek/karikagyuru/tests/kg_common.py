"""Közös tesztsegéd: minden árelem és minden gyűrű jóváhagyása (helyi mód), hogy a konfigurátor tesztelhető legyen.
A nem jóváhagyott viselkedést külön tesztek nézik (v53.py, engine.test.mjs)."""
APPROVE_ALL_JS = """async () => {
  const { store } = await import('./js/store.js');
  const st = store.get();
  const ok = 'jovahagyott';
  st.materials.src = st.materials.src || {};
  for (const k of ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'sellPerGram.pd', 'gold24', 'platinum', 'palladium', 'titanium']) st.materials.src[k] = ok;
  st.materials.diamonds.forEach((d) => { if (d.price) d.src = ok; });
  st.settings.src = st.settings.src || {};
  for (const k of ['pricingMode', 'sizeMethod', 'roundTo', 'density', 'settingPerStone', 'engravingPrice', 'vatPct', 'stonesGross', 'boxCost', 'certCost', 'stoneEdgeMm', 'stoneGapMm', 'markupMetal', 'markupStones', 'laborPerGram', 'laborBase']) st.settings.src[k] = ok;
  st.products.forEach((p) => { p.approved = true; });
  store.persistNow();
}"""

async def approve_all(pg):
    await pg.evaluate(APPROVE_ALL_JS)
    await pg.reload(); await pg.wait_for_timeout(700)
