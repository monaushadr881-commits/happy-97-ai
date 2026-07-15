/**
 * HAPPY X — R26 BI / Analytics server functions (auth-gated RPC).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  revenue, customers, finance, marketplace, builder, manufacturing, warehouse,
  system, founder, snapshots, reports, forecast, insights, alerts, search,
  type Grain, type ReportSpec,
} from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

// KPI summaries
export const biRevenueSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => revenue.summary(context.supabase, data.company_id));
export const biRevenueSeries = auth().inputValidator((d: { company_id: string; grain?: Grain; periods?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => revenue.series(context.supabase, data.company_id, data.grain ?? "month", data.periods ?? 12));
export const biCustomersSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => customers.summary(context.supabase, data.company_id));
export const biFinanceSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => finance.summary(context.supabase, data.company_id));
export const biMarketplaceSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => marketplace.summary(context.supabase, data.company_id));
export const biBuilderSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => builder.summary(context.supabase, data.company_id));
export const biManufacturingSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => manufacturing.summary(context.supabase, data.company_id));
export const biWarehouseSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => warehouse.summary(context.supabase, data.company_id));
export const biSystemSummary = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => system.summary(context.supabase, data.company_id));

// Founder command center
export const biFounderOverview = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => founder.overview(context.supabase, data.company_id));

// Snapshots
export const biSnapshotsList = auth().inputValidator((d: { company_id: string; scope?: string; metric_key?: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => snapshots.list(context.supabase, data.company_id, data.scope, data.metric_key, data.limit));
export const biSnapshotFounder = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => snapshots.captureFounder(context.supabase, data.company_id));

// Reports
export const biReportDefinitions = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => reports.definitions(context.supabase, data.company_id));
export const biSaveReportDefinition = auth().inputValidator((d: {
  company_id: string; code: string; name: string; description?: string; category?: string;
  query_spec?: Record<string, unknown>; visualization?: Record<string, unknown>;
  schedule?: string | null; delivery?: Record<string, unknown>;
}) => d)
  .handler(async ({ data, context }): Promise<any> => reports.saveDefinition(context.supabase, data.company_id, context.userId, data));
export const biRunReport = auth().inputValidator((d: { company_id: string; code: string; spec: ReportSpec; format?: string }) => d)
  .handler(async ({ data, context }): Promise<any> => reports.run(context.supabase, data.company_id, context.userId, data.code, data.spec, data.format ?? "json"));
export const biReportHistory = auth().inputValidator((d: { company_id: string; code?: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => reports.history(context.supabase, data.company_id, data.code, data.limit));

// Forecasts
export const biRevenueForecast = auth().inputValidator((d: { company_id: string; horizon_months?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => forecast.revenueForecast(context.supabase, data.company_id, context.userId, data.horizon_months ?? 6));
export const biForecastsList = auth().inputValidator((d: { company_id: string; scope?: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => forecast.list(context.supabase, data.company_id, data.scope, data.limit));

// Insights
export const biGenerateFounderInsight = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => insights.generateFounder(context.supabase, data.company_id));
export const biInsightsList = auth().inputValidator((d: { company_id: string; scope?: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => insights.list(context.supabase, data.company_id, data.scope, data.limit));

// Alerts
export const biEvaluateAlerts = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => alerts.evaluate(context.supabase, data.company_id));
export const biAlertsList = auth().inputValidator((d: { company_id: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => alerts.list(context.supabase, data.company_id, data.limit));
export const biAcknowledgeAlert = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<any> => alerts.acknowledge(context.supabase, data.id, context.userId));

// Search
export const biSearch = auth().inputValidator((d: { company_id: string; term: string; limit?: number }) => d)
  .handler(async ({ data, context }): Promise<any> => search.run(context.supabase, data.company_id, data.term, data.limit));
