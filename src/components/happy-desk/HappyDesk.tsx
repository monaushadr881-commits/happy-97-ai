import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { HappyAvatar, type AvatarActivity, type AvatarExpression } from "@/components/digital-human/HappyAvatar";
import { composeCompanion, type CompanionRole } from "@/lib/happy-r80/living-companion";
import { contextFor, summarize } from "@/lib/happy-r80/workspace-intelligence";
import { pickInitiative, type InitiativeSignal } from "@/lib/happy-r80/initiative-ai";
import { cn } from "@/lib/utils";
import {
  HAPPY_DELIVER_EVENT,
  deskCornerFor,
  type DeliveryEvent,
  type DeskCorner,
} from "./delivery-bus";
import { classifyIntent, type VoiceIntent } from "@/lib/happy-r83/voice-intent";
import { createVoiceListener, isVoiceSupported, speak } from "@/lib/happy-r83/voice-listener";
import { describe as describeUi, shouldOfferHelp, type UiRegion } from "@/lib/happy-r83/visual-context";
import { decideRole } from "@/lib/happy-r83/team-role";

/**
 * R81 + R82 — HAPPY Desk.
 *
 * R81 shipped the floating always-visible companion. R82 makes it behave
 * like a real employee: adaptive desk corners per surface, entrance walk
 * on route change, gaze on the current focused element, visible posture,
 * and personal delivery of `happy:deliver` events (walks out, speaks,
 * returns).
 *
 * No fake avatar assets. No camera/mic. No RBAC/RLS/DB changes.
 */

const HIDDEN_PREFIXES = ["/auth", "/login", "/register", "/forgot-password", "/reset-password"];

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

/** Track the currently focused element and describe its UI region. */
function useFocusVisual() {
  const [state, setState] = useState<{ label: string | null; region: UiRegion; guidance: string; changedAt: number }>(
    { label: null, region: "unknown", guidance: "", changedAt: Date.now() },
  );
  useEffect(() => {
    const on = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) {
        setState({ label: null, region: "unknown", guidance: "", changedAt: Date.now() });
        return;
      }
      const closest: string[] = [];
      let cur: HTMLElement | null = el;
      let depth = 0;
      while (cur && depth < 6) {
        closest.push(cur.tagName.toLowerCase() + (cur.id ? `#${cur.id}` : "") + (cur.className && typeof cur.className === "string" ? "." + cur.className.split(/\s+/).slice(0, 2).join(".") : ""));
        cur = cur.parentElement;
        depth++;
      }
      const v = describeUi({
        tag: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        text: (el.textContent || "").trim().slice(0, 60),
        dataset: (el.dataset as unknown) as Record<string, string>,
        closestSelectors: closest,
      });
      setState({ label: v.label, region: v.region, guidance: v.guidance, changedAt: Date.now() });
    };
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", on);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", on);
    };
  }, []);
  return state;
}

function useNowTick(ms: number) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

const CORNER_CLASS: Record<DeskCorner, string> = {
  br: "bottom-4 right-4 items-end",
  bl: "bottom-4 left-4 items-start",
  tr: "top-4 right-4 items-end",
  tl: "top-4 left-4 items-start",
};

const CORNER_ENTRANCE: Record<DeskCorner, string> = {
  br: "translate-x-16 opacity-0",
  bl: "-translate-x-16 opacity-0",
  tr: "translate-x-16 opacity-0",
  tl: "-translate-x-16 opacity-0",
};

