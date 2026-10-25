"""Build web/data/listings.geojson from a saved Idealista Apify dataset export.



Reads data/raw/mad_idealista_premises_sale.json (no API calls). Re-run after new scrapes.

Usage:
  python etl/import_idealista_listings.py             # full rebuild from data/raw exports
  python etl/import_idealista_listings.py --recurate  # refresh only the curated investor
                                                      # block (properties.inv) in place

"""



from __future__ import annotations



import gzip
import json
import os
import re
import sys
from datetime import date

from pathlib import Path



from context_join import AreaIndex



ROOT = Path(__file__).resolve().parents[1]

RAW = ROOT / os.environ.get("IDEALISTA_RAW", "data/raw/mad_idealista_premises_sale.json")

AREAS = ROOT / "web/data/areas.geojson"

OUT = ROOT / "data/build/listings.geojson.gz"  # gzipped so the committed file stays far under 25 MiB

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
    """Merge every premises raw export (any city, sale + rent); dedupe by propertyCode (richest row wins)."""
    raw_dir = ROOT / "data" / "raw"
    paths = sorted(
        p
        for p in raw_dir.glob("*_idealista_premises_*.json")
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
            # provenance: advertiser default text, Idealista machine translation, or extra advertiser version
            out[f"comments_kind.{lang}"] = ("auto" if comment.get("autoTranslated")
                                            else "orig" if comment.get("defaultLanguage") else "adv")

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





RAW_BAG_DROP = ("comments", "propertyComment", "characteristics.", "moreCharacteristics.", "ubication.", "detailWebLink", "modificationDate", "card.", "translatedTexts", "multimedia", "suggestedTexts", "tracking", "contactInfo.agentInfo", "contactInfo.corporate")


def prune_raw_bag(props: dict) -> None:
    """Drop raw per-language comment copies and media blobs once curated fields exist (keeps the asset small)."""
    bag = (props.get("x") or {}).get("idealista")
    if isinstance(bag, dict):
        for key in [k for k in bag if k.startswith(RAW_BAG_DROP)]:
            del bag[key]
    inv = props.get("inv")
    if isinstance(inv, dict):
        # photo URL list and thumb already live in x.imgs / x.thumb; the UI reads those.
        inv.pop("photos", None)
        inv.pop("thumb", None)


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





# ---------------------------------------------------------------------------
# Investor field set (keep/drop mapping).
#
# Listing cards show ONLY the curated "inv" block below. Everything else from
# Apify stays in properties.x (raw) and is shown behind a "Raw Idealista data"
# toggle. Future scrapes go through curate_listing(), so the mapping lives here.
#
#   KEEP (-> properties.inv)        SOURCE
#   price                           item.price / props.p
#   size_m2                         item.size / props.sz
#   price_m2                        item.priceByArea / props.pm2 (or price/size)
#   location                        neighborhood, district, street (ubication.title)
#   floor                           item.floor (bj=ground, st=basement, en=mezzanine...)
#   storefront                      ubicationInfo (street/mall), shop windows, corner
#   condition                       item.status (good/renew/newdevelopment)
#   current_use                     traspaso flag, "Commercial activity" line,
#                                   leased/tenant keywords in the description
#   link                            item.url
#   photos                          multimedia.images (max 16) / thumbnail
#   days_on_market                  first time a scrape saw the propertyCode
#                                   (etl/listing_first_seen.json); Idealista does
#                                   not expose the publication date
#   price_drop                      priceDropPercentage / priceDropValue
#   community_costs_month           moreCharacteristics.communityCosts
#   energy_class                    moreCharacteristics.energyCertificationType
#   agency, phone                   contactInfo
#
#   DROP from the card (still in raw x): highlight/marketing flags (topPlus,
#   visualHighlight...), allows* toggles, tracking ids, locationId, imgTags,
#   agencyLogo, contactMethod, has360/3D/video/staging, savedAd/favourite,
#   multilingual comments, admin-area ids, lat/lon duplicates.
# ---------------------------------------------------------------------------

FIRST_SEEN = ROOT / "etl" / "listing_first_seen.json"

FLOOR_LABELS = {
    "bj": "Ground floor", "st": "Basement", "ss": "Semi-basement",
    "en": "Mezzanine", "0": "Ground floor",
}
CONDITION_LABELS = {
    "good": "Good condition", "renew": "Needs renovation",
    "newdevelopment": "New build", "new": "New build",
}
LEASED_RE = re.compile(
    r"\b(alquilad[oa]|arrendad[oa]|con inquilino|inquilino actual|contrato de alquiler en vigor|"
    r"rentabilidad|inversi[oó]n con renta|leased|sitting tenant|currently rented)\b",
    re.IGNORECASE,
)
VACANT_RE = re.compile(r"\b(vac[ií]o|libre de inquilinos|diáfano|se entregar[aá] (completamente )?vac[ií]o|empty)\b", re.IGNORECASE)


def _num(value: object) -> float | None:
    try:
        n = float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None
    return n if n == n else None


def current_use(detail: dict) -> str:
    raw = detail.get("idealista") or {}
    desc = str(detail.get("desc") or "")
    bits: list[str] = []
    if detail.get("transfer") or raw.get("detailedType.transfer") == "Yes":
        bits.append("Business transfer (traspaso)")
    for line in detail.get("basics") or []:
        if str(line).lower().startswith("commercial activity:"):
            bits.append(str(line).split(":", 1)[1].strip())
    if LEASED_RE.search(desc):
        bits.append("Possibly leased / sold with tenant (check description)")
    elif VACANT_RE.search(desc):
        bits.append("Vacant (per description)")
    return " · ".join(dict.fromkeys(bits))


def storefront(detail: dict) -> str:
    raw = detail.get("idealista") or {}
    bits: list[str] = []
    ubic_labels = {
        "onTheStreet": "Street level", "shoppingCenter": "In shopping centre",
        "onTopFloor": "Upper floor", "mezzanine": "Mezzanine", "belowGround": "Below ground",
    }
    if detail.get("ubic"):
        bits.append(ubic_labels.get(str(detail.get("ubicKey") or ""), str(detail["ubic"])))
    windows = raw.get("moreCharacteristics.Shop windows")
    if windows and windows not in ("—", "0"):
        bits.append(f"{windows} shop window{'s' if windows != '1' else ''}")
    else:
        for line in detail.get("basics") or []:
            if "show window" in str(line).lower():
                bits.append(str(line))
                break
    corner = raw.get("moreCharacteristics.Corner unit")
    if corner == "Yes" or (corner is None and any(
        str(line).strip().lower() == "on the corner" for line in detail.get("basics") or []
    )):
        bits.append("Corner")
    return " · ".join(dict.fromkeys(bits))


def load_first_seen() -> dict[str, str]:
    if FIRST_SEEN.exists():
        return json.loads(FIRST_SEEN.read_text(encoding="utf-8"))
    return {}


def curate_listing(props: dict, detail: dict, first_seen: dict[str, str], today: str) -> dict:
    """Return the curated investor field set for one for-sale listing."""
    raw = detail.get("idealista") or {}
    code = str(props.get("id") or "")
    if code and code not in first_seen:
        first_seen[code] = today
    seen = first_seen.get(code, today)
    days = (date.fromisoformat(today) - date.fromisoformat(seen)).days
    price = int(props.get("p") or 0)
    size = int(props.get("sz") or 0)
    pm2 = int(props.get("pm2") or 0) or (round(price / size) if price and size else 0)
    floor_raw = str(detail.get("floor") or "")
    street = raw.get("ubication.title") or ""
    inv = {
        "price": price,
        "size_m2": size,
        "price_m2": pm2,
        "location": ", ".join(x for x in (street, props.get("n"), props.get("d"), props.get("m")) if x and x != "—"),
        "floor": FLOOR_LABELS.get(floor_raw, f"Floor {floor_raw}" if floor_raw else ""),
        "storefront": storefront(detail),
        "condition": CONDITION_LABELS.get(str(detail.get("status") or ""), str(detail.get("status") or "")),
        "current_use": current_use(detail),
        "link": props.get("u") or "",
        "photos": (detail.get("imgs") or ([detail["thumb"]] if detail.get("thumb") else []))[:16],
        "first_seen": seen,
        "days_on_market": days,
        "price_drop": (
            f"{detail['priceDropPct']}%" + (f" (−{detail['priceDropVal']} €)" if detail.get("priceDropVal") else "")
            if detail.get("priceDropPct") is not None else ""
        ),
        "community_costs_month": _num(raw.get("moreCharacteristics.Community costs (€/month)")),
        "energy_class": (raw.get("moreCharacteristics.Energy certificate class") or "").upper().replace("—", ""),
        "agency": detail.get("agency") or "",
        "phone": detail.get("phone") or "",
        # --- round 3 (Alex's field review, see ps-fields-final.csv) ---
        "contact_name": detail.get("contactName") or "",
        "agency_logo": detail.get("agencyLogo") or "",
        "agency_ref": detail.get("ref") or "",
        "advertiser_type": detail.get("userType") or "",
        "currency": detail.get("currency") or "€",
        "country": raw.get("card.country") or raw.get("country") or "es",
        "admin_levels": [raw.get(f"ubication.administrativeAreaLevel{i}") for i in (1, 2, 3, 4)
                         if raw.get(f"ubication.administrativeAreaLevel{i}")],
        "location_code": detail.get("locId") or "",
        "listing_code": detail.get("propCode") or str(props.get("id") or ""),
        "state": raw.get("state") or "",
        "updated_ms": _num(raw.get("modificationDate.value")),
        "activity": _activity(detail),
        "highlighted": bool(detail.get("highlight") or detail.get("prefHighlight")),
        "new_dev_highlight": raw.get("card.newDevelopmentHighlight") == "Yes",
        "auction": raw.get("moreCharacteristics.Auction listing") == "Yes",
        "transfer": bool(detail.get("transfer")) or raw.get("detailedType.transfer") == "Yes",
        "labels": detail.get("labels") or [],
        "price_drop_pct": _num(detail.get("priceDropPct")),
        "price_drop_eur": _num(detail.get("priceDropVal")),
        "price_drop_date_ms": _num(detail.get("dropDate")),
        "energy": {k: v for k, v in {
            "class": (raw.get("moreCharacteristics.Energy certificate class") or "").upper().replace("—", ""),
            "consumption": raw.get("energyCertification.energyConsumption") or "",
            "emissions": raw.get("energyCertification.emissions") or "",
            "note": raw.get("energyCertification.text") or "",
        }.items() if v},
        "features": _features(detail),
        "media": [m for m, on in (("Floor plan", detail.get("hasPlan")), ("Video", detail.get("hasVideo")),
                                  ("360° tour", detail.get("has360"))) if on],
        "photo_count": detail.get("photos") or 0,
        "thumb": detail.get("thumb") or "",
        "photo_tags": (detail.get("imgTags") or [])[:16],
        "desc_ca": raw.get("comments.ca") or "",
        # --- round 6: original-language + translations, structured specs (raw dump removed from card) ---
        "desc_es": raw.get("comments.es") or raw.get("propertyComment") or "",
        "desc_en": raw.get("comments.en") or "",
        **_specs(detail, raw),
        "title_en": raw.get("suggestedTexts.title") or "",
        "desc_kind": _desc_kinds(raw),
    }
    keep_zero = {"days_on_market"}
    return {k: v for k, v in inv.items() if k in keep_zero or v not in ("", None, [], {}, False, 0)}


def _orig_lang(comments) -> str:
    try:
        return str(json.loads(comments).get("defaultLanguage") or "") if isinstance(comments, str) else ""
    except ValueError:
        return ""


def _desc_kinds(raw: dict) -> dict:
    """es/en/ca -> orig | auto | adv | stub (Idealista's generated one-liner when no real text exists)."""
    out = {}
    for lang in ("es", "en", "ca"):
        text = str(raw.get(f"comments.{lang}") or "")
        kind = raw.get(f"comments_kind.{lang}") or ""
        if not text:
            continue
        if kind == "adv" and len(text) < 220 and "\n" not in text.strip():
            kind = "stub"
        out[lang] = kind or "unknown"
    return out


def _specs(detail: dict, raw: dict) -> dict:
    """Structured specs for the card's Details tab and tenant hard filters."""
    basics = [str(b) for b in detail.get("basics") or []]
    out: dict = {}
    for line in basics:
        m = re.match(r"Facade length: (\d+(?:[.,]\d+)?) m", line)
        if m:
            out["facade_m"] = float(m.group(1).replace(",", "."))
        m = re.match(r"Built in (\d{4})", line)
        if m:
            out["year_built"] = int(m.group(1))
    fa = raw.get("moreCharacteristics.facadeArea")
    if "facade_m" not in out and fa:
        out["facade_band"] = {"moreThanTwelve": "> 12 m", "nineToTwelveMeters": "9–12 m"}.get(fa, fa)
    for key, src in (("usable_m2", "moreCharacteristics.usableArea"), ("shop_windows", "moreCharacteristics.Shop windows"),
                     ("floors_in_unit", "moreCharacteristics.Floors in unit"), ("rooms", "moreCharacteristics.Rooms / divisions"),
                     ("bathrooms", "moreCharacteristics.Bathrooms (detail)"), ("transfer_cost", "moreCharacteristics.transferCost")):
        v = _num(raw.get(src))
        if v:
            out[key] = v
    yes = lambda k: raw.get(f"moreCharacteristics.{k}")
    out["equip"] = {k: v for k, v in {
        "ac": True if detail.get("ac") or raw.get("features.hasAirConditioning") == "Yes" else None,
        "heating": True if any(b.lower() == "heating" for b in basics) else None,
        "corner": {"Yes": True, "No": False}.get(yes("Corner unit")),
        "smoke": {"Yes": True, "No": False}.get(yes("Smoke extractor")),
        "kitchen": {"Yes": True, "No": False}.get(yes("Fully equipped kitchen")),
        "storeroom": {"Yes": True, "No": False}.get(yes("Storeroom / archive")),
        "alarm": {"Yes": True, "No": False}.get(yes("Alarm")),
        "camera": {"Yes": True, "No": False}.get(yes("Security camera")),
        "door": {"Yes": True, "No": False}.get(yes("Security door")),
        "accessible_wc": {"Yes": True, "No": False}.get(yes("handicapedBaths")),
    }.items() if v is not None}
    loc = raw.get("moreCharacteristics.Location type")
    if loc:
        out["location_type"] = {"street": "Street level", "others": "Other", "ontopfloor": "Upper floor", "mezzanine": "Mezzanine",
                                "underground": "Basement", "shoppingCenter": "Shopping centre"}.get(loc, loc)
    if raw.get("moreCharacteristics.lastCommercialActivity"):
        out["last_activity"] = raw["moreCharacteristics.lastCommercialActivity"]
    if raw.get("moreCharacteristics.Building type") == "industrialBuilding":
        out["building_type"] = "Industrial building (nave)"
    return out


def _activity(detail: dict) -> dict:
    stats = detail.get("stats") or {}
    out = {}
    for key, label in (("views", "views"), ("favorites", "favorites"), ("contactMails", "contacts"), ("sentToFriend", "shared")):
        v = stats.get(key)
        v = v.get("value") if isinstance(v, dict) else v
        if v is not None:
            out[label] = int(_num(v) or 0)
    return out


FEATURE_SKIP = re.compile(r"(price|m² constructed|m² floor|community costs)", re.IGNORECASE)


def _features(detail: dict) -> list[str]:
    """All characteristics + 'Yes' moreCharacteristics, deduplicated, as short chips."""
    raw = detail.get("idealista") or {}
    chips: list[str] = []
    for key, value in raw.items():
        if key.startswith("characteristics.") and ".Price." not in key and value and not FEATURE_SKIP.search(str(value)):
            chips.append(str(value))
    for key, value in raw.items():
        if key.startswith("moreCharacteristics.") and value == "Yes":
            chips.append(key.split(".", 1)[1])
    if detail.get("ac"):
        chips.append("Air conditioning")
    seen, out = set(), []
    for chip in chips:
        k = chip.lower().replace("smoke outlet", "smoke extractor").replace("storeroom/archive", "storeroom / archive")
        if k not in seen:
            seen.add(k)
            out.append(chip)
    return out


def is_inactive(props: dict) -> bool:
    state = ((props.get("x") or {}).get("idealista") or {}).get("state")
    return bool(state) and state != "active"


def save_first_seen(first_seen: dict[str, str]) -> None:
    FIRST_SEEN.write_text(json.dumps(dict(sorted(first_seen.items())), indent=1) + "\n", encoding="utf-8")


def recurate_existing() -> None:
    """Rebuild the curated block from the committed listings.geojson (no raw export needed)."""
    collection = json.loads(gzip.decompress(OUT.read_bytes()).decode("utf-8"))
    first_seen = load_first_seen()
    today = date.today().isoformat()
    before = len(collection["features"])
    collection["features"] = [f for f in collection["features"] if not is_inactive(f["properties"])]
    print(f"excluded {before - len(collection['features'])} inactive listings")
    for feature in collection["features"]:
        props = feature["properties"]
        props["inv"] = curate_listing(props, props.get("x") or {}, first_seen, today)
        prune_raw_bag(props)
    collection["meta"]["investorFields"] = INVESTOR_FIELDS
    OUT.write_bytes(gzip.compress(json.dumps(collection, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), mtime=0))
    save_first_seen(first_seen)
    print(f"re-curated {len(collection['features'])} listings in {OUT}")


INVESTOR_FIELDS = [
    "price", "size_m2", "price_m2", "location", "floor", "storefront", "condition",
    "current_use", "link", "photos", "first_seen", "days_on_market", "price_drop",
    "community_costs_month", "energy_class", "agency", "phone",
    "contact_name", "agency_logo", "agency_ref", "advertiser_type", "currency", "country",
    "admin_levels", "location_code", "listing_code", "state", "updated_ms", "activity",
    "highlighted", "new_dev_highlight", "auction", "transfer", "labels", "price_drop_pct",
    "price_drop_eur", "price_drop_date_ms", "energy", "features", "media", "photo_count",
    "thumb", "photo_tags", "desc_ca", "title_en", "desc_kind",
    "desc_es", "desc_en", "facade_m", "facade_band", "year_built", "usable_m2",
    "shop_windows", "floors_in_unit", "rooms", "bathrooms", "transfer_cost", "equip", "location_type",
    "last_activity", "building_type",
]


def main() -> None:
    items = load_merged_items()
    if not items:
        raise SystemExit("No Idealista items found in raw exports.")

    areas = json.loads(AREAS.read_text(encoding="utf-8"))

    index = AreaIndex(areas["features"], "")  # Madrid + Barcelona barrios

    features: list[dict] = []

    first_seen = load_first_seen()

    today = date.today().isoformat()

    unmatched = 0

    for item in items:

        lon = item.get("longitude")

        lat = item.get("latitude")

        if lon is None or lat is None:

            continue

        state = str(item.get("state") or (item.get("_details") or {}).get("state") or "").lower()
        if state and state != "active":
            continue  # Alex: never show inactive listings

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

    for feature in features:
        props = feature["properties"]
        props["inv"] = curate_listing(props, props["x"], first_seen, today)
        prune_raw_bag(props)
    save_first_seen(first_seen)

    collection = {

        "type": "FeatureCollection",

        "meta": {

            "source": "idealista",

            "operation": sorted({f["properties"]["op"] for f in features}),

            "propertyType": "premises",

            "city": sorted({f["properties"]["m"] for f in features if f["properties"]["m"]}),

            "count": len(features),

            "unmatchedAreas": unmatched,

            "investorFields": INVESTOR_FIELDS,

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

    OUT.write_bytes(gzip.compress(json.dumps(collection, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), mtime=0))

    if META.exists():

        meta = json.loads(META.read_text(encoding="utf-8"))

        counts: dict[str, int] = {}
        for f in features:
            pr = f["properties"]
            key = f'{(pr["pr"] or pr["m"] or "other").lower()}_{pr["op"]}'
            counts[key] = counts.get(key, 0) + 1
        meta["idealistaListings"] = {

            "total": len(features),

            "counts": counts,

            "operation": ["sale", "rent"],

            "detailFields": collection["meta"]["detailFields"],

            "note": "Purple pins on the map. Sample from Apify; expand with etl/import_idealista_listings.py after each scrape.",

        }

        META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote {OUT} ({len(features)} features from {len(items)} merged items, {unmatched} without barrio match)")





if __name__ == "__main__":
    if "--recurate" in sys.argv:
        recurate_existing()
    else:
        main()


