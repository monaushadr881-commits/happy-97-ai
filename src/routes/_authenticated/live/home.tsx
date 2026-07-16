import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel, StatCard } from "@/design-system/primitives";
import { listProactive } from "@/lib/happy-presence/proactive-ai.functions";
import { getRelationship } from "@/lib/happy-presence/relationship.functions";

export const Route = createFileRoute("/_authenticated/live/home")({ component: LiveHome });

function greetingFor(hour: number, tone: string, lang: string) {
  const base = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const hi = hour < 5 ? "शुभ रात्रि" : hour < 12 ? "सुप्रभात" : hour < 17 ? "नमस्ते" : "शुभ संध्या";
  if (lang.startsWith("hi")) return `${hi} 😊`;
  return tone === "professional" ? base : `${base} 😊`;
}

function LiveHome() {
  const proFn = useServerFn(listProactive);
  const relFn = useServerFn(getRelationship);
  const { data: pro } = useQuery({ queryKey: ["hpe", "home", "pro"], queryFn: () => proFn(), refetchInterval: 30_000 });
  const { data: rel } = useQuery({ queryKey: ["hpe", "home", "rel"], queryFn: () => relFn() });
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const greeting = greetingFor(now.getHours(), (rel?.prefs.tone as string) ?? "friendly", (rel?.prefs.language as string) ?? "en");

  return (
    <LiveShell title="Live Home" description="Your alive home surface.">
      <Panel className="p-6 mb-4">
        <div className="text-2xl text-paper">{greeting}</div>
        <div className="text-soft-gray text-sm mt-1">{now.toLocaleString()}</div>
      </Panel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Suggestions" value={String(pro?.messages.filter((m: any) => m.kind.startsWith("suggest")).length ?? 0)} />
        <StatCard label="Messages" value={String(pro?.messages.length ?? 0)} />
        <StatCard label="Tone" value={String(rel?.prefs.tone ?? "friendly")} />
        <StatCard label="Language" value={String(rel?.prefs.language ?? "en")} />
      </div>
      <Panel className="p-6">
        <h3 className="text-sm font-semibold text-paper mb-2">HAPPY says</h3>
        {(pro?.messages ?? []).slice(0, 5).map((m: any) => (
          <div key={m.id} className="border-t border-white/5 py-2 text-sm text-paper">{m.message}<div className="text-xs text-soft-gray">{m.kind}</div></div>
        ))}
      </Panel>
    </LiveShell>
  );
}
