/* Tenant profiles: a named chain's published site requirements, encoded as
 * hard filters (pass / fail / unknown per listing) + soft weights for ranking.
 * Every criterion carries its source; `verified:false` = not on the chain's own
 * current page (press / inference) and is shown as such in the UI. */

const SRC_ALDI = {
  url: "https://www.aldi.es/can/servicios/expansion-inmobiliaria.html",
  label: "aldi.es · Expansión inmobiliaria (checked 24 Oct 2026)",
};
const SRC_ALDI_2018 = {
  url: "https://www.elespanol.com/invertia/empresas/20180601/aldi-nuevos-espacios-instalarse-empuje-lidl-mercadona/311469917_0.html",
  label: "El Español, 1 Jun 2018 (press, not on Aldi's current page)",
};

const SRC_LIDL = { url: "https://www.expansion-lidl.es/", label: "expansion-lidl.es · Lidl expansion portal (no size sheet)" };
const SRC_LIDL_PRESS = { url: "https://www.expansion.com/empresas/distribucion/2021/09/23/614b0ffde5fdde0b3c8b4598.html", label: "Expansión, 23 Sep 2021 · El Español 2016 (press)" };
const SRC_LIDL_2026 = { url: "https://empresa.lidl.es/sala-de-prensa/lidl-mas-cerca-de-ti/lidl-inaugura-una-nueva-tienda-urbana-en-el-distrito-de-sant-marti-barcelona-tras-invertir-4-4-m-y-emplear-a-25-personas", label: "Lidl press release, 17 Sep 2026 · urban store Barcelona: 1,300 m² sales, 72 spaces (official)" };
const SRC_LIDL_2026B = { url: "https://empresa.lidl.es/sala-de-prensa/actualidad-lidl/lidl-da-la-bienvenida-al-otono-con-cinco-nuevas-tiendas-en-espana-y-una-inversion-de-mas-de-30-m", label: "Lidl press release, autumn 2026 · five openings 1,000–1,550 m², 100–120 spaces (official)" };
const SRC_MERC_ROIG = { url: "https://www.larazon.es/comunidad-valenciana/juan-roig-5-claves-que-debe-tener-local-que-mercadona-escoja-ser-supermercado_2026031169b12947d489bf782e165878.html", label: "La Razón, 11 Mar 2026 · Juan Roig's 5 keys (press)" };
const SRC_MERC_SIZE = { url: "https://www.abc.es/espana/andalucia/cordoba/espectacular-mercadona-nuevo-gran-barrio-cordoba-dos-20260507235652-nts.html", label: "ABC, 7 May 2026 · Mercadona Córdoba project: 1,902 m² sales floor, 240 spaces (press)" };
const SRC_BF = { url: "https://www.basic-fit.com/es-es/expansion", label: "basic-fit.com · Expansión (official)" };
const SRC_BF_TYPES = { url: "https://corporate.basic-fit.com/es/real-estate/property-types", label: "corporate.basic-fit.com · Property types (official)" };
const SRC_VIVA = { url: "https://cincodias.elpais.com/cincodias/2019/07/18/companias/1563464958_946379.html", label: "Cinco Días, 18 Jul 2019 (press)" };
const SRC_VIVA_2023 = { url: "https://palco23.mundodeportivo.com/fitness/vivagym-abre-dos-gimnasios-entre-vitoria-y-barcelona-y-supera-los-260-en-la-peninsula", label: "Palco23, 15 Oct 2025 · new clubs 1,500+ m² (press)" };
const SRC_VIVA_2025 = { url: "https://gymfactory.net/2025/05/06/simancas-y-vallecas-dan-la-bienvenida-a-dos-nuevos-centros-vivagym/", label: "Gym Factory, 6 May 2025 · Madrid clubs 1,200 and 1,400 m² (press)" };
const SRC_5G = { url: "https://fiveguys.com/wp-content/uploads/2025/07/Five-Guys-Preferred-Site-Criteria.pdf", label: "Five Guys Preferred Site Criteria (official PDF, 2025)" };
const SRC_5G_ES = { url: "https://www.linkedin.com/company/five-guys-spain/", label: "Five Guys Spain on LinkedIn (links the PDF)" };
const SRC_DEC = { url: "https://cincodias.elpais.com/companias/2026-03-16/decathlon-toma-los-centros-urbanos-en-su-nueva-fase-de-aperturas-en-espana.html", label: "Cinco Días, 16 Mar 2026 · City format ~500 m² (press)" };
const SRC_DEC_EX = { url: "https://revistacentroscomerciales.com/noticias/marcas/decathlon-inaugura-un-nuevo-punto-de-venta-en-madrid/", label: "Revista Centros Comerciales 2026 · City Embajadores 1,000+ m²; Córdoba 470 m², Ourense 914 m² (press)" };
const SRC_DIA = { url: "https://www.dia.es/tiendas/inmuebles", label: "dia.es · Buscamos terrenos y locales (official)" };
const SRC_DIA_FR = { url: "https://franquicia.dia.es/metros-cuadrados-supermercado/", label: "franquicia.dia.es · franchise stores 200–500 m² (official)" };
const SRC_CRF = { url: "https://www.carrefour.es/franquicias-carrefour-express/mas-info/modelos-de-tienda/", label: "carrefour.es · Carrefour Express store models (official)" };
const SRC_CRF_AEF = { url: "https://www.aefranquicia.es/ensenas/carrefour-express/", label: "Spanish Franchise Association listing (franchisor-supplied)" };
const SRC_BK = { url: "http://www.buscofranquicia.com/cas/ficha.php?id=53", label: "AEF official franchise book · Burger King sheet (franchisor-supplied)" };

