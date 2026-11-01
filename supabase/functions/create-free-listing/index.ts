import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const siteUrl = Deno.env.get('NDAKO_SITE_URL') || 'https://ndakoimmobilier703-ctrl.github.io/ndako-chariow';
let allowedOrigin = 'null';
try { allowedOrigin = new URL(siteUrl).origin; } catch { /* checked below */ }
const headers = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const clean = (value: unknown, max = 5000) => String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const required = (value: unknown, max = 255) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  const origin = req.headers.get('origin');
  if (!origin || origin !== allowedOrigin) return json({ error: 'Origine non autorisée.' }, 403);
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 128_000) return json({ error: 'Demande trop volumineuse.' }, 413);
    const body = await req.json();
    if (JSON.stringify(body).length > 128_000) return json({ error: 'Demande trop volumineuse.' }, 413);
    const planId = clean(body.planId, 80);
    const listing = body.listing ?? {};
    const customer = body.customer ?? {};
    if (!required(planId, 80)) return json({ error: 'Formule invalide.' }, 400);
    for (const field of ['title', 'description', 'property_type', 'country', 'country_code', 'city', 'neighborhood', 'whatsapp_number', 'phone_number']) {
      if (!required(listing[field], field === 'description' ? 5000 : 255)) return json({ error: `Le champ ${field} est obligatoire.` }, 400);
    }
    const rent = Number(listing.price);
    if (!Number.isSafeInteger(rent) || rent <= 0) return json({ error: 'Loyer invalide.' }, 400);
    const photos = Array.isArray(listing.photos) ? listing.photos.slice(0, 12) : [];
    if (photos.some((photo: unknown) => {
      if (typeof photo !== 'string') return true;
      try { return new URL(photo).protocol !== 'https:'; } catch { return true; }
    })) return json({ error: 'Une photo contient une adresse invalide.' }, 400);

    if (allowedOrigin === 'null' || !siteUrl.startsWith('https://')) return json({ error: 'Le domaine Ndako doit utiliser HTTPS.' }, 500);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey || allowedOrigin === 'null') return json({ error: 'Configuration serveur incomplète.' }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const clientIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    if (!clientIp) return json({ error: 'Impossible de sécuriser cette demande. Réessayez depuis votre navigateur.' }, 400);
    const rateKeyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${clientIp}:${serviceRoleKey}`));
    const rateKey = Array.from(new Uint8Array(rateKeyBytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed, error: rateError } = await admin.rpc('register_ndako_checkout_attempt', { p_ip_hash: rateKey, p_max_attempts: 5, p_window_minutes: 15 });
    if (rateError) return json({ error: 'Vérification de sécurité indisponible. Réessayez plus tard.' }, 503);
    if (allowed !== true) return json({ error: 'Trop de tentatives de publication. Veuillez patienter 15 minutes.' }, 429);
    const listingPayload = {
      title: clean(listing.title, 255), description: clean(listing.description, 5000),
      property_type: clean(listing.property_type, 60), price: rent,
      currency: clean(listing.currency || 'FCFA', 12),
      caution_months: Math.max(1, Math.min(24, Number(listing.caution_months) || 1)),
      bedrooms: Math.max(0, Number(listing.bedrooms) || 0),
      bathrooms: Math.max(0, Number(listing.bathrooms) || 0),
      surface_sqm: Math.max(0, Number(listing.surface_sqm) || 0),
      parking_spaces: Math.max(0, Number(listing.parking_spaces) || 0),
      country: clean(listing.country, 100), country_code: clean(listing.country_code, 2).toUpperCase(),
      city: clean(listing.city, 120), neighborhood: clean(listing.neighborhood, 120),
      address: clean(listing.address, 255), photos,
      amenities: Array.isArray(listing.amenities) ? listing.amenities.slice(0, 30).map((x: unknown) => clean(x, 80)) : [],
      whatsapp_number: clean(listing.whatsapp_number, 30), phone_number: clean(listing.phone_number, 30),
      advertiser_name: clean(listing.advertiser_name || customer.name || 'Propriétaire', 100),
    };
    const { data, error } = await admin.rpc('create_ndako_free_listing', {
      p_plan_id: planId,
      p_listing: listingPayload,
      p_promo_code: typeof body.promoCode === 'string' ? clean(body.promoCode, 100) : null,
      p_payer_name: clean(customer.name, 100),
      p_payer_phone: clean(customer.phone, 30),
    });
    if (error) {
      const message = error.message || 'Publication gratuite impossible.';
      return json({ error: message.replace(/^.*?ERROR:\s*/i, '').slice(0, 240) }, 400);
    }
    return json({ listingId: data?.id, reference: data?.reference, status: data?.status });
  } catch (error) {
    console.error('create-free-listing error', error);
    return json({ error: 'Impossible de traiter la publication gratuite.' }, 400);
  }
});
