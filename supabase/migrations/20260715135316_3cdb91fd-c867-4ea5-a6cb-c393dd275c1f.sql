-- R28 HAPPY Memory Engine

-- ============ memory_items ============
CREATE TABLE public.memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'conversation','workspace','project','company','customer','builder',
    'marketplace','crm','erp','finance','manufacturing','warehouse',
    'deployment','founder','personal','ai'
  )),
  scope text NOT NULL CHECK (scope IN ('personal','workspace','company')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  summary text,
  tags text[] NOT NULL DEFAULT '{}',
  entity_type text,
  entity_id uuid,
  source text,                                -- runtime that produced it (brain, crm, erp, ui, ...)
  importance smallint NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  sensitivity text NOT NULL DEFAULT 'normal' CHECK (sensitivity IN ('public','normal','confidential','restricted')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding jsonb,                            -- placeholder for future pgvector
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  last_accessed_at timestamptz,
  access_count integer NOT NULL DEFAULT 0,
  search_tsv tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX memory_items_scope_kind ON public.memory_items (scope, kind);
CREATE INDEX memory_items_company ON public.memory_items (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX memory_items_user ON public.memory_items (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX memory_items_workspace ON public.memory_items (workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX memory_items_tags ON public.memory_items USING gin (tags);
CREATE INDEX memory_items_tsv ON public.memory_items USING gin (search_tsv);
CREATE INDEX memory_items_expires ON public.memory_items (expires_at) WHERE expires_at IS NOT NULL AND archived = false;
CREATE INDEX memory_items_created ON public.memory_items (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_items TO authenticated;
GRANT ALL ON public.memory_items TO service_role;
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_items read" ON public.memory_items FOR SELECT TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
);
CREATE POLICY "memory_items insert" ON public.memory_items FOR INSERT TO authenticated
WITH CHECK (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
);
CREATE POLICY "memory_items update" ON public.memory_items FOR UPDATE TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
)
WITH CHECK (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);
CREATE POLICY "memory_items delete" ON public.memory_items FOR DELETE TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);

CREATE TRIGGER trg_touch_memory_items BEFORE UPDATE ON public.memory_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.memory_items_tsv_refresh()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.body,'')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.tags,'{}'::text[]), ' ')), 'C');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_memory_items_tsv BEFORE INSERT OR UPDATE ON public.memory_items
  FOR EACH ROW EXECUTE FUNCTION public.memory_items_tsv_refresh();

-- ============ memory_events (timeline) ============
CREATE TABLE public.memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  scope text NOT NULL DEFAULT 'company' CHECK (scope IN ('personal','workspace','company')),
  event_type text NOT NULL,                   -- deployment.completed, revenue.recorded, crm.deal_won, ...
  category text,                              -- business|user|system|ai
  actor_id uuid,
  entity_type text,
  entity_id uuid,
  summary text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('debug','info','notice','warn','critical')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX memory_events_company_time ON public.memory_events (company_id, occurred_at DESC);
CREATE INDEX memory_events_user_time ON public.memory_events (user_id, occurred_at DESC);
CREATE INDEX memory_events_type ON public.memory_events (event_type);

GRANT SELECT, INSERT ON public.memory_events TO authenticated;
GRANT ALL ON public.memory_events TO service_role;
ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_events read" ON public.memory_events FOR SELECT TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
);
CREATE POLICY "memory_events insert" ON public.memory_events FOR INSERT TO authenticated
WITH CHECK (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'workspace' AND workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  OR (scope = 'company'   AND company_id   IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
);

-- immutability: memory_events cannot be updated or deleted
CREATE OR REPLACE FUNCTION public.memory_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'memory_events are immutable'; END $$;
CREATE TRIGGER trg_memory_events_immutable BEFORE UPDATE OR DELETE ON public.memory_events
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

-- ============ memory_links ============
CREATE TABLE public.memory_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_memory_id uuid NOT NULL REFERENCES public.memory_items(id) ON DELETE CASCADE,
  to_memory_id uuid NOT NULL REFERENCES public.memory_items(id) ON DELETE CASCADE,
  link_kind text NOT NULL DEFAULT 'related' CHECK (link_kind IN ('related','supersedes','duplicate_of','derived_from','references')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_memory_id, to_memory_id, link_kind)
);
CREATE INDEX memory_links_from ON public.memory_links (from_memory_id);
CREATE INDEX memory_links_to ON public.memory_links (to_memory_id);

GRANT SELECT, INSERT, DELETE ON public.memory_links TO authenticated;
GRANT ALL ON public.memory_links TO service_role;
ALTER TABLE public.memory_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_links read" ON public.memory_links FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.memory_items m WHERE m.id = from_memory_id));
CREATE POLICY "memory_links insert" ON public.memory_links FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.memory_items m WHERE m.id = from_memory_id));
CREATE POLICY "memory_links delete" ON public.memory_links FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.memory_items m WHERE m.id = from_memory_id));

-- ============ memory_retention_policies ============
CREATE TABLE public.memory_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('personal','workspace','company','platform')),
  kind text NOT NULL,
  max_age_days integer,
  max_items integer,
  archive_after_days integer,
  hard_delete boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, scope, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_retention_policies TO authenticated;
GRANT ALL ON public.memory_retention_policies TO service_role;
ALTER TABLE public.memory_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_retention read" ON public.memory_retention_policies FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "memory_retention write" ON public.memory_retention_policies FOR ALL TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

CREATE TRIGGER trg_touch_memory_retention BEFORE UPDATE ON public.memory_retention_policies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ memory_access_log (immutable audit) ============
CREATE TABLE public.memory_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.memory_items(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('read','store','update','archive','forget','merge','expire','search')),
  reason text,
  runtime text,                              -- caller runtime (brain, ui, cron, ...)
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX memory_access_log_memory ON public.memory_access_log (memory_id);
CREATE INDEX memory_access_log_company_time ON public.memory_access_log (company_id, occurred_at DESC);

GRANT SELECT, INSERT ON public.memory_access_log TO authenticated;
GRANT ALL ON public.memory_access_log TO service_role;
ALTER TABLE public.memory_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_access_log read admin" ON public.memory_access_log FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id) OR actor_id = auth.uid());
CREATE POLICY "memory_access_log insert" ON public.memory_access_log FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

CREATE OR REPLACE FUNCTION public.memory_access_log_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'memory_access_log entries are immutable'; END $$;
CREATE TRIGGER trg_memory_access_log_immutable BEFORE UPDATE OR DELETE ON public.memory_access_log
  FOR EACH ROW EXECUTE FUNCTION public.memory_access_log_immutable();