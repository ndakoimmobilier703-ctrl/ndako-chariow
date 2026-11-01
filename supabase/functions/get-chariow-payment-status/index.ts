import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const siteUrl = Deno.env.get('NDAKO_SITE_URL') || 'https://ndakoimmobilier703-ctrl.github.io/ndako-chariow';
let allowedOrigin = 'null';
try { allowedOrigin = new URL(siteUrl).origin; } catch { /* checked at runtime */ }
const headers = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  if (allowedOrigin === 'null' || !siteUrl.startsWith('https://')) return json({ error: 'Configuration du domaine Ndako invalide.' }, 500);
  const origin = req.headers.get('origin');
  if (!origin || origin !== allowedOrigin) return json({ error: 'Origine non autorisée.' }, 403);
  try {
    const { reference } = await req.json();
    if (typeof reference !== 'string' || !/^NDAKO-[a-f0-9-]{36}$/i.test(reference)) {
      return json({ error: 'Référence de paiement invalide.' }, 400);
    }
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return json({ error: 'Configuration serveur incomplète.' }, 500);
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await admin.from('transactions')
      .select('reference,listing_id,amount,currency,status,created_at')
      .eq('reference', reference).eq('provider', 'chariow').maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Paiement introuvable.' }, 404);
    return json({ transaction: data });
  } catch (error) {
    console.error('get-chariow-payment-status error', error);
    return json({ error: 'Impossible de récupérer le statut du paiement.' }, 500);
  }
});
