/* Vályog-Mester · DAEKON 2026 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const mqMobile = matchMedia('(max-width: 900px)');

  /* ================= KONFIGURÁCIÓ =================
     Az ajánlatkérő végpontja a <form data-endpoint="…"> attribútumból jön.
     Az előnézetben nincs beállítva → ELŐNÉZETI MÓD: semmit nem küld, és ezt ki is írja.
     Az éles build (_forras/build_eles.py) állítja be: data-endpoint="api/ajanlat.php". */
  const formEl = document.getElementById('wiz');
  const KULDES = { endpoint: (formEl && formEl.dataset.endpoint) || null, timeout: 60000 };
  const EMAIL = 'valyog.mester@gmail.com';
  const TEL = '+36 30 966 9528', TEL_HREF = 'tel:+36309669528';

  /* ================= SZÉTBONTOTT CÍMEK ================= */
  $$('.split').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  /* ================= MEGJELENÉS GÖRGETÉSRE ================= */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('.reveal, .reveal-img, .split').forEach(el => {
    if (el.closest('.hero')) return; // a hero saját idővonalat kap
    motion ? io.observe(el) : el.classList.add('is-in');
  });

  /* ================= FEJLÉC, HALADÁSJELZŐ ================= */
  const nav = $('#nav'), bar = $('.progress span'), hero = $('.hero');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    const past = y > hero.offsetHeight - 90;
    nav.classList.add('is-solid');            // világos nyitókép: a fejléc végig sötét szövegű
    nav.classList.remove('is-top');
    nav.classList.toggle('is-hidden', past && y > lastY + 4 && y > 900 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ================= MENÜ ================= */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false; nav.classList.remove('is-hidden');
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      document.body.style.overflow = 'hidden';
      setTimeout(() => $('a', menu).focus({ preventScroll: true }), 350);
    } else {
      menu.classList.remove('is-open'); document.body.style.overflow = '';
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, motion ? 600 : 0);
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });
  mqMobile.addEventListener?.('change', () => setMenu(false));

  /* ================= SZOLGÁLTATÁSOK ↔ FOTÓ =================
     Desktopon a bal oldali keretben mindig az épp olvasott szolgáltatás fotója áll. */
  const items = $$('.svc__item'), shots = $$('.svc-photo figure'), svcNo = $('#svc-no');
  const activate = item => {
    items.forEach(i => i.classList.toggle('is-active', i === item));
    shots.forEach(f => f.classList.toggle('is-on', f.dataset.zone === item.dataset.zone));
    svcNo.textContent = $('.svc__no', item).textContent;
  };
  const svcIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activate(e.target); }),
    { rootMargin: '-45% 0px -45% 0px' });
  items.forEach(i => { svcIO.observe(i); i.addEventListener('mouseenter', () => activate(i)); });
  activate(items[0]);

  /* ================= MOBIL DOKK ================= */
  const dock = $('#dock'), dockState = new Map();
  const dockIO = new IntersectionObserver(es => {
    es.forEach(e => dockState.set(e.target, e.target === hero ? e.intersectionRatio > .35 : e.isIntersecting));
    dock.classList.toggle('is-hidden', [...dockState.values()].some(Boolean));
  }, { threshold: [0, .05, .35, .5] });
  [hero, $('#kapcsolat'), $('.foot')].forEach(el => dockIO.observe(el));
  // űrlapkitöltés közben (mobil billentyűzet) a sáv ne takarjon
  document.addEventListener('focusin', e => { if (e.target.matches('input, textarea, select')) dock.classList.add('is-typing'); });
  document.addEventListener('focusout', () => dock.classList.remove('is-typing'));

  /* ================= AJÁNLATKÉRŐ ================= */
  const form = $('#wiz'), steps = $$('.wstep', form), labels = $$('.wizard__labels li');
  const back = $('#wiz-back'), next = $('#wiz-next'), send = $('#wiz-send');
  let at = 0; const files = [];
  const err = (k, m) => { const el = $(`[data-err="${k}"]`, form); if (el) el.textContent = m || ''; };
  const val = n => { const els = form.elements[n]; if (!els) return ''; if (els instanceof RadioNodeList) { const c = [...els].filter(x => x.checked).map(x => x.value); return els[0].type === 'checkbox' ? c : (c[0] || ''); } return els.value.trim(); };
  const telOk = v => /^[+]?[\d\s()/-]{8,}$/.test(v) && v.replace(/\D/g, '').length >= 9;
  const mailOk = v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const validate = i => {
    $$('.err', steps[i]).forEach(e => e.textContent = '');
    $$('[aria-invalid]', steps[i]).forEach(e => e.removeAttribute('aria-invalid'));
    if (i === 0 && !val('epulet')) { err('epulet', 'Kérjük, válassza ki az épület típusát.'); return false; }
    if (i === 1 && !val('problema').length) { err('problema', 'Jelöljön meg legalább egy munkát vagy problémát.'); return false; }
    if (i === 2 && !val('telepules')) { err('telepules', 'Adja meg, melyik településen van az ingatlan.'); form.elements.telepules.setAttribute('aria-invalid', 'true'); return false; }
    if (i === 2 && val('irsz') && !/^\d{4}$/.test(val('irsz'))) { err('telepules', 'Az irányítószám 4 számjegy.'); form.elements.irsz.setAttribute('aria-invalid', 'true'); return false; }
    if (i === 4) {
      const bad = [];
      if (!val('nev')) bad.push(['nev', 'a nevét']);
      if (!telOk(val('telefon'))) bad.push(['telefon', 'egy hívható telefonszámot']);
      if (!mailOk(val('email'))) bad.push(['email', 'érvényes e-mail címet (vagy hagyja üresen)']);
      if (bad.length) { bad.forEach(([n]) => form.elements[n].setAttribute('aria-invalid', 'true')); err('kontakt', 'Kérjük, adja meg ' + bad.map(b => b[1]).join(', ') + '.'); form.elements[bad[0][0]].focus(); return false; }
    }
    if (i === 5 && !form.elements.hozzajarulas.checked) { err('hozzajarulas', 'Az elküldéshez jelölje be, hogy elolvasta az adatkezelési tájékoztatót.'); return false; }
    return true;
  };

  const ROWS = () => [
    ['Épület', [val('epulet'), val('epites') && `épült: ${val('epites')}`].filter(Boolean).join(', '), 0],
    ['Munka', val('problema').join(', '), 1],
    ['Helyszín', [val('irsz'), val('telepules')].filter(Boolean).join(' ') + (val('kezdes') ? ` · kezdés: ${val('kezdes')}` : ''), 2],
    ['Leírás', (val('leiras') || '–') + (files.length ? ` (${files.length} fotó)` : ''), 3],
    ['Név', val('nev'), 4], ['Telefon', val('telefon'), 4], ['E-mail', val('email') || '–', 4], ['Hívható', val('hivas') || 'mindegy', 4],
  ];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fillSummary = () => {
    $('#summary').innerHTML = ROWS().map(([k, v, s]) => `<div><dt>${k}</dt><dd>${esc(v)} <button type="button" class="linkbtn edit" data-go="${s}">módosítás</button></dd></div>`).join('');
  };
  $('#summary').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go); });

  const go = (i, focus = true) => {
    at = i;
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    labels.forEach((l, k) => { l.classList.toggle('is-on', k === i); l.classList.toggle('is-done', k < i); });
    $('#wiz-step').textContent = i + 1;
    $('#wiz-bar').style.width = ((i + 1) / steps.length * 100) + '%';
    back.disabled = i === 0;
    next.hidden = i === steps.length - 1; send.hidden = i !== steps.length - 1;
    if (i === steps.length - 1) fillSummary();
    if ($('#testmode')) $('#testmode').hidden = true;
    const legend = $('legend', steps[i]); legend.setAttribute('tabindex', '-1');
    if (!focus) return;
    legend.focus({ preventScroll: true });
    const top = $('#ajanlat').getBoundingClientRect().top;
    if (top < 0) $('#ajanlat').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
  };
  next.addEventListener('click', () => { if (validate(at)) go(at + 1); });
  back.addEventListener('click', () => go(Math.max(0, at - 1)));
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && at < steps.length - 1) { e.preventDefault(); next.click(); } });

  /* fotók – előnézet, ellenőrzés, feltöltés előtti kicsinyítés */
  const MAX_FILES = 6, MAX_BYTES = 10 * 1024 * 1024;
  const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const okType = f => OK_TYPES.includes(f.type) || (!f.type && /\.(heic|heif)$/i.test(f.name));
  const thumbs = $('#thumbs');
  const drawThumbs = () => {
    thumbs.innerHTML = files.map((f, i) => `<li><img src="${f.url}" alt="${esc(f.file.name)}"><button type="button" data-rm="${i}" aria-label="Fotó törlése: ${esc(f.file.name)}">×</button></li>`).join('');
  };
  form.elements.fotok.addEventListener('change', e => {
    err('fotok');
    const msgs = [];
    [...e.target.files].forEach(f => {
      if (!okType(f)) return msgs.push(`A(z) „${f.name}” nem JPG, PNG, WEBP vagy HEIC kép.`);
      if (f.size > MAX_BYTES) return msgs.push(`A(z) „${f.name}” nagyobb 10 MB-nál.`);
      if (files.length >= MAX_FILES) return msgs.push('Legfeljebb 6 fotót adhat hozzá.');
      files.push({ file: f, url: URL.createObjectURL(f) });
    });
    if (msgs.length) err('fotok', [...new Set(msgs)].join(' '));
    e.target.value = ''; drawThumbs();
  });
  thumbs.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; URL.revokeObjectURL(files[+b.dataset.rm].url); files.splice(+b.dataset.rm, 1); drawThumbs(); });

  // nagy telefonos fotók kicsinyítése (max. 2000 px, JPEG) – gyorsabb mobilnetes feltöltés
  const shrink = async f => {
    if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size < 1.2 * 1024 * 1024 || !window.createImageBitmap) return f;
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
      const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .85));
      return blob && blob.size < f.size ? new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : f;
    } catch (_) { return f; }
  };

  /* beküldés */
  form.elements.t.value = Date.now();
  form.elements.token.value = (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36) + Math.random().toString(36).slice(2));
  const status = $('#sendstate');
  const showStatus = (kind, html) => { status.hidden = !html; status.className = 'sendstate' + (kind ? ' sendstate--' + kind : ''); status.innerHTML = html || ''; };
  let sending = false, sent = false;
  const FIELDS = ['epulet', 'epites', 'telepules', 'irsz', 'kezdes', 'leiras', 'nev', 'telefon', 'email', 'hivas', 'weboldal', 't', 'token'];
  const failMsg = (ex) => {
    if (ex.name === 'AbortError') return 'A küldés túl sokáig tartott (lassú vagy megszakadt kapcsolat).';
    if (ex instanceof TypeError) return 'Nem sikerült kapcsolódni a szerverhez – ellenőrizze az internetkapcsolatot.';
    const d = ex.data || {};
    if (ex.status === 422 && d.message) return d.message;
    if (ex.status === 413) return 'A csatolt fotók együtt túl nagyok. Kérjük, csatoljon kevesebb vagy kisebb képet.';
    if (ex.status === 429) return 'Rövid időn belül túl sok kérés érkezett erről a kapcsolatról. Kérjük, próbálja újra később.';
    return 'A küldés most nem sikerült.';
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending || sent) return;               // dupla kattintás / ismételt beküldés ellen
    if (!validate(at)) return;
    if (!KULDES.endpoint) {
      const body = ROWS().map(([k, v]) => `${k}: ${v}`).join('\n');
      $('#mailto').href = `mailto:${EMAIL}?subject=${encodeURIComponent('Felmérés kérése – ' + val('telepules'))}&body=${encodeURIComponent(body)}`;
      $('#testmode').hidden = false; $('#testmode').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'nearest' });
      return;
    }
    sending = true; send.disabled = true; back.disabled = true; send.textContent = 'Küldés folyamatban…';
    showStatus('', 'Küldés folyamatban – a fotók feltöltése mobilneten pár másodpercig tarthat.');
    try {
      const fd = new FormData();
      FIELDS.forEach(n => fd.append(n, form.elements[n] ? form.elements[n].value.trim() : ''));
      ['epulet', 'epites', 'kezdes'].forEach(n => fd.set(n, val(n)));
      val('problema').forEach(v => fd.append('problema[]', v));
      if (form.elements.hozzajarulas.checked) fd.append('hozzajarulas', 'igen');
      for (const f of files) { const s = await shrink(f.file); fd.append('fotok[]', s, s.name); }
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), KULDES.timeout);
      let r;
      try { r = await fetch(KULDES.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' }, signal: ctrl.signal, credentials: 'same-origin' }); }
      finally { clearTimeout(timer); }
      let data = {}; try { data = await r.json(); } catch (_) {}
      if (!(r.ok && data.ok)) throw Object.assign(new Error('http ' + r.status), { status: r.status, data });
      sent = true;
      $('.wizard').classList.add('is-sent');
      $('.wizard').innerHTML = `<div class="sent" role="status" tabindex="-1"><h3>Köszönjük, megkaptuk.</h3><p>Az ajánlatkérését elküldtük Túró Istvánnak. Hamarosan visszahívja a megadott számon: <b>${esc(val('telefon'))}</b>.</p><p>Ha sürgős, hívja most: <a href="${TEL_HREF}">${TEL}</a></p></div>`;
      $('.sent').focus();
    } catch (ex) {
      showStatus('err', `${esc(failMsg(ex))} Az adatai nem vesztek el, próbálja újra – vagy hívjon: <a href="${TEL_HREF}">${TEL}</a>.`);
      sending = false; send.disabled = false; back.disabled = false; send.textContent = 'Ajánlatkérés elküldése';
    }
  });
  go(0, false);

  /* ================= HERO FOTÓFILM =================
     A régi weboldal képei lassú áttűnéssel, „kameramozgással” – videószerű nyitókép. */
  const slides = $$('.hero__film .slide');
  const loadSlide = s => { if (s.dataset.src) { s.srcset = s.dataset.srcset || ''; s.src = s.dataset.src; delete s.dataset.src; } };
  let si = 0;
  const nextSlide = () => {
    const cur = slides[si], nx = slides[(si + 1) % slides.length];
    loadSlide(nx);
    const go = () => { nx.classList.add('is-on'); cur.classList.remove('is-on'); si = (si + 1) % slides.length; $$('.hero__dots span').forEach((d, k) => d.classList.toggle('is-on', k === si)); };
    nx.complete && nx.naturalWidth ? go() : nx.addEventListener('load', go, { once: true });
  };
  if (motion && slides.length > 1) {
    addEventListener('load', () => slides.slice(1).forEach(loadSlide), { once: true });
    let timer = setInterval(nextSlide, 7000);
    document.addEventListener('visibilitychange', () => { clearInterval(timer); if (!document.hidden) timer = setInterval(nextSlide, 7000); });
  }

  /* ================= BEMUTATKOZÓ VIDEÓ =================
     Csak kattintásra töltődik be (preload="none") – nem fogyaszt mobiladatot magától. */
  const video = $('#mester-video'), vBtn = $('#vid-btn');
  const playVideo = () => { video.controls = true; vBtn.hidden = true; video.play().catch(() => { vBtn.hidden = false; }); };
  vBtn.addEventListener('click', playVideo);
  video.addEventListener('ended', () => { video.controls = false; vBtn.hidden = false; });
  $$('[data-play-video]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    $('#mester').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
    playVideo();
  }));

  /* ================= NYITÓKÉP ================= (CSS-animáció, GSAP nélkül) */
  requestAnimationFrame(() => $('.hero__title').classList.add('is-in'));
})();
