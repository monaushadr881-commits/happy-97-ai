/**
 * R83 — HAPPY Visual Understanding (pure logic).
 *
 * Given a DOM-ish element descriptor (tag, role, aria-label, text, dataset
 * hints), classify what UI region the user is on so HAPPY can respond
 * contextually. No DOM access here — callers pass a plain descriptor from
 * `document.activeElement` / pointer target. Keeps the module unit-testable
 * and SSR-safe.
 */

export type UiRegion =
  | "hero"
  | "navigation"
  | "form"
  | "modal"
  | "dialog"
  | "table"
  | "editor"
  | "chart"
  | "pricing"
  | "card"
  | "builder-component"
  | "dashboard-widget"
  | "input"
  | "button"
  | "unknown";

export interface UiElementDescriptor {
  tag?: string;
  role?: string | null;
  ariaLabel?: string | null;
  text?: string | null;
  dataset?: Record<string, string | undefined>;
  closestSelectors?: string[]; // e.g. ["nav", "section#pricing", "form"]
}

export interface VisualContext {
  region: UiRegion;
  label: string;
  guidance: string;
}

function has(list: string[] | undefined, needle: RegExp): boolean {
  if (!list) return false;
  return list.some((s) => needle.test(s));
}

export function classifyElement(d: UiElementDescriptor): UiRegion {
  const tag = (d.tag || "").toLowerCase();
  const role = (d.role || "").toLowerCase();
  const ds = d.dataset || {};
  const sel = d.closestSelectors;

  if (ds.happyRegion) return ds.happyRegion as UiRegion;
  if (role === "dialog" || has(sel, /\[role=["']?dialog/)) return "dialog";
  if (has(sel, /\.modal|\[data-modal\]/)) return "modal";
  if (tag === "nav" || role === "navigation" || has(sel, /^nav\b/)) return "navigation";
  if (has(sel, /section#pricing|\bpricing\b/i)) return "pricing";
  if (has(sel, /section#hero|\bhero\b/i)) return "hero";
  if (tag === "table" || role === "grid" || role === "table") return "table";
  if (has(sel, /\.chart|\[data-chart\]|\bchart\b/i)) return "chart";
  if (has(sel, /\[data-widget\]|\.widget/)) return "dashboard-widget";
  if (has(sel, /\[data-builder\]|\.builder/)) return "builder-component";
  if (tag === "form" || has(sel, /^form\b/)) return "form";
  if (has(sel, /\.card|\[data-card\]/)) return "card";
  if (tag === "textarea" || tag === "input" || tag === "select" || role === "textbox") return "input";
  if (tag === "button" || role === "button") return "button";
  return "unknown";
}

const GUIDANCE: Record<UiRegion, string> = {
  hero: "This is the hero section — headline, sub-copy and primary call to action.",
  navigation: "You're in the navigation. I can jump you to any section.",
  form: "This form collects the details we need. I can walk you through each field.",
  modal: "A modal is open — finish or dismiss it before continuing.",
  dialog: "A dialog is open — I'll wait until you're done here.",
  table: "This table shows tabular data. I can filter, sort or explain a column.",
  editor: "You're in an editor. I can suggest edits or explain a block.",
  chart: "This chart summarises the underlying metric. I can read the trend for you.",
  pricing: "This is the pricing section. I can compare tiers or explain what's included.",
  card: "This card summarises one item. I can open it or explain the numbers.",
  "builder-component": "You've selected a builder component. I can restyle or duplicate it.",
  "dashboard-widget": "This is a dashboard widget. I can drill into it or resize it.",
  input: "This input takes your value. I can suggest what to enter.",
  button: "This button triggers an action. I can explain what happens next.",
  unknown: "I'm here whenever you need context on this area.",
};

export function describe(d: UiElementDescriptor): VisualContext {
  const region = classifyElement(d);
  const label =
    d.ariaLabel?.trim() ||
    (d.text || "").trim().slice(0, 60) ||
    d.dataset?.label ||
    region;
  return { region, label, guidance: GUIDANCE[region] };
}

/** Given hesitation time on a region, decide whether HAPPY should nudge. */
export function shouldOfferHelp(hesitationMs: number, region: UiRegion): boolean {
  if (hesitationMs < 6000) return false;
  if (region === "unknown") return hesitationMs > 20000;
  if (region === "form" || region === "input") return hesitationMs > 6000;
  if (region === "pricing" || region === "modal" || region === "dialog") return hesitationMs > 8000;
  return hesitationMs > 12000;
}
