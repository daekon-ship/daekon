(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =====================================================================
     Nav: scrollspy — drives desktop status-bar dots, mobile bottom-bar
     dots, and the hero telemetry "current section" readout from one
     shared source of truth.
     ===================================================================== */

  var SECTION_LABELS = {
    hero: "Kezdőlap",
    munkak: "Munkák",
    szolgaltatasok: "Szolgáltatások",
    rolam: "Rólam",
    kapcsolat: "Kapcsolat"
  };

  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-section]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
  var visited = new Set(["hero"]);
  var currentSection = "hero";

  function applyNavState() {
    navLinks.forEach(function (link) {
      var target = link.getAttribute("data-target");
      var isCurrent = target === currentSection;
      var isVisited = visited.has(target);
      if (link.hasAttribute("aria-current")) {
        link.setAttribute("aria-current", isCurrent ? "true" : "false");
      }
      var dot = link.querySelector("[data-dot]");
      if (dot) {
        dot.classList.toggle("is-current", isCurrent);
        dot.classList.toggle("is-visited", !isCurrent && isVisited);
      }
    });
    var teleSection = document.querySelector("[data-tele-section]");
    if (teleSection) teleSection.textContent = SECTION_LABELS[currentSection] || "—";
  }

  if ("IntersectionObserver" in window && sections.length) {
    var io = new IntersectionObserver(
      function (entries) {
        var best = null;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
          }
        });
        if (best) {
          var id = best.target.getAttribute("data-section");
          currentSection = id;
          visited.add(id);
          applyNavState();
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach(function (s) { io.observe(s); });
  }
  applyNavState();

  /* =====================================================================
     Telemetry: real values only — clock, scroll %, scroll velocity,
     viewport size, cursor-proximity affordance.
     ===================================================================== */

  var clockNodes = Array.prototype.slice.call(document.querySelectorAll("[data-clock], [data-tele-time]"));
  function tickClock() {
    var now = new Date();
    var str = now.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    clockNodes.forEach(function (n) { n.textContent = str; });
  }
  tickClock();
  setInterval(tickClock, 1000);

  var teleScroll = document.querySelector("[data-tele-scroll]");
  var teleVelocity = document.querySelector("[data-tele-velocity]");
  var teleViewport = document.querySelector("[data-tele-viewport]");

  function updateViewport() {
    if (teleViewport) teleViewport.textContent = window.innerWidth + "×" + window.innerHeight;
  }
  updateViewport();
  window.addEventListener("resize", updateViewport);

  var lastScrollY = window.scrollY;
  var lastScrollT = performance.now();
  var scrollTicking = false;

  function updateScrollTelemetry() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    var pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    if (teleScroll) teleScroll.textContent = Math.round(pct) + "%";

    var now = performance.now();
    var dt = Math.max(1, now - lastScrollT);
    var dy = window.scrollY - lastScrollY;
    var velocity = Math.round(Math.abs(dy) / (dt / 1000));
    if (teleVelocity) teleVelocity.textContent = velocity + " px/s";
    lastScrollY = window.scrollY;
    lastScrollT = now;
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateScrollTelemetry);
      }
    },
    { passive: true }
  );
  updateScrollTelemetry();

  // Cursor proximity — a real, functional response (no gradient/glow):
  // the telemetry panel border simply brightens while the pointer is
  // over it, on pointer-capable desktops only.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var telemetryEl = document.querySelector("[data-telemetry]");
    if (telemetryEl) {
      telemetryEl.addEventListener("pointerenter", function () { telemetryEl.style.borderColor = "var(--border-strong)"; });
      telemetryEl.addEventListener("pointerleave", function () { telemetryEl.style.borderColor = ""; });
    }
  }

  /* =====================================================================
     Panel entry highlight: content is visible in the DOM unconditionally
     (see CSS — nothing depends on this running). On first scroll into
     view, a panel gets one brief settle animation, purely additive.
     ===================================================================== */

  var revealTargets = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  revealTargets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var revealIO = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-entering");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) { revealIO.observe(el); });
  }

  /* =====================================================================
     Signature interaction: order-state demo
     Mirrors backend/src/Domain/OrderStatus.php transitions exactly —
     NEW -> ACCEPTED -> PREPARING -> READY -> [OUT_FOR_DELIVERY ->] COMPLETED,
     with an independent CANCELLED terminal branch, and fulfillment type
     (PICKUP/DELIVERY) deciding whether OUT_FOR_DELIVERY exists at all.
     ===================================================================== */

  (function initDemo() {
    var root = document.querySelector("[data-demo]");
    if (!root) return;

    var trackEl = root.querySelector("[data-track]");
    var stateBadge = root.querySelector("[data-state-badge]");
    var stateDesc = root.querySelector("[data-state-desc]");
    var advanceBtn = root.querySelector("[data-demo-advance]");
    var cancelBtn = root.querySelector("[data-demo-cancel]");
    var resetBtn = root.querySelector("[data-demo-reset]");
    var affordanceEl = root.querySelector(".demo__affordance");
    var fulfillmentBtns = Array.prototype.slice.call(root.querySelectorAll("[data-fulfillment]"));
    var orderIdEl = root.querySelector("[data-order-id]");
    var orderItemsEl = root.querySelector("[data-order-items]");
    var elapsedEl = root.querySelector("[data-order-elapsed]");

    var ORDER_ITEM_SETS = ["1× Margherita, 1× Diavola", "2× Margherita", "1× Diavola, 1× Capricciosa"];
    var demoCounter = 104;

    var LABELS = {
      NEW: "Új",
      ACCEPTED: "Elfogadva",
      PREPARING: "Készül",
      READY: "Kész",
      OUT_FOR_DELIVERY: "Kiszállítás alatt",
      COMPLETED_PICKUP: "Átvéve",
      COMPLETED_DELIVERY: "Kiszállítva",
      CANCELLED: "Lemondva"
    };

    var DESC = {
      NEW: "Új rendelés beérkezett — még nincs elfogadva.",
      ACCEPTED: "Elfogadva, hamarosan indul a készítés.",
      PREPARING: "Készül a konyhában.",
      READY_PICKUP: "Kész, átvehető a pultnál.",
      READY_DELIVERY: "Kész, indulhat a kiszállítás.",
      OUT_FOR_DELIVERY: "Úton a vendéghez.",
      COMPLETED_PICKUP: "Átadva — a rendelés lezárva.",
      COMPLETED_DELIVERY: "Kiszállítva — a rendelés lezárva.",
      CANCELLED: "A rendelés lemondva."
    };

    var state = {
      status: "NEW",
      fulfillment: "PICKUP",
      elapsed: 0,
      timer: null
    };

    function trackStates() {
      return state.fulfillment === "DELIVERY"
        ? ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"]
        : ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED"];
    }

    function labelFor(status) {
      if (status === "COMPLETED") return state.fulfillment === "DELIVERY" ? LABELS.COMPLETED_DELIVERY : LABELS.COMPLETED_PICKUP;
      return LABELS[status];
    }

    function descFor(status) {
      if (status === "READY") return state.fulfillment === "DELIVERY" ? DESC.READY_DELIVERY : DESC.READY_PICKUP;
      if (status === "COMPLETED") return state.fulfillment === "DELIVERY" ? DESC.COMPLETED_DELIVERY : DESC.COMPLETED_PICKUP;
      return DESC[status];
    }

    function toneFor(status) {
      if (status === "CANCELLED") return "error";
      if (status === "READY" || status === "COMPLETED") return "ready";
      return "pending";
    }

    function nextStatus(status) {
      switch (status) {
        case "NEW": return { status: "ACCEPTED", label: "Készítés indítása előtt — elfogadás" };
        case "ACCEPTED": return { status: "PREPARING", label: "Készítés indítása" };
        case "PREPARING": return { status: "READY", label: "Kész" };
        case "READY":
          return state.fulfillment === "DELIVERY"
            ? { status: "OUT_FOR_DELIVERY", label: "Kiszállítás indítása" }
            : { status: "COMPLETED", label: "Átadva" };
        case "OUT_FOR_DELIVERY": return { status: "COMPLETED", label: "Kiszállítva" };
        default: return null;
      }
    }

    // Simpler first-button label per required "advance" affordance copy.
    function advanceButtonLabel(status) {
      if (status === "NEW") return "Rendelés elfogadása";
      var n = nextStatus(status);
      return n ? n.label : "";
    }

    function renderTrack() {
      var states = trackStates();
      var curIdx = states.indexOf(state.status);
      trackEl.innerHTML = "";
      states.forEach(function (s, i) {
        var node = document.createElement("span");
        node.className = "demo__track-node";
        if (state.status === "CANCELLED") {
          // neutral track during a cancelled run — badge/description carry the meaning
        } else if (i < curIdx) {
          node.classList.add("is-done");
        } else if (i === curIdx) {
          node.classList.add(toneFor(state.status) === "ready" ? "is-done" : "is-current");
        }
        trackEl.appendChild(node);
      });
    }

    function render() {
      var isTerminal = state.status === "COMPLETED" || state.status === "CANCELLED";

      stateBadge.textContent = labelFor(state.status);
      stateBadge.setAttribute("data-tone", toneFor(state.status));
      stateDesc.textContent = descFor(state.status);

      renderTrack();

      fulfillmentBtns.forEach(function (btn) {
        var isThis = btn.getAttribute("data-fulfillment") === state.fulfillment;
        btn.classList.toggle("is-active", isThis);
        btn.setAttribute("aria-checked", isThis ? "true" : "false");
        btn.disabled = state.status !== "NEW";
      });

      if (isTerminal) {
        advanceBtn.hidden = true;
        cancelBtn.hidden = true;
        affordanceEl.hidden = true;
        resetBtn.hidden = false;
      } else {
        advanceBtn.hidden = false;
        advanceBtn.textContent = advanceButtonLabel(state.status);
        cancelBtn.hidden = false;
        cancelBtn.disabled = false;
        resetBtn.hidden = true;
        affordanceEl.hidden = false;
      }
    }

    function startElapsed() {
      clearInterval(state.timer);
      state.elapsed = 0;
      elapsedEl.textContent = "0";
      state.timer = setInterval(function () {
        state.elapsed += 1;
        elapsedEl.textContent = String(state.elapsed);
      }, 1000);
    }

    function newOrder() {
      demoCounter += 1;
      orderIdEl.textContent = "#DEMO-" + demoCounter;
      orderItemsEl.textContent = ORDER_ITEM_SETS[demoCounter % ORDER_ITEM_SETS.length];
      state.status = "NEW";
      state.fulfillment = "PICKUP";
      startElapsed();
      advanceBtn.classList.add("btn--pulse");
      advanceBtn.classList.remove("is-settled");
      render();
    }

    advanceBtn.addEventListener("click", function () {
      var n = nextStatus(state.status);
      if (!n) return;
      state.status = n.status;
      advanceBtn.classList.add("is-settled");
      render();
    });

    cancelBtn.addEventListener("click", function () {
      state.status = "CANCELLED";
      render();
    });

    resetBtn.addEventListener("click", newOrder);

    fulfillmentBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (state.status !== "NEW") return;
        state.fulfillment = btn.getAttribute("data-fulfillment");
        render();
      });
    });

    newOrder();
  })();

  /* =====================================================================
     Contact form: live client-side validation state machine + a
     state-echoing confirmation moment. Honestly labelled as a
     prototype — no backend is wired up on this static page.
     ===================================================================== */

  (function initForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var submitBtn = form.querySelector("[data-form-submit]");
    var formStateEl = form.querySelector("[data-form-state]");
    var panelChip = document.querySelector("[data-form-statuschip]");
    var confirmBlock = form.querySelector("[data-form-confirm]");
    var confirmName = form.querySelector("[data-confirm-name]");
    var resetBtn = form.querySelector("[data-form-reset]");

    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-field]")).map(function (wrap) {
      return {
        wrap: wrap,
        name: wrap.getAttribute("data-field"),
        input: wrap.querySelector("[data-field-input]"),
        hint: wrap.querySelector("[data-field-hint]"),
        touched: false
      };
    });

    var VALIDATORS = {
      name: function (v) { return v.trim().length >= 2; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: function (v) { return v.trim().length >= 10; }
    };

    var HINTS = {
      name: "Legalább 2 karakter szükséges.",
      email: "Érvényes email címet adj meg.",
      message: "Legalább 10 karakter szükséges."
    };

    function fieldIsValid(f) { return VALIDATORS[f.name](f.input.value); }

    function paintField(f) {
      var valid = fieldIsValid(f);
      f.wrap.classList.toggle("is-valid", valid && f.input.value.trim().length > 0);
      f.wrap.classList.toggle("is-invalid", f.touched && !valid);
      f.hint.textContent = f.touched && !valid ? HINTS[f.name] : "";
    }

    function allValid() { return fields.every(fieldIsValid); }

    function updateFormState() {
      var ready = allValid();
      submitBtn.disabled = !ready;
      if (ready) {
        formStateEl.textContent = "ÁLLAPOT: érvényesítve, küldésre kész";
        formStateEl.setAttribute("data-tone", "ready");
        if (panelChip) {
          panelChip.textContent = "KÉSZ A KÜLDÉSRE";
          panelChip.className = "statuschip statuschip--ready";
        }
      } else {
        formStateEl.textContent = "ÁLLAPOT: kitöltés alatt";
        formStateEl.removeAttribute("data-tone");
        if (panelChip) {
          panelChip.textContent = "KITÖLTÉS ALATT";
          panelChip.className = "statuschip statuschip--pending";
        }
      }
    }

    fields.forEach(function (f) {
      f.input.addEventListener("input", function () {
        paintField(f);
        updateFormState();
      });
      f.input.addEventListener("blur", function () {
        f.touched = true;
        paintField(f);
        updateFormState();
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!allValid()) return;
      var nameField = fields.filter(function (f) { return f.name === "name"; })[0];
      confirmName.textContent = nameField.input.value.trim();
      form.querySelectorAll(".field, .form__footer, .form__badge").forEach(function (el) { el.hidden = true; });
      confirmBlock.hidden = false;
      formStateEl.textContent = "ÁLLAPOT: elküldve";
      formStateEl.setAttribute("data-tone", "ready");
      if (panelChip) {
        panelChip.textContent = "ELKÜLDVE";
        panelChip.className = "statuschip statuschip--ready";
      }
    });

    resetBtn.addEventListener("click", function () {
      form.reset();
      fields.forEach(function (f) {
        f.touched = false;
        f.wrap.classList.remove("is-valid", "is-invalid");
        f.hint.textContent = "";
      });
      form.querySelectorAll(".field, .form__footer, .form__badge").forEach(function (el) { el.hidden = false; });
      confirmBlock.hidden = true;
      updateFormState();
    });

    updateFormState();
  })();
})();
