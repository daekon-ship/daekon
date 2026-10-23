/* geraartdesign – látványterv interakciók (6. kör: „Műhely”) */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const halk = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finom = matchMedia('(pointer:fine)').matches;
  const M = window.Muhely3D;
  const ease = t => 1 - Math.pow(1 - t, 3);

  /* ---------------- szolgáltatások: szerkesztett mutató ---------------- */
  const SZOLG = [
    ['Egyedi bútorok', 'Asztal, komód, tálaló, polc — méretre, a helyiség stílusához.'],
    ['Konyhabútorok', 'Átgondolt tárolás, tartós felületek, pontos illesztések a mindennapokra.'],
    ['Beépített szekrények', 'Gardrób, falfülke, tetőtér: a hely minden centiméterét kihasználva.'],
    ['Intarzia és díszítés', 'Berakásos minták, monogramok, díszlapok bútorra, dobozra, falra.'],
    ['Bútorfelújítás', 'Régi darabok javítása, felújítása — a karakterük megtartásával.'],
    ['Ajtók és ablakok', 'Fa nyílászárók készítése és javítása. <span class="egyeztet" title="ügyféllel egyeztetendő">(egyeztetendő)</span>']
  ];
  const mt = $('#mutato');
  if (mt) SZOLG.forEach(([c, l], i) => {
    const li = document.createElement('li'); li.className = 'felfed';
    li.innerHTML = `<div class="sor"><span class="sz">0${i + 1}</span><h3>${c}</h3><p>${l}</p><i aria-hidden="true">→</i></div>`;
    mt.appendChild(li);
  });

  /* ---------------- HERO: fecskefarkas kötés ---------------- */
  const ksvg = $('#kotes');
  if (ksvg && M) {
    const J = new M.Jelenet(ksvg, { yaw: 128, pitch: 26, vonal: '#2A221D', vastag: 1, keret: 40 });
    J.testek = M.fecskefark({ farok: '#C08A5A', csap: '#EBDCC8' });
    J.illeszt();
    const farok = J.testek.filter(t => t.csoport === 'farok');
    J.cimkek = [
      { p: [-1, 13, 10], dx: -40, dy: -46, szoveg: 'FAROKDESZKA', szin: '#C08A5A', meret: 13 },
      { p: [16, 14, 1], dx: 34, dy: -40, szoveg: 'CSAPDESZKA', szin: '#EBDCC8', meret: 13 }
    ];
    let d = halk ? 0 : 9, cel = 0, szet = false, yaw0 = 128, pitch0 = 26, cy = yaw0, cp = pitch0, ty = yaw0, tp = pitch0;
    let fut = false;
    function lep() {
      d += (cel - d) * 0.085; cy += (ty - cy) * 0.08; cp += (tp - cp) * 0.08;
      J.yaw = cy; J.pitch = cp;
      farok.forEach(t => { t.off = [-d, 0, 0]; });
      J.cimkek.forEach(c => { c.alpha = Math.min(1, Math.max(0, (d - 2.2) / 3)); });
      J.rajzol();
      if (Math.abs(cel - d) > 0.01 || Math.abs(ty - cy) > 0.05 || Math.abs(tp - cp) > 0.05) requestAnimationFrame(lep); else fut = false;
    }
    const indit = () => { if (!fut) { fut = true; requestAnimationFrame(lep); } };
    J.rajzol();
    if (!halk) setTimeout(() => { cel = 0; indit(); }, 650); else { d = 0; J.rajzol(); }
    const gomb = $('#kotesGomb');
    gomb.addEventListener('click', () => { szet = !szet; cel = szet ? 8 : 0; gomb.textContent = szet ? 'Összerakom' : 'Szétszedem'; gomb.setAttribute('aria-pressed', szet); indit(); });
    if (!halk) {
      let huz = null;
      ksvg.addEventListener('pointerdown', e => { huz = { x: e.clientX, y: e.clientY, yaw: ty, pitch: tp }; ksvg.setPointerCapture(e.pointerId); ksvg.style.cursor = 'grabbing'; });
      ksvg.addEventListener('pointermove', e => {
        if (huz) { ty = huz.yaw - (e.clientX - huz.x) * 0.35; tp = Math.max(8, Math.min(55, huz.pitch + (e.clientY - huz.y) * 0.25)); indit(); }
        else if (finom) { const r = ksvg.getBoundingClientRect(); ty = yaw0 - ((e.clientX - r.left) / r.width - .5) * 22; tp = pitch0 + ((e.clientY - r.top) / r.height - .5) * 10; indit(); }
      });
      const vege = () => { huz = null; ksvg.style.cursor = ''; };
      ksvg.addEventListener('pointerup', vege); ksvg.addEventListener('pointercancel', vege);
      ksvg.addEventListener('pointerleave', () => { if (!huz) { ty = yaw0; tp = pitch0; indit(); } });
    }
  }

  /* ---------------- FOLYAMAT: épülő tálaló ---------------- */
  const tsvg = $('#talalo');
  let talaloSzakasz = null;
  if (tsvg && M) {
    const SZ = { vaz: '#000', meret: '#9A846E', nyers: '#E7D8C4', front: '#E7D8C4', fiok: '#EFE4D4', lab: '#3F332A' };
    const KESZ = { front: '#C08A5A', fedlap: '#3F332A' };
    const J = new M.Jelenet(tsvg, { yaw: 142, pitch: 24, vonal: '#3F332A', vastag: .9, keret: 46 });
    J.testek = M.talalo(SZ);
    J.testek.forEach(t => { t.alap = [0, 0, 0]; t.lathato = 0; t.alpha = 0; t.melyseg = t.front ? 1.2 : t.szakasz === 3 ? 1.6 : 0; t.eredeti = t.szin; });
    J.illeszt();
    J.cimkek = [
      { p: [6, 1.3, -0.4], dx: 0, dy: 44, szoveg: '120 CM', szin: '#9A846E', meret: 12, sz: 0 },
      { p: [12, 4.4, 0], dx: 40, dy: 10, szoveg: '75 CM', szin: '#9A846E', meret: 12, sz: 0 },
      { p: [12, 1.3, 2.25], dx: 40, dy: 30, szoveg: '45 CM', szin: '#9A846E', meret: 12, sz: 0 },
      { p: [10.5, 6.6, -2.8], dx: 40, dy: -64, szoveg: 'FECSKEFARKAS FIÓK', szin: '#A6744A', meret: 12, sz: 2 }
    ];
    const kis = tsvg.getBoundingClientRect().width < 520; if (kis) J.cimkek.forEach(c => { c.meret = 19; });
    let akt = 0, yawCel = 150, fut = false;
    const N = ['Felmérés', 'Terv', 'Készítés', 'Beépítés'];
    function cel(t) {
      if (t.szakasz === 0) return akt === 0 ? 1 : 0.0;
      return t.szakasz <= akt ? 1 : 0;
    }
    function lep() {
      let mozog = false;
      J.testek.forEach(t => {
        const c = cel(t), v = t.lathato + (c - t.lathato) * 0.12;
        if (Math.abs(c - v) > 0.004) mozog = true;
        t.lathato = Math.abs(c - v) < 0.004 ? c : v;
        t.alpha = t.szakasz === 0 ? t.lathato : t.lathato;
        t.off = [0, (1 - ease(t.lathato)) * 2.2, 0];
        /* felület: a 4. lépésnél a frontok karamell, a fedlap sötét lesz */
        const kesz = akt >= 3;
        t.szin = kesz && t.front ? KESZ.front : kesz && t.fedlap ? KESZ.fedlap : t.eredeti;
      });
      J.cimkek.forEach(c => { const v = (c.sz === 0 ? akt === 0 : akt >= c.sz && akt < 3) ? 1 : 0; c.alpha = (c.alpha ?? 0) + (v - (c.alpha ?? 0)) * 0.15; if (Math.abs(v - c.alpha) > .01) mozog = true; });
      const dy = yawCel - J.yaw; J.yaw += dy * 0.08; if (Math.abs(dy) > .05) mozog = true;
      J.rajzol();
      if (mozog) requestAnimationFrame(lep); else fut = false;
    }
    const indit = () => { if (!fut) { fut = true; requestAnimationFrame(lep); } };
    talaloSzakasz = s => {
      if (s === akt && fut) return;
      akt = s; yawCel = 150 - s * 6;
      $('#allapot').innerHTML = `<b>0${s + 1}</b> · ${N[s]}`;
      if (halk) { J.testek.forEach(t => { t.lathato = cel(t); }); }
      indit();
    };
    J.yaw = 150; talaloSzakasz(0);
  }

  /* ---------------- MUNKÁK: fotóhelyek vonalas 3D vázlattal ----------------
     Valódi kép: foto: 'img/munkak/xy.jpg'. */
  const MUNKAK = [
    { cim: 'Konyhabútor', kat: 'Konyha', minta: 'konyha', foto: null },
    { cim: 'Beépített gardrób', kat: 'Szekrény', minta: 'gardrob', foto: null },
    { cim: 'Étkezőasztal', kat: 'Bútor', minta: 'asztal', foto: null },
    { cim: 'Komód', kat: 'Bútor', minta: 'komod', foto: null }
  ];
  const mr = $('#munkakRacs');
  if (mr) MUNKAK.forEach((m, i) => {
    const f = document.createElement('figure'); f.className = 'foto felfed';
    f.innerHTML = `<div class="foto-hely">${m.foto ? `<img src="${m.foto}" alt="${m.cim}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<svg viewBox="0 0 300 300" aria-hidden="true"></svg><span>Fotó helye · 0${i + 1}</span>`}</div><figcaption><span class="no">No. 0${i + 3}</span><h3>${m.cim}</h3><span>${m.kat}</span></figcaption>`;
    mr.appendChild(f);
    if (!m.foto && M) {
      const s = $('svg', f);
      const J = new M.Jelenet(s, { yaw: 145, pitch: 22, vonal: '#3F332A', vastag: .9, keret: 18 });
      const pal = { nyers: '#F3ECE2', front: '#F8F3EC', fiok: '#F3ECE2', lab: '#3F332A' };
      J.testek = M.kicsi(m.minta, pal); J.testek.forEach(t => { t.melyseg = t.szin === pal.front ? 1.2 : t.szin === pal.lab ? 1.6 : 0; });
      J.rajzol();
      if (!halk && finom) {
        let a = null;
        const forog = () => { J.yaw += (125 - J.yaw) * .06; J.rajzol(); if (Math.abs(125 - J.yaw) > .1 && a) requestAnimationFrame(forog); };
        f.addEventListener('pointerenter', () => { a = 1; requestAnimationFrame(forog); });
        f.addEventListener('pointerleave', () => { a = null; const vissza = () => { J.yaw += (145 - J.yaw) * .08; J.rajzol(); if (Math.abs(145 - J.yaw) > .1 && !a) requestAnimationFrame(vissza); }; requestAnimationFrame(vissza); });
      }
    }
  });

  /* ---------------- INTARZIA: görgetésre összeálló rozetta ---------------- */
  let rozetta = null;
  const rsvg = $('#rozetta');
  if (rsvg) {
    const C = { dio: '#3F332A', kar: '#C08A5A', kars: '#A6744A', vil: '#EBDCC8', hom: '#D6BE9C', var: '#F3ECE2' };
    const db = [];
    const P = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
    const pol = (r, a) => [300 + r * Math.cos(a * Math.PI / 180), 300 + r * Math.sin(a * Math.PI / 180)];
    const tesz = (d, f, csop) => db.push({ d, f, csop });
    /* keret: gérelt sávok */
    const o = 14, b = 58, e = 586;
    tesz(P([[o, o], [e, o], [e - b + o, b], [b, b]]), C.dio, 0); tesz(P([[e, o], [e, e], [e - b + o, e - b + o], [e - b + o, b]]), C.dio, 0);
    tesz(P([[e, e], [o, e], [b, e - b + o], [e - b + o, e - b + o]]), C.dio, 0); tesz(P([[o, e], [o, o], [b, b], [b, e - b + o]]), C.dio, 0);
    tesz(P([[b, b], [e - b + o, b], [e - b + o, e - b + o], [b, e - b + o]]), C.hom, 0);
    /* sarokban legyezők */
    [[b, b, 0], [e - b + o, b, 90], [e - b + o, e - b + o, 180], [b, e - b + o, 270]].forEach(([x, y, a0]) => {
      for (let k = 0; k < 6; k++) {
        const a = a0 + k * 15, r = 120, p1 = [x + r * Math.cos(a * Math.PI / 180), y + r * Math.sin(a * Math.PI / 180)], p2 = [x + r * Math.cos((a + 15) * Math.PI / 180), y + r * Math.sin((a + 15) * Math.PI / 180)];
        tesz(P([[x, y], p1, p2]), k % 2 ? C.vil : C.kars, 1);
      }
    });
    /* gyűrű és mező */
    tesz(`M${300 - 214} 300a214 214 0 1 0 428 0a214 214 0 1 0 -428 0Z M${300 - 198} 300a198 198 0 1 1 396 0a198 198 0 1 1 -396 0Z`, C.kar, 2);
    tesz(`M${300 - 198} 300a198 198 0 1 0 396 0a198 198 0 1 0 -396 0Z`, C.vil, 2);
    /* 16 ágú csillag: rövid ágak, majd hosszú ágak, két-két félben */
    const ag = (R, a, w, f1, f2, cs) => { const t = pol(R, a), l = pol(56, a - w), r = pol(56, a + w); tesz(P([[300, 300], t, l]), f1, cs); tesz(P([[300, 300], t, r]), f2, cs); };
    for (let k = 0; k < 8; k++) ag(132, 22.5 + k * 45, 22.5, C.hom, C.kars, 3);
    for (let k = 0; k < 8; k++) ag(192, k * 45, 22.5, C.dio, C.kar, 4);
    tesz(`M282 300a18 18 0 1 0 36 0a18 18 0 1 0 -36 0Z`, C.kar, 5);
    /* rajzolás */
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    rsvg.innerHTML = db.map(p => `<path d="${p.d}" fill="${p.f}" fill-rule="evenodd" stroke="${C.var}" stroke-width="1.4" stroke-linejoin="round"/>`).join('');
    const utak = $$('path', rsvg);
    db.forEach((p, i) => { p.el = utak[i]; p.dx = (rnd() - .5) * 420; p.dy = (rnd() - .5) * 420 - 60; p.r = (rnd() - .5) * 140; });
    const N = db.length;
    rozetta = () => {
      const r = rsvg.getBoundingClientRect();
      let pr = halk ? 1 : (innerHeight * 0.95 - r.top) / (r.height * 0.95 + innerHeight * 0.15);
      pr = Math.max(0, Math.min(1, pr));
      db.forEach((p, i) => {
        const s0 = (p.csop / 6) * 0.55 + (i / N) * 0.12;
        const t = ease(Math.max(0, Math.min(1, (pr - s0) / 0.3)));
        p.el.style.transform = t >= 1 ? '' : `translate(${(p.dx * (1 - t)).toFixed(1)}px,${(p.dy * (1 - t)).toFixed(1)}px) rotate(${(p.r * (1 - t)).toFixed(1)}deg)`;
        p.el.style.opacity = (0.15 + 0.85 * t).toFixed(3);
      });
    };
    rozetta();
  }

  /* ---------------- görgetés: megjelenés + folyamatlépések ---------------- */
  let varo = $$('.felfed');
  $$('.elv, .foto, .mutato li').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; });
  const lepesek = $$('.lepes');
  let tick = false;
  function frissit() {
    tick = false;
    const h = innerHeight * 0.88;
    varo = varo.filter(el => (el.getBoundingClientRect().top < h) ? (el.classList.add('lathato'), false) : true);
    if (rozetta) rozetta();
    if (lepesek.length && talaloSzakasz) {
      const kozep = innerWidth <= 900 ? innerHeight * 0.78 : innerHeight * 0.55;
      let best = 0, bd = 1e9;
      lepesek.forEach((l, i) => { const r = l.getBoundingClientRect(); const dd = Math.abs((r.top + r.bottom) / 2 - kozep); if (dd < bd) { bd = dd; best = i; } });
      lepesek.forEach((l, i) => l.classList.toggle('aktiv', i === best));
      talaloSzakasz(+lepesek[best].dataset.szakasz);
    }
  }
  const figyel = () => { if (!tick) { tick = true; requestAnimationFrame(frissit); } };
  addEventListener('scroll', figyel, { passive: true }); addEventListener('resize', figyel); frissit();

  /* ---------------- fejléc, menü ---------------- */
  const fej = $('#fejlec');
  const gorget = () => fej.classList.toggle('gorgetve', scrollY > 24);
  addEventListener('scroll', gorget, { passive: true }); gorget();
  const mg = $('#menuGomb');
  mg && mg.addEventListener('click', () => { const ny = document.body.classList.toggle('menu-nyitva'); mg.setAttribute('aria-expanded', ny); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-nyitva'); mg && mg.setAttribute('aria-expanded', 'false'); }));

  /* ---------------- űrlap (demó, nincs háttérrendszer) ---------------- */
  const urlap = $('#urlap'), vj = $('#visszajelzes'), kep = $('#kep');
  kep && kep.addEventListener('change', () => { $('#kepNev').textContent = kep.files.length ? `${kep.files.length} fájl kiválasztva` : 'Fotó vagy vázlat csatolása (nem kötelező)'; });
  urlap && urlap.addEventListener('submit', e => {
    e.preventDefault();
    const nev = urlap.nev.value.trim(), tel = urlap.tel.value.trim();
    if (!nev || !tel) { vj.textContent = 'Kérem, adja meg a nevét és a telefonszámát, hogy vissza tudjam hívni.'; vj.classList.add('lathato'); (!nev ? urlap.nev : urlap.tel).focus(); return; }
    vj.textContent = `Köszönöm, ${nev.split(' ')[0]}! (Látványterv: az űrlap még nincs bekötve — élesítéskor ide érkezik a visszaigazolás.)`;
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
  const allit = z => { bm.classList.toggle('zart', z); bk.setAttribute('aria-expanded', !z); bk.textContent = z ? 'Logó 1 · 4 · 5' : 'Logó'; };
  if (bm) { allit(innerWidth < 1100); bk.addEventListener('click', () => allit(!bm.classList.contains('zart'))); }
})();
