import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { submitFounderCommand } from "@/lib/faios/founder-command.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/voice")({ component: Page });

// SpeechRecognition typing shim
type SR = any;

function Page() {
  const submit = useServerFn(submitFounderCommand);
  const qc = useQueryClient();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as any) : null;
    const Ctor = w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
    if (!Ctor) return;
    const rec: SR = new Ctor();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (ev: any) => {
      let out = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) out += ev.results[i][0].transcript;
      setTranscript((prev) => (prev + " " + out).trim());
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, []);

  const submitM = useMutation({
    mutationFn: (t: string) => submit({ data: { raw_text: t, mode: "approval" } }),
    onSuccess: () => { setTranscript(""); qc.invalidateQueries({ queryKey: ["faios"] }); },
  });

  return (
    <FaiosShell title="Founder Voice" description="Push-to-talk. Wake word: HAPPY.">
      <div className="space-y-6">
        <Panel className="p-6 space-y-3">
          {!supported && <p className="text-xs text-amber-400">Speech recognition not supported in this browser. Use Chrome/Edge desktop for best results.</p>}
          <div className="flex gap-3 items-center">
            <button
              onMouseDown={() => { if (recRef.current && !listening) { try { recRef.current.start(); setListening(true); } catch {} } }}
              onMouseUp={() => { if (recRef.current && listening) { try { recRef.current.stop(); } catch {} setListening(false); } }}
              onTouchStart={(e) => { e.preventDefault(); if (recRef.current && !listening) { try { recRef.current.start(); setListening(true); } catch {} } }}
              onTouchEnd={() => { if (recRef.current && listening) { try { recRef.current.stop(); } catch {} setListening(false); } }}
              disabled={!supported}
              className="px-6 py-3 rounded-full bg-gold/20 border border-gold/40 text-gold text-sm disabled:opacity-40">
              {listening ? "Listening…" : "Hold to speak"}
            </button>
            <Chip tone={listening ? "success" : "info"}>{listening ? "Active" : "Idle"}</Chip>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
            rows={4} placeholder="Transcript appears here…"
            className="w-full rounded-md bg-black/30 border border-white/10 p-3 text-paper text-sm" />
          <div className="flex justify-end">
            <button onClick={() => transcript.trim() && submitM.mutate(transcript.trim())} disabled={!transcript.trim() || submitM.isPending}
              className="px-4 py-1.5 rounded-md bg-gold/20 border border-gold/40 text-gold text-sm disabled:opacity-40">
              {submitM.isPending ? "Sending…" : "Send to HAPPY"}
            </button>
          </div>
        </Panel>
      </div>
    </FaiosShell>
  );
}
