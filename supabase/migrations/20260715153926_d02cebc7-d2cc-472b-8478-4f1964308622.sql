
-- R37 Enterprise Ecosystem Platform (extends existing marketplace)

-- 1) store_categories --------------------------------------------------
CREATE TABLE public.store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.store_categories(id) ON DELETE SET NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_categories TO authenticated;
GRANT ALL ON public.store_categories TO service_role;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_categories_public_read" ON public.store_categories
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "store_categories_ops_manage" ON public.store_categories
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_store_categories BEFORE UPDATE ON public.store_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) store_collections + items ----------------------------------------
CREATE TABLE public.store_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'manual' CHECK (kind IN ('manual','trending','recently_updated','top_rated','founder_picks')),
  curator_id uuid,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_collections TO authenticated;
GRANT ALL ON public.store_collections TO service_role;
ALTER TABLE public.store_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_collections_public_read" ON public.store_collections
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "store_collections_ops_manage" ON public.store_collections
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_store_collections BEFORE UPDATE ON public.store_collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.store_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.store_collections(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  pinned_by uuid,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (collection_id, listing_id)
);
GRANT SELECT ON public.store_collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_collection_items TO authenticated;
GRANT ALL ON public.store_collection_items TO service_role;
ALTER TABLE public.store_collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_collection_items_public_read" ON public.store_collection_items
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.store_collections c WHERE c.id = collection_id AND c.active));
CREATE POLICY "store_collection_items_ops_manage" ON public.store_collection_items
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_store_collection_items_collection ON public.store_collection_items(collection_id, position);
CREATE INDEX idx_store_collection_items_listing ON public.store_collection_items(listing_id);

-- 3) store_featured_slots ---------------------------------------------
CREATE TABLE public.store_featured_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_code text NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  weight int NOT NULL DEFAULT 100,
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_featured_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_featured_slots TO authenticated;
GRANT ALL ON public.store_featured_slots TO service_role;
ALTER TABLE public.store_featured_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_featured_public_read" ON public.store_featured_slots
  FOR SELECT TO anon, authenticated
  USING (starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "store_featured_ops_manage" ON public.store_featured_slots
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_store_featured_slot ON public.store_featured_slots(slot_code, starts_at, ends_at);

-- 4) store_compatibility -----------------------------------------------
CREATE TABLE public.store_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  listing_version int NOT NULL,
  platform_min text,
  platform_max text,
  requires jsonb NOT NULL DEFAULT '[]'::jsonb,
  conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, listing_version)
);
GRANT SELECT ON public.store_compatibility TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_compatibility TO authenticated;
GRANT ALL ON public.store_compatibility TO service_role;
ALTER TABLE public.store_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_compatibility_public_read" ON public.store_compatibility
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status = 'active'));
CREATE POLICY "store_compatibility_owner_manage" ON public.store_compatibility
  FOR ALL TO authenticated
  USING (
    public.is_ops_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  )
  WITH CHECK (
    public.is_ops_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
  );

-- 5) store_recommendations (cache) -------------------------------------
CREATE TABLE public.store_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('fact','ai')),
  source text NOT NULL,
  subject_user_id uuid,
  scope text NOT NULL DEFAULT 'global',
  listing_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
GRANT SELECT ON public.store_recommendations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_recommendations TO authenticated;
GRANT ALL ON public.store_recommendations TO service_role;
ALTER TABLE public.store_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_recs_public_fact" ON public.store_recommendations
  FOR SELECT TO anon, authenticated
  USING (kind = 'fact' AND subject_user_id IS NULL);
CREATE POLICY "store_recs_own" ON public.store_recommendations
  FOR SELECT TO authenticated
  USING (subject_user_id = auth.uid());
CREATE POLICY "store_recs_ops_manage" ON public.store_recommendations
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_store_recs_subject ON public.store_recommendations(subject_user_id, generated_at DESC);
CREATE INDEX idx_store_recs_scope ON public.store_recommendations(scope, kind, generated_at DESC);

-- 6) creator_profiles --------------------------------------------------
CREATE TABLE public.creator_profiles (
  user_id uuid PRIMARY KEY,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  website text,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  follower_count int NOT NULL DEFAULT 0,
  total_downloads bigint NOT NULL DEFAULT 0,
  total_revenue_cents bigint NOT NULL DEFAULT 0,
  payout_currency text NOT NULL DEFAULT 'usd',
  payout_method jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creator_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_profiles TO authenticated;
GRANT ALL ON public.creator_profiles TO service_role;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_profiles_public_read" ON public.creator_profiles
  FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "creator_profiles_own_upsert" ON public.creator_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "creator_profiles_own_update" ON public.creator_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_ops_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_ops_admin(auth.uid()));
