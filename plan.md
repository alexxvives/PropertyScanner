# Property Scanner — plan

A map for a market-expansion director who needs a commercial premises for a new shop (a bakery is the example). The director draws a city, sets what the business needs, and gets areas and buildings worth visiting — with a broker or a listing feed supplying the actual rent later.

This document is a technical opinion, not a pitch. The full wishlist cannot be built from free APIs. A sharp, honest version of it can.

---

## Opinion

**Build it in Spain, in one city, starting with Madrid.**

Spain is the better place for *this* product. The thing on the map is a building: floor area, shape, street frontage, and whether the ground floor is commercial. Spain’s national cadastre (Dirección General del Catastro) publishes that for almost the whole country, continuously updated, at no charge, under a license that allows a transformed commercial product. The United States has no equivalent. US parcel and building data is county by county, and a usable national layer means a paid vendor.

The United States is better at the *people* layer. The Census Bureau’s American Community Survey, plus workplace data (LODES), is the best free demographic system in the world, and state highway departments publish vehicle counts on major roads. That matters, and it is why a later US version is attractive. It does not make the first version easier, because the director still has to point at a premises, and the premises are the hard object in the US.

**Feasibility, said plainly:**

| Ambition | Chance it works |
| --- | --- |
| A Madrid map that scores neighborhoods and buildings for a bakery: income, age, density, competitors, transit, a 5/10/15-minute walk, size, corner, street frontage | High. This is a real product. A developer who can handle GIS can put a useful version in front of someone in about 8–12 weeks. |
| The same thing for all of Spain | Medium. The data model travels. Coverage, licensing, and city-by-city zoning do not. |
| Live “for sale / for lease” inventory with a true €/m² | Low without a paid feed (Idealista/data or a broker). Do not plan on scraping portals. |
| Grease traps, electrical capacity, ventilation, and “how easy is the doorstep” as automatic filters | Effectively zero from public data. Those are site-visit fields. |
| The entire wishlist, both countries, on day one | This is a data company, not an app. Incumbents already sell pieces of it (Geoblink in Spain and southern Europe; SiteZeus, Buxton, Placer.ai, Esri in the US). |

The right v1 is **where to look**, plus **which buildings are physically plausible**. It is not **which unit is vacant, permitted, and wired for a bakery**.

---

## What the director is actually deciding

A bakery (or any new shop) is choosing a trade area and then a box inside it. Those are two different questions, and only the first is well served by open data.

1. **Trade area.** Who can reach this corner in 10 minutes on foot? Are they the customers? Is the street already full of bakeries, or empty because nobody walks there? Is there a supermarket, a metro mouth, or an office cluster that delivers footfall the census will never show?
2. **Premises.** Is there a ground-floor commercial unit of the right size, on the right street, with a real frontage? What is the asking rent? Can a food use go there, and can the building take the kitchen?

Open data answers most of question 1 and the geometry half of question 2. Question 2’s money and mechanical half comes from a listing, a landlord, or a visit.

So the product has three layers. Ship them in this order:

1. **Area score** — census sections colored by how well the people and the access match the concept.
2. **Building shortlist** — cadastre buildings that are commercial, large enough, and on a street that behaves like retail.
3. **Listing and site file** — price, photos, and a checklist for the things no API knows (power, grease trap, permit, delivery). Empty until a human or a partner fills it.

A director can use layer 1 and 2 before a single listing exists. That is the wedge. Geoblink and the US suites sell the full stack to chains for a lot of money. A narrower tool — one concept, one city, fast, with the reasoning visible — is still worth building. Copying their whole catalog is not.

---

## Spain or the United States

### Why Spain wins the first build

