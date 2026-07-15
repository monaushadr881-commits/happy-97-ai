/**
 * R11 — Credits Engine (server-only)
 *
 * Credits are platform usage units, NOT money.
 * Ledger is immutable; balance is always derived from v_credit_balances.
 * All mutations go through this engine.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export type CreditOwnerType = "user" | "company";

export type CreditEntryType =
  | "purchase"
  | "consume"
  | "refund"
  | "expire"
  | "transfer_in"
  | "transfer_out"
  | "bonus"
  | "referral"
  | "admin_grant"
  | "marketplace_usage"
  | "ai_usage"
  | "builder_usage"
  | "automation_usage";

const DEBIT_TYPES: readonly CreditEntryType[] = [
  "consume",
  "expire",
  "transfer_out",
  "ai_usage",
  "builder_usage",
  "marketplace_usage",
  "automation_usage",
];

export interface GrantInput {
  ownerType: CreditOwnerType;
  ownerId: string;
  amount: number;                 // positive integer units
  entryType: Extract<CreditEntryType, "purchase" | "bonus" | "referral" | "admin_grant" | "refund">;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  expiresAt?: string | null;      // ISO
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

export interface ConsumeInput {
  ownerType: CreditOwnerType;
  ownerId: string;
  amount: number;
  entryType: Extract<CreditEntryType, "consume" | "ai_usage" | "builder_usage" | "marketplace_usage" | "automation_usage">;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

export interface TransferInput {
  fromOwnerType: CreditOwnerType;
  fromOwnerId: string;
  toOwnerType: CreditOwnerType;
  toOwnerId: string;
  amount: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

export interface Balance {
  ownerType: CreditOwnerType;
  ownerId: string;
  balance: number;
  entryCount: number;
  lastEntryAt: string | null;
}

const LOW_BALANCE_THRESHOLD = 100;

function assertPositive(n: number, name = "amount") {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${name} must be a positive integer`);
}

export async function getBalance(
  sb: SB,
  ownerType: CreditOwnerType,
  ownerId: string,
): Promise<Balance> {
  const { data, error } = await sb
    .from("v_credit_balances")
    .select("owner_type, owner_id, balance, entry_count, last_entry_at")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return {
    ownerType,
    ownerId,
    balance: Number(data?.balance ?? 0),
    entryCount: Number(data?.entry_count ?? 0),
    lastEntryAt: (data?.last_entry_at as string | null) ?? null,
  };
}

async function findExisting(
  sb: SB,
  referenceType: string | undefined,
  referenceId: string | undefined,
  entryType: CreditEntryType,
) {
  if (!referenceType || !referenceId) return null;
  const { data } = await sb
    .from("credit_ledger_entries")
    .select("id")
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId)
    .eq("entry_type", entryType)
    .maybeSingle();
  return data?.id ?? null;
}

async function insertEntry(
  sb: SB,
  row: {
    owner_type: CreditOwnerType;
    owner_id: string;
    direction: "credit" | "debit";
    amount: number;
    entry_type: CreditEntryType;
    reference_type?: string | null;
    reference_id?: string | null;
    description?: string | null;
    expires_at?: string | null;
    metadata?: Record<string, unknown>;
    created_by?: string | null;
  },
) {
  const { data, error } = await sb
    .from("credit_ledger_entries")
    .insert({
      owner_type: row.owner_type,
      owner_id: row.owner_id,
      direction: row.direction,
      amount: row.amount,
      entry_type: row.entry_type,
      reference_type: row.reference_type ?? null,
      reference_id: row.reference_id ?? null,
      description: row.description ?? null,
      expires_at: row.expires_at ?? null,
      metadata: row.metadata ?? {},
      created_by: row.created_by ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function audit(
  sb: SB,
  action: string,
  entityId: string,
  metadata: Record<string, unknown>,
) {
  try {
    await sb.rpc("write_audit", {
      _category: "credits",
      _action: action,
      _entity_type: "credit_ledger_entries",
      _entity_id: entityId,
      _metadata: metadata as never,
    });
  } catch {
    // audit failures never break the ledger
  }
}

async function notify(
  sb: SB,
  ownerType: CreditOwnerType,
  ownerId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  if (ownerType !== "user") return;
  try {
    await sb.from("notifications").insert({
      user_id: ownerId,
      type: `credits.${event}`,
      title: `Credits ${event}`,
      body: JSON.stringify(payload),
      channel: "in_app",
      metadata: payload as never,
    });
  } catch {
    // best-effort
  }
}

export async function grant(sb: SB, input: GrantInput) {
  assertPositive(input.amount);
  const existing = await findExisting(sb, input.referenceType, input.referenceId, input.entryType);
  if (existing) return { id: existing, idempotent: true as const };

  const id = await insertEntry(sb, {
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    direction: "credit",
    amount: input.amount,
    entry_type: input.entryType,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    description: input.description,
    expires_at: input.expiresAt ?? null,
    metadata: input.metadata,
    created_by: input.actorId ?? null,
  });

  await audit(sb, `grant.${input.entryType}`, id, {
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    amount: input.amount,
    expires_at: input.expiresAt ?? null,
  });
  await notify(sb, input.ownerType, input.ownerId, "granted", {
    amount: input.amount,
    entry_type: input.entryType,
  });

  return { id, idempotent: false as const };
}

export async function consume(sb: SB, input: ConsumeInput) {
  assertPositive(input.amount);
  const existing = await findExisting(sb, input.referenceType, input.referenceId, input.entryType);
  if (existing) return { id: existing, idempotent: true as const, insufficient: false as const };

  const bal = await getBalance(sb, input.ownerType, input.ownerId);
  if (bal.balance < input.amount) {
    return { id: null, idempotent: false as const, insufficient: true as const, balance: bal.balance };
  }

  const id = await insertEntry(sb, {
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    direction: "debit",
    amount: input.amount,
    entry_type: input.entryType,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    description: input.description,
    metadata: input.metadata,
    created_by: input.actorId ?? null,
  });

  await audit(sb, `consume.${input.entryType}`, id, {
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    amount: input.amount,
  });

  const remaining = bal.balance - input.amount;
  await notify(sb, input.ownerType, input.ownerId, "consumed", {
    amount: input.amount,
    entry_type: input.entryType,
    remaining,
  });
  if (remaining < LOW_BALANCE_THRESHOLD) {
    await notify(sb, input.ownerType, input.ownerId, "low", { remaining });
  }

  return { id, idempotent: false as const, insufficient: false as const, remaining };
}

export async function refund(
  sb: SB,
  args: {
    ownerType: CreditOwnerType;
    ownerId: string;
    amount: number;
    referenceType: string;
    referenceId: string;
    description?: string;
    actorId?: string | null;
  },
) {
  return grant(sb, {
    ...args,
    entryType: "refund",
  });
}

export async function transfer(sb: SB, input: TransferInput) {
  assertPositive(input.amount);
  if (input.fromOwnerType === input.toOwnerType && input.fromOwnerId === input.toOwnerId) {
    throw new Error("Cannot transfer to the same owner");
  }

  const debitRef = input.referenceId ?? crypto.randomUUID();
  const debitType = input.referenceType ?? "credits.transfer";

  const existing = await findExisting(sb, debitType, debitRef, "transfer_out");
  if (existing) return { debitId: existing, creditId: null, idempotent: true as const };

  const bal = await getBalance(sb, input.fromOwnerType, input.fromOwnerId);
  if (bal.balance < input.amount) {
    return { debitId: null, creditId: null, idempotent: false as const, insufficient: true as const };
  }

  const debitId = await insertEntry(sb, {
    owner_type: input.fromOwnerType,
    owner_id: input.fromOwnerId,
    direction: "debit",
    amount: input.amount,
    entry_type: "transfer_out",
    reference_type: debitType,
    reference_id: debitRef,
    description: input.description,
    metadata: { ...(input.metadata ?? {}), to_owner_type: input.toOwnerType, to_owner_id: input.toOwnerId },
    created_by: input.actorId ?? null,
  });

  let creditId: string;
  try {
    creditId = await insertEntry(sb, {
      owner_type: input.toOwnerType,
      owner_id: input.toOwnerId,
      direction: "credit",
      amount: input.amount,
      entry_type: "transfer_in",
      reference_type: debitType,
      reference_id: debitRef,
      description: input.description,
      metadata: { ...(input.metadata ?? {}), from_owner_type: input.fromOwnerType, from_owner_id: input.fromOwnerId },
      created_by: input.actorId ?? null,
    });
  } catch (e) {
    // Compensating reversal on the source side.
    await insertEntry(sb, {
      owner_type: input.fromOwnerType,
      owner_id: input.fromOwnerId,
      direction: "credit",
      amount: input.amount,
      entry_type: "refund",
      reference_type: debitType,
      reference_id: debitRef,
      description: `Transfer reversal: ${(e as Error).message}`,
      metadata: { reversal_of: debitId },
      created_by: input.actorId ?? null,
    });
    throw e;
  }

  await audit(sb, "transfer", debitId, {
    from: { type: input.fromOwnerType, id: input.fromOwnerId },
    to: { type: input.toOwnerType, id: input.toOwnerId },
    amount: input.amount,
    credit_id: creditId,
  });

  return { debitId, creditId, idempotent: false as const };
}

/**
 * Sweep expired credit grants. For every expiring credit entry, insert
 * a matching debit `expire` entry (idempotent via reference to the source id).
 */
export async function expireDueGrants(sb: SB, batchSize = 200) {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("credit_ledger_entries")
    .select("id, owner_type, owner_id, amount, expires_at")
    .lte("expires_at", nowIso)
    .eq("direction", "credit")
    .limit(batchSize);
  if (error) throw error;

  let expired = 0;
  let skipped = 0;
  for (const row of data ?? []) {
    const existing = await findExisting(sb, "credit.expire.source", row.id as string, "expire");
    if (existing) { skipped++; continue; }
    try {
      await insertEntry(sb, {
        owner_type: row.owner_type as CreditOwnerType,
        owner_id: row.owner_id as string,
        direction: "debit",
        amount: Number(row.amount),
        entry_type: "expire",
        reference_type: "credit.expire.source",
        reference_id: row.id as string,
        description: "Credit grant expired",
        metadata: { source_expires_at: row.expires_at },
      });
      expired++;
      await notify(sb, row.owner_type as CreditOwnerType, row.owner_id as string, "expired", {
        amount: Number(row.amount),
      });
    } catch {
      skipped++;
    }
  }
  return { scanned: data?.length ?? 0, expired, skipped };
}

export const CREDITS_INTERNAL = { DEBIT_TYPES };
