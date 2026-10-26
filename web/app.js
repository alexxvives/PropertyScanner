const CONCEPTS = [
  { id: "bakery", label: "Bakery", words: ["bakery", "baker", "panader", "pastiss", "pastel", "boller", "forn de pa"] },
  { id: "cafe", label: "Café", words: ["cafe", "cafeteria", "coffee", "xocolat"] },
  { id: "grocery", label: "Grocery", words: ["grocery", "supermerc", "autoserv", "supermarket"] },
  { id: "food", label: "Restaurant", words: ["restaurant", "restaurante", "bar", "taberna", "comida"] },
  { id: "pharmacy", label: "Pharmacy", words: ["pharmacy", "farmac", "parafarm"] },
  { id: "beauty", label: "Hair salon", words: ["hair", "salon", "peluqu", "perruqu", "estetic", "beauty"] },
  { id: "fashion", label: "Clothing", words: ["clothing", "fashion", "ropa", "vestir", "moda"] },
  { id: "health", label: "Clinic", words: ["clinic", "dentist", "dental", "sanitat", "health", "fisio"] },
  { id: "gym", label: "Gym", words: ["gym", "gimnas", "fitness"] },
];

const GROUP_CODE = {
  bakery: "b",
  cafe: "c",
  grocery: "g",
  food: "f",
  pharmacy: "p",
  beauty: "u",
  fashion: "s",
  health: "l",
  gym: "m",
  other: "o",
  vacant: "v",
};

const CODE_TO_GROUP = Object.fromEntries(Object.entries(GROUP_CODE).map(([key, value]) => [value, key]));

const GROUP_COLORS = {
  bakery: "#c2561a",
  cafe: "#8a5a2b",
  food: "#a33b3b",
  grocery: "#2f6f4e",
  pharmacy: "#2c6e8a",
  beauty: "#8a4578",
  fashion: "#3d4c8a",
  health: "#3e7d74",
  gym: "#5c4d8a",
  other: "#8d8276",
};

const HEATMAPS = {
  fit: {
    label: "Area fit",
    field: "score",
    ramp: ["#f7f1e8", "#f6e0c8", "#efb27a", "#d46a32", "#8a3014"],
  },
  foot: {
    label: "Foot traffic",
    field: "open_per_km2",
    ramp: ["#e8f1f8", "#c5d9ea", "#8eb5d4", "#4a7fa3", "#0e3d5c"],
  },
  open: {
    label: "Open premises",
    field: "open",
    ramp: ["#eef0f8", "#c9cfea", "#8ea0d4", "#4d62a8", "#1e2a6b"],
  },
  competitors: {
    label: "Rivals nearby",
    field: "matches_per_km2",
    ramp: ["#f3e8f5", "#dbc8e0", "#b894c4", "#7a4f7a", "#4a1942"],
  },
  matchCount: {
    label: "This business",
    field: "matches",
    ramp: ["#f8e8f0", "#e7bfd2", "#cc7aa3", "#9d3d6e", "#6b1238"],
  },
  share: {
    label: "Share of open shops",
    field: "share",
    ramp: ["#f8efe8", "#efd0bc", "#d99a78", "#b85a32", "#7a2e12"],
  },
  pals: {
    label: "Helpful neighbours",
    field: "complements_per_km2",
    ramp: ["#e7f4ea", "#c3e4cb", "#86c498", "#3d8f55", "#14532d"],
  },
  room: {
    label: "Empty shopfronts",
    field: "vacant_per_km2",
    ramp: ["#e5f4f1", "#b9ddd6", "#7fb8ad", "#3d8a7f", "#0d4f48"],
  },
  vacant: {
    label: "Closed or empty doors",
    field: "vacant",
    ramp: ["#e5f3f6", "#b7dde6", "#78bccb", "#2f8ea3", "#0a3d4a"],
  },
  listed: {
    label: "Listed for rent or sale",
    field: "listed",
    ramp: ["#fde8d8", "#f6c7a8", "#e89262", "#c65a2e", "#9a3412"],
  },
  rent: {
    label: "For rent",
    field: "for_rent",
    ramp: ["#fff4d6", "#f6e2a4", "#e2c15a", "#b8860b", "#854d0e"],
  },
  sale: {
    label: "For sale",
    field: "for_sale",
    ramp: ["#f3e8ff", "#ddc7f7", "#b794e8", "#7c4dbe", "#4c1d95"],
  },
  population: {
    label: "Residents",
    field: "population",
    ramp: ["#f4f1ea", "#ddd4c6", "#b5a48e", "#7c6854", "#3d3428"],
  },
  popDensity: {
    label: "Residents nearby",
    field: "pop_per_km2",
    ramp: ["#e7f2f4", "#bddde3", "#7eb8c4", "#3a8494", "#0f3d48"],
  },
  income: {
    label: "Spending power",
    field: "income_eur",
    ramp: ["#f3f6e8", "#d5e2b4", "#a8c56e", "#6a9336", "#2f5414"],
  },
  age: {
    label: "Mean age",
    field: "age_mean",
    ramp: ["#f8f1ea", "#ecd4bc", "#d4a574", "#a86b3c", "#5c3317"],
  },
  older: {
    label: "Share aged 65 or over",
    field: "pct_65",
    ramp: ["#f6f1f8", "#e0d0ea", "#b894c4", "#7d548c", "#3b2764"],
  },
  unemployed: {
    label: "Registered unemployed",
    field: "unemployed",
    ramp: ["#f8eee8", "#efd0c2", "#d99278", "#b85a3c", "#6e2e1c"],
  },
  homes: {
    label: "Mean cadastral value of homes",
    field: "home_cadastral_eur",
    ramp: ["#eef3f8", "#c9d7e8", "#8eafd0", "#4d7eaa", "#1c3d5c"],
  },
  metro: {
    label: "Metro nearby",
    field: "metro_stops",
    ramp: ["#f3f0fa", "#d4c8ea", "#a892d0", "#6d52a8", "#321e6e"],
  },
  bus: {
    label: "Bus stops",
    field: "bus_stops",
    ramp: ["#eef6f3", "#c5e0d6", "#86bfa8", "#3d8f72", "#14543c"],
  },
  floor: {
    label: "Gross floor area",
    field: "floor_m2",
    ramp: ["#f6f1ea", "#e2d0b8", "#c4a078", "#8d6238", "#4a3014"],
  },
  retailFloor: {
    label: "Shop space nearby",
    field: "retail_m2",
    ramp: ["#f8efe8", "#efd0bc", "#d99a78", "#b85a32", "#7a2e12"],
  },
  trafficPoints: {
    label: "Traffic sensors",
    field: "traffic_points",
    ramp: ["#eef2f6", "#c9d5e2", "#8eabc4", "#4d7494", "#1c3a52"],
  },
  trafficFlow: {
    label: "Vehicles per hour on measured roads",
    field: "traffic_veh_h",
    ramp: ["#f8eee8", "#efd0c2", "#d99278", "#b85a3c", "#6e2e1c"],
  },
  metroDeps: {
    label: "Weekday metro departures",
    field: "metro_departures",
    ramp: ["#f3f0fa", "#d4c8ea", "#a892d0", "#6d52a8", "#321e6e"],
  },
  busDeps: {
    label: "Weekday bus departures",
    field: "bus_departures",
    ramp: ["#eef6f3", "#c5e0d6", "#86bfa8", "#3d8f72", "#14543c"],
  },
  southBus: {
    label: "Weekday south-corridor bus departures",
    field: "south_bus_departures",
    ramp: ["#f8efe8", "#efd0bc", "#d99a78", "#b85a32", "#7a2e12"],
  },
};

const SPAIN_BOUNDS = [[-9.6, 35.7], [4.6, 43.9]];
const JUMPS = {
  madrid: [[-3.84, 40.33], [-3.58, 40.51]],
  barcelona: [[2.07, 41.32], [2.23, 41.47]],
  spain: SPAIN_BOUNDS,
};
/** Default view: central Madrid, where most leads are. */
const DEFAULT_VIEW = JUMPS.madrid;

/** Prefixed ids so OpenFreeMap basemap layers never collide (e.g. some styles ship an `areas-fill`). */
const MAP_LAYERS = {
  areasFill: "scanner-areas-fill",
  areasLine: "scanner-areas-line",
  cities: "scanner-cities",
  citiesLabel: "scanner-cities-label",
  walkFill: "scanner-walk-fill",
  walkLine: "scanner-walk-line",
  areaSelectedFill: "scanner-area-selected-fill",
  areaSelectedHalo: "scanner-area-selected-halo",
  areaSelected: "scanner-area-selected",
  listings: "scanner-listings",
  places: "scanner-places",
};
const MAP_SOURCES = {
  areas: "scanner-areas",
  places: "scanner-places",
  cities: "scanner-cities",
  walk: "scanner-walk",
  listings: "scanner-listings",
};
const MAP_LAYER_STACK = [
  MAP_LAYERS.places,
  MAP_LAYERS.listings,
  MAP_LAYERS.areaSelected,
  MAP_LAYERS.areaSelectedHalo,
  MAP_LAYERS.areaSelectedFill,
  MAP_LAYERS.walkLine,
  MAP_LAYERS.walkFill,
  MAP_LAYERS.citiesLabel,
  MAP_LAYERS.cities,
  MAP_LAYERS.areasLine,
  MAP_LAYERS.areasFill,
];

/** Only show Idealista leads scraped with fetchDetails (_details in raw JSON). */
const FULL_DETAIL_LEADS_ONLY = true;

const PROFILES = {
  bakery: { street: "Busy morning streets", crowd: 0.78, complements: ["cafe", "grocery", "food"], signals: { street: 1, gap: 0.75, pals: 0.45, income: 0.3, residents: 0.55, transit: 0.9, retail: 0.15 }, walk: { openLow: 60, openHigh: 450, matchLow: 1.2, matchHigh: 7, palTarget: 5 } },
  cafe: { street: "Busy daytime streets", crowd: 0.74, complements: ["bakery", "fashion", "food"], signals: { street: 1, gap: 0.7, pals: 0.55, income: 0.4, residents: 0.4, transit: 0.7, retail: 0.35 }, walk: { openLow: 70, openHigh: 500, matchLow: 1.5, matchHigh: 8, palTarget: 6 } },
  grocery: { street: "Local streets with a gap, not the tourist core", crowd: 0.34, complements: ["pharmacy", "bakery"], signals: { street: 0.4, gap: 0.95, pals: 0.4, income: 0.75, residents: 1, transit: 0.35, retail: 0.15 }, walk: { openLow: 40, openHigh: 280, matchLow: 0.6, matchHigh: 4, palTarget: 4 } },
  food: { street: "Streets that already draw people out to eat", crowd: 0.62, complements: ["cafe", "fashion"], signals: { street: 0.85, gap: 0.6, pals: 0.5, income: 0.45, residents: 0.35, transit: 0.55, retail: 0.4 }, walk: { openLow: 70, openHigh: 500, matchLow: 2, matchHigh: 10, palTarget: 5 } },
  pharmacy: { street: "Neighborhood streets, not the busiest cores", crowd: 0.3, complements: ["grocery", "health"], signals: { street: 0.35, gap: 0.9, pals: 0.35, income: 0.4, residents: 1, transit: 0.4, retail: 0.1, older: 0.55 }, walk: { openLow: 40, openHigh: 300, matchLow: 0.5, matchHigh: 3.5, palTarget: 4 } },
  beauty: { street: "Local high streets with passing trade", crowd: 0.58, complements: ["fashion", "cafe"], signals: { street: 0.75, gap: 0.65, pals: 0.55, income: 0.55, residents: 0.55, transit: 0.35, retail: 0.45 }, walk: { openLow: 50, openHigh: 400, matchLow: 1, matchHigh: 6, palTarget: 5 } },
  fashion: { street: "Busy shopping streets", crowd: 0.82, complements: ["cafe", "beauty"], signals: { street: 1, gap: 0.55, pals: 0.6, income: 0.7, residents: 0.25, transit: 0.65, retail: 0.9 }, walk: { openLow: 80, openHigh: 520, matchLow: 1.5, matchHigh: 8, palTarget: 6 } },
  health: { street: "Quieter streets next to daily errands", crowd: 0.26, complements: ["pharmacy", "gym"], signals: { street: 0.3, gap: 0.85, pals: 0.4, income: 0.5, residents: 0.9, transit: 0.45, retail: 0.1 }, walk: { openLow: 35, openHigh: 260, matchLow: 0.4, matchHigh: 3, palTarget: 3 } },
  gym: { street: "Streets with room, near daily errands", crowd: 0.28, complements: ["grocery", "cafe", "health"], signals: { street: 0.35, gap: 0.8, pals: 0.45, income: 0.45, residents: 0.85, transit: 0.5, retail: 0.15 }, walk: { openLow: 40, openHigh: 300, matchLow: 0.4, matchHigh: 2.5, palTarget: 4 } },
};

const PIN_ICON = `<svg class="icon-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`;

const state = {
  areas: null,
  places: [],
  listings: [],
  listingById: new Map(),
  city: "all",
  listingCounts: new Map(),
  query: null,
  heatmap: "fit",
  metricFilter: {},
  chips: new Set(),
  maxPrice: 0,
  sizeRange: "any",
  ticked: new Set(),
  mapStyle: "light",
  filters: { competition: true, complements: true, daytime: true, vacancies: true },
  selectedId: null,
  activeListingId: null,
  listingWalkScores: new Map(),
  listingWalkParts: new Map(),
  ready: false,
};

const mapLegend = document.querySelector("#map-legend");
const mapStyleToolbar = document.querySelector("#map-style-toolbar");
const mapHeatmapToolbar = document.querySelector("#map-heatmap-toolbar");

