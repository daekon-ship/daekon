import { Nav } from "./components/Nav/Nav";
import { LiveStatusPanel } from "./components/LiveStatusPanel/LiveStatusPanel";
import { OrderDemo } from "./components/OrderDemo/OrderDemo";
import {
  Lines,
  Magnetic,
  Marquee,
  Reveal,
  Scramble,
  ScrollProgress,
} from "./components/fx/fx";
import { BrandMark } from "./brand/Logo";
import { QuoteAssistant } from "./components/QuoteAssistant/QuoteAssistant";
import { useScrollSpy } from "./hooks/useScrollSpy";
import kiosz01 from "./assets/img/kiosz-01.jpg";
import kiosz04 from "./assets/img/kiosz-04.jpg";
import "./App.css";

const SPY_IDS = ["hero", "work", "services", "process", "about", "quote", "contact"];

const TICKER = ["EGYEDI WEBFEJLESZTÉS", "RENDELÉSRENDSZEREK", "WEBÁRUHÁZ", "KEZELŐFELÜLETEK", "SEO ÉS TELJESÍTMÉNY", "ARCULATTERVEZÉS", "KARBANTARTÁS"];

type Project = {
  num: string;
  title: string;
  sub: string;
  year: string;
  tags: string[];
  desc: string;
  variant: "photo" | "blue" | "paper" | "ink";
  img?: { src: string; alt: string; position?: string };
  img2?: { src: string; alt: string };
};

const PROJECTS: Project[] = [
  {
    num: "001",
    title: "KIOSZ",
    sub: "PIZZA NAPOLETANA",
    year: "2026",
    tags: ["WEBOLDAL", "FEJLESZTÉS", "RENDELÉSRENDSZER"],
    desc: "Teljes márkázott vendéglátó-rendszer: online rendelés valós nyomkövetővel, tablet-first admin, 192 fotós galéria — élesben fut, E2E tesztelve.",
    variant: "photo",
    img: { src: kiosz04, alt: "Fekete-fehér pillanatkép: a pizzaszakács feldobja a tésztát." },
    img2: { src: kiosz01, alt: "Frissen sült margherita a KIOSZ asztalán." },
  },
  {
    num: "002",
    title: "VAD-LAK",
    sub: "GENERÁLKIVITELEZÉS",
    year: "2026",
    tags: ["WEBOLDAL", "FEJLESZTÉS ALATT"],
    desc: "Vállalkozói weboldal egyedi designnal és tartalomkezeléssel — valós ügyfél, fejlesztés alatt.",
    variant: "blue",
  },
  {
    num: "003",
    title: "ÉPÜLETES MEDENCE",
    sub: "MEDENCE — SZOLGÁLTATÁS",
    year: "2026",
    tags: ["WEBOLDAL", "BEMUTATKOZÓ", "SEBESSÉG"],
    desc: "Szolgáltatói jelenlét gyors, mobiloptimalizált felülettel és ajánlatkérő folyamattal.",
    variant: "paper",
  },
  {
    num: "004",
    title: "ROVARIRTÓ FIÚK",
    sub: "SZOLGÁLTATÓ VÁLLALKOZÁS",
    year: "2026",
    tags: ["SEO", "KONVERZIÓ", "MOBIL"],
    desc: "Keresőre optimalizált szolgáltatói oldal, amely a beérkező hívásokra épít.",
    variant: "ink",
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

function ProjectBlock({ p }: { p: Project }) {
  return (
    <Reveal className={`poster poster--${p.variant}`}>
      <span className="poster__num" aria-hidden="true">{p.num}</span>
      <div className="poster__media">
        {p.img ? (
          <>
            <img className="poster__img" src={p.img.src} alt={p.img.alt} loading="lazy" style={p.img.position ? { objectPosition: p.img.position } : undefined} />
            {p.img2 && <img className="poster__img poster__img--b" src={p.img2.src} alt={p.img2.alt} loading="lazy" />}
          </>
        ) : (
          <span className="poster__bigword" aria-hidden="true">{p.title}</span>
        )}
      </div>
      <div className="poster__info">
        <span className="meta">PROJEKT / {p.num} — {p.year}</span>
        <h3 className="poster__title">
          <Lines lines={[{ text: p.title }]} />
        </h3>
        <span className="poster__sub">{p.sub}</span>
        <p className="poster__desc">{p.desc}</p>
        <ul className="poster__tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
    </Reveal>
  );
}

export function App() {
  const { currentId } = useScrollSpy(SPY_IDS, "hero");

  return (
    <>
      <a className="skip-link" href="#hero">Ugrás a tartalomhoz</a>

      <ScrollProgress />
      <Nav />

      <main>
        {/* ------------------------------------------------ HERO POSTER */}
        <section id="hero" className="hero" data-section>
          <div className="hero__frame">
            <div className="hero__toprow">
              <span className="meta"><Scramble text="DAEKON® — ÖNÁLLÓ DIGITÁLIS STÚDIÓ" /></span>
              <span className="stamp">MONOR / MAGYARORSZÁG — 2026</span>
            </div>

            <h1 className="hero__title">
              <Lines
                lines={[
                  { text: "WEBOLDALAK," },
                  { text: "AMIKRE", className: "outline" },
                  { text: "FELFIGYELNEK.", className: "blue" },
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

            <span className="hero__cross hero__cross--a" aria-hidden="true">+</span>
            <span className="hero__cross hero__cross--b" aria-hidden="true">+</span>
          </div>

          <Marquee items={TICKER} />
        </section>

        {/* ------------------------------------------------------- WORK */}
        <section id="work" className="work" data-section>
          <header className="work__head">
            <h2 className="work__title">
              <Lines lines={[{ text: "KIVÁLASZTOTT" }, { text: "MUNKÁK", className: "outline" }]} />
            </h2>
            <span className="meta work__count">01 — PORTFÓLIÓ / 4 PROJEKT</span>
          </header>

          {PROJECTS.map((p) => <ProjectBlock key={p.num} p={p} />)}
        </section>

        {/* -------------------------------------------- INK MANIFESTO */}
        <section className="inkbreak">
          <h2 className="inkbreak__title">
            <Lines lines={[{ text: "A FORMA NEM" }, { text: "DÍSZÍTÉS.", className: "blue" }]} />
          </h2>
          <p className="inkbreak__sub">EZEN LÁTJÁK, MILYEN A VÁLLALKOZÁSOD.</p>
        </section>

        {/* --------------------------------------------------- SERVICES */}
        <section id="services" className="services" data-section>
          <header className="sec-head">
            <span className="meta">02 — SZOLGÁLTATÁSOK</span>
            <h2 className="sec-title">AMIBEN SEGÍTEK</h2>
          </header>
          <div className="svc-rows">
            {SERVICES.map((s, i) => (
              <Reveal key={s.n} delay={i * 30}>
                <div className="svc" data-cursor="↗">
                  <span className="svc__num">{s.n}</span>
                  <h3 className="svc__t">{s.t}</h3>
                  <span className="svc__h">{s.h}</span>
                  <span className="svc__arr" aria-hidden="true">→</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- PROCESS */}
        <section id="process" className="process" data-section>
          <header className="sec-head">
            <span className="meta">03 — FOLYAMAT</span>
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

        {/* ------------------------------------------------------ ABOUT */}
        <section id="about" className="about" data-section>
          <div className="about__grid">
            <div>
              <span className="meta">04 — RÓLAM</span>
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
            <span className="meta offer__meta">05 — AJÁNLAT</span>
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
            <span className="meta">06 — AZONNALI ÁRAJÁNLAT</span>
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
