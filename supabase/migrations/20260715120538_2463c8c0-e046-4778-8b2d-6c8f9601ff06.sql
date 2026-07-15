CREATE TABLE IF NOT EXISTS public.cms_contents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  type          text NOT NULL,
  slug          text NOT NULL,
  locale        text NOT NULL DEFAULT 'en',
  title         text NOT NULL,
  excerpt       text,
  body          jsonb NOT NULL DEFAULT '{}'::jsonb,
  cover_url     text,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','in_review','approved','scheduled','published','archived','rejected')),
  visibility    text NOT NULL DEFAULT 'private'
                CHECK (visibility IN ('private','company','public')),
  author_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  editor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  publisher_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id     uuid REFERENCES public.cms_contents(id) ON DELETE SET NULL,
  categories    text[] NOT NULL DEFAULT '{}',
  tags          text[] NOT NULL DEFAULT '{}',
  seo           jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  version       integer NOT NULL DEFAULT 1,
  scheduled_at  timestamptz,
  published_at  timestamptz,
  archived_at   timestamptz,
  review_note   text,
  search_tsv    tsvector,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, type, slug, locale)
);

CREATE OR REPLACE FUNCTION public.cms_contents_tsv_refresh()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.excerpt,'')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.tags,'{}'::text[]), ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(NEW.categories,'{}'::text[]), ' ')), 'C');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cms_contents_tsv ON public.cms_contents;
CREATE TRIGGER trg_cms_contents_tsv BEFORE INSERT OR UPDATE ON public.cms_contents
  FOR EACH ROW EXECUTE FUNCTION public.cms_contents_tsv_refresh();

CREATE INDEX IF NOT EXISTS idx_cms_contents_company_status ON public.cms_contents(company_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_contents_type          ON public.cms_contents(type, status);
CREATE INDEX IF NOT EXISTS idx_cms_contents_author        ON public.cms_contents(author_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_contents_sched         ON public.cms_contents(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_cms_contents_fts           ON public.cms_contents USING gin(search_tsv);
CREATE INDEX IF NOT EXISTS idx_cms_contents_tags          ON public.cms_contents USING gin(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_contents TO authenticated;
GRANT SELECT ON public.cms_contents TO anon;
GRANT ALL ON public.cms_contents TO service_role;

ALTER TABLE public.cms_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_contents public read"
  ON public.cms_contents FOR SELECT TO anon, authenticated
  USING (visibility = 'public' AND status = 'published');

CREATE POLICY "cms_contents company read"
  ON public.cms_contents FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));

CREATE POLICY "cms_contents author insert"
  ON public.cms_contents FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "cms_contents author or company update"
  ON public.cms_contents FOR UPDATE TO authenticated
  USING (author_id = auth.uid()
         OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
         OR public.is_platform_founder(auth.uid()))
  WITH CHECK (author_id = auth.uid()
              OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
              OR public.is_platform_founder(auth.uid()));

CREATE POLICY "cms_contents author or admin delete"
  ON public.cms_contents FOR DELETE TO authenticated
  USING (author_id = auth.uid()
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
         OR public.is_platform_founder(auth.uid()));

DROP TRIGGER IF EXISTS trg_touch_cms_contents ON public.cms_contents;
CREATE TRIGGER trg_touch_cms_contents BEFORE UPDATE ON public.cms_contents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cms_revisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   uuid NOT NULL REFERENCES public.cms_contents(id) ON DELETE CASCADE,
  version      integer NOT NULL,
  snapshot     jsonb NOT NULL,
  author_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, version)
);
CREATE INDEX IF NOT EXISTS idx_cms_rev_content ON public.cms_revisions(content_id, version DESC);

GRANT SELECT, INSERT ON public.cms_revisions TO authenticated;
GRANT ALL ON public.cms_revisions TO service_role;

ALTER TABLE public.cms_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_revisions read"
  ON public.cms_revisions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cms_contents c
                 WHERE c.id = content_id
                   AND (c.author_id = auth.uid()
                        OR (c.company_id IS NOT NULL AND public.is_company_member(auth.uid(), c.company_id))
                        OR public.is_platform_founder(auth.uid()))));

