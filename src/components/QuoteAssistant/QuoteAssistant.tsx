/* =========================================================================
   QuoteAssistant — "írd le mit akarsz, kapj árat" asszisztens.
   100% client-side: a leírás nem hagyja el a böngészőt; a kulcsszó-motor
   felismeri a funkciókat, summa ár + határidő becslést ad, és előkészített
   emailel zár (a küldés mindig a látogató döntése).
   ========================================================================= */
import { useMemo, useState } from "react";
import {
  estimate,
  formatFt,
  formatWeeks,
  mailtoHref,
  type QuoteResult,
} from "../../lib/quoteEstimator";
import "./QuoteAssistant.css";

const EXAMPLES = [
  "Szeretnék egy webshopot fizetéssel és admin felülettel",
  "Étteremnek rendelésrendszer mobilra, SEO-val",
  "Céges bemutatkozó oldal bloggal, prémium designnal",
  "Foglalási rendszer belépéssel és 3D animációval",
];

export function QuoteAssistant() {
  const [text, setText] = useState("");
  const result: QuoteResult = useMemo(() => estimate(text), [text]);
  const hasResult = result.features.length > 0;

  return (
    <div className="qassist">
      <div className="qassist__head">
        <span className="qassist__dot" aria-hidden="true" />
        <span className="qassist__name">DAEKON asszisztens</span>
        <span className="qassist__tag">azonnali árbecslés</span>
      </div>

      <label className="qassist__label" htmlFor="qassist-input">
        Írd le, mit szeretnél — funkciókat, célokat, bármit. Nem megy el
        sehova, a gépeden értékeljük ki.
      </label>
      <textarea
        id="qassist-input"
        className="qassist__input"
        rows={4}
        placeholder="Pl.: Kell egy webshop bankkártyás fizetéssel, adminnal és mobilon is jónak kell lennie…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="qassist__examples" aria-label="Példák">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="qassist__example"
            onClick={() => setText(ex)}
          >
            {ex}
          </button>
        ))}
      </div>

      {hasResult && (
        <div className="qassist__result" role="status">
          <div className="qassist__price">
            <span className="qassist__amount">
              {formatFt(result.min)} – {formatFt(result.max)} Ft
            </span>
            <span className="qassist__time">
              határidő: {formatWeeks(result.weeksMin, result.weeksMax)}
            </span>
            {result.recurring && (
              <span className="qassist__time">
                + {formatFt(result.recurring.min)}–{formatFt(result.recurring.max)}{" "}
                Ft/hó üzemeltetés
              </span>
            )}
          </div>

          <ul className="qassist__features">
            {result.features.map((f) => (
              <li key={f.id}>
                <span>{f.label}</span>
                <em>
                  {f.recurring
                    ? `${formatFt(f.min)}–${formatFt(f.max)} Ft/hó`
                    : `${formatFt(f.min)}–${formatFt(f.max)} Ft`}
                </em>
              </li>
            ))}
          </ul>

          <p className="qassist__note">
            Ez csak tájékoztató becslés a leírásod alapján — a végleges árat a
            részletek után adom.
          </p>

          <a
            className="btn btn--primary qassist__send"
            href={mailtoHref(text, result)}
          >
            Emailem elküldése ezzel a becsléssel
          </a>
        </div>
      )}

      {!hasResult && text.trim().length > 0 && (
        <p className="qassist__empty" role="status">
          Még nem ismerek fel elegendő funkciót — írd le részletesebben (pl.
          weboldal, webshop, foglalás, admin, fizetés, 3D…).
        </p>
      )}
    </div>
  );
}
