import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredSiteUrl = Deno.env.get('NDAKO_SITE_URL') || '';
let allowedOrigin = 'null';
try { allowedOrigin = new URL(configuredSiteUrl).origin; } catch { /* validated in handler */ }
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const required = (value: unknown, max = 255) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

const clean = (value: unknown, max = 5000) =>
  String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  const origin = req.headers.get('origin');
  if (!origin || origin !== allowedOrigin) return json({ error: 'Origine non autorisée.' }, 403);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const apiKey = Deno.env.get('CHARIOW_API_KEY');
    const siteUrl = Deno.env.get('NDAKO_SITE_URL');
    if (!supabaseUrl || !serviceRoleKey || !apiKey || !siteUrl || allowedOrigin === 'null') {
      return json({ error: 'Configuration de paiement incomplète côté serveur.' }, 500);
    }
    let parsedSiteUrl: URL;
    try { parsedSiteUrl = new URL(siteUrl); } catch { return json({ error: 'URL publique Ndako invalide.' }, 500); }
    if (parsedSiteUrl.protocol !== 'https:') return json({ error: 'Le domaine Ndako doit utiliser HTTPS.' }, 500);

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 128_000) return json({ error: 'Demande trop volumineuse.' }, 413);
    const body = await req.json();
    const planId = clean(body.planId, 80);
    const listing = body.listing ?? {};
    if (JSON.stringify(body).length > 128_000) return json({ error: 'Demande trop volumineuse.' }, 413);
    const customer = body.customer ?? {};
    if (!required(planId, 80)) return json({ error: 'Formule invalide.' }, 400);
    if (!required(customer.email, 255) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return json({ error: 'Adresse e-mail invalide.' }, 400);
    }
    if (!required(customer.name, 100) || !required(customer.phone, 30) || !required(customer.countryCode, 2)) {
      return json({ error: 'Nom et numéro de téléphone requis.' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const clientIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    if (!clientIp) return json({ error: 'Impossible de sécuriser cette demande. Réessayez depuis votre navigateur.' }, 400);
    const rateKeyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${clientIp}:${serviceRoleKey}`));
    const rateKey = Array.from(new Uint8Array(rateKeyBytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed, error: rateError } = await admin.rpc('register_ndako_checkout_attempt', { p_ip_hash: rateKey, p_max_attempts: 5, p_window_minutes: 15 });
    if (rateError) return json({ error: 'Vérification de sécurité indisponible. Réessayez plus tard.' }, 503);
    if (allowed !== true) return json({ error: 'Trop de tentatives de publication. Veuillez patienter 15 minutes.' }, 429);
    const { data: settings, error: settingsError } = await admin.from('platform_settings').select('*').eq('id', 'default').maybeSingle();
    if (settingsError || !settings) return json({ error: 'Impossible de vérifier les paramètres de publication.' }, 503);
    if (settings.allow_public_listings === false) return json({ error: 'La publication est temporairement suspendue.' }, 403);
    if (settings?.mode_publication === 'free') return json({ error: 'La publication est actuellement gratuite. Rechargez la page.' }, 409);

    const { data: plan, error: planError } = await admin
      .from('publication_plans').select('*').eq('id', planId).eq('is_active', true).single();
    if (planError || !plan) return json({ error: 'Cette formule n’est plus disponible.' }, 400);

    const productEnvKey = ({
      plan_1_week: 'CHARIOW_PRODUCT_1_WEEK',
      plan_2_weeks: 'CHARIOW_PRODUCT_2_WEEKS',
      plan_1_month: 'CHARIOW_PRODUCT_1_MONTH',
    } as Record<string, string>)[planId];
    const productId = productEnvKey ? Deno.env.get(productEnvKey) : null;
    if (!productId) return json({ error: `Identifiant Chariow manquant pour la formule ${plan.title}.` }, 503);

    // Verify the live Chariow product before charging: published, repeat-purchase friendly
    // license SKU, fixed one-time price, and exact XOF amount matching Ndako's tariff.
    const productResponse = await fetch(`https://api.chariow.com/v1/products/${encodeURIComponent(productId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const productResult = await productResponse.json().catch(() => ({}));
    const chariowProduct = productResult?.data;
    const livePrice = chariowProduct?.pricing?.current_price;
    if (!productResponse.ok || !chariowProduct) return json({ error: 'Produit Chariow introuvable ou inaccessible.' }, 503);
    if (chariowProduct.status !== 'published') return json({ error: 'Le produit Chariow correspondant à cette formule n’est pas publié.' }, 503);
    if (chariowProduct.type !== 'license') return json({ error: 'Le produit Chariow doit être de type License pour permettre les achats répétés via API.' }, 503);
    if (chariowProduct.pricing?.type !== 'one_time' || chariowProduct.has_variant_pricing === true || Number(livePrice?.value) !== Number(plan.price_fcfa) || String(livePrice?.currency).toUpperCase() !== 'XOF') {
      return json({ error: `Le tarif du produit Chariow doit être exactement de ${plan.price_fcfa} XOF. Vérifiez le prix et la devise dans Chariow.` }, 409);
    }

    const requiredListingFields = ['title', 'description', 'property_type', 'country', 'country_code', 'city', 'neighborhood', 'whatsapp_number', 'phone_number'];
    for (const field of requiredListingFields) {
      if (!required(listing[field], field === 'description' ? 5000 : 255)) {
        return json({ error: `Le champ ${field} est obligatoire.` }, 400);
      }
    }
    const photoList = Array.isArray(listing.photos) ? listing.photos.slice(0, 12) : [];
    if (photoList.some((photo: unknown) => {
      if (typeof photo !== 'string') return true;
      try { return new URL(photo).protocol !== 'https:'; } catch { return true; }
    })) return json({ error: 'Une photo contient une adresse invalide.' }, 400);
    const rent = Number(listing.price);
    if (!Number.isSafeInteger(rent) || rent <= 0) return json({ error: 'Loyer invalide.' }, 400);
    const rawPhone = clean(customer.phone, 30);
    let phoneDigitsRaw = rawPhone.replace(/\D/g, '');
    if (phoneDigitsRaw.startsWith('00')) phoneDigitsRaw = phoneDigitsRaw.slice(2);
    const phonePrefixes = [
      { prefix: '242', country: 'CG' }, { prefix: '225', country: 'CI' },
      { prefix: '221', country: 'SN' }, { prefix: '237', country: 'CM' },
      { prefix: '229', country: 'BJ' },
    ];
    const detectedPrefix = phonePrefixes.find((item) => phoneDigitsRaw.startsWith(item.prefix));
    const countryCode = detectedPrefix?.country || clean(customer.countryCode, 2).toUpperCase();
    const phoneDigits = detectedPrefix ? phoneDigitsRaw.slice(detectedPrefix.prefix.length) : phoneDigitsRaw;
    if (phoneDigits.length < 7) return json({ error: 'Numéro de téléphone invalide.' }, 400);
    if (!/^[A-Z]{2}$/.test(countryCode)) return json({ error: 'Indicatif pays invalide.' }, 400);

    const nameParts = clean(customer.name, 100).split(/\s+/);
    const firstName = (nameParts.shift() || 'Client').slice(0, 50);
    const lastName = (nameParts.join(' ') || 'Ndako').slice(0, 50);
    const now = new Date();
    const listingPayload = {
      title: clean(listing.title, 255),
      description: clean(listing.description, 5000),
      property_type: clean(listing.property_type, 60),
      price: rent,
      currency: clean(listing.currency || 'FCFA', 12),
      caution_months: Math.max(1, Math.min(24, Number(listing.caution_months) || 1)),
      bedrooms: Math.max(0, Number(listing.bedrooms) || 0),
      bathrooms: Math.max(0, Number(listing.bathrooms) || 0),
      surface_sqm: Math.max(0, Number(listing.surface_sqm) || 0),
      parking_spaces: Math.max(0, Number(listing.parking_spaces) || 0),
      country: clean(listing.country, 100),
      country_code: clean(listing.country_code, 2).toUpperCase(),
      city: clean(listing.city, 120),
      neighborhood: clean(listing.neighborhood, 120),
      address: clean(listing.address, 255),
      photos: photoList,
      amenities: Array.isArray(listing.amenities) ? listing.amenities.slice(0, 30).map((x: unknown) => clean(x, 80)) : [],
      whatsapp_number: clean(listing.whatsapp_number, 30),
      phone_number: clean(listing.phone_number, 30),
      advertiser_name: clean(listing.advertiser_name || customer.name, 100),
      status: 'pending_payment',
      publication_mode: 'paid',
      duration_days: Number(plan.duration_days),
      published_at: now.toISOString(),
      expires_at: new Date(now.getTime() + Number(plan.duration_days) * 86400000).toISOString(),
      featured: true,
      views_count: 0,
    };

    const { data: createdListing, error: listingError } = await admin
      .from('listings').insert(listingPayload).select('id').single();
    if (listingError || !createdListing) throw new Error('Impossible de créer le brouillon de l’annonce.');

    const reference = `NDAKO-${crypto.randomUUID()}`;
    const { error: transactionError } = await admin.from('transactions').insert({
      reference,
      listing_id: createdListing.id,
      amount: Number(plan.price_fcfa),
      currency: 'XOF',
      status: 'pending',
      payment_method: 'CHARIOW',
      payer_name: clean(customer.name, 100),
      payer_phone: clean(customer.phone, 30),
      provider: 'chariow',
      provider_product_id: productId,
      metadata: { plan_id: plan.id, duration_days: plan.duration_days, listing_id: createdListing.id },
    });
    if (transactionError) {
      await admin.from('listings').delete().eq('id', createdListing.id);
      throw new Error('Impossible d’enregistrer la demande de paiement.');
    }

    const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const buyerIp = req.headers.get('cf-connecting-ip') || forwardedFor;
    let checkoutResponse: Response;
    try {
      checkoutResponse = await fetch('https://api.chariow.com/v1/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        email: String(customer.email).trim().toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: { number: phoneDigits, country_code: countryCode },
        payment_currency: 'XOF',
        redirect_url: `${parsedSiteUrl.origin}/paiement/retour?reference=${encodeURIComponent(reference)}`,
        ...(buyerIp ? { customer_ip: buyerIp } : {}),
        custom_metadata: {
          ndako_reference: reference,
          ndako_listing_id: createdListing.id,
          ndako_plan_id: plan.id,
        },
      }),
      });
    } catch {
      await admin.from('transactions').update({ status: 'failed', metadata: { plan_id: plan.id, chariow_error: 'Network error while creating checkout' } }).eq('reference', reference);
      await admin.from('listings').delete().eq('id', createdListing.id);
      throw new Error('Chariow est temporairement inaccessible. Aucun paiement n’a été lancé. Réessayez dans quelques instants.');
    }
    const chariowResult = await checkoutResponse.json().catch(() => ({}));
    const checkoutData = chariowResult?.data;
    const checkoutUrl = checkoutData?.payment?.checkout_url;
    const saleId = checkoutData?.purchase?.id;
    let safeCheckoutUrl = false;
    try { safeCheckoutUrl = typeof checkoutUrl === 'string' && new URL(checkoutUrl).protocol === 'https:'; } catch { safeCheckoutUrl = false; }
    const checkoutAmount = Number(checkoutData?.purchase?.amount?.value);
    const checkoutCurrency = String(checkoutData?.purchase?.amount?.currency || '').toUpperCase();
    const validSaleId = typeof saleId === 'string' && /^sal_[A-Za-z0-9]+$/.test(saleId);
    if (!checkoutResponse.ok || checkoutData?.step !== 'payment' || !safeCheckoutUrl || !validSaleId || checkoutAmount !== Number(plan.price_fcfa) || checkoutCurrency !== 'XOF') {
      await admin.from('transactions').update({ status: 'failed', metadata: { plan_id: plan.id, chariow_error: chariowResult?.message || 'Checkout unavailable' } }).eq('reference', reference);
      await admin.from('listings').delete().eq('id', createdListing.id);
      return json({ error: chariowResult?.message || 'Chariow n’a pas pu démarrer le paiement.' }, 502);
    }

    const { error: saleUpdateError } = await admin.from('transactions').update({
      provider_sale_id: saleId,
    }).eq('reference', reference).eq('status', 'pending');
    if (saleUpdateError) {
      await admin.from('transactions').update({ status: 'failed', metadata: { plan_id: plan.id, chariow_error: 'Could not persist Chariow sale ID' } }).eq('reference', reference);
      await admin.from('listings').delete().eq('id', createdListing.id);
      throw new Error('Impossible de sécuriser la référence du paiement. Aucun lien de paiement ne sera affiché.');
    }

    return json({ checkoutUrl, reference, listingId: createdListing.id });
  } catch (error) {
    console.error('start-chariow-checkout error', error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inattendue lors du paiement.' }, 500);
  }
});
