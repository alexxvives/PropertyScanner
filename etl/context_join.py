"""Join stops, cadastre floor area, and Madrid traffic counts onto neighborhoods.

The cadastre zip stays in data/raw. Only the neighborhood totals are written out.
"""

from __future__ import annotations

import csv
import json
import math
import re
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"


def utm_to_lonlat(easting: float, northing: float, zone: int) -> tuple[float, float]:
    """ETRS89 / UTM to longitude, latitude. Close enough to WGS84 for a neighborhood."""
    a = 6378137.0
    f = 1 / 298.257223563
    k0 = 0.9996
    e2 = f * (2 - f)
    ep2 = e2 / (1 - e2)
    x = easting - 500000.0
    y = northing
    m = y / k0
    mu = m / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2**3 / 256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    phi1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
        + (1097 * e1**4 / 512) * math.sin(8 * mu)
    )
    sin_phi = math.sin(phi1)
    cos_phi = math.cos(phi1)
    n1 = a / math.sqrt(1 - e2 * sin_phi * sin_phi)
    t1 = math.tan(phi1) ** 2
    c1 = ep2 * cos_phi * cos_phi
    r1 = a * (1 - e2) / (1 - e2 * sin_phi * sin_phi) ** 1.5
    d = x / (n1 * k0)
    lat = phi1 - (n1 * math.tan(phi1) / r1) * (
        d * d / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ep2) * d**4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * ep2 - 3 * c1 * c1) * d**6 / 720
    )
    lon = (
        d
        - (1 + 2 * t1 + c1) * d**3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * ep2 + 24 * t1 * t1) * d**5 / 120
    ) / cos_phi
    lon0 = math.radians((zone - 1) * 6 - 180 + 3)
    return math.degrees(lon0 + lon), math.degrees(lat)


class Utm:
    def __init__(self, zone: int) -> None:
        self.zone = zone

    def transform(self, easting: float, northing: float) -> tuple[float, float]:
        return utm_to_lonlat(easting, northing, self.zone)


TO_MADRID = Utm(30)
TO_BARCELONA = Utm(31)


def point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i, (xi, yi) in enumerate(ring):
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def geometry_contains(geometry: dict, x: float, y: float) -> bool:
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    for polygon in polygons:
        if not point_in_ring(x, y, polygon[0]):
            continue
        if any(point_in_ring(x, y, hole) for hole in polygon[1:]):
            continue
        return True
    return False


class AreaIndex:
    def __init__(self, features: list, prefix: str) -> None:
        self.items = []
        for feature in features:
            if not feature["properties"]["id"].startswith(prefix):
                continue
            geometry = feature["geometry"]
            xs, ys = [], []
            polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
            for polygon in polygons:
                for point in polygon[0]:
                    xs.append(point[0])
                    ys.append(point[1])
            self.items.append((feature, min(xs), min(ys), max(xs), max(ys)))

    def find(self, lon: float, lat: float):
        for feature, minx, miny, maxx, maxy in self.items:
            if minx <= lon <= maxx and miny <= lat <= maxy and geometry_contains(feature["geometry"], lon, lat):
                return feature
        return None


def tag_value(line: str) -> str:
    start = line.find(">") + 1
    end = line.find("<", start)
    return line[start:end].strip()


def stream_buildings(zip_path: Path, gml_name: str, transformer: Utm):
    uses: dict[str, int] = defaultdict(int)
    kept = 0
    with zipfile.ZipFile(zip_path) as archive:
        with archive.open(gml_name) as handle:
            lower = upper = use = None
            floor = 0.0
            for raw in handle:
                line = raw.decode("utf-8", "replace")
                if "<gml:lowerCorner>" in line:
                    lower = tag_value(line)
                elif "<gml:upperCorner>" in line:
                    upper = tag_value(line)
                elif "<bu-ext2d:currentUse>" in line and "nil" not in line:
                    use = tag_value(line)
                elif 'uom="m2"' in line:
                    try:
                        floor += float(tag_value(line))
                    except ValueError:
                        pass
                elif "</bu-ext2d:Building>" in line:
                    if lower and upper:
                        x1, y1 = (float(part) for part in lower.split())
                        x2, y2 = (float(part) for part in upper.split())
                        lon, lat = transformer.transform((x1 + x2) / 2, (y1 + y2) / 2)
                        uses[use or ""] += 1
                        kept += 1
                        if kept % 50000 == 0:
                            print("buildings read", gml_name, kept, flush=True)
                        yield lon, lat, floor, use or ""
                    lower = upper = use = None
                    floor = 0.0
    print("buildings", gml_name, kept, "uses", dict(sorted(uses.items(), key=lambda item: -item[1])[:8]), flush=True)


