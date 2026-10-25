"""Build the Spain map from the free premises censuses that actually exist.

Madrid: Ayuntamiento census (street doors) + barrio boundaries.
Barcelona: 2024 ground-floor commercial census + barrio boundaries.
No other Spanish city publishes an equivalent free file.

Writes web/data/areas.geojson, web/data/places.geojson, and web/data/meta.json.
"""

from __future__ import annotations

import csv
import gzip
import json
import unicodedata
from collections import defaultdict
from pathlib import Path

from pyproj import Geod, Transformer

from context_join import enrich_place_context

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "web" / "data"

TO_MADRID = Transformer.from_crs(25830, 4326, always_xy=True)
TO_BARCELONA = Transformer.from_crs(25831, 4326, always_xy=True)
GEOD = Geod(ellps="WGS84")

GROUP_RANK = {
    "bakery": 6,
    "pharmacy": 6,
    "grocery": 5,
    "cafe": 5,
    "food": 4,
    "beauty": 4,
    "fashion": 4,
    "health": 4,
    "gym": 4,
    "other": 1,
    "vacant": 0,
}


def norm(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.upper().split())


def group_of(activity: str) -> str:
    text = norm(activity)
    if not text:
        return "other"
    if "BUIT" in text or text.startswith("SENSE ACTIVITAT"):
        return "vacant"
    if any(stem in text for stem in ("PANADER", "PASTISS", "PASTEL", "BOLLER", "PA, PAST")):
        return "bakery"
    if "FARMAC" in text or "PARAFARM" in text:
        return "pharmacy"
    if any(stem in text for stem in ("SUPERMERC", "AUTOSERV", "GRANDES SUPERFICIES")):
        return "grocery"
    if "CAFETER" in text or "CIBERCAF" in text or "XOCOLAT" in text:
        return "cafe"
    if text.startswith("BAR") or any(
        stem in text for stem in ("RESTAUR", "TABERN", "MENJAR RAPID", "COMIDA RAPIDA", "TAKE AWAY")
    ):
        return "food"
    if any(stem in text for stem in ("PERRUQ", "PELUQ", "ESTETIC")):
        return "beauty"
    if any(stem in text for stem in ("VESTIR", "CONFECC", "MODA")):
        return "fashion"
    if any(stem in text for stem in ("SANITAT", "CLINIC", "DENTAL", "FISIO", "OPTIC")):
        return "health"
    if any(stem in text for stem in ("GIMNAS", "GIMNAS", "FITNESS")):
        return "gym"
    return "other"


def title_phrase(value: str) -> str:
    cleaned = " ".join((value or "").split())
    if not cleaned or norm(cleaned) in {"S/R", "SN", "SIN ROTULO", "SIN ACTIVIDAD"}:
        return ""
    small = {"de", "del", "la", "las", "el", "los", "y", "e", "en", "i", "a"}
    words = []
    for index, word in enumerate(cleaned.lower().split()):
        words.append(word if index and word in small else word[:1].upper() + word[1:])
    return " ".join(words)


def ring_area(ring: list[list[float]]) -> float:
    area, _perimeter = GEOD.polygon_area_perimeter(
        [point[0] for point in ring],
        [point[1] for point in ring],
    )
    return area


def geometry_area_m2(geometry: dict) -> float:
    if geometry["type"] == "Polygon":
        return abs(sum(ring_area(ring) for ring in geometry["coordinates"]))
    return sum(
        abs(sum(ring_area(ring) for ring in polygon))
        for polygon in geometry["coordinates"]
    )


def decode_arcs(topo: dict) -> list[list[list[float]]]:
    scale = topo["transform"]["scale"]
    translate = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        coords = []
        for dx, dy in arc:
            x += dx
            y += dy
            coords.append([round(x * scale[0] + translate[0], 6), round(y * scale[1] + translate[1], 6)])
        arcs.append(coords)
    return arcs


def stitch(arcs: list[list[list[float]]], indexes: list[int]) -> list[list[float]]:
    line: list[list[float]] = []
    for position, index in enumerate(indexes):
        arc = arcs[~index] if index < 0 else arcs[index]
        if index < 0:
            arc = list(reversed(arc))
        if position:
            arc = arc[1:]
        line.extend(arc)
    return line


def geometry_from_topo(arcs: list[list[list[float]]], item: dict) -> dict:
    raw = item["arcs"]
    if item["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": [stitch(arcs, ring) for ring in raw]}
    if item["type"] == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "coordinates": [[stitch(arcs, ring) for ring in polygon] for polygon in raw],
        }
    raise ValueError(item["type"])


def parse_wkt(wkt: str) -> dict:
    text = wkt.strip()
    upper = text.upper()

    def ring(chunk: str) -> list[list[float]]:
        points = []
        for pair in chunk.split(","):
            east, north = pair.split()
            lon, lat = TO_BARCELONA.transform(float(east), float(north))
            points.append([round(lon, 6), round(lat, 6)])
        return points

    if upper.startswith("MULTIPOLYGON"):
        body = text[text.find("(((") + 3 : text.rfind(")))")]
        polygons = []
        for polygon in body.split(")), (("):
            polygons.append([ring(part) for part in polygon.split("), (")])
        return {"type": "MultiPolygon", "coordinates": polygons}
    body = text[text.find("((") + 2 : text.rfind("))")]
    return {"type": "Polygon", "coordinates": [ring(part) for part in body.split("), (")]}


def place_feature(lon: float, lat: float, props: dict) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
        "properties": props,
    }


GROUPS = ("bakery", "cafe", "grocery", "food", "pharmacy", "beauty", "fashion", "health", "gym", "other")


def empty_bucket() -> dict[str, int]:
    bucket = {"open": 0, "vacant": 0}
    for group in GROUPS:
        bucket[group] = 0
    return bucket


def load_madrid(places: list, counts: dict, names: dict) -> dict:
    activities: dict[str, tuple[int, str, str]] = {}
    with (RAW / "actividades.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle, delimiter=";"):
            activity = row["desc_epigrafe"].strip()
            group = group_of(activity)
            rank = GROUP_RANK[group]
            current = activities.get(row["id_local"])
            if current is None or rank > current[0]:
                activities[row["id_local"]] = (rank, group, activity)

    kept = skipped = 0
    vintage = ""
    with (RAW / "locales.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle, delimiter=";"):
            vintage = row["fx_carga"].strip() or vintage
            if row["desc_tipo_acceso_local"] not in {"Puerta Calle", "PC Asociado"}:
                continue
            if row["desc_situacion_local"] not in {"Abierto", "Cerrado"}:
                continue
            barrio_code = row["id_barrio_local"].strip()
            if not barrio_code:
                skipped += 1
                continue
            try:
                east = float(row["coordenada_x_local"])
                north = float(row["coordenada_y_local"])
            except ValueError:
                skipped += 1
                continue
            if east < 100000 or north < 1_000_000:
                skipped += 1
                continue

            area_id = f"mad-{barrio_code}"
            names[area_id] = (
                title_phrase(row["desc_barrio_local"]),
                title_phrase(row["desc_distrito_local"]),
            )
            status = "Open" if row["desc_situacion_local"] == "Abierto" else "Closed"
            activity = activities.get(row["id_local"])
            group = activity[1] if activity else "other"
            label = activity[2] if activity else ""
            if status == "Closed":
                group = "vacant"
            bucket = counts[area_id]
            if status == "Open":
                bucket["open"] += 1
                bucket[group if group in GROUPS else "other"] += 1
            else:
                bucket["vacant"] += 1

            number = row["num_edificio"].strip().lstrip("0")
            street = title_phrase(f"{row['clase_vial_edificio']} {row['desc_vial_edificio']}")
            hours_open = row["hora_apertura1"].strip()
            hours_close = row["hora_cierre1"].strip()
            hours = ""
            if hours_open and hours_open != "00:00":
                hours = f"{hours_open}–{hours_close}" if hours_close else hours_open
            lon, lat = TO_MADRID.transform(east, north)
            places.append(
                place_feature(
                    lon,
                    lat,
                    {
                        "g": group,
                        "n": title_phrase(row["rotulo"]) or title_phrase(label) or "Unnamed premises",
                        "a": f"{street} {number}".strip(),
                        "s": status,
                        "b": names[area_id][0],
                        "d": names[area_id][1],
                        "y": "Madrid",
                        "i": area_id,
                        "e": title_phrase(label),
                        "h": hours,
                    },
                )
            )
            kept += 1
    return {"city": "Madrid", "vintage": vintage, "places": kept, "skipped": skipped}


def load_barcelona(places: list, counts: dict, names: dict) -> dict:
    kept = skipped = 0
    vintage = ""
    with (RAW / "bcn_2024.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            vintage = row["Data_Revisio"].strip() or vintage
            if row["SN_Carrer"] != "Si":
                continue
            try:
                code = int(row["Codi_Barri"])
                lat = float(row["Latitud"])
                lon = float(row["Longitud"])
            except ValueError:
                skipped += 1
                continue
            if not (41.3 < lat < 41.5 and 2.0 < lon < 2.3):
                skipped += 1
                continue
            area_id = f"bcn-{code}"
            names[area_id] = (title_phrase(row["Nom_Barri"]), title_phrase(row["Nom_Districte"]))
            activity = row["Nom_Activitat"].strip()
            group = group_of(activity)
            status = "Vacant" if group == "vacant" else "Open"
            bucket = counts[area_id]
            if status == "Open":
                bucket["open"] += 1
                bucket[group if group in GROUPS else "other"] += 1
            else:
                bucket["vacant"] += 1
            number = row["Num_Policia_Inicial"].strip().lstrip("0")
            places.append(
                place_feature(
                    lon,
                    lat,
                    {
                        "g": group,
                        "n": title_phrase(row["Nom_Local"]) or title_phrase(activity) or "Unnamed premises",
                        "a": f"{title_phrase(row['Nom_Via'])} {number}".strip(),
                        "s": status,
                        "b": names[area_id][0],
                        "d": names[area_id][1],
                        "y": "Barcelona",
                        "i": area_id,
                        "e": title_phrase(activity),
                        "h": "",
                    },
                )
            )
            kept += 1
    return {"city": "Barcelona", "vintage": vintage[:4] or "2024", "places": kept, "skipped": skipped}


def madrid_areas(counts: dict, names: dict) -> tuple[list, list]:
    topo = json.loads((RAW / "barrios.json").read_text(encoding="utf-8"))
    arcs = decode_arcs(topo)
    features = []
    unmatched = []
    for item in topo["objects"]["Barrios"]["geometries"]:
        props = item["properties"]
        district_number, barrio_number = props["COD_DISB"].split("-")
        area_id = f"mad-{int(district_number)}{int(barrio_number):02d}"
        geometry = geometry_from_topo(arcs, item)
        stats = counts.get(area_id)
        if stats is None:
            unmatched.append(area_id)
            stats = empty_bucket()
        barrio_name, district_name = names.get(
            area_id, (title_phrase(props["NOMBRE"]), title_phrase(props["NOMDIS"]))
        )
        features.append(area_feature(area_id, "Madrid", barrio_name, district_name, geometry, stats))
    return features, unmatched


def barcelona_areas(counts: dict, names: dict) -> tuple[list, list]:
    rows = json.loads((RAW / "bcn_barris.json").read_text(encoding="utf-8"))
    features = []
    unmatched = []
    for row in rows:
        area_id = f"bcn-{int(row['codi_barri'])}"
        geometry = parse_wkt(row["geometria_etrs89"])
        stats = counts.get(area_id)
        if stats is None:
            unmatched.append(area_id)
            stats = empty_bucket()
        barrio_name, district_name = names.get(
            area_id, (title_phrase(row["nom_barri"]), title_phrase(row["nom_districte"]))
        )
        features.append(area_feature(area_id, "Barcelona", barrio_name, district_name, geometry, stats))
    return features, unmatched


def area_feature(area_id, city, name, district, geometry, stats) -> dict:
    area_km2 = geometry_area_m2(geometry) / 1_000_000
    return {
        "type": "Feature",
        "id": area_id,
        "geometry": geometry,
        "properties": {
            "id": area_id,
            "city": city,
            "name": name,
            "district": district,
            "area_km2": round(area_km2, 2),
            "open": stats["open"],
            "vacant": stats["vacant"],
            "open_per_km2": round(stats["open"] / area_km2, 1) if area_km2 else 0,
            **{group: stats[group] for group in GROUPS},
        },
    }


def parse_number(value: str) -> float | None:
    text = (value or "").strip().replace(" ", "")
    if not text or text in {"..", "-", "s.d."}:
        return None
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    elif text.count(".") > 1 or (text.count(".") == 1 and len(text.split(".")[1]) == 3):
        text = text.replace(".", "")
    try:
        return float(text)
    except ValueError:
        return None


def madrid_open_data_id(district: str, barrio: str) -> str | None:
    if not str(district).strip() or not str(barrio).strip():
        return None
    district_number = int(district)
    barrio_number = int(barrio) - district_number * 10
    if barrio_number < 0:
        return None
    return f"mad-{district_number}{barrio_number:02d}"


def latest_indicator(path: Path, names: set[str]) -> dict[str, dict[str, tuple[str, float]]]:
    """Latest value of each named indicator, keyed by Madrid area id."""
    found: dict[str, dict[str, tuple[str, float]]] = {name: {} for name in names}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        year_key = next(key for key in reader.fieldnames or [] if key.lower().startswith("a") and "barrio" not in key.lower())
        for row in reader:
            indicator = row["indicador_completo"]
            if indicator not in names:
                continue
            area_id = madrid_open_data_id(row["cod_distrito"], row["cod_barrio"])
            value = parse_number(row["valor_indicador"])
            if area_id is None or value is None:
                continue
            year = row[year_key]
            current = found[indicator].get(area_id)
            if current is None or year > current[0]:
                found[indicator][area_id] = (year, value)
    return found


def enrich_areas(features: list) -> None:
    """Join free barrio statistics that already exist. Missing files leave the map unchanged."""
    population_path = RAW / "mad_poblacion.csv"
    indicator_path = RAW / "mad_indicadores.csv"
    income_path = RAW / "bcn_renda_2023.csv"
    padro_path = RAW / "bcn_padro_2026.csv"
    age_path = RAW / "bcn_edat_2026.csv"
    if not all(path.exists() for path in (population_path, indicator_path, income_path, padro_path, age_path)):
        print("free context files missing; neighborhood income and population were not joined")
        return

    indicators = latest_indicator(
        indicator_path,
        {
            "Renta media disponible por persona",
            "Edad media de la población",
            "Porcentaje de envejecimiento (población mayor de 65 años/población total)",
            "Paro registrado (número de personas registradas en SEPE en febrero)",
            "Valor catastral medio por inmueble de uso residencial",
        },
    )
    madrid_people: dict[str, int] = {}
    with population_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle, delimiter=";"):
            if "2026" not in row["fecha"]:
                continue
            area_id = madrid_open_data_id(row["cod_distrito"], row["cod_barrio"])
            people = parse_number(row["num_personas"])
            if area_id and people is not None:
                madrid_people[area_id] = int(people)

    income_sum: dict[str, float] = defaultdict(float)
    income_n: dict[str, int] = defaultdict(int)
    with income_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            amount = parse_number(row["Import_Euros"])
            if amount is None:
                continue
            area_id = f"bcn-{int(row['Codi_Barri'])}"
            income_sum[area_id] += amount
            income_n[area_id] += 1

    barcelona_people: dict[str, int] = defaultdict(int)
    with padro_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            people = parse_number(row["Valor"])
            if people is None:
                continue
            barcelona_people[f"bcn-{int(row['Codi_Barri'])}"] += int(people)

    age_weighted: dict[str, float] = defaultdict(float)
    age_people: dict[str, int] = defaultdict(int)
    older: dict[str, int] = defaultdict(int)
    with age_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            count = 2 if row["Valor"].strip() == ".." else parse_number(row["Valor"])
            age = parse_number(row["EDAT_1"])
            if count is None or age is None:
                continue
            area_id = f"bcn-{int(row['Codi_Barri'])}"
            people = int(count)
            age_weighted[area_id] += age * people
            age_people[area_id] += people
            if age >= 65:
                older[area_id] += people

    joined = 0
    for feature in features:
        props = feature["properties"]
        area_id = props["id"]
        km = props.get("area_km2") or 0
        people = madrid_people.get(area_id)
        if people is None and area_id in barcelona_people:
            people = barcelona_people[area_id]
        if people:
            props["population"] = people
            props["pop_per_km2"] = round(people / km, 1) if km else 0
            joined += 1
        if area_id.startswith("mad-"):
            income = indicators["Renta media disponible por persona"].get(area_id)
            age = indicators["Edad media de la población"].get(area_id)
            elderly = indicators["Porcentaje de envejecimiento (población mayor de 65 años/población total)"].get(area_id)
            unemployed = indicators["Paro registrado (número de personas registradas en SEPE en febrero)"].get(area_id)
            cadastral = indicators["Valor catastral medio por inmueble de uso residencial"].get(area_id)
            if income:
                props["income_eur"] = round(income[1])
                props["income_year"] = int(income[0])
            if age:
                props["age_mean"] = round(age[1], 1)
            if elderly:
                props["pct_65"] = round(elderly[1], 1)
            if unemployed:
                props["unemployed"] = int(unemployed[1])
            if cadastral:
                props["home_cadastral_eur"] = round(cadastral[1])
        else:
            if income_n.get(area_id):
                props["income_eur"] = round(income_sum[area_id] / income_n[area_id])
                props["income_year"] = 2023
            if age_people.get(area_id):
                props["age_mean"] = round(age_weighted[area_id] / age_people[area_id], 1)
                props["pct_65"] = round(100 * older[area_id] / age_people[area_id], 1)
    print("free context joined", joined, "of", len(features))


def main() -> None:
    places: list = []
    counts: dict[str, dict[str, int]] = defaultdict(empty_bucket)
    names: dict[str, tuple[str, str]] = {}
    madrid = load_madrid(places, counts, names)
    barcelona = load_barcelona(places, counts, names)
    madrid_features, madrid_miss = madrid_areas(counts, names)
    barcelona_features, barcelona_miss = barcelona_areas(counts, names)
    areas = madrid_features + barcelona_features
    enrich_areas(areas)
    enrich_place_context(areas)

    group_code = {
        "bakery": "b",
        "cafe": "c",
        "grocery": "g",
        "food": "f",
        "pharmacy": "p",
        "beauty": "u",
        "fashion": "s",
        "health": "l",
        "gym": "m",
        "vacant": "v",
        "other": "o",
    }
    status_code = {"Open": "O", "Closed": "C", "Vacant": "V"}
    compact = []
    for feature in places:
        props = feature["properties"]
        lon, lat = feature["geometry"]["coordinates"]
        compact.append(
            [
                lon,
                lat,
                group_code[props["g"]],
                status_code[props["s"]],
                props["i"],
                props["n"],
                props["a"],
                props["e"],
                props["h"],
            ]
        )

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "areas.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": areas}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (ROOT / "data" / "build" / "places.json.gz").write_bytes(
        gzip.compress(json.dumps(compact, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), mtime=0)
    )
    groups: dict[str, int] = defaultdict(int)
    by_city = defaultdict(int)
    for feature in places:
        groups[feature["properties"]["g"]] += 1
        by_city[feature["properties"]["y"]] += 1
    meta = {
        "covered": [
            {
                "id": "madrid",
                "name": "Madrid",
                "vintage": madrid["vintage"],
                "places": madrid["places"],
                "areas": len(madrid_features),
                "note": "Street-door premises. Closed means the census status is closed, not that the unit is listed for rent.",
            },
            {
                "id": "barcelona",
                "name": "Barcelona",
                "vintage": barcelona["vintage"],
                "places": barcelona["places"],
                "areas": len(barcelona_features),
                "note": "Ground-floor premises. Empty units are marked for rent, for sale, or both.",
            },
        ],
        "places": len(places),
        "areas": len(areas),
        "groups": groups,
        "byCity": by_city,
        "unmatched": {"madrid": madrid_miss, "barcelona": barcelona_miss},
        "skipped": {"madrid": madrid["skipped"], "barcelona": barcelona["skipped"]},
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print("areas", (OUT / "areas.geojson").stat().st_size)
    print("places", (ROOT / "data" / "build" / "places.json.gz").stat().st_size)


if __name__ == "__main__":
    main()
