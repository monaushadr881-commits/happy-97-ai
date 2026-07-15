
-- ==================== listings additions ====================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'website_template',
  ADD COLUMN IF NOT EXISTS purchase_type text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS price_credits bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preview_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS artifact_path text,
  ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS download_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_asset_type_chk CHECK (asset_type IN (
    'website_template','app_template','component','ui_kit','theme','icons',
    'images','videos','fonts','plugin','extension','ai_workflow',
    'automation_pack','prompt_pack','digital_human_asset',
    'business_template','crm_template','erp_template','finance_template'
  )),
  ADD CONSTRAINT listings_purchase_type_chk CHECK (purchase_type IN (
    'free','one_time','subscription','credits','wallet','enterprise'
  )),
  ADD CONSTRAINT listings_review_status_chk CHECK (review_status IN (
    'draft','pending_review','approved','published','hidden','rejected','archived'
  ));

CREATE INDEX IF NOT EXISTS listings_review_status_idx ON public.listings(review_status);
CREATE INDEX IF NOT EXISTS listings_asset_type_idx    ON public.listings(asset_type);
CREATE INDEX IF NOT EXISTS listings_published_idx     ON public.listings(published_at DESC) WHERE review_status = 'published';

-- Widen listing read policy so PUBLISHED listings are visible (not only 'active').
DROP POLICY IF EXISTS "list_read" ON public.listings;
CREATE POLICY "listings_public_read"
  ON public.listings FOR SELECT TO anon, authenticated
  USING (review_status = 'published');

-- ==================== listing_versions ====================
CREATE TABLE IF NOT EXISTS public.listing_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  version        integer NOT NULL,
  changelog      text,
  artifact_path  text,
  artifact_bytes bigint,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, version)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_versions TO authenticated;
GRANT SELECT ON public.listing_versions TO anon;
GRANT ALL ON public.listing_versions TO service_role;

ALTER TABLE public.listing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_versions_public_read"
  ON public.listing_versions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l
                 WHERE l.id = listing_versions.listing_id
                   AND l.review_status = 'published'));

CREATE POLICY "listing_versions_owner_all"
  ON public.listing_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l
                 WHERE l.id = listing_versions.listing_id
                   AND (l.seller_id = auth.uid() OR public.is_ops_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l
                      WHERE l.id = listing_versions.listing_id
                        AND (l.seller_id = auth.uid() OR public.is_ops_admin(auth.uid()))));

SELECT public._hxp_attach_touch('public.listing_versions'::regclass);

-- ==================== listing_purchases (entitlements) ====================
CREATE TABLE IF NOT EXISTS public.listing_purchases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_type   text NOT NULL,
  price_cents     bigint NOT NULL DEFAULT 0,
  price_credits   bigint NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  version_at_purchase integer NOT NULL,
  transaction_id  uuid REFERENCES public.marketplace_transactions(id) ON DELETE SET NULL,
  wallet_ledger_id uuid REFERENCES public.wallet_ledger_entries(id) ON DELETE SET NULL,
  credit_ledger_id uuid REFERENCES public.credit_ledger_entries(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'active',
  refunded_at     timestamptz,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id, version_at_purchase)
);

ALTER TABLE public.listing_purchases
  ADD CONSTRAINT listing_purchases_status_chk CHECK (status IN ('active','refunded','revoked')),
  ADD CONSTRAINT listing_purchases_type_chk CHECK (purchase_type IN
    ('free','one_time','subscription','credits','wallet','enterprise'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_purchases TO authenticated;
GRANT ALL ON public.listing_purchases TO service_role;

ALTER TABLE public.listing_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_purchases_participant_read"
  ON public.listing_purchases FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE POLICY "listing_purchases_buyer_write"
  ON public.listing_purchases FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS listing_purchases_buyer_idx    ON public.listing_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS listing_purchases_listing_idx  ON public.listing_purchases(listing_id);

SELECT public._hxp_attach_touch('public.listing_purchases'::regclass);

-- ==================== listing_downloads (audit) ====================
CREATE TABLE IF NOT EXISTS public.listing_downloads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  purchase_id  uuid REFERENCES public.listing_purchases(id) ON DELETE SET NULL,
  buyer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version      integer NOT NULL,
  artifact_path text,
  ip_hash      text,
  user_agent   text,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.listing_downloads TO authenticated;
GRANT ALL ON public.listing_downloads TO service_role;

ALTER TABLE public.listing_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_downloads_scope_read"
  ON public.listing_downloads FOR SELECT TO authenticated
  USING (buyer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_downloads.listing_id AND l.seller_id = auth.uid())
      OR public.is_ops_admin(auth.uid()));

CREATE POLICY "listing_downloads_buyer_write"
  ON public.listing_downloads FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR public.is_ops_admin(auth.uid()));

-- Immutable
CREATE OR REPLACE FUNCTION public.listing_downloads_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'listing_downloads are immutable'; END $$;

DROP TRIGGER IF EXISTS trg_listing_downloads_immutable ON public.listing_downloads;
CREATE TRIGGER trg_listing_downloads_immutable
  BEFORE UPDATE OR DELETE ON public.listing_downloads
  FOR EACH ROW EXECUTE FUNCTION public.listing_downloads_immutable();

CREATE INDEX IF NOT EXISTS listing_downloads_listing_idx ON public.listing_downloads(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listing_downloads_buyer_idx   ON public.listing_downloads(buyer_id, created_at DESC);

-- ==================== listing_wishlist ====================
CREATE TABLE IF NOT EXISTS public.listing_wishlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.listing_wishlist TO authenticated;
GRANT ALL ON public.listing_wishlist TO service_role;

ALTER TABLE public.listing_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_wishlist_owner_all"
  ON public.listing_wishlist FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS listing_wishlist_user_idx ON public.listing_wishlist(user_id);