def add_buildings(features: list, zip_path: Path, gml_name: str, transformer: Utm, prefix: str) -> None:
    if not zip_path.exists():
        print("missing", zip_path.name)
        return
    index = AreaIndex(features, prefix)
    for feature in features:
        if feature["properties"]["id"].startswith(prefix):
            props = feature["properties"]
            props["buildings"] = 0
            props["floor_m2"] = 0
            props["retail_buildings"] = 0
            props["retail_m2"] = 0
    matched = 0
    for lon, lat, floor, use in stream_buildings(zip_path, gml_name, transformer):
        feature = index.find(lon, lat)
        if feature is None:
            continue
        matched += 1
        props = feature["properties"]
        props["buildings"] += 1
        props["floor_m2"] += floor
        if use.startswith("4_2"):
            props["retail_buildings"] += 1
            props["retail_m2"] += floor
    for feature, *_box in index.items:
        props = feature["properties"]
        km = props.get("area_km2") or 0
        props["floor_m2"] = round(props["floor_m2"])
        props["retail_m2"] = round(props["retail_m2"])
        if km:
            props["floor_per_km2"] = round(props["floor_m2"] / km)
            props["retail_per_km2"] = round(props["retail_m2"] / km)
    print("buildings inside neighborhoods", prefix, matched, flush=True)


def count_points(features: list, points: list[tuple[float, float]], prefix: str, field: str) -> None:
    index = AreaIndex(features, prefix)
    totals = defaultdict(int)
    for lon, lat in points:
        feature = index.find(lon, lat)
        if feature is not None:
            totals[feature["properties"]["id"]] += 1
    for feature, *_box in index.items:
        props = feature["properties"]
        count = totals[props["id"]]
        props[field] = count
        km = props.get("area_km2") or 0
        if km:
            props[f"{field}_per_km2"] = round(count / km, 2)
    print(field, prefix, sum(totals.values()), flush=True)


