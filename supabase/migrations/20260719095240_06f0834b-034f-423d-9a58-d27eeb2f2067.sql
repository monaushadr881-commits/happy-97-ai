
-- R183 Phase C — Universal shadow-audit trigger.
-- Records one canonical audit line per mutation on high-risk tables.
-- Fail-open: never blocks the underlying write.

CREATE OR REPLACE FUNCTION public.r183_shadow_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_before jsonb;
  v_after jsonb;
  v_entity_id uuid;
BEGIN
  BEGIN
    v_actor := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after  := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after  := to_jsonb(NEW);
  ELSE
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);
  END IF;

  BEGIN
    v_entity_id := (COALESCE(v_after, v_before)->>'id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_entity_id := NULL;
  END;

  BEGIN
    INSERT INTO public.audit_logs
      (actor_id, category, action, entity_type, entity_id,
       before_data, after_data, severity, metadata)
    VALUES
      (v_actor,
       'r183_shadow_audit',
       lower(TG_OP),
       TG_TABLE_NAME,
       v_entity_id,
       v_before,
       v_after,
       'info',
       jsonb_build_object(
         'schema', TG_TABLE_SCHEMA,
         'trigger', TG_NAME,
         'phase', 'r183_phase_c'
       ));
  EXCEPTION WHEN OTHERS THEN
    -- Fail-open: never break the underlying mutation.
    NULL;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to high-risk mission-critical tables.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'project_deployments',
    'project_domains',
    'creator_projects',
    'cms_contents',
    'invoices',
    'payments',
    'subscriptions',
    'wallets',
    'release_records',
    'release_rollouts',
    'release_store_submissions',
    'deploy_builds',
    'deploy_artifacts'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_r183_shadow_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_r183_shadow_audit
           AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.r183_shadow_audit()',
        t
      );
    END IF;
  END LOOP;
END $$;