function sizeCheck(min, src, verified, note) {
  return { id: "size", ask: "What is the gross built area (m²)?", label: `Gross area ≥ ${min.toLocaleString("en-US")} m²`, src, verified, note, test: (l) => (l.sz ? l.sz >= min : null), value: (l) => (l.sz ? `${l.sz.toLocaleString("es-ES")} m²` : "size not listed") };
}
function groundCheck(src, verified, note) {
  return { id: "ground", ask: "Is the premises on the ground floor with its own street entrance?", label: "Ground floor, street entrance", src, verified, note, test: (l, inv) => ((inv.floor || "").startsWith("Ground") || inv.location_type === "Street level" ? true : inv.floor || inv.location_type ? false : null), value: (l, inv) => inv.location_type || inv.floor || "position not listed" };
}

const TENANTS = {
  aldi: {
    id: "aldi",
    name: "Aldi",
    concept: "grocery",
    retail: true,
    contact: "expansion@aldi.es",
    short: "Supermarket · 1,000+ m²", color: "#00005f", initials: "AL",
    size: { min: 1000, lo: 1500, hi: 2000, max: 4000 },
    blurb: "Discount supermarket. Smallest published format: urban store from 1,000 m² gross; mall / retail-park stores 1,500–2,000 m² with 20–30 m frontage.",
    sources: [SRC_ALDI, SRC_ALDI_2018],
    hard: [
      {
        id: "size", ask: "What is the gross built area (m²)?", label: "Gross area ≥ 1,000 m²", src: SRC_ALDI, verified: true,
        note: "Tienda urbana: superficie bruta a partir de 1.000 m².",
        test: (l) => (l.sz ? l.sz >= 1000 : null), value: (l) => (l.sz ? `${l.sz.toLocaleString("es-ES")} m²` : "size not listed"),
      },
      {
        id: "facade", ask: "What is the street frontage in linear metres?", label: "Frontage 20–30 m (mall / retail-park formats)", src: SRC_ALDI, verified: true,
        note: "Fachada 20-30 metros lineales (parque comercial; 'preferentemente' en centro comercial). Not stated for the urban format.",
        test: (l, inv) => (Number.isFinite(inv.facade_m) && inv.facade_m > 0 ? inv.facade_m >= 20 : inv.facade_band === "> 12 m" ? null : inv.facade_band ? false : null),
        value: (l, inv) => (inv.facade_m ? `${inv.facade_m} m` : inv.facade_band || "not listed"),
      },
      {
        id: "height", ask: "What is the clear ceiling height (altura libre) in metres?", label: "Ceiling height > 3.5 m", src: SRC_ALDI, verified: true,
        note: "Altura de la tienda > 3,5 m (parque / centro comercial). Idealista does not publish ceiling height.",
        test: () => null, value: () => "not in Idealista data",
      },
      {
        id: "loading", ask: "Is there a loading/unloading bay or legal loading access for trucks?", label: "Loading / unloading access", src: SRC_ALDI, verified: true,
        note: "Posibilidad de carga y descarga. Not in Idealista data — check on site.",
        test: () => null, value: () => "not in Idealista data",
      },
      {
        id: "catchment", ask: "", label: "Catchment > 20,000 inhabitants", src: SRC_ALDI, verified: true,
        note: "Área de influencia > 20.000 habitantes (standard store). Checked at city level only; walk-catchment population is not computed.",
        test: (l) => (l.m === "Madrid" || l.m === "Barcelona" ? true : null),
        value: (l) => `${l.m || "city"} (city-level check)`,
      },
      {
        id: "parking", ask: "How many parking spaces come with or are next to the premises?", label: "Parking (~80 spaces)", src: SRC_ALDI_2018, verified: false,
        note: "2018 press interview; not on Aldi's current expansion page. Idealista premises ads do not report parking.",
        test: () => null, value: () => "not in Idealista data",
      },
    ],
    // Soft weights (sum 1). Inputs are percentile ranks among same-city listings.
    soft: [
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.25, src: SRC_ALDI, verified: true, note: "'alto tránsito peatonal'" },
      { id: "traffic", label: "Vehicle traffic (measured veh/h)", w: 0.2, src: SRC_ALDI, verified: true, note: "'y/o vehículos'" },
      { id: "residents", label: "Residents per km²", w: 0.2, src: SRC_ALDI, verified: true, note: "catchment > 20,000" },
      { id: "sizefit", label: "Size near 1,500–2,000 m²", w: 0.15, src: SRC_ALDI, verified: true, note: "mall / park format range" },
      { id: "street", label: "Street level, ground floor", w: 0.1, src: null, verified: false, note: "inferred from 'alta visibilidad'" },
      { id: "onefloor", label: "Single floor", w: 0.1, src: SRC_ALDI_2018, verified: false, note: "'preferiblemente de una sola planta' (2018 press)" },
    ],
  },

  lidl: {
    id: "lidl", name: "Lidl", concept: "grocery", retail: true,
    short: "Supermarket · 1,100+ m²", color: "#0050aa", initials: "LI",
    contact: "", contactUrl: "https://www.expansion-lidl.es/",
    blurb: "Discount supermarket. Lidl publishes no size sheet; its expansion portal takes both plots and premises. Press: ground-floor premises from ~1,100 m² in big cities, typically 1,200–1,800 m² with parking.",
    size: { min: 1100, lo: 1200, hi: 1800, max: 4000 },
    sources: [SRC_LIDL, SRC_LIDL_PRESS],
    hard: [
      sizeCheck(1100, SRC_LIDL_2026B, true, "Lidl's own 2026 releases: new stores 1,000–1,550 m² of sales floor (urban Barcelona 1,300 m²). Older press: premises from ~1,100 m²."),
      groundCheck(SRC_LIDL_PRESS, false, "Press: 'locales comerciales en planta baja'."),
      { id: "parking", ask: "How many parking spaces come with or are next to the premises?", label: "Parking (recent stores 72–120 spaces)", src: SRC_LIDL_2026, verified: true, note: "Lidl 2026 releases: urban Barcelona 72 underground spaces; regional stores ~100–120. Some city-centre stores have none.", test: () => null, value: () => "not in Idealista data" },
      { id: "loading", ask: "Is there a loading/unloading bay or legal loading access for trucks?", label: "Loading / unloading access", src: null, verified: false, note: "Inferred: every supermarket needs truck deliveries.", test: () => null, value: () => "not in Idealista data" },
    ],
    soft: [
      { id: "residents", label: "Residents per km²", w: 0.3, src: null, verified: false, note: "neighbourhood shop" },
      { id: "traffic", label: "Vehicle traffic (measured veh/h)", w: 0.2, src: SRC_LIDL_2026, verified: false, note: "drive-to, parking" },
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.15, src: null, verified: false, note: "inference" },
      { id: "sizefit", label: "Size near 1,200–1,800 m²", w: 0.25, src: SRC_LIDL_PRESS, verified: false, note: "press" },
      { id: "street", label: "Street level, ground floor", w: 0.1, src: SRC_LIDL_PRESS, verified: false, note: "press" },
    ],
  },
  mercadona: {
    id: "mercadona", name: "Mercadona", concept: "grocery", retail: true,
    short: "Supermarket · ~1,700 m²", color: "#0a8a3a", initials: "ME",
    contact: "", contactUrl: "https://info.mercadona.es/es/conoce-mercadona/proveedores",
    blurb: "Spain's largest supermarket. Mercadona publishes no site requirements. Juan Roig's five keys (Mar 2026): car access & parking, loading without disturbing neighbours, room for the full ~8,000-product range, staff changing rooms, profitability. 2025 openings averaged ~1,740 m² of sales floor.",
    size: { min: 1300, lo: 1500, hi: 2200, max: 4000 },
    sources: [SRC_MERC_ROIG, SRC_MERC_SIZE],
    hard: [
      sizeCheck(1300, SRC_MERC_SIZE, false, "No official minimum. Roig (Mar 2026): the full ~8,000-product range must fit. 2026 project: 1,902 m² sales floor, 2,325 m² store, so ~1,300 m² gross is a practical floor."),
      { id: "parking", ask: "How many parking spaces come with or are next to the premises?", label: "Car access and parking", src: SRC_MERC_ROIG, verified: false, note: "Roig, Mar 2026 (press interview).", test: () => null, value: () => "not in Idealista data" },
      { id: "loading", ask: "Can trucks load/unload without blocking the street or disturbing neighbours?", label: "Loading without disturbing neighbours", src: SRC_MERC_ROIG, verified: false, note: "Roig, Mar 2026 (press interview).", test: () => null, value: () => "not in Idealista data" },
      { id: "staff", ask: "Is there space for staff changing rooms and a back office?", label: "Room for staff changing rooms", src: SRC_MERC_ROIG, verified: false, note: "Roig, Mar 2026 (press interview).", test: () => null, value: () => "not in Idealista data" },
    ],
    soft: [
      { id: "residents", label: "Residents per km²", w: 0.35, src: null, verified: false, note: "neighbourhood shop" },
      { id: "traffic", label: "Vehicle traffic (measured veh/h)", w: 0.2, src: SRC_MERC_ROIG, verified: false, note: "car access" },
      { id: "sizefit", label: "Size near 1,500–2,200 m²", w: 0.3, src: SRC_MERC_SIZE, verified: false, note: "2025 average" },
      { id: "street", label: "Street level, ground floor", w: 0.15, src: null, verified: false, note: "inference" },
    ],
  },
  basicfit: {
    id: "basicfit", name: "Basic-Fit", concept: "gym", retail: true,
    short: "Gym · 800–2,500 m²", color: "#ff7900", initials: "BF",
    contact: "", contactUrl: "https://www.basic-fit.com/es-es/expansion",
    blurb: "Budget gym chain. Official: 800–2,500 m² with good visibility; city-centre clubs 900–2,000 m², often near public transport, no parking needed.",
    size: { min: 800, lo: 1200, hi: 1500, max: 3000 },
    sources: [SRC_BF, SRC_BF_TYPES],
    hard: [
      { id: "size", ask: "What is the gross built area (m²)?", label: "Area 800–2,500 m²", src: SRC_BF, verified: true, note: "basic-fit.com expansion page: 800–2.500 m². Most clubs 1,200–1,500 m²; up to 3,000 m².", test: (l) => (l.sz ? l.sz >= 800 && l.sz <= 3000 : null), value: (l) => (l.sz ? `${l.sz.toLocaleString("es-ES")} m²` : "size not listed") },
      { id: "visibility", ask: "Is the premises visible from the street, with room for signage?", label: "Good visibility / branding", src: SRC_BF_TYPES, verified: true, note: "'visibility and branding opportunities are preferred'. Approximated as street level.", test: (l, inv) => (inv.location_type === "Street level" || (inv.floor || "").startsWith("Ground") ? true : null), value: (l, inv) => inv.location_type || inv.floor || "position not listed" },
      { id: "height", ask: "What is the clear ceiling height (altura libre) in metres?", label: "Ceiling height (ask)", src: null, verified: false, note: "Not published; gyms usually need ~3 m+. Inference.", test: () => null, value: () => "not in Idealista data" },
    ],
    soft: [
      { id: "transit", label: "Near public transport", w: 0.3, src: SRC_BF_TYPES, verified: true, note: "'often located near public transport'" },
      { id: "residents", label: "Residents per km²", w: 0.3, src: null, verified: false, note: "members live nearby" },
      { id: "sizefit", label: "Size near 1,200–1,500 m²", w: 0.25, src: SRC_BF_TYPES, verified: true, note: "'most clubs'" },
      { id: "street", label: "Street level, ground floor", w: 0.15, src: SRC_BF_TYPES, verified: true, note: "visibility" },
    ],
  },
  vivagym: {
    id: "vivagym", name: "VivaGym", concept: "gym", retail: true,
    short: "Gym · ~1,000–1,900 m²", color: "#e4002b", initials: "VG",
    contact: "", contactUrl: "https://vivagym.es/",
    blurb: "Spanish budget gym chain (260+ clubs). No published requirements; 2025 openings were 1,200–2,000 m² (Madrid 1,200 and 1,400 m², Vitoria/Cornellà 1,500+ m²).",
    size: { min: 1000, lo: 1400, hi: 1900, max: 3000 },
    sources: [SRC_VIVA_2025, SRC_VIVA_2023, SRC_VIVA],
    hard: [
      sizeCheck(1000, SRC_VIVA_2025, false, "Press only: 2025 openings 1,200–2,000 m²; all León clubs > 1,000 m²."),
      { id: "height", ask: "What is the clear ceiling height (altura libre) in metres?", label: "Ceiling height (ask)", src: null, verified: false, note: "Not published. Inference.", test: () => null, value: () => "not in Idealista data" },
    ],
    soft: [
      { id: "residents", label: "Residents per km²", w: 0.35, src: null, verified: false, note: "inference" },
      { id: "transit", label: "Near public transport", w: 0.25, src: null, verified: false, note: "inference" },
      { id: "sizefit", label: "Size near 1,400–1,900 m²", w: 0.3, src: SRC_VIVA_2025, verified: false, note: "press" },
      { id: "income", label: "Disposable income", w: 0.1, src: null, verified: false, note: "inference" },
    ],
  },
  fiveguys: {
    id: "fiveguys", name: "Five Guys", concept: "food", retail: true,
    short: "Burgers · 190–280 m²", color: "#c8102e", initials: "5G",
    contact: "", contactUrl: SRC_5G.url,
    blurb: "Fast-casual burgers. Official site criteria: 2,000–3,000 sq ft (≈186–279 m², ideal ≈232 m²), ≥32 ft (≈9.8 m) frontage, corner or end-cap, 11'6\" (≈3.5 m) ceiling, 35 parking spaces unless the area is high-footfall. Spanish units are 215–300 m².",
    size: { min: 186, lo: 215, hi: 280, max: 400 },
    sources: [SRC_5G, SRC_5G_ES],
    hard: [
      { id: "size", ask: "What is the gross built area (m²)?", label: "Area ≈186–280 m² (2,000–3,000 sq ft)", src: SRC_5G, verified: true, note: "Ideal 2,500 sq ft. Spanish examples 215–300 m², so up to ~320 m² passes.", test: (l) => (l.sz ? l.sz >= 180 && l.sz <= 320 : null), value: (l) => (l.sz ? `${l.sz.toLocaleString("es-ES")} m²` : "size not listed") },
      { id: "facade", ask: "What is the street frontage in linear metres?", label: "Frontage ≥ 9.8 m (32 ft)", minFacade: 9.75, src: SRC_5G, verified: true, note: "Minimum 32 ft of frontage.", test: (l, inv) => (Number.isFinite(inv.facade_m) && inv.facade_m > 0 ? inv.facade_m >= 9.75 : inv.facade_band === "> 12 m" ? true : null), value: (l, inv) => (inv.facade_m ? `${inv.facade_m} m` : inv.facade_band || "not listed") },
      { id: "corner", ask: "Is it a corner or end-of-row unit?", label: "Corner or end-cap unit", src: SRC_5G, verified: true, note: "Preferred site criteria.", test: (l, inv) => (inv.corner === true ? true : null), value: (l, inv) => (inv.corner ? "corner unit" : "not stated") },
      { id: "smoke", ask: "Is there a smoke extraction outlet (salida de humos) to roof level?", label: "Smoke outlet (salida de humos)", src: null, verified: false, note: "Inferred: a grill kitchen needs one under Spanish licensing.", test: (l, inv) => (inv.smoke === true ? true : null), value: (l, inv) => (inv.smoke ? "smoke outlet listed" : "not stated") },
      { id: "height", ask: "What is the clear ceiling height (altura libre) in metres?", label: "Ceiling ≥ 3.5 m (11'6\")", src: SRC_5G, verified: true, note: "Preferred site criteria.", test: () => null, value: () => "not in Idealista data" },
    ],
    soft: [
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.4, src: SRC_5G, verified: true, note: "high-pedestrian areas need no parking" },
      { id: "sizefit", label: "Size near 215–280 m²", w: 0.25, src: SRC_5G, verified: true, note: "ideal 2,500 sq ft" },
      { id: "street", label: "Street level, ground floor", w: 0.2, src: SRC_5G, verified: true, note: "frontage" },
      { id: "transit", label: "Near public transport", w: 0.15, src: null, verified: false, note: "inference" },
    ],
  },
  decathloncity: {
    id: "decathloncity", name: "Decathlon City", concept: "fashion", retail: true,
    short: "Sports retail · ~500–900 m²", color: "#3643ba", initials: "DC",
    contact: "", contactUrl: "https://www.decathlon.es/",
    blurb: "Decathlon's city-centre format (32 in Spain, 7 opening H1 2026). No published requirements; press: typically ~500 m² in central streets; 2026 openings 470–1,000+ m². Mapped to the Clothing business type.",
    size: { min: 400, lo: 500, hi: 900, max: 1500 },
    sources: [SRC_DEC, SRC_DEC_EX],
    hard: [
      sizeCheck(400, SRC_DEC, false, "Press only: City format ~500 m²; 2026 examples Córdoba 470, Granada 800, Ourense 914, Madrid Embajadores 1,000+ m²."),
      groundCheck(SRC_DEC, false, "Press: high-street city-centre premises. Inference."),
    ],
    soft: [
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.4, src: SRC_DEC, verified: false, note: "city-centre format" },
      { id: "transit", label: "Near public transport", w: 0.2, src: null, verified: false, note: "inference" },
      { id: "sizefit", label: "Size near 500–900 m²", w: 0.25, src: SRC_DEC, verified: false, note: "press" },
      { id: "street", label: "Street level, ground floor", w: 0.15, src: null, verified: false, note: "inference" },
    ],
  },
  dia: {
    id: "dia", name: "Dia", concept: "grocery", retail: true,
    short: "Supermarket · 750+ m² (own) / 150+ m² (franchise)", color: "#e30613", initials: "DI",
    contact: "", contactUrl: SRC_DIA.url,
    blurb: "Proximity supermarket. Official property page: central premises in large and medium cities, at least 750 m² built; or plots of 3,000 m²+ on good roads for a 1,200 m² store with 80 parking spaces. Franchise stores are 200–500 m².",
    size: { min: 750, lo: 750, hi: 1200, max: 2000 },
    sources: [SRC_DIA, SRC_DIA_FR],
    hard: [
      sizeCheck(750, SRC_DIA, true, "'Con un mínimo de 750 m² de superficie construida' (company-run stores)."),
      groundCheck(SRC_DIA, false, "Official: 'locales comerciales céntricos'. Ground floor is inferred."),
      { id: "city", ask: "", label: "Large or medium city", src: SRC_DIA, verified: true, note: "'En ciudades grandes y medianas'. Madrid and Barcelona pass.", test: (l) => (l.m === "Madrid" || l.m === "Barcelona" ? true : null), value: (l) => l.m || "city" },
    ],
    soft: [
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.3, src: SRC_DIA, verified: true, note: "'céntricos'" },
      { id: "residents", label: "Residents per km²", w: 0.35, src: null, verified: false, note: "proximity format" },
      { id: "sizefit", label: "Size near 750–1,200 m²", w: 0.2, src: SRC_DIA, verified: true, note: "750 m² min; 1,200 m² plot store" },
      { id: "street", label: "Street level, ground floor", w: 0.15, src: null, verified: false, note: "inference" },
    ],
  },
  carrefourexpress: {
    id: "carrefourexpress", name: "Carrefour Express", concept: "grocery", retail: true,
    short: "Convenience supermarket · 100+ m²", color: "#1e5bc6", initials: "CE",
    contact: "", contactUrl: SRC_CRF.url,
    blurb: "Franchised proximity supermarket. Official: stores from 100 m² of sales floor. The franchise association sheet adds ~120 m² minimum and towns of ~3,000+ inhabitants.",
    size: { min: 100, lo: 150, hi: 400, max: 700 },
    sources: [SRC_CRF, SRC_CRF_AEF],
    hard: [
      sizeCheck(100, SRC_CRF, true, "'Superficies a partir de 100 m² de sala de ventas'."),
      groundCheck(SRC_CRF_AEF, false, "Street-level premises (franchise sheet)."),
    ],
    soft: [
      { id: "residents", label: "Residents per km²", w: 0.4, src: null, verified: false, note: "proximity format" },
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.3, src: null, verified: false, note: "inference" },
      { id: "sizefit", label: "Size near 150–400 m²", w: 0.15, src: SRC_CRF, verified: false, note: "100 m² min, inference above" },
      { id: "street", label: "Street level, ground floor", w: 0.15, src: SRC_CRF_AEF, verified: false, note: "franchise sheet" },
    ],
  },
  burgerking: {
    id: "burgerking", name: "Burger King", concept: "food", retail: true,
    short: "Burgers · 225+ m², 6 m front", color: "#d62300", initials: "BK",
    contact: "", contactUrl: SRC_BK.url,
    blurb: "Fast food. Franchise sheet (Spanish Franchise Association book): premises from 225 m² with 6 m frontage and a catchment of 30,000+ inhabitants; prime high streets, malls, leisure areas, stations or free-standing sites.",
    size: { min: 225, lo: 250, hi: 450, max: 800 },
    sources: [SRC_BK],
    hard: [
      sizeCheck(225, SRC_BK, true, "'Local mínimo 225 m²' (franchisor-supplied sheet)."),
      { id: "facade", ask: "What is the street frontage in linear metres?", label: "Frontage ≥ 6 m", minFacade: 6, src: SRC_BK, verified: true, note: "'6 m de fachada'.", test: (l, inv) => (Number.isFinite(inv.facade_m) && inv.facade_m > 0 ? inv.facade_m >= 6 : inv.facade_band === "> 12 m" ? true : null), value: (l, inv) => (inv.facade_m ? `${inv.facade_m} m` : inv.facade_band || "not listed") },
      { id: "smoke", ask: "Is there a smoke extraction outlet (salida de humos) to roof level?", label: "Smoke outlet (salida de humos)", src: null, verified: false, note: "Inferred: a grill kitchen needs one under Spanish licensing.", test: (l, inv) => (inv.smoke === true ? true : null), value: (l, inv) => (inv.smoke ? "smoke outlet listed" : "not stated") },
      { id: "catchment", ask: "", label: "Catchment ≥ 30,000 inhabitants", src: SRC_BK, verified: true, note: "City-level check only.", test: (l) => (l.m === "Madrid" || l.m === "Barcelona" ? true : null), value: (l) => `${l.m || "city"} (city-level check)` },
    ],
    soft: [
      { id: "foot", label: "Pedestrian traffic (open shops/km²)", w: 0.4, src: SRC_BK, verified: true, note: "prime commercial streets" },
      { id: "transit", label: "Near public transport", w: 0.2, src: SRC_BK, verified: true, note: "stations listed as target sites" },
      { id: "sizefit", label: "Size near 250–450 m²", w: 0.2, src: null, verified: false, note: "inference above 225 m²" },
      { id: "street", label: "Street level, ground floor", w: 0.2, src: SRC_BK, verified: true, note: "high streets" },
    ],
  },
};