- **Buildings are a dataset.** Catastro INSPIRE services cover buildings and building parts for Spain except the Basque Country and Navarre (those two have their own foral cadastres). You get footprint, area, year, floors, and a use classification that includes commercial and hospitality. Madrid, Barcelona, Valencia, Seville, Málaga, and Zaragoza are all inside this system.
- **Income exists at the right grain.** INE’s *Atlas de distribución de renta de los hogares* publishes mean net income per person and per household at census-section level (a section is roughly a few blocks, on the order of 1,000–2,500 people). Age and household structure come from the 2021 census at the same geography. The padrón gives annual population so a growth rate is computable.
- **The unit is the square meter.** The user’s filters are already in Spanish retail language. No translation layer.
- **Transit in a big city is public.** Madrid’s CRTM publishes GTFS for metro, cercanías, and buses. Stops become a proximity filter with no vendor.
- **One legal regime.** Zoning is still municipal — that pain exists in both countries — but you are not also reconciling 3,000 county assessors.

Cadastre license constraint, which shapes the product: the Directorate allows commercial use of *transformed* data and does not allow redistributing the original files. Attribute the source. Do not offer a “download the cadastre” button. A scored map with your own geometry processing is the kind of transformation they describe. Read the current license before launch and keep the attribution in the UI.

### Why the US is the better second country

- ACS 5-year estimates at block group: income, age, household type, tenure, vehicles. Free API.
- LODES: where people *work*, not only where they sleep. For a bakery this is often the more important number, and Spain does not publish an equivalent at block level.
- State DOT annual average daily traffic on arterials. Real vehicle counts, major roads only.
- Bigger budgets. US site-selection software is an established line item.

### Why the US is the worse first country

- The building is missing. Microsoft / Overture footprints are machine-extracted shapes without a legal area or a use code. Official parcels are a paid aggregation problem (Regrid, ATTOM, Placestack, and similar).
- Commercial listings are CoStar’s market. CoStar is an enterprise contract, not an API key you paste into `.env`.
- Zoning is a few thousand ordinances. A GIS layer with a zone name is common in larger cities. “Bakery is a permitted use” is not a column in that layer.
- Pedestrian counts are a paid mobility product (StreetLight and others), same as in Spain.

**Rule:** if the demo has to show a building you could actually lease, start in Madrid. If the demo only has to show “rich, dense, young census tracts near transit,” the US is slightly easier and less useful to the person who asked.

### City choice inside Spain

Start with **Madrid**, not “Spain.”

- Cadastre coverage is national and the city is large enough to stress-test tiles and filters.
- Open data from the Ayuntamiento (traffic on main roads, some urban planning layers) is better than a small city’s.
- CRTM transit is one feed.
- A director can feel whether the tool is right, because the streets are familiar.

Barcelona is the second city, not the first. The cadastre still covers it, but planning data and language sit in a separate municipal system. Add it after Madrid’s pipeline is boring.

Leave the Basque Country and Navarre out of v1. They are outside the national cadastre.

---

## Feature by feature

Grades mean: **Ship** (open data, good enough to filter on), **Approximate** (a proxy you must label as a proxy), **Manual** (store it on the site file; do not pretend an API has it), **Buy later** (real, but only with a vendor).

