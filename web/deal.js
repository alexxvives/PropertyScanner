/* Deal calculator + curated investor fields for for-sale listings.
 * Loaded before app.js; uses escapeHtml/formatNumber from app.js at call time.
 * All maths is client-side; nothing is sent anywhere. */

const DEAL_DEFAULTS = {
  // Fallback rent assumption (€/m²/month) when there are no rental comps nearby.
  // Rough street-retail asking rents; ALWAYS an assumption, editable in the card.
  rentAssumption: { madrid: 16, barcelona: 18, other: 12 },
  itp: { madrid: 6, barcelona: 10, other: 7 }, // % transfer tax (Madrid 6%, Catalonia 10%)
  notaryRegistryPct: 1.5,
  capex: 0, // € one-off works
  vacancyPct: 5, // % of gross rent
  opexPct: 8, // % of gross rent (IBI, insurance, community, management)
  compRadiusM: 800,
  // Financing defaults. Source: Globalcaja (Caja Rural) pre-contract sheet "Hipoteca adquisición/reforma locales",
  // Sept 2026: max 60% of appraisal, 20 years, 3.95% year 1 then Euribor (2.954%, BOE 02/09/2026) + 1.50–2.70 pp,
  // APR (TAE) 5.88% without bundled products. BBVA "Hipoteca Negocios": up to 70% LTV. → 60% LTV, 5.5%, 20 yrs.
  ltvPct: 60,
  ratePct: 5.5,
  termYrs: 20,
  minComps: 3,
};

/* Yield benchmarks (net of buying costs, vacancy and running costs, like our "Net yield").
 * - Prime high street: 3.75% (CBRE Spain retail figures H1 2026 and Q4 2025; Colliers Snapshot Retail MAD & BCN Q1 2026: 3.70% Madrid, 3.80% Barcelona).
 * - Typical street premises: idealista gross yield for "locales", Q3 2026 (13 Oct 2026): Madrid 6.8%, Barcelona 8.0%, Spain 10.0%.
 *   Converted to our net basis with the calculator's own defaults (13% of rent lost to vacancy + opex, ~8–12% buying costs): ≈ ×0.78.
 * The target is the city's typical net yield; red at prime level, green ~2 points above typical. */
const YIELD_BENCH = {
  prime: 3.75,
  gross: { madrid: 6.8, barcelona: 8.0, other: 10.0 },
  target: { madrid: 5.3, barcelona: 6.2, other: 7.8 },
  label: { madrid: "Madrid", barcelona: "Barcelona", other: "Spain" },
};
function yieldTone(net, region = "other") {
  if (net == null || !Number.isFinite(net)) return "";
  const lo = YIELD_BENCH.prime, hi = (YIELD_BENCH.target[region] || 7.8) + 2;
  const t = Math.max(0, Math.min(1, (net - lo) / (hi - lo)));
  return `hsl(${Math.round(t * 125)} 62% ${t > 0.35 && t < 0.7 ? 36 : 40}%)`;
}
function yieldWord(net, region = "other") {
  if (net == null || !Number.isFinite(net)) return "";
  const tgt = YIELD_BENCH.target[region] || 7.8;
  if (net < YIELD_BENCH.prime + 0.5) return "Prime-street level — only worth it on a top street";
  if (net < tgt - 0.5) return `Below the typical ${YIELD_BENCH.label[region]} premises yield`;
  if (net < tgt + 1) return `About typical for ${YIELD_BENCH.label[region]} premises`;
  return `Above typical for ${YIELD_BENCH.label[region]} premises`;
}
function yieldTipText(region = "other") {
  const L = YIELD_BENCH.label[region];
  return `Net yield = yearly rent after vacancy and running costs ÷ all-in purchase cost. Benchmarks: prime high-street ${YIELD_BENCH.prime}% (CBRE H1 2026, Colliers Q1 2026); typical ${L} premises ≈ ${YIELD_BENCH.target[region]}% net (idealista Q3 2026: ${YIELD_BENCH.gross[region]}% gross). Red = prime-level, green = clearly above typical.`;
}

function dealRegion(props) {
  const text = `${props.m || ""} ${props.pr || ""} ${props.i || ""}`.toLowerCase();
  if (/barcelona|catalu|^bcn-|\bbcn-/.test(text)) return "barcelona";
  if (/madrid|^mad-|\bmad-/.test(text)) return "madrid";
  return "other";
}

