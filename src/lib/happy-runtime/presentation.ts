/**
 * R39–R50 HAPPY Runtime — Presentation & Whiteboard controllers.
 *
 * Pure state machines. Real transport (WebSocket / realtime channel) plugs in
 * at the app layer; these primitives own only state validation.
 *
 * No fake rendering. No fake slide generation.
 */

export type SlideDeck = {
  id: string;
  title: string;
  slides: { id: string; title?: string; body?: string; media_url?: string }[];
};

export type PresentationState = {
  deck_id: string;
  current_index: number;
  status: "idle" | "presenting" | "paused" | "ended";
};

export function newPresentation(deck: SlideDeck): PresentationState {
  if (deck.slides.length === 0) throw new Error("empty_deck");
  return { deck_id: deck.id, current_index: 0, status: "idle" };
}

export type PresentationAction =
  | { type: "start" }
  | { type: "next"; total: number }
  | { type: "prev" }
  | { type: "goto"; index: number; total: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "end" };

export function reducePresentation(
  state: PresentationState,
  action: PresentationAction,
): PresentationState {
  switch (action.type) {
    case "start":
      return { ...state, status: "presenting", current_index: 0 };
    case "next":
      if (state.status !== "presenting") throw new Error("not_presenting");
      return { ...state, current_index: Math.min(state.current_index + 1, action.total - 1) };
    case "prev":
      if (state.status !== "presenting") throw new Error("not_presenting");
      return { ...state, current_index: Math.max(state.current_index - 1, 0) };
    case "goto":
      if (state.status !== "presenting") throw new Error("not_presenting");
      if (action.index < 0 || action.index >= action.total) throw new Error("out_of_bounds");
      return { ...state, current_index: action.index };
    case "pause":
      if (state.status !== "presenting") throw new Error("not_presenting");
      return { ...state, status: "paused" };
    case "resume":
      if (state.status !== "paused") throw new Error("not_paused");
      return { ...state, status: "presenting" };
    case "end":
      return { ...state, status: "ended" };
    default:
      return state;
  }
}

export type WhiteboardOp =
  | { type: "stroke"; id: string; points: [number, number][]; color: string; width: number }
  | { type: "text"; id: string; x: number; y: number; text: string; color: string }
  | { type: "erase"; id: string }
  | { type: "clear" };

export type WhiteboardState = {
  ops: WhiteboardOp[];
  updated_at: number;
};

export function applyWhiteboardOp(state: WhiteboardState, op: WhiteboardOp): WhiteboardState {
  if (op.type === "clear") return { ops: [], updated_at: Date.now() };
  if (op.type === "erase") {
    return { ops: state.ops.filter((o) => (o as { id?: string }).id !== op.id), updated_at: Date.now() };
  }
  return { ops: [...state.ops, op], updated_at: Date.now() };
}
