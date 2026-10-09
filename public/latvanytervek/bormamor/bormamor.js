/* Bormámor Monor — látványterv, interakciók és mozgás */
(function () {
  "use strict";

  var D = window.BORMAMOR || { esemenyek: [], borok: [] };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var EMBLEM = '<svg viewBox="0 0 367.99 588.19" aria-hidden="true"><use href="#i-keyhole"/></svg>';

  /* ── NAV ─────────────────────────────────── */
  var nav = $("[data-nav]");
  var hero = $(".hero");
  function onScrollNav() {
    var limit = hero ? hero.offsetHeight - 80 : 40;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    nav.classList.toggle("is-solid", window.scrollY > limit);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  // aktív menüpont
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
    menu.hidden = false; openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; closeBtn.focus();
  }
  function closeMenu(focusBack) {
    menu.hidden = true; openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; if (focusBack) openBtn.focus();
  }
  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", function () { closeMenu(true); });
  $$("#menu nav a").forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }); });
  menu.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu(true);
    if (e.key === "Tab") {
      var f = $$("a,button", menu); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── BORSTÍLUSOK: egy kóstolósor, a kamera a választott pohárra áll ── */
  var vino = $("[data-vino]");
  var tabsEl = $("[data-wine-tabs]"), panelsEl = $("[data-wine-panels]");
  var stage = $("[data-stage]"), cam = $("[data-cam]"), dim = $("[data-dim]"), pinsEl = $("[data-pins]");
  var sparkle = $("[data-sparkle]"), capEl = $("[data-vino-cap]");
  var current = -1, camState = { x: 0, y: 0, s: 1 };
  var DIM = .72;

  var AR = 1240 / 470, base = { w: 0, h: 0, fit: 1 };
  // a kép a színpad méretétől függetlenül mindig teljes arányban van a kamerán, így a poharak koordinátái pontosak
  function measure() {
    var W = stage.clientWidth, H = stage.clientHeight;
    base.w = Math.max(W, H * AR); base.h = base.w / AR;
    base.fit = Math.min(1, W / base.w, H / base.h);
    cam.style.width = base.w + "px"; cam.style.height = base.h + "px";
    return { W: W, H: H };
  }
  function camTarget(b) {
    var d = measure(), W = d.W, H = d.H;
    var s = b.x == null ? base.fit : (W < 600 ? .5 : .26) / .2 * W / base.w;
    var cw = base.w * s, ch = base.h * s;
    var x = b.x == null ? (W - cw) / 2 : Math.min(0, Math.max(W - cw, W / 2 - b.x * cw));
    var y = b.y == null || ch <= H ? (H - ch) / 2 : Math.min(0, Math.max(H - ch, H / 2 - b.y * ch));
    if (cw <= W) x = (W - cw) / 2;
    return { x: x, y: y, s: s, sx: b.x == null ? W / 2 : b.x * cw + x, sy: b.y == null ? H / 2 : b.y * ch + y, r: b.x == null ? 0 : .1 * cw };
  }
  function applyCam(st) {
    cam.style.transform = "translate(" + st.x + "px," + st.y + "px) scale(" + st.s + ")";
    pinsEl.style.setProperty("--inv", (1 / st.s).toFixed(4));
    pinsEl.style.opacity = Math.max(0, Math.min(1, (base.fit * 1.18 - st.s) / (base.fit * .18))).toFixed(3);
  }
  function applyDim(sx, sy, r, a) {
    // a választott pohár körül világos kör, a többi pohár sötétebb
    var c = "rgba(26,8,13," + (a * DIM).toFixed(3) + ")";
    dim.style.background = r > 0
      ? "radial-gradient(ellipse " + r + "px " + (r * 1.5) + "px at " + sx + "px " + sy + "px, transparent 70%, " + c + " 100%)"
      : c;
  }

  if (vino && D.borok.length) {
    D.borok.forEach(function (b, i) {
      var t = document.createElement("button");
      t.type = "button"; t.className = "vtab"; t.id = "wt-" + b.id;
      t.setAttribute("role", "tab"); t.setAttribute("aria-controls", "wp-" + b.id);
      t.innerHTML = '<span class="vtab__dot" aria-hidden="true"></span>' + esc(b.nev);
      t.addEventListener("click", function () { selectWine(i, true); });
      tabsEl.appendChild(t);

      var p = document.createElement("div");
      p.className = "wpanel"; p.id = "wp-" + b.id; p.hidden = true;
      p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "wt-" + b.id); p.tabIndex = 0;
      p.innerHTML = "<h3>" + esc(b.nev) + "</h3><p>" + esc(b.leiras) + '</p><p class="wpanel__pair"><span>Ajánljuk</span>' + esc(b.illik) + "</p>";
      panelsEl.appendChild(p);

      if (b.x != null) {
        var pin = document.createElement("button");
        pin.type = "button"; pin.className = "vpin"; pin.tabIndex = -1; pin.setAttribute("aria-hidden", "true");
        pin.style.left = (b.x * 100) + "%";
        pin.innerHTML = "<span>" + esc(b.rovid) + "</span>";
        pin.addEventListener("click", function () { selectWine(i, true); });
        pinsEl.appendChild(pin);
      }
    });
    tabsEl.addEventListener("keydown", function (e) {
      var n = D.borok.length, k = e.key, i = current;
      if (k === "ArrowRight" || k === "ArrowDown") i = (current + 1) % n;
      else if (k === "ArrowLeft" || k === "ArrowUp") i = (current - 1 + n) % n;
      else if (k === "Home") i = 0; else if (k === "End") i = n - 1; else return;
      e.preventDefault(); selectWine(i, true); tabsEl.children[i].focus();
    });
    selectWine(0, false);
    window.addEventListener("resize", function () { var st = camTarget(D.borok[current]); camState = st; applyCam(st); applyDim(st.sx, st.sy, st.r, D.borok[current].x == null ? 0 : 1); });
  }

  function selectWine(i, animate) {
    if (i === current) return;
    current = i;
    var b = D.borok[i];
    $$(".vtab", tabsEl).forEach(function (t, j) {
      t.setAttribute("aria-selected", j === i ? "true" : "false");
      t.tabIndex = j === i ? 0 : -1;
    });
    $$(".wpanel", panelsEl).forEach(function (p, j) { p.hidden = j !== i; });
    $$(".vpin", pinsEl).forEach(function (p, j) { p.classList.toggle("is-on", D.borok[j] === b); });
    var tab = tabsEl.children[i];
    if (tab && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollTo({ left: tab.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
    capEl.textContent = b.x != null ? "Balról a " + ["első", "második", "harmadik", "negyedik"][i] + " pohár: " + b.nev.toLowerCase() : "Pezsgő — a pultnál hűtve";
    stage.classList.toggle("is-sparkle", b.x == null);

    var to = camTarget(b), on = b.x == null ? 0 : 1;
    if (animate && !reduce && window.gsap) {
      var from = { x: camState.x, y: camState.y, s: camState.s };
      var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      // 1) kicsit kihúz, hogy látsszon, honnan hová megyünk; 2) ráközelít az új pohárra
      var mid = camTarget({ x: null });
      var dimObj = { a: 1, sx: parseFloat(dim.dataset.sx || to.sx), sy: parseFloat(dim.dataset.sy || to.sy), r: parseFloat(dim.dataset.r || to.r) };
      tl.to(from, { x: mid.x, y: mid.y, s: mid.s, duration: .45, ease: "power2.in", onUpdate: function () { applyCam(from); } }, 0)
        .to(dimObj, { a: .35, duration: .45, ease: "power2.in", onUpdate: function () { applyDim(dimObj.sx, dimObj.sy, dimObj.r, dimObj.a); } }, 0)
        .to(from, { x: to.x, y: to.y, s: to.s, duration: .9, onUpdate: function () { applyCam(from); } }, .45)
        .to(dimObj, { a: on, sx: to.sx, sy: to.sy, r: to.r || dimObj.r, duration: .9, onUpdate: function () { applyDim(dimObj.sx, dimObj.sy, dimObj.r, dimObj.a); } }, .45)
        .fromTo(panelsEl.children[i], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" }, .35);
      if (b.x == null) tl.fromTo(sparkle, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .7, ease: "power2.out" }, .7);
      else tl.to(sparkle, { opacity: 0, duration: .3 }, 0);
    } else {
      applyCam(to); applyDim(to.sx, to.sy, to.r, on);
      if (sparkle) sparkle.style.opacity = b.x == null ? 1 : 0;
    }
    camState = { x: to.x, y: to.y, s: to.s };
    dim.dataset.sx = to.sx; dim.dataset.sy = to.sy; dim.dataset.r = to.r || dim.dataset.r || 0;
  }

  // pezsgőbuborékok a logó poharában (csak a pezsgő nézetben látszanak)
  var bubbles = $("[data-bubbles]");
  if (bubbles) {
    var ns = "http://www.w3.org/2000/svg";
    for (var k = 0; k < 16; k++) {
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", 330 + Math.random() * 140); c.setAttribute("cy", 600 - Math.random() * 190);
      c.setAttribute("r", 2.5 + Math.random() * 4); c.setAttribute("fill", "currentColor");
      c.style.animationDelay = (-Math.random() * 3.2).toFixed(2) + "s";
      c.style.animationDuration = (2.4 + Math.random() * 1.8).toFixed(2) + "s";
      bubbles.appendChild(c);
    }
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
        '<figure class="empty__img"><img src="img/kulcslyuk-dugok-m.webp" srcset="img/kulcslyuk-dugok-m.webp 600w, img/kulcslyuk-dugok.webp 900w" sizes="(max-width:760px) 60vw, 300px" width="900" height="900" alt="A Bormámor kulcslyuk-emblémája borosdugókból kirakva" loading="lazy" decoding="async" data-lb="img/kulcslyuk-dugok.webp"><figcaption>Zárva, amíg nincs időpont — de a kulcs nálunk van.</figcaption></figure>' +
        '<div class="empty__body"><h3>Most nincs meghirdetett esemény</h3>' +
        "<p>A következő kóstolót a Facebook-oldalunkon jelentjük be először. Ha szeretnéd, szólunk neked is, amint megvan az időpont.</p>" +
        '<div class="empty__cta"><a class="btn btn--wine" href="#jelentkezes" data-preset="Következő kóstoló">Értesítést kérek</a>' +
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
    new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; upd(); }).observe(hero);
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) blockers.add(e.target); else blockers.delete(e.target); });
      upd();
    });
    ["#jelentkezes", "#kapcsolat", ".foot"].forEach(function (sel) { var el = $(sel); if (el) bo.observe(el); });
    document.addEventListener("focusin", function (e) { typing = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName); upd(); });
    document.addEventListener("focusout", function () { typing = false; upd(); });
  }

  /* ── MOZGÁS ──────────────────────────────── */
  function splitLines(el) {
    // szavak sorokba rendezése a valódi tördelés szerint
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

  function motion() {
    var root = document.documentElement;
    if (reduce || !window.gsap) { root.classList.remove("pre-anim"); return; }
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("js-motion");
    root.classList.remove("pre-anim");
    var wide = window.matchMedia("(min-width: 861px)").matches;

    /* A — kulcslyukon át: a hero fotója a palack címkéjén lévő kulcslyukból nyílik ki */
    var film = $("[data-film]"), lockSvg = $("[data-lock]");
    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (film && lockSvg) {
      var W = film.clientWidth, H = film.clientHeight, mob = window.matchMedia("(max-width: 700px)").matches;
      var px = (mob ? .546 : .494) * W, py = .433 * H, h0 = (mob ? .31 : .355) * H;
      var KD = $("#clip-keyhole path").getAttribute("d");
      var NS = "http://www.w3.org/2000/svg";
      lockSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
      lockSvg.innerHTML =
        '<defs><mask id="lockm" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
        '<rect width="' + W + '" height="' + H + '" fill="#fff"/><path class="lk" d="' + KD + '" fill="#000"/></mask></defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="#3B0C14" mask="url(#lockm)"/>' +
        '<path class="lk lk-line" d="' + KD + '" fill="none" stroke="#BBB7B0" stroke-width="2" vector-effect="non-scaling-stroke"/>';
      var keyholes = $$(".lk", lockSvg), k = { h: h0 * .2 };
      var place = function () {
        var sc = k.h / 588.19;
        keyholes.forEach(function (el) { el.setAttribute("transform", "translate(" + px + " " + py + ") scale(" + sc + ") translate(-399.7 -595.9)"); });
      };
      place();
      root.classList.remove("pre-anim");
      heroTl.to(k, { h: h0, duration: .8, ease: "power2.out", onUpdate: place }, .1)
        .to(k, { h: Math.max(W, H) * 5, duration: 1.5, ease: "power3.in", onUpdate: place }, 1.15)
        .to(".lk-line", { opacity: 0, duration: .5 }, 1.6)
        .set(lockSvg, { display: "none" }, 2.7)
        .from(film.querySelector("img"), { scale: 1.08, duration: 2.4, ease: "power2.out" }, .9);
    } else root.classList.remove("pre-anim");
    heroTl.from(".hero__h1 .line>span", { yPercent: 105, duration: 1.1, stagger: .12 }, .1)
      .from(".hero__slogan, .hero__lead", { opacity: 0, y: 12, duration: .8, stagger: .1 }, .35)
      .from(".hero__cta .btn", { opacity: 0, y: 10, duration: .6, stagger: .08 }, .5)
      .from(".hero__facts", { opacity: 0, duration: .8 }, 1.6);

    /* B — címsorok sorról sorra emelkednek */
    $$(".reveal-lines").forEach(function (h) {
      var spans = splitLines(h);
      gsap.from(spans, { yPercent: 110, duration: 1, ease: "power3.out", stagger: .09,
        scrollTrigger: { trigger: h, start: "top 86%", once: true } });
    });

    /* C — borstílusok: a sor először egészében látszik, aztán a kamera az első pohárra áll */
    if (vino && D.borok.length) {
      var first = current;
      current = -1; camState = camTarget({ x: null });
      applyCam(camState); applyDim(0, 0, 0, 0);
      $$(".vpin", pinsEl).forEach(function (p) { p.classList.remove("is-on"); });
      var dimInit = camTarget(D.borok[first]);
      dim.dataset.sx = dimInit.sx; dim.dataset.sy = dimInit.sy; dim.dataset.r = dimInit.r;
      ScrollTrigger.create({ trigger: stage, start: "top 62%", once: true, onEnter: function () { if (current === -1) selectWine(first, true); } });
    }

    /* D — a kulcs felülről lefelé előtűnik */
    var key = $("[data-key]");
    if (key) gsap.from(key, { clipPath: "inset(0 0 100% 0)", duration: 1.4, ease: "power3.inOut",
      scrollTrigger: { trigger: ".story", start: "top 70%", once: true } });

    /* E — képek maszkos feltárása, mindegyik a saját irányából */
    var dirs = ["inset(0 0 0 100%)", "inset(100% 0 0 0)", "inset(0 100% 0 0)"];
    $$("[data-mask-reveal]").forEach(function (f, i) {
      gsap.fromTo(f, { clipPath: dirs[i % 3] }, { clipPath: "inset(0 0 0 0%)", duration: 1.3, ease: "power3.inOut",
        scrollTrigger: { trigger: f, start: "top 84%", once: true } });
      var im = f.querySelector("img");
      if (im) gsap.from(im, { scale: 1.12, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: f, start: "top 84%", once: true } });
    });
    gsap.from(".empty__img", { clipPath: "inset(100% 0 0 0)", duration: 1.1, ease: "power3.inOut",
      scrollTrigger: { trigger: ".empty__img", start: "top 88%", once: true } });

    /* Monor — a kulcslyuk lassan elmozdul a szöveg mögött (csak széles kijelzőn) */
    if (wide) gsap.fromTo(".monor__mark", { yPercent: -10 }, { yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".monor", start: "top bottom", end: "bottom top", scrub: true } });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(motion); else motion();
})();
