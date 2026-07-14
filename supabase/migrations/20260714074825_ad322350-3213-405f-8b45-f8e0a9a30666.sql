
-- ============================================================
-- HAPPY X — Phase 14 HIOS schema
-- ============================================================

-- hl_places -------------------------------------------------
CREATE TABLE public.hl_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  country TEXT,
  state TEXT,
  district TEXT,
  city TEXT,
  town TEXT,
  village TEXT,
  locality TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_places TO authenticated;
GRANT ALL ON public.hl_places TO service_role;
ALTER TABLE public.hl_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_places read" ON public.hl_places FOR SELECT TO authenticated USING (true);
CREATE POLICY "hl_places owner write" ON public.hl_places FOR ALL TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE INDEX hl_places_geo_idx ON public.hl_places (latitude, longitude);
CREATE INDEX hl_places_pincode_idx ON public.hl_places (pincode);
CREATE INDEX hl_places_city_idx ON public.hl_places (city);

-- hl_businesses ---------------------------------------------
CREATE TABLE public.hl_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  place_id UUID REFERENCES public.hl_places(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  offers JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_businesses TO authenticated;
GRANT ALL ON public.hl_businesses TO service_role;
ALTER TABLE public.hl_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_businesses read active" ON public.hl_businesses FOR SELECT TO authenticated
  USING (status = 'active' OR owner_id = auth.uid());
CREATE POLICY "hl_businesses owner write" ON public.hl_businesses FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX hl_businesses_geo_idx ON public.hl_businesses (latitude, longitude);
CREATE INDEX hl_businesses_city_idx ON public.hl_businesses (city);
CREATE INDEX hl_businesses_pincode_idx ON public.hl_businesses (pincode);
CREATE INDEX hl_businesses_category_idx ON public.hl_businesses (category);

-- hl_jobs ---------------------------------------------------
CREATE TABLE public.hl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.hl_businesses(id) ON DELETE SET NULL,
  place_id UUID REFERENCES public.hl_places(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL DEFAULT 'full_time',
  category TEXT,
  city TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  pay_min NUMERIC,
  pay_max NUMERIC,
  currency TEXT DEFAULT 'INR',
  contact TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_jobs TO authenticated;
GRANT ALL ON public.hl_jobs TO service_role;
ALTER TABLE public.hl_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_jobs read active" ON public.hl_jobs FOR SELECT TO authenticated
  USING (status = 'active' OR posted_by = auth.uid());
CREATE POLICY "hl_jobs owner write" ON public.hl_jobs FOR ALL TO authenticated
  USING (auth.uid() = posted_by) WITH CHECK (auth.uid() = posted_by);
CREATE INDEX hl_jobs_geo_idx ON public.hl_jobs (latitude, longitude);
CREATE INDEX hl_jobs_city_idx ON public.hl_jobs (city);

-- hl_events -------------------------------------------------
CREATE TABLE public.hl_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.hl_places(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  venue TEXT,
  city TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_events TO authenticated;
GRANT ALL ON public.hl_events TO service_role;
ALTER TABLE public.hl_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_events read active" ON public.hl_events FOR SELECT TO authenticated
  USING (status = 'active' OR organizer_id = auth.uid());
CREATE POLICY "hl_events owner write" ON public.hl_events FOR ALL TO authenticated
  USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);
CREATE INDEX hl_events_geo_idx ON public.hl_events (latitude, longitude);
CREATE INDEX hl_events_starts_idx ON public.hl_events (starts_at);

-- hl_alerts -------------------------------------------------
CREATE TABLE public.hl_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.hl_places(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'community',
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  city TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km NUMERIC DEFAULT 5,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_alerts TO authenticated;
GRANT ALL ON public.hl_alerts TO service_role;
ALTER TABLE public.hl_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_alerts read active" ON public.hl_alerts FOR SELECT TO authenticated
  USING (status = 'active' OR posted_by = auth.uid());
CREATE POLICY "hl_alerts owner write" ON public.hl_alerts FOR ALL TO authenticated
  USING (auth.uid() = posted_by) WITH CHECK (auth.uid() = posted_by);
CREATE INDEX hl_alerts_geo_idx ON public.hl_alerts (latitude, longitude);

-- hl_reviews ------------------------------------------------
CREATE TABLE public.hl_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.hl_businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_reviews TO authenticated;
GRANT ALL ON public.hl_reviews TO service_role;
ALTER TABLE public.hl_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_reviews read all" ON public.hl_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "hl_reviews owner write" ON public.hl_reviews FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- hl_user_location (private opt-in preferences) -------------
CREATE TABLE public.hl_user_location (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_precise BOOLEAN NOT NULL DEFAULT false,
  allow_background BOOLEAN NOT NULL DEFAULT false,
  last_place_id UUID REFERENCES public.hl_places(id) ON DELETE SET NULL,
  last_latitude DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  city TEXT,
  pincode TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hl_user_location TO authenticated;
GRANT ALL ON public.hl_user_location TO service_role;
ALTER TABLE public.hl_user_location ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_user_location self" ON public.hl_user_location FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Attach touch triggers (function already exists) -----------
SELECT public._hxp_attach_touch('public.hl_places');
SELECT public._hxp_attach_touch('public.hl_businesses');
SELECT public._hxp_attach_touch('public.hl_jobs');
SELECT public._hxp_attach_touch('public.hl_events');
SELECT public._hxp_attach_touch('public.hl_alerts');
SELECT public._hxp_attach_touch('public.hl_reviews');