CREATE POLICY "cms_revisions insert"
  ON public.cms_revisions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.cms_contents c
                      WHERE c.id = content_id
                        AND (c.author_id = auth.uid()
                             OR (c.company_id IS NOT NULL AND public.is_company_member(auth.uid(), c.company_id))
                             OR public.is_platform_founder(auth.uid()))));

CREATE OR REPLACE FUNCTION public.cms_revisions_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'cms_revisions are immutable'; END $$;

DROP TRIGGER IF EXISTS trg_cms_rev_immutable ON public.cms_revisions;
CREATE TRIGGER trg_cms_rev_immutable BEFORE UPDATE OR DELETE ON public.cms_revisions
  FOR EACH ROW EXECUTE FUNCTION public.cms_revisions_immutable();

CREATE TABLE IF NOT EXISTS public.cms_media_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES public.cms_media_folders(id) ON DELETE CASCADE,
  name        text NOT NULL,
  path        text NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, path)
);
CREATE INDEX IF NOT EXISTS idx_cms_folders_company ON public.cms_media_folders(company_id, parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media_folders TO authenticated;
GRANT ALL ON public.cms_media_folders TO service_role;

ALTER TABLE public.cms_media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_folders company access"
  ON public.cms_media_folders FOR ALL TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id))
  WITH CHECK (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));

DROP TRIGGER IF EXISTS trg_touch_cms_folders ON public.cms_media_folders;
CREATE TRIGGER trg_touch_cms_folders BEFORE UPDATE ON public.cms_media_folders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cms_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  folder_id    uuid REFERENCES public.cms_media_folders(id) ON DELETE SET NULL,
  asset_id     uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  kind         text NOT NULL CHECK (kind IN ('image','video','audio','pdf','document','icon','font','logo','archive','other')),
  name         text NOT NULL,
  description  text,
  url          text NOT NULL,
  mime_type    text,
  size_bytes   bigint,
  width        integer,
  height       integer,
  duration_seconds integer,
  checksum     text,
  tags         text[] NOT NULL DEFAULT '{}',
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  version      integer NOT NULL DEFAULT 1,
  archived_at  timestamptz,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cms_media_company_kind ON public.cms_media(company_id, kind, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_media_folder       ON public.cms_media(folder_id);
CREATE INDEX IF NOT EXISTS idx_cms_media_tags         ON public.cms_media USING gin(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media TO authenticated;
GRANT ALL ON public.cms_media TO service_role;

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_media company access"
  ON public.cms_media FOR ALL TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id) OR public.is_platform_founder(auth.uid()))
  WITH CHECK (company_id IS NULL OR public.is_company_member(auth.uid(), company_id) OR public.is_platform_founder(auth.uid()));

DROP TRIGGER IF EXISTS trg_touch_cms_media ON public.cms_media;
CREATE TRIGGER trg_touch_cms_media BEFORE UPDATE ON public.cms_media
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cms_translations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     uuid NOT NULL REFERENCES public.cms_contents(id) ON DELETE CASCADE,
  locale         text NOT NULL,
  title          text NOT NULL,
  excerpt        text,
  body           jsonb NOT NULL DEFAULT '{}'::jsonb,
  status         text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','in_progress','translated','reviewed','published')),
  translator_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, locale)
);
CREATE INDEX IF NOT EXISTS idx_cms_trans_content ON public.cms_translations(content_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_translations TO authenticated;
GRANT ALL ON public.cms_translations TO service_role;

ALTER TABLE public.cms_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_translations access via content"
  ON public.cms_translations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cms_contents c
                 WHERE c.id = content_id
                   AND (c.author_id = auth.uid()
                        OR (c.company_id IS NOT NULL AND public.is_company_member(auth.uid(), c.company_id))
                        OR public.is_platform_founder(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cms_contents c
                      WHERE c.id = content_id
                        AND (c.author_id = auth.uid()
                             OR (c.company_id IS NOT NULL AND public.is_company_member(auth.uid(), c.company_id))
                             OR public.is_platform_founder(auth.uid()))));

DROP TRIGGER IF EXISTS trg_touch_cms_trans ON public.cms_translations;
CREATE TRIGGER trg_touch_cms_trans BEFORE UPDATE ON public.cms_translations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();