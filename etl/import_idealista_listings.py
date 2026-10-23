"""Build web/data/listings.geojson from a saved Idealista Apify dataset export.



Reads data/raw/mad_idealista_premises_sale.json (no API calls). Re-run after new scrapes.

"""



from __future__ import annotations



import json
import os

from pathlib import Path



from context_join import AreaIndex



ROOT = Path(__file__).resolve().parents[1]

RAW = ROOT / os.environ.get("IDEALISTA_RAW", "data/raw/mad_idealista_premises_sale.json")

AREAS = ROOT / "web/data/areas.geojson"

OUT = ROOT / "web/data/listings.geojson"

META = ROOT / "web/data/meta.json"





def load_items_from_path(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    payload, _end = json.JSONDecoder().raw_decode(text)
    items = payload.get("items")
    if not isinstance(items, list):
        raise SystemExit(f"Expected items array in {path}")
    return items


def item_richness(item: dict) -> int:
    score = 0
    if item.get("_details"):
        score += 4
    if item.get("_stats"):
        score += 2
    if item.get("description"):
        score += 1
    return score


def listing_code(item: dict) -> str:
    return str(item.get("propertyCode") or "").strip()


def load_merged_items() -> list[dict]:
    """Merge every Madrid premises raw export; dedupe by propertyCode (richest row wins)."""
    raw_dir = ROOT / "data" / "raw"
    paths = sorted(
        p
        for p in raw_dir.glob("mad_idealista_premises_sale*.json")
        if p.is_file() and not p.name.endswith(".meta.json")
    )
    if RAW.exists() and RAW not in paths:
        paths.append(RAW)
    if not paths:
        raise SystemExit(f"Missing raw Idealista JSON under {raw_dir} (or {RAW})")

    by_id: dict[str, dict] = {}
    for path in paths:
        for item in load_items_from_path(path):
            code = listing_code(item)
            if not code:
                continue
            prev = by_id.get(code)
            if prev is None or item_richness(item) >= item_richness(prev):
                by_id[code] = item
    return list(by_id.values())





def listing_title(item: dict) -> str:

    suggested = item.get("suggestedTexts") or {}

    return (suggested.get("title") or item.get("address") or "Commercial premises").strip()





def pick_phone(contact: dict) -> str:

    phone = (contact or {}).get("phone1") or {}

    return str(phone.get("formattedPhone") or phone.get("phoneNumber") or "").strip()





def listing_stats(item: dict) -> dict:
    stats = item.get("_stats")
    if not isinstance(stats, dict):
        return {}
    out: dict = {}
    for key in ("views", "contactMails", "sentToFriend", "favorites"):
        block = stats.get(key)
        if isinstance(block, dict):
            text = str(block.get("text") or "").strip()
            if text:
                out[key] = {"value": block.get("value"), "text": text}
    return out


MORE_CHAR_LABELS: dict[str, str] = {
    "agencyIsABank": "Agency is a bank",
    "alarm": "Alarm",
    "archive": "Storeroom / archive",
    "bathNumber": "Bathrooms (detail)",
    "buildingType": "Building type",
    "communityCosts": "Community costs (€/month)",
    "constructedArea": "Constructed area (m²)",
    "corner": "Corner unit",
    "energyCertificationType": "Energy certificate class",
    "energyPerformance": "Energy performance (kWh/m² year)",
    "fullEquipKitchen": "Fully equipped kitchen",
    "isAuction": "Auction listing",
    "localFloorsNumber": "Floors in unit",
    "location": "Location type",
    "modificationDate": "Last modified (timestamp)",
    "roomDistribution": "Room distribution",
    "roomDistributionNumber": "Rooms / divisions",
    "securityCamera": "Security camera",
    "shopWindowsNumber": "Shop windows",
    "smokeExtractor": "Smoke extractor",
    "status": "Condition (detail)",
    "steelDoor": "Security door",
}


def stringify_idealista_value(value: object) -> str:
    if value is None:
        return "—"
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        text = value.strip()
        return text or "—"
    if isinstance(value, dict):
        if value.get("text") and len(value) <= 5:
            return str(value.get("text")).strip() or "—"
        chunks: list[str] = []
        for key in ("prefix", "suffix", "title", "value"):
            part = value.get(key)
            if part not in (None, ""):
                chunks.append(str(part).strip())
        if chunks:
            return " ".join(chunks)
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list):
        parts = [stringify_idealista_value(row) for row in value[:24]]
        joined = " · ".join(part for part in parts if part and part != "—")
        return joined or "—"
    return str(value)