export function HappyDesk() {
  const hydrated = useHydrated();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reducedMotion = usePrefersReducedMotion();
  const focusLabel = useFocusLabel();
  const now = useNowTick(15_000);
  const [open, setOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [lastSuggestionAt, setLastSuggestionAt] = useState<number | null>(null);
  const [dismissedKind, setDismissedKind] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryEvent | null>(null);

  // Entrance animation retriggers on route change.
  useEffect(() => {
    setEntered(false);
    const id = window.setTimeout(() => setEntered(true), reducedMotion ? 0 : 60);
    return () => window.clearTimeout(id);
  }, [pathname, reducedMotion]);

  useEffect(() => {
    const bump = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", bump);
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
    };
  }, []);

  // Delivery bus: HAPPY walks out, speaks, walks back.
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<DeliveryEvent>).detail;
      if (!detail) return;
      setDelivery(detail);
    };
    window.addEventListener(HAPPY_DELIVER_EVENT, on);
    return () => window.removeEventListener(HAPPY_DELIVER_EVENT, on);
  }, []);
  useEffect(() => {
    if (!delivery) return;
    const dwell = delivery.tone === "critical" ? 12_000 : 7_000;
    const id = window.setTimeout(() => setDelivery(null), dwell);
    return () => window.clearTimeout(id);
  }, [delivery]);

  if (!hydrated) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const corner = deskCornerFor(pathname);
  const idleMs = now - lastActivity;
  const ctx = contextFor(pathname, { hasError: !!delivery && delivery.tone === "critical" });
  const state = composeCompanion({
    invoked: open || !!delivery,
    conversing: open,
    userIdleMs: idleMs,
    reducedMotion,
    tier: "high",
    role: pathname.startsWith("/_authenticated/founder") ? ("founder" as CompanionRole) : ("guest" as CompanionRole),
    route: pathname,
    hasNotifications: !!delivery,
    hasError: !!delivery && delivery.tone === "critical",
    hourOfDay: new Date().getHours(),
    languageCode: typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en",
  });

  const signals: InitiativeSignal[] = [];
  if (ctx.surface === "builder") signals.push({ kind: "optimization", relevance: 0.7, detectedAt: now });
  if (ctx.surface === "analytics") signals.push({ kind: "workflow-simplification", relevance: 0.6, detectedAt: now });
  const suggestion = pickInitiative({ signals, lastSuggestionAt, nowMs: now, reducedMotion, userBusy: false });
  const visibleSuggestion = suggestion && suggestion.kind !== dismissedKind && !delivery ? suggestion : null;

  const expression: AvatarExpression =
    delivery ? (delivery.tone === "critical" ? "concern" : delivery.tone === "success" ? "celebrate" : "explain") :
    state.concerned ? "concern" :
    state.mode === "engaged" ? "smile" :
    state.mode === "attentive" ? "explain" : "neutral";
  const activity: AvatarActivity = delivery ? "speaking" : open ? "listening" : "idle";

  const posture: string =
    delivery?.tone === "critical" ? "concern" :
    delivery?.tone === "success" ? "celebration" :
    delivery ? "presentation" :
    open ? "listening" :
    idleMs > 30_000 ? "waiting" :
    focusLabel ? "attentive" : "standing";

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && visibleSuggestion) setLastSuggestionAt(now);
      return next;
    });
  };

  const containerAlign = CORNER_CLASS[corner];
  const walkOut = !!delivery && !reducedMotion;

  return (
    <div
      className={cn(
        "fixed z-40 flex flex-col gap-3 pointer-events-none",
        "print:hidden",
        containerAlign,
      )}
      aria-live="polite"
    >
      {open && (
        <HappyDeskPanel
          greeting={state.greeting}
          summary={summarize(ctx)}
          surface={ctx.surface}
          route={pathname}
          posture={posture}
          focusLabel={focusLabel}
          onClose={() => setOpen(false)}
        />
      )}

      {delivery && (
        <div
          role="status"
          className={cn(
            "pointer-events-auto max-w-sm rounded-2xl border px-3 py-2 text-sm shadow-2xl backdrop-blur",
            delivery.tone === "critical" ? "border-red-400/40 bg-red-950/80 text-red-100" :
            delivery.tone === "warn" ? "border-amber-400/40 bg-amber-950/70 text-amber-100" :
            delivery.tone === "success" ? "border-emerald-400/40 bg-emerald-950/70 text-emerald-100" :
            "border-gold/30 bg-obsidian/90 text-paper",
          )}
        >
          <p className="text-[10px] uppercase tracking-widest opacity-70">HAPPY · {delivery.kind}</p>
          <p className="mt-0.5 leading-snug">{delivery.message}</p>
        </div>
      )}

      {!open && !delivery && visibleSuggestion && (
        <div
          role="status"
          className="pointer-events-auto max-w-xs rounded-2xl border border-gold/25 bg-obsidian/85 px-3 py-2 text-xs text-paper shadow-2xl backdrop-blur"
        >
          <p className="leading-snug">{visibleSuggestion.message}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={toggleOpen}
              className="rounded-full bg-gold/90 px-2.5 py-1 text-[11px] font-semibold text-obsidian hover:bg-gold"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setDismissedKind(visibleSuggestion.kind)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-soft-gray hover:text-paper"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative transition-all duration-700 ease-out",
          !entered && !reducedMotion && CORNER_ENTRANCE[corner],
          walkOut && "-translate-y-1 scale-[1.04]",
        )}
      >
        <button
          type="button"
          onClick={toggleOpen}
          aria-label={open ? "Close HAPPY" : "Open HAPPY"}
          aria-expanded={open}
          className={cn(
            "pointer-events-auto group relative rounded-full ring-1 ring-gold/30 bg-obsidian/70 backdrop-blur",
            "shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-gold",
          )}
          style={{ width: 72, height: 72 }}
        >
          <HappyAvatar
            size={72}
            expression={expression}
            activity={activity}
            reducedMotion={reducedMotion}
            trackCursor={!open && !delivery && !reducedMotion}
            className="rounded-full overflow-hidden"
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full",
              delivery?.tone === "critical" ? "bg-red-400" :
              delivery?.tone === "warn" ? "bg-amber-400" :
              delivery?.tone === "success" ? "bg-emerald-400" :
              state.concerned ? "bg-red-400" : "bg-emerald-400",
              !reducedMotion && "animate-pulse",
            )}
          />
        </button>
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap",
            "rounded-full border border-white/10 bg-obsidian/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-soft-gray",
          )}
        >
          {posture}
        </span>
      </div>
    </div>
  );
}

