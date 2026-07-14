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
import happyPortraitAsset from "@/assets/happy-portrait.png.asset.json";
import { cn } from "@/lib/utils";

export type AvatarExpression =
  | "neutral" | "smile" | "thinking" | "explain" | "concern" | "celebrate" | "listen";
export type AvatarActivity = "idle" | "listening" | "speaking";

type Props = {
  expression?: AvatarExpression;
  activity?: AvatarActivity;
  reducedMotion?: boolean;
  size?: number;
  className?: string;
  /** Render as a full portrait card (rounded rectangle) instead of a circular bust. */
  variant?: "bust" | "portrait";
};

function useBlink(reduced: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const next = 2600 + Math.random() * 3800;
      t = setTimeout(() => {
        setClosed(true);
        setTimeout(() => { setClosed(false); loop(); }, 120);
      }, next);
    };
    loop();
    return () => clearTimeout(t);
  }, [reduced]);
  return closed;
}

export const HappyAvatar = memo(function HappyAvatar({
  expression = "neutral",
  activity = "idle",
  reducedMotion = false,
  size = 260,
  className,
  variant = "bust",
}: Props) {
  const blink = useBlink(reducedMotion);
  const speaking = activity === "speaking";
  const listening = activity === "listening";
  const thinking = expression === "thinking";

  const radius = variant === "portrait" ? "1.75rem" : "9999px";

  return (
    <div
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
          src={happyPortraitAsset.url}
          alt="HAPPY, the official HAPPY X digital human"
          className={cn(
            "h-full w-full object-cover object-top",
            !reducedMotion && "dh-sway",
          )}
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
              "radial-gradient(60% 40% at 50% 0%, rgba(232,201,106,0.25), transparent 65%)",
            mixBlendMode: "screen",
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

        {/* speaking bottom mouth glow */}
        {speaking && !reducedMotion && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 dh-mouth-glow"
            style={{
              background:
                "radial-gradient(28% 10% at 50% 68%, rgba(232,201,106,0.55), transparent 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* bottom fade — for portrait variant */}
        {variant === "portrait" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent"
          />
        )}
      </div>

      <style>{`
        @keyframes dh-breathe { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2px) scale(1.008) } }
        .dh-breathe { animation: dh-breathe 5.6s ease-in-out infinite; will-change: transform; }
        @keyframes dh-sway { 0%,100% { transform: translate3d(0,0,0) rotate(0deg) } 33% { transform: translate3d(2px,0,0) rotate(0.4deg) } 66% { transform: translate3d(-2px,0,0) rotate(-0.35deg) } }
        .dh-sway { animation: dh-sway 11s ease-in-out infinite; will-change: transform; }
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
