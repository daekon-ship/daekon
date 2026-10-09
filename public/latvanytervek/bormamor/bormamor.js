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
  function openMenu() { menu.hidden = false; openBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; closeBtn.focus(); }
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
  var AR = 1240 / 470, base = { w: 0, h: 0, fit: 1 };
  var STATES = [{ x: null, overview: true }].concat(D.borok);   // 0 = a teljes sor, aztán a borstílusok
  var active = -1, wineScrub = null;

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
    return { x: x, y: y, s: s, sx: b.x == null ? W / 2 : b.x * cw + x, sy: b.y == null ? H / 2 : b.y * ch + y, r: b.x == null ? 0 : .1 * cw, a: b.x == null ? 0 : 1, sp: b.x == null && !b.overview ? 1 : 0 };
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
  }
  function mix(a, b, t) {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), sx: lerp(a.sx, b.sx, t), sy: lerp(a.sy, b.sy, t),
      r: lerp(a.r || b.r, b.r || a.r, t), a: lerp(a.a, b.a, t), sp: lerp(a.sp, b.sp, t) };
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
      p.innerHTML = "<h3>" + esc(b.nev) + "</h3><p>" + esc(b.leiras) + '</p><p class="wpanel__pair">Ajánljuk: ' + esc(b.illik.toLowerCase()) + "</p>";
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
    var heroCheck = function () { heroGone = window.scrollY > window.innerHeight * 1.6; upd(); };
    window.addEventListener("scroll", heroCheck, { passive: true }); heroCheck();
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

  /* A — NYITÓJELENET: a kép a címke kulcslyukán át látszik, görgetésre a kulcslyuk kinyílik */
  function openScene() {
    var sec = $("[data-open]"), img = $("[data-open-img]"), svg = $("[data-lock]");
    if (!sec || !img || !svg) return;
    var KD = $("#clip-keyhole path").getAttribute("d");
    svg.innerHTML = '<defs><mask id="lockm" maskUnits="userSpaceOnUse"><rect class="lk-bg" fill="#fff"/><path class="lk" d="' + KD + '" fill="#000"/></mask></defs>' +
      '<rect class="lk-bg" fill="#0C0708" mask="url(#lockm)"/>' +
      '<path class="lk lk-line" d="' + KD + '" fill="none" stroke="#BBB7B0" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
    var G = {}, state = { intro: 0, p: 0 };

    function layout() {
      var W = sec.clientWidth, H = sec.clientHeight, mob = window.matchMedia("(max-width: 700px)").matches;
      var iw = mob ? 1000 : 1640, ih = 720, lx = mob ? 510 : 810, ly = 348;      // a címke kulcslyukának helye a képen
      var cx = W < 861 ? W / 2 : W * .66, cy = W < 861 ? H * .33 : H * .46;
      var k = Math.max(W / iw, H / ih, cx / lx, (W - cx) / (iw - lx), cy / ly, (H - cy) / (ih - ly));
      // kezdő keret: a címke kulcslyuka pont a mi kulcslyukunkba esik; végső keret: a teljes jelenet kitölti a képernyőt
      var ke = Math.max(W / iw, H / ih);
      var r0 = { l: cx - lx * k, t: cy - ly * k, w: iw * k, h: ih * k };
      var r1 = { l: (W - iw * ke) * (lx / iw), t: (H - ih * ke) * (ly / ih), w: iw * ke, h: ih * ke };
      img.style.cssText = "right:auto;bottom:auto;object-fit:fill;transform-origin:50% 50%";
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      $$(".lk-bg", svg).forEach(function (r) { r.setAttribute("width", W); r.setAttribute("height", H); });
      G = { W: W, H: H, cx: cx, cy: cy, h0: W < 861 ? Math.min(H * .38, W * .95) : H * .64, hMax: Math.max(W, H) * 6, k: k, r0: r0, r1: r1 };
      draw();
    }
    function draw() {
      // intro: 0 → a kulcslyuk megnyílik a nyugalmi méretre; p: 0 → 1 görgetéssel teljesen kitárul
      var h = G.h0 * smooth(state.intro);
      if (state.p > 0) h = lerp(G.h0, G.hMax, Math.pow(state.p, 2.2));
      var sc = Math.max(h, .001) / KH.h;
      $$(".lk", svg).forEach(function (el) { el.setAttribute("transform", "translate(" + G.cx + " " + G.cy + ") scale(" + sc + ") translate(" + -KH.cx + " " + -KH.cy + ")"); });
      $(".lk-line", svg).style.opacity = (1 - clamp(state.p * 3, 0, 1)).toFixed(3);
      svg.style.visibility = state.p > .985 ? "hidden" : "visible";
      var e = smooth((state.p - .15) / .85), r0 = G.r0, r1 = G.r1;
      img.style.left = lerp(r0.l, r1.l, e) + "px"; img.style.top = lerp(r0.t, r1.t, e) + "px";
      img.style.width = lerp(r0.w, r1.w, e) + "px"; img.style.height = lerp(r0.h, r1.h, e) + "px";
    }
    layout();
    window.addEventListener("resize", layout);

    gsap.to(state, { intro: 1, duration: 1.3, ease: "power3.out", delay: .15, onUpdate: draw });
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: function () { return "+=" + Math.round(sec.clientHeight * (G.W < 861 ? .8 : 1.1)); },
      pin: true, scrub: true, anticipatePin: 1,
      onUpdate: function (self) { state.p = self.progress; if (state.intro < 1 && self.progress > 0) state.intro = 1; draw(); },
      onRefresh: layout
    });
    gsap.to(".open__hint", { opacity: 0, scrollTrigger: { trigger: sec, start: "top top", end: "+=120", scrub: true } });
  }

  /* C — KÓSTOLÓSOR asztalon: görgetésre pohárról pohárra (a jelenet közben rögzítve) */
  function wineScene(wide) {
    if (!wineSec || !D.borok.length) return;
    if (!wide) {   // mobilon érintésre vált; a jelenet a teljes sorral indul, és belépéskor ráközelít
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

    openScene();
    root.classList.remove("pre-anim");
    gsap.timeline({ defaults: { ease: "power3.out" }, delay: .35 })
      .from(".open__slogan", { opacity: 0, y: 10, duration: .8 }, 0)
      .from(".open__h1 .line>span", { yPercent: 105, duration: 1.1, stagger: .12 }, .1)
      .from(".open__lead, .open__cta .btn", { opacity: 0, y: 10, duration: .7, stagger: .08 }, .5)
      .from(".open__facts", { opacity: 0, duration: .9 }, .8);

    wineScene(wide);

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
    gsap.from(".empty__img", { clipPath: "inset(100% 0 0 0)", duration: 1.1, ease: "power3.inOut", scrollTrigger: { trigger: ".empty__img", start: "top 88%", once: true } });

    /* Monor — a kulcslyuk a háttérben lassan mozdul */
    gsap.fromTo(".monor__mark", { yPercent: -60 }, { yPercent: -40, ease: "none", scrollTrigger: { trigger: ".monor", start: "top bottom", end: "bottom top", scrub: true } });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(motion); else motion();
})();
