"""Round 25: add Zaragoza, Valencia, Sevilla and Malaga areas + shop rows on top of the Madrid/Barcelona build.

Run after prepare.py / context_join.py (idempotent: drops earlier rows of these cities first).
Inputs : data/raw/r25/osm_{zgz,vlc,svq,agp}.json (etl/osm_cities.py)
         data/raw/r19/secc/SECC_CE_20240101.shp + INE Atlas de renta tables (ine_*_city.csv)
Outputs: web/data/areas.geojson (appends), data/build/places.json.gz (appends), web/data/meta.json (covered list)
What these cities do NOT have (so the score skips it): census vacancy, retail floor area (cadastre), transit departures.
"""
import gzip
import json
from collections import defaultdict
from pathlib import Path

from pyproj import Transformer
from shapely import wkt
from shapely.geometry import Point, mapping
from shapely.ops import transform
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
R19 = ROOT / "data" / "raw" / "r19"
R25 = ROOT / "data" / "raw" / "r25"
WEB = ROOT / "web" / "data"
BUILD = ROOT / "data" / "build"
CITIES = {
    "zgz": ("Zaragoza", "50297", ("ine_31277_city.csv", "ine_31285_city.csv")),
    "vlc": ("Valencia", "46250", ("ine_31250_city.csv", "ine_31258_city.csv")),
    "svq": ("Sevilla", "41091", ("ine_31205_city.csv", "ine_31213_city.csv")),
    "agp": ("Málaga", "29067", ("ine_31106_city.csv", "ine_31114_city.csv")),
}
GROUPS = ("bakery", "cafe", "grocery", "food", "pharmacy", "beauty", "fashion", "health", "gym", "other")
GCODE = {"bakery": "b", "cafe": "c", "grocery": "g", "food": "f", "pharmacy": "p", "beauty": "u", "fashion": "s",
         "health": "l", "gym": "m", "other": "o"}


def ine(names):
    vals = defaultdict(dict)
    for name in names:
        for line in (R19 / name).open(encoding="utf-8"):
            parts = line.rstrip("\n").split(";")
            if len(parts) < 6 or "sección" not in parts[2]:
                continue
            try:
                v = float(parts[5].replace(".", "").replace(",", "."))
            except ValueError:
                continue
            code, key, yr = parts[2].split()[0], parts[3], int(parts[4])
            if yr >= vals[code].get(key, (0, 0))[0]:
                vals[code][key] = (yr, v)
    return vals


def sections(muni):
    import shapefile
    from shapely.geometry import shape
    r = shapefile.Reader(str(R19 / "secc" / "SECC_CE_20240101"))
    to_wgs = Transformer.from_crs(25830, 4326, always_xy=True).transform
    out = []
    for sr in r.iterShapeRecords():
        if sr.record["CUMUN"] == muni:
            g = shape(sr.shape.__geo_interface__)
            out.append((sr.record["CUSEC"], transform(to_wgs, g.representative_point())))
    return out


def km2(g):
    to_utm = Transformer.from_crs(4326, 25830, always_xy=True).transform
    return transform(to_utm, g).area / 1e6


