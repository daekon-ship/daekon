import { lazy, Suspense } from "react";
import { Nav, NAV_ITEMS } from "./components/Nav/Nav";
import { LiveStatusPanel } from "./components/LiveStatusPanel/LiveStatusPanel";
import { OrderDemo } from "./components/OrderDemo/OrderDemo";

// heavy — the hero sculpture loads only when the page renders
const Hero3D = lazy(() =>
  import("./components/Hero3D/Hero3D").then((m) => ({ default: m.Hero3D })),
);
import {
  Reveal,
  Lines,
  Parallax,
  ProcessProgress,
  Scramble,
  Magnetic,
  Marquee,
  ScrollProgress,
  Words,
  CursorGlow,
} from "./components/fx/fx";
import { LogoMark } from "./brand/Logo";
import { QuoteAssistant } from "./components/QuoteAssistant/QuoteAssistant";
import { useScrollSpy } from "./hooks/useScrollSpy";
import kiosz01 from "./assets/img/kiosz-01.jpg";
import kiosz03 from "./assets/img/kiosz-03.jpg";
import kiosz04 from "./assets/img/kiosz-04.jpg";
import "./App.css";

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

const TICKER = [
  "EGYEDI WEBFEJLESZTÉS",
  "RENDELÉSRENDSZEREK",
  "ADMIN FELÜLETEK",
  "E-KERESKEDELEM",
  "SEO",
  "TELJESÍTMÉNY",
  "UI/UX",
];

const PROJECTS: {
  index: string;
  title: string;
  field: string;
  desc: string;
  meta: string[];
  image?: { src: string; alt: string; position?: string }[];
  ghost: string;
  flip?: boolean;
}[] = [
  {
    index: "01",
    title: "KIOSZ PIZZA NAPOLETANA",
    field: "Vendéglátás — rendelési rendszer",
    desc: "Teljes márkázott rendszer: online rendelés valós nyomkövetővel, tablet-first admin, 192 fotós galéria, Playwright E2E tesztekkel — élesben fut.",
    meta: ["React + TypeScript", "PHP 8 REST API", "MySQL", "E2E tesztelt"],
    image: [
      { src: kiosz01, alt: "Frissen sült pizza a KIOSZ asztalán." },
      { src: kiosz03, alt: "Esti hangulat a KIOSZ éttermében." },
      { src: kiosz04, alt: "A pizzaszakács feldobja a tésztát." },
    ],
    ghost: "K",
    flip: false,
  },
  {
    index: "02",
    title: "VAD-LAK",
    field: "Generálkivitelezés",
    desc: "Vállalkozói weboldal egyedi designnal és tartalomkezeléssel — valós ügyfél, fejlesztés alatt.",
    meta: ["Egyedi design", "SEO-alapok", "Mobil-first"],
    ghost: "V",
    flip: true,
  },
  {
    index: "03",
    title: "ÉPÜLETES MEDENCE",
    field: "Medence — szolgáltatás",
    desc: "Szolgáltatói jelenlét gyors, mobiloptimalizált felülettel és ajánlatkérő folyamattal.",
    meta: ["Landing", "Ajánlatkérés", "Gyorsaság"],
    ghost: "M",
    flip: false,
  },
  {
    index: "04",
    title: "ROVARIRTÓFIUK.HU",
    field: "Szolgáltató vállalkozás",
    desc: "Keresőre optimalizált szolgáltatói oldal, amely a beérkező hívásokra épít.",
    meta: ["SEO", "Konverzió", "Mobil"],
    ghost: "R",
    flip: true,
  },
];

const CAPABILITIES = [
  { n: "01", t: "EGYEDI DESIGN", d: "Sablon helyett a márkádra épített vizuális rendszer." },
  { n: "02", t: "MOBILOPTIMALIZÁLÁS", d: "Külön tervezett mobil élmény, nem összenyomott desktop." },
  { n: "03", t: "SEO-ALAPOK", d: "Szemantikus szerkezet, amit a keresők is szeretnek." },
  { n: "04", t: "GYORS TELJESÍTMÉNY", d: "Mérésre épülő optimalizálás, valós eszközökön." },
  { n: "05", t: "EGYEDI FUNKCIÓK", d: "Rendelés, foglalás, admin — amit a munkádnak kell." },
];

const PROCESS = [
  { n: "01", t: "STRATÉGIA", d: "Cél, közönség, funkcionalitás — mit szolgál az oldal." },
  { n: "02", t: "DESIGN", d: "Egyedi vizuális irány, tipográfia, art direction." },
  { n: "03", t: "FEJLESZTÉS", d: "Tiszta kód, valódi rendszer, nem sablon." },
  { n: "04", t: "FINOMHANGOLÁS", d: "Teljesítmény, reszponzivitás, részletek csiszolása." },
  { n: "05", t: "ÉLESÍTÉS", d: "Indítás, mérés, gondozás a launch után is." },
];

