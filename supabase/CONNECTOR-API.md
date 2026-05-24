# JomoPak → Aman OS Connector API (contract v1)

How Aman OS reads JomoPak. Read-only, curated tiles only — no raw data, no write path.

## Endpoint

```
GET https://<JOMOPAK_SUPABASE_REF>.supabase.co/functions/v1/connector-feed
Headers:
  x-connector-key: <CONNECTOR_API_KEY>          # shared secret (set as a JomoPak function secret)
  apikey: <JOMOPAK_SUPABASE_ANON_KEY>           # required by Supabase's function gateway
```

- Wrong/missing `x-connector-key` → `401`.
- Method other than GET → `405`.
- The OS holds the key server-side (e.g. in its own edge function / connector-ingest) — never in the browser.

## Response shape

```json
{
  "source": "jomopak",
  "contractVersion": 1,
  "publishedAt": "2026-05-24T08:00:00.000Z",
  "tiles": [
    {
      "key": "jomopak.finance.ar_outstanding",
      "category": "Finance",
      "label": "Owed to us (debtors)",
      "value": 142350.0,
      "unit": "ZAR",
      "detail": "3 overdue"
    }
  ]
}
```

### Tile fields
| field | meaning |
|---|---|
| `key` | stable, namespaced id — use it as the dedupe/upsert key on the OS side |
| `category` | `Finance` \| `Sales` \| `Production` \| `Stock` \| `Compliance` \| `Tax` |
| `label` | human label to render |
| `value` | numeric value |
| `unit` | `ZAR` \| `%` \| `count` \| `days` \| `units` \| `''` |
| `detail` | optional secondary line (e.g. "3 overdue") |

`tiles` already reflects JomoPak's toggles — anything the admin switched off (e.g. wastage) is simply absent. If the connector is disabled, `tiles` is `[]`.

## Tiles currently published (v1)

- **Finance:** revenue this month, debtors outstanding, overdue receivables, creditors outstanding
- **Sales:** open leads, follow-ups due
- **Production:** jobs in progress, jobs due this week, waste this month
- **Stock:** finished goods on hand, spares below reorder
- **Compliance:** open NCRs, open complaints, documents expiring (30d)

## How it's produced (JomoPak side, for reference)

1. On every data sync (and on "Publish now" in **Admin → Aman OS Connector**), JomoPak computes the curated tiles and writes the toggled-on set into a single `connector_feed` row (`id = 'current'`).
2. The `connector-feed` edge function serves that row to anyone presenting the valid key.
3. JomoPak's database is never exposed — only this one curated snapshot.

## Setup checklist (JomoPak)

- [ ] Run `schema-phase32-os-connector.sql`.
- [ ] `supabase functions deploy connector-feed`
- [ ] `supabase secrets set CONNECTOR_API_KEY=<long-random-string>`
- [ ] In **Admin → Aman OS Connector**, confirm tiles + hit "Publish now".
- [ ] Give Aman OS the endpoint URL + the `CONNECTOR_API_KEY`.

## Recommended consumption (Aman OS side)

- Poll this endpoint on a schedule (e.g. every 5–15 min) **from an Aman OS edge function**, not the browser, so the key stays server-side.
- Upsert tiles into the OS `module_feed` by `key`, tagged with the tenant + module = `jomopak`.
- Gate visibility by the tenant's entitlements (a tile shows only if JomoPak published it *and* the tenant is entitled).
- Treat `contractVersion` as a compatibility check; if it bumps, adapt the mapping.
