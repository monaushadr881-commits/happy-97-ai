/**
 * Interactive Whiteboard — HAPPY's teaching surface.
 * Pointer-driven canvas with pen / highlighter / eraser and PNG export.
 * Publishes the current pointer region to the Digital Human context so
 * HAPPY's gaze briefly follows what the user draws.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Highlighter, Download, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { useDigitalHuman } from "./DigitalHumanContext";

type Tool = "pen" | "highlight" | "eraser";

export function Whiteboard({ height = 480 }: { height?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { glanceAt } = useDigitalHuman();
  const [tool, setTool] = useState<Tool>("pen");
  const [size, setSize] = useState(3);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const lastGlance = useRef(0);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const parent = c.parentElement!;
    c.width = parent.clientWidth * devicePixelRatio;
    c.height = height * devicePixelRatio;
    c.style.width = `${parent.clientWidth}px`;
    c.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [height]);

  const stroke = (x: number, y: number) => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === "highlight" ? "rgba(212,175,55,0.35)" : "#F3F1EB";
    ctx.lineWidth = tool === "highlight" ? size * 6 : size;
    if (!last.current) { last.current = { x, y }; return; }
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
  };

  const publishGaze = (clientX: number, clientY: number) => {
    // Throttle: at most once per 700ms so HAPPY's glance stays natural.
    const now = performance.now();
    if (now - lastGlance.current < 700) return;
    lastGlance.current = now;
    // We can't easily locate the avatar's rect from here — pass client coords
    // and let the avatar compute its offset. To do that we need a shared
    // reference frame: use viewport-centered deltas which the avatar's own
    // rect logic will normalize.
    // Pass a coarse delta relative to viewport center; the avatar's clamp
    // will scale it naturally.
    const dx = clientX - window.innerWidth / 2;
    const dy = clientY - window.innerHeight / 2;
    glanceAt({ x: dx, y: dy }, 900);
  };

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    stroke(e.clientX - rect.left, e.clientY - rect.top);
    publishGaze(e.clientX, e.clientY);
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    last.current = null;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    onPointer(e);
  };
  const end = () => { drawing.current = false; last.current = null; };

  const clear = () => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  };
  const exportPng = () => {
    const c = ref.current; if (!c) return;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = "whiteboard.png"; a.click();
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={tool === "pen" ? "default" : "outline"} onClick={() => setTool("pen")}>
          <Pencil className="h-4 w-4 mr-1" /> Pen
        </Button>
        <Button size="sm" variant={tool === "highlight" ? "default" : "outline"} onClick={() => setTool("highlight")}>
          <Highlighter className="h-4 w-4 mr-1" /> Highlight
        </Button>
        <Button size="sm" variant={tool === "eraser" ? "default" : "outline"} onClick={() => setTool("eraser")}>
          <Eraser className="h-4 w-4 mr-1" /> Erase
        </Button>
        <div className="h-6 w-px bg-white/10" />
        <Button size="sm" variant="outline" onClick={() => setSize((s) => Math.max(1, s - 1))} aria-label="Decrease brush size"><ZoomOut className="h-4 w-4" /></Button>
        <span className="text-xs text-soft-gray tabular-nums w-6 text-center" aria-label={`brush size ${size}`}>{size}</span>
        <Button size="sm" variant="outline" onClick={() => setSize((s) => Math.min(20, s + 1))} aria-label="Increase brush size"><ZoomIn className="h-4 w-4" /></Button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={clear}><Trash2 className="h-4 w-4 mr-1" /> Clear</Button>
          <Button size="sm" onClick={exportPng}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>
      <canvas
        ref={ref}
        className="w-full touch-none rounded-md bg-obsidian/60"
        onPointerDown={start}
        onPointerMove={onPointer}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}
