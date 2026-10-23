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
  minComps: 3,
};

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

/** Editable calculator for the listing modal. */
function dealCalculatorHtml(props, coords, listings) {
  if (props.op === "rent") return "";
  const i = dealInputs(props, coords, listings);
  const field = (name, label, value, step, suffix) =>
    `<label class="deal-in"><span>${label}</span><span class="deal-in__box"><input type="number" inputmode="decimal" step="${step}" data-deal="${name}" value="${value}" /><em>${suffix}</em></span></label>`;
  return `<section class="deal-calc listing-spec-section" data-deal-region="${i.region}">
    <h3 class="listing-spec-section__title"><span>Deal calculator</span></h3>
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
    <p class="deal-note${i.rentIsAssumption ? " deal-note--warn" : ""}">Rent: ${escapeHtml(i.rentSource)}. ITP default ${i.region === "barcelona" ? "10% (Catalonia)" : i.region === "madrid" ? "6% (Madrid)" : "7% (generic)"}. Edit any input.</p>
    <dl class="deal-outputs">${dealOutputsHtml(i)}</dl>
  </section>`;
}

function readDealInputs(section) {
  const out = {};
  section.querySelectorAll("input[data-deal]").forEach((el) => {
    out[el.dataset.deal] = Number(el.value) || 0;
  });
  return out;
}

/** Wire live recalculation (event delegation; call once with the modal body). */
function bindDealCalculator(root) {
  root.addEventListener("input", (event) => {
    const section = event.target.closest(".deal-calc");
    if (!section) return;
    section.querySelector(".deal-outputs").innerHTML = dealOutputsHtml(readDealInputs(section));
  });
}

const INV_ROWS = [
  ["location", "Location"],
  ["floor", "Floor"],
  ["storefront", "Storefront / frontage"],
  ["condition", "Condition"],
  ["current_use", "Current use / tenant"],
  ["days_on_market", "Days on market"],
  ["price_drop", "Price drop"],
  ["community_costs_month", "Community costs"],
  ["energy_class", "Energy class"],
  ["agency", "Agency"],
  ["phone", "Phone"],
];

function investorFieldsHtml(props) {
  const inv = props.inv || {};
  const rows = INV_ROWS.filter(([k]) => inv[k] !== undefined && inv[k] !== "").map(([k, label]) => {
    let v = inv[k];
    if (k === "days_on_market") v = `${v} (tracked since ${inv.first_seen})`;
    if (k === "community_costs_month") v = `${v} €/month`;
    return `<div class="listing-spec-item"><div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(v))}</dd></div></div>`;
  });
  rows.unshift(
    `<div class="listing-spec-item"><div><dt>Price · size · €/m²</dt><dd>${escapeHtml(dealFmtEuro(props.p))} · ${escapeHtml(String(props.sz || "—"))} m² · ${escapeHtml(inv.price_m2 ? `${inv.price_m2.toLocaleString("es-ES")} €/m²` : "—")}</dd></div></div>`,
  );
  const link = inv.link || props.u;
  return `<section class="listing-spec-section investor-fields">
    <h3 class="listing-spec-section__title"><span>Investor summary</span></h3>
    <dl class="listing-specs listing-specs--cols">${rows.join("")}</dl>
    ${link ? `<p><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Open on Idealista ↗</a></p>` : ""}
  </section>`;
}

function rawDetailsToggle(innerHtml) {
  if (!innerHtml || !innerHtml.trim()) return "";
  return `<details class="raw-details"><summary>Raw Idealista data (all scraped fields)</summary>${innerHtml}</details>`;
}
