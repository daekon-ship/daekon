import { useEffect, useState } from "react";
import { BrandMark } from "../../brand/Logo";
import "./Nav.css";

const LINKS = [
  { id: "work", label: "WORK" },
  { id: "services", label: "SERVICES" },
  { id: "about", label: "ABOUT" },
  { id: "contact", label: "CONTACT" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
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
            <a key={l.id} className="nav__link" href={`#${l.id}`}>
              {l.label}
            </a>
          ))}
        </nav>

        <a className="nav__cta" href="#quote">
          START A PROJECT <span aria-hidden="true">↗</span>
        </a>

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
              className="nav-overlay__link"
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
          START A PROJECT ↗
        </a>
      </div>
    </>
  );
}
