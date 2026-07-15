/**
 * HAPPY — Subscription Lifecycle Engine (R9)
 *
 * Deterministic state machine for public.subscriptions.
 *
 * States:  trial | active | past_due | paused | cancelled | expired
 * Actions: create | activate | renew | pause | resume | cancel |
 *          cancel_at_period_end | expire | change_plan |
 *          trial_start | trial_end | payment_failed | payment_recovered
 *
 * Every accepted transition:
 *   - Updates the subscription row (only owned columns)
 *   - Inserts an immutable public.subscription_events row
 *   - Writes a public.audit_logs entry
 *   - Fires an in-app notification (best effort)
 *
 * Every transition is idempotent: re-issuing the same action on a
 * subscription already in the target state returns { ok: true, noop: true }
 * without side effects. This makes the engine safe to call from webhooks,
 * retries, cron ticks, and manual ops recovery paths.
 *
 * NEVER activate a subscription outside this engine. NEVER extend
 * current_period_end outside `renew` or `change_plan` here.
 */

// deno-lint-ignore no-explicit-any
type Admin = any;

export type SubStatus =
  | "trial" | "active" | "past_due" | "paused" | "cancelled" | "expired";

export type SubAction =
  | "create"
  | "activate"
  | "renew"
  | "pause"
  | "resume"
  | "cancel"
  | "cancel_at_period_end"
  | "expire"
  | "change_plan"
  | "trial_start"
  | "trial_end"
  | "payment_failed"
  | "payment_recovered";

export type SubEventType =
  | "created" | "trial_started" | "activated" | "renewed"
  | "upgraded" | "downgraded" | "paused" | "resumed"
  | "cancelled" | "expired" | "payment_failed";

export interface TransitionInput {
  subscriptionId: string;
  action: SubAction;
  actorId?: string | null;
  /** For renew / change_plan / activate. */
  nextPeriodEnd?: string | null;
  /** For change_plan. */
  toPlanId?: string;
  /** For cancel_at_period_end. */
  cancelAt?: string;
  /** Provider correlation carried onto the event/audit rows. */
  provider?: string | null;
  providerRef?: string | null;
  /** Freeform metadata attached to the subscription_events row. */
  metadata?: Record<string, unknown>;
  /** Optional addressable user for the notification. */
  notifyUserId?: string | null;
}

export interface TransitionResult {
  ok: boolean;
  noop?: boolean;
  from?: SubStatus;
  to?: SubStatus;
  eventType?: SubEventType;
  reason?: string;
}

/** Allowed source states per action. Guards the state machine. */
const ALLOWED_FROM: Record<SubAction, SubStatus[] | "any"> = {
  create:                 [],              // handled by createSubscription()
  activate:               ["trial", "past_due", "paused"],
  renew:                  ["active", "trial", "past_due"],
  pause:                  ["active", "trial"],
  resume:                 ["paused"],
  cancel:                 ["trial", "active", "past_due", "paused"],
  cancel_at_period_end:   ["trial", "active", "past_due"],
  expire:                 ["active", "trial", "past_due", "paused"],
  change_plan:            ["trial", "active", "past_due"],
  trial_start:            ["trial"],
  trial_end:              ["trial"],
  payment_failed:         ["active", "trial"],
  payment_recovered:      ["past_due"],
};

function computeTargetState(action: SubAction, current: SubStatus): SubStatus {
  switch (action) {
    case "activate":              return "active";
    case "renew":                 return "active";
    case "pause":                 return "paused";
    case "resume":                return "active";
    case "cancel":                return "cancelled";
    case "cancel_at_period_end":  return current; // status unchanged until tick
    case "expire":                return "expired";
    case "change_plan":           return current === "trial" ? "trial" : "active";
    case "trial_start":           return "trial";
    case "trial_end":             return "past_due";
    case "payment_failed":        return "past_due";
    case "payment_recovered":     return "active";
    default:                      return current;
  }
}

function eventTypeFor(action: SubAction, fromPlanPrice: number | null, toPlanPrice: number | null): SubEventType {
  switch (action) {
    case "activate":              return "activated";
    case "renew":                 return "renewed";
    case "pause":                 return "paused";
    case "resume":                return "resumed";
    case "cancel":
    case "cancel_at_period_end":  return "cancelled";
    case "expire":                return "expired";
    case "trial_start":           return "trial_started";
    case "trial_end":             return "expired"; // logical end of trial period
    case "payment_failed":        return "payment_failed";
    case "payment_recovered":     return "renewed";
    case "change_plan":
      if (fromPlanPrice != null && toPlanPrice != null) {
        return toPlanPrice > fromPlanPrice ? "upgraded" : "downgraded";
      }
      return "upgraded";
    case "create":                return "created";
  }
}

