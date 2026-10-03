/* =========================================================================
   QuoteAssistant — chat-stílusú árajánlat-asszisztens.
   A látogató leírja a projektet, az asszisztens "válaszol": felismeri a
   funkciókat, árat + határidőt ad, és okos gyorsgombokkal kérdez vissza
   (egyedi design? belépés? fizetés?). 100% böngészőben fut.
   ========================================================================= */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  estimateWithExtras,
  formatFt,
  formatWeeks,
  featureById,
  mailtoHref,
  type QuoteResult,
} from "../../lib/quoteEstimator";
import "./QuoteAssistant.css";

interface Msg {
  id: number;
  from: "user" | "ai";
  text: string;
  /** ai bubble with a live result attached (recomputed from extras) */
  resultFor?: string;
}

const EXAMPLES = [
  "Webáruház bankkártyás fizetéssel és kezelőfelülettel",
  "Étteremnek rendelésrendszer mobilra, SEO-val",
  "Céges oldal bloggal, prémium látvánnyal",
];

const QUICK_IDS = ["design", "auth", "payment", "seo", "mobile", "motion3d", "blog"];

const GREETING =
  "Szia! DAEKON asszisztens vagyok. Írd le egy-két mondatban, mit szeretnél — akár csak úgy, ahogy a kollégádnál elmesélnéd. Másodperceken belül árat és határidőt kapsz, és minden a böngésződben marad.";

export function QuoteAssistant() {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "ai", text: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const lastDesc = useRef("");
  const idRef = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);

  const latest = useMemo(
    () => [...msgs].reverse().find((m) => m.from === "ai" && m.resultFor),
    [msgs],
  );
  const result: QuoteResult | null = useMemo(
    () => (latest ? estimateWithExtras(latest.resultFor ?? "", extras) : null),
    [latest, extras],
  );
  const baseFeatures = useMemo(
    () => (latest ? estimateWithExtras(latest.resultFor ?? "", []).features : []),
    [latest],
  );
  const quickIds = useMemo(
    () => QUICK_IDS.filter((id) => !baseFeatures.some((f) => f.id === id)),
    [baseFeatures],
  );

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing, extras, result]);

  function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text) return;
    const userMsg: Msg = { id: idRef.current++, from: "user", text };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    lastDesc.current = text;
    setTyping(true);

    window.setTimeout(() => {
      const q = estimateWithExtras(text, extras);
      setTyping(false);
      setMsgs((m) => [
        ...m,
        q.features.length
          ? { id: idRef.current++, from: "ai", text: "Ezt látom ki belőle — itt a becslés:", resultFor: text }
          : {
              id: idRef.current++,
              from: "ai",
              text: "Még konkrétumot nem látok a leírásban. Írj olyasmit, hogy: weboldal, webáruház, foglalás, kezelőfelület, fizetés, 3D — és azonnal számolok.",
            },
      ]);
    }, 550);
  }

  function toggleExtra(id: string) {
    setExtras((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  }

  return (
    <div className="qchat">
      <div className="qchat__head">
        <span className="qchat__dot" aria-hidden="true" />
        <span className="qchat__name">DAEKON asszisztens</span>
        <button
          type="button"
          className="qchat__reset"
          title="Új beszélgetés indítása"
          aria-label="Új beszélgetés indítása"
          onClick={() => {
            setExtras([]);
            lastDesc.current = "";
            setMsgs([{ id: idRef.current++, from: "ai", text: GREETING }]);
          }}
        >
          ↺
        </button>
        <span className="qchat__tag">élő becslés</span>
      </div>

      <div className="qchat__scroll" ref={scroller} aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`qchat__row qchat__row--${m.from}`}>
            <div className={`qchat__bubble qchat__bubble--${m.from}`}>
              {m.text}
              {m.resultFor && result && (
                <div className="qchat__estimate">
                  <div className="qchat__amount">
                    {formatFt(result.min)} – {formatFt(result.max)} Ft
                  </div>
                  <div className="qchat__time">
                    határidő: {formatWeeks(result.weeksMin, result.weeksMax)}
                    {result.recurring
                      ? ` · + ${formatFt(result.recurring.min)}–${formatFt(result.recurring.max)} Ft/hó`
                      : ""}
                  </div>
                  <ul className="qchat__features">
                    {result.features.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                  <p className="qchat__note">
                    Tájékoztató becslés — a végleges árat a részletek után adom.
                  </p>
                  <p className="qchat__trust">
                    „A vendég most már maga adja le a rendelést — a konyha élőben látja, mi következik.”
                    <span>— K. BÁLINT · KIOSZ PIZZA NAPOLETANA</span>
                  </p>
                  <a className="btn btn--primary qchat__send" href={mailtoHref(m.resultFor ?? "", result)}>
                    Elküldöm emailel
                  </a>
                </div>
              )}
              {m.from === "ai" && m.resultFor && quickIds.length > 0 && (
                <>
                  <div className="qchat__ask">Kell még ez is? Kattints, és frissítem az árat:</div>
                  <div className="qchat__chips">
                    {quickIds.map((id) => {
                      const f = featureById(id);
                      if (!f) return null;
                      const on = extras.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`qchat__chip${on ? " is-on" : ""}`}
                          onClick={() => toggleExtra(id)}
                          aria-pressed={on}
                        >
                          {on ? "✓ " : "+ "}
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="qchat__row qchat__row--ai">
            <div className="qchat__bubble qchat__bubble--ai qchat__typing" aria-label="Az asszisztens gépel">
              <i /><i /><i />
            </div>
          </div>
        )}
      </div>

      <div className="qchat__examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="qchat__example" onClick={() => send(ex)}>
            {ex}
          </button>
        ))}
      </div>

      <div className="qchat__inputrow">
        <input
          className="qchat__input"
          type="text"
          placeholder="Írd le, mit szeretnél…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          aria-label="Projekt leírása"
        />
        <button type="button" className="btn btn--primary qchat__go" onClick={() => send()}>
          Küldés
        </button>
      </div>
    </div>
  );
}
