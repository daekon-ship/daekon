/* geraartdesign – programból rajzolt intarziaminták (SVG + furnértextúra).
   Nem fotók: a portfólió valódi munkáinak helyét jelölik, amíg a műhely fotói meg nem érkeznek.
   A textúrák: img/furner-*.jpg (_forras/furner.py). */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const BASE = (document.currentScript && document.currentScript.dataset.base) || '';
  const FAJ = {
    juhar: 'img/furner-juhar.jpg', koris: 'img/furner-koris.jpg', korte: 'img/furner-korte.jpg',
    cseresznye: 'img/furner-cseresznye.jpg', tolgy: 'img/furner-tolgy.jpg', dio: 'img/furner-dio.jpg'
  };
  let uid = 0;

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* Rajzlap: viewBox + defs + furnérkitöltés-gyár (fafaj, rostirány fokban) */
  function lap(holder, w, h, label) {
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label || 'Rajzolt intarziaminta', preserveAspectRatio: 'xMidYMid slice' });
    const defs = el('defs', {}, svg);
    const cache = {};
    const id0 = 'iz' + (++uid);
    function fill(faj, szog, meret) {
      szog = Math.round(szog || 0); meret = meret || 260;
      const key = faj + szog + '_' + meret;
      if (!cache[key]) {
        const id = `${id0}-${Object.keys(cache).length}`;
        const p = el('pattern', { id, patternUnits: 'userSpaceOnUse', width: meret, height: meret, patternTransform: `rotate(${szog})` }, defs);
        el('image', { href: BASE + FAJ[faj], width: meret, height: meret, preserveAspectRatio: 'none' }, p);
        cache[key] = `url(#${id})`;
      }
      return cache[key];
    }
    const root = el('g', {}, svg);
    let g = root;
    holder.appendChild(svg);
    let i = 0;
    function darab(d, faj, szog, meret, extra) {
      return el('path', Object.assign({ d, fill: fill(faj, szog, meret), class: 'pc', style: `--i:${i++}` }, extra || {}), g);
    }
    function vonal(d, w, szin) {
      return el('path', { d, fill: 'none', stroke: szin || 'rgba(70,52,38,.28)', 'stroke-width': w || .8, class: 'ln', pathLength: 1, style: `--i:${i++}` }, g);
    }
    function eltol(dx, dy) { g = dx === null ? root : el('g', { transform: `translate(${dx} ${dy})` }, root); }
    return { svg, fill, darab, vonal, eltol, el };
  }

  const P = (pts) => 'M' + pts.map(p => p.map(v => +v.toFixed(2)).join(' ')).join('L') + 'Z';
  const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

  /* Keresztsávos keret gérvágott sarkokkal + berakott szegély (stringing) */
  function keret(L, w, h, b, faj, belso) {
    L.darab(P([[0, 0], [w, 0], [w - b, b], [b, b]]), faj, 0);
    L.darab(P([[w, 0], [w, h], [w - b, h - b], [w - b, b]]), faj, 90);
    L.darab(P([[w, h], [0, h], [b, h - b], [w - b, h - b]]), faj, 0);
    L.darab(P([[0, h], [0, 0], [b, b], [b, h - b]]), faj, 90);
    const s = 3.2;
    L.darab(`M${b} ${b}H${w - b}V${h - b}H${b}Z M${b + s} ${b + s}V${h - b - s}H${w - b - s}V${b + s}Z`, belso || 'juhar', 0, 260, { 'fill-rule': 'evenodd' });
    return b + s;
  }

  function napsugar(L, cx, cy, r, n, a0, a1, fajok, kozep) {
    const step = (a1 - a0) / n;
    for (let k = 0; k < n; k++) {
      const s = a0 + k * step, e = s + step;
      const mid = (s + e) / 2;
      const d = P([[cx, cy], polar(cx, cy, r, s), polar(cx, cy, r, e)]);
      const p = L.darab(d, fajok[k % fajok.length], mid * 180 / Math.PI + 90);
      p.classList.add('wedge'); p.style.transformOrigin = `${cx}px ${cy}px`;
    }
    if (kozep) {
      const rr = r * kozep;
      L.darab(`M${cx - rr} ${cy}A${rr} ${rr} 0 0 1 ${cx + rr} ${cy}Z`, 'dio', 0);
    }
  }

  function csillag(L, cx, cy, R, ag, fajA, fajB) {
    const r = R * 0.38;
    for (let k = 0; k < ag; k++) {
      const a = -Math.PI / 2 + k * 2 * Math.PI / ag;
      const tip = polar(cx, cy, R, a);
      const l = polar(cx, cy, r, a - Math.PI / ag), rr = polar(cx, cy, r, a + Math.PI / ag);
      const deg = a * 180 / Math.PI + 90;
      L.darab(P([[cx, cy], l, tip]), fajA, deg);
      L.darab(P([[cx, cy], tip, rr]), fajB, deg);
    }
  }

  /* -------- minták -------- */
  const MINTAK = {
    hero(holder) {
      const W = 500, H = 600, L = lap(holder, W, H, 'Rajzolt intarziatábla: napsugár és iránytűcsillag hat fafaj furnérjából');
      L.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const b = keret(L, W, H, 30, 'dio', 'juhar');
      L.darab(`M${b} ${b}H${W - b}V${H - b}H${b}Z`, 'korte', 0, 300);
      // napsugár a mező alján
      napsugar(L, W / 2, H - b, 196, 16, Math.PI, 2 * Math.PI, ['cseresznye', 'juhar'], 0.17);
      L.vonal(`M${W / 2 - 214} ${H - b}A214 214 0 0 1 ${W / 2 + 214} ${H - b}`, 2.4, 'rgba(242,231,213,.95)');
      L.vonal(`M${W / 2 - 222} ${H - b}A222 222 0 0 1 ${W / 2 + 222} ${H - b}`, .7);
      // díszítősáv: váltakozó dió–juhar kockák két juharszegély között
      const sy = b + 196, sh = 14, fx0 = b, fx1 = W - b;
      L.darab(`M${fx0} ${sy - 3}H${fx1}V${sy}H${fx0}Z`, 'juhar', 90);
      for (let x = fx0, k = 0; x < fx1; x += sh, k++) L.darab(`M${x} ${sy}H${Math.min(x + sh, fx1)}V${sy + sh}H${x}Z`, k % 2 ? 'juhar' : 'dio', k % 2 ? 0 : 90);
      L.darab(`M${fx0} ${sy + sh}H${fx1}V${sy + sh + 3}H${fx0}Z`, 'juhar', 90);
      // iránytűcsillag
      csillag(L, W - b - 74, b + 82, 48, 8, 'dio', 'juhar');
      L.vonal(`M${W - b - 74 - 58} ${b + 82}a58 58 0 1 0 116 0a58 58 0 1 0 -116 0`, .7);
    },
    kocka(holder) {
      const W = 600, H = 600, L = lap(holder, W, H, 'Rajzolt intarziaminta: kocka (Lajos-kocka)');
      const s = 52, hgt = s * Math.sqrt(3) / 2;
      for (let row = -1; row < H / (s * 1.5) + 1; row++) {
        for (let col = -1; col < W / (hgt * 2) + 1; col++) {
          const cx = col * hgt * 2 + (row % 2 ? hgt : 0), cy = row * s * 1.5;
          const top = [cx, cy - s], r = [cx + hgt, cy - s / 2], br = [cx + hgt, cy + s / 2], bot = [cx, cy + s], bl = [cx - hgt, cy + s / 2], l = [cx - hgt, cy - s / 2], c = [cx, cy];
          L.darab(P([top, r, c, l]), 'juhar', 30);
          L.darab(P([l, c, bot, bl]), 'cseresznye', 90);
          L.darab(P([c, r, br, bot]), 'dio', -30);
        }
      }
    },
    halszalka(holder) {
      const W = 600, H = 600, L = lap(holder, W, H, 'Rajzolt intarziaminta: francia halszálka (chevron)');
      const cw = 60, h = 30;
      for (let col = 0; col * cw < W; col++) {
        const x = col * cw, A = col % 2 === 0;
        for (let y = -cw - h, k = 0; y < H + h; y += h, k++) {
          const d = A ? P([[x, y], [x + cw, y + cw], [x + cw, y + cw + h], [x, y + h]])
                      : P([[x, y + cw], [x + cw, y], [x + cw, y + h], [x, y + cw + h]]);
          const faj = ['korte', 'koris', 'tolgy'][(k + col) % 3];
          L.darab(d, faj, A ? -45 : 45);
        }
      }
    },
    napsugar(holder) {
      const W = 600, H = 600, L = lap(holder, W, H, 'Rajzolt intarziaminta: legyezős napsugár');
      L.darab(`M0 0H${W}V${H}H0Z`, 'juhar', 0, 300);
      napsugar(L, W / 2, H / 2, 420, 24, 0, 2 * Math.PI, ['korte', 'cseresznye'], 0);
      L.darab(`M${W / 2 - 34} ${H / 2}a34 34 0 1 0 68 0a34 34 0 1 0 -68 0`, 'dio', 0);
      L.vonal(`M${W / 2 - 40} ${H / 2}a40 40 0 1 0 80 0a40 40 0 1 0 -80 0`, 2, 'rgba(242,231,213,.9)');
    },
    sakk(holder) {
      const W = 600, H = 600, L = lap(holder, W, H, 'Rajzolt intarziaminta: sakktábla, váltakozó rostiránnyal');
      const s = 75;
      for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
        const odd = ((x + y) / s) % 2;
        L.darab(P([[x, y], [x + s, y], [x + s, y + s], [x, y + s]]), odd ? 'dio' : 'juhar', odd ? 90 : 0);
      }
    },
    csillag(holder) {
      const W = 600, H = 600, L = lap(holder, W, H, 'Rajzolt intarziaminta: iránytűcsillag');
      L.darab(`M0 0H${W}V${H}H0Z`, 'koris', 0, 300);
      L.darab(`M${W / 2 - 230} ${H / 2}a230 230 0 1 0 460 0a230 230 0 1 0 -460 0`, 'dio', 90);
      L.darab(`M${W / 2 - 222} ${H / 2}a222 222 0 1 0 444 0a222 222 0 1 0 -444 0`, 'korte', 0);
      csillag(L, W / 2, H / 2, 200, 16, 'cseresznye', 'juhar');
      csillag(L, W / 2, H / 2, 120, 8, 'dio', 'juhar');
    },
    keret(holder) {
      const W = 600, H = 600, L = lap(holder, W, H, 'Rajzolt intarziaminta: keresztsávos tábla');
      const b = keret(L, W, H, 64, 'cseresznye', 'juhar');
      const b2 = b + 26;
      L.darab(`M${b} ${b}H${W - b}V${H - b}H${b}Z`, 'dio', 90);
      L.eltol(b2, b2); keret(L, W - 2 * b2, H - 2 * b2, 36, 'tolgy', 'juhar'); L.eltol(null);
      const c = b2 + 36 + 3.2;
      L.darab(`M${c} ${c}H${W - c}V${H - c}H${c}Z`, 'korte', 0, 300);
    }
  };

  /* data-intarzia="minta" elemek kitöltése */
  function feltolt(root) {
    (root || document).querySelectorAll('[data-intarzia]').forEach(h => {
      if (h.dataset.kesz) return;
      const m = MINTAK[h.dataset.intarzia];
      if (m) { m(h); h.dataset.kesz = '1'; }
    });
  }
  window.Intarzia = { feltolt, MINTAK };
  if (document.readyState !== 'loading') feltolt(); else document.addEventListener('DOMContentLoaded', () => feltolt());
})();
