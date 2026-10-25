/*
 * Listing score (0–100) and rank. One formula, used by the ranking, the ring and the breakdown panel.
 *
 *   score = 30% neighbourhood + 25% the block around the door (300 m) + 25% the unit itself + 20% price
 *   then × 0.35 when a hard requirement fails (too small, not at street level for a shop, warehouse, outlier).
 *   rank  = percentile of the score among listings of the same city and operation (sale / rent).
 *
 * Tenant mode (Aldi, VivaGym…): same parts with the tenant's size band and concept, blended 60/40 with the
 * tenant's own published-criteria score; listings that fail a tenant hard check sort last.
 */
(function (root) {
  const SIZE_BANDS = {
    bakery: { min: 30, lo: 50, hi: 150, max: 300 },
    cafe: { min: 40, lo: 60, hi: 200, max: 400 },
    grocery: { min: 80, lo: 150, hi: 600, max: 2500 },
    food: { min: 60, lo: 100, hi: 300, max: 600 },
    pharmacy: { min: 50, lo: 80, hi: 250, max: 500 },
    beauty: { min: 25, lo: 40, hi: 120, max: 250 },
    fashion: { min: 40, lo: 80, hi: 400, max: 1500 },
    health: { min: 50, lo: 80, hi: 250, max: 600 },
    gym: { min: 150, lo: 300, hi: 1500, max: 3000 },
  };
  const CODE = { bakery: "b", cafe: "c", grocery: "g", food: "f", pharmacy: "p", beauty: "u", fashion: "s", health: "l", gym: "m" };
  const SHOP_FRONT = new Set(["bakery", "cafe", "grocery", "food", "pharmacy", "beauty", "fashion"]);
  const NEEDS_SMOKE = { food: 1, bakery: 0.7, cafe: 0.5 };
  const WEIGHTS = { area: 0.3, micro: 0.25, unit: 0.25, price: 0.2 };
  const GATE_FACTOR = 0.35;

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const cityOf = (p) => (String(p.i || "").startsWith("bcn") ? "Barcelona" : String(p.i || "").startsWith("mad") ? "Madrid" : p.m || "Madrid");
  const opOf = (p) => (p.op === "rent" ? "rent" : "sale");

  function pctFn(values) {
    const s = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    return (v) => {
      if (!s.length || !Number.isFinite(v)) return 0.5;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; }
      let eq = lo; while (eq < s.length && s[eq] === v) eq++;
      return s.length > 1 ? (lo + (eq - lo - 1) / 2) / (s.length - 1) : 0.5;
    };
  }

  /** 1 inside [lo, hi], linear ramps to 0 at min and max (and 0 outside). */
  function sizeFit(sz, z) {
    if (!sz) return 0.45;
    if (sz < z.min || sz > z.max * 1.25) return 0;
    if (sz < z.lo) return 0.35 + 0.65 * (sz - z.min) / Math.max(1, z.lo - z.min);
    if (sz <= z.hi) return 1;
    if (sz <= z.max) return 1 - 0.6 * (sz - z.hi) / Math.max(1, z.max - z.hi);
    return 0.15;
  }

  function position(inv) {
    const f = inv.floor || "", t = inv.location_type || "";
    if (t === "Street level" || f.startsWith("Ground")) return { v: 1, street: true, text: "street level" };
    if (t === "shoppingcenter") return { v: 0.7, street: true, text: "shopping centre" };
    if (/Mezzanine|Basement|Semi-basement|Upper floor|Floor/.test(t + " " + f)) return { v: 0.15, street: false, text: (t !== "—" && t) || f };
    return { v: 0.55, street: null, text: "position not listed" };
  }

  function frontage(inv) {
    const w = Number(inv.shop_windows) || 0, f = Number(inv.facade_m) || 0;
    if (w >= 3 || f >= 8) return { v: 1, text: f ? `${f} m frontage` : `${w} shop windows` };
    if (w === 2 || f >= 5) return { v: 0.8, text: f ? `${f} m frontage` : "2 shop windows" };
    if (w === 1 || f >= 3) return { v: 0.55, text: f ? `${f} m frontage` : "1 shop window" };
    if (f > 0) return { v: 0.2, text: `${f} m frontage` };
    return { v: 0.45, text: "frontage not listed" };
  }

  /** Unit fit 0–1 with its pieces, for one business type and size band. */
  function unitFit(p, concept, band) {
    const inv = p.inv || {}, eq = inv.equip || {};
    const size = sizeFit(p.sz, band);
    const pos = position(inv);
    const front = frontage(inv);
    const smokeW = NEEDS_SMOKE[concept] || 0;
    const shop = SHOP_FRONT.has(concept);
    const cond = /renovat/i.test(inv.condition || "") ? 0.35 : /new|good/i.test(inv.condition || "") ? 1 : 0.7;
    const pieces = [
      { id: "size", label: `Size vs ${band.lo}–${band.hi} m²`, v: size, w: 0.4, text: p.sz ? `${p.sz} m²` : "size not listed" },
      { id: "pos", label: "Street level", v: pos.v, w: shop ? 0.22 : 0.12, text: pos.text },
      { id: "front", label: "Frontage / shop windows", v: front.v, w: shop ? 0.15 : 0.06, text: front.text },
      { id: "corner", label: "Corner unit", v: eq.corner ? 1 : 0.4, w: shop ? 0.05 : 0.02, text: eq.corner ? "corner" : "not a corner" },
      { id: "cond", label: "Condition", v: cond, w: 0.1, text: inv.condition || "not listed" },
    ];
    if (smokeW) pieces.push({ id: "smoke", label: "Smoke outlet", v: eq.smoke ? 1 : 0.15, w: 0.2 * smokeW, text: eq.smoke ? "has a smoke outlet" : "no smoke outlet listed" });
    const w = pieces.reduce((s, x) => s + x.w, 0);
    return { v: pieces.reduce((s, x) => s + x.w * x.v, 0) / w, pieces: pieces.map((x) => ({ ...x, share: x.w / w })), pos, size };
  }

  function gates(p, concept, band, unit, outlierFn, skipSize = false) {
    const out = [];
    if (!skipSize && p.sz && p.sz < band.min) out.push(`smaller than ${band.min} m²`);
    if (!skipSize && p.sz && p.sz > band.max * 1.25) out.push(`far larger than ${band.max} m²`);
    if (SHOP_FRONT.has(concept) && unit.pos.street === false) out.push(`not at street level (${unit.pos.text})`);
    if (concept !== "gym" && p.x?.idealista?.["detailedType.subTypology"] === "industrialPremise") out.push("industrial unit / warehouse");
    const o = outlierFn ? outlierFn(p) : "";
    if (o) out.push(o);
    return out;
  }

  /** log(€/m²) residual vs a size regression, then vs the 12 nearest same-op listings. Lower = cheaper. */
  function priceResiduals(group) {
    const pts = group.map((f) => {
      const p = f.properties;
      const pm2 = p.pm2 || (p.p && p.sz ? p.p / p.sz : null);
      return pm2 > 0 && p.sz > 0 ? { f, y: Math.log(pm2), x: Math.log(p.sz), pm2 } : null;
    }).filter(Boolean);
    const n = pts.length;
    const out = new Map();
    if (n < 8) return out;
    const mx = pts.reduce((s, q) => s + q.x, 0) / n, my = pts.reduce((s, q) => s + q.y, 0) / n;
    const b = pts.reduce((s, q) => s + (q.x - mx) * (q.y - my), 0) / (pts.reduce((s, q) => s + (q.x - mx) ** 2, 0) || 1);
    pts.forEach((q) => { q.r = q.y - (my + b * (q.x - mx)); });
    for (const q of pts) {
      const [lon, lat] = q.f.geometry.coordinates;
      const near = pts.filter((o) => o !== q).map((o) => ({ o, d: (o.f.geometry.coordinates[0] - lon) ** 2 * 0.58 + (o.f.geometry.coordinates[1] - lat) ** 2 })).sort((a, z) => a.d - z.d).slice(0, 12);
      const local = near.reduce((s, z) => s + z.o.r, 0) / (near.length || 1);
      const localPm2 = near.map((z) => z.o.pm2).sort((a, z) => a - z)[Math.floor(near.length / 2)];
      out.set(q.f.properties.id, { diff: q.r - local, pm2: q.pm2, localPm2 });
    }
    return out;
  }

  function computeListingScores(listings, concept, areaById, opts = {}) {
    const tenant = opts.tenant || null;
    const tenantEval = opts.tenantEval || null;
    const c = tenant?.concept || concept || "bakery";
    const band = tenant?.size || SIZE_BANDS[c] || SIZE_BANDS.bakery;
    const profile = (opts.profiles || {})[c] || { complements: [], signals: { street: 0.6, gap: 0.6, pals: 0.4 }, crowd: 0.5 };
    const code = CODE[c];
    const palCodes = (profile.complements || []).map((g) => CODE[g]).filter(Boolean);

    const groups = new Map();
    for (const f of listings) {
      const k = `${cityOf(f.properties)}|${opOf(f.properties)}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(f);
    }
    const result = new Map();
    for (const [key, group] of groups) {
      const [city, op] = key.split("|");
      // micro-location raw signals from the precomputed 300 m counts
      const raw = group.map((f) => {
        const nb = f.properties.nb || [0, 0, 0, {}];
        const w = nb[3] || {};
        return { open: nb[0], comp: w[code] || 0, pals: palCodes.reduce((s, k) => s + (w[k] || 0), 0), vac: (nb[1] + nb[2]) / Math.max(1, nb[0] + nb[1] + nb[2]), nb };
      });
      const pOpen = pctFn(raw.map((r) => r.open)), pComp = pctFn(raw.map((r) => r.comp)), pPals = pctFn(raw.map((r) => r.pals)), pVac = pctFn(raw.map((r) => r.vac));
      const prices = priceResiduals(group);
      const pPrice = pctFn([...prices.values()].map((v) => -v.diff));
      const scored = group.map((f, i) => {
        const p = f.properties;
        const r = raw[i];
        const a = areaById?.get(p.i)?.properties;
        const areaV = a && a.score >= 0 ? a.score / 100 : 0.4;
        const crowd = profile.crowd ?? 0.5;
        const foot = pOpen(r.open);
        const footV = crowd * foot + (1 - crowd) * Math.min(1, foot / 0.35);
        const sig = profile.signals || {};
        const mw = { foot: sig.street ?? 0.6, pals: sig.pals ?? 0.4, gap: sig.gap ?? 0.6, health: 0.35 };
        const mv = { foot: footV, pals: pPals(r.pals), gap: 1 - pComp(r.comp), health: 1 - pVac(r.vac) };
        const mSum = mw.foot + mw.pals + mw.gap + mw.health;
        const microV = Object.keys(mw).reduce((s, k) => s + mw[k] * mv[k], 0) / mSum;
        const unit = unitFit(p, c, band);
        const pr = prices.get(p.id);
        // Under a quarter or over four times the local €/m² is almost always a typo or a rent filed as a sale; ignore it.
        const odd = pr && (pr.pm2 < pr.localPm2 / 4 || pr.pm2 > pr.localPm2 * 4);
        const priceV = pr && !odd ? pPrice(-pr.diff) : 0.5;
        const parts = [
          { id: "area", label: `Neighbourhood${a ? ` (${a.name})` : ""}`, value: areaV, weight: WEIGHTS.area, line: a ? `${a.name} scores ${a.score}/100 for this business` : "no neighbourhood data" },
          { id: "micro", label: "Block around the door (300 m)", value: microV, weight: WEIGHTS.micro, line: `${r.nb[0]} open shops, ${r.comp.toFixed(1)} same-type rivals, ${r.pals.toFixed(1)} complementary shops, ${Math.round(r.vac * 100)}% empty/closed` , sub: mv, subW: mw },
          { id: "unit", label: "The unit", value: unit.v, weight: WEIGHTS.unit, line: unit.pieces.map((x) => x.text).join(" · "), pieces: unit.pieces },
          { id: "price", label: op === "rent" ? "Rent vs nearby" : "Price vs nearby", value: priceV, weight: WEIGHTS.price, line: odd ? `${Math.round(pr.pm2).toLocaleString("es-ES")} €/m² vs ~${Math.round(pr.localPm2).toLocaleString("es-ES")} €/m² nearby — too far off to trust (likely a typo), counted as neutral` : pr ? `${Math.round(pr.pm2).toLocaleString("es-ES")} €/m² vs ~${Math.round(pr.localPm2).toLocaleString("es-ES")} €/m² for the 12 nearest ${op === "rent" ? "rentals" : "sales"} (size-adjusted ${pr.diff > 0 ? "+" : ""}${Math.round((Math.exp(pr.diff) - 1) * 100)}%)` : "price or size missing — neutral" },
        ];
        const base = parts.reduce((s, x) => s + x.weight * x.value, 0);
        // a tenant brings its own size checks; the position, warehouse and outlier gates still apply
        const g = gates(p, c, band, unit, opts.outlier, !!tenant);
        let score = base * (g.length ? GATE_FACTOR : 1) * 100;
        const tev = tenantEval?.get(p.id);
        if (tenant && tev) score = 0.6 * score + 0.4 * tev.soft;
        return { f, id: p.id, score: Math.round(score * 10) / 10, base: Math.round(base * 1000) / 10, parts, gates: g, fail: tev ? tev.fail : 0, city, op };
      });
      const sorted = scored.map((s) => s.score).sort((a, b) => a - b);
      const n = scored.length;
      for (const s of scored) {
        let below = 0; while (below < n && sorted[below] < s.score) below++;
        let eq = below; while (eq < n && sorted[eq] === s.score) eq++;
        const equal = eq - below;
        const pct = n > 1 ? Math.round((100 * (below + (equal - 1) / 2)) / (n - 1)) : 100;
        const top = Math.max(1, Math.ceil((100 * (n - below - equal + 1)) / n));
        const label = `${city} ${op === "rent" ? "rentals" : "sales"}`;
        result.set(s.id, { ...s, raw: Math.round(s.score), pct, top, n, group: label, text: top <= 50 ? `Top ${top}% of ${label}` : `Bottom ${Math.max(1, 100 - top + 1)}% of ${label}` });
      }
    }
    return result;
  }

  const api = { computeListingScores, SIZE_BANDS, WEIGHTS, GATE_FACTOR };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(root, { PSScore: api });
})(typeof window !== "undefined" ? window : globalThis);