def flatten_mapping(prefix: str, data: dict, out: dict[str, str]) -> None:
    for key, value in data.items():
        path = f"{prefix}.{key}" if prefix else str(key)
        if isinstance(value, dict) and path not in {"energyCertification.energyConsumption", "energyCertification.emissions"}:
            if set(value.keys()) <= {"text", "value"} and "text" in value:
                out[path] = stringify_idealista_value(value.get("text"))
            elif key == "moreCharacteristics":
                for sub_key, sub_value in value.items():
                    label = MORE_CHAR_LABELS.get(sub_key, sub_key)
                    out[f"moreCharacteristics.{sub_key}"] = stringify_idealista_value(sub_value)
            else:
                flatten_mapping(path, value, out)
        else:
            out[path] = stringify_idealista_value(value)


def listing_idealista_fields(item: dict) -> dict[str, str]:
    """Every structured Idealista field we can read (detail page + card), as label paths → text."""
    out: dict[str, str] = {}
    details = item.get("_details")
    if isinstance(details, dict):
        skip_roots = {"multimedia", "tracking", "priceInfo", "contactInfo", "translatedTexts"}
        for key, value in details.items():
            if key in skip_roots:
                continue
            if key == "moreCharacteristics" and isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    label = MORE_CHAR_LABELS.get(sub_key, sub_key)
                    out[f"moreCharacteristics.{label}"] = stringify_idealista_value(sub_value)
                continue
            if key.startswith("allows") and isinstance(value, bool):
                out[key] = stringify_idealista_value(value)
                continue
            if isinstance(value, dict):
                flatten_mapping(str(key), value, out)
            elif isinstance(value, list):
                out[str(key)] = stringify_idealista_value(value)
            else:
                out[str(key)] = stringify_idealista_value(value)

        translated = details.get("translatedTexts") or {}
        for block in translated.get("characteristicsDescriptions") or []:
            if not isinstance(block, dict):
                continue
            title = str(block.get("title") or "").strip()
            for index, feat in enumerate(block.get("detailFeatures") or []):
                if not isinstance(feat, dict):
                    continue
                phrase = feat.get("phrase") or feat.get("text")
                key = f"characteristics.{title or 'features'}.{index + 1}"
                out[key] = stringify_idealista_value(phrase)

        for index, comment in enumerate(details.get("comments") or []):
            if not isinstance(comment, dict):
                continue
            lang = str(comment.get("language") or comment.get("defaultLanguage") or index).strip()
            out[f"comments.{lang}"] = stringify_idealista_value(comment.get("propertyComment"))

    card_keys = (
        "savedAd",
        "favourite",
        "newDevelopmentHighlight",
        "topNewDevelopment",
        "country",
        "status",
        "operation",
        "propertyType",
        "showAddress",
    )
    for key in card_keys:
        if key in item:
            out[f"card.{key}"] = stringify_idealista_value(item.get(key))

    features = item.get("features")
    if isinstance(features, dict):
        for key, value in features.items():
            out[f"features.{key}"] = stringify_idealista_value(value)

    detailed = item.get("detailedType")
    if isinstance(detailed, dict):
        for key, value in detailed.items():
            out[f"detailedType.{key}"] = stringify_idealista_value(value)

    return out


