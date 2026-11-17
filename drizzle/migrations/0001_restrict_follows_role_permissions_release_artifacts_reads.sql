DROP POLICY IF EXISTS fol_read ON public.follows;
CREATE POLICY fol_read ON public.follows FOR SELECT TO authenticated
  USING (follower_id = auth.uid() OR followee_id = auth.uid());
REVOKE SELECT ON public.follows FROM anon;

DROP POLICY IF EXISTS role_perms_read ON public.role_permissions;
CREATE POLICY role_perms_read ON public.role_permissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_permissions.role_id
    AND (r.company_id IS NULL OR public.is_company_member(auth.uid(), r.company_id))));

DROP POLICY IF EXISTS ra_read ON public.release_artifacts;
CREATE POLICY ra_read ON public.release_artifacts FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()) OR created_by = auth.uid());