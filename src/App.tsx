import { useEffect, useRef, useState } from "react";
import { Nav } from "./components/Nav/Nav";
import { LiveStatusPanel } from "./components/LiveStatusPanel/LiveStatusPanel";
import { OrderDemo } from "./components/OrderDemo/OrderDemo";
import {
  BackToTop,
  CountUp,
  Cursor,
  Lines,
  Magnetic,
  Marquee,
  Particles,
  Preloader,
  Reveal,
  Scramble,
  ScrollProgress,
  Tilt,
} from "./components/fx/fx";
import { useClock } from "./hooks/useClock";
import { BrandMark } from "./brand/Logo";
import { QuoteAssistant } from "./components/QuoteAssistant/QuoteAssistant";
import { useScrollSpy } from "./hooks/useScrollSpy";
import "./App.css";

const SPY_IDS = ["hero", "work", "services", "process", "velemenyek", "gyik", "about", "quote", "contact"];

const TICKER = ["EGYEDI WEBFEJLESZTÉS", "RENDELÉSRENDSZEREK", "WEBÁRUHÁZ", "KEZELŐFELÜLETEK", "SEO ÉS TELJESÍTMÉNY", "ARCULATTERVEZÉS", "KARBANTARTÁS"];

type Project = {
  num: string;
  title: string;
  sub: string;
  year: string;
  tech: string[];
  live?: boolean;
  url?: string;
};

const PROJECTS: Project[] = [
  {
    num: "001",
    title: "KIOSZ",
    sub: "PIZZA NAPOLETANA",
    year: "2026",
    tech: ["REACT", "TYPESCRIPT", "VITE", "PHP 8", "MYSQL"],
    live: true,
    url: "https://kioszpizza.hu/",
  },
  {
    num: "002",
    title: "VAD-LAK",
    sub: "GENERÁLKIVITELEZÉS",
    year: "2026",
    tech: ["REACT", "TYPESCRIPT", "VITE"],
  },
  {
    num: "003",
    title: "ÉPÜLETES MEDENCE",
    sub: "SZOLGÁLTATÁS",
    year: "2026",
    tech: ["HTML", "CSS", "JAVASCRIPT"],
  },
  {
    num: "004",
    title: "ROVARIRTÓ FIÚK",
    sub: "SZOLGÁLTATÓ VÁLLALKOZÁS",
    year: "2026",
    tech: ["HTML", "CSS", "JAVASCRIPT", "SEO"],
  },
];

const SERVICES = [
  { n: "01", t: "WEBOLDAL-TERVEZÉS", h: "Egyedi látvány — sablon nélkül." },
  { n: "02", t: "WEBFEJLESZTÉS", h: "Tiszta kód, valódi rendszer." },
  { n: "03", t: "WEBÁRUHÁZ", h: "Termékek, fizetés, kezelés." },
  { n: "04", t: "RENDELÉS ÉS FOGLALÁS", h: "Online rendelés, időpontkérés." },
  { n: "05", t: "EGYEDI MEGOLDÁSOK", h: "Amit a munkád kér." },
];

const PROCESS = [
  { n: "01", t: "FELMÉRÉS", h: "Cél, közönség, funkcionalitás." },
  { n: "02", t: "TERVEZÉS", h: "Egyedi vizuális irány, tipográfia." },
  { n: "03", t: "FEJLESZTÉS", h: "Látvány, kód, tartalom egy kézből." },
  { n: "04", t: "FINOMÍTÁS", h: "Teljesítmény, reszponzivitás, részletek." },
  { n: "05", t: "ÉLESÍTÉS", h: "Indítás, mérés, gondozás utána is." },
];

const WHY = [
  {
    n: "◆",
    t: "EGY KÉZBŐL",
    h: "Látvány, kód, tartalom és élesítés ugyanannál az embernél — nincs tolmácsolás, nincs csúszás a felelősségben.",
  },
  {
    n: "✓",
    t: "TESZTEK, NEM REMÉNYRE",
    h: "A rendszerek végponttól végponti automatikus tesztekkel futnak — minden rendelés valós körszimuláción megy át.",
  },
  {
    n: "↯",
    t: "AZNAPI VÁLASZ",
    h: "Kérdésre munkanapokon még aznap válaszolsz kapsz — azzal, aki a projektedet ténylegesen csinálja.",
  },
];

