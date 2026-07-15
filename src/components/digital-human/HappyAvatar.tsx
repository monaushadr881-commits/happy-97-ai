/**
 * HAPPY Avatar — The official HAPPY Digital Human.
 *
 * The uploaded executive portrait is the permanent identity. There is only
 * one HAPPY across the platform. This component keeps the portrait alive
 * with GPU-only micro-motion (breathing, sway, blink veil, thinking halo,
 * listening pulse, speaking rings). All motion collapses to a static image
 * under `reducedMotion`. No camera/mic access.
 *
 * Public API is unchanged so every callsite keeps working.
 */
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Full-body executive portrait — served from /public so no upload roundtrip.
const happyPortraitUrl = "/happy-portrait-v2.png";

export type AvatarExpression =
  | "neutral" | "smile" | "thinking" | "explain" | "concern" | "celebrate" | "listen";
export type AvatarActivity = "idle" | "listening" | "speaking";
export type AvatarPosture = "normal" | "presentation";

type Props = {
  expression?: AvatarExpression;
  activity?: AvatarActivity;
  reducedMotion?: boolean;
  size?: number;
  className?: string;
  /** Render as a full portrait card (rounded rectangle) instead of a circular bust. */
  variant?: "bust" | "portrait";
  /** Gently orient gaze/head toward the cursor when it's near the avatar. */
  trackCursor?: boolean;
  /** Executive posture: straighter, slower drift, longer eye-contact holds. */
  posture?: AvatarPosture;
  /** Pixel offset from avatar center to look toward. Overrides cursor when set. */
  gazeTarget?: { x: number; y: number } | null;
  /** Live speech amplitude in 0..1 — drives the mouth region overlay. */
  amplitude?: number;
};


/**
 * Organic blink loop — never repeats.
 * Uses variable inter-blink gaps (1.8–7.2s), variable close duration
 * (95–170ms), and occasional double-blinks (~12% chance). Feels human.
 */
function useBlink(reduced: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let t: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const doBlink = (after: () => void) => {
      const closeMs = 95 + Math.random() * 75;
      setClosed(true);
      setTimeout(() => {
        if (cancelled) return;
        setClosed(false);
        after();
      }, closeMs);
    };
    const loop = () => {
      const gap = 1800 + Math.random() * 5400;
      t = setTimeout(() => {
        if (cancelled) return;
        doBlink(() => {
          // ~12% chance of a natural double-blink
          if (Math.random() < 0.12) {
            setTimeout(() => !cancelled && doBlink(loop), 140 + Math.random() * 80);
          } else {
            loop();
          }
        });
      }, gap);
    };
    loop();
    return () => { cancelled = true; clearTimeout(t); };
  }, [reduced]);
  return closed;
}

/**
 * Micro head drift + gaze + micro weight-shift (scale) + posture bias.
 * Adapts to activity/expression so listening feels attentive (small nod +
 * centered gaze) and thinking feels reflective (brief upward glance + tilt).
 */
function useMicroMotion(reduced: boolean, activity: AvatarActivity, expression: AvatarExpression, posture: AvatarPosture) {
  const [offset, setOffset] = useState({ x: 0, y: 0, r: 0, s: 1 });
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = 0;
    let target = { x: 0, y: 0, r: 0, s: 1 };
    let current = { x: 0, y: 0, r: 0, s: 1 };
    let nextRetarget = 0;
    const presentation = posture === "presentation";
    // Presentation posture: straighter, calmer, holds longer. Drift ranges shrink.
    const driftScale = presentation ? 0.55 : 1;
    const tick = (t: number) => {
      if (!last) last = t;
      const dt = Math.min(50, t - last);
      last = t;
      if (t > nextRetarget) {
        const base = {
          x: (Math.random() - 0.5) * 3.4 * driftScale,
          y: (Math.random() - 0.5) * 2.0 * driftScale,
          r: (Math.random() - 0.5) * 0.6 * driftScale,
          s: 1 + (Math.random() - 0.5) * 0.006,
        };
        if (activity === "listening") {
          base.y = (0.6 + Math.random() * 1.1) * (presentation ? 0.6 : 1);
          base.x *= 0.4;
          base.r *= 0.3;
        }
        if (expression === "thinking") {
          base.y = -1.2 + (Math.random() - 0.5) * 0.6;
          base.r = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
        }
        if (presentation) {
          // Confident chin-lift + longer holds; centered stance.
          base.y -= 0.4;
          base.x *= 0.6;
          base.r *= 0.4;
        }
        target = base;
        const gap = presentation
          ? 1800 + Math.random() * 2600
          : activity === "listening" ? 700 + Math.random() * 1400
          : expression === "thinking" ? 500 + Math.random() * 900
          : 900 + Math.random() * 2600;
        nextRetarget = t + gap;
      }
      // Presentation eases slower for a calmer look.
      const settleBase = presentation ? 0.0005 : 0.001;
      const k = 1 - Math.pow(settleBase, dt / 1000);
      current = {
        x: current.x + (target.x - current.x) * k,
        y: current.y + (target.y - current.y) * k,
        r: current.r + (target.r - current.r) * k,
        s: current.s + (target.s - current.s) * k,
      };
      setOffset(current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, activity, expression, posture]);
  return offset;
}


