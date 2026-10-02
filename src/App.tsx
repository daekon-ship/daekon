import { lazy, Suspense, useRef, useState } from "react";
import { Nav } from "./components/Nav/Nav";
import { LiveStatusPanel } from "./components/LiveStatusPanel/LiveStatusPanel";
import { OrderDemo } from "./components/OrderDemo/OrderDemo";

import {
  Cursor,
  DriftWords,
  Lines,
  Magnetic,
  MouseParallax,
  Parallax,
  Reveal,
  ScrollProgress,
} from "./components/fx/fx";
import { LogoLockup } from "./brand/Logo";
import { QuoteAssistant } from "./components/QuoteAssistant/QuoteAssistant";
import { useScrollSpy } from "./hooks/useScrollSpy";
import kiosz01 from "./assets/img/kiosz-01.jpg";
import kiosz04 from "./assets/img/kiosz-04.jpg";
import "./App.css";

// kept functionally, presented inside the new composition
const QuoteProof = lazy(() => Promise.resolve({ default: ProofBlock }));

const SPY_IDS = ["hero", "work", "services", "process", "about", "quote", "contact"];

/* ------------------------------------------------------------------ */
/*  Live proof block: order state machine + telemetry, dark editorial  */
/* ------------------------------------------------------------------ */
function ProofBlock({ currentId }: { currentId: string }) {
  return (
    <div className="proof" id="live-proof">
      <div className="proof__head">
        <span className="meta">PROOF / 001</span>
        <span className="meta">EZ AZ OLDAL MAGA IS MŰBIZONYÍTÉK</span>
      </div>
      <div className="proof__grid">
        <OrderDemo />
        <LiveStatusPanel currentSectionId={currentId} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Project data — each entry renders in its own composition           */
/* ------------------------------------------------------------------ */
type Project = {
  id: string;
  num: string;
  title: [string, string?];
  tags: string[];
  year: string;
  desc: string;
  layout: "split" | "wide-right" | "fullbleed" | "portrait";
  img?: { src: string; alt: string; position?: string };
  img2?: { src: string; alt: string; position?: string };
  ghost?: string;
};

const PROJECTS: Project[] = [
  {
    id: "kiosz",
    num: "001",
    title: ["KIOSZ", "PIZZA NAPOLETANA"],
    tags: ["WEB DESIGN", "DEVELOPMENT", "ORDERING SYSTEM", "2026"],
    year: "2026",
    desc: "Teljes márkázott vendéglátó-rendszer: online rendelés valós nyomkövetővel, tablet-first admin, 192 fotós galéria — élesben fut, E2E tesztelve.",
    layout: "split",
    img: { src: kiosz04, alt: "Fekete-fehér pillanatkép: a pizzaszakács feldobja a tésztát." },
    img2: { src: kiosz01, alt: "Frissen sült margherita a KIOSZ asztalán.", position: "50% 30%" },
  },
  {
    id: "epuletes",
    num: "002",
    title: ["ÉPÜLETES", "MEDENCE"],
    tags: ["WEB DESIGN", "DEVELOPMENT", "2026"],
    year: "2026",
    desc: "Szolgáltatói jelenlét gyors, mobiloptimalizált felülettel és ajánlatkérő folyamattal.",
    layout: "wide-right",
    ghost: "M",
  },
  {
    id: "rovarirtok",
    num: "003",
    title: ["ROVARIRTÓ", "FIÚK"],
    tags: ["SEO", "CONVERSION", "2026"],
    year: "2026",
    desc: "Keresőre optimalizált szolgáltatói oldal, amely a beérkező hívásokra épít.",
    layout: "fullbleed",
    ghost: "R",
  },
  {
    id: "vadlak",
    num: "004",
    title: ["VAD-LAK"],
    tags: ["WEB DESIGN", "IN PROGRESS", "2026"],
    year: "2026",
    desc: "Vállalkozói weboldal egyedi designnal — valós ügyfél, fejlesztés alatt.",
    layout: "portrait",
    ghost: "V",
  },
];

const SERVICES = [
  { n: "01", t: "WEB DESIGN", h: "Egyedi dizájn — sablon nélkül." },
  { n: "02", t: "WEB DEVELOPMENT", h: "Tiszta kód, valódi rendszer." },
  { n: "03", t: "E-COMMERCE", h: "Webshop, fizetés, admin." },
  { n: "04", t: "BOOKING SYSTEMS", h: "Rendelés és foglalás." },
  { n: "05", t: "CUSTOM SOLUTIONS", h: "Amit a munkád kér." },
];

const PROCESS = [
  { n: "01", t: "DISCOVER", h: "Cél, közönség, funkcionalitás." },
  { n: "02", t: "DESIGN", h: "Egyedi vizuális irány és art direction." },
  { n: "03", t: "BUILD", h: "Fejlesztés: design, kód, tartalom egy kézből." },
  { n: "04", t: "REFINE", h: "Teljesítmény, reszponzivitás, részletek." },
  { n: "05", t: "LAUNCH", h: "Élesítés, mérés, gondozás utána is." },
];

/* ------------------------------------------------------------------ */
/*  One project, one composition                                       */
/* ------------------------------------------------------------------ */
function ProjectBlock({ p }: { p: Project }) {
  const media = (img: Project["img"], className: string) => (
    <figure className={`pm ${className}`} data-cursor="VIEW PROJECT ↗">
      <Parallax speed={22}>
        {img ? (
          <img src={img.src} alt={img.alt} loading="lazy" style={img.position ? { objectPosition: img.position } : undefined} />
        ) : (
          <span className="pm__ghost" aria-hidden="true">{p.ghost}</span>
        )}
      </Parallax>
    </figure>
  );

  if (p.layout === "split") {
    return (
      <article className="proj proj--split" id={p.id}>
        <div className="proj__meta">
          <span className="meta">PROJECT / {p.num}</span>
          <h3 className="proj__title">
            <Lines lines={[{ text: p.title[0] }, { text: p.title[1] ?? "" }]} />
          </h3>
          <p className="proj__desc">{p.desc}</p>
          <ul className="proj__tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className="proj__media proj__media--main">{media(p.img, "pm--tall")}</div>
        <div className="proj__media proj__media--offset">{media(p.img2, "pm--small")}</div>
      </article>
    );
  }

  if (p.layout === "wide-right") {
    return (
      <article className="proj proj--wide" id={p.id}>
        <div className="proj__media proj__media--widescreen">{media(p.img, "pm--wide")}</div>
        <div className="proj__overlay">
          <span className="meta">PROJECT / {p.num}</span>
          <h3 className="proj__title proj__title--overlap">
            <Lines lines={[{ text: p.title[0] }, { text: p.title[1] ?? "" }]} />
          </h3>
        </div>
        <div className="proj__under">
          <p className="proj__desc">{p.desc}</p>
          <ul className="proj__tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </article>
    );
  }

  if (p.layout === "fullbleed") {
    return (
      <article className="proj proj--full" id={p.id}>
        <div className="proj__media proj__media--hero">{media(p.img, "pm--hero")}</div>
        <div className="proj__center">
          <span className="meta meta--light">PROJECT / {p.num} — {p.year}</span>
          <h3 className="proj__title proj__title--giant">
            <Lines lines={[{ text: p.title[0] }, { text: p.title[1] ?? "" }]} />
          </h3>
        </div>
        <p className="proj__desc proj__desc--floating">{p.desc}</p>
        <ul className="proj__tags proj__tags--floating">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      </article>
    );
  }

  return (
    <article className="proj proj--portrait" id={p.id}>
      <div className="proj__meta">
        <span className="meta">PROJECT / {p.num}</span>
        <h3 className="proj__title">
          <Lines lines={[{ text: p.title[0] }]} />
        </h3>
        <p className="proj__desc">{p.desc}</p>
        <ul className="proj__tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <div className="proj__media proj__media--portrait">{media(p.img, "pm--portrait")}</div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Services — full-width rows with a cursor-following preview         */
/* ------------------------------------------------------------------ */
function ServicesList() {
  const [preview, setPreview] = useState<{ y: number; i: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="svc-list"
      ref={listRef}
      onPointerLeave={() => setPreview(null)}
    >
      {SERVICES.map((s, i) => (
        <Reveal as="div" key={s.n} delay={i * 40}>
          <div
            className="svc"
            data-cursor="RÉSZLETEK ↗"
            onPointerMove={(e) => {
              const r = listRef.current?.getBoundingClientRect();
              if (r) setPreview({ y: e.clientY - r.top, i });
            }}
          >
            <span className="svc__num">{s.n}</span>
            <h3 className="svc__title">{s.t}</h3>
            <span className="svc__h">{s.h}</span>
            <span className="svc__arr" aria-hidden="true">→</span>
          </div>
        </Reveal>
      ))}
      {preview && (
        <div
          className="svc-preview"
          style={{ top: preview.y }}
          aria-hidden="true"
        >
          <span className="svc-preview__num">{SERVICES[preview.i].n}</span>
          <span className="svc-preview__label">{SERVICES[preview.i].t}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App — the new composition                                          */
/* ------------------------------------------------------------------ */
export function App() {
  const { currentId } = useScrollSpy(SPY_IDS, "hero");

  return (
    <>
      <a className="skip-link" href="#hero">Ugrás a tartalomhoz</a>

      {/* page load: logo reveal, then the curtain lifts (~0.9s) */}
      <div className="boot" aria-hidden="true">
        <LogoLockup height={40} stem="#F2F1EE" bowl="#2B50FF" text="#F2F1EE" className="boot__logo" />
      </div>

      <Cursor />
      <ScrollProgress />
      <Nav />

      <main className="hero-gate">
        {/* ------------------------------------------------------ HERO */}
        <section id="hero" className="hero" data-section>
          <MouseParallax strength={16} className="hero__drift">
            <div className="hero__noise" aria-hidden="true" />
          </MouseParallax>
          <MouseParallax strength={-10} className="hero__drift">
            <div className="hero__band" aria-hidden="true" />
          </MouseParallax>

          {/* corner metadata — the composition frame */}
          <div className="hero__corner hero__corner--tr">
            <span className="meta">INDEPENDENT DIGITAL STUDIO</span>
            <span className="meta">MONOR / HUNGARY — 2026</span>
          </div>

          {/* the centerpiece: typography past the container */}
          <h1 className="hero__title">
            <Lines
              lines={[
                { text: "DIGITAL" },
                { text: "EXPERIENCES", className: "outline" },
              ]}
            />
          </h1>

          <p className="hero__sub">
            <DriftWords text="WE BUILD WEBSITES PEOPLE REMEMBER." />
          </p>

          <div className="hero__corner hero__corner--bl">
            <Magnetic>
              <a className="hero__start" href="#quote">
                START A PROJECT <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
            <span className="meta">©2026 — SCROLL ↓</span>
          </div>
        </section>

        {/* ------------------------------------------------------- WORK */}
        <section id="work" className="work" data-section>
          <header className="work__head">
            <h2 className="work__giant">
              <Lines lines={[{ text: "SELECTED" }, { text: "WORK", className: "outline" }]} />
            </h2>
            <div className="work__headmeta">
              <span className="meta">01 — PORTFOLIO</span>
              <span className="meta">4 PROJEKT / 2025–2026</span>
              <span className="meta">SCROLL ↓</span>
            </div>
          </header>
          {PROJECTS.map((p) => (
            <ProjectBlock key={p.id} p={p} />
          ))}
        </section>

        {/* -------------------------------------------- TYPOGRAPHIC BREAK */}
        <section className="break" aria-label="Kiáltvány">
          <h2 className="break__title">
            <DriftWords text="DESIGN IS NOT DECORATION." />
          </h2>
          <p className="break__sub">
            <DriftWords text="IT'S HOW YOUR BUSINESS IS EXPERIENCED." />
          </p>
        </section>

        {/* --------------------------------------------------- SERVICES */}
        <section id="services" className="services" data-section>
          <header className="services__head">
            <span className="meta">02 — SERVICES</span>
            <h2 className="services__title">CAPABILITIES</h2>
          </header>
          <ServicesList />
        </section>

        {/* ---------------------------------------------------- PROCESS */}
        <section id="process" className="process" data-section>
          <header className="process__head">
            <span className="meta">03 — PROCESS</span>
            <h2 className="process__title">
              <Lines lines={[{ text: "FROM IDEA" }, { text: "TO LAUNCH", className: "outline" }]} />
            </h2>
          </header>
          {PROCESS.map((s, i) => (
            <Reveal key={s.n}>
              <div className={`step${i % 2 ? " step--alt" : ""}`}>
                <span className="step__bg" aria-hidden="true">{s.n}</span>
                <div className="step__body">
                  <span className="meta">{s.n} / 05</span>
                  <h3 className="step__t">{s.t}</h3>
                  <p className="step__h">{s.h}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ------------------------------------------------------ ABOUT */}
        <section id="about" className="about" data-section>
          <div className="about__cols">
            <div>
              <span className="meta">04 — ABOUT</span>
              <h2 className="about__title">
                <DriftWords text="EGY EMBER. TELJES FELELŐSSÉG." />
              </h2>
            </div>
            <div className="about__text">
              <p>
                A DAEKON nem egy csapatot imitáló ügynökség — egyszemélyes
                szakértő vagyok. A designtól a backendig én csinálom végig:
                teljes stack, teljes felelősség, valós tesztekkel.
              </p>
              <p>
                Ez a modell nem mindenkinek jó. De ha egyetlen felelős emberre
                van szükséged, aki érti a frontendet, a backendet és az üzleti
                folyamatot is — pontosan ez.
              </p>
              <ol className="about__tl">
                <li>
                  <span className="meta">2011</span>
                  <p>Első weboldalam, 14 évesen — azóta tudom, ez lesz a munkám.</p>
                </li>
                <li>
                  <span className="meta">MA</span>
                  <p>Éles rendszerek valós üzletben: rendelés, admin, teljes stack.</p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ OFFER */}
        <section id="offer" className="offer">
          <span className="meta">05 — OFFER</span>
          <h2 className="offer__title">
            <Lines lines={[{ text: "REFERENCE" }, { text: "BUILDING PERIOD", className: "outline" }]} />
          </h2>
          <p className="offer__text">
            Jelenleg korlátozott számú projektet vállalok kedvezményes díjon,
            hogy további erős referencia-projekteket építsek.
          </p>
          <Magnetic>
            <a className="offer__link" href="#quote">BECSLÉS KÉRÉSE <span aria-hidden="true">↗</span></a>
          </Magnetic>
        </section>

        {/* --------------------------------------------- QUOTE + PROOF */}
        <section id="quote" className="quote" data-section>
          <div className="quote__head">
            <span className="meta">06 — INSTANT ESTIMATE</span>
            <h2 className="quote__title">
              <DriftWords text="MENNYIBE KERÜL, AMIT ELKÉPZEL?" />
            </h2>
            <p className="quote__lede">
              Írd le a projektet — az asszisztens felismeri a funkciókat, és
              azonnal árat, határidőt ad. Minden a böngésződben marad.
            </p>
          </div>
          <Reveal>
            <QuoteAssistant />
          </Reveal>
          <Suspense fallback={null}>
            <QuoteProof currentId={currentId} />
          </Suspense>
        </section>

        {/* -------------------------------------------------- FINAL CTA */}
        <section id="contact" className="final" data-section>
          <span className="meta">HAVE A PROJECT IN MIND?</span>
          <h2 className="final__title">
            <Lines lines={[{ text: "LET'S" }, { text: "BUILD" }]} />
            <span className="final__something">
              <MouseParallax strength={44}>
                <span className="outline">SOMETHING.</span>
              </MouseParallax>
            </span>
          </h2>
          <Magnetic>
            <a
              className="final__cta"
              href="mailto:hello@daekon.hu?subject=Projekt%20megkeres%C3%A9s"
              data-cursor="SEND MAIL ↗"
            >
              PROJEKT INDÍTÁSA <span aria-hidden="true">↗</span>
            </a>
          </Magnetic>

          <footer className="colophon">
            <span className="colophon__brand">DAEKON®</span>
            <span className="meta">WEB DESIGN &amp; DEVELOPMENT</span>
            <span className="meta">MONOR / HUNGARY</span>
            <a className="colophon__mail" href="mailto:hello@daekon.hu" data-cursor="SEND MAIL ↗">
              EMAIL — HELLO@DAEKON.HU
            </a>
            <span className="meta">© 2026 DAEKON</span>
          </footer>
        </section>
      </main>
    </>
  );
}
