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

const TENANTS = {
  aldi: {
    id: "aldi",
    name: "Aldi",
    concept: "grocery",
    retail: true,
    contact: "expansion@aldi.es",
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
  return [inv.desc_es, inv.desc_ca, inv.desc_en, p.x?.desc].filter(Boolean).join("\n");
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
  facade: (t) => {
    const m = t.match(/(fachada|fa[cç]ana|frontage|façade)[^0-9\n]{0,20}(\d{1,3}(?:[.,]\d{1,2})?)\s*(m|metros|ml|meters)\b/i);
    if (!m) return null;
    const f = num(m[2]);
    return f > 1 && f < 300 ? { result: f >= 20, quote: m[0].trim(), shown: `${f} m (from ad)` } : null;
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
    (byCity[p.m] ||= { foot: [], traffic: [], residents: [] });
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
        const hit = AD_SCANS[h.id](adText);
        if (hit) { result = hit.result; from = "ad"; quote = hit.quote; if (hit.shown) shown = hit.shown; }
      }
      if (h.id in mine) { result = mine[h.id]; from = "you"; }
      return { ...h, result, shown, from, quote };
    });
    const c = byCity[p.m] || { foot: [], traffic: [], residents: [] };
    const sz = p.sz || 0;
    const parts = {
      foot: tenantPct(c.foot, a.open_per_km2),
      traffic: tenantPct(c.traffic, a.traffic_veh_h),
      residents: tenantPct(c.residents, a.pop_per_km2),
      sizefit: sz >= 1500 && sz <= 2000 ? 1 : sz >= 1000 && sz <= 4000 ? 0.7 : sz >= 800 ? 0.35 : Math.min(0.3, sz / 2700),
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
    <p class="unit-note">${escapeHtml(tenant.blurb)} Contact: <a href="mailto:${tenant.contact}">${tenant.contact}</a></p>
    <p class="unit-note">Tap Pass / Fail / ? to record what you checked on site. Answers stay in this browser and override the data and the ad text.</p>
    <ul class="tenant-checks">${rows}</ul>
    ${qs}
    <h4 class="tenant-sub">Soft ranking score <b>${ev.soft}</b>/100</h4>
    <ul class="tenant-soft">${soft}</ul>
  </section>`;
}
