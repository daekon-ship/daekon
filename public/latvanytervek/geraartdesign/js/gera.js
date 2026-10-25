/* geraartdesign – látványterv interakciók (10. kör: „Katalógus”) */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const halk = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finom = matchMedia('(pointer:fine)').matches;
  const M = window.Muhely3D;

  /* monokróm, vonalas stílus: a lapok a tábla színéhez közeli tónusok, enyhe árnyékkal */
  const VONAL = { vonal: '#2A231E', vastag: .8, arnyek: .55 };
  const TONUS = { vaz: '#000', meret: '#665A4F', nyers: '#F3EEE6', front: '#F7F3ED', fiok: '#EFE8DE', lab: '#2A231E' };

  /* ---------------- HERO: vonalas tálaló, finoman forgatható ---------------- */
  const hsvg = $('#hero3d');
  if (hsvg && M) {
    const J = new M.Jelenet(hsvg, Object.assign({ yaw: 146, pitch: 22, keret: 10 }, VONAL));
    J.testek = M.talalo(TONUS).filter(t => t.szakasz !== 0);
    J.testek.forEach(t => { t.melyseg = t.front ? 1.2 : 0; if (t.fedlap) t.szin = '#E6DDD0'; });
    J.testek.filter(t => t.szakasz === 3).forEach((t, i) => { t.melyseg = i < 4 ? 0 : 1.6; });
    J.illeszt(); J.rajzol();
    if (!halk) {
      const y0 = 146, p0 = 22; let ty = y0, tp = p0, fut = false, huz = null;
      const lep = () => { J.yaw += (ty - J.yaw) * .07; J.pitch += (tp - J.pitch) * .07; J.rajzol(); if (Math.abs(ty - J.yaw) > .05 || Math.abs(tp - J.pitch) > .05) requestAnimationFrame(lep); else fut = false; };
      const indit = () => { if (!fut) { fut = true; requestAnimationFrame(lep); } };
      hsvg.addEventListener('pointerdown', e => { huz = { x: e.clientX, yaw: ty }; hsvg.setPointerCapture(e.pointerId); });
      hsvg.addEventListener('pointermove', e => {
        if (huz) { ty = huz.yaw - (e.clientX - huz.x) * .3; indit(); }
        else if (finom) { const r = hsvg.getBoundingClientRect(); ty = y0 - ((e.clientX - r.left) / r.width - .5) * 16; tp = p0 + ((e.clientY - r.top) / r.height - .5) * 6; indit(); }
      });
      const vege = () => { huz = null; };
      hsvg.addEventListener('pointerup', vege); hsvg.addEventListener('pointercancel', vege);
      hsvg.addEventListener('pointerleave', () => { if (!huz) { ty = y0; tp = p0; indit(); } });
    }
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
    const f = document.createElement('figure'); f.className = 'foto felfed';
    f.innerHTML = `<div class="foto-hely">${m.foto ? `<img src="${m.foto}" alt="${m.cim}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<svg viewBox="0 0 400 320" aria-hidden="true"></svg><span class="jel">Fotó helye</span>`}</div><figcaption><span><b>${m.cim}</b> — ${m.le}</span></figcaption>`;
    mr.appendChild(f);
    if (!m.foto && M) {
      const J = new M.Jelenet($('svg', f), Object.assign({ yaw: 145, pitch: 20, keret: 6 }, VONAL));
      const pal = { nyers: '#F3EEE6', front: '#F7F3ED', fiok: '#EFE8DE', lab: '#2A231E' };
      J.testek = M.kicsi(m.minta, pal); J.testek.forEach(t => { t.melyseg = t.szin === pal.front ? 1.2 : t.szin === pal.lab ? 1.6 : 0; });
      J.rajzol();
    }
  });

  /* ---------------- megjelenés görgetésre ---------------- */
  let varo = $$('.felfed'), tick = false;
  $$('.foto').forEach((el, i) => { el.style.transitionDelay = (i % 2) * 120 + 'ms'; });
  function frissit() {
    tick = false;
    const h = innerHeight * 0.9;
    varo = varo.filter(el => (el.getBoundingClientRect().top < h) ? (el.classList.add('lathato'), false) : true);
  }
  const figyel = () => { if (!tick) { tick = true; requestAnimationFrame(frissit); } };
  addEventListener('scroll', figyel, { passive: true }); addEventListener('resize', figyel); frissit();

  /* ---------------- fejléc, menü ---------------- */
  const fej = $('#fejlec');
  const gorget = () => fej.classList.toggle('gorgetve', scrollY > 20);
  addEventListener('scroll', gorget, { passive: true }); gorget();
  const mg = $('#menuGomb');
  mg && mg.addEventListener('click', () => { const ny = document.body.classList.toggle('menu-nyitva'); mg.setAttribute('aria-expanded', ny); });
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
  const allit = z => { bm.classList.toggle('zart', z); bk.setAttribute('aria-expanded', !z); bk.textContent = z ? 'Logó' : 'Logó'; };
  if (bm) { allit(innerWidth < 1100); bk.addEventListener('click', () => allit(!bm.classList.contains('zart'))); }
})();
