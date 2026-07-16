
-- 1. Security Definer View → security_invoker (preserve original definition)
DROP VIEW IF EXISTS public.v_credit_totals CASCADE;
CREATE VIEW public.v_credit_totals
WITH (security_invoker = on) AS
SELECT owner_type,
       owner_id,
       COALESCE(sum(CASE WHEN direction = 'credit'::ledger_direction
                          AND (entry_type <> ALL (ARRAY['expire'::credit_entry_type,'transfer_out'::credit_entry_type,'consume'::credit_entry_type,'refund'::credit_entry_type,'ai_usage'::credit_entry_type,'builder_usage'::credit_entry_type,'marketplace_usage'::credit_entry_type,'automation_usage'::credit_entry_type]))
                         THEN amount ELSE 0::bigint END), 0::numeric)::bigint AS issued,
       COALESCE(sum(CASE WHEN entry_type = ANY (ARRAY['consume'::credit_entry_type,'ai_usage'::credit_entry_type,'builder_usage'::credit_entry_type,'marketplace_usage'::credit_entry_type,'automation_usage'::credit_entry_type])
                         THEN amount ELSE 0::bigint END), 0::numeric)::bigint AS consumed,
       COALESCE(sum(CASE WHEN entry_type = 'expire'::credit_entry_type  THEN amount ELSE 0::bigint END), 0::numeric)::bigint AS expired,
       COALESCE(sum(CASE WHEN entry_type = 'refund'::credit_entry_type  THEN amount ELSE 0::bigint END), 0::numeric)::bigint AS refunded
FROM public.credit_ledger_entries
GROUP BY owner_type, owner_id;

GRANT SELECT ON public.v_credit_totals TO authenticated;
GRANT SELECT ON public.v_credit_totals TO service_role;

-- 2. Tighten permissive RLS on apigw_rate_counters
DROP POLICY IF EXISTS "apigw_rate_counters all" ON public.apigw_rate_counters;
CREATE POLICY "rate_counters service only"
  ON public.apigw_rate_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Trigger function — not meant to be RPC-callable
REVOKE EXECUTE ON FUNCTION public.grant_founder_for_verified_identity() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_founder_for_verified_identity() FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_founder_for_verified_identity() FROM authenticated;