def listing_basics(item: dict) -> list[str]:
    """Structured bullets from Idealista detail pages (requires fetchDetails on the scrape)."""
    details = item.get("_details")
    if not isinstance(details, dict):
        return []

    found: list[str] = []

    def add(text: object) -> None:
        line = str(text or "").strip()
        if line and line not in found:
            found.append(line)

    translated = details.get("translatedTexts") or {}
    for block in translated.get("characteristicsDescriptions") or []:
        if not isinstance(block, dict):
            continue
        block_title = str(block.get("title") or "").strip()
        if block_title:
            add(block_title)
        for feat in block.get("detailFeatures") or []:
            if isinstance(feat, dict):
                add(feat.get("phrase") or feat.get("text"))

    energy = details.get("energyCertification")
    if isinstance(energy, dict):
        if energy.get("text"):
            add(energy.get("text"))
        if energy.get("title"):
            add(energy.get("title"))
        for key in ("energyConsumption", "emissions"):
            block = energy.get(key)
            if not isinstance(block, dict):
                continue
            prefix = str(block.get("prefix") or "").strip()
            suffix = str(block.get("suffix") or "").strip()
            if prefix or suffix:
                add(f"{prefix} {suffix}".strip())

    for group in details.get("featureGroups") or details.get("featuresGrouped") or []:
        if not isinstance(group, dict):
            continue
        group_title = str(group.get("title") or group.get("name") or "").strip()
        if group_title:
            add(group_title)
        for entry in group.get("items") or group.get("features") or []:
            if isinstance(entry, dict):
                add(entry.get("text") or entry.get("title") or entry.get("label"))
            elif isinstance(entry, str):
                add(entry)

    mc = details.get("moreCharacteristics")
    if isinstance(mc, dict):
        for sub_key in sorted(mc.keys()):
            label = MORE_CHAR_LABELS.get(sub_key, sub_key)
            add(f"{label}: {stringify_idealista_value(mc.get(sub_key))}")

    for key, value in details.items():
        if key.startswith("allows") and isinstance(value, bool):
            label = key.replace("allows", "Allows ").replace("Ai", "AI")
            add(f"{label}: {stringify_idealista_value(value)}")

    prop_comment = str(details.get("propertyComment") or "").strip()
    if prop_comment:
        add(prop_comment)

    mod = details.get("modificationDate")
    if isinstance(mod, dict) and mod.get("text"):
        add(str(mod.get("text")).strip())

    ubic = details.get("ubication")
    if isinstance(ubic, dict):
        for field in (
            "title",
            "locationName",
            "administrativeAreaLevel1",
            "administrativeAreaLevel2",
            "administrativeAreaLevel3",
            "administrativeAreaLevel4",
        ):
            text = str(ubic.get(field) or "").strip()
            if text:
                add(text)

    return found


def text_list(value: object, key: str = "text", limit: int = 8) -> list[str]:

    if not isinstance(value, list):

        return []

    found: list[str] = []

    for row in value:

        if isinstance(row, dict):

            text = str(row.get(key) or "").strip()

            if text:

                found.append(text)

        elif isinstance(row, str) and row.strip():

            found.append(row.strip())

    return found[:limit]





def listing_detail(item: dict) -> dict:

    multimedia = item.get("multimedia") or {}

    images_raw = multimedia.get("images") or []

    images = [img.get("url") for img in images_raw if isinstance(img, dict) and img.get("url")]

    img_tags = list(

        dict.fromkeys(

            str(img.get("tag")).strip()

            for img in images_raw

            if isinstance(img, dict) and img.get("tag")

        )

    )[:10]

    thumb = item.get("thumbnail") or (images[0] if images else "")

    description = (item.get("description") or "").strip()

    if len(description) > 2400:

        description = f"{description[:2400].rstrip()}…"

    contact = item.get("contactInfo") or {}

    detailed = item.get("detailedType") or {}

    features = item.get("features") or {}

    ubic = item.get("ubicationInfo") or {}

    highlight = item.get("highlight") if isinstance(item.get("highlight"), dict) else {}

    price_info = item.get("priceInfo") or {}

    price_row = price_info.get("price") if isinstance(price_info.get("price"), dict) else {}

    currency = str(price_row.get("currencySuffix") or "€").strip()



    detail: dict = {

        "desc": description,

        "thumb": thumb,

        "imgs": images[:16],

        "floor": item.get("floor") or "",

        "bath": item.get("bathrooms"),

        "photos": item.get("numPhotos"),

        "agency": contact.get("commercialName") or "",

        "ref": str(item.get("externalReference") or "").strip(),

        "typology": detailed.get("subTypology") or detailed.get("typology") or "",

        "ac": bool(features.get("hasAirConditioning")),

        "status": str(item.get("status") or "").strip(),

        "transfer": bool(detailed.get("transfer")),

        "ubic": str(ubic.get("text") or "").strip(),

        "ubicKey": str(ubic.get("key") or "").strip(),

        "contactName": str(contact.get("contactName") or "").strip(),

        "phone": pick_phone(contact),

        "userType": str(contact.get("userType") or "").strip(),

        "agencyLogo": str(contact.get("agencyLogo") or "").strip(),

        "contactMethod": str(contact.get("contactMethod") or "").strip(),

        "showAddr": bool(item.get("showAddress")),

        "newDev": bool(item.get("newDevelopment")),

        "newProp": bool(item.get("newProperty")),

        "has360": bool(item.get("has360")),

        "has3d": bool(item.get("has3DTour")),

        "hasPlan": bool(item.get("hasPlan")),

        "hasVideo": bool(item.get("hasVideo")),

        "hasStaging": bool(item.get("hasStaging")),

        "topHighlight": bool(item.get("topHighlight")),

        "topPlus": bool(item.get("topPlus")),

        "prefHighlight": bool(item.get("preferenceHighlight")),

        "visualHighlight": bool(item.get("visualHighlight")),

        "urgentHighlight": bool(item.get("urgentVisualHighlight")),

        "highlight": str(highlight.get("groupDescription") or "").strip(),

        "labels": text_list(item.get("labels")),

        "ribbons": text_list(item.get("ribbons")),

        "notes": text_list(item.get("notes")),

        "imgTags": img_tags,

        "locId": str(item.get("locationId") or "").strip(),

        "currency": currency,

        "propCode": str(item.get("propertyCode") or "").strip(),

        "propertyType": str(item.get("propertyType") or "").strip(),

        "dropDate": str(item.get("dropDate") or "").strip(),

    }

    if item.get("priceDropPercentage") is not None:

        detail["priceDropPct"] = item.get("priceDropPercentage")

    if item.get("priceDropValue") is not None:

        detail["priceDropVal"] = item.get("priceDropValue")

    if item.get("favourite"):

        detail["favourite"] = True

    if item.get("savedAd"):

        detail["savedAd"] = True

    basics = listing_basics(item)

    if basics:

        detail["basics"] = basics

    idealista = listing_idealista_fields(item)
    if idealista:
        detail["idealista"] = idealista

    details = item.get("_details")
    if isinstance(details, dict):
        mod_block = details.get("modificationDate")
        if isinstance(mod_block, dict) and mod_block.get("text"):
            detail["modified"] = str(mod_block.get("text")).strip()
        elif item.get("dropDate"):
            detail["modified"] = str(item.get("dropDate")).strip()

    stats = listing_stats(item)

    if stats:

        detail["stats"] = stats

    compact: dict = {}
    for key, value in detail.items():
        if key == "idealista" and isinstance(value, dict):
            compact[key] = value
            continue
        if value in ("", None, False, []):
            continue
        compact[key] = value
    return compact