async function writeAudit(
  admin: Admin, action: string, subId: string, companyId: string,
  actorId: string | null | undefined, after: Record<string, unknown>,
  severity: "info" | "notice" | "warning" | "critical" = "info",
) {
  try {
    await admin.rpc("write_audit", {
      _category: "subscription",
      _action: `subscription.${action}`,
      _entity_type: "subscriptions",
      _entity_id: subId,
      _company_id: companyId,
      _before: null,
      _after: after,
      _severity: severity,
      _metadata: { source: "lifecycle_engine", actor_id: actorId ?? null },
    });
  } catch (e) {
    console.error("[subs] audit failed", e instanceof Error ? e.message : e);
  }
}

async function notify(
  admin: Admin, userId: string | null | undefined, companyId: string,
  kind: string, title: string, body: string, payload: Record<string, unknown>,
) {
  if (!userId) return;
  try {
    await admin.from("notifications").insert({
      user_id: userId, company_id: companyId, kind,
      channel: "in_app", title, body, payload,
    });
  } catch (e) {
    console.error("[subs] notify failed", e instanceof Error ? e.message : e);
  }
}

/**
 * Create a new subscription. Enforces one-open-subscription-per-company:
 * refuses if an active/trial/past_due/paused subscription already exists.
 */
export async function createSubscription(
  admin: Admin,
  args: {
    companyId: string;
    planId: string;
    seats?: number;
    currency?: string;
    trialDays?: number;
    autoRenew?: boolean;
    provider?: string | null;
    providerRef?: string | null;
    actorId?: string | null;
    notifyUserId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const { data: existing, error: exErr } = await admin
    .from("subscriptions")
    .select("id")
    .eq("company_id", args.companyId)
    .in("status", ["active", "trial", "past_due", "paused"])
    .maybeSingle();
  if (exErr) return { ok: false, reason: `db_read_failed:${exErr.message}` };
  if (existing) return { ok: false, reason: "subscription_already_open" };

  const { data: plan, error: planErr } = await admin
    .from("plans").select("id, price_cents, currency, trial_days")
    .eq("id", args.planId).maybeSingle();
  if (planErr) return { ok: false, reason: `db_read_failed:${planErr.message}` };
  if (!plan) return { ok: false, reason: "plan_not_found" };

  const now = new Date();
  const trialDays = args.trialDays ?? (plan as { trial_days: number }).trial_days ?? 0;
  const isTrial = trialDays > 0;
  const trialEnds = isTrial ? new Date(now.getTime() + trialDays * 86_400_000).toISOString() : null;

  const insertRow = {
    company_id: args.companyId,
    plan_id: args.planId,
    status: isTrial ? "trial" : "active",
    currency: (args.currency ?? (plan as { currency: string }).currency ?? "USD").toUpperCase(),
    seats: args.seats ?? 1,
    trial_ends_at: trialEnds,
    current_period_start: now.toISOString(),
    current_period_end: trialEnds, // filled by first renew on paid activation
    auto_renew: args.autoRenew ?? true,
    provider: args.provider ?? null,
    provider_ref: args.providerRef ?? null,
    metadata: (args.metadata ?? {}) as never,
  };
  const { data: sub, error: insErr } = await admin
    .from("subscriptions").insert(insertRow).select("id").single();
  if (insErr) return { ok: false, reason: `db_insert_failed:${insErr.message}` };

  const subId = (sub as { id: string }).id;
  await admin.from("subscription_events").insert({
    subscription_id: subId,
    event_type: isTrial ? "trial_started" : "created",
    to_plan_id: args.planId,
    actor_id: args.actorId ?? null,
    metadata: { provider: args.provider ?? null, provider_ref: args.providerRef ?? null },
  });
  await writeAudit(admin, isTrial ? "trial_started" : "created", subId, args.companyId,
    args.actorId, { plan_id: args.planId, is_trial: isTrial });
  await notify(admin, args.notifyUserId ?? null, args.companyId,
    isTrial ? "subscription_trial_started" : "subscription_created",
    isTrial ? "Trial started" : "Subscription active",
    isTrial ? `Your trial is active until ${trialEnds}.` : "Your subscription is now active.",
    { subscription_id: subId, plan_id: args.planId });

  return { ok: true, id: subId };
}

/** Apply a single lifecycle transition to an existing subscription. */
export async function transitionSubscription(
  admin: Admin, input: TransitionInput,
): Promise<TransitionResult> {
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("id, company_id, plan_id, status, current_period_end, cancel_at, trial_ends_at, auto_renew")
    .eq("id", input.subscriptionId)
    .maybeSingle();
  if (error) return { ok: false, reason: `db_read_failed:${error.message}` };
  if (!sub) return { ok: false, reason: "subscription_not_found" };

  const row = sub as {
    id: string; company_id: string; plan_id: string; status: SubStatus;
    current_period_end: string | null; cancel_at: string | null;
    trial_ends_at: string | null; auto_renew: boolean;
  };

  const allowed = ALLOWED_FROM[input.action];
  if (allowed === "any" || allowed.includes(row.status)) { /* ok */ }
  else if (input.action === "create") {
    return { ok: false, reason: "use_createSubscription" };
  } else {
    // Idempotent short-circuit when the caller re-requests the current end-state.
    const targetIfApplied = computeTargetState(input.action, row.status);
    if (targetIfApplied === row.status) {
      return { ok: true, noop: true, from: row.status, to: row.status };
    }
    return { ok: false, reason: `invalid_transition_from_${row.status}` };
  }

  const target = computeTargetState(input.action, row.status);

  // Idempotency: same target state for non-renewing actions is a no-op.
  const isRefreshingAction =
    input.action === "renew" || input.action === "change_plan" || input.action === "cancel_at_period_end";
  if (target === row.status && !isRefreshingAction) {
    return { ok: true, noop: true, from: row.status, to: target };
  }

  // Build the update patch.
  const patch: Record<string, unknown> = { status: target };
  if (input.provider) patch.provider = input.provider;
  if (input.providerRef) patch.provider_ref = input.providerRef;

  if (input.action === "renew" || input.action === "activate") {
    if (input.nextPeriodEnd) {
      patch.current_period_start = new Date().toISOString();
      patch.current_period_end = input.nextPeriodEnd;
    }
    patch.cancel_at = null;
    patch.cancelled_at = null;
  }
  if (input.action === "cancel") {
    patch.cancelled_at = new Date().toISOString();
    patch.cancel_at = null;
    patch.auto_renew = false;
  }
  if (input.action === "cancel_at_period_end") {
    patch.cancel_at = input.cancelAt ?? row.current_period_end ?? new Date().toISOString();
    patch.auto_renew = false;
  }
  if (input.action === "expire") {
    patch.auto_renew = false;
  }
  if (input.action === "payment_recovered") {
    patch.cancel_at = null;
  }

  // Plan change: read prices for upgrade/downgrade classification.
  let fromPlanPrice: number | null = null;
  let toPlanPrice: number | null = null;
  let fromPlanId: string | null = null;
  let toPlanId: string | null = null;
  if (input.action === "change_plan") {
    if (!input.toPlanId) return { ok: false, reason: "missing_to_plan_id" };
    const [{ data: pFrom }, { data: pTo }] = await Promise.all([
      admin.from("plans").select("id, price_cents").eq("id", row.plan_id).maybeSingle(),
      admin.from("plans").select("id, price_cents").eq("id", input.toPlanId).maybeSingle(),
    ]);
    if (!pTo) return { ok: false, reason: "to_plan_not_found" };
    fromPlanPrice = ((pFrom ?? {}) as { price_cents?: number }).price_cents ?? null;
    toPlanPrice = ((pTo ?? {}) as { price_cents?: number }).price_cents ?? null;
    fromPlanId = row.plan_id;
    toPlanId = input.toPlanId;
    patch.plan_id = input.toPlanId;
    if (input.nextPeriodEnd) patch.current_period_end = input.nextPeriodEnd;
  }

  const { error: updErr } = await admin.from("subscriptions").update(patch).eq("id", row.id);
  if (updErr) return { ok: false, reason: `db_update_failed:${updErr.message}` };

  const eventType = eventTypeFor(input.action, fromPlanPrice, toPlanPrice);
  await admin.from("subscription_events").insert({
    subscription_id: row.id,
    event_type: eventType,
    from_plan_id: fromPlanId,
    to_plan_id: toPlanId,
    actor_id: input.actorId ?? null,
    metadata: {
      action: input.action,
      provider: input.provider ?? null,
      provider_ref: input.providerRef ?? null,
      next_period_end: input.nextPeriodEnd ?? null,
      cancel_at: input.cancelAt ?? null,
      ...(input.metadata ?? {}),
    },
  });

  const severity: "info" | "notice" | "warning" =
    input.action === "payment_failed" || input.action === "expire" ? "warning" :
    input.action === "cancel" || input.action === "cancel_at_period_end" ? "notice" : "info";
  await writeAudit(admin, eventType, row.id, row.company_id, input.actorId,
    { from: row.status, to: target, action: input.action, plan_id: toPlanId ?? row.plan_id }, severity);

  await notify(admin, input.notifyUserId ?? null, row.company_id,
    `subscription_${eventType}`,
    `Subscription ${eventType.replace("_", " ")}`,
    `Your subscription is now "${target}".`,
    { subscription_id: row.id, action: input.action, from: row.status, to: target });

  return { ok: true, from: row.status, to: target, eventType };
}
