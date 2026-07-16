import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { detectAndRecordLanguage, getLanguageProfile } from "@/lib/happy-presence/language-engine.functions";
import { SUPPORTED_LANGUAGES } from "@/lib/happy-presence/contracts";

export const Route = createFileRoute("/_authenticated/live/language")({ component: LanguagePage });

function LanguagePage() {
  const detectFn = useServerFn(detectAndRecordLanguage);
  const getFn = useServerFn(getLanguageProfile);
  const { data, refetch } = useQuery({ queryKey: ["hpe", "lang"], queryFn: () => getFn() });
  const [text, setText] = useState("");
  const m = useMutation({ mutationFn: (t: string) => detectFn({ data: { text: t } }), onSuccess: () => refetch() });

  return (
    <LiveShell title="Live Language" description="HAPPY auto-detects Hindi, English, Hinglish, and 20+ languages.">
      <Panel className="p-6 space-y-4">
        <div className="text-sm text-paper">Current: <Chip tone="info">{data?.profile.detected_lang}</Chip> <span className="text-soft-gray text-xs ml-2">confidence {Number(data?.profile.confidence ?? 0).toFixed(2)}</span></div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm text-paper"
          placeholder="Type in any language…" />
        <button onClick={() => m.mutate(text)} className="px-3 py-1.5 rounded-md bg-gold/20 text-gold border border-gold/30 text-sm">Detect</button>
        {m.data && <div className="text-sm text-paper">Detected: <Chip tone="success">{m.data.lang}</Chip> ({m.data.confidence.toFixed(2)})</div>}
        <div className="text-xs text-soft-gray">Supported: {SUPPORTED_LANGUAGES.join(", ")}</div>
      </Panel>
    </LiveShell>
  );
}
