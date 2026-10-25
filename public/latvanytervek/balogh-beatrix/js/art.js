/* ==========================================================================
   BB art — programból rajzolt csendéletek a fotóhelyekre
   --------------------------------------------------------------------------
   Nem fotók és nem Balogh Beatrix munkái. Minden [data-art] elem helyére
   kerül; ha az elemnek van data-src attribútuma (saját fotó), akkor az
   kerül a helyére. Csere: data-src="img/sajat-foto.jpg".
   ========================================================================== */
(function () {
  'use strict';
  var uid = 0;

  var TONES = {
    light: { w1: '#F2ECE4', w2: '#E5DACD', t1: '#DFD3C4', t2: '#CDBEAC', beam: .5, frame: .05 },
    cream: { w1: '#EDE4D8', w2: '#DCCDBC', t1: '#D6C6B3', t2: '#C2AF9A', beam: .42, frame: .06 },
    sage:  { w1: '#DCDfD5', w2: '#C3C8BA', t1: '#CFCBBE', t2: '#BAB4A4', beam: .38, frame: .06 },
    dark:  { w1: '#3B3431', w2: '#2B2725', t1: '#4A413C', t2: '#352F2C', beam: .14, frame: .12 }
  };

  function defs(p, T) {
    return '<defs>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + T.w1 + '"/><stop offset="1" stop-color="' + T.w2 + '"/></linearGradient>' +
      '<linearGradient id="' + p + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + T.t1 + '"/><stop offset="1" stop-color="' + T.t2 + '"/></linearGradient>' +
      '<linearGradient id="' + p + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + p + 'cer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CDBFAE"/><stop offset=".32" stop-color="#F7F2EB"/><stop offset=".62" stop-color="#E8DED2"/><stop offset="1" stop-color="#BFAF9C"/></linearGradient>' +
      '<radialGradient id="' + p + 'wat" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="#E4E7DE"/><stop offset=".6" stop-color="#C5CCBD"/><stop offset="1" stop-color="#A9B29F"/></radialGradient>' +
      '<linearGradient id="' + p + 'leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#AEB6A4"/><stop offset="1" stop-color="#7E8975"/></linearGradient>' +
      '<linearGradient id="' + p + 'esp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F1C1B"/><stop offset=".35" stop-color="#5A504B"/><stop offset=".55" stop-color="#2B2725"/><stop offset="1" stop-color="#161413"/></linearGradient>' +
      '<linearGradient id="' + p + 'gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E6E55"/><stop offset=".35" stop-color="#E2C7AE"/><stop offset=".6" stop-color="#BE9A7B"/><stop offset="1" stop-color="#7D5F48"/></linearGradient>' +
      '<radialGradient id="' + p + 'stone" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9A9088"/><stop offset=".55" stop-color="#5F5751"/><stop offset="1" stop-color="#3A3431"/></radialGradient>' +
      '<radialGradient id="' + p + 'stone2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#D4CBC0"/><stop offset=".6" stop-color="#ADA295"/><stop offset="1" stop-color="#857A6E"/></radialGradient>' +
      '<radialGradient id="' + p + 'stone3" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#C2C7B9"/><stop offset=".6" stop-color="#959D8B"/><stop offset="1" stop-color="#6E7665"/></radialGradient>' +
      '<filter id="' + p + 'blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>' +
      '<filter id="' + p + 'blur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5"/></filter>' +
      '</defs>';
  }

  function backdrop(p, T, h) {
    return '<rect width="400" height="' + h + '" fill="url(#' + p + 'w)"/>' +
      '<rect y="' + h + '" width="400" height="' + (500 - h) + '" fill="url(#' + p + 't)"/>' +
      '<rect y="' + h + '" width="400" height="1.2" fill="#fff" opacity=".35"/>' +
      /* ablakfény és az ablakkeret árnyéka */
      '<polygon points="0,0 190,0 400,250 400,470 0,210" fill="url(#' + p + 'l)" opacity="' + T.beam + '"/>' +
      '<polygon points="96,0 112,0 400,330 400,352" fill="#000" opacity="' + T.frame + '" filter="url(#' + p + 'blur2)"/>' +
      '<polygon points="0,86 0,100 400,428 400,412" fill="#000" opacity="' + (T.frame * .8) + '" filter="url(#' + p + 'blur2)"/>';
  }

  function shadow(p, cx, cy, rx, ry, o) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#2B2725" opacity="' + (o || .22) + '" filter="url(#' + p + 'blur)"/>';
  }

  function leaf(p, x, y, rot, s) {
    return '<path transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (s || 1) + ')" d="M0 0 C 8 -11, 26 -12, 38 0 C 26 11, 8 11, 0 0 Z" fill="url(#' + p + 'leaf)"/>' +
      '<path transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (s || 1) + ')" d="M2 0 H 34" stroke="#6E7866" stroke-width=".8" opacity=".5"/>';
  }

  function sprig(p, pts, stem) {
    var out = '<path d="' + stem + '" fill="none" stroke="#7A8471" stroke-width="2.2" stroke-linecap="round"/>';
    pts.forEach(function (l) { out += leaf(p, l[0], l[1], l[2], l[3]); });
    return out;
  }

  function towel(x, y, w, h, c, dark) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="11" fill="' + c + '"/>' +
      '<rect x="' + (x + 4) + '" y="' + (y + 2) + '" width="' + (w - 8) + '" height="3" rx="1.5" fill="#fff" opacity=".35"/>' +
      '<path d="M' + (x + 10) + ' ' + (y + h * .58) + ' H ' + (x + w - 10) + '" stroke="' + dark + '" stroke-width="1.2" opacity=".35"/>' +
      '<path d="M' + (x + 10) + ' ' + (y + h - 4) + ' H ' + (x + w - 10) + '" stroke="' + dark + '" stroke-width="2" opacity=".25"/>';
  }

  function roll(cx, cy, r, c, dark) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + c + '"/>' +
      '<circle cx="' + (cx + r * .05) + '" cy="' + (cy + r * .04) + '" r="' + (r * .74) + '" fill="none" stroke="' + dark + '" stroke-width="1.6" opacity=".32"/>' +
      '<circle cx="' + (cx + r * .1) + '" cy="' + (cy + r * .07) + '" r="' + (r * .48) + '" fill="none" stroke="' + dark + '" stroke-width="1.6" opacity=".32"/>' +
      '<circle cx="' + (cx + r * .14) + '" cy="' + (cy + r * .1) + '" r="' + (r * .22) + '" fill="' + dark + '" opacity=".22"/>' +
      '<path d="M' + (cx - r * .7) + ' ' + (cy - r * .55) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r * .2) + ' ' + (cy - r * .96) + '" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>';
  }

  var SCENES = {
    /* Lábfürdő tál, törölközők, eukaliptusz — hero */
    labfurdo: function (p, T) {
      return backdrop(p, T, 300) +
        sprig(p, [[118, 250, -70, 1], [104, 228, -125, .95], [124, 206, -60, .9], [108, 182, -130, .9], [132, 160, -55, .85], [118, 138, -120, .8], [142, 118, -50, .75], [134, 100, -105, .7]], 'M112 300 C 104 250, 118 180, 150 96') +
        shadow(p, 315, 302, 76, 10, .2) +
        towel(240, 262, 142, 40, '#ECE5DB', '#9C8D7C') +
        towel(248, 228, 128, 36, '#D3C7B7', '#8E7D6A') +
        towel(258, 198, 108, 32, '#AEB4A4', '#6F7866') +
        shadow(p, 196, 440, 150, 16, .28) +
        '<path d="M55 330 C 60 396, 115 434, 190 436 C 265 434, 320 396, 325 330 Z" fill="url(#' + p + 'cer)"/>' +
        '<ellipse cx="190" cy="330" rx="135" ry="30" fill="#F6F1EA"/>' +
        '<ellipse cx="190" cy="332" rx="123" ry="24" fill="url(#' + p + 'wat)"/>' +
        '<ellipse cx="172" cy="330" rx="58" ry="8" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55"/>' +
        '<ellipse cx="166" cy="329" rx="28" ry="4" fill="none" stroke="#fff" stroke-width="1" opacity=".45"/>' +
        leaf(p, 214, 334, -14, .7) + leaf(p, 236, 328, 160, .55) +
        '<path d="M70 352 C 90 410, 140 428, 190 430" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>' +
        shadow(p, 80, 470, 34, 6, .3) +
        '<ellipse cx="78" cy="460" rx="28" ry="14" fill="url(#' + p + 'stone)"/>' +
        '<ellipse cx="72" cy="455" rx="10" ry="3.5" fill="#fff" opacity=".22"/>';
    },

    /* Feltekert törölközők piramisa */
    torolkozo: function (p, T) {
      return backdrop(p, T, 320) +
        shadow(p, 200, 432, 150, 14, .26) +
        roll(150, 384, 48, '#E9E1D6', '#8E7D6A') +
        roll(248, 384, 48, '#D0C3B2', '#7E6D5B') +
        roll(199, 304, 48, '#B3B9A9', '#677060') +
        sprig(p, [[250, 262, -30, .8], [268, 248, 40, .75], [282, 236, -40, .7], [298, 226, 30, .65]], 'M232 272 C 260 252, 290 236, 320 222') +
        shadow(p, 340, 452, 30, 6, .26) +
        '<ellipse cx="340" cy="444" rx="24" ry="11" fill="url(#' + p + 'stone2)"/>' +
        '<ellipse cx="334" cy="440" rx="8" ry="3" fill="#fff" opacity=".3"/>';
    },

    /* Két körömlakk egy összehajtott törölközőn */
    lakk: function (p, T) {
      return backdrop(p, T, 330) +
        shadow(p, 205, 380, 160, 12, .22) +
        towel(52, 338, 300, 40, '#EFE8DE', '#9C8D7C') +
        /* nagy üveg */
        shadow(p, 186, 340, 52, 8, .35) +
        '<rect x="112" y="250" width="78" height="94" rx="15" fill="#B48E70"/>' +
        '<rect x="112" y="250" width="78" height="94" rx="15" fill="url(#' + p + 'gold)" opacity=".75"/>' +
        '<rect x="121" y="262" width="9" height="70" rx="4.5" fill="#fff" opacity=".42"/>' +
        '<rect x="138" y="236" width="26" height="16" fill="#E9E0D4"/>' +
        '<rect x="134" y="150" width="34" height="90" rx="4" fill="url(#' + p + 'esp)"/>' +
        '<rect x="140" y="156" width="4" height="78" rx="2" fill="#fff" opacity=".18"/>' +
        /* kisebb üveg */
        shadow(p, 262, 342, 42, 7, .3) +
        '<rect x="222" y="276" width="66" height="70" rx="13" fill="#E5D1C1"/>' +
        '<rect x="222" y="276" width="66" height="70" rx="13" fill="#fff" opacity=".12"/>' +
        '<rect x="230" y="286" width="7" height="50" rx="3.5" fill="#fff" opacity=".5"/>' +
        '<rect x="243" y="264" width="24" height="14" fill="#EFE8DE"/>' +
        '<rect x="239" y="204" width="32" height="64" rx="4" fill="url(#' + p + 'gold)"/>' +
        '<rect x="244" y="210" width="3.5" height="52" rx="1.75" fill="#fff" opacity=".3"/>' +
        /* reszelő */
        shadow(p, 200, 440, 110, 6, .22) +
        '<g transform="rotate(-6 200 430)"><rect x="92" y="423" width="216" height="15" rx="7.5" fill="#D9C6B3"/><rect x="92" y="423" width="216" height="5" rx="2.5" fill="#fff" opacity=".35"/></g>';
    },

    /* Kövek, olajos üvegcse, ág */
    ko: function (p, T) {
      return backdrop(p, T, 318) +
        shadow(p, 208, 410, 104, 14, .3) +
        '<ellipse cx="206" cy="386" rx="86" ry="32" fill="url(#' + p + 'stone)"/>' +
        '<ellipse cx="211" cy="343" rx="62" ry="24" fill="url(#' + p + 'stone2)"/>' +
        '<ellipse cx="202" cy="309" rx="40" ry="17" fill="url(#' + p + 'stone3)"/>' +
        '<ellipse cx="190" cy="372" rx="30" ry="6" fill="#fff" opacity=".14"/>' +
        '<ellipse cx="196" cy="334" rx="22" ry="5" fill="#fff" opacity=".26"/>' +
        '<ellipse cx="192" cy="302" rx="13" ry="4" fill="#fff" opacity=".3"/>' +
        /* cseppentős üveg */
        shadow(p, 82, 418, 30, 6, .3) +
        '<rect x="56" y="330" width="52" height="88" rx="10" fill="#B88B66" opacity=".88"/>' +
        '<rect x="63" y="340" width="6" height="66" rx="3" fill="#fff" opacity=".4"/>' +
        '<rect x="66" y="316" width="32" height="16" rx="2" fill="url(#' + p + 'gold)"/>' +
        '<path d="M70 316 C 70 288, 94 288, 94 316 Z" fill="#2B2725"/>' +
        sprig(p, [[300, 452, -150, .8], [318, 446, 150, .78], [334, 440, -160, .72], [350, 432, 160, .66]], 'M282 462 C 310 450, 340 440, 372 424');
    },

    /* Paraffinos tál, spatula, gőz */
    paraffin: function (p, T) {
      return backdrop(p, T, 316) +
        towel(26, 280, 120, 38, '#D3C7B7', '#8E7D6A') +
        shadow(p, 214, 420, 150, 14, .26) +
        '<path d="M86 350 C 92 396, 140 418, 214 418 C 288 418, 336 396, 342 350 Z" fill="url(#' + p + 'cer)"/>' +
        '<ellipse cx="214" cy="350" rx="128" ry="28" fill="#F7F2EB"/>' +
        '<ellipse cx="214" cy="352" rx="116" ry="22" fill="#F3E9D6"/>' +
        '<path d="M140 354 C 170 342, 200 366, 232 352 C 258 342, 282 360, 296 352" stroke="#DCC9A8" stroke-width="2" fill="none" opacity=".8"/>' +
        '<g transform="rotate(-24 260 330)"><rect x="196" y="322" width="150" height="14" rx="7" fill="#C9A887"/><rect x="196" y="322" width="150" height="4" rx="2" fill="#fff" opacity=".3"/></g>' +
        '<path d="M180 318 C 168 296, 192 284, 180 262 C 170 244, 188 232, 180 214" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>' +
        '<path d="M214 310 C 204 290, 226 276, 214 254 C 204 236, 222 222, 214 206" stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>' +
        '<path d="M248 318 C 238 300, 258 288, 248 268" stroke="#fff" stroke-width="1.8" fill="none" opacity=".35" stroke-linecap="round"/>';
    },

    /* Kézápolás: feltekert törölköző, olaj, fapálcák */
    kezpihi: function (p, T) {
      return backdrop(p, T, 316) +
        shadow(p, 128, 412, 70, 10, .25) +
        roll(128, 360, 56, '#ECE5DB', '#8E7D6A') +
        shadow(p, 252, 404, 34, 6, .3) +
        '<rect x="226" y="300" width="54" height="104" rx="10" fill="#E3D6C7"/>' +
        '<rect x="226" y="330" width="54" height="74" rx="10" fill="#C9A887" opacity=".55"/>' +
        '<rect x="233" y="310" width="6" height="84" rx="3" fill="#fff" opacity=".45"/>' +
        '<rect x="238" y="286" width="30" height="16" rx="2" fill="url(#' + p + 'gold)"/>' +
        '<path d="M242 286 C 242 254, 264 254, 264 286 Z" fill="#2B2725"/>' +
        shadow(p, 330, 420, 30, 6, .28) +
        '<ellipse cx="330" cy="412" rx="26" ry="12" fill="url(#' + p + 'stone3)"/>' +
        '<g transform="rotate(4 220 452)"><rect x="150" y="446" width="170" height="6" rx="3" fill="#CFB291"/><rect x="160" y="458" width="150" height="6" rx="3" fill="#C4A584"/></g>';
    },

    /* Higiénia: zárt sterilizáló tasak, vattakorongok, vászon */
    eszkoz: function (p, T) {
      return backdrop(p, T, 300) +
        shadow(p, 204, 418, 160, 14, .2) +
        '<path d="M40 360 L 360 340 L 372 430 L 52 452 Z" fill="#EFE8DE"/>' +
        '<path d="M40 360 L 360 340" stroke="#fff" stroke-width="2" opacity=".5"/>' +
        '<g transform="rotate(-4 205 398)">' +
        '<rect x="96" y="358" width="218" height="74" rx="4" fill="#F9F6F1"/>' +
        '<rect x="104" y="366" width="202" height="58" rx="2" fill="none" stroke="#BE9A7B" stroke-width="1.2" stroke-dasharray="3 3"/>' +
        '<path d="M126 395 H 250 M250 395 L 270 389 M250 395 L 270 401" stroke="#8C7B6B" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
        '<circle cx="282" cy="378" r="6" fill="#929B89" opacity=".6"/>' +
        '</g>' +
        shadow(p, 300, 312, 46, 8, .26) +
        '<rect x="262" y="226" width="76" height="88" rx="8" fill="#fff" opacity=".42"/>' +
        '<rect x="262" y="226" width="76" height="88" rx="8" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/>' +
        '<g fill="#FBF9F6" stroke="#E2D8CC" stroke-width="1">' +
        '<ellipse cx="300" cy="300" rx="30" ry="7"/><ellipse cx="300" cy="290" rx="30" ry="7"/><ellipse cx="300" cy="280" rx="30" ry="7"/><ellipse cx="300" cy="270" rx="30" ry="7"/><ellipse cx="300" cy="260" rx="30" ry="7"/></g>' +
        '<rect x="258" y="216" width="84" height="12" rx="3" fill="url(#' + p + 'gold)"/>' +
        sprig(p, [[88, 266, -60, .8], [76, 246, -120, .75], [96, 226, -55, .7], [86, 208, -115, .65]], 'M92 300 C 86 266, 92 232, 104 196');
    }
  };

  var LABELS = {
    labfurdo: 'Illusztráció: kerámia lábfürdő tál, törölközők és eukaliptuszág',
    torolkozo: 'Illusztráció: feltekert törölközők',
    lakk: 'Illusztráció: két körömlakk és reszelő',
    ko: 'Illusztráció: egymásra helyezett kövek és ápolóolaj',
    paraffin: 'Illusztráció: paraffinos tál spatulával',
    kezpihi: 'Illusztráció: kézápolási kellékek',
    eszkoz: 'Illusztráció: lezárt sterilizáló tasak és vattakorongok'
  };

  function render(name, tone) {
    var fn = SCENES[name] || SCENES.labfurdo;
    var T = TONES[tone] || TONES.light;
    var p = 'a' + (++uid) + '-';
    return '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' + defs(p, T) + fn(p, T) + '</svg>';
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-art]:not([data-art-done])').forEach(function (el) {
      el.setAttribute('data-art-done', '');
      var src = el.getAttribute('data-src');
      var label = el.getAttribute('data-label') || LABELS[el.getAttribute('data-art')] || 'Illusztráció';
      if (src) {
        el.innerHTML = '<img src="' + src + '" alt="' + label + '" loading="lazy" decoding="async">';
      } else {
        el.innerHTML = render(el.getAttribute('data-art'), el.getAttribute('data-tone'));
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', label);
      }
    });
  }

  window.BBArt = { render: render, mount: mount, labels: LABELS };
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', function () { mount(); });
})();
