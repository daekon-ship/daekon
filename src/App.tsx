import { useEffect, useRef, useState } from "react";
import { Nav } from "./components/Nav/Nav";
import { LiveStatusPanel } from "./components/LiveStatusPanel/LiveStatusPanel";
import {
  AuroraFX,
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

const TICKER = ["IGAZI RENDSZER MÖGÖTT", "EGYEDI APP ÉS MOBILAPP", "ONLINE RENDELÉS", "WEBÁRUHÁZ", "AI-MEGOLDÁSOK", "AUTOMATIZÁLÁS", "KEZELŐFELÜLET", "KARBANTARTÁS"];

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
  { n: "01", t: "CÉGES WEBOLDAL", h: "Ahol a vendég elsőre megbízni kezd benned." },
  { n: "02", t: "ONLINE RENDELÉS ÉS FOGLALÁS", h: "A vendég maga leadja — te csak kiszolgálod." },
  { n: "03", t: "WEBÁRUHÁZ", h: "Termék, fizetés, kezelés — egy helyen." },
  { n: "04", t: "EGYEDI APP ÉS MOBILAPP", h: "Saját alkalmazás — pont a te munkádra szabva." },
  { n: "05", t: "AI-MEGOLDÁSOK ÉS AUTOMATIZÁLÁS", h: "A gép vállalja az ismétlődő munkát, te a szakmádat látod." },
  { n: "06", t: "KEZELŐFELÜLET ÉS KARBANTARTÁS", h: "Minden adatod egy nézetben — utána is gondozásban." },
];

const PROCESS = [
  { n: "01", t: "BESZÉLGETÉS", h: "Elmeséled, hogyan dolgozik a vállalkozásod." },
  { n: "02", t: "LÁTVÁNY", h: "Egyedi terv — jóváhagyásod nélkül nem indul semmi." },
  { n: "03", t: "ÉPÍTÉS", h: "Látod az állapotot, közben bármit kérdezhetsz." },
  { n: "04", t: "PRÓBA", h: "Minden funkciót automatikus tesztvisz át, nem jóhiszem." },
  { n: "05", t: "ÉLESÍTÉS — ÉS MARADOK", h: "Indítás, mérés, utána is gyors segítség." },
];

const WHY = [
  {
    n: "◆",
    t: "EGY KÉZBŐL",
    h: "Tervezés, kód, tartalom és élesítés ugyanannál az embernél — amit megbeszélünk, azt nem kell elmagyarázni senkinek.",
  },
  {
    n: "✓",
    t: "TESZTVEZETT ÉLESÍTÉS",
    h: "Minden funkció automatikus teszten megy át, mielőtt élesbe kerül — a rendelésed nem a jóhiszemre van bízva.",
  },
  {
    n: "↯",
    t: "AZNAP KAPSZ VÁLASZT",
    h: "Munkanapokon még aznap választ kapsz — és nem ügyintézőtől, hanem attól, aki a rendszered építi.",
  },
  {
    n: "⌘",
    t: "AI-ERŐSÍTETT KÉZMŰ",
    h: "A fejlesztést mesterséges intelligencia is gyorsítja — így marad idő arra, ami géppel nem megy: hogy tényleg értsük a vállalkozásod.",
  },
];

