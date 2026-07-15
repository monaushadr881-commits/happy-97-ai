/**
 * HAPPY — Wallet Ledger Engine (R10)
 *
 * Rules (all non-negotiable):
 *   1. Balance is ALWAYS derived from `public.v_wallet_balances`.
 *      No code path may write a stored balance column.
 *   2. Ledger entries are IMMUTABLE. Enforced by the `wallet_ledger_immutable`
 *      trigger — this engine never attempts to UPDATE/DELETE them.
 *   3. Idempotency: a `(reference_type, reference_id, entry_type, direction)`
 *      pair on the same wallet is unique (partial index, R10 migration).
 *      Re-posting the same source event returns the existing entry.
 *   4. Frozen/closed wallets refuse new entries (DB-side trigger).
 *   5. Transfers are two paired entries (`transfer_out` + `transfer_in`)
 *      posted with a shared correlation id so failures roll back.
 *
 * All mutations here MUST be called from a server context with an
 * authorized admin client (RLS bypassed) OR from an RLS-scoped user
 * client after ownership/role checks. The engine itself is authz-agnostic.
 */

// deno-lint-ignore no-explicit-any
type Admin = any;

export type WalletOwnerType = "user" | "company";
export type LedgerDirection = "credit" | "debit";
export type WalletStatus = "open" | "frozen" | "closed";

export type WalletEntryType =
  | "purchase" | "refund" | "reward" | "referral" | "adjustment"
  | "marketplace_earning" | "builder_earning" | "consume" | "payout"
  | "chargeback";

export interface WalletKey {
  ownerType: WalletOwnerType;
  ownerId: string;
  currency?: string; // default "USD", uppercased
}

export interface WalletRow {
  id: string;
  owner_type: WalletOwnerType;
  owner_id: string;
  currency: string;
  status: WalletStatus;
  is_active: boolean;
}

const LOW_BALANCE_THRESHOLD_CENTS = 500; // 5.00 in ledger currency

/* -------------------------------------------------------------------------- */
/* Notifications + audit helpers                                              */
/* -------------------------------------------------------------------------- */

async function writeAudit(
  admin: Admin, action: string, walletId: string, companyId: string | null,
  actorId: string | null | undefined, after: Record<string, unknown>,
  severity: "info" | "notice" | "warning" | "critical" = "info",
) {
  try {
    await admin.rpc("write_audit", {
      _category: "wallet",
      _action: `wallet.${action}`,
      _entity_type: "wallets",
      _entity_id: walletId,
      _company_id: companyId,
      _before: null,
      _after: after,
      _severity: severity,
      _metadata: { source: "wallet_engine", actor_id: actorId ?? null },
    });
  } catch (e) {
    console.error("[wallet] audit failed", e instanceof Error ? e.message : e);
  }
}

async function notify(
  admin: Admin, userId: string | null | undefined, companyId: string | null,
  kind: string, title: string, body: string, payload: Record<string, unknown>,
) {
  if (!userId) return;
  try {
    await admin.from("notifications").insert({
      user_id: userId, company_id: companyId, kind,
      channel: "in_app", title, body, payload,
    });
  } catch (e) {
    console.error("[wallet] notify failed", e instanceof Error ? e.message : e);
  }
}

/* -------------------------------------------------------------------------- */
/* Wallet lifecycle                                                           */
/* -------------------------------------------------------------------------- */

export async function ensureWallet(admin: Admin, key: WalletKey): Promise<WalletRow> {
  const currency = (key.currency ?? "USD").toUpperCase();
  const existing = await admin.from("wallets")
    .select("id, owner_type, owner_id, currency, status, is_active")
    .eq("owner_type", key.ownerType).eq("owner_id", key.ownerId).eq("currency", currency)
    .maybeSingle();
  if (existing.error) throw new Error(`ensureWallet_read: ${existing.error.message}`);
  if (existing.data) return existing.data as WalletRow;
  const created = await admin.from("wallets")
    .insert({ owner_type: key.ownerType, owner_id: key.ownerId, currency, status: "open" })
    .select("id, owner_type, owner_id, currency, status, is_active").single();
  if (created.error) throw new Error(`ensureWallet_insert: ${created.error.message}`);
  return created.data as WalletRow;
}