| Filter | Grade | What you actually use |
| --- | --- | --- |
| Average household income | Ship | INE renta neta media por hogar, census section. It lags by about two years. Label the vintage on the map. |
| Disposable income | Approximate | The same INE net-income figures are the honest stand-in. A true “money left after rent and food” model is a research project. |
| Population density | Ship | Padrón or census population ÷ section area. |
| Population growth | Ship | Two padrón vintages at section or district. Small sections jump around; smooth with the district or show a range. |
| Age distribution | Ship | Census 2021 by section. Fine for “families” vs “under 35.” Stale between censuses. |
| Household types | Ship | Census household size and composition. |
| Pedestrian counts | Buy later | No national feed. A handful of city sensors are not a filter. Proxy: transit exits + retail POIs + street level, and say so. |
| Vehicle counts | Approximate | Madrid publishes counts on the main network. Side streets will be empty. Do not interpolate a number you do not have. |
| Isochrone 5/10/15 min walk or drive | Ship | OpenRouteService or a self-hosted Valhalla. Cache every result. This is a core feature, not a decoration. |
| Catchment population inside the isochrone | Ship | Intersect the polygon with census sections (area-weighted). This is more honest than “the tract the pin sits in.” |
| Transit proximity | Ship | GTFS stops. Distance to metro is a different filter from distance to any bus. |
| Competitor density | Approximate | Google Places for bakeries and cafés, OSM as a free but incomplete base. Count inside the isochrone, not a raw radius. Ratings help; a pin count alone misleads. |
| Complementary anchors | Ship | OSM or Places: supermarkets, metro mouths, schools, offices, gyms, malls. For a bakery, a supermarket and a metro entrance are worth more than another café. |
| Price per m² | Buy later / Manual | No open national commercial rent or sale tape. Idealista/data sells comparables and metrics through a commercial API (contact, not a public key). Until then, the user types a budget and the tool filters on size and area quality. |
| Size (m²) | Ship | Cadastre building-part area. It is the building or the premises as registered, which can differ from the lettable floor a broker quotes. Show it as cadastral area. |
| Layout | Manual | Cadastre will not give you column grid, ceiling height, or a rectangle vs a broken L. Floorplate *shape* (compactness of the polygon) is a weak proxy you can compute. |
| Zoning compliance | Approximate | Show the planning zone and a link to the ordinance. A badge that says “bakery: allowed” is a legal claim you cannot support from a shapefile. Food use is often a license, a community statute, and a terrace permit on top of the zone. |
| Grease trap, electrical load, ventilation | Manual | Absent from cadastre, INE, OSM, and listing portals in any reliable way. Checklist on the shortlisted address. |
| Corner / two-street frontage | Approximate | Geometry: the building touches two street segments above a minimum length, with a real angle between them. Works well in a regular grid, worse in historic centers. Spot-check 30 buildings before trusting it. |
| Street frontage and “step off the sidewalk” | Approximate | Length of facade along a pedestrian street, and distance from the facade to the sidewalk. A zero setback is a hint of direct entry. It does not know about a step, a locked lobby, or a ramp. |
| Ingress for a delivery van | Manual | Curb geometry and loading bays are incomplete. At most, flag buildings on a pedestrianized street with no service lane as “delivery: check.” |
| Daytime vs nighttime demand | Approximate | Spain lacks US LODES. Proxy it: office POI density and hotel density inside the isochrone, plus land use. Label it as a proxy. In the US this one upgrades to Ship. |
| Your own existing shops | Ship | The director drops pins. The map warns on catchment overlap. Cheap, and chains care about it. |
| Street hierarchy | Ship | OSM road class. A bakery on a residential lane and a bakery on a primary street are different businesses. |
| Tourism pressure | Approximate | Hotel and short-stay density. Useful in the center, irrelevant in a neighborhood high street. |

Anything else worth adding later, only after the table above is solid: noise and terrace potential (street width and pedestrianization), slope for accessibility, cannibalization against the user’s own stores, and a simple weekday/weekend split based on office vs leisure mix. None of those require a new vendor.

---

## The product to ship

One persona: **someone opening a food shop in Madrid.** Not offices, not warehouses, not “any commercial property in the Western world.”

### What the screen is

A full-bleed map. A left rail with a short concept (“bakery”) that loads a preset, then a few controls the director will actually move:

- Walk time: 5 / 10 / 15 minutes (drive as a second mode, not the default — a neighborhood bakery is a walk catchment).
- Minimum cadastral m² and maximum m².
- Income floor, age emphasis, density floor.
- Competitors: flag if there are more than N bakeries inside the walk.
- Must be within X meters of a metro, or of a supermarket. Optional.
- Corner only. Optional.
- Weights: a simple 1–5 on footfall proxies, income, competition, transit. The preset for a bakery ships with sensible weights so the tool is useful before anyone touches them.

Clicking the map drops a point, draws the isochrone, and fills a score card: people inside the walk, income, age mix, competitor list, nearest metro, nearest supermarket. The buildings inside the polygon that match size and use light up. Everything else dims.

A building click opens a panel: cadastral area, use, year, floors, frontage length, corner yes/no, zone name, distance to metro, and an empty **site file** with checkboxes for rent €/m², grease trap, power, ventilation, delivery, and “visited on.” Export the shortlist to CSV for the broker.