/* ---- Ad-text scan + on-site checklist (round 8) ---- */
const CHECKS_KEY = "ps-tenant-checks-v1";
function loadChecks() { try { return JSON.parse(localStorage.getItem(CHECKS_KEY) || "{}"); } catch { return {}; } }
function saveCheck(listingId, checkId, v) {
  const all = loadChecks();
  const row = (all[listingId] ||= {});
  if (v === "clear") delete row[checkId]; else row[checkId] = v;
  if (!Object.keys(row).length) delete all[listingId];
  try { localStorage.setItem(CHECKS_KEY, JSON.stringify(all)); } catch { /* storage full / private mode */ }
}

function listingAdText(p) {
  const inv = p.inv || {};
  return [inv.desc_es, inv.desc_ca, inv.desc_en, p.x?.desc, p.adx].filter(Boolean).join("\n");
}

const num = (s) => Number(String(s).replace(",", "."));
/** Keyword evidence from the advertiser's text. Returns {result, quote} or null. */
const AD_SCANS = {
  parking: (t) => {
    const m = t.match(/[^.\n]{0,40}\b(aparcamiento|parking|p[aà]rquing|plazas? de garaje|plazas? de aparcamiento|places? d'aparcament)\b[^.\n]{0,40}/i);
    if (!m) return null;
    const neg = /\b(sin|no dispone|no tiene|sense)\b[^.\n]{0,15}(aparcamiento|parking|p[aà]rquing)/i.test(m[0]);
    if (neg) return { result: false, quote: m[0].trim() };
    const words = { una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
    const n = m[0].match(/(\d{1,4}|una|un|dos|tres|cuatro|cinco)\s+(plazas?|places|spaces)/i);
    const count = n ? Number(n[1]) || words[n[1].toLowerCase()] : null;
    // a mention without a count is evidence, not a pass: Aldi wants ~80 spaces
    return { result: count == null ? null : count >= 60, quote: m[0].trim(), shown: count == null ? "ad mentions parking (no count)" : `${count} spaces (from ad)` };
  },
  loading: (t) => {
    const m = t.match(/[^.\n]{0,40}\b(muelles? de carga|zona de carga|carga y descarga|c[aà]rrega i desc[aà]rrega|loading (bay|dock)|acceso (para|de) camiones|moll de c[aà]rrega)\b[^.\n]{0,40}/i);
    return m ? { result: true, quote: m[0].trim() } : null;
  },
  height: (t) => {
    const m = t.match(/(altura(?: libre| lliure)?|techos?(?: de)?|ceiling height|al[cç]ada(?: lliure)?)[^0-9\n]{0,15}(\d{1,2}(?:[.,]\d{1,2})?)\s*(m|metros|meters)\b/i);
    if (!m) return null;
    const h = num(m[2]);
    return h > 1.8 && h < 30 ? { result: h > 3.5, quote: m[0].trim(), shown: `${h} m (from ad)` } : null;
  },
  facade: (t, h) => {
    const m = t.match(/(fachada|fa[cç]ana|frontage|façade)[^0-9\n]{0,20}(\d{1,3}(?:[.,]\d{1,2})?)\s*(m|metros|ml|meters)\b/i);
    if (!m) return null;
    const f = num(m[2]);
    return f > 1 && f < 300 ? { result: f >= (h?.minFacade || 20), quote: m[0].trim(), shown: `${f} m (from ad)` } : null;
  },
};

/** Listings a retail tenant would never take: warehouses (nave / industrial) and price-size outliers. */
let LISTING_MEDIANS = null;
function listingExclusion(p) {
  if (/^nave\b/i.test(p.t || "") || p.x?.idealista?.["detailedType.subTypology"] === "industrialPremise") return "Warehouse (nave)";
  return listingOutlier(p);
}
function listingOutlier(p) {
  if (!LISTING_MEDIANS && typeof state !== "undefined" && state.listings?.length) {
    const g = {};
    for (const f of state.listings) { const q = f.properties; if (q.pm2 > 0) (g[`${q.m}|${q.op}`] ||= []).push(q.pm2); }
    LISTING_MEDIANS = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.sort((a, b) => a - b)[Math.floor(v.length / 2)]]));
  }
  if (p.sz > 10000) return `Outlier: ${Math.round(p.sz).toLocaleString("es-ES")} m² (logistics-scale)`;
  const med = LISTING_MEDIANS?.[`${p.m}|${p.op}`];
  if (med && p.pm2 > 0 && (p.pm2 < med / 5 || p.pm2 > med * 5)) return `Outlier: ${p.pm2} €/m² vs ${p.m} median ${med}`;
  return "";
}

