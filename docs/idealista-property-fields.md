# Idealista property data — fields we extract

Reference for **every property lead** from Apify (`igolaizola/idealista-scraper`) through ETL (`etl/import_idealista_listings.py`) into `data/build/listings.geojson.gz (split by etl/build_web_data.py into web/data/l-*.json + d/{id}.json)` and the map UI.

**Current project focus:** Madrid commercial **premises** (`propertyType: premises`), **sale** (`operation: sale`). Rent and other property types use the same Idealista shapes; only a subset has been observed in our raw files.

**Sample coverage:** This doc lists **all fields the pipeline knows how to read**, plus **value examples** from merged raw exports (`mad_idealista_premises_sale.json` + `mad_idealista_premises_sale_sample10.json`, 60 listings). Idealista can return additional keys on other listings; those are stored in raw JSON and flattened into `x.idealista` when present.

---

## 1. Data flow

```mermaid
flowchart LR
  A[Apify Actor] --> B[data/raw/*.json]
  B --> C[import_idealista_listings.py]
  C --> D[data/build/listings.geojson.gz (split by etl/build_web_data.py into web/data/l-*.json + d/{id}.json)]
  D --> E[web/app.js UI]
```

| Stage | What you get |
| --- | --- |
| **Search results only** | One row per listing: card metadata, price, coords, short description, thumbnails. |
| **`fetchDetails: true`** | Adds `_details` per listing (extra HTTP request each). Characteristics, energy cert, richer contact, more photos, translated bullets. |
| **`fetchStats: true`** | Adds `_stats` per listing (extra HTTP request each). Views, favourites, email contacts, “sent to friend”. |
| **ETL** | Point GeoJSON + compact `properties` + nested `x` detail object. Joins **barrio id** `i` from `areas.geojson`. |
| **UI** | Renders price, specs, description, images, engagement tags, and **fit scores** (from census/context, not from Idealista). |

**Cost (Apify, approximate):** ~$0.0005 per listing in the dataset, plus extra platform events when `fetchDetails` / `fetchStats` are enabled (one additional request per listing per toggle). Our JSON size does not change Apify billing.

---

## 2. Apify actor inputs (toggles we use)

Actor: **`igolaizola/idealista-scraper`**

| Input | Type / examples | Effect |
| --- | --- | --- |
| `country` | `"es"` | Spain search. |
| `location` | `"Madrid"`, URL, or Idealista location string | Geographic scope of the search. |
| `operation` | `"sale"` \| `"rent"` | Sale vs rent listings. |
| `propertyType` | `"premises"` (also homes, offices, etc. on Idealista) | Asset class filter. |
| `maxItems` | e.g. `10`, `50`, `200` | Cap on listings returned. |
| `sortBy` | e.g. `"mostRecent"` | Result ordering (other sort values depend on actor schema). |
| **`fetchDetails`** | `true` \| `false` (default false) | Fetches property **detail page** → `_details` on each item. Required for full characteristics, `basics`, and most of `x.idealista`. |
| **`fetchStats`** | `true` \| `false` (default false) | Fetches engagement **stats page** → `_stats` on each item. |

**Not scraped into GeoJSON but present in raw card JSON:** search-page flags (`topHighlight`, `hasPlan`, `ribbons`, etc.) — see §6 and §8.

---

## 3. GeoJSON feature (`listings.geojson`)

Each feature is a **Point** at `[longitude, latitude]`.

### 3.1 Top-level `properties` (short keys)

| Key | Type | Source (Idealista) | Description / example values |
| --- | --- | --- | --- |
| `id` | string | `propertyCode` | Idealista listing id, e.g. `"112876711"`. |
| `t` | string | `suggestedTexts.title` or `address` | Display title, max 140 chars, e.g. `"Commercial premises for sale in Calle de las Almortas, 10"`. |
| `a` | string | `address` | Full address line, max 180 chars. |
| `p` | integer | `price` | Ask price in euros, e.g. `249000`. `0` if missing. |
| `pm2` | integer | `priceByArea` | Price per m² (€), e.g. `1992`. |
| `sz` | integer | `size` | Advertised size in m², e.g. `125`. |
| `u` | string | `url` | Canonical listing URL, e.g. `https://www.idealista.com/inmueble/112876711/`. |
| `d` | string | `district` | District name, e.g. `"Tetuán"`. |
| `n` | string | `neighborhood` | Subdistrict / barrio label from Idealista, e.g. `"Valdeacederas"`. |
| `m` | string | `municipality` | Municipality, e.g. `"Madrid"`. |
| `pr` | string | `province` | Province, e.g. `"Madrid"`. |
| `i` | string | *(computed)* | Internal **area id** from point-in-polygon vs `areas.geojson`, e.g. `"mad-…"`. Empty if no match (`unmatchedAreas` in meta). |
| `op` | string | `operation` | `"sale"` or `"rent"`. |
| `full` | boolean | `bool(_details)` | `true` if scraped with **`fetchDetails`**. UI may hide “partial” leads when `FULL_DETAIL_LEADS_ONLY` is on. |
| `x` | object | see §4 | All rich listing fields (compact). |

