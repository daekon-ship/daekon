import { useClock } from "../../hooks/useClock";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import "./Nav.css";

export interface NavItem {
  id: string;
  label: string;
  mobileLabel: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "hero", label: "Kezdőlap", mobileLabel: "Kezdő" },
  { id: "munkak", label: "Munkák", mobileLabel: "Munkák" },
  { id: "szolgaltatasok", label: "Szolgáltatások", mobileLabel: "Szolg." },
  { id: "rolam", label: "Rólam", mobileLabel: "Rólam" },
  { id: "kapcsolat", label: "Kapcsolat", mobileLabel: "Kapcs." },
];

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

interface NavProps {
  onNavigate?: (sectionId: string) => void;
}

export function Nav({ onNavigate }: NavProps) {
  const { currentId, visited } = useScrollSpy(SECTION_IDS, "hero");
  const clock = useClock();

  function handleClick(id: string) {
    onNavigate?.(id);
  }

  return (
    <>
      <header className="statusbar" id="statusbar">
        <div className="statusbar__inner">
          <a className="wordmark" href="#hero" onClick={() => handleClick("hero")}>
            <svg className="wordmark__mark" viewBox="0 0 200 200" width="28" height="28" aria-hidden="true">
              <path d="M 16 10 L 71 10 L 71 44 L 50 44 L 50 156 L 71 156 L 71 190 L 16 190 Z" fill="#F4F2EE" />
              <path d="M 77 10 L 110 10 A 66 66 0 0 1 176 76 L 176 124 A 66 66 0 0 1 110 190 L 77 190 L 77 156 L 104 156 A 38 38 0 0 0 142 118 L 142 82 A 38 38 0 0 0 104 44 L 77 44 Z" fill="#2B50FF" />
            </svg>
            <span className="wordmark__text">
              <span className="wordmark__type">daekon</span>
              <span className="wordmark__tag">creative &amp; rendszerfejlesztés</span>
            </span>
          </a>

          <nav className="sysnav" aria-label="Fő navigáció">
            <ol className="sysnav__list" role="list">
              {NAV_ITEMS.map((item) => {
                const isCurrent = item.id === currentId;
                const isVisited = visited.has(item.id) && !isCurrent;
                return (
                  <li className="sysnav__item" key={item.id}>
                    <a
                      className="sysnav__link"
                      href={`#${item.id}`}
                      aria-current={isCurrent ? "true" : "false"}
                      onClick={() => handleClick(item.id)}
                    >
                      <span
                        className={`sysnav__dot${isCurrent ? " is-current" : ""}${isVisited ? " is-visited" : ""}`}
                      />
                      <span className="sysnav__label">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="statusbar__clock" aria-hidden="true">
            <span>{clock}</span>
          </div>
        </div>
      </header>

      <nav className="mobilenav" aria-label="Fő navigáció (mobil)">
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.id === currentId;
          const isVisited = visited.has(item.id) && !isCurrent;
          return (
            <a
              className="mobilenav__item"
              key={item.id}
              href={`#${item.id}`}
              aria-current={isCurrent ? "true" : "false"}
              onClick={() => handleClick(item.id)}
            >
              <span
                className={`mobilenav__dot${isCurrent ? " is-current" : ""}${isVisited ? " is-visited" : ""}`}
              />
              <span className="mobilenav__label">{item.mobileLabel}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