function tenantPct(sorted, v) {
  if (!sorted.length || !Number.isFinite(v)) return 0.5;
  let below = 0;
  for (const s of sorted) if (s < v) below += 1;
  return below / Math.max(1, sorted.length - 1);
}

/** Evaluate every listing against a tenant. Returns Map id -> {checks, pass, fail, unknown, soft, ok}. */
function evaluateTenant(tenant, listings, areaById) {
  const out = new Map();
  const userChecks = loadChecks();
  const byCity = {};
  for (const f of listings) {
    const p = f.properties;
    const a = areaById?.get(p.i)?.properties || {};
    (byCity[p.m] ||= { foot: [], traffic: [], residents: [], transit: [], income: [] });
    byCity[p.m].transit.push(typeof transitValue === "function" ? transitValue(a) : null);
    byCity[p.m].income.push(a.income_eur);
    byCity[p.m].foot.push(a.open_per_km2);
    byCity[p.m].traffic.push(a.traffic_veh_h);
    byCity[p.m].residents.push(a.pop_per_km2);
  }
  for (const c of Object.values(byCity)) for (const k of Object.keys(c)) c[k] = c[k].filter(Number.isFinite).sort((x, y) => x - y);
  for (const f of listings) {
    const p = f.properties;
    const inv = p.inv || {};
    const a = areaById?.get(p.i)?.properties || {};
    const mine = userChecks[p.id] || {};
    let adText = null;
    const checks = tenant.hard.map((h) => {
      let result = h.test(p, inv, a), shown = h.value(p, inv, a), from = result == null ? "none" : "data", quote = "";
      if (result == null && AD_SCANS[h.id]) {
        adText ??= listingAdText(p);
        const hit = AD_SCANS[h.id](adText, h);
        if (hit) { result = hit.result; from = "ad"; quote = hit.quote; if (hit.shown) shown = hit.shown; }
      }
      if (h.id in mine) { result = mine[h.id]; from = "you"; }
      return { ...h, result, shown, from, quote };
    });
    const c = byCity[p.m] || { foot: [], traffic: [], residents: [], transit: [], income: [] };
    const z = tenant.size || { min: 1000, lo: 1500, hi: 2000, max: 4000 };
    const sz = p.sz || 0;
    const parts = {
      foot: tenantPct(c.foot, a.open_per_km2),
      traffic: tenantPct(c.traffic, a.traffic_veh_h),
      residents: tenantPct(c.residents, a.pop_per_km2),
      transit: tenantPct(c.transit, typeof transitValue === "function" ? transitValue(a) : null),
      income: tenantPct(c.income, a.income_eur),
      sizefit: sz >= z.lo && sz <= z.hi ? 1 : sz >= z.min && sz <= z.max ? 0.7 : sz >= z.min * 0.8 && sz <= z.max * 1.3 ? 0.35 : Math.min(0.3, sz / (z.lo * 1.8)),
      street: (inv.floor || "").startsWith("Ground") || inv.location_type === "Street level" ? 1 : inv.floor || inv.location_type ? 0.2 : 0.5,
      onefloor: inv.floors_in_unit === 1 ? 1 : inv.floors_in_unit > 1 ? 0.3 : 0.5,
    };
    const soft = Math.round(100 * tenant.soft.reduce((s, x) => s + x.w * parts[x.id], 0));
    const pass = checks.filter((x) => x.result === true).length;
    const fail = checks.filter((x) => x.result === false).length;
    const confirmed = checks.filter((x) => x.result === true && x.from !== "ad").length;
    out.set(p.id, { checks, pass, confirmed, fail, unknown: checks.length - pass - fail, soft, parts, ok: fail === 0, excluded: tenant.retail ? listingExclusion(p) : "" });
  }
  return out;
}