def geojson_points(path: Path, transformer: Utm | None, unique_key: str | None) -> list[tuple[float, float]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    seen = set()
    points = []
    for feature in data["features"]:
        props = feature.get("properties") or {}
        if unique_key:
            key = props.get(unique_key)
            if key in seen:
                continue
            seen.add(key)
        x, y = feature["geometry"]["coordinates"][:2]
        if transformer:
            x, y = transformer.transform(x, y)
        points.append((x, y))
    return points


def load_traffic(features: list) -> None:
    points_path = RAW / "mad_traffic_points.csv"
    live_path = RAW / "mad_traffic_now.xml"
    if not points_path.exists():
        print("missing", points_path.name)
        return
    sensors = []
    by_id: dict[str, tuple[float, float]] = {}
    with points_path.open(encoding="latin-1", newline="") as handle:
        for row in csv.DictReader(handle, delimiter=";"):
            try:
                lon = float(row["longitud"])
                lat = float(row["latitud"])
            except (TypeError, ValueError):
                continue
            sensors.append((lon, lat))
            by_id[row["id"].strip()] = (lon, lat)
    count_points(features, sensors, "mad-", "traffic_points")
    if not live_path.exists():
        return
    text = live_path.read_text(encoding="utf-8-sig")
    flows = []
    for block in re.findall(r"<pm>.*?</pm>", text, flags=re.S):
        ident = re.search(r"<idelem>(\d+)</idelem>", block)
        flow = re.search(r"<intensidad>(\d+)</intensidad>", block)
        error = re.search(r"<error>(\w+)</error>", block)
        if not ident or not flow or not error or error.group(1) != "N":
            continue
        point = by_id.get(ident.group(1))
        if point:
            flows.append((point[0], point[1], float(flow.group(1))))
    index = AreaIndex(features, "mad-")
    totals: dict[str, float] = defaultdict(float)
    for lon, lat, flow in flows:
        feature = index.find(lon, lat)
        if feature is not None:
            totals[feature["properties"]["id"]] += flow
    for feature, *_box in index.items:
        props = feature["properties"]
        value = totals.get(props["id"])
        if value:
            props["traffic_veh_h"] = round(value)
    stamp = re.search(r"<fecha_hora>([^<]+)</fecha_hora>", text)
    print("traffic readings inside neighborhoods", len(flows), "as of", stamp.group(1) if stamp else "")


def enrich_place_context(features: list) -> None:
    add_buildings(features, RAW / "bu_madrid.zip", "A.ES.SDGC.BU.28900.building.gml", TO_MADRID, "mad-")
    add_buildings(features, RAW / "bu_barcelona.zip", "A.ES.SDGC.BU.08900.building.gml", TO_BARCELONA, "bcn-")
    metro = RAW / "mad_metro.geojson"
    buses = RAW / "mad_bus_emt.geojson"
    if metro.exists():
        count_points(features, geojson_points(metro, TO_MADRID, "IDESTACION"), "mad-", "metro_stops")
    if buses.exists():
        count_points(features, geojson_points(buses, TO_MADRID, None), "mad-", "bus_stops")
    bcn_metro = RAW / "bcn_metro.geojson"
    bcn_bus = RAW / "bcn_bus.csv"
    if bcn_metro.exists():
        count_points(features, geojson_points(bcn_metro, None, "CODI_ESTACIO"), "bcn-", "metro_stops")
    if bcn_bus.exists():
        stops = []
        with bcn_bus.open(encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                try:
                    stops.append((float(row["LONGITUD"]), float(row["LATITUD"])))
                except (TypeError, ValueError):
                    continue
        count_points(features, stops, "bcn-", "bus_stops")
    load_traffic(features)
    join_timetables(features)


def services_on(archive, day) -> set[str]:
    ymd = day.strftime("%Y%m%d")
    weekday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][day.weekday()]
    active: set[str] = set()
    for row in csv.DictReader(archive.read("calendar.txt").decode("utf-8-sig").splitlines()):
        if row["start_date"] <= ymd <= row["end_date"] and row.get(weekday) == "1":
            active.add(row["service_id"])
    if "calendar_dates.txt" in archive.namelist():
        for row in csv.DictReader(archive.read("calendar_dates.txt").decode("utf-8-sig").splitlines()):
            if row["date"] != ymd:
                continue
            if row["exception_type"] == "1":
                active.add(row["service_id"])
            elif row["exception_type"] == "2":
                active.discard(row["service_id"])
    return active


def departures_by_stop(zip_path: Path, day) -> list[tuple[float, float, int, int]]:
    points = []
    with zipfile.ZipFile(zip_path) as archive:
        active = services_on(archive, day)
        route_type = {
            row["route_id"]: row["route_type"]
            for row in csv.DictReader(archive.read("routes.txt").decode("utf-8-sig").splitlines())
        }
        trip_type = {}
        for row in csv.DictReader(archive.read("trips.txt").decode("utf-8-sig").splitlines()):
            if row["service_id"] in active:
                trip_type[row["trip_id"]] = route_type.get(row["route_id"], "")
        counts: dict[str, list[int]] = defaultdict(lambda: [0, 0])
        with archive.open("stop_times.txt") as raw:
            lines = (line.decode("utf-8-sig") for line in raw)
            for row in csv.DictReader(lines):
                kind = trip_type.get(row["trip_id"])
                if kind == "1":
                    counts[row["stop_id"]][0] += 1
                elif kind in {"3", "7"}:
                    counts[row["stop_id"]][1] += 1
        for row in csv.DictReader(archive.read("stops.txt").decode("utf-8-sig").splitlines()):
            if (row.get("location_type") or "0") not in {"0", ""}:
                continue
            tally = counts.get(row["stop_id"])
            if not tally:
                continue
            try:
                points.append((float(row["stop_lon"]), float(row["stop_lat"]), tally[0], tally[1]))
            except ValueError:
                continue
    print(zip_path.name, day.isoformat(), "stops", len(points), flush=True)
    return points


def add_departures(features: list, points: list[tuple[float, float, int, int]], prefix: str, metro_field: str, bus_field: str, fill: bool) -> None:
    index = AreaIndex(features, prefix)
    totals: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for lon, lat, metro, bus in points:
        feature = index.find(lon, lat)
        if feature is None:
            continue
        bucket = totals[feature["properties"]["id"]]
        bucket[0] += metro
        bucket[1] += bus
    for feature, *_box in index.items:
        props = feature["properties"]
        metro, bus = totals.get(props["id"], [0, 0])
        if fill or metro:
            props[metro_field] = metro
        if fill or bus:
            props[bus_field] = bus
    print(prefix, metro_field, sum(item[0] for item in totals.values()), bus_field, sum(item[1] for item in totals.values()))


def join_timetables(features: list) -> None:
    """Wednesday 21 Oct 2026 departures. TMB covers Barcelona. The CRTM file is the southern interurban buses."""
    from datetime import date

    day = date(2026, 10, 21)
    tmb = RAW / "tmb_gtfs.zip"
    crtm = RAW / "crtm_gtfs.zip"
    if tmb.exists():
        add_departures(features, departures_by_stop(tmb, day), "bcn-", "metro_departures", "bus_departures", True)
    if crtm.exists():
        add_departures(features, departures_by_stop(crtm, day), "mad-", "metro_departures", "south_bus_departures", False)
