
-- Fix mutable search_path on helper
CREATE OR REPLACE FUNCTION public._hxp_attach_touch(_tbl regclass)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE trig_name text;
BEGIN
  trig_name := 'trg_touch_' || replace(_tbl::text, 'public.', '');
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trig_name, _tbl);
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', trig_name, _tbl);
END $$;
REVOKE ALL ON FUNCTION public._hxp_attach_touch(regclass) FROM PUBLIC;

-- Move the vector extension out of public
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION vector SET SCHEMA extensions;