function haversineM(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function median(values) {
  const v = [...values].sort((x, y) => x - y);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Median asking rent €/m²/month from rental listings near the point, or null. */
function rentComps(coords, listings) {
  if (!coords) return { median: null, n: 0 };
  const values = [];
  for (const f of listings || []) {
    const p = f.properties || {};
    if (p.op !== "rent" || !p.p || !p.sz) continue;
    if (haversineM(coords, f.geometry.coordinates) > DEAL_DEFAULTS.compRadiusM) continue;
    values.push(p.p / p.sz);
  }
  if (values.length < DEAL_DEFAULTS.minComps) return { median: null, n: values.length };
  return { median: Math.round(median(values) * 10) / 10, n: values.length };
}

function dealInputs(props, coords, listings) {
  const region = dealRegion(props);
  const comps = rentComps(coords, listings);
  return {
    price: Number(props.p) || 0,
    size: Number(props.sz) || 0,
    rentM2: comps.median ?? DEAL_DEFAULTS.rentAssumption[region],
    rentSource: comps.median != null ? `median of ${comps.n} rental listings within ${DEAL_DEFAULTS.compRadiusM} m` : "assumption (no rental comps nearby)",
    rentIsAssumption: comps.median == null,
    itpPct: DEAL_DEFAULTS.itp[region],
    notaryPct: DEAL_DEFAULTS.notaryRegistryPct,
    capex: DEAL_DEFAULTS.capex,
    vacancyPct: DEAL_DEFAULTS.vacancyPct,
    opexPct: DEAL_DEFAULTS.opexPct,
    lev: 0,
    ltvPct: DEAL_DEFAULTS.ltvPct,
    ratePct: DEAL_DEFAULTS.ratePct,
    termYrs: DEAL_DEFAULTS.termYrs,
    region,
  };
}

function dealMath(i) {
  const grossRent = i.rentM2 * i.size * 12;
  const totalCost = i.price * (1 + (i.itpPct + i.notaryPct) / 100) + i.capex;
  const netRent = grossRent * (1 - (i.vacancyPct + i.opexPct) / 100);
  return {
    pm2: i.size ? i.price / i.size : null,
    grossRent,
    totalCost,
    netRent,
    grossYield: i.price ? (grossRent / i.price) * 100 : null,
    netYield: totalCost ? (netRent / totalCost) * 100 : null,
    payback: netRent > 0 ? totalCost / netRent : null,
    ...leverMath(i, totalCost, netRent),
  };
}

/** Mortgage on the purchase price: equity = all-in cost − loan; cash-on-cash = (net rent − loan payments) ÷ equity. */
function leverMath(i, totalCost, netRent) {
  const ltv = Math.max(0, Math.min(90, Number(i.ltvPct) || 0)) / 100;
  const loan = (Number(i.price) || 0) * ltv;
  const n = Math.max(1, Math.round((Number(i.termYrs) || 20) * 12));
  const r = Math.max(0, Number(i.ratePct) || 0) / 1200;
  const monthly = loan ? (r ? (loan * r) / (1 - (1 + r) ** -n) : loan / n) : 0;
  const debt = monthly * 12;
  const equity = totalCost - loan;
  const cash = netRent - debt;
  return {
    loan, debt, equity, cashFlow: cash,
    coc: equity > 0 ? (cash / equity) * 100 : null,
    equityYield: equity > 0 ? ((netRent - loan * (r * 12)) / equity) * 100 : null, // after interest only (principal repaid = your wealth)
    cashPayback: cash > 0 && equity > 0 ? equity / cash : null,
  };
}

function dealFmtEuro(n) {
  return n == null || !Number.isFinite(n) ? "—" : `${Math.round(n).toLocaleString("es-ES")} €`;
}
function dealFmtPct(n) {
  return n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(1)}%`;
}
function dealFmtYears(n) {
  return n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(1)} yrs`;
}

function dealOutputsHtml(i) {
  const m = dealMath(i);
  const rows = [
    ["Price per m²", m.pm2 == null ? "—" : `${Math.round(m.pm2).toLocaleString("es-ES")} €/m²`],
    ["Gross rent / year", dealFmtEuro(m.grossRent)],
    ["All-in cost", dealFmtEuro(m.totalCost)],
    ["Net rent / year", dealFmtEuro(m.netRent)],
    ["Gross yield", dealFmtPct(m.grossYield)],
    ["Net yield", dealFmtPct(m.netYield)],
    ["Payback", dealFmtYears(m.payback)],
  ];
  return rows.map(([k, v]) => `<div class="deal-out"><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}

/** Compact, read-only yield line for hover cards. */
function dealSummaryHtml(props, coords, listings) {
  if (props.op === "rent") return "";
  const i = dealInputs(props, coords, listings);
  if (!i.price || !i.size) return "";
  const m = dealMath(i);
  return `<p class="deal-summary">Est. gross ${dealFmtPct(m.grossYield)} · net ${dealFmtPct(m.netYield)} · payback ${dealFmtYears(m.payback)}${i.rentIsAssumption ? ` <span class="deal-flag">rent assumed ${i.rentM2} €/m²</span>` : ""}</p>`;
}

/** Editable calculator for the listing modal (visual). */
function dealCalculatorHtml(props, coords, listings) {
  if (props.op === "rent") return "";
  const i = dealInputs(props, coords, listings);
  const field = (name, label, value, step, suffix) =>
    `<label class="deal-in"><span>${label}</span><span class="deal-in__box"><input type="number" inputmode="decimal" step="${step}" data-deal="${name}" value="${value}" /><em>${suffix}</em></span></label>`;
  const maxRent = Math.max(40, Math.ceil(i.rentM2 * 2));
  return `<section class="deal-calc card-section" data-deal-region="${i.region}">
    <input type="hidden" data-deal-region-v="${i.region}" />
    <label class="deal-slider"><span>Market rent <b data-rent-label>${rentLabel(i.rentM2, i.size)}</b>${i.rentIsAssumption ? ' <em class="deal-flag">assumed</em>' : ""}${infoTip(`Estimated rent a tenant would pay: ${i.rentSource}. Drag to test other rents.`)}</span>
      <input type="range" min="1" max="${maxRent}" step="0.5" value="${i.rentM2}" data-deal-slider="rentM2" /></label>
    <div class="deal-visual">${dealVisualHtml(i)}</div>
    <div class="deal-lev">
      <label class="deal-switch"><input type="checkbox" data-deal="lev" /><span class="deal-switch__ui" aria-hidden="true"></span><span>Finance with a mortgage${infoTip("Defaults: 60% loan-to-value, 5.5% interest, 20 years — Globalcaja's Sept 2026 commercial-premises mortgage sheet (max 60% LTV, 20 yrs, Euribor + 1.50–2.70 pp, APR 5.88%). BBVA lends up to 70%. Edit to match your bank's offer.")}</span></label>
      <div class="deal-grid deal-grid--lev" hidden>
        ${field("ltvPct", "Loan-to-value", i.ltvPct, 5, "%")}
        ${field("ratePct", "Interest rate", i.ratePct, 0.1, "% / yr")}
        ${field("termYrs", "Term", i.termYrs, 1, "years")}
      </div>
    </div>
    <details class="deal-assumptions"><summary>Assumptions (price, taxes, costs)</summary>
      <div class="deal-grid">
        ${field("price", "Asking price", i.price, 1000, "€")}
        ${field("size", "Size", i.size, 1, "m²")}
        ${field("rentM2", "Market rent", i.rentM2, 0.5, "€/m²/mo")}
        ${field("itpPct", "ITP", i.itpPct, 0.5, "%")}
        ${field("notaryPct", "Notary + registry", i.notaryPct, 0.1, "%")}
        ${field("capex", "Capex / works", i.capex, 1000, "€")}
        ${field("vacancyPct", "Vacancy", i.vacancyPct, 1, "% rent")}
        ${field("opexPct", "Opex (IBI, insurance…)", i.opexPct, 1, "% rent")}
      </div>
      <p class="deal-note${i.rentIsAssumption ? " deal-note--warn" : ""}">Rent: ${escapeHtml(i.rentSource)}. ITP default ${i.region === "barcelona" ? "10% (Catalonia)" : i.region === "madrid" ? "6% (Madrid)" : "7% (generic)"}. Yields are pre-tax; turn on the mortgage for the financed view. Benchmarks: CBRE Spain retail H1 2026, Colliers Snapshot Retail Q1 2026, idealista yield report Q3 2026.</p>
    </details>
  </section>`;
}

function rentLabel(rentM2, size) {
  const total = (Number(rentM2) || 0) * (Number(size) || 0);
  return total ? `${dealFmtEuro(total)} / month <small>(${rentM2} €/m²)</small>` : `${rentM2} €/m²/mo`;
}

function readDealInputs(section) {
  const out = { region: section.dataset.dealRegion || "other" };
  section.querySelectorAll("input[data-deal]").forEach((el) => {
    out[el.dataset.deal] = el.type === "checkbox" ? (el.checked ? 1 : 0) : Number(el.value) || 0;
  });
  return out;
}

/** Wire live recalculation (event delegation; call once with the modal body). */
function bindDealCalculator(root) {
  root.addEventListener("input", (event) => {
    const section = event.target.closest(".deal-calc");
    if (!section) return;
    const slider = event.target.dataset.dealSlider;
    if (slider) {
      const box = section.querySelector(`input[data-deal="${slider}"]`);
      if (box) box.value = event.target.value;
    } else if (event.target.dataset.deal === "rentM2") {
      const sl = section.querySelector('input[data-deal-slider="rentM2"]');
      if (sl) sl.value = event.target.value;
    }
    const i = readDealInputs(section);
    const levGrid = section.querySelector(".deal-grid--lev");
    if (levGrid) levGrid.hidden = !i.lev;
    const label = section.querySelector("[data-rent-label]");
    if (label) label.innerHTML = rentLabel(i.rentM2, i.size);
    section.querySelector(".deal-visual").innerHTML = dealVisualHtml(i);
    const kpi = root.querySelector("[data-hero-yield]");
    if (kpi) { const ny = dealMath(i).netYield; kpi.textContent = dealFmtPct(ny); kpi.style.color = yieldTone(ny, i.region); }
    const pb = root.querySelector("[data-hero-payback]");
    if (pb) pb.textContent = `${dealFmtYears(dealMath(i).payback)} payback`;
  });
}

const INV_ROWS = [
  ["location", "Location"],
  ["floor", "Floor"],
  ["location_type", "Position"],
  ["usable_m2", "Usable area"],
  ["facade_m", "Facade length"],
  ["facade_band", "Facade (band)"],
  ["shop_windows", "Shop windows"],
  ["floors_in_unit", "Floors in unit"],
  ["rooms", "Rooms"],
  ["bathrooms", "Toilets / bathrooms"],
  ["year_built", "Year built"],
  ["building_type", "Building"],
  ["last_activity", "Last activity"],
  ["transfer_cost", "Transfer (traspaso)"],
  ["storefront", "Storefront / frontage"],
  ["condition", "Condition"],
  ["current_use", "Current use / tenant"],
  ["days_on_market", "Days on market"],
  ["price_drop", "Price drop"],
  ["community_costs_month", "Community costs"],
  ["energy_class", "Energy class"],
  ["agency", "Agency"],
  ["contact_name", "Contact"],
  ["phone", "Phone"],
  ["agency_ref", "Agency ref."],
  ["advertiser_type", "Advertiser"],
  ["listing_code", "Idealista code"],
];

const PREMISES_GROUPS = [
  ["Size & frontage", "ruler", ["usable_m2", "facade_m", "facade_band", "shop_windows", "storefront"]],
  ["Layout", "layout", ["floor", "location_type", "floors_in_unit", "rooms", "bathrooms"]],
  ["Building", "building", ["building_type", "year_built"]],
  ["Condition & use", "wrench", ["condition", "current_use", "last_activity"]],
  ["Costs", "euro", ["community_costs_month", "transfer_cost", "price_drop"]],
  ["Listing", "tag", ["days_on_market", "advertiser_type", "agency", "contact_name", "phone", "agency_ref", "listing_code"]],
];
const FACT_ICON = {
  usable_m2: "ruler", facade_m: "ruler", facade_band: "ruler", shop_windows: "window", storefront: "store",
  floor: "layers", location_type: "mapPin", floors_in_unit: "layers", rooms: "layout", bathrooms: "bath",
  building_type: "building", year_built: "calendar", condition: "wrench", current_use: "store", last_activity: "clock",
  community_costs_month: "wallet", transfer_cost: "euro", price_drop: "trendDown", days_on_market: "clock",
  advertiser_type: "user", agency: "badge", contact_name: "user", phone: "phone", agency_ref: "hash", listing_code: "hash",
};

function investorFieldsHtml(props) {
  const inv = props.inv || {};
  const fmt = (k, label) => {
    let v = inv[k];
    if (k === "days_on_market") v = `${v} days (since ${inv.first_seen})`;
    if (k === "community_costs_month") v = `${v} €/month`;
    if (k === "usable_m2") v = `${v} m²`;
    if (k === "facade_m") v = `${v} m`;
    if (k === "transfer_cost") v = typeof v === "number" ? dealFmtEuro(v) : v;
    if (k === "advertiser_type") v = v === "private" ? "Private owner" : "Agency / professional";
    const val = k === "phone" ? `<a href="tel:${escapeHtml(String(v).replace(/\s/g, ""))}">${escapeHtml(String(v))}</a>` : escapeHtml(String(v));
    return `<li class="pfact">${iconSvg(FACT_ICON[k] || "hash", "ui-icon pfact__ico")}<span class="pfact__l">${escapeHtml(label)}</span><span class="pfact__v">${val}</span></li>`;
  };
  const labels = Object.fromEntries(INV_ROWS);
  const has = (k) => inv[k] !== undefined && inv[k] !== "" && inv[k] !== null;
  const groups = PREMISES_GROUPS.map(([title, ico, keys]) => {
    const items = keys.filter((k) => has(k) && !(k === "facade_band" && has("facade_m"))).map((k) => fmt(k, labels[k]));
    return items.length ? `<div class="pgroup"><h4 class="pgroup__h">${iconSvg(ico, "ui-icon")}${title}</h4><ul class="pfacts">${items.join("")}</ul></div>` : "";
  }).join("");
  return `<section class="card-section investor-fields">
    <h3 class="card-section__title">Property facts</h3>
    <div class="pgroups">${groups}</div>
    ${energyHtml(inv)}
  </section>`;
}

function investorFieldsHtmlOld(props) {
  const inv = props.inv || {};
  const rows = INV_ROWS.filter(([k]) => k !== "location" && inv[k] !== undefined && inv[k] !== "").map(([k, label]) => {
    let v = inv[k];
    if (k === "days_on_market") v = `${v} days (tracked since ${inv.first_seen})`;
    if (k === "community_costs_month") v = `${v} €/month`;
    if (k === "usable_m2") v = `${v} m²`;
    if (k === "facade_m") v = `${v} m`;
    if (k === "transfer_cost") v = typeof v === "number" ? dealFmtEuro(v) : v;
    if (k === "advertiser_type") v = v === "private" ? "Private owner" : "Agency / professional";
    if (k === "phone") return `<div class="fact"><dt>${label}</dt><dd><a href="tel:${escapeHtml(String(v).replace(/\s/g, ""))}">${escapeHtml(String(v))}</a></dd></div>`;
    return `<div class="fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(v))}</dd></div>`;
  });
  return `<section class="card-section investor-fields">
    <h3 class="card-section__title">Property facts</h3>
    <dl class="facts">${rows.join("")}</dl>
    ${energyHtml(inv)}
    ${inv.admin_levels?.length ? `<p class="inv-admin">${inv.admin_levels.map(escapeHtml).join(" › ")}${inv.country ? ` · ${escapeHtml(inv.country.toUpperCase())}` : ""}</p>` : ""}
  </section>`;
}