def main():
    areas = json.loads((WEB / "areas.geojson").read_text(encoding="utf-8"))
    areas["features"] = [f for f in areas["features"] if f["properties"]["id"][:3] not in CITIES]
    places = json.loads(gzip.decompress((BUILD / "places.json.gz").read_bytes()))
    places = [r for r in places if str(r[4])[:3] not in CITIES]
    meta = json.loads((WEB / "meta.json").read_text(encoding="utf-8"))
    meta["covered"] = [c for c in meta["covered"] if c["id"] in ("madrid", "barcelona")]
    for code, (city, muni, ine_files) in CITIES.items():
        src = R25 / f"osm_{code}.json"
        if not src.exists():
            print("skip", code)
            continue
        osm = json.loads(src.read_text(encoding="utf-8"))
        mg = wkt.loads(osm["muni"]) if osm.get("muni") else None
        geoms, feats = [], []
        dists = [(d["name"], wkt.loads(d["wkt"])) for d in osm.get("districts", [])]
        # Malaga tags ~350 tiny barrios that leave gaps; fall back to its 13 districts above 200 units
        units = osm["districts"] if len(osm["areas"]) > 200 else osm["areas"]
        for a in units:
            g = wkt.loads(a["wkt"])
            if mg is not None:
                g = g.intersection(mg)
            if g.is_empty:
                continue
            rp = g.representative_point()
            dist = next((n for n, dg in dists if dg.contains(rp)), "")
            if dist == a["name"]:
                dist = ""
            geoms.append(g)
            feats.append({"type": "Feature", "id": f"{code}-{a['id']}", "geometry": mapping(g.simplify(0.00005)),
                          "properties": {"id": f"{code}-{a['id']}", "city": city, "name": a["name"], "district": dist or city,
                                         "area_km2": round(km2(g), 2), "open": 0, "vacant": None,
                                         **{k: 0 for k in GROUPS}}})
        tree = STRtree(geoms)

        def hit(pt):
            return next((int(i) for i in tree.query(pt) if geoms[int(i)].covers(pt)), None)

        n_in = 0
        for lon, lat, grp, name, act, addr, hours in osm["places"]:
            i = hit(Point(lon, lat))
            if i is None:
                continue
            p = feats[i]["properties"]
            p["open"] += 1
            p[grp] += 1
            places.append([lon, lat, GCODE[grp], "O", p["id"], name, addr, act, hours])
            n_in += 1
        vals = ine(ine_files)
        agg = defaultdict(lambda: [0.0, 0.0, 0.0, 0.0, 0.0, 0])  # pop, inc*pop, age*pop, p65*pop, incpop, year
        for cusec, pt in sections(muni):
            i = hit(pt)
            v = vals.get(cusec)
            if i is None or not v:
                continue
            pop = v.get("Población", (0, 0))[1]
            if not pop:
                continue
            a = agg[i]
            a[0] += pop
            if "Renta neta media por persona" in v:
                a[1] += pop * v["Renta neta media por persona"][1]
                a[4] += pop
                a[5] = max(a[5], v["Renta neta media por persona"][0])
            if "Edad media de la población" in v:
                a[2] += pop * v["Edad media de la población"][1]
            if "Porcentaje de población de 65 y más años" in v:
                a[3] += pop * v["Porcentaje de población de 65 y más años"][1]
        for i, f in enumerate(feats):
            p = f["properties"]
            km = p["area_km2"] or 1
            p["open_per_km2"] = round(p["open"] / km, 1)
            a = agg.get(i)
            if a and a[0]:
                p["population"] = int(a[0])
                p["pop_per_km2"] = round(a[0] / km, 1)
                if a[4]:
                    p["income_eur"] = round(a[1] / a[4])
                    p["income_year"] = a[5]
                p["age_mean"] = round(a[2] / a[0], 1)
                p["pct_65"] = round(a[3] / a[0], 1)
        areas["features"].extend(feats)
        meta["covered"].append({"id": code, "name": city, "vintage": "OpenStreetMap", "places": n_in, "areas": len(feats),
                                "note": "Shops from OpenStreetMap (open businesses only, no vacancy census). Areas are OSM barrios or districts."})
        print(code, city, "areas", len(feats), "places", n_in, "with income", sum(1 for f in feats if "income_eur" in f["properties"]))
    (WEB / "areas.geojson").write_text(json.dumps(areas, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (BUILD / "places.json.gz").write_bytes(gzip.compress(json.dumps(places, ensure_ascii=False, separators=(",", ":")).encode(), mtime=0))
    meta["areas"] = len(areas["features"])
    meta["places"] = len(places)
    (WEB / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