**Collection `meta`:** `source`, `operation`, `propertyType`, `city`, `count`, `unmatchedAreas`, `detailFields` (union of keys present in any `x`).

---

## 4. Detail object `properties.x`

Built by `listing_detail()` in `import_idealista_listings.py`. Empty strings, `false`, empty arrays, and `null` are **omitted** (except `idealista`, which is kept as a dict even if sparse).

### 4.1 Core content

| Key | Type | Source | Values / notes |
| --- | --- | --- | --- |
| `desc` | string | `description` | Full description text; **truncated to 2400 characters** in ETL (UI shows verbatim with line breaks). |
| `thumb` | string (URL) | `thumbnail` or first image | Hero thumbnail. |
| `imgs` | string[] | `multimedia.images[].url` | Up to **16** image URLs. |
| `imgTags` | string[] | `multimedia.images[].tag` | Photo labels; see §7.3. |
| `photos` | number | `numPhotos` | Photo count on Idealista. |
| `floor` | string | `floor` | Idealista floor code, e.g. `"bj"` (ground), `"st"` (semi-basement), `"1"`, `"3"`. UI may show raw code in specs. |
| `bath` | number \| null | `bathrooms` | Bathroom count, often `0` for premises. |
| `status` | string | `status` | Card condition: observed **`good`**, **`renew`** (needs renovation). UI maps to “Good condition” / “Needs renovation”. Other Idealista values possible. |
| `typology` | string | `detailedType.subTypology` or `typology` | e.g. **`commercialProperty`**, **`industrialPremise`**, **`premise`**. |
| `transfer` | boolean | `detailedType.transfer` | Business transfer included; usually `false` in our sample. |
| `ac` | boolean | `features.hasAirConditioning` | Air conditioning. |
| `ubic` | string | `ubicationInfo.text` | Street-front / location blurb on the card. |
| `ubicKey` | string | `ubicationInfo.key` | Machine key for ubicación type. |
| `propertyType` | string | `propertyType` | Always **`premise`** in current dataset. |
| `propCode` | string | `propertyCode` | Same as `properties.id`. |
| `locId` | string | `locationId` | Idealista location hierarchy id. |
| `currency` | string | `priceInfo.price.currencySuffix` | Usually **`€`**. |
| `ref` | string | `externalReference` | Agency reference code. |

### 4.2 Contact & agency

| Key | Type | Source | Values / notes |
| --- | --- | --- | --- |
| `agency` | string | `contactInfo.commercialName` | Agency brand, e.g. `"Miscasa"`. |
| `contactName` | string | `contactInfo.contactName` | Contact person or desk name. |
| `phone` | string | `contactInfo.phone1.formattedPhone` or `phoneNumber` | e.g. `"919 38 50 89"`. |
| `userType` | string | `contactInfo.userType` | **`professional`** \| **`private`**. |
| `contactMethod` | string | `contactInfo.contactMethod` | **`all`** \| **`email`** (phone gated). |
| `agencyLogo` | string (URL) | `contactInfo.agencyLogo` | Agency logo image. |
| `showAddr` | boolean | `showAddress` | Whether exact address is shown on Idealista. |

### 4.3 Listing highlights & marketing