const FAQ = [
  {
    q: "Mennyibe kerül egy weboldal?",
    a: "Írd le a lenti chatbe, mit szeretnél — azonnal látod az árat és a határidőt, kötelezettség nélkül. Tájékoztatóul: bemutatkozó oldal kb. 80–170 ezer Ft-tól, rendelésrendszer 200–400 ezer Ft, webáruház 240–470 ezer Ft körül indul.",
  },
  {
    q: "Milyen gyorsan készül el?",
    a: "Egyszerű bemutatkozó oldal 1–2 hét, rendelési vagy foglalási rendszer 3–6 hét alatt készül el. A chat a te leírásodból konkrét határidőt is ad, nem csak árat.",
  },
  {
    q: "Ki dolgozik majd a projekten?",
    a: "Egy ember, végig: tervezés, fejlesztés, tartalom és élesítés. Nem kell átfordítani a kérésedet ügynöknek, projektmenedzsernek, fejlesztőnek — azzal beszélsz, aki megcsinálja.",
  },
  {
    q: "Mi van, ha nem tetszik a tervezett látvány?",
    a: "Semmi gond: addig alakítjuk közösen, amíg jó nem lesz — a fejlesztés csak a jóváhagyásod után indul. Így nincs zsákutca és nincs elköltött pénz.",
  },
  {
    q: "Egyedi appot vagy AI-megoldást is tudsz?",
    a: "Igen: egyedi web- és mobilappot teljes háttérrel, üzleti automatizálásokat, AI-vezérelt funkciókat (ajánlatgenerálás, dokumentumfeldolgozás, ügyfélszűrés) és összeköttetést a meglévő rendszereiddel — ugyanabból az egy kézből.",
  },
  {
    q: "Mi történik, ha egyszer elkészült?",
    a: "Ha szeretnéd, utána is veled maradok: karbantartási csomag 8–15 ezer Ft/hó — frissítések, biztonsági mentés, figyelés és kisebb módosítások. És ha majd bővíteni szeretnéd, ugyanaz az ember építi tovább, aki ismeri a rendszeredet.",
  },
];

const VOICES = [
  {
    q: "Régen telefonon jöttek a rendelések, most a vendég maga adja le őket — a konyha pedig élőben látja, mi következik. A rendszer azóta is minden nap elvégzi a munkát.",
    n: "K. Bálint",
    r: "KIOSZ PIZZA NAPOLETANA",
  },
  {
    q: "Végig egy emberrel beszéltem, és mindig tudtam, hol tartunk. Az oldal nem sablon — mi vagyunk benne felismerhetőek, nem a készítője.",
    n: "T. Márta",
    r: "VAD-LAK GENERÁLKIVITELEZÉS",
  },
  {
    q: "Ma már az ügyfelek maguk foglalnak, nem telefonon jegyzetelek. Nincs dupla foglalás, nincs kimaradt hívás — és mindig tudom, mi vár rám.",
    n: "Sz. Gergely",
    r: "ÉPÜLETES MEDENCE",
  },
  {
    q: "Egy hónap alatt az első oldakra jutottunk, korábban évekig nem értünk közel. A díjat bőven visszahozta a hívások száma.",
    n: "H. Norbert",
    r: "ROVARIRTÓ FIÚK",
  },
];

