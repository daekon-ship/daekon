/* MultiCont Center — kezelőfelület (LÁTVÁNYTERV)
   Semmit nem ment: minden művelet csak a böngészőben, az oldal újratöltéséig látszik.
   Éles változathoz szerveroldali hitelesítés, jogosultság, naplózás, tárolás kell. */
(function () {
  'use strict';
  var d = document, MC = window.MC || {};
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var esc = function (t) { var x = d.createElement('div'); x.textContent = t == null ? '' : String(t); return x.innerHTML; };
  var dShort = function (s) { if (!s) return '–'; var p = s.split('-'); return p[0] + '. ' + p[1] + '. ' + p[2] + '.'; };
  var now = new Date(), TODAY = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  var ss = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
  var toastEl = $('#toast');
  function toast(t) { if (!toastEl) return; toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.hidden = true; }, 3800); }
  var DEMO = ' (látványterv – nem mentődik)';
  function field(el, msg) { var b = el.closest('.f') || el.closest('.check'); if (b) { b.classList.toggle('err', !!msg); var m = $('.msg', b); if (m) m.textContent = msg || ''; } el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }

  /* ---------- Belépés (folyamat-bemutató, NEM hitelesítés) ---------- */
  var login = $('#login');
  if (login) {
    var s1 = $('#step1'), s2 = $('#step2');
    login.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!s1.hidden) {
        var ok = field($('#l-mail'), /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#l-mail').value.trim()) ? '' : 'Adjon meg egy e-mail-címet.');
        ok = field($('#l-pw'), $('#l-pw').value.length >= 8 ? '' : 'A jelszó legalább 8 karakter.') && ok;
        if (ok) { s1.hidden = true; s2.hidden = false; $('#l-code').focus(); }
      } else {
        if (!field($('#l-code'), /^\d{6}$/.test($('#l-code').value.trim()) ? '' : 'A kód 6 számjegy.')) return;
        ss.set('mc-admin-demo', '1');
        var v = new URLSearchParams(location.search).get('vissza') || 'admin.html';
        location.href = /^admin[a-z-]*\.html(#[a-z-]+)?$/.test(v) ? v : 'admin.html';
      }
    });
    return;
  }

  /* ---------- Keret ---------- */
  var side = $('#adm-side'), bg = $('#adm-burger');
  if (bg) bg.addEventListener('click', function () { var o = !side.classList.contains('open'); side.classList.toggle('open', o); bg.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && side && side.classList.contains('open')) { side.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); bg.focus(); } });
  var out = $('#adm-out'); if (out) out.addEventListener('click', function () { ss.del('mc-admin-demo'); location.href = 'admin-belepes.html'; });
  d.addEventListener('click', function (e) { var b = e.target.closest('[data-demo]'); if (b) toast(b.getAttribute('data-demo') + DEMO); });

  var cikkek = (MC.cikkek || []).slice().sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
  var docs = (MC.dokumentumok || []).slice();
  var partners = (MC.partnerek || []).map(function (p) { return Object.assign({}, p); });
  var offers = (MC.ajanlatok || []).map(function (o) { return Object.assign({}, o); });
  var pName = function (id) { for (var i = 0; i < partners.length; i++) if (partners[i].id === id) return partners[i].nev; return id; };
  var st = function (cls, t) { return '<span class="tag ' + cls + '">' + t + '</span>'; };

  /* ---------- Áttekintés ---------- */
  var kp = $('#kpis');
  if (kp) {
    var mods = $$('.adm-mod'), main = $('#m-attekintes');
    var showMod = function () {
      var h = location.hash.slice(1), m = h && $('#m-' + h);
      main.hidden = !!m; mods.forEach(function (x) { x.hidden = x !== m; });
      $$('.adm-nav a').forEach(function (a) { var href = a.getAttribute('href'); a.setAttribute('aria-current', (m ? href === 'admin.html#' + h : href === 'admin.html') ? 'page' : 'false'); });
      $('.adm-h h1').textContent = m ? $('h2', m).textContent : 'Áttekintés';
      if (side) side.classList.remove('open');
    };
    addEventListener('hashchange', showMod); showMod();
    var pend = partners.filter(function (p) { return p.allapot === 'fuggo'; }).length + offers.filter(function (o) { return o.allapot === 'fuggo'; }).length;
    var expired = offers.filter(function (o) { return o.lejarat < TODAY; }).length;
    kp.innerHTML = [[cikkek.length, 'közzétett cikk'], [docs.filter(function (x) { return x.statusz !== 'archiv'; }).length, 'aktív dokumentum'], [pend, 'jóváhagyásra vár'], [offers.filter(function (o) { return o.allapot === 'jovahagyva' && o.lejarat >= TODAY; }).length, 'érvényes kupon']]
      .map(function (k) { return '<div class="kpi"><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('');
    $('#todo').innerHTML = [
      ['Partnerjelentkezés és ajánlat jóváhagyása', pend + ' tétel', 'admin-partnerek.html#jovahagyas'],
      ['Lejárt kupon archiválása', expired + ' db', 'admin-partnerek.html#ajanlatok'],
      ['Ügyféladatlap jóváhagyása (minta)', 'v0.9', 'admin-dokumentumok.html'],
      ['Mintapartnerek cseréje valódira', partners.length + ' minta', 'admin-partnerek.html'],
      ['Adókulcsok ellenőrzése jövő évre', '2027', 'admin.html#kalkulatorok']
    ].map(function (t) { return '<li><a href="' + t[2] + '">' + esc(t[0]) + '</a><span class="tag n">' + esc(t[1]) + '</span></li>'; }).join('');
    $('#recent').innerHTML = '<thead><tr><th>Cím</th><th>Téma</th><th>Közzétéve</th><th>Állapot</th></tr></thead><tbody>' + cikkek.slice(0, 5).map(function (a) {
      return '<tr><td><b>' + esc(a.cim) + '</b></td><td>' + esc(a.temak[0]) + '</td><td>' + dShort(a.datum) + '</td><td>' + (a.tervezet ? st('demo', 'Tervezetről') : st('live t', 'Közzétéve')) + '</td></tr>';
    }).join('') + '</tbody>';
  }

  /* ---------- Cikkek ---------- */
  var at = $('#ac-tbl');
  if (at) {
    var sel = $('#ac-st'), edT = $('#ed-tema'), cur = null;
    edT.innerHTML = '<option value="">Válasszon…</option>' + (MC.temak || []).map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('');
    var drawA = function () {
      var f = sel.value;
      at.innerHTML = '<thead><tr><th>Cím</th><th>Témák</th><th>Közzétéve</th><th>Ellenőrizve</th><th>Állapot</th><th></th></tr></thead><tbody>' + cikkek.filter(function (a) {
        return !f || (f === 'tervezet' ? a.tervezet : f === 'piszkozat' ? a.statusz === 'piszkozat' : a.statusz === 'kozzeteve');
      }).map(function (a) {
        var s = a.statusz === 'piszkozat' ? st('n', 'Piszkozat') : a.tervezet ? st('demo', 'Közzétéve · tervezetről') : st('live t', 'Közzétéve');
        return '<tr><td><b>' + esc(a.cim) + '</b><br><span class="muted small">' + a.forrasok.length + ' forrás</span></td><td>' + a.temak.map(esc).join(', ') + '</td><td>' + dShort(a.datum) + '</td><td>' + dShort(a.frissitve) + '</td><td>' + s + '</td>' +
          '<td class="a-act"><button class="btn btn-o btn-s" type="button" data-edit="' + esc(a.id) + '">Szerkesztés</button>' + (a.statusz === 'piszkozat' ? '' : '<a class="btn btn-o btn-s" href="cikk.html?id=' + encodeURIComponent(a.id) + '" target="_blank" rel="noopener">Megnézem</a>') + '</td></tr>';
      }).join('') + '</tbody>';
    };
    sel.addEventListener('change', drawA); drawA();
    var F = { cim: $('#ed-cim'), tema: edT, hataly: $('#ed-hataly'), lead: $('#ed-lead'), body: $('#ed-body'), src: $('#ed-src'), url: $('#ed-url'), terv: $('#ed-terv'), kiem: $('#ed-kiemelt') };
    var prev = function () {
      var paras = F.body.value.split(/\n+/).filter(function (x) { return x.trim(); });
      $('#pv').innerHTML = '<p class="eyebrow">' + esc(F.tema.value || 'Téma') + '</p><h1>' + esc(F.cim.value || 'A cikk címe') + '</h1>' +
        '<p class="scope' + (F.terv.checked ? ' plan' : '') + '" style="font-size:13.5px"><span><b>Időszak:</b> ' + esc(F.hataly.value || '–') + '</span></p>' +
        '<div class="abody" style="margin-top:14px">' + (F.lead.value ? '<p>' + esc(F.lead.value) + '</p>' : '') + paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
        '<div class="sources" style="margin-top:16px;padding:12px 14px"><h2>Források</h2>' + (F.src.value ? '<p style="margin-top:6px;font-size:14px">' + esc(F.src.value) + '<br><span class="muted small">' + esc(F.url.value) + '</span></p>' : '<p class="muted small" style="margin-top:6px">Forrás nélkül nem tehető közzé.</p>') + '</div>';
    };
    Object.keys(F).forEach(function (k) { F[k].addEventListener('input', prev); F[k].addEventListener('change', prev); });
    $('#ed-prev').addEventListener('click', function () { prev(); toast('Előnézet frissítve.'); });
    at.addEventListener('click', function (e) {
      var b = e.target.closest('[data-edit]'); if (!b) return;
      cur = cikkek.filter(function (a) { return a.id === b.getAttribute('data-edit'); })[0]; if (!cur) return;
      F.cim.value = cur.cim; F.tema.value = cur.temak[0]; F.hataly.value = cur.hataly; F.lead.value = cur.osszefoglalo; F.body.value = cur.torzs.join('\n');
      F.src.value = cur.forrasok[0].nev; F.url.value = cur.forrasok[0].url; F.terv.checked = !!cur.tervezet; F.kiem.checked = !!cur.kiemelt;
      $('#ed-title').textContent = 'Szerkesztés: ' + cur.cim; $('#ed-state').textContent = cur.statusz === 'piszkozat' ? 'Piszkozat' : 'Közzétéve';
      prev(); $('#uj').scrollIntoView({ behavior: 'smooth' });
    });
    var validate = function (full) {
      var ok = field(F.cim, F.cim.value.trim().length >= 8 ? '' : 'Adjon meg címet (min. 8 karakter).');
      if (!full) return ok;
      ok = field(F.tema, F.tema.value ? '' : 'Válasszon témát.') && ok;
      ok = field(F.hataly, F.hataly.value.trim() ? '' : 'Írja be, melyik időszakra vonatkozik.') && ok;
      ok = field(F.lead, F.lead.value.trim().length >= 20 ? '' : 'Az összefoglaló legalább 20 karakter.') && ok;
      ok = field(F.body, F.body.value.trim().length >= 40 ? '' : 'A szöveg túl rövid.') && ok;
      ok = field(F.src, F.src.value.trim() ? '' : 'Forrás nélkül nem tehető közzé.') && ok;
      ok = field(F.url, /^https:\/\/\S+\.\S+/.test(F.url.value.trim()) ? '' : 'Adjon meg https:// kezdetű forráscímet.') && ok;
      return ok;
    };
    $('#ed-save').addEventListener('click', function () { if (!validate(false)) return F.cim.focus(); $('#ed-state').textContent = 'Piszkozat'; toast('Piszkozat mentve' + DEMO); });
    $('#ed').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(true)) { var bad = $('#ed [aria-invalid="true"]'); if (bad) bad.focus(); return; }
      var rec = { id: cur ? cur.id : 'uj-' + Date.now(), cim: F.cim.value.trim(), temak: [F.tema.value], hataly: F.hataly.value.trim(), osszefoglalo: F.lead.value.trim(), torzs: F.body.value.split(/\n+/).filter(Boolean),
        forrasok: [{ nev: F.src.value.trim(), url: F.url.value.trim(), datum: dShort(TODAY) }], datum: cur ? cur.datum : TODAY, frissitve: TODAY, statusz: 'kozzeteve', tervezet: F.terv.checked, kiemelt: F.kiem.checked };
      if (cur) cikkek[cikkek.indexOf(cur)] = rec; else cikkek.unshift(rec);
      cur = rec; drawA(); $('#ed-state').textContent = 'Közzétéve';
      toast('Közzétéve' + DEMO);
    });
    prev();
  }

  /* ---------- Dokumentumok ---------- */
  var dt = $('#ad-tbl');
  if (dt) {
    var arch = $('#ad-arch'), upK = $('#up-kat');
    upK.innerHTML = '<option value="">Válasszon…</option>' + (MC.dokKategoriak || []).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
    var drawD = function () {
      dt.innerHTML = '<thead><tr><th>Megnevezés</th><th>Kategória</th><th>Verzió</th><th>Dátum</th><th>Állapot</th><th></th></tr></thead><tbody>' + docs.filter(function (x) { return arch.checked || x.statusz !== 'archiv'; }).map(function (x) {
        var i = docs.indexOf(x), s = x.statusz === 'archiv' ? st('n', 'Archivált') : x.statusz === 'minta' ? st('demo', 'Jóváhagyásra vár') : st('live t', 'Nyilvános');
        var pdf = x.tipus === 'pdf';
        return '<tr class="' + (x.statusz === 'archiv' ? 'off' : '') + '"><td><b>' + esc(x.cim) + '</b><br><span class="muted small">' + (pdf ? 'PDF' : 'Külső hivatkozás') + '</span></td><td>' + esc(x.kategoria) + '</td><td>' + (pdf ? 'v' + esc(x.verzio) : '–') + '</td><td>' + dShort(x.datum) + '</td><td>' + s + '</td>' +
          '<td class="a-act">' + (pdf && x.statusz !== 'archiv' ? '<button class="btn btn-o btn-s" type="button" data-ver="' + i + '">Új verzió</button>' : '') +
          '<button class="btn btn-o btn-s" type="button" data-arch="' + i + '">' + (x.statusz === 'archiv' ? 'Visszaállítás' : 'Archiválás') + '</button></td></tr>';
      }).join('') + '</tbody>';
    };
    arch.addEventListener('change', drawD); drawD();
    dt.addEventListener('click', function (e) {
      var a = e.target.closest('[data-arch]'), v = e.target.closest('[data-ver]');
      if (a) { var x = docs[+a.getAttribute('data-arch')]; x.statusz = x.statusz === 'archiv' ? 'aktiv' : 'archiv'; drawD(); toast((x.statusz === 'archiv' ? 'Archiválva' : 'Visszaállítva') + DEMO); }
      if (v) {
        var y = docs[+v.getAttribute('data-ver')], n = (y.verzio || '1.0').split('.');
        $('#up-cim').value = y.cim; upK.value = y.kategoria; $('#up-ver').value = n[0] + '.' + ((+n[1] || 0) + 1); $('#up-desc').value = y.leiras;
        $('#up-title').textContent = 'Új verzió: ' + y.cim; $('#feltoltes').scrollIntoView({ behavior: 'smooth' }); $('#up-file').focus();
      }
    });
    $('#up').addEventListener('reset', function () { $('#up-title').textContent = 'Dokumentum feltöltése'; $$('#up .err').forEach(function (b) { b.classList.remove('err'); }); });
    $('#up').addEventListener('submit', function (e) {
      e.preventDefault();
      var file = $('#up-file').files[0];
      var ok = field($('#up-file'), !file ? 'Válasszon fájlt.' : !/\.pdf$/i.test(file.name) ? 'Csak PDF tölthető fel.' : file.size > 10485760 ? 'A fájl nagyobb 10 MB-nál.' : '');
      ok = field($('#up-cim'), $('#up-cim').value.trim().length >= 4 ? '' : 'Adjon meg megnevezést.') && ok;
      ok = field(upK, upK.value ? '' : 'Válasszon kategóriát.') && ok;
      ok = field($('#up-ver'), /^\d+\.\d+$/.test($('#up-ver').value.trim()) ? '' : 'Formátum: 1.0') && ok;
      ok = field($('#up-ok'), $('#up-ok').checked ? '' : 'Csak jóváhagyott, nyilvános dokumentum tölthető fel.') && ok;
      if (!ok) return;
      var t = $('#up-cim').value.trim();
      docs.forEach(function (x) { if (x.cim === t && x.statusz !== 'archiv') x.statusz = 'archiv'; });
      docs.unshift({ cim: t, kategoria: upK.value, tipus: 'pdf', fajl: '', verzio: $('#up-ver').value.trim(), datum: TODAY, statusz: 'aktiv', leiras: $('#up-desc').value.trim() });
      drawD(); $('#up').reset(); toast('Feltöltve, az előző verzió archiválva' + DEMO);
    });
  }

  /* ---------- Partnerek, ajánlatok ---------- */
  var pt = $('#ap-tbl');
  if (pt) {
    var drawP = function () {
      var q = partners.filter(function (p) { return p.allapot === 'fuggo'; }).map(function (p) { return { k: 'p', o: p }; })
        .concat(offers.filter(function (o) { return o.allapot === 'fuggo'; }).map(function (o) { return { k: 'o', o: o }; }));
      $('#ap-queue').innerHTML = q.length ? q.map(function (x, i) {
        var o = x.o;
        return '<div class="qi"><span class="plogo">' + (x.k === 'p' ? esc(o.rov) : '%') + '</span><span><b>' + esc(x.k === 'p' ? o.nev : o.cim) + '</b><small>' + (x.k === 'p' ? 'Partnerjelentkezés · ' + esc(o.kategoria) : 'Kupon · ' + esc(pName(o.partner)) + ' · ' + esc(o.kod) + ' · lejár ' + dShort(o.lejarat)) + '</small></span>' +
          '<span class="acts"><button class="btn btn-p btn-s" type="button" data-ok="' + x.k + ':' + i + '">Jóváhagyás</button><button class="btn btn-o btn-s" type="button" data-no="' + x.k + ':' + i + '">Elutasítás</button></span></div>';
      }).join('') : '<p class="muted">Nincs jóváhagyásra váró tétel.</p>';
      $('#ap-queue')._q = q;
      pt.innerHTML = '<thead><tr><th>Partner</th><th>Kategória</th><th>Állapot</th><th>Kiemelt</th><th></th></tr></thead><tbody>' + partners.map(function (p) {
        var s = p.allapot === 'jovahagyva' ? st('live t', 'Nyilvános') : p.allapot === 'elutasitva' ? st('n', 'Elutasítva') : st('demo', 'Jóváhagyásra vár');
        return '<tr><td><b>' + esc(p.nev) + '</b>' + (p.minta ? ' <span class="tag demo">Minta</span>' : '') + '</td><td>' + esc(p.kategoria) + '</td><td>' + s + '</td><td>' + (p.kiemelt ? 'Igen' : '–') + '</td><td class="a-act">' + (p.allapot === 'jovahagyva' ? '<a class="btn btn-o btn-s" href="partner.html?id=' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener">Megnézem</a>' : '') + '<button class="btn btn-o btn-s" type="button" data-demo="Partneradatok szerkesztése">Szerkesztés</button></td></tr>';
      }).join('') + '</tbody>';
      $('#ao-tbl').innerHTML = '<thead><tr><th>Ajánlat</th><th>Partner</th><th>Kód</th><th>Lejárat</th><th>Állapot</th></tr></thead><tbody>' + offers.map(function (o) {
        var s = o.allapot === 'fuggo' ? st('demo', 'Jóváhagyásra vár') : o.allapot === 'elutasitva' ? st('n', 'Elutasítva') : o.lejarat < TODAY ? st('n', 'Lejárt – nem látszik') : st('live t', 'Érvényes');
        return '<tr class="' + (o.lejarat < TODAY ? 'off' : '') + '"><td><b>' + esc(o.cim) + '</b></td><td>' + esc(pName(o.partner)) + '</td><td><code>' + esc(o.kod) + '</code></td><td>' + dShort(o.lejarat) + '</td><td>' + s + '</td></tr>';
      }).join('') + '</tbody>';
      $('#ao-p').innerHTML = '<option value="">Válasszon…</option>' + partners.filter(function (p) { return p.allapot === 'jovahagyva'; }).map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nev) + '</option>'; }).join('');
    };
    drawP();
    $('#ap-queue').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ok],[data-no]'); if (!b) return;
      var okk = b.hasAttribute('data-ok'), key = (b.getAttribute('data-ok') || b.getAttribute('data-no')).split(':'), x = $('#ap-queue')._q[+key[1]];
      x.o.allapot = okk ? 'jovahagyva' : 'elutasitva'; drawP(); toast((okk ? 'Jóváhagyva' : 'Elutasítva') + DEMO);
    });
    var lej = $('#ao-lej'); lej.min = TODAY;
    $('#ao').addEventListener('submit', function (e) {
      e.preventDefault();
      var kod = $('#ao-kod').value.trim().toUpperCase();
      var ok = field($('#ao-p'), $('#ao-p').value ? '' : 'Válasszon partnert.');
      ok = field($('#ao-cim'), $('#ao-cim').value.trim().length >= 5 ? '' : 'Írja le az ajánlatot.') && ok;
      ok = field($('#ao-kod'), !/^[A-Z0-9-]{4,20}$/.test(kod) ? '4–20 karakter: nagybetű, szám, kötőjel.' : offers.some(function (o) { return o.kod === kod; }) ? 'Ez a kód már létezik.' : '') && ok;
      ok = field(lej, !lej.value ? 'Adjon meg lejáratot.' : lej.value < TODAY ? 'A lejárat nem lehet múltbeli.' : '') && ok;
      if (!ok) return;
      offers.unshift({ partner: $('#ao-p').value, cim: $('#ao-cim').value.trim(), leiras: '', kod: kod, lejarat: lej.value, allapot: 'fuggo' });
      drawP(); $('#ao').reset(); toast('Kupon létrehozva, jóváhagyásra vár' + DEMO);
    });
  }
})();