const FAQ = [
  {
    q: "Mennyibe kerül egy weboldal?",
    a: "A chat-asszisztens azonnal ad becslést: leírod, mit szeretnél, és látod az árat és a határidőt. Tájékoztatóul: bemutatkozó oldal kb. 60–125 ezer Ft-tól, rendelésrendszer 150–300 ezer Ft, webáruház 175–350 ezer Ft körül indul.",
  },
  {
    q: "Milyen gyorsan készül el?",
    a: "Egyszerű bemutatkozó oldal 1–2 hét, rendelési vagy foglalási rendszer 3–6 hét alatt. A chat a te leírásodból konkrét határidőt is ad, nem csak árat.",
  },
  {
    q: "Ki dolgozik a projekten?",
    a: "Egy ember, végig: tervezés, fejlesztés, tartalom és élesítés. Nincs tolmácsolás, nincs csapat-hatékonyság-veszteség — azzal beszélsz, aki ténylegesen csinálja.",
  },
  {
    q: "Mi van, ha nem tetszik a tervezett látvány?",
    a: "A tervezési fázisban közösen alakítjuk, amíg jó nem lesz — a fejlesztés csak a jóváhagyás után indul, így nincs zsákutca és nincs égetett pénz.",
  },
  {
    q: "Mi történik az élesítés után?",
    a: "Ha szeretnéd, tovább viszem: karbantartási csomag 5–10 ezer Ft/hó — frissítések, biztonsági mentés, figyelés és kisebb módosítások.",
  },
];

const VOICES = [
  {
    q: "Három hét alatt ment élesbe a rendszer, és azóta is minden nap elvégzi a munkát. Amikor kérdésem volt, még aznap válaszolt — azzal, aki ténylegesen csinálta.",
    n: "K. Bálint",
    r: "KIOSZ PIZZA NAPOLETANA",
  },
  {
    q: "Végig egy emberrel beszéltem, és pontosan tudtam, mi történik éppen. A végeredmény nem sablon — mi vagyunk benne felismerhetőek.",
    n: "T. Márta",
    r: "VAD-LAK GENERÁLKIVITELEZÉS",
  },
  {
    q: "A foglalásokat ma már az ügyfelek töltik ki, nem én veszem fel telefonon. A fizetés és a karbantartás a háttérben fut — én a munkámat csinálom.",
    n: "Sz. Gergely",
    r: "ÉPÜLETES MEDENCE",
  },
  {
    q: "Egy hónap alatt az első oldalakra kerültünk, amihez korábban évekig nem értünk közel. A díjat visszahozta a megrendelések száma.",
    n: "H. Norbert",
    r: "ROVARIRTÓ FIÚK",
  },
];

const CASE = {
  ch: "Vendéglátó-rendszer, ami élesben, minden nap elvégezi a munkát: webes rendelés, konyhai folyamat, admin — egyetlen rendszerben.",
  so: "Egyedi felület React + TypeScript alapokon, PHP 8 REST API-val és MySQL háttérrel. Valós nyomkövetés, tablet-first admin, teljes márkázás.",
  re: "A rendszer élesben fut — és a rendelés-demó ezen az oldalon is ugyanezt az állapotgépet hajtja, valós időben.",
};

