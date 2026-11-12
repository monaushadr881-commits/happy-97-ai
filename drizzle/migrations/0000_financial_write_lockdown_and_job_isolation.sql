-- Extends existing credit ledger, marketplace purchases, queue and audit owners; no duplicate engines.
-- Fail closed: authenticated financial writes are disabled until reviewed governed server writers exist.
ALTER POLICY credit_ledger_insert ON public.credit_ledger_entries WITH CHECK (false);
ALTER POLICY listing_purchases_buyer_write ON public.listing_purchases WITH CHECK (false);
REVOKE INSERT, UPDATE, DELETE ON public.credit_ledger_entries FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.listing_purchases FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.job_queue FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.job_queue FROM authenticated;
ALTER POLICY jq_scope ON public.job_queue USING (
  (company_id IS NULL AND public.is_platform_founder(auth.uid()))
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);
COMMENT ON POLICY credit_ledger_insert ON public.credit_ledger_entries IS 'Direct financial writes denied; only reviewed governed server-authoritative writers may post credits.';
COMMENT ON POLICY listing_purchases_buyer_write ON public.listing_purchases IS 'Buyers cannot fabricate payment or entitlement evidence; direct authenticated purchase writes denied.';
CREATE FUNCTION public.audit_financial_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE before_row jsonb; after_row jsonb; actor uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN before_row := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN after_row := to_jsonb(NEW); END IF;
  actor := auth.uid();
  INSERT INTO public.audit_logs(actor_id, category, action, entity_type, entity_id, before_data, after_data, severity, metadata)
  VALUES (actor, 'financial.security', lower(TG_OP), TG_TABLE_NAME,
    (COALESCE(after_row, before_row)->>'id')::uuid, before_row, after_row, 'notice',
    jsonb_build_object('source', 'financial_write_lockdown', 'database_role', current_setting('role', true)));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_financial_mutation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_financial_security_audit AFTER INSERT OR UPDATE OR DELETE ON public.credit_ledger_entries FOR EACH ROW EXECUTE FUNCTION public.audit_financial_mutation();
CREATE TRIGGER trg_financial_security_audit AFTER INSERT OR UPDATE OR DELETE ON public.listing_purchases FOR EACH ROW EXECUTE FUNCTION public.audit_financial_mutation();