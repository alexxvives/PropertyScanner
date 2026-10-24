"""Add age distribution (bands, median age) to web/data/areas.geojson.

Sources (downloaded to data/raw/, gitignored):
- Madrid: datos.madrid.es dataset 200076-0-padron (Padrón municipal, monthly, by
  district/barrio/census section and single year of age) -> data/raw/mad_padron_edad.csv
- Barcelona: Open Data BCN pad_mdbas_edat-1, 2026 (Padró, by census section and single
  year of age) via the CKAN datastore API -> data/raw/bcn_edat_2026.csv
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
AREAS = ROOT / "web" / "data" / "areas.geojson"
BANDS = [(0, 14, "0–14"), (15, 24, "15–24"), (25, 44, "25–44"), (45, 64, "45–64"), (65, 200, "65+")]


def num(v):
    try:
        return int(float(str(v).strip()))
    except ValueError:
        return None


def main() -> None:
    by_area: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    with (RAW / "mad_padron_edad.csv").open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh, delimiter=";"):
            age = num(row["COD_EDAD_INT"])
            if age is None or not str(row["COD_DIST_BARRIO"]).strip():
                continue
            people = sum(num(row[k]) or 0 for k in ("ESPANOLESHOMBRES", "ESPANOLESMUJERES", "EXTRANJEROSHOMBRES", "EXTRANJEROSMUJERES"))
            by_area[f"mad-{int(row['COD_DIST_BARRIO'])}"][age] += people
    with (RAW / "bcn_edat_2026.csv").open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            age = num(row["EDAT_1"])
            count = 2 if row["Valor"].strip() == ".." else num(row["Valor"])
            if age is None or count is None:
                continue
            by_area[f"bcn-{int(float(row['Codi_Barri']))}"][age] += count
    data = json.loads(AREAS.read_text(encoding="utf-8"))
    hit = 0
    for f in data["features"]:
        p = f["properties"]
        ages = by_area.get(p["id"])
        if not ages:
            continue
        total = sum(ages.values())
        if not total:
            continue
        hit += 1
        acc, median = 0, None
        for a in sorted(ages):
            acc += ages[a]
            if median is None and acc >= total / 2:
                median = a
        p["age_median"] = median
        p["age_mean"] = round(sum(a * n for a, n in ages.items()) / total, 1)
        p["age_bands"] = [round(100 * sum(n for a, n in ages.items() if lo <= a <= hi) / total, 1) for lo, hi, _ in BANDS]
        p["pct_65"] = p["age_bands"][-1]
    data.setdefault("meta", {})["ageBands"] = [b[2] for b in BANDS]
    AREAS.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"age bands for {hit} of {len(data['features'])} areas")


if __name__ == "__main__":
    main()
