import { lazy, Suspense } from "react";
import { Nav, NAV_ITEMS } from "./components/Nav/Nav";
import { Panel } from "./components/Panel/Panel";
import { LiveStatusPanel } from "./components/LiveStatusPanel/LiveStatusPanel";
import { OrderDemo } from "./components/OrderDemo/OrderDemo";

// three.js is heavy — load the 3D mark only when the hero actually renders
const Mark3D = lazy(() =>
  import("./components/Mark3D/Mark3D").then((m) => ({ default: m.Mark3D })),
);
import {
  Reveal,
  Scramble,
  Magnetic,
  Marquee,
  ScrollProgress,
  Words,
  CursorGlow,
} from "./components/fx/fx";
import { LogoLockup } from "./brand/Logo";
import { useScrollSpy } from "./hooks/useScrollSpy";
import kiosz01 from "./assets/img/kiosz-01.jpg";
import kiosz02 from "./assets/img/kiosz-02.jpg";
import kiosz03 from "./assets/img/kiosz-03.jpg";
import kiosz04 from "./assets/img/kiosz-04.jpg";
import kiosz05 from "./assets/img/kiosz-05-margherita.jpg";
import kioszLogo from "./assets/img/kiosz-logo.jpg";
import "./App.css";

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

const GALLERY: { src: string; alt: string; position?: string }[] = [
  {
    src: kiosz01,
    alt: "Frissen sült margherita pizza bazsalikommal egy kültéri asztalon, mellette egy narancsszeletes koktél és egy zöldsaláta.",
  },
  {
    src: kiosz02,
    alt: "A KIOSZ belső étkezőtere retro mintás lámpaernyőkkel, mozaikcsempés padlóval, tele vendégekkel.",
  },
  {
    src: kiosz03,
    alt: "Esti hangulat a KIOSZ éttermében, színes fényfüzérekkel és teltházas asztalokkal.",
  },
  {
    src: kiosz04,
    alt: "Fekete-fehér pillanatkép: a pizzaszakács feldobja a tésztát a levegőbe, a vendégek a háttérben figyelik.",
  },
  {
    src: kiosz05,
    alt: "Közeli felvétel egy margherita pizzáról bazsalikomlevelekkel, háttérben két koktéllal és egy másik pizzával.",
    // Portrait source (1400×2100) — a centered crop loses the pizza itself;
    // bias the frame up so the subject survives the aspect-ratio crop.
    position: "50% 30%",
  },
];