const MAP_STYLES = {
  light: { label: "Light", url: "https://tiles.openfreemap.org/styles/positron", swatch: "#ebe6dc" },
  streets: { label: "Streets", url: "https://tiles.openfreemap.org/styles/bright", swatch: "#d4e2ed" },
  satellite: {
    label: "Satellite",
    swatch: "#4a5a3a",
    url: {
      version: 8,
      glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
      sources: {
        esri: {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
      },
      layers: [{ id: "esri-imagery", type: "raster", source: "esri" }],
    },
  },
};

/** Match neighborhood score breakdown dimensions (see scoreAreas). */
const HEATMAP_TOOLBAR_KEYS = [
  "fit",
  "foot",
  "competitors",
  "pals",
  "income",
  "popDensity",
  "room",
  "metro",
  "retailFloor",
];
const areaRanking = document.querySelector("#area-ranking");
const areaRankingTitle = document.querySelector("#area-ranking-title");
const listingRanking = document.querySelector("#listing-ranking");
const listingRankingTitle = document.querySelector("#listing-ranking-title");
const hoverCard = document.querySelector("#hover-card");
const detailModal = document.querySelector("#detail-modal");
const detailModalBody = document.querySelector("#detail-modal-body");
const detailModalClose = document.querySelector("#detail-modal-close");
const detailModalBackdrop = document.querySelector("#detail-modal-backdrop");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

function norm(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

function plural(label, count) {
  const word = label.toLowerCase();
  if (count === 1) return word;
  if (word.endsWith("y") && !"aeiou".includes(word.at(-2))) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

function mapLayerReady(layerId) {
  return Boolean(map?.getLayer?.(layerId));
}

function queryMapLayerFeatures(geometry, layerIds) {
  const layers = layerIds.filter((id) => mapLayerReady(id));
  if (!layers.length) return [];
  return map.queryRenderedFeatures(geometry, { layers });
}

function combinedFitScore(areaScore, walkScore) {
  const area = Number(areaScore);
  const walk = Number(walkScore);
  if (!Number.isFinite(area)) return Number.isFinite(walk) ? Math.round(walk) : 0;
  if (!Number.isFinite(walk)) return Math.round(area);
  return Math.round((area + walk) / 2);
}

function parseIdealistaStatCount(block) {
  const text = typeof block === "string" ? block : block?.text;
  if (!text) return null;
  const match = String(text).match(/(\d[\d.,]*)/);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

function listingEngagementTagsHtml(detail) {
  const stats = detail?.stats && typeof detail.stats === "object" ? detail.stats : {};
  const views = parseIdealistaStatCount(stats.views);
  const contacts = parseIdealistaStatCount(stats.contactMails);
  const shared = parseIdealistaStatCount(stats.sentToFriend);
  const favorites = parseIdealistaStatCount(stats.favorites);
  const tags = [
    `${views ?? 0} views`,
    `${contacts ?? 0} contacts`,
    `${shared ?? 0} shared`,
    `${favorites ?? 0} favorited`,
  ];
  return `<div class="lead-stat-tags">${tags.map((tag) => `<span class="lead-stat-tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function rankingConceptTitle(kind) {
  const query = state.query || parseQuery(pickerValue("business") || "bakery");
  const concept = query.label.toLowerCase();
  if (kind === "property") return `Property ranking · ${concept}`;
  return `Neighborhood ranking · ${concept}`;
}

/** Spread rank-based 0–1 values so scores use more of the bar (less clustering around 50). */
function stretchUnit(u) {
  const x = Math.max(0, Math.min(1, Number(u) || 0));
  const y = 0.5 + (x - 0.5) * 1.55;
  return Math.max(0.04, Math.min(0.96, y));
}

function stretchScoreFromUnit(u) {
  return Math.round(stretchUnit(u) * 100);
}

function scorePartLabel(key) {
  const mode = HEATMAPS[key];
  return mode ? mode.label : key;
}

const SCORE_TIPS = {
  [scorePartLabel("foot")]: "How busy the neighborhood is with open shops per km², blended with whether your business type already has enough presence to prove demand.",
  [scorePartLabel("competitors")]: "Whether this neighborhood has a healthy number of similar businesses — not too few (unproven) and not too many (crowded).",
  [scorePartLabel("pals")]: "Nearby shops that attract the same customers without competing directly, such as cafés near a bakery.",
  [scorePartLabel("income")]: "Disposable income per person in this neighborhood, compared with other neighborhoods in the same city.",
  [scorePartLabel("popDensity")]: "How many people live here per km², compared with other neighborhoods.",
  [scorePartLabel("metro")]: "Weekday metro and bus service, or stop counts when departure data is missing.",
  [scorePartLabel("retailFloor")]: "Total retail floor area in the neighborhood from cadastre data — a proxy for shopping activity.",
  "Older residents": "Share of residents aged 65 or over. Matters more for pharmacies and daily-needs concepts.",
  [scorePartLabel("room")]: "Empty or closed street doors on this map. In Madrid that means census-closed; in Barcelona it can mean listed empty premises.",
  "Shops in the walk": "Open premises inside a 10-minute walk from this door. Higher is usually better for footfall-driven concepts.",
  "Competitors in the walk": "Similar businesses inside the walk. Closer competitors count more than distant ones.",
  "Helpful neighbours in the walk": "Complementary shops inside the walk that bring passing trade without direct competition.",
  "Empty doors in the walk": "Vacant or closed doors inside the walk. Good on a busy street; often a warning on a quiet one.",
  "Area fit": "Overall neighborhood score for your selected business type, from census and context data.",
  "Walk fit": "Score for the 10-minute walk around this exact address, using live shop locations on the map.",
};

function scoreTipHtml(label) {
  const tip = SCORE_TIPS[label];
  if (!tip) return "";
  return `<span class="score-tip" tabindex="0" aria-label="${escapeHtml(tip)}"><span class="score-tip__mark" aria-hidden="true">?</span><span class="score-tip__bubble">${escapeHtml(tip)}</span></span>`;
}

function scoreBarHtml(score, label = "Fit score", withTip = false, featured = false, caption = "") {
  const value = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const tip = withTip ? scoreTipHtml(label) : "";
  const featuredClass = featured ? " score-bar--featured" : "";
  const ticks = featured
    ? `<div class="score-bar__ticks" aria-hidden="true"><span style="left:25%"></span><span style="left:50%"></span><span style="left:75%"></span></div>`
    : "";
  return `<div class="score-bar${featuredClass}" role="meter" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
    ${tip}
    <div class="score-bar__track" style="--score-pct:${value}">${ticks}<div class="score-bar__gradient score-bar__gradient--dim" aria-hidden="true"></div><div class="score-bar__gradient score-bar__gradient--fill" aria-hidden="true"></div></div>
    <span class="score-bar__value">${value}</span>
    ${caption ? `<span class="score-bar__caption">${escapeHtml(caption)}</span>` : ""}
  </div>`;
}

function listingFitScore(props) {
  const s = state.scores?.get(props.id);
  if (s) return s.raw;
  return state.areaById?.get(props.i)?.properties?.score ?? 0;
}

/** Percentile rank among listings of the same city and operation, from score.js (computed once per scoring pass). */
function listingRank(props) {
  const s = state.scores?.get(props.id);
  if (s) return s;
  const raw = listingFitScore(props);
  const group = `${cityOfId(props.i) || props.m || "Madrid"} ${props.op === "rent" ? "rentals" : "sales"}`;
  return { raw, pct: raw, top: 50, n: 1, group, text: group, parts: [], gates: [] };
}

function refreshScores() {
  if (!state.listings?.length || !window.PSScore) { state.scores = new Map(); return; }
  state.scores = PSScore.computeListingScores(state.listings, state.query?.id, state.areaById, {
    tenant: state.tenant, tenantEval: state.tenantEval, profiles: PROFILES,
    outlier: typeof listingOutlier === "function" ? listingOutlier : null,
  });
}

function dedupeListingFeatures(features) {
  const byTitle = new Map();
  const richness = (feature) => {
    const props = feature.properties;
    const detail = props.x || {};
    return (
      Number(props.full) * 1000 +
      (detail.rich || 0) * 10 +
      (detail.basics?.length || 0) * 10 +
      (detail.desc?.length || 0) +
      (detail.imgs?.length || 0)
    );
  };
  for (const feature of features) {
    const key = norm(feature.properties.t || feature.properties.a || feature.properties.id);
    const prev = byTitle.get(key);
    if (!prev || richness(feature) > richness(prev)) byTitle.set(key, feature);
  }
  return [...byTitle.values()];
}

function boundsOf(geometry) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      minX = Math.min(minX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxX = Math.max(maxX, coords[0]);
      maxY = Math.max(maxY, coords[1]);
      return;
    }
    coords.forEach(visit);
  };
  visit(geometry.coordinates);
  return [[minX, minY], [maxX, maxY]];
}

function cityOfId(areaId) {
  return String(areaId).startsWith("bcn-") ? "Barcelona" : "Madrid";
}

function parseQuery(id) {
  return { ...(CONCEPTS.find((item) => item.id === id) || CONCEPTS[0]), custom: false };
}

function rowMatches(row, query) {
  return row[3] === "O" && GROUP_CODE[query.id] === row[2];
}

function matchCount(area, query) {
  return area.properties[query.id] || 0;
}

function complementCount(area, query) {
  const ids = PROFILES[query.id]?.complements || [];
  return ids.reduce((sum, id) => sum + (area.properties[id] || 0), 0);
}

function rankValue(sorted, value) {
  if (!sorted.length) return 0;
  let below = 0;
  for (const item of sorted) {
    if (item <= value) below += 1;
    else break;
  }
  return below / sorted.length;
}

function visibleAreas() {
  if (!state.areas?.features) return [];
  return state.areas.features.filter((feature) => state.city === "all" || feature.properties.city === state.city);
}

function neighborhoodFitLines(props, query) {
  const emptyWord = props.city === "Barcelona" ? "empty premises" : "closed premises";
  const lines = [
    `${formatNumber(props.open_per_km2)} open premises per km²`,
    `${formatNumber(props.matches)} ${plural(query.label, props.matches)} already open`,
    `${formatNumber(props.vacant)} ${emptyWord}`,
  ];
  if (Number.isFinite(props.population)) {
    const density = Number.isFinite(props.pop_per_km2) ? `, ${formatNumber(Math.round(props.pop_per_km2))} per km²` : "";
    lines.push(`${formatNumber(props.population)} residents${density}`);
  }
  if (Number.isFinite(props.income_eur)) {
    const year = props.income_year ? ` (${props.income_year})` : "";
    lines.push(`€${formatNumber(Math.round(props.income_eur))} disposable income per person${year}`);
  }
  if (Number.isFinite(props.age_mean)) {
    const med = Number.isFinite(props.age_median) ? `median age ${props.age_median}, ` : "";
    lines.push(`Residents' ${med}mean age ${props.age_mean}`);
  }
  if (Number.isFinite(props.metro_stops) || Number.isFinite(props.bus_stops)) {
    lines.push(`${formatNumber(props.metro_stops || 0)} metro stations, ${formatNumber(props.bus_stops || 0)} bus stops`);
  }
  if (Number.isFinite(props.metro_departures) || Number.isFinite(props.bus_departures)) {
    lines.push(`${formatNumber(props.metro_departures || 0)} metro departures and ${formatNumber(props.bus_departures || 0)} bus departures on a Wednesday`);
  }
  if (Number.isFinite(props.south_bus_departures)) {
    lines.push(`${formatNumber(props.south_bus_departures)} departures on the Legazpi–Aranjuez buses on a Wednesday`);
  }
  if (Number.isFinite(props.floor_m2)) {
    const retail = Number.isFinite(props.retail_m2) ? `, ${formatNumber(props.retail_m2)} m² in retail use` : "";
    lines.push(`${formatNumber(props.floor_m2)} m² gross floor area${retail}`);
  }
  if (Number.isFinite(props.traffic_points)) {
    const flow = Number.isFinite(props.traffic_veh_h) ? `, ${formatNumber(props.traffic_veh_h)} vehicles per hour` : "";
    lines.push(`${formatNumber(props.traffic_points)} traffic sensors${flow}`);
  }
  return lines;
}

function ranksOf(values) {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  return values.map((value) => (Number.isFinite(value) ? rankValue(finite, value) : null));
}

function transitValue(props) {
  const metro = Number(props.metro_departures);
  const bus = Number(props.bus_departures);
  const south = Number(props.south_bus_departures);
  if (Number.isFinite(metro) || Number.isFinite(bus)) return (Number.isFinite(metro) ? metro : 0) + 0.35 * (Number.isFinite(bus) ? bus : 0);
  if (Number.isFinite(south)) return south * 0.35;
  if (Number.isFinite(props.metro_stops) || Number.isFinite(props.bus_stops)) return (props.metro_stops || 0) * 400 + (props.bus_stops || 0) * 8;
  return null;
}

function gapLine(compRank) {
  if (compRank < 0.08) return "Almost no similar shops — demand is unproven";
  if (compRank > 0.72) return "This business type is already crowded here";
  return "Competition looks balanced for this concept";
}

function vacancyFit(foot, room) {
  if (foot == null || room == null) return null;
  if (foot >= 0.45) return { value: 0.4 + 0.6 * room, line: room >= 0.55 ? "Empty doors on a busy street" : "Busy street, few empty doors" };
  return { value: 1 - room, line: room >= 0.55 ? "Closed doors on a quiet street" : "Quieter street without a run of closures" };
}

function leadFrom(parts, props, query) {
  if (!parts.length) return "";
  const compLabel = scorePartLabel("competitors");
  const footLabel = scorePartLabel("foot");
  const headlinePool = parts.filter((part) => {
    if (part.label === scorePartLabel("metro")) return part.value < 0.42;
    if (part.label === scorePartLabel("retailFloor")) return false;
    if (part.label === "Older residents") return false;
    return true;
  });
  const pool = headlinePool.length ? headlinePool : parts;
  const drag = pool.reduce((worst, part) => (part.value < worst.value ? part : worst), pool[0]);
  if (drag.value < 0.38 && drag.weight >= 0.45) {
    if (drag.label === compLabel && props && query) {
      const count = Number(props.matches) || 0;
      return `${formatNumber(count)} ${plural(query.label, count)} already open. ${drag.line}`;
    }
    return drag.line;
  }
  const best = pool.reduce((top, part) => (part.weight * part.value > top.weight * top.value ? part : top), pool[0]);
  if (best.label === footLabel && props) return `${best.line}: ${formatNumber(Math.round(props.open_per_km2))} open premises per km²`;
  return best.line;
}

function rankingReason(props) {
  return props.lead || "";
}

function visitReason(props) {
  return props.lead || "Area fit for this business";
}

function scoreAreas() {
  metricCuts = null;
  const areas = visibleAreas();
  const query = state.query || parseQuery(pickerValue("business") || "bakery");
  const profile = PROFILES[query.id] || PROFILES.bakery;
  const crowd = profile.crowd ?? 0.6;
  const signals = profile.signals;
  const filters = state.filters;
  const counted = areas.map((area) => ({
    area,
    matches: matchCount(area, query),
    complements: complementCount(area, query),
  }));
  const feet = ranksOf(counted.map((item) => item.area.properties.open_per_km2));
  const comps = ranksOf(counted.map((item) => item.matches / (item.area.properties.area_km2 || 1)));
  const pals = ranksOf(counted.map((item) => item.complements / (item.area.properties.area_km2 || 1)));
  const rooms = ranksOf(counted.map((item) => item.area.properties.vacant / (item.area.properties.area_km2 || 1)));
  const incomes = ranksOf(counted.map((item) => item.area.properties.income_eur));
  const residents = ranksOf(counted.map((item) => item.area.properties.pop_per_km2));
  const transit = ranksOf(counted.map((item) => transitValue(item.area.properties)));
  const retail = ranksOf(counted.map((item) => item.area.properties.retail_per_km2));
  const older = ranksOf(counted.map((item) => item.area.properties.pct_65));

  counted.forEach((item, index) => {
    const props = item.area.properties;
    const km = props.area_km2 || 1;
    props.matches_per_km2 = item.matches / km;
    props.vacant_per_km2 = props.vacant / km;
    props.complements_per_km2 = item.complements / km;
    props.share = props.open ? item.matches / props.open : 0;
    const listing = state.listingCounts.get(props.id) || { listed: 0, forRent: 0, forSale: 0 };
    props.listed = listing.listed;
    props.listed_per_km2 = listing.listed / km;
    props.for_rent = listing.forRent;
    props.for_sale = listing.forSale;
    const foot = feet[index];
    const comp = comps[index];
    const gap = 1 - Math.min(1, Math.abs(comp - 0.22) / 0.78);
    const street = crowd * foot + (1 - crowd) * (0.5 * foot + 0.5 * gap);
    const vacancy = vacancyFit(foot, rooms[index]);
    const parts = [];
    const add = (weight, value, label, line) => {
      if (!weight || value == null || !Number.isFinite(value)) return;
      parts.push({ weight, value, score: stretchScoreFromUnit(value), label, line });
    };
    add(filters.daytime ? signals.street : 0, street, scorePartLabel("foot"), street >= 0.6 ? profile.street : "Footfall is weaker than this concept wants");
    add(filters.competition ? signals.gap : 0, gap, scorePartLabel("competitors"), gapLine(comp));
    add(filters.complements ? signals.pals : 0, pals[index], scorePartLabel("pals"), pals[index] >= 0.55 ? "Complementary shops are dense here" : "Few complementary shops");
    add(signals.income, incomes[index], scorePartLabel("income"), incomes[index] >= 0.6 ? "Higher disposable income" : "Income is below most neighborhoods");
    add(signals.residents, residents[index], scorePartLabel("popDensity"), residents[index] >= 0.6 ? "More residents per km²" : "Fewer residents than most neighborhoods");
    add(signals.transit, transit[index], scorePartLabel("metro"), transit[index] >= 0.6 ? "Stronger weekday transit" : "Weaker weekday transit");
    add(signals.retail, retail[index], scorePartLabel("retailFloor"), retail[index] >= 0.6 ? "More retail floor nearby" : "Less retail floor than most neighborhoods");
    add(signals.older, older[index], "Older residents", older[index] >= 0.6 ? "More residents aged 65 or over" : "Fewer older residents");
    if (filters.vacancies && vacancy) add(0.4, vacancy.value, scorePartLabel("room"), vacancy.line);
    const weight = parts.reduce((sum, part) => sum + part.weight, 0);
    const mix = parts.reduce((sum, part) => sum + part.weight * part.value, 0);
    let unit = weight ? mix / weight : 0;
    const unitMix = unit;
    if (filters.competition && gap < 0.55) unit *= 0.62 + 0.38 * (gap / 0.55);
    props.score = stretchScoreFromUnit(unit);
    props.calc = { weight, mix, unitMix, penalty: unitMix ? unit / unitMix : 1, unit };
    props.matches = item.matches;
    props.complements = item.complements;
    props.parts = parts;
    props.lead = leadFrom(parts, props, query);
  });

  for (const feature of state.areas.features) {
    if (state.city !== "all" && feature.properties.city !== state.city) feature.properties.score = -1;
  }
  state.query = query;
  refreshScores();
}

function colorStops(field) {
  const values = visibleAreas()
    .filter((feature) => feature.properties.score >= 0)
    .map((feature) => feature.properties[field])
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const at = (fraction) => values[Math.round(fraction * (values.length - 1))] ?? 0;
  const stops = [at(0.15), at(0.35), at(0.55), at(0.75), at(0.92)];
  for (let index = 1; index < stops.length; index += 1) {
    if (stops[index] <= stops[index - 1]) stops[index] = stops[index - 1] + (field === "score" ? 1 : 0.01);
  }
  return stops;
}

function paintAreaFillOpacity() {
  if (!map?.getLayer?.(MAP_LAYERS.areasFill)) return;
  const dark = state.mapStyle === "satellite";
  const opacity = dark
    ? ["interpolate", ["linear"], ["zoom"], 6, 0.18, 9, 0.42, 12, 0.38, 13, 0.26, 14, 0.14, 16, 0.08]
    : ["interpolate", ["linear"], ["zoom"], 6, 0.2, 9, 0.78, 12, 0.74, 13, 0.42, 14, 0.18, 16, 0.08];
  map.setPaintProperty(MAP_LAYERS.areasFill, "fill-opacity", opacity);
}

function paintScores() {
  if (!map?.getLayer?.(MAP_LAYERS.areasFill)) return;
  const mode = HEATMAPS[state.heatmap] || HEATMAPS.fit;
  const stops = colorStops(mode.field);
  const ramp = mode.ramp;
  const interpolate = ["interpolate", ["linear"], ["get", mode.field]];
  stops.forEach((stop, index) => {
    interpolate.push(stop, ramp[index]);
  });
  const failIds = [];
  const expression = ["case",
    ["<", ["get", "score"], 0], "#ebe4da",
    ["in", ["get", "id"], ["literal", failIds]], "#e9e5df",
    ["!", ["has", mode.field]], "#ebe4da",
    interpolate,
  ];
  map.setPaintProperty(MAP_LAYERS.areasFill, "fill-color", expression);
  paintAreaFillOpacity();
  if (mapLegend) {
    mapLegend.innerHTML = `<span class="swatches" title="${escapeHtml(mode.label)}">${ramp.map((color) => `<i style="background:${color}"></i>`).join("")}</span>`;
  }
}

/** Areas whose bounding box overlaps the current map view (ranking only; scores are city-wide). */
const FILTER_GROUPS = [
  ["Demand", "👥", ["foot", "popDensity", "income"]],
  ["Competition", "🏪", ["competitors", "pals"]],
  ["Access & supply", "🚇", ["metro", "retailFloor", "room"]],
];
let metricCuts = null;
/** Per city, the 33rd / 67th percentile of each filter metric. */
function metricCutoffs() {
  if (metricCuts || !state.areas?.features?.length) return metricCuts || {};
  metricCuts = {};
  const by = {};
  for (const f of state.areas?.features || []) (by[f.properties.city] ||= []).push(f.properties);
  for (const [city, ps] of Object.entries(by)) {
    metricCuts[city] = {};
    for (const id of FILTER_GROUPS.flatMap((g) => g[2])) {
      const fld = HEATMAPS[id].field;
      const v = ps.map((p) => Number(p[fld])).filter(Number.isFinite).sort((a, b) => a - b);
      metricCuts[city][id] = v.length ? [v[Math.floor(v.length / 3)], v[Math.floor((2 * v.length) / 3)]] : null;
    }
  }
  return metricCuts;
}
function passesMetricFilter(p) {
  const cuts = metricCutoffs()[p.city] || {};
  for (const [id, want] of Object.entries(state.metricFilter)) {
    const c = cuts[id], v = Number(p[HEATMAPS[id].field]);
    if (!c || !Number.isFinite(v)) return false;
    if (want === "low" && v > c[0]) return false;
    if (want === "high" && v < c[1]) return false;
  }
  return true;
}

function areasInView() {
  const all = visibleAreas();
  if (!map?.getBounds) return all;
  const b = map.getBounds();
  return all.filter((feature) => {
    const [[x1, y1], [x2, y2]] = boundsOf(feature.geometry);
    return x2 >= b.getWest() && x1 <= b.getEast() && y2 >= b.getSouth() && y1 <= b.getNorth();
  });
}

/** Neighbourhood percentile within its own city (same treatment as listings). */
function areaRank(props) {
  const pool = (state.areas?.features || []).map((f) => f.properties).filter((p) => p.city === props.city && Number(p.score) >= 0);
  const above = pool.filter((p) => p.score > props.score).length;
  const equal = pool.filter((p) => p.score === props.score).length;
  const n = pool.length || 1;
  const pct = Math.round(100 * (n - above - Math.max(1, equal)) / Math.max(1, n - 1));
  const top = Math.max(1, Math.ceil((100 * (above + Math.max(1, equal))) / n));
  return { pct: Math.max(0, Math.min(100, pct)), n, text: `Top ${top}% of ${props.city}` };
}

function renderAreaRanking() {
  if (!areaRanking || !areaRankingTitle) return;
  const rows = areasInView()
    .slice()
    .sort((a, b) => b.properties.score - a.properties.score);
  areaRankingTitle.textContent = rankingConceptTitle("neighborhood");
  if (!rows.length) {
    areaRanking.innerHTML = `<li><p class="pinned-empty">${state.areas ? (Object.keys(state.metricFilter).length ? "No neighbourhoods match these filters — set one back to Any." : "No neighbourhoods in view — zoom out or jump to Madrid / Barcelona.") : "Loading neighborhoods…"}</p></li>`;
    return;
  }
  areaRanking.innerHTML = rows
    .map((feature, index) => {
      const props = feature.properties;
      const selected = props.id === state.selectedId ? " is-selected" : "";
      return `<li><button type="button" class="${selected.trim()}" data-kind="area" data-id="${escapeHtml(props.id)}">
        <span class="rank-num">${index + 1}</span>
        <span class="row-name">${escapeHtml(props.name)}</span>
        <span class="row-city">${escapeHtml(props.city)}</span>
        <span class="row-area-score">${(() => { const r = areaRank(props); return scoreBarHtml(r.pct, `Rank ${r.pct}/100 among ${r.n} ${props.city} barrios · raw fit ${Math.round(props.score)}`, false, true, r.text); })()}</span>
      </button></li>`;
    })
    .join("");
}

function refreshTenantEval() {
  state.tenantEval = state.tenant && state.listings?.length ? evaluateTenant(state.tenant, state.listings, state.areaById) : null;
  if (state.areas && state.query) refreshScores();
}

function tenantOptionHtml(t, on) {
  const logo = t ? `<span class="tlogo" style="--tc:${t.color}">${escapeHtml(t.initials)}</span>` : `<span class="tlogo tlogo--any">∗</span>`;
  const anyVerified = t && [...t.hard, ...t.soft].some((x) => x.verified);
  return `${logo}<span class="tpick__txt"><b>${escapeHtml(t ? t.name : "Any tenant")}</b><small>${escapeHtml(t ? t.short : "Score by business type")}${t && !anyVerified ? " · press only" : ""}</small></span>`;
}
function renderTenantPicker() {
  const val = document.getElementById("tenant-value");
  const menu = document.getElementById("tenant-menu");
  if (!val || !menu) return;
  val.innerHTML = tenantOptionHtml(state.tenant, true);
  menu.innerHTML = [null, ...Object.values(TENANTS)].map((t) => {
    const id = t ? t.id : "";
    const on = (state.tenant?.id || "") === id;
    return `<button type="button" role="option" data-tenant="${id}" aria-selected="${on}" class="tpick__opt${on ? " is-on" : ""}">${tenantOptionHtml(t)}</button>`;
  }).join("");
}
function setTenant(id) {
  state.tenant = TENANTS[id] || null;
  const note = document.getElementById("tenant-note");
  const bizPicker = document.querySelector('.picker[data-picker="business"]');
  const implied = document.getElementById("business-implied");
  if (state.tenant) {
    if (state.query?.id !== state.tenant.concept) document.querySelector(`#business-menu [data-value="${state.tenant.concept}"]`)?.click();
    const label = document.querySelector(`#business-menu [data-value="${state.tenant.concept}"]`)?.textContent || state.tenant.concept;
    if (note) { note.hidden = false; note.innerHTML = `${escapeHtml(state.tenant.blurb)} <a href="${state.tenant.sources[0].url}" target="_blank" rel="noopener">Source</a>`; }
    if (implied) { implied.hidden = false; implied.innerHTML = `Business type: <b>${escapeHtml(label)}</b> <span>· set by ${escapeHtml(state.tenant.name)}</span>`; }
    if (bizPicker) bizPicker.hidden = true;
  } else {
    if (note) note.hidden = true;
    if (implied) implied.hidden = true;
    if (bizPicker) bizPicker.hidden = false;
  }
  renderTenantPicker();
  refreshTenantEval();
  renderListingRanking();
  syncListings();
}
document.addEventListener("click", (event) => {
  const btn = document.getElementById("tenant-btn");
  const menu = document.getElementById("tenant-menu");
  if (!btn || !menu) return;
  const opt = event.target.closest("[data-tenant]");
  if (opt && menu.contains(opt)) {
    menu.hidden = true; btn.setAttribute("aria-expanded", "false");
    setTenant(opt.dataset.tenant);
    return;
  }
  if (btn.contains(event.target)) {
    menu.hidden = !menu.hidden; btn.setAttribute("aria-expanded", String(!menu.hidden));
    return;
  }
  if (!menu.hidden && !menu.contains(event.target)) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
});
document.addEventListener("keydown", (event) => {
  const menu = document.getElementById("tenant-menu");
  if (event.key === "Escape" && menu && !menu.hidden) { menu.hidden = true; document.getElementById("tenant-btn")?.focus(); }
});
document.addEventListener("DOMContentLoaded", renderTenantPicker);
if (document.readyState !== "loading") renderTenantPicker();

/* Leaving the app for Google Maps: small confirm first. */
document.addEventListener("click", (event) => {
  const chip = event.target.closest("a.pchip[data-leave]");
  const block = event.target.closest(".near-block");
  if (chip && block) {
    event.preventDefault();
    const box = block.querySelector(".leave-confirm");
    if (!box) return;
    box.dataset.href = chip.href;
    box.querySelector("span").textContent = `Open ${chip.dataset.leave}'s Google Maps profile in a new tab?`;
    box.hidden = false;
    box.querySelector(".leave-confirm__go").focus();
    return;
  }
  const go = event.target.closest(".leave-confirm__go");
  const no = event.target.closest(".leave-confirm__no");
  if (go || no) {
    const box = event.target.closest(".leave-confirm");
    if (go && box.dataset.href) window.open(box.dataset.href, "_blank", "noopener");
    box.hidden = true;
  }
});

function rankableListings() {
  if (!state.listings.length) return [];
  return collectRankableListings({ restrictToBounds: true });
}

function rankableAreas() {
  return visibleAreas()
    .filter((feature) => feature.properties.score >= 0)
    .map((feature) => ({
      kind: "area",
      id: feature.properties.id,
      score: feature.properties.score,
      city: feature.properties.city,
      areaName: feature.properties.name,
      props: feature.properties,
    }));
}

function listingHasAreaFit(props) {
  const area = state.areaById?.get(props.i);
  return Boolean(area && area.properties.score >= 0);
}

function tenantRowCaption(ev) {
  const ad = ev.pass - ev.confirmed;
  return `${state.tenant.name}: ✓${ev.confirmed} confirmed${ad ? ` · ${ad} from ad` : ""} · ✗${ev.fail} · ${ev.unknown} to check`;
}

function buildOverallRanking() {
  if (state.tenant && state.tenantEval) {
    const all = rankableListings().map((r) => ({ ...r, tev: state.tenantEval.get(r.id) })).filter((r) => r.tev);
    const rows = state.showExcluded ? all : all.filter((r) => !r.tev.excluded);
    state.tenantHidden = all.length - rows.length;
    const ok = rows.filter((r) => r.tev.ok);
    state.tenantNearMiss = !ok.length;
    const pool = ok.length ? ok : rows;
    return pool.sort((a, b) => a.tev.fail - b.tev.fail || b.score - a.score).slice(0, 14);
  }
  return rankableListings()
    .sort((a, b) => {
      const fitDelta = Number(listingHasAreaFit(b.props)) - Number(listingHasAreaFit(a.props));
      if (fitDelta !== 0) return fitDelta;
      return b.score - a.score;
    })
    .slice(0, 14);
}

function renderTenantToggle() {
  let box = document.getElementById("tenant-excl-toggle");
  if (!state.tenant?.retail) { if (box) box.hidden = true; return; }
  if (!box) {
    box = document.createElement("label");
    box.id = "tenant-excl-toggle";
    box.className = "tenant-excl-toggle";
    listingRankingTitle.insertAdjacentElement("afterend", box);
  }
  box.hidden = false;
  const n = state.tenantHidden || 0;
  box.innerHTML = `<input type="checkbox" id="show-excluded"${state.showExcluded ? " checked" : ""}> Show warehouses &amp; outliers${n || state.showExcluded ? ` <span class="unit-note">(${state.showExcluded ? "shown" : `${n} hidden`})</span>` : ""}`;
}

document.addEventListener("change", (event) => {
  if (event.target.id !== "show-excluded") return;
  state.showExcluded = event.target.checked;
  renderListingRanking();
  syncListings();
});

document.addEventListener("click", (event) => {
  const t = event.target.closest("[data-chips-toggle]");
  if (t) {
    const extra = t.previousElementSibling;
    const open = t.getAttribute("aria-expanded") !== "true";
    if (extra) extra.hidden = !open;
    t.setAttribute("aria-expanded", String(open));
    t.textContent = open ? "Show less" : t.dataset.more;
    return;
  }
  const b = event.target.closest("[data-tcheck]");
  if (b) {
    const box = b.closest("[data-tenant-listing]");
    const id = box?.dataset.tenantListing;
    if (!id || !state.tenant) return;
    saveCheck(id, b.dataset.tcheck, b.dataset.v === "clear" ? "clear" : JSON.parse(b.dataset.v));
    refreshTenantEval();
    box.outerHTML = tenantChecksHtml(state.tenant, state.tenantEval?.get(id), id);
    renderListingRanking();
    return;
  }
  const c = event.target.closest("[data-copy-asks]");
  if (c) {
    navigator.clipboard?.writeText(c.dataset.copyAsks).then(() => { c.textContent = "Copied ✓"; }, () => { c.textContent = "Copy failed — select the list"; });
  }
});

function renderListingRanking() {
  if (!listingRanking || !listingRankingTitle) return;
  const items = buildOverallRanking();
  renderTenantToggle();
  listingRankingTitle.textContent = state.tenant ? `Property ranking · ${state.tenant.name}${state.tenantNearMiss ? " (no full pass in view — closest)" : " · hard filters passed"}` : rankingConceptTitle("property");
  listingRanking.innerHTML = items.length
    ? items
        .map((item, index) => {
          const title = listingShortTitle(item.props);
          const meta = [item.areaName, item.city].filter(Boolean).join(", ");
          const tev = state.tenantEval?.get(item.id);
          return `<li class="has-tick"><label class="tick" title="Tick to include in the PDF shortlist"><input type="checkbox" data-tick="${escapeHtml(item.id)}"${state.ticked.has(String(item.id)) ? " checked" : ""} aria-label="Add to PDF shortlist"></label><button type="button" data-kind="listing" data-id="${escapeHtml(item.id)}">
        <span class="rank-num">${index + 1}</span>
        <span class="row-name">${escapeHtml(title)}</span>
        <span class="row-city">${escapeHtml(meta)}</span>
        <span class="row-price-meta">${listingPriceHtml(item.props, { variant: "compact", showPm2: false, inlineSize: true })}${opTagHtml(item.props, "row-tag")}${listingOutlier(item.props) ? `<span class="row-tag row-tag--warn" title="${escapeHtml(listingOutlier(item.props))}">⚠ outlier</span>` : ""}</span>
        <span class="score-bar-wrap">${tev ? scoreBarHtml(item.rank.pct, `${state.tenant.name} score ${item.rank.raw}/100 · rank ${item.rank.pct}`, false, false, tenantRowCaption(tev)) : scoreBarHtml(item.rank.pct, `Rank ${item.rank.pct}/100 · raw fit ${item.rank.raw}`, false, false, item.rank.text)}</span>
      </button></li>`;
        })
        .join("")
    : `<li><p class="pinned-empty">${activeFilterCount() ? "No places match these filters — untick a chip or reset." : "No property leads in this view yet."}</p></li>`;
  renderPdfBar();
}

function shopTitle(props) {
  const name = String(props.n || "").trim();
  if (!name || name === "Unnamed premises") return props.a || "Premises";
  return name;
}

function shopKicker(props) {
  if (props.s !== "Open") return "";
  if (props.group === "other") return "Open shop";
  return props.kind || "Open shop";
}

function statusPill(props) {
  if (props.s === "Open") return `<p class="status-pill status-pill--open">Open</p>`;
  if (props.s === "Vacant") return `<p class="status-pill status-pill--empty">Empty, listed for rent or sale</p>`;
  return `<p class="status-pill status-pill--closed">Closed in the Madrid census</p>`;
}

function locationRow(barrio, city) {
  const place = [barrio, city].filter(Boolean).join(", ");
  if (!place) return "";
  return `<p class="pin-row">${PIN_ICON}<span>${escapeHtml(place)}</span></p>`;
}

function visitReasonHtml(props) {
  const text = visitReason(props);
  if (!text) return "";
  const insight = /unproven|crowded|weaker than/i.test(text);
  return `<p class="visit-reason${insight ? " visit-reason--insight" : ""}">${escapeHtml(text)}</p>`;
}

function censusLineIcon(line) {
  if (/open premises per km²/i.test(line)) return "store";
  if (/already open/i.test(line)) return "chart";
  if (/empty premises|closed premises/i.test(line)) return "door";
  if (/residents/i.test(line)) return "users";
  if (/income/i.test(line)) return "wallet";
  if (/Mean age/i.test(line)) return "user";
  if (/metro|departures|bus stops/i.test(line)) return "train";
  if (/floor area/i.test(line)) return "building";
  if (/traffic/i.test(line)) return "footprints";
  return "mapPin";
}

function listingStatsTags(detail) {
  const stats = detail.stats;
  if (!stats) return "";
  const tags = Object.values(stats)
    .map((row) => (typeof row === "string" ? row : row?.text))
    .filter(Boolean);
  if (!tags.length) return "";
  return `<div class="lead-stat-tags">${tags.map((tag) => `<span class="lead-stat-tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function rankingSkeletonHtml(count = 5) {
  return Array.from({ length: count }, () => `<li class="rank-skeleton" aria-hidden="true"><span class="rank-skeleton__num"></span><span class="rank-skeleton__line"></span><span class="rank-skeleton__line rank-skeleton__line--short"></span></li>`).join("");
}

function setRankingsLoading(loading) {
  if (!areaRanking || !listingRanking) return;
  areaRanking.classList.toggle("ranking--skeleton", loading);
  listingRanking.classList.toggle("ranking--skeleton", loading);
  areaRanking.setAttribute("aria-busy", loading ? "true" : "false");
  listingRanking.setAttribute("aria-busy", loading ? "true" : "false");
  if (loading) {
    areaRanking.innerHTML = rankingSkeletonHtml(6);
    listingRanking.innerHTML = rankingSkeletonHtml(5);
  }
}

function unitBlock(props) {
  if (props.s === "Open") {
    return `<p class="kicker">Unit</p><p class="unit-note">This door is already trading. It is a competitor, not a site.</p>`;
  }
  if (props.s === "Closed") {
    return `<p class="kicker">Unit</p><p class="unit-note">Closed in the Madrid census. That is not a confirmed letting.</p>`;
  }
  const activity = norm(props.e);
  const rent = activity.includes("lloguer");
  const sale = activity.includes("venda");
  const offer = rent && !sale ? "for rent" : sale && !rent ? "for sale" : "empty";
  return `<p class="kicker">Unit</p><p class="unit-note">Marked ${offer} in the Barcelona census. Confirm the asking rent and the square metres before a visit. Neither figure is on this map.</p>`;
}

function sectionHeading(title, tipLabel = title) {
  return `<div class="section-heading"><span class="kicker">${escapeHtml(title)}</span>${scoreTipHtml(tipLabel)}</div>`;
}

function partsHtml(parts) {
  if (!parts?.length) return "";
  return `<ul class="parts">${parts
    .map((part) => {
      const insight = /unproven|crowded|weaker/i.test(part.line || part.detail || "");
      const detailClass = insight ? "part-detail part-detail--insight" : "part-detail";
      return `<li><span class="part-label">${partIconHtml(part.label)}<span>${escapeHtml(part.label)}</span>${scoreTipHtml(part.label)}</span>${part.detail ? `<span class="${detailClass}">${escapeHtml(part.detail)}</span>` : ""}${scoreBarHtml(part.score, part.label)}</li>`;
    })
    .join("")}</ul>`;
}

function formatEuro(value) {
  const amount = Number(value);
  if (!amount) return "";
  return `€${formatNumber(amount)}`;
}

function opTagHtml(props, cls) {
  const rent = props?.op === "rent";
  return `<span class="${cls} ${cls}--${rent ? "rent" : "sale"}">${rent ? "For rent" : "For sale"}</span>`;
}

function listingPriceHtml(props, { variant = "hero", showPm2 = true, inlineSize = false } = {}) {
  const amount = props.p ? `${formatEuro(props.p)}${props.op === "rent" ? "/mo" : ""}` : formatEuro(props.p);
  const size = props.sz ? `${formatNumber(props.sz)} m²` : "";
  const pm2 = showPm2 && props.pm2 ? `${formatEuro(props.pm2)}/m²` : "";
  if (!amount && !size) return "";
  const variantClass = variant === "compact" ? " listing-price--compact" : " listing-price--hero";
  const pm2Html = pm2 ? `<span class="listing-price__pm2"> (${escapeHtml(pm2)})</span>` : "";
  if (variant === "compact" && inlineSize && size) {
    return `<div class="listing-price${variantClass}">
      <p class="listing-price__amount">${amount ? escapeHtml(amount) : ""}<span class="listing-price__size listing-price__size--inline">${size ? ` ${escapeHtml(size)}` : ""}</span></p>
    </div>`;
  }
  return `<div class="listing-price${variantClass}">
    ${amount ? `<p class="listing-price__amount">${escapeHtml(amount)}</p>` : ""}
    ${size || pm2 ? `<p class="listing-price__meta">${size ? `<span class="listing-price__size">${escapeHtml(size)}</span>` : ""}${pm2Html}</p>` : ""}
  </div>`;
}

function listingMatchesCity(props) {
  const city = cityOfId(props.i) || props.m || "Madrid";
  return state.city === "all" || city === state.city;
}

function collectRankableListings({ restrictToBounds = false } = {}) {
  const rows = [];
  const bounds = restrictToBounds && map?.getBounds ? map.getBounds() : null;
  for (const feature of state.listings) {
    const props = feature.properties;
    if (!listingMatchesCity(props)) continue;
    if (!passesListingFilters(props)) continue;
    if (bounds) {
      const [lon, lat] = feature.geometry.coordinates;
      if (!bounds.contains([lon, lat])) continue;
    }
    const area = state.areaById?.get(props.i);
    const city = cityOfId(props.i) || props.m || "Madrid";
    const score = listingFitScore(props);
    rows.push({
      kind: "listing",
      id: props.id,
      score,
      rank: listingRank(props),
      city,
      areaName: area?.properties?.name || props.n || "",
      props,
    });
  }
  return rows;
}

/** Short card title without address/neighbourhood: "Local en venta · Calle de Zamora". */
function listingShortTitle(props) {
  const raw = String(props.t || "").trim();
  const op = props.op === "rent" ? "alquiler" : "venta";
  const m = raw.match(/^(.*?)\s+en\s+(.*)$/i);
  const type = (m ? m[1] : raw || "Local").replace(/\s+en\s+(venta|alquiler)$/i, "");
  const drop = new Set([props.n, props.d, props.m, "Madrid", "Barcelona"].filter(Boolean).map((x) => String(x).trim().toLowerCase()));
  const parts = (m ? m[2] : "").split(",").map((x) => x.trim()).filter((x) => x && !drop.has(x.toLowerCase()) && !/^\d+[a-z]?$/i.test(x) && !/^s\/n$/i.test(x));
  const street = parts.find((x) => /^(calle|avenida|av\.|paseo|plaza|ronda|carrer|passeig|avinguda|pla[cç]a|via|travessera|gran|camino|carretera|glorieta|traves[ií]a|cuesta|rambla|costa|ctra)/i.test(x)) || "";
  return `${type} en ${op}${street ? ` · ${street}` : ""}`;
}

function listingPlaceLine(props) {
  const city = cityOfId(props.i) || props.m || "";
  return [props.n, props.d && props.d !== props.n ? props.d : "", city].filter(Boolean).join(", ");
}

function listingHeadline(props) {
  let title = String(props.t || props.a || "").trim();
  if (!title) {
    return String(props.n || props.d || "").trim() || "Commercial premises";
  }
  title = title.replace(/,?\s*Madrid\s*$/i, "").trim();
  const neighborhood = String(props.n || "").trim();
  const district = String(props.d || "").trim();
  if (neighborhood && title.endsWith(`, ${neighborhood}`)) {
    title = title.slice(0, -(neighborhood.length + 2)).trim();
  } else if (district && title.endsWith(`, ${district}`)) {
    title = title.slice(0, -(district.length + 2)).trim();
  }
  if (props.op === "sale" && /^Local en\s/i.test(title) && !/\bventa\b/i.test(title)) {
    title = title.replace(/^Local en\s/i, "Local en venta en ");
  }
  return title || neighborhood || district || "Commercial premises";
}

function formatTypology(raw) {
  if (!raw) return "";
  const text = String(raw).replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatListingStatus(raw) {
  const key = String(raw || "").trim().toLowerCase();
  const labels = {
    good: "Good condition",
    renew: "Needs renovation",
    newdevelopment: "New development",
  };
  return labels[key] || formatTypology(raw);
}

function displaySpecValue(value) {
  if (value == null) return "—";
  const text = String(value).trim();
  return text || "—";
}

function listingSpecRow(icon, label, value, { allowEmpty = false } = {}) {
  const text = value == null ? "" : String(value).trim();
  if (!text && !allowEmpty) return null;
  return { icon, label, value: allowEmpty ? displaySpecValue(value) : text };
}

function normSpecValue(value) {
  return norm(String(value || "").replace(/[€\s]/g, ""));
}

function rowValueSet(rows) {
  return new Set(rows.map((row) => `${norm(row.label)}:${normSpecValue(row.value)}`));
}

function basicsLineToRow(line) {
  const text = String(line || "").trim();
  if (!text) return null;
  const rules = [
    { re: /^property price:\s*(.+)$/i, icon: "euro", label: "Listing price" },
    { re: /^price per m²:\s*(.+)$/i, icon: "euro", label: "Price per m²" },
    { re: /^(\d[\d.,]*)\s*m²/i, icon: "building", label: "Surface", value: (m) => m[0] },
    { re: /^second hand/i, icon: "sparkles", label: "Condition" },
    { re: /^energy performance certificate/i, icon: "wind", label: "Energy certificate" },
    { re: /^consumption:/i, icon: "wind", label: "Energy consumption" },
    { re: /^emissions:/i, icon: "wind", label: "Energy emissions" },
    { re: /^(\d+)\s*show windows?/i, icon: "store", label: "Show windows", value: (m) => m[1] },
    { re: /^built in (\d{4})/i, icon: "building", label: "Year built", value: (m) => m[1] },
    { re: /^(\d+)\s*floors?$/i, icon: "layers", label: "Floors", value: (m) => m[1] },
    { re: /^(second hand|good condition|needs renovation|new development)/i, icon: "sparkles", label: "Condition" },
    { re: /^layout\s+/i, icon: "layers", label: "Layout" },
    { re: /^(\d+)\s*toilets? or bathrooms?/i, icon: "bath", label: "Toilets / bathrooms", value: (m) => m[1] },
    { re: /^located in the street|a pie de calle/i, icon: "store", label: "Street front", value: () => "Yes" },
    { re: /^on the corner/i, icon: "mapPin", label: "Corner unit", value: () => "Yes" },
    { re: /^(\d+)\s*show windows?/i, icon: "store", label: "Show windows", value: (m) => m[1] },
    { re: /^commercial activity:\s*(.+)$/i, icon: "store", label: "Commercial activity", value: (m) => m[1] },
    { re: /^ground floor/i, icon: "layers", label: "Floor level", value: () => "Ground floor" },
    { re: /^heating$/i, icon: "wind", label: "Heating", value: () => "Yes" },
    { re: /^air conditioning$/i, icon: "wind", label: "Air conditioning", value: () => "Yes" },
    { re: /^storeroom|archive/i, icon: "building", label: "Storeroom", value: () => "Yes" },
    { re: /^security door/i, icon: "door", label: "Security door", value: () => "Yes" },
    { re: /^exempt property/i, icon: "badge", label: "Tax status", value: () => "Exempt property" },
  ];
  for (const rule of rules) {
    const match = text.match(rule.re);
    if (!match) continue;
    const value = rule.value ? rule.value(match) : text;
    return listingSpecRow(rule.icon, rule.label, value);
  }
  if (/^floor$/i.test(text) || /^bj$/i.test(text)) return null;
  return listingSpecRow("fileText", "Detail", text);
}

function rowsFromBasics(basics, existingRows) {
  const seen = rowValueSet(existingRows);
  const rows = [];
  for (const line of basics || []) {
    const row = basicsLineToRow(line);
    if (!row) continue;
    const key = `${norm(row.label)}:${normSpecValue(row.value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

const BASICS_SKIP_RE = /^(property price:|price per m²:)/i;

function formatIdealistaFieldKey(key) {
  const text = String(key || "")
    .replace(/^moreCharacteristics\./, "")
    .replace(/^card\./, "Card · ")
    .replace(/^features\./, "Feature · ")
    .replace(/^detailedType\./, "Type · ")
    .replace(/^characteristics\./, "Characteristic · ")
    .replace(/^comments\./, "Comment · ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._]/g, " · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function idealistaFieldRows(detail, { showEmpty = false } = {}) {
  const bag = detail.idealista;
  if (!bag || typeof bag !== "object") return [];
  return Object.keys(bag)
    .sort()
    .map((key) => listingSpecRow("fileText", formatIdealistaFieldKey(key), bag[key], { allowEmpty: showEmpty }));
}

function basicsCharacteristicRows(detail, { showEmpty = false } = {}) {
  const rows = [];
  const seen = new Set();
  for (const line of detail.basics || []) {
    const text = String(line || "").trim();
    if (!text || BASICS_SKIP_RE.test(text)) continue;
    const parsed = basicsLineToRow(text);
    const row = parsed
      ? listingSpecRow(parsed.icon, parsed.label, parsed.value, { allowEmpty: showEmpty })
      : listingSpecRow("fileText", "Characteristic", text, { allowEmpty: true });
    if (!row) continue;
    const key = `${norm(row.label)}:${normSpecValue(row.value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

function listingSpecSections(detail, props, { showEmpty = false } = {}) {
  const row = (icon, label, value) => listingSpecRow(icon, label, value, { allowEmpty: showEmpty });
  const characteristicRows = [...basicsCharacteristicRows(detail, { showEmpty }), ...idealistaFieldRows(detail, { showEmpty })];

  const premiseGroups = [
    {
      title: "Layout",
      rows: [
        row("building", "Built area", props.sz ? `${formatNumber(props.sz)} m²` : ""),
        row("layers", "Floor", detail.floor),
        row("bath", "Bathrooms", detail.bath),
        row("building", "Property type", detail.typology ? formatTypology(detail.typology) : ""),
        row("store", "Street front", detail.ubic),
      ].filter(Boolean),
    },
    {
      title: "Condition & listing",
      rows: [
        row("sparkles", "Condition", detail.status ? formatListingStatus(detail.status) : ""),
        row("sparkles", "New listing", detail.newProp ? "Yes" : ""),
        row("building", "New development", detail.newDev ? "Yes" : ""),
        row("chart", "Photos on Idealista", detail.photos ? formatNumber(detail.photos) : ""),
        row("chart", "Idealista labels", detail.labels?.length ? detail.labels.join(" · ") : ""),
        row("fileText", "Reference", detail.ref),
        row("chart", "Listing updated", detail.modified),
        row(
          "euro",
          "Price drop",
          detail.priceDropPct != null
            ? `${detail.priceDropPct}%${detail.priceDropVal ? ` (−${formatEuro(detail.priceDropVal)})` : ""}`
            : "",
        ),
        row("euro", "Price drop date", detail.dropDate),
      ].filter(Boolean),
    },
    {
      title: "Features",
      rows: [
        row("badge", "Business transfer", detail.transfer ? "Included" : ""),
        row("wind", "Air conditioning", detail.ac ? "Yes" : ""),
      ].filter(Boolean),
    },
    {
      title: "Idealista characteristics",
      rows: characteristicRows.length ? characteristicRows : showEmpty ? [row("fileText", "Characteristics", "")] : [],
    },
  ].filter((group) => group.rows.length);

  const contact = [
    row("store", "Agency", detail.agency),
    row("user", "Contact", detail.contactName),
    row("phone", "Phone", detail.phone),
    row("user", "Seller type", detail.userType ? (detail.userType === "private" ? "Private" : "Professional") : ""),
  ].filter(Boolean);

  const sections = [];
  if (premiseGroups.length) sections.push({ title: "Premises", icon: "building", groups: premiseGroups });
  if (contact.length) sections.push({ title: "Contact", icon: "phone", rows: contact });
  return sections;
}

function renderSpecRows(rows) {
  return rows
    .map(
      (row) =>
        `<div class="listing-spec-item">${iconSvg(row.icon, "ui-icon ui-icon--spec")}<div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div></div>`,
    )
    .join("");
}

function fitScoreRowHtml(label, score, featured = false) {
  return `<div class="fit-score-row${featured ? " fit-score-row--overall" : ""}">
    <span class="fit-score-row__label">${escapeHtml(label)}</span>
    ${scoreBarHtml(score, label, true, featured)}
  </div>`;
}

function modalFitSectionHtml(areaProps, concept) {
  if (!areaProps) {
    return `<div class="visit-live fit-subsection"><p class="live-note">No barrio score for this pin yet.</p></div>`;
  }
  const overall = areaProps.score;
  return `<section class="modal-section modal-fit-score">
    <h3 class="fit-score-title">Fit for ${escapeHtml(concept)}</h3>
    <div class="fit-score-stack">
      <div class="fit-score-neighborhood">${fitScoreRowHtml("Neighborhood score", areaProps.score)}</div>
      <div class="fit-score-proximity"><span class="fit-score-row__label">Proximity score</span><p class="live-note">Loads with the 10-minute walk around this door…</p></div>
      <div class="fit-score-overall">${fitScoreRowHtml("Overall fit", overall, true)}</div>
    </div>
    <div class="fit-area-parts">${partsHtml(areaProps.parts)}</div>
    <div class="visit-live fit-subsection fit-subsection--walk"><p class="live-note">Drawing the 10-minute walk…</p></div>
  </section>`;
}

function refreshFitScoresUi(areaScore, walkScore) {
  const ring = detailModalBody.querySelector(".lfit__ring");
  if (ring && Number.isFinite(walkScore)) {
    const activeProps = state.listings.find((f) => f.properties.id === state.activeListingId)?.properties;
    const concept = (state.query?.label || "").toLowerCase();
    ring.innerHTML = activeProps ? listingRankRingHtml(activeProps, concept) : fitRingHtml(combinedFitScore(areaScore, walkScore), "neighbourhood + 10-min walk");
    const calc = detailModalBody.querySelector("#score-calc");
    const ap = activeProps && state.areaById?.get(activeProps.i)?.properties;
    if (calc && ap) calc.innerHTML = scoreCalcHtml(activeProps, ap);
    const rawEl = detailModalBody.querySelector('[data-sub="raw"] b');
    if (rawEl) rawEl.textContent = combinedFitScore(areaScore, walkScore);
    const sub = detailModalBody.querySelector('[data-sub="walk"]');
    if (sub) sub.textContent = Math.round(walkScore);
  }
  const weq = detailModalBody.querySelector(".weq");
  if (weq && Number.isFinite(walkScore)) weq.innerHTML = walkEquationHtml(areaScore, walkScore);
  const proxEl = detailModalBody.querySelector(".fit-score-proximity");
  const overallEl = detailModalBody.querySelector(".fit-score-overall");
  if (proxEl && Number.isFinite(walkScore)) {
    proxEl.innerHTML = fitScoreRowHtml("Proximity score", walkScore);
  }
  if (overallEl && Number.isFinite(walkScore)) {
    overallEl.innerHTML = fitScoreRowHtml("Overall fit", combinedFitScore(areaScore, walkScore), true);
  }
}

function nearbyCompetitorScore(nearby) {
  if (!Number.isFinite(nearby?.count)) return 50;
  return Math.max(8, Math.min(92, Math.round(100 - nearby.count * 7.5)));
}

/* Bayesian average: rating pulled toward the local mean by M phantom reviews. */
const BAYES_M = 20;
function bayesPrior(places) {
  const rated = places.filter((p) => p.rating && p.reviews);
  const n = rated.reduce((s, p) => s + p.reviews, 0);
  return n ? rated.reduce((s, p) => s + p.rating * p.reviews, 0) / n : 4;
}
function bayesRating(p, prior) {
  const v = p.reviews || 0;
  return p.rating ? (v * p.rating + BAYES_M * prior) / (v + BAYES_M) : 0;
}

function nearbyPlacesBlock(nearby) {
  if (!Number.isFinite(nearby?.count)) return "";
  const noun = nearby.count === 1 ? "similar business" : "similar businesses";
  const avg = nearby.rating ? ` <span class="near-avg">avg ${nearby.rating}★</span>` : "";
  const tip = infoTip("Businesses on Google Maps whose main category matches this one, within 400 m (about a 5-minute walk). Sorted by a review-weighted rating: each rating is blended with the local average as if it had 20 extra average reviews, so a 4.8★ with 900 reviews beats a 5.0★ with 3. Click one to open its Google Maps profile.");
  const prior = bayesPrior(nearby.places || []);
  const places = (nearby.places?.length ? nearby.places : (nearby.names || []).map((name) => ({ name })))
    .slice().sort((a, b) => bayesRating(b, prior) - bayesRating(a, prior));
  const chip = (p) => {
    const meta = [p.rating ? `★ ${p.rating.toFixed(1)}` : "", p.reviews ? `${formatNumber(p.reviews)}` : "", p.price ? "€".repeat(p.price) : ""].filter(Boolean);
    const href = p.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`;
    return `<a class="pchip" data-leave="${escapeHtml(p.name)}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(p.name)}${p.reviews ? ` · ${p.reviews} Google reviews` : ""}"><span class="pchip__n">${escapeHtml(p.name)}</span>${meta.length ? `<span class="pchip__m">${meta.map((m, i) => i === 1 ? `<span class="pchip__r">(${m})</span>` : `<span>${m}</span>`).join("")}</span>` : ""}</a>`;
  };
  return `<div class="near-block"><p class="near-line"><b>${formatNumber(nearby.count)}</b> ${noun} within 400 m${avg}${tip}</p>
    ${places.length ? `<div class="pchips">${places.slice(0, 3).map(chip).join("")}${places.length > 3 ? `<span class="pchips__extra" hidden>${places.slice(3, 15).map(chip).join("")}</span><button type="button" class="pchips__toggle" data-chips-toggle aria-expanded="false" data-more="+${Math.min(12, places.length - 3)} more">+${Math.min(12, places.length - 3)} more</button>` : ""}</div>` : ""}
    <div class="leave-confirm" role="dialog" aria-live="polite" hidden><span></span><button type="button" class="leave-confirm__go">Open</button><button type="button" class="leave-confirm__no">Cancel</button></div></div>`;
}

function walkBreakdownHtml(scored, nearby) {
  const city = scored.city || "the city";
  const rows = scored.parts.map((p) => wvRowHtml({ name: p.label, tip: p.tip, dir: p.dir, pct: p.pct, city, small: p.detail })).join("");
  return `${nearbyPlacesBlock(nearby)}<div class="walk-factors"><h4 class="wv-group__h">${iconSvg("footprints", "ui-icon")}Walk factors</h4>
    <div class="wv-scale"><span>Lowest in ${escapeHtml(city)}</span>${infoTip(`Each dot compares this 10-minute walk with the area around every ${city} listing (per km², so bigger walks don't win just by being bigger). Green = better for this business.`)}<span>Highest</span></div>
    <ul class="wv-list wv-list--walk">${rows}</ul></div>`;
}

function listingSpecsHtml(detail, props, options = {}) {
  const sections = listingSpecSections(detail, props, options);
  if (!sections.length) return "";
  return sections
    .map((section) => {
      const body = section.groups
        ? section.groups
            .map(
              (group) => `<div class="listing-spec-subsection">
        <h4 class="listing-spec-subsection__title">${escapeHtml(group.title)}</h4>
        <dl class="listing-specs listing-specs--cols">${renderSpecRows(group.rows)}</dl>
      </div>`,
            )
            .join("")
        : `<dl class="listing-specs listing-specs--cols">${renderSpecRows(section.rows)}</dl>`;
      return `<section class="listing-spec-section">
      <h3 class="listing-spec-section__title">${iconSvg(section.icon, "ui-icon ui-icon--section")}<span>${escapeHtml(section.title)}</span></h3>
      ${body}
    </section>`;
    })
    .join("");
}

function listingDescriptionHtml(desc) {
  const text = String(desc || "").replace(/\r\n/g, "\n");
  if (!text.trim()) return "";
  return `<div class="listing-copy">${sectionHeading("Description", "Listing text from Idealista")}<div class="listing-desc listing-desc--full">${escapeHtml(text)}</div></div>`;
}

function idealistaBadge(url) {
  if (!url) return "";
  return `<a class="idealista-badge" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="See on Idealista">
    <img src="assets/idealista.png" alt="" width="32" height="32" />
  </a>`;
}

function idealistaLink(url, label = "See on Idealista") {
  if (!url) return "";
  return `<a class="idealista-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
    <img class="idealista-link__logo" src="assets/idealista.png" alt="" width="28" height="28" />
    <span>${escapeHtml(label)}</span>
  </a>`;
}

function openDetailModal(html) {
  detailModalBody.innerHTML = html;
  detailModal.hidden = false;
  document.body.classList.add("has-modal");
}

bindDealCalculator(detailModalBody);

detailModalBody.addEventListener("click", (event) => {
  const nav = event.target.closest(".lhero__nav");
  if (nav) {
    const thumbs = [...detailModalBody.querySelectorAll(".modal-thumb-btn")];
    const cur = thumbs.findIndex((n) => n.classList.contains("is-active"));
    const next = thumbs[(cur + Number(nav.dataset.step) + thumbs.length) % thumbs.length];
    next?.click();
    next?.scrollIntoView({ block: "nearest", inline: "center" });
    return;
  }
  const button = event.target.closest(".modal-thumb-btn");
  if (!button) return;
  const hero = detailModalBody.querySelector(".modal-hero > img");
  const src = button.dataset.image || button.querySelector("img")?.getAttribute("src");
  if (!hero || !src) return;
  if (hero.getAttribute("src") !== src) { hero.classList.add("is-loading"); hero.src = src; }
  hero.parentElement.style.setProperty("--hero-bg", `url("${src.replace(/"/g, "%22")}")`);
  detailModalBody.querySelectorAll(".modal-thumb-btn").forEach((node) => {
    node.classList.toggle("is-active", node === button);
  });
  const idx = detailModalBody.querySelector("[data-idx]");
  if (idx) idx.textContent = [...detailModalBody.querySelectorAll(".modal-thumb-btn")].indexOf(button) + 1;
  if (!button.closest(".lhero__strip")) hero.scrollIntoView({ block: "nearest", behavior: "smooth" });
});

function closeDetailModal() {
  detailModal.hidden = true;
  detailModalBody.innerHTML = "";
  document.body.classList.remove("has-modal");
  catchmentToken += 1;
  clearWalk();
}

function listingMediaTopBarHtml(props, detail) {
  return `<div class="modal-media__top">
    ${listingPriceHtml(props, { variant: "hero", showPm2: true })}
    ${listingEngagementTagsHtml(detail)}
  </div>`;
}

function listingMediaHtml(images, url, topBarHtml = "") {
  const badge = idealistaBadge(url);
  if (images.length) {
    const hero = `<div class="modal-hero">${badge}<img src="${escapeHtml(images[0])}" alt="" /></div>`;
    const gallery = images.length > 1
      ? `<div class="modal-thumbs" role="list">${images
          .map(
            (src, index) =>
              `<button type="button" class="modal-thumb-btn${index === 0 ? " is-active" : ""}" role="listitem" data-image="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></button>`,
          )
          .join("")}</div>`
      : "";
    return `<div class="modal-media">${topBarHtml}${hero}${gallery}</div>`;
  }
  return `<div class="modal-media">${topBarHtml}<div class="modal-hero modal-hero--placeholder" aria-hidden="true">${badge}${iconSvg("building", "modal-hero__icon")}</div></div>`;
}

/** Percentile (0–100) of `value` among same-city areas for a metric getter. Display only; scoring is untouched. */
function cityPercentile(areaProps, getter) {
  const value = getter(areaProps);
  if (!Number.isFinite(value)) return null;
  const pool = (state.areas?.features || [])
    .map((f) => f.properties)
    .filter((p) => p.city === areaProps.city)
    .map(getter)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return Math.round(rankValue(pool, value) * 100);
}

/** Plain words for a city percentile — describes the amount, not good/bad. */
function pctWords(pct, city) {
  if (pct == null) return "";
  if (pct >= 90) return `Among the highest in ${city}`;
  if (pct >= 70) return "Above average";
  if (pct >= 30) return "About average";
  if (pct >= 10) return "Below average";
  return `Among the lowest in ${city}`;
}

function infoTip(text) {
  return `<span class="score-tip" tabindex="0" aria-label="${escapeHtml(text)}"><span class="score-tip__mark" aria-hidden="true">i</span><span class="score-tip__bubble">${escapeHtml(text)}</span></span>`;
}

const WHY_GROUPS = [
  {
    title: "Demand", icon: "users",
    rows: [
      { part: () => scorePartLabel("foot"), name: "Foot traffic", tip: "Open shops and businesses per km² — a proxy for how many people walk past.", get: (p) => p.open_per_km2, fmt: (v) => `${formatNumber(Math.round(v))} /km²` },
      { part: () => scorePartLabel("popDensity"), name: "Residents nearby", tip: "People living per km² in this neighbourhood (municipal census).", get: (p) => p.pop_per_km2, fmt: (v) => `${formatNumber(Math.round(v))} /km²` },
      { part: () => scorePartLabel("income"), name: "Spending power", tip: "Average disposable income per person in this neighbourhood.", get: (p) => p.income_eur, fmt: (v) => `€${formatNumber(Math.round(v))} /person` },
    ],
  },
  {
    title: "Competition", icon: "store",
    rows: [
      { part: () => scorePartLabel("competitors"), name: "Rivals nearby", tip: "Open businesses of the same type in this neighbourhood. Fewer usually means less competition.", get: (p) => p.matches_per_km2, fmt: (v, p) => `${formatNumber(p.matches)} open · ${v.toFixed(1)} /km²`, invert: true },
      { part: () => scorePartLabel("pals"), name: "Helpful neighbours", tip: "Shops that bring the same customers (e.g. a café near a bakery).", get: (p) => p.complements_per_km2, fmt: (v, p) => `${formatNumber(p.complements)} · ${v.toFixed(1)} /km²` },
    ],
  },
  {
    title: "Access", icon: "train",
    rows: [
      { part: () => scorePartLabel("metro"), name: "Metro nearby", tip: "Metro and bus stops in this neighbourhood.", get: (p) => transitValue(p), fmt: (v, p) => `${formatNumber(p.metro_stops || 0)} metro · ${formatNumber(p.bus_stops || 0)} bus stops` },
      { part: () => null, name: "Road traffic", tip: () => trafficTip(), dir: () => trafficDir(), get: (p) => p.traffic_veh_h, fmt: (v) => `${formatNumber(Math.round(v))} veh/h measured`, line: (pct) => (pct >= 60 ? "Busier roads than most of the city" : "Quieter roads than most of the city") },
    ],
  },
  {
    title: "Supply", icon: "building",
    rows: [
      { part: () => scorePartLabel("retailFloor"), name: "Shop space nearby", tip: "Square metres of retail space per km² — how commercial the area is.", get: (p) => p.retail_per_km2, fmt: (v) => `${formatNumber(Math.round(v))} m²/km²` },
      { part: () => scorePartLabel("room"), name: "Empty shopfronts", tip: "Vacant or closed premises per km². A moderate amount is good — there is room to open and rents stay negotiable. Very high vacancy (the red end) usually means a street that is losing trade.", dir: () => "mid", get: (p) => p.vacant_per_km2, fmt: (v, p) => `${formatNumber(p.vacant)} · ${formatNumber(Math.round(v))} /km²` },
    ],
  },
];

/* Road traffic: drive-to formats (supermarkets like Aldi, gyms, big-box retail, fast food) want passing cars;
 * walk-in formats (café, bakery, salon, clinic) do best on moderate traffic — very busy roads mean noise and fewer people on foot. */
const TRAFFIC_UP = new Set(["grocery", "gym", "fashion", "food", "pharmacy"]);
function trafficDir() {
  const id = state.tenant?.concept || state.query?.id;
  return TRAFFIC_UP.has(id) || state.tenant?.retail ? "up" : "mid";
}
function trafficTip() {
  const who = state.tenant?.name || state.query?.label || "this business";
  return trafficDir() === "up"
    ? `Measured vehicles per hour on nearby roads. For ${who} more is better: a drive-to format needs passing cars and easy car access (green = busy).`
    : `Measured vehicles per hour on nearby roads. For ${who} a moderate amount is best: customers arrive on foot, and very busy roads (red end) mean noise and fewer people walking past. Not part of the score.`;
}

function wvRowHtml({ name, tip, dir, pct, city, small }) {
  const p = Math.max(2, Math.min(98, pct ?? 50));
  const words = pctWords(pct, city);
  return `<li class="wv">
    <span class="wv__name">${escapeHtml(name)}${tip ? infoTip(tip) : ""}</span>
    <span class="wv__track wv__track--${dir}" role="img" aria-label="${escapeHtml(name)}: ${escapeHtml(words)}"><i style="left:${p}%"></i></span>
    <span class="wv__val"><b>${escapeHtml(words)}</b><small>${escapeHtml(small || "")}</small></span>
  </li>`;
}

function whyRowHtml(row, areaProps) {
  const value = row.get(areaProps);
  if (!Number.isFinite(value)) return "";
  const pct = cityPercentile(areaProps, row.get);
  const dir = row.dir ? row.dir() : row.neutral ? "neutral" : row.invert ? "down" : "up";
  const tip = typeof row.tip === "function" ? row.tip() : row.tip;
  return wvRowHtml({ name: row.name, tip, dir, pct, city: areaProps.city, small: row.fmt(value, areaProps) });
}

function whyReasons(areaProps) {
  const byValue = (areaProps.parts || []).slice().sort((a, b) => b.value - a.value);
  const strengths = byValue.filter((p) => p.value >= 0.5).slice(0, 3);
  const watch = byValue.slice().reverse().filter((p) => p.value < 0.4 && !/balanced|average|typical/i.test(p.line || "")).slice(0, 2);
  return { strengths, watch };
}

function whyScoreHtml(areaProps) {
  const { strengths, watch } = whyReasons(areaProps);
  const li = (p, kind) => `<li class="reason reason--${kind}"><span class="reason__ico" aria-hidden="true">${kind === "good" ? "✓" : "!"}</span><span>${escapeHtml(p.line || p.label)}</span></li>`;
  const reasons = [...strengths.map((p) => li(p, "good")), ...watch.map((p) => li(p, "bad"))].join("")
    || `<li class="reason"><span class="reason__ico">·</span><span>Nothing stands out either way for this business type.</span></li>`;
  const groups = WHY_GROUPS.map((g) => {
    const rows = g.rows.map((r) => whyRowHtml(r, areaProps)).join("");
    return rows ? `<div class="wv-group"><h4 class="wv-group__h">${iconSvg(g.icon, "ui-icon")}${g.title}</h4><ul class="wv-list">${rows}</ul></div>` : "";
  }).join("");
  return `<ul class="reasons">${reasons}</ul>
    <details class="flat-more"><summary>Show all factors</summary>
      <div class="wv-scale"><span>Lowest in ${escapeHtml(areaProps.city)}</span>${infoTip(`Each dot places ${areaProps.name} among all ${areaProps.city} neighbourhoods. Green = better for this business, red = worse. Two-sided bars (green in the middle-left) mean a moderate amount is best.`)}<span>Highest</span></div>
      <div class="wv-groups">${groups}</div></details>`;
}

function listingRankRingHtml(props, concept) {
  const r = listingRank(props);
  return fitRingHtml(r.pct, `for ${concept}`);
}

/* Colour-coded value helpers: 0–1 value → red / orange / green. */
function toneOf(v) { return v >= 0.6 ? "good" : v >= 0.4 ? "mid" : "bad"; }
function cbarHtml(v) {
  const w = Math.max(3, Math.min(100, Math.round((Number(v) || 0) * 100)));
  return `<span class="cbar cbar--${toneOf(v)}" aria-hidden="true"><i style="width:${w}%"></i></span>`;
}
function cnum(v, text) { return `<b class="tone tone--${toneOf(v)}">${text}</b>`; }

/** One calculation row: label, bar, value 0–100, share of the weight, points it adds. */
function cxRowHtml(label, line, v, share, cls = "") {
  return `<li class="cx ${cls}"><span class="cx__name">${escapeHtml(label)}${line ? `<small>${escapeHtml(line)}</small>` : ""}</span>${cbarHtml(v)}<span class="cx__v">${cnum(v, Math.round(v * 100))}</span><span class="cx__w">× ${Math.round(share * 100)}%</span><span class="cx__p">${cnum(v, (v * share * 100).toFixed(1))}</span></li>`;
}
const CX_HEAD = `<li class="cx cx--head" aria-hidden="true"><span class="cx__name"></span><span></span><span class="cx__v"><span class="hl">Value</span><span class="hs">Val</span></span><span class="cx__w"><span class="hl">Weight</span><span class="hs">Wt</span></span><span class="cx__p"><span class="hl">Points</span><span class="hs">Pts</span></span></li>`;

/** How a barrio's 0–100 score is built: weighted sub-factors → rival penalty → spread to 0–100. */
function areaCalcHtml(a) {
  const c = a?.calc;
  const parts = a?.parts || [];
  if (!c || !parts.length || !c.weight) return "";
  const rows = parts.map((p) => cxRowHtml(p.label.replace(/ per km²$/, ""), p.line, p.value, p.weight / c.weight)).join("");
  const mid = Math.round(c.unitMix * 1000) / 10;
  const after = Math.round(c.unit * 1000) / 10;
  const steps = [`<li class="cx cx--sum"><span class="cx__name">Weighted average</span>${cbarHtml(c.unitMix)}<span></span><span></span><span class="cx__p">${cnum(c.unitMix, mid.toFixed(1))}</span></li>`];
  if (c.penalty < 0.995) steps.push(`<li class="cx cx--step"><span class="cx__name">Crowded with rivals<small>Many same-type businesses already here, so the average is cut</small></span>${cbarHtml(c.unit)}<span></span><span class="cx__w cx__w--bad">× ${c.penalty.toFixed(2)}</span><span class="cx__p">${cnum(c.unit, after.toFixed(1))}</span></li>`);
  steps.push(`<li class="cx cx--step cx--final"><span class="cx__name">Spread to 0–100<small>50 + (${after.toFixed(1)} − 50) × 1.55, kept between 4 and 96, so barrios separate</small></span>${cbarHtml(a.score / 100)}<span></span><span></span><span class="cx__p">${cnum(a.score / 100, a.score)}</span></li>`);
  return `<ul class="cx-list cx-list--sub">${CX_HEAD}${rows}${steps.join("")}</ul>`;
}

const MICRO_LABELS = { foot: ["Passing trade", "open shops in the 300 m"], pals: ["Helpful neighbours", "shops that share customers"], gap: ["Few same-type rivals", "fewer rivals scores higher"], health: ["Few empty units", "share of closed premises"], income: ["Local spending power", "household income in this census section (INE)"], daytime: ["Daytime crowd", "offices and schools within 400 m (OpenStreetMap)"] };

/** Exact, step-by-step calculation of this listing's score and rank — the same numbers score.js ranked with. */
function scoreCalcHtml(props, areaProps) {
  const r = listingRank(props);
  const head = `<div class="calc__head"><h4>How this score is calculated</h4><button type="button" class="calc__x" data-open-calc aria-label="Close">×</button></div>`;
  if (!r.parts?.length) return `${head}<p>Scores are still loading.</p>`;
  const more = (p) => {
    if (p.id === "area" && areaProps?.calc) return `<details class="cx-more"><summary>Why ${escapeHtml(areaProps.name)} scores ${areaProps.score}</summary>${areaCalcHtml(areaProps)}</details>`;
    if (p.id === "micro" && p.sub && p.subW) {
      const tot = Object.values(p.subW).reduce((s, w) => s + w, 0) || 1;
      const rows = Object.keys(p.subW).map((k) => cxRowHtml(MICRO_LABELS[k]?.[0] || k, MICRO_LABELS[k]?.[1], p.sub[k], p.subW[k] / tot)).join("");
      return `<details class="cx-more"><summary>What makes up the block score</summary><ul class="cx-list cx-list--sub">${CX_HEAD}${rows}<li class="cx cx--sum"><span class="cx__name">Block score</span>${cbarHtml(p.value)}<span></span><span></span><span class="cx__p">${cnum(p.value, (p.value * 100).toFixed(1))}</span></li></ul></details>`;
    }
    if (p.id === "unit" && p.pieces?.length) {
      const rows = p.pieces.map((x) => cxRowHtml(x.label, x.text, x.v, x.share)).join("");
      return `<details class="cx-more"><summary>Unit checks</summary><ul class="cx-list cx-list--sub">${CX_HEAD}${rows}</ul></details>`;
    }
    return "";
  };
  const rows = r.parts.map((p) => `${cxRowHtml(p.label, p.line, p.value, p.weight, "cx--main")}${more(p) ? `<li class="cx-sub">${more(p)}</li>` : ""}`).join("");
  const sum = `<li class="cx cx--sum"><span class="cx__name">Total</span>${cbarHtml(r.base / 100)}<span></span><span></span><span class="cx__p">${cnum(r.base / 100, r.base.toFixed(1))}</span></li>`;
  const tev = state.tenant ? state.tenantEval?.get(props.id) : null;
  const gate = r.gates.length && tev
    ? `<li><b>Hard requirement failed, then tenant blend</b><p>${escapeHtml(r.gates.join("; "))} → ${r.base.toFixed(1)} × ${PSScore.GATE_FACTOR}; then 60% of that + 40% × ${escapeHtml(state.tenant.name)} criteria ${tev.soft} = <b>${r.raw}</b></p></li>`
    : r.gates.length
    ? `<li><b>Hard requirement failed</b><p>${escapeHtml(r.gates.join("; "))} → × ${PSScore.GATE_FACTOR} = <b>${r.raw}</b></p></li>`
    : tev ? `<li><b>Tenant blend</b><p>60% × ${r.base.toFixed(1)} + 40% × ${escapeHtml(state.tenant.name)} criteria ${tev.soft} = <b>${r.raw}</b></p></li>`
    : `<li><b>Hard requirements</b><p>✓ None failed → <b>${r.raw}</b></p></li>`;
  const rank = `<li><b>Rank</b><div class="cx-rank">${cbarHtml(r.pct / 100)}<span>Beats ${cnum(r.pct / 100, `${r.pct}%`)} of ${formatNumber(r.n)} ${escapeHtml(r.group)}</span></div></li>`;
  return `${head}<ol class="calc__steps"><li><b>Four parts</b><ul class="cx-list">${CX_HEAD}${rows}${sum}</ul></li>${gate}${rank}</ol>`;
}

function listingFitHtml(areaProps, concept, props) {
  if (!areaProps) {
    return `<p class="empty-state">No neighbourhood data for this location yet, so there is no score to explain.</p><div class="visit-live fit-subsection--walk" hidden></div>`;
  }
  return `<section class="flat">
    <div class="lwhy__head">
      <button type="button" class="lfit__ring" data-open-calc aria-controls="score-calc" aria-expanded="false" title="How this score is calculated" data-area-score="${Number(areaProps.score) || 0}">${props ? listingRankRingHtml(props, concept) : fitRingHtml(areaProps.score, `for ${concept}`)}</button>

    </div>
    ${props ? `<div class="calc" id="score-calc" hidden>${scoreCalcHtml(props, areaProps)}</div>` : ""}
    ${whyScoreHtml(areaProps)}
  </section>
  <section class="flat">
    <h3 class="flat__h">Around this door${infoTip("A 10-minute walk from the entrance, drawn on the map in blue.")}</h3>
    <div class="visit-live fit-subsection--walk"><p class="live-note">Drawing the 10-minute walk…</p></div>
  </section>
  ${ageChartHtml(areaProps)}`;
}

function listingHeroHtml(images, url) {
  const badge = idealistaBadge(url);
  if (!images.length) {
    return `<div class="lhero lhero--empty">${badge}${iconSvg("building", "modal-hero__icon")}</div>`;
  }
  const nav = images.length > 1
    ? `<button type="button" class="lhero__nav lhero__nav--prev" data-step="-1" aria-label="Previous photo">‹</button><button type="button" class="lhero__nav lhero__nav--next" data-step="1" aria-label="Next photo">›</button><span class="lhero__count"><span data-idx>1</span> / ${images.length}</span>`
    : "";
  const dots = images.length > 1
    ? `<div class="lhero__strip">${images.map((src, i) => `<button type="button" class="modal-thumb-btn${i === 0 ? " is-active" : ""}" data-image="${escapeHtml(src)}"><img class="is-loading" src="${escapeHtml(src)}" alt="" loading="lazy" /></button>`).join("")}</div>`
    : "";
  return `<div class="lhero modal-hero" style="--hero-bg:url(&quot;${escapeHtml(images[0])}&quot;)">${badge}<img class="hero-img is-loading" src="${escapeHtml(images[0])}" alt="" />${nav}</div>${dots}`;
}

function listingModalContent(props) {
  const detail = props.x || {};
  const images = (detail.imgs?.length ? detail.imgs : detail.thumb ? [detail.thumb] : []).slice(0, 16);
  const location = listingPlaceLine(props);
  const feature = state.listingById.get(props.id);
  const coords = feature?.geometry?.coordinates;
  const area = state.areaById?.get(props.i);
  const areaProps = area?.properties;
  const concept = (state.query?.label || "your concept").toLowerCase();
  const di = props.op === "rent" ? null : dealInputs(props, coords, state.listings);
  const dm = di ? dealMath(di) : null;
  const pm2 = props.p && props.sz ? Math.round(props.p / props.sz) : null;
  const rank = areaProps ? listingRank(props) : null;
  const kpi = (label, value, tip, attr = "") => `<div class="lkpi"><span>${label}${tip ? infoTip(tip) : ""}</span><b ${attr}>${value}</b></div>`;
  const kpis = `<div class="lkpis">
    ${kpi(props.op === "rent" ? "Rent / month" : "Asking price", props.p ? formatEuro(props.p) : "—")}
    ${kpi("Per m²", pm2 ? `${formatNumber(pm2)} €` : "—", `Price divided by the ${props.sz ? formatNumber(props.sz) : ""} m² built area${props.op === "rent" ? " (monthly)" : ""}.`)}
    ${dm ? kpi("Est. net yield", dealFmtPct(dm.netYield), `${yieldTipText(di.region)} Open the Calculator tab to change the assumptions.`, `data-hero-yield style="color:${yieldTone(dm.netYield, di.region)}"`).replace("</b></div>", `</b><small class="lkpi__sub" data-hero-payback>${dealFmtYears(dm.payback)} payback</small></div>`) : kpi("Size", props.sz ? `${formatNumber(props.sz)} m²` : "—")}
    ${rank ? kpi("Rank", rank.top <= 50 ? `Top ${rank.top}%` : `Bottom ${Math.max(1, 100 - rank.top + 1)}%`, `Among ${formatNumber(rank.n)} ${rank.group} for ${concept}.`) : ""}
  </div>`;
  const outlier = listingOutlier(props);
  const tenantEv = state.tenant ? state.tenantEval?.get(props.id) : null;
  const pills = [
    opTagHtml(props, "status-pill"),
    /^nave\b/i.test(props.t || "") ? `<span class="status-pill">Warehouse (nave)</span>` : "",
    outlier ? `<span class="status-pill status-pill--warn" title="${escapeHtml(outlier)}">⚠ ${escapeHtml(outlier)}</span>` : "",
    props.inv?.price_drop_pct ? `<span class="status-pill status-pill--drop">▼ ${props.inv.price_drop_pct}% price cut</span>` : "",
    props.inv?.transfer ? `<span class="status-pill">Business transfer</span>` : "",
  ].join("");
  const tab = (id, label, on = false) => `<button type="button" role="tab"${on ? ' class="is-on"' : ""} aria-selected="${on}" data-sec="${id}">${label}</button>`;
  return `<article class="modal-listing modal-listing--v2 modal-listing--v3" id="detail-modal-title">
    <header class="lhead">
      <div class="lhead__text">
        <div class="tag-row">${pills}</div>
        <h2>${escapeHtml(listingShortTitle(props))}</h2>
        ${location ? `<p class="pin-row">${PIN_ICON}<span>${escapeHtml(location)}</span></p>` : ""}
      </div>
    </header>
    <div class="ltop">
      ${listingHeroHtml(images, props.u)}
      ${kpis}
    </div>
    <nav class="lnav" role="tablist" aria-label="Card sections">
      ${tab("sec-why", "Why", true)}
      ${tenantEv ? tab("sec-tenant", escapeHtml(state.tenant.name)) : ""}
      ${dm ? tab("sec-deal", "Calculator") : ""}
      ${tab("sec-details", "Details")}
    </nav>
    <div id="sec-why" class="lsec" role="tabpanel">${listingFitHtml(areaProps, concept, props)}</div>
    ${tenantEv ? `<div id="sec-tenant" class="lsec" role="tabpanel" hidden>${tenantChecksHtml(state.tenant, tenantEv, props.id)}</div>` : ""}
    ${dm ? `<div id="sec-deal" class="lsec" role="tabpanel" hidden>${dealCalculatorHtml(props, coords, state.listings)}</div>` : ""}
    <div id="sec-details" class="lsec" role="tabpanel" hidden>${listingDetailsTabHtml(props)}</div>
  </article>`;
}

/** Same premises posted by other agencies (merged in the build). */
function listingDupsHtml(props) {
  const d = props.dups || [];
  if (!d.length) return "";
  const rows = d.map((x) => `<li><a href="${escapeHtml(x.u || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.ag || "Another agency")}</a><span>${x.p ? `${formatNumber(x.p)} €` : ""}${x.sz ? ` · ${formatNumber(x.sz)} m²` : ""}</span></li>`).join("");
  return `<div class="od-box"><h4>Also listed by ${d.length} other ${d.length === 1 ? "agency" : "agencies"}</h4><p class="unit-note">Same premises (same spot, size and price) — shown once here.</p><ul class="od-list">${rows}</ul></div>`;
}

/** Facts around the door from open data: pedestrian counter, car parks, loading bays, census section. */
function listingOpenDataHtml(props) {
  const o = props.od;
  if (!o) return "";
  const rows = [];
  const fmt = (n) => formatNumber(Math.round(n));
  if (o.ped) rows.push(["Pedestrians", `${fmt(o.ped[0])} people/day`, `Madrid counter on ${o.ped[2]}, ${o.ped[1]} m away${o.ped[1] > 250 ? " (too far to score)" : ""}`]);
  if (o.pk) rows.push(["Public car parks", o.pk[0] ? `${o.pk[0]} within 300 m` : "None within 300 m", o.pk[0] ? `nearest ${o.pk[1]} m${o.pk[2] ? ` · ${fmt(o.pk[2])} spaces` : ""}` : "OpenStreetMap"]);
  if (o.ld) rows.push(["Loading bays", o.ld[1] != null ? `nearest ${o.ld[1]} m` : "None within 300 m", props.m === "Madrid" ? "Madrid city loading zones + OpenStreetMap" : "OpenStreetMap only (Barcelona data unavailable)"]);
  rows.push(["Daytime crowd", `${o.of || 0} offices · ${o.sc || 0} schools`, "within 400 m, OpenStreetMap"]);
  const s = o.sec;
  if (s) rows.push(["Census section", `${s.hinc ? `${fmt(s.hinc)} €/household` : "—"}`, [s.hh ? `${String(s.hh).replace(".", ",")} people/home` : "", s.age ? `average age ${String(s.age).replace(".", ",")}` : "", s.p65 != null ? `${String(s.p65).replace(".", ",")}% over 65` : "", `INE ${s.yr || ""}`].filter(Boolean).join(" · ")]);
  return `<div class="od-box"><h4>Around the door (open data)</h4><ul class="od-list">${rows.map(([k, v, n]) => `<li><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span><small>${escapeHtml(n)}</small></li>`).join("")}</ul></div>`;
}

function listingDetailsTabHtml(props) {
  const inv = props.inv && typeof props.inv === "object" ? props.inv : {};
  const parts = [listingDupsHtml(props), listingOpenDataHtml(props)];
  const desc = listingDescToggleHtml({ ...props, inv });
  if (desc) parts.push(desc);
  if (Object.keys(inv).length) {
    parts.push(listingFeaturesHtml(inv));
    parts.push(investorFieldsHtml({ ...props, inv }));
    parts.push(listingActivityHtml(inv));
  }
  const body = parts.filter((h) => /<(dd|li|div class="(listing-desc|od-box))/.test(h || "")).join("");
  if (!body) {
    return `<div class="empty-state"><b>No premises details for this listing</b><p>Idealista didn't publish characteristics or a description for it, or it hasn't been scraped in full yet.</p>${idealistaLink(props.u, "Check the ad on Idealista")}</div>`;
  }
  return body;
}

function cityAreaPool(p) {
  return (state.areas?.features || []).map((f) => f.properties).filter((x) => x.city === p.city && Number.isFinite(x.score) && x.score >= 0);
}

/** Radar of the barrio's sub-factors (0–100 among the city's barrios); dashed ring = city middle. */
function areaRadarHtml(parts) {
  if (!parts || parts.length < 3) return "";
  const n = parts.length, cx = 130, cy = 112, R = 78;
  const pt = (i, v) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)]; };
  const poly = (fn) => parts.map((p, i) => pt(i, fn(p)).map((x) => x.toFixed(1)).join(",")).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((g) => `<polygon points="${poly(() => g)}" class="radar__grid${g === 0.5 ? " radar__grid--mid" : ""}"/>`).join("");
  const axes = parts.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar__axis"/>`; }).join("");
  const labels = parts.map((p, i) => {
    const [x, y] = pt(i, 1.2);
    const anchor = x < cx - 8 ? "end" : x > cx + 8 ? "start" : "middle";
    const name = p.label.replace(/ nearby$/, "").replace(/^Helpful neighbours$/, "Helpful shops");
    return `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="${anchor}" class="radar__lbl radar__lbl--${toneOf(p.value)}">${escapeHtml(name)}</text>`;
  }).join("");
  const dots = parts.map((p, i) => { const [x, y] = pt(i, Math.max(0.04, p.value)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" class="radar__dot radar__dot--${toneOf(p.value)}"/>`; }).join("");
  return `<svg class="radar" viewBox="-34 0 328 224" role="img" aria-label="${escapeHtml(parts.map((p) => `${p.label} ${Math.round(p.value * 100)}`).join(", "))}">${grid}${axes}<polygon points="${poly((p) => Math.max(0.04, p.value))}" class="radar__shape"/>${dots}${labels}</svg>`;
}

/** Donut: other open shops, same-type rivals, closed premises. Hover a slice or legend row to highlight it. */
function shopsDonutHtml(p, concept) {
  const same = Math.max(0, p.matches || 0), open = Math.max(0, (p.open || 0) - same), closed = Math.max(0, p.vacant || 0);
  const tot = same + open + closed;
  if (!tot) return "";
  const Concept = concept[0].toUpperCase() + concept.slice(1);
  const segs = [
    { v: open, cls: "donut--open", name: "Other open shops" },
    { v: same, cls: "donut--same", name: `${Concept} (rivals)` },
    { v: closed, cls: "donut--closed", name: "Closed or empty" },
  ];
  const C = 2 * Math.PI * 40;
  const gap = 1.2;
  let off = 0;
  const pct = (v) => `${((100 * v) / tot).toFixed(v / tot < 0.1 ? 1 : 0)}%`;
  const arcs = segs.map((s, i) => {
    const len = Math.max(0.6, (C * s.v) / tot - gap);
    const out = `<circle r="40" cx="56" cy="56" data-i="${i}" data-n="${formatNumber(s.v)}" data-l="${escapeHtml(s.name)} · ${pct(s.v)}" class="donut__seg ${s.cls}" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"><title>${escapeHtml(s.name)}: ${formatNumber(s.v)} (${pct(s.v)})</title></circle>`;
    off += (C * s.v) / tot;
    return out;
  }).join("");
  return `<div class="donut pdonut" data-total="${formatNumber(tot)}">
    <div class="donut__fig"><svg viewBox="0 0 112 112" role="img" aria-label="Premises: ${segs.map((s) => `${s.name} ${s.v}`).join(", ")}"><g transform="rotate(-90 56 56)">${arcs}</g><text x="56" y="55" text-anchor="middle" class="donut__n">${formatNumber(tot)}</text><text x="56" y="69" text-anchor="middle" class="donut__s">premises</text></svg></div>
    <ul class="donut__legend">${segs.map((s, i) => `<li data-i="${i}" tabindex="0"><i class="${s.cls}"></i><span>${escapeHtml(s.name)}</span><b>${formatNumber(s.v)}</b><small>${pct(s.v)}</small></li>`).join("")}</ul></div>`;
}

function donutFocus(donut, i) {
  if (!donut) return;
  const n = donut.querySelector(".donut__n"), s = donut.querySelector(".donut__s");
  donut.querySelectorAll("[data-i]").forEach((el) => el.classList.toggle("is-on", i != null && el.dataset.i === String(i)));
  donut.classList.toggle("is-hover", i != null);
  const seg = i != null ? donut.querySelector(`.donut__seg[data-i="${i}"]`) : null;
  n.textContent = seg ? seg.dataset.n : donut.dataset.total;
  s.textContent = seg ? seg.dataset.l.split(" · ")[1] : "premises";
}
["pointerover", "focusin"].forEach((type) => document.addEventListener(type, (event) => {
  const el = event.target.closest?.(".pdonut [data-i]");
  const d = event.target.closest?.(".pdonut");
  if (d) donutFocus(d, el ? el.dataset.i : null);
}));
document.addEventListener("pointerout", (event) => {
  const d = event.target.closest?.(".pdonut");
  if (d && !d.contains(event.relatedTarget)) donutFocus(d, null);
});

/** This barrio vs the city: same dot-on-gradient rows as the walk factors, plus the raw value and × the median. */
function areaVsCityHtml(p) {
  const pool = cityAreaPool(p);
  const med = (get) => { const v = pool.map(get).filter(Number.isFinite).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
  const groups = WHY_GROUPS.map((g) => {
    const rows = g.rows.map((row) => {
      const v = row.get(p), m = med(row.get);
      if (!Number.isFinite(v)) return "";
      const ratio = m ? v / m : null;
      const rel = !ratio ? "" : ratio >= 1.1 ? ` · ${ratio.toFixed(1)}× avg` : ratio <= 0.9 ? ` · ${Math.round((1 - ratio) * 100)}% below avg` : " · ≈ avg";
      const dir = row.dir ? row.dir() : row.neutral ? "neutral" : row.invert ? "down" : "up";
      const tip = typeof row.tip === "function" ? row.tip() : row.tip;
      return wvRowHtml({ name: row.name, tip, dir, pct: cityPercentile(p, row.get), city: p.city, small: `${row.fmt(v, p)}${rel}` });
    }).join("");
    return rows ? `<div class="wv-group"><h4 class="wv-group__h">${iconSvg(g.icon, "ui-icon")}${g.title}</h4><ul class="wv-list">${rows}</ul></div>` : "";
  }).join("");
  return groups ? `<section class="flat"><h3 class="flat__h">Compared with ${escapeHtml(p.city)}${infoTip(`Each dot places ${p.name} among all ${p.city} neighbourhoods. Green = better for this business, red = worse; two-sided bars mean a moderate amount is best.`)}</h3>
    <div class="wv-scale"><span>Lowest in ${escapeHtml(p.city)}</span><span>Highest</span></div><div class="wv-groups">${groups}</div></section>` : "";
}

/** Small score ring for the walk equation. */
function miniRingHtml(v, label, cls = "") {
  const ok = Number.isFinite(v);
  const n = ok ? Math.round(v) : null;
  const c = 2 * Math.PI * 24;
  const col = ok ? `hsl(${Math.round(Math.max(0, Math.min(1, (n - 25) / 55)) * 125)} 58% 42%)` : "var(--track)";
  return `<div class="mring ${cls}"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="24" class="fit-ring__track"/>${ok ? `<circle cx="30" cy="30" r="24" class="fit-ring__fill" style="stroke:${col}" stroke-dasharray="${((n / 100) * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 30 30)"/>` : ""}<text x="30" y="35" text-anchor="middle" class="mring__n">${ok ? n : "…"}</text></svg><span>${escapeHtml(label)}</span></div>`;
}

function walkEquationHtml(areaScore, walkScore) {
  const both = Number.isFinite(walkScore);
  return `${miniRingHtml(areaScore, "Neighbourhood")}<b class="weq__op">+</b>${miniRingHtml(walkScore, "10-min walk")}<b class="weq__op">=</b>${miniRingHtml(both ? combinedFitScore(areaScore, walkScore) : null, "Overall", "mring--big")}`;
}

function areaModalContent(props) {
  const concept = (state.query?.label || "your concept").toLowerCase();
  const pool = cityAreaPool(props);
  const rank = 1 + pool.filter((x) => x.score > props.score).length;
  const top = pool.length ? Math.max(1, Math.round((100 * rank) / pool.length)) : null;
  const ok = Number.isFinite(props.score) && props.score >= 0;
  return `<article class="modal-area" id="detail-modal-title">
    <h2>${escapeHtml(props.name)}</h2>
    ${locationRow(props.district, props.city)}
    ${ok ? `<section class="ahero">
      <div class="ahero__ring">${fitRingHtml(props.score, `for ${concept}`)}</div>
      <div class="ahero__txt">
        <p class="ahero__rank"><b>#${rank}</b> of ${pool.length} ${escapeHtml(props.city)} neighbourhoods</p>
        <span class="cbar cbar--${toneOf(1 - (top || 50) / 100)} ahero__bar"><i style="width:${Math.max(3, 100 - (top || 50))}%"></i></span>
        <p class="ahero__top">${top ? `Top ${top}%` : ""}</p>
      </div>
    </section>
    <section class="flat">
      <h3 class="flat__h">What drives the score${infoTip("Each factor is where this neighbourhood ranks among the city's neighbourhoods, 0–100. The dashed ring is the middle of the city.")}</h3>
      <div class="adrive">${areaRadarHtml(props.parts)}<div class="adrive__calc">${areaCalcHtml(props)}</div></div>
    </section>` : `<p class="empty-state">No score for this neighbourhood yet.</p>`}
    <section class="flat"><h3 class="flat__h">Premises in ${escapeHtml(props.name)}</h3>${shopsDonutHtml(props, concept)}</section>
    ${areaVsCityHtml(props)}
    ${ageChartHtml(props)}
    <section class="flat">
      <h3 class="flat__h">10-minute walk from the centre${infoTip("The blue shape on the map is everywhere you can walk to in 10 minutes from the middle of this neighbourhood. Overall = the average of the neighbourhood score and the walk score.")}</h3>
      <div class="weq">${walkEquationHtml(props.score, null)}</div>
      <div class="visit-live fit-subsection fit-subsection--walk"><p class="live-note">Drawing the 10-minute walk…</p></div>
    </section>
  </article>`;
}

function openListingDetail(props, coordinates) {
  state.activeListingId = props.id || null;
  if (props.i) {
    setSelected(props.i);
    renderAreaRanking();
  }
  openDetailModal(listingModalContent(props));
  if (!props._full) {
    ensureListingDetail(props).then(() => {
      if (state.activeListingId !== props.id || !props._full) return;
      const fresh = document.createElement("div");
      fresh.innerHTML = listingModalContent(props);
      for (const sel of [".ltop", "#sec-details"]) {
        const now = detailModalBody.querySelector(sel);
        const next = fresh.querySelector(sel);
        if (now && next) now.replaceWith(next);
      }
    });
  }
  if (coordinates) {
    map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), 15), duration: 650 });
    showCatchment(coordinates[0], coordinates[1]);
  }
}

// Prefetch a listing's detail when the pointer or focus lands on its row, so the card opens complete.
["pointerover", "focusin"].forEach((type) => document.addEventListener(type, (event) => {
  const row = event.target.closest?.('[data-kind="listing"][data-id]');
  if (row) ensureListingDetail(state.listingById.get(row.dataset.id)?.properties);
}, { passive: true }));

function openListingById(id) {
  const feature = state.listingById.get(id);
  if (!feature) return;
  openListingDetail(feature.properties, feature.geometry.coordinates);
}

function openAreaDetail(props, coordinates) {
  openDetailModal(areaModalContent(props));
  if (coordinates) showCatchment(coordinates[0], coordinates[1]);
}

function listingDetailBody(props) {
  const detail = props.x || {};
  const images = (detail.imgs?.length ? detail.imgs : detail.thumb ? [detail.thumb] : []).slice(0, 9);
  const gallery = images.length
    ? `<div class="listing-gallery">${images.map((src) => `<img src="${escapeHtml(src)}" alt="" loading="lazy" />`).join("")}</div>`
    : "";
  const facts = [];
  if (props.sz) facts.push(`${formatNumber(props.sz)} m²`);
  if (detail.floor) facts.push(`Floor ${detail.floor}`);
  if (detail.bath) facts.push(`${detail.bath} bathroom${detail.bath === 1 ? "" : "s"}`);
  if (detail.photos) facts.push(`${formatNumber(detail.photos)} photos on Idealista`);
  if (detail.agency) facts.push(detail.agency);
  if (detail.ref) facts.push(`Ref. ${detail.ref}`);
  if (detail.ac) facts.push("Air conditioning");
  const factsHtml = facts.length ? `<ul class="listing-facts">${facts.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : "";
  const desc = detail.desc ? `<p class="listing-desc">${escapeHtml(detail.desc)}</p>` : "";
  return `${gallery}${factsHtml}${desc}${idealistaLink(props.u)}`;
}

function listingDetailBlock(props, { open = false } = {}) {
  const body = listingDetailBody(props);
  if (!body.trim()) return "";
  return `<details class="listing-details"${open ? " open" : ""}><summary>Listing details</summary>${body}</details>`;
}

function listingCard(props, { wrap = true } = {}) {
  const strip = "#4c1d95";
  const detail = props.x || {};
  const area = state.areaById?.get(props.i);
  const areaProps = area?.properties;
  const feature = state.listingById.get(props.id);
  const specsHtml = dealSummaryHtml(props, feature?.geometry?.coordinates, state.listings);
  const fitHtml = areaProps
    ? `<div class="card-fit">${fitRingHtml(areaProps.score, "area fit")}</div>`
    : `<p class="unit-note">No neighborhood score for this pin yet.</p>`;
  const inner = `
    <div class="tag-row">
      <span class="status-pill">Commercial premises</span>
      ${opTagHtml(props, "status-pill")}
      ${props.dups?.length ? `<span class="status-pill status-pill--dup">+${props.dups.length} other ${props.dups.length === 1 ? "agency" : "agencies"}</span>` : ""}
    </div>
    <h3>${escapeHtml(listingHeadline(props))}</h3>
    ${[props.n, props.d].filter(Boolean).length ? locationRow(props.n, props.d) : ""}
    ${listingPriceHtml(props, { variant: "compact", showPm2: true })}
    ${listingEngagementTagsHtml(detail)}
    ${fitHtml}
    ${specsHtml}
    <p class="unit-note">Click for photos and the full listing modal.</p>`;
  if (!wrap) return inner;
  return `<div class="place-card" style="--strip:${strip}">${inner}</div>`;
}

function shopCard(props, { wrap = true, pinned = false } = {}) {
  const strip = GROUP_COLORS[props.group] || GROUP_COLORS.other;
  const kicker = shopKicker(props);
  const activity = props.e ? `<p class="activity-line">${escapeHtml(props.e)}</p>` : "";
  const area = state.areaById?.get(props.i);
  const areaProps = area?.properties;
  const areaFit = areaProps
    ? `<p class="kicker">Area fit</p>${scoreBarHtml(areaProps.score, "Area fit")}${pinned ? partsHtml(areaProps.parts) : `<p class="unit-note">${escapeHtml(areaProps.lead || "")}</p>`}`
    : "";
  const live = pinned
    ? `<div class="visit-live"><p class="kicker">10-minute walk</p><p class="live-note">Drawing the walk from this door…</p></div>`
    : "";
  const inner = `
    ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
    ${statusPill(props)}
    <h3>${escapeHtml(shopTitle(props))}</h3>
    ${locationRow(props.b, props.y)}
    ${activity}
    ${unitBlock(props)}
    ${areaFit}
    ${live}`;
  if (!wrap) return inner;
  return `<div class="place-card" style="--strip:${strip}">${inner}</div>`;
}

const AGE_LABELS = ["0–14", "15–24", "25–44", "45–64", "65+"];
/** Age distribution mini bar chart, barrio vs city average. */
function ageChartHtml(p) {
  if (!p?.age_bands?.length) return "";
  const cityPool = (state.areas?.features || []).map((f) => f.properties).filter((x) => x.city === p.city && x.age_bands?.length);
  const avg = AGE_LABELS.map((_, i) => cityPool.reduce((s, x) => s + x.age_bands[i], 0) / (cityPool.length || 1));
  const ages = cityPool.map((x) => x.age_median).filter(Number.isFinite).sort((a, b) => a - b);
  const cityMed = ages.length ? ages[Math.floor(ages.length / 2)] : null;
  const bar = (vals, who) => {
    const tot = vals.reduce((a, b) => a + b, 0) || 1;
    return `<div class="agebar__row"><span class="agebar__who">${who}</span><div class="agebar" role="img" aria-label="${who}: ${vals.map((v, i) => `${AGE_LABELS[i]} ${Math.round(v)}%`).join(", ")}">${vals.map((v, i) => { const w = (100 * v) / tot; return `<span class="agebar__seg agebar__seg--${i}" style="width:${w.toFixed(1)}%" title="${AGE_LABELS[i]}: ${Math.round(v)}%">${w >= 9 ? `${Math.round(v)}%` : ""}</span>`; }).join("")}</div></div>`;
  };
  const diff = cityMed != null && p.age_median != null ? p.age_median - cityMed : null;
  const cmp = diff == null ? "" : Math.abs(diff) < 1.5 ? `about the ${escapeHtml(p.city)} norm` : `${Math.abs(Math.round(diff))} yrs ${diff > 0 ? "older" : "younger"} than ${escapeHtml(p.city)}`;
  return `<section class="flat agec2">
    <h3 class="flat__h">Who lives here${infoTip(`Share of residents by age, municipal census (Padrón) 2026 — ${p.city === "Barcelona" ? "Open Data BCN" : "datos.madrid.es"}.`)}</h3>
    <p class="agec2__head"><b>${p.age_median ?? "–"}</b> median age${cmp ? `<span>${cmp}</span>` : ""}</p>
    ${bar(p.age_bands, "Here")}${bar(avg, escapeHtml(p.city))}
    <div class="agebar__legend">${AGE_LABELS.map((l, i) => `<span><i class="agebar__seg--${i}"></i>${l}</span>`).join("")}</div>
  </section>`;
}

function censusBlock(lines) {
  if (!lines.length) return "";
  return `<p class="kicker census-kicker">${iconSvg("chart", "ui-icon ui-icon--kicker")}<span>Neighborhood totals</span></p>
    <ul class="card-lines card-lines--icons">${lines.map((line) => `<li>${iconSvg(censusLineIcon(line), "ui-icon ui-icon--line")}<span>${escapeHtml(line)}</span></li>`).join("")}</ul>`;
}

function areaCard(props, { wrap = true, pinned = false } = {}) {
  const lines = neighborhoodFitLines(props, state.query);
  const live = pinned
    ? `<div class="visit-live"><p class="kicker">10-minute walk</p><p class="live-note">Drawing the walk from the middle of this neighborhood…</p></div>`
    : "";
  const inner = `
    <h3>${escapeHtml(props.name)}</h3>
    ${locationRow(props.district, props.city)}
    ${visitReasonHtml(props)}
    <p class="kicker">Area fit</p>
    ${scoreBarHtml(props.score, "Area fit", false, true)}
    ${pinned ? partsHtml(props.parts) : ""}
    ${live}
    ${pinned ? censusBlock(lines) : ""}`;
  if (!wrap) return inner;
  return `<div class="area-card">${inner}</div>`;
}

let catchmentToken = 0;

function emptyCollection() {
  return { type: "FeatureCollection", features: [] };
}

function clearWalk() {
  if (map.getSource(MAP_SOURCES.walk)) map.getSource(MAP_SOURCES.walk).setData(emptyCollection());
}

function geometryPoint(geometry) {
  const ring = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0][0];
  const count = Math.max(1, ring.length - 1);
  let lon = 0;
  let lat = 0;
  for (let index = 0; index < count; index += 1) {
    lon += ring[index][0];
    lat += ring[index][1];
  }
  return [lon / count, lat / count];
}

function haversineMeters(lon1, lat1, lon2, lat2) {
  const toRad = Math.PI / 180;
  const p1 = lat1 * toRad;
  const p2 = lat2 * toRad;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(x, y, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return pointInRing(x, y, geometry.coordinates[0]);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((poly) => pointInRing(x, y, poly[0]));
  return false;
}

function geometryBBox(geometry) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      minX = Math.min(minX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxX = Math.max(maxX, coords[0]);
      maxY = Math.max(maxY, coords[1]);
      return;
    }
    coords.forEach(visit);
  };
  visit(geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

function bandScore(value, low, high, cap) {
  if (value <= low) return low <= 0 ? 1 : Math.max(0, value / low);
  if (!cap || value <= high) return 1;
  return Math.max(0, 1 - (value - high) / high);
}

function geometryAreaKm2(geometry) {
  const ringArea = (ring) => {
    const lat0 = (ring.reduce((s, c) => s + c[1], 0) / ring.length) * Math.PI / 180;
    const kx = 111.32 * Math.cos(lat0), ky = 110.57;
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] * kx) * (ring[i][1] * ky) - (ring[i][0] * kx) * (ring[j][1] * ky);
    return Math.abs(a / 2);
  };
  if (geometry.type === "Polygon") return ringArea(geometry.coordinates[0]);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.reduce((s, poly) => s + ringArea(poly[0]), 0);
  return 0;
}

/* Reference distribution for the walk factors: the same counts, per km², inside a 700 m circle
 * (≈ a 10-minute walk) around every for-sale/for-rent listing in the city (sampled to ≤400 points).
 * Each walk is then placed as a percentile against these, instead of fixed thresholds that saturated
 * at 0 or 100 in dense Madrid/Barcelona streets. Cached per city + business type. */
const walkRefCache = new Map();
let placeGrid = null;
const GRID = 0.01;
function walkReference(city, kind) {
  const key = `${city}|${kind}`;
  if (walkRefCache.has(key)) return walkRefCache.get(key);
  if (!placeGrid) {
    placeGrid = new Map();
    for (const row of state.places || []) {
      const k = `${Math.floor(row[0] / GRID)},${Math.floor(row[1] / GRID)}`;
      (placeGrid.get(k) || placeGrid.set(k, []).get(k)).push(row);
    }
  }
  const profile = PROFILES[kind] || PROFILES.bakery;
  const comp = new Set(profile.complements || []);
  const R = 700, areaKm2 = Math.PI * 0.7 * 0.7;
  const pts = (state.listings || []).filter((f) => cityOfId(f.properties.i) === city && f.geometry?.coordinates).map((f) => f.geometry.coordinates);
  const step = Math.max(1, Math.floor(pts.length / 400));
  const out = { open: [], match: [], pal: [], vac: [] };
  for (let n = 0; n < pts.length; n += step) {
    const [lon, lat] = pts[n];
    const gx = Math.floor(lon / GRID), gy = Math.floor(lat / GRID);
    let open = 0, vac = 0, closed = 0, match = 0, pal = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const row of placeGrid.get(`${gx + dx},${gy + dy}`) || []) {
        const d = haversineMeters(lon, lat, row[0], row[1]);
        if (d > R) continue;
        if (row[3] === "V") { vac += 1; continue; }
        if (row[3] === "C") { closed += 1; continue; }
        if (row[3] !== "O") continue;
        open += 1;
        const near = 1 / (1 + d / 280);
        const g = CODE_TO_GROUP[row[2]];
        if (g === kind) match += near; else if (comp.has(g)) pal += near;
      }
    }
    const alive = open >= profile.walk.openLow * 0.7;
    out.open.push(open / areaKm2); out.match.push(match / areaKm2); out.pal.push(pal / areaKm2); out.vac.push((alive ? vac : vac + closed) / areaKm2);
  }
  Object.values(out).forEach((a) => a.sort((x, y) => x - y));
  walkRefCache.set(key, out);
  return out;
}

function scoreWalk(lon, lat, feature) {
  const query = state.query;
  const profile = PROFILES[query.id] || PROFILES.bakery;
  const target = profile.walk;
  const complementIds = new Set(profile.complements || []);
  const [minX, minY, maxX, maxY] = geometryBBox(feature.geometry);
  let open = 0;
  let vacant = 0;
  let closed = 0;
  let matchW = 0;
  let matchN = 0;
  let palW = 0;
  let palN = 0;
  for (const row of state.places || []) {
    const x = row[0];
    const y = row[1];
    if (x < minX || x > maxX || y < minY || y > maxY) continue;
    if (!pointInGeometry(x, y, feature.geometry)) continue;
    const status = row[3];
    if (status === "V") {
      vacant += 1;
      continue;
    }
    if (status === "C") {
      closed += 1;
      continue;
    }
    if (status !== "O") continue;
    open += 1;
    const near = 1 / (1 + haversineMeters(lon, lat, x, y) / 280);
    const group = CODE_TO_GROUP[row[2]];
    if (group === query.id) {
      matchN += 1;
      matchW += near;
    } else if (complementIds.has(group)) {
      palN += 1;
      palW += near;
    }
  }
  const areaKm2 = Math.max(0.05, geometryAreaKm2(feature.geometry));
  const alive = open >= target.openLow * 0.7;
  const city = lat > 41 ? "Barcelona" : "Madrid";
  const ref = walkReference(city, query.id);
  const pct = (key, v) => {
    const arr = ref[key], x = v / areaKm2;
    if (!arr.length) return 50;
    let lt = 0, eq = 0;
    for (const r of arr) { if (r < x) lt += 1; else if (r === x) eq += 1; else break; }
    return Math.max(1, Math.min(99, Math.round((100 * (lt + eq / 2)) / arr.length)));
  };
  const pOpen = pct("open", open), pMatch = pct("match", matchW), pPal = pct("pal", palW), pVac = pct("vac", alive ? vacant : vacant + closed);
  const crowdCap = profile.crowd < 0.5;
  const shape = {
    up: (q) => q,
    down: (q) => 1 - q,
    mid: (q) => (q <= 0.6 ? 0.55 + q * 0.7 : Math.max(0.1, 0.97 - (q - 0.6) * 2.2)),
  };
  const tradeDir = crowdCap ? "mid" : "up";
  const doorsDir = alive ? "mid" : "down";
  const trade = shape[tradeDir](pOpen / 100);
  const gap = shape.down(pMatch / 100);
  const pals = shape.up(pPal / 100);
  const doors = shape[doorsDir](pVac / 100);
  const parts = [
    { label: "Shops in the walk", pct: pOpen, dir: tradeDir, tip: crowdCap ? "Open premises inside the walk, per km². For this business a lively-but-not-packed street is best." : "Open premises inside the walk, per km² — more shops means more people walking past.", detail: `${formatNumber(open)} open premises`, score: Math.round(trade * 100), weight: profile.signals.street, value: trade, line: `${formatNumber(open)} open premises inside the walk` },
    { label: "Competitors in the walk", pct: pMatch, dir: "down", tip: "Same-type businesses inside the walk, per km². Closer ones count more. Fewer is better.", detail: `${formatNumber(matchN)} ${plural(query.label, matchN)}, closer ones count more`, score: Math.round(gap * 100), weight: profile.signals.gap, value: gap, line: `${formatNumber(matchN)} ${plural(query.label, matchN)} inside the walk. Closer ones count more.` },
    { label: "Helpful neighbours in the walk", pct: pPal, dir: "up", tip: "Shops that bring the same customers, inside the walk, per km². More is better.", detail: `${formatNumber(palN)} complementary shops`, score: Math.round(pals * 100), weight: profile.signals.pals, value: pals, line: `${formatNumber(palN)} complementary shops inside the walk` },
    { label: "Empty doors in the walk", pct: pVac, dir: doorsDir, tip: alive ? "Vacant premises inside the walk, per km². On a trading street a moderate number is good (room to open); very many is a warning." : "Empty or closed doors on a thin street — fewer is better.", detail: alive ? `${formatNumber(vacant)} empty doors on a trading street` : `${formatNumber(vacant + closed)} empty or closed doors on a thin street`, score: Math.round(doors * 100), weight: 0.4, value: doors, line: alive ? `${formatNumber(vacant)} empty doors where the street is already trading` : `${formatNumber(vacant + closed)} empty or closed doors on a thin street` },
  ];
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = weight ? Math.round((parts.reduce((sum, part) => sum + part.weight * part.value, 0) / weight) * 100) : 0;
  return { score, parts, open, matchN, city };
}

function showCatchment(lon, lat) {
  const token = ++catchmentToken;
  const slot = detailModalBody.querySelector(".visit-live");
  if (!slot) return;
  const areaFeature = state.areaById?.get(state.selectedId);
  const areaScore = areaFeature?.properties?.score ?? 0;
  const kind = state.query?.id || "bakery";
  Promise.all([
    fetch("/api/walk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lon, lat, minutes: 10 }),
    }).then((response) => response.json()),
    fetch(`/api/nearby?lon=${lon}&lat=${lat}&kind=${encodeURIComponent(kind)}`).then((response) => response.json()),
  ])
    .then(([walk, nearby]) => {
      if (token !== catchmentToken) return;
      const feature = walk.type === "FeatureCollection" ? walk.features?.[0] : null;
      if (feature) map.getSource(MAP_SOURCES.walk)?.setData(walk);
      if (!feature) {
        slot.innerHTML = `<p class="live-note">The 10-minute walk is unavailable right now.</p>${nearbyPlacesBlock(nearby)}`;
        return;
      }
      const finish = () => {
        if (token !== catchmentToken) return;
        const scored = scoreWalk(lon, lat, feature);
        if (state.activeListingId) {
          state.listingWalkScores.set(state.activeListingId, scored.score);
          state.listingWalkParts.set(state.activeListingId, scored);
        }
        refreshFitScoresUi(areaScore, scored.score);
        slot.innerHTML = `${walkBreakdownHtml(scored, nearby)}`;
      };
      if (!state.places?.length) {
        slot.innerHTML = `<p class="live-note">The blue shape is a 10-minute walk. Loading the shops around it…</p>${nearbyPlacesBlock(nearby)}`;
        ensurePlaces().then(finish, () => {});
        return;
      }
      finish();
    })
    .catch(() => {
      if (token === catchmentToken) {
        slot.innerHTML = `<p class="kicker">10-minute walk</p><p class="live-note">Walk shape needs <code>OPENROUTESERVICE_API_KEY</code> in <code>.dev.vars</code> (copy from <code>config/secrets.env</code>) when using Wrangler, or run <code>python server.py</code> on port 4175.</p>`;
      }
    });
}

function setSelected(id) {
  state.selectedId = id || null;
  applySelectedAreaFilter();
}

function placeHoverCard(event, html) {
  hoverCard.hidden = false;
  hoverCard.innerHTML = html;
  const pad = 16;
  const width = 300;
  const height = hoverCard.offsetHeight || 160;
  let x = event.originalEvent.clientX + pad;
  let y = event.originalEvent.clientY + pad;
  if (x + width > window.innerWidth - 8) x = event.originalEvent.clientX - width - pad;
  if (y + height > window.innerHeight - 8) y = event.originalEvent.clientY - height - pad;
  hoverCard.style.left = `${Math.max(8, x)}px`;
  hoverCard.style.top = `${Math.max(8, y)}px`;
}

function hideHoverCard() {
  hoverCard.hidden = true;
}

function namedFeature(row) {
  const feature = toFeature(row);
  const area = state.areaById.get(row[4]);
  if (area) {
    feature.properties.b = area.properties.name;
    feature.properties.d = area.properties.district;
  }
  return feature;
}

function toFeature(row) {
  const code = row[2];
  const group = CODE_TO_GROUP[code] || "other";
  const concept = CONCEPTS.find((item) => item.id === group);
  const status = row[3] === "O" ? "Open" : row[3] === "V" ? "Vacant" : "Closed";
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [row[0], row[1]] },
    properties: {
      n: row[5],
      a: row[6],
      e: row[7],
      h: row[8],
      s: status,
      b: "",
      d: "",
      y: cityOfId(row[4]),
      i: row[4],
      group,
      gc: code,
      kind: concept?.label || "",
      pinKind: status === "Vacant" ? "empty" : status === "Closed" ? "closed" : rowMatches(row, state.query) ? "match" : "other",
    },
  };
}

function rowInBounds(row, bounds) {
  return bounds.contains([row[0], row[1]]);
}

function isListedSupply(row) {
  return row[3] === "V";
}

function syncPins() {
  if (!map.getSource(MAP_SOURCES.places)) return;
  // Census doors stay in state.places for area and walk scoring only — not shown as map leads.
  map.getSource(MAP_SOURCES.places).setData({ type: "FeatureCollection", features: [] });
}

function syncListings() {
  if (!map.getSource(MAP_SOURCES.listings)) return;
  if (!state.listings.length) {
    map.getSource(MAP_SOURCES.listings).setData({ type: "FeatureCollection", features: [] });
    return;
  }
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const features = [];
  for (const feature of state.listings) {
    const [lon, lat] = feature.geometry.coordinates;
    const city = cityOfId(feature.properties.i) || "Madrid";
    if (state.city !== "all" && city !== state.city) continue;
    if (!bounds.contains([lon, lat])) continue;
    if (state.tenant?.retail && !state.showExcluded && state.tenantEval?.get(feature.properties.id)?.excluded) continue;
    if (!passesListingFilters(feature.properties)) continue;
    if (zoom >= 11) features.push(feature);
  }
  map.getSource(MAP_SOURCES.listings).setData({ type: "FeatureCollection", features });
  updateChipCounts();
}

function listingNearCursor(point) {
  return queryMapLayerFeatures(point, [MAP_LAYERS.listings])[0];
}

function refreshCities() {
  if (!map.getSource(MAP_SOURCES.cities)) return;
  const grouped = new Map();
  for (const feature of visibleAreas()) {
    const props = feature.properties;
    const [[x1, y1], [x2, y2]] = boundsOf(feature.geometry);
    const current = grouped.get(props.city) || { x: 0, y: 0, n: 0, best: null };
    current.x += (x1 + x2) / 2;
    current.y += (y1 + y2) / 2;
    current.n += 1;
    if (!current.best || props.score > current.best.properties.score) current.best = feature;
    grouped.set(props.city, current);
  }
  const features = [];
  for (const [city, info] of grouped) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [info.x / info.n, info.y / info.n] },
      properties: {
        city,
        score: info.best.properties.score,
        areaId: info.best.properties.id,
        label: `${city}  ${info.best.properties.score}`,
      },
    });
  }
  map.getSource(MAP_SOURCES.cities).setData({ type: "FeatureCollection", features });
}

function mapPadding() {
  const narrow = window.innerWidth <= 1024;
  if (narrow) {
    return { left: 24, right: 24, top: window.innerWidth > 760 ? 40 : 200, bottom: Math.round(window.innerHeight * 0.44) };
  }
  return { left: 390, right: 500, top: 30, bottom: 30 };
}

function mountMapToolbar() {
  if (!mapStyleToolbar || !mapHeatmapToolbar) return;
  mapStyleToolbar.innerHTML = Object.entries(MAP_STYLES)
    .map(
      ([id, style]) =>
        `<button type="button" class="map-style-btn${id === state.mapStyle ? " is-active" : ""}" data-style="${id}" title="${escapeHtml(style.label)}" style="--swatch:${style.swatch}"><span class="map-style-btn__dot" aria-hidden="true"></span><span class="map-style-btn__label">${escapeHtml(style.label)}</span></button>`,
    )
    .join("");
  mapHeatmapToolbar.innerHTML = chipBarHtml();
  updateChipCounts();
}

function setHeatmapMode(id) {
  if (!HEATMAPS[id]) return;
  state.heatmap = state.heatmap === id ? "fit" : id;
  mountMapToolbar();
  if (state.areas) paintScores();
}

let mapStyleGeneration = 0;
let mapOverlayReady = false;

function syncMapOverlayData() {
  if (!map || !state.areas) return;
  if (map.getSource(MAP_SOURCES.areas)) map.getSource(MAP_SOURCES.areas).setData(state.areas);
  scoreAreas();
  paintScores();
  refreshCities();
  syncPins();
  syncListings();
  applySelectedAreaFilter();
}

function safeAddLayer(layer, beforeId) {
  try {
    if (beforeId && map.getLayer(beforeId)) {
      map.addLayer(layer, beforeId);
      return;
    }
  } catch (_) {
    /* invalid before id on some basemap styles */
  }
  map.addLayer(layer);
}

function attachScannerOverlay() {
  if (!map) return;
  removeScannerMapOverlay();
  ensureMapLayers();
  syncMapOverlayData();
  mapOverlayReady = scannerOverlayComplete();
}

function refreshMapDataLayers() {
  if (!map || !state.areas) return;
  if (!scannerOverlayComplete()) attachScannerOverlay();
  else syncMapOverlayData();
}

function switchMapStyle(styleId) {
  const style = MAP_STYLES[styleId];
  if (!style || state.mapStyle === styleId) return;
  state.mapStyle = styleId;
  mapOverlayReady = false;
  mountMapToolbar();
  const generation = ++mapStyleGeneration;
  map.setStyle(style.url, { diff: false });
  const finishAttach = () => {
    if (generation !== mapStyleGeneration) return;
    attachScannerOverlay();
    map.once("idle", () => {
      if (generation !== mapStyleGeneration) return;
      paintScores();
      syncPins();
      syncListings();
      mapOverlayReady = scannerOverlayComplete();
    });
  };
  map.once("style.load", () => {
    if (generation !== mapStyleGeneration) return;
    if (map.isStyleLoaded()) finishAttach();
    else map.once("idle", finishAttach);
  });
}

function applySelectedAreaFilter() {
  const id = state.selectedId || "";
  const filter = ["==", ["get", "id"], id];
  if (map.getLayer(MAP_LAYERS.areaSelected)) map.setFilter(MAP_LAYERS.areaSelected, filter);
  if (map.getLayer(MAP_LAYERS.areaSelectedHalo)) map.setFilter(MAP_LAYERS.areaSelectedHalo, filter);
  if (map.getLayer(MAP_LAYERS.areaSelectedFill)) map.setFilter(MAP_LAYERS.areaSelectedFill, filter);
}

function mapLayerBeforeLabels() {
  const layers = map.getStyle()?.layers;
  if (!layers) return undefined;
  for (const layer of layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
}

function removeScannerMapOverlay() {
  for (const id of MAP_LAYER_STACK) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  for (const id of Object.values(MAP_SOURCES)) {
    if (map.getSource(id)) map.removeSource(id);
  }
}

function scannerOverlayComplete() {
  if (!map?.getStyle?.()) return false;
  return (
    MAP_LAYER_STACK.every((id) => map.getLayer(id)) &&
    Object.values(MAP_SOURCES).every((id) => map.getSource(id))
  );
}

function ensureMapLayers() {
  if (scannerOverlayComplete()) {
    applySelectedAreaFilter();
    return;
  }
  removeScannerMapOverlay();
  const before = mapLayerBeforeLabels();
  const areas = state.areas || { type: "FeatureCollection", features: [] };
  map.addSource(MAP_SOURCES.areas, { type: "geojson", data: areas });
  map.addSource(MAP_SOURCES.places, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  safeAddLayer({
    id: MAP_LAYERS.areasFill,
    type: "fill",
    source: MAP_SOURCES.areas,
    paint: {
      "fill-color": "#f4efe6",
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.2, 9, 0.78, 12, 0.74, 13, 0.42, 14, 0.18, 16, 0.08],
    },
  }, before);
  safeAddLayer({
    id: MAP_LAYERS.areasLine,
    type: "line",
    source: MAP_SOURCES.areas,
    paint: {
      "line-color": "#fffdf8",
      "line-width": 1,
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.95, 13.5, 0.28, 15, 0.08],
    },
  }, before);
  map.addSource(MAP_SOURCES.cities, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  safeAddLayer({
    id: MAP_LAYERS.cities,
    type: "circle",
    source: MAP_SOURCES.cities,
    maxzoom: 8,
    paint: {
      "circle-radius": 18,
      "circle-color": ["interpolate", ["linear"], ["get", "score"], 0, "#f7f1e8", 45, "#efb27a", 60, "#d46a32", 75, "#8a3014"],
      "circle-stroke-width": 3,
      "circle-stroke-color": "#fffdf8",
      "circle-opacity": 0.95,
    },
  }, before);
  safeAddLayer({
    id: MAP_LAYERS.citiesLabel,
    type: "symbol",
    source: MAP_SOURCES.cities,
    maxzoom: 8,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 13,
      "text-offset": [0, 1.6],
      "text-anchor": "top",
      "text-font": ["Noto Sans Regular"],
    },
    paint: { "text-color": "#1d1915", "text-halo-color": "#fffdf8", "text-halo-width": 1.4 },
  }, before);
  map.addSource(MAP_SOURCES.walk, { type: "geojson", data: emptyCollection() });
  safeAddLayer({
    id: MAP_LAYERS.walkFill,
    type: "fill",
    source: MAP_SOURCES.walk,
    paint: {
      "fill-color": "#1d4e89",
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.42, 13, 0.5, 15.5, 0.58],
    },
  }, before);
  safeAddLayer({
    id: MAP_LAYERS.walkLine,
    type: "line",
    source: MAP_SOURCES.walk,
    paint: {
      "line-color": "#0f2f56",
      "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2.2, 15, 3.4],
    },
  }, before);
  const selectedFilter = ["==", ["get", "id"], ""];
  safeAddLayer({
    id: MAP_LAYERS.areaSelectedFill,
    type: "fill",
    source: MAP_SOURCES.areas,
    filter: selectedFilter,
    paint: { "fill-color": "#1d1915", "fill-opacity": 0.1 },
  }, before);
  safeAddLayer({
    id: MAP_LAYERS.areaSelectedHalo,
    type: "line",
    source: MAP_SOURCES.areas,
    filter: selectedFilter,
    paint: {
      "line-color": "#fffdf8",
      "line-width": ["interpolate", ["linear"], ["zoom"], 11, 6, 15, 10],
      "line-opacity": 1,
    },
  }, before);
  safeAddLayer({
    id: MAP_LAYERS.areaSelected,
    type: "line",
    source: MAP_SOURCES.areas,
    filter: selectedFilter,
    paint: {
      "line-color": "#1d1915",
      "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2.4, 15, 3.6],
      "line-opacity": 1,
    },
  }, before);
  map.addSource(MAP_SOURCES.listings, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  safeAddLayer({
    id: MAP_LAYERS.listings,
    type: "circle",
    source: MAP_SOURCES.listings,
    minzoom: 11,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 7, 14, 9, 16, 12],
      "circle-color": "#4c1d95",
      "circle-stroke-color": "#fffdf8",
      "circle-stroke-width": 2.2,
      "circle-opacity": 0.95,
    },
  }, before);
  safeAddLayer({
    id: MAP_LAYERS.places,
    type: "circle",
    source: MAP_SOURCES.places,
    minzoom: 14,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 6, 16, 9, 18, 12],
      "circle-color": [
        "match",
        ["get", "pinKind"],
        "empty",
        "#fffdf8",
        "closed",
        "#fffdf8",
        [
          "match",
          ["get", "gc"],
          "b",
          GROUP_COLORS.bakery,
          "c",
          GROUP_COLORS.cafe,
          "f",
          GROUP_COLORS.food,
          "g",
          GROUP_COLORS.grocery,
          "p",
          GROUP_COLORS.pharmacy,
          "u",
          GROUP_COLORS.beauty,
          "s",
          GROUP_COLORS.fashion,
          "l",
          GROUP_COLORS.health,
          "m",
          GROUP_COLORS.gym,
          GROUP_COLORS.other,
        ],
      ],
      "circle-stroke-color": [
        "match",
        ["get", "pinKind"],
        "empty",
        "#c2561a",
        "closed",
        "#9b2335",
        "#1d1915",
      ],
      "circle-stroke-width": ["match", ["get", "pinKind"], "empty", 2.5, "closed", 2.5, 1.6],
      "circle-opacity": 1,
    },
  }, before);
  applySelectedAreaFilter();
  mapOverlayReady = scannerOverlayComplete();
}

/** Content-hashed data URL (index.html carries the hashes) so the browser can cache it forever. */
function dataUrl(name, ext = "json") {
  const v = window.PS_DATA?.[name];
  return `data/${name}.${ext}${v ? `?v=${v}` : ""}`;
}

const fetchJson = (url) => fetch(url).then((response) => {
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
});

const LIST_FILES = ["l-mad-sale", "l-mad-rent", "l-bcn-sale", "l-bcn-rent"];
const PLACE_FILES = ["p-mad", "p-bcn"];
let placesPromise = null;

/** Shop rows (186k) are only needed for walk scoring, pins and tallies — fetched after the leads are on screen. */
function ensurePlaces() {
  placesPromise ??= Promise.all(PLACE_FILES.map((name) => fetchJson(dataUrl(name)).catch(() => []))).then((parts) => {
    state.places = parts.flat();
    tallyListings();
    syncPins();
    return state.places;
  });
  return placesPromise;
}

const detailCache = new Map();
/** Full Idealista payload (photos, descriptions, raw fields) for one listing, merged into its props on first open. */
function ensureListingDetail(props) {
  if (!props?.id || props._full) return Promise.resolve(props);
  if (!detailCache.has(props.id)) {
    detailCache.set(props.id, fetchJson(`data/d/${encodeURIComponent(props.id)}.json${window.PS_DATA?.d ? `?v=${window.PS_DATA.d}` : ""}`)
      .then((full) => {
        if (full?.inv) props.inv = { ...props.inv, ...full.inv };
        if (full?.x) props.x = { ...props.x, ...full.x };
        props._full = true;
        return props;
      })
      .catch(() => { detailCache.delete(props.id); return props; }));
  }
  return detailCache.get(props.id);
}

async function bootstrapAppData() {
  setRankingsLoading(true);
  try {
    const [areas, ...lists] = await Promise.all([
      fetchJson(dataUrl("areas", "geojson")),
      ...LIST_FILES.map((name) => fetchJson(dataUrl(name)).catch(() => ({ features: [] }))),
    ]);
    state.areas = areas;
    state.areaById = new Map(areas.features.map((feature) => [feature.properties.id, feature]));
    if (map.getSource(MAP_SOURCES.areas)) map.getSource(MAP_SOURCES.areas).setData(areas);

    const allListings = lists.flatMap((doc) => doc.features || []);
    const fullListings = allListings.filter((feature) => feature.properties?.full);
    const pool = FULL_DETAIL_LEADS_ONLY && fullListings.length ? fullListings : allListings;
    state.listings = dedupeListingFeatures(pool);
    LISTING_MEDIANS = null;
    state.listingById = new Map(state.listings.map((feature) => [feature.properties.id, feature]));
    refreshTenantEval();
    tallyListings();
    readInputs(false);
    syncPins();
    syncListings();
  } catch (error) {
    console.error(error);
  } finally {
    setRankingsLoading(false);
    renderAreaRanking();
    renderListingRanking();
    document.body.classList.remove("is-loading");
    state.ready = true;
    (window.requestIdleCallback || ((fn) => setTimeout(fn, 400)))(() => ensurePlaces());
  }
}

function applyView(fly) {
  scoreAreas();
  if (map.getSource(MAP_SOURCES.areas)) map.getSource(MAP_SOURCES.areas).setData(state.areas);
  paintScores();
  refreshCities();
  renderAreaRanking();
  renderListingRanking();
  syncPins();
  syncListings();
  if (!fly) return;
  const padding = mapPadding();
  if (state.city === "all") {
    map.fitBounds(SPAIN_BOUNDS, { padding, duration: 700 });
    return;
  }
  const areas = visibleAreas();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  areas.forEach((feature) => {
    const [[x1, y1], [x2, y2]] = boundsOf(feature.geometry);
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });
  map.fitBounds([[minX, minY], [maxX, maxY]], { padding, duration: 700 });
}

function tallyListings() {
  const counts = new Map();
  for (const row of state.places || []) {
    if (row[3] !== "V") continue;
    const activity = norm(row[7]);
    const bucket = counts.get(row[4]) || { listed: 0, forRent: 0, forSale: 0 };
    bucket.listed += 1;
    if (activity.includes("lloguer")) bucket.forRent += 1;
    if (activity.includes("venda")) bucket.forSale += 1;
    counts.set(row[4], bucket);
  }
  for (const feature of state.listings) {
    const areaId = feature.properties?.i;
    if (!areaId) continue;
    const bucket = counts.get(areaId) || { listed: 0, forRent: 0, forSale: 0 };
    bucket.listed += 1;
    bucket.forSale += 1;
    counts.set(areaId, bucket);
  }
  state.listingCounts = counts;
}

function readInputs(fly) {
  const city = "all"; // scoring is city-wide; rankings follow the map viewport
  state.query = parseQuery(pickerValue("business"));
  const nextCity = city === "Madrid" || city === "Barcelona" ? city : "all";
  const shouldFly = fly && nextCity !== state.city;
  state.city = nextCity;
  if (state.areas) applyView(shouldFly);
}

function selectArea(feature) {
  setSelected(feature.properties.id);
  renderAreaRanking();
  renderListingRanking();
  const pad = mapPadding();
  map.fitBounds(boundsOf(feature.geometry), {
    padding: { top: pad.top + 36, right: pad.right + 36, bottom: pad.bottom + 36, left: pad.left + 36 },
    duration: 650,
  });
  const [lon, lat] = geometryPoint(feature.geometry);
  openAreaDetail(feature.properties, [lon, lat]);
}

function openShopDetail(props, coordinates) {
  if (props.i) setSelected(props.i);
  openDetailModal(`<div class="modal-shop">${shopCard(props, { pinned: true })}</div>`);
  if (coordinates) {
    map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), 15), duration: 650 });
    showCatchment(coordinates[0], coordinates[1]);
  }
}

function placeNearCursor(point) {
  const direct = queryMapLayerFeatures(point, [MAP_LAYERS.places])[0];
  if (direct) return direct;
  const box = [
    [point.x - 8, point.y - 8],
    [point.x + 8, point.y + 8],
  ];
  return queryMapLayerFeatures(box, [MAP_LAYERS.places])[0];
}

const map = new maplibregl.Map({
  container: "map",
  style: MAP_STYLES.light.url,
  bounds: SPAIN_BOUNDS,
  fitBoundsOptions: { padding: mapPadding() },
  attributionControl: true,
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

let mapAppStarted = false;

async function onMapReady() {
  if (mapAppStarted) return;
  mapAppStarted = true;
  ensureMapLayers();
  mountMapToolbar();
  paintScores();
  map.fitBounds(DEFAULT_VIEW, { padding: mapPadding(), duration: 0 });
  await bootstrapAppData();
}

if (map.loaded()) {
  onMapReady();
} else {
  map.once("load", onMapReady);
}

mapStyleToolbar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-style]");
  if (!button) return;
  switchMapStyle(button.dataset.style);
});

mapHeatmapToolbar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-heatmap]");
  if (!button) return;
  setHeatmapMode(button.dataset.heatmap);
});
mapHeatmapToolbar?.addEventListener("click", (event) => {
  const b = event.target.closest("[data-chip],[data-chip-reset]");
  if (!b) return;
  if (b.dataset.chipReset != null) { state.chips.clear(); state.maxPrice = 0; state.sizeRange = "any"; }
  else if (state.chips.has(b.dataset.chip)) state.chips.delete(b.dataset.chip);
  else state.chips.add(b.dataset.chip);
  applyListingFilters();
});
mapHeatmapToolbar?.addEventListener("change", (event) => {
  const s = event.target;
  if (s.matches("[data-fprice]")) state.maxPrice = Number(s.value);
  else if (s.matches("[data-fsize]")) state.sizeRange = s.value;
  else if (s.matches("[data-fheat]")) { state.heatmap = s.value; if (state.areas) paintScores(); return; }
  else return;
  applyListingFilters();
});

function closePickers(except) {
  document.querySelectorAll(".picker").forEach((picker) => {
    if (picker === except) return;
    picker.querySelector(".picker-button").setAttribute("aria-expanded", "false");
    picker.querySelector(".picker-menu").hidden = true;
  });
}

function pickerValue(name) {
  const selected = document.querySelector(`[data-picker="${name}"] [role="option"][aria-selected="true"]`);
  return selected?.dataset.value || "";
}

function setPicker(name, value) {
  const picker = document.querySelector(`[data-picker="${name}"]`);
  const options = [...picker.querySelectorAll("[role='option']")];
  const match = options.find((option) => option.dataset.value === value) || options[0];
  options.forEach((option) => option.setAttribute("aria-selected", option === match ? "true" : "false"));
  picker.querySelector(".picker-value").textContent = match.textContent.trim();
}

function bindPicker(picker) {
  const button = picker.querySelector(".picker-button");
  const menu = picker.querySelector(".picker-menu");
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    closePickers();
    button.setAttribute("aria-expanded", open ? "false" : "true");
    menu.hidden = open;
    if (!open) {
      const selected = menu.querySelector("[aria-selected='true']");
      (selected || menu.querySelector("[role='option']"))?.focus();
    }
  });
  menu.addEventListener("click", (event) => {
    const option = event.target.closest("[role='option']");
    if (!option) return;
    setPicker(picker.dataset.picker, option.dataset.value);
    button.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    button.focus();
    readInputs(picker.dataset.picker === "city");
  });
  menu.addEventListener("keydown", (event) => {
    const options = [...menu.querySelectorAll("[role='option']")];
    const index = options.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = event.key === "ArrowDown" ? Math.min(options.length - 1, index + 1) : Math.max(0, index - 1);
      options[next]?.focus();
    } else if (event.key === "Escape") {
      button.setAttribute("aria-expanded", "false");
      menu.hidden = true;
      button.focus();
    }
  });
}

document.querySelectorAll(".picker").forEach(bindPicker);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".picker")) closePickers();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePickers();
    if (!detailModal.hidden) closeDetailModal();
  }
});

detailModalClose.addEventListener("click", closeDetailModal);
detailModalBackdrop.addEventListener("click", closeDetailModal);

areaRanking.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.dataset.kind !== "area") return;
  const feature = state.areas.features.find((item) => item.properties.id === button.dataset.id);
  if (feature) selectArea(feature);
});

listingRanking.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button?.dataset.kind) return;
  if (button.dataset.kind === "listing") {
    openListingById(button.dataset.id);
    return;
  }
  if (button.dataset.kind === "area") {
    const feature = state.areas.features.find((item) => item.properties.id === button.dataset.id);
    if (feature) selectArea(feature);
  }
});

map.on("mousemove", (event) => {
  if (!mapOverlayReady) {
    hideHoverCard();
    return;
  }
  if (!detailModal.hidden) {
    hideHoverCard();
    return;
  }
  const listing = listingNearCursor(event.point);
  if (listing) {
    map.getCanvas().style.cursor = "pointer";
    placeHoverCard(event, `<div class="glass hover-card-inner">${listingCard(listing.properties)}</div>`);
    return;
  }
  const shop = placeNearCursor(event.point);
  if (shop) {
    map.getCanvas().style.cursor = "pointer";
    placeHoverCard(event, `<div class="glass hover-card-inner">${shopCard(shop.properties)}</div>`);
    return;
  }
  const areaHit = queryMapLayerFeatures(event.point, [MAP_LAYERS.areasFill])[0];
  const area = areaHit && state.areaById.get(areaHit.properties.id);
  if (area && area.properties.score >= 0) {
    map.getCanvas().style.cursor = "pointer";
    placeHoverCard(event, `<div class="glass hover-card-inner">${areaCard(area.properties)}</div>`);
    return;
  }
  map.getCanvas().style.cursor = "";
  hideHoverCard();
});

map.on("mouseout", hideHoverCard);

map.on("click", (event) => {
  if (!mapOverlayReady) return;
  const cityHit = queryMapLayerFeatures(event.point, [MAP_LAYERS.cities])[0];
  if (cityHit) {
    const jump = JUMPS[String(cityHit.properties.city || "").toLowerCase()];
    if (jump) map.fitBounds(jump, { padding: mapPadding(), duration: 700 });
    return;
  }
  const listing = listingNearCursor(event.point);
  if (listing) {
    // MapLibre flattens nested feature properties to JSON strings (inv, x), so the
    // card must use the original listing object, not the rendered feature's props.
    const full = state.listingById.get(listing.properties.id);
    if (full) openListingById(full.properties.id);
    else openListingDetail(listing.properties, listing.geometry.coordinates);
    return;
  }
  const shop = placeNearCursor(event.point);
  if (shop) {
    openShopDetail(shop.properties, shop.geometry.coordinates);
    return;
  }
  const area = queryMapLayerFeatures(event.point, [MAP_LAYERS.areasFill])[0];
  if (area && area.properties.score >= 0) {
    const feature = state.areas.features.find((item) => item.properties.id === area.properties.id);
    if (feature) selectArea(feature);
  }
});

map.on("moveend", () => {
  syncPins();
  syncListings();
  renderAreaRanking();
  renderListingRanking();
});

document.querySelector("#jump-row")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-jump]");
  if (!button) return;
  const target = JUMPS[button.dataset.jump];
  if (target) map.fitBounds(target, { padding: mapPadding(), duration: 700 });
});

map.on("error", (event) => {
  const message = String(event.error?.message || event.error || "");
  if (message.includes("does not exist in the map's style")) return;
  console.error(event.error || event);
});


// Card tabs (Why / tenant / Calculator / Details): one panel visible at a time.
document.addEventListener("click", (event) => {
  const tab = event.target.closest(".lnav [data-sec]");
  if (tab) {
    const card = tab.closest("article");
    card.querySelectorAll(".lnav [data-sec]").forEach((b) => {
      const on = b === tab;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
    card.querySelectorAll(".lsec").forEach((sec) => { sec.hidden = sec.id !== tab.dataset.sec; });
    // A long tab left scrolled deep would otherwise open the next tab mid-way (or past its end).
    const dialog = card.closest(".detail-modal__dialog");
    const nav = card.querySelector(".lnav");
    if (dialog && nav) {
      const navTop = nav.getBoundingClientRect().top - dialog.getBoundingClientRect().top + dialog.scrollTop - 8;
      if (dialog.scrollTop > navTop) dialog.scrollTop = navTop;
    }
    return;
  }
  const lang = event.target.closest(".ldesc2 [data-lang]");
  if (lang) {
    const box = lang.closest(".ldesc2");
    box.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("is-on", b === lang));
    box.querySelectorAll("[data-text]").forEach((t) => { t.hidden = t.dataset.text !== lang.dataset.lang; });
  }
});

// Donut hover: highlight segment, show € and % in the centre.
document.addEventListener("pointerover", (event) => {
  const seg = event.target.closest(".donut [data-seg]");
  const donut = event.target.closest(".donut");
  if (!donut || donut.classList.contains("pdonut")) return;
  const idx = seg?.dataset.seg;
  donut.classList.toggle("is-hover", idx != null);
  donut.querySelectorAll("[data-seg]").forEach((el) => el.classList.toggle("is-on", el.dataset.seg === idx));
  const k = donut.querySelector(".donut__k"), v = donut.querySelector(".donut__v"), p = donut.querySelector(".donut__p");
  if (idx != null) { k.textContent = seg.dataset.label; v.textContent = seg.dataset.eur; if (p) p.textContent = `${seg.dataset.pct}%`; }
  else { k.textContent = "All-in"; v.textContent = donut.dataset.total; if (p) p.textContent = ""; }
});

// ---- Responsive: on phones the area ranking moves into the bottom sheet (tabs: Neighbourhoods / Listings).
(function responsiveLayout() {
  const phone = window.matchMedia("(max-width: 1024px)");
  const panel = document.querySelector(".ranking-panel");
  const search = document.querySelector(".search-card");
  const areaRank = document.querySelector(".area-rank");
  if (!panel || !search || !areaRank) return;
  const setTab = (tab) => {
    panel.dataset.tab = tab;
    panel.querySelectorAll("[data-sheet-tab]").forEach((b) => b.classList.toggle("is-on", b.dataset.sheetTab === tab));
  };
  const apply = () => {
    if (phone.matches) {
      if (areaRank.parentElement !== panel) panel.insertBefore(areaRank, panel.querySelector(".listing-rank"));
      if (!panel.dataset.tab) setTab("areas");
    } else if (areaRank.parentElement !== search) {
      search.appendChild(areaRank);
      panel.classList.remove("is-expanded");
    }
    if (typeof map !== "undefined" && map?.resize) setTimeout(() => map.resize(), 50);
  };
  panel.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-sheet-tab]");
    if (tab) { setTab(tab.dataset.sheetTab); panel.classList.add("is-expanded"); }
    if (event.target.closest("#sheet-handle")) panel.classList.toggle("is-expanded");
  });
  phone.addEventListener("change", apply);
  apply();
})();

/* ---- Image skeletons: fade images in once loaded ---- */
document.addEventListener("load", (event) => {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.classList.contains("is-loading")) img.classList.remove("is-loading");
}, true);
document.addEventListener("error", (event) => {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.classList.contains("is-loading")) { img.classList.remove("is-loading"); img.classList.add("is-broken"); }
}, true);

/* ---- Score calculation panel ---- */
document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-open-calc]");
  if (!btn) return;
  const panel = detailModalBody?.querySelector("#score-calc");
  if (!panel) return;
  const open = panel.hidden;
  if (open) { detailModalBody.querySelector('[data-sec="sec-why"]')?.click(); }
  panel.hidden = !open;
  detailModalBody.querySelectorAll(".lfit__ring[data-open-calc]").forEach((n) => n.setAttribute("aria-expanded", String(open)));
  if (open) panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
});

/* ---- One floating tooltip for every (i) mark: fixed position, above everything, readable contrast ---- */
(() => {
  const tip = document.createElement("div");
  tip.className = "ftip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);
  let owner = null;
  const show = (el) => {
    const text = el.querySelector(".score-tip__bubble")?.textContent || el.getAttribute("aria-label");
    if (!text) return;
    owner = el;
    tip.textContent = text;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
    let top = r.top - h - 8;
    if (top < 8) top = r.bottom + 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };
  const hide = () => { owner = null; tip.hidden = true; };
  document.addEventListener("mouseover", (e) => { const el = e.target.closest?.(".score-tip"); if (el && el !== owner) show(el); else if (!el && owner) hide(); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest?.(".score-tip"); if (el) show(el); });
  document.addEventListener("focusout", hide);
  document.addEventListener("scroll", hide, true);
})();
new MutationObserver(() => {
  document.querySelectorAll("img.is-loading").forEach((img) => { if (img.complete && img.naturalWidth) img.classList.remove("is-loading"); });
}).observe(document.body, { childList: true, subtree: true });

/* ---- Round 18: plain-language chips that filter the places themselves (list + map) ---- */
const CHIP_DEFS = [
  { id: "busy", label: "Busy street", icon: "🚶", metric: "foot", want: "high", tip: "Area in the busiest third of the city for open shops per km²" },
  { id: "rivals", label: "Few rivals", icon: "🏪", metric: "competitors", want: "low", tip: "Area in the third of the city with the fewest competitors for this business" },
  { id: "wealthy", label: "Wealthy area", icon: "💶", metric: "income", want: "high", tip: "Area in the top third of the city for household income" },
  { id: "metro", label: "Near metro", icon: "🚇", metric: "metro", want: "some", tip: "At least one metro station in the area" },
  { id: "residents", label: "Lots of residents", icon: "🏘️", metric: "popDensity", want: "high", tip: "Area in the top third of the city for residents per km²" },
];
const PRICE_OPTS = [[0, "Any price", null], [1, "Up to €3k/mo · €500k", [3000, 500000]], [2, "Up to €6k/mo · €1M", [6000, 1000000]], [3, "Up to €12k/mo · €2.5M", [12000, 2500000]]];
const SIZE_OPTS = [["any", "Any size", 0, Infinity], ["s", "Under 150 m²", 0, 150], ["m", "150–500 m²", 150, 500], ["l", "500–1,500 m²", 500, 1500], ["xl", "1,500 m² +", 1500, Infinity]];

function activeFilterCount() {
  return state.chips.size + (state.maxPrice ? 1 : 0) + (state.sizeRange !== "any" ? 1 : 0);
}
function chipPass(def, props) {
  const area = state.areaById?.get(props.i);
  if (!area) return false;
  const p = area.properties;
  const v = Number(p[HEATMAPS[def.metric].field]);
  if (!Number.isFinite(v)) return false;
  if (def.want === "some") return v >= 1;
  const c = metricCutoffs()[p.city]?.[def.metric];
  if (!c) return false;
  return def.want === "high" ? v >= c[1] : v <= c[0];
}
function pricePass(props, level = state.maxPrice) {
  const cap = PRICE_OPTS.find((o) => o[0] === level)?.[2];
  if (!cap) return true;
  if (!props.p) return false;
  return props.p <= (props.op === "rent" ? cap[0] : cap[1]);
}
function sizePass(props, range = state.sizeRange) {
  const o = SIZE_OPTS.find((x) => x[0] === range);
  if (!o || o[0] === "any") return true;
  return props.sz ? props.sz >= o[2] && props.sz < o[3] : false;
}
/** `extra` lets the counter ask "how many would match if this chip were on too". */
function passesListingFilters(props, extra = null) {
  for (const def of CHIP_DEFS) if ((state.chips.has(def.id) || extra === def.id) && !chipPass(def, props)) return false;
  return pricePass(props) && sizePass(props);
}
function chipBasePool() {
  const bounds = map?.getBounds ? map.getBounds() : null;
  const out = [];
  for (const f of state.listings || []) {
    const p = f.properties;
    if (!listingMatchesCity(p)) continue;
    if (state.tenant?.retail && !state.showExcluded && state.tenantEval?.get(p.id)?.excluded) continue;
    if (bounds && !bounds.contains(f.geometry.coordinates)) continue;
    out.push(p);
  }
  return out;
}
const placesWord = (n) => `${formatNumber(n)} ${n === 1 ? "place" : "places"}`;
function updateChipCounts() {
  const bar = mapHeatmapToolbar?.querySelector(".chipbar");
  if (!bar || !state.listings?.length) return;
  const pool = chipBasePool();
  for (const def of CHIP_DEFS) {
    const n = pool.filter((p) => passesListingFilters(p, def.id)).length;
    const el = bar.querySelector(`[data-chip-n="${def.id}"]`);
    if (el) el.textContent = formatNumber(n);
  }
  const total = pool.filter((p) => passesListingFilters(p)).length;
  const t = bar.querySelector("[data-total-n]");
  if (t) t.textContent = activeFilterCount() ? `${placesWord(total)} match` : `${placesWord(total)} in view`;
  const noPrice = pool.filter((p) => { for (const d of CHIP_DEFS) if (state.chips.has(d.id) && !chipPass(d, p)) return false; return sizePass(p); });
  bar.querySelectorAll("[data-fprice] option").forEach((o) => { const n = noPrice.filter((p) => pricePass(p, Number(o.value))).length; o.textContent = `${PRICE_OPTS.find((x) => x[0] === Number(o.value))[1]} (${formatNumber(n)})`; });
  const noSize = pool.filter((p) => { for (const d of CHIP_DEFS) if (state.chips.has(d.id) && !chipPass(d, p)) return false; return pricePass(p); });
  bar.querySelectorAll("[data-fsize] option").forEach((o) => { const n = noSize.filter((p) => sizePass(p, o.value)).length; o.textContent = `${SIZE_OPTS.find((x) => x[0] === o.value)[1]} (${formatNumber(n)})`; });
}
function chipBarHtml() {
  const chips = CHIP_DEFS.map((d) => `<button type="button" class="fchip${state.chips.has(d.id) ? " is-on" : ""}" data-chip="${d.id}" aria-pressed="${state.chips.has(d.id)}" title="${escapeHtml(d.tip)}"><span aria-hidden="true">${d.icon}</span>${escapeHtml(d.label)}<em data-chip-n="${d.id}">…</em></button>`).join("");
  const price = `<label class="fsel${state.maxPrice ? " is-on" : ""}"><span>Max price</span><select data-fprice>${PRICE_OPTS.map(([v, l]) => `<option value="${v}"${state.maxPrice === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const size = `<label class="fsel${state.sizeRange !== "any" ? " is-on" : ""}"><span>Size</span><select data-fsize>${SIZE_OPTS.map(([v, l]) => `<option value="${v}"${state.sizeRange === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const heatIds = ["fit", ...FILTER_GROUPS.flatMap((g) => g[2])].filter((id) => HEATMAPS[id]);
  const heat = `<label class="fsel fsel--heat"><span>Colour map</span><select data-fheat>${heatIds.map((id) => `<option value="${id}"${state.heatmap === id ? " selected" : ""}>${id === "fit" ? "Best fit" : escapeHtml(HEATMAPS[id].label)}</option>`).join("")}</select></label>`;
  const n = activeFilterCount();
  return `<div class="chipbar" role="group" aria-label="Filter places"><div class="chipbar__chips">${chips}${price}${size}</div><div class="chipbar__foot"><b data-total-n>…</b>${n ? `<button type="button" class="chip-reset" data-chip-reset>Clear ${n}</button>` : ""}${heat}</div></div>`;
}
function applyListingFilters() {
  mountMapToolbar();
  syncListings();
  renderListingRanking();
}

/* ---- Round 18: PDF shortlist (client-side, print stylesheet → "Save as PDF") ---- */
document.addEventListener("change", (event) => {
  const t = event.target.closest("[data-tick]");
  if (!t) return;
  const id = String(t.dataset.tick);
  if (t.checked) state.ticked.add(id); else state.ticked.delete(id);
  renderPdfBar();
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".tick")) event.stopPropagation();
  const b = event.target.closest("[data-pdf-export]");
  if (b) exportShortlist();
  const c = event.target.closest("[data-pdf-clear]");
  if (c) { state.ticked.clear(); renderListingRanking(); }
}, true);

function renderPdfBar() {
  let bar = document.getElementById("pdf-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "pdf-bar";
    bar.className = "pdf-bar";
    listingRanking.insertAdjacentElement("beforebegin", bar);
  }
  const n = state.ticked.size;
  bar.innerHTML = `<button type="button" class="pdf-btn" data-pdf-export>⬇ PDF shortlist · ${n ? `${n} ticked` : "top 5"}</button>${n ? `<button type="button" class="pdf-clear" data-pdf-clear>Untick all</button>` : `<span class="unit-note">Tick places to choose your own</span>`}`;
}

function shortlistRows() {
  if (state.ticked.size) {
    const rows = [];
    for (const f of state.listings) {
      const p = f.properties;
      if (!state.ticked.has(String(p.id))) continue;
      const area = state.areaById?.get(p.i);
      rows.push({ id: p.id, props: p, rank: listingRank(p), city: cityOfId(p.i) || p.m || "", areaName: area?.properties?.name || p.n || "", coords: f.geometry.coordinates });
    }
    return rows.sort((a, b) => b.rank.pct - a.rank.pct);
  }
  const coords = new Map(state.listings.map((f) => [f.properties.id, f.geometry.coordinates]));
  return buildOverallRanking().slice(0, 5).map((r) => ({ ...r, coords: coords.get(r.id) }));
}

async function shortlistMapImage(rows) {
  const cam = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
  const pad = mapPadding();
  const pts = rows.map((r) => r.coords).filter(Boolean);
  let restoreLayers = () => {};
  try {
    if (pts.length === 1) map.jumpTo({ center: pts[0], zoom: 15, padding: pad });
    else if (pts.length) {
      const b = pts.reduce((acc, c) => acc.extend(c), new maplibregl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(b, { padding: { top: pad.top + 50, bottom: pad.bottom + 50, left: pad.left + 60, right: pad.right + 60 }, duration: 0, maxZoom: 16 });
    }
    const hid = [MAP_LAYERS.listings].filter((id) => map.getLayer(id));
    hid.forEach((id) => map.setLayoutProperty(id, "visibility", "none"));
    restoreLayers = () => hid.forEach((id) => map.setLayoutProperty(id, "visibility", "visible"));
    await new Promise((res) => { let done = false; const fin = () => { if (!done) { done = true; res(); } }; map.once("idle", fin); setTimeout(fin, 5000); });
    const src = await new Promise((res) => { map.once("render", () => res(map.getCanvas())); map.triggerRepaint(); });
    const cw = src.clientWidth, ch = src.clientHeight, sx = src.width / cw;
    const x0 = pad.left, y0 = pad.top, w = Math.max(200, cw - pad.left - pad.right), h = Math.max(150, ch - pad.top - pad.bottom);
    const out = document.createElement("canvas");
    out.width = Math.round(w * sx); out.height = Math.round(h * sx);
    out.getContext("2d").drawImage(src, x0 * sx, y0 * sx, w * sx, h * sx, 0, 0, out.width, out.height);
    const pins = rows.map((r, i) => { if (!r.coords) return null; const q = map.project(r.coords); return { n: i + 1, x: ((q.x - x0) / w) * 100, y: ((q.y - y0) / h) * 100 }; }).filter(Boolean);
    return { url: out.toDataURL("image/jpeg", 0.88), pins, ratio: h / w };
  } catch (err) {
    console.warn("map snapshot failed", err);
    return null;
  } finally {
    restoreLayers();
    map.jumpTo({ ...cam, padding: pad });
  }
}

/* ---------- Shortlist PDF (A4 report) ---------- */
const PDF_LOGOS = { aldi: "aldi.png", lidl: "lidl.svg", mercadona: "mercadona.svg", vivagym: "vivagym.png", basicfit: "basicfit.png", fiveguys: "fiveguys.svg", decathloncity: "decathlon.svg", dia: "dia.svg", burgerking: "burgerking.svg" };
const pdfHue = (v) => `hsl(${Math.round(Math.max(0, Math.min(100, v)) * 1.2)}, 62%, 40%)`;
const pdfTint = (v) => `hsl(${Math.round(Math.max(0, Math.min(100, v)) * 1.2)}, 60%, 94%)`;
const PS_MARK = `<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1f6f5c"/><path d="M16 7a6.5 6.5 0 0 0-6.5 6.5c0 4.9 6.5 11.5 6.5 11.5s6.5-6.6 6.5-11.5A6.5 6.5 0 0 0 16 7z" fill="#fff"/><circle cx="16" cy="13.5" r="2.4" fill="#1f6f5c"/></svg>`;

function pdfRing(v, size = 64, stroke = 7) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, val = Number.isFinite(v) ? v : 0;
  return `<svg class="pr-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#e8ece9" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${pdfHue(val)}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * val) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-size="${size * 0.32}" font-weight="700" fill="#14231e">${Number.isFinite(v) ? Math.round(v) : "—"}</text></svg>`;
}
function pdfGauge(v01, label, note) {
  const v = Number.isFinite(v01) ? Math.max(0, Math.min(1, v01)) : null;
  const a = Math.PI * (1 - (v ?? 0)), x = 50 + 38 * Math.cos(a), y = 48 - 38 * Math.sin(a);
  const arc = v == null ? "" : `<path d="M12 48 A38 38 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${pdfHue(v * 100)}" stroke-width="8" stroke-linecap="round"/>`;
  return `<div class="pg"><svg viewBox="0 0 100 56" width="100%"><path d="M12 48 A38 38 0 0 1 88 48" fill="none" stroke="#e8ece9" stroke-width="8" stroke-linecap="round"/>${arc}<text x="50" y="46" text-anchor="middle" font-size="15" font-weight="700" fill="#14231e">${v == null ? "n/a" : `${Math.round(v * 100)}`}</text></svg><b>${escapeHtml(label)}</b><small>${escapeHtml(note)}</small></div>`;
}
function pdfBar(label, v01, w) {
  const v = Math.round((v01 ?? 0) * 100);
  return `<div class="pb"><span>${escapeHtml(label)}<em>${w ? ` ${Math.round(w * 100)}%` : ""}</em></span><i><s style="width:${v}%;background:${pdfHue(v)}"></s></i><b>${v}</b></div>`;
}
function pdfTenantMark(tenantObj, label, { big = false } = {}) {
  const file = tenantObj && PDF_LOGOS[tenantObj.id];
  if (file) return `<div class="pl-logo${big ? " pl-logo--big" : ""}"><img src="logos/${file}" alt="${escapeHtml(tenantObj.name)} logo"></div>`;
  const name = label || "Your business";
  return `<div class="pl-logo pl-logo--word${big ? " pl-logo--big" : ""}" style="--c:${tenantObj?.color || "#1f6f5c"}"><span>${escapeHtml(name.slice(0, 1).toUpperCase())}</span><b>${escapeHtml(name)}</b></div>`;
}
/** Percentile (0–1) of v among values. */
function pdfPct(values, v) {
  const s = values.filter(Number.isFinite);
  if (!s.length || !Number.isFinite(v)) return null;
  return s.filter((x) => x < v).length / Math.max(1, s.length - 1);
}
function pdfCityStats(rows) {
  const inc = {};
  for (const f of state.listings) { const p = f.properties; const h = p.od?.sec?.hinc; if (Number.isFinite(h)) (inc[p.m] ||= []).push(h); }
  return { inc };
}
function pdfSignals(r, stats) {
  const p = r.props, micro = (r.rank?.parts || []).find((x) => x.id === "micro"), sub = micro?.sub || {};
  return {
    spend: pdfPct(stats.inc[p.m] || [], p.od?.sec?.hinc),
    foot: sub.foot ?? null,
    rivals: sub.gap ?? null,
    empty: sub.health ?? null,
    day: sub.daytime ?? null,
  };
}
function pdfRules(tev) {
  if (!tev) return { pass: 0, check: 0, fail: 0, html: "" };
  const k = (c) => (c.result === true ? (c.from === "ad" ? "check" : "pass") : c.result === false ? "fail" : "check");
  const n = { pass: 0, check: 0, fail: 0 };
  const html = tev.checks.map((c) => { const s = k(c); n[s]++; return `<li class="rb rb--${s}"><span>${s === "pass" ? "PASS" : s === "fail" ? "FAIL" : "CHECK"}</span><div><b>${escapeHtml(c.label)}</b><small>${escapeHtml(String(c.shown || c.value?.() || ""))}</small></div></li>`; }).join("");
  return { ...n, html };
}
const PDF_ICONS = {
  euro: '<path d="M17 6.5A6 6 0 1 0 17 17.5M5 10.5h8M5 13.5h8"/>',
  size: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16"/>',
  ratio: '<path d="M5 19L19 5M7 7h.01M17 17h.01"/>',
  floor: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6"/>',
  door: '<path d="M4 20h16M7 20V5h10v15M14 12h.01"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  walk: '<circle cx="13" cy="4.5" r="1.5"/><path d="M9 21l2-6 3 3v3M8 11l3-3 3 1 2 3M11 15l1-5"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M21 20c0-2.5-2-4.3-4-4.8"/>',
};
const pdfIcon = (k) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PDF_ICONS[k]}</svg>`;

function pdfPlaceHtml(r, i, ctx) {
  const p = r.props, x = p.x || {}, inv = p.inv || {};
  const img = (x.imgs?.length ? x.imgs[0] : x.thumb) || "";
  const pm2 = p.p && p.sz ? Math.round(p.p / p.sz) : null;
  const price = p.p ? `${formatNumber(p.p)} €${p.op === "rent" ? "/mo" : ""}` : "On request";
  const sig = pdfSignals(r, ctx.stats);
  const parts = r.rank?.parts || [];
  const rules = pdfRules(state.tenantEval?.get(p.id));
  const od = p.od || {};
  const tile = (ic, label, val) => `<div class="pt"><i>${pdfIcon(ic)}</i><small>${escapeHtml(label)}</small><b>${escapeHtml(val)}</b></div>`;
  const days = inv.days_on_market ?? null;
  const tiles = [
    tile("euro", p.op === "rent" ? "Rent" : "Price", price),
    tile("ratio", "Per m²", pm2 ? `${formatNumber(pm2)} €` : "—"),
    tile("size", "Size", p.sz ? `${formatNumber(p.sz)} m²` : "—"),
    tile("floor", "Floor", inv.floor || x.floor || "—"),
    tile("walk", "People/day", od.ped && od.ped[1] <= 250 ? formatNumber(Math.round(od.ped[0])) : "no counter"),
    tile("people", "Household income", od.sec?.hinc ? `${formatNumber(Math.round(od.sec.hinc / 1000))}k €` : "—"),
  ].join("");
  const map = ctx.maps[i];
  const ctxLine = [od.pk ? (od.pk[0] ? `Public car park ${od.pk[1]} m` : "No public car park ≤300 m") : "", od.ld?.[1] != null ? `Street loading bay ${od.ld[1]} m` : "", p.dups?.length ? `Also listed by ${p.dups.length} other ${p.dups.length === 1 ? "agency" : "agencies"}` : ""].filter(Boolean);
  return `<section class="ps-page pp">
    <header class="pp-top"><span class="pp-n">${i + 1}</span><div class="pp-tt"><h2>${escapeHtml(listingShortTitle(p))}</h2><p>${escapeHtml(listingPlaceLine(p))}</p></div><div class="pp-brand">${PS_MARK}</div></header>
    <div class="pp-hero">
      <div class="pp-photo">${img ? `<img src="${escapeHtml(img)}" alt="">` : `<div class="pp-nophoto">No photo published</div>`}<span class="pp-op">${p.op === "rent" ? "For rent" : "For sale"}</span></div>
      <div class="pp-score">${pdfRing(r.rank?.pct, 104, 10)}<small>Rank vs ${escapeHtml(r.rank?.group || "same city")}</small>
        <div class="pp-bars">${parts.map((q) => pdfBar(q.label.replace(/ \(.+\)$/, ""), q.value, q.weight)).join("")}</div></div>
    </div>
    <div class="pp-tiles">${tiles}</div>
    <h3 class="pp-h">Versus the rest of ${escapeHtml(p.m || "the city")}</h3>
    <div class="pp-gauges">${pdfGauge(sig.spend, "Spending power", "household income, INE 2024")}${pdfGauge(sig.foot, "Footfall", od.ped && od.ped[1] <= 250 ? "with a real counter" : "shops open nearby")}${pdfGauge(sig.rivals, "Few rivals", "same-type shops 300 m")}${pdfGauge(sig.empty, "Few empty units", "closed premises 300 m")}${pdfGauge(sig.day, "Daytime crowd", "offices & schools 400 m")}</div>
    <div class="pp-low">
      <div class="pp-map">${map ? `<img src="${map.url}" alt="Map"><span class="pp-pin" style="left:${map.pins[0]?.x ?? 50}%;top:${map.pins[0]?.y ?? 50}%"></span>` : `<div class="pp-nophoto">Map unavailable</div>`}</div>
      <div class="pp-rules">${rules.html ? `<h3 class="pp-h">${escapeHtml(ctx.tenantName)} requirements</h3><ul>${rules.html}</ul>` : `<h3 class="pp-h">Why it scores</h3><ul class="pp-why">${parts.map((q) => `<li><b>${escapeHtml(q.label)}</b><small>${escapeHtml(q.line || "")}</small></li>`).join("")}</ul>`}
        ${ctxLine.length ? `<p class="pp-ctx">${ctxLine.map(escapeHtml).join(" · ")} — context only, check on site</p>` : ""}</div>
    </div>
    <footer class="pp-foot">${p.u ? `<a href="${escapeHtml(p.u)}">${escapeHtml(p.u)}</a>` : ""}<span>${escapeHtml(ctx.sources)}</span><span>${i + 2} / ${ctx.pages}</span></footer>
  </section>`;
}

function pdfCompareHtml(rows, ctx) {
  const cell = (v) => (v == null ? `<td class="pc-na">—</td>` : `<td><span class="pc-chip" style="background:${pdfTint(v * 100)};color:${pdfHue(v * 100)}">${Math.round(v * 100)}</span></td>`);
  const body = rows.map((r, i) => {
    const p = r.props, s = pdfSignals(r, ctx.stats), ru = pdfRules(state.tenantEval?.get(p.id));
    const pm2 = p.p && p.sz ? Math.round(p.p / p.sz) : null;
    return `<tr><td><span class="pc-n">${i + 1}</span></td><td class="pc-name"><b>${escapeHtml(listingShortTitle(p))}</b><small>${escapeHtml(r.areaName || "")}</small></td><td>${pdfRing(r.rank?.pct, 34, 4)}</td><td class="num">${p.p ? formatNumber(p.p) + " €" : "—"}</td><td class="num">${pm2 ? formatNumber(pm2) : "—"}</td><td class="num">${p.sz ? formatNumber(p.sz) : "—"}</td>${cell(s.spend)}${cell(s.foot)}${cell(s.rivals)}${cell(s.day)}${ctx.tenantEval ? `<td class="pc-rules"><span class="rb--pass">${ru.pass}</span><span class="rb--check">${ru.check}</span><span class="rb--fail">${ru.fail}</span></td>` : ""}</tr>`;
  }).join("");
  return `<section class="ps-page pc">
    <header class="pp-top"><div class="pp-tt"><h2>Side by side</h2><p>All ${rows.length} places on one page. Coloured scores are 0–100 versus every listing in the same city (green = better).</p></div><div class="pp-brand">${PS_MARK}</div></header>
    <table class="pc-t"><thead><tr><th></th><th>Place</th><th>Score</th><th class="num">Price</th><th class="num">€/m²</th><th class="num">m²</th><th>Spending<br>power</th><th>Footfall</th><th>Few<br>rivals</th><th>Daytime<br>crowd</th>${ctx.tenantEval ? `<th>Rules<br><small>pass · check · fail</small></th>` : ""}</tr></thead><tbody>${body}</tbody></table>
    <div class="pc-method"><h3 class="pp-h">How to read this report</h3><div class="pc-m3">
      <div><b>Score</b><p>30% neighbourhood, 25% the block around the door, 25% the unit, 20% price vs the 12 nearest comparable listings. Ranked within the same city and sale/rent.</p></div>
      <div><b>Signals</b><p>Spending power from INE household income by census section; footfall from shop density plus Madrid pedestrian counters where one is within 250 m; rivals and empty units from the city premises censuses.</p></div>
      <div><b>Rules</b><p>PASS only when listing data confirms it. A nearby public car park or street loading bay is context, never a pass: it stays CHECK until seen on site.</p></div>
    </div></div>
    <footer class="pp-foot"><span></span><span>${escapeHtml(ctx.sources)}</span><span>${ctx.pages} / ${ctx.pages}</span></footer>
  </section>`;
}

async function exportShortlist({ print = true } = {}) {
  const rows = shortlistRows();
  if (!rows.length) { alert("No places to export — zoom to an area with listings first."); return null; }
  const btn = document.querySelector("[data-pdf-export]");
  if (btn) btn.textContent = "Preparing PDF…";
  await Promise.all(rows.map((r) => ensureListingDetail(r.props)));
  const snap = await shortlistMapImage(rows);
  const maps = [];
  for (const r of rows) maps.push(await shortlistMapImage([r]));
  const tenantObj = state.tenant || null;
  const tenantName = tenantObj?.name || state.query?.label || "";
  const cities = [...new Set(rows.map((r) => r.city).filter(Boolean))].join(" · ") || (state.city !== "all" ? state.city : "Spain");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const nList = state.listings.length;
  const ctx = {
    stats: pdfCityStats(rows), maps, tenantName, tenantEval: !!state.tenantEval && !!tenantObj, pages: rows.length + 2,
    sources: `Based on ${formatNumber(nList)} listings (Idealista, deduplicated) · INE 2024 income atlas · Madrid pedestrian counters · Madrid & Barcelona premises censuses · OpenStreetMap`,
  };
  const pins = snap ? snap.pins.map((q) => `<span class="cv-pin" style="left:${q.x}%;top:${q.y}%">${q.n}</span>`).join("") : "";
  const best = Math.max(...rows.map((r) => r.rank?.pct ?? 0));
  const passAll = ctx.tenantEval ? rows.filter((r) => pdfRules(state.tenantEval.get(r.props.id)).fail === 0).length : null;
  const list = rows.map((r, i) => `<li><span class="cv-n">${i + 1}</span><span class="cv-t"><b>${escapeHtml(listingShortTitle(r.props))}</b><small>${escapeHtml(r.areaName || "")}${r.props.p ? ` · ${formatNumber(r.props.p)} €${r.props.op === "rent" ? "/mo" : ""}` : ""}${r.props.sz ? ` · ${formatNumber(r.props.sz)} m²` : ""}</small></span><i class="cv-bar"><s style="width:${r.rank?.pct ?? 0}%;background:${pdfHue(r.rank?.pct ?? 0)}"></s></i><b class="cv-s" style="color:${pdfHue(r.rank?.pct ?? 0)}">${r.rank?.pct ?? ""}</b></li>`).join("");
  const filters = [...CHIP_DEFS.filter((d) => state.chips.has(d.id)).map((d) => d.label), state.maxPrice ? PRICE_OPTS.find((o) => o[0] === state.maxPrice)[1] : "", state.sizeRange !== "any" ? SIZE_OPTS.find((o) => o[0] === state.sizeRange)[1] : ""].filter(Boolean);
  const kpi = (v, l) => `<div class="cv-k"><b>${v}</b><small>${l}</small></div>`;
  let sheet = document.getElementById("print-sheet");
  if (!sheet) { sheet = document.createElement("div"); sheet.id = "print-sheet"; document.body.appendChild(sheet); }
  sheet.innerHTML = `<section class="ps-page cv">
    <div class="cv-band">
      <div class="cv-brand">${PS_MARK}<span>Property Scanner</span><em>${escapeHtml(today)}</em></div>
      <div class="cv-hero">${pdfTenantMark(tenantObj, tenantName, { big: true })}
        <div><p class="cv-kicker">Location shortlist${tenantObj ? " · prepared for" : ""}</p><h1>${escapeHtml(tenantName || "Best places")}</h1><p class="cv-sub">${rows.length} ${rows.length === 1 ? "premises" : "premises"} in ${escapeHtml(cities)}, ranked on data${filters.length ? ` · filters: ${escapeHtml(filters.join(", "))}` : ""}</p></div></div>
      <div class="cv-kpis">${kpi(formatNumber(nList), "listings analysed")}${kpi(rows.length, "on this shortlist")}${kpi(best, "best score / 100")}${passAll != null ? kpi(`${passAll}/${rows.length}`, "no failed rule") : kpi("5", "open data sources")}</div>
    </div>
    <div class="cv-body">
      ${snap ? `<div class="cv-map" style="aspect-ratio:${Math.max(1.3, 1 / snap.ratio).toFixed(3)}"><img src="${snap.url}" alt="Map of the shortlisted places">${pins}</div>` : ""}
      <ol class="cv-list">${list}</ol>
      <div class="cv-legend"><span>Score</span><i></i><small>0 weak</small><small>100 strong</small></div>
    </div>
    <footer class="pp-foot"><span></span><span>${escapeHtml(ctx.sources)}</span><span>1 / ${ctx.pages}</span></footer>
  </section>${rows.map((r, i) => pdfPlaceHtml(r, i, ctx)).join("")}${pdfCompareHtml(rows, ctx)}`;
  renderPdfBar();
  await Promise.all([...sheet.querySelectorAll("img")].map((im) => (im.complete ? null : new Promise((res) => { im.onload = im.onerror = res; setTimeout(res, 6000); }))));
  document.body.classList.add("printing");
  const prevTitle = document.title;
  document.title = `Shortlist ${tenantName || ""} ${cities}`.trim();
  if (print) {
    window.addEventListener("afterprint", () => { document.body.classList.remove("printing"); document.title = prevTitle; }, { once: true });
    window.print();
  }
  return rows.length;
}
