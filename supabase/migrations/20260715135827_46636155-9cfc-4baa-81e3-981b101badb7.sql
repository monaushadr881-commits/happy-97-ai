-- R29 HAPPY Knowledge Graph

-- ============ kg_entities ============
CREATE TABLE public.kg_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL,                              -- company|user|employee|customer|lead|vendor|department|branch|product|inventory|batch|warehouse|purchase_order|sales_order|invoice|payment|wallet|credits|listing|website_project|app_project|deployment|notification|ai_agent|digital_human|knowledge_article|document|course|library_item
  ref_table text,                                  -- source table in the DB (nullable for virtual entities)
  ref_id uuid,                                     -- source row id
  label text NOT NULL,
  slug text,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
  search_tsv tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, kind, ref_id)
);
CREATE INDEX kg_entities_company ON public.kg_entities (company_id);
CREATE INDEX kg_entities_kind ON public.kg_entities (kind);
CREATE INDEX kg_entities_ref ON public.kg_entities (ref_table, ref_id);
CREATE INDEX kg_entities_tags ON public.kg_entities USING gin (tags);
CREATE INDEX kg_entities_tsv ON public.kg_entities USING gin (search_tsv);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kg_entities TO authenticated;
GRANT ALL ON public.kg_entities TO service_role;
ALTER TABLE public.kg_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kg_entities read" ON public.kg_entities FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "kg_entities write" ON public.kg_entities FOR ALL TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

CREATE TRIGGER trg_touch_kg_entities BEFORE UPDATE ON public.kg_entities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.kg_entities_tsv_refresh()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.label,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.slug,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.tags,'{}'::text[]), ' ')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.kind,'')), 'C');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_kg_entities_tsv BEFORE INSERT OR UPDATE ON public.kg_entities
  FOR EACH ROW EXECUTE FUNCTION public.kg_entities_tsv_refresh();

-- ============ kg_relations ============
CREATE TABLE public.kg_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  from_entity_id uuid NOT NULL REFERENCES public.kg_entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES public.kg_entities(id) ON DELETE CASCADE,
  relation text NOT NULL,                          -- works_at|reports_to|owns|created_by|assigned_to|belongs_to|depends_on|purchased|sold|produces|consumes|references|related_to|managed_by|connected_to
  verified boolean NOT NULL DEFAULT true,          -- true = derived from actual platform data; false = AI inference pending review
  confidence numeric NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  source text,                                     -- runtime that produced it (crm|erp|finance|wms|mfg|marketplace|builder|deployment|brain|manual)
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,     -- e.g. { invoice_id, order_id, event_id }
  weight numeric NOT NULL DEFAULT 1.0,
  valid_from timestamptz,
  valid_to timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_entity_id, to_entity_id, relation)
);
CREATE INDEX kg_relations_from ON public.kg_relations (from_entity_id);
CREATE INDEX kg_relations_to ON public.kg_relations (to_entity_id);
CREATE INDEX kg_relations_relation ON public.kg_relations (relation);
CREATE INDEX kg_relations_company ON public.kg_relations (company_id);
CREATE INDEX kg_relations_verified ON public.kg_relations (verified);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kg_relations TO authenticated;
GRANT ALL ON public.kg_relations TO service_role;
ALTER TABLE public.kg_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kg_relations read" ON public.kg_relations FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "kg_relations write" ON public.kg_relations FOR ALL TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

CREATE TRIGGER trg_touch_kg_relations BEFORE UPDATE ON public.kg_relations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ kg_inferences (immutable AI-inference log) ============
CREATE TABLE public.kg_inferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  from_entity_id uuid REFERENCES public.kg_entities(id) ON DELETE SET NULL,
  to_entity_id uuid REFERENCES public.kg_entities(id) ON DELETE SET NULL,
  relation text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  rationale text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','superseded')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kg_inferences_company ON public.kg_inferences (company_id);
CREATE INDEX kg_inferences_status ON public.kg_inferences (status);

GRANT SELECT, INSERT, UPDATE ON public.kg_inferences TO authenticated;
GRANT ALL ON public.kg_inferences TO service_role;
ALTER TABLE public.kg_inferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kg_inferences read" ON public.kg_inferences FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "kg_inferences insert" ON public.kg_inferences FOR INSERT TO authenticated
WITH CHECK (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id));
CREATE POLICY "kg_inferences update review" ON public.kg_inferences FOR UPDATE TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

-- immutable core fields (only status/reviewed_by/reviewed_at may change)
CREATE OR REPLACE FUNCTION public.kg_inferences_immutable_core()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'kg_inferences are immutable'; END IF;
  IF NEW.from_entity_id IS DISTINCT FROM OLD.from_entity_id
     OR NEW.to_entity_id IS DISTINCT FROM OLD.to_entity_id
     OR NEW.relation IS DISTINCT FROM OLD.relation
     OR NEW.confidence IS DISTINCT FROM OLD.confidence
     OR NEW.rationale IS DISTINCT FROM OLD.rationale
     OR NEW.evidence IS DISTINCT FROM OLD.evidence
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN RAISE EXCEPTION 'kg_inferences core fields are immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_kg_inferences_immutable BEFORE UPDATE OR DELETE ON public.kg_inferences
  FOR EACH ROW EXECUTE FUNCTION public.kg_inferences_immutable_core();

-- ============ kg_search_cache ============
CREATE TABLE public.kg_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  query_hash text NOT NULL,
  query_text text NOT NULL,
  hits jsonb NOT NULL DEFAULT '[]'::jsonb,
  hit_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, query_hash)
);
CREATE INDEX kg_search_cache_expires ON public.kg_search_cache (expires_at);
GRANT SELECT, INSERT, DELETE ON public.kg_search_cache TO authenticated;
GRANT ALL ON public.kg_search_cache TO service_role;
ALTER TABLE public.kg_search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kg_search_cache read" ON public.kg_search_cache FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "kg_search_cache insert" ON public.kg_search_cache FOR INSERT TO authenticated
WITH CHECK (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id));
CREATE POLICY "kg_search_cache delete" ON public.kg_search_cache FOR DELETE TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));