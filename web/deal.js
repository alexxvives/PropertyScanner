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

/** Editable calculator for the listing modal (visual). */
function dealCalculatorHtml(props, coords, listings) {
  if (props.op === "rent") return "";
  const i = dealInputs(props, coords, listings);
  const field = (name, label, value, step, suffix) =>
    `<label class="deal-in"><span>${label}</span><span class="deal-in__box"><input type="number" inputmode="decimal" step="${step}" data-deal="${name}" value="${value}" /><em>${suffix}</em></span></label>`;
  const maxRent = Math.max(40, Math.ceil(i.rentM2 * 2));
  return `<section class="deal-calc card-section" data-deal-region="${i.region}">
    <h3 class="card-section__title">Deal calculator</h3>
    <label class="deal-slider"><span>Market rent <b data-rent-label>${i.rentM2} €/m²/mo</b>${i.rentIsAssumption ? ' <em class="deal-flag">assumed</em>' : ""}</span>
      <input type="range" min="1" max="${maxRent}" step="0.5" value="${i.rentM2}" data-deal-slider="rentM2" /></label>
    <div class="deal-visual">${dealVisualHtml(i)}</div>
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
      <p class="deal-note${i.rentIsAssumption ? " deal-note--warn" : ""}">Rent: ${escapeHtml(i.rentSource)}. ITP default ${i.region === "barcelona" ? "10% (Catalonia)" : i.region === "madrid" ? "6% (Madrid)" : "7% (generic)"}. Yields are pre-financing, pre-tax.</p>
    </details>
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
    const slider = event.target.dataset.dealSlider;
    if (slider) {
      const box = section.querySelector(`input[data-deal="${slider}"]`);
      if (box) box.value = event.target.value;
    } else if (event.target.dataset.deal === "rentM2") {
      const sl = section.querySelector('input[data-deal-slider="rentM2"]');
      if (sl) sl.value = event.target.value;
    }
    const i = readDealInputs(section);
    const label = section.querySelector("[data-rent-label]");
    if (label) label.textContent = `${i.rentM2} €/m²/mo`;
    section.querySelector(".deal-visual").innerHTML = dealVisualHtml(i);
    const kpi = root.querySelector("[data-hero-yield]");
    if (kpi) kpi.textContent = dealFmtPct(dealMath(i).netYield);
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
  ["contact_name", "Contact"],
  ["phone", "Phone"],
  ["agency_ref", "Agency ref."],
  ["advertiser_type", "Advertiser"],
  ["listing_code", "Idealista code"],
];

function investorFieldsHtml(props) {
  const inv = props.inv || {};
  const rows = INV_ROWS.filter(([k]) => k !== "location" && inv[k] !== undefined && inv[k] !== "").map(([k, label]) => {
    let v = inv[k];
    if (k === "days_on_market") v = `${v} days (tracked since ${inv.first_seen})`;
    if (k === "community_costs_month") v = `${v} €/month`;
    if (k === "advertiser_type") v = v === "private" ? "Private owner" : "Agency / professional";
    if (k === "phone") return `<div class="fact"><dt>${label}</dt><dd><a href="tel:${escapeHtml(String(v).replace(/\s/g, ""))}">${escapeHtml(String(v))}</a></dd></div>`;
    return `<div class="fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(v))}</dd></div>`;
  });
  return `<section class="card-section investor-fields">
    <h3 class="card-section__title">The premises</h3>
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
function listingFeaturesHtml(inv) {
  const chips = [...(inv.features || []), ...(inv.media || [])];
  if (!chips.length) return "";
  return `<section class="card-section lfeat">
    <h3 class="card-section__title">Equipment &amp; features</h3>
    <div class="chips">${chips.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join("")}</div>
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
      <circle cx="40" cy="40" r="${r}" class="fit-ring__fill" stroke-dasharray="${((v / 100) * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/>
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
      return `<li title="${escapeHtml(p.detail || "")}"><span class="nbars__label">${escapeHtml(p.label)}</span><span class="nbars__track"><span style="width:${v}%"></span></span><span class="nbars__val">${v}</span></li>`;
    })
    .join("")}</ul>`;
}

function costDonutHtml(i) {
  const parts = [
    ["Price", i.price, "var(--d1)"],
    ["ITP", (i.price * i.itpPct) / 100, "var(--d2)"],
    ["Notary + registry", (i.price * i.notaryPct) / 100, "var(--d3)"],
    ["Capex", i.capex, "var(--d4)"],
  ].filter((p) => p[1] > 0);
  const total = parts.reduce((s, p) => s + p[1], 0) || 1;
  const r = 30;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = parts
    .map(([, v, col]) => {
      const len = (v / total) * c;
      const arc = `<circle cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 40 40)"/>`;
      offset += len;
      return arc;
    })
    .join("");
  const legend = parts
    .map(([k, v, col]) => `<li><i style="background:${col}"></i>${k}<b>${dealFmtEuro(v)}</b></li>`)
    .join("");
  return `<div class="donut"><svg viewBox="0 0 80 80" width="120" height="120" aria-label="All-in cost breakdown">${arcs}<text x="40" y="38" text-anchor="middle" class="donut__k">All-in</text><text x="40" y="49" text-anchor="middle" class="donut__v">${Math.round(total / 1000).toLocaleString("es-ES")}k €</text></svg><ul class="donut__legend">${legend}</ul></div>`;
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
  const target = 7; // typical retail investor target net yield
  const cx = sx(cur), cy = sy(y(cur));
  const yTicks = [0, maxY / 2, maxY].map((v) => `<text x="${L - 4}" y="${sy(v) + 3}" text-anchor="end">${v}%</text>`).join("");
  return `<svg class="ycurve" viewBox="0 0 ${W} ${H}" aria-label="Net yield vs rent">
    <line x1="${L}" y1="${sy(target)}" x2="${W - R}" y2="${sy(target)}" class="ycurve__target"/><text x="${W - R}" y="${sy(target) - 3}" text-anchor="end" class="ycurve__tlabel">${target}% target</text>
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
  return `${k("Net yield", dealFmtPct(m.netYield), true)}${k("Gross yield", dealFmtPct(m.grossYield))}${k("Payback", dealFmtYears(m.payback))}${k("Net rent / yr", dealFmtEuro(m.netRent))}`;
}

function dealVisualHtml(i) {
  return `<div class="deal-kpis">${dealKpisHtml(i)}</div>
  <div class="deal-charts"><figure><figcaption>Net yield vs. rent</figcaption>${yieldCurveHtml(i)}</figure><figure><figcaption>Where the money goes</figcaption>${costDonutHtml(i)}</figure></div>`;
}
