/* =========================================================
   LIMIT PIZZA — látványterv · interakciók
   Adat: data/menu.js (window.LIMIT_MENU, forrása data/menu.json)
   Animáció: Motion (motion.dev) — ha nem tölt be, minden
   ugyanúgy működik, csak mozgás nélkül.
   A kosár BEMUTATÓ: nem küld rendelést, személyes adatot nem kér.
   ========================================================= */
(function () {
  'use strict';

  var M = window.LIMIT_MENU;
  if (!M) return;
  var MO = window.Motion || null;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CAN_ANIM = !!(MO && MO.animate && !REDUCED);
  var EASE = [0.2, 0.7, 0.2, 1];
  var PLUSZ = M.toppingGroups.find(function (g) { return g.id === 'plusz'; });
  var EXTRA = M.toppingGroups.find(function (g) { return g.id === 'extra'; });
  var MEATS = ['főtt sonka', 'szalámi', 'bacon', 'parasztkolbász', 'tonhal'];
  var STORE_KEY = 'limitpizza-demo-kosar-v1';

  /* ---------- segédek ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ft = function (n) { return n.toLocaleString('hu-HU') + ' Ft'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); };
  var byId = function (id) { return M.pizzas.find(function (p) { return p.id === id; }); };
  var drinkById = function (id) { return M.drinks.find(function (d) { return d.id === id; }); };
  var anim = function (el, kf, opt) {
    if (!CAN_ANIM || !el) return Promise.resolve();
    try { return MO.animate(el, kf, Object.assign({ ease: EASE }, opt || {})).finished || Promise.resolve(); }
    catch (e) { return Promise.resolve(); }
  };
  var isMobile = function () { return window.matchMedia('(max-width: 859px)').matches; };

  var ICON = {
    plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M2.5 8h11"/></svg>',
    minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11"/></svg>',
    x: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5l2.6 3.2-1.6 2.2a12 12 0 006.9 6.9l2.2-1.6 3.2 2.6-1.2 3a2 2 0 01-2 1.2C10 20.4 3.6 14 3.1 7.2a2 2 0 011.2-2z"/></svg>',
    gluten: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22V8"/><path d="M12 8c0-2.5 1.3-4.3 3.5-5.2C15.5 5.4 14.2 7.2 12 8z"/><path d="M12 13c-2.6-.2-4.4-1.8-5-4.2 2.5.1 4.4 1.7 5 4.2zM12 13c2.6-.2 4.4-1.8 5-4.2-2.5.1-4.4 1.7-5 4.2zM12 18c-2.6-.2-4.4-1.8-5-4.2 2.5.1 4.4 1.7 5 4.2zM12 18c2.6-.2 4.4-1.8 5-4.2-2.5.1-4.4 1.7-5 4.2z"/></svg>',
    tej: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2.5h8v3l2 3.5V21.5H6V9l2-3.5z"/><path d="M8 5.5h8M6 9h12"/></svg>',
    hal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c3-4.5 9-6 14-2l4-3v10l-4-3c-5 4-11 2.5-14-2z"/><circle cx="8" cy="11" r=".8"/></svg>',
    csipos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6c-1 6-5 11-11 13 5 3 13-1 15-9 .4-1.8-.6-3.5-2.2-4z"/><path d="M15 6c0-1.6.8-2.8 2.4-3.5"/></svg>'
  };
  var algIcons = function (list) {
    return '<span class="alg">' + list.map(function (a) {
      return '<i class="' + (a === 'csipos' ? 'is-hot' : '') + '" title="' + M.allergens[a] + '">' + ICON[a] + '</i>';
    }).join('') + '<span class="sr">Allergének: ' + list.map(function (a) { return M.allergens[a]; }).join(', ') + '</span></span>';
  };

  /* ---------- toast ---------- */
  var toastEl = $('[data-toast]'), toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  /* ---------- body zár dialógusokhoz ---------- */
  function lock(on) { document.body.classList.toggle('is-locked', on); }

  /* =========================================================
     DemoNotice
     ========================================================= */
  (function DemoNotice() {
    var bar = $('#demo-bar');
    try { if (sessionStorage.getItem('lp-demo-x')) bar.hidden = true; } catch (e) {}
    $('[data-close-demo]').addEventListener('click', function () {
      bar.hidden = true;
      try { sessionStorage.setItem('lp-demo-x', '1'); } catch (e) {}
    });
  })();

  /* =========================================================
     Nyitvatartás-állapot (Europe/Budapest idő szerint)
     ========================================================= */
  var DAY_ON = { 0: 'vasárnap', 1: 'hétfőn', 2: 'kedden', 3: 'szerdán', 4: 'csütörtökön', 5: 'pénteken', 6: 'szombaton' };
  function bpNow() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
    return { dow: dow, min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }
  function toMin(t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; }
  function status() {
    var n = bpNow();
    var today = M.hours.find(function (h) { return h.dow === n.dow; });
    if (today.open && n.min >= toMin(today.open) && n.min < toMin(today.close)) {
      return { open: true, dow: n.dow, short: 'Most nyitva · ' + today.close + '-ig', long: 'Most veszünk fel rendelést — ' + today.close + '-ig.' };
    }
    if (today.open && n.min < toMin(today.open)) {
      return { open: false, dow: n.dow, short: 'Ma ' + today.open + '-tól', long: 'Most zárva — rendelésfelvétel ma ' + today.open + '-tól.' };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (n.dow + i) % 7;
      var h = M.hours.find(function (x) { return x.dow === d; });
      if (h.open) {
        var when = i === 1 ? 'holnap' : DAY_ON[d];
        return { open: false, dow: n.dow, short: cap(when) + ' ' + h.open + '-tól', long: 'Most zárva — legközelebb ' + when + ' ' + h.open + '-tól veszünk fel rendelést.' };
      }
    }
  }
  function renderStatus() {
    var s = status();
    $$('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      $('.status__txt', el).textContent = s.short;
    });
    $$('[data-status-long]').forEach(function (el) {
      el.textContent = s.long;
      el.classList.toggle('is-open', s.open);
    });
    var tb = $('[data-hours]');
    tb.innerHTML = M.hours.map(function (h) {
      return '<tr class="' + (h.dow === s.dow ? 'is-today' : '') + '"><th scope="row">' + h.day + '</th>' +
        (h.open ? '<td>' + h.open + '–' + h.close + '</td>' : '<td class="is-closed">zárva</td>') + '</tr>';
    }).join('');
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* =========================================================
     Kosár állapot (csak böngészőben, nem személyes demóadat)
     ========================================================= */
  var state = { items: [], town: 'Bük' };
  var TOWNS = [].concat.apply([], M.delivery.zones.map(function (z) { return z.towns; }));
  var arr = function (a, allowed) { return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string' && (!allowed || allowed.indexOf(x) > -1); }) : []; };
  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    var q = Math.round(+it.qty); if (!(q >= 1)) return null; q = Math.min(20, q);
    if (it.type === 'drink') return drinkById(it.id) ? { type: 'drink', id: it.id, qty: q } : null;
    var p = byId(it.id); if (!p) return null;
    return { type: 'pizza', id: p.id, qty: q,
      base: M.bases.some(function (b) { return b.id === it.base; }) ? it.base : 'paradicsomszosz',
      removed: arr(it.removed, p.ingredients), plusz: arr(it.plusz, PLUSZ.items), extra: arr(it.extra, EXTRA.items),
      note: typeof it.note === 'string' ? it.note.slice(0, 140) : '' };
  }
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && Array.isArray(saved.items)) {
      state.items = saved.items.map(cleanItem).filter(Boolean);
      state.town = TOWNS.indexOf(saved.town) > -1 ? saved.town : 'Bük';
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- közös demó-állapot (admin beállítások) ---------- */
  var D = window.LimitDemo, S = D.getSettings();
  var outPizza = function (id) { return S.soldOut.pizzas.indexOf(id) > -1; };
  var outTop = function (t) { return S.soldOut.toppings.indexOf(t) > -1; };
  var DUPLA = function (p, t) { return p.ingredients.indexOf(t) > -1 || (t === 'feta sajt' && p.ingredients.indexOf('feta') > -1) || (t === 'trappista sajt' && p.ingredients.indexOf('trappista') > -1); };
  /* a kosárban lévő tétel időközben elfogyott-e (pizza vagy hozzáadott feltét) */
  function itemProblem(it) {
    if (it.type !== 'pizza') return '';
    if (outPizza(it.id)) return 'Ez a pizza ma elfogyott — töröld a kosárból.';
    var gone = it.plusz.concat(it.extra).filter(outTop);
    return gone.length ? 'Elfogyott feltét: ' + gone.join(', ') + ' — töröld, és rakd össze újra.' : '';
  }
  var cartBlocked = function () { return state.items.some(function (it) { return !!itemProblem(it); }); };

  function unitPrice(it) {
    if (it.type === 'drink') return drinkById(it.id).price;
    return byId(it.id).price + it.plusz.length * PLUSZ.price + it.extra.length * EXTRA.price;
  }
  function lineKey(it) { return JSON.stringify([it.type, it.id, it.base || '', (it.removed || []).slice().sort(), (it.plusz || []).slice().sort(), (it.extra || []).slice().sort(), it.note || '']); }
  function addItem(it) {
    var k = lineKey(it);
    var ex = state.items.find(function (x) { return lineKey(x) === k; });
    if (ex) ex.qty = Math.min(20, ex.qty + it.qty); else state.items.push(it);
    save(); syncCount(true);
  }
  function countItems() { return state.items.reduce(function (a, b) { return a + b.qty; }, 0); }
  function pizzaCount() { return state.items.filter(function (i) { return i.type === 'pizza'; }).reduce(function (a, b) { return a + b.qty; }, 0); }
  function subtotal() { return state.items.reduce(function (a, it) { return a + unitPrice(it) * it.qty; }, 0); }
  function fee() {
    var z = M.delivery.zones.find(function (z) { return z.towns.indexOf(state.town) > -1; });
    return z ? z.fee : 0;
  }
  function syncCount(bump) {
    var n = countItems();
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = n; el.hidden = n === 0;
      if (bump && n) anim(el, { scale: [1, 1.35, 1] }, { duration: 0.38 });
    });
    $$('[data-open-cart]').forEach(function (b) {
      if (b.classList.contains('cartbtn')) b.setAttribute('aria-label', 'Kosár megnyitása, ' + n + ' tétel');
    });
  }
  syncCount(false);

  /* =========================================================
     MenuSection + ProductCard
     ========================================================= */
  function ProductCard(p) {
    var media = '<span class="pi__media" aria-hidden="true"><span class="pi__no">' + p.no + '</span></span>';
    return '<li class="pi" data-id="' + p.id + '">' +
      '<button type="button" class="pi__btn" data-open-pizza="' + p.id + '" aria-label="' + p.no + '. ' + cap(p.name) + ', ' + p.price + ' forint — összeállítás és kosárba">' +
      media +
      '<span class="pi__body"><span class="pi__line"><span class="pi__name">' + esc(p.name) + ' ' + algIcons(p.allergens) + '</span>' +
      '<span class="lead" aria-hidden="true"></span><span class="pi__price">' + ft(p.price) + '</span></span>' +
      '<span class="pi__ing">' + esc(p.ingredients.join(', ')) + '</span></span>' +
      '<span class="pi__add" aria-hidden="true">' + ICON.plus + '</span>' +
      '</button></li>';
  }

  var listEl = $('[data-pizza-list]');
  listEl.innerHTML = M.pizzas.map(ProductCard).join('');

  /* --- „Ma elfogyott” jelzés: a konyhai admin demóban állítható --- */
  function renderSoldOut() {
    M.pizzas.forEach(function (p) {
      var li = listEl.querySelector('[data-id="' + p.id + '"]'), on = outPizza(p.id);
      li.classList.toggle('is-out', on);
      var btn = $('.pi__btn', li); btn.disabled = on;
      btn.setAttribute('aria-label', p.no + '. ' + cap(p.name) + ', ' + p.price + ' forint' + (on ? ' — ma elfogyott' : ' — összeállítás és kosárba'));
      var tag = $('.pi__out', li);
      if (on && !tag) $('.pi__body', li).insertAdjacentHTML('beforeend', '<span class="pi__out">Ma elfogyott</span>');
      if (!on && tag) tag.remove();
    });
    $$('.plate').forEach(function (f) {
      var b = $('[data-open-pizza]', f), on = outPizza(b.getAttribute('data-open-pizza'));
      f.classList.toggle('is-out', on); b.disabled = on;
    });
    $$('[data-topping-groups] .tg__items').forEach(function (el, i) {
      var g = M.toppingGroups[i];
      el.innerHTML = g.items.map(function (t) { return outTop(t) ? '<s title="ma elfogyott">' + esc(t) + '</s>' : esc(t); }).join(' / ');
    });
  }
  $('[data-topping-groups]').innerHTML = M.toppingGroups.map(function (g) {
    return '<div class="tg"><div class="tg__line"><span class="tg__name">' + g.name + '</span><span class="lead" aria-hidden="true"></span><span class="tg__price">' + ft(g.price) + '</span></div>' +
      '<p class="tg__items">' + g.items.join(' / ') + '</p></div>';
  }).join('');
  renderSoldOut();
  $('[data-legend]').innerHTML = Object.keys(M.allergens).map(function (k) {
    return '<span class="lg' + (k === 'csipos' ? ' is-hot' : '') + '">' + ICON[k] + M.allergens[k] + '</span>';
  }).join('');
  $('[data-drink-list]').innerHTML = M.drinks.map(function (d) {
    return '<li class="di"><div class="di__line"><span class="di__name">' + d.name + '</span><span class="di__vol">' + d.volume + '</span><span class="lead" aria-hidden="true"></span><span class="di__price">' + ft(d.price) + '</span></div>' +
      '<button type="button" class="di__add" data-add-drink="' + d.id + '" aria-label="' + d.name + ' ' + d.volume + ' kosárba, ' + d.price + ' forint">' + ICON.plus + '</button></li>';
  }).join('');
  $('[data-fee-rows]').innerHTML = M.delivery.zones.map(function (z) {
    return '<tr><th scope="row">' + z.towns.join(', ') + '</th><td class="' + (z.fee ? '' : 'is-free') + '">' + (z.fee ? ft(z.fee) : 'ingyenes') + '</td></tr>';
  }).join('');

  /* --- szűrés és keresés --- */
  var filter = 'all', query = '', firstFilter = true;
  var FILTERS = {
    all: function () { return true; },
    husmentes: function (p) { return !p.ingredients.some(function (i) { return MEATS.indexOf(i) > -1; }); },
    sonka: function (p) { return p.ingredients.indexOf('főtt sonka') > -1; },
    csipos: function (p) { return p.allergens.indexOf('csipos') > -1; },
    hal: function (p) { return p.allergens.indexOf('hal') > -1; }
  };
  function applyFilter() {
    var q = norm(query.trim()), shown = [];
    M.pizzas.forEach(function (p) {
      var hay = norm(p.name + ' ' + p.ingredients.join(' ') + ' ' + p.no);
      var ok = FILTERS[filter](p) && (!q || q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; }));
      var li = listEl.querySelector('[data-id="' + p.id + '"]');
      li.hidden = !ok;
      if (ok) shown.push(li);
    });
    $('[data-empty]').hidden = shown.length > 0;
    $('[data-result]').textContent = (filter === 'all' && !q) ? M.pizzas.length + ' pizza, egy méretben (' + M.meta.pizzaSize + ')' : shown.length + ' találat a ' + M.pizzas.length + ' pizzából';
    if (firstFilter) { firstFilter = false; return; }
    if (CAN_ANIM && shown.length) anim(shown, { opacity: [0, 1], y: [6, 0] }, { duration: 0.25, delay: MO.stagger(0.018) });
  }
  var sTimer;
  $('[data-search]').addEventListener('input', function (e) {
    clearTimeout(sTimer);
    sTimer = setTimeout(function () { query = e.target.value; applyFilter(); }, 120);
  });
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-filter');
      $$('[data-filter]').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      applyFilter();
    });
  });
  $('[data-reset]').addEventListener('click', function () {
    query = ''; $('[data-search]').value = ''; filter = 'all';
    $$('[data-filter]').forEach(function (x) { var on = x.getAttribute('data-filter') === 'all'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    applyFilter();
  });
  applyFilter();

  /* --- italok közvetlenül kosárba --- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-drink]');
    if (!b) return;
    var d = drinkById(b.getAttribute('data-add-drink'));
    addItem({ type: 'drink', id: d.id, qty: 1 });
    toast(d.name + ' ' + d.volume + ' a kosárban');
    anim(b, { scale: [1, 0.86, 1] }, { duration: 0.3 });
  });

  /* =========================================================
     Dialógus nyitás/zárás animációval
     ========================================================= */
  function openDialog(dlg, panel, from) {
    dlg.showModal(); lock(true);
    anim(panel, from, { duration: 0.32 });
  }
  function closeDialog(dlg, panel, to) {
    return anim(panel, to, { duration: 0.22 }).then(function () {
      dlg.close(); lock(false);
      if (panel) { panel.style.transform = ''; panel.style.opacity = ''; }
    });
  }
  function wireDialog(dlg, getPanel, from, to) {
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(dlg, getPanel(), to()); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) closeDialog(dlg, getPanel(), to());
      if (e.target.closest('[data-close]')) { e.preventDefault(); closeDialog(dlg, getPanel(), to()); }
    });
    return function () { openDialog(dlg, getPanel(), from()); };
  }

  /* =========================================================
     ProductConfigurator
     ========================================================= */
  var cfgDlg = $('#cfg'), cfgForm = $('[data-cfg-form]');
  var cfgFrom = function () { return isMobile() ? { y: ['100%', '0%'] } : { opacity: [0, 1], y: [18, 0] }; };
  var cfgTo = function () { return isMobile() ? { y: ['0%', '100%'] } : { opacity: [1, 0], y: [0, 12] }; };
  cfgForm.addEventListener('submit', function (e) { e.preventDefault(); });
  var openCfgDlg = wireDialog(cfgDlg, function () { return cfgDlg; }, cfgFrom, cfgTo);

  function opt(type, name, value, label, extra, cls) {
    return '<label class="opt ' + (cls || '') + '"><input type="' + type + '" name="' + name + '" value="' + esc(value) + '"' + (extra || '') + '><span>' + label + '</span></label>';
  }

  var cfgPizza = null, cfgUpdate = null, cfgSetQty = function () {};
  /* admin közben elfogyottra állít valamit: a nyitott konfigurátor azonnal frissül */
  function refreshCfg() {
    if (!cfgDlg.open || !cfgPizza) return;
    if (outPizza(cfgPizza.id)) { closeDialog(cfgDlg, cfgDlg, cfgTo()); toast(cap(cfgPizza.name) + ': közben elfogyott'); return; }
    $$('input[name="plusz"], input[name="extra"]', cfgForm).forEach(function (inp) {
      var out = outTop(inp.value), lab = inp.parentNode, tag = $('.tag--out', lab);
      if (out && inp.checked) inp.checked = false;
      inp.disabled = out;
      if (out && !tag) $('span', lab).insertAdjacentHTML('beforeend', ' <em class="tag tag--out">elfogyott</em>');
      if (!out && tag) tag.remove();
    });
    if (cfgUpdate) cfgUpdate(false);
  }
  function ProductConfigurator(id) {
    var p = byId(id);
    if (!p) return;
    if (outPizza(p.id)) { toast(cap(p.name) + ': ma elfogyott'); return; }
    cfgPizza = p;
    var removable = p.ingredients.filter(function (i) { return i !== 'paradicsomszósz'; });
    var media = p.photo
      ? '<figure class="cfg__media"><img class="cfg__photo" src="img/' + p.photo + '-kivagas-720.webp" srcset="img/' + p.photo + '-kivagas-720.webp 720w, img/' + p.photo + '-kivagas-1080.webp 1080w" sizes="300px" width="720" height="720" alt="' + esc(M.photos[p.photo].alt) + '"><figcaption>Saját fotó a Limit Pizza konyhájából</figcaption></figure>'
      : '<figure class="cfg__media"><div class="cfg__ph" aria-hidden="true"><b>' + p.no + '</b><span>' + esc(p.name) + '</span></div><figcaption>Ehhez a pizzához még nincs saját fotó</figcaption></figure>';

    cfgForm.innerHTML =
      '<div class="cfg__top"><p>Pizza összeállítása · bemutató</p><button type="button" class="xbtn" data-close aria-label="Bezárás">' + ICON.x + '</button></div>' +
      '<div class="cfg__body">' + media + '<div>' +
        '<p class="eyebrow">' + p.no + '. · ' + M.meta.pizzaSize + '</p>' +
        '<h2 id="cfg-name">' + esc(p.name) + '</h2>' +
        '<div class="cfg__price"><b>' + ft(p.price) + '</b><span>az étlap szerinti ár · ' + p.allergens.map(function (a) { return M.allergens[a]; }).join(', ') + '</span></div>' +
        '<p class="cfg__ing">' + esc(p.ingredients.join(', ')) + '</p>' +

        '<fieldset class="fs"><legend>Alap</legend><div class="opts">' +
          M.bases.map(function (b) {
            return opt('radio', 'base', b.id, b.name + (b.price === null ? ' <em class="tag">felár?</em>' : ''), b.default ? ' checked' : '', 'opt--base');
          }).join('') +
        '</div><p class="fs__hint" style="margin-top:8px">A két másik alap az étlap szerint kérhető; felár nincs feltüntetve, ezért itt nem számolunk vele.</p></fieldset>' +

        '<fieldset class="fs"><legend>Ami rajta van <em>— koppints, ha nélküle kéred</em></legend><div class="opts">' +
          removable.map(function (i) { return opt('checkbox', 'removed', i, ICON.x.replace('<svg', '<svg class="rmx"') + ' ' + i, '', 'opt--rm'); }).join('') +
        '</div></fieldset>' +

        '<fieldset class="fs"><legend>Plusz feltétek <em>+' + ft(PLUSZ.price) + ' / db</em></legend><div class="opts">' +
          PLUSZ.items.map(function (i) { return opt('checkbox', 'plusz', i, i + (outTop(i) ? ' <em class="tag tag--out">elfogyott</em>' : ''), outTop(i) ? ' disabled' : ''); }).join('') +
        '</div></fieldset>' +

        '<fieldset class="fs"><legend>Extra feltétek <em>+' + ft(EXTRA.price) + ' / db</em></legend><div class="opts">' +
          EXTRA.items.map(function (i) { return opt('checkbox', 'extra', i, i + (DUPLA(p, i) ? ' <small>dupla adag</small>' : '') + (outTop(i) ? ' <em class="tag tag--out">elfogyott</em>' : ''), outTop(i) ? ' disabled' : ''); }).join('') +
        '</div><p class="fs__hint" style="margin-top:8px">„Dupla adag”: a pizzán már rajta lévő feltét még egyszer — az étlap extra árával számolva, a felára egyeztetendő.</p></fieldset>' +

        '<fieldset class="fs"><legend>Megjegyzés a konyhának</legend>' +
          '<label class="sr" for="cfg-note">Megjegyzés</label><textarea id="cfg-note" class="note" name="note" maxlength="140" placeholder="pl. jól átsütve, félbevágva"></textarea>' +
        '</fieldset>' +
      '</div></div>' +
      '<div class="cfg__foot">' +
        '<div class="qty" role="group" aria-label="Darabszám"><button type="button" data-q="-1" aria-label="Eggyel kevesebb">' + ICON.minus + '</button><output aria-live="polite" data-qv>1</output><button type="button" data-q="1" aria-label="Eggyel több">' + ICON.plus + '</button></div>' +
        '<button type="button" class="btn btn--ink cfg__add" data-cfg-add><span>Kosárba</span><span class="sum" data-sum>' + ft(p.price) + '</span></button>' +
      '</div>';

    var qty = 1, adding = false;
    function read() {
      var fd = new FormData(cfgForm);
      return { type: 'pizza', id: p.id, base: fd.get('base'), removed: fd.getAll('removed'), plusz: fd.getAll('plusz'), extra: fd.getAll('extra'), note: (fd.get('note') || '').trim(), qty: qty };
    }
    function update(bump) {
      var it = read();
      var sum = unitPrice(it) * qty;
      var s = $('[data-sum]', cfgForm);
      s.textContent = ft(sum);
      $('[data-qv]', cfgForm).textContent = qty;
      $('[data-q="-1"]', cfgForm).disabled = qty <= 1;
      $('[data-q="1"]', cfgForm).disabled = qty >= 20;
      if (bump) anim(s, { opacity: [0.35, 1], y: [-5, 0] }, { duration: 0.22 });
    }
    cfgForm.onchange = function () { update(true); };
    cfgForm.onclick = function (e) {
      var q = e.target.closest('[data-q]');
      if (q) { qty = Math.max(1, Math.min(20, qty + +q.getAttribute('data-q'))); update(true); }
      if (e.target.closest('[data-cfg-add]')) {
        if (adding) return;                       // gyors dupla kattintás ellen
        var it = read();
        if (outPizza(p.id) || it.plusz.concat(it.extra).some(outTop)) { toast('Közben elfogyott — nézd át a választást.'); refreshCfg(); return; }
        adding = true;
        addItem(it);
        closeDialog(cfgDlg, cfgDlg, cfgTo()).then(function () {
          toast(qty + ' × ' + cap(p.name) + ' a kosárban');
          adding = false;
        });
      }
    };
    cfgUpdate = update;
    cfgSetQty = function (n) { qty = Math.max(1, Math.min(20, n)); update(false); };
    update(false);
    openCfgDlg();
    var body = $('.cfg__body', cfgForm); if (body) body.scrollTop = 0;
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-pizza]');
    if (b) ProductConfigurator(b.getAttribute('data-open-pizza'));
  });

  /* =========================================================
     CartDrawer
     ========================================================= */
  var cartDlg = $('#cart'), cartEl = $('[data-cart]'), view = 'list';
  var cartFrom = function () { return isMobile() ? { y: ['100%', '0%'] } : { x: ['100%', '0%'] }; };
  var cartTo = function () { return isMobile() ? { y: ['0%', '100%'] } : { x: ['0%', '100%'] }; };
  var openCartDlg = wireDialog(cartDlg, function () { return cartDlg; }, cartFrom, cartTo);

  function modsHtml(it) {
    if (it.type !== 'pizza') return '';
    var out = [];
    var base = M.bases.find(function (b) { return b.id === it.base; });
    if (base && !base.default) out.push('<li>Alap: <b>' + base.name + '</b> <span class="vf">(felár egyeztetendő)</span></li>');
    if (it.removed.length) out.push('<li>Nélküle: <span class="rm">' + it.removed.map(esc).join(', ') + '</span></li>');
    if (it.plusz.length) out.push('<li>Plusz: <b>' + it.plusz.map(esc).join(', ') + '</b> (' + it.plusz.length + ' × ' + ft(PLUSZ.price) + ')</li>');
    if (it.extra.length) out.push('<li>Extra: <b>' + it.extra.map(esc).join(', ') + '</b> (' + it.extra.length + ' × ' + ft(EXTRA.price) + ')' + (it.extra.some(function (t) { return DUPLA(byId(it.id), t); }) ? ' <span class="vf">(dupla adag felára egyeztetendő)</span>' : '') + '</li>');
    if (it.note) out.push('<li>Megjegyzés: „' + esc(it.note) + '”</li>');
    var pr = itemProblem(it); if (pr) out.push('<li class="ci__prob">' + esc(pr) + '</li>');
    return out.length ? '<ul class="ci__mods">' + out.join('') + '</ul>' : '';
  }
  function itemName(it) {
    if (it.type === 'drink') { var d = drinkById(it.id); return d.name + ' ' + d.volume; }
    return byId(it.id).name;
  }
  function slipText(o) {
    var L = { alap: 'alap', nelkule: 'nélküle', plusz: 'plusz', extra: 'extra', megj: 'megjegyzés' };
    var lines = ['LIMIT PIZZA — bemutató-rendelés #' + o.no, ''];
    o.lines.forEach(function (l) {
      lines.push(l.qty + ' × ' + (l.no ? l.no + '. ' : '') + l.name + ' — ' + ft(l.sum));
      l.mods.forEach(function (m) { lines.push('   ' + (typeof m === 'string' ? m : L[m.k] + ': ' + m.v)); });
    });
    lines.push('', 'Település: ' + o.customer.town, 'Részösszeg: ' + ft(o.sub), 'Kiszállítás: ' + (o.fee ? ft(o.fee) : 'ingyenes'), 'Összesen: ' + ft(o.total));
    return lines.join('\n');
  }

  var DEMO_CUSTOMER = { name: 'Minta Vendég', phone: '+36 30 000 0000', address: 'Minta utca 1.' };
  var PAYS = [
    { id: 'kartya', label: 'Bankkártya a futárnál' },
    { id: 'szep', label: 'OTP SZÉP-kártya a futárnál' },
    { id: 'kp', label: 'Készpénz', verify: true }
  ];
  var checkout = { pay: 'kartya', note: '' };

  function orderLines() {
    return state.items.map(function (it) {
      var mods = [];   /* {k: alap|nelkule|plusz|extra|megj, v: szöveg} */
      if (it.type === 'pizza') {
        var b = M.bases.find(function (x) { return x.id === it.base; });
        if (b && !b.default) mods.push({ k: 'alap', v: b.name.toLowerCase() + ' (felár egyeztetendő)' });
        it.removed.forEach(function (t) { mods.push({ k: 'nelkule', v: t }); });
        it.plusz.forEach(function (t) { mods.push({ k: 'plusz', v: t }); });
        it.extra.forEach(function (t) { mods.push({ k: 'extra', v: t + (DUPLA(byId(it.id), t) ? ' (dupla adag)' : '') }); });
        if (it.note) mods.push({ k: 'megj', v: it.note });
      }
      return { qty: it.qty, no: it.type === 'pizza' ? byId(it.id).no : null, name: it.type === 'pizza' ? cap(byId(it.id).name) : itemName(it), unit: unitPrice(it), sum: unitPrice(it) * it.qty, mods: mods };
    });
  }
  function saveDemoOrder() {
    return D.addOrder({
      ts: Date.now(), status: 'uj', demo: true,
      customer: { name: DEMO_CUSTOMER.name, phone: DEMO_CUSTOMER.phone, town: state.town, address: DEMO_CUSTOMER.address },
      pay: checkout.pay, note: checkout.note, lines: orderLines(),
      sub: subtotal(), fee: fee(), total: subtotal() + fee(), gift: pizzaCount() >= M.delivery.gift.pizzaCount,
      etaAtOrder: { min: S.eta.min, max: S.eta.max }
    });
  }
  var etaText = function () { return 'kb. ' + D.etaLabel(S.eta); };
  var ETA_NOTE = 'becsült idő, nem garantált';

  /* a bemutató-rendelés állapota, ahogy a konyhai admin demó beállítja (ugyanebben a böngészőben) */
  var STATUS_TXT = {
    uj: ['Megjelent a konyhai demóban', 'Még nincs elfogadva. Nyisd meg a konyhai demót egy másik fülön, és fogadd el — itt azonnal látszik.'],
    keszul: ['A konyha elfogadta — készül', ''],
    uton: ['Úton van', 'A futár elindult.'],
    kesz: ['Kiszállítva', ''],
    elutasitva: ['A konyha nem tudta elfogadni', 'Élesben itt kapna értesítést a vendég, és telefonon egyeztetnének.']
  };
  function liveStatusHtml(no) {
    var o = D.getOrders().find(function (x) { return x.no === no; });
    if (!o) return '<p class="live__t">A bemutató-rendelés már nincs meg (a konyhai demóban visszaállították a minta adatokat).</p>';
    var t = STATUS_TXT[o.status] || STATUS_TXT.uj, extra = t[1];
    if (o.status === 'keszul' && o.prepMin) extra = 'A konyha szerint várhatóan ' + o.prepMin + ' perc múlva indul. (' + ETA_NOTE + ')';
    return '<p class="live__k">Konyhai állapot · #' + o.no + '</p><p class="live__t live__t--' + o.status + '">' + t[0] + '</p>' + (extra ? '<p class="live__d">' + esc(extra) + '</p>' : '');
  }

  function CartDrawer() {
    var titles = { list: ['Kosár', 'A rendelésed összesítője'], checkout: ['Rendelés', 'Szállítási adatok · bemutató'], done: ['Bemutató vége', 'Így működne a rendelés'] };
    var head = '<div class="cart__head"><div><h2 id="cart-cim">' + titles[view][0] + '</h2><p>' + titles[view][1] + '</p></div>' +
      '<button type="button" class="xbtn" data-close aria-label="Bezárás">' + ICON.x + '</button></div>';
    var steps = '<ol class="steps" aria-label="Rendelés lépései">' + ['Kosár', 'Adatok', 'Konyha'].map(function (t, i) {
      var cur = { list: 0, checkout: 1, done: 2 }[view];
      return '<li class="' + (i < cur ? 'is-done' : i === cur ? 'is-on' : '') + '"' + (i === cur ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '</span>' + t + '</li>';
    }).join('') + '</ol>';
    var paused = !S.accepting
      ? '<div class="cart__pause" role="status"><b>A rendelésfelvétel most szünetel.</b> A kosarad megmarad; amint a konyha újra fogad rendelést, folytathatod. Sürgős esetben hívj: <a href="' + M.meta.phoneHref + '">' + M.meta.phone + '</a>.</div>'
      : '';

    if (view === 'done') {
      var o = lastOrder;
      cartEl.innerHTML = head + steps +
        '<div class="done">' +
          '<span class="done__badge">Bemutató</span>' +
          '<h3>Valódi rendelés nem történt.</h3>' +
          '<p>Ez a látványterv bemutatója: a rendelés csak ebben a böngészőben, a konyhai demó felületen jelenik meg — a pizzériához nem jut el.</p>' +
          '<div class="live" aria-live="polite" data-live>' + liveStatusHtml(o.no) + '</div>' +
          '<a class="btn btn--ink" href="admin.html#r' + o.no + '" target="_blank" rel="noopener">Konyhai demó megnyitása</a>' +
          '<details class="done__slip"><summary>A rendelés részletei</summary><pre class="slip" data-slip>' + esc(slipText(o)) + '</pre></details>' +
          '<p class="done__small">Ma a Limit Pizzánál telefonon lehet rendelni:</p>' +
          '<a class="btn btn--red" href="' + M.meta.phoneHref + '">' + ICON.phone + 'Hívás: ' + M.meta.phone + '</a>' +
          '<button type="button" class="linkbtn" data-new>Új bemutató-rendelés</button>' +
        '</div>';
      return;
    }

    if (!state.items.length) {
      cartEl.innerHTML = head + paused +
        '<div class="cart__demo"><span><b>Bemutató.</b> A kosár nem küld rendelést — ma telefonon lehet rendelni.</span></div>' +
        '<div class="cart__empty"><img src="img/logo-160.webp" width="160" height="160" alt=""><p>A kosár még üres. Válassz az étlapról, és itt összeáll a rendelésed.</p>' +
        '<button type="button" class="btn btn--ink btn--sm" data-goto-menu>Étlap</button></div>';
      return;
    }

    var sub = subtotal(), f = fee(), pc = pizzaCount(), min = M.delivery.minimumOrder, blocked = cartBlocked();
    var gift = '';
    if (pc >= M.delivery.gift.pizzaCount) gift = '<p class="warn warn--gift">5 pizza egy nyugtán: ajándék ' + M.delivery.gift.item + ' jár.</p>';
    else if (pc >= 3) gift = '<p class="warn warn--gift">Még ' + (M.delivery.gift.pizzaCount - pc) + ' pizza, és ajándék ' + M.delivery.gift.item + ' jár.</p>';
    var townSel = '<label class="field"><span>Település</span><select data-town>' +
      M.delivery.zones.map(function (z) { return z.towns.map(function (t) { return '<option value="' + t + '"' + (t === state.town ? ' selected' : '') + '>' + t + ' — ' + (z.fee ? ft(z.fee) + ' kiszállítás' : 'ingyenes kiszállítás') + '</option>'; }).join(''); }).join('') +
      '</select></label>';
    var totals = '<div class="rows"><div><span>Részösszeg (étel, ital)</span><span>' + ft(sub) + '</span></div><div><span>Kiszállítási díj · ' + esc(state.town) + '</span><span>' + (f ? ft(f) : 'ingyenes') + '</span></div>' +
      '<div class="tot"><span>Összesen</span><span data-total>' + ft(sub + f) + '</span></div></div>' +
      '<p class="eta-row">Várható kiszállítás most: <b>' + etaText() + '</b> <span>· ' + ETA_NOTE + '</span></p>';
    var warns = (sub < min ? '<p class="warn warn--min">A minimum rendelés ' + ft(min) + ' — még ' + ft(min - sub) + ' hiányzik.</p>' : '') +
      (blocked ? '<p class="warn warn--min">A kosárban van ma elfogyott tétel. Töröld, és folytathatod.</p>' : '');

    if (view === 'checkout') {
      var canSend = S.accepting && !blocked && sub >= min;
      cartEl.innerHTML = head + steps + paused +
        '<div class="cart__demo"><span><b>Bemutató.</b> A mezők rögzített minta adatok, nem írhatók át, és semmi nem kerül elküldésre. Élesben itt adja meg a vendég a nevét, telefonszámát és címét.</span></div>' +
        '<div class="co">' +
          '<div class="co__grid">' +
            '<label class="field"><span>Név</span><input value="' + DEMO_CUSTOMER.name + '" readonly aria-readonly="true"></label>' +
            '<label class="field"><span>Telefonszám</span><input value="' + DEMO_CUSTOMER.phone + '" readonly aria-readonly="true"></label>' +
          '</div>' +
          townSel +
          '<label class="field"><span>Utca, házszám</span><input value="' + DEMO_CUSTOMER.address + '" readonly aria-readonly="true"></label>' +
          '<fieldset class="fs co__pay"><legend>Fizetés a futárnál</legend><div class="opts">' +
            PAYS.map(function (p) { return '<label class="opt opt--base"><input type="radio" name="pay" value="' + p.id + '"' + (checkout.pay === p.id ? ' checked' : '') + ' data-pay><span>' + p.label + (p.verify ? ' <em class="tag">egyeztetendő</em>' : '') + '</span></label>'; }).join('') +
          '</div><p class="fs__hint" style="margin-top:8px">Online kártyás fizetés nincs a tervben — a fizetés átvételkor történik.</p></fieldset>' +
          '<label class="field"><span>Üzenet a futárnak</span><textarea class="note" maxlength="140" placeholder="pl. kapucsengő nem működik, hívjon" data-co-note>' + esc(checkout.note) + '</textarea></label>' +
        '</div>' +
        '<div class="cart__sum">' + totals + warns +
          '<div class="cart__btns">' +
            '<button type="button" class="btn btn--ink" data-send' + (canSend ? '' : ' disabled') + '>' + (S.accepting ? 'Bemutató-rendelés leadása' : 'Rendelésfelvétel szünetel') + '</button>' +
            '<button type="button" class="linkbtn" data-back>Vissza a kosárhoz</button>' +
          '</div>' +
        '</div>';
      return;
    }

    cartEl.innerHTML = head + steps + paused +
      '<ul class="cart__list">' + state.items.map(function (it, i) {
        return '<li class="ci' + (itemProblem(it) ? ' is-prob' : '') + '" data-i="' + i + '"><div class="ci__top"><span class="ci__name">' + esc(itemName(it)) + '</span><span class="lead" aria-hidden="true"></span><span class="ci__unit">' + ft(unitPrice(it)) + ' / db</span></div>' +
          modsHtml(it) +
          '<div class="ci__bot"><div class="qty qty--sm" role="group" aria-label="' + esc(itemName(it)) + ' darabszám">' +
            '<button type="button" data-cq="-1" aria-label="Eggyel kevesebb"' + (it.qty <= 1 ? ' disabled' : '') + '>' + ICON.minus + '</button><output>' + it.qty + '</output>' +
            '<button type="button" data-cq="1" aria-label="Eggyel több"' + (it.qty >= 20 || itemProblem(it) ? ' disabled' : '') + '>' + ICON.plus + '</button></div>' +
            (it.type === 'pizza' && !itemProblem(it) ? '<button type="button" class="ci__del" data-edit>Módosítás</button>' : '') +
            '<button type="button" class="ci__del" data-del>Törlés</button><span class="ci__sum">' + ft(unitPrice(it) * it.qty) + '</span></div></li>';
      }).join('') + '</ul>' +
      '<div class="cart__sum">' + townSel + totals + warns + gift +
        '<div class="cart__btns">' +
          '<button type="button" class="btn btn--ink" data-checkout' + (sub < min || blocked || !S.accepting ? ' disabled' : '') + '>' + (S.accepting ? 'Tovább a szállítási adatokhoz' : 'Rendelésfelvétel szünetel') + '</button>' +
          '<a class="btn btn--line" href="' + M.meta.phoneHref + '">' + ICON.phone + 'Inkább telefonon: ' + M.meta.phone + '</a>' +
        '</div>' +
      '</div>';
  }
  var lastOrder = null, sending = false;

  cartEl.addEventListener('click', function (e) {
    var li = e.target.closest('.ci'), t;
    if ((t = e.target.closest('[data-cq]')) && li) {
      var it = state.items[+li.getAttribute('data-i')]; if (!it) return;
      it.qty = Math.max(1, Math.min(20, it.qty + +t.getAttribute('data-cq')));
      save(); syncCount(false); CartDrawer();
      var newSum = $('.ci[data-i="' + li.getAttribute('data-i') + '"] .ci__sum', cartEl);
      anim(newSum, { opacity: [0.3, 1], y: [-4, 0] }, { duration: 0.2 });
      anim($('[data-total]', cartEl), { opacity: [0.3, 1] }, { duration: 0.2 });
    } else if (e.target.closest('[data-del]') && li) {
      if (li.dataset.removing) return; li.dataset.removing = '1';
      var idx = +li.getAttribute('data-i');
      anim(li, { opacity: [1, 0], x: [0, 24] }, { duration: 0.18 }).then(function () {
        state.items.splice(idx, 1); save(); syncCount(false); CartDrawer();
      });
    } else if (e.target.closest('[data-edit]') && li) {
      /* módosítás: a tétel visszakerül a konfigurátorba az eddigi választásokkal */
      var ei = +li.getAttribute('data-i'), item = state.items[ei]; if (!item) return;
      closeDialog(cartDlg, cartDlg, cartTo()).then(function () {
        state.items.splice(ei, 1); save(); syncCount(false);
        ProductConfigurator(item.id);
        var set = function (name, vals) { $$('input[name="' + name + '"]', cfgForm).forEach(function (x) { x.checked = vals.indexOf(x.value) > -1 && !x.disabled; }); };
        $$('input[name="base"]', cfgForm).forEach(function (x) { x.checked = x.value === item.base; });
        set('removed', item.removed); set('plusz', item.plusz); set('extra', item.extra);
        $('#cfg-note').value = item.note || '';
        cfgSetQty(item.qty);
      });
    } else if (e.target.closest('[data-checkout]')) {
      if (!S.accepting || cartBlocked()) { CartDrawer(); return; }
      view = 'checkout'; CartDrawer();
      anim($('.co', cartEl), { opacity: [0, 1], x: [16, 0] }, { duration: 0.26 });
    } else if (e.target.closest('[data-send]')) {
      if (sending) return;
      S = D.getSettings();                       // friss állapot: közben szüneteltethették
      if (!S.accepting || cartBlocked() || subtotal() < M.delivery.minimumOrder || !state.items.length) { CartDrawer(); toast(!S.accepting ? 'A rendelésfelvétel közben szünetel.' : 'A kosár közben megváltozott.'); return; }
      sending = true;
      lastOrder = saveDemoOrder();
      state.items = []; save(); syncCount(false);
      view = 'done'; CartDrawer(); sending = false;
      anim($('.done', cartEl), { opacity: [0, 1], y: [10, 0] }, { duration: 0.28 });
    } else if (e.target.closest('[data-back]')) {
      view = 'list'; CartDrawer();
    } else if (e.target.closest('[data-new]')) {
      view = 'list';
      closeDialog(cartDlg, cartDlg, cartTo()).then(function () { location.hash = '#etlap'; });
    } else if (e.target.closest('[data-goto-menu]')) {
      closeDialog(cartDlg, cartDlg, cartTo()).then(function () { location.hash = '#etlap'; });
    }
  });
  cartEl.addEventListener('input', function (e) {
    if (e.target.matches('[data-co-note]')) checkout.note = e.target.value.trim();
  });
  cartEl.addEventListener('change', function (e) {
    if (e.target.matches('[data-pay]')) checkout.pay = e.target.value;
  });
  cartEl.addEventListener('change', function (e) {
    if (e.target.matches('[data-town]')) { state.town = e.target.value; save(); CartDrawer(); anim($('[data-total]', cartEl), { opacity: [0.3, 1] }, { duration: 0.2 }); }
  });
  $$('[data-open-cart]').forEach(function (b) {
    b.addEventListener('click', function () { view = 'list'; CartDrawer(); openCartDlg(); });
  });

  /* =========================================================
     Admin → vevői oldal: szüneteltetés, várható idő, elfogyott
     ========================================================= */
  function renderEta() {
    $$('[data-eta]').forEach(function (el) { el.innerHTML = 'Várható kiszállítás most: <b>' + etaText() + '</b> <span>· ' + ETA_NOTE + '</span>'; });
    var bar = $('[data-pause-bar]'); bar.hidden = S.accepting;
    $$('[data-eta]').forEach(function (el) { el.hidden = !S.accepting; });
  }
  function onShared(what) {
    if (what === 'settings') {
      S = D.getSettings(); renderSoldOut(); renderEta(); refreshCfg();
      if (cartDlg.open && view !== 'done') CartDrawer();
    }
    if (what === 'orders' && cartDlg.open && view === 'done' && lastOrder) {
      var live = $('[data-live]', cartEl);
      if (live) { live.innerHTML = liveStatusHtml(lastOrder.no); anim(live, { opacity: [0.4, 1] }, { duration: 0.3 }); }
    }
  }
  D.subscribe(onShared);
  /* tartalék: ha a fül háttérben volt, visszatéréskor újraolvasunk */
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { onShared('settings'); onShared('orders'); } });
  renderEta();

  /* =========================================================
     Eredeti étlap nézet
     ========================================================= */
  var origDlg = $('#orig');
  var openOrig = wireDialog(origDlg, function () { return origDlg; }, function () { return { opacity: [0, 1], y: [14, 0] }; }, function () { return { opacity: [1, 0] }; });
  $('[data-open-original]').addEventListener('click', openOrig);

  /* =========================================================
     Header: mobilmenü, sticky állapot, aktív szakasz
     ========================================================= */
  var hdr = $('#hdr'), burger = $('[data-burger]'), mnav = $('#mnav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    lock(open);
    if (open) {
      var top = hdr.getBoundingClientRect().bottom;
      mnav.style.top = Math.max(0, top) + 'px';
      mnav.hidden = false;
      anim($$('nav a', mnav), { opacity: [0, 1], y: [10, 0] }, { duration: 0.28, delay: CAN_ANIM ? MO.stagger(0.04) : 0 });
      $('nav a', mnav).focus();
    } else {
      mnav.hidden = true;
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1000 && !mnav.hidden) setMenu(false); });

  var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 4); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.hdr__nav a');
    var secIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.classList.contains('hero') ? 'fooldal' : en.target.id;
        navLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['etlap', 'hazhozszallitas', 'kapcsolat'].forEach(function (id) { secIO.observe(document.getElementById(id)); });
    secIO.observe($('.hero'));

    var cats = $$('[data-cat-link]');
    var catIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute('data-cat-sec');
        cats.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-cat-link') === id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    [[listEl, 'pizzak'], [$('#feltetek'), 'feltetek'], [$('#uditok'), 'uditok']].forEach(function (x) { x[0].setAttribute('data-cat-sec', x[1]); catIO.observe(x[0]); });
  }

  /* =========================================================
     Belépő és görgetésre megjelenő mozgás (Motion)
     ========================================================= */
  var root = document.documentElement;
  function finishIntro() { root.classList.add('anim-ok'); root.classList.remove('anim'); }
  if (CAN_ANIM && root.classList.contains('anim')) {
    var ins = $$('.a-in'), plates = $$('.a-plate');
    Promise.all([
      anim(ins, { opacity: [0, 1], y: [14, 0] }, { duration: 0.6, delay: MO.stagger(0.07) }),
      anim(plates, { opacity: [0, 1], scale: [0.96, 1] }, { duration: 0.7, delay: MO.stagger(0.12, { startDelay: 0.15 }) })
    ]).then(function () {
      finishIntro();
      ins.concat(plates).forEach(function (el) { el.style.opacity = ''; el.style.transform = ''; });
    });
    var reveal = $$('.facts li, .sec-head, .menu__lower > section, .deliv__head, .zones, .deliv__info, .contact__main, .contact__side');
    reveal.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.style.opacity = '0';
      MO.inView(el, function () {
        anim(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.55 });
      }, { amount: 0.15 });
    });
  } else {
    finishIntro();
  }
})();
