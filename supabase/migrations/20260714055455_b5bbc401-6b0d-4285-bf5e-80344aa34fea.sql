-- ============================================================================
-- HAPPY X — Phase 2: Enterprise Foundation
-- Multi-tenant schema: companies, brands, workspaces, RBAC, settings, audit.
-- ============================================================================

-- ---------- ENUMS ----------------------------------------------------------
CREATE TYPE public.scope_type AS ENUM (
  'platform', 'company', 'brand', 'workspace', 'department', 'team'
);

CREATE TYPE public.entity_status AS ENUM ('active', 'inactive', 'archived', 'suspended');

CREATE TYPE public.membership_status AS ENUM ('invited', 'active', 'suspended', 'removed');

CREATE TYPE public.audit_severity AS ENUM ('info', 'notice', 'warning', 'critical');

-- ---------- COMPANIES ------------------------------------------------------
CREATE TABLE public.companies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  legal_name   text NOT NULL,
  display_name text NOT NULL,
  tagline      text,
  logo_url     text,
  website      text,
  country      text,
  timezone     text NOT NULL DEFAULT 'UTC',
  status       public.entity_status NOT NULL DEFAULT 'active',
  owner_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX companies_owner_idx ON public.companies(owner_id);
CREATE INDEX companies_status_idx ON public.companies(status);

