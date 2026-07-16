/**
 * R81 — HAPPY Desk (global floating living companion).
 *
 * Mounted once in the root shell. Uses the existing HappyAvatar and the
 * R80 living-companion / workspace-intelligence / initiative-ai services
 * so the previously invisible logic is now visible everywhere.
 *
 * No fake avatar assets. No camera/mic. No RBAC/RLS changes. Hidden on
 * public marketing routes and while `prefers-reduced-motion` unless the
 * user explicitly opens the panel.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { HappyAvatar, type AvatarActivity, type AvatarExpression } from "@/components/digital-human/HappyAvatar";
import { composeCompanion, type CompanionRole } from "@/lib/happy-r80/living-companion";
import { contextFor, summarize } from "@/lib/happy-r80/workspace-intelligence";
import { pickInitiative, type InitiativeSignal } from "@/lib/happy-r80/initiative-ai";
import { cn } from "@/lib/utils";

/** Routes where the desk companion should stay out of the way. */
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

function useMousePos() {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const on = (e: MouseEvent) => { ref.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", on, { passive: true });
    return () => window.removeEventListener("mousemove", on);
  }, []);
  return ref;
}

function useNowTick(ms: number) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

export function HappyDesk() {
  const hydrated = useHydrated();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reducedMotion = usePrefersReducedMotion();
  const mouseRef = useMousePos();
  const now = useNowTick(15_000);
  const [open, setOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [lastSuggestionAt, setLastSuggestionAt] = useState<number | null>(null);
  const [dismissedKind, setDismissedKind] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", bump);
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
    };
  }, []);

  if (!hydrated) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const idleMs = now - lastActivity;
  const ctx = contextFor(pathname, { hasError: false });
  const state = composeCompanion({
    invoked: open,
    conversing: open,
    userIdleMs: idleMs,
    reducedMotion,
    tier: "high",
    role: pathname.startsWith("/_authenticated/founder") ? "founder" : "guest" as CompanionRole,
    route: pathname,
    hasNotifications: false,
    hasError: false,
    hourOfDay: new Date().getHours(),
    languageCode: (typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "en"),
  });

  const signals: InitiativeSignal[] = [];
  if (ctx.surface === "builder") signals.push({ kind: "optimization", relevance: 0.7, detectedAt: now });
  if (ctx.surface === "analytics") signals.push({ kind: "workflow-simplification", relevance: 0.6, detectedAt: now });
  const suggestion = pickInitiative({ signals, lastSuggestionAt, nowMs: now, reducedMotion, userBusy: false });
  const visibleSuggestion = suggestion && suggestion.kind !== dismissedKind ? suggestion : null;

  const expression: AvatarExpression =
    state.concerned ? "concern" :
    state.mode === "engaged" ? "smile" :
    state.mode === "attentive" ? "explain" : "neutral";
  const activity: AvatarActivity = open ? "listening" : "idle";

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && visibleSuggestion) setLastSuggestionAt(now);
      return next;
    });
  };

  return (
    <div
      className={cn(
        "fixed z-40 bottom-4 right-4 flex flex-col items-end gap-3 pointer-events-none",
        "print:hidden",
      )}
      aria-live="polite"
    >
      {open && (
        <HappyDeskPanel
          greeting={state.greeting}
          summary={summarize(ctx)}
          surface={ctx.surface}
          route={pathname}
          onClose={() => setOpen(false)}
        />
      )}

      {!open && visibleSuggestion && (
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
          trackCursor={!open && !reducedMotion}
          className="rounded-full overflow-hidden"
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full",
            state.concerned ? "bg-red-400" : "bg-emerald-400",
            !reducedMotion && "animate-pulse",
          )}
        />
      </button>
    </div>
  );
}

function HappyDeskPanel({
  greeting, summary, surface, route, onClose,
}: {
  greeting: string;
  summary: string;
  surface: string;
  route: string;
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
          <p className="text-[10px] uppercase tracking-widest text-gold/70">HAPPY</p>
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
