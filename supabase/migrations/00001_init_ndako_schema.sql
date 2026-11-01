-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Platform Settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  mode_publication TEXT NOT NULL DEFAULT 'paid', -- 'paid' or 'free'
  allow_instant_publish BOOLEAN NOT NULL DEFAULT true,
  support_phone TEXT DEFAULT '+242 06 000 0000',
  support_whatsapp TEXT DEFAULT '+242060000000',
  support_email TEXT DEFAULT 'contact@ndako.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Publication Plans table
CREATE TABLE IF NOT EXISTS public.publication_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  duration_label TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type TEXT NOT NULL, -- 'Maison', 'Appartement', 'Studio', 'Villa', 'Chambre', 'Autre'
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  caution_months INTEGER NOT NULL DEFAULT 2,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  surface_sqm INTEGER NOT NULL DEFAULT 50,
  parking_spaces INTEGER NOT NULL DEFAULT 0,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL, -- 'CG', 'CI', 'SN', 'CM', 'GH', 'MA', etc.
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  whatsapp_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  advertiser_name TEXT NOT NULL DEFAULT 'Propriétaire',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_payment', 'suspended', 'expired'
  publication_mode TEXT NOT NULL DEFAULT 'paid', -- 'paid' or 'free'
  duration_days INTEGER NOT NULL DEFAULT 30,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'pending', 'failed'
  payment_method TEXT NOT NULL DEFAULT 'Mobile Money',
  payer_name TEXT,
  payer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  admin_email TEXT NOT NULL DEFAULT 'immocongo@idriss.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supported Countries & Cities table for filters
CREATE TABLE IF NOT EXISTS public.geo_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhoods JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storage bucket for property photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS setup
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_locations ENABLE ROW LEVEL SECURITY;

-- Public read access for visitors on platform settings
CREATE POLICY "Public read platform_settings" ON public.platform_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write platform_settings" ON public.platform_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Public read access for publication plans
CREATE POLICY "Public read publication_plans" ON public.publication_plans
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage publication_plans" ON public.publication_plans
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Listings RLS
CREATE POLICY "Public read active listings" ON public.listings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert listings" ON public.listings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update listings" ON public.listings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete listings" ON public.listings
  FOR DELETE TO anon, authenticated USING (true);

-- Transactions RLS
CREATE POLICY "Public read transactions" ON public.transactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert transactions" ON public.transactions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update transactions" ON public.transactions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Audit logs RLS
CREATE POLICY "Public read audit_logs" ON public.audit_logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert audit_logs" ON public.audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Geo locations RLS
CREATE POLICY "Public read geo_locations" ON public.geo_locations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public manage geo_locations" ON public.geo_locations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage bucket policy for public access
CREATE POLICY "Public read property-images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'property-images');
CREATE POLICY "Public upload property-images" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "Public update property-images" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'property-images');

-- Seed Platform Settings
INSERT INTO public.platform_settings (id, mode_publication, allow_instant_publish)
VALUES ('default', 'paid', true)
ON CONFLICT (id) DO UPDATE SET mode_publication = EXCLUDED.mode_publication;

-- Seed Publication Plans (from Cahier des Charges)
INSERT INTO public.publication_plans (id, title, duration_days, duration_label, price_fcfa, is_active, sort_order)
VALUES 
  ('plan_1_week', '1 semaine', 7, '7 jours', 500, true, 1),
  ('plan_2_weeks', '2 semaines', 14, '14 jours', 1000, true, 2),
  ('plan_1_month', '1 mois', 30, '30 jours', 3000, true, 3)
ON CONFLICT (id) DO UPDATE SET price_fcfa = EXCLUDED.price_fcfa;

-- Seed Geo Locations
INSERT INTO public.geo_locations (country, country_code, city, neighborhoods)
VALUES
  ('Congo', 'CG', 'Brazzaville', '["Talangaï", "Bacongo", "Moungali", "Makélékélé", "Ouenzé", "Centre-ville", "Mpila"]'::jsonb),
  ('Congo', 'CG', 'Pointe-Noire', '["Tié-Tié", "Lumumba", "Loandjili", "Mongo-Kamba", "Ngoyo"]'::jsonb),
  ('Côte d''Ivoire', 'CI', 'Abidjan', '["Cocody", "Plateau", "Yopougon", "Marcory", "Deux Plateaux", "Riviera"]'::jsonb),
  ('Sénégal', 'SN', 'Dakar', '["Mermoz", "Almadies", "Ouakam", "Plateau", "Fann", "Ngor"]'::jsonb),
  ('Cameroun', 'CM', 'Yaoundé', '["Bastos", "Omnisports", "Biyem-Assi", "Centre-ville"]'::jsonb),
  ('Cameroun', 'CM', 'Douala', '["Bonanjo", "Akwa", "Bonapriso", "Deido"]'::jsonb),
  ('Ghana', 'GH', 'Accra', '["East Legon", "Airport Residential", "Osu", "Cantonments"]'::jsonb),
  ('Maroc', 'MA', 'Casablanca', '["Aïn Diab", "Maârif", "Gauthier", "Anfa"]'::jsonb)
ON CONFLICT DO NOTHING;
