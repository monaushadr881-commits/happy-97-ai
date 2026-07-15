/**
 * FloatingHappy — R20 Enterprise Shell
 * Persistent floating HAPPY assistant on every authenticated screen.
 * A visual affordance that routes into the full assistant surface; no
 * chat state is duplicated here (business logic stays untouched).
 */
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Mic, X, MessageSquare, Presentation, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShell } from "./ShellContext";

export function FloatingHappy() {
  const { happyOpen, toggleHappy } = useShell();
  const navigate = useNavigate();

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={toggleHappy}
        aria-label={happyOpen ? "Close HAPPY" : "Open HAPPY"}
        aria-expanded={happyOpen}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-gold via-[#d4af37] to-[#8a6f22] text-obsidian shadow-[0_10px_30px_-10px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold flex items-center justify-center"
      >
        {happyOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {/* Peek panel */}
      {happyOpen && (
        <div
          role="dialog"
          aria-label="HAPPY quick panel"
          className="fixed bottom-24 right-5 z-40 w-[320px] rounded-2xl border border-gold/20 bg-charcoal/95 backdrop-blur-xl shadow-luxe p-4 animate-fade-in"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gold/10 border border-gold/30 grid place-items-center">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-paper">HAPPY</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">Always on</p>
            </div>
          </div>

          <p className="text-xs text-soft-gray mb-3">
            Ask anything, launch a workflow, or start voice.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="justify-start border-white/10 hover:bg-white/5"
              onClick={() => { toggleHappy(); navigate({ to: "/assistant" }); }}
            >
              <MessageSquare className="mr-2 h-3.5 w-3.5" /> Chat
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="justify-start border-white/10 hover:bg-white/5"
              onClick={() => { toggleHappy(); navigate({ to: "/digital-human" }); }}
            >
              <Mic className="mr-2 h-3.5 w-3.5" /> Voice
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="justify-start border-white/10 hover:bg-white/5"
              onClick={() => { toggleHappy(); navigate({ to: "/digital-human/presentation" }); }}
            >
              <Presentation className="mr-2 h-3.5 w-3.5" /> Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="justify-start border-white/10 hover:bg-white/5"
              onClick={() => { toggleHappy(); navigate({ to: "/digital-human/whiteboard" }); }}
            >
              <PenLine className="mr-2 h-3.5 w-3.5" /> Whiteboard
            </Button>
          </div>

          <p className="mt-3 text-[10px] text-soft-gray/70 text-center">
            ⌘J to toggle · ⌘K for commands
          </p>
        </div>
      )}
    </>
  );
}
