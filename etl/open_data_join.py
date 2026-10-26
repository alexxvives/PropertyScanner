"""Join free open data to every listing (Round 19). Writes data/build/opendata.json.gz, keyed by listing id.

Sources (downloaded into data/raw/r19/, which is gitignored):
  ped0.csv        Madrid pedestrian counters, datos.madrid.es 300321-0 (hourly, Jan-Jun 2024)
  osm_pts.json    OpenStreetMap (Geofabrik madrid + cataluna extracts): public car parks, loading docks,
                  schools, offices; made by etl/osm_extract.py
  bcn_cd.csv      Barcelona loading bays, Open Data BCN zones-carrega-descarrega
  mad_cd.csv      Madrid reserved loading bays (carga y descarga), datos.madrid.es 208072-0
  ine_31097_city.csv / ine_30896_city.csv   INE household income atlas by census section (Madrid / Barcelona)
  ine_31105_city.csv / ine_30904_city.csv   INE atlas demographic indicators by census section
  secc/SECC_CE_20240101.*                   INE census section boundaries 2024

Per listing:
  ped: [people per day, metres, counter address]   nearest Madrid counter within 600 m
  pk:  [car parks within 300 m, metres to nearest, known spaces within 300 m]
  ld:  [loading bays within 100 m, metres to nearest]  (Madrid official bays + OSM)
  sc:  schools within 400 m;  of: offices within 400 m
  sec: {id, inc (net income per person), hinc (per household), hh (household size), age, p65, one (one-person homes %), yr}
"""
from __future__ import annotations

import csv
import io
import gzip
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "r19"
BUILD = ROOT / "data" / "build"


def dist(a, b):
    kx = 111320 * math.cos(math.radians(a[1]))
    return math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * 110540)


def fix_coord(s: str, lat: bool) -> float:
    s = s.strip().replace(",", ".")
    neg = s.startswith("-")
    digits = s.replace("-", "").replace(".", "")
    whole = 2 if lat else 1
    v = float(digits[:whole] + "." + digits[whole:])
    return -v if neg else v


def counters():
    path = RAW / "ped0.csv"
    if not path.exists():
        return []
    tot, days, info = defaultdict(int), defaultdict(set), {}
    with path.open(encoding="utf-8-sig") as h:
        for r in csv.DictReader(h, delimiter=";"):
            k = r["identificador"]
            tot[k] += int(r["peatones"] or 0)
            days[k].add(r["fecha"][:10])
            info[k] = (r["direccion"].split(",")[0].strip(), fix_coord(r["longitude"], False), fix_coord(r["latitude"], True))
    # two sensors on one spot (both pavements) add up
    spots = {}
    for k, (name, lon, lat) in info.items():
        key = (round(lon, 4), round(lat, 4))
        n = tot[k] / max(1, len(days[k]))
        if key in spots:
            spots[key][0] += n
        else:
            spots[key] = [n, name, lon, lat]
    return [(round(n), name, lon, lat) for n, name, lon, lat in spots.values()]


def grid_of(points):
    g = defaultdict(list)
    for p in points:
        g[(int(p[1] * 200), int(p[2] * 200))].append(p)
    return g


def near(g, lon, lat, r):
    gx, gy = int(lon * 200), int(lat * 200)
    out = []
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for p in g.get((gx + dx, gy + dy), ()):
                d = dist((lon, lat), (p[1], p[2]))
                if d <= r:
                    out.append((d, p))
    return out


def ine_rows(*names):
    vals = defaultdict(dict)
    for name in names:
        path = RAW / name
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as h:
            for line in h:
                parts = line.rstrip("\n").split(";")
                if len(parts) < 6 or "sección" not in parts[2]:
                    continue
                code = parts[2].split()[0]
                try:
                    v = float(parts[5].replace(".", "").replace(",", "."))
                except ValueError:
                    continue
                key, yr = parts[3], int(parts[4])
                if yr >= vals[code].get(key, (0, 0))[0]:
                    vals[code][key] = (yr, v)
    return vals


def sections():
    base = RAW / "secc" / "SECC_CE_20240101"
    if not base.with_suffix(".shp").exists():
        return None
    import shapefile
    from shapely.geometry import shape
    from shapely.strtree import STRtree
    r = shapefile.Reader(str(base))
    geoms, codes = [], []
    for sr in r.iterShapeRecords():
        if sr.record["CUMUN"] in ("28079", "08019"):
            geoms.append(shape(sr.shape.__geo_interface__))
            codes.append(sr.record["CUSEC"])
    return STRtree(geoms), geoms, codes


