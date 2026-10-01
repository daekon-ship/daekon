import { useEffect, useReducer, useState } from "react";
import { Panel } from "../Panel/Panel";
import {
  advanceButtonLabel,
  createInitialOrder,
  descFor,
  isTerminal,
  labelFor,
  orderReducer,
  toneFor,
  trackStates,
  type Fulfillment,
} from "../../lib/orderStateMachine";
import "./OrderDemo.css";

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The site's signature interaction: a real, working order-state demo built
 * directly on `orderReducer` (see src/lib/orderStateMachine.ts), mirroring
 * the actual KIOSZ backend order state machine. Persistent "demonstration"
 * chrome and a pulsing idle affordance are both required fixes carried over
 * from the prototype jury (see .claude/daekon/DECISIONS.md) — not optional
 * polish.
 */
export function OrderDemo() {
  const [state, dispatch] = useReducer(orderReducer, undefined, () => createInitialOrder());
  const [hasInteracted, setHasInteracted] = useState(false);
  const terminal = isTerminal(state.status);

  useEffect(() => {
    if (terminal) return;
    const id = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(id);
  }, [terminal]);

  function handleAdvance() {
    setHasInteracted(true);
    dispatch({ type: "ADVANCE" });
  }
  function handleCancel() {
    setHasInteracted(true);
    dispatch({ type: "CANCEL" });
  }
  function handleFulfillment(f: Fulfillment) {
    setHasInteracted(true);
    dispatch({ type: "SET_FULFILLMENT", fulfillment: f });
  }
  function handleRestart() {
    setHasInteracted(true);
    dispatch({ type: "NEW_ORDER" });
  }

  const track = trackStates(state.fulfillment);
  const currentIndex = track.indexOf(state.status);
  const tone = toneFor(state.status);
  const label = labelFor(state.status, state.fulfillment);
  const desc = descFor(state.status, state.fulfillment);
  const btnLabel = advanceButtonLabel(state.status, state.fulfillment);

  return (
    <Panel
      className="orderdemo"
      eyebrow={`RENDELÉS #${state.orderId}`}
      statusLabel={label}
      statusTone={tone}
      timestamp={!terminal ? `${formatElapsed(state.elapsed)} eltelt` : undefined}
      headerExtra={
        <span className="badge orderdemo__demobadge">DEMONSTRÁCIÓ — nem valós rendelés</span>
      }
    >
      <div className="orderdemo__body">
        <p className="orderdemo__items">{state.items}</p>
        <p className="orderdemo__desc">{desc}</p>

        <fieldset className="orderdemo__fulfillment" disabled={state.status !== "NEW"}>
          <legend>Átvétel módja</legend>
          <div className="orderdemo__fulfillment-options">
            <label
              className={`orderdemo__radio${state.fulfillment === "PICKUP" ? " is-checked" : ""}`}
            >
              <input
                type="radio"
                name="fulfillment"
                checked={state.fulfillment === "PICKUP"}
                onChange={() => handleFulfillment("PICKUP")}
              />
              Elvitel
            </label>
            <label
              className={`orderdemo__radio${state.fulfillment === "DELIVERY" ? " is-checked" : ""}`}
            >
              <input
                type="radio"
                name="fulfillment"
                checked={state.fulfillment === "DELIVERY"}
                onChange={() => handleFulfillment("DELIVERY")}
              />
              Kiszállítás
            </label>
          </div>
          {state.status !== "NEW" && (
            <p className="orderdemo__fulfillment-lock">
              Az átvétel módja innentől rögzült — a KIOSZ éles rendszerében ez a szabály.
            </p>
          )}
        </fieldset>

        <ol className="orderdemo__track" aria-label="Rendelés állapotai">
          {track.map((s, i) => {
            const reached = !terminal && i <= currentIndex;
            const isCurrent = !terminal && i === currentIndex;
            return (
              <li
                key={s}
                className={`orderdemo__step${reached ? " is-reached" : ""}${isCurrent ? " is-current" : ""}`}
              >
                <span className="orderdemo__step-index">{i + 1}</span>
                <span className="orderdemo__step-label">{labelFor(s, state.fulfillment)}</span>
              </li>
            );
          })}
        </ol>

        <div className="orderdemo__progress" aria-hidden="true">
          {track.map((s, i) => (
            <span
              key={s}
              className={`orderdemo__dot${!terminal && i <= currentIndex ? " is-reached" : ""}`}
            />
          ))}
        </div>
        <p className="orderdemo__progress-text">
          {terminal ? label : `${label} — ${currentIndex + 1}/${track.length}`}
        </p>

        <div className="orderdemo__actions">
          {!terminal && (
            <>
              <button
                type="button"
                className={`btn btn--primary btn--pulse${hasInteracted ? " is-settled" : ""}`}
                onClick={handleAdvance}
              >
                {btnLabel}
              </button>
              <button type="button" className="btn btn--ghost" onClick={handleCancel}>
                Rendelés lemondása
              </button>
            </>
          )}
          {terminal && (
            <button type="button" className="btn btn--ghost" onClick={handleRestart}>
              Új demó indítása
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