That is the whole v1. It is already more useful than fifteen filters that return “unknown.”

### What v1 refuses to show

- A green check that means “legal to open a bakery.”
- A pedestrian count.
- A rent, unless the user or a licensed feed typed it.
- A ranking presented as precision. Scores are relative inside the city, with the data year printed on them.

---

## Data for a Madrid v1

Pull these once, store them, refresh on a schedule. Do not call five public APIs every time the user pans the map.

| Layer | Source | Refresh | Notes |
| --- | --- | --- | --- |
| Census section polygons | INE cartography | When INE republishes | Join key for every demographic |
| Income | INE Atlas de renta | Annual, lagged | Per person and per household |
| Population, age, households | INE census + padrón | Census is 2021; padrón yearly | Growth from padrón |
| Buildings | Catastro INSPIRE WFS or ATOM (buildings and building parts) | Monthly is enough | Filter to commercial / hospitality uses; keep area and geometry |
| Streets and sidewalks | IGN CartoCiudad and/or OSM | Quarterly | Frontage and corner tests |
| POIs | OSM via Geofabrik or Overpass, optional Google Places | Monthly, Places on demand | Competitors and anchors |
| Transit stops | CRTM GTFS | When the feed updates | Separate metro from bus |
| Isochrones | OpenRouteService, cache in PostGIS | On demand, then cached | Self-host Valhalla if the free tier becomes the bottleneck |
| Vehicle counts | Ayuntamiento de Madrid traffic open data | As published | Join to road segments; leave gaps as gaps |
| Planning zone | Ayuntamiento urban-planning WFS/WMS where available | Quarterly | Display only |

Google Places is the one paid key worth having early, because OSM business listings in Spain are patchy. Cache counts and categories inside your database; respect the Places terms on how long you may store their content. OSM remains the fallback and the anchor layer.

Idealista/data is the listing conversation to have *after* a director says the map is right. It is a sales integration (comparables, valuations, metrics), not a signup form. Until that exists, price is a column in the site file.

---

## Architecture

Keep it boring. The hard part is the data pipeline, not the framework.

```
ETL (Python, scheduled)
  INE, Catastro, OSM, GTFS, city traffic
        │
        ▼
PostGIS
  sections, buildings, pois, stops, roads, isochrone cache, site files
        │
        ├── vector tiles (census choropleth, buildings) → PMTiles or Martin
        └── small JSON API
                │
                ▼
        MapLibre GL in the browser
```

- **Database:** PostgreSQL with PostGIS. Neon is a reasonable host if you want managed Postgres; a single city fits easily.
- **API:** a small Python service (FastAPI) next to the ETL, or Next.js if you would rather have one TypeScript app. The API does four things: score a point, return buildings in a polygon, save a site file, export CSV.
- **Map:** MapLibre. Open styles (OpenFreeMap, MapTiler, or a self-hosted OpenMapTiles style). Do not build on a Google Maps base if the product is a GIS tool; you will fight the tile model.
- **Tiles:** census sections and buildings are too heavy to ship as GeoJSON for the whole city. Prebuild vector tiles. The isochrone and the highlighted shortlist can be live GeoJSON; they are small.
- **Isochrones:** one provider, results cached by a rounded coordinate plus profile plus minutes. A bakery search repeats the same corners.
- **Scoring:** in SQL or in the API, not in the browser. The browser only draws.

Suggested repo shape when you start building:

```
etl/            # one script per source, idempotent loads
db/migrations/  # PostGIS schema
api/            # score, buildings, site file, export
web/            # MapLibre app
```

No microservices. No account system in v1 beyond a single shared login if the map is not meant to be public. The first user is one director.

### Score

Make the score additive and visible, or directors will not trust it.

For a point, after the isochrone is drawn:

- People inside the walk (area-weighted sections).
- Share of the target age band.
- Median or mean household income versus the user’s floor.
- Competitor count (a penalty past a threshold, not “fewer is always better” — zero bakeries can mean zero demand).
- Anchor bonus: metro within the chosen distance, supermarket within the chosen distance.
- Street class of the nearest frontage.

