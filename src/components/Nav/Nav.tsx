import { useEffect, useRef, useState } from "react";
import { BrandMark } from "../../brand/Logo";
import { getSoundPref, onSoundPref, setMenuAtmosphere, setSoundPref } from "../../lib/ambientAudio";
import "./Nav.css";

const LINKS = [
  { id: "work", label: "MUNKÁK" },
  { id: "services", label: "SZOLGÁLTATÁSOK" },
  { id: "about", label: "RÓLAM" },
  { id: "contact", label: "KAPCSOLAT" },
];

export function Nav({ current = "" }: { current?: string }) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(getSoundPref);
  const prevOpen = useRef(open);

  useEffect(() => onSoundPref(setSound), []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (prevOpen.current !== open) {
      prevOpen.current = open;
      setMenuAtmosphere(open);
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="nav">
        <a className="nav__brand" href="#hero" onClick={() => setOpen(false)} aria-label="DAEKON — kezdőlap">
          <BrandMark size={21} />
        </a>

        <nav className="nav__links" aria-label="Fő navigáció">
          {LINKS.map((l) => (
            <a
              key={l.id}
              className={`nav__link${current === l.id ? " is-active" : ""}`}
              href={`#${l.id}`}
              aria-current={current === l.id ? "true" : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a className="nav__cta" href="#quote">
          PROJEKT INDÍTÁSA <span aria-hidden="true">↗</span>
        </a>

        <button
          type="button"
          className={`nav__sound${sound ? " is-on" : ""}`}
          aria-pressed={sound}
          aria-label={sound ? "Háttérhang kikapcsolása" : "Háttérhang bekapcsolása"}
          onClick={() => setSoundPref(!sound)}
        >
          <span className="nav__soundbars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          SOUND <span className="nav__soundsep">/</span> {sound ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          className={`nav__burger${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
          onClick={() => setOpen((o) => !o)}
        >
          <i />
          <i />
        </button>
      </header>

      <div className={`nav-overlay${open ? " is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobil navigáció">
          {LINKS.map((l, i) => (
            <a
              key={l.id}
              className={`nav-overlay__link${current === l.id ? " is-active" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
              href={`#${l.id}`}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              <span className="meta">{String(i + 1).padStart(2, "0")}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <a
          className="nav-overlay__cta"
          style={{ "--i": LINKS.length } as React.CSSProperties}
          href="#quote"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        >
          PROJEKT INDÍTÁSA ↗
        </a>
      </div>
    </>
  );
}