export const HappyAvatar = memo(function HappyAvatar({
  expression = "neutral",
  activity = "idle",
  reducedMotion = false,
  size = 260,
  className,
  variant = "bust",
  trackCursor = false,
  posture = "normal",
  gazeTarget = null,
  amplitude = 0,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const blink = useBlink(reducedMotion);
  const drift = useMicroMotion(reducedMotion, activity, expression, posture);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  // Explicit gaze target (e.g. whiteboard region) overrides cursor tracking.
  useEffect(() => {
    if (reducedMotion) return;
    if (!gazeTarget && !trackCursor) return;
    let raf = 0;
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    const clampFromDelta = (dx: number, dy: number, w: number, h: number) => ({
      x: Math.max(-1, Math.min(1, dx / Math.max(w, 1))) * 3.5,
      y: Math.max(-1, Math.min(1, dy / Math.max(h, 1))) * 2.2,
    });
    const onMove = (e: MouseEvent) => {
      if (gazeTarget) return; // explicit target wins
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      target = clampFromDelta(dx, dy, r.width, r.height);
    };
    const applyExplicit = () => {
      const el = rootRef.current;
      if (!el || !gazeTarget) return;
      const r = el.getBoundingClientRect();
      target = clampFromDelta(gazeTarget.x, gazeTarget.y, r.width, r.height);
    };
    if (gazeTarget) applyExplicit();
    const tick = () => {
      current = {
        x: current.x + (target.x - current.x) * 0.06,
        y: current.y + (target.y - current.y) * 0.06,
      };
      setGaze({ x: current.x, y: current.y });
      raf = requestAnimationFrame(tick);
    };
    if (trackCursor) window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      if (trackCursor) window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [trackCursor, reducedMotion, gazeTarget]);


  const speaking = activity === "speaking";
  const listening = activity === "listening";
  const thinking = expression === "thinking";
  const smiling = expression === "smile" || expression === "celebrate";

  const radius = variant === "portrait" ? "1.75rem" : "9999px";


  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="HAPPY, the digital human"
      className={cn("relative select-none isolate", className)}
      style={{ width: size, height: variant === "portrait" ? Math.round(size * 1.25) : size }}
    >

      {/* soft gold halo */}
      <div
        aria-hidden
        className={cn(
          "absolute -inset-6 rounded-[inherit] blur-3xl transition-opacity duration-700",
          "bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.35),transparent_65%)]",
          listening ? "opacity-100" : "opacity-60",
        )}
        style={{ borderRadius: radius }}
      />

      {/* thinking conic halo */}
      {thinking && !reducedMotion && (
        <div
          aria-hidden
          className="absolute -inset-2 rounded-[inherit] opacity-70 dh-thinking-halo"
          style={{
            borderRadius: radius,
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.55) 60deg, transparent 120deg, transparent 360deg)",
            filter: "blur(14px)",
          }}
        />
      )}

      {/* speaking / listening pulse rings */}
      {!reducedMotion && (speaking || listening) && (
        <>
          <span
            aria-hidden
            className={cn("absolute inset-0 rounded-[inherit] border", speaking ? "dh-ring-1" : "dh-ring-slow")}
            style={{ borderRadius: radius, borderColor: "rgba(212,175,55,0.55)" }}
          />
          <span
            aria-hidden
            className={cn("absolute inset-0 rounded-[inherit] border", speaking ? "dh-ring-2" : "dh-ring-slow")}
            style={{ borderRadius: radius, borderColor: "rgba(212,175,55,0.35)", animationDelay: "0.5s" }}
          />
        </>
      )}

      {/* frame */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-charcoal shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]",
          "ring-1 ring-gold/25",
          !reducedMotion && "dh-breathe",
        )}
        style={{ borderRadius: radius }}
      >
        <img
          src={happyPortraitUrl}
          alt="HAPPY, the official HAPPY digital human"
          className={cn(
            "h-full w-full object-cover object-top will-change-transform",
            !reducedMotion && "dh-sway",
          )}
          style={
            reducedMotion
              ? undefined
              : { transform: `translate3d(${drift.x + gaze.x}px, ${drift.y + gaze.y}px, 0) rotate(${drift.r}deg) scale(${drift.s})` }
          }
          draggable={false}
          loading="eager"
          decoding="async"
        />


        {/* soft top gold light */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, rgba(232,201,106,0.28), transparent 65%)",
            mixBlendMode: "screen",
          }}
        />

        {/* cinematic rim light — warm edge on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 90% at 108% 40%, rgba(232,201,106,0.22), transparent 55%)",
            mixBlendMode: "screen",
          }}
        />

        {/* cool key light — faint cyan lift on the left for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at -8% 55%, rgba(120,180,220,0.10), transparent 55%)",
            mixBlendMode: "screen",
          }}
        />

        {/* cinematic vignette — draws the eye to the face */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* film grain — extremely subtle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            backgroundSize: "140px 140px",
          }}
        />

        {/* blink veil — subtle brightness dip that reads as a blink */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-[110ms] ease-out"
          style={{
            background:
              "linear-gradient(180deg, transparent 22%, rgba(0,0,0,0.55) 34%, rgba(0,0,0,0.6) 42%, transparent 55%)",
            opacity: blink && !reducedMotion ? 0.75 : 0,
          }}
        />

        {/* Audio-reactive mouth region — real amplitude drives opacity + scaleY.
            The portrait is a photo, so we cannot morph the mouth mesh — but the
            golden glow, brightness lift and vertical pulse are now genuinely
            tied to the live TTS analyser (see useHappySpeech). */}
        {speaking && !reducedMotion && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(28% 10% at 50% 68%, rgba(232,201,106,0.75), transparent 70%)",
              mixBlendMode: "screen",
              opacity: 0.35 + Math.min(1, amplitude) * 0.65,
              transform: `translateZ(0) scaleY(${1 + Math.min(1, amplitude) * 0.35})`,
              transformOrigin: "50% 72%",
              transition: "opacity 40ms linear, transform 40ms linear",
            }}
          />
        )}

        {/* smile warmth — subtle golden lift across the cheeks */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            background:
              "radial-gradient(45% 22% at 50% 58%, rgba(232,201,106,0.28), transparent 70%)",
            mixBlendMode: "screen",
            opacity: smiling && !reducedMotion ? 1 : 0,
          }}
        />

        {/* bottom fade — for portrait variant */}
        {variant === "portrait" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent"
          />
        )}
      </div>


      <style>{`
        @keyframes dh-breathe { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-1.5px) scale(1.006) } }
        .dh-breathe { animation: dh-breathe 6.4s ease-in-out infinite; will-change: transform; }
        /* dh-sway is intentionally near-zero — organic drift is driven by useMicroMotion */
        .dh-sway { }



        @keyframes dh-ring-1 { 0% { transform: scale(1); opacity: 0.85 } 100% { transform: scale(1.08); opacity: 0 } }
        @keyframes dh-ring-2 { 0% { transform: scale(1); opacity: 0.6 } 100% { transform: scale(1.14); opacity: 0 } }
        @keyframes dh-ring-slow { 0% { transform: scale(1); opacity: 0.55 } 100% { transform: scale(1.06); opacity: 0 } }
        .dh-ring-1 { animation: dh-ring-1 1.4s ease-out infinite; }
        .dh-ring-2 { animation: dh-ring-2 1.8s ease-out infinite; }
        .dh-ring-slow { animation: dh-ring-slow 2.6s ease-out infinite; }
        @keyframes dh-thinking-halo { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
        .dh-thinking-halo { animation: dh-thinking-halo 6s linear infinite; }
        @keyframes dh-mouth-glow { 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }
        .dh-mouth-glow { animation: dh-mouth-glow 320ms ease-in-out infinite; mix-blend-mode: screen; }
        @media (prefers-reduced-motion: reduce) {
          .dh-breathe, .dh-sway, .dh-ring-1, .dh-ring-2, .dh-ring-slow, .dh-thinking-halo, .dh-mouth-glow { animation: none !important; }
        }
      `}</style>
    </div>
  );
});