def main() -> None:
    items = load_merged_items()
    if not items:
        raise SystemExit("No Idealista items found in raw exports.")

    areas = json.loads(AREAS.read_text(encoding="utf-8"))

    index = AreaIndex(areas["features"], "mad-")

    features: list[dict] = []

    unmatched = 0

    for item in items:

        lon = item.get("longitude")

        lat = item.get("latitude")

        if lon is None or lat is None:

            continue

        area = index.find(float(lon), float(lat))

        area_id = area["properties"]["id"] if area else ""

        if not area_id:

            unmatched += 1

        features.append(

            {

                "type": "Feature",

                "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},

                "properties": {

                    "id": str(item.get("propertyCode", "")),

                    "t": listing_title(item)[:140],

                    "a": (item.get("address") or "").strip()[:180],

                    "p": int(item.get("price") or 0),

                    "pm2": int(item.get("priceByArea") or 0),

                    "sz": int(item.get("size") or 0),

                    "u": item.get("url") or "",

                    "d": item.get("district") or "",

                    "n": item.get("neighborhood") or "",

                    "m": item.get("municipality") or "",

                    "pr": item.get("province") or "",

                    "i": area_id,

                    "op": str(item.get("operation") or "sale"),

                    "full": bool(item.get("_details")),

                    "x": listing_detail(item),

                },

            }

        )

    collection = {

        "type": "FeatureCollection",

        "meta": {

            "source": "idealista",

            "operation": "sale",

            "propertyType": "premises",

            "city": "Madrid",

            "count": len(features),

            "unmatchedAreas": unmatched,

            "detailFields": sorted(

                {

                    key

                    for feature in features

                    for key in (feature.get("properties", {}).get("x") or {}).keys()

                }

            ),

        },

        "features": features,

    }

    OUT.parent.mkdir(parents=True, exist_ok=True)

    OUT.write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    if META.exists():

        meta = json.loads(META.read_text(encoding="utf-8"))

        meta["idealistaListings"] = {

            "madrid": len(features),

            "operation": "sale",

            "detailFields": collection["meta"]["detailFields"],

            "note": "Purple pins on the map. Sample from Apify; expand with etl/import_idealista_listings.py after each scrape.",

        }

        META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote {OUT} ({len(features)} features from {len(items)} merged items, {unmatched} without barrio match)")





if __name__ == "__main__":

    main()