-- ---------- BRANDS ---------------------------------------------------------
CREATE TABLE public.brands (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug         text NOT NULL,
  name         text NOT NULL,
  tagline      text,
  logo_url     text,
  primary_color text,
  status       public.entity_status NOT NULL DEFAULT 'active',
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
CREATE INDEX brands_company_idx ON public.brands(company_id);

-- ---------- BUSINESS UNITS -------------------------------------------------
CREATE TABLE public.business_units (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name         text NOT NULL,
  code         text,
  status       public.entity_status NOT NULL DEFAULT 'active',
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

-- ---------- DEPARTMENTS ----------------------------------------------------
CREATE TABLE public.departments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  business_unit_id uuid REFERENCES public.business_units(id) ON DELETE SET NULL,
  parent_id        uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name             text NOT NULL,
  code             text,
  status           public.entity_status NOT NULL DEFAULT 'active',
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX departments_company_idx ON public.departments(company_id);
CREATE INDEX departments_parent_idx ON public.departments(parent_id);

-- ---------- TEAMS ----------------------------------------------------------
CREATE TABLE public.teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name          text NOT NULL,
  status        public.entity_status NOT NULL DEFAULT 'active',
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX teams_company_idx ON public.teams(company_id);

-- ---------- WORKSPACES (tenant scope container) ----------------------------
CREATE TABLE public.workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id    uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  slug        text NOT NULL,
  name        text NOT NULL,
  description text,
  status      public.entity_status NOT NULL DEFAULT 'active',
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
CREATE INDEX workspaces_company_idx ON public.workspaces(company_id);
CREATE INDEX workspaces_brand_idx ON public.workspaces(brand_id);

-- ---------- OFFICES / BRANCHES --------------------------------------------
CREATE TABLE public.offices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id    uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  name        text NOT NULL,
  kind        text NOT NULL DEFAULT 'office',  -- office | branch | warehouse | franchise
  address     jsonb NOT NULL DEFAULT '{}'::jsonb,
  country     text,
  city        text,
  status      public.entity_status NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX offices_company_idx ON public.offices(company_id);

-- ---------- EMPLOYEES ------------------------------------------------------
CREATE TABLE public.employees (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code  text,
  title          text,
  department_id  uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  team_id        uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  office_id      uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  manager_id     uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  hired_on       date,
  status         public.entity_status NOT NULL DEFAULT 'active',
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX employees_user_idx ON public.employees(user_id);
CREATE INDEX employees_company_idx ON public.employees(company_id);

-- ---------- PERMISSIONS CATALOG -------------------------------------------
CREATE TABLE public.permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,      -- e.g. companies.manage
  category    text NOT NULL,             -- e.g. platform, billing, ai, community
  description text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- ROLES ----------------------------------------------------------
-- System roles have company_id = NULL (global). Custom roles are per-company.
CREATE TABLE public.roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code        text NOT NULL,             -- founder, super_admin, employee, etc.
  name        text NOT NULL,
  description text,
  is_system   boolean NOT NULL DEFAULT false,
  scope_type  public.scope_type NOT NULL DEFAULT 'company',
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX roles_system_code_uidx  ON public.roles(code) WHERE company_id IS NULL;
CREATE UNIQUE INDEX roles_company_code_uidx ON public.roles(company_id, code) WHERE company_id IS NOT NULL;

CREATE TABLE public.role_permissions (
  role_id       uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------- ROLE ASSIGNMENTS ----------------------------------------------
-- A user gets a role at a specific scope (platform / company / brand / workspace / department / team).
CREATE TABLE public.role_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id      uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  scope_type   public.scope_type NOT NULL,
  scope_id     uuid,                       -- NULL when scope_type = 'platform'
  granted_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  UNIQUE (user_id, role_id, scope_type, scope_id)
);
CREATE INDEX role_assignments_user_idx  ON public.role_assignments(user_id);
CREATE INDEX role_assignments_scope_idx ON public.role_assignments(scope_type, scope_id);

-- ---------- WORKSPACE MEMBERSHIPS -----------------------------------------
CREATE TABLE public.workspace_memberships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id       uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  status        public.membership_status NOT NULL DEFAULT 'active',
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
CREATE INDEX workspace_memberships_user_idx ON public.workspace_memberships(user_id);

-- ---------- HIERARCHICAL SETTINGS -----------------------------------------
-- Effective value resolved by walking user → dept → workspace → brand → company → global.
CREATE TABLE public.settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type public.scope_type NOT NULL,
  scope_id   uuid,                        -- NULL for platform-global
  key        text NOT NULL,
  value      jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_type, scope_id, key)
);
CREATE INDEX settings_lookup_idx ON public.settings(scope_type, scope_id, key);

-- ---------- AUDIT LOGS (immutable) ----------------------------------------
CREATE TABLE public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  company_id  uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  category    text NOT NULL,              -- auth | data | permission | billing | ai_config | admin
  action      text NOT NULL,              -- e.g. company.updated
  entity_type text,
  entity_id   uuid,
  severity    public.audit_severity NOT NULL DEFAULT 'info',
  ip_address  inet,
  user_agent  text,
  before_data jsonb,
  after_data  jsonb,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX audit_logs_time_idx     ON public.audit_logs(occurred_at DESC);
CREATE INDEX audit_logs_actor_idx    ON public.audit_logs(actor_id);
CREATE INDEX audit_logs_company_idx  ON public.audit_logs(company_id);
CREATE INDEX audit_logs_entity_idx   ON public.audit_logs(entity_type, entity_id);

-- ---------- ACTIVITY TIMELINE ---------------------------------------------
CREATE TABLE public.activity_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id   uuid,
  action      text NOT NULL,
  source      text NOT NULL DEFAULT 'app', -- app | api | system | ai
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX activity_time_idx      ON public.activity_events(occurred_at DESC);
CREATE INDEX activity_company_idx   ON public.activity_events(company_id, occurred_at DESC);
CREATE INDEX activity_workspace_idx ON public.activity_events(workspace_id, occurred_at DESC);

-- ============================================================================
-- SECURITY DEFINER HELPERS (never reference their own RLS-protected tables
-- from a policy that would call them; these bypass RLS by design).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_assignments ra
    JOIN public.roles r ON r.id = ra.role_id
    WHERE ra.user_id = _user_id
      AND ra.scope_type = 'platform'
      AND r.code IN ('founder', 'super_founder', 'board', 'super_admin')
      AND (ra.expires_at IS NULL OR ra.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_founder(_user_id)
      OR EXISTS (SELECT 1 FROM public.employees e
                 WHERE e.user_id = _user_id AND e.company_id = _company_id
                   AND e.status = 'active')
      OR EXISTS (SELECT 1 FROM public.role_assignments ra
                 WHERE ra.user_id = _user_id
                   AND ra.scope_type = 'company'
                   AND ra.scope_id = _company_id
                   AND (ra.expires_at IS NULL OR ra.expires_at > now()));
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_founder(_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.role_assignments ra
        JOIN public.roles r ON r.id = ra.role_id
        WHERE ra.user_id = _user_id
          AND ra.scope_type = 'company'
          AND ra.scope_id = _company_id
          AND r.code IN ('company_admin', 'super_admin', 'founder')
          AND (ra.expires_at IS NULL OR ra.expires_at > now())
      );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_founder(_user_id)
      OR EXISTS (SELECT 1 FROM public.workspace_memberships m
                 WHERE m.workspace_id = _workspace_id
                   AND m.user_id = _user_id
                   AND m.status = 'active')
      OR EXISTS (SELECT 1 FROM public.workspaces w
                 WHERE w.id = _workspace_id
                   AND public.is_company_admin(_user_id, w.company_id));
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id uuid, _permission_code text,
  _scope_type public.scope_type DEFAULT 'platform', _scope_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_founder(_user_id)
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
$$;

-- Resolve a hierarchical setting: user > department > workspace > brand > company > platform.
CREATE OR REPLACE FUNCTION public.get_effective_setting(
  _key text,
  _company_id uuid DEFAULT NULL,
  _brand_id uuid DEFAULT NULL,
  _workspace_id uuid DEFAULT NULL,
  _department_id uuid DEFAULT NULL,
  _user_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT value FROM (
    SELECT 1 AS rank, value FROM public.settings
      WHERE key = _key AND scope_type = 'company'   AND scope_id = _user_id      AND _user_id IS NOT NULL
    UNION ALL
    SELECT 2, value FROM public.settings
      WHERE key = _key AND scope_type = 'department' AND scope_id = _department_id AND _department_id IS NOT NULL
    UNION ALL
    SELECT 3, value FROM public.settings
      WHERE key = _key AND scope_type = 'workspace'  AND scope_id = _workspace_id  AND _workspace_id IS NOT NULL
    UNION ALL
    SELECT 4, value FROM public.settings
      WHERE key = _key AND scope_type = 'brand'      AND scope_id = _brand_id      AND _brand_id IS NOT NULL
    UNION ALL
    SELECT 5, value FROM public.settings
      WHERE key = _key AND scope_type = 'company'    AND scope_id = _company_id    AND _company_id IS NOT NULL
    UNION ALL
    SELECT 6, value FROM public.settings
      WHERE key = _key AND scope_type = 'platform'   AND scope_id IS NULL
    ORDER BY rank
    LIMIT 1
  ) t;
$$;

-- Audit writer (never trust client to write directly; use this helper).
CREATE OR REPLACE FUNCTION public.write_audit(
  _category text, _action text,
  _entity_type text DEFAULT NULL, _entity_id uuid DEFAULT NULL,
  _company_id uuid DEFAULT NULL,
  _before jsonb DEFAULT NULL, _after jsonb DEFAULT NULL,
  _severity public.audit_severity DEFAULT 'info',
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.audit_logs
    (actor_id, category, action, entity_type, entity_id, company_id,
     before_data, after_data, severity, metadata)
  VALUES
    (auth.uid(), _category, _action, _entity_type, _entity_id, _company_id,
     _before, _after, _severity, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Generic updated_at trigger (idempotent — reuses existing convention)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Attach updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'companies','brands','business_units','departments','teams','workspaces',
    'offices','employees','roles'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_touch BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- Guard: audit_logs immutability
CREATE OR REPLACE FUNCTION public.audit_logs_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable';
END; $$;
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable();
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable();

-- ============================================================================
-- GRANTS + RLS
-- ============================================================================
-- Company owners created via server fn (service role); RLS gates all reads/writes.

-- Companies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_read ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id));
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_founder(auth.uid()));
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
  USING (public.is_company_admin(auth.uid(), id))
  WITH CHECK (public.is_company_admin(auth.uid(), id));
CREATE POLICY companies_delete ON public.companies FOR DELETE TO authenticated
  USING (public.is_platform_founder(auth.uid()));

-- Brands
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY brands_read ON public.brands FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY brands_write ON public.brands FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Business units, departments, teams, offices — same pattern
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['business_units','departments','teams','offices']) LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I_read ON public.%I FOR SELECT TO authenticated
                    USING (public.is_company_member(auth.uid(), company_id))', t, t);
    EXECUTE format('CREATE POLICY %I_write ON public.%I FOR ALL TO authenticated
                    USING (public.is_company_admin(auth.uid(), company_id))
                    WITH CHECK (public.is_company_admin(auth.uid(), company_id))', t, t);
  END LOOP;
END $$;

-- Workspaces
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspaces_read ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), id) OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY workspaces_write ON public.workspaces FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Employees
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_read_self ON public.employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id));
CREATE POLICY employees_write ON public.employees FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Permissions catalog — everyone authenticated can read (needed for UI); only service role writes.
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_read ON public.permissions FOR SELECT TO authenticated USING (true);

