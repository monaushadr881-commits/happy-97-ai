import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel } from "@/design-system/primitives";
import { getRelationship, updateRelationship, resetRelationship, exportRelationship } from "@/lib/happy-presence/relationship.functions";

export const Route = createFileRoute("/_authenticated/live/relationship")({ component: RelationshipPage });

function RelationshipPage() {
  const getFn = useServerFn(getRelationship);
  const upFn = useServerFn(updateRelationship);
  const resetFn = useServerFn(resetRelationship);
  const expFn = useServerFn(exportRelationship);

  const { data, refetch } = useQuery({ queryKey: ["hpe", "rel"], queryFn: () => getFn() });
  const [prefs, setPrefs] = useState<any>({});
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { if (data) { setPrefs(data.prefs); setEnabled(data.personalization_enabled); } }, [data]);

  const save = useMutation({ mutationFn: () => upFn({ data: { prefs, personalization_enabled: enabled } }), onSuccess: () => refetch() });
  const reset = useMutation({ mutationFn: () => resetFn(), onSuccess: () => refetch() });

  const field = (key: string, label: string, type: "text" | "checkbox" = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-soft-gray">{label}</label>
      {type === "checkbox" ? (
        <input type="checkbox" checked={!!prefs?.[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} />
      ) : (
        <input className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-paper" value={prefs?.[key] ?? ""} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <LiveShell title="Live Relationship" description="HAPPY learns how you like to be spoken to.">
      <Panel className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {field("language", "Preferred Language")}
          {field("tone", "Tone (formal/casual/friendly/professional)")}
          {field("greeting_style", "Greeting Style")}
          {field("theme", "Preferred Theme")}
          {field("voice", "Preferred Voice")}
          {field("writing_style", "Writing Style")}
          {field("notification_style", "Notification Style")}
          {field("emoji_enabled", "Emoji Enabled", "checkbox")}
        </div>
        <label className="flex items-center gap-2 text-sm text-paper">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Personalization enabled
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save.mutate()} className="px-3 py-1.5 rounded-md bg-gold/20 text-gold border border-gold/30 text-sm">Save</button>
          <button onClick={() => reset.mutate()} className="px-3 py-1.5 rounded-md border border-white/10 text-sm text-paper">Reset</button>
          <button onClick={async () => {
            const r = await expFn();
            const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "happy-relationship.json"; a.click(); URL.revokeObjectURL(url);
          }} className="px-3 py-1.5 rounded-md border border-white/10 text-sm text-paper">Export</button>
        </div>
      </Panel>
    </LiveShell>
  );
}
