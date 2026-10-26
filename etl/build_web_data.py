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


def _ascii(s: str) -> str:
    import unicodedata
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()


STREET_WORDS = re.compile(r"\b(calle|c|de|del|la|las|los|el|avenida|av|paseo|plaza|carrer|d|l|passeig|avinguda|placa|ronda|travesia|carretera)\b")


def street_no(p: dict) -> tuple:
    """(street, number) from 'Local en Calle de X, 12, Barrio, City'. Either can be None."""
    m = re.match(r"^.*? en (?:rentabilidad en )?([^,]+),(?: (\d+)\b)?", _ascii(p.get("t")))
    if not m:
        return None, None
    street = re.sub(r"\W+", " ", STREET_WORDS.sub(" ", m.group(1))).strip()
    if street == _ascii(p.get("n")).strip() or street == _ascii(p.get("d")).strip():
        street = None  # 'Local en Palacio, Madrid' names the barrio, not a street
    return street or None, m.group(2)


def dedupe(features: list) -> tuple[list, int]:
    """Same premises posted by several agencies: same street/number or same spot, similar size and price.
    Keep the richest ad (photos + text), link the others as `dups`."""
    def km(a, b):
        kx = 111320 * math.cos(math.radians(a[1]))
        return math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * 110540)

    parent = list(range(len(features)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    info = [(f["properties"], f["geometry"]["coordinates"], street_no(f["properties"])) for f in features]
    for i in range(len(features)):
        a, ca, (sa, na) = info[i]
        for j in range(i + 1, len(features)):
            b, cb, (sb, nb) = info[j]
            if a.get("m") != b.get("m") or a.get("op") != b.get("op") or not (a.get("sz") and b.get("sz") and a.get("p") and b.get("p")):
                continue
            if abs(a["sz"] - b["sz"]) > max(10, 0.08 * max(a["sz"], b["sz"])) or abs(a["p"] - b["p"]) > 0.12 * max(a["p"], b["p"]):
                continue
            if (sa and sb and sa != sb) or (na and nb and na != nb):
                continue
            d = km(ca, cb)
            exact = a["sz"] == b["sz"] and abs(a["p"] - b["p"]) <= 0.005 * a["p"]
            if d <= 60 or (sa and sa == sb and d <= 250) or (exact and d <= 300):
                parent[find(j)] = find(i)
    groups = defaultdict(list)
    for i in range(len(features)):
        groups[find(i)].append(i)
    keep, dropped = [], 0
    for idx in groups.values():
        def rich(i):
            p = features[i]["properties"]
            x = p.get("x") or {}
            return (len(x.get("imgs") or []) + len(x.get("desc") or "") // 200, -(int(p["id"]) if str(p["id"]).isdigit() else 0))
        idx.sort(key=rich, reverse=True)
        f = features[idx[0]]
        if len(idx) > 1:
            f["properties"]["dups"] = [
                {"id": features[i]["properties"]["id"], "u": features[i]["properties"].get("u"),
                 "ag": (features[i]["properties"].get("inv") or {}).get("agency") or "private seller",
                 "p": features[i]["properties"].get("p"), "sz": features[i]["properties"].get("sz")}
                for i in idx[1:]
            ]
            dropped += len(idx) - 1
        keep.append(f)
    return keep, dropped


def main() -> None:
    listings = json.loads(gzip.decompress((BUILD / "listings.geojson.gz").read_bytes()))
    places = json.loads(gzip.decompress((BUILD / "places.json.gz").read_bytes()))
    listings["features"], dropped = dedupe(listings["features"])
    print(f"duplicates merged: {dropped}")
    od_path = BUILD / "opendata.json.gz"
    opendata = json.loads(gzip.decompress(od_path.read_bytes()))["rows"] if od_path.exists() else {}
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
        slimmed = slim(f, micro_counts(lon, lat, grid))
        od = opendata.get(str(p["id"]))
        if od:
            slimmed["properties"]["od"] = od
        files[f"l-{city}-{p.get('op', 'sale')}"].append(slimmed)
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
