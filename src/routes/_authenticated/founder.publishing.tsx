/**
 * R182 — Founder Publishing Center.
 * Documentation-only aggregator. Reuses the existing R64 Release routes
 * (src/routes/_authenticated/releases/*) — no new runtime, no duplicate UI.
 * Every action still routes through R158 Approval Gateway.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Rocket, Package, PenTool, Shield, FileText, Store, Apple, Smartphone, ClipboardCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/publishing")({
  component: PublishingCenter,
  head: () => ({
    meta: [
      { title: "Publishing Center — Founder" },
      { name: "description", content: "Google Play + Apple App Store publishing readiness for HAPPY X." },
    ],
  }),
});

const STORES = [
  { name: "Google Play", icon: Smartphone, doc: "docs/publishing/Google_Play_Console_Guide.md", readiness: "35%", note: "Awaiting signing keystore + Play Console account." },
  { name: "Apple App Store", icon: Apple, doc: "docs/publishing/Apple_App_Store_Connect_Guide.md", readiness: "30%", note: "Awaiting Apple Developer Program + certificates." },
];

const RELEASE_LINKS = [
  { to: "/releases/dashboard", label: "Release Dashboard", icon: Rocket },
  { to: "/releases/builds", label: "Builds", icon: Package },
  { to: "/releases/signing", label: "Signing", icon: PenTool },
  { to: "/releases/publish", label: "Store Submissions", icon: Store },
  { to: "/releases/rollout", label: "Rollout", icon: ClipboardCheck },
  { to: "/releases/artifacts", label: "Artifacts", icon: FileText },
];

const DOCS = [
  "Publishing_Readiness_Report.md",
  "Publishing_Blockers.md",
  "Android_Publishing_Guide.md",
  "IOS_Publishing_Guide.md",
  "Google_Play_Submission_Checklist.md",
  "Apple_Submission_Checklist.md",
  "Store_Metadata.md",
  "Store_Descriptions.md",
  "Permissions_Audit.md",
  "Security_Audit.md",
  "Payments_Checklist.md",
  "Privacy_Checklist.md",
  "Assets_Checklist.md",
  "Release_Checklist.md",
  "Versioning_Guide.md",
  "Release_Notes_Template.md",
  "Developer_Accounts_Checklist.md",
  "Certificates_Checklist.md",
  "Production_GoLive_Checklist.md",
  "Rollback_Checklist.md",
  "Post_Release_Monitoring.md",
];

function PublishingCenter() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
          <Rocket className="h-3.5 w-3.5" /> R182 · Publishing Center
        </div>
        <h1 className="text-2xl font-semibold text-paper">Store Publishing Readiness</h1>
        <p className="text-sm text-soft-gray max-w-2xl">
          Aggregated view of Google Play + Apple App Store readiness. All submissions
          route through the existing R64 Release pipeline and are gated by
          R158 Approval Gateway. No new runtime; documentation and configuration only.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {STORES.map((s) => (
          <div key={s.name} className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <s.icon className="h-5 w-5 text-gold" />
              <h2 className="text-base font-medium text-paper">{s.name}</h2>
              <span className="ml-auto text-xs uppercase tracking-widest text-amber-400">{s.readiness}</span>
            </div>
            <p className="mt-3 text-xs text-soft-gray">{s.note}</p>
            <p className="mt-3 text-[11px] font-mono text-soft-gray/70">{s.doc}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-soft-gray">Existing Release Pipeline (R64)</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {RELEASE_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-paper hover:bg-white/[0.05]">
              <l.icon className="h-4 w-4 text-gold" />
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-soft-gray">Governance</h2>
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200 flex gap-3">
          <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Every store submission requires R158 Founder approval.</div>
            <div className="mt-1 text-amber-200/70">
              AI never publishes automatically. Signing keys, provisioning profiles,
              store credentials, and native builds remain external dependencies
              (see MASTER_CORE_VISION_LOCK.md).
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-soft-gray">Documentation ({DOCS.length} guides)</h2>
        <div className="grid gap-1.5 md:grid-cols-2 text-xs font-mono text-soft-gray">
          {DOCS.map((d) => (
            <div key={d} className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02]">
              <FileText className="h-3 w-3 text-soft-gray/50" />
              docs/publishing/{d}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-md border border-white/5 bg-white/[0.02] p-4 text-xs text-soft-gray flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-paper mb-1">External dependencies (BLOCKED, not fabricated)</div>
            Google Play Developer Console account · Apple Developer Program membership ·
            Android keystore + Play signing · iOS certificates + provisioning profiles ·
            Firebase / Crashlytics project · Native build hosts (Android Studio / Xcode).
          </div>
        </div>
      </section>
    </div>
  );
}