function HappyDeskPanel({
  greeting, summary, surface, route, posture, focusLabel, onClose,
}: {
  greeting: string;
  summary: string;
  surface: string;
  route: string;
  posture: string;
  focusLabel: string | null;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <section
      role="dialog"
      aria-label="HAPPY companion"
      className={cn(
        "pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10",
        "bg-obsidian/95 backdrop-blur-xl shadow-2xl overflow-hidden",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-gold/70">HAPPY · {posture}</p>
          <h2 className="truncate text-sm font-semibold text-paper">{greeting}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-soft-gray hover:bg-white/5 hover:text-paper"
        >
          <span aria-hidden>✕</span>
        </button>
      </header>

      <div className="space-y-3 px-4 py-3">
        <p className="text-sm leading-snug text-paper">{summary}</p>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-wide text-soft-gray">You are on</p>
          <p className="mt-0.5 text-sm text-paper">
            <span className="text-gold capitalize">{surface}</span>{" "}
            <span className="text-soft-gray">· {route}</span>
          </p>
          {focusLabel && (
            <p className="mt-1 text-[11px] text-soft-gray">
              Looking at <span className="text-paper">{focusLabel}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/_authenticated/happy/live" className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold hover:bg-gold/20">
            Open live
          </Link>
          <Link to="/_authenticated/happy/initiative" className="rounded-full border border-white/10 px-3 py-1 text-xs text-paper hover:bg-white/5">
            Initiative
          </Link>
          <Link to="/_authenticated/happy/memory" className="rounded-full border border-white/10 px-3 py-1 text-xs text-paper hover:bg-white/5">
            Memory
          </Link>
          <Link to="/_authenticated/happy/business" className="rounded-full border border-white/10 px-3 py-1 text-xs text-paper hover:bg-white/5">
            Advisor
          </Link>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = inputRef.current?.value.trim();
            if (!v) return;
            setNote(`Noted — I'll surface "${v}" as an initiative signal.`);
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Tell HAPPY what's on your mind…"
            aria-label="Message HAPPY"
            className="flex-1 min-w-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-paper placeholder:text-soft-gray/70 focus:border-gold/40 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-obsidian hover:brightness-110"
          >
            Send
          </button>
        </form>
        {note && <p className="text-[11px] text-soft-gray">{note}</p>}
      </div>
    </section>
  );
}
