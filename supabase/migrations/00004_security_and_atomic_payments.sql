-- Ndako security hardening and atomic payment processing.
-- Existing transaction history is preserved.

-- A real Supabase Auth account must be created for the administrator, then its
-- auth.users UUID inserted into admin_users (see docs/CHARIOW_NDAKO_SETUP.md).
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_ndako_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_ndako_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_ndako_admin() TO anon, authenticated;

-- Align the legacy promo table with the fields used by the current application.
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'free_publication',
  ADD COLUMN IF NOT EXISTS discount_value INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_users INTEGER,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banner_text TEXT;
UPDATE public.promo_codes
SET discount_type = CASE WHEN COALESCE(discount_percent, 100) >= 100 THEN 'free_publication' ELSE 'percentage' END,
    discount_value = COALESCE(discount_percent, 100),
    max_users = COALESCE(max_users, max_uses),
    starts_at = COALESCE(starts_at, start_date),
    expires_at = COALESCE(expires_at, end_date)
WHERE starts_at IS NULL OR expires_at IS NULL OR max_users IS NULL;
ALTER TABLE public.promo_codes
  ALTER COLUMN end_date DROP NOT NULL,
  ALTER COLUMN starts_at SET DEFAULT now(),
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- Persist the launch codes that were previously only available as browser fallbacks.
INSERT INTO public.promo_codes (
  code, description, discount_type, discount_value, max_uses, current_uses,
  max_users, starts_at, expires_at, is_active, is_banner_published, banner_text, created_by
) VALUES
  ('NDAKO-BIENVENUE', 'Offre spéciale de bienvenue : une publication gratuite', 'free_publication', 100, 100, 14, 100, now() - interval '7 days', now() + interval '60 days', true, true, 'Offre de bienvenue Ndako', 'Administrateur'),
  ('CONGO2026', 'Offre de lancement Ndako', 'free_publication', 100, 50, 38, 50, now() - interval '14 days', now() + interval '30 days', true, false, 'Publication gratuite avec CONGO2026', 'Administrateur'),
  ('IMMO-VIP', 'Code privilège agences et partenaires immobiliers', 'free_publication', 100, 20, 5, 20, now() - interval '3 days', now() + interval '90 days', true, false, 'Offre partenaire Ndako', 'Administrateur')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  user_phone TEXT,
  discount_applied INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Atomic, server-only publication for free mode and 100%-discount promo codes.
