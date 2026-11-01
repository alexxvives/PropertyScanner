"""Smart, budget-capped Idealista refresh via Apify.

  python3 etl/apify_refresh.py                 # dry run: plan + cost from live usage, nothing spent
  python3 etl/apify_refresh.py --usage         # read-only: real usage + limit this cycle
  python3 etl/apify_refresh.py --run [--max-usd 3]   # PAID, never beyond the cap

How it spends (in order, each step capped):
  1. Cheap sweep  - for every city/op below the coverage target (~150), one search-results run
                    WITHOUT details ($0.0009/result). It confirms which known listings are still
                    live (and their current price) and finds new codes. If the sweep is complete
                    (fewer results than asked), known codes missing from it are marked delisted.
  2. Stale check  - known listings not confirmed by a sweep, ranked by: days since last confirmed,
                    days on market, price drop, cheap €/m² for the area (likely shortlisted).
                    Fetched by property code; removed ads come back "ad not found" (404) and are
                    NOT charged, so they are marked delisted for free.
  3. New listings - details only for codes found in step 1 that we don't have, thinnest
                    city/op first, up to the coverage target.

Cap = min(--max-usd, live limit - 15% of the $5 monthly budget - real usage so far), read live before running.
If the cap is under the minimum useful run the script exits 0 without spending.
The token is read from APIFY_TOKEN only and never printed.

Outputs (data/raw is gitignored):
  data/raw/<city>_idealista_premises_<op>_inc<YYYYMMDD>_{sweep,chk,new}.json  (picked up by the importer)
  etl/listing_last_seen.json   code -> last date the listing was confirmed live (committed)
  etl/listing_delisted.json    code -> date it was found removed (committed; importer drops these)
"""
from __future__ import annotations
import argparse, time, collections, concurrent.futures as cf, datetime as dt, glob, json, os, re, statistics, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CFG = json.loads((ROOT / "config/apify_refresh.json").read_text())
API = "https://api.apify.com/v2"
PRICE = CFG["price_usd"]
START = PRICE["actor_start"] * max(1, CFG["memory_mb"] // 1024)
DETAIL = PRICE["result"] + PRICE["fetch_detail"]      # by code or search+details
SWEEP = PRICE["result"]                                 # search result without details
LAST_SEEN = ROOT / "etl/listing_last_seen.json"
DELISTED = ROOT / "etl/listing_delisted.json"
TARGET = CFG.get("target_per_city_op", 150)
TODAY = dt.date.today()
STAMP = TODAY.strftime("%Y%m%d")


def jload(p, default):
    p = Path(p)
    if not p.exists(): return default
    obj, _ = json.JSONDecoder().raw_decode(p.read_text(encoding="utf-8"))
    return obj


def known_listings():
    """code -> {city, op, price, pm2, area, dom, drop, seen} from every raw export (newest file wins)."""
    files = sorted(glob.glob(str(ROOT / "data/raw/*_idealista_premises_*.json")), key=os.path.getmtime)
    out = {}
    for f in files:
        m = re.match(r"([a-z]{3})_idealista_premises_(sale|rent)", Path(f).name)
        if not m or "test" in f: continue
        fdate = dt.date.fromtimestamp(os.path.getmtime(f)).isoformat()
        for it in jload(f, {}).get("items", []):
            c = str(it.get("propertyCode") or "")
            if not c: continue
            prev = out.get(c, {})
            out[c] = {"city": m[1], "op": m[2], "price": it.get("price") or prev.get("price"),
                      "pm2": it.get("priceByArea") or prev.get("pm2"),
                      "area": it.get("neighborhood") or it.get("district") or prev.get("area") or "",
                      "drop": bool(it.get("priceDropValue") or (it.get("priceInfo") or {}).get("price", {}).get("priceDropInfo")) or prev.get("drop", False),
                      "file_date": max(fdate, prev.get("file_date", ""))}
    return out


def priority(known, last_seen, first_seen):
    """Higher = re-check sooner."""
    med = collections.defaultdict(list)
    for v in known.values():
        if v["pm2"]: med[(v["city"], v["op"], v["area"])].append(v["pm2"])
    med = {k: statistics.median(x) for k, x in med.items() if len(x) >= 3}
    def score(c):
        v = known[c]
        seen = dt.date.fromisoformat(last_seen.get(c, v["file_date"]))
        stale = (TODAY - seen).days
        dom = (TODAY - dt.date.fromisoformat(first_seen.get(c, v["file_date"]))).days
        m = med.get((v["city"], v["op"], v["area"]))
        cheap = 1.0 if (m and v["pm2"] and v["pm2"] < 0.85 * m) else 0.0
        return stale * 1.0 + dom * 0.3 + (5 if v["drop"] else 0) + cheap * 6
    return score


def api(path, token, data=None, raw=False, timeout=60):
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                                 method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        b = r.read()
    return b.decode("utf-8", "replace") if raw else json.loads(b)


def live_usage(token):
    l = api("/users/me/limits", token)["data"]
    return float((l.get("current") or {}).get("monthlyUsageUsd") or 0), float((l.get("limits") or {}).get("maxMonthlyUsageUsd") or CFG["monthly_budget_usd"]), (l.get("monthlyUsageCycle") or {}).get("endAt", "")


def run_actor(token, inp, budget, timeout_s):
    actor = CFG["actor"].replace("/", "~")
    run = api(f"/acts/{actor}/runs?memory={CFG['memory_mb']}&maxTotalChargeUsd={budget:.4f}&timeout={int(timeout_s)}", token, inp)["data"]
    while run["status"] in ("READY", "RUNNING"):
        run = api(f"/actor-runs/{run['id']}?waitForFinish=60", token, timeout=90)["data"]
    for attempt in range(4):
        try:
            items = api(f"/datasets/{run['defaultDatasetId']}/items?clean=true&format=json", token, timeout=300); break
        except Exception:
            if attempt == 3: raise
            time.sleep(5)
    time.sleep(3)
    run = api(f"/actor-runs/{run['id']}", token)["data"]   # charges settle after finish
    log = api(f"/actor-runs/{run['id']}/log", token, raw=True, timeout=120)
    gone = set(re.findall(r"code=(\d+) error=[^\n]*?ad not found", log))
    return run, items, gone


def save_raw(city, op, kind, items):
    if not items: return None
    p = ROOT / f"data/raw/{city}_idealista_premises_{op}_inc{STAMP}_{kind}.json"
    old = jload(p, {"items": []})["items"] if p.exists() else []
    p.write_text(json.dumps({"items": old + items}, ensure_ascii=False))
    return p.name


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true"); ap.add_argument("--usage", action="store_true")
    ap.add_argument("--max-usd", type=float, default=CFG.get("max_usd_per_run", 1.5))
    ap.add_argument("--min-usd", type=float, default=0.05, help="exit without spending below this cap")
    a = ap.parse_args()
    token = os.environ.get("APIFY_TOKEN", "")
    if not token:
        print("APIFY_TOKEN not set: nothing read, nothing spent."); return 0
    used, limit, cycle_end = live_usage(token)
    headroom = limit - CFG["safety_margin"] * CFG["monthly_budget_usd"] - used
    cap = max(0.0, min(a.max_usd, headroom))
    print(f"Apify usage this cycle: ${used:.2f} of ${limit:.2f} (cycle ends {cycle_end[:10]}); keep ${CFG['safety_margin']*CFG['monthly_budget_usd']:.2f} headroom → can spend ${max(headroom,0):.2f}; this run cap ${cap:.2f}")
    if a.usage: return 0
    if cap < a.min_usd:
        print("Budget exhausted for this cycle: nothing started, nothing spent."); return 0

    known = known_listings()
    last_seen = jload(LAST_SEEN, {}); delisted = jload(DELISTED, {}); first_seen = jload(ROOT / "etl/listing_first_seen.json", {})
    for c, v in known.items(): last_seen.setdefault(c, v["file_date"])
    live = {c: v for c, v in known.items() if c not in delisted}
    count = collections.Counter((v["city"], v["op"]) for v in live.values())
    loc = {j["city"]: j["location"] for j in CFG["jobs"]}
    thin = sorted([(count[(c, op)], c, op) for c in loc for op in CFG["operations"] if count[(c, op)] < TARGET])

    cache_f = ROOT / "data/raw/apify_sweep_cache.json"
    cache = jload(cache_f, {})
    def fresh(c, op):
        e = cache.get(f"{c}-{op}")
        return e and (TODAY - dt.date.fromisoformat(e["date"])).days < CFG.get("sweep_every_days", 6)
    # ---- budget split
    spend = 0.0
    sweep_n = CFG.get("sweep_items", 150)
    sweeps = []
    for n, c, op in thin:
        if fresh(c, op): continue
        cost = START + sweep_n * SWEEP
        if spend + cost > cap * 0.45: break
        sweeps.append((c, op, cost)); spend += cost
    check_budget = (cap - spend) * CFG.get("check_share", 0.4)
    print(f"Plan: {len(sweeps)} cheap sweeps (${spend:.2f}), stale re-check up to ${check_budget:.2f}, new details with the rest")
    if not a.run:
        rank = priority(live, last_seen, first_seen)
        top = sorted((c for c in live if live[c]["city"] not in {s[0] for s in sweeps}), key=rank, reverse=True)
        print(f"  thin city/op (count<{TARGET}): {', '.join(f'{c}-{op}:{n}' for n, c, op in thin) or 'none'}")
        print(f"  first codes to re-check: {', '.join(top[:8])} … ({len(top)} candidates)")
        print("Dry run: nothing started, nothing spent."); return 0

    report = collections.defaultdict(lambda: collections.Counter())
    spent = 0.0
    def charge(run): return float(run.get("usageTotalUsd") or 0)

    # ---- 1. cheap sweeps (parallel)
    new_codes = collections.defaultdict(list)
    rows = {}
    confirmed = set()
    for key, e in cache.items():   # recent sweeps: reuse their new codes, no new charge
        c, op = key.split("-")
        for k, row in e.get("new", {}).items():
            if k not in live and k not in delisted: new_codes[(c, op)].append(k); rows[k] = row
    with cf.ThreadPoolExecutor(4) as ex:
        futs = {ex.submit(run_actor, token, {"country": "es", "location": loc[c], "operation": op, "propertyType": "premises",
                                             "sortBy": "mostRecent", "maxItems": sweep_n, "fetchDetails": False, "fetchStats": False},
                          cost + 0.002, 900): (c, op) for c, op, cost in sweeps}
        for f in cf.as_completed(futs):
            c, op = futs[f]
            try: run, items, _ = f.result()
            except Exception as e: print(f"sweep {c}-{op} failed: {type(e).__name__}"); continue
            spent += charge(run)
            codes = {str(i.get("propertyCode")) for i in items}
            mine = {k for k, v in live.items() if v["city"] == c and v["op"] == op}
            for i in items:
                k = str(i.get("propertyCode"))
                if k in mine:
                    if live[k]["price"] and i.get("price") and int(i["price"]) != int(live[k]["price"]): report[(c, op)]["price_changed"] += 1
                    confirmed.add(k); last_seen[k] = TODAY.isoformat(); report[(c, op)]["confirmed"] += 1
                elif k not in delisted: new_codes[(c, op)].append(k); rows[k] = i
            save_raw(c, op, "sweep", [i for i in items if str(i.get("propertyCode")) in mine])
            if not items:
                print(f"sweep {c}-{op}: 0 results, treated as a failed search (nothing marked)"); continue
            cache[f"{c}-{op}"] = {"date": TODAY.isoformat(), "new": {k: rows[k] for k in new_codes[(c, op)]}}
            cache_f.write_text(json.dumps(cache, ensure_ascii=False))
            if len(items) < sweep_n:   # complete inventory: absent = gone
                for k in mine - codes: delisted[k] = TODAY.isoformat(); report[(c, op)]["removed"] += 1
            print(f"sweep {c}-{op}: {len(items)} results, {len(mine & codes)} known still live, {len(new_codes[(c, op)])} new codes, ${charge(run):.3f}")

    # ---- 2. stale re-check by code (removed ads are free)
    remaining = cap - spent
    check_budget = min(remaining, remaining * CFG.get("check_share", 0.4) / 1.0)
    rank = priority(live, last_seen, first_seen)
    cands = sorted((k for k in live if k not in confirmed and k not in delisted), key=rank, reverse=True)
    groups = collections.defaultdict(list)
    n_check = max(0, int((check_budget - 2 * START) / DETAIL))
    for k in cands[:n_check]: groups[live[k]["op"]].append(k)
    def recheck(op, codes, budget):
        return run_actor(token, {"country": "es", "propertyCodes": codes, "maxItems": len(codes), "operation": op, "propertyType": "premises", "fetchDetails": True, "fetchStats": False},
                         budget, 300 + 6 * len(codes))
    with cf.ThreadPoolExecutor(2) as ex:
        futs = {ex.submit(recheck, op, codes, START + len(codes) * DETAIL + 0.002): op for op, codes in groups.items() if codes}
        for f in cf.as_completed(futs):
            op = futs[f]
            try: run, items, gone = f.result()
            except Exception as e: print(f"re-check {op} failed: {type(e).__name__}"); continue
            spent += charge(run)
            bycity = collections.defaultdict(list)
            for i in items:
                k = str(i.get("propertyCode")); v = live.get(k)
                if not v: continue
                st = str(i.get("state") or (i.get("_details") or {}).get("state") or "active").lower()
                if st != "active":
                    delisted[k] = TODAY.isoformat(); report[(v["city"], op)]["removed"] += 1; continue
                if v["price"] and i.get("price") and int(i["price"]) != int(v["price"]): report[(v["city"], op)]["price_changed"] += 1
                last_seen[k] = TODAY.isoformat(); report[(v["city"], op)]["refreshed"] += 1; bycity[v["city"]].append(i)
            for k in gone:
                if k in live: delisted[k] = TODAY.isoformat(); report[(live[k]["city"], op)]["removed"] += 1
            for c, its in bycity.items(): save_raw(c, op, "chk", its)
            print(f"re-check {op}: {len(groups[op])} codes → {len(items)} live, {len(gone)} removed (free), ${charge(run):.3f}")

    # ---- 3. new listings, thinnest first, up to target
    remaining = cap - spent - 0.01
    asks = []
    for n, c, op in sorted(thin):
        want = max(0, TARGET - (count[(c, op)] - report[(c, op)]["removed"]))
        codes = new_codes.get((c, op), [])[:want]
        if not codes: continue
        cost = START + len(codes) * DETAIL
        if cost > remaining:
            codes = codes[:max(0, int((remaining - START) / DETAIL))]; cost = START + len(codes) * DETAIL
        if len(codes) < 3: break
        asks.append((c, op, codes, cost)); remaining -= cost
    with cf.ThreadPoolExecutor(4) as ex:
        futs = {ex.submit(recheck, op, codes, cost + 0.002): (c, op) for c, op, codes, cost in asks}
        for f in cf.as_completed(futs):
            c, op = futs[f]
            try: run, items, gone = f.result()
            except Exception as e: print(f"new {c}-{op} failed: {type(e).__name__}"); continue
            spent += charge(run)
            merged = []
            for i in items:
                k = str(i.get("propertyCode")); last_seen[k] = TODAY.isoformat()
                merged.append({**rows.get(k, {}), **i})   # search row + fresh details
                cache.get(f"{c}-{op}", {}).get("new", {}).pop(k, None)
            cache_f.write_text(json.dumps(cache, ensure_ascii=False))
            save_raw(c, op, "new", merged); report[(c, op)]["added"] += len(items)
            print(f"new {c}-{op}: {len(items)} added, ${charge(run):.3f}")

    LAST_SEEN.write_text(json.dumps(dict(sorted(last_seen.items())), indent=0) + "\n")
    DELISTED.write_text(json.dumps(dict(sorted(delisted.items())), indent=0) + "\n")
    st = jload(ROOT / CFG["state_file"], {}); st.setdefault("runs", []).append({"date": TODAY.isoformat(), "spent_usd": round(spent, 4)})
    (ROOT / CFG["state_file"]).write_text(json.dumps(st, indent=1))
    time.sleep(5)
    used2, limit2, _ = live_usage(token)
    spent = max(spent, used2 - used)
    print("\ncity-op    confirmed refreshed price_chg removed added")
    for (c, op), r in sorted(report.items()):
        print(f"{c+'-'+op:<10}{r['confirmed']:>10}{r['refreshed']:>10}{r['price_changed']:>10}{r['removed']:>8}{r['added']:>6}")
    print(f"Spent this run: ${spent:.3f} (cap ${cap:.2f}). Usage now ${used2:.2f} of ${limit2:.2f}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