| Key | Type | Source | Values / notes |
| --- | --- | --- | --- |
| `highlight` | string | `highlight.groupDescription` | Promotional group text when present. |
| `labels` | string[] | `labels[].text` | e.g. **`En rentabilidad`**, **`Rentabilidad 4,6%`**. |
| `ribbons` | string[] | `ribbons[].text` | Banner ribbons (none in current sample). |
| `notes` | string[] | `notes[].text` | Extra notes (none in current sample). |
| `newDev` | boolean | `newDevelopment` | New development project. |
| `newProp` | boolean | `newProperty` | Marked as new listing. |
| `prefHighlight` | boolean | `preferenceHighlight` | Idealista preference highlight. |
| `topHighlight` | boolean | `topHighlight` | Top ad placement. |
| `topPlus` | boolean | `topPlus` | Top+ placement. |
| `visualHighlight` | boolean | `visualHighlight` | Visual highlight pack. |
| `urgentHighlight` | boolean | `urgentVisualHighlight` | Urgent visual highlight. |
| `favourite` | boolean | `favourite` | Saved by scraper session (card flag). |
| `savedAd` | boolean | `savedAd` | Saved ad flag when true. |

### 4.4 Media flags

| Key | Type | Source |
| --- | --- | --- |
| `has360` | boolean | `has360` |
| `has3d` | boolean | `has3DTour` |
| `hasPlan` | boolean | `hasPlan` |
| `hasVideo` | boolean | `hasVideo` |
| `hasStaging` | boolean | `hasStaging` |

### 4.5 Price changes

| Key | Type | Source |
| --- | --- | --- |
| `priceDropPct` | number | `priceDropPercentage` |
| `priceDropVal` | number | `priceDropValue` |
| `dropDate` | string | `dropDate` | When price was reduced. |
| `modified` | string | `_details.modificationDate.text` or `dropDate` | Human text, e.g. `"Listing updated 1 hour ago"`. |

### 4.6 `basics` — characteristic bullets (needs `fetchDetails`)

| Key | Type | Description |
| --- | --- | --- |
| `basics` | string[] | Ordered human-readable lines for UI “characteristics”, deduplicated. |

**Sources merged into `basics`:**

1. `_details.translatedTexts.characteristicsDescriptions[]` — section titles + `detailFeatures[].phrase`
2. `_details.energyCertification` — title, summary text, consumption/emissions lines
3. `_details.featureGroups` / `featuresGrouped` — grouped items
4. `_details.moreCharacteristics` — labeled key/value pairs (see §5)
5. `_details.allows*` booleans — e.g. remote visit, counter offers
6. `_details.propertyComment` — Spanish (or default) long comment from detail page
7. `_details.modificationDate.text`
8. `_details.ubication` — admin area titles and location name

**Example lines (from sample):**

- `125 m² constructed, 110 m² useable`
- `Second hand/good condition`
- `Ground floor`
- `Property price: € 249,000`
- `Energy performance certificate` / consumption lines

### 4.7 `stats` — engagement (needs `fetchStats`)

| Key | Type | Shape | Example |
| --- | --- | --- | --- |
| `stats.views` | object | `{ value: number, text: string }` | `{ "value": 0, "text": "0 views" }` |
| `stats.contactMails` | object \| omitted | same | `{ "value": 3, "text": "3 contacts" }` or `null` in raw → omitted |
| `stats.sentToFriend` | object | same | `{ "value": 0, "text": "0 times sent to friends" }` |
| `stats.favorites` | object | same | `{ "value": 0, "text": "saved as favourite 0 times" }` |

UI parses counts from `text` for tags: views, contacts, shared, favorited.

### 4.8 `idealista` — flat field map (needs `fetchDetails` for most keys)

All values are **strings** (booleans → `"Yes"` / `"No"`, numbers → decimal text). Keys are stable paths for export/debug and extra spec rows in the UI.

#### Identity & listing state

| Key | Example values |
| --- | --- |
| `adid` | Listing numeric id |
| `country` | `es` |
| `operation` | `sale` |
| `propertyType` | `premise` |
| `extendedPropertyType` | `premise` |
| `state` | `active` (detail page lifecycle) |
| `price` | `249000` |
| `detailWebLink` | URL with tracking params |
| `propertyComment` | Long description snippet from detail API |
| `showSuggestedPrice` | `Yes` / `No` |
| `suggestedTexts.title` | English/Spanish marketing title |

#### Card-level mirrors (`card.*`)

