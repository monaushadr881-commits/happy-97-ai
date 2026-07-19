
REVOKE ALL ON FUNCTION public.r183_shadow_audit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.r183_shadow_audit() FROM anon;
REVOKE ALL ON FUNCTION public.r183_shadow_audit() FROM authenticated;
-- Trigger execution is unaffected by these revokes.
