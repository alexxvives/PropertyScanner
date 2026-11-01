"""OSM extract for the Round 25 cities (Zaragoza, Valencia, Sevilla, Malaga) from Geofabrik pbfs.

Writes data/raw/r25/osm_{city}.json:
  areas  : barrio (admin_level 10) or district (9) polygons inside the municipality, WKT in EPSG:4326
  muni   : municipality polygon WKT
  places : shops / cafes / restaurants etc. [lon, lat, group, name, activity]
  pts    : parking / loading / school / office points [kind, lon, lat, capacity] (same rules as osm_extract.py)
Usage: python etl/osm_cities.py zgz vlc   (default: all)
"""
import json
import sys
from pathlib import Path

import osmium
from shapely import wkb

ROOT = Path(__file__).resolve().parents[1]
R25 = ROOT / "data" / "raw" / "r25"
CITIES = {
    "zgz": ("aragon", "Zaragoza", (-1.30, 41.50, -0.65, 41.85)),
    "vlc": ("valencia", "València", (-0.45, 39.27, -0.27, 39.57)),
    "svq": ("andalucia", "Sevilla", (-6.07, 37.30, -5.85, 37.47)),
    "agp": ("andalucia", "Málaga", (-4.62, 36.62, -4.28, 36.84)),
}
SHOP_GROUP = {
    "bakery": "bakery", "pastry": "bakery", "confectionery": "bakery",
    "pharmacy": "pharmacy", "chemist": "pharmacy",
    "supermarket": "grocery", "convenience": "grocery", "greengrocer": "grocery", "butcher": "grocery", "deli": "grocery",
    "hairdresser": "beauty", "beauty": "beauty", "cosmetics": "beauty",
    "clothes": "fashion", "shoes": "fashion", "boutique": "fashion",
    "optician": "health", "medical_supply": "health", "hearing_aids": "health",
}
AMENITY_GROUP = {"cafe": "cafe", "restaurant": "food", "fast_food": "food", "bar": "food", "pub": "food",
                 "pharmacy": "pharmacy", "dentist": "health", "clinic": "health", "doctors": "health"}


def place_group(t):
    if t.get("shop"):
        if t.get("shop") in ("vacant", "no"):
            return None
        return SHOP_GROUP.get(t.get("shop"), "other")
    a = t.get("amenity")
    if a in AMENITY_GROUP:
        return AMENITY_GROUP[a]
    if t.get("leisure") in ("fitness_centre", "sports_centre") and t.get("leisure") == "fitness_centre":
        return "gym"
    return None


def pt_kind(t):
    a = t.get("amenity")
    if a in ("parking", "parking_entrance"):
        if t.get("access") in ("private", "customers", "no"):
            return None
        if t.get("parking") in ("street_side", "lane", "on_street"):
            return None
        return "park"
    if a == "loading_dock" or t.get("parking") == "loading" or "loading" in (t.get("parking:condition") or "") or a == "loading_zone":
        return "load"
    if a in ("school", "kindergarten", "college", "university"):
        return "school"
    if "office" in t or t.get("building") == "office":
        return "office"
    return None


def run(region, codes):
    boxes = {c: CITIES[c][2] for c in codes}
    res = {c: {"areas": [], "munis": [], "places": [], "pts": []} for c in codes}
    fab = osmium.geom.WKBFactory()

    def inbox(lon, lat):
        return [c for c, b in boxes.items() if b[0] <= lon <= b[2] and b[1] <= lat <= b[3]]

    fp = (osmium.FileProcessor(str(R25 / f"{region}.osm.pbf"))
          .with_locations()
          .with_areas(osmium.filter.TagFilter(("boundary", "administrative"))))
    for o in fp:
        t = o.tags
        if o.is_area():
            if t.get("boundary") != "administrative" or t.get("admin_level") not in ("8", "9", "10"):
                continue
            try:
                g = wkb.loads(fab.create_multipolygon(o), hex=True)
            except Exception:
                continue
            c0 = g.representative_point()
            for c in inbox(c0.x, c0.y):
                rec = {"lvl": int(t.get("admin_level")), "name": t.get("name", ""), "id": o.orig_id(), "wkt": g.wkt}
                res[c]["munis" if rec["lvl"] == 8 else "areas"].append(rec)
            continue
        if not t or len(t) == 0:
            continue
        g, k = place_group(t), pt_kind(t)
        if not g and not k:
            continue
        if o.is_node():
            lon, lat = o.location.lon, o.location.lat
        elif o.is_way():
            try:
                xs = [(n.lon, n.lat) for n in o.nodes if n.location.valid()]
            except Exception:
                continue
            if not xs:
                continue
            lon, lat = sum(x for x, _ in xs) / len(xs), sum(y for _, y in xs) / len(xs)
        else:
            continue
        for c in inbox(lon, lat):
            if g:
                act = t.get("shop") or t.get("amenity") or t.get("leisure") or ""
                res[c]["places"].append([round(lon, 5), round(lat, 5), g, t.get("name", ""), act,
                                         t.get("addr:street", "") + (" " + t.get("addr:housenumber") if t.get("addr:housenumber") else ""),
                                         t.get("opening_hours", "")])
            if k:
                try:
                    cap = int(t.get("capacity"))
                except (TypeError, ValueError):
                    cap = None
                res[c]["pts"].append([k, round(lon, 5), round(lat, 5), cap])
    return res


def main():
    codes = sys.argv[1:] or list(CITIES)
    by_region = {}
    for c in codes:
        by_region.setdefault(CITIES[c][0], []).append(c)
    from shapely import wkt
    for region, cs in by_region.items():
        res = run(region, cs)
        for c, r in res.items():
            name = CITIES[c][1]
            muni = next((m for m in r["munis"] if m["name"] == name), None)
            out = {"city": name, "muni": muni["wkt"] if muni else None, "places": r["places"], "pts": r["pts"]}
            if muni:
                mg = wkt.loads(muni["wkt"])
                inside = [a for a in r["areas"] if mg.contains(wkt.loads(a["wkt"]).representative_point())]
            else:
                inside = r["areas"]
            lv = {9: [a for a in inside if a["lvl"] == 9], 10: [a for a in inside if a["lvl"] == 10]}
            out["levels"] = {k: len(v) for k, v in lv.items()}
            out["areas"] = lv[10] if len(lv[10]) >= 20 else lv[9]
            out["districts"] = lv[9]
            (R25 / f"osm_{c}.json").write_text(json.dumps(out, ensure_ascii=False))
            print(c, name, "muni" if muni else "NO MUNI", out["levels"], "places", len(r["places"]), "pts", len(r["pts"]))


if __name__ == "__main__":
    main()