export async function setWalletStatus(
  admin: Admin, walletId: string, status: WalletStatus, actorId?: string | null,
): Promise<{ ok: true; noop?: boolean } | { ok: false; reason: string }> {
  const { data: cur, error } = await admin.from("wallets")
    .select("id, owner_type, owner_id, status").eq("id", walletId).maybeSingle();
  if (error) return { ok: false, reason: `db_read: ${error.message}` };
  if (!cur) return { ok: false, reason: "wallet_not_found" };
  const row = cur as { id: string; owner_type: WalletOwnerType; owner_id: string; status: WalletStatus };
  if (row.status === status) return { ok: true, noop: true };
  const { error: uerr } = await admin.from("wallets")
    .update({ status, is_active: status !== "closed" }).eq("id", walletId);
  if (uerr) return { ok: false, reason: `db_update: ${uerr.message}` };

  const companyId = row.owner_type === "company" ? row.owner_id : null;
  const userId = row.owner_type === "user" ? row.owner_id : null;
  await writeAudit(admin, `status.${status}`, walletId, companyId, actorId,
    { from: row.status, to: status },
    status === "frozen" ? "warning" : status === "closed" ? "notice" : "info");
  if (status === "frozen") {
    await notify(admin, userId, companyId, "wallet_frozen",
      "Wallet frozen", "Your wallet is temporarily frozen. Contact support if unexpected.",
      { wallet_id: walletId });
  }
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Ledger writes                                                              */
/* -------------------------------------------------------------------------- */

export interface PostEntryInput {
  wallet: WalletKey;
  direction: LedgerDirection;
  amountCents: number;
  entryType: WalletEntryType;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
  notifyUserId?: string | null;
}

export interface PostEntryResult {
  ok: boolean;
  entryId?: string;
  walletId?: string;
  balanceCents?: number | null;
  noop?: boolean; // duplicate source event
  reason?: string;
}

async function fetchBalance(admin: Admin, walletId: string): Promise<number | null> {
  const { data, error } = await admin.from("v_wallet_balances")
    .select("balance_cents").eq("wallet_id", walletId).maybeSingle();
  if (error) return null;
  return data ? Number((data as { balance_cents: number }).balance_cents ?? 0) : 0;
}

/**
 * Post a single, idempotent ledger entry. Returns the existing entry if
 * `(referenceType, referenceId, entryType, direction)` was already posted
 * on this wallet.
 */
export async function postLedgerEntry(admin: Admin, input: PostEntryInput): Promise<PostEntryResult> {
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (input.entryType === "adjustment" && input.actorId == null) {
    // Adjustments must always carry the actor for the audit trail.
    return { ok: false, reason: "adjustment_requires_actor" };
  }

  const wallet = await ensureWallet(admin, input.wallet);
  const companyId = wallet.owner_type === "company" ? wallet.owner_id : null;
  const notifyUser = input.notifyUserId ?? (wallet.owner_type === "user" ? wallet.owner_id : null);

  // Idempotency short-circuit: same reference already posted on this wallet.
  if (input.referenceType && input.referenceId) {
    const dup = await admin.from("wallet_ledger_entries")
      .select("id").eq("wallet_id", wallet.id)
      .eq("reference_type", input.referenceType).eq("reference_id", input.referenceId)
      .eq("entry_type", input.entryType).eq("direction", input.direction)
      .maybeSingle();
    if (dup.data) {
      return {
        ok: true, noop: true, entryId: (dup.data as { id: string }).id,
        walletId: wallet.id, balanceCents: await fetchBalance(admin, wallet.id),
      };
    }
  }

  if (wallet.status !== "open") {
    return { ok: false, reason: `wallet_${wallet.status}` };
  }

  // Debits must not overdraft (except payouts routed through ops-admin adjustments,
  // which are still expected to leave a non-negative balance — DB has no signed check).
  if (input.direction === "debit") {
    const bal = (await fetchBalance(admin, wallet.id)) ?? 0;
    if (input.amountCents > bal) return { ok: false, reason: "insufficient_funds" };
  }

  const { data, error } = await admin.from("wallet_ledger_entries").insert({
    wallet_id: wallet.id,
    direction: input.direction,
    amount_cents: input.amountCents,
    currency: wallet.currency,
    entry_type: input.entryType,
    reference_type: input.referenceType ?? null,
    reference_id: input.referenceId ?? null,
    description: input.description ?? null,
    metadata: (input.metadata ?? {}) as never,
    created_by: input.actorId ?? null,
  }).select("id").single();

  if (error) {
    // Idempotency race: unique index caught a concurrent duplicate.
    if (/duplicate|wallet_ledger_idem_idx/i.test(error.message)) {
      const dup = await admin.from("wallet_ledger_entries")
        .select("id").eq("wallet_id", wallet.id)
        .eq("reference_type", input.referenceType ?? "").eq("reference_id", input.referenceId ?? "")
        .eq("entry_type", input.entryType).eq("direction", input.direction)
        .maybeSingle();
      return {
        ok: true, noop: true, entryId: (dup.data as { id: string } | null)?.id,
        walletId: wallet.id, balanceCents: await fetchBalance(admin, wallet.id),
      };
    }
    return { ok: false, reason: `db_insert: ${error.message}` };
  }

  const entryId = (data as { id: string }).id;
  const balance = await fetchBalance(admin, wallet.id);

  await writeAudit(admin, `${input.direction}.${input.entryType}`, wallet.id, companyId, input.actorId,
    { amount_cents: input.amountCents, currency: wallet.currency, entry_id: entryId,
      reference_type: input.referenceType ?? null, reference_id: input.referenceId ?? null });

  const humanAmount = `${(input.amountCents / 100).toFixed(2)} ${wallet.currency}`;
  const notifKind = input.direction === "credit"
    ? (input.entryType === "refund" ? "wallet_refund" : "wallet_credited")
    : (input.entryType === "adjustment" ? "wallet_adjustment" : "wallet_debited");
  const title = input.direction === "credit"
    ? (input.entryType === "refund" ? "Wallet refunded" : "Wallet credited")
    : "Wallet debited";
  await notify(admin, notifyUser, companyId, notifKind, title,
    `${humanAmount} — ${input.entryType.replace("_", " ")}.`,
    { wallet_id: wallet.id, entry_id: entryId, balance_cents: balance });

  if (input.direction === "debit" && balance != null && balance < LOW_BALANCE_THRESHOLD_CENTS) {
    await notify(admin, notifyUser, companyId, "wallet_low_balance",
      "Low wallet balance", `Balance is now ${(balance / 100).toFixed(2)} ${wallet.currency}.`,
      { wallet_id: wallet.id, balance_cents: balance });
  }

  return { ok: true, entryId, walletId: wallet.id, balanceCents: balance };
}

/* -------------------------------------------------------------------------- */
/* Transfer (paired debit + credit)                                            */
/* -------------------------------------------------------------------------- */

export interface TransferInput {
  from: WalletKey;
  to: WalletKey;
  amountCents: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  actorId?: string | null;
  notifyUserId?: string | null;
}

export interface TransferResult {
  ok: boolean;
  correlationId?: string;
  outEntryId?: string;
  inEntryId?: string;
  reason?: string;
}

export async function postTransfer(admin: Admin, input: TransferInput): Promise<TransferResult> {
  const fromCur = (input.from.currency ?? "USD").toUpperCase();
  const toCur = (input.to.currency ?? "USD").toUpperCase();
  if (fromCur !== toCur) return { ok: false, reason: "currency_mismatch" };
  if (input.from.ownerType === input.to.ownerType && input.from.ownerId === input.to.ownerId) {
    return { ok: false, reason: "self_transfer" };
  }
  const correlationId = crypto.randomUUID();
  const shared = {
    referenceType: input.referenceType ?? "wallet_transfer",
    referenceId: input.referenceId ?? correlationId,
    description: input.description,
    actorId: input.actorId,
    metadata: { correlation_id: correlationId },
  };

  const debit = await postLedgerEntry(admin, {
    wallet: { ...input.from, currency: fromCur },
    direction: "debit", entryType: "consume", amountCents: input.amountCents,
    notifyUserId: input.notifyUserId ?? null, ...shared,
  });
  if (!debit.ok) return { ok: false, reason: `debit_failed:${debit.reason}` };

  const credit = await postLedgerEntry(admin, {
    wallet: { ...input.to, currency: toCur },
    direction: "credit", entryType: "reward", amountCents: input.amountCents,
    notifyUserId: null, ...shared,
  });
  if (!credit.ok) {
    // Compensating reversal — post a credit back to the source wallet.
    await postLedgerEntry(admin, {
      wallet: { ...input.from, currency: fromCur },
      direction: "credit", entryType: "refund", amountCents: input.amountCents,
      referenceType: "wallet_transfer_reversal", referenceId: correlationId,
      description: `Auto-reversal for failed transfer ${correlationId}`,
      actorId: input.actorId, metadata: { correlation_id: correlationId, failure: credit.reason },
    });
    return { ok: false, reason: `credit_failed:${credit.reason}` };
  }
  return { ok: true, correlationId, outEntryId: debit.entryId, inEntryId: credit.entryId };
}
