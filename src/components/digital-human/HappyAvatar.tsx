/**
 * HAPPY Avatar — CSS/SVG-based Digital Human head.
 *
 * There is only ONE HAPPY. Modes affect expression tokens (eyes, mouth,
 * micro-motion) — never identity, name, or color. Rendering is
 * GPU-friendly (transform/opacity only), degrades gracefully to a static
 * portrait when `reducedMotion` is on, and never captures camera/mic.
 */
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AvatarExpression = "neutral" | "smile" | "thinking" | "explain" | "concern" | "celebrate" | "listen";
export type AvatarActivity = "idle" | "listening" | "speaking";

type Props = {
  expression?: AvatarExpression;
  activity?: AvatarActivity;
  reducedMotion?: boolean;
  size?: number;
  className?: string;
};

function useBlink(reduced: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const next = 2200 + Math.random() * 3500;
      t = setTimeout(() => {
        setClosed(true);
        setTimeout(() => { setClosed(false); loop(); }, 130);
      }, next);
    };
    loop();
    return () => clearTimeout(t);
  }, [reduced]);
  return closed;
}

function useMouthOpen(activity: AvatarActivity, reduced: boolean) {
  const [open, setOpen] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (activity !== "speaking" || reduced) { setOpen(0); return; }
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last; last = t;
      // Smoothed pseudo-random amplitude — approximates viseme motion
      const v = Math.abs(Math.sin(t / 90) * 0.6 + Math.sin(t / 37) * 0.3);
      setOpen((prev) => prev + (v - prev) * Math.min(1, dt / 60));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [activity, reduced]);
  return open;
}

export const HappyAvatar = memo(function HappyAvatar({
  expression = "neutral",
  activity = "idle",
  reducedMotion = false,
  size = 260,
  className,
}: Props) {
  const blink = useBlink(reducedMotion);
  const mouth = useMouthOpen(activity, reducedMotion);

  // Expression tokens
  const brow = expression === "concern" ? -3 : expression === "thinking" ? -1 : 0;
  const smile = expression === "smile" || expression === "celebrate" ? 8 : expression === "concern" ? -5 : expression === "explain" ? 3 : 0;
  const gaze = expression === "thinking" ? { x: 4, y: -2 } : { x: 0, y: 0 };

  const mouthHeight = 6 + mouth * 22;
  const mouthCurve = 90 + smile;

  return (
    <div
      role="img"
      aria-label="HAPPY, digital human avatar"
      className={cn(
        "relative select-none",
        !reducedMotion && "will-change-transform",
        !reducedMotion && activity !== "speaking" && "dh-breathe",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden>
        {/* halo */}
        <defs>
          <radialGradient id="halo" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="hsl(45 90% 60% / 0.35)" />
            <stop offset="60%" stopColor="hsl(45 90% 40% / 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 40% 92%)" />
            <stop offset="100%" stopColor="hsl(30 30% 78%)" />
          </linearGradient>
          <linearGradient id="hair" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(220 15% 18%)" />
            <stop offset="100%" stopColor="hsl(220 15% 10%)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height="200" fill="url(#halo)" />

        {/* neck + shoulders */}
        <path d="M60,175 Q100,150 140,175 L155,200 L45,200 Z" fill="hsl(220 15% 14%)" />
        <path d="M85,150 L85,168 Q100,178 115,168 L115,150 Z" fill="url(#skin)" />

        {/* head */}
        <ellipse cx="100" cy="95" rx="46" ry="54" fill="url(#skin)" />
        {/* hair */}
        <path d="M54,80 Q65,40 100,40 Q135,40 146,80 Q140,60 100,58 Q60,60 54,80 Z" fill="url(#hair)" />

        {/* eyebrows */}
        <path d={`M70,${78 + brow} Q80,${72 + brow} 90,${78 + brow}`} stroke="hsl(220 15% 12%)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d={`M110,${78 + brow} Q120,${72 + brow} 130,${78 + brow}`} stroke="hsl(220 15% 12%)" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* eyes */}
        <g>
          <ellipse cx="80" cy="94" rx="6" ry={blink ? 0.6 : 4.2} fill="hsl(220 25% 10%)" style={{ transition: "ry 90ms ease-out" }} />
          <ellipse cx="120" cy="94" rx="6" ry={blink ? 0.6 : 4.2} fill="hsl(220 25% 10%)" style={{ transition: "ry 90ms ease-out" }} />
          {!blink && (
            <>
              <circle cx={80 + gaze.x} cy={92 + gaze.y} r="1.4" fill="white" />
              <circle cx={120 + gaze.x} cy={92 + gaze.y} r="1.4" fill="white" />
            </>
          )}
        </g>

        {/* nose */}
        <path d="M100,100 Q98,112 100,118 Q102,120 104,118" stroke="hsl(30 30% 55%)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* mouth */}
        <g>
          <path
            d={`M85,${130} Q100,${130 + (mouthCurve - 90) * 0.4} 115,${130}`}
            stroke="hsl(0 55% 30%)" strokeWidth="1.8" fill="none" strokeLinecap="round"
          />
          <ellipse
            cx="100" cy={132 + mouthHeight / 2}
            rx={7 + mouth * 4}
            ry={Math.max(0.6, mouthHeight / 2)}
            fill="hsl(0 55% 22%)"
            style={{ transition: reducedMotion ? "none" : "rx 80ms linear, ry 80ms linear, cy 80ms linear" }}
          />
        </g>

        {/* speaking pulse ring */}
        {activity === "speaking" && !reducedMotion && (
          <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(45 90% 60% / 0.35)" strokeWidth="1.5" className="dh-pulse" />
        )}
      </svg>

      <style>{`
        @keyframes dh-breathe { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2px) scale(1.01) } }
        .dh-breathe { animation: dh-breathe 5.5s ease-in-out infinite; }
        @keyframes dh-pulse { 0% { opacity: 0.9; r: 55; } 100% { opacity: 0; r: 92; } }
        .dh-pulse { animation: dh-pulse 1.4s ease-out infinite; transform-origin: center; }
      `}</style>
    </div>
  );
});
