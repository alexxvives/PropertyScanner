#!/usr/bin/env bash
# Weekly listing refresh: live Apify usage check -> smart refresh (budget-capped) -> rebuild -> deploy.
# Exits 0 without spending (and without deploying) when the cycle budget is used up.
# Needs APIFY_TOKEN in the environment (never printed) and a logged-in wrangler.
set -euo pipefail
cd "$(dirname "$0")/.."
MAX_USD="${MAX_USD:-1.00}"
log="$(mktemp)"
python3 etl/apify_refresh.py --run --max-usd "$MAX_USD" | tee "$log"
if grep -q "nothing spent" "$log"; then echo "No refresh this week; site left as is."; exit 0; fi
python3 etl/import_idealista_listings.py
python3 etl/build_web_data.py
node --check web/app.js
git add etl/listing_last_seen.json etl/listing_delisted.json etl/listing_first_seen.json data/build web/data web/index.html
git -c user.name="Alex Vives" -c user.email="alexxvives@gmail.com" commit -qm "Weekly listing refresh $(date +%F)" || true
git push -q origin "$(git branch --show-current)"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-53808754f4bd94365d6e31351aa426c0}"
npx -y -p node@22 -p wrangler@latest -- wrangler deploy 2>&1 | grep -E "Version ID|Deployed|rror"