function energyHtml(inv) {
  const e = inv.energy || {};
  if (!e.class && !e.note) return "";
  const num = (s) => (String(s || "").match(/([\d.]+)\s*$/) || [])[1];
  const classes = ["A", "B", "C", "D", "E", "F", "G"];
  const scale = e.class ? `<div class="energy-scale">${classes.map((c) => `<span class="e-${c}${c === e.class ? " is-on" : ""}">${c}</span>`).join("")}</div>` : "";
  const bits = [num(e.consumption) && `${num(e.consumption)} kWh/m²·yr`, num(e.emissions) && `${num(e.emissions)} kg CO₂/m²·yr`, e.note].filter(Boolean);
  return `<div class="energy"><span class="energy__label">Energy certificate</span>${scale}${bits.length ? `<span class="energy__nums">${bits.map(escapeHtml).join(" · ")}</span>` : ""}</div>`;
}

/** Listing activity: Idealista public stats + price-drop trend + ad flags. */
function listingActivityHtml(inv) {
  const a = inv.activity || {};
  const stat = (n, label) => `<div class="act-stat"><b>${n ?? "–"}</b><span>${label}</span></div>`;
  const stats = Object.keys(a).length
    ? `<div class="act-stats">${stat(a.views, "views")}${stat(a.favorites, "favourites")}${stat(a.contacts, "contacts")}${stat(a.shared, "shared")}</div>`
    : `<p class="act-none">Views / favourites only come from the detail page (not scraped for this lead).</p>`;
  const flags = [];
  if (inv.price_drop_pct) {
    const when = inv.price_drop_date_ms ? ` on ${new Date(inv.price_drop_date_ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "";
    flags.push(`<span class="act-flag act-flag--drop">▼ Price cut ${inv.price_drop_pct}%${inv.price_drop_eur ? ` (−${dealFmtEuro(inv.price_drop_eur)})` : ""}${when}</span>`);
  }
  if (inv.highlighted) flags.push(`<span class="act-flag act-flag--ad" title="The advertiser pays Idealista to highlight this ad">★ Paid highlight (Destacado)</span>`);
  if (inv.new_dev_highlight) flags.push(`<span class="act-flag">New development</span>`);
  if (inv.auction) flags.push(`<span class="act-flag act-flag--warn">Auction</span>`);
  if (inv.transfer) flags.push(`<span class="act-flag act-flag--warn" title="A running business is being transferred">Traspaso (business transfer)</span>`);
  (inv.labels || []).forEach((l) => flags.push(`<span class="act-flag">${escapeHtml(l)}</span>`));
  if (inv.days_on_market !== undefined) flags.push(`<span class="act-flag act-flag--muted">Seen ${inv.days_on_market} d ago</span>`);
  if (inv.updated_ms) flags.push(`<span class="act-flag act-flag--muted">Updated ${new Date(inv.updated_ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>`);
  return `<section class="card-section lact">
    <h3 class="card-section__title">Listing activity</h3>
    ${stats}
    ${flags.length ? `<div class="act-flags">${flags.join("")}</div>` : ""}
  </section>`;
}

/** Equipment / features chips (all characteristics + "Yes" extras). */
const EQUIP_GROUPS = [
  ["Comfort", [["ac", "❄", "Air conditioning"], ["heating", "♨", "Heating"], ["kitchen", "🍳", "Equipped kitchen"], ["accessible_wc", "♿", "Accessible WC"]]],
  ["Security", [["alarm", "🔔", "Alarm"], ["camera", "📷", "CCTV camera"], ["door", "🚪", "Security door"]]],
  ["Layout & licensing", [["corner", "⌐", "Corner unit"], ["storeroom", "📦", "Storeroom"], ["smoke", "💨", "Smoke outlet (needed for most food uses)"]]],
];
const EQUIP_COVERED = /air condition|heating|kitchen|handicaped|alarm|camera|security door|corner|storeroom|smoke|facade length|show windows|ground floor|located in the street|built in|layout|toilet|bathroom|\d+ floors?$/i;

function listingFeaturesHtml(inv) {
  const e = inv.equip || {};
  const st = (v) => (v === true ? "yes" : v === false ? "no" : "unk");
  const word = { yes: "Yes", no: "No", unk: "Not stated" };
  const key = [
    ["Facade", inv.facade_m ? `${inv.facade_m} m` : inv.facade_band || null],
    ["Shop windows", inv.shop_windows ?? null],
    ["Floor", inv.floor || inv.location_type || null],
    ["Usable", inv.usable_m2 ? `${inv.usable_m2} m²` : null],
  ];
  const keyHtml = key.map(([k, v]) => `<div class="feq-key${v == null ? " is-unk" : ""}"><span>${k}</span><b>${v == null ? "?" : escapeHtml(String(v))}</b></div>`).join("");
  const groups = EQUIP_GROUPS.map(([title, items]) => `<div class="feq-group"><h4>${title}</h4><ul>${items
    .map(([k, ico, label]) => { const s2 = st(e[k]); return `<li class="feq feq--${s2}" title="${escapeHtml(label)}: ${word[s2]}"><span class="feq__ico" aria-hidden="true">${ico}</span><span class="feq__lbl">${escapeHtml(label)}</span><span class="feq__st">${s2 === "yes" ? "✓" : s2 === "no" ? "✗" : "?"}</span></li>`; })
    .join("")}</ul></div>`).join("");
  const other = [...(inv.features || []).filter((c) => !EQUIP_COVERED.test(c)), ...(inv.media || [])];
  return `<section class="card-section lfeat">
    <h3 class="card-section__title">Equipment &amp; features</h3>
    <div class="feq-keys">${keyHtml}</div>
    <div class="feq-groups">${groups}</div>
    <p class="feq-legend"><span class="feq--yes">✓ listed</span><span class="feq--no">✗ listed as absent</span><span class="feq--unk">? not stated in the ad</span></p>
    ${other.length ? `<div class="chips">${other.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join("")}</div>` : ""}
  </section>`;
}

/** One description, Spanish first (then English), with a toggle to the other languages. */
function listingDescToggleHtml(props) {
  const inv = props.inv || {};
  const kinds = inv.desc_kind || {};
  const LANG = { es: "Español", en: "English", ca: "Català" };
  const KIND = {
    orig: ["Original", "Written by the advertiser (their default language on Idealista)."],
    adv: ["Advertiser version", "A separate text the advertiser wrote in this language — it may differ in content from the original."],
    auto: ["Idealista translation", "Machine-translated by Idealista from the advertiser's text."],
    stub: ["Idealista summary", "One-line summary generated by Idealista from the listing data — no advertiser text in this language."],
    unknown: ["Text", "Source not recorded."],
  };
  const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
  let items = ["es", "en", "ca"].filter((k) => norm(inv[`desc_${k}`]))
    .map((k) => ({ k, kind: kinds[k] || "unknown", text: String(inv[`desc_${k}`]) }));
  const real = items.filter((i) => i.kind !== "stub");
  if (real.length) items = real;
  const rank = { orig: 0, adv: 1, auto: 2, unknown: 3, stub: 4 };
  items.sort((x, y) => rank[x.kind] - rank[y.kind]);
  const snippet = norm(props.x?.desc);
  // the search-card text is a whitespace-collapsed, truncated copy of the original: only show it if nothing else exists
  if (snippet && !items.some((i) => norm(i.text).startsWith(snippet.slice(0, 120)))) {
    if (!items.length) items.push({ k: "snip", kind: "snip", text: String(props.x.desc) });
  }
  if (!items.length) return "";
  // Idealista machine-translates only the advertiser's main text; when the original already embeds other
  // languages ("English:", "Català:") the translation covers just one block, so the two look different.
  const orig = items.find((i) => i.kind === "orig");
  const multi = orig && /(^|\n)\W*(english|inglés|català|catalán|castellano|español)\b[^\n]{0,40}:?/i.test(orig.text);
  items.forEach((i) => {
    if (i.kind !== "auto" || !orig) return;
    const r = norm(i.text).length / Math.max(1, norm(orig.text).length);
    if (multi && r < 0.8) i.extra = "Shorter than the original because the advertiser's text contains several languages and Idealista translated only one of them.";
    else if (r < 0.7) i.extra = "Shorter than the original: Idealista's translation does not cover the whole advertiser text.";
    else i.extra = "A machine translation, so wording differs from the original; facts and figures should match.";
  });
  const label = (i) => i.kind === "snip" ? "Search-card snippet" : `${KIND[i.kind][0]} · ${LANG[i.k]}`;
  const note = (i) => i.kind === "snip" ? "Truncated text from the Idealista search results." : `${KIND[i.kind][1]}${i.extra ? ` ${i.extra}` : ""}`;
  const btns = items.length > 1 ? `<div class="ldesc2__langs" role="group" aria-label="Description source">${items.map((i, n) => `<button type="button" data-lang="${i.k}" class="${n ? "" : "is-on"}">${escapeHtml(label(i))}</button>`).join("")}</div>` : "";
  return `<section class="card-section ldesc2">
    <div class="ldesc2__head"><h3 class="card-section__title">Description</h3>${btns}</div>
    ${items.map((i, n) => `<div data-text="${i.k}"${n ? " hidden" : ""}><p class="unit-note ldesc2__src">${escapeHtml(items.length > 1 ? note(i) : `${label(i)} — ${note(i)}`)}</p><div class="listing-desc listing-desc--full">${escapeHtml(i.text)}</div></div>`).join("")}
  </section>`;
}

function rawDetailsToggle(innerHtml) {
  if (!innerHtml || !innerHtml.trim()) return "";
  return `<details class="raw-details"><summary>Raw Idealista data (all scraped fields)</summary>${innerHtml}</details>`;
}

/* ---------- Visual layer (inline SVG, no deps) ---------- */

function fitRingHtml(score, label = "Overall fit") {
  const v = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const r = 34;
  const c = 2 * Math.PI * r;
  const word = v >= 70 ? "Strong" : v >= 50 ? "Fair" : "Weak";
  return `<div class="fit-ring" data-score="${v}" title="${label}: ${v}/100">
    <svg viewBox="0 0 80 80" width="84" height="84" aria-hidden="true">
      <circle cx="40" cy="40" r="${r}" class="fit-ring__track"/>
      <circle cx="40" cy="40" r="${r}" class="fit-ring__fill" style="stroke:hsl(${Math.round(Math.max(0, Math.min(1, (v - 25) / 55)) * 125)} 58% 42%)" stroke-dasharray="${((v / 100) * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/>
      <text x="40" y="44" text-anchor="middle" class="fit-ring__num">${v}</text>
    </svg>
    <div class="fit-ring__text"><strong>${word} fit</strong><span>${escapeHtml(label)}</span></div>
  </div>`;
}

/** Single-hue horizontal bars (neutral breakdown). parts: [{label, score, detail}] */
function neutralBarsHtml(parts) {
  if (!parts?.length) return "";
  return `<ul class="nbars">${parts
    .map((p) => {
      const v = Math.max(0, Math.min(100, Math.round(Number(p.score) || 0)));
      return `<li title="${escapeHtml(p.detail || "")}"><span class="nbars__label">${escapeHtml(p.label)}</span><span class="nbars__track"><span style="width:${v}%;--v:${v}"></span></span><span class="nbars__val">${v}</span></li>`;
    })
    .join("")}</ul>`;
}

function costDonutHtml(i) {
  const parts = [
    ["Price", i.price, "var(--d1)"],
    ["ITP", (i.price * i.itpPct) / 100, "var(--d2)"],
    ["Notary + registry", (i.price * i.notaryPct) / 100, "var(--d3)", "Notary"],
    ["Capex", i.capex, "var(--d4)"],
  ].filter((p) => p[1] > 0);
  const total = parts.reduce((s, p) => s + p[1], 0) || 1;
  const r = 30, c = 2 * Math.PI * r, gap = parts.length > 1 ? 1.2 : 0;
  let offset = 0;
  const kEur = (x) => x >= 1e6 ? `${(x / 1e6).toLocaleString("es-ES", { maximumFractionDigits: 2 })}M €` : `${Math.round(x / 1000).toLocaleString("es-ES")}k €`;
  const totalTxt = kEur(total);
  const arcs = parts
    .map(([k, v, col, short], n) => {
      const len = Math.max(0.5, (v / total) * c - gap);
      const pct = ((100 * v) / total).toFixed(1);
      const arc = `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" class="donut__seg" data-seg="${n}" data-label="${escapeHtml(short || k)}" data-pct="${pct}" data-eur="${kEur(v)}" style="--len:${len.toFixed(2)};--c:${c.toFixed(2)};animation-delay:${n * 90}ms" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 40 40)"></circle>`;
      offset += len + gap;
      return arc;
    })
    .join("");
  const legend = parts
    .map(([k, v, col, short], n) => `<li data-seg="${n}" data-label="${escapeHtml(short || k)}" data-pct="${((100 * v) / total).toFixed(1)}" data-eur="${kEur(v)}"><i style="background:${col}"></i>${k}<b>${dealFmtEuro(v)}</b><em>${((100 * v) / total).toFixed(1)}%</em></li>`)
    .join("");
  return `<div class="donut" data-total="${totalTxt}"><svg viewBox="0 0 80 80" width="140" height="140" aria-label="All-in cost breakdown"><circle cx="40" cy="40" r="${r}" fill="none" class="donut__track"/>${arcs}<text x="40" y="35" text-anchor="middle" class="donut__k">All-in</text><text x="40" y="45" text-anchor="middle" class="donut__v">${totalTxt}</text><text x="40" y="52" text-anchor="middle" class="donut__p"></text></svg><ul class="donut__legend">${legend}</ul></div>`;
}

/** Net yield as a function of rent €/m²/mo, with the current rent marked. */
function yieldCurveHtml(i) {
  const W = 260, H = 120, L = 30, B = 20, T = 8, R = 8;
  const cur = Math.max(1, i.rentM2);
  const maxRent = Math.max(30, Math.ceil(cur * 1.6));
  const y = (rent) => dealMath({ ...i, rentM2: rent }).netYield || 0;
  const maxY = Math.max(12, Math.ceil(y(maxRent) / 2) * 2);
  const sx = (r) => L + (r / maxRent) * (W - L - R);
  const sy = (v) => H - B - (Math.max(0, v) / maxY) * (H - B - T);
  const pts = Array.from({ length: 21 }, (_, k) => (k / 20) * maxRent).map((r) => `${sx(r).toFixed(1)},${sy(y(r)).toFixed(1)}`).join(" ");
  const target = YIELD_BENCH.target[i.region] || 7.8; // typical net yield for this city's premises (see YIELD_BENCH)
  const cx = sx(cur), cy = sy(y(cur));
  const yTicks = [0, maxY / 2, maxY].map((v) => `<text x="${L - 4}" y="${sy(v) + 3}" text-anchor="end">${v}%</text>`).join("");
  return `<svg class="ycurve" viewBox="0 0 ${W} ${H}" aria-label="Net yield vs rent">
    <line x1="${L}" y1="${sy(target)}" x2="${W - R}" y2="${sy(target)}" class="ycurve__target"/><text x="${W - R}" y="${sy(target) + 12}" text-anchor="end" class="ycurve__tlabel">${target}% typical ${YIELD_BENCH.label[i.region] || ""}</text>
    <polyline points="${pts}" class="ycurve__line"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${H - B}" class="ycurve__drop"/>
    <circle cx="${cx}" cy="${cy}" r="4" class="ycurve__dot"/>
    <text x="${Math.min(cx + 6, W - 60)}" y="${Math.max(cy - 6, 12)}" class="ycurve__dotlabel">${(y(cur) || 0).toFixed(1)}%</text>
    <line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" class="ycurve__axis"/>
    ${yTicks}
    <text x="${L}" y="${H - 5}">0</text><text x="${W - R}" y="${H - 5}" text-anchor="end">${maxRent} €/m²/mo rent</text>
  </svg>`;
}

function dealKpisHtml(i) {
  const m = dealMath(i);
  const k = (label, value, strong) => `<div class="kpi${strong ? " kpi--strong" : ""}"><span>${label}</span><b>${value}</b></div>`;
  const ny = `<b style="color:${yieldTone(m.netYield, i.region)}">${dealFmtPct(m.netYield)}</b>`;
  const nyKpi = `<div class="kpi kpi--strong"><span>Net yield${infoTip(yieldTipText(i.region))}</span>${ny}<em class="kpi__word">${escapeHtml(yieldWord(m.netYield, i.region))}</em></div>`;
  const pbTip = `Payback = years of net rent needed to earn back the all-in cost (100 ÷ net yield). ${dealFmtPct(m.netYield)} net → ${dealFmtYears(m.payback)}. Typical ${YIELD_BENCH.label[i.region]} premises (${YIELD_BENCH.target[i.region]}% net) take ~${Math.round(100 / (YIELD_BENCH.target[i.region] || 7.8))} years — long, but normal for property bought without debt: you still own the premises afterwards, and rents usually rise with inflation. Turn on the mortgage to see the payback on your own cash.`;
  const pb = `<div class="kpi"><span>Payback${infoTip(pbTip)}</span><b>${dealFmtYears(m.payback)}</b></div>`;
  let lev = "";
  if (i.lev) {
    const tone = m.coc == null ? "" : `color:${m.coc < 0 ? "hsl(0 62% 40%)" : yieldTone(m.coc * 0.75, i.region)}`;
    const cocTip = `Cash-on-cash = (net rent − mortgage payments) ÷ your cash in (all-in cost − loan). Loan ${dealFmtEuro(m.loan)}, payments ${dealFmtEuro(m.debt)}/yr, your cash ${dealFmtEuro(m.equity)}. Leverage helps only while the net yield (${dealFmtPct(m.netYield)}) beats the interest rate (${i.ratePct}%).`;
    lev = `<div class="deal-kpis deal-kpis--lev">
      <div class="kpi kpi--strong"><span>Cash-on-cash${infoTip(cocTip)}</span><b style="${tone}">${dealFmtPct(m.coc)}</b><em class="kpi__word">${m.coc == null ? "" : m.cashFlow < 0 ? "Rent doesn't cover the mortgage" : m.coc > m.netYield ? "Leverage boosts your return" : "Leverage lowers your return"}</em></div>
      ${k("Return after interest", dealFmtPct(m.equityYield))}
      <div class="kpi"><span>Cash payback${infoTip("Years for the yearly cash left after mortgage payments to repay your own cash in. Once the loan is paid off the full net rent is yours.")}</span><b>${m.cashPayback ? (m.cashPayback > 50 ? "50+ yrs" : dealFmtYears(m.cashPayback)) : "—"}</b></div>
      ${k("Cash flow / yr", dealFmtEuro(m.cashFlow))}
    </div>`;
  }
  return `${nyKpi}${k("Gross yield", dealFmtPct(m.grossYield))}${pb}${k("Net rent / yr", dealFmtEuro(m.netRent))}</div>${lev}<div hidden>`;
}

function dealVisualHtml(i) {
  return `<div class="deal-kpis">${dealKpisHtml(i)}</div>
  <div class="deal-charts"><figure><figcaption>Net yield vs. rent</figcaption>${yieldCurveHtml(i)}</figure><figure><figcaption>Where the money goes</figcaption>${costDonutHtml(i)}</figure></div>`;
}
