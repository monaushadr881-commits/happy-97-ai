/** /studio/voice — Voice Studio (TTS). */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { creatorTts, creatorListAssets } from "@/lib/creator-v1.functions";
import { Mic } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/voice")({
  head: () => ({ meta: [{ title: "Voice Studio — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: VoiceStudio,
});

const VOICES = ["alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer"];

function VoiceStudio() {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [format, setFormat] = useState<"mp3"|"wav"|"opus">("mp3");

  const recent = useQuery({
    queryKey: ["creator", "assets", "audio"],
    queryFn: () => creatorListAssets({ data: { kind: "audio", limit: 20 } }),
  });

  const tts = useMutation({
    mutationFn: () => creatorTts({ data: { input, voice, format } }),
    onSuccess: () => { toast.success("Voice generated"); setInput(""); qc.invalidateQueries({ queryKey: ["creator"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Voice Studio" title="Text to speech" description="High-quality narration in multiple voices and formats." />

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Compose</div>
          <Hairline className="mb-3" />
          <Textarea rows={6} placeholder="Type what HAPPY should say…" value={input} onChange={(e) => setInput(e.target.value)} />
          <div className="mt-3 grid gap-2 grid-cols-2">
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VOICES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={format} onValueChange={(v) => setFormat(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">mp3</SelectItem>
                <SelectItem value="wav">wav</SelectItem>
                <SelectItem value="opus">opus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="mt-3 w-full" onClick={() => input.trim() && tts.mutate()} disabled={!input.trim() || tts.isPending}>
            <Mic className="h-4 w-4 mr-1" /> {tts.isPending ? "Rendering…" : "Generate voice"}
          </Button>
        </Panel>

        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Recent narrations</div>
          <Hairline className="mb-3" />
          <div className="space-y-3">
            {(recent.data ?? []).map((a) => (
              <div key={a.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="text-xs text-paper truncate mb-1">{a.name}</div>
                <audio controls src={a.data_url ?? a.external_url ?? ""} className="w-full" />
              </div>
            ))}
            {(recent.data ?? []).length === 0 && (
              <div className="text-xs text-soft-gray">No narrations yet.</div>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
