/* Vályog-Mester – látványterv · DAEKON 2026 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const mqMobile = matchMedia('(max-width: 900px)');

  /* ================= KONFIGURÁCIÓ =================
     Éles beküldéshez ide kell az űrlapfogadó végpont (pl. saját PHP, Formspree, Netlify Forms).
     Amíg null, az ajánlatkérő TESZTMÓDBAN fut: nem küld adatot, és ezt meg is mondja. */
  const KULDES = { endpoint: null, method: 'POST' };
  const EMAIL = 'valyog.mester@gmail.com';

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
    nav.classList.toggle('is-solid', past);
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

  /* ================= SZOLGÁLTATÁSOK ↔ FALRAJZ ================= */
  const wall = $('.wall'), items = $$('.svc__item');
  const activate = item => {
    items.forEach(i => i.classList.toggle('is-active', i === item));
    wall.classList.add('has-active');
    wall.classList.toggle('is-all', item.dataset.zone === 'teljes');
    $$('.zone', wall).forEach(z => z.classList.toggle('is-active', z.dataset.zone === item.dataset.zone));
  };
  const svcIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activate(e.target); }),
    { rootMargin: '-45% 0px -45% 0px' });
  items.forEach(i => { svcIO.observe(i); i.addEventListener('mouseenter', () => activate(i)); });
  activate(items[0]);

  /* ================= MUNKANAPLÓ (helyőrzők) =================
     Valódi fotókhoz: adjon meg minden elemhez `src`-t (és `alt`-ot) – akkor kép jelenik meg rajz helyett. */
  const WORKS = [
    { cat: 'teljes', t: 'Utcai fal a lábazat leverése után', ar: '4/5', k: 'haz', src: 'img/foto/kocka-fal.webp', alt: 'Hosszú, frissen vakolt utcai fal kőlábazattal', valodi: true },
    { cat: 'vakolas', t: 'Salétromos vakolat elszállítása', ar: '4/5', k: 'vakolat', src: 'img/foto/kocka-munka.webp', alt: 'Munkatárs viszi a levert vakolatdarabokat', valodi: true },
    { cat: 'valyog', t: 'Vályogfal javítása, újravakolás', ar: '4/5', k: 'valyog' },
    { cat: 'teljes', t: 'Parasztház utcafront felújítás után', ar: '4/3', k: 'haz' },
    { cat: 'alafalazas', t: 'Szakaszos aláfalazás', ar: '3/2', k: 'alap' },
    { cat: 'vert', t: 'Vert fal sarokpótlása', ar: '1/1', k: 'vert' },
    { cat: 'vakolas', t: 'Belső vakolás, glettelés', ar: '4/5', k: 'vakolat' },
    { cat: 'valyog', t: 'Repedt vályogfal összefogása', ar: '4/3', k: 'repedes' },
    { cat: 'teljes', t: 'Udvari homlokzat, lábazattal', ar: '3/2', k: 'haz2' },
    { cat: 'alafalazas', t: 'Lábazat és alap betonozása', ar: '4/5', k: 'alap2' },
    { cat: 'vakolas', t: 'Homlokzat meszelése', ar: '4/3', k: 'mesz' },
  ];
  const TEX = { valyog: 'tx-valyog.webp', vert: 'tx-vertfal.webp', mesz: 'tx-mesz.webp', homok: 'tx-homok.webp', erdo: 'tx-erdo.webp' };
  const block = (w, h, c = 'rgba(80,45,25,.55)') => {
    let p = ''; for (let y = 0, r = 0; y < 400; y += h, r++) { p += `M0 ${y}H400`; for (let x = (r % 2) * w / 2; x < 400; x += w) p += `M${x} ${y}V${y + h}`; }
    return `<path d="${p}" stroke="${c}" stroke-width="2" fill="none"/>`;
  };
  const ART = {
    valyog: ['valyog', `${block(70, 34)}<path d="M0 0H400V150C330 175 290 120 220 160S90 190 0 150Z" fill="#F4EFE6" opacity=".93"/>`],
    repedes: ['mesz', `<path d="M0 300H400V400H0Z" fill="#56604f"/><path d="M210 0l-14 60 18 40-22 52 14 48-10 50 20 48" fill="none" stroke="#B76E45" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/><path d="M188 120h44M184 200h46M190 260h40" stroke="#25352C" stroke-width="4"/>`],
    vert: ['vert', `<path d="M0 0H130V400H0Z" fill="#F4EFE6" opacity=".9"/><path d="M130 0V400" stroke="#E9DDCC" stroke-width="8"/>`],
    alap: ['homok', `<path d="M0 0H400V190H0Z" fill="#F4EFE6"/><rect y="190" width="400" height="140" fill="#9E5639"/><g transform="translate(0 190)">${block(48, 20, 'rgba(233,221,204,.85)').replace('V400', 'V140')}</g><path d="M0 330H400V400H0Z" fill="#a49b8b"/><path d="M0 330H400" stroke="#242521" stroke-width="3"/>`],
    alap2: ['homok', `<path d="M0 0H400V200H0Z" fill="#F4EFE6"/><rect y="200" width="400" height="60" fill="#9E5639"/><g transform="translate(0 200)">${block(40, 15, 'rgba(233,221,204,.85)').replace('V400', 'V60')}</g><path d="M0 260H400V400H0Z" fill="#b5ab9b"/><path d="M0 260H400" stroke="#242521" stroke-width="3"/><path d="M20 290l30 30M70 290l30 30M120 290l30 30M170 290l30 30M220 290l30 30M270 290l30 30M320 290l30 30" stroke="#7f7768" stroke-width="3"/>`],
    vakolat: ['mesz', `<path d="M40 60c80-20 160 20 240-10s80 30 120 10M20 140c90-30 170 25 260-5s90 30 120 5M30 220c80-25 170 20 250-10s100 30 120 10" fill="none" stroke="#d9cdb8" stroke-width="18" stroke-linecap="round"/><path d="M250 290l60-40 40 30-60 40z" fill="#25352C"/><path d="M290 300l50 70" stroke="#9E5639" stroke-width="10" stroke-linecap="round"/>`],
    mesz: ['mesz', `<path d="M0 320H400V400H0Z" fill="#56604f"/><rect x="140" y="80" width="120" height="150" fill="#25352C"/><rect x="152" y="92" width="96" height="126" fill="#1c2420"/><path d="M200 92v126M152 155h96" stroke="#25352C" stroke-width="7"/>`],
    haz: ['erdo', `<path d="M60 360V200L200 90 340 200V360Z" fill="#F4EFE6"/><path d="M40 210L200 80 360 210" fill="none" stroke="#E9DDCC" stroke-width="10"/><rect x="60" y="330" width="280" height="30" fill="#56604f"/><rect x="100" y="230" width="56" height="66" fill="#25352C"/><rect x="244" y="230" width="56" height="66" fill="#25352C"/><path d="M188 150h10v20h-10zM202 150h10v20h-10z" fill="#242521"/><path d="M0 360H400" stroke="#E9DDCC" stroke-width="2"/>`],
    haz2: ['erdo', `<path d="M20 360V200H380V360Z" fill="#F4EFE6"/><path d="M0 205L60 120H340L400 205Z" fill="#9E5639"/><rect x="20" y="330" width="360" height="30" fill="#56604f"/><rect x="60" y="230" width="50" height="60" fill="#25352C"/><rect x="180" y="220" width="46" height="110" fill="#25352C"/><rect x="290" y="230" width="50" height="60" fill="#25352C"/><path d="M0 360H400" stroke="#E9DDCC" stroke-width="2"/>`],
  };
  const artHTML = w => {
    const [tex, svg] = ART[w.k];
    return `<div class="tile__art" style="--ar:${w.ar};background-image:url(img/${TEX[tex]})">` +
      (w.src ? `<img src="${w.src}" alt="${w.alt || w.t}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><span class="tile__ph tile__ph--real">Valódi munka</span>`
             : `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${svg}</svg><span class="tile__ph">Fotóhely</span>`) + '</div>';
  };
  const CATN = { valyog: 'Vályogház', vert: 'Vert fal', alafalazas: 'Aláfalazás', vakolas: 'Vakolás', teljes: 'Teljes felújítás' };
  const mas = $('#masonry');
  mas.innerHTML = WORKS.map((w, i) => `<li class="tile reveal" data-cat="${w.cat}"><button type="button" data-i="${i}" aria-label="Nagyítás: ${w.t}${w.valodi ? '' : ' (helyőrző)'}">${artHTML(w)}<span class="tile__cap"><span>${CATN[w.cat]}</span><b>${w.t}</b></span></button></li>`).join('');
  $$('.tile', mas).forEach(t => motion ? io.observe(t) : t.classList.add('is-in'));

  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); });
    $$('.tile', mas).forEach(t => { t.hidden = !(c.dataset.f === 'mind' || t.dataset.cat === c.dataset.f); if (!t.hidden) t.classList.add('is-in'); });
  }));

  /* lightbox */
  const lb = $('#lb'); let cur = 0;
  const visible = () => $$('.tile:not([hidden]) button', mas).map(b => +b.dataset.i);
  const show = i => {
    cur = i; const w = WORKS[i], nb = $('#lb-img'), [a, b] = w.ar.split('/');
    nb.style.setProperty('--ar', w.ar);
    nb.style.maxWidth = `calc(76svh * ${a} / ${b})`;
    nb.style.backgroundImage = `url(img/${TEX[ART[w.k][0]]})`;
    nb.innerHTML = w.src ? `<img src="${w.src}" alt="${w.alt || w.t}" style="width:100%;height:100%;object-fit:cover">`
      : `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ART[w.k][1]}</svg>`;
    $('#lb-cap').textContent = w.valodi ? `${w.t} · képkocka a bemutatkozó videóból` : `${w.t} · ${CATN[w.cat]} – helyőrző rajz, a valódi fotó egyeztetendő`;
  };
  mas.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; show(+b.dataset.i); lb.showModal(); });
  const step = d => { const v = visible(); show(v[(v.indexOf(cur) + d + v.length) % v.length]); };
  $('.lb__prev').addEventListener('click', () => step(-1));
  $('.lb__next').addEventListener('click', () => step(1));
  $('.lb__close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });

  /* ================= ELŐTTE–UTÁNA ================= */
  const ba = $('#ba'), range = $('.ba__range', ba);
  const setBA = () => ba.style.setProperty('--p', range.value + '%');
  range.addEventListener('input', setBA); setBA();

  /* ================= MODALOK ================= */
  $$('[data-open]').forEach(b => b.addEventListener('click', () => $('#' + b.dataset.open).showModal()));
  $$('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog.modal').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  /* ================= MOBIL DOKK ================= */
  const dock = $('#dock'), dockState = new Map();
  const dockIO = new IntersectionObserver(es => {
    es.forEach(e => dockState.set(e.target, e.target === hero ? e.intersectionRatio > .35 : e.isIntersecting));
    dock.classList.toggle('is-hidden', [...dockState.values()].some(Boolean));
  }, { threshold: [0, .05, .35, .5] });
  [hero, $('#kapcsolat'), $('.foot')].forEach(el => dockIO.observe(el));

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
    if (i === 1 && !val('problema').length) { err('problema', 'Jelöljön meg legalább egy problémát.'); return false; }
    if (i === 2 && !val('telepules')) { err('telepules', 'Adja meg, melyik településen van az ingatlan.'); form.elements.telepules.setAttribute('aria-invalid', 'true'); return false; }
    if (i === 2 && val('irsz') && !/^\d{4}$/.test(val('irsz'))) { err('telepules', 'Az irányítószám 4 számjegy.'); form.elements.irsz.setAttribute('aria-invalid', 'true'); return false; }
    if (i === 4) {
      const bad = [];
      if (!val('nev')) bad.push(['nev', 'a nevét']);
      if (!telOk(val('telefon'))) bad.push(['telefon', 'egy hívható telefonszámot']);
      if (!mailOk(val('email'))) bad.push(['email', 'érvényes e-mail címet (vagy hagyja üresen)']);
      if (bad.length) { bad.forEach(([n]) => form.elements[n].setAttribute('aria-invalid', 'true')); err('kontakt', 'Kérjük, adja meg ' + bad.map(b => b[1]).join(', ') + '.'); form.elements[bad[0][0]].focus(); return false; }
    }
    if (i === 5 && !form.elements.hozzajarulas.checked) { err('hozzajarulas', 'Az elküldéshez el kell fogadnia az adatkezelési tájékoztatót.'); return false; }
    return true;
  };

  const ROWS = () => [
    ['Épület', [val('epulet'), val('epites') && `épült: ${val('epites')}`].filter(Boolean).join(', '), 0],
    ['Probléma', val('problema').join(', '), 1],
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
    $('#testmode').hidden = true;
    const legend = $('legend', steps[i]); legend.setAttribute('tabindex', '-1');
    if (!focus) return;
    legend.focus({ preventScroll: true });
    const top = $('#ajanlat').getBoundingClientRect().top;
    if (top < 0) $('#ajanlat').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
  };
  next.addEventListener('click', () => { if (validate(at)) go(at + 1); });
  back.addEventListener('click', () => go(Math.max(0, at - 1)));
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && at < steps.length - 1) { e.preventDefault(); next.click(); } });

  /* fotók – csak helyben, előnézettel */
  const thumbs = $('#thumbs');
  const drawThumbs = () => {
    thumbs.innerHTML = files.map((f, i) => `<li><img src="${f.url}" alt="${esc(f.file.name)}"><button type="button" data-rm="${i}" aria-label="Fotó törlése: ${esc(f.file.name)}">×</button></li>`).join('');
  };
  form.elements.fotok.addEventListener('change', e => {
    err('fotok');
    [...e.target.files].forEach(f => {
      if (!f.type.startsWith('image/')) return err('fotok', 'Csak képfájl tölthető fel.');
      if (f.size > 10 * 1024 * 1024) return err('fotok', `A(z) ${f.name} nagyobb 10 MB-nál.`);
      if (files.length >= 6) return err('fotok', 'Legfeljebb 6 fotót adhat hozzá.');
      files.push({ file: f, url: URL.createObjectURL(f) });
    });
    e.target.value = ''; drawThumbs();
  });
  thumbs.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; URL.revokeObjectURL(files[+b.dataset.rm].url); files.splice(+b.dataset.rm, 1); drawThumbs(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate(at)) return;
    if (!KULDES.endpoint) {
      const body = ROWS().map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n(Az ajánlatkérés a vályog-mester látványtervből készült.)';
      $('#mailto').href = `mailto:${EMAIL}?subject=${encodeURIComponent('Felmérés kérése – ' + val('telepules'))}&body=${encodeURIComponent(body)}`;
      $('#testmode').hidden = false; $('#testmode').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'nearest' });
      return;
    }
    // éles mód: valódi beküldés, valódi visszajelzéssel
    const fd = new FormData(form); fd.delete('fotok'); files.forEach(f => fd.append('fotok', f.file));
    send.disabled = true; send.textContent = 'Küldés…';
    try {
      const r = await fetch(KULDES.endpoint, { method: KULDES.method, body: fd, headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      steps[at].innerHTML = '<legend>Köszönjük, megkaptuk.</legend><p>Hamarosan visszahívjuk a megadott számon.</p>';
      $('.wizard__nav').hidden = true;
    } catch (_) {
      err('hozzajarulas', 'A küldés nem sikerült. Kérjük, hívjon minket: +36 30 966 9528.');
      send.disabled = false; send.textContent = 'Ajánlatkérés elküldése';
    }
  });
  go(0, false);

  /* ================= HERO FOTÓFILM =================
     A valyog-mester.hu képei lassú áttűnéssel, „kameramozgással” – videószerű nyitókép. */
  const slides = $$('.hero__film .slide');
  const loadSlide = s => { if (s.dataset.src) { s.srcset = s.dataset.srcset || ''; s.src = s.dataset.src; delete s.dataset.src; } };
  let si = 0;
  const nextSlide = () => {
    const cur = slides[si], nx = slides[(si + 1) % slides.length];
    loadSlide(nx);
    const go = () => { nx.classList.remove('is-on'); void nx.offsetWidth; nx.classList.add('is-on'); cur.classList.remove('is-on'); si = (si + 1) % slides.length; };
    nx.complete && nx.naturalWidth ? go() : nx.addEventListener('load', go, { once: true });
  };
  if (motion && slides.length > 1) {
    addEventListener('load', () => slides.slice(1).forEach(loadSlide), { once: true });
    let timer = setInterval(nextSlide, 7000);
    document.addEventListener('visibilitychange', () => { clearInterval(timer); if (!document.hidden) timer = setInterval(nextSlide, 7000); });
  }

  /* ================= BEMUTATKOZÓ VIDEÓ =================
     Látótérben némítva, hurokban fut (a felirat be van égetve); gombra elölről, hanggal. */
  const vidBox = $('#vid'), video = $('#mester-video'), vBtn = $('#vid-btn'), vMute = $('#vid-mute');
  const playWithSound = () => {
    video.muted = false; video.loop = false; video.currentTime = 0; video.controls = true;
    video.play().catch(() => {});
    vBtn.hidden = true; vMute.hidden = false; vidBox.classList.remove('is-muted');
  };
  vBtn.addEventListener('click', playWithSound);
  vMute.addEventListener('click', () => { video.muted = !video.muted; vidBox.classList.toggle('is-muted', video.muted); });
  video.addEventListener('ended', () => { video.controls = false; vBtn.hidden = false; vMute.hidden = true; });
  if (motion) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && video.muted && vBtn.hidden === false) { video.preload = 'auto'; video.play().catch(() => {}); }
      else if (!e.isIntersecting) video.pause();
    }, { threshold: .4 }).observe(vidBox);
  }
  $$('[data-play-video]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    $('#mester').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
    playWithSound();
  }));

  /* ================= GSAP: HERO + RAJZ + PARALLAX + FOLYAMATVONAL ================= */
  const start = () => {
    const hTitle = $('.hero__title'), hFade = $$('.hero .eyebrow, .hero__lead, .hero__ctas, .hero__reel, .hero__bar');
    if (!motion || !window.gsap) {
      hTitle.classList.add('is-in');
      return;
    }
    const g = window.gsap;
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
    g.set(hFade, { autoAlpha: 0, y: 18 });
    g.timeline({ defaults: { ease: 'power3.out' } })
      .to('.hero .eyebrow', { autoAlpha: 1, y: 0, duration: .7 }, .15)
      .add(() => hTitle.classList.add('is-in'), .25)
      .to('.hero__lead, .hero__ctas', { autoAlpha: 1, y: 0, duration: .8, stagger: .1 }, .75)
      .to('.hero__reel', { autoAlpha: 1, y: 0, duration: .8 }, 1.1)
      .to('.hero__bar', { autoAlpha: 1, y: 0, duration: .8 }, 1.25);

    // a „falmetszet” rajz a Miért-szekcióban, belépéskor rajzolódik ki
    const house = g.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .to('.house .draw', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: .08 }, 0)
      .to('.house .fill-in', { opacity: 1, duration: .8, stagger: .05 }, .8)
      .fromTo('.house .crack', { opacity: 0 }, { opacity: 1, duration: .4 }, 1.3)
      .fromTo('.house .sweep', { attr: { width: 0 } }, { attr: { width: 440 }, duration: 1.5, ease: 'power2.inOut' }, 1.7)
      .to('.house .crack', { opacity: 0, duration: .5 }, 2.4)
      .to('.house .cutedge', { opacity: 1, duration: .5 }, 2.9)
      .to('.house .note', { opacity: 1, duration: .5, stagger: .12 }, 3.0);

    if (!window.ScrollTrigger) { house.play(); return; }
    window.ScrollTrigger.create({ trigger: '.why__art', start: 'top 80%', once: true, onEnter: () => house.play() });
    const mm = g.matchMedia();
    mm.add('(min-width: 901px)', () => {
      g.to('.hero__copy', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    const stepsEl = $('.steps');
    g.fromTo(stepsEl, { '--line-p': 0 }, { '--line-p': 1, ease: 'none', scrollTrigger: { trigger: stepsEl, start: 'top 75%', end: 'bottom 55%', scrub: true } });
  };
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