Each term is 0–100, multiplied by the user’s weight, then summed. The building list is a hard filter (use, m², optional corner), not part of the area score. Mixing “good neighborhood” and “big enough box” into one magic number hides why a site failed.

Show the breakdown on the card. A 74 with “weak transit, strong income, two competitors” is a decision. A 74 alone is a toy.

### Corner and frontage test

Worth specifying, because it sounds like magic and it is just geometry:

1. Take the building polygon.
2. Find street segments within a few meters of the facade.
3. Frontage length = length of the polygon boundary that runs along a street.
4. Corner = two frontages on different streets, each above a minimum length (start at 8 meters), with an angle between the streets that is not almost straight.
5. Direct entry proxy = facade-to-sidewalk distance under about 2 meters.

Calibrate thresholds by looking at 30 known good and bad bakery corners in Madrid before exposing the filter. Then leave the thresholds in config.

---

## Order of work

### Phase 0 — prove the data (1–2 weeks)

No UI polish. Load Madrid census sections, income, and cadastre buildings into PostGIS. Answer, in SQL, “commercial buildings between 80 and 200 m² inside this neighborhood, with the section’s household income.” If that query is painful, fix the model before writing React.

Spot-check cadastre use codes against streets you know. If “commercial” is too dirty, the building layer needs a rule, not a hope.

### Phase 1 — the map a director can use (about 6–8 weeks after phase 0)

- Map, section choropleth, building highlights.
- Click for isochrone, catchment stats, competitor and anchor lists.
- Hard filters: m², use, metro distance, corner.
- Weights and a bakery preset.
- Site file and CSV export.
- Data vintage printed in the corner of the map.

This is the version to put in front of a real expansion director. Watch which filters they ignore.

### Phase 2 — only what phase 1 proved missing

Likely, in this order: Google Places so competitors are complete; planning-zone overlay; traffic on arterials; a second concept preset (a clinic and a bakery do not share weights). Listings only if someone will pay for Idealista/data or a broker will send a spreadsheet you can join on address.

### Phase 3 — second geography

Barcelona, with its own planning source, or a US metro if a customer is there. A US metro means a paid parcel vendor before any building filter exists. Budget that as a data cost, not as a weekend ETL.

---

## Risks

**The building use code will disappoint you.** Cadastre knows that a building contains commercial floor area. It often does not know that the specific vacant shop you want is on the market, or that the registered 140 m² is a 90 m² sales floor plus a basement. The UI has to say “cadastral commercial area,” and the site file has to hold the broker’s number beside it.

**Competition data will be wrong in OSM alone.** Ship Places or accept that the competitor filter is directional, not a count a lawyer would sign.

**Zoning language will tempt you to overclaim.** “Zone shown: tertiary. Confirm use with the ayuntamiento” is the whole feature.

**Scores will be trusted too much.** Print sources and years. Keep the formula on the card. Never show false precision (€ income to the cent, pedestrians to the person).

**Portal scraping is a dead end.** Idealista’s terms do not give you a listing database, and a product for a director cannot depend on a scraper that breaks on a Tuesday. Either license data or accept user-entered rents.

**Cadastre redistribution.** Transform and attribute. Do not republish the raw download.

**Isochrone cost and correctness.** Walk time that ignores pedestrian streets and crossings will look stupid in the center of Madrid. Check a few known walks (Sol to a specific street) against the polygon before demoing. If the hosted API is wrong, self-host the router; do not “fix” it in the UI.

**Privacy.** Census sections and POIs are fine. Do not store landlord phone numbers from the open web. If site files later hold contact details, that is personal data under the GDPR and needs a reason, a retention limit, and a way to delete it.

**Liability.** The map is a screening tool. It is not a valuation, a permit, or a survey. Say that once in the product, in plain language.

---

## Effort

For one person who can write Python, SQL, and a web map:

