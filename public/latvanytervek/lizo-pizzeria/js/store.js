/* Böngészőn belüli tároló – a látványterv vásárlói oldala és a konyhai felület ugyanezt használja.
 * A C fázisban ezt a PHP + MySQL API váltja (lásd ATADAS.md). Árat itt sem számolunk a kliens adataiból:
 * a rendelés tételeinek ára mindig a LIZO.products listából jön. */
(function () {
  const K = { cart: 'lizo.cart.v1', orders: 'lizo.orders.v1', off: 'lizo.unavailable.v1', settings: 'lizo.settings.v1' };
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privát mód */ } };

  const byId = Object.fromEntries(window.LIZO.products.map(p => [p.id, p]));

  function unitPrice(line) {
    const p = byId[line.id]; if (!p) return 0;
    if (p.sizes) { const s = p.sizes.find(s => s.k === line.size) || p.sizes[0]; return s.price; }
    return p.price;
  }

  const Store = {
    K, byId, unitPrice,
    fmt: n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0Ft',
    settings() { return Object.assign({ minOrder: window.LIZO.restaurant.minOrder }, read(K.settings, {})); },
    saveSettings(s) { write(K.settings, s); },
    unavailable() { return new Set(read(K.off, [])); },
    setUnavailable(set) { write(K.off, [...set]); },
    cart() { return read(K.cart, []).filter(l => byId[l.id] && l.qty > 0); },
    saveCart(c) { write(K.cart, c); },
    lineKey: l => [l.id, l.size || '', (l.removed || []).slice().sort().join('|'), l.drink || '', l.variant || '', (l.note || '').trim()].join('§'),
    subtotal(c) { return c.reduce((s, l) => s + unitPrice(l) * l.qty, 0); },
    orders() { return read(K.orders, []); },
    saveOrders(o) { write(K.orders, o); },
    nextOrderNo() {
      const o = read(K.orders, []); const n = o.reduce((m, x) => Math.max(m, x.no || 0), 400) + 1; return n;
    }
  };
  window.LizoStore = Store;
})();
