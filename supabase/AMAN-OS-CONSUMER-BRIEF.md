# Brief: wire Aman OS to read the JomoPak connector feed

Paste this into the Aman OS build. Goal: pull JomoPak's curated tiles on a
schedule, store them, render them. **Read-only. Key stays server-side. Never call
JomoPak from the browser.**

---

## What JomoPak already provides (don't change this side)

```
GET  https://<JOMOPAK_REF>.supabase.co/functions/v1/connector-feed
Headers:
  x-connector-key: <CONNECTOR_API_KEY>     # shared secret
  apikey:          <JOMOPAK_ANON_KEY>      # required by Supabase's function gateway
```

Response:
```json
{
  "source": "jomopak",
  "contractVersion": 1,
  "publishedAt": "2026-05-24T08:00:00Z",
  "tiles": [
    { "key": "jomopak.finance.ar_outstanding", "category": "Finance",
      "label": "Owed to us (debtors)", "value": 142350.0, "unit": "ZAR", "detail": "3 overdue" }
  ]
}
```
Tiles already respect JomoPak's on/off toggles; disabled ones are simply absent.

---

## Build in Aman OS

### 1. Secrets (Aman OS Supabase → function secrets)
```
JOMOPAK_FEED_URL      = https://<JOMOPAK_REF>.supabase.co/functions/v1/connector-feed
JOMOPAK_CONNECTOR_KEY = <the CONNECTOR_API_KEY you set on JomoPak>
JOMOPAK_ANON_KEY      = <JomoPak project anon key>
```

### 2. Table to store pulled tiles (Aman OS DB)
```sql
create table if not exists public.module_feed (
  tenant_id   text not null,
  module_key  text not null,            -- 'jomopak'
  tile_key    text not null,            -- 'jomopak.finance.ar_outstanding'
  category    text not null default '',
  label       text not null default '',
  value       numeric not null default 0,
  unit        text not null default '',
  detail      text not null default '',
  contract_version integer not null default 1,
  published_at timestamptz,
  fetched_at  timestamptz not null default now(),
  primary key (tenant_id, module_key, tile_key)
);
alter table public.module_feed enable row level security;
-- read policy: members of the tenant can select; writes happen via service role only.
```

### 3. Aman OS edge function `pull-jomopak` (Deno)
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

Deno.serve(async (req) => {
  const tenantId = new URL(req.url).searchParams.get('tenant') ?? 'default';
  const feedUrl = Deno.env.get('JOMOPAK_FEED_URL')!;
  const key     = Deno.env.get('JOMOPAK_CONNECTOR_KEY')!;
  const anon    = Deno.env.get('JOMOPAK_ANON_KEY')!;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const res = await fetch(feedUrl, { headers: { 'x-connector-key': key, apikey: anon } });
  if (!res.ok) return new Response(`Feed error ${res.status}`, { status: 502 });
  const feed = await res.json(); // { tiles, contractVersion, publishedAt }

  const rows = (feed.tiles ?? []).map((t: any) => ({
    tenant_id: tenantId, module_key: 'jomopak', tile_key: t.key,
    category: t.category, label: t.label, value: t.value, unit: t.unit, detail: t.detail ?? '',
    contract_version: feed.contractVersion ?? 1, published_at: feed.publishedAt, fetched_at: new Date().toISOString(),
  }));

  // remove tiles JomoPak no longer publishes, then upsert the current set
  await admin.from('module_feed').delete().eq('tenant_id', tenantId).eq('module_key', 'jomopak');
  if (rows.length) await admin.from('module_feed').upsert(rows);

  return new Response(JSON.stringify({ pulled: rows.length }), { headers: { 'Content-Type': 'application/json' } });
});
```
Deploy: `supabase functions deploy pull-jomopak`.

### 4. Schedule it
Run every 10–15 min (Supabase scheduled function / pg_cron calling the function),
or trigger it on dashboard load. Each run refreshes `module_feed`.

### 5. Render
Read `module_feed where module_key = 'jomopak'` for the current tenant, gate by the
tenant's entitlements (show a tile only if it's in the feed AND the tenant is
entitled to it), and render the tiles as cards grouped by `category`.

---

## Rules
- The connector key lives **only** in the edge function env — never in the browser bundle.
- One-way: Aman OS only ever **reads**. There is no write path back to JomoPak.
- Treat `contractVersion` as a compatibility check; if JomoPak bumps it, adjust the mapping.
- Map `unit`: `ZAR` → format as currency, `%` → percent, `count`/`units`/`days` → plain number.
