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
import { loadPreferences, savePreferences, mergePreferences, suggestionCooldownMs, type HappyPreferences } from "@/lib/happy-r85/preferences";
import { readObstacleRects, pickSafeCorner } from "@/lib/happy-r85/collision";
import { pickIndicator, indicatorLabel } from "@/lib/happy-r85/indicators";
import { composeGreeting, composeFarewell, shouldGreetOnce, trackAndDeriveRelationship } from "@/lib/happy-r86/greeting";
import { nextPostureMs, antiRepeat } from "@/lib/happy-r86/ambient";
import { decideDelivery, initialGateState, type Notification as HappyNotif, type GateState, type NotificationKind, type NotificationTone } from "@/lib/happy-r86/notifications";
import { saveSession, loadSession } from "@/lib/happy-r86/session-restore";


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

  // R84 — session memory, work-mode signals, task strip, smart-suggestion dedupe.
  const [session, setSession] = useState(() => initialSession());
  const [activeTask, setActiveTask] = useState<TaskEvent | null>(null);
  const [taskLog, setTaskLog] = useState<TaskEvent[]>([]);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [keystrokes, setKeystrokes] = useState<number[]>([]); // timestamps in last minute
  const [mouseMoves, setMouseMoves] = useState<number[]>([]);
  const [builderTouches, setBuilderTouches] = useState(0);
  const [suggestionsShown, setSuggestionsShown] = useState<Set<SuggestionKind>>(() => new Set());
  const [lastInterruptionAt, setLastInterruptionAt] = useState<number | null>(null);

  // R85 — personalization + adaptive corner + last-keystroke timestamp for indicator.
  const [prefs, setPrefs] = useState<HappyPreferences>(() => loadPreferences());
  const [obstacleCorner, setObstacleCorner] = useState<ReturnType<typeof deskCornerFor> | null>(null);
  const [lastKeyAt, setLastKeyAt] = useState<number>(0);
  const updatePrefs = (patch: Partial<HappyPreferences>) => {
    setPrefs((p) => {
      const next = mergePreferences(p, patch);
      savePreferences(next);
      return next;
    });
  };

  // R86 — greeting/farewell bubbles, ambient posture scheduler, notification gate, session restore.
  const [greetingBubble, setGreetingBubble] = useState<string | null>(null);
  const [farewellBubble, setFarewellBubble] = useState<string | null>(null);
  const [ambientPosture, setAmbientPosture] = useState<"still" | "breathing" | "looking" | "shifting">("still");
  const gateRef = useRef<GateState>(initialGateState());

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
    const onClick = () => {
      track("click");
      setMouseMoves((prev) => [...prev.filter((t) => Date.now() - t < 60_000), Date.now()]);
    };
    const onMove = () => {
      bump();
      setMouseMoves((prev) => (prev.length && Date.now() - prev[prev.length - 1] < 200
        ? prev
        : [...prev.filter((t) => Date.now() - t < 60_000), Date.now()]));
    };
    const onKey = () => {
      bump();
      track("edit");
      setLastKeyAt(Date.now());
      setKeystrokes((prev) => [...prev.filter((t) => Date.now() - t < 60_000), Date.now()]);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  // R84 — record route visits in session memory + count builder touches.
  useEffect(() => {
    setSession((s) => reduceSession(s, { kind: "opened", label: pathname, at: Date.now() }));
    if (pathname.toLowerCase().includes("/builder")) {
      setBuilderTouches((n) => n + 1);
    }
  }, [pathname]);

  // R84 — task companion bus. Announce, follow progress, celebrate/explain.
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<TaskEvent>).detail;
      if (!t) return;
      setTaskLog((prev) => [t, ...prev].slice(0, 12));
      setSession((s) => reduceSession(s, { kind: "task", label: t.label, at: t.at ?? Date.now(), meta: { status: t.status } }));
      if (t.status === "started" || t.status === "progress") {
        setActiveTask(t);
      } else if (t.status === "completed" || t.status === "milestone") {
        setActiveTask(null);
        setCelebration(t.milestone ? `🎉 ${t.milestone}` : `Nice — ${t.label} done.`);
        setLastInterruptionAt(Date.now());
      } else if (t.status === "failed") {
        setActiveTask(null);
        setCelebration(`${t.label} failed${t.detail ? ` — ${t.detail}` : ""}. I can help debug.`);
        setLastInterruptionAt(Date.now());
      }
    };
    window.addEventListener(HAPPY_TASK_EVENT, on);
    return () => window.removeEventListener(HAPPY_TASK_EVENT, on);
  }, []);
  useEffect(() => {
    if (!celebration) return;
    const id = window.setTimeout(() => setCelebration(null), 6000);
    return () => window.clearTimeout(id);
  }, [celebration]);

  // R85 — adaptive positioning: re-check obstacles every 600ms and on resize.
  useEffect(() => {
    if (prefs.workspace !== "adaptive") { setObstacleCorner(null); return; }
    const check = () => {
      const vp = { w: window.innerWidth, h: window.innerHeight };
      const obstacles = readObstacleRects(document);
      const preferred = deskCornerFor(pathname);
      const safe = pickSafeCorner(preferred, vp, obstacles);
      setObstacleCorner(safe === preferred ? null : safe);
    };
    check();
    const id = window.setInterval(check, 600);
    window.addEventListener("resize", check, { passive: true });
    return () => { window.clearInterval(id); window.removeEventListener("resize", check); };
  }, [pathname, prefs.workspace, open, delivery]);


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
      const topic = focus.region || "general";
      setSession((s) => noteAskedTopic(s, topic));
      const askCount = (session.askedTopics[topic] ?? 0) + 1;
      const line = adaptExplanation(focus.guidance || "Tell me what section you'd like me to explain.", tutorLevelFor(askCount));
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

  const preferredCorner = deskCornerFor(pathname);
  const corner = prefs.workspace === "adaptive" ? (obstacleCorner ?? preferredCorner) : preferredCorner;
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

  // R84 — work mode gates suggestions and posture.
  const askedSameTopicCount = Math.max(
    0,
    ...Object.values(session.askedTopics),
    ...(lastIntent?.kind === "explain" || lastIntent?.kind === "help" ? [session.askedTopics[focus.region] ?? 0] : [0]),
  );
  const workMode = decideMode({
    route: pathname,
    keystrokesLastMinute: keystrokes.length,
    mouseMovesLastMinute: mouseMoves.length,
    hasOpenPanel: open,
    askedSameTopicCount,
    now,
    lastInterruptionAt,
  });
  const tutorLevel = tutorLevelFor(askedSameTopicCount);

  const signals: InitiativeSignal[] = [];
  if (ctx.surface === "builder") signals.push({ kind: "optimization", relevance: 0.7, detectedAt: now });
  if (ctx.surface === "analytics") signals.push({ kind: "workflow-simplification", relevance: 0.6, detectedAt: now });
  const cooldownMs = suggestionCooldownMs(prefs.frequency);
  const initiative = pickInitiative({
    signals, lastSuggestionAt, nowMs: now, reducedMotion,
    userBusy: listening || workMode.mode === "focus",
    cooldownMs,
    dismissedKinds: prefs.dismissedSuggestions,
  });
  const smart = workMode.allowSuggestions
    ? pickSuggestion(
        {
          surface: ctx.surface,
          region: focus.region,
          route: pathname,
          idleMs,
          errorsSeenInSession: taskLog.filter((t) => t.status === "failed").length,
          builderTouches,
        },
        suggestionsShown,
      )
    : null;
  const smartVisible = smart && !delivery && !hesitationOffer && !activeTask && !celebration ? smart : null;
  const visibleSuggestion = !smartVisible && workMode.allowSuggestions && initiative && initiative.kind !== dismissedKind && !prefs.dismissedSuggestions.includes(initiative.kind) && !delivery && !hesitationOffer && !activeTask && !celebration ? initiative : null;

  // R85 — single, calm indicator (listening / thinking / typing / speaking / idle).
  const indicator = pickIndicator({
    listening,
    delivering: !!delivery,
    activeTask: !!activeTask,
    panelOpen: open,
    userTypingWithinMs: now - lastKeyAt,
  });

  const expression: AvatarExpression =
    celebration ? "celebrate" :
    delivery ? (delivery.tone === "critical" ? "concern" : delivery.tone === "success" ? "celebrate" : "explain") :
    state.concerned ? "concern" :
    listening ? "explain" :
    activeTask ? "explain" :
    workMode.mode === "meeting" ? "explain" :
    state.mode === "engaged" ? "smile" :
    state.mode === "attentive" ? "explain" : "neutral";
  const activity: AvatarActivity = delivery || celebration ? "speaking" : (open || listening) ? "listening" : "idle";

  const posture: string =
    celebration ? "celebration" :
    delivery?.tone === "critical" ? "concern" :
    delivery?.tone === "success" ? "celebration" :
    delivery ? "presentation" :
    workMode.mode === "meeting" ? "presentation" :
    workMode.mode === "focus" ? "focused" :
    workMode.mode === "learning" ? "coaching" :
    listening ? "listening" :
    open ? "listening" :
    activeTask ? "attentive" :
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
          workMode={workMode.mode}
          workModeReason={workMode.reason}
          tutorLevel={tutorLevel}
          taskLog={taskLog}
          activeTask={activeTask}
          resume={resumeLine(session)}
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

      {activeTask && !delivery && (
        <div className="pointer-events-auto max-w-xs rounded-2xl border border-white/10 bg-obsidian/85 px-3 py-2 text-xs text-paper shadow-2xl backdrop-blur">
          <p className="text-[10px] uppercase tracking-widest opacity-70">Task · {activeTask.status}</p>
          <p className="mt-0.5 leading-snug">{activeTask.label}</p>
          {typeof activeTask.progress === "number" && (
            <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gold transition-all"
                style={{ width: `${Math.round(Math.max(0, Math.min(1, activeTask.progress)) * 100)}%` }}
              />
            </div>
          )}
          {activeTask.detail && <p className="mt-1 text-[11px] text-soft-gray">{activeTask.detail}</p>}
        </div>
      )}

      {celebration && !delivery && (
        <div
          role="status"
          className="pointer-events-auto max-w-xs rounded-2xl border border-emerald-400/40 bg-emerald-950/80 px-3 py-2 text-sm text-emerald-50 shadow-2xl backdrop-blur"
        >
          {celebration}
        </div>
      )}

      {!open && !delivery && !hesitationOffer && !activeTask && !celebration && smartVisible && (
        <div
          role="status"
          className="pointer-events-auto max-w-xs rounded-2xl border border-gold/25 bg-obsidian/85 px-3 py-2 text-xs text-paper shadow-2xl backdrop-blur"
        >
          <p className="text-[10px] uppercase tracking-widest opacity-70">HAPPY noticed</p>
          <p className="mt-0.5 leading-snug">{smartVisible.message}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSuggestionsShown((prev) => new Set(prev).add(smartVisible.kind));
                setLastInterruptionAt(Date.now());
                toggleOpen();
              }}
              className="rounded-full bg-gold/90 px-2.5 py-1 text-[11px] font-semibold text-obsidian hover:bg-gold"
            >
              Tell me more
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestionsShown((prev) => new Set(prev).add(smartVisible.kind));
                setLastInterruptionAt(Date.now());
              }}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-soft-gray hover:text-paper"
            >
              Not now
            </button>
          </div>
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
              onClick={() => {
                setDismissedKind(visibleSuggestion.kind);
                updatePrefs({ dismissedSuggestions: Array.from(new Set([...prefs.dismissedSuggestions, visibleSuggestion.kind])) });
                setLastInterruptionAt(Date.now());
              }}
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
          "relative transition-all duration-500 will-change-transform",
          "[transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)]",
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
        {indicator !== "idle" && (
          <span
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap",
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
              indicator === "speaking" ? "border-gold/40 bg-gold/10 text-gold" :
              indicator === "listening" ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100" :
              indicator === "thinking" ? "border-sky-300/40 bg-sky-500/10 text-sky-100" :
              "border-white/15 bg-obsidian/80 text-soft-gray",
              !reducedMotion && (indicator === "thinking" || indicator === "listening") && "animate-pulse",
            )}
          >
            {indicatorLabel(indicator)}
            {!reducedMotion && (indicator === "thinking" || indicator === "typing") && "…"}
          </span>
        )}
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
  workMode, workModeReason, tutorLevel, taskLog, activeTask, resume,
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
  workMode: "focus" | "meeting" | "learning" | "normal";
  workModeReason: string;
  tutorLevel: "beginner" | "intermediate" | "advanced";
  taskLog: TaskEvent[];
  activeTask: TaskEvent | null;
  resume: string | null;
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

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
              workMode === "focus" ? "border-sky-400/40 bg-sky-500/10 text-sky-200" :
              workMode === "meeting" ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200" :
              workMode === "learning" ? "border-amber-400/40 bg-amber-500/10 text-amber-200" :
              "border-white/10 bg-white/[0.03] text-soft-gray",
            )}
            title={workModeReason}
          >
            {workMode}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-widest text-soft-gray">
            tutor · {tutorLevel}
          </span>
          {activeTask && (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
              on: {activeTask.label}
            </span>
          )}
        </div>

        {resume && (
          <p className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[12px] leading-snug text-paper/80">
            {resume}
          </p>
        )}

        {taskLog.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[11px] uppercase tracking-wide text-soft-gray">Recent tasks</p>
            <ul className="mt-1 space-y-0.5 text-[11px]">
              {taskLog.slice(0, 4).map((t, i) => (
                <li key={`${t.id}-${i}`} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      t.status === "completed" || t.status === "milestone" ? "bg-emerald-400" :
                      t.status === "failed" ? "bg-red-400" :
                      t.status === "progress" ? "bg-gold" : "bg-white/40",
                    )}
                  />
                  <span className="truncate text-paper/90">{t.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-soft-gray">{t.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}


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