-- Roles: system roles readable to all authed; custom roles gated to company
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_read ON public.roles FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY roles_write ON public.roles FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

-- Role permissions
GRANT SELECT, INSERT, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_perms_read ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_perms_write ON public.role_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r
                 WHERE r.id = role_id
                   AND r.company_id IS NOT NULL
                   AND public.is_company_admin(auth.uid(), r.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.roles r
                 WHERE r.id = role_id
                   AND r.company_id IS NOT NULL
                   AND public.is_company_admin(auth.uid(), r.company_id)));

-- Role assignments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_assignments TO authenticated;
GRANT ALL ON public.role_assignments TO service_role;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_assign_read ON public.role_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR (scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id))
         OR public.is_platform_founder(auth.uid()));
CREATE POLICY role_assign_write ON public.role_assignments FOR ALL TO authenticated
  USING ((scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id))
         OR public.is_platform_founder(auth.uid()))
  WITH CHECK ((scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id))
         OR public.is_platform_founder(auth.uid()));

-- Workspace memberships
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_memberships TO authenticated;
GRANT ALL ON public.workspace_memberships TO service_role;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY wsm_read ON public.workspace_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY wsm_write ON public.workspace_memberships FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workspaces w
                 WHERE w.id = workspace_id
                   AND public.is_company_admin(auth.uid(), w.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w
                 WHERE w.id = workspace_id
                   AND public.is_company_admin(auth.uid(), w.company_id)));