function tenantSrcLink(src) {
  return src ? `<a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.label)}</a>` : "inference";
}

function tenantChecksHtml(tenant, ev, listingId) {
  if (!ev) return "";
  const icon = (r) => (r === true ? `<span class="tc tc--pass" aria-label="pass">✓</span>` : r === false ? `<span class="tc tc--fail" aria-label="fail">✗</span>` : `<span class="tc tc--unk" aria-label="unknown">?</span>`);
  const FROM = { data: "from Idealista data", ad: "from ad text — check it", you: "your on-site check", none: "unknown — check on site" };
  const seg = (c) => `<span class="tc-seg" role="group" aria-label="Set ${escapeHtml(c.label)}">${[["true", "Pass"], ["false", "Fail"], ["null", "?"]].map(([v, l]) => `<button type="button" data-tcheck="${c.id}" data-v="${v}" class="${c.from === "you" && String(c.result) === v ? "is-on" : ""}">${l}</button>`).join("")}${c.from === "you" ? `<button type="button" data-tcheck="${c.id}" data-v="clear" class="tc-reset" title="Remove my answer">reset</button>` : ""}</span>`;
  const rows = ev.checks
    .map((c) => `<li class="tc-row tc-from--${c.from}">${icon(c.result)}<div><b>${escapeHtml(c.label)}</b>${c.verified ? "" : ` <span class="tc-unv">not verified</span>`}<span class="tc-val">${escapeHtml(c.shown)}</span><span class="tc-from">${FROM[c.from]}${c.quote ? `: “${escapeHtml(c.quote.slice(0, 110))}”` : ""}</span><small>${escapeHtml(c.note)} · ${tenantSrcLink(c.src)}</small></div>${seg(c)}</li>`)
    .join("");
  const soft = tenant.soft
    .map((s) => `<li><span>${escapeHtml(s.label)}${s.verified ? "" : ` <span class="tc-unv">not verified</span>`}</span><span class="nbars__track"><span style="width:${Math.round(100 * ev.parts[s.id])}%;--v:${Math.round(100 * ev.parts[s.id])}"></span></span><small>${Math.round(s.w * 100)}%</small></li>`)
    .join("");
  const asks = ev.checks.filter((c) => c.ask && (c.result == null || c.from === "ad")).map((c) => c.from === "ad" ? `${c.ask} (the ad suggests: “${c.quote.slice(0, 60)}” — please confirm)` : c.ask);
  const qs = asks.length ? `<h4 class="tenant-sub">Questions for the agent</h4><ol class="tenant-asks">${asks.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol><button type="button" class="tenant-copy" data-copy-asks="${escapeHtml(asks.map((q, n) => `${n + 1}. ${q}`).join("\n"))}">Copy questions</button>` : "";
  const verdict = ev.fail ? `Fails ${ev.fail} hard criteria` : ev.unknown ? `No fails · ${ev.unknown} to check on site` : "Passes every hard criterion";
  return `<section class="card-section tenant-fit" data-tenant-listing="${escapeHtml(listingId || "")}">
    <h3 class="card-section__title">Tenant fit · ${escapeHtml(tenant.name)} <span class="tenant-verdict ${ev.fail ? "is-fail" : "is-ok"}">${escapeHtml(verdict)}</span></h3>
    ${ev.excluded ? `<p class="tenant-excl">⚠ ${escapeHtml(ev.excluded)} — hidden from the ${escapeHtml(tenant.name)} ranking by default.</p>` : ""}
    <p class="unit-note">${escapeHtml(tenant.blurb)} ${tenant.contact ? `Contact: <a href="mailto:${tenant.contact}">${tenant.contact}</a>` : tenant.contactUrl ? `Contact: <a href="${escapeHtml(tenant.contactUrl)}" target="_blank" rel="noopener">expansion page</a>` : ""}</p>
    <p class="unit-note">Tap Pass / Fail / ? to record what you checked on site. Answers stay in this browser and override the data and the ad text.</p>
    <ul class="tenant-checks">${rows}</ul>
    ${qs}
    <h4 class="tenant-sub">Soft ranking score <b>${ev.soft}</b>/100</h4>
    <ul class="tenant-soft">${soft}</ul>
  </section>`;
}
