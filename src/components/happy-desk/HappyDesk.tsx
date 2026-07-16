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
import { type VoiceIntent } from "@/lib/happy-r83/voice-intent";
import { createVoiceListener, isVoiceSupported, speak } from "@/lib/happy-r83/voice-listener";
import { describe as describeUi, shouldOfferHelp, type UiRegion } from "@/lib/happy-r83/visual-context";
import { decideRole } from "@/lib/happy-r83/team-role";
import { HAPPY_TASK_EVENT, type TaskEvent } from "./task-bus";
import { initialSession, reduce as reduceSession, noteAskedTopic, resumeLine, type SessionEvent } from "@/lib/happy-r84/session-memory";
import { decideMode, tutorLevelFor, adaptExplanation } from "@/lib/happy-r84/work-mode";
import { pickSuggestion, type SuggestionKind } from "@/lib/happy-r84/smart-suggestions";


/**
 * R81 + R82 + R83 — HAPPY Desk.
 *
 * R81 mounted the always-visible companion. R82 gave it desk corners,
 * an entrance walk, focus-aware gaze and a personal delivery bus. R83
 * adds human interaction intelligence: continuous voice via the built-in
 * Web Speech API, visual understanding of the focused region, hesitation
 * nudges, language switching, and a team-role hat (designer / consultant
 * / architect / QA / PM / assistant) shown on the posture chip.
 *
 * No external voice providers. No streaming speech engines. No rigged
 * avatar assets. No RBAC/DB/RLS changes.
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
        const cls = typeof cur.className === "string" && cur.className
          ? "." + cur.className.split(/\s+/).slice(0, 2).join(".")
          : "";
        closest.push(cur.tagName.toLowerCase() + (cur.id ? `#${cur.id}` : "") + cls);
        cur = cur.parentElement;
        depth++;
      }
      const v = describeUi({
        tag: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        text: (el.textContent || "").trim().slice(0, 60),
        dataset: el.dataset as unknown as Record<string, string>,
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
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const focus = useFocusVisual();
  const now = useNowTick(5_000);
  const [open, setOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [lastSuggestionAt, setLastSuggestionAt] = useState<number | null>(null);
  const [dismissedKind, setDismissedKind] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryEvent | null>(null);

  // R83 — voice + hesitation + language + recent-actions history.
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [language, setLanguage] = useState<string>(() =>
    typeof navigator !== "undefined" ? (navigator.language || "en-US") : "en-US",
  );
  const [lastIntent, setLastIntent] = useState<VoiceIntent | null>(null);
  const [hesitationOffer, setHesitationOffer] = useState<string | null>(null);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const listenerRef = useRef<ReturnType<typeof createVoiceListener> | null>(null);

  useEffect(() => { setVoiceSupported(isVoiceSupported()); }, []);

  // Entrance animation retriggers on route change.
  useEffect(() => {
    setEntered(false);
    setHesitationOffer(null);
    const id = window.setTimeout(() => setEntered(true), reducedMotion ? 0 : 60);
    return () => window.clearTimeout(id);
  }, [pathname, reducedMotion]);

  useEffect(() => {
    const bump = () => setLastActivity(Date.now());
    const track = (label: string) => setRecentActions((prev) => [label, ...prev].slice(0, 8));
    const onClick = () => track("click");
    const onKey = () => { bump(); track("edit"); };
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  // Delivery bus: HAPPY walks out, speaks, walks back.
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<DeliveryEvent>).detail;
      if (!detail) return;
      setDelivery(detail);
      speak(detail.message, { lang: language });
    };
    window.addEventListener(HAPPY_DELIVER_EVENT, on);
    return () => window.removeEventListener(HAPPY_DELIVER_EVENT, on);
  }, [language]);
  useEffect(() => {
    if (!delivery) return;
    const dwell = delivery.tone === "critical" ? 12_000 : 7_000;
    const id = window.setTimeout(() => setDelivery(null), dwell);
    return () => window.clearTimeout(id);
  }, [delivery]);

  // Hesitation nudge: if the user has been on the same focused region long
  // enough, HAPPY offers a hand.
  useEffect(() => {
    const hesitationMs = now - focus.changedAt;
    if (delivery || open) { setHesitationOffer(null); return; }
    if (focus.region === "unknown" && !focus.label) { setHesitationOffer(null); return; }
    if (shouldOfferHelp(hesitationMs, focus.region)) {
      setHesitationOffer(
        focus.region === "form" || focus.region === "input"
          ? "I think I can help. Want me to explain this field?"
          : `If you'd like, I can explain this ${focus.region.replace("-", " ")}.`,
      );
    } else {
      setHesitationOffer(null);
    }
  }, [now, focus, delivery, open]);

  function handleIntent(intent: VoiceIntent) {
    setLastIntent(intent);
    if (intent.kind === "cancel") {
      setOpen(false);
      setDelivery(null);
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      return;
    }
    if (intent.kind === "language-switch" && intent.languageCode) {
      setLanguage(intent.languageCode);
      listenerRef.current?.setLanguage(intent.languageCode);
      speak("Switched language.", { lang: intent.languageCode });
      return;
    }
    if (intent.kind === "greeting" || intent.wake) {
      setOpen(true);
      speak("I'm here.", { lang: language });
    }
    if (intent.kind === "help" || intent.kind === "explain") {
      setOpen(true);
      const line = focus.guidance || "Tell me what section you'd like me to explain.";
      speak(line, { lang: language });
    }
    if (intent.kind === "navigate" && intent.target) {
      const t = "/" + intent.target.replace(/^\/+/, "").replace(/\s+/g, "-");
      try { router.navigate({ to: t }); } catch { /* unknown target — surface silently */ }
    }
    if (intent.kind === "resume") {
      setOpen(true);
      speak("Picking up where we left off.", { lang: language });
    }
  }

  function startListening() {
    if (listening) return;
    setVoiceError(null);
    const listener = createVoiceListener({
      onTranscript: (t) => setTranscript(t),
      onIntent: (i) => handleIntent(i),
      onError: (msg) => setVoiceError(msg),
      onEnd: () => setListening(false),
    });
    listener.setLanguage(language);
    const ok = listener.start();
    if (ok) {
      listenerRef.current = listener;
      setListening(true);
    } else {
      setVoiceError("Voice not available in this browser.");
    }
  }
  function stopListening() {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
  }
  useEffect(() => () => { listenerRef.current?.stop(); }, []);

  const teamRole = useMemo(
    () => decideRole({ route: pathname, focusRegion: focus.region, recentActions }),
    [pathname, focus.region, recentActions],
  );

  if (!hydrated) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const corner = deskCornerFor(pathname);
  const idleMs = now - lastActivity;
  const ctx = contextFor(pathname, { hasError: !!delivery && delivery.tone === "critical" });
  const state = composeCompanion({
    invoked: open || !!delivery || listening,
    conversing: open || listening,
    userIdleMs: idleMs,
    reducedMotion,
    tier: "high",
    role: pathname.startsWith("/_authenticated/founder") ? ("founder" as CompanionRole) : ("guest" as CompanionRole),
    route: pathname,
    hasNotifications: !!delivery,
    hasError: !!delivery && delivery.tone === "critical",
    hourOfDay: new Date().getHours(),
    languageCode: language.slice(0, 2),
  });

  const signals: InitiativeSignal[] = [];
  if (ctx.surface === "builder") signals.push({ kind: "optimization", relevance: 0.7, detectedAt: now });
  if (ctx.surface === "analytics") signals.push({ kind: "workflow-simplification", relevance: 0.6, detectedAt: now });
  const suggestion = pickInitiative({ signals, lastSuggestionAt, nowMs: now, reducedMotion, userBusy: listening });
  const visibleSuggestion = suggestion && suggestion.kind !== dismissedKind && !delivery && !hesitationOffer ? suggestion : null;

  const expression: AvatarExpression =
    delivery ? (delivery.tone === "critical" ? "concern" : delivery.tone === "success" ? "celebrate" : "explain") :
    state.concerned ? "concern" :
    listening ? "explain" :
    state.mode === "engaged" ? "smile" :
    state.mode === "attentive" ? "explain" : "neutral";
  const activity: AvatarActivity = delivery ? "speaking" : (open || listening) ? "listening" : "idle";

  const posture: string =
    delivery?.tone === "critical" ? "concern" :
    delivery?.tone === "success" ? "celebration" :
    delivery ? "presentation" :
    listening ? "listening" :
    open ? "listening" :
    idleMs > 30_000 ? "waiting" :
    focus.label ? "attentive" : "standing";

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
          focusLabel={focus.label}
          focusGuidance={focus.guidance}
          teamRoleGreeting={teamRole.greeting}
          teamRoleHint={teamRole.hint}
          teamRoleName={teamRole.role}
          listening={listening}
          voiceSupported={voiceSupported}
          transcript={transcript}
          voiceError={voiceError}
          language={language}
          lastIntent={lastIntent}
          onToggleVoice={() => (listening ? stopListening() : startListening())}
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

      {!open && !delivery && hesitationOffer && (
        <div
          role="status"
          className="pointer-events-auto max-w-xs rounded-2xl border border-gold/30 bg-obsidian/90 px-3 py-2 text-xs text-paper shadow-2xl backdrop-blur"
        >
          <p className="leading-snug">{hesitationOffer}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={toggleOpen}
              className="rounded-full bg-gold/90 px-2.5 py-1 text-[11px] font-semibold text-obsidian hover:bg-gold"
            >
              Yes please
            </button>
            <button
              type="button"
              onClick={() => setHesitationOffer(null)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-soft-gray hover:text-paper"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {!open && !delivery && !hesitationOffer && visibleSuggestion && (
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

      {!open && listening && (
        <div className="pointer-events-auto max-w-xs rounded-2xl border border-emerald-400/40 bg-emerald-950/70 px-3 py-2 text-xs text-emerald-100 shadow-2xl backdrop-blur">
          <p className="text-[10px] uppercase tracking-widest opacity-70">Listening · say "Hi HAPPY"</p>
          {transcript && <p className="mt-0.5 leading-snug italic">{transcript}</p>}
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
              listening ? "bg-emerald-300" :
              delivery?.tone === "critical" ? "bg-red-400" :
              delivery?.tone === "warn" ? "bg-amber-400" :
              delivery?.tone === "success" ? "bg-emerald-400" :
              state.concerned ? "bg-red-400" : "bg-emerald-400",
              !reducedMotion && "animate-pulse",
            )}
          />
        </button>
        {voiceSupported && (
          <button
            type="button"
            onClick={() => (listening ? stopListening() : startListening())}
            aria-label={listening ? "Stop listening" : "Start voice"}
            aria-pressed={listening}
            className={cn(
              "pointer-events-auto absolute -top-1 -left-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
              listening
                ? "border-emerald-300/60 bg-emerald-500/20 text-emerald-100"
                : "border-white/15 bg-obsidian/80 text-soft-gray hover:text-paper",
            )}
          >
            {listening ? "● mic" : "◌ mic"}
          </button>
        )}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap",
            "rounded-full border border-white/10 bg-obsidian/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-soft-gray",
          )}
        >
          {posture} · {teamRole.role.replace("-", " ")}
        </span>
        {voiceError && (
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-950/80 px-2 py-0.5 text-[10px] text-red-200">
            {voiceError}
          </span>
        )}
      </div>
    </div>
  );
}