const MARQUEE_ITEMS = [
  "EGYEDI WEBFEJLESZTÉS",
  "RENDELÉSRENDSZEREK",
  "ADMIN FELÜLETEK",
  "E-KERESKEDELEM",
  "BACKEND + API",
  "PRÉMIUM UI/UX",
  "TELJESÍTMÉNY",
  "KARBANTARTÁS",
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
        <section id="hero" className="section section--calm hero" data-section>
          <div className="aurora" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="section__inner hero__inner">
            <div className="hero__intro">
              <span className="badge hero__eyebrow">
                <Scramble text="ÖNÁLLÓ CREATIVE DEVELOPER" speed={22} />
              </span>
              <h1 className="hero__title">
                <Words text="Ez az oldal nem bemutatja a munkámat — bizonyítja." />
              </h1>
              <p className="hero__lede">
                DAEKON vagyok: egyszemélyes creative developer. Amit itt lent látsz — a
                pontos idő, a görgetési adatok, a rendelés-állapotgép — mind valós, futó
                kód, nem statikus makett. Ugyanaz a logika mozgatja, mint a KIOSZ Pizza
                Napoletana éles rendelési rendszerét.
              </p>
              <div className="hero__actions">
                <a className="btn btn--primary" href="#munkak">
                  Munkák megtekintése
                </a>
                <a className="btn btn--ghost" href="#kapcsolat">
                  Projekt indítása
                </a>
              </div>
            </div>

            <Reveal>
              <Suspense
                fallback={
                  <div
                    style={{
                      height: "clamp(240px, 26vw, 380px)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      background: "var(--bg-1)",
                    }}
                    aria-hidden="true"
                  />
                }
              >
                <Mark3D />
              </Suspense>
            </Reveal>

            <div className="hero__grid">
              <OrderDemo />
              <LiveStatusPanel currentSectionId={currentId} />
            </div>
          </div>
        </section>

        <Marquee items={MARQUEE_ITEMS} />

        <section id="munkak" className="section" data-section data-num="01">
          <div className="section__inner">
            <Reveal>
            <Panel eyebrow="PROJEKT — 01" statusLabel="ÉLES RENDSZER" statusTone="ready">
              <div className="work">
                <h2 className="work__title">KIOSZ Pizza Napoletana</h2>
                <p className="work__lede">
                  Teljes márkázott vendéglátó-rendszer, nem sablon: nyilvános oldal,
                  adatbázisból épülő menü, teljes online rendelés (kosár → vendégkénti
                  checkout → valós nyomkövető link) és tablet-first admin felület, ahol a
                  személyzet szerepkör szerint fogadja a rendeléseket, és kezeli a
                  hűség-/kedvezmény jogosultságokat. Alapja egy jövőbeli mobilalkalmazásnak
                  is, ugyanazon az API-n.
                </p>

                <dl className="work__facts">
                  <div className="work__fact">
                    <dt>Frontend</dt>
                    <dd>React + TypeScript + Vite</dd>
                  </div>
                  <div className="work__fact">
                    <dt>Backend</dt>
                    <dd>PHP 8 + PDO REST API (<code>/api/v1/*</code>, framework nélkül)</dd>
                  </div>
                  <div className="work__fact">
                    <dt>Adatbázis</dt>
                    <dd>MySQL/MariaDB, számozott migrációkkal</dd>
                  </div>
                  <div className="work__fact">
                    <dt>Tartalom</dt>
                    <dd>
                      Content-as-source-of-truth JSON pipeline, amiből egyszerre generálódik
                      az adatbázis-seed és a frontend adat-tükör
                    </dd>
                  </div>
                  <div className="work__fact">
                    <dt>Tesztelés</dt>
                    <dd>
                      Playwright E2E a valós éles stack ellen (böngészés → extra
                      hozzáadása → vendég checkout → nyomkövetés → admin elfogadja →
                      állapot frissül), reszponzív tesztek 360/375/390/412/430 (telefon),
                      768/820/834/1024 (tablet) és 1440 (desktop) szélességen; PHPUnit
                      integrációs tesztek valós MariaDB teszt-adatbázis ellen (optimista
                      zárolás, admin hitelesítés).
                    </dd>
                  </div>
                  <div className="work__fact">
                    <dt>Galéria</dt>
                    <dd>
                      192 fotó, öt szűrőben, 24-esével progresszíven betöltve,
                      billentyűzettel vezérelhető lightboxszal; minden képhez reszponzív
                      WebP-változatok generálódnak.
                    </dd>
                  </div>
                </dl>

                <ul className="work__gallery" aria-label="Fotók a KIOSZ Pizza Napoletanából">
                  {GALLERY.map((img) => (
                    <li key={img.src} className="work__gallery-item">
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        style={img.position ? { objectPosition: img.position } : undefined}
                      />
                    </li>
                  ))}
                </ul>

                <figure className="work__logo">
                  <img src={kioszLogo} alt="A KIOSZ Pizza Napoletana logója" loading="lazy" />
                  <figcaption>KIOSZ Pizza Napoletana — márkajelzés</figcaption>
                </figure>

                <p className="work__next">
                  <span className="badge">KÖVETKEZŐ PROJEKT</span> Vad-Lak — valós ügyfél,
                  fejlesztés alatt. Nyilvános tartalom még nincs hozzá, ezért esettanulmány
                  helyett csak ennyit érdemes most tudni róla: folyamatban van.
                </p>
              </div>
            </Panel>
            </Reveal>
          </div>
        </section>

        <section id="szolgaltatasok" className="section" data-section data-num="02">
          <div className="section__inner">
            <Reveal>
            <Panel eyebrow="SZOLGÁLTATÁSOK" statusLabel="ELÉRHETŐ" statusTone="ready">
              <div className="services">
                <h2 className="section-heading">Szolgáltatások</h2>
                <div className="glow-line" role="presentation" />
                <div className="services__group">
                  <span className="services__group-label">TERVEZÉS ÉS FEJLESZTÉS</span>
                  <ol className="services__list">
                    <li className="services__item">
                      <span className="services__index">01</span>
                      <div>
                        <h3>Egyedi webfejlesztés</h3>
                        <p>Nem sablonból induló, a projekt logikájára szabott felület és kód.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">02</span>
                      <div>
                        <h3>Prémium UI/UX tervezés</h3>
                        <p>Vizuális rendszer, tipográfia és interakció, ami a márkát szolgálja, nem egy komponenskönyvtárat.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">03</span>
                      <div>
                        <h3>Interaktív frontend / creative development</h3>
                        <p>Egyedi animáció és interakció, ott, ahol ténylegesen hozzáad valamit — nem díszítésnek.</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="services__group">
                  <span className="services__group-label">RENDSZEREK</span>
                  <ol className="services__list" start={4}>
                    <li className="services__item">
                      <span className="services__index">04</span>
                      <div>
                        <h3>Rendelés- és foglalási rendszerek</h3>
                        <p>Kosártól a visszaigazolásig — ahogy a KIOSZ élő rendelési folyamata is működik.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">05</span>
                      <div>
                        <h3>Admin felületek</h3>
                        <p>Napi használatra tervezett, szerepkör-alapú kezelőfelületek — tablet-first, ha a munkakörnyezet ezt kívánja.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">06</span>
                      <div>
                        <h3>E-kereskedelem</h3>
                        <p>Termékkatalógustól a fizetésig terjedő, valós forgalomra épített rendszerek.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">07</span>
                      <div>
                        <h3>Backend, adatbázis és API fejlesztés</h3>
                        <p>PHP/Node backend, relációs adatbázis-tervezés, REST API — a frontend mögötti teljes réteg.</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="services__group">
                  <span className="services__group-label">TELJESÍTMÉNY ÉS ÜZEMELTETÉS</span>
                  <ol className="services__list" start={8}>
                    <li className="services__item">
                      <span className="services__index">08</span>
                      <div>
                        <h3>Mobilra optimalizálás</h3>
                        <p>Külön tervezett, nem csak összenyomott mobil élmény — ahogy ez az oldal is.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">09</span>
                      <div>
                        <h3>Technikai SEO</h3>
                        <p>Szemantikus jelölés, strukturált adat, indexelhetőség — a kreatív réteg alatt is látható tartalom.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">10</span>
                      <div>
                        <h3>Teljesítmény-optimalizálás</h3>
                        <p>Mérésalapú munka — betöltési idő, Core Web Vitals, valós eszközökön ellenőrizve.</p>
                      </div>
                    </li>
                    <li className="services__item">
                      <span className="services__index">11</span>
                      <div>
                        <h3>Karbantartás</h3>
                        <p>Éles rendszerek gondozása a launch után is — hibajavítás, frissítés, apró fejlesztés.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </Panel>
            </Reveal>
          </div>
        </section>

        <section id="rolam" className="section" data-section data-num="03">
          <div className="section__inner">
            <Reveal>
            <Panel eyebrow="RÓLAM" proseContent>
              <div className="about">
                <h2 className="about__title">Egy ember, teljes felelősség</h2>
                <div className="glow-line" role="presentation" />
                <p>
                  A DAEKON nem egy csapatot imitáló ügynökség — egyszemélyes szakértő
                  vagyok. A tervezéstől a backendig, a felület-designtól a REST API-kig én
                  csinálom végig a munkát. A KIOSZ projektet is így építettem: teljes
                  stack, teljes felelősség, valós tesztekkel ellenőrizve, nem csak
                  „működik a gépemen” alapon.
                </p>
                <p>
                  Ez a modell nem mindenkinek jó — nagy, sok csapatot igénylő projektekhez
                  más felállás kell. De ha egyetlen felelős emberre van szükség, aki érti
                  a frontendet, a backendet és azt is, hogy ezek hogyan szolgálják ki a
                  valódi üzleti folyamatot (rendelés, foglalás, admin), az pontosan ez.
                </p>
                <ul className="about__points">
                  <li>Közvetlen kommunikáció — nincs projektmenedzsment-réteg a munka és közted.</li>
                  <li>Egy ember felel a teljes stackért — nincs „ez a másik csapat hibája”.</li>
                  <li>Amit itt látsz, azt én építettem: ez az oldal is a saját munkám bizonyítéka.</li>
                </ul>
              </div>
            </Panel>
            </Reveal>
          </div>
        </section>

        <section id="kapcsolat" className="section section--calm section--blue" data-section data-num="04">
          <div className="section__inner">
            <Reveal>
            <Panel eyebrow="KAPCSOLAT" statusLabel="EMAILBEN ELÉRHETŐ" statusTone="neutral">
              <div className="contact">
                <h2 className="section-heading">Kapcsolat</h2>
                <div className="glow-line" role="presentation" />
                <p className="contact__lede">
                  Ennek az oldalnak nincs backendje — nincs beküldhető űrlap, mert egy
                  olyan gombot mutatni, ami valójában sehova sem küld el semmit,
                  becsapós lenne. A leggyorsabb és legőszintébb út egy email.
                </p>
                <Magnetic>
                  <a
                    className="btn btn--primary contact__cta"
                    href="mailto:hello@daekon.hu?subject=Projekt%20megkeres%C3%A9s"
                  >
                    Írj emailt: hello@daekon.hu
                  </a>
                </Magnetic>
                <p className="contact__note">
                  Ird le pár mondatban, mit szeretnél építeni — rendelési/foglalási
                  rendszert, admin felületet, egyedi webfejlesztést vagy valami mást — és
                  visszajelzek.
                </p>
              </div>
            </Panel>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section__inner site-footer__inner">
          <span className="site-footer__wordmark">
            <LogoLockup height={34} stem="#FFFFFF" bowl="#2B50FF" text="#FFFFFF" />
          </span>
          <p className="site-footer__note">
            DAEKON saját referenciaoldala. Ez az oldal maga is bizonyíték: React +
            TypeScript + Vite + WebGL — a fejléc 3D márkajele a logó saját vektoros
            geometriájából épül, a többi animáció pedig mérésre és teljesítményre
            optimalizált, csökkentett mozgás beállításnál automatikusan visszafogja
            magát.
          </p>
        </div>
      </footer>
    </>
  );
}
