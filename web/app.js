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
    label: "Open premises per km²",
    field: "open_per_km2",
    ramp: ["#e8f1f8", "#c5d9ea", "#8eb5d4", "#4a7fa3", "#0e3d5c"],
  },
  open: {
    label: "Open premises",
    field: "open",
    ramp: ["#eef0f8", "#c9cfea", "#8ea0d4", "#4d62a8", "#1e2a6b"],
  },
  competitors: {
    label: "This business per km²",
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
    label: "Complementary shops per km²",
    field: "complements_per_km2",
    ramp: ["#e7f4ea", "#c3e4cb", "#86c498", "#3d8f55", "#14532d"],
  },
  room: {
    label: "Closed or empty doors per km²",
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
    label: "Residents per km²",
    field: "pop_per_km2",
    ramp: ["#e7f2f4", "#bddde3", "#7eb8c4", "#3a8494", "#0f3d48"],
  },
  income: {
    label: "Disposable income per person",
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
    label: "Metro stations",
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
    label: "Retail floor area",
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
  mapStyle: "light",
  filters: { competition: true, complements: true, daytime: true, vacancies: true },
  selectedId: null,
  activeListingId: null,
  listingWalkScores: new Map(),
  ready: false,
};

const mapLegend = document.querySelector("#map-legend");
const mapStyleToolbar = document.querySelector("#map-style-toolbar");
const mapHeatmapToolbar = document.querySelector("#map-heatmap-toolbar");

const MAP_STYLES = {
  light: { label: "Light", url: "https://tiles.openfreemap.org/styles/positron", swatch: "#ebe6dc" },
  streets: { label: "Streets", url: "https://tiles.openfreemap.org/styles/bright", swatch: "#d4e2ed" },
  liberty: { label: "Liberty", url: "https://tiles.openfreemap.org/styles/liberty", swatch: "#c8dcc4" },
  dark: { label: "Dark", url: "https://tiles.openfreemap.org/styles/dark", swatch: "#3a3a40" },
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
  "Complements in the walk": "Complementary shops inside the walk that bring passing trade without direct competition.",
  "Empty doors in the walk": "Vacant or closed doors inside the walk. Good on a busy street; often a warning on a quiet one.",
  "Area fit": "Overall neighborhood score for your selected business type, from census and context data.",
  "Walk fit": "Score for the 10-minute walk around this exact address, using live shop locations on the map.",
};

function scoreTipHtml(label) {
  const tip = SCORE_TIPS[label];
  if (!tip) return "";
  return `<span class="score-tip" tabindex="0" aria-label="${escapeHtml(tip)}"><span class="score-tip__mark" aria-hidden="true">?</span><span class="score-tip__bubble">${escapeHtml(tip)}</span></span>`;
}

function scoreBarHtml(score, label = "Fit score", withTip = false, featured = false) {
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
  </div>`;
}

function listingFitScore(props) {
  const area = state.areaById?.get(props.i);
  const areaScore = area?.properties?.score ?? 0;
  const walkScore = state.listingWalkScores.get(props.id);
  if (walkScore == null) return areaScore;
  return combinedFitScore(areaScore, walkScore);
}

function dedupeListingFeatures(features) {
  const byTitle = new Map();
  const richness = (feature) => {
    const props = feature.properties;
    const detail = props.x || {};
    return (
      Number(props.full) * 1000 +
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
    const older = Number.isFinite(props.pct_65) ? `, ${props.pct_65}% aged 65 or over` : "";
    lines.push(`Mean age ${props.age_mean}${older}`);
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
    if (filters.competition && gap < 0.55) unit *= 0.62 + 0.38 * (gap / 0.55);
    props.score = stretchScoreFromUnit(unit);
    props.matches = item.matches;
    props.complements = item.complements;
    props.parts = parts;
    props.lead = leadFrom(parts, props, query);
  });

  for (const feature of state.areas.features) {
    if (state.city !== "all" && feature.properties.city !== state.city) feature.properties.score = -1;
  }
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
  const dark = state.mapStyle === "dark";
  const opacity = dark
    ? ["interpolate", ["linear"], ["zoom"], 6, 0.32, 9, 0.82, 12, 0.78, 13, 0.48, 14, 0.24, 16, 0.14]
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
  const expression = ["case",
    ["<", ["get", "score"], 0], "#ebe4da",
    ["!", ["has", mode.field]], "#ebe4da",
    interpolate,
  ];
  map.setPaintProperty(MAP_LAYERS.areasFill, "fill-color", expression);
  paintAreaFillOpacity();
  if (mapLegend) {
    mapLegend.innerHTML = `<span class="swatches" title="${escapeHtml(mode.label)}">${ramp.map((color) => `<i style="background:${color}"></i>`).join("")}</span>`;
  }
}

function renderAreaRanking() {
  if (!areaRanking || !areaRankingTitle) return;
  const rows = visibleAreas()
    .slice()
    .sort((a, b) => b.properties.score - a.properties.score);
  areaRankingTitle.textContent = rankingConceptTitle("neighborhood");
  if (!rows.length) {
    areaRanking.innerHTML = `<li><p class="pinned-empty">${state.areas ? "No areas match this city filter." : "Loading neighborhoods…"}</p></li>`;
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
        <span class="row-area-score">${scoreBarHtml(props.score, "Area fit", false, true)}</span>
      </button></li>`;
    })
    .join("");
}

