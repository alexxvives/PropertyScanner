# Property Scanner

Private deal-sourcing map for commercial premises in Madrid and Barcelona: neighbourhood fit
scores per business type, Idealista for-sale listings with an investor summary and a deal
calculator (yield after ITP and costs).

- `worker.mjs` – Cloudflare Worker: login, static assets (`web/`), `/api/walk` (OpenRouteService), `/api/nearby` (Google Places)
- `web/` – MapLibre frontend (`app.js`, `deal.js` = deal calculator + investor fields)
- `etl/` – data builds (`prepare.py`, `context_join.py`, `import_idealista_listings.py`)
- `server.py` – local dev server on http://127.0.0.1:4175 (keys in `config/secrets.env`)

## Local dev

```bash
python server.py                     # http://127.0.0.1:4175, no login (binds to localhost only)
# or, to test the real Worker incl. login/rate limit:
cp .dev.vars.example .dev.vars && npx wrangler dev
```

## Security (Worker)

The deployed app is **private by default**.

| Name | Kind | Purpose |
| --- | --- | --- |
| `APP_PASSWORD` | secret (required) | Shared password for `/login`. Without it the Worker returns 503. |
| `SESSION_SECRET` | secret (recommended) | Signs the 30-day `ps_session` cookie (falls back to `APP_PASSWORD`; changing it logs everyone out). |
| `GOOGLE_MAPS_API_KEY` | secret | `/api/nearby` |
| `OPENROUTESERVICE_API_KEY` | secret | `/api/walk` |
| `API_LIMITER` | rate-limit binding (in `wrangler.jsonc`) | 30 req / 60 s per IP on `/api/*` and `/login` |
| `API_CACHE` | KV binding (optional) | Persistent cache of upstream results (walk 30 d, nearby 7 d). Without it the Cache API is used, which does nothing on `*.workers.dev`. |
| `AUTH_DISABLED` | var, local only | `1` skips login in `wrangler dev`. Never set in production. |

```bash
npx wrangler secret put APP_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GOOGLE_MAPS_API_KEY
npx wrangler secret put OPENROUTESERVICE_API_KEY
npx wrangler kv namespace create API_CACHE   # then add kv_namespaces to wrangler.jsonc
```

API routes also reject cross-origin requests (Origin / Sec-Fetch-Site) and POSTs without an Origin.
Also set an **HTTP referrer / API restriction and a daily quota** on the Google key in Google Cloud as a backstop.

## Listings: investor fields

`etl/import_idealista_listings.py` keeps the full Apify record in `properties.x` (shown behind
the "Raw Idealista data" toggle) and writes a curated `properties.inv` block. The keep/drop
mapping is documented at `curate_listing()` in that file. `etl/listing_first_seen.json` records
the first scrape date per listing to compute days on market (Idealista doesn't expose it).

```bash
python etl/import_idealista_listings.py             # full rebuild from data/raw/*.json
python etl/import_idealista_listings.py --recurate  # refresh only properties.inv
```

## Deal calculator

Per for-sale listing (modal): editable price, size, market rent, ITP (6% Madrid / 10% Catalonia),
notary + registry (1.5%), capex, vacancy and opex. Market rent is the median €/m²/month of rental
listings (`op: "rent"`) within 800 m when at least 3 exist; otherwise a clearly flagged
assumption (16 €/m² Madrid, 18 €/m² Barcelona). Outputs: €/m², gross/net rent, all-in cost,
gross yield, net yield, payback years.
