REVOKE EXECUTE ON FUNCTION public.is_ops_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_ops_admin(uuid) TO service_role;