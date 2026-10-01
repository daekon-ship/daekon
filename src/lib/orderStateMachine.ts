/**
 * Order-state demo — the site's signature interaction.
 *
 * Mirrors the transitions of the real KIOSZ backend order state machine
 * (backend/src/Domain/OrderStatus.php in the KIOSZ project):
 *   NEW -> ACCEPTED -> PREPARING -> READY -> [OUT_FOR_DELIVERY ->] COMPLETED
 * with an independent CANCELLED terminal branch, and fulfillment type
 * (PICKUP/DELIVERY) deciding whether OUT_FOR_DELIVERY exists in the track
 * at all. Pure, framework-free functions so the logic is unit-testable and
 * the React component stays a thin view over it.
 */

export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type Fulfillment = "PICKUP" | "DELIVERY";
export type Tone = "pending" | "ready" | "error";

export const ORDER_ITEM_SETS = [
  "1× Margherita, 1× Diavola",
  "2× Margherita",
  "1× Diavola, 1× Capricciosa",
] as const;

const LABELS: Record<Exclude<OrderStatus, "COMPLETED">, string> & { COMPLETED_PICKUP: string; COMPLETED_DELIVERY: string } = {
  NEW: "Új",
  ACCEPTED: "Elfogadva",
  PREPARING: "Készül",
  READY: "Kész",
  OUT_FOR_DELIVERY: "Kiszállítás alatt",
  COMPLETED_PICKUP: "Átvéve",
  COMPLETED_DELIVERY: "Kiszállítva",
  CANCELLED: "Lemondva",
};

const DESC: Record<string, string> = {
  NEW: "Új rendelés beérkezett — még nincs elfogadva.",
  ACCEPTED: "Elfogadva, hamarosan indul a készítés.",
  PREPARING: "Készül a konyhában.",
  READY_PICKUP: "Kész, átvehető a pultnál.",
  READY_DELIVERY: "Kész, indulhat a kiszállítás.",
  OUT_FOR_DELIVERY: "Úton a vendéghez.",
  COMPLETED_PICKUP: "Átadva — a rendelés lezárva.",
  COMPLETED_DELIVERY: "Kiszállítva — a rendelés lezárva.",
  CANCELLED: "A rendelés lemondva.",
};

/** The ordered track of states a given fulfillment type passes through
 * (CANCELLED is a separate terminal branch, never part of the track). */
export function trackStates(fulfillment: Fulfillment): OrderStatus[] {
  return fulfillment === "DELIVERY"
    ? ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"]
    : ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED"];
}

export function labelFor(status: OrderStatus, fulfillment: Fulfillment): string {
  if (status === "COMPLETED") {
    return fulfillment === "DELIVERY" ? LABELS.COMPLETED_DELIVERY : LABELS.COMPLETED_PICKUP;
  }
  return LABELS[status];
}

export function descFor(status: OrderStatus, fulfillment: Fulfillment): string {
  if (status === "READY") return fulfillment === "DELIVERY" ? DESC.READY_DELIVERY : DESC.READY_PICKUP;
  if (status === "COMPLETED") return fulfillment === "DELIVERY" ? DESC.COMPLETED_DELIVERY : DESC.COMPLETED_PICKUP;
  return DESC[status];
}

export function toneFor(status: OrderStatus): Tone {
  if (status === "CANCELLED") return "error";
  if (status === "READY" || status === "COMPLETED") return "ready";
  return "pending";
}

interface NextStep {
  status: OrderStatus;
  /** Label for the advance button describing the action that leads to this step. */
  actionLabel: string;
}

export function nextStatus(status: OrderStatus, fulfillment: Fulfillment): NextStep | null {
  switch (status) {
    case "NEW":
      return { status: "ACCEPTED", actionLabel: "Elfogadva" };
    case "ACCEPTED":
      return { status: "PREPARING", actionLabel: "Készítés indítása" };
    case "PREPARING":
      return { status: "READY", actionLabel: "Kész" };
    case "READY":
      return fulfillment === "DELIVERY"
        ? { status: "OUT_FOR_DELIVERY", actionLabel: "Kiszállítás indítása" }
        : { status: "COMPLETED", actionLabel: "Átadva" };
    case "OUT_FOR_DELIVERY":
      return { status: "COMPLETED", actionLabel: "Kiszállítva" };
    default:
      return null;
  }
}

/** Label shown on the primary advance button for the *current* status. */
export function advanceButtonLabel(status: OrderStatus, fulfillment: Fulfillment): string {
  if (status === "NEW") return "Rendelés elfogadása";
  const n = nextStatus(status, fulfillment);
  return n ? n.actionLabel : "";
}

export function isTerminal(status: OrderStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

export interface OrderState {
  status: OrderStatus;
  fulfillment: Fulfillment;
  orderId: number;
  items: string;
  elapsed: number;
}

export type OrderAction =
  | { type: "ADVANCE" }
  | { type: "CANCEL" }
  | { type: "SET_FULFILLMENT"; fulfillment: Fulfillment }
  | { type: "TICK" }
  | { type: "NEW_ORDER" };

export function createInitialOrder(orderId = 104): OrderState {
  return {
    status: "NEW",
    fulfillment: "PICKUP",
    orderId,
    items: ORDER_ITEM_SETS[orderId % ORDER_ITEM_SETS.length],
    elapsed: 0,
  };
}

export function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "ADVANCE": {
      const n = nextStatus(state.status, state.fulfillment);
      if (!n) return state;
      return { ...state, status: n.status };
    }
    case "CANCEL":
      return { ...state, status: "CANCELLED" };
    case "SET_FULFILLMENT":
      // Fulfillment can only change while the order hasn't been accepted yet.
      if (state.status !== "NEW") return state;
      return { ...state, fulfillment: action.fulfillment };
    case "TICK":
      return { ...state, elapsed: state.elapsed + 1 };
    case "NEW_ORDER": {
      const nextId = state.orderId + 1;
      return createInitialOrder(nextId);
    }
    default:
      return state;
  }
}