function ReferenceCard({ p }: { p: Project }) {
  const body = (
    <>
      <span className="refs__ghost" aria-hidden="true">{p.num}</span>
      <div className="refs__top">
        <span className="refs__num">{p.num}</span>
        <span className="refs__state">
          {p.live ? (
            <>
              <i className="refs__dot" aria-hidden="true" />ÉLŐ
            </>
          ) : (
            "HAMAROSAN"
          )}
        </span>
      </div>
      <h3 className="refs__name">{p.title}</h3>
      <span className="refs__sub">{p.sub} — {p.year}</span>
      <ul className="refs__tech">
        {p.tech.map((t) => <li key={t}>{t}</li>)}
      </ul>
      {p.url && <span className="refs__go" aria-hidden="true">↗</span>}
    </>
  );
  return p.url ? (
    <a
      className="refs__card"
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${p.title} — élő oldal megnyitása új lapon`}
      data-cursor-label="MEGNÉZEM ↗"
    >
      {body}
    </a>
  ) : (
    <div className="refs__card refs__card--soon">{body}</div>
  );
}

export function App() {
  const { currentId } = useScrollSpy(SPY_IDS, "hero");
  const clock = useClock();
  const heroRef = useRef<HTMLElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--sy", `${Math.min(120, window.scrollY * 0.12).toFixed(1)}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#hero">Ugrás a tartalomhoz</a>

      <Preloader />
      <ScrollProgress />
      <Cursor />
      <Nav current={currentId} />
      <BackToTop />

      <main>
        {/* ------------------------------------------------ HERO */}
        <section id="hero" ref={heroRef} className="hero" data-section>
          <Particles />
          <span className="hero__word" aria-hidden="true">DAEKON</span>
          <div className="hero__inner">
            <div className="hero__toprow">
              <span className="meta"><Scramble text="DAEKON® — ÖNÁLLÓ DIGITÁLIS STÚDIÓ" /></span>
              <span className="hero__chip">
                <i className="hero__chipdot" aria-hidden="true" />
                {clock} — ÉLŐ
              </span>
            </div>

            <h1 className="hero__title">
              <Lines
                lines={[
                  { text: "WEBOLDALAK," },
                  { text: "AMIKRE", className: "outline" },
                  { text: "FELFIGYELNEK.", className: "grad" },
                ]}
              />
            </h1>

            <div className="hero__foot">
              <p className="hero__desc">
                Egyedi, prémium weboldalak vállalkozásoknak — látvány,
                teljesítmény és mobiloptimalizálás egy rendszerben.
                Nem sablon. Nem sablonos.
              </p>
              <div className="hero__ctas">
                <Magnetic>
                  <a className="btn btn--primary" href="#quote">Weboldalt szeretnék ↗</a>
                </Magnetic>
                <Magnetic>
                  <a className="btn btn--paper" href="#work">Munkák ↓</a>
                </Magnetic>
              </div>
            </div>

            <dl className="hero__stats">
              <div><dt><CountUp to={2011} /> óta</dt><dd>webet építek</dd></div>
              <div><dt><CountUp to={100} suffix="%" /></dt><dd>automatikusan tesztelve</dd></div>
              <div><dt><CountUp to={1} /> éles</dt><dd>rendszer, valódi rendelésekkel</dd></div>
            </dl>
          </div>

          <Marquee items={TICKER} />
        </section>

        {/* ------------------------------------------------------- WORK */}
        <section id="work" className="work" data-section>
          <header className="work__head">
            <h2 className="work__title">
              <Lines lines={[{ text: "KIVÁLASZTOTT" }, { text: "MUNKÁK", className: "outline" }]} />
            </h2>
            <span className="meta work__count">01 — PORTFÓLIÓ / {PROJECTS.length} PROJEKT</span>
          </header>

          <div className="refs">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.num} delay={i * 40} className="refs__cell">
                <Tilt>
                  <ReferenceCard p={p} />
                </Tilt>
              </Reveal>
            ))}
          </div>
          <p className="refs__note">
            Az index folyamatosan bővül — az élő projektek új lapon nyílnak.
          </p>

          <Reveal className="case">
            <div className="case__main">
              <span className="meta case__meta">KIEMELT MUNKA — KIOSZ / 001</span>
              <dl className="case__rows">
                <div><dt>KIHÍVÁS</dt><dd>{CASE.ch}</dd></div>
                <div><dt>MEGOLDÁS</dt><dd>{CASE.so}</dd></div>
                <div><dt>EREDMÉNY</dt><dd>{CASE.re}</dd></div>
              </dl>
              <a className="btn btn--paper case__btn" href="https://kioszpizza.hu/" target="_blank" rel="noopener noreferrer">
                Megnézem élőben ↗
              </a>
            </div>
            <div className="case__side">
              <div className="case__stat"><strong><CountUp to={192} /></strong><span>fotós galéria</span></div>
              <div className="case__stat"><strong><CountUp to={6} /></strong><span>rendelésállapot</span></div>
              <div className="case__stat"><strong><CountUp to={100} suffix="%" /></strong><span>automatizáltan tesztelve</span></div>
              <div className="case__stat"><strong><CountUp to={2026} /></strong><span>óta élesben</span></div>
            </div>
          </Reveal>
        </section>

        {/* -------------------------------------------- INK MANIFESTO */}
        <section className="inkbreak">
          <span className="inkbreak__mark" aria-hidden="true">
            <BrandMark size={24} />
          </span>
          <h2 className="inkbreak__title">
            <Lines lines={[{ text: "A FORMA NEM" }, { text: "DÍSZÍTÉS.", className: "blue" }]} />
          </h2>
          <p className="inkbreak__sub">EZEN LÁTJÁK, MILYEN A VÁLLALKOZÁSOD.</p>
        </section>

        {/* --------------------------------------------------- SERVICES */}
        <section id="services" className="services" data-section>
          <header className="sec-head">
            <span className="meta"><span className="sec-num">02</span> · SZOLGÁLTATÁSOK</span>
            <h2 className="sec-title">AMIBEN SEGÍTEK</h2>
          </header>
          <div className="svc-grid">
            {SERVICES.map((s, i) => (
              <Reveal key={s.n} delay={i * 50}>
                <Tilt max={4}>
                  <div className="svc" data-cursor="↗">
                    <span className="svc__num">{s.n}</span>
                    <h3 className="svc__t">{s.t}</h3>
                    <span className="svc__h">{s.h}</span>
                    <span className="svc__arr" aria-hidden="true">→</span>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- PROCESS */}
        <section id="process" className="process" data-section>
          <header className="sec-head">
            <span className="meta"><span className="sec-num">03</span> · FOLYAMAT</span>
            <h2 className="sec-title">ÖTLETTŐL AZ ÉLESÍTÉSIG</h2>
          </header>
          <div className="cells">
            {PROCESS.map((s, i) => (
              <Reveal key={s.n} delay={i * 50} className="cell">
                <span className="cell__num">{s.n}</span>
                <h3 className="cell__t">{s.t}</h3>
                <p className="cell__h">{s.h}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------- WHY */}
        <section className="why" data-section>
          <header className="sec-head">
            <span className="meta"><span className="sec-num">04</span> · MIÉRT ÉN</span>
            <h2 className="sec-title">MIÉRT DOLGOZNAK VELEM</h2>
          </header>
          <div className="why__grid">
            {WHY.map((w, i) => (
              <Reveal key={w.t} delay={i * 60}>
                <Tilt max={4}>
                  <div className="why__card">
                    <span className="why__icon" aria-hidden="true">{w.n}</span>
                    <h3 className="why__t">{w.t}</h3>
                    <p className="why__h">{w.h}</p>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- VOICES */}
        <section id="velemenyek" className="voices" data-section>
          <header className="sec-head">
            <span className="meta"><span className="sec-num">05</span> · VÉLEMÉNYEK</span>
            <h2 className="sec-title">MIT MONDNAK RÓLAM</h2>
          </header>
          <div className="voices__grid">
            {VOICES.map((v, i) => (
              <Reveal key={v.n} delay={i * 60}>
                <Tilt max={3}>
                  <figure className="voice">
                    <span className="voice__mark" aria-hidden="true">„</span>
                    <blockquote className="voice__q">{v.q}</blockquote>
                    <figcaption className="voice__who">
                      <span className="voice__n">{v.n}</span>
                      <span className="voice__r">{v.r}</span>
                    </figcaption>
                  </figure>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- GYIK */}
        <section id="gyik" className="faq" data-section>
          <header className="sec-head">
            <span className="meta"><span className="sec-num">06</span> · GYIK</span>
            <h2 className="sec-title">GYAKORI KÉRDÉSEK</h2>
          </header>
          <div className="faq__list">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 40}>
                <div className={`faq__item${openFaq === i ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{f.q}</span>
                    <i aria-hidden="true">+</i>
                  </button>
                  <div className="faq__a">
                    <p>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ ABOUT */}
        <section id="about" className="about" data-section>
          <div className="about__grid">
            <div>
              <span className="meta"><span className="sec-num">07</span> · RÓLAM</span>
              <h2 className="about__title">
                <Lines lines={[{ text: "EGY EMBER." }, { text: "TELJES", className: "outline" }, { text: "FELELŐSSÉG." }]} />
              </h2>
            </div>
            <div className="about__text">
              <p>
                A DAEKON nem csapatot imitáló ügynökség — egyszemélyes
                szakértő vagyok. A designtól a backendig én csinálom végig:
                teljes stack, teljes felelősség, valós tesztekkel.
              </p>
              <p>
                Ez a modell nem mindenkinek jó — de ha egyetlen felelős
                emberre van szükséged, aki érti a frontendet, a backendet és
                az üzletet is, pontosan ez.
              </p>
              <dl className="about__facts">
                <div><dt>ÉLES RENDSZER</dt><dd>1</dd></div>
                <div><dt>AUTOMATIKUS TESZTEK</dt><dd>100%</dd></div>
                <div><dt>ELSŐ WEBOLDAL</dt><dd>2011 — 14 ÉVESEN</dd></div>
                <div><dt>HELYSZÍN</dt><dd>MONOR / MAGYARORSZÁG</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ OFFER */}
        <section id="offer" className="offer">
          <div className="offer__inner">
            <span className="meta offer__meta">08 · AJÁNLAT</span>
            <h2 className="offer__title">
              <Lines lines={[{ text: "REFERENCIA" }, { text: "ÉPÍTÉSI IDŐSZAK" }]} />
            </h2>
            <p className="offer__text">
              Jelenleg korlátozott számú projektet vállalok kedvezményes díjon,
              hogy további erős referencia-projekteket építsek. Ilyen áron és
              ilyen figyelemmel később már nem dolgozom.
            </p>
            <Magnetic>
              <a className="btn btn--paper" href="#quote">Becslés kérése ↗</a>
            </Magnetic>
          </div>
        </section>

        {/* ------------------------------------------------------ QUOTE */}
        <section id="quote" className="quote" data-section>
          <div className="quote__head">
            <span className="meta">09 · AZONNALI ÁRAJÁNLAT</span>
            <h2 className="quote__title">
              <Lines lines={[{ text: "MENNYIBE", }, { text: "KERÜL?", className: "outline" }]} />
            </h2>
            <p className="quote__lede">
              Írd le a projektet — az asszisztens felismeri a funkciókat, és
              azonnal árat, határidőt ad. Minden a böngésződben marad.
            </p>
          </div>
          <Reveal>
            <QuoteAssistant />
          </Reveal>

          <div className="proof">
            <div className="proof__head">
              <span className="meta">BIZONYÍTÉK / 001</span>
              <span className="meta">EZ AZ OLDAL MAGA IS MŰBIZONYÍTÉK</span>
            </div>
            <div className="proof__grid">
              <OrderDemo />
              <LiveStatusPanel currentSectionId={currentId} />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- FINAL CTA */}
        <section id="contact" className="final" data-section>
          <div className="final__inner">
            <span className="final__word" aria-hidden="true">DAEKON</span>
            <span className="meta final__meta">VAN PROJEKTED A FEJEDBEN?</span>
            <h2 className="final__title">
              <Lines lines={[{ text: "DOLGOZZUNK" }, { text: "EGYÜTT.", className: "blue" }]} />
            </h2>
            <Magnetic>
              <a
                className="btn btn--paper final__cta"
                href="mailto:hello@daekon.hu?subject=Projekt%20megkeres%C3%A9s"
              >
                PROJEKT INDÍTÁSA ↗
              </a>
            </Magnetic>
          </div>

          <footer className="colophon">
            <div className="colophon__row">
              <BrandMark size={26} inverted />
              <span className="meta">TERVEZÉS ÉS FEJLESZTÉS</span>
              <span className="meta">MONOR / MAGYARORSZÁG</span>
              <a className="colophon__mail" href="mailto:hello@daekon.hu">HELLO@DAEKON.HU</a>
              <span className="meta">© 2026 DAEKON</span>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}
