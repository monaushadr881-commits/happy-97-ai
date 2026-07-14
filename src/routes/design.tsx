import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import {
  Chip,
  Container,
  EmptyState,
  Eyebrow,
  Hairline,
  Kbd,
  PageHeader,
  Panel,
  Section,
  StatCard,
} from "@/design-system";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Design System — HAPPY X" },
      {
        name: "description",
        content:
          "HAPPY X Executive AI Luxury design system. Tokens, primitives, motion, and accessibility documentation.",
      },
    ],
  }),
  component: DesignSystemPage,
});

function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-gradient-luxe">
      <Container>
        <Section className="pt-24">
          <PageHeader
            eyebrow="Design System · v1.0"
            title={
              <>
                Executive AI Luxury <span className="text-gradient-gold">visual language</span>
              </>
            }
            description="The single source of truth for every HAPPY X surface. Tokens, primitives, motion and accessibility guarantees that keep the platform premium at scale."
            actions={
              <Button className="bg-gold text-obsidian hover:bg-gold-bright">
                View components
              </Button>
            }
          />
          <Hairline />
        </Section>

        {/* Color tokens */}
        <Section className="!pt-8">
          <Eyebrow className="mb-4 block">Color · Primary</Eyebrow>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {[
              ["Obsidian", "bg-obsidian", "text-paper"],
              ["Charcoal", "bg-charcoal", "text-paper"],
              ["Onyx", "bg-onyx", "text-paper"],
              ["Graphite", "bg-graphite", "text-paper"],
              ["Gold", "bg-gold", "text-obsidian"],
              ["Gold Bright", "bg-gold-bright", "text-obsidian"],
              ["Gold Deep", "bg-gold-deep", "text-paper"],
            ].map(([name, bg, fg]) => (
              <div
                key={name}
                className={`${bg} ${fg} h-24 rounded-lg border border-white/5 p-3 flex flex-col justify-end text-xs font-medium`}
              >
                {name}
              </div>
            ))}
          </div>

          <Eyebrow className="mt-10 mb-4 block">Color · Semantic</Eyebrow>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-white/5 bg-success/10 p-4 text-success">Success</div>
            <div className="rounded-lg border border-white/5 bg-warning/10 p-4 text-warning">Warning</div>
            <div className="rounded-lg border border-white/5 bg-danger/10 p-4 text-danger">Danger</div>
            <div className="rounded-lg border border-white/5 bg-info/10 p-4 text-info">Info</div>
          </div>
        </Section>

        {/* Typography */}
        <Section>
          <Eyebrow className="mb-4 block">Typography</Eyebrow>
          <Panel variant="elevated" className="p-8 space-y-4">
            <p className="eyebrow">Eyebrow · Inter · 0.32em</p>
            <h1 className="text-6xl font-medium">Display · Inter Tight</h1>
            <h2 className="text-3xl font-medium">Headline · Inter Tight</h2>
            <p className="text-base text-soft-gray">
              Body · Inter · Optimized for enterprise reading with ss01 and cv11 features.
            </p>
            <p className="numeric text-2xl text-gold">1,284,506.00 · Numeric · Manrope</p>
          </Panel>
        </Section>

        {/* Primitives */}
        <Section>
          <Eyebrow className="mb-4 block">Primitives · Stat Cards</Eyebrow>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Active users" value="12,480" delta="+8.2% MoM" trend="up" icon={<Users className="h-4 w-4" />} />
            <StatCard label="Revenue" value="$948k" delta="+14.6%" trend="up" icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="AI sessions" value="284k" delta="+2.1%" trend="up" icon={<Sparkles className="h-4 w-4" />} />
            <StatCard label="Latency" value="112ms" delta="-6ms" trend="down" icon={<Zap className="h-4 w-4" />} />
          </div>
        </Section>

        <Section>
          <Eyebrow className="mb-4 block">Primitives · Chips & Kbd</Eyebrow>
          <Panel className="p-6 flex flex-wrap items-center gap-3">
            <Chip tone="gold">Executive</Chip>
            <Chip tone="success">Live</Chip>
            <Chip tone="warning">Pending</Chip>
            <Chip tone="danger">Blocked</Chip>
            <Chip tone="info">Beta</Chip>
            <Chip>Neutral</Chip>
            <div className="ml-auto flex items-center gap-1 text-sm text-soft-gray">
              Command palette <Kbd>⌘</Kbd> <Kbd>K</Kbd>
            </div>
          </Panel>
        </Section>

        <Section>
          <Eyebrow className="mb-4 block">Primitives · Empty State</Eyebrow>
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="No workspace yet"
            description="Create a workspace to unlock the HAPPY X operating platform for your organization."
            action={
              <Button className="bg-gold text-obsidian hover:bg-gold-bright">
                Create workspace
              </Button>
            }
          />
        </Section>

        <Section>
          <Eyebrow className="mb-4 block">Motion</Eyebrow>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Panel interactive className="p-6">
              <p className="text-sm text-soft-gray">Hover · lift & border glow</p>
              <p className="mt-2 text-lg text-paper">Interactive panel</p>
            </Panel>
            <Panel className="p-6 shimmer-on-hover">
              <p className="text-sm text-soft-gray">Hover · shimmer sweep</p>
              <p className="mt-2 text-lg text-paper">Premium surface</p>
            </Panel>
            <Panel className="p-6 animate-rise-in">
              <p className="text-sm text-soft-gray">Enter · rise-in 420ms</p>
              <p className="mt-2 text-lg text-paper">Content reveal</p>
            </Panel>
          </div>
        </Section>

        <Section className="pb-24">
          <Panel variant="glass" className="p-6 text-sm text-soft-gray">
            Every module must import from{" "}
            <code className="text-gold">@/design-system</code>. No raw hex, no custom
            typography, no bespoke shadows without approval. See{" "}
            <code className="text-gold">docs/design-system/README.md</code> for the full
            reference.
          </Panel>
        </Section>
      </Container>
    </main>
  );
}
