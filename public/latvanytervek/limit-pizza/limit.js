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
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && Array.isArray(saved.items)) state = saved;
  } catch (e) {}
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

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
    var media = p.photo
      ? '<span class="pi__media pi__media--photo"><img src="img/' + p.photo + '-360.webp" width="360" height="360" loading="lazy" alt=""><span class="pi__photono">' + p.no + '</span></span>'
      : '<span class="pi__media" aria-hidden="true"><span class="pi__no">' + p.no + '</span></span>';
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

  $('[data-topping-groups]').innerHTML = M.toppingGroups.map(function (g) {
    return '<div class="tg"><div class="tg__line"><span class="tg__name">' + g.name + '</span><span class="lead" aria-hidden="true"></span><span class="tg__price">' + ft(g.price) + '</span></div>' +
      '<p class="tg__items">' + g.items.join(' / ') + '</p></div>';
  }).join('');
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

  function ProductConfigurator(id) {
    var p = byId(id);
    var removable = p.ingredients.filter(function (i) { return i !== 'paradicsomszósz'; });
    var media = p.photo
      ? '<figure class="cfg__media"><img class="cfg__photo" src="img/' + p.photo + '-720.webp" width="720" height="720" alt="' + esc(M.photos[p.photo].alt) + '"><figcaption>Saját fotó a Limit Pizza konyhájából</figcaption></figure>'
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
          PLUSZ.items.map(function (i) { return opt('checkbox', 'plusz', i, i); }).join('') +
        '</div></fieldset>' +

        '<fieldset class="fs"><legend>Extra feltétek <em>+' + ft(EXTRA.price) + ' / db</em></legend><div class="opts">' +
          EXTRA.items.map(function (i) { return opt('checkbox', 'extra', i, i + (p.ingredients.indexOf(i) > -1 || (i === 'feta sajt' && p.ingredients.indexOf('feta') > -1) || (i === 'trappista sajt' && p.ingredients.indexOf('trappista') > -1) ? ' <small>még egy adag</small>' : '')); }).join('') +
        '</div></fieldset>' +

        '<fieldset class="fs"><legend>Megjegyzés a konyhának</legend>' +
          '<label class="sr" for="cfg-note">Megjegyzés</label><textarea id="cfg-note" class="note" name="note" maxlength="140" placeholder="pl. jól átsütve, félbevágva"></textarea>' +
        '</fieldset>' +
      '</div></div>' +
      '<div class="cfg__foot">' +
        '<div class="qty" role="group" aria-label="Darabszám"><button type="button" data-q="-1" aria-label="Eggyel kevesebb">' + ICON.minus + '</button><output aria-live="polite" data-qv>1</output><button type="button" data-q="1" aria-label="Eggyel több">' + ICON.plus + '</button></div>' +
        '<button type="button" class="btn btn--ink cfg__add" data-cfg-add><span>Kosárba</span><span class="sum" data-sum>' + ft(p.price) + '</span></button>' +
      '</div>';

    var qty = 1;
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
        var it = read();
        addItem(it);
        closeDialog(cfgDlg, cfgDlg, cfgTo()).then(function () {
          toast(qty + ' × ' + cap(p.name) + ' a kosárban');
        });
      }
    };
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
    if (it.extra.length) out.push('<li>Extra: <b>' + it.extra.map(esc).join(', ') + '</b> (' + it.extra.length + ' × ' + ft(EXTRA.price) + ')</li>');
    if (it.note) out.push('<li>Megjegyzés: „' + esc(it.note) + '”</li>');
    return out.length ? '<ul class="ci__mods">' + out.join('') + '</ul>' : '';
  }
  function itemName(it) {
    if (it.type === 'drink') { var d = drinkById(it.id); return d.name + ' ' + d.volume; }
    return byId(it.id).name;
  }
  function slipText() {
    var lines = ['LIMIT PIZZA — rendelési lista (bemutató)', ''];
    state.items.forEach(function (it) {
      lines.push(it.qty + ' × ' + (it.type === 'pizza' ? byId(it.id).no + '. ' + cap(byId(it.id).name) : itemName(it)) + ' — ' + ft(unitPrice(it) * it.qty));
      if (it.type === 'pizza') {
        var b = M.bases.find(function (x) { return x.id === it.base; });
        if (b && !b.default) lines.push('   alap: ' + b.name.toLowerCase());
        if (it.removed.length) lines.push('   nélküle: ' + it.removed.join(', '));
        if (it.plusz.length) lines.push('   plusz: ' + it.plusz.join(', '));
        if (it.extra.length) lines.push('   extra: ' + it.extra.join(', '));
        if (it.note) lines.push('   megjegyzés: ' + it.note);
      }
    });
    lines.push('', 'Település: ' + state.town, 'Részösszeg: ' + ft(subtotal()), 'Kiszállítás: ' + (fee() ? ft(fee()) : 'ingyenes'), 'Összesen: ' + ft(subtotal() + fee()));
    return lines.join('\n');
  }

  function CartDrawer() {
    var head = '<div class="cart__head"><div><h2 id="cart-cim">Kosár</h2><p>Rendelési lista a telefonos rendeléshez</p></div>' +
      '<button type="button" class="xbtn" data-close aria-label="Kosár bezárása">' + ICON.x + '</button></div>';

    if (view === 'done') {
      cartEl.innerHTML = head +
        '<div class="done">' +
          '<span class="done__badge">Bemutató</span>' +
          '<h3>Valódi rendelés nem történt.</h3>' +
          '<p>Ez egy látványterv, a kosár semmit nem küld el. A Limit Pizzánál telefonon lehet rendelni — ezt a listát elég bediktálni:</p>' +
          '<pre class="slip" data-slip>' + esc(slipText()) + '</pre>' +
          '<a class="btn btn--red" href="' + M.meta.phoneHref + '">' + ICON.phone + 'Hívás: ' + M.meta.phone + '</a>' +
          '<button type="button" class="btn btn--line" data-copy>Lista másolása</button>' +
          '<button type="button" class="linkbtn" data-back>Vissza a kosárhoz</button>' +
        '</div>';
      return;
    }

    if (!state.items.length) {
      cartEl.innerHTML = head +
        '<div class="cart__demo"><span><b>Bemutató.</b> A kosár nem küld rendelést — rendelni telefonon lehet.</span></div>' +
        '<div class="cart__empty"><img src="img/logo-160.webp" width="160" height="160" alt=""><p>A kosár még üres. Válassz az étlapról, és itt összeáll a rendelésed.</p>' +
        '<button type="button" class="btn btn--ink btn--sm" data-goto-menu>Étlap</button></div>';
      return;
    }

    var sub = subtotal(), f = fee(), pc = pizzaCount(), min = M.delivery.minimumOrder;
    var gift = '';
    if (pc >= M.delivery.gift.pizzaCount) gift = '<p class="warn warn--gift">5 pizza egy nyugtán: ajándék ' + M.delivery.gift.item + ' jár.</p>';
    else if (pc >= 3) gift = '<p class="warn warn--gift">Még ' + (M.delivery.gift.pizzaCount - pc) + ' pizza, és ajándék ' + M.delivery.gift.item + ' jár.</p>';

    cartEl.innerHTML = head +
      '<div class="cart__demo"><span><b>Bemutató.</b> A kosár nem küld rendelést — rendelni telefonon lehet.</span></div>' +
      '<ul class="cart__list">' + state.items.map(function (it, i) {
        return '<li class="ci" data-i="' + i + '"><div class="ci__top"><span class="ci__name">' + esc(itemName(it)) + '</span><span class="lead" aria-hidden="true"></span><span class="ci__unit">' + ft(unitPrice(it)) + ' / db</span></div>' +
          modsHtml(it) +
          '<div class="ci__bot"><div class="qty qty--sm" role="group" aria-label="' + esc(itemName(it)) + ' darabszám">' +
            '<button type="button" data-cq="-1" aria-label="Eggyel kevesebb"' + (it.qty <= 1 ? ' disabled' : '') + '>' + ICON.minus + '</button><output>' + it.qty + '</output>' +
            '<button type="button" data-cq="1" aria-label="Eggyel több"' + (it.qty >= 20 ? ' disabled' : '') + '>' + ICON.plus + '</button></div>' +
            '<button type="button" class="ci__del" data-del>Törlés</button><span class="ci__sum">' + ft(unitPrice(it) * it.qty) + '</span></div></li>';
      }).join('') + '</ul>' +
      '<div class="cart__sum">' +
        '<label class="field"><span>Település</span><select data-town>' +
          M.delivery.zones.map(function (z) { return z.towns.map(function (t) { return '<option value="' + t + '"' + (t === state.town ? ' selected' : '') + '>' + t + ' — ' + (z.fee ? ft(z.fee) + ' kiszállítás' : 'ingyenes kiszállítás') + '</option>'; }).join(''); }).join('') +
        '</select></label>' +
        '<div class="rows"><div><span>Részösszeg</span><span>' + ft(sub) + '</span></div><div><span>Kiszállítás</span><span>' + (f ? ft(f) : 'ingyenes') + '</span></div>' +
        '<div class="tot"><span>Összesen</span><span data-total>' + ft(sub + f) + '</span></div></div>' +
        (sub < min ? '<p class="warn warn--min">A minimum rendelés ' + ft(min) + ' — még ' + ft(min - sub) + ' hiányzik.</p>' : '') + gift +
        '<div class="cart__btns">' +
          '<button type="button" class="btn btn--ink" data-finish' + (sub < min ? ' disabled' : '') + '>Rendelés lezárása · bemutató</button>' +
          '<a class="btn btn--line" href="' + M.meta.phoneHref + '">' + ICON.phone + 'Hívás: ' + M.meta.phone + '</a>' +
        '</div>' +
      '</div>';
  }

  cartEl.addEventListener('click', function (e) {
    var li = e.target.closest('.ci'), t;
    if ((t = e.target.closest('[data-cq]')) && li) {
      var it = state.items[+li.getAttribute('data-i')];
      it.qty = Math.max(1, Math.min(20, it.qty + +t.getAttribute('data-cq')));
      save(); syncCount(false); CartDrawer();
      var newSum = $('.ci[data-i="' + li.getAttribute('data-i') + '"] .ci__sum', cartEl);
      anim(newSum, { opacity: [0.3, 1], y: [-4, 0] }, { duration: 0.2 });
      anim($('[data-total]', cartEl), { opacity: [0.3, 1] }, { duration: 0.2 });
    } else if (e.target.closest('[data-del]') && li) {
      var idx = +li.getAttribute('data-i');
      anim(li, { opacity: [1, 0], x: [0, 24] }, { duration: 0.18 }).then(function () {
        state.items.splice(idx, 1); save(); syncCount(false); CartDrawer();
      });
    } else if (e.target.closest('[data-finish]')) {
      view = 'done'; CartDrawer();
      anim($('.done', cartEl), { opacity: [0, 1], y: [10, 0] }, { duration: 0.28 });
    } else if (e.target.closest('[data-back]')) {
      view = 'list'; CartDrawer();
    } else if (e.target.closest('[data-copy]')) {
      var txt = slipText();
      var done = function () { toast('Lista a vágólapon'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { toast('A másolás nem sikerült — jelöld ki a listát.'); });
      else toast('A másolás itt nem érhető el — jelöld ki a listát.');
    } else if (e.target.closest('[data-goto-menu]')) {
      closeDialog(cartDlg, cartDlg, cartTo()).then(function () { location.hash = '#etlap'; });
    }
  });
  cartEl.addEventListener('change', function (e) {
    if (e.target.matches('[data-town]')) { state.town = e.target.value; save(); CartDrawer(); anim($('[data-total]', cartEl), { opacity: [0.3, 1] }, { duration: 0.2 }); }
  });
  $$('[data-open-cart]').forEach(function (b) {
    b.addEventListener('click', function () { view = 'list'; CartDrawer(); openCartDlg(); });
  });

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