CREATE POLICY "creator_profiles_ops_delete" ON public.creator_profiles
  FOR DELETE TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_creator_profiles BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7) creator_payouts ---------------------------------------------------
CREATE TABLE public.creator_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd',
  method text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','settled','failed','cancelled')),
  reference text,
  wallet_ledger_id uuid,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  failed_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_payouts TO authenticated;
GRANT ALL ON public.creator_payouts TO service_role;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_payouts_own_read" ON public.creator_payouts
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.is_ops_admin(auth.uid()));
CREATE POLICY "creator_payouts_ops_manage" ON public.creator_payouts
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_creator_payouts_creator ON public.creator_payouts(creator_id, initiated_at DESC);
CREATE TRIGGER trg_touch_creator_payouts BEFORE UPDATE ON public.creator_payouts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 8) creator_support_tickets ------------------------------------------
CREATE TABLE public.creator_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending_creator','pending_buyer','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_support_tickets TO authenticated;
GRANT ALL ON public.creator_support_tickets TO service_role;
ALTER TABLE public.creator_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_tickets_participant_read" ON public.creator_support_tickets
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR buyer_id = auth.uid() OR public.is_ops_admin(auth.uid()));
CREATE POLICY "support_tickets_buyer_create" ON public.creator_support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "support_tickets_participant_update" ON public.creator_support_tickets
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() OR buyer_id = auth.uid() OR public.is_ops_admin(auth.uid()))
  WITH CHECK (creator_id = auth.uid() OR buyer_id = auth.uid() OR public.is_ops_admin(auth.uid()));
CREATE POLICY "support_tickets_ops_delete" ON public.creator_support_tickets
  FOR DELETE TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_support_tickets_creator ON public.creator_support_tickets(creator_id, last_message_at DESC);
CREATE INDEX idx_support_tickets_buyer ON public.creator_support_tickets(buyer_id, last_message_at DESC);
CREATE TRIGGER trg_touch_support_tickets BEFORE UPDATE ON public.creator_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 9) store_events (immutable) -----------------------------------------
CREATE TABLE public.store_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.store_events TO authenticated;
GRANT ALL ON public.store_events TO service_role;
ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_events_ops_read" ON public.store_events
  FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "store_events_own_read" ON public.store_events
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());
CREATE POLICY "store_events_insert" ON public.store_events
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.store_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN RAISE EXCEPTION 'store_events are immutable'; END $$;

CREATE TRIGGER trg_store_events_immutable
  BEFORE UPDATE OR DELETE ON public.store_events
  FOR EACH ROW EXECUTE FUNCTION public.store_events_immutable();

CREATE INDEX idx_store_events_listing ON public.store_events(listing_id, created_at DESC);
CREATE INDEX idx_store_events_type ON public.store_events(event_type, created_at DESC);

-- 10) Seed core category taxonomy -------------------------------------
INSERT INTO public.store_categories (code, label, sort_order) VALUES
  ('applications', 'Applications', 10),
  ('templates', 'Templates', 20),
  ('plugins', 'Plugins', 30),
  ('widgets', 'Widgets', 40),
  ('themes', 'Themes', 50),
  ('ai_agents', 'AI Agents', 60),
  ('business_packs', 'Business Packs', 70),
  ('industry_packs', 'Industry Packs', 80),
  ('prompt_packs', 'Prompt Packs', 90),
  ('knowledge_packs', 'Knowledge Packs', 100),
  ('courses', 'Courses', 110),
  ('learning_packs', 'Learning Packs', 120),
  ('digital_human_assets', 'Digital Human Assets', 130),
  ('voice_packs', 'Voice Packs', 140),
  ('animation_packs', 'Animation Packs', 150),
  ('3d_assets', '3D Assets', 160),
  ('developer_tools', 'Developer Tools', 170),
  ('presentation_packs', 'Presentation Packs', 180),
  ('whiteboard_packs', 'Whiteboard Packs', 190)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.store_collections (code, title, kind, sort_order) VALUES
  ('featured', 'Featured', 'manual', 10),
  ('trending', 'Trending', 'trending', 20),
  ('recently_updated', 'Recently Updated', 'recently_updated', 30),
  ('top_rated', 'Top Rated', 'top_rated', 40),
  ('founder_picks', 'Founder Picks', 'founder_picks', 50)
ON CONFLICT (code) DO NOTHING;
