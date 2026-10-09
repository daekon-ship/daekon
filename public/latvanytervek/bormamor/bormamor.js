/* Bormámor Monor — látványterv, 5. változat: sötét, filmszerű jelenetek */
(function () {
  "use strict";

  var D = window.BORMAMOR || { esemenyek: [], borok: [] };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var EMBLEM = '<svg viewBox="0 0 367.99 588.19" aria-hidden="true"><use href="#i-keyhole"/></svg>';
  var KH = { cx: 399.7, cy: 595.9, h: 588.19 };   // a kulcslyuk középpontja és magassága a logó koordinátáiban

  /* ── NAV ─────────────────────────────────── */
  var nav = $("[data-nav]");
  var hero = $(".open");
  function onScrollNav() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  var links = $$(".nav__links a");
  if ("IntersectionObserver" in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = map[e.target.id];
        if (a && e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ── MOBILMENÜ ───────────────────────────── */
  var menu = $("#menu"), openBtn = $("[data-menu-open]"), closeBtn = $("[data-menu-close]");
  function openMenu() {
    menu.hidden = false; openBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; closeBtn.focus();
    if (!reduce && window.gsap) {
      gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: .6, ease: "power3.inOut" });
      gsap.fromTo("#menu nav a", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .045, ease: "power3.out", delay: .2 });
      gsap.fromTo(".menu__foot", { opacity: 0 }, { opacity: 1, duration: .6, delay: .5 });
    }
  }
  function closeMenu(focusBack) { menu.hidden = true; openBtn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; if (focusBack) openBtn.focus(); }
  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", function () { closeMenu(true); });
  $$("#menu nav a").forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }); });
  menu.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu(true);
    if (e.key === "Tab") {
      var f = $$("a,button", menu), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── KÓSTOLÓSOR: kamera a poharak között ─── */
  var wineSec = $("[data-wine]"), frame = $("[data-frame]"), cam = $("[data-cam]"), dim = $("[data-dim]");
  var pinsEl = $("[data-pins]"), sparkle = $("[data-sparkle]");
  var tabsEl = $("[data-wine-tabs]"), panelsEl = $("[data-wine-panels]");
  var AR = 1600 / 619, base = { w: 0, h: 0, fit: 1 };
  var STATES = [{ x: null, overview: true }].concat(D.borok);   // 0 = a teljes sor, aztán a borstílusok
  var active = -1, wineScrub = null;

  // kategóriánként más fény a keret mögött: a bor színe
  var GLOW = { feher: [214, 164, 70], rose: [214, 120, 122], siller: [168, 40, 62], voros: [110, 14, 32], pezsgo: [232, 210, 150] };
  var GLOW0 = [201, 168, 108];
  function measure() {
    var W = frame.clientWidth, H = frame.clientHeight;
    base.w = Math.max(W, H * AR); base.h = base.w / AR;
    base.fit = Math.min(1, W / base.w, H / base.h);
    cam.style.width = base.w + "px"; cam.style.height = base.h + "px";
    return { W: W, H: H };
  }
  function camTarget(b) {
    var d = measure(), W = d.W, H = d.H;
    var s = b.x == null ? base.fit : (W < 700 ? .5 : .3) / .2 * W / base.w;
    var cw = base.w * s, ch = base.h * s;
    var x = b.x == null || cw <= W ? (W - cw) / 2 : clamp(W / 2 - b.x * cw, W - cw, 0);
    var y = b.y == null || ch <= H ? (H - ch) / 2 : clamp(H / 2 - b.y * ch, H - ch, 0);
    return { x: x, y: y, s: s, sx: b.x == null ? W / 2 : b.x * cw + x, sy: b.y == null ? H / 2 : b.y * ch + y, r: b.x == null ? 0 : .1 * cw, a: b.x == null ? 0 : 1, sp: b.x == null && !b.overview ? 1 : 0, g: (GLOW[b.id] || GLOW0).slice() };
  }
  function render(st) {
    cam.style.transform = "translate(" + st.x + "px," + st.y + "px) scale(" + st.s + ")";
    pinsEl.style.setProperty("--inv", (1 / st.s).toFixed(4));
    pinsEl.style.opacity = clamp((base.fit * 1.2 - st.s) / (base.fit * .2), 0, 1).toFixed(3);
    var c = "rgba(8,4,5," + (st.a * .74).toFixed(3) + ")";
    dim.style.background = st.r > 1
      ? "radial-gradient(ellipse " + st.r + "px " + (st.r * 1.5) + "px at " + st.sx + "px " + st.sy + "px, transparent 68%, " + c + " 100%)"
      : c;
    sparkle.style.opacity = st.sp.toFixed(3);
    if (st.g) wineSec.style.setProperty("--glow", st.g.map(Math.round).join(","));
  }
  function mix(a, b, t) {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), sx: lerp(a.sx, b.sx, t), sy: lerp(a.sy, b.sy, t),
      r: lerp(a.r || b.r, b.r || a.r, t), a: lerp(a.a, b.a, t), sp: lerp(a.sp, b.sp, t),
      g: (a.g || GLOW0).map(function (v, k) { return lerp(v, (b.g || GLOW0)[k], t); }) };
  }
  function setActive(i) {   // i: borstílus index (0–4), -1: semmi
    if (i === active) return;
    active = i;
    $$(".vtab", tabsEl).forEach(function (t, j) { t.setAttribute("aria-selected", j === i ? "true" : "false"); t.tabIndex = (j === i || (i < 0 && j === 0)) ? 0 : -1; });
    $$(".wpanel", panelsEl).forEach(function (p, j) { p.hidden = j !== Math.max(0, i); });
    $$(".vpin", pinsEl).forEach(function (p, j) { p.classList.toggle("is-on", j === i); });
    var p = panelsEl.children[Math.max(0, i)];
    if (p && !reduce && window.gsap) gsap.fromTo(p, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, ease: "power2.out" });
  }

  if (wineSec && D.borok.length) {
    D.borok.forEach(function (b, i) {
      var t = document.createElement("button");
      t.type = "button"; t.className = "vtab"; t.id = "wt-" + b.id;
      t.setAttribute("role", "tab"); t.setAttribute("aria-controls", "wp-" + b.id);
      t.textContent = b.nev;
      t.addEventListener("click", function () { goWine(i); });
      tabsEl.appendChild(t);

      var p = document.createElement("div");
      p.className = "wpanel"; p.id = "wp-" + b.id; p.hidden = true;
      p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "wt-" + b.id);
      p.innerHTML = "<h3>" + esc(b.nev) + "</h3><p>" + esc(b.leiras) + '</p><p class="wpanel__pair">Ajánljuk: ' + esc(b.illik.toLowerCase()) + "</p>" +
        '<button type="button" class="wpanel__add" data-add-cat="' + esc(b.id) + '">+ Kosárba</button>';
      panelsEl.appendChild(p);

      if (b.x != null) {
        var pin = document.createElement("button");
        pin.type = "button"; pin.className = "vpin"; pin.tabIndex = -1; pin.setAttribute("aria-hidden", "true");
        pin.style.left = (b.x * 100) + "%";
        pin.innerHTML = "<span>" + esc(b.rovid) + "</span>";
        pin.addEventListener("click", function () { goWine(i); });
        pinsEl.appendChild(pin);
      }
    });
    tabsEl.addEventListener("keydown", function (e) {
      var n = D.borok.length, k = e.key, i = Math.max(0, active);
      if (k === "ArrowRight" || k === "ArrowDown") i = (i + 1) % n;
      else if (k === "ArrowLeft" || k === "ArrowUp") i = (i - 1 + n) % n;
      else if (k === "Home") i = 0; else if (k === "End") i = n - 1; else return;
      e.preventDefault(); goWine(i); tabsEl.children[i].focus();
    });
    // alapállapot (JS-sel, mozgás nélkül is): első pohár
    setActive(0); render(camTarget(D.borok[0]));
    window.addEventListener("resize", function () { if (!wineScrub) render(camTarget(D.borok[Math.max(0, active)])); });

    // pezsgőbuborékok a logó poharában
    var bubbles = $("[data-bubbles]"), ns = "http://www.w3.org/2000/svg";
    for (var q = 0; q < 16; q++) {
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", 330 + Math.random() * 140); c.setAttribute("cy", 600 - Math.random() * 190);
      c.setAttribute("r", 2.5 + Math.random() * 4); c.setAttribute("fill", "currentColor");
      c.style.animationDelay = (-Math.random() * 3.2).toFixed(2) + "s";
      c.style.animationDuration = (2.4 + Math.random() * 1.8).toFixed(2) + "s";
      bubbles.appendChild(c);
    }
  }

  /* mobil: egyetlen kóstolósor, oldalra húzható — poharanként megáll, alatta a kiválasztott bor */
  var wineCards = window.matchMedia("(max-width: 700px)").matches && wineSec && D.borok.length;
  var swipeTrack = null;
  if (wineCards) {
    wineSec.classList.add("wine--cards");
    var sw = document.createElement("div");
    sw.className = "wswipe";
    var glasses = D.borok.filter(function (b) { return b.x != null; });
    var hasPezsgo = D.borok.some(function (b) { return b.x == null; });
    sw.innerHTML =
      '<div class="wswipe__stage"><div class="wswipe__track" data-track tabindex="0" role="group" aria-label="Kóstolósor — húzd oldalra">' +
        '<div class="wswipe__strip"><img src="img/poharak.webp" srcset="img/poharak.webp 1600w, img/poharak-2x.webp 3200w" sizes="1200px" width="1600" height="619" alt="Négy pohár bor egy hordón: fehér, rosé, siller és vörös" decoding="async">' +
        glasses.map(function (b) { return '<span class="wswipe__snap" style="left:' + (b.x * 100) + '%"></span>'; }).join("") + "</div>" +
        (hasPezsgo ? '<div class="wswipe__fizz">' + sparkle.innerHTML.replace(/sp-glass/g, "sp-glass-m") + '<span class="wswipe__snap" style="left:50%"></span></div>' : "") +
      '</div><span class="wswipe__view" aria-hidden="true"></span></div>' +
      '<p class="wswipe__hint" aria-hidden="true"><span></span>Húzd oldalra a poharakért</p>' +
      '<div class="wswipe__tabs" role="tablist" aria-label="Borstílusok">' + D.borok.map(function (b, i) {
        return '<button type="button" class="vtab" role="tab" data-sw="' + i + '" aria-selected="' + (i ? "false" : "true") + '">' + esc(b.rovid) + "</button>"; }).join("") + "</div>" +
      '<div class="wswipe__panels">' + D.borok.map(function (b, i) {
        return '<article class="wswipe__panel' + (i ? "" : " is-on") + '"' + (i ? ' aria-hidden="true"' : "") + "><h3>" + esc(b.nev) + "</h3><p>" + esc(b.leiras) + '</p><p class="wpanel__pair">Ajánljuk: ' + esc(b.illik.toLowerCase()) + "</p>" +
          '<button type="button" class="wpanel__add" data-add-cat="' + esc(b.id) + '"' + (i ? ' tabindex="-1"' : "") + ">+ Kosárba</button></article>"; }).join("") + "</div>";
    wineSec.querySelector(".wine__stage").insertBefore(sw, $(".wine__note", wineSec));
    var mb = $(".wswipe__fizz [data-bubbles]", sw);
    if (mb) mb.removeAttribute("data-bubbles");
    swipeTrack = $("[data-track]", sw);
    var snaps = $$(".wswipe__snap", sw), swOn = 0, swTicking = false;
    var snapX = function (el) { var r = el.getBoundingClientRect(), t = swipeTrack.getBoundingClientRect(); return swipeTrack.scrollLeft + r.left - t.left; };
    var setSw = function (i) {
      if (i === swOn) return;
      swOn = i;
      $$(".vtab", sw).forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); });
      $$(".wswipe__panel", sw).forEach(function (p, k) {
        p.classList.toggle("is-on", k === i);
        if (k === i) p.removeAttribute("aria-hidden"); else p.setAttribute("aria-hidden", "true");
        p.querySelector("button").tabIndex = k === i ? 0 : -1;
      });
      wineSec.style.setProperty("--glow", (GLOW[D.borok[i].id] || GLOW0).join(","));
    };
    swipeTrack.addEventListener("scroll", function () {
      sw.classList.add("is-moved");
      if (swTicking) return; swTicking = true;
      requestAnimationFrame(function () {
        swTicking = false;
        var c = swipeTrack.scrollLeft + swipeTrack.clientWidth / 2, best = 0, bd = Infinity;
        snaps.forEach(function (sn, k) { var d = Math.abs(snapX(sn) - c); if (d < bd) { bd = d; best = k; } });
        setSw(best);
      });
    }, { passive: true });
    $$(".vtab", sw).forEach(function (t, k) {
      t.addEventListener("click", function () {
        swipeTrack.scrollTo({ left: snapX(snaps[k]) - swipeTrack.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
        setSw(k);
      });
    });
    var swStart = function () { swipeTrack.scrollLeft = snapX(snaps[0]) - swipeTrack.clientWidth / 2; };
    var swImg = $("img", sw);
    if (swImg.complete) swStart(); else swImg.addEventListener("load", swStart);
    wineSec.style.setProperty("--glow", (GLOW[D.borok[0].id] || GLOW0).join(","));
  }

  var camNow = null;
  function goWine(i) {
    if (wineScrub) {   // asztali, görgetett jelenet: a fülek a megfelelő görgetési pontra visznek
      var st = wineScrub, n = STATES.length - 1;
      var y = st.start + (st.end - st.start) * ((i + 1) / n);
      window.scrollTo({ top: y + 2, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    var to = camTarget(D.borok[i]);
    setActive(i);
    var tab = tabsEl.children[i];
    if (tab && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollTo({ left: tab.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
    if (reduce || !window.gsap) { render(to); camNow = to; return; }
    var from = camNow || camTarget(STATES[0]), mid = camTarget(STATES[0]);
    var o = { t: 0 };
    gsap.timeline()
      .to(o, { t: 1, duration: .45, ease: "power2.in", onUpdate: function () { render(mix(from, mid, o.t)); } })
      .set(o, { t: 0 })
      .to(o, { t: 1, duration: .9, ease: "power3.inOut", onUpdate: function () { render(mix(mid, to, o.t)); } });
    camNow = to;
  }

  /* ── ESEMÉNYEK ───────────────────────────── */
  var evEl = $("[data-events]"), archEl = $("[data-archive]"), archList = $("[data-archive-list]");
  var sample = /[?&]esemenyminta=1/.test(location.search);
  var HU_MONTHS = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  var HU_DAYS = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
  function parseDate(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  function renderEvents() {
    if (!evEl) return;
    var list = (D.esemenyek || []).slice();
    if (sample) list.push({
      id: "minta", minta: true, cim: "Mintaesemény — csak a látványterv bemutatásához",
      datum: (function () { var d = today(); d.setDate(d.getDate() + 21); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(),
      helyszin: "Bormámor, Monor, Kiss Ernő utca 9.",
      leiras: "Ez a kártya nem valós esemény. Így jelenik meg egy meghirdetett kóstoló, ha az adatok bekerülnek a js/adatok.js fájlba.",
      jelentkezes: true
    });
    var t = today();
    var upcoming = list.filter(function (e) { return parseDate(e.datum) >= t; }).sort(function (a, b) { return parseDate(a.datum) - parseDate(b.datum); });
    var past = list.filter(function (e) { return parseDate(e.datum) < t; }).sort(function (a, b) { return parseDate(b.datum) - parseDate(a.datum); });

    if (!upcoming.length) {
      evEl.innerHTML =
        '<div class="empty">' +
        '<div class="empty__art" aria-hidden="true"><svg class="empty__kh" viewBox="215.7 301.81 367.99 588.19"><path pathLength="1" d="' + $("#clip-keyhole path").getAttribute("d") + '"/></svg>' +
        '<span class="empty__label">A következő alkalom</span><span class="empty__date">Hamarosan</span></div>' +
        '<div class="empty__body"><h3>Most nincs meghirdetett esemény</h3>' +
        "<p>A következő kóstolót a Facebook-oldalunkon jelentjük be először. Ha szeretnéd, szólunk neked is, amint megvan az időpont.</p>" +
        '<div class="empty__cta"><a class="btn btn--gold" href="#jelentkezes" data-preset="Következő kóstoló">Értesítést kérek</a>' +
        '<a class="btn btn--line-dark" href="https://www.facebook.com/bormamormonor/" target="_blank" rel="noopener">Bormámor a Facebookon</a></div></div></div>';
    } else {
      evEl.innerHTML = upcoming.map(function (e) {
        var d = parseDate(e.datum);
        var media = e.kep ? '<img src="' + esc(e.kep) + '" alt="" loading="lazy" decoding="async">' : EMBLEM;
        var cta = "";
        if (e.lezart) cta = '<p class="ev__closed">A jelentkezés lezárult.</p>';
        else if (e.jelentkezes) cta = '<a class="btn btn--wine" href="#jelentkezes" data-preset="' + esc(e.cim) + '">Jelentkezem</a>';
        if (e.reszletek) cta += '<a class="btn btn--line-dark" href="' + esc(e.reszletek) + '" target="_blank" rel="noopener">Részletek</a>';
        return '<article class="ev' + (e.minta ? " ev--sample" : "") + '">' +
          '<div class="ev__img">' + media + "</div>" +
          '<div class="ev__body">' + (e.minta ? '<span class="ev__flag">Minta — nem valós esemény</span>' : "") +
          '<p class="ev__date"><b>' + d.getDate() + ". " + HU_MONTHS[d.getMonth()] + "</b><span>" + HU_DAYS[d.getDay()] + (e.ido ? ", " + esc(e.ido) : "") + "</span></p>" +
          "<h3>" + esc(e.cim) + "</h3><p>" + esc(e.leiras) + "</p>" +
          '<p class="ev__meta">' + esc(e.helyszin || "Bormámor, Monor, Kiss Ernő utca 9.") + "</p>" +
          '<div class="ev__cta">' + cta + "</div></div></article>";
      }).join("");
    }
    if (past.length) {
      archEl.hidden = false;
      archList.innerHTML = past.map(function (e) {
        var d = parseDate(e.datum);
        return '<li><time datetime="' + esc(e.datum) + '">' + d.getFullYear() + ". " + HU_MONTHS[d.getMonth()] + " " + d.getDate() + ".</time><span>" + esc(e.cim) + "</span></li>";
      }).join("");
    }
    // eseményválasztó a jelentkezéshez
    var sel = $("[data-event-select]");
    upcoming.filter(function (e) { return e.jelentkezes && !e.lezart; }).reverse().forEach(function (e) {
      var o = document.createElement("option"); o.value = e.cim; o.textContent = e.cim; sel.insertBefore(o, sel.firstChild);
    });
  }
  renderEvents();

  // CTA-k előre kitöltik az eseményt
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-preset]");
    if (!a) return;
    var sel = $("[data-event-select]"), v = a.getAttribute("data-preset");
    $$("option", sel).forEach(function (o) { if (o.value === v) sel.value = v; });
  });

  var HU_DAYS_CAP = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
  /* ── AJÁNDÉKCSOMAG-ÖSSZEÁLLÍTÓ + KOSÁR (átvétel a boltban, kiszállítás nincs) ── */
  var O = D.osszeallito || { kategoriak: [], keretek: ["Mindegy"], csomagolas: ["Nem kell"] };
  var CAT = {}; O.kategoriak.forEach(function (k) { CAT[k.id] = k; });
  var cart = { lines: {} };
  try { var saved = JSON.parse(localStorage.getItem("bm-kosar") || "null"); if (saved && saved.lines) cart = saved; } catch (x) {}
  function saveCart() { try { localStorage.setItem("bm-kosar", JSON.stringify(cart)); } catch (x) {} }
  function count() { var n = 0; Object.keys(cart.lines).forEach(function (k) { n += cart.lines[k].qty; }); return n; }

  var catalogEl = $("[data-catalog]"), linesEl = $("[data-cart-lines]"), emptyEl = $("[data-cart-empty]");
  var countEl = $("[data-cart-count]"), bar = $("[data-cartbar]"), sumEl = $("[data-cartbar-sum]"), toastEl = $("[data-toast]");
  var sheet = $("[data-sheet]"), sheetPanel = $("[data-sheet-panel]"), sheetOpen = false, sheetReturn = null;
  var cform = $("[data-cart-form]"), cstatus = $("[data-cart-status]");

  function stepper(id, qty) {
    return '<div class="step" data-id="' + id + '">' +
      '<button type="button" class="step__b" data-dec aria-label="Eggyel kevesebb: ' + esc(CAT[id].nev) + '"' + (qty ? "" : " disabled") + '>−</button>' +
      '<span class="step__n" aria-live="polite">' + qty + '</span>' +
      '<button type="button" class="step__b" data-inc aria-label="Eggyel több: ' + esc(CAT[id].nev) + '">+</button></div>';
  }
  function keretSel(id, l) {
    return '<label class="keret"><span>Keret palackonként</span><select data-keret="' + id + '">' +
      O.keretek.map(function (k) { return "<option" + (k === l.keret ? " selected" : "") + ">" + esc(k) + "</option>"; }).join("") + "</select></label>";
  }
  function renderCatalog() {
    if (!catalogEl) return;
    var groups = {};
    O.kategoriak.forEach(function (k) { (groups[k.csoport] = groups[k.csoport] || []).push(k); });
    catalogEl.innerHTML = Object.keys(groups).map(function (g) {
      return '<div class="bgroup"><h3 class="bgroup__h">' + esc(g) + '</h3><ul class="bgroup__list">' + groups[g].map(function (k) {
        var l = cart.lines[k.id], q = l ? l.qty : 0;
        return '<li class="bitem' + (q ? " is-on" : "") + '" data-item="' + k.id + '"><div class="bitem__row"><span class="bitem__n">' + esc(k.nev) + "</span>" + stepper(k.id, q) + "</div>" +
          (q ? keretSel(k.id, l) : "") + "</li>";
      }).join("") + "</ul></div>";
    }).join("");
  }
  function renderCart() {
    var ids = Object.keys(cart.lines), n = count();
    if (linesEl) linesEl.innerHTML = ids.map(function (id) {
      var l = cart.lines[id];
      return '<li class="cline"><div class="cline__top"><span class="cline__n">' + esc(CAT[id].nev) + "</span>" + stepper(id, l.qty) + "</div>" + keretSel(id, l) + "</li>";
    }).join("");
    if (emptyEl) emptyEl.hidden = n > 0;
    if (countEl) countEl.textContent = n + " tétel";
    if (sumEl) sumEl.textContent = ids.map(function (id) { return cart.lines[id].qty + " " + CAT[id].nev.toLowerCase(); }).join(", ");
    $$("[data-navcart-count], [data-cartfab-count]").forEach(function (e) { e.textContent = n; });
    $$("[data-navcart]").forEach(function (e) { e.classList.toggle("has-items", n > 0); });
    var fin = $("[data-cart-finish]"); if (fin) fin.disabled = n === 0;
    updateFab();
    renderCatalog();
    if (step === 3) renderSummary();
  }
  function setQty(id, q, silent) {
    if (!CAT[id]) return;
    q = clamp(q, 0, 48);
    if (q === 0) delete cart.lines[id];
    else cart.lines[id] = { qty: q, keret: (cart.lines[id] && cart.lines[id].keret) || O.keretek[0] };
    saveCart(); renderCart();
    if (!silent && q > 0) { toast(CAT[id].nev + " — kosárban: " + q + " db"); bump(); }
  }
  function add(id) { setQty(id, (cart.lines[id] ? cart.lines[id].qty : 0) + 1); }
  var toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2200);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-inc],[data-dec]");
    if (b) { var id = b.closest("[data-id]").getAttribute("data-id"), cur = cart.lines[id] ? cart.lines[id].qty : 0; setQty(id, cur + (b.hasAttribute("data-inc") ? 1 : -1), !!b.closest("[data-cfg]")); return; }
    var a = e.target.closest("[data-add-cat]");
    if (a) { add(a.getAttribute("data-add-cat")); return; }
  });
  document.addEventListener("change", function (e) {
    var sl = e.target.closest("[data-keret]");
    if (sl) { var id = sl.getAttribute("data-keret"); if (cart.lines[id]) { cart.lines[id].keret = sl.value; saveCart(); $$('[data-keret="' + id + '"]').forEach(function (o) { o.value = sl.value; }); } }
  });

  // polc sorai: „Kosárba” gomb minden sorhoz
  $$("[data-shelf] li").forEach(function (li) {
    var id = li.getAttribute("data-add"), b = document.createElement("button");
    b.type = "button"; b.className = "shelf__add";
    if (id) { b.setAttribute("data-add-cat", id); b.textContent = "Kosárba"; b.setAttribute("aria-label", "Kosárba: " + CAT[id].nev); }
    else if (li.hasAttribute("data-gift")) {
      b.textContent = "Ajándékot állítok össze";
      b.addEventListener("click", function () { var r = cform && cform.querySelector('[name="kinek"][value="ajandek"]'); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } goStep(0, true); $("#osszeallito").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
    }
    li.appendChild(b);
  });

  /* lépések */
  var steps = $$("[data-step]"), step = 0, STEPN = steps.length;
  var nextB = $("[data-cfg-next]"), prevB = $("[data-cfg-prev]"), sendB = $("[data-cart-send]"), barFill = $("[data-cfg-bar]");
  function canLeave(i) {
    cstatus.className = "cart__status"; cstatus.textContent = "";
    if (i === 1 && !count()) { cstatus.classList.add("is-err"); cstatus.textContent = "Válassz legalább egy tételt."; return false; }
    if (i === 2 && !(cform.elements.atvetel && cform.elements.atvetel.value)) { cstatus.classList.add("is-err"); cstatus.textContent = "Válaszd ki, mikor jönnél érte."; return false; }
    return true;
  }
  function goStep(i, quiet) {
    i = clamp(i, 0, STEPN - 1);
    if (i > step) { for (var k = step; k < i; k++) if (!canLeave(k)) { i = k; break; } }
    var dir = i >= step ? 1 : -1, old = steps[step], nw = steps[i];
    step = i;
    $$("[data-step-tab]").forEach(function (t, j) { t.classList.toggle("is-on", j === i); t.classList.toggle("is-done", j < i); var bt = t.querySelector("button"); if (j === i) bt.setAttribute("aria-current", "step"); else bt.removeAttribute("aria-current"); });
    if (barFill) barFill.style.transform = "scaleX(" + ((i + 1) / STEPN) + ")";
    prevB.disabled = i === 0;
    nextB.hidden = i === STEPN - 1; sendB.hidden = i !== STEPN - 1;
    if (i === 3) renderSummary();
    if (old === nw) { steps.forEach(function (st2, j) { st2.hidden = j !== i; }); return; }
    if (!reduce && window.gsap && !quiet) {
      gsap.to(old, { x: -40 * dir, opacity: 0, duration: .28, ease: "power2.in", onComplete: function () {
        old.hidden = true; gsap.set(old, { x: 0, opacity: 1 });
        nw.hidden = false;
        gsap.fromTo(nw, { x: 48 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: "power3.out" });
        gsap.from(nw.querySelectorAll(".choice__card, .bitem, .summary__row, .cfield"), { y: 14, opacity: 0, duration: .45, stagger: .03, ease: "power2.out", delay: .08 });
      } });
    } else { steps.forEach(function (st2, j) { st2.hidden = j !== i; }); }
    if (!quiet) { var top = $("[data-cfg]").getBoundingClientRect().top; if (top < 0 || top > window.innerHeight * .6) $("[data-cfg]").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
  }
  if (nextB) {
    nextB.addEventListener("click", function () { if (canLeave(step)) goStep(step + 1); });
    prevB.addEventListener("click", function () { goStep(step - 1); });
    $$("[data-step-tab] button").forEach(function (b, j) { b.addEventListener("click", function () { goStep(j); }); });
    goStep(0, true);
  }

  // kinek: ajándék mezők
  var giftBox = $("[data-giftbox]");
  if (cform) cform.addEventListener("change", function (e) {
    if (e.target.name === "kinek") { giftBox.hidden = e.target.value !== "ajandek"; if (!giftBox.hidden && !reduce && window.gsap) gsap.from(giftBox, { y: 12, opacity: 0, duration: .45 }); }
  });
  // csomagolás és átvételi napok kártyaként
  var packEl = $("[data-pack]");
  if (packEl) packEl.innerHTML = O.csomagolas.map(function (c, i) {
    return '<label class="choice__card choice__card--sm"><input type="radio" name="csomag" value="' + esc(c) + '"' + (i === 0 ? " checked" : "") + '><span class="choice__t">' + esc(c) + "</span></label>";
  }).join("");
  var pickEl = $("[data-pickup]");
  if (pickEl) {
    var opts = [], d0 = new Date(); d0.setHours(0, 0, 0, 0);
    for (var i = 1; opts.length < 6 && i < 40; i++) {
      var x = new Date(d0); x.setDate(d0.getDate() + i);
      var wd = x.getDay();
      if (wd === 5 || wd === 6) opts.push({ nap: HU_DAYS_CAP[wd], datum: HU_MONTHS[x.getMonth()] + " " + x.getDate() + ".", ido: wd === 5 ? "10–18" : "9–14" });
    }
    pickEl.innerHTML = opts.map(function (o, j) {
      var v = o.nap + ", " + o.datum + " (" + o.ido + ")";
      return '<label class="choice__card choice__card--day"><input type="radio" name="atvetel" value="' + esc(v) + '"' + (j === 0 ? " checked" : "") + '><span class="choice__d">' + esc(o.nap) + '</span><span class="choice__t">' + esc(o.datum) + '</span><span class="choice__d">' + esc(o.ido) + "</span></label>";
    }).join("");
  }
  function renderSummary() {
    var el = $("[data-summary]"); if (!el || !cform) return;
    var f = cform.elements, gift = f.kinek.value === "ajandek";
    var rows = Object.keys(cart.lines).map(function (id) { var l = cart.lines[id]; return '<div class="summary__row"><span>' + esc(CAT[id].nev) + '</span><span>' + l.qty + " db</span><span>" + esc(l.keret) + "</span></div>"; }).join("");
    el.innerHTML =
      '<div class="summary__card">' +
      '<p class="summary__k">' + (gift ? "Ajándékcsomag" + (f.cimzett.value.trim() ? " — " + esc(f.cimzett.value.trim()) : "") : "Saját válogatás") + "</p>" +
      '<div class="summary__rows">' + (rows || '<p class="summary__empty">Még nincs tétel — lépj vissza a Tételek lépésre.</p>') + "</div>" +
      '<dl class="summary__meta"><div><dt>Csomagolás</dt><dd>' + esc(f.csomag.value) + '</dd></div><div><dt>Átvétel</dt><dd>' + esc(f.atvetel.value) + "</dd></div>" +
      (gift && f.uzenet.value.trim() ? "<div><dt>Kártya</dt><dd>„" + esc(f.uzenet.value.trim()) + "”</dd></div>" : "") + "</dl>" +
      '<svg class="summary__mark" viewBox="0 0 367.99 588.19" aria-hidden="true"><use href="#i-keyhole"/></svg></div>';
  }

  // küldés: ellenőrzés, majd e-mail-piszkozat (háttérrendszer nélkül)
  if (cform) cform.addEventListener("submit", function (e) {
    e.preventDefault();
    if (step !== STEPN - 1) { if (canLeave(step)) goStep(step + 1); return; }
    cstatus.className = "cart__status"; cstatus.textContent = "";
    var f = cform.elements, errs = [];
    var mark = function (el, msg) {
      var p = el.parentElement.querySelector(".cfield__err");
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (p) { p.textContent = msg || ""; p.hidden = !msg; }
      if (msg) errs.push(el);
    };
    if (!count()) { cstatus.classList.add("is-err"); cstatus.textContent = "A kosár üres — adj hozzá legalább egy tételt."; return; }
    mark(f.nev, f.nev.value.trim().length < 2 ? "Add meg a neved." : "");
    mark(f.telefon, /^[+0-9 ()\/-]{6,20}$/.test(f.telefon.value.trim()) ? "" : "Adj meg egy telefonszámot, hogy egyeztetni tudjunk.");
    mark(f.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? "" : "Adj meg egy érvényes e-mail-címet.");
    if (errs.length) { errs[0].focus(); cstatus.classList.add("is-err"); cstatus.textContent = "Néhány mezőt javítani kell."; return; }
    if (!f.kor.checked) { f.kor.focus(); cstatus.classList.add("is-err"); cstatus.textContent = "Alkoholt csak 18 év felettieknek állítunk össze — jelöld be, ha elmúltál 18."; return; }
    if (!f.adat.checked) { f.adat.focus(); cstatus.classList.add("is-err"); cstatus.textContent = "Az elküldéshez el kell fogadnod az adatkezelési tájékoztatót."; return; }
    var gift = f.kinek.value === "ajandek";
    var lines = Object.keys(cart.lines).map(function (id) { var l = cart.lines[id]; return "- " + CAT[id].nev + ": " + l.qty + " db (keret: " + l.keret + ")"; });
    var body = ["Összeállítás átvétele a boltban", "", "Tételek:"].concat(lines, [
      "", "Átvétel: " + f.atvetel.value, "Csomagolás: " + f.csomag.value,
      "Ajándék: " + (gift ? "igen — " + (f.cimzett.value.trim() || "címzett nincs megadva") + (f.uzenet.value.trim() ? ", kártya: „" + f.uzenet.value.trim() + "”" : "") : "nem"),
      "Kérés: " + (f.megjegyzes.value.trim() || "—"),
      "", "Név: " + f.nev.value.trim(), "Telefon: " + f.telefon.value.trim(), "E-mail: " + f.email.value.trim(),
      "", "18 év feletti vagyok; az adatkezelési tájékoztatót elfogadtam."]).join("\n");
    window.location.href = "mailto:bormamormonor@gmail.com?subject=" + encodeURIComponent((gift ? "Ajándékcsomag" : "Összeállítás") + ": " + count() + " tétel — " + f.nev.value.trim()) + "&body=" + encodeURIComponent(body);
    cstatus.classList.add("is-ok");
    cstatus.textContent = "Megnyílt az e-mail-piszkozat az összeállítással. Küldd el, és visszaigazoljuk, mikor veheted át.";
  });

  // kosár alulról felcsúszó lapként; alul sáv, ha van tétel
  function updateFab() {
    if (!bar) return;
    var cfgVis = false, cfg = $("[data-cfg]");
    if (cfg) { var r = cfg.getBoundingClientRect(); cfgVis = r.top < window.innerHeight * .8 && r.bottom > window.innerHeight * .3; }
    var show = count() > 0 && !sheetOpen && !cfgVis && window.scrollY > window.innerHeight * .8;
    bar.hidden = !show;
    document.documentElement.classList.toggle("has-cartbar", show);
  }
  window.addEventListener("scroll", updateFab, { passive: true });
  function openSheet(e) {
    if (e) e.preventDefault();
    if (!sheet || sheetOpen) return;
    sheetReturn = document.activeElement;
    sheet.hidden = false; sheetOpen = true; updateFab();
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { sheet.classList.add("is-open"); });
    if (!reduce && window.gsap) gsap.from(".cline", { y: 16, opacity: 0, duration: .45, stagger: .05, delay: .18, ease: "power2.out" });
    setTimeout(function () { sheetPanel.focus(); }, 60);
  }
  function closeSheet(cb) {
    if (!sheetOpen) return;
    sheet.classList.remove("is-open"); sheetOpen = false;
    document.body.style.overflow = "";
    setTimeout(function () { if (!sheetOpen) sheet.hidden = true; if (typeof cb === "function") cb(); }, reduce ? 0 : 420);
    updateFab();
    if (typeof cb !== "function" && sheetReturn && sheetReturn.focus) sheetReturn.focus();
  }
  $$("[data-sheet-open]").forEach(function (b) { b.addEventListener("click", openSheet); });
  $$("[data-sheet-close]").forEach(function (b) { b.addEventListener("click", function () { closeSheet(); }); });
  var finB = $("[data-cart-finish]");
  if (finB) finB.addEventListener("click", function () { closeSheet(function () { goStep(count() ? 2 : 1, true); goStep(3); $("[data-cfg]").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }); });
  if (sheet) {
    sheet.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSheet();
      if (e.key === "Tab") {
        var fs = $$("a[href],button:not([disabled]),input,select,textarea", sheetPanel).filter(function (x) { return x.offsetParent !== null; });
        var first = fs[0], last = fs[fs.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var sy = null, head = $(".cart__head", sheetPanel);
    head.addEventListener("touchstart", function (e) { sy = e.touches[0].clientY; }, { passive: true });
    head.addEventListener("touchmove", function (e) { if (sy == null) return; var dy = Math.max(0, e.touches[0].clientY - sy); sheetPanel.style.transform = "translate(-50%," + dy + "px)"; }, { passive: true });
    head.addEventListener("touchend", function (e) { if (sy == null) return; var dy = e.changedTouches[0].clientY - sy; sy = null; sheetPanel.style.transform = ""; if (dy > 90) closeSheet(); });
  }
  var bump = function () { if (bar && !bar.hidden) { bar.classList.remove("is-bump"); void bar.offsetWidth; bar.classList.add("is-bump"); } };
  renderCart();

  /* ── JELENTKEZÉS ─────────────────────────── */
  var form = $("[data-form]");
  if (form) {
    var status = $("[data-status]"), submit = $("[data-submit]");
    var checks = {
      nev: function (v) { return v.trim().length >= 2 ? "" : "Add meg a neved."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Adj meg egy érvényes e-mail-címet, például nev@pelda.hu."; },
      telefon: function (v) { return !v.trim() || /^[+0-9 ()\/-]{6,20}$/.test(v.trim()) ? "" : "A telefonszámban csak számok, szóköz, +, ( ) és - szerepelhet."; },
      fo: function (v) { var n = +v; return n >= 1 && n <= 40 && Math.floor(n) === n ? "" : "1 és 40 fő között adj meg egy számot."; },
      adatkezeles: function (v, el) { return el.checked ? "" : "A jelentkezéshez el kell fogadnod az adatkezelési tájékoztatót."; }
    };
    var errId = { nev: "e-nev", email: "e-email", telefon: "e-tel", fo: "e-fo", adatkezeles: "e-adat" };
    function check(name) {
      var el = form.elements[name], msg = checks[name](el.value, el), err = document.getElementById(errId[name]);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) { err.textContent = msg; err.hidden = false; el.setAttribute("aria-describedby", errId[name]); }
      else { err.hidden = true; el.removeAttribute("aria-describedby"); }
      return !msg;
    }
    Object.keys(checks).forEach(function (n) {
      form.elements[n].addEventListener("blur", function () { if (this.value || n === "adatkezeles") check(n); });
      form.elements[n].addEventListener("change", function () { if (this.getAttribute("aria-invalid") === "true") check(n); });
    });
    var sending = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      status.className = "form__status"; status.textContent = "";
      if (form.elements.weboldal.value) return; // spamcsapda
      var ok = Object.keys(checks).map(check).every(Boolean);
      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus();
        status.classList.add("is-err"); status.textContent = "Néhány mezőt javítani kell — a hibákat a mezők alatt látod.";
        return;
      }
      var f = form.elements;
      var key = [f.esemeny.value, f.email.value.trim().toLowerCase()].join("|");
      var sent = []; try { sent = JSON.parse(sessionStorage.getItem("bm-sent") || "[]"); } catch (x) {}
      if (sent.indexOf(key) > -1 && !form.dataset.confirmDup) {
        form.dataset.confirmDup = "1";
        status.classList.add("is-err");
        status.textContent = "Erre az eseményre ezzel az e-mail-címmel már készítettél jelentkezést. Ha mégis újra küldenéd, kattints még egyszer a gombra.";
        return;
      }
      var subject = "Jelentkezés: " + f.esemeny.value + " — " + f.nev.value.trim();
      var body = [
        "Esemény: " + f.esemeny.value,
        "Név: " + f.nev.value.trim(),
        "E-mail: " + f.email.value.trim(),
        "Telefon: " + (f.telefon.value.trim() || "—"),
        "Létszám: " + f.fo.value + " fő",
        "",
        "Megjegyzés:",
        f.megjegyzes.value.trim() || "—",
        "",
        "Az adatkezelési tájékoztatót elfogadtam."
      ].join("\n");
      sending = true; submit.disabled = true;
      window.location.href = "mailto:bormamormonor@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      try { sent.push(key); sessionStorage.setItem("bm-sent", JSON.stringify(sent)); } catch (x) {}
      delete form.dataset.confirmDup;
      status.classList.add("is-ok");
      status.textContent = "Megnyílt az e-mail-piszkozat a leveleződben. Küldd el, és a Bormámor visszajelez. Ha nem nyílt meg, írj a bormamormonor@gmail.com címre.";
      setTimeout(function () { sending = false; submit.disabled = false; }, 2500);
    });
  }

  /* ── KÉPNÉZEGETŐ: az oldalba szétosztott fotók, sorrendben ── */
  var lb = $("[data-lightbox]");
  var lbImg = $("[data-lb-img]"), lbCap = $("[data-lb-cap]"), lbCount = $("[data-lb-count]"), lbIndex = 0, lbReturn = null;
  var LB = [];
  function registerLb() {
    LB = [];
    $$("img[data-lb]").forEach(function (img) {
      var i = LB.length;
      LB.push({ kep: img.getAttribute("data-lb"), alt: img.alt });
      var host = img.closest("figure, li, .empty__img") || img.parentElement;
      if (host.querySelector(":scope > .zoom")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "zoom"; b.setAttribute("aria-label", "Nagyítás: " + img.alt);
      b.addEventListener("click", function () {
        lbReturn = b; showLb(i);
        if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
        $("[data-lb-close]").focus();
      });
      host.appendChild(b);
    });
  }
  function showLb(i) {
    var n = LB.length; lbIndex = (i + n) % n; var g = LB[lbIndex];
    lbImg.src = g.kep; lbImg.alt = g.alt; lbCap.textContent = g.alt; lbCount.textContent = (lbIndex + 1) + " / " + n;
    if (!reduce && window.gsap) gsap.fromTo(lbImg, { opacity: 0, scale: .985 }, { opacity: 1, scale: 1, duration: .45, ease: "power2.out" });
  }
  function closeLb() { if (lb.open) lb.close(); }
  if (lb) {
    $("[data-lb-close]").addEventListener("click", closeLb);
    $("[data-lb-prev]").addEventListener("click", function () { showLb(lbIndex - 1); });
    $("[data-lb-next]").addEventListener("click", function () { showLb(lbIndex + 1); });
    lb.addEventListener("close", function () { if (lbReturn) lbReturn.focus(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") showLb(lbIndex + 1);
      if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) showLb(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  registerLb();

  /* ── TÉRKÉP (csak kattintásra töltődik) ──── */
  var mapBtn = $("[data-map-load]");
  if (mapBtn) mapBtn.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = "https://maps.google.com/maps?q=Monor%2C%20Kiss%20Ern%C5%91%20utca%209&z=16&output=embed";
    f.title = "Bormámor Monor a térképen: 2200 Monor, Kiss Ernő utca 9.";
    f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    $("[data-map]").appendChild(f);
  });

  /* ── MOBIL GYORSSÁV ──────────────────────── */
  var dock = $("[data-dock]");
  if (dock && "IntersectionObserver" in window) {
    var heroGone = false, blockers = new Set(), typing = false, goingDown = false, lastY = window.scrollY;
    var upd = function () { dock.classList.toggle("is-on", heroGone && !blockers.size && !typing && !goingDown); };
    // lefelé görgetéskor (olvasás közben) elbújik, hogy ne takarjon; felfelé görgetésre előjön
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (Math.abs(y - lastY) > 12) { goingDown = y > lastY; lastY = y; upd(); }
    }, { passive: true });
    var heroCheck = function () { heroGone = window.scrollY > window.innerHeight * 1.6; upd(); };
    window.addEventListener("scroll", heroCheck, { passive: true }); heroCheck();
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) blockers.add(e.target); else blockers.delete(e.target); });
      upd();
    });
    ["#osszeallito", "#jelentkezes", "#kapcsolat", ".foot"].forEach(function (sel) { var el = $(sel); if (el) bo.observe(el); });
    document.addEventListener("focusin", function (e) { typing = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName); upd(); });
    document.addEventListener("focusout", function () { typing = false; upd(); });
  }

  /* ── MOZGÁS ──────────────────────────────── */
  function splitLines(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w" style="display:inline-block">' + esc(w) + "</span>"; }).join(" ");
    var lines = [], top = null;
    $$(".w", el).forEach(function (w) {
      if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (l) { return '<span class="rl"><span>' + esc(l.join(" ")) + "</span></span>"; }).join("");
    el.setAttribute("aria-label", words.join(" "));
    $$(".rl", el).forEach(function (r) { r.setAttribute("aria-hidden", "true"); });
    return $$(".rl>span", el);
  }
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + "</span>"; }).join(" ");
    return $$(".w", el);
  }

  /* A — NYITÓJELENET: sötétből, a címke kulcslyukán át tárul fel a kép (betöltéskor, görgetés-rögzítés nélkül) */
  function openScene(wide) {
    var sec = $("[data-open]"), img = $("[data-open-img]"), svg = $("[data-lock]"), media = $("[data-open-media]"), photo = $(".open__photo");
    if (!sec || !img || !svg) return null;
    var KD = $("#clip-keyhole path").getAttribute("d");
    svg.innerHTML = '<defs><mask id="lockm" maskUnits="userSpaceOnUse"><rect class="lk-bg" fill="#fff"/><path class="lk" d="' + KD + '" fill="#000"/></mask></defs>' +
      '<rect class="lk-bg" fill="#0C0708" mask="url(#lockm)"/>' +
      '<path class="lk lk-line" d="' + KD + '" fill="none" stroke="#C9A86C" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
    var G = {}, st = { h: 0, open: 0 };

    function layout() {
      var W = sec.clientWidth, H = sec.clientHeight, mob = window.matchMedia("(max-width: 700px)").matches;
      var iw = mob ? 1000 : 1640, ih = 720, lx = mob ? 510 : 810, ly = 348;      // a címke kulcslyukának helye a képen
      // a fotó doboza (telefonon csak a felső sáv, alatta a szöveg) — a kép ehhez igazodik
      var pw = photo.clientWidth, ph = photo.clientHeight, ox = media.offsetLeft + photo.offsetLeft, oy = media.offsetTop + photo.offsetTop;
      var cx = W < 861 ? W / 2 : W * .66, cy = W < 861 ? oy + ph * (W < 561 ? .5 : .25) : H * .46;
      var px = cx - ox, py = cy - oy;
      var k = Math.max(pw / iw, ph / ih, px / lx, (pw - px) / (iw - lx), py / ly, (ph - py) / (ih - ly));
      var ke = Math.max(pw / iw, ph / ih);
      G = { W: W, H: H, cx: cx, cy: cy, h0: W < 861 ? Math.min(ph * (W < 561 ? .5 : .26), W * .6) : H * .52, hMax: Math.max(W, H) * 6,
        r0: { l: px - lx * k, t: py - ly * k, w: iw * k, h: ih * k },
        r1: { l: (pw - iw * ke) * (lx / iw), t: (ph - ih * ke) * (ly / ih), w: iw * ke, h: ih * ke } };
      // a kép végső helyén áll; a kezdő keretet csak transformmal érjük el (nincs layout shift)
      img.style.cssText = "right:auto;bottom:auto;object-fit:fill;transform-origin:0 0;left:" + G.r1.l + "px;top:" + G.r1.t + "px;width:" + G.r1.w + "px;height:" + G.r1.h + "px";
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      $$(".lk-bg", svg).forEach(function (r) { r.setAttribute("width", W); r.setAttribute("height", H); });
      draw();
    }
    function draw() {
      var h = st.open > 0 ? lerp(G.h0, G.hMax, Math.pow(st.open, 2.4)) : st.h;
      var sc = Math.max(h, .001) / KH.h;
      $$(".lk", svg).forEach(function (el) { el.setAttribute("transform", "translate(" + G.cx + " " + G.cy + ") scale(" + sc + ") translate(" + -KH.cx + " " + -KH.cy + ")"); });
      $(".lk-line", svg).style.opacity = (1 - clamp(st.open * 2.5, 0, 1)).toFixed(3);
      svg.style.visibility = st.open > .99 ? "hidden" : "visible";
      var e = smooth(st.open), r0 = G.r0, r1 = G.r1;
      var w = lerp(r0.w, r1.w, e), sc2 = w / r1.w;
      img.style.transform = "translate(" + (lerp(r0.l, r1.l, e) - r1.l) + "px," + (lerp(r0.t, r1.t, e) - r1.t) + "px) scale(" + sc2 + ")";
    }
    layout();
    window.addEventListener("resize", layout);

    // koreográfia: kulcslyuk → kitárulás → lassú közelítés (~2,6 s, közben minden kattintható)
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(st, { h: function () { return G.h0; }, duration: 1, ease: "power2.out", onUpdate: draw }, .1)
      .to(st, { open: 1, duration: 1.6, ease: "power2.inOut", onUpdate: draw }, 1.15)
      .fromTo(media, { scale: 1.1 }, { scale: 1, duration: 6, ease: "power1.out" }, .1)
      .from(".open__wm .wm-l", { yPercent: 70, opacity: 0, duration: .9, stagger: .05, ease: "power3.out" }, .15)
      .from("[data-goldline]", { scaleX: 0, duration: 1.2, ease: "power2.inOut" }, .6)
      .from(".open__frame line", { attr: { x2: function (i, el) { return el.getAttribute("x1"); }, y2: function (i, el) { return el.getAttribute("y1"); } }, duration: 1.4, ease: "power2.inOut", stagger: .12 }, 1.2)
      .from(".open__slogan", { opacity: 0, y: 10, duration: .7 }, .3)
      .from(".open__h1 .line>span", { yPercent: 108, duration: 1, stagger: .1 }, .35)
      .from(".open__lead, .open__cta .btn", { opacity: 0, y: 12, duration: .6, stagger: .08 }, .6)
      .from(".open__facts", { opacity: 0, duration: .8 }, 1.4);

    // görgetésre: a kép közelebb jön és elsötétül, a szöveg gyorsabban halad — átvezetés a borokhoz
    gsap.to(media, { yPercent: 8, scale: 1.12, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } });
    gsap.to("[data-open-shade]", { opacity: 1.6, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } });
    gsap.to("[data-open-copy]", { yPercent: -18, opacity: .15, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".open__hint", { opacity: 0, scrollTrigger: { trigger: sec, start: "top top", end: "+=120", scrub: true } });

    // egérre minimális mélység (csak egérrel, asztalon)
    if (wide && window.matchMedia("(pointer: fine)").matches) {
      var mx = gsap.quickTo(photo, "x", { duration: 1.2, ease: "power3.out" }), my = gsap.quickTo(photo, "y", { duration: 1.2, ease: "power3.out" });
      var cx = gsap.quickTo("[data-open-copy]", "x", { duration: 1.4, ease: "power3.out" });
      sec.addEventListener("pointermove", function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        mx(-nx * 16); my(-ny * 10); cx(nx * 6);
      });
    }
    return tl;
  }

  /* C — KÓSTOLÓSOR asztalon: görgetésre pohárról pohárra (a jelenet közben rögzítve) */
  function wineScene(wide) {
    if (!wineSec || !D.borok.length) return;
    if (wineCards) {   // mobil: a kóstolósor alulról tárul fel, a fülek és a szöveg utána érkeznek
      var swEl = $(".wswipe", wineSec);
      gsap.from(".wswipe__stage", { clipPath: "inset(100% 0 0 0)", duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: swEl, start: "top 85%", once: true } });
      gsap.from(".wswipe__strip img", { scale: 1.12, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: swEl, start: "top 85%", once: true } });
      gsap.from(".wswipe__view", { opacity: 0, scale: .92, duration: .8, delay: .7, ease: "power2.out", scrollTrigger: { trigger: swEl, start: "top 85%", once: true } });
      gsap.from(".wswipe__tabs .vtab, .wswipe__panels", { y: 16, opacity: 0, duration: .7, stagger: .06, ease: "power3.out", scrollTrigger: { trigger: ".wswipe__tabs", start: "top 90%", once: true } });
      return;
    }
    if (!wide) {   // tablet: érintésre vált; a jelenet a teljes sorral indul, és belépéskor ráközelít
      camNow = camTarget(STATES[0]); render(camNow); setActive(-1);
      ScrollTrigger.create({ trigger: frame, start: "top 70%", once: true, onEnter: function () { if (active < 0) goWine(0); } });
      return;
    }
    var n = STATES.length - 1, T = [];
    var rebuild = function () { T = STATES.map(camTarget); };
    rebuild();
    render(T[0]); setActive(-1);
    wineScrub = ScrollTrigger.create({
      trigger: wineSec, start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * n * .75); },
      pin: true, scrub: .4, anticipatePin: 1,
      onRefresh: rebuild,
      onUpdate: function (self) {
        var f = self.progress * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
        // minden pohárnál „megáll” egy kicsit a kamera: a szakasz közepén mozog, a végein pihen
        var e = smooth((t - .2) / .6);
        render(mix(T[i], T[i + 1], e));
        setActive(Math.round(f) - 1);
        $$(".vtab", tabsEl).forEach(function (tb, j) { tb.style.setProperty("--p", clamp(f - j, 0, 1).toFixed(3)); });
      }
    });
  }

  function motion() {
    var root = document.documentElement;
    if (reduce || !window.gsap) { root.classList.remove("pre-anim"); return; }
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("js-motion");
    var wide = window.matchMedia("(min-width: 861px)").matches;

    openScene(wide);
    root.classList.remove("pre-anim");

    wineScene(wide);

    /* arany hajszálvonalak a szekciók között: középről kifelé rajzolódnak */
    $$("[data-rule]").forEach(function (r) {
      gsap.from(r, { scaleX: 0, duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: r, start: "top 92%", once: true } });
    });

    /* B — címsorok sorról sorra */
    $$(".reveal-lines").forEach(function (h) {
      var spans = splitLines(h);
      gsap.from(spans, { yPercent: 110, duration: 1, ease: "power3.out", stagger: .09, scrollTrigger: { trigger: h, start: "top 86%", once: true } });
    });

    /* D — szélesvászon: a kép lassan közelít, a kulcs felülről előtűnik */
    var film = $("[data-film] img");
    if (film) gsap.fromTo(film, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "[data-film]", start: "top bottom", end: "bottom top", scrub: true } });
    var ki = $("[data-keyicon]");
    if (ki) gsap.from(ki, { clipPath: "inset(0 0 100% 0)", duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: ki, start: "top 85%", once: true } });

    /* E — feliratok szavanként gyulladnak ki olvasás közben */
    $$("[data-words]").forEach(function (el) {
      var ws = splitWords(el);
      ScrollTrigger.create({ trigger: el, start: "top 82%", end: "bottom 45%", scrub: true,
        onUpdate: function (self) { var k = Math.round(self.progress * ws.length); ws.forEach(function (w, i) { w.classList.toggle("is-lit", i < k); }); } });
    });

    /* F — polc: a sor, ami épp a képernyő közepén van, kigyullad */
    $$("[data-shelf] li").forEach(function (li) {
      ScrollTrigger.create({ trigger: li, start: "top 62%", end: "bottom 38%", toggleClass: "is-lit" });
    });

    /* G — kulcslyuk-képek: kinyílnak, majd lassan közelítenek */
    $$("[data-kh-photo]").forEach(function (f) {
      gsap.from(f, { scale: .82, opacity: 0, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: f, start: "top 85%", once: true } });
      var im = f.querySelector("img");
      if (im) gsap.fromTo(im, { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* események: a kulcslyuk aranyvonala kirajzolódik; eseménykártyák dátuma görgetésre érkezik */
    var ekh = $(".empty__kh path");
    if (ekh) {
      gsap.fromTo(ekh, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut", scrollTrigger: { trigger: ".empty", start: "top 80%", once: true } });
      gsap.from(".empty__date, .empty__label", { y: 20, opacity: 0, duration: .9, stagger: .12, ease: "power3.out", scrollTrigger: { trigger: ".empty", start: "top 75%", once: true } });
    }
    $$(".ev").forEach(function (ev, i) {
      gsap.from(ev.querySelector(".ev__img"), { clipPath: i % 2 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: ev, start: "top 82%", once: true } });
      gsap.from(ev.querySelectorAll(".ev__date, .ev__body h3, .ev__body p, .ev__cta"), { y: 18, opacity: 0, duration: .7, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: ev, start: "top 75%", once: true } });
    });

    /* Monor — a kulcslyuk a háttérben lassan mozdul */
    gsap.fromTo(".monor__mark", { yPercent: -60 }, { yPercent: -40, ease: "none", scrollTrigger: { trigger: ".monor", start: "top bottom", end: "bottom top", scrub: true } });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(motion); else motion();
})();