-- Settings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON public.settings FOR SELECT TO authenticated
  USING (
    scope_type = 'platform'
    OR (scope_type = 'company'   AND public.is_company_member(auth.uid(), scope_id))
    OR (scope_type = 'workspace' AND public.is_workspace_member(auth.uid(), scope_id))
    OR (scope_type IN ('brand','department','team'))  -- readable within company via helper
  );
CREATE POLICY settings_write ON public.settings FOR ALL TO authenticated
  USING (
    (scope_type = 'platform' AND public.is_platform_founder(auth.uid()))
    OR (scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id))
    OR (scope_type = 'workspace' AND EXISTS (
         SELECT 1 FROM public.workspaces w
         WHERE w.id = scope_id AND public.is_company_admin(auth.uid(), w.company_id)))
  )
  WITH CHECK (
    (scope_type = 'platform' AND public.is_platform_founder(auth.uid()))
    OR (scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id))
    OR (scope_type = 'workspace' AND EXISTS (
         SELECT 1 FROM public.workspaces w
         WHERE w.id = scope_id AND public.is_company_admin(auth.uid(), w.company_id)))
  );

-- Audit logs: read-only for admins/founder; writes only via SECURITY DEFINER write_audit()
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
         OR actor_id = auth.uid());
-- No INSERT policy → direct inserts blocked; helper runs as SECURITY DEFINER.

-- Activity events: readable within tenant; insert only for authenticated within tenant.
GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_read ON public.activity_events FOR SELECT TO authenticated
  USING (public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
         OR actor_id = auth.uid());
CREATE POLICY activity_insert ON public.activity_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid()
              AND (company_id IS NULL OR public.is_company_member(auth.uid(), company_id)));

-- ============================================================================
-- SEED: permissions catalog + system roles + role-permission mapping
-- ============================================================================
INSERT INTO public.permissions (code, category, description) VALUES
  ('platform.manage',      'platform', 'Full control of the HAPPY X platform'),
  ('companies.manage',     'company',  'Create, update, archive companies'),
  ('companies.view',       'company',  'View company records'),
  ('brands.manage',        'brand',    'Manage brands within a company'),
  ('workspaces.manage',    'workspace','Manage workspaces'),
  ('workspaces.view',      'workspace','View workspaces'),
  ('departments.manage',   'org',      'Manage departments and teams'),
  ('employees.manage',     'hr',       'Manage employees'),
  ('users.invite',         'iam',      'Invite users'),
  ('roles.manage',         'iam',      'Manage roles and permissions'),
  ('billing.manage',       'billing',  'Manage billing and payments'),
  ('billing.view',         'billing',  'View invoices and revenue'),
  ('audit.view',           'security', 'View audit logs'),
  ('settings.manage',      'settings', 'Change hierarchical settings'),
  ('ai.configure',         'ai',       'Configure AI providers and models'),
  ('ai.use',               'ai',       'Use AI features'),
  ('studio.use',           'product',  'Use Creator Studio'),
  ('marketplace.sell',     'product',  'Sell in marketplace'),
  ('marketplace.buy',      'product',  'Purchase from marketplace'),
  ('community.post',       'product',  'Post in community'),
  ('community.moderate',   'product',  'Moderate community content'),
  ('knowledge.contribute', 'product',  'Contribute knowledge'),
  ('knowledge.approve',    'product',  'Approve knowledge submissions')