export function App() {
  const { currentId } = useScrollSpy(SECTION_IDS, "hero");

  return (
    <>
      <a className="skip-link" href="#hero">
        Ugrás a tartalomhoz
      </a>

      <ScrollProgress />
      <CursorGlow />
      <Nav />

      <main>
        {/* ---------------------------------------------------------- HERO */}
        <section id="hero" className="hero" data-section>
          <div className="hero__bg" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <Suspense fallback={null}>
            <div className="hero__3d">
              <Hero3D />
            </div>
          </Suspense>
          <div className="hero__inner">
            <span className="hero__eyebrow">
              <Scramble text="DAEKON® — PRÉMIUM WEB STUDIO" speed={20} />
            </span>
            <h1 className="hero__title">
              <Lines
                lines={[
                  { text: "WEBOLDALAK," },
                  { text: "AMIKRE" },
                  { text: "FELFIGYELNEK." },
                ]}
              />
            </h1>
            <p className="hero__lede">
              Egyedi, prémium weboldalak vállalkozásoknak — látvány, teljesítmény
              és mobiloptimalizálás egy rendszerben.
            </p>
            <div className="hero__actions">
              <Magnetic>
                <a className="btn btn--primary" href="#munkak">
                  Munkáim <span className="arr">→</span>
                </a>
              </Magnetic>
              <Magnetic>
                <a className="btn btn--outline" href="#ai-arajanlat">
                  Weboldalt szeretnék <span className="arr">→</span>
                </a>
              </Magnetic>
            </div>
          </div>
          <a className="hero__scroll" href="#manifesto" aria-label="Görgess lejjebb">
            <span className="hero__scroll-line" aria-hidden="true" />
            GÖRGETÉS
          </a>
        </section>

        <Marquee items={TICKER} />

        {/* ----------------------------------------------------- MANIFESTO */}
        <section id="manifesto" className="section manifesto" aria-label="Kiáltvány">
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="01 — ELVEK" speed={26} />
              </span>
            </Reveal>
            <h2 className="statement">
              <Lines
                lines={[
                  { text: "NEM SABLONT ÉPÍTÜNK.", className: "dim" },
                  { text: "DIGITÁLIS JELENLÉTET", className: "accent" },
                  { text: "ÉPÍTÜNK.", className: "dim" },
                ]}
              />
            </h2>
            <Reveal delay={250}>
              <p className="manifesto__note">
                Minden projekt egyedi rendszer: design, kód és tartalom egy
                kézből — úgy, ahogy egy prémium studio csinálná. Amit itt látsz,
                azt én építettem, az első pixeltől az utolsó lekérdezésig.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------------------------- SELECTED WORK */}
        <section id="munkak" className="section work" data-section aria-label="Munkáim">
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="02 — SELECTED WORK" speed={26} />
              </span>
            </Reveal>
            <h2 className="work__heading">
              <Lines lines={[{ text: "KIVÁLASZTOTT MUNKÁK" }]} />
            </h2>

            {PROJECTS.map((p) => (
              <article
                key={p.index}
                className={`work-card${p.flip ? " work-card--flip" : ""}`}
              >
                <Reveal className="work-card__cover-wrap">
                  <Parallax speed={26}>
                    <div className="work-card__cover">
                      {p.image ? (
                        <div className="work-card__imgs">
                          {p.image.map((img) => (
                            <img
                              key={img.src}
                              src={img.src}
                              alt={img.alt}
                              loading="lazy"
                              style={img.position ? { objectPosition: img.position } : undefined}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="work-card__gen" aria-hidden="true">
                          <span>{p.ghost}</span>
                        </div>
                      )}
                    </div>
                  </Parallax>
                </Reveal>
                <div className="work-card__meta">
                  <span className="work-card__index">{p.index}</span>
                  <h3 className="work-card__title">{p.title}</h3>
                  <span className="work-card__field">{p.field}</span>
                  <p className="work-card__desc">{p.desc}</p>
                  <ul className="work-card__tags" aria-label="Technológiák">
                    {p.meta.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------- CAPABILITIES */}
        <section id="szolgaltatasok" className="section caps" data-section aria-label="Szolgáltatások">
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="03 — CAPABILITIES" speed={26} />
              </span>
            </Reveal>
            <ol className="caps__list">
              {CAPABILITIES.map((c, i) => (
                <Reveal as="li" key={c.n} delay={i * 70} className="caps__item">
                  <span className="caps__num">{c.n}</span>
                  <div className="caps__body">
                    <h3 className="caps__title">{c.t}</h3>
                    <p className="caps__desc">{c.d}</p>
                  </div>
                  <span className="caps__arrow" aria-hidden="true">→</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------- PROCESS */}
        <section id="folyamat" className="section process-sec" data-section aria-label="Folyamat">
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="04 — FOLYAMAT" speed={26} />
              </span>
            </Reveal>
            <h2 className="work__heading">
              <Lines lines={[{ text: "FROM IDEA TO LAUNCH" }]} />
            </h2>
            <ProcessProgress>
              <div className="process-spine" aria-hidden="true">
                <div className="process-spine__fill" />
              </div>
              <ol className="process__list">
                {PROCESS.map((s, i) => (
                  <Reveal as="li" key={s.n} delay={i * 60} className={`process__item${i % 2 ? " process__item--right" : ""}`}>
                    <span className="process__dot" aria-hidden="true" />
                    <div className="process__body">
                      <span className="process__num">{s.n}</span>
                      <h3 className="process__title">{s.t}</h3>
                      <p className="process__desc">{s.d}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </ProcessProgress>
          </div>
        </section>

        {/* --------------------------------------------------------- RÓLAM */}
        <section id="rolam" className="section about" data-section aria-label="Rólam">
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="05 — RÓLAM" speed={26} />
              </span>
            </Reveal>
            <div className="about__grid">
              <div className="about__text">
                <h2 className="about__title">
                  <Words text="Egy ember, teljes felelősség." />
                </h2>
                <p>
                  A DAEKON nem egy csapatot imitáló ügynökség — egyszemélyes
                  szakértő vagyok. A design-tól a backendig én csinálom végig:
                  teljes stack, teljes felelősség, valós tesztekkel ellenőrizve.
                </p>
                <p>
                  Ez a modell nem mindenkinek jó — de ha egyetlen felelős
                  emberre van szükséged, aki érti a frontendet, a backendet és
                  az üzleti folyamatot is, pontosan ez az.
                </p>
                <ol className="about__timeline">
                  <li>
                    <span className="about__year">2011</span>
                    <div>
                      <h3>Első weboldalam — 14 évesen</h3>
                      <p>Saját blog, saját kód — azóta tudom: ez lesz a munkám.</p>
                    </div>
                  </li>
                  <li>
                    <span className="about__year">MA</span>
                    <div>
                      <h3>Éles rendszerek</h3>
                      <p>Rendelés- és adminrendszerek valós üzletben, teljes stack.</p>
                    </div>
                  </li>
                </ol>
              </div>
              <aside className="about__side">
                <LogoMark size={120} stem="#232733" bowl="#2B50FF" className="about__mark" />
                <dl className="about__facts">
                  <div>
                    <dt>Éles rendszer</dt>
                    <dd>1</dd>
                  </div>
                  <div>
                    <dt>E2E-vel ellenőrizve</dt>
                    <dd>100%</dd>
                  </div>
                  <div>
                    <dt>Felelős a stackért</dt>
                    <dd>1 ember</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- OFFER */}
        <section id="offer" className="section offer" aria-label="Referencia időszak">
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="06 — OFFER" speed={26} />
              </span>
            </Reveal>
            <h2 className="work__heading">
              <Lines lines={[{ text: "REFERENCE BUILDING" }, { text: "PERIOD" }]} />
            </h2>
            <Reveal delay={200}>
              <p className="offer__text">
                Jelenleg korlátozott számú projektet vállalok kedvezményes díjon,
                hogy további erős referencia-projekteket építsek. Ilyen áron és
                ilyen figyelemmel később már nem dolgozom — most érdemes beszállni.
              </p>
              <Magnetic>
                <a className="arrow-link" href="#ai-arajanlat">
                  Becslés kérése <span className="arr">→</span>
                </a>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------------------- LIVE PROOF + AI QUOTE */}
        <section
          id="ai-arajanlat"
          className="section quote-sec"
          data-section
          aria-label="AI árajánlat és élő rendszerek"
        >
          <div className="section__inner">
            <Reveal>
              <span className="section-tag">
                <Scramble text="07 — AZONNALI BECSLÉS" speed={26} />
              </span>
            </Reveal>
            <h2 className="quote-sec__title">
              <Words text="Mennyibe kerül, amit elképzel?" />
            </h2>
            <p className="quote-sec__lede">
              Írd le a projektet egy-két mondatban — az asszisztens felismeri a
              funkciókat, és azonnal árat és határidőt ad. Minden a
              böngésződben marad; egy kattintással elküldheted emailel.
            </p>
            <Reveal delay={120}>
              <QuoteAssistant />
            </Reveal>

            <Reveal delay={200}>
              <div className="proof">
                <span className="proof__tag">EZ AZ OLDAL MAGA IS BIZONYÍTÉK</span>
                <div className="proof__grid">
                  <OrderDemo />
                  <LiveStatusPanel currentSectionId={currentId} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ----------------------------------------------------- FINAL CTA */}
        <section id="kapcsolat" className="final" data-section aria-label="Kapcsolat">
          <div className="final__inner">
            <h2 className="final__title">
              <Lines
                lines={[
                  { text: "KÉSZÍTSÜNK VALAMI" },
                  { text: "EMLÉKEZETEST.", className: "accent" },
                ]}
              />
            </h2>
            <Magnetic>
              <a
                className="btn btn--primary final__cta"
                href="mailto:hello@daekon.hu?subject=Projekt%20megkeres%C3%A9s"
              >
                Projekt indítása <span className="arr">→</span>
              </a>
            </Magnetic>
            <span className="final__brand">DAEKON®</span>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__copy">© {new Date().getFullYear()} DAEKON® — prémium web studio</span>
          <a className="footer__mail" href="mailto:hello@daekon.hu">
            hello@daekon.hu
          </a>
        </div>
      </footer>
    </>
  );
}