- Phase 0: 1–2 weeks.
- Phase 1: 6–8 weeks.
- A second Spanish city: 2–4 weeks once Madrid’s ETL is stable, longer if planning data is the goal.
- A first US city with building-level filters: a vendor contract plus 4–6 weeks. Without that vendor, you only get the demographic half, which is the easier half and the one the director did not ask to rent.

For a team that has not used PostGIS before, double phase 0. The product is a spatial database with a map on top. The map is the easy part.

Money to reach phase 1, if you stay on open data: hosting, a map-tiles key, an OpenRouteService key, and a Google Places key. That is hundreds of euros a month at prototype volume, not a data-center plan. The first large invoice is a listing or mobility vendor, and it should wait until a user asks for the layer that vendor sells.

---

## Recommendation

1. **Madrid. Food retail. Area score + cadastral building shortlist + a manual site file.**
2. Treat income, density, age, households, isochrones, transit, anchors, size, and a calibrated corner test as the real filters.
3. Treat pedestrian counts, €/m², zoning “compliance,” grease traps, power, ventilation, and van ingress as labels you will not fake.
4. Use the United States when you want a second product aimed at daytime population and road traffic, and only after you are willing to pay for parcels.
5. Put the map in front of one expansion director at the end of phase 1 and let their ignored filters decide phase 2.

If phase 0 cannot produce a believable list of commercial buildings in one Madrid neighborhood, stop and fix the data before any more UI. That query is the product.

---

## UI pass — Composer, implement this section only

The sections above are product strategy. Do not build cadastre, income, or isochrones while doing this pass. Change only `web/index.html`, `web/styles.css`, and `web/app.js`, plus `etl/prepare.py` if a label bug requires a data rebuild.

Design constraints taken from the ui-ux-pro-max priority rules (accessibility first, then touch, then style):

- Body text at least 16px. Secondary text at least 13px. Contrast at least 4.5:1. Glass panels use a light surface (`rgba(255,252,247,0.88)` or stronger) plus a 1px border. Do not put grey text on a translucent grey panel.
- Click targets at least 44×44px, including ranking rows and chips.
- Icons are inline SVG with `aria-hidden="true"` and a text label next to them. No emoji.
- One map variable uses one color ramp, and the legend names that variable in words. Do not encode two variables with the same ramp.
- Motion: 150–200ms opacity/transform only. Honor `prefers-reduced-motion`.
- Keep the existing fonts (Fraunces for titles, Outfit for UI) and the paper/ink palette. This is a map tool, not a marketing page.

### Layout

The map stays full screen. Three floating overlays. Nothing is a full-height column.

1. **Top-left glass card**, about 360px wide. Eyebrow, title, business field, city field, crowd slider, and the layer switcher below. It does not contain the ranking.
2. **Right-side ranking**, `position: absolute; top: 14px; right: 14px; bottom: 14px; width: min(340px, calc(100vw - 28px))`. Glass, scroll inside the list only. Header: “Best places for {business}”. Eight rows. Each row is a button: rank, barrio name, city, one-line reason, and the score as the colored bar described below (the number sits at the end of the bar). The selected row uses a 2px ink outline. Clicking still calls `selectArea()`.
3. **Hover card** follows the cursor. **Pinned card** replaces it in the same visual style and docks under the ranking on the right when something is clicked (`pointer-events: auto`). The left card never shows the detail.

Below 760px: ranking becomes a bottom sheet, about 42vh, and the search card stays top-left at full width minus 20px.

### Score bar

Use this for the ranking row and for the pinned neighborhood card. It is a 0–100 gauge of `properties.score`, not the map color.

| Score | Fill |
|---|---|
| 0–39 | `#9b2335` |
| 40–54 | `#c2561a` |
| 55–69 | `#c9922a` |
| 70–84 | `#6a8f3a` |
| 85–100 | `#1f7a45` |

Track is `#e7dfd4`. The bar is `role="meter"` with `aria-valuemin="0"` `aria-valuemax="100"` and `aria-valuenow` set to the score. Print the integer next to it. Do not use this red-to-green scale as the neighborhood heatmap.

### Heatmap switcher

