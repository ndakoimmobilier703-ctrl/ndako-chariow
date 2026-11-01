CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  country TEXT DEFAULT 'Congo',
  country_code TEXT DEFAULT 'CG',
  city TEXT DEFAULT 'Brazzaville',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert to site_visits" ON public.site_visits;
CREATE POLICY "Allow public insert to site_visits" ON public.site_visits FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read to site_visits" ON public.site_visits;
CREATE POLICY "Allow public read to site_visits" ON public.site_visits FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.site_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  button_id TEXT NOT NULL,
  button_label TEXT NOT NULL,
  category TEXT NOT NULL,
  page_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.site_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert to site_interactions" ON public.site_interactions;
CREATE POLICY "Allow public insert to site_interactions" ON public.site_interactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read to site_interactions" ON public.site_interactions;
CREATE POLICY "Allow public read to site_interactions" ON public.site_interactions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.listing_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  visitor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert to listing_reviews" ON public.listing_reviews;
CREATE POLICY "Allow public insert to listing_reviews" ON public.listing_reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read to listing_reviews" ON public.listing_reviews;
CREATE POLICY "Allow public read to listing_reviews" ON public.listing_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update to listing_reviews" ON public.listing_reviews;
CREATE POLICY "Allow public update to listing_reviews" ON public.listing_reviews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete to listing_reviews" ON public.listing_reviews;
CREATE POLICY "Allow public delete to listing_reviews" ON public.listing_reviews FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 100,
  max_uses INTEGER NOT NULL DEFAULT 50,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_banner_published BOOLEAN NOT NULL DEFAULT FALSE,
  banner_text TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMPTZ NOT NULL,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read to promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public read to promo_codes" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert to promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public insert to promo_codes" ON public.promo_codes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update to promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public update to promo_codes" ON public.promo_codes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete to promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public delete to promo_codes" ON public.promo_codes FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.site_customization (
  id TEXT PRIMARY KEY DEFAULT 'current',
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.site_customization ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read to site_customization" ON public.site_customization;
CREATE POLICY "Allow public read to site_customization" ON public.site_customization FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert to site_customization" ON public.site_customization;
CREATE POLICY "Allow public insert to site_customization" ON public.site_customization FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update to site_customization" ON public.site_customization;
CREATE POLICY "Allow public update to site_customization" ON public.site_customization FOR UPDATE USING (true);

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'bedrooms'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN bedrooms INTEGER DEFAULT 2;
  END IF;
END $$;