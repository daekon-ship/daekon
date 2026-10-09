/* Bormámor Monor — látványterv, interakciók és mozgás */
(function () {
  "use strict";

  var D = window.BORMAMOR || { esemenyek: [], borok: [], galeria: [] };
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

  /* ── BORSTÍLUSOK (fülek) ─────────────────── */
  var tabsEl = $("[data-wine-tabs]"), panelsEl = $("[data-wine-panels]"), frame = $("[data-wine-frame]");
  var current = -1;
  if (tabsEl && D.borok.length) {
    D.borok.forEach(function (b, i) {
      var t = document.createElement("button");
      t.type = "button"; t.className = "wtab"; t.id = "wt-" + b.id;
      t.setAttribute("role", "tab"); t.setAttribute("aria-controls", "wp-" + b.id);
      t.innerHTML = '<span class="wtab__name">' + esc(b.nev) + '</span><span class="wtab__pair">' + esc(b.illik) + "</span>";
      t.addEventListener("click", function () { selectWine(i, true); });
      tabsEl.appendChild(t);

      var p = document.createElement("div");
      p.className = "wpanel"; p.id = "wp-" + b.id; p.hidden = true;
      p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "wt-" + b.id); p.tabIndex = 0;
      p.innerHTML = '<h3 class="sr">' + esc(b.nev) + "</h3><p>" + esc(b.leiras) + '</p><p class="wpanel__pair">Ajánljuk: ' + esc(b.illik.toLowerCase()) + "</p>";
      panelsEl.appendChild(p);
    });
    tabsEl.addEventListener("keydown", function (e) {
      var n = D.borok.length, k = e.key, i = current;
      if (k === "ArrowRight" || k === "ArrowDown") i = (current + 1) % n;
      else if (k === "ArrowLeft" || k === "ArrowUp") i = (current - 1 + n) % n;
      else if (k === "Home") i = 0; else if (k === "End") i = n - 1; else return;
      e.preventDefault(); selectWine(i, true); tabsEl.children[i].focus();
    });
    selectWine(0, false);
  }

  function layerFor(b) {
    var l = document.createElement("div");
    l.className = "wf-layer";
    if (b.kep) l.innerHTML = '<img src="' + esc(b.kep) + '" alt="" width="250" height="465" decoding="async">';
    else l.innerHTML = '<div class="wf-emblem" style="position:absolute;inset:0">' + EMBLEM + "</div>";
    return l;
  }

  function selectWine(i, animate) {
    if (i === current) return;
    var prev = current; current = i;
    $$(".wtab", tabsEl).forEach(function (t, j) {
      t.setAttribute("aria-selected", j === i ? "true" : "false");
      t.tabIndex = j === i ? 0 : -1;
    });
    $$(".wpanel", panelsEl).forEach(function (p, j) { p.hidden = j !== i; });
    // görgetés a fülsávon mobilon
    var tab = tabsEl.children[i];
    if (tab && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollTo({ left: tab.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });

    var layer = layerFor(D.borok[i]);
    frame.appendChild(layer);
    var old = $$(".wf-layer", frame).slice(0, -1);
    if (animate && !reduce && window.gsap) {
      // a bor „feltöltődik” a kulcslyukban: alulról felfelé nyíló vágás
      gsap.fromTo(layer, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: .9, ease: "power3.inOut",
        onComplete: function () { old.forEach(function (o) { o.remove(); }); } });
      var img = layer.querySelector("img");
      if (img) gsap.fromTo(img, { scale: 1.12, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 1.3, ease: "power3.out" });
      gsap.fromTo(panelsEl.children[i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out", delay: .15 });
    } else {
      old.forEach(function (o) { o.remove(); });
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
        '<svg class="empty__mark" viewBox="0 0 367.99 588.19" aria-hidden="true"><use href="#i-keyhole"/></svg>' +
        "<div><h3>Most nincs meghirdetett esemény</h3>" +
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

  /* ── GALÉRIA + LIGHTBOX ──────────────────── */
  var gal = $("[data-gallery]"), lb = $("[data-lightbox]");
  var lbImg = $("[data-lb-img]"), lbCap = $("[data-lb-cap]"), lbCount = $("[data-lb-count]"), lbIndex = 0, lbReturn = null;
  if (gal && D.galeria.length) {
    gal.innerHTML = D.galeria.map(function (g, i) {
      return '<li><button class="gthumb" type="button" data-gi="' + i + '" aria-label="Nagyítás: ' + esc(g.alt) + '">' +
        '<img src="' + esc(g.kicsi || g.kep) + '" srcset="' + esc(g.kicsi || g.kep) + " 760w, " + esc(g.kep) + " " + g.w + 'w" sizes="(max-width:760px) 82vw, 60vw" alt="' + esc(g.alt) + '" width="' + g.w + '" height="' + g.h + '" loading="lazy" decoding="async"></button></li>';
    }).join("");
    gal.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gi]"); if (!b) return;
      lbReturn = b; showLb(+b.getAttribute("data-gi"));
      if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
      $("[data-lb-close]").focus();
    });
  }
  function showLb(i) {
    var n = D.galeria.length; lbIndex = (i + n) % n; var g = D.galeria[lbIndex];
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
  var dock = $("[data-dock]"), contact = $("#kapcsolat");
  if (dock && "IntersectionObserver" in window) {
    var heroGone = false, contactIn = false;
    var upd = function () { dock.classList.toggle("is-on", heroGone && !contactIn); };
    new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; upd(); }, { rootMargin: "0px 0px -10% 0px" }).observe(contact);
    var foot = $(".foot");
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) { contactIn = true; upd(); } }).observe(foot);
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

    /* A — kulcslyuk-belépő: körvonal, fotó, a pohár megtelik */
    var line = $(".kh__line");
    if (line) {
      var len = Math.ceil(line.getTotalLength());
      line.style.setProperty("--len", len);
      var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(line, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 0)
        .from(".kh__photo", { opacity: 0, scale: 1.18, transformOrigin: "50% 50%", duration: 1.6 }, .35)
        .from(".kh__wine", { y: 140, duration: 1.5, ease: "power2.inOut" }, .45)
        .fromTo(".kh__wave", { x: 0 }, { x: -100, duration: 1.5, ease: "none" }, .45)
        .from(".hero__h1 .line>span", { yPercent: 105, duration: 1.1, stagger: .12 }, .15)
        .from(".hero__slogan, .hero__lead", { opacity: 0, y: 12, duration: .8, stagger: .1 }, .5)
        .from(".hero__cta .btn", { opacity: 0, y: 10, duration: .6, stagger: .08 }, .7)
        .from(".hero__facts", { opacity: 0, duration: .8 }, .9);
      // finom mélység görgetéskor
      gsap.to(".hero__mark", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    /* B — címsorok sorról sorra emelkednek */
    $$(".reveal-lines").forEach(function (h) {
      var spans = splitLines(h);
      gsap.from(spans, { yPercent: 110, duration: 1, ease: "power3.out", stagger: .09,
        scrollTrigger: { trigger: h, start: "top 86%", once: true } });
    });

    /* D — a kulcs megrajzolódik a történet olvasása közben */
    var keyPaths = $$(".keydraw path");
    keyPaths.forEach(function (p) { var l = Math.ceil(p.getTotalLength()); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    if (keyPaths.length) {
      gsap.to(keyPaths, { strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ".story", start: "top 70%", end: "center 45%", scrub: .6 } });
      gsap.to(".keydraw", { attr: { "fill-opacity": 1 }, duration: .8,
        scrollTrigger: { trigger: ".story", start: "center 45%", once: true } });
    }

    /* E — képek maszkos feltárása, mindegyik a saját irányából */
    var story = $("[data-mask-reveal]");
    if (story) gsap.fromTo(story, { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.4, ease: "power3.inOut",
      scrollTrigger: { trigger: story, start: "top 82%", once: true } });
    var pano = $("[data-pano] img");
    if (pano) {
      gsap.fromTo("[data-pano]", { clipPath: "inset(18% 22% 18% 22%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none",
        scrollTrigger: { trigger: "[data-pano]", start: "top 90%", end: "top 25%", scrub: .5 } });
      gsap.fromTo(pano, { scale: 1.12 }, { scale: 1, ease: "none",
        scrollTrigger: { trigger: "[data-pano]", start: "top bottom", end: "bottom top", scrub: true } });
    }
    $$(".more__grid .tile").forEach(function (t, i) {
      gsap.from(t, { clipPath: i % 2 ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)", duration: 1.1, ease: "power3.inOut",
        scrollTrigger: { trigger: t, start: "top 90%", once: true } });
    });
    $$(".gallery__grid li").forEach(function (li, i) {
      var from = ["inset(0 100% 0 0)", "inset(100% 0 0 0)", "inset(0 0 0 100%)", "inset(0 0 100% 0)"][i % 4];
      gsap.from(li, { clipPath: from, duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: li, start: "top 92%", once: true } });
      gsap.from(li.querySelector("img"), { scale: 1.15, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 92%", once: true } });
    });

    /* Monor — a kulcslyuk lassan elmozdul a szöveg mögött */
    gsap.fromTo(".monor__mark", { yPercent: -10 }, { yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".monor", start: "top bottom", end: "bottom top", scrub: true } });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(motion); else motion();
})();
