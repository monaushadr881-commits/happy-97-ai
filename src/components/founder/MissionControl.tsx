/**
 * R183 Batch F — Founder Mission Control panels.
 * R195 Batch 8 — Presentation split. Data fetching and query key preserved;
 * every panel is a memoized child that only re-renders when its slice ref
 * changes. Business logic, server functions, and query semantics are unchanged.
 */
import { useQuery } from "@tanstack/react-query";
import { Chip } from "@/design-system/primitives";
import { founderMissionControl } from "@/lib/founder/mission-control.functions";

import { ApprovalsPanel } from "./MissionControl/ApprovalsPanel";
import { BrainJobsPanel } from "./MissionControl/BrainJobsPanel";
import { RevenueCreatorPanel } from "./MissionControl/RevenueCreatorPanel";
import { KnowledgeHealthPanel } from "./MissionControl/KnowledgeHealthPanel";
import { PublishingPanel } from "./MissionControl/PublishingPanel";
import { ExecutivePanel } from "./MissionControl/ExecutivePanel";
import { FounderCreatorPanel } from "./MissionControl/FounderCreatorPanel";
import { RevenueExtPanel } from "./MissionControl/RevenueExtPanel";
import { AutomationPanel } from "./MissionControl/AutomationPanel";
import { WorkspacePanel } from "./MissionControl/WorkspacePanel";
import { KnowledgeExtPanel } from "./MissionControl/KnowledgeExtPanel";
import { SearchPanel } from "./MissionControl/SearchPanel";
import { SecurityPanel } from "./MissionControl/SecurityPanel";
import { BusinessPanel } from "./MissionControl/BusinessPanel";
import { PlatformCorePanel } from "./MissionControl/PlatformCorePanel";
import { PlatformRuntimePanel } from "./MissionControl/PlatformRuntimePanel";
import { UniversalRuntimePanel } from "./MissionControl/UniversalRuntimePanel";
import { VerticalPanel } from "./MissionControl/VerticalPanel";

export function MissionControl() {
  const q = useQuery({
    queryKey: ["founder", "mission-control"],
    queryFn: () => founderMissionControl(),
    refetchInterval: 20_000,
  });
  const d = q.data;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Mission Control</div>
          <h2 className="mt-1 text-lg font-medium tracking-tight text-paper">
            Live Runtime
          </h2>
        </div>
        <Chip tone={q.isFetching ? "gold" : "neutral"}>
          {q.isFetching ? "syncing" : "live"}
        </Chip>
      </div>

      <ApprovalsPanel data={d?.approvals} />
      <BrainJobsPanel brain={d?.brain} jobs={d?.jobs} />
      <RevenueCreatorPanel revenue={d?.revenue} creator={d?.creator} />
      <KnowledgeHealthPanel knowledge={d?.knowledge} health={d?.health} />
      <PublishingPanel data={d?.publishing} />
      <ExecutivePanel data={d?.executive} />
      <FounderCreatorPanel data={d?.founder_creator} />
      <RevenueExtPanel data={d?.revenue_ext} />
      <AutomationPanel data={d?.automation} />
      <WorkspacePanel data={d?.workspace} />
      <KnowledgeExtPanel data={d?.knowledge_ext} />
      <SearchPanel data={d?.search} />
      <SecurityPanel data={d?.security} />
      <BusinessPanel data={d?.business} />
      <PlatformCorePanel data={d?.platform_core} />
      <PlatformRuntimePanel data={d?.platform_runtime} />
      <UniversalRuntimePanel data={d?.universal_runtime} />

      {(["mfg", "health", "agri"] as const).map((v) => (
        <VerticalPanel key={v} vertical={v} data={d?.verticals?.[v]} />
      ))}
    </section>
  );
}
