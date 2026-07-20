import { createFileRoute, Link } from "@tanstack/react-router";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";
import {
  Github,
  Cloud,
  Globe,
  Shield,
  Container,
  Train,
  Server,
  Rocket,
  Undo2,
  ScrollText,
  HeartPulse,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/deployment")({
  head: () => ({
    meta: [
      { title: "Deployment Platform — HAPPY" },
      {
        name: "description",
        content:
          "HAPPY Enterprise Deployment: GitHub, Vercel, Netlify, Cloudflare, Docker, Railway, Render, Production, Rollback, Logs, Health Checks, Monitoring.",
      },
    ],
  }),
  component: DeploymentPage,
});

type Tile = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; hint: string };

const PROVIDERS: Tile[] = [
  { label: "GitHub", to: "/mission-control", icon: Github, hint: "Repo sync & CI" },
  { label: "Vercel", to: "/mission-control", icon: Cloud, hint: "Edge deploys" },
  { label: "Netlify", to: "/mission-control", icon: Globe, hint: "Static + functions" },
  { label: "Cloudflare", to: "/mission-control", icon: Shield, hint: "Workers & Pages" },
  { label: "Docker", to: "/mission-control", icon: Container, hint: "Container images" },
  { label: "Railway", to: "/mission-control", icon: Train, hint: "Managed services" },
  { label: "Render", to: "/mission-control", icon: Server, hint: "Web services" },
];

const OPERATIONS: Tile[] = [
  { label: "Production", to: "/mission-control", icon: Rocket, hint: "Release pipeline" },
  { label: "Rollback", to: "/mission-control", icon: Undo2, hint: "Revert release" },
  { label: "Logs", to: "/mission-control", icon: ScrollText, hint: "Deploy & runtime logs" },
];

const OBSERVABILITY: Tile[] = [
  { label: "Health Checks", to: "/mission-control", icon: HeartPulse, hint: "Liveness & readiness" },
  { label: "Monitoring", to: "/business/analytics", icon: Activity, hint: "Metrics & alerts" },
];

function TileGroup({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="group rounded-xl border bg-card hover:bg-accent transition p-4 flex flex-col gap-2"
          >
            <t.icon className="h-5 w-5 text-primary" />
            <div className="font-medium">{t.label}</div>
            <div className="text-xs text-muted-foreground">{t.hint}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DeploymentPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="border-b p-4 space-y-1">
        <h1 className="text-2xl font-bold">HAPPY Enterprise Deployment</h1>
        <p className="text-sm text-muted-foreground">
          One canonical deployment platform — providers, releases, and observability wired to Mission Control.
        </p>
      </header>

      <div className="border-b p-3">
        <HappyUniversalPromptBar defaultSurface="chat" />
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        <TileGroup title="Providers" tiles={PROVIDERS} />
        <TileGroup title="Release Operations" tiles={OPERATIONS} />
        <TileGroup title="Observability" tiles={OBSERVABILITY} />
      </div>

      <div className="border-t p-3">
        <HappyUniversalActionBar mode="mission-control" payload={null} />
      </div>
    </div>
  );
}