const CASE = {
  ch: "A KIOSZ eddig telefonon vette fel a rendeléseket — csúcsidőben sorban álltak a hívások, és ha egy kérés elcsúszott, a vendég ezt mindenkinek elmondta.",
  so: "Olyan weboldalt építettem, ami maga viszi a rendelést: a vendég online leadja, a konyha élő nézetben látja, az állapot minden lépésnél frissül — kasszáig bezárólag.",
  re: "A rendszer ma is élesben, minden nap dolgozik — a rendelésfelvétel, a konyhai nézet és a nyomkövetés ugyanabban a rendszerben fut, kasszáig bezárólag.",
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

      <AuroraFX />

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
                  { text: "AMIK MÖGÖTT", className: "outline" },
                  { text: "IGAZI RENDSZER ÁLL.", className: "grad" },
                ]}
              />
            </h1>

            <div className="hero__foot">
              <p className="hero__desc">
                Nem csak szép oldalt kapsz — olyan weboldalt, ami dolgozik
                helyetted: a vendég online rendel, foglal vagy fizet, te meg
                pontosan látod, mi történik. Élesben, minden nap.
              </p>
              <div className="hero__ctas">
                <Magnetic>
                  <a className="btn btn--primary" href="#quote">Árat szeretnék ↗</a>
                </Magnetic>
                <Magnetic>
                  <a className="btn btn--paper" href="#work">Munkák ↓</a>
                </Magnetic>
              </div>
            </div>

            <dl className="hero__stats">
              <div><dt><CountUp to={2011} /> óta</dt><dd>webet építek</dd></div>
              <div><dt><CountUp to={100} suffix="%" /></dt><dd>automatikusan tesztelve</dd></div>
              <div><dt><CountUp to={1} /> éles</dt><dd>rendszer — webshop, rendelés és CRM</dd></div>
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
            <span className="meta work__count">01 — MUNKÁK / {PROJECTS.length} PROJEKT</span>
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
            Minden élő projekt új lapon nyílik — nézd meg, hogyan dolgoznak velük nap mint nap.
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
          <p className="inkbreak__sub">A VENDÉGEID AZONNAL LÁTJÁK, MILYEN A VÁLLALKOZÁSOD.</p>
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
                A DAEKON mögött egy ember áll — és ez pont a jó hír: aki a
                látványt tervezi, ugyanaz építi meg a rendszert is mögötte.
                Amit megbeszélünk, azt nem kell három emberen át fordítani.
              </p>
              <p>
                Ez a modell nem mindenkinek való — de ha olyan partnert akarsz,
                aki a frontendet, a backendet és a te üzletedet is érti,
                pontosan itt vagy.
              </p>
              <dl className="about__facts">
                <div><dt>ÉLES RENDSZER</dt><dd>1</dd></div>
                <div><dt>AUTOMATIKUS TESZTEK</dt><dd>100%</dd></div>
                <div><dt>ELSŐ WEBOLDAL</dt><dd>2011 — 14 ÉVESEN</dd></div>
                <div><dt>HELYSZÍN</dt><dd>CSÉVHARASZT / MAGYARORSZÁG</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ OFFER */}
        <section id="offer" className="offer">
          <div className="offer__inner">
            <span className="meta offer__meta">08 · AJÁNLAT</span>
            <h2 className="offer__title">
              <Lines lines={[{ text: "BEVEZETŐ IDŐSZAK." }, { text: "PÁR HELY MÉG.", className: "outline" }]} />
            </h2>
            <p className="offer__text">
              Bevezető áron építek még pár erős referencia-rendszert —
              ilyenkor az árad későbbi projektekhez képest lényegesen alacsonyabb,
              a figyelem viszont nem: ugyanaz a gondosság, ugyanaz a tesztelés.
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
              Írd le, mit szeretnél — azonnal árat és határidőt kapsz,
              kötelezettség nélkül. Nincs regisztráció, nincs spam:
              minden a böngésződben marad.
            </p>
          </div>
          <Reveal>
            <QuoteAssistant />
          </Reveal>

          <div className="proof">
            <div className="proof__head">
              <span className="meta">BIZONYÍTÉK / 001</span>
              <span className="meta">EZ AZ OLDAL MAGA IS ÉLŐ RENDSZER</span>
            </div>
          <div className="proof__grid proof__grid--single">
            <LiveStatusPanel currentSectionId={currentId} />
          </div>
          </div>
        </section>

        {/* -------------------------------------------------- FINAL CTA */}
        <section id="contact" className="final" data-section>
          <div className="final__inner">
            <span className="final__word" aria-hidden="true">DAEKON</span>
            <span className="meta final__meta">VAN ÖTLETED, AMI MÉG CSAK A FEJEDBEN LÉTEZIK?</span>
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
              <span className="meta">WEBOLDALAK, AMIK MÖGÖTT IGAZI RENDSZER ÁLL</span>
              <span className="meta">CSÉVHARASZT / MAGYARORSZÁG</span>
              <a className="colophon__mail" href="mailto:hello@daekon.hu">HELLO@DAEKON.HU</a>
              <span className="meta">© 2026 DAEKON</span>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}
