"""Split the build data into the small files the web app loads.

Inputs (data/build/, written by import_idealista_listings.py and prepare.py):
  listings.geojson.gz  every listing with its full Idealista payload
  places.json.gz       every shop row [lon, lat, group, status, areaId, name, addr, activity, hours]

Outputs (web/data/, deployed):
  l-{mad,bcn}-{sale,rent}.json  slim list payload per city + operation (what ranking needs)
  d/{id}.json                   full detail for one listing, fetched when it is opened
  p-{mad,bcn}.json              shop rows per city, lazy-loaded after the leads render
  and rewrites web/index.html with content-hashed ?v= URLs so every asset can be cached forever.
"""
from __future__ import annotations

import hashlib
import gzip
import json
import math
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "data" / "build"
WEB = ROOT / "web"
OUT = WEB / "data"
RADIUS_M = 300
CITY = {"Madrid": "mad", "Barcelona": "bcn"}
# heavy text the list does not need; it stays in the detail file
INV_DROP = {"desc_es", "desc_en", "desc_ca", "desc_kind", "features", "admin_levels", "energy", "labels",
            "phone", "contact_name", "location_code", "listing_code", "media", "title_en", "photo_tags"}
AD_WORDS = re.compile(r"aparcamiento|parking|p[aà]rquing|garaje|aparcament|carga|c[aà]rrega|loading|camion|altura|techo|ceiling|al[cç]ada|fachada|fa[cç]ana|frontage|façade", re.I)


def dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def ad_snippets(props: dict) -> str:
    inv = props.get("inv") or {}
    text = "\n".join(t for t in (inv.get("desc_es"), inv.get("desc_ca"), inv.get("desc_en"), (props.get("x") or {}).get("desc")) if isinstance(t, str))
    keep = []
    for part in re.split(r"(?<=[.!?])\s+|\n+", text):
        if AD_WORDS.search(part):
            keep.append(part.strip()[:220])
    return "\n".join(dict.fromkeys(keep))[:1500]


def slim(feature: dict, nb) -> dict:
    p = feature["properties"]
    inv = {k: v for k, v in (p.get("inv") or {}).items() if k not in INV_DROP}
    x = p.get("x") or {}
    sub = (x.get("idealista") or {}).get("detailedType.subTypology")
    sx = {k: x[k] for k in ("thumb", "stats", "modified") if k in x}
    if sub:
        sx["idealista"] = {"detailedType.subTypology": sub}
    sx["rich"] = len(x.get("basics") or []) + len(x.get("desc") or "") // 200 + len(x.get("imgs") or [])
    out = {k: v for k, v in p.items() if k not in ("inv", "x")}
    out.update(inv=inv, x=sx, nb=nb)
    adx = ad_snippets(p)
    if adx:
        out["adx"] = adx
    return {"type": "Feature", "geometry": feature["geometry"], "properties": out}


def micro_counts(lon: float, lat: float, grid: dict) -> list:
    """[open, vacant, closed, {group: distance-weighted count}] within RADIUS_M."""
    kx = 111320 * math.cos(math.radians(lat))
    gx, gy = int(lon * 1000), int(lat * 1000)
    o = v = c = 0
    w = defaultdict(float)
    for dx in (-4, -3, -2, -1, 0, 1, 2, 3, 4):
        for dy in (-3, -2, -1, 0, 1, 2, 3):
            for r in grid.get((gx + dx, gy + dy), ()):
                d = math.hypot((r[0] - lon) * kx, (r[1] - lat) * 110540)
                if d > RADIUS_M:
                    continue
                st = r[3]
                if st == "V":
                    v += 1
                elif st == "C":
                    c += 1
                else:
                    o += 1
                    w[r[2]] += 1 / (1 + d / 150)
    return [o, v, c, {k: round(val, 1) for k, val in w.items()}]


def main() -> None:
    listings = json.loads(gzip.decompress((BUILD / "listings.geojson.gz").read_bytes()))
    places = json.loads(gzip.decompress((BUILD / "places.json.gz").read_bytes()))
    rows = places if isinstance(places, list) else places.get("rows") or places.get("places")
    grid = defaultdict(list)
    for r in rows:
        grid[(int(r[0] * 1000), int(r[1] * 1000))].append(r)

    files = defaultdict(list)
    detail_dir = OUT / "d"
    if detail_dir.exists():
        shutil.rmtree(detail_dir)
    detail_dir.mkdir(parents=True)
    for f in listings["features"]:
        p = f["properties"]
        lon, lat = f["geometry"]["coordinates"][:2]
        city = CITY.get(p.get("m")) or str(p.get("i", "x-"))[:3]
        files[f"l-{city}-{p.get('op', 'sale')}"].append(slim(f, micro_counts(lon, lat, grid)))
        (detail_dir / f"{p['id']}.json").write_text(dumps({"inv": p.get("inv"), "x": p.get("x")}), encoding="utf-8")

    by_city = defaultdict(list)
    for r in rows:
        by_city[str(r[4])[:3]].append(r)

    written = {}
    for name, feats in files.items():
        written[name] = dumps({"type": "FeatureCollection", "features": feats})
    for city, rs in by_city.items():
        written[f"p-{city}"] = dumps(rs)
    versions = {}
    for name, text in written.items():
        path = OUT / f"{name}.json"
        path.write_text(text, encoding="utf-8")
        size = path.stat().st_size
        assert size < 20 * 1024 * 1024, f"{path} is {size} bytes, too close to the 25 MiB asset cap"
        versions[name] = hashlib.sha1(text.encode()).hexdigest()[:10]
        print(f"{path.relative_to(ROOT)}  {size / 1e6:.2f} MB")
    detail_hash = hashlib.sha1()
    for path in sorted(detail_dir.iterdir()):
        detail_hash.update(path.read_bytes())
    versions["d"] = detail_hash.hexdigest()[:10]
    for name in ("areas.geojson", "meta.json"):
        versions[name.split(".")[0]] = hashlib.sha1((OUT / name).read_bytes()).hexdigest()[:10]
    stamp_index(versions)


def stamp_index(versions: dict) -> None:
    """Content-hash every local asset URL in index.html and inline the data versions."""
    html_path = WEB / "index.html"
    html = html_path.read_text(encoding="utf-8")

    def ver(match):
        attr, url = match.group(1), match.group(2)
        local = WEB / url
        if not local.exists():
            return match.group(0)
        return f'{attr}="{url}?v={hashlib.sha1(local.read_bytes()).hexdigest()[:10]}"'

    html = re.sub(r'(src|href)="((?:vendor/|assets/)?[\w.-]+\.(?:js|css|png))(?:\?v=[\w]+)?"', ver, html)
    block = f'<script id="ps-data">window.PS_DATA={dumps(versions)};</script>'
    # start the first-paint data downloads while the scripts are still parsing
    preload = "".join(
        f'<link rel="preload" as="fetch" crossorigin href="data/{n}?v={versions[n.split(".")[0]]}" data-ps-preload />'
        for n in ("areas.geojson", "l-mad-sale.json", "l-mad-rent.json", "l-bcn-sale.json", "l-bcn-rent.json")
    )
    block = preload + block
    html = re.sub(r'(<link rel="preload"[^>]*data-ps-preload />)*<script id="ps-data">', '<script id="ps-data">', html)
    html = re.sub(r'<script id="ps-data">.*?</script>', lambda _m: block, html, flags=re.S)
    if 'id="ps-data"' not in html:
        html = html.replace("</head>", f"    {block}\n  </head>")
    html_path.write_text(html, encoding="utf-8")
    print("stamped index.html", versions)


if __name__ == "__main__":
    main()
