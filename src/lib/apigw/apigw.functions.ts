// R32 HAPPY Enterprise API Gateway — server function surface
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  apiRegister, apiList, apiGet, apiDeprecate, routeUpsert,
  apiKeyIssue, apiKeyRevoke, apiKeyRotate, apiKeyList, apiKeyVerify,
  rateLimitCheck, usageLog, usageStats,
  webhookEndpointCreate, webhookEndpointList, webhookEndpointToggle,
  webhookEmit, webhookDispatchDue, webhookReplay,
  webhookInboundRecord, webhookInboundVerifyHmac,
  connectorsList, connectionEnable, connectionDisable, connectionsList, connectionHealth,
  openApiGenerate, sdkSnippet, gatewayHealth,
  type ApiRegisterInput, type RouteInput, type KeyIssueInput, type WebhookEndpointInput, type SdkLang, type ApiKind, type UsageLogInput,
} from "./engine";

// ----- registry -----
export const gwApiRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ApiRegisterInput) => d)
  .handler(async ({ data, context }) => apiRegister(context.supabase, context.userId, data));

export const gwApiList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; kind?: ApiKind; status?: string }) => d ?? {})
  .handler(async ({ data, context }) => apiList(context.supabase, context.userId, data));

export const gwApiGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => apiGet(context.supabase, context.userId, data.id));

export const gwApiDeprecate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; successor_id?: string }) => d)
  .handler(async ({ data, context }) => apiDeprecate(context.supabase, context.userId, data.id, data.successor_id));

export const gwRouteUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RouteInput) => d)
  .handler(async ({ data, context }) => routeUpsert(context.supabase, context.userId, data));

// ----- keys -----
export const gwKeyIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: KeyIssueInput) => d)
  .handler(async ({ data, context }) => apiKeyIssue(context.supabase, context.userId, data));

export const gwKeyRevoke = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => apiKeyRevoke(context.supabase, context.userId, data.id, data.reason));

export const gwKeyRotate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => apiKeyRotate(context.supabase, context.userId, data.id));

export const gwKeyList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; include_revoked?: boolean }) => d)
  .handler(async ({ data, context }) => apiKeyList(context.supabase, context.userId, data));

export const gwKeyVerify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { raw: string; required_scope?: string; api_id?: string }) => d)
  .handler(async ({ data, context }) => JSON.parse(JSON.stringify(await apiKeyVerify(context.supabase, data.raw, { required_scope: data.required_scope, api_id: data.api_id }))) as { ok: boolean; reason?: string });

// ----- rate limit / usage -----
export const gwRateLimitCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope_key: string; limit_per_min: number }) => d)
  .handler(async ({ data, context }) => rateLimitCheck(context.supabase, data.scope_key, data.limit_per_min));

export const gwUsageLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: UsageLogInput) => d)
  .handler(async ({ data, context }) => { await usageLog(context.supabase, data); return { ok: true }; });

export const gwUsageStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; window_min?: number }) => d)
  .handler(async ({ data, context }) => usageStats(context.supabase, context.userId, data));

// ----- webhooks outgoing -----
export const gwWebhookCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: WebhookEndpointInput) => d)
  .handler(async ({ data, context }) => webhookEndpointCreate(context.supabase, context.userId, data));

export const gwWebhookList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => webhookEndpointList(context.supabase, context.userId, data));

export const gwWebhookToggle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean; reason?: string }) => d)
  .handler(async ({ data, context }) => webhookEndpointToggle(context.supabase, context.userId, data.id, data.active, data.reason));

export const gwWebhookEmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; event_type: string; event_id?: string; payload: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => webhookEmit(context.supabase, data));

export const gwWebhookDispatchDue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number }) => d ?? {})
  .handler(async ({ data, context }) => webhookDispatchDue(context.supabase, data));

export const gwWebhookReplay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { delivery_id: string }) => d)
  .handler(async ({ data, context }) => webhookReplay(context.supabase, context.userId, data.delivery_id));

// ----- webhooks incoming -----
export const gwWebhookInboundRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string | null; source: string; event_type?: string; event_id: string; signature?: string | null; verified: boolean; payload: Record<string, unknown>; headers?: Record<string, string> }) => d)
  .handler(async ({ data, context }) => webhookInboundRecord(context.supabase, data));

export const gwWebhookInboundVerifyHmac = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { secret: string; signature: string; raw_body: string }) => d)
  .handler(async ({ data }) => ({ valid: await webhookInboundVerifyHmac(data.secret, data.signature, data.raw_body) }));

// ----- connectors -----
export const gwConnectorsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => connectorsList(context.supabase, context.userId));

export const gwConnectionEnable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; connector_code: string; name: string; credentials_ref?: string; scopes?: string[]; config?: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => connectionEnable(context.supabase, context.userId, data));

export const gwConnectionDisable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => connectionDisable(context.supabase, context.userId, data.id));

export const gwConnectionsList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => connectionsList(context.supabase, context.userId, data));

export const gwConnectionHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => connectionHealth(context.supabase, context.userId, data.id));

// ----- OpenAPI / SDK -----
export const gwOpenApiGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { api_id: string }) => d)
  .handler(async ({ data, context }) => JSON.parse(JSON.stringify(await openApiGenerate(context.supabase, context.userId, data.api_id))) as { openapi: string });

export const gwSdkSnippet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { api_id: string; language: SdkLang }) => d)
  .handler(async ({ data, context }) => sdkSnippet(context.supabase, context.userId, data.api_id, data.language));

// ----- health -----
export const gwHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => gatewayHealth(context.supabase, context.userId, data));
