/* ==========================================================================
   DAEKON — Direction A: Editorial Masterpiece
   Signature interaction: the left rail behaves like a live build log —
   the current section gets a live tick + "olvasva: 0X / szekció" annotation.

   Hardening notes (required jury fixes):
   - Section detection uses a fixed "detection band" near the top third of
     the viewport (via IntersectionObserver rootMargin) rather than raw
     scroll-position math, so it is not sensitive to variable section
     heights. Multiple candidates during a fast wheel-flick are collapsed
     with a short debounce before the rail actually switches, so the tick
     never visibly flickers or lands on a stale section.
   - The hero reveal uses fade/rise + a monospace type-on line — never a
     redaction-bar wipe (explicitly rejected by the design jury).
   ========================================================================== */

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     0. Contact-sheet placeholder grid (24 frames — no real photography
        assets exist in this workspace; explicitly labelled as a
        placeholder rather than pretending to be real KIOSZ photography).
     --------------------------------------------------------------------- */
  var sheet = document.getElementById("contactSheet");
  if (sheet) {
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= 24; i++) {
      var frame = document.createElement("div");
      frame.className = "contact-sheet__frame";
      var label = document.createElement("span");
      var n = String(i).padStart(3, "0");
      label.textContent = "IMG_" + n;
      frame.appendChild(label);
      frag.appendChild(frame);
    }
    sheet.appendChild(frag);
  }

  /* ---------------------------------------------------------------------
     1. Hero type-on effect (replaces the rejected redaction-bar wipe)
     --------------------------------------------------------------------- */
  var typeEl = document.querySelector(".type-on");
  if (typeEl) {
    var text = typeEl.getAttribute("data-text") || "";
    if (prefersReduced) {
      typeEl.textContent = text;
    } else {
      typeEl.textContent = "";
      var idx = 0;
      var speed = 26; // ms per character
      (function typeChar() {
        if (idx <= text.length) {
          typeEl.textContent = text.slice(0, idx);
          idx++;
          setTimeout(typeChar, speed);
        }
      })();
    }
  }

  /* ---------------------------------------------------------------------
     2. Scroll reveal — fade/rise only (.reveal-line, .reveal-fade)
     --------------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal-line, .reveal-fade");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach(function (el) { revealIO.observe(el); });

    // Stagger the three hero headline lines explicitly (150-250ms apart)
    var heroLines = document.querySelectorAll(".hero__headline .reveal-line");
    heroLines.forEach(function (el, i) {
      el.style.transitionDelay = (i * 130) + "ms";
    });
  }

  /* ---------------------------------------------------------------------
     3. Hardened rail scrollspy (desktop + mobile share this logic)
     --------------------------------------------------------------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section[data-index]"));
  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail__link"));
  var mrailNums = Array.prototype.slice.call(document.querySelectorAll(".mrail__num"));
  var railStatusEl = document.getElementById("railStatus");
  var mrailStatusEl = document.getElementById("mrailStatus");
  var progressFill = document.getElementById("progressFill");

  var sectionState = new Map(); // section el -> intersecting boolean
  sections.forEach(function (s) { sectionState.set(s, false); });

  var currentIndex = null;
  var pendingIndex = null;
  var pendingTimer = null;
  var DEBOUNCE_MS = 90; // collapses rapid candidate changes during a wheel-flick

  function labelFor(section) {
    return section.getAttribute("data-label") || "";
  }

  function applyActive(index) {
    if (index === currentIndex) return;
    currentIndex = index;

    railLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-index") === index);
    });
    mrailNums.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-index") === index);
    });

    var section = sections.find(function (s) { return s.getAttribute("data-index") === index; });
    var label = section ? labelFor(section).toLowerCase() : "";
    var text = index + " / " + label;
    if (railStatusEl) railStatusEl.textContent = text;
    if (mrailStatusEl) mrailStatusEl.textContent = "olvasva: " + text;
  }

  function requestActive(index) {
    if (index === pendingIndex) return;
    pendingIndex = index;
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(function () {
      applyActive(pendingIndex);
    }, DEBOUNCE_MS);
  }

  function pickCurrentSection() {
    // Among sections currently intersecting the detection band, the
    // topmost one (DOM order) is treated as "current" — a stable rule
    // regardless of how tall/short any individual section is.
    for (var i = 0; i < sections.length; i++) {
      if (sectionState.get(sections[i])) {
        return sections[i].getAttribute("data-index");
      }
    }
    return null;
  }

  if ("IntersectionObserver" in window) {
    var spyIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          sectionState.set(entry.target, entry.isIntersecting);
        });
        var next = pickCurrentSection();
        if (next) requestActive(next);
      },
      {
        // Detection band: roughly the top third of the viewport. A section
        // is "current" while any part of it sits inside this band.
        rootMargin: "-24% 0px -66% 0px",
        threshold: 0
      }
    );
    sections.forEach(function (s) { spyIO.observe(s); });
  } else {
    // Fallback for no IO support: throttled scroll listener
    var rafPending = false;
    window.addEventListener(
      "scroll",
      function () {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          var best = sections[0];
          var bestTop = -Infinity;
          sections.forEach(function (s) {
            var top = s.getBoundingClientRect().top;
            if (top <= window.innerHeight * 0.4 && top > bestTop) {
              bestTop = top;
              best = s;
            }
          });
          if (best) requestActive(best.getAttribute("data-index"));
        });
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------------
     4. Progress fill — overall scroll depth through <main>, throttled
        via rAF so it never fights the section-detection debounce above.
     --------------------------------------------------------------------- */
  var mainEl = document.getElementById("main");
  var progressRaf = false;
  function updateProgress() {
    if (!progressFill || !mainEl) return;
    var rect = mainEl.getBoundingClientRect();
    var total = mainEl.offsetHeight - window.innerHeight;
    var scrolled = -rect.top;
    var pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
    progressFill.style.width = pct + "%";
  }
  window.addEventListener(
    "scroll",
    function () {
      if (progressRaf) return;
      progressRaf = true;
      requestAnimationFrame(function () {
        progressRaf = false;
        updateProgress();
      });
    },
    { passive: true }
  );
  updateProgress();

  /* ---------------------------------------------------------------------
     5. Mobile rail expand/collapse (numbers-only strip -> label panel)
     --------------------------------------------------------------------- */
  var mrailToggle = document.getElementById("mrailToggle");
  var mrailPanel = document.getElementById("mrailPanel");

  function closePanel() {
    if (!mrailPanel) return;
    mrailPanel.hidden = true;
    if (mrailToggle) mrailToggle.setAttribute("aria-expanded", "false");
  }
  function openPanel() {
    if (!mrailPanel) return;
    mrailPanel.hidden = false;
    if (mrailToggle) mrailToggle.setAttribute("aria-expanded", "true");
  }

  if (mrailToggle && mrailPanel) {
    mrailToggle.addEventListener("click", function () {
      var expanded = mrailToggle.getAttribute("aria-expanded") === "true";
      if (expanded) closePanel();
      else openPanel();
    });

    mrailPanel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        closePanel();
      });
    });

    document.addEventListener("click", function (e) {
      var header = document.getElementById("mrail");
      if (header && !header.contains(e.target)) closePanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });
  }

  /* ---------------------------------------------------------------------
     6. Contact form (prototype only — no backend wired up)
     --------------------------------------------------------------------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("contactStatus");
  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "Köszönöm — ez a prototípus még nincs backendhez kötve, éles verzióban itt egy visszaigazolás jönne.";
    });
  }
})();
