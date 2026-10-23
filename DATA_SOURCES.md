# Data sources

Open the map with Wrangler (static files plus `/api/walk` and `/api/nearby` when keys are in `.dev.vars`):

```
npx wrangler dev
```

Then open http://127.0.0.1:8787 — copy `OPENROUTESERVICE_API_KEY` and `GOOGLE_MAPS_API_KEY` from `config/secrets.env` into `.dev.vars`.

Or use the Python server only:

```
python server.py
```

Then open http://127.0.0.1:4175

Rebuild the files in `web/data` after the raw downloads are in `data/raw`:

```
pip install -r requirements.txt
python etl/prepare.py
```

## How much of Spain we can map

There is no free national register of shops. Two city councils publish one. Everywhere else, a neighborhood ranking would be invented.

| City | Premises with coordinates | Neighborhoods | Vintage | What “empty” means |
| --- | --- | --- | --- | --- |
| Madrid | 121,661 street doors | 131 barrios | 16 Oct 2026 | Census status “closed”. Not a listing for rent. |
| Barcelona | 64,737 ground-floor premises on a street | 73 barris | 2024 | The census itself says empty for rent, for sale, or both. |

Together that is 186,398 premises and 204 neighborhoods. Spain has on the order of 8,000 municipalities. Valencia, Seville, Zaragoza, Málaga, Bilbao and the rest are on the basemap and cannot be ranked until a premises file exists for them.

Neighborhood scores (income, residents, competitors per km², transit, cadastre floor area, and the rest) are only computed where `etl/prepare.py` has both a barrio polygon and the matching open-data tables. Today that is Madrid and Barcelona only. Idealista leads can be scraped for other cities later, but area fit and walk competitor counts still need a local premises census or an expensive substitute.

Census premises are not drawn as map pins anymore. They stay in the dataset for area scores, vacancy heatmaps, and 10-minute walk competitor counts. Idealista purple pins are the only property leads on the map.

Of those premises, the headings we can score directly: 4,060 bakeries, 6,513 cafés, 18,080 restaurants and bars, 4,199 groceries, 2,986 pharmacies, 11,295 hair and beauty, 5,542 clothing, 5,284 clinics, 1,294 gyms, plus 39,030 empty or closed premises. The other 88,115 are real shops whose heading did not fall into those groups; typing their activity still searches the name and the official heading.

## In the map (free)

| Layer | Source |
| --- | --- |
| Madrid premises and activities | Ayuntamiento de Madrid, [Censo de locales](https://datos.madrid.es/dataset/200085-0-censo-locales), CC BY 4.0 |
| Madrid barrios | Ayuntamiento de Madrid, límites administrativos |
| Barcelona premises | Ajuntament de Barcelona, [Cens de locals en planta baixa 2024](https://opendata-ajuntament.barcelona.cat/data/dataset/fe177673-0f83-42e7-b35a-ddea901be8bc), CC BY 4.0 |
| Barcelona barris | Ajuntament de Barcelona, unitats administratives |

## Free, now on the neighborhood

Joined in `etl/prepare.py` when these files are in `data/raw`. A neighborhood with no value stays uncolored for that variable.

| Figure | Madrid | Barcelona |
| --- | --- | --- |
| Residents, 1 Jan 2026 | Ayuntamiento, padrón por barrio | Padró municipal per secció, summed to the barri |
| Residents per km² | The same count divided by the neighborhood polygon | The same |
| Disposable income per person, 2023 | Panel de indicadores, renta media disponible por persona | Open Data BCN, mean of census-section estimates |
| Mean age and share aged 65 or over | Panel de indicadores, 2025 | Padró 2026 by single year of age. Counts under 5 are published as `..` and counted as 2 |
| Registered unemployed, February | Panel de indicadores. Madrid only | Not in these files |
| Mean cadastral value of homes | Panel de indicadores. Homes, not shops. Madrid only | Not in these files |

## Free, now also on the neighborhood

Joined by `enrich_place_context` in `etl/prepare.py` when the files below are in `data/raw`. A neighborhood with no value stays uncolored.

| Figure | What it is | Source |
| --- | --- | --- |
| Metro stations | One point per station. Barcelona counts a station once even when the file lists each entrance. | CRTM, Elementos de la Red de Metro. ICGC / TMB, accessos de metro, deduplicated by station code |
| Bus stops | Madrid counts each EMT stop pole. Barcelona counts each daytime bus stop. | CRTM, postes EMT. Open Data BCN, parades d’autobús |
| Gross floor area | Sum of official gross floor area, in m². The building centroid falls in the neighborhood. | Dirección General del Catastro, INSPIRE Buildings, municipalities 28900 and 08900, 21 Aug 2026 |
| Retail floor area | The same, only where current use is `4_2` (retail) | The same file |
| Traffic sensors | Measurement points. These sit on main roads and signalized junctions. Side streets with no sensor stay empty. Madrid only | Ayuntamiento de Madrid, ubicación de puntos de medida, April 2026 |
| Vehicles per hour | Sum of the latest open intensity reading at those sensors. It is a five-minute snapshot, not a typical day. Madrid only | Ayuntamiento de Madrid, tráfico en tiempo real |
| Weekday metro and bus departures | Departures on Wednesday 21 Oct 2026. Barcelona only. One funicular is counted with the buses | TMB GTFS, downloaded with the developer account id and key in `config/secrets.env` |
| Weekday south-corridor bus departures | Departures the same Wednesday, only where a stop falls inside Madrid. The key returns 27 routes from Legazpi toward Pinto, Valdemoro, Ciempozuelos, Getafe and Aranjuez. It does not include Metro de Madrid or EMT | CRTM file on the national access point, requested with `CRTM_API_KEY` |

The cadastre license allows this transformed neighborhood total and does not allow redistributing the raw GML. The zip files stay in `data/raw`, which is gitignored. They do not say a unit is for rent or for sale.

## Keys

`python server.py` serves the map at http://127.0.0.1:4175 and calls these keys from `config/secrets.env`. The browser does not receive the keys.

| Key | Used for |
| --- | --- |
| `OPENROUTESERVICE_API_KEY` | A 10-minute walk shape when you select a neighborhood or a shop |
| `GOOGLE_MAPS_API_KEY` | Up to 10 nearby places of the chosen type within 400 m, with rating. Each selection can create a billed Places request |

## Free, still not loaded

Asking rent, unit size, and a live for-rent or for-sale flag. That is an Idealista contract or an approved Search API key. Timetable frequency from the CRTM and TMB GTFS zips, which need an account. Barcelona has no equivalent of the Madrid traffic-sensor file.

## Paid, or an application rather than a download

Asking rent and live premises listings are an Idealista contract or an approved Search API key. They are not a free monthly quota. Ratings need a Google Places billing account. Pedestrian counts need a mobility vendor. None of these are in the map.
