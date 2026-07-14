-- Fix search_path on trigger functions
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.audit_logs_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'audit_logs are immutable'; END; $$;

-- Revoke anon EXECUTE on definer helpers; keep authenticated + service_role
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'is_platform_founder(uuid)',
    'is_company_member(uuid, uuid)',
    'is_company_admin(uuid, uuid)',
    'is_workspace_member(uuid, uuid)',
    'user_has_permission(uuid, text, public.scope_type, uuid)',
    'get_effective_setting(text, uuid, uuid, uuid, uuid, uuid)',
    'write_audit(text, text, text, uuid, uuid, jsonb, jsonb, public.audit_severity, jsonb)'
  ]) LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT  EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
  END LOOP;
END $$;