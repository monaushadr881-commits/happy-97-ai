/** /knowledge/religion-culture — respectful, multi-viewpoint index. */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Landmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/knowledge/religion-culture")({
  head: () => ({ meta: [{ title: "Religion & Culture — Knowledge OS" }, { name: "robots", content: "noindex" }] }),
  component: RCPage,
});

const TRADITIONS: { name: string; region: string; note: string }[] = [
  { name: "Islam", region: "Global", note: "Historical background, core beliefs, practices, terminology, major figures, sacred texts overview, regional diversity, scholarly viewpoints." },
  { name: "Hinduism", region: "South Asia · Global", note: "Historical background, philosophical schools, practices, terminology, regional traditions, scholarly viewpoints." },
  { name: "Christianity", region: "Global", note: "Historical background, denominations, practices, terminology, sacred texts overview, scholarly viewpoints." },
  { name: "Sikhism", region: "South Asia · Global", note: "Historical background, core beliefs, practices, terminology, sacred texts overview, community traditions." },
  { name: "Buddhism", region: "Asia · Global", note: "Historical background, major schools, practices, terminology, philosophical viewpoints." },
  { name: "Jainism", region: "South Asia", note: "Historical background, core beliefs, practices, ethics, terminology, viewpoints." },
  { name: "Judaism", region: "Global", note: "Historical background, movements, practices, terminology, sacred texts overview, scholarly viewpoints." },
  { name: "Zoroastrianism", region: "Iran · Global diaspora", note: "Historical background, core beliefs, practices, sacred texts overview." },
  { name: "Bahá'í Faith", region: "Global", note: "Historical background, core beliefs, practices, community life." },
  { name: "Indigenous traditions", region: "Worldwide", note: "Local histories, cosmologies, oral traditions, ethics — presented respectfully and regionally." },
  { name: "World philosophies", region: "Worldwide", note: "Major schools of thought, ethical frameworks, comparative viewpoints." },
  { name: "Regional cultural traditions", region: "Worldwide", note: "Festivals, arts, customs, foods, language groups, historical context." },
];

function RCPage() {
  return (
    <>
      <PageHeader eyebrow="Religion & Culture" title="Respectful, Multi-Viewpoint Knowledge"
        description="Facts, traditions, interpretations and opinions are always presented separately. Multiple scholarly and cultural viewpoints are shown where relevant." />

      <Panel className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="h-4 w-4 text-gold" />
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Guiding principles</div>
        </div>
        <Hairline className="mb-3" />
        <ul className="text-xs text-soft-gray space-y-1 list-disc ml-5">
          <li>Every topic includes historical background, core beliefs, practices, terminology, important figures, sacred texts overview, regional diversity and scholarly viewpoints where appropriate.</li>
          <li>References and attribution are preserved wherever available.</li>
          <li>Disputed interpretations are never presented as undisputed facts.</li>
          <li>HAPPY presents multiple viewpoints respectfully and clearly labels them.</li>
        </ul>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TRADITIONS.map((t) => (
          <Panel key={t.name} className="p-5">
            <div className="text-sm font-serif text-paper">{t.name}</div>
            <div className="mt-1"><Chip>{t.region}</Chip></div>
            <div className="text-[12px] text-soft-gray mt-2">{t.note}</div>
          </Panel>
        ))}
      </div>
    </>
  );
}
