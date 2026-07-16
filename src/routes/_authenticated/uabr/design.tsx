import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { generateDesignKit } from "@/lib/uabr/design-engine.functions";

export const Route = createFileRoute("/_authenticated/uabr/design")({ component: Page });

function Page() {
  const fn = useServerFn(generateDesignKit);
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("default");
  const mut = useMutation({ mutationFn: (input: { brand_name: string; industry: string }) => fn({ data: input }) });
  return (
    <UabrShell title="AI Design Engine" description="Brand kit, palette, typography, and wireframes.">
      <Panel className="p-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input className="flex-1 min-w-48 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" placeholder="Brand name" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <select className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="default">Default</option>
            <option value="restaurant">Restaurant</option>
            <option value="hospital">Hospital</option>
            <option value="ecommerce">E-commerce</option>
          </select>
          <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={!brand || mut.isPending} onClick={() => mut.mutate({ brand_name: brand, industry })}>{mut.isPending ? "Generating…" : "Generate Kit"}</button>
        </div>
      </Panel>
      {mut.data && (
        <div className="space-y-4">
          <Panel className="p-6">
            <h4 className="text-sm font-semibold text-paper mb-2">Palette</h4>
            <div className="flex flex-wrap gap-3">
              {mut.data.palette.map((c) => (
                <div key={c.name} className="flex items-center gap-2 border border-white/10 rounded-md px-3 py-2">
                  <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs text-paper">{c.name}</span>
                  <span className="text-xs text-soft-gray">{c.hex}</span>
                  <Chip tone="neutral">{c.role}</Chip>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-6 text-sm text-soft-gray">
            <h4 className="text-sm font-semibold text-paper mb-2">Typography</h4>
            <p>Heading: <span className="text-paper">{mut.data.typography.heading}</span></p>
            <p>Body: <span className="text-paper">{mut.data.typography.body}</span></p>
          </Panel>
          <Panel className="p-6">
            <h4 className="text-sm font-semibold text-paper mb-2">Wireframes</h4>
            <div className="grid md:grid-cols-3 gap-3">
              {mut.data.wireframes.map((w) => (
                <div key={w.name} className="border border-white/10 rounded-md p-3 text-xs">
                  <div className="text-paper mb-1">{w.name}</div>
                  <ul className="text-soft-gray list-disc pl-4">{w.sections.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </UabrShell>
  );
}
