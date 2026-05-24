// connector-feed — Supabase Edge Function (Phase 32)
//
// Read-only feed of curated JomoPak metric tiles for an external operating
// system (Aman OS). The caller passes a shared connector key; we return the
// latest published snapshot. There is no write path here — the OS can only read,
// and only ever sees the aggregated tiles, never raw rows.
//
// Required function secret:
//   CONNECTOR_API_KEY — the shared key Aman OS must present (header x-connector-key).
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connector-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const connectorKey = Deno.env.get('CONNECTOR_API_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Function environment is not configured.' }, 500);
    }
    if (!connectorKey) {
      return json({ error: 'Connector is not set up. Set CONNECTOR_API_KEY.' }, 500);
    }

    const presented = request.headers.get('x-connector-key');
    if (!presented || presented !== connectorKey) {
      return json({ error: 'Invalid or missing connector key.' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin
      .from('connector_feed')
      .select('tiles, contract_version, published_at')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      return json({ error: `Feed read failed: ${error.message}` }, 500);
    }

    return json({
      source: 'jomopak',
      contractVersion: data?.contract_version ?? 1,
      publishedAt: data?.published_at ?? null,
      tiles: data?.tiles ?? [],
    });
  } catch (err) {
    return json({ error: `Unexpected error: ${String(err)}` }, 500);
  }
});
