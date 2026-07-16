
-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL
     AND _user_id <> auth.uid()
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'founder')
  THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END $$;

-- is_platform_founder
CREATE OR REPLACE FUNCTION public.is_platform_founder(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL
     AND _user_id <> auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM public.role_assignments ra
       JOIN public.roles r ON r.id = ra.role_id
       WHERE ra.user_id = auth.uid()
         AND ra.scope_type = 'platform'
         AND r.code IN ('founder','super_founder','board','super_admin')
         AND (ra.expires_at IS NULL OR ra.expires_at > now())
     )
  THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.role_assignments ra
    JOIN public.roles r ON r.id = ra.role_id
    WHERE ra.user_id = _user_id
      AND ra.scope_type = 'platform'
      AND r.code IN ('founder','super_founder','board','super_admin')
      AND (ra.expires_at IS NULL OR ra.expires_at > now())
  );
END $$;

-- is_ops_admin
CREATE OR REPLACE FUNCTION public.is_ops_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.is_platform_founder(auth.uid())
  THEN RETURN false; END IF;
  RETURN public.is_platform_founder(_user_id)
      OR public.user_has_permission(_user_id, 'platform.manage', 'platform', NULL);
END $$;

-- is_company_member
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL OR _company_id IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.is_platform_founder(auth.uid())
  THEN RETURN false; END IF;
  RETURN public.is_platform_founder(_user_id)
      OR EXISTS (SELECT 1 FROM public.employees e
                 WHERE e.user_id = _user_id AND e.company_id = _company_id AND e.status = 'active')
      OR EXISTS (SELECT 1 FROM public.role_assignments ra
                 WHERE ra.user_id = _user_id AND ra.scope_type = 'company'
                   AND ra.scope_id = _company_id
                   AND (ra.expires_at IS NULL OR ra.expires_at > now()));
END $$;

-- is_company_admin
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL OR _company_id IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.is_platform_founder(auth.uid())
  THEN RETURN false; END IF;
  RETURN public.is_platform_founder(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.role_assignments ra
        JOIN public.roles r ON r.id = ra.role_id
        WHERE ra.user_id = _user_id
          AND ra.scope_type = 'company'
          AND ra.scope_id = _company_id
          AND r.code IN ('company_admin','super_admin','founder')
          AND (ra.expires_at IS NULL OR ra.expires_at > now())
      );
END $$;

-- is_workspace_member
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL OR _workspace_id IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.is_platform_founder(auth.uid())
  THEN RETURN false; END IF;
  RETURN public.is_platform_founder(_user_id)
      OR EXISTS (SELECT 1 FROM public.workspace_memberships m
                 WHERE m.workspace_id = _workspace_id AND m.user_id = _user_id AND m.status = 'active')
      OR EXISTS (SELECT 1 FROM public.workspaces w
                 WHERE w.id = _workspace_id AND public.is_company_admin(_user_id, w.company_id));
END $$;

-- user_has_permission
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission_code text, _scope_type scope_type DEFAULT 'platform'::scope_type, _scope_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL OR _permission_code IS NULL THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.is_platform_founder(auth.uid())
  THEN RETURN false; END IF;
  RETURN public.is_platform_founder(_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.role_assignments ra
        JOIN public.role_permissions rp ON rp.role_id = ra.role_id
        JOIN public.permissions      p  ON p.id = rp.permission_id
        WHERE ra.user_id = _user_id
          AND p.code = _permission_code
          AND (ra.expires_at IS NULL OR ra.expires_at > now())
          AND (
            (ra.scope_type = 'platform')
            OR (ra.scope_type = _scope_type AND ra.scope_id = _scope_id)
          )
      );
END $$;
