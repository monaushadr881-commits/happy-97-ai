import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/advisor")({
  head: () => ({ meta: [{ title: "Executive Advisor — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Executive Advisor"
      description="Board-level advisory: revenue, market, customer, operations, manufacturing and learning intelligence unified as one HAPPY briefing."
      bullets={["Revenue intelligence", "Market intelligence", "Customer intelligence", "Operations intelligence", "Manufacturing intelligence", "Learning intelligence"]}
      apiHints={["apiEiAdvisor", "apiEiRevenue", "apiEiMarket", "apiEiCustomer", "apiEiOperations", "apiEiManufacturing", "apiEiLearning"]}
    />
  ),
});