function rankableListings() {
  if (!state.listings.length) return [];
  return collectRankableListings({ restrictToBounds: false });
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

function buildOverallRanking() {
  return rankableListings()
    .sort((a, b) => {
      const fitDelta = Number(listingHasAreaFit(b.props)) - Number(listingHasAreaFit(a.props));
      if (fitDelta !== 0) return fitDelta;
      return b.score - a.score;
    })
    .slice(0, 14);
}

function renderListingRanking() {
  if (!listingRanking || !listingRankingTitle) return;
  const items = buildOverallRanking();
  listingRankingTitle.textContent = rankingConceptTitle("property");
  listingRanking.innerHTML = items.length
    ? items
        .map((item, index) => {
          const title = listingHeadline(item.props);
          const meta = [item.areaName, item.city].filter(Boolean).join(", ");
          return `<li><button type="button" data-kind="listing" data-id="${escapeHtml(item.id)}">
        <span class="rank-num">${index + 1}</span>
        <span class="row-name">${escapeHtml(title)}</span>
        <span class="row-city">${escapeHtml(meta)}</span>
        <span class="row-price-meta">${listingPriceHtml(item.props, { variant: "compact", showPm2: false, inlineSize: true })}<span class="row-tag row-tag--sale">For sale</span></span>
        <span class="score-bar-wrap">${scoreBarHtml(item.score, "Overall fit")}</span>
      </button></li>`;
        })
        .join("")
    : `<li><p class="pinned-empty">No property leads in this view yet.</p></li>`;
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

function listingPriceHtml(props, { variant = "hero", showPm2 = true, inlineSize = false } = {}) {
  const amount = formatEuro(props.p);
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
      city,
      areaName: area?.properties?.name || props.n || "",
      props,
    });
  }
  return rows;
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

function nearbyPlacesBlock(nearby) {
  if (!Number.isFinite(nearby?.count)) return "";
  const score = nearbyCompetitorScore(nearby);
  const rating = nearby.rating ? ` · avg ${nearby.rating}★` : "";
  const chips = (nearby.names || [])
    .slice(0, 6)
    .map((name) => `<span class="nearby-chip">${escapeHtml(name)}</span>`)
    .join("");
  return `<div class="nearby-block">
    ${fitScoreRowHtml("Nearby competitors", score)}
    <p class="nearby-summary">${formatNumber(nearby.count)} Google places of this type within 400 m${rating}</p>
    ${chips ? `<div class="nearby-chips">${chips}</div>` : ""}
  </div>`;
}

