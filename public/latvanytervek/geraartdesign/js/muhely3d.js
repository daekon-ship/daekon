/* geraartdesign – kis, függőség nélküli 3D-rajzoló (SVG, ortografikus vetítés, festő-algoritmus).
   Asztalosi modellekhez: dobozok és kihúzott sokszögek (pl. fecskefarkas kötés).
   Nem fotó és nem WebGL: minden lap egy <path>, a fényt a lap normálisa adja. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];

  function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); }
  function rgb(a) { return `rgb(${a.map(v => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`; }
  function mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }

  /* Kihúzott sokszög: pts a (U,V) síkban, kihúzás W mentén w0..w1, o az origó. */
  function prism(pts, U, V, W, w0, w1, o, szin, extra) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) pts = pts.slice().reverse();
    o = o || [0, 0, 0];
    const P = (u, v, w) => add(o, add(add(mul(U, u), mul(V, v)), mul(W, w)));
    const uv = cross(U, V), sg = Math.sign(dot(W, uv)) || 1;
    const faces = [];
    faces.push({ v: pts.map(p => P(p[0], p[1], w1)), n: mul(uv, sg) });
    faces.push({ v: pts.map(p => P(p[0], p[1], w0)).reverse(), n: mul(uv, -sg) });
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const eu = b[0] - a[0], ev = b[1] - a[1];
      faces.push({ v: [P(a[0], a[1], w0), P(b[0], b[1], w0), P(b[0], b[1], w1), P(a[0], a[1], w1)], n: norm(add(mul(U, ev), mul(V, -eu))) });
    }
    return Object.assign({ faces, szin, off: [0, 0, 0], alpha: 1 }, extra || {});
  }
  function box(x0, y0, z0, x1, y1, z1, szin, extra) {
    return prism([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], X, Y, Z, z0, z1, [0, 0, 0], szin, extra);
  }

  /* Jelenet egy <svg>-ben */
  function Jelenet(svg, opt) {
    opt = Object.assign({ yaw: 135, pitch: 28, vonal: '#2A221D', vastag: 1, feny: norm([-0.55, 0.85, -0.35]), keret: 24 }, opt || {});
    this.svg = svg; this.opt = opt; this.testek = []; this.cimkek = [];
    this.yaw = opt.yaw; this.pitch = opt.pitch;
    this.g = document.createElementNS(NS, 'g'); svg.appendChild(this.g);
    this.gc = document.createElementNS(NS, 'g'); svg.appendChild(this.gc);
    this.fit = null;
  }
  Jelenet.prototype.forgat = function (p) {
    const a = this.yaw * Math.PI / 180, b = this.pitch * Math.PI / 180;
    const x = p[0] * Math.cos(a) + p[2] * Math.sin(a), z0 = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
    const y = p[1] * Math.cos(b) - z0 * Math.sin(b), z = p[1] * Math.sin(b) + z0 * Math.cos(b);
    return [x, y, z];
  };
  Jelenet.prototype.illeszt = function () {
    /* a látható méretet egyszer (alaphelyzetben) számolja, hogy forgatáskor ne „ugráljon” */
    let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9;
    this.testek.forEach(t => t.faces.forEach(f => f.v.forEach(p => {
      const r = this.forgat(add(t.xf ? t.xf(p) : p, t.alap || [0, 0, 0]));
      mx = Math.min(mx, r[0]); Mx = Math.max(Mx, r[0]); my = Math.min(my, r[1]); My = Math.max(My, r[1]);
    })));
    const vb = this.svg.viewBox.baseVal, k = this.opt.keret;
    const s = Math.min((vb.width - 2 * k) / (Mx - mx), (vb.height - 2 * k) / (My - my));
    this.fit = { s, cx: vb.x + vb.width / 2 - s * (mx + Mx) / 2, cy: vb.y + vb.height / 2 + s * (my + My) / 2 };
  };
  Jelenet.prototype.vetit = function (p) {
    const r = this.forgat(p), f = this.fit;
    return [f.cx + r[0] * f.s, f.cy - r[1] * f.s, r[2]];
  };
  Jelenet.prototype.rajzol = function () {
    if (!this.fit) this.illeszt();
    const lista = [];
    const L = this.opt.feny;
    this.testek.forEach(t => {
      if (t.alpha <= 0.001) return;
      const base = hex(t.szin);
      t.faces.forEach(f => {
        const n = t.xfn ? t.xfn(f.n) : f.n;
        const rn = this.forgat(n);
        if (rn[2] <= 1e-6) return;
        const pr = f.v.map(p => this.vetit(add(t.xf ? t.xf(p) : p, t.off)));
        const d = pr.reduce((s, p) => s + p[2], 0) / pr.length + (t.melyseg || 0);
        const fenyes = Math.max(0, dot(n, L));
        const c = fenyes > 0.5 ? mix(base, [255, 250, 242], (fenyes - 0.5) * 0.36) : mix(base, [30, 24, 20], (0.5 - fenyes) * 0.42);
        lista.push({ d, pts: pr, c: t.csakVonal ? 'none' : rgb(c), a: t.alpha, t });
      });
    });
    lista.sort((a, b) => a.d - b.d);
    let html = '';
    for (const f of lista) {
      const p = 'M' + f.pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
      const sw = f.t.vastag || this.opt.vastag, sc = f.t.vonal || this.opt.vonal;
      html += `<path d="${p}" fill="${f.c}" fill-opacity="${f.a}" stroke="${sc}" stroke-opacity="${Math.min(1, f.a * 1.2)}" stroke-width="${sw}" stroke-linejoin="round"${f.t.szaggatott ? ' stroke-dasharray="4 4"' : ''}/>`;
    }
    this.g.innerHTML = html;
    /* címkék: 3D horgonypont + 2D eltolás */
    let ch = '';
    this.cimkek.forEach(c => {
      if ((c.alpha ?? 1) <= 0.01) return;
      const p = this.vetit(c.p), q = [p[0] + c.dx, p[1] + c.dy];
      const a = c.alpha ?? 1;
      ch += `<g opacity="${a}"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${c.szin}"/>` +
        `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}h${c.dx < 0 ? -18 : 18}" stroke="${c.szin}" stroke-width="1" fill="none"/>` +
        `<text x="${(q[0] + (c.dx < 0 ? -24 : 24)).toFixed(1)}" y="${(q[1] + 4).toFixed(1)}" text-anchor="${c.dx < 0 ? 'end' : 'start'}" fill="${c.szin}" font-family="Kumbh Sans,system-ui,sans-serif" font-size="${c.meret || 12}" font-weight="600" letter-spacing="1.6">${c.szoveg}</text></g>`;
    });
    this.gc.innerHTML = ch;
  };

  /* ---------------------------------------------------------- modellek */

  /* Átmenő fecskefarkas kötés: farokdeszka (karamell) + csapdeszka (világos). Egység: cm */
  function fecskefark(sz) {
    const T = 2, H = 14, L = 20, kozepek = [3.4, 7, 10.6], nk = 0.75, sz2 = 1.3;
    const farok = [[L, 0], [L, H], [T, H]];
    kozepek.slice().reverse().forEach(c => { farok.push([T, c + nk], [0, c + sz2], [0, c - sz2], [T, c - nk]); });
    farok.push([T, 0]);
    /* farokdeszka: (z,y) síkban, x mentén 0..T */
    const farokTest = prism(farok, Z, Y, X, 0, T, [0, 0, 0], sz.farok, { csoport: 'farok' });
    const csapok = [];
    const c = kozepek;
    csapok.push([[0, H], [T, H], [T, c[2] + nk], [0, c[2] + sz2]]);
    csapok.push([[0, c[1] + sz2], [T, c[1] + nk], [T, c[2] - nk], [0, c[2] - sz2]]);
    csapok.push([[0, c[0] + sz2], [T, c[0] + nk], [T, c[1] - nk], [0, c[1] - sz2]]);
    csapok.push([[0, c[0] - sz2], [T, c[0] - nk], [T, 0], [0, 0]]);
    const csapTestek = csapok.map(p => prism(p, Z, Y, X, 0, T, [0, 0, 0], sz.csap, { csoport: 'csap' }));
    const csapDeszka = box(T, 0, 0, L, H, T, sz.csap, { csoport: 'csap' });
    return [farokTest, csapDeszka, ...csapTestek];
  }

  /* Tálalószekrény: 120×75×45 (dm-ben 12×7.5×4.5), szakaszokkal (stage) */
  function talalo(sz) {
    const W = 12, H = 6.2, D = 4.5, t = 0.25, lab = 1.3, yb = lab;
    const P = [];
    const b = (x0, y0, z0, x1, y1, z1, szin, e) => P.push(box(x0, y0, z0, x1, y1, z1, szin, e));
    /* 0: körvonal (csak vonal) */
    P.push(Object.assign(box(0, yb, 0, W, yb + H, D, sz.vaz, { szakasz: 0, csakVonal: true, szaggatott: true, vonal: sz.meret, vastag: 1 }), {}));
    /* 1: korpusz */
    b(0, yb, 0, t, yb + H, D, sz.nyers, { szakasz: 1 });
    b(W - t, yb, 0, W, yb + H, D, sz.nyers, { szakasz: 1 });
    b(t, yb, 0, W - t, yb + t, D, sz.nyers, { szakasz: 1 });
    b(t, yb + t, D - t, W - t, yb + H - t, D, sz.nyers, { szakasz: 1 });
    b(W / 2 - t / 2, yb + t, 0.3, W / 2 + t / 2, yb + H - t, D - t, sz.nyers, { szakasz: 1 });
    b(-0.15, yb + H - t, -0.15, W + 0.15, yb + H + 0.05, D + 0.05, sz.nyers, { szakasz: 1, fedlap: true });
    /* 2: ajtó (bal) + fiókok (jobb), a felső fiók kihúzva */
    b(t + 0.04, yb + t + 0.04, -t, W / 2 - t / 2 - 0.05, yb + H - t - 0.04, 0, sz.front, { szakasz: 2, front: true });
    const fx0 = W / 2 + t / 2 + 0.05, fx1 = W - t - 0.04, fh = (H - 2 * t) / 3;
    for (let i = 0; i < 3; i++) {
      const y0 = yb + t + i * fh + 0.04, y1 = y0 + fh - 0.08;
      const ki = i === 2 ? -2.6 : 0;
      b(fx0, y0, -t + ki, fx1, y1, ki, sz.front, { szakasz: 2, front: true, fiok: i });
      if (i === 2) { /* kihúzott fiók doboza */
        b(fx0 + 0.12, y0 + 0.15, ki, fx0 + 0.27, y1 - 0.25, ki + 3.6, sz.fiok, { szakasz: 2 });
        b(fx1 - 0.27, y0 + 0.15, ki, fx1 - 0.12, y1 - 0.25, ki + 3.6, sz.fiok, { szakasz: 2 });
        b(fx0 + 0.27, y0 + 0.15, ki + 3.45, fx1 - 0.27, y1 - 0.25, ki + 3.6, sz.fiok, { szakasz: 2 });
        b(fx0 + 0.27, y0 + 0.15, ki, fx1 - 0.27, y0 + 0.25, ki + 3.45, sz.fiok, { szakasz: 2 });
      }
    }
    /* 3: lábak, fogantyúk */
    [[0.5, 0.5], [W - 0.9, 0.5], [0.5, D - 0.9], [W - 0.9, D - 0.9]].forEach(([x, z]) => b(x, 0, z, x + 0.4, yb, z + 0.4, sz.lab, { szakasz: 3 }));
    for (let i = 0; i < 3; i++) {
      const y = yb + t + i * fh + fh / 2, ki = i === 2 ? -2.6 : 0;
      b((fx0 + fx1) / 2 - 0.6, y - 0.07, -t + ki - 0.12, (fx0 + fx1) / 2 + 0.6, y + 0.07, -t + ki, sz.lab, { szakasz: 3 });
    }
    b(W / 2 - t / 2 - 0.35, yb + H / 2 - 0.7, -t - 0.12, W / 2 - t / 2 - 0.22, yb + H / 2 + 0.7, -t, sz.lab, { szakasz: 3 });
    return P;
  }

  /* egyszerű vonalas modellek a fotóhelyekre */
  function kicsi(tipus, sz) {
    const P = [], b = (...a) => P.push(box(...a));
    if (tipus === 'konyha') {
      b(0, 0, 0, 10, 0.4, 3, sz.lab); b(0, 0.4, 0, 10, 4.4, 3, sz.nyers); b(-0.1, 4.4, -0.1, 10.1, 4.65, 3.1, sz.lab);
      for (let i = 0; i < 4; i++) b(i * 2.5 + 0.05, 0.45, -0.12, i * 2.5 + 2.45, 4.35, 0, sz.front);
      b(0, 6.4, 1.2, 10, 9.4, 3, sz.nyers); for (let i = 0; i < 4; i++) b(i * 2.5 + 0.05, 6.45, 1.08, i * 2.5 + 2.45, 9.35, 1.2, sz.fiok);
    } else if (tipus === 'gardrob') {
      b(0, 0, 0, 7, 11, 3.2, sz.nyers);
      for (let i = 0; i < 3; i++) b(i * 2.333 + 0.05, 0.05, -0.12, i * 2.333 + 2.28, 10.95, 0, sz.front);
      for (let i = 0; i < 3; i++) b(i * 2.333 + 1.9, 4.8, -0.3, i * 2.333 + 2.0, 6.2, -0.12, sz.lab);
    } else if (tipus === 'asztal') {
      b(0, 3.4, 0, 9, 3.75, 4.6, sz.front);
      [[0.4, 0.4], [8.2, 0.4], [0.4, 3.8], [8.2, 3.8]].forEach(([x, z]) => b(x, 0, z, x + 0.4, 3.4, z + 0.4, sz.lab));
      b(0.8, 2.9, 0.4, 8.2, 3.4, 0.6, sz.nyers);
    } else if (tipus === 'komod') {
      b(0, 0.8, 0, 6, 6.8, 3, sz.nyers); b(-0.1, 6.8, -0.1, 6.1, 7.05, 3.1, sz.lab);
      for (let i = 0; i < 3; i++) { b(0.1, 0.9 + i * 1.95, -0.12, 5.9, 2.75 + i * 1.95, 0, sz.front); b(2.5, 1.75 + i * 1.95, -0.25, 3.5, 1.9 + i * 1.95, -0.12, sz.lab); }
      [[0.3, 0.3], [5.3, 0.3], [0.3, 2.3], [5.3, 2.3]].forEach(([x, z]) => b(x, 0, z, x + 0.4, 0.8, z + 0.4, sz.lab));
    }
    return P;
  }

  /* Intarziás doboz: test + fedél, a fedélen berakott minta (vékony lapok) */
  function doboz(sz) {
    const W = 10, H = 3.2, D = 7, f = 0.7, P = [];
    const b = (...a) => { const t = box(...a); P.push(t); return t; };
    /* test: üreges – négy oldalfal + fenék + sötét bélés */
    const v = 0.4;
    b(0, 0, 0, W, v, D, sz.test, { resz: 'test' });
    b(0, v, 0, W, H, v, sz.test, { resz: 'test' });
    b(0, v, D - v, W, H, D, sz.test, { resz: 'test' });
    b(0, v, v, v, H, D - v, sz.test, { resz: 'test' });
    b(W - v, v, v, W, H, D - v, sz.test, { resz: 'test' });
    b(v, v, v, W - v, v + 0.08, D - v, sz.belso, { resz: 'test' });
    /* fedél */
    const fedel = b(-0.05, H + 0.06, -0.05, W + 0.05, H + 0.06 + f, D + 0.05, sz.test, { resz: 'fedel' });
    const fy = H + 0.06 + f;
    b(0.35, H + 0.02, 0.35, W - 0.35, H + 0.06, D - 0.35, sz.belso, { resz: 'fedel' });
    /* berakás a fedél tetején: (x,z) síkban, Y mentén kihúzva */
    const lap = (pts, szin, sorrend) => {
      const h0 = fy + sorrend * 0.012; const t = prism(pts, X, Z, Y, h0, h0 + 0.03, [0, 0, 0], szin, { resz: 'fedel', berakas: sorrend, melyseg: 4 + sorrend * 0.6 });
      P.push(t); return t;
    };
    const cx = W / 2, cz = D / 2;
    /* szegély-csíkok */
    const m = 0.45, s = 0.12;
    lap([[m, m], [W - m, m], [W - m, m + s], [m, m + s]], sz.vil, 0);
    lap([[m, D - m - s], [W - m, D - m - s], [W - m, D - m], [m, D - m]], sz.vil, 0);
    lap([[m, m + s], [m + s, m + s], [m + s, D - m - s], [m, D - m - s]], sz.vil, 0);
    lap([[W - m - s, m + s], [W - m, m + s], [W - m, D - m - s], [W - m - s, D - m - s]], sz.vil, 0);
    /* rombusz-mező, négy háromszögre bontva (két tónus) */
    const rx = 3.2, rz = 2.3;
    const T = [cx, cz - rz], Rr = [cx + rx, cz], B = [cx, cz + rz], Lr = [cx - rx, cz], C0 = [cx, cz];
    lap([Lr, T, C0], sz.vil, 1); lap([T, Rr, C0], sz.hom, 1); lap([Rr, B, C0], sz.vil, 1); lap([B, Lr, C0], sz.hom, 1);
    /* belső rombusz – dió */
    const k = 0.55;
    lap([[cx - rx * k, cz], [cx, cz - rz * k], [cx + rx * k, cz], [cx, cz + rz * k]], sz.dio, 2);
    /* közép – világos négyzet 45°-ban */
    const q = 0.42;
    lap([[cx - q, cz], [cx, cz - q], [cx + q, cz], [cx, cz + q]], sz.vil, 3);
    /* sarokháromszögek */
    const sar = 1.3, e0 = m + s + 0.15;
    lap([[e0, e0], [e0 + sar, e0], [e0, e0 + sar]], sz.dio, 2);
    lap([[W - e0, e0], [W - e0, e0 + sar], [W - e0 - sar, e0]], sz.dio, 2);
    lap([[W - e0, D - e0], [W - e0 - sar, D - e0], [W - e0, D - e0 - sar]], sz.dio, 2);
    lap([[e0, D - e0], [e0, D - e0 - sar], [e0 + sar, D - e0]], sz.dio, 2);
    /* kis fogantyú-gomb elöl */
    b(cx - 0.5, H - 0.55, -0.22, cx + 0.5, H - 0.25, 0, sz.dio, { resz: 'test', melyseg: 1 });
    return { reszek: P, zsanerY: H + 0.06, zsanerZ: D + 0.05 };
  }

  window.Muhely3D = { Jelenet, prism, box, fecskefark, talalo, kicsi, doboz };
})();
