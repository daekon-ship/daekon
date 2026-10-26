/* geraartdesign – látványterv, 12. kör: „Rajzlap” + Motion (motion.dev, window.Motion)
   Ha a Motion nem töltődik be, minden tartalom azonnal látszik, a görgetéses rész saját tartalékkal megy. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const halk = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finom = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const M3 = window.Muhely3D;
  const MO = (!halk && window.Motion && window.Motion.animate) ? window.Motion : null;
  const EASE = [0.22, 1, 0.36, 1];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  if (MO) document.documentElement.classList.add('js-motion');

  /* ---------- Motion-segédek ---------- */
  const anim = (el, kf, opt) => { if (!MO || !el || (el.length === 0)) return null; try { return MO.animate(el, kf, Object.assign({ ease: EASE }, opt)); } catch (e) { return null; } };
  const szam = (from, to, opt, cb) => { if (MO) { try { return MO.animate(from, to, Object.assign({ ease: EASE }, opt, { onUpdate: cb })); } catch (e) {} } cb(to); return null; };
  const kesz = (a, cb, ms) => { if (a && a.finished) a.finished.then(cb); else setTimeout(cb, ms || 0); };
  const lepcso = (d, s) => (MO && MO.stagger) ? MO.stagger(d, { startDelay: s || 0 }) : (s || 0);
  function lathatova(el, cb) {
    if (MO && MO.inView) { try { MO.inView(el, () => { cb(el); }, { margin: '0px 0px -12% 0px' }); return; } catch (e) {} }
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { io.unobserve(x.target); cb(x.target); } }), { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  }
  function gorgetesre(target, offset, cb) {
    if (MO && MO.scroll) { try { MO.scroll(p => cb(typeof p === 'number' ? p : 0), { target, offset }); return; } catch (e) {} }
    const f = () => {
      const r = target.getBoundingClientRect(), vh = innerHeight, sY = scrollY, top = r.top + sY;
      const m = s => s === 'start' ? 0 : s === 'end' ? 1 : s === 'center' ? .5 : parseFloat(s) / 100;
      const [a0, a1] = offset[0].split(' ').map(m), [b0, b1] = offset[1].split(' ').map(m);
      const A = top + a0 * r.height - a1 * vh, B = top + b0 * r.height - b1 * vh;
      cb(clamp((sY - A) / Math.max(1, B - A), 0, 1));
    };
    addEventListener('scroll', f, { passive: true }); addEventListener('resize', f); f();
  }
  /* szavak szétbontása (a .dim részeket megtartva) */
  function szavakra(el) {
    const bont = node => Array.from(node.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        const fr = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { fr.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'sor'; const i = document.createElement('span'); i.className = 'szo'; i.textContent = t; s.appendChild(i); fr.appendChild(s);
        });
        n.parentNode.replaceChild(fr, n);
      } else if (n.nodeType === 1) bont(n);
    });
    bont(el);
    return $$('.szo', el);
  }

  /* ---------- rajz: a vonalak hossza a kirajzoláshoz ---------- */
  const rajz = $('#rajz');
  const utak = rajz ? $$('.dr', rajz) : [];
  utak.forEach(p => { p.setAttribute('pathLength', '1'); });

  /* ---------- HERO-sorozat: intró → lap → rajz → szöveg ---------- */
  const heroSzavak = MO ? szavakra($('[data-m="cim"]')) : [];
  const heroBe = $$('.hero [data-m="be"]');
  const rajzSzoveg = rajz ? $$('text', rajz) : [];
  if (MO) {
    heroSzavak.forEach(s => { s.style.transform = 'translateY(108%)'; });
    heroBe.forEach(e => { e.style.opacity = 0; });
    utak.forEach(p => { p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
    rajzSzoveg.forEach(t => { t.style.opacity = 0; });
    $('.lap').style.clipPath = 'inset(0 0 100% 0)';
  }
  function heroIndul() {
    if (!MO) return;
    anim($('.lap'), { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { duration: 1.2, ease: [0.76, 0, 0.24, 1] });
    const csop = ['.r-butor', '.r-reszlet', '.r-meret', '.r-nagyito'];
    csop.forEach((c, k) => anim($$(c + ' .dr', rajz), { strokeDashoffset: [1, 0] }, { duration: 2.2, delay: lepcso(0.08, 0.5 + k * 0.45) }));
    anim(rajzSzoveg, { opacity: [0, 0.8] }, { duration: 1, delay: lepcso(0.08, 2.1) });
    anim(heroSzavak, { transform: ['translateY(108%)', 'translateY(0%)'] }, { duration: 1.1, delay: lepcso(0.05, 0.75) });
    anim(heroBe, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] }, { duration: 1, delay: lepcso(0.12, 1.05) });
    /* lefelé jelző */
    const lf = $('#lefele');
    if (lf) anim(lf, { transform: ['translateY(-16px)', 'translateY(46px)'] }, { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 2.6 });
  }
  if (MO) {
    const intro = document.createElement('div');
    intro.className = 'intro'; intro.setAttribute('aria-hidden', 'true');
    const logoSrc = ($('[data-logo="fejlec-sotet"]') || {}).getAttribute ? $('[data-logo="fejlec-sotet"]').getAttribute('src') : '';
    intro.innerHTML = `<img src="${logoSrc}" alt=""><i><b></b></i><small>Bútorasztalos · intarzia</small>`;
    document.body.appendChild(intro);
    const [im, , sm] = [$('img', intro), null, $('small', intro)];
    anim(im, { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] }, { duration: .9, delay: .1 });
    anim($('i b', intro), { transform: ['scaleX(0)', 'scaleX(1)'] }, { duration: 1, delay: .35 });
    const a = anim(sm, { opacity: [0, 1] }, { duration: .6, delay: .7 });
    setTimeout(() => {
      const ki = anim(intro, { clipPath: ['inset(0 0 0% 0)', 'inset(0 0 100% 0)'] }, { duration: 1, ease: [0.76, 0, 0.24, 1] });
      heroIndul();
      kesz(ki, () => intro.remove(), 1100);
    }, 1450);
  }

  /* ---------- lámpafény + billenés + világító rajz-másolat ---------- */
  const lapFo = $('#lapFo'), lampa = $('.lampa', lapFo), kepDoboz = $('#heroKep'), billen = $('#billen');
  let fenyes = null;
  if (rajz && !halk) {
    fenyes = document.createElement('div'); fenyes.className = 'rajz-fenyes';
    const kl = rajz.cloneNode(true); kl.removeAttribute('id'); kl.removeAttribute('class'); $$('text', kl).forEach(t => t.remove()); $$('.dr', kl).forEach(p => { p.removeAttribute('class'); p.removeAttribute('style'); });
    kl.setAttribute('fill', 'none'); kl.setAttribute('stroke', 'currentColor'); kl.style.width = '100%'; kl.style.maxHeight = '92%';
    fenyes.appendChild(kl); billen.appendChild(fenyes);
  }
  const lampak = [];
  const lampaAdd = (host, el) => lampak.push({ host, el, x: .7, y: .4, tx: .7, ty: .4, user: false });
  if (lampa) lampaAdd(lapFo, lampa);
  const l2 = $('#lampa2'); if (l2) lampaAdd($('#kapcsolat'), l2);
  if (!halk) {
    document.addEventListener('pointermove', e => {
      lampak.forEach(L => { const r = L.host.getBoundingClientRect(); L.tx = (e.clientX - r.left) / r.width; L.ty = (e.clientY - r.top) / r.height; L.user = true; });
      if (kepDoboz && finom) {
        const r = kepDoboz.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        if (py > -0.3 && py < 1.3) billen.style.transform = `rotateY(${((px - .5) * 8).toFixed(2)}deg) rotateX(${((.5 - py) * 5).toFixed(2)}deg)`;
        if (fenyes) { fenyes.style.setProperty('--px', (px * 100).toFixed(1) + '%'); fenyes.style.setProperty('--py', (py * 100).toFixed(1) + '%'); }
      }
    }, { passive: true });
    const t0 = performance.now();
    (function hurok(t) {
      lampak.forEach((L, k) => {
        if (!finom || !L.user) { const s = (t - t0) / 1000 + k * 2; L.tx = .55 + Math.sin(s * .35) * .3; L.ty = .45 + Math.cos(s * .27) * .25;
          if (k === 0 && fenyes) { const r = kepDoboz.getBoundingClientRect(), h = lapFo.getBoundingClientRect(); fenyes.style.setProperty('--px', (((L.x * h.width + h.left) - r.left) / r.width * 100).toFixed(1) + '%'); fenyes.style.setProperty('--py', (((L.y * h.height + h.top) - r.top) / r.height * 100).toFixed(1) + '%'); } }
        L.x += (L.tx - L.x) * .08; L.y += (L.ty - L.y) * .08;
        L.el.style.setProperty('--mx', (L.x * 100).toFixed(2) + '%'); L.el.style.setProperty('--my', (L.y * 100).toFixed(2) + '%');
      });
      requestAnimationFrame(hurok);
    })(t0);
    /* hero: görgetéskor a rajzlap lassan hátrébb lép */
    gorgetesre($('.hero'), ['start start', 'end start'], p => { $('.lap').style.transform = `scale(${(1 - p * 0.06).toFixed(4)})`; $('.lap').style.opacity = (1 - p * 0.7).toFixed(3); });
  }

  /* ---------- mágneses gombok ---------- */
  if (finom && !halk) $$('.hero .btn, .fejlec .btn').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- sötét vonalas 3D stílus ---------- */
  const SOTET = { vonal: '#D9C3A3', vastag: .8, arnyek: .5 };
  const SZIN = { vaz: '#000', meret: '#988B7B', nyers: '#1F1B18', front: '#221E1A', fiok: '#1C1916', lab: '#6B5038' };
  const hex = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
  const keverd = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

  /* ---------- BEMUTATÓ: ragadós tálaló ---------- */
  const tsvg = $('#talalo3d');
  if (tsvg && M3) {
    const J = new M3.Jelenet(tsvg, Object.assign({ yaw: 122, pitch: 18, keret: 18 }, SOTET));
    J.testek = M3.talalo(SZIN).filter(t => t.szakasz !== 0);
    J.testek.forEach(t => { t.melyseg = t.front ? 1.2 : t.fogantyu ? 1.6 : 0; t.alapSzin = t.szin; });
    J.yaw = 136; J.illeszt();
    const lapok = $$('.blap'), sav = $('#bemutatSav'); let utolso = -1;
    const rajzol = p => {
      J.yaw = 122 + p * 34; J.pitch = 18 + p * 8;
      const anyag = ss(0.3, 0.5, p), ki = ss(0.66, 0.9, p);
      J.testek.forEach(t => {
        if (t.front) t.szin = keverd(t.alapSzin, '#8E6A47', anyag);
        if (t.fedlap) t.szin = keverd(t.alapSzin, '#5A4330', anyag);
        t.off = t.fiokki ? [0, 0, 2.6 * (1 - ki)] : [0, 0, 0];
      });
      J.rajzol();
      const i = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      if (i !== utolso) { utolso = i; lapok.forEach((l, k) => l.classList.toggle('aktiv', k === i)); }
      if (sav) sav.style.transform = `scaleX(${p.toFixed(3)})`;
    };
    rajzol(0);
    if (!halk) gorgetesre($('#bemutat'), ['start start', 'end end'], rajzol); else rajzol(1);
  }

  /* ---------- MUNKÁK ---------- */
  const MUNKAK = [
    { cim: 'Konyha', le: 'alsó és felső szekrénysor', minta: 'konyha', foto: null },
    { cim: 'Beépített gardrób', le: 'háromajtós, mennyezetig', minta: 'gardrob', foto: null },
    { cim: 'Étkezőasztal', le: 'tömörfa', minta: 'asztal', foto: null },
    { cim: 'Komód', le: 'három fiókkal', minta: 'komod', foto: null }
  ];
  const mr = $('#munkakRacs');
  if (mr) MUNKAK.forEach(m => {
    const f = document.createElement('figure'); f.className = 'foto';
    f.innerHTML = `<div class="foto-hely">${m.foto ? `<img src="${m.foto}" alt="${m.cim}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<svg viewBox="0 0 400 320" aria-hidden="true"></svg><span class="jel">Fotó helye</span>`}</div><figcaption><span><b>${m.cim}</b> — ${m.le}</span></figcaption>`;
    mr.appendChild(f);
    let J = null;
    if (!m.foto && M3) {
      J = new M3.Jelenet($('svg', f), Object.assign({ yaw: 145, pitch: 20, keret: 6 }, SOTET));
      const pal = { nyers: '#1F1B18', front: '#221E1A', fiok: '#1C1916', lab: '#7A5C40' };
      J.testek = M3.kicsi(m.minta, pal); J.testek.forEach(t => { t.melyseg = t.szin === pal.front ? 1.2 : t.szin === pal.lab ? 1.6 : 0; });
      J.rajzol();
    }
    if (MO) {
      const hely = $('.foto-hely', f), kep = $('svg, img', hely), cap = $('figcaption', f);
      hely.style.clipPath = 'inset(100% 0 0 0)'; cap.style.opacity = 0;
      lathatova(f, () => {
        anim(hely, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.2, ease: [0.76, 0, 0.24, 1] });
        if (kep) anim(kep, { transform: ['scale(1.1)', 'scale(1)'] }, { duration: 1.8 });
        anim(cap, { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0px)'] }, { duration: .8, delay: .5 });
      });
    }
    if (J && finom && !halk) {
      let a = null;
      const fordit = to => { if (a && a.stop) a.stop(); a = szam(J.yaw, to, { duration: 1.4 }, v => { J.yaw = v; J.rajzol(); }); };
      f.addEventListener('pointerenter', () => fordit(122)); f.addEventListener('pointerleave', () => fordit(145));
    }
  });

  /* ---------- címek, szövegek, listák belépése ---------- */
  if (MO) {
    $$('[data-m="cim2"]').forEach(h => {
      const sz = szavakra(h); sz.forEach(s => { s.style.transform = 'translateY(108%)'; });
      lathatova(h, () => anim(sz, { transform: ['translateY(108%)', 'translateY(0%)'] }, { duration: 1, delay: lepcso(0.045) }));
    });
    $$('main [data-m="be"]').forEach(el => { if (el.closest('.hero')) return; el.style.opacity = 0; lathatova(el, () => anim(el, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] }, { duration: 1, delay: .15 })); });
    $$('[data-m="lista"]').forEach(ul => { const li = $$(':scope > li', ul); li.forEach(x => { x.style.opacity = 0; }); lathatova(ul, () => anim(li, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, { duration: .9, delay: lepcso(0.07) })); });
    $$('[data-m="kep"]').forEach(el => { const h = $('.portre-hely', el); h.style.clipPath = 'inset(100% 0 0 0)'; lathatova(el, () => anim(h, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.3, ease: [0.76, 0, 0.24, 1] })); });
  }

  /* ---------- intarzia: szavak görgetésre ---------- */
  const sz = $('.szoreveal');
  if (sz && MO) {
    sz.innerHTML = sz.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    const w = $$('.w', sz);
    gorgetesre(sz, ['start 85%', 'end 45%'], p => { const n = p * w.length; w.forEach((el, i) => { el.style.opacity = (0.16 + 0.84 * clamp(n - i, 0, 1)).toFixed(3); }); });
  }

  /* ---------- INTARZIA: kockaminta, görgetésre összeáll ---------- */
  const bsvg = $('#berakasSvg');
  if (bsvg) {
    const NS = 'http://www.w3.org/2000/svg', mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const KER = 22, B = 400 - KER, sz = 38, c = Math.cos(Math.PI / 6);
    const FA = [{ f: '#D9C3A3', e: '#B9A07D' }, { f: '#9A6F48', e: '#7E5A39' }, { f: '#4A3626', e: '#33251A' }];
    const defs = mk('defs', {}); const cp = mk('clipPath', { id: 'berakasKlip' }); cp.appendChild(mk('rect', { x: KER, y: KER, width: B - KER, height: B - KER })); defs.appendChild(cp); bsvg.appendChild(defs);
    /* szegély: sötét fa csík, sarokban gérbe vágva */
    const szegely = mk('g', {});
    [[0, 0, 400, 0, B, KER, KER, KER], [400, 0, 400, 400, B, B, B, KER], [400, 400, 0, 400, KER, B, B, B], [0, 400, 0, 0, KER, KER, KER, B]].forEach(q => {
      szegely.appendChild(mk('polygon', { points: `${q[0]},${q[1]} ${q[2]},${q[3]} ${q[4]},${q[5]} ${q[6]},${q[7]}`, fill: '#2E221A', stroke: '#D9C3A3', 'stroke-width': .6, 'stroke-opacity': .5 }));
    });
    const mezo = mk('g', { 'clip-path': 'url(#berakasKlip)' });
    mezo.appendChild(mk('rect', { x: KER, y: KER, width: B - KER, height: B - KER, fill: '#1A1512' }));
    const darabok = [];
    const sor = Math.ceil(400 / (1.5 * sz)) + 2;
    for (let r = -1; r < sor; r++) for (let q = -1; q < Math.ceil(400 / (2 * sz * c)) + 2; q++) {
      const cx = q * 2 * sz * c + (r % 2 ? sz * c : 0), cy = r * 1.5 * sz;
      const P = [
        [[cx, cy - sz], [cx + sz * c, cy - sz / 2], [cx, cy], [cx - sz * c, cy - sz / 2]],
        [[cx - sz * c, cy - sz / 2], [cx, cy], [cx, cy + sz], [cx - sz * c, cy + sz / 2]],
        [[cx, cy], [cx + sz * c, cy - sz / 2], [cx + sz * c, cy + sz / 2], [cx, cy + sz]]
      ];
      P.forEach((pt, k) => {
        const g = mk('g', {});
        g.appendChild(mk('polygon', { points: pt.map(v => v.map(n => n.toFixed(2)).join(',')).join(' '), fill: FA[k].f, stroke: '#12100E', 'stroke-width': .9 }));
        /* erezet: a rombusz egyik élével párhuzamos vékony vonalak */
        const [a, b2, , d] = pt;
        for (let i = 1; i < 4; i++) {
          const t = i / 4 + (((q * 7 + r * 3 + k) % 5) - 2) * 0.02;
          g.appendChild(mk('line', { x1: (a[0] + (d[0] - a[0]) * t).toFixed(2), y1: (a[1] + (d[1] - a[1]) * t).toFixed(2), x2: (b2[0] + (pt[2][0] - b2[0]) * t).toFixed(2), y2: (b2[1] + (pt[2][1] - b2[1]) * t).toFixed(2), stroke: FA[k].e, 'stroke-width': .5, opacity: .7 }));
        }
        const mx = (pt[0][0] + pt[2][0]) / 2, my = (pt[0][1] + pt[2][1]) / 2;
        const dx = mx - 200, dy = my - 200, tav = Math.hypot(dx, dy) / 283;
        const h = (Math.sin(q * 12.9898 + r * 78.233 + k * 4.1) * 43758.5453) % 1;
        darabok.push({ g, mx, my, dx: dx / (Math.hypot(dx, dy) || 1), dy: dy / (Math.hypot(dx, dy) || 1), tav, h: Math.abs(h), k });
        mezo.appendChild(g);
      });
    }
    bsvg.appendChild(mezo); bsvg.appendChild(szegely);
    /* vékony rajzi keret a mező körül */
    bsvg.appendChild(mk('rect', { x: .5, y: .5, width: 399, height: 399, fill: 'none', stroke: '#D9C3A3', 'stroke-opacity': .35, 'stroke-width': 1 }));
    const all = p => darabok.forEach(d => {
      const t = clamp((p * 1.6) - d.tav * 0.55 - d.h * 0.15, 0, 1), e = 1 - Math.pow(1 - t, 3), u = 1 - e;
      const r = 26 + 34 * d.h;
      d.g.setAttribute('transform', u < 0.001 ? '' : `translate(${(d.dx * r * u * 1.4 + (d.k - 1) * 6 * u).toFixed(2)} ${(d.dy * r * u * 1.4 - 10 * u).toFixed(2)}) rotate(${((d.h - .5) * 40 * u).toFixed(2)} ${d.mx.toFixed(1)} ${d.my.toFixed(1)})`);
      d.g.style.opacity = (0.15 + 0.85 * e).toFixed(3);
    });
    if (MO) gorgetesre($('#berakas'), ['start end', 'center 55%'], all); else all(1);
  }

  /* ---------- FOLYAMAT: kihúzódó vonal, lépésjelölők ---------- */
  const lep = $('.lepesek');
  if (lep && !MO) $$(':scope > li', lep).forEach(x => x.classList.add('kesz'));
  if (lep && MO) {
    const li = $$(':scope > li', lep);
    gorgetesre(lep, ['start 85%', 'start 35%'], p => {
      lep.style.setProperty('--v', p.toFixed(3));
      li.forEach((x, i) => x.classList.toggle('kesz', p >= i / li.length + 0.02));
    });
  }

  /* ---------- fejléc ---------- */
  const fej = $('#fejlec');
  let elozo = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    fej.classList.toggle('gorgetve', y > 40);
    if (!document.body.classList.contains('menu-nyitva')) { if (y > 300 && y > elozo + 4) fej.classList.add('rejt'); else if (y < elozo - 4) fej.classList.remove('rejt'); }
    elozo = y;
  }, { passive: true });
  const mg = $('#menuGomb');
  mg && mg.addEventListener('click', () => { const ny = document.body.classList.toggle('menu-nyitva'); mg.setAttribute('aria-expanded', ny); fej.classList.remove('rejt'); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-nyitva'); mg && mg.setAttribute('aria-expanded', 'false'); }));

  /* ---------- űrlap (demó) ---------- */
  const urlap = $('#urlap'), vj = $('#visszajelzes');
  urlap && urlap.addEventListener('submit', e => {
    e.preventDefault();
    const nev = urlap.nev.value.trim(), tel = urlap.tel.value.trim();
    if (!nev || !tel) { vj.textContent = 'Kérem, adja meg a nevét és a telefonszámát, hogy vissza tudjam hívni.'; vj.classList.add('lathato'); (!nev ? urlap.nev : urlap.tel).focus(); return; }
    vj.textContent = `Köszönöm, ${nev.split(' ')[0]}! (Látványterv: az űrlap még nincs bekötve.)`;
    vj.classList.add('lathato');
  });

  /* ---------- bemutató: logóváltozat ---------- */
  function logo(v) {
    $$('[data-logo]').forEach(img => { img.src = `arculat/logo-${v}/geraartdesign-${v}-${img.dataset.logo}.svg`; });
    $$('#bemutato button[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === String(v)));
    const ico = $('link[rel=icon]'); if (ico) ico.href = `arculat/logo-${v}/geraartdesign-${v}-kompakt.svg`;
    try { localStorage.setItem('gera-logo', v); } catch (e) {}
  }
  let kezdo = new URLSearchParams(location.search).get('logo');
  if (!kezdo) { try { kezdo = localStorage.getItem('gera-logo'); } catch (e) {} }
  if (kezdo && /^[145]$/.test(kezdo)) logo(kezdo);
  $$('#bemutato button[data-v]').forEach(b => b.addEventListener('click', () => logo(b.dataset.v)));
  const bm = $('#bemutato'), bk = $('#bemutatoKapcs');
  const allit = z => { bm.classList.toggle('zart', z); bk.setAttribute('aria-expanded', !z); };
  if (bm) { allit(true); bk.addEventListener('click', () => allit(!bm.classList.contains('zart'))); }
})();