def mitma_districts():
    """MITMA daily district trips (streamed + aggregated by etl/mitma_stream.py into mitma/agg_YYYYMMDD.json).
    Returns per district: [weekday visitors from other districts, Saturday visitors, peak hour weekday]."""
    d = RAW / "mitma"
    aggs = sorted(d.glob("agg_*.json")) if d.exists() else []
    if not aggs or not (d / "zonificacion_distritos.shp").exists():
        return None
    import datetime
    import shapefile
    from shapely.geometry import shape
    from shapely.strtree import STRtree
    wd, we = defaultdict(list), defaultdict(list)
    peak = {}
    for f in aggs:
        a = json.loads(f.read_text())
        sat = datetime.date(int(a["day"][:4]), int(a["day"][4:6]), int(a["day"][6:])).weekday() >= 5
        for k, v in a["ext"].items():
            (we if sat else wd)[k].append(v)
            if not sat:
                h = a["hr"][k]
                peak[k] = h.index(max(h))
    vis = {k: [round(sum(wd[k]) / len(wd[k])) if wd[k] else None, round(sum(we[k]) / len(we[k])) if we[k] else None, peak.get(k)] for k in set(wd) | set(we)}
    r = shapefile.Reader(str(d / "zonificacion_distritos.shp"))
    fid = [f[0] for f in r.fields[1:]].index("ID")
    geoms, codes = [], []
    for sr in r.iterShapeRecords():
        c = str(sr.record[fid])
        if c in vis:
            geoms.append(shape(sr.shape.__geo_interface__))
            codes.append(c)
    return STRtree(geoms), geoms, codes, vis


def main():
    from pyproj import Transformer
    from shapely.geometry import Point

    listings = json.loads(gzip.decompress((BUILD / "listings.geojson.gz").read_bytes()))["features"]
    ped = counters()
    osm = json.loads((RAW / "osm_pts.json").read_text()) if (RAW / "osm_pts.json").exists() else []
    by = defaultdict(list)
    for k, lon, lat, cap in osm:
        by[k].append((k, lon, lat, cap))
    if (RAW / "mad_cd.csv").exists():
        with (RAW / "mad_cd.csv").open(encoding="latin-1") as h:
            for r in csv.DictReader(h, delimiter=";"):
                try:
                    by["load"].append(("load", float(r["Longitud"]), float(r["Latitud"]), None))
                except (ValueError, KeyError):
                    pass
    if (RAW / "bcn_cd.csv").exists():  # Open Data BCN zones-carrega-descarrega (UTF-16 CSV)
        raw = (RAW / "bcn_cd.csv").read_bytes()
        txt = raw.decode("utf-16") if raw[:2] in (b"\xff\xfe", b"\xfe\xff") else raw.decode("utf-8-sig")
        seen = set()
        for r in csv.DictReader(io.StringIO(txt)):
            try:
                k = (r["geo_epgs_4326_lon"], r["geo_epgs_4326_lat"])
                if k in seen:
                    continue
                seen.add(k)
                by["load"].append(("load", float(k[0]), float(k[1]), None))
                by["load_bcn"].append(1)
            except (ValueError, KeyError):
                pass
    grids = {k: grid_of(v) for k, v in by.items() if k != "load_bcn"}
    ine = ine_rows("ine_31097_city.csv", "ine_30896_city.csv", "ine_31105_city.csv", "ine_30904_city.csv")
    sec = sections()
    to_utm = Transformer.from_crs(4326, 25830, always_xy=True)
    mitma = mitma_districts()
    out, stats = {}, defaultdict(int)
    for f in listings:
        p = f["properties"]
        lon, lat = f["geometry"]["coordinates"][:2]
        row = {}
        if ped and p.get("m") == "Madrid":
            d, c = min((dist((lon, lat), (c[2], c[3])), c) for c in ped)
            if d <= 600:
                row["ped"] = [c[0], round(d), c[1]]
                stats["ped"] += 1
        if grids:
            pk = near(grids.get("park", {}), lon, lat, 300)
            row["pk"] = [len(pk), round(min(d for d, _ in pk)) if pk else None, sum(q[3] or 0 for _, q in pk)]
            ld = near(grids.get("load", {}), lon, lat, 300)
            row["ld"] = [sum(1 for d, _ in ld if d <= 100), round(min(d for d, _ in ld)) if ld else None]
            row["sc"] = len(near(grids.get("school", {}), lon, lat, 400))
            row["of"] = len(near(grids.get("office", {}), lon, lat, 400))
            stats["osm"] += 1
        if sec:
            tree, geoms, codes = sec
            pt = Point(*to_utm.transform(lon, lat))
            hit = next((codes[i] for i in tree.query(pt) if geoms[i].covers(pt)), None)
            v = ine.get(hit) if hit else None
            if v:
                g = lambda k: v.get(k, (None, None))[1]
                row["sec"] = {"id": hit, "inc": g("Renta neta media por persona"), "hinc": g("Renta neta media por hogar"),
                              "hh": g("Tamaño medio del hogar"), "age": g("Edad media de la población"),
                              "p65": g("Porcentaje de población de 65 y más años"), "one": g("Porcentaje de hogares unipersonales"),
                              "pop": g("Población"), "yr": v.get("Renta neta media por persona", (None,))[0]}
                stats["sec"] += 1
        if mitma:
            tree, geoms, codes, vis = mitma
            pt = Point(*to_utm.transform(lon, lat))
            hit = next((codes[i] for i in tree.query(pt) if geoms[i].covers(pt)), None)
            if hit in vis:
                row["mv"] = [hit] + vis[hit]
                stats["mitma"] += 1
        out[p["id"]] = row
    meta = {"counters": len(ped), "osm": {k: len(v) for k, v in by.items()}, "joined": dict(stats), "listings": len(listings)}
    (BUILD / "opendata.json.gz").write_bytes(gzip.compress(json.dumps({"meta": meta, "rows": out}, ensure_ascii=False, separators=(",", ":")).encode(), 9))
    print(meta)


if __name__ == "__main__":
    main()
