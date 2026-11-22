"""Közös tesztsegéd (helyi mód).
A nyilvános kódban nincs ár (V5.5). A konfigurátor teszteléséhez a fejlesztői adatkészletet
(services/karikagyuru-api/dev/demo-dataset.json) a tesztelt böngészőbe töltjük, majd minden árelemet és
gyűrűt jóváhagyunk. A nem jóváhagyott viselkedést külön tesztek nézik (v53.py, engine.test.mjs)."""
import json, os
_DS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', 'services', 'karikagyuru-api', 'dev', 'demo-dataset.json')
DATASET = json.load(open(_DS, encoding='utf-8'))

LOAD_DATASET_JS = """async (ds) => {
  const { store } = await import('./js/store.js');
  const { seedWeights } = await import('./js/engine.js');
  const st = store.get();
  st.materials = JSON.parse(JSON.stringify(ds.materials));
  st.settings = JSON.parse(JSON.stringify(ds.settings));
  st.products.forEach((p) => p.rings.forEach((r) => { r.labor = ds.laborByStyle[p.style] ?? null; }));
  seedWeights(st.products, st.materials, st.settings);
  store.persistNow();
}"""

APPROVE_ALL_JS = """async () => {
  const { store } = await import('./js/store.js');
  const st = store.get();
  const ok = 'jovahagyott';
  st.materials.src = st.materials.src || {};
  for (const k of ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'sellPerGram.pd', 'gold24', 'platinum', 'palladium', 'titanium']) st.materials.src[k] = ok;
  st.materials.diamonds.forEach((d) => { if (d.price) d.src = ok; });
  st.settings.src = st.settings.src || {};
  for (const k of Object.keys(st.settings.src)) st.settings.src[k] = ok;
  st.products.forEach((p) => { p.approved = true; });
  store.persistNow();
}"""

async def load_dataset(pg):
    await pg.evaluate(LOAD_DATASET_JS, DATASET)

async def approve_all(pg):
    await load_dataset(pg)
    await pg.evaluate(APPROVE_ALL_JS)
    await pg.reload(); await pg.wait_for_timeout(700)

FILL_REQUIRED_JS = """async ([id, t]) => {
  const { store } = await import('./js/store.js');
  const p = store.get().products.find((x) => x.id === id);
  p.rings.forEach((r) => { r.thickness = t; if (!(r.weight > 0)) { r.weight = 3; r.weightChecked = true; } });
  store.persistNow();
}"""

async def fill_required(pg, pid, thickness=1.7):
    """V5.6: a szakmai jóváhagyáshoz kötelező vastagság megadása (a kiinduló katalógusban nincs)."""
    await pg.evaluate(FILL_REQUIRED_JS, [pid, thickness])

async def approve_in_queue(pg):
    """V5.6: jóváhagyás a sorban – ha becsült adat van, előbb a megerősítő jelölőnégyzet."""
    if await pg.locator('[data-qconfirm]').count():
        await pg.check('[data-qconfirm]'); await pg.wait_for_timeout(150)
    await pg.click('[data-approve]')