ON CONFLICT (code) DO NOTHING;

-- System roles (company_id NULL). is_system = cannot be deleted.
INSERT INTO public.roles (code, name, description, is_system, scope_type) VALUES
  ('super_founder',   'Super Founder',      'Owner of HAPPY PERSON PRIVATE LIMITED', true, 'platform'),
  ('founder',         'Founder',            'Platform founder',                       true, 'platform'),
  ('board',           'Board of Directors', 'Board oversight',                        true, 'platform'),
  ('super_admin',     'Super Admin',        'Platform administrator',                 true, 'platform'),
  ('company_admin',   'Company Admin',      'Full control within a company',          true, 'company'),
  ('department_admin','Department Admin',   'Manage a department',                    true, 'department'),
  ('manager',         'Manager',            'Team manager',                           true, 'team'),
  ('employee',        'Employee',           'Company employee',                       true, 'company'),
  ('teacher',         'Teacher',            'Delivers education content',             true, 'company'),
  ('scholar',         'Scholar',            'Advanced learner',                       true, 'company'),
  ('student',         'Student',            'Enrolled learner',                       true, 'company'),
  ('dealer',          'Dealer',             'Sales dealer',                           true, 'company'),
  ('distributor',     'Distributor',        'Product distributor',                    true, 'company'),
  ('franchise',       'Franchise',          'Franchise operator',                     true, 'company'),
  ('customer',        'Customer',           'End customer',                           true, 'company'),
  ('guest',           'Guest',              'Limited guest access',                   true, 'platform'),
  ('developer',       'Developer',          'API & integration developer',            true, 'platform')
ON CONFLICT DO NOTHING;

-- Wire system roles → permissions
WITH r AS (SELECT id, code FROM public.roles WHERE company_id IS NULL),
     p AS (SELECT id, code FROM public.permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM r, p
WHERE
  (r.code IN ('super_founder','founder','super_admin') AND p.code IN (
      'platform.manage','companies.manage','companies.view','brands.manage',
      'workspaces.manage','workspaces.view','departments.manage','employees.manage',
      'users.invite','roles.manage','billing.manage','billing.view','audit.view',
      'settings.manage','ai.configure','ai.use','studio.use','marketplace.sell',
      'marketplace.buy','community.post','community.moderate','knowledge.contribute','knowledge.approve'))
  OR (r.code = 'board' AND p.code IN ('companies.view','billing.view','audit.view'))
  OR (r.code = 'company_admin' AND p.code IN (
      'companies.view','brands.manage','workspaces.manage','workspaces.view',
      'departments.manage','employees.manage','users.invite','roles.manage',
      'billing.view','audit.view','settings.manage','ai.configure','ai.use',
      'studio.use','marketplace.sell','marketplace.buy','community.post','knowledge.contribute'))
  OR (r.code = 'department_admin' AND p.code IN (
      'departments.manage','employees.manage','workspaces.view','ai.use','studio.use',
      'community.post','knowledge.contribute'))
  OR (r.code = 'manager' AND p.code IN (
      'workspaces.view','employees.manage','ai.use','studio.use','community.post'))
  OR (r.code = 'employee' AND p.code IN (
      'workspaces.view','ai.use','studio.use','community.post','knowledge.contribute'))
  OR (r.code IN ('teacher','scholar') AND p.code IN (
      'ai.use','studio.use','community.post','knowledge.contribute','knowledge.approve'))
  OR (r.code = 'student' AND p.code IN ('ai.use','community.post'))
  OR (r.code IN ('dealer','distributor','franchise') AND p.code IN (
      'marketplace.sell','marketplace.buy','community.post'))
  OR (r.code = 'customer' AND p.code IN ('marketplace.buy','community.post'))
  OR (r.code = 'developer' AND p.code IN ('ai.use','ai.configure'))
ON CONFLICT DO NOTHING;