function walkBreakdownHtml(scored, nearby) {
  return `${nearbyPlacesBlock(nearby)}<p class="unit-note">${escapeHtml(leadFrom(scored.parts))}</p>${partsHtml(scored.parts)}`;
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

detailModalBody.addEventListener("click", (event) => {
  const button = event.target.closest(".modal-thumb-btn");
  if (!button) return;
  const hero = detailModalBody.querySelector(".modal-hero img");
  const src = button.dataset.image || button.querySelector("img")?.getAttribute("src");
  if (!hero || !src) return;
  hero.src = src;
  detailModalBody.querySelectorAll(".modal-thumb-btn").forEach((node) => {
    node.classList.toggle("is-active", node === button);
  });
  hero.scrollIntoView({ block: "nearest", behavior: "smooth" });
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

function listingModalContent(props) {
  const detail = props.x || {};
  const images = (detail.imgs?.length ? detail.imgs : detail.thumb ? [detail.thumb] : []).slice(0, 16);
  const mediaTopBar = listingMediaTopBarHtml(props, detail);
  const media = listingMediaHtml(images, props.u, mediaTopBar);
  const location = [props.n, props.d].filter(Boolean).join(", ");
  const factsHtml = listingSpecsHtml(detail, props, { showEmpty: true });
  const desc = detail.desc ? listingDescriptionHtml(detail.desc) : "";
  const area = state.areaById?.get(props.i);
  const areaProps = area?.properties;
  const concept = (state.query?.label || "your concept").toLowerCase();
  const fitBlock = modalFitSectionHtml(areaProps, concept);
  const partialNote = props.full
    ? ""
    : `<p class="listing-partial-note">This lead is from a search snapshot only. Re-scrape with <strong>fetchDetails</strong> on Idealista to unlock full characteristics.</p>`;
  return `<article class="modal-listing" id="detail-modal-title">
    <header class="modal-listing__head">
      <div class="tag-row">
        <span class="status-pill">Commercial premises</span>
        <span class="status-pill status-pill--sale">For sale</span>
      </div>
      <h2>${escapeHtml(listingHeadline(props))}</h2>
      ${location ? `<p class="pin-row">${PIN_ICON}<span>${escapeHtml(location)}</span></p>` : ""}
    </header>
    ${partialNote}
    ${media}
    ${desc}
    ${factsHtml}
    ${fitBlock}
  </article>`;
}

function areaModalContent(props) {
  const lines = neighborhoodFitLines(props, state.query);
  const concept = (state.query?.label || "your concept").toLowerCase();
  return `<article class="modal-area" id="detail-modal-title">
    <h2>${escapeHtml(props.name)}</h2>
    ${locationRow(props.district, props.city)}
    ${visitReasonHtml(props)}
    ${modalFitSectionHtml(props, concept)}
    ${censusBlock(lines)}
  </article>`;
}

function openListingDetail(props, coordinates) {
  state.activeListingId = props.id || null;
  if (props.i) {
    setSelected(props.i);
    renderAreaRanking();
  }
  openDetailModal(listingModalContent(props));
  if (coordinates) {
    map.flyTo({ center: coordinates, zoom: Math.max(map.getZoom(), 15), duration: 650 });
    showCatchment(coordinates[0], coordinates[1]);
  }
}

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
  const specsHtml = listingSpecsHtml(detail, props, { showEmpty: true });
  const fitHtml = areaProps
    ? `<p class="kicker">Area fit</p>${scoreBarHtml(areaProps.score, "Area fit", true)}${partsHtml(areaProps.parts)}`
    : `<p class="kicker">Area fit</p><p class="unit-note">No neighborhood score for this pin yet.</p>`;
  const inner = `
    <div class="tag-row">
      <span class="status-pill">Commercial premises</span>
      <span class="status-pill status-pill--sale">For sale</span>
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
  const trade = bandScore(open, target.openLow, target.openHigh, profile.crowd < 0.5);
  const gap = bandScore(matchW, target.matchLow, target.matchHigh, true);
  const pals = Math.min(1, palW / target.palTarget);
  const alive = open >= target.openLow * 0.7;
  const doors = alive ? Math.min(1, vacant / 8) : Math.max(0, 1 - (vacant + closed) / 30);
  const parts = [
    { label: "Shops in the walk", detail: `${formatNumber(open)} open premises`, score: Math.round(trade * 100), weight: profile.signals.street, value: trade, line: `${formatNumber(open)} open premises inside the walk` },
    { label: "Competitors in the walk", detail: `${formatNumber(matchN)} ${plural(query.label, matchN)}, closer ones count more`, score: Math.round(gap * 100), weight: profile.signals.gap, value: gap, line: `${formatNumber(matchN)} ${plural(query.label, matchN)} inside the walk. Closer ones count more.` },
    { label: "Complements in the walk", detail: `${formatNumber(palN)} complementary shops`, score: Math.round(pals * 100), weight: profile.signals.pals, value: pals, line: `${formatNumber(palN)} complementary shops inside the walk` },
    { label: "Empty doors in the walk", detail: alive ? `${formatNumber(vacant)} empty doors on a trading street` : `${formatNumber(vacant + closed)} empty or closed doors on a thin street`, score: Math.round(doors * 100), weight: 0.4, value: doors, line: alive ? `${formatNumber(vacant)} empty doors where the street is already trading` : `${formatNumber(vacant + closed)} empty or closed doors on a thin street` },
  ];
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = weight ? Math.round((parts.reduce((sum, part) => sum + part.weight * part.value, 0) / weight) * 100) : 0;
  return { score, parts, open, matchN };
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
        slot.innerHTML = `<p class="kicker">Proximity breakdown</p><p class="live-note">${escapeHtml(walk.error || nearby.error || "Walk shape is unavailable.")}</p>${nearbyPlacesBlock(nearby)}`;
        return;
      }
      if (!state.places?.length) {
        slot.innerHTML = `<p class="kicker">Proximity breakdown</p><p class="live-note">The blue shape is a 10-minute walk. Premises are still loading, so the proximity score is not ready.</p>${nearbyPlacesBlock(nearby)}`;
        return;
      }
      const scored = scoreWalk(lon, lat, feature);
      if (state.activeListingId) {
        state.listingWalkScores.set(state.activeListingId, scored.score);
        renderListingRanking();
      }
      refreshFitScoresUi(areaScore, scored.score);
      slot.innerHTML = `<p class="kicker">Proximity breakdown</p>${walkBreakdownHtml(scored, nearby)}`;
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
    if (zoom >= 11) features.push(feature);
  }
  map.getSource(MAP_SOURCES.listings).setData({ type: "FeatureCollection", features });
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
  const narrow = window.innerWidth <= 760;
  if (narrow) {
    return { left: 24, right: 24, top: 200, bottom: Math.round(window.innerHeight * 0.44) };
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
  mapHeatmapToolbar.innerHTML = HEATMAP_TOOLBAR_KEYS
    .map((id) => {
      const mode = HEATMAPS[id];
      if (!mode) return "";
      const chip = mode.ramp[Math.min(2, mode.ramp.length - 1)];
      return `<button type="button" class="heatmap-chip${id === state.heatmap ? " is-active" : ""}" data-heatmap="${id}" title="${escapeHtml(mode.label)}" style="--chip:${chip}">${escapeHtml(mode.label)}</button>`;
    })
    .join("");
}

function setHeatmapMode(id) {
  if (!HEATMAPS[id]) return;
  state.heatmap = id;
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

async function bootstrapAppData() {
  setRankingsLoading(true);
  try {
    const areas = await fetch("data/areas.geojson").then((response) => response.json());
    state.areas = areas;
    state.areaById = new Map(areas.features.map((feature) => [feature.properties.id, feature]));
    if (map.getSource(MAP_SOURCES.areas)) map.getSource(MAP_SOURCES.areas).setData(areas);

    const [places, listingsDoc] = await Promise.all([
      fetch("data/places.json").then((response) => response.json()),
      fetch("data/listings.geojson").then((response) => (response.ok ? response.json() : { features: [] })),
    ]);
    state.places = places;
    const allListings = listingsDoc.features || [];
    const fullListings = allListings.filter((feature) => feature.properties?.full);
    const pool = FULL_DETAIL_LEADS_ONLY && fullListings.length ? fullListings : allListings;
    state.listings = dedupeListingFeatures(pool);
    state.listingById = new Map(state.listings.map((feature) => [feature.properties.id, feature]));
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
  for (const row of state.places) {
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
  const city = pickerValue("city");
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
  map.fitBounds(SPAIN_BOUNDS, { padding: mapPadding(), duration: 0 });
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
    setPicker("city", cityHit.properties.city);
    readInputs(true);
    return;
  }
  const listing = listingNearCursor(event.point);
  if (listing) {
    openListingDetail(listing.properties, listing.geometry.coordinates);
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
  renderListingRanking();
});

map.on("error", (event) => {
  const message = String(event.error?.message || event.error || "");
  if (message.includes("does not exist in the map's style")) return;
  console.error(event.error || event);
});

