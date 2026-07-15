
-- R11 Credits Engine: idempotency + expiry sweep support

-- Idempotency: unique index on (reference_type, reference_id, entry_type) when set
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_idem_idx
  ON public.credit_ledger_entries (reference_type, reference_id, entry_type)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;

-- Expiry lookup index
CREATE INDEX IF NOT EXISTS credit_ledger_expires_idx
  ON public.credit_ledger_entries (expires_at)
  WHERE expires_at IS NOT NULL AND direction = 'credit';

-- Available (non-expired credit) balance view already exists as v_credit_balances.
-- Add a lifetime view (ignore expiry) for analytics.
CREATE OR REPLACE VIEW public.v_credit_totals AS
SELECT
  owner_type,
  owner_id,
  COALESCE(SUM(CASE WHEN direction = 'credit' AND entry_type NOT IN ('expire','transfer_out','consume','refund','ai_usage','builder_usage','marketplace_usage','automation_usage') THEN amount ELSE 0 END), 0)::bigint AS issued,
  COALESCE(SUM(CASE WHEN entry_type IN ('consume','ai_usage','builder_usage','marketplace_usage','automation_usage') THEN amount ELSE 0 END), 0)::bigint AS consumed,
  COALESCE(SUM(CASE WHEN entry_type = 'expire' THEN amount ELSE 0 END), 0)::bigint AS expired,
  COALESCE(SUM(CASE WHEN entry_type = 'refund' THEN amount ELSE 0 END), 0)::bigint AS refunded
FROM public.credit_ledger_entries
GROUP BY owner_type, owner_id;

GRANT SELECT ON public.v_credit_totals TO authenticated, service_role;