function HappyDeskPanel({
  greeting, summary, surface, route, posture, focusLabel, focusGuidance,
  teamRoleGreeting, teamRoleHint, teamRoleName,
  listening, voiceSupported, transcript, voiceError, language, lastIntent,
  onToggleVoice, onClose,
}: {
  greeting: string;
  summary: string;
  surface: string;
  route: string;
  posture: string;
  focusLabel: string | null;
  focusGuidance: string;
  teamRoleGreeting: string;
  teamRoleHint: string;
  teamRoleName: string;
  listening: boolean;
  voiceSupported: boolean;
  transcript: string;
  voiceError: string | null;
  language: string;
  lastIntent: VoiceIntent | null;
  onToggleVoice: () => void;
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
          <p className="text-[10px] uppercase tracking-widest text-gold/70">
            HAPPY · {posture} · {teamRoleName.replace("-", " ")}
          </p>
          <h2 className="truncate text-sm font-semibold text-paper">{greeting}</h2>
          <p className="mt-0.5 truncate text-[11px] text-soft-gray">{teamRoleGreeting}</p>
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
          {focusGuidance && (
            <p className="mt-1 text-[11px] leading-snug text-paper/80">{focusGuidance}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-wide text-soft-gray">Voice</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleVoice}
              disabled={!voiceSupported}
              aria-pressed={listening}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                listening
                  ? "border-emerald-300/60 bg-emerald-500/20 text-emerald-100"
                  : voiceSupported
                    ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
                    : "border-white/10 text-soft-gray/60",
              )}
            >
              {listening ? "● Stop listening" : voiceSupported ? "◌ Start voice" : "Voice unavailable"}
            </button>
            <span className="text-[10px] uppercase tracking-widest text-soft-gray">{language}</span>
          </div>
          <p className="mt-2 text-[11px] text-soft-gray">
            Say <span className="text-paper">"Hi HAPPY"</span> then ask for help, an explanation, or to open a section.
          </p>
          {transcript && (
            <p className="mt-1 text-[11px] italic text-paper/80">"{transcript}"</p>
          )}
          {lastIntent && lastIntent.kind !== "unknown" && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-emerald-300/80">
              intent: {lastIntent.kind}{lastIntent.target ? ` → ${lastIntent.target}` : ""}
            </p>
          )}
          {voiceError && <p className="mt-1 text-[11px] text-red-300">{voiceError}</p>}
        </div>

        <p className="text-[11px] text-soft-gray">{teamRoleHint}</p>

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