| Key | Example |
| --- | --- |
| `card.country` | `es` |
| `card.operation` | `sale` |
| `card.propertyType` | `premise` |
| `card.status` | `good`, `renew` |
| `card.showAddress` | `Yes` / `No` |
| `card.favourite` | `Yes` / `No` |
| `card.savedAd` | object or `No` |
| `card.newDevelopmentHighlight` | `Yes` / `No` |
| `card.topNewDevelopment` | `Yes` / `No` |

#### `detailedType.*`

| Key | Example |
| --- | --- |
| `detailedType.typology` | `premise` |
| `detailedType.subTypology` | `commercialProperty`, `industrialPremise` |
| `detailedType.transfer` | `Yes` / `No` |

#### `features.*`

| Key | Example |
| --- | --- |
| `features.hasAirConditioning` | `Yes` / `No` |

#### Platform permissions (`allows*`)

| Key | Meaning |
| --- | --- |
| `allowsAiAssistant` | AI assistant on listing |
| `allowsCounterOffers` | Counter-offers allowed |
| `allowsMortgageSimulator` | Mortgage simulator |
| `allowsProfileQualification` | Profile qualification flow |
| `allowsRecommendation` | Recommendations |
| `allowsRemoteVisit` | Remote visit |

#### Energy (`energyCertification.*`)

| Key | Example |
| --- | --- |
| `energyCertification.title` | `Energy performance certificate` |
| `energyCertification.energyConsumption` | `Consumption: …` (prefix + class) |
| `energyCertification.emissions` | Emissions line when present |

**Certificate class** (`moreCharacteristics.Energy certificate class` / `energyCertificationType`): observed **`b`**, **`c`**, **`d`**, **`e`**, **`f`**, **`g`**, **`exempt`**.

#### `moreCharacteristics.*` (labeled in ETL)

| Idealista key | Export label | Type / examples |
| --- | --- | --- |
| `agencyIsABank` | Agency is a bank | boolean |
| `alarm` | Alarm | boolean |
| `archive` | Storeroom / archive | boolean |
| `bathNumber` | Bathrooms (detail) | integer |
| `buildingType` | Building type | e.g. `premises` |
| `communityCosts` | Community costs (€/month) | number |
| `constructedArea` | Constructed area (m²) | integer |
| `corner` | Corner unit | boolean |
| `energyCertificationType` | Energy certificate class | letter or `exempt` |
| `energyPerformance` | Energy performance (kWh/m² year) | number |
| `fullEquipKitchen` | Fully equipped kitchen | boolean |
| `isAuction` | Auction listing | boolean |
| `localFloorsNumber` | Floors in unit | integer |
| `location` | Location type | string or null |
| `modificationDate` | Last modified (timestamp) | epoch ms |
| `roomDistribution` | Room distribution | e.g. `unknown` |
| `roomDistributionNumber` | Rooms / divisions | integer |
| `securityCamera` | Security camera | boolean |
| `shopWindowsNumber` | Shop windows | integer |
| `smokeExtractor` | Smoke extractor | boolean |
| `status` | Condition (detail) | e.g. `good` |
| `steelDoor` | Security door | boolean |
| `handicapedBaths` | *(raw key)* | seen in data; labeled as key name if no mapping |
| `usableArea` | usableArea | usable m² |

#### Translated characteristic phrases (`characteristics.<Section>.<n>`)

Section titles observed: **`Basic features`**, **`Building`**, **`Equipment`**, **`Price`**.

Each value is one phrase, e.g.:

- `125 m² constructed, 110 m² useable`
- `Layout 2 rooms`
- `2 show windows`
- `Commercial activity: Bar, pub`
- `Facade length: 12 m.`
- `150 € in community costs`

Index `n` is 1-based per section; count varies per listing.

#### Multilingual comments (`comments.<lang>`)

Languages seen: **`es`**, **`en`**, **`ca`**, **`de`**, **`fr`**, **`ru`**, **`zh`**, **`ro`**.

Also `comments` may stringify the full comments array when exported as a single blob.

#### Location (`ubication.*`)

| Key | Example |
| --- | --- |
| `ubication.title` | Street address title |
| `ubication.locationName` | `Subdistrict Valdeacederas, Madrid` |
| `ubication.administrativeAreaLevel1` | `Madrid capital, Madrid` |
| `ubication.administrativeAreaLevel1Id` | `0-EU-ES-28` |
| `ubication.administrativeAreaLevel2` | `Madrid` |
| `ubication.administrativeAreaLevel3` | `District Tetuán` |
| `ubication.administrativeAreaLevel4` | `Subdistrict Valdeacederas` |
| `ubication.latitude` / `longitude` | Coordinates (detail page) |
| `ubication.locationId` | Hierarchy id |
| `ubication.hasHiddenAddress` | `Yes` / `No` |

