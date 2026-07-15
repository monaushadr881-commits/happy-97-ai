/**
 * HAPPY — Financial Foundation server functions (v1).
 *
 * Thin authenticated RPC wrappers over financialService. All calls run
 * under the caller's Supabase session; RLS enforces scope.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { financialService } from "@/services";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const finListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => financialService.listPlans(svc(context))));

export const finListSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i ?? {})
  .handler(async ({ data, context }) => guard(() => financialService.listSubscriptions(svc(context), data)));

export const finSubscriptionOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => financialService.subscriptionOverview(svc(context))));

export const finListWallets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => financialService.listWallets(svc(context))));

export const finEnsureUserWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { currency?: string })
  .handler(async ({ data, context }) =>
    guard(() => financialService.ensureWallet(svc(context), {
      owner_type: "user", owner_id: context.userId, currency: data?.currency ?? "USD",
    })));

export const finWalletLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { wallet_id: string })
  .handler(async ({ data, context }) => guard(() => financialService.walletLedger(svc(context), data.wallet_id)));

export const finCreditBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { owner_type?: "user"|"company"; owner_id?: string })
  .handler(async ({ data, context }) => guard(() => financialService.creditBalance(svc(context), {
    owner_type: data.owner_type ?? "user",
    owner_id: data.owner_id ?? context.userId,
  })));

export const finCreditLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { owner_type?: "user"|"company"; owner_id?: string; limit?: number })
  .handler(async ({ data, context }) => guard(() => financialService.creditLedger(svc(context), {
    owner_type: data.owner_type ?? "user",
    owner_id: data.owner_id ?? context.userId,
    limit: data.limit ?? 100,
  })));

export const finFounderOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => financialService.founderOverview(svc(context))));
