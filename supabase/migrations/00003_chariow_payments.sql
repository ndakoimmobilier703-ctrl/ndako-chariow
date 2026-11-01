-- Chariow payment tracking for Ndako. Existing transactions are preserved.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS allow_public_listings BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_homepage_promo_ads BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_product_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_sale_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_provider_sale_id_unique
  ON public.transactions(provider, provider_sale_id)
  WHERE provider_sale_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.chariow_pulse_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT NOT NULL UNIQUE,
  pulse_id TEXT,
  event_name TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chariow_pulse_deliveries ENABLE ROW LEVEL SECURITY;
-- No public policies: only the Supabase service role may write/read webhook deliveries.

CREATE INDEX IF NOT EXISTS transactions_status_created_at_idx
  ON public.transactions(status, created_at DESC);

COMMENT ON COLUMN public.transactions.provider IS 'Payment provider: chariow, manual, or legacy.';
COMMENT ON COLUMN public.transactions.provider_product_id IS 'Chariow public product ID used for this checkout.';
COMMENT ON COLUMN public.transactions.provider_sale_id IS 'Chariow sale ID returned in checkout/webhook.';
