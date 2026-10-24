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
    contact: "expansion@aldi.es",
    blurb: "Discount supermarket. Smallest published format: urban store from 1,000 m² gross; mall / retail-park stores 1,500–2,000 m² with 20–30 m frontage.",
    sources: [SRC_ALDI, SRC_ALDI_2018],
    hard: [
      {
        id: "size", label: "Gross area ≥ 1,000 m²", src: SRC_ALDI, verified: true,
        note: "Tienda urbana: superficie bruta a partir de 1.000 m².",
        test: (l) => (l.sz ? l.sz >= 1000 : null), value: (l) => (l.sz ? `${l.sz.toLocaleString("es-ES")} m²` : "size not listed"),
      },
      {
        id: "facade", label: "Frontage 20–30 m (mall / retail-park formats)", src: SRC_ALDI, verified: true,
        note: "Fachada 20-30 metros lineales (parque comercial; 'preferentemente' en centro comercial). Not stated for the urban format.",
        test: (l, inv) => (Number.isFinite(inv.facade_m) && inv.facade_m > 0 ? inv.facade_m >= 20 : inv.facade_band === "> 12 m" ? null : inv.facade_band ? false : null),
        value: (l, inv) => (inv.facade_m ? `${inv.facade_m} m` : inv.facade_band || "not listed"),
      },
      {
        id: "height", label: "Ceiling height > 3.5 m", src: SRC_ALDI, verified: true,
        note: "Altura de la tienda > 3,5 m (parque / centro comercial). Idealista does not publish ceiling height.",
        test: () => null, value: () => "not in Idealista data",
      },
      {
        id: "loading", label: "Loading / unloading access", src: SRC_ALDI, verified: true,
        note: "Posibilidad de carga y descarga. Not in Idealista data — check on site.",
        test: () => null, value: () => "not in Idealista data",
      },
      {
        id: "catchment", label: "Catchment > 20,000 inhabitants", src: SRC_ALDI, verified: true,
        note: "Área de influencia > 20.000 habitantes (standard store). Checked at city level only; walk-catchment population is not computed.",
        test: (l) => (l.m === "Madrid" || l.m === "Barcelona" ? true : null),
        value: (l) => `${l.m || "city"} (city-level check)`,
      },
      {
        id: "parking", label: "Parking (~80 spaces)", src: SRC_ALDI_2018, verified: false,
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

function tenantPct(sorted, v) {
  if (!sorted.length || !Number.isFinite(v)) return 0.5;
  let below = 0;
  for (const s of sorted) if (s < v) below += 1;
  return below / Math.max(1, sorted.length - 1);
}

/** Evaluate every listing against a tenant. Returns Map id -> {checks, pass, fail, unknown, soft, ok}. */
function evaluateTenant(tenant, listings, areaById) {
  const out = new Map();
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
    const checks = tenant.hard.map((h) => ({ ...h, result: h.test(p, inv, a), shown: h.value(p, inv, a) }));
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
    out.set(p.id, { checks, pass, fail, unknown: checks.length - pass - fail, soft, parts, ok: fail === 0 });
  }
  return out;
}

function tenantSrcLink(src) {
  return src ? `<a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.label)}</a>` : "inference";
}

function tenantChecksHtml(tenant, ev) {
  if (!ev) return "";
  const icon = (r) => (r === true ? `<span class="tc tc--pass" aria-label="pass">✓</span>` : r === false ? `<span class="tc tc--fail" aria-label="fail">✗</span>` : `<span class="tc tc--unk" aria-label="unknown">?</span>`);
  const rows = ev.checks
    .map((c) => `<li>${icon(c.result)}<div><b>${escapeHtml(c.label)}</b>${c.verified ? "" : ` <span class="tc-unv">not verified</span>`}<span class="tc-val">${escapeHtml(c.shown)}</span><small>${escapeHtml(c.note)} · ${tenantSrcLink(c.src)}</small></div></li>`)
    .join("");
  const soft = tenant.soft
    .map((s) => `<li><span>${escapeHtml(s.label)}${s.verified ? "" : ` <span class="tc-unv">not verified</span>`}</span><span class="nbars__track"><span style="width:${Math.round(100 * ev.parts[s.id])}%;--v:${Math.round(100 * ev.parts[s.id])}"></span></span><small>${Math.round(s.w * 100)}%</small></li>`)
    .join("");
  const verdict = ev.fail ? `Fails ${ev.fail} hard criteria` : ev.unknown ? `No fails · ${ev.unknown} to check on site` : "Passes every hard criterion";
  return `<section class="card-section tenant-fit">
    <h3 class="card-section__title">Tenant fit · ${escapeHtml(tenant.name)} <span class="tenant-verdict ${ev.fail ? "is-fail" : "is-ok"}">${escapeHtml(verdict)}</span></h3>
    <p class="unit-note">${escapeHtml(tenant.blurb)} Contact: <a href="mailto:${tenant.contact}">${tenant.contact}</a></p>
    <ul class="tenant-checks">${rows}</ul>
    <h4 class="tenant-sub">Soft ranking score <b>${ev.soft}</b>/100</h4>
    <ul class="tenant-soft">${soft}</ul>
  </section>`;
}