CREATE OR REPLACE FUNCTION public.create_ndako_free_listing(
  p_plan_id TEXT,
  p_listing JSONB,
  p_promo_code TEXT DEFAULT NULL,
  p_payer_name TEXT DEFAULT NULL,
  p_payer_phone TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.platform_settings%ROWTYPE;
  v_plan public.publication_plans%ROWTYPE;
  v_promo public.promo_codes%ROWTYPE;
  v_has_promo BOOLEAN := false;
  v_listing_id UUID;
  v_now TIMESTAMPTZ := now();
  v_reference TEXT := 'NDAKO-FREE-' || gen_random_uuid()::text;
  v_discount INTEGER := 0;
  v_unique_users INTEGER := 0;
  v_listing_updated INTEGER := 0;
  v_is_free_mode BOOLEAN := false;
BEGIN
  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 'default' FOR SHARE;
  IF NOT FOUND OR COALESCE(v_settings.allow_public_listings, true) = false THEN
    RAISE EXCEPTION 'La publication est temporairement suspendue.';
  END IF;
  SELECT * INTO v_plan FROM public.publication_plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Formule de publication indisponible.'; END IF;

  v_is_free_mode := v_settings.mode_publication = 'free';
  IF NOT v_is_free_mode THEN
    IF NULLIF(trim(p_promo_code), '') IS NULL THEN
      RAISE EXCEPTION 'Un code promotionnel valide est requis.';
    END IF;
    SELECT * INTO v_promo FROM public.promo_codes
      WHERE upper(code) = upper(trim(p_promo_code)) FOR UPDATE;
    IF NOT FOUND OR v_promo.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Code promotionnel invalide ou désactivé.';
    END IF;
    IF COALESCE(v_promo.starts_at, v_promo.start_date) > v_now
      OR COALESCE(v_promo.expires_at, v_promo.end_date) < v_now THEN
      RAISE EXCEPTION 'Ce code promotionnel n’est pas actif à cette date.';
    END IF;
    IF v_promo.current_uses >= v_promo.max_uses THEN
      RAISE EXCEPTION 'La limite d’utilisation de ce code est atteinte.';
    END IF;
    IF v_promo.max_users IS NOT NULL AND NULLIF(trim(p_payer_phone), '') IS NOT NULL THEN
      SELECT count(DISTINCT user_phone) INTO v_unique_users FROM public.promo_code_uses WHERE promo_code_id = v_promo.id AND user_phone IS NOT NULL;
      IF v_unique_users >= v_promo.max_users AND NOT EXISTS (SELECT 1 FROM public.promo_code_uses WHERE promo_code_id = v_promo.id AND user_phone = p_payer_phone) THEN
        RAISE EXCEPTION 'La limite de bénéficiaires de ce code promotionnel est atteinte.';
      END IF;
    END IF;
    IF v_promo.discount_type = 'free_publication' THEN
      v_discount := v_plan.price_fcfa;
    ELSIF v_promo.discount_type = 'percentage' THEN
      v_discount := round(v_plan.price_fcfa * LEAST(100, GREATEST(0, v_promo.discount_value)) / 100.0)::INTEGER;
    ELSIF v_promo.discount_type = 'fixed_amount' THEN
      v_discount := LEAST(v_plan.price_fcfa, GREATEST(0, v_promo.discount_value));
    ELSE
      RAISE EXCEPTION 'Type de code promotionnel non pris en charge.';
    END IF;
    IF v_discount < v_plan.price_fcfa THEN
      RAISE EXCEPTION 'Ce code ne couvre pas la totalité des frais de publication.';
    END IF;
    v_has_promo := true;
  END IF;

  IF length(trim(COALESCE(p_listing->>'title', ''))) < 4
    OR length(trim(COALESCE(p_listing->>'description', ''))) < 10
    OR length(trim(COALESCE(p_listing->>'city', ''))) < 2
    OR length(trim(COALESCE(p_listing->>'country', ''))) < 2
    OR length(trim(COALESCE(p_listing->>'whatsapp_number', ''))) < 7
    OR length(trim(COALESCE(p_listing->>'phone_number', ''))) < 7 THEN
    RAISE EXCEPTION 'Certains champs obligatoires de l’annonce sont manquants.';
  END IF;

  INSERT INTO public.listings (
    title, description, property_type, price, currency, caution_months,
    bedrooms, bathrooms, surface_sqm, parking_spaces, country, country_code,
    city, neighborhood, address, photos, amenities, whatsapp_number,
    phone_number, advertiser_name, status, publication_mode, duration_days,
    published_at, expires_at, featured, views_count
  ) VALUES (
    trim(p_listing->>'title'), trim(p_listing->>'description'),
    COALESCE(NULLIF(p_listing->>'property_type', ''), 'Autre'),
    GREATEST(1, COALESCE((p_listing->>'price')::INTEGER, 1)),
    COALESCE(NULLIF(p_listing->>'currency', ''), 'FCFA'),
    GREATEST(1, LEAST(24, COALESCE((p_listing->>'caution_months')::INTEGER, 1))),
    GREATEST(0, COALESCE((p_listing->>'bedrooms')::INTEGER, 0)),
    GREATEST(0, COALESCE((p_listing->>'bathrooms')::INTEGER, 0)),
    GREATEST(0, COALESCE((p_listing->>'surface_sqm')::INTEGER, 0)),
    GREATEST(0, COALESCE((p_listing->>'parking_spaces')::INTEGER, 0)),
    trim(p_listing->>'country'), upper(trim(p_listing->>'country_code')),
    trim(p_listing->>'city'), COALESCE(trim(p_listing->>'neighborhood'), ''),
    NULLIF(trim(p_listing->>'address'), ''),
    CASE WHEN jsonb_typeof(p_listing->'photos') = 'array' THEN p_listing->'photos' ELSE '[]'::jsonb END,
    CASE WHEN jsonb_typeof(p_listing->'amenities') = 'array' THEN p_listing->'amenities' ELSE '[]'::jsonb END,
    trim(p_listing->>'whatsapp_number'), trim(p_listing->>'phone_number'),
    COALESCE(NULLIF(trim(p_listing->>'advertiser_name'), ''), 'Propriétaire'),
    'active', 'free', v_plan.duration_days, v_now,
    v_now + make_interval(days => v_plan.duration_days), true, 0
  ) RETURNING id INTO v_listing_id;

  INSERT INTO public.transactions (
    reference, listing_id, amount, currency, status, payment_method,
    payer_name, payer_phone, provider, metadata
  ) VALUES (
    v_reference, v_listing_id, 0, 'XOF', 'success',
    CASE WHEN v_has_promo THEN 'CODE PROMO' ELSE 'PUBLICATION GRATUITE' END,
    NULLIF(trim(p_payer_name), ''), NULLIF(trim(p_payer_phone), ''),
    'ndako_free', jsonb_build_object('plan_id', v_plan.id, 'duration_days', v_plan.duration_days, 'promo_code', CASE WHEN v_has_promo THEN upper(trim(p_promo_code)) ELSE NULL END)
  );

  IF v_has_promo THEN
    UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;
    INSERT INTO public.promo_code_uses (promo_code_id, code, listing_id, user_phone, discount_applied)
    VALUES (v_promo.id, v_promo.code, v_listing_id, p_payer_phone, v_discount);
  END IF;

  RETURN jsonb_build_object('id', v_listing_id, 'reference', v_reference, 'status', 'active');
END;
$$;
REVOKE ALL ON FUNCTION public.create_ndako_free_listing(TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ndako_free_listing(TEXT, JSONB, TEXT, TEXT, TEXT) TO service_role;

-- Apply a signed Chariow Pulse exactly once and update payment + listing in one DB transaction.
CREATE OR REPLACE FUNCTION public.process_ndako_chariow_pulse(
  p_delivery_id TEXT,
  p_pulse_id TEXT,
  p_event_name TEXT,
  p_reference TEXT,
  p_sale_id TEXT,
  p_product_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_completed_at TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_inserted INTEGER;
  v_listing_updated INTEGER;
BEGIN
  IF p_delivery_id IS NULL OR length(p_delivery_id) < 8 OR p_event_name NOT IN ('successful.sale','failed.sale','abandoned.sale') THEN
    RAISE EXCEPTION 'Invalid Pulse delivery.';
  END IF;
  INSERT INTO public.chariow_pulse_deliveries(delivery_id, pulse_id, event_name)
  VALUES (p_delivery_id, p_pulse_id, p_event_name)
  ON CONFLICT (delivery_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN RETURN jsonb_build_object('received', true, 'duplicate', true); END IF;

  SELECT * INTO v_tx FROM public.transactions
    WHERE reference = p_reference AND provider = 'chariow' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown Ndako payment reference.'; END IF;
  IF v_tx.provider_sale_id IS NOT NULL AND p_sale_id IS NOT NULL AND v_tx.provider_sale_id <> p_sale_id THEN
    RAISE EXCEPTION 'Chariow sale ID mismatch.';
  END IF;
  IF v_tx.provider_product_id IS NOT NULL AND p_product_id IS NOT NULL AND v_tx.provider_product_id <> p_product_id THEN
    RAISE EXCEPTION 'Chariow product ID mismatch.';
  END IF;

  IF p_event_name = 'successful.sale' THEN
    IF p_amount IS NULL OR p_amount <> v_tx.amount OR upper(COALESCE(p_currency,'')) <> 'XOF' THEN
      RAISE EXCEPTION 'Paid amount or currency mismatch.';
    END IF;
    IF v_tx.status = 'pending' THEN
      SELECT * INTO v_listing FROM public.listings WHERE id = v_tx.listing_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Linked listing not found.'; END IF;
      UPDATE public.listings SET
        status = 'active', publication_mode = 'paid', published_at = COALESCE(p_completed_at, now()),
        expires_at = COALESCE(p_completed_at, now()) + make_interval(days => duration_days)
      WHERE id = v_listing.id AND status = 'pending_payment';
      GET DIAGNOSTICS v_listing_updated = ROW_COUNT;
      IF v_listing_updated <> 1 THEN RAISE EXCEPTION 'Listing is not awaiting payment.'; END IF;
      UPDATE public.transactions SET status = 'success',
        provider_sale_id = COALESCE(p_sale_id, provider_sale_id),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('chariow_event', p_event_name, 'completed_at', COALESCE(p_completed_at, now()))
      WHERE id = v_tx.id AND status = 'pending';
    END IF;
  ELSIF v_tx.status = 'pending' THEN
    UPDATE public.listings SET status = 'expired' WHERE id = v_tx.listing_id AND status = 'pending_payment';
    UPDATE public.transactions SET status = 'failed',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('chariow_event', p_event_name)
    WHERE id = v_tx.id AND status = 'pending';
  END IF;
  RETURN jsonb_build_object('received', true, 'status', CASE WHEN p_event_name = 'successful.sale' THEN 'success' ELSE 'processed' END);
END;
$$;
REVOKE ALL ON FUNCTION public.process_ndako_chariow_pulse(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_ndako_chariow_pulse(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TIMESTAMPTZ) TO service_role;

ALTER TABLE public.audit_logs ALTER COLUMN admin_email SET DEFAULT 'admin@ndako.local';

-- Remove legacy policies that allowed anyone to change financial or publication data.
DROP POLICY IF EXISTS "Public write platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admin manage publication_plans" ON public.publication_plans;
DROP POLICY IF EXISTS "Public read active listings" ON public.listings;
DROP POLICY IF EXISTS "Public insert listings" ON public.listings;
DROP POLICY IF EXISTS "Public update listings" ON public.listings;
DROP POLICY IF EXISTS "Public delete listings" ON public.listings;
DROP POLICY IF EXISTS "Public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public manage geo_locations" ON public.geo_locations;

CREATE POLICY "Public read platform settings" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage platform settings" ON public.platform_settings FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());
CREATE POLICY "Public read publication plans" ON public.publication_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage publication plans" ON public.publication_plans FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());
CREATE POLICY "Public read active listings" ON public.listings FOR SELECT TO anon, authenticated USING ((status = 'active' AND expires_at > now()) OR public.is_ndako_admin());
CREATE POLICY "Admin manage listings" ON public.listings FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());
CREATE POLICY "Admin manage transactions" ON public.transactions FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());
CREATE POLICY "Admin manage audit logs" ON public.audit_logs FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());
CREATE POLICY "Public read geo locations" ON public.geo_locations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage geo locations" ON public.geo_locations FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());

-- Lock down remaining administrative tables while preserving public review and analytics submissions.
DROP POLICY IF EXISTS "Allow public read to site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Allow public read to site_interactions" ON public.site_interactions;
CREATE POLICY "Admin read site visits" ON public.site_visits FOR SELECT TO authenticated USING (public.is_ndako_admin());
CREATE POLICY "Admin manage site visits" ON public.site_visits FOR DELETE TO authenticated USING (public.is_ndako_admin());
CREATE POLICY "Admin read site interactions" ON public.site_interactions FOR SELECT TO authenticated USING (public.is_ndako_admin());
CREATE POLICY "Admin manage site interactions" ON public.site_interactions FOR DELETE TO authenticated USING (public.is_ndako_admin());

DROP POLICY IF EXISTS "Allow public update to listing_reviews" ON public.listing_reviews;
DROP POLICY IF EXISTS "Allow public delete to listing_reviews" ON public.listing_reviews;
DROP POLICY IF EXISTS "Allow public read to listing_reviews" ON public.listing_reviews;
CREATE POLICY "Public read approved reviews" ON public.listing_reviews FOR SELECT TO anon, authenticated USING (status = 'approved' OR public.is_ndako_admin());
CREATE POLICY "Admin manage reviews" ON public.listing_reviews FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());

DROP POLICY IF EXISTS "Allow public insert to promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public update to promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public delete to promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public read to promo_codes" ON public.promo_codes;
CREATE POLICY "Public read active promo codes" ON public.promo_codes FOR SELECT TO anon, authenticated USING (is_active = true AND COALESCE(starts_at, start_date) <= now() AND COALESCE(expires_at, end_date) >= now());
CREATE POLICY "Admin manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());
CREATE POLICY "Admin read promo uses" ON public.promo_code_uses FOR SELECT TO authenticated USING (public.is_ndako_admin());
CREATE POLICY "Public read site customization" ON public.site_customization FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow public insert to site_customization" ON public.site_customization;
DROP POLICY IF EXISTS "Allow public update to site_customization" ON public.site_customization;
CREATE POLICY "Admin manage site customization" ON public.site_customization FOR ALL TO authenticated USING (public.is_ndako_admin()) WITH CHECK (public.is_ndako_admin());

-- Admin membership table is deliberately not directly readable or writable by clients.

-- Lightweight server-side rate limit for unauthenticated checkout endpoints.
CREATE TABLE IF NOT EXISTS public.payment_checkout_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_checkout_attempts_ip_created_idx
  ON public.payment_checkout_attempts(ip_hash, created_at DESC);
ALTER TABLE public.payment_checkout_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.register_ndako_checkout_attempt(
  p_ip_hash TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_ip_hash IS NULL OR length(p_ip_hash) < 32 OR length(p_ip_hash) > 128 THEN
    RAISE EXCEPTION 'Invalid rate-limit key.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_ip_hash));
  DELETE FROM public.payment_checkout_attempts WHERE created_at < now() - interval '2 days';
  SELECT count(*) INTO v_count FROM public.payment_checkout_attempts
    WHERE ip_hash = p_ip_hash AND created_at >= now() - make_interval(mins => GREATEST(1, LEAST(60, p_window_minutes)));
  IF v_count >= GREATEST(1, LEAST(20, p_max_attempts)) THEN RETURN false; END IF;
  INSERT INTO public.payment_checkout_attempts(ip_hash) VALUES (p_ip_hash);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.register_ndako_checkout_attempt(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_ndako_checkout_attempt(TEXT, INTEGER, INTEGER) TO service_role;


-- Restrict anonymous property image uploads to the formats and size accepted by the form.
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'property-images';
DROP POLICY IF EXISTS "Public upload property-images" ON storage.objects;
DROP POLICY IF EXISTS "Public update property-images" ON storage.objects;
CREATE POLICY "Public upload property images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'property-images' AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'));