#### Other detail-only keys

| Key | Notes |
| --- | --- |
| `has360VHS` | 360° virtual tour flag on detail page |
| `labels` | Detail-page labels (stringified list) |
| `modificationDate.text` / `modificationDate.value` | Human text + epoch ms |

**Skipped inside flatten (not in `idealista` map):** `_details.multimedia`, `tracking`, `priceInfo`, `contactInfo` (contact is copied to `x` top-level instead), raw `translatedTexts` tree (phrases are exploded into `characteristics.*`).

---

## 5. Raw Apify item: top-level keys

Present on search-result rows (with or without `_details` / `_stats`).

| Key | In GeoJSON? | Purpose |
| --- | --- | --- |
| `propertyCode` | `id`, `x.propCode` | Primary key |
| `url` | `u` | Listing link |
| `price`, `priceByArea`, `size` | `p`, `pm2`, `sz` | Economics |
| `latitude`, `longitude` | geometry | Map pin |
| `address`, `district`, `neighborhood`, `municipality`, `province` | `a`, `d`, `n`, `m`, `pr` | Geography labels |
| `operation`, `propertyType`, `status` | `op`, `x.status`, etc. | Classification |
| `description` | `x.desc` | Narrative text |
| `thumbnail`, `multimedia` | `x.thumb`, `x.imgs` | Images |
| `numPhotos`, `floor`, `bathrooms` | `x.photos`, `x.floor`, `x.bath` | Quick facts |
| `detailedType`, `features`, `ubicationInfo` | `x.typology`, `x.ac`, `x.ubic` | Typology & features |
| `contactInfo` | `x.agency`, `x.phone`, … | Agency block |
| `priceInfo` | `x.currency` | Currency suffix |
| `suggestedTexts` | `t` | Title |
| `externalReference` | `x.ref` | Agency ref |
| `locationId` | `x.locId` | Idealista geo id |
| `showAddress` | `x.showAddr` | Privacy flag |
| `highlight`, `labels`, `ribbons`, `notes` | `x.highlight`, `x.labels`, … | Marketing |
| `newDevelopment`, `newProperty`, highlight flags | various `x.*` booleans | Placement |
| `has360`, `has3DTour`, `hasPlan`, `hasVideo`, `hasStaging` | media booleans | Media |
| `priceDropPercentage`, `priceDropValue`, `dropDate` | `x.priceDrop*` | Price history |
| `favourite`, `savedAd` | optional `x` flags | User/session flags |
| `country` | raw only | `es` |
| **`_details`** | drives `full`, `basics`, `idealista` | Detail page payload |
| **`_stats`** | `x.stats` | Engagement metrics |

---

## 6. `_details` object (detail page JSON)

Root keys observed in Madrid premises sample:

| Key | Exported to `x` / `idealista`? | Content |
| --- | --- | --- |
| `adid` | yes | Listing id |
| `allows*` (7 flags) | yes | Contact / UX permissions |
| `comments` | `comments.<lang>` | Translations of description |
| `contactInfo` | partial via `x` | Richer than card: postal address, corporate phrase, chat flags, microsite |
| `country`, `operation`, `propertyType`, `price` | yes | Core fields |
| `detailWebLink` | yes | Share URL |
| `detailedType` | yes | Typology |
| `energyCertification` | yes + `basics` | Certificate block |
| `extendedPropertyType` | yes | Type string |
| `has360VHS` | yes | Tour flag |
| `labels` | yes | Detail labels |
| `modificationDate` | yes + `x.modified` | Last update |
| `moreCharacteristics` | yes + `basics` | Structured numeric/boolean facts |
| `multimedia` | images → `x.imgs` | Often more photos than card |
| `priceInfo` | skipped in flat map | Amount + currency |
| `propertyComment` | yes + `basics` | Main comment |
| `showSuggestedPrice` | yes | UI flag |
| `state` | yes | e.g. `active` |
| `suggestedTexts` | yes | Title |
| `tracking` | **not exported** | Commercial tracking ids |
| `translatedTexts` | → `characteristics.*` + `basics` | Sectioned bullets, floor description |
| `ubication` | yes | Admin hierarchy + coords |

