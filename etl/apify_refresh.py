"""Incremental Idealista refresh via Apify, capped to the free monthly credit.

  python3 etl/apify_refresh.py --dry-run      # plan + cost, no network, no spend (default)
  python3 etl/apify_refresh.py --usage        # read-only: real monthly usage + limits (needs APIFY_TOKEN)
  python3 etl/apify_refresh.py --run          # PAID: runs due jobs, never beyond the cap

The token is only read from the APIFY_TOKEN environment variable and is never printed.
New items land in data/raw/<city>_idealista_premises_<op>_inc<date>.json, which
etl/import_idealista_listings.py already picks up (glob *_idealista_premises_*.json, deduped by id).
"""
from __future__ import annotations
import argparse, datetime as dt, json, os, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CFG = json.loads((ROOT / "config/apify_refresh.json").read_text())
API = "https://api.apify.com/v2"


def per_listing(cfg=CFG) -> float:
    p = cfg["price_usd"]
    return p["result"] + (p["fetch_detail"] if cfg["fetch_details"] else 0) + (p["fetch_stats"] if cfg["fetch_stats"] else 0)


def run_cost(items: int, cfg=CFG) -> float:
    starts = max(1, cfg["memory_mb"] // 1024)
    return starts * cfg["price_usd"]["actor_start"] + items * per_listing(cfg)


def monthly_plan(cfg=CFG):
    rows = []
    for j in cfg["jobs"]:
        runs = 30.4 / j["every_days"]
        for op in cfg["operations"]:
            rows.append({**j, "op": op, "runs_month": runs, "usd_month": runs * run_cost(j["max_items"], cfg), "items_month": runs * j["max_items"]})
    return rows


def cap(cfg=CFG) -> float:
    return cfg["monthly_budget_usd"] * (1 - cfg["safety_margin"])


def load_state():
    f = ROOT / CFG["state_file"]
    return json.loads(f.read_text()) if f.exists() else {"month": "", "spent_usd": 0.0, "last_run": {}}


def save_state(s):
    f = ROOT / CFG["state_file"]; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(s, indent=1))


def due_jobs(state, today: dt.date):
    out = []
    for j in CFG["jobs"]:
        for op in CFG["operations"]:
            key = f"{j['city']}-{op}"
            last = state["last_run"].get(key)
            if not last or (today - dt.date.fromisoformat(last)).days >= j["every_days"]:
                out.append((key, j, op))
    return out


def api(path, token, data=None):
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                                 method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=900) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true"); ap.add_argument("--usage", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    today = dt.date.today(); month = today.strftime("%Y-%m")
    state = load_state()
    if state["month"] != month: state = {**state, "month": month, "spent_usd": 0.0}

    plan = monthly_plan()
    tot = sum(r["usd_month"] for r in plan); items = sum(r["items_month"] for r in plan)
    print(f"Per listing: ${per_listing():.4f} (result + detail{' + stats' if CFG['fetch_stats'] else ''}); per run start ${CFG['price_usd']['actor_start']:.3f}")
    print(f"Budget ${CFG['monthly_budget_usd']:.2f} − {int(CFG['safety_margin']*100)}% margin = cap ${cap():.2f}/month → max ≈ {int((cap() - 0.2) / per_listing())} listings/month")
    print(f"{'job':<10}{'every':>7}{'items/run':>11}{'runs/mo':>9}{'items/mo':>10}{'$/mo':>8}")
    for r in plan:
        print(f"{r['city']+'-'+r['op']:<10}{str(r['every_days'])+'d':>7}{r['max_items']:>11}{r['runs_month']:>9.1f}{r['items_month']:>10.0f}{r['usd_month']:>8.2f}")
    print(f"TOTAL {items:.0f} listings/month ≈ ${tot:.2f} (cap ${cap():.2f}) → {'OK' if tot <= cap() else 'OVER CAP'}")
    print(f"Spent this month (tracked): ${state['spent_usd']:.2f}")

    token = os.environ.get("APIFY_TOKEN", "")
    if a.usage:
        if not token: sys.exit("APIFY_TOKEN not set; usage not read.")
        u = api("/users/me/usage/monthly", token)["data"]; l = api("/users/me/limits", token)["data"]
        used = u.get("totalUsageCreditsUsdAfterVolumeDiscount", u.get("totalUsageCreditsUsdBeforeVolumeDiscount"))
        lim = (l.get("limits") or {}).get("maxMonthlyUsageUsd"); cur = (l.get("current") or {}).get("monthlyUsageUsd")
        print(f"Apify usage this cycle: ${cur if cur is not None else used} of ${lim} limit")
        return

    due = due_jobs(state, today)
    print(f"Due today: {', '.join(k for k, _, _ in due) or 'none'}")
    if not a.run:
        print("Dry run: nothing started, nothing spent.")
        return
    if not token: sys.exit("APIFY_TOKEN not set; refusing to run.")
    for key, j, op in due:
        est = run_cost(j["max_items"])
        if state["spent_usd"] + est > cap():
            print(f"Skip {key}: would exceed cap (${state['spent_usd']:.2f} + ${est:.2f} > ${cap():.2f})"); continue
        inp = {"country": "es", "location": j["location"], "operation": op, "propertyType": "premises", "sortBy": "mostRecent",
               "maxItems": j["max_items"], "publicationDate": j["publication_date"],
               "fetchDetails": CFG["fetch_details"], "fetchStats": CFG["fetch_stats"]}
        actor = CFG["actor"].replace("/", "~")
        run = api(f"/acts/{actor}/runs?waitForFinish=60&memory={CFG['memory_mb']}&maxTotalChargeUsd={est:.3f}&timeout={CFG.get('timeout_s', 900)}", token, inp)["data"]
        while run["status"] in ("READY", "RUNNING"):
            run = api(f"/actor-runs/{run['id']}?waitForFinish=60", token)["data"]
        ds = api(f"/datasets/{run['defaultDatasetId']}/items?clean=true&format=json", token)
        out = ROOT / f"data/raw/{j['city']}_idealista_premises_{op}_inc{today:%Y%m%d}.json"
        out.write_text(json.dumps({"items": ds}, ensure_ascii=False))
        cost = run.get("usageTotalUsd") or est
        state["spent_usd"] += cost; state["last_run"][key] = today.isoformat(); save_state(state)
        print(f"{key}: {run['status']} {len(ds)} items ${cost:.3f} → {out.name}")
    print("Next: python3 etl/import_idealista_listings.py && python3 etl/build_web_data.py")


if __name__ == "__main__":
    main()
