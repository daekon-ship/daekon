/* geraartdesign – látványterv interakciók (11. kör: „Katalógus” + Motion)
   Animációk: Motion (motion.dev, vanilla JS, window.Motion – CDN, rögzített verzió).
   Ha a Motion nem töltődik be, minden tartalom látható marad, a mozgás egyszerű tartalékkal megy. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const halk = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finom = matchMedia('(pointer:fine)').matches;
  const M3 = window.Muhely3D;
  const MO = (!halk && window.Motion && window.Motion.animate) ? window.Motion : null;
  const EASE = [0.22, 1, 0.36, 1];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  if (MO) document.documentElement.classList.add('js-motion');

  /* ---- kis Motion-segédek (a v11/v12 API különbségeit is lekezelik) ---- */
  function anim(el, kf, opt) { try { return MO.animate(el, kf, Object.assign({ ease: EASE }, opt)); } catch (e) { Object.keys(kf).forEach(k => { el.style[k] = ''; }); } }
  function szam(from, to, opt, cb) {
    if (MO) { try { return MO.animate(from, to, Object.assign({ ease: EASE }, opt, { onUpdate: cb })); } catch (e) {} }
    cb(to);
  }
  function lathatova(el, cb, margin) {
    if (MO && MO.inView) {
      try { MO.inView(el, (a, b) => { cb(a && a.nodeType ? a : (a && a.target) || el); }, { margin: margin || '0px 0px -12% 0px' }); return; } catch (e) {}
    }
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { io.unobserve(x.target); cb(x.target); } }), { rootMargin: margin || '0px 0px -12% 0px' });
    io.observe(el);
  }
  function gorgetesre(target, offset, cb) {
    if (MO && MO.scroll) {
      try { MO.scroll((a, b) => cb(typeof a === 'number' ? a : (a && a.y ? a.y.progress : 0)), { target, offset }); return; } catch (e) {}
    }
    /* tartalék: ["start start","end end"] és ["start X%","end Y%"] egyszerű közelítése */
    const fut = () => {
      const r = target.getBoundingClientRect(), vh = innerHeight;
      let p;
      if (offset[1] === 'end start') p = -r.top / Math.max(1, r.height);
      else if (offset[0] === 'start start') p = -r.top / Math.max(1, r.height - vh);
      else { const a = parseFloat(offset[0].split(' ')[1]) / 100 * vh, b = parseFloat(offset[1].split(' ')[1]) / 100 * vh; p = (a - r.top) / Math.max(1, (a - r.top) - (b - r.bottom) ); }
      cb(clamp(p, 0, 1));
    };
    addEventListener('scroll', fut, { passive: true }); addEventListener('resize', fut); fut();
  }

  /* ---------------- vonalas stílus ---------------- */
  const VONAL = { vonal: '#2A231E', vastag: .8, arnyek: .55 };
  const TONUS = { vaz: '#000', meret: '#665A4F', nyers: '#F3EEE6', front: '#F7F3ED', fiok: '#EFE8DE', lab: '#2A231E' };
  const hex = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
  const mixHex = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

  /* ---------------- HERO: cím szavanként, majd a fecskefarkas kötés összecsúszik ---------------- */
  const h1 = $('[data-motion="cim"]');
  if (h1 && MO) {
    h1.innerHTML = h1.textContent.trim().split(/\s+/).map(w => `<span class="sor"><span class="szo">${w}</span></span>`).join(' ');
    anim($$('.szo', h1), { transform: ['translateY(105%)', 'translateY(0)'] }, { duration: 1.1, delay: MO.stagger ? MO.stagger(0.06, { startDelay: 0.15 }) : 0.15 });
    anim($$('.hero [data-motion="be"]'), { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: 1, delay: MO.stagger ? MO.stagger(0.12, { startDelay: 0.6 }) : 0.6 });
    const tb = $('.hero [data-motion="tabla"]');
    anim(tb, { opacity: [0, 1] }, { duration: 0.6, delay: 0.3 });
    anim($('.tabla-kep', tb), { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.3, delay: 0.3 });
  }
  const hsvg = $('#hero3d');
  if (hsvg && M3) {
    const J = new M3.Jelenet(hsvg, Object.assign({ yaw: 128, pitch: 24, keret: 34 }, VONAL));
    J.testek = M3.fecskefark({ farok: '#E4D6C3', csap: '#F7F3ED' });
    J.illeszt();
    const farok = J.testek.filter(t => t.csoport === 'farok');
    const tol = d => { farok.forEach(t => { t.off = [-d, 0, 0]; }); J.rajzol(); };
    tol(MO ? 9 : 0);
    if (MO) setTimeout(() => szam(9, 0, { duration: 1.8 }, tol), 900);
    /* görgetés: a kötés lassan elfordul, ahogy a hero kifut */
    let alapYaw = 128, huzYaw = 0;
    const ujra = () => { J.yaw = alapYaw + huzYaw; J.rajzol(); };
    if (!halk) {
      gorgetesre($('.hero'), ['start start', 'end start'], p => { alapYaw = 128 - p * 40; J.pitch = 24 + p * 10; ujra(); });
      let huz = null;
      hsvg.addEventListener('pointerdown', e => { huz = { x: e.clientX, y: huzYaw }; hsvg.setPointerCapture(e.pointerId); });
      hsvg.addEventListener('pointermove', e => { if (huz) { huzYaw = huz.y - (e.clientX - huz.x) * .35; ujra(); } });
      const vege = () => { if (!huz) return; huz = null; szam(huzYaw, 0, { duration: 1.2 }, v => { huzYaw = v; ujra(); }); };
      hsvg.addEventListener('pointerup', vege); hsvg.addEventListener('pointercancel', vege);
    }
  }

  /* ---------------- BEMUTATÓ: ragadós tálaló – forog, fa színt kap, a fiók kinyílik ---------------- */
  const tsvg = $('#talalo3d');
  if (tsvg && M3) {
    const J = new M3.Jelenet(tsvg, Object.assign({ yaw: 122, pitch: 18, keret: 18 }, VONAL));
    J.testek = M3.talalo(TONUS).filter(t => t.szakasz !== 0);
    J.testek.forEach(t => { t.melyseg = t.front ? 1.2 : t.fogantyu ? 1.6 : 0; t.alapSzin = t.szin; if (t.fedlap) t.alapSzin = t.szin = '#E6DDD0'; });
    J.yaw = 136; J.illeszt();
    const lapok = $$('.blap'), sav = $('#bemutatSav');
    let utolso = -1;
    const rajz = p => {
      J.yaw = 122 + p * 34; J.pitch = 18 + p * 8;
      const anyag = ss(0.3, 0.5, p), ki = ss(0.66, 0.9, p);
      J.testek.forEach(t => {
        if (t.front || t.fedlap) t.szin = mixHex(t.alapSzin, t.fedlap ? '#B88E66' : '#D9BE9C', anyag);
        t.off = t.fiokki ? [0, 0, 2.6 * (1 - ki)] : [0, 0, 0];
      });
      J.rajzol();
      const i = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      if (i !== utolso) { utolso = i; lapok.forEach((l, k) => l.classList.toggle('aktiv', k === i)); }
      if (sav) sav.style.transform = `scaleX(${p.toFixed(3)})`;
    };
    rajz(0);
    if (!halk) gorgetesre($('#bemutat'), ['start start', 'end end'], rajz); else rajz(1);
  }

  /* ---------------- MUNKÁK: fotóhelyek vonalas vázlattal ----------------
     Valódi kép: foto: 'img/munkak/xy.jpg'. */
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
    if (!m.foto && M3) {
      const J = new M3.Jelenet($('svg', f), Object.assign({ yaw: 145, pitch: 20, keret: 6 }, VONAL));
      const pal = { nyers: '#F3EEE6', front: '#F7F3ED', fiok: '#EFE8DE', lab: '#2A231E' };
      J.testek = M3.kicsi(m.minta, pal); J.testek.forEach(t => { t.melyseg = t.szin === pal.front ? 1.2 : t.szin === pal.lab ? 1.6 : 0; });
      J.rajzol();
      f._J = J;
    }
    if (MO) {
      const hely = $('.foto-hely', f), kep = $('svg, img', hely), cap = $('figcaption', f);
      hely.style.clipPath = 'inset(100% 0 0 0)'; cap.style.opacity = 0;
      lathatova(f, () => {
        anim(hely, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.2 });
        if (kep) anim(kep, { transform: ['scale(1.08)', 'scale(1)'] }, { duration: 1.6 });
        anim(cap, { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] }, { duration: .8, delay: .5 });
      });
      /* hoverre a vázlat lassan elfordul */
      if (f._J && finom) {
        let cel = 145, a = null;
        const fordit = to => { if (a) a.stop && a.stop(); a = szam(f._J.yaw, to, { duration: 1.4 }, v => { f._J.yaw = v; f._J.rajzol(); }); };
        f.addEventListener('pointerenter', () => fordit(125)); f.addEventListener('pointerleave', () => fordit(cel));
      }
    }
  });

  /* ---------------- címek, listák, lépések: belépő mozgás ---------------- */
  if (MO) {
    $$('.felfed').forEach(el => {
      el.classList.remove('felfed'); el.style.opacity = 0;
      lathatova(el, t => anim(t, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: 1 }));
    });
    $$('[data-motion="lista"], [data-motion="lepesek"]').forEach(ul => {
      const li = $$(':scope > li', ul); li.forEach(x => { x.style.opacity = 0; });
      lathatova(ul, () => anim(li, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] }, { duration: .9, delay: MO.stagger ? MO.stagger(0.08) : 0 }));
    });
    $$('.elvalaszto').forEach(v => { v.style.transformOrigin = 'left'; v.style.transform = 'scaleX(0)'; lathatova(v, () => anim(v, { transform: ['scaleX(0)', 'scaleX(1)'] }, { duration: 1.4 })); });
  } else {
    /* tartalék: egyszerű megjelenés */
    let varo = $$('.felfed');
    const f = () => { const h = innerHeight * .9; varo = varo.filter(el => el.getBoundingClientRect().top < h ? (el.classList.add('lathato'), false) : true); };
    addEventListener('scroll', f, { passive: true }); f();
  }

  /* ---------------- INTARZIA: a mondat szavai görgetésre kigyúlnak ---------------- */
  const sz = $('.szoreveal');
  if (sz && !halk) {
    sz.innerHTML = sz.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    const w = $$('.w', sz);
    if (MO) gorgetesre(sz, ['start 85%', 'end 45%'], p => { const n = p * w.length; w.forEach((el, i) => { el.style.opacity = (0.18 + 0.82 * clamp(n - i, 0, 1)).toFixed(3); }); });
  }

  /* ---------------- fejléc: lefelé görgetve elbújik, felfelé előjön ---------------- */
  const fej = $('#fejlec');
  let elozo = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    fej.classList.toggle('gorgetve', y > 20);
    if (!document.body.classList.contains('menu-nyitva')) fej.classList.toggle('rejt', y > 240 && y > elozo + 4 ? true : (y < elozo - 4 ? false : fej.classList.contains('rejt')));
    elozo = y;
  }, { passive: true });
  const mg = $('#menuGomb');
  mg && mg.addEventListener('click', () => { const ny = document.body.classList.toggle('menu-nyitva'); mg.setAttribute('aria-expanded', ny); fej.classList.remove('rejt'); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-nyitva'); mg && mg.setAttribute('aria-expanded', 'false'); }));

  /* ---------------- űrlap (demó, nincs háttérrendszer) ---------------- */
  const urlap = $('#urlap'), vj = $('#visszajelzes');
  urlap && urlap.addEventListener('submit', e => {
    e.preventDefault();
    const nev = urlap.nev.value.trim(), tel = urlap.tel.value.trim();
    if (!nev || !tel) { vj.textContent = 'Kérem, adja meg a nevét és a telefonszámát, hogy vissza tudjam hívni.'; vj.classList.add('lathato'); (!nev ? urlap.nev : urlap.tel).focus(); return; }
    vj.textContent = `Köszönöm, ${nev.split(' ')[0]}! (Látványterv: az űrlap még nincs bekötve.)`;
    vj.classList.add('lathato');
  });

  /* ---------------- bemutató: logóváltozat kipróbálása ---------------- */
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
  if (bm) { allit(innerWidth < 1100); bk.addEventListener('click', () => allit(!bm.classList.contains('zart'))); }
})();