**`contactInfo` on detail page (raw, not all copied to `x`):**

- `address.locationName`, `postalCode`, `streetName`, `streetNumber`
- `chatEnabled`, `needLoginForContact`, `needLoginForPhone`
- `corporatePhrase.text` (+ `autoTranslated`)
- `micrositeShortName`, `inVirtualMicrosite`, `professional`, `totalAds`, `sharedSeekerProfile`
- `phone1`: `formattedPhone`, `formattedPhoneWithPrefix`, `prefix`, `phoneNumber`, `phoneNumberForMobileDialing`, `nationalNumber`

---

## 7. Enumerations & formats

### 7.1 Operations & types (our data)

| Field | Values seen |
| --- | --- |
| `operation` | `sale` |
| `propertyType` | `premise` |
| `detailedType.typology` | `premise` |
| `detailedType.subTypology` | `commercialProperty`, `industrialPremise` |
| `country` | `es` |

### 7.2 Condition & floor

| Field | Values seen |
| --- | --- |
| `status` (card) | `good`, `renew` |
| `moreCharacteristics.status` | `good` |
| `floor` | `bj` (bajo / ground), `st`, `1`, `3` |

### 7.3 Image `tag` values (Idealista)

`atmosphere`, `bathroom`, `bedroom`, `cellar`, `corridor`, `details`, `energyCertification`, `facade`, `hall`, `kitchen`, `lifts`, `livingRoom`, `loft`, `office`, `parkingSpace`, `patio`, `plan`, `porch`, `reception`, `room`, `staircase`, `storageSpace`, `surroundings`, `swimmingPool`, `terrace`, `unknown`, `views`

### 7.4 Booleans

Throughout raw JSON and `idealista` export: JSON `true`/`false` → display **`Yes`** / **`No`** in `idealista` strings; `x` keeps real booleans for flags like `ac`, `hasVideo`.

---

## 8. Not stored in GeoJSON (raw only)

These remain in `data/raw/*.json` but are **not** copied into `listings.geojson` today:

- Full `_details.contactInfo` address and corporate fields (only subset in `x`)
- `_details.tracking`
- `_details.multimedia.videos`
- Full `priceInfo` object beyond currency
- `suggestedTexts` beyond title
- `newDevelopmentHighlight`, `topNewDevelopment` (only in `idealista.card.*` when detail fetched)
- Duplicate coordinates inside `_details.ubication` (map uses top-level `latitude`/`longitude`)

Re-import after changing ETL if you need new fields in `x`.

---

## 9. Computed in the UI (not from Idealista)

These are **not** fields on the GeoJSON feature; they are calculated when you open a lead or move the map.

| Concept | Source |
| --- | --- |
| **Neighborhood fit score** | `areas.geojson` + selected business profile (bakery, café, …) |
| **Proximity / walk fit** | `/api/walk` isochrone + premises/places layers |
| **Overall fit** | Blend of neighborhood + walk scores |
| **Property ranking order** | Viewport or all listings, sorted by fit; never empty list by design |
| **Nearby competitors** | Google Places / internal places layer near the pin |
| **Engagement tag numbers** | Parsed from `x.stats.*.text` |

---

## 10. Maintenance

| Task | Command |
| --- | --- |
| Import raw → GeoJSON | `python etl/import_idealista_listings.py` |
| Single raw file | `$env:IDEALISTA_RAW="data/raw/mad_idealista_premises_sale_sample10.json"; python etl/import_idealista_listings.py` |
| Merge rule | All `data/raw/mad_idealista_premises_sale*.json`, dedupe by `propertyCode`, **richest** row wins (`_details` > `_stats` > description) |

**Related files:**

- ETL: `etl/import_idealista_listings.py`
- Output: `data/build/listings.geojson.gz (split by etl/build_web_data.py into web/data/l-*.json + d/{id}.json)`
- Sample scrape manifest: `data/raw/mad_idealista_premises_sale_sample10.README.md`
- UI consumption: `web/app.js` (`listing_detail`, `listingSpecSections`, `listingEngagementTagsHtml`)

---

*Generated for PropertyScanner. Update this doc when adding ETL fields or new scrape toggles.*
