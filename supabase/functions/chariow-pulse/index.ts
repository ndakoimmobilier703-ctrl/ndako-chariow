import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left[i] ^ right[i];
  return result === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const rawBody = await req.text();
    if (rawBody.length > 128_000) return json({ error: 'Payload too large' }, 413);

    const secret = Deno.env.get('CHARIOW_PULSE_SECRET');
    const signature = req.headers.get('x-chariow-signature') || '';
    const deliveryId = req.headers.get('x-pulse-delivery-id') || '';
    const pulseId = req.headers.get('x-pulse-id');
    const eventHeader = req.headers.get('x-pulse-event') || '';
    if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature) || deliveryId.length < 8 || deliveryId.length > 255) {
      return json({ error: 'Missing or invalid Pulse signature/delivery ID' }, 401);
    }

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
    const expected = `sha256=${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
    if (!safeEqual(signature, expected)) return json({ error: 'Invalid signature' }, 401);

    const payload = JSON.parse(rawBody);
    const eventName = String(payload?.event || eventHeader);
    if (eventHeader && payload?.event && eventHeader !== payload.event) return json({ error: 'Event header mismatch' }, 400);
    if (!['successful.sale', 'failed.sale', 'abandoned.sale'].includes(eventName)) return json({ received: true, ignored: true });

    const sale = payload?.sale || {};
    if (eventName === 'successful.sale' && (typeof sale.id !== 'string' || typeof payload?.product?.id !== 'string')) {
      return json({ error: 'Sale or product identifier missing' }, 400);
    }
    const customMetadata = sale.custom_metadata || {};
    const reference = customMetadata.ndako_reference;
    // This Pulse may be configured for the whole Chariow store. Ignore unrelated sales.
    if (typeof reference !== 'string' || !/^NDAKO-[a-f0-9-]{36}$/i.test(reference)) {
      return json({ received: true, ignored: true });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Supabase not configured' }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data, error } = await admin.rpc('process_ndako_chariow_pulse', {
      p_delivery_id: deliveryId,
      p_pulse_id: pulseId,
      p_event_name: eventName,
      p_reference: reference,
      p_sale_id: typeof sale.id === 'string' ? sale.id : null,
      p_product_id: typeof payload?.product?.id === 'string' ? payload.product.id : null,
      p_amount: eventName === 'successful.sale' ? Number(sale.amount?.value) : null,
      p_currency: eventName === 'successful.sale' ? String(sale.amount?.currency || '').toUpperCase() : null,
      p_completed_at: typeof sale.completed_at === 'string' && !Number.isNaN(Date.parse(sale.completed_at)) ? new Date(sale.completed_at).toISOString() : null,
    });
    if (error) {
      console.error('Chariow Pulse processing rejected', error.message);
      return json({ error: 'Pulse could not be applied' }, 400);
    }
    return json(data || { received: true });
  } catch (error) {
    console.error('chariow-pulse error', error);
    return json({ error: 'Invalid Pulse payload' }, 400);
  }
});