A segmented control in the left card, label “Color the map by”. One option selected at a time. Each option has its own sequential ramp (light = low, dark = high). Write the active variable name into `#legend`.

| Id | Label | Value on the area | Ramp, low to high |
|---|---|---|---|
| `fit` | Fit | `score` | current warm ramp `#f7f1e8` → `#8a3014` |
| `foot` | Busy streets | `open_per_km2` | blue `#e8f1f8` → `#0e3d5c` |
| `competitors` | This business | matches per km² | purple `#f3e8f5` → `#4a1942` |
| `room` | Empty premises | `vacant` per km² | teal `#e5f4f1` → `#0d4f48` |

`paintScores()` reads the selected id and builds the interpolate expression from that field. Areas outside the selected city stay `#ebe4da`. Changing the switch does not re-sort the ranking. The ranking always sorts by `score`.

### Pins and filters

Keep group colors on the circles, separate from the heatmap:

Bakery `#c2561a`, Café `#8a5a2b`, Restaurant `#a33b3b`, Grocery `#2f6f4e`, Pharmacy `#2c6e8a`, Hair salon `#8a4578`, Clothing `#3d4c8a`, Clinic `#3e7d74`, Gym `#5c4d8a`, Other `#8d8276`. Empty premises: 2px `#6e655c` stroke, fill transparent.

Chips under the switcher, each with a color dot and a count: Open matches (default on), Empty premises (off), Other open shops (off), Closed Madrid doors (off). `syncPins()` must not draw a pin the active chips exclude. Madrid status `C` stays off unless that chip is on. Only draw pins inside the current bounds.

### Cards: no mixed fallbacks

A shop card and a neighborhood card are different. Never put the business type where the city goes, and never put the city where the name goes.

**Shop card**

- Color strip from the group color.
- Title: the rótulo (`n`). If `n` is empty or exactly `Unnamed premises`, the title is the street address (`a`), and do not print “Unnamed premises” anywhere.
- Status pill: Open, Empty, or Closed. Closed copy is “Closed in the Madrid census”. Empty copy is “Empty, listed for rent or sale”.
- Row with a map-pin SVG: barrio, then a middle dot, then the city. Example: `Embajadores · Madrid`. Both come from the area feature (`name`, `city`), not from the business label.
- Activity line: the census activity (`e`). If it is empty, omit the line. Do not substitute “Bakery” or “Premises”.
- The business type is only the small kicker (“Bakery”), and only when the group code matched a concept. If the group is `other`, the kicker is “Open shop”.

**Neighborhood card**

- Title is the barrio name only.
- The pin row is district · city (`Centro · Madrid`).
- Score bar as specified above.
- Three lines: open premises per km², count of this business already open, empty or closed count. Use the words already in `fitLines`.

### Why so many cards say Embajadores

`mad-102` is the real Madrid barrio Embajadores (Centro): 3,045 premises, 2,268 open premises per km². The name is correct. It shows up constantly because the neighborhood polygon wins the hover whenever the cursor is not on a shop circle, and Embajadores is a large, dense polygon in the middle of the city. Fix the hover order: if a `places` feature is within 8px, show the shop card; only show the barrio card when the cursor is on the fill and not on a pin. The ranking may still list Embajadores when its score is high. That is expected. Do not rename it.

### Copy

Lede stays factual: shop data is Madrid and Barcelona only. Say that “Closed” is a Madrid census status and is hidden until its chip is on. Empty state in the pinned slot: “Hover a shop or a neighborhood.”

### Done when

- Ranking is a right-hand glass overlay and is not inside the left search card.
- The four heatmap modes recolor the polygons with four different ramps and the legend names the active one.
- A score of 30 is red, 50 orange, 60 gold, 75 yellow-green, 90 green, on both the list and the neighborhood card.
- Shop titles are rótulo or street address. The city line always includes a pin icon, the barrio, and Madrid or Barcelona. The kicker is the business type only.
- Zoomed into Embajadores, hovering a named shop shows that shop, not the barrio. Hovering empty street shows Embajadores.
