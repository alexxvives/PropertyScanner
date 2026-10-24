/* Private deal pipeline. Talks only to /api/deals (session-gated server-side). */
(() => {
  const STAGES = [
    { id: "sourced", label: "Sourced", hint: "Found a property worth working" },
    { id: "owner_locked", label: "Owner locked", hint: "Exclusive mandate or opción de compra signed" },
    { id: "tenant_nda", label: "Tenant NDA", hint: "Tenant signed NDA, non-circumvention and search mandate" },
    { id: "tenant_loi", label: "Tenant LOI", hint: "Tenant letter of intent received" },
    { id: "investors", label: "Investors committed", hint: "Investor NDA signed and money committed" },
    { id: "purchase", label: "Purchase signed", hint: "Purchase signed with the fee in the contract" },
    { id: "lease", label: "Lease signed", hint: "Lease signed with the tenant" },
    { id: "fee_paid", label: "Fee paid", hint: "Fee received — done" },
    { id: "lost", label: "Lost", hint: "Deal dropped" },
  ];
  const STAGE = Object.fromEntries(STAGES.map((s, i) => [s.id, { ...s, i }]));
  const PARTY_LABEL = { owner: "Owner", tenant: "Tenant", investor: "Investor", agent: "Agent", other: "Other" };
  const DEFAULT_DOCS = [
    { party: "owner", doc: "Exclusive mandate / opción de compra" },
    { party: "tenant", doc: "NDA + non-circumvention" },
    { party: "tenant", doc: "Search mandate (fee)" },
    { party: "tenant", doc: "Letter of intent" },
    { party: "investor", doc: "NDA + non-circumvention" },
    { party: "owner", doc: "Purchase contract (fee clause)" },
    { party: "tenant", doc: "Lease" },
  ];
  const TENANT_LIST = typeof TENANTS === "object" ? Object.values(TENANTS) : [];

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const eur = (n) => (n == null || n === "" ? "—" : `€${Math.round(Number(n)).toLocaleString("es-ES")}`);
  const pct = (n) => (n == null || n === "" ? "—" : `${Number(n).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`);
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

  const state = { deals: [], view: localStorage.getItem("ps-deals-view") || "board", editing: null };

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
    });
    if (res.status === 401) { location.href = "/login?next=/deals"; throw new Error("Sign in required"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  function toast(msg, bad = false) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("toast--bad", bad);
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 3200);
  }

  /** Rows where the address went to a party that has not signed that document yet. */
  function leaks(d) {
    return (d.docs || []).filter((x) => x.addressShared && !x.signed);
  }
  const overdue = (d) => d.nextDate && d.nextDate < today() && !["fee_paid", "lost"].includes(d.stage);
  const tenantName = (id) => TENANT_LIST.find((t) => t.id === id)?.name || "";

  function summary() {
    const open = state.deals.filter((d) => !["fee_paid", "lost"].includes(d.stage));
    const fees = open.reduce((s, d) => s + (Number(d.fee) || 0), 0);
    const paid = state.deals.filter((d) => d.stage === "fee_paid").reduce((s, d) => s + (Number(d.fee) || 0), 0);
    const warn = state.deals.filter((d) => leaks(d).length).length;
    const late = state.deals.filter(overdue).length;
    $("#summary").innerHTML = `
      <div class="kpi"><span>Open deals</span><b>${open.length}</b></div>
      <div class="kpi"><span>Fees in pipeline</span><b>${eur(fees)}</b></div>
      <div class="kpi"><span>Fees paid</span><b>${eur(paid)}</b></div>
      <div class="kpi${late ? " kpi--bad" : ""}"><span>Overdue next steps</span><b>${late}</b></div>
      <div class="kpi${warn ? " kpi--bad" : ""}"><span>Address shared before signing</span><b>${warn}</b></div>`;
  }

  function cardHtml(d) {
    const lk = leaks(d).length;
    const tn = tenantName(d.tenantId);
    const signed = (d.docs || []).filter((x) => x.signed).length;
    return `<button type="button" class="dcard${lk ? " dcard--warn" : ""}" data-open="${esc(d.id)}">
      <span class="dcard__title">${esc(d.title)}</span>
      ${d.address ? `<span class="dcard__addr">${esc(d.address)}</span>` : ""}
      <span class="dcard__row">
        ${tn ? `<span class="chip">${esc(tn)}</span>` : ""}
        ${d.fee ? `<span class="chip chip--fee">Fee ${eur(d.fee)}</span>` : ""}
        ${(d.docs || []).length ? `<span class="chip chip--muted">${signed}/${d.docs.length} signed</span>` : ""}
      </span>
      ${d.nextAction ? `<span class="dcard__next${overdue(d) ? " is-late" : ""}">${d.nextDate ? `<b>${esc(fmtDate(d.nextDate))}</b> · ` : ""}${esc(d.nextAction)}</span>` : ""}
      ${lk ? `<span class="dcard__warn">⚠ Address shared before signing (${lk})</span>` : ""}
    </button>`;
  }

  function board() {
    return `<div class="board">${STAGES.map((s) => {
      const ds = state.deals.filter((d) => d.stage === s.id);
      const fee = ds.reduce((a, d) => a + (Number(d.fee) || 0), 0);
      return `<section class="col col--${s.id}" aria-label="${esc(s.label)}">
        <header class="col__head"><b>${esc(s.label)}</b><span>${ds.length}${fee ? ` · ${eur(fee)}` : ""}</span></header>
        <p class="col__hint">${esc(s.hint)}</p>
        <div class="col__cards">${ds.map(cardHtml).join("") || `<p class="col__empty">No deals</p>`}</div>
      </section>`;
    }).join("")}</div>`;
  }

  function table() {
    const rows = [...state.deals].sort((a, b) => STAGE[a.stage].i - STAGE[b.stage].i || (a.nextDate || "9").localeCompare(b.nextDate || "9"));
    if (!rows.length) return emptyHtml();
    return `<div class="tablewrap"><table class="dtable">
      <thead><tr><th>Deal</th><th>Stage</th><th>Tenant</th><th class="num">Price</th><th class="num">Rent/mo</th><th class="num">Yield</th><th class="num">Fee</th><th>Next step</th><th>Docs</th></tr></thead>
      <tbody>${rows.map((d) => `<tr data-open="${esc(d.id)}" tabindex="0">
        <td><b>${esc(d.title)}</b>${d.address ? `<small>${esc(d.address)}</small>` : ""}</td>
        <td><span class="stage stage--${d.stage}">${esc(STAGE[d.stage].label)}</span></td>
        <td>${esc(tenantName(d.tenantId)) || "—"}</td>
        <td class="num">${eur(d.price)}</td><td class="num">${eur(d.rent)}</td><td class="num">${pct(d.yieldPct)}</td><td class="num">${eur(d.fee)}</td>
        <td class="${overdue(d) ? "is-late" : ""}">${d.nextDate ? `<b>${esc(fmtDate(d.nextDate))}</b> ` : ""}${esc(d.nextAction) || "—"}</td>
        <td>${(d.docs || []).filter((x) => x.signed).length}/${(d.docs || []).length}${leaks(d).length ? ` <span class="warnmark" title="Address shared before signing">⚠</span>` : ""}</td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  function emptyHtml() {
    return `<div class="dempty"><b>No deals yet</b><p>Open a listing on the map and press <em>Add to deals</em>, or start one here.</p><button type="button" class="btn btn--primary" data-new>New deal</button></div>`;
  }

  function render() {
    summary();
    document.querySelectorAll("[data-view]").forEach((b) => {
      const on = b.dataset.view === state.view;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on);
    });
    $("#deals-root").innerHTML = !state.deals.length ? emptyHtml() : state.view === "table" ? table() : board();
  }

  // ---------- Editor ----------
  const field = (label, name, value, { type = "text", max = 200, hint = "", attrs = "" } = {}) =>
    `<label class="f"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value ?? "")}" maxlength="${max}" ${attrs}>${hint ? `<small>${hint}</small>` : ""}</label>`;

  function docRow(x, i) {
    const warn = x.addressShared && !x.signed;
    return `<div class="docrow${warn ? " docrow--warn" : ""}${x.signed ? " docrow--ok" : ""}" data-doc="${i}">
      <select name="party" aria-label="Party">${Object.entries(PARTY_LABEL).map(([k, v]) => `<option value="${k}"${k === x.party ? " selected" : ""}>${v}</option>`).join("")}</select>
      <input name="partyName" placeholder="Who" maxlength="120" value="${esc(x.partyName)}" aria-label="Party name">
      <input name="doc" placeholder="Document" maxlength="80" value="${esc(x.doc)}" aria-label="Document" required>
      <label class="tick"><input type="checkbox" name="signed"${x.signed ? " checked" : ""}> Signed</label>
      <input name="date" type="date" value="${esc(x.date)}" aria-label="Signed on">
      <label class="tick"><input type="checkbox" name="addressShared"${x.addressShared ? " checked" : ""}> Address shared</label>
      <button type="button" class="iconbtn iconbtn--sm" data-del-doc="${i}" aria-label="Remove document">×</button>
      ${warn ? `<p class="docrow__warn">⚠ Address shared with ${esc(x.partyName || PARTY_LABEL[x.party].toLowerCase())} before this was signed. Get it signed now.</p>` : ""}
    </div>`;
  }

  function invRow(x, i) {
    return `<div class="invrow" data-inv="${i}">
      <input name="name" placeholder="Investor name" maxlength="120" value="${esc(x.name)}" aria-label="Investor name">
      <input name="contact" placeholder="Email or phone" maxlength="200" value="${esc(x.contact)}" aria-label="Investor contact">
      <input name="amount" type="number" min="0" step="1000" placeholder="€ committed" value="${esc(x.amount ?? "")}" aria-label="Amount committed">
      <button type="button" class="iconbtn iconbtn--sm" data-del-inv="${i}" aria-label="Remove investor">×</button>
    </div>`;
  }

  function formHtml(d) {
    const tenantOpts = `<option value="">— none yet —</option>${TENANT_LIST.map((t) => `<option value="${esc(t.id)}"${t.id === d.tenantId ? " selected" : ""}>${esc(t.name)} · ${esc(t.short || "")}</option>`).join("")}`;
    const lk = leaks(d);
    return `
      ${lk.length ? `<div class="banner banner--warn">⚠ The address was shared with ${lk.length} part${lk.length === 1 ? "y" : "ies"} before they signed. Each party should see the address only after signing.</div>` : ""}
      <fieldset><legend>Property</legend>
        ${field("Deal name", "title", d.title, { max: 160, attrs: "required" })}
        <label class="f"><span>Stage</span><select name="stage">${STAGES.map((s) => `<option value="${s.id}"${s.id === d.stage ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</select></label>
        ${field("Address", "address", d.address, { hint: "Only share it with a party after they sign." })}
        ${field("Listing link", "listingUrl", d.listingUrl, { type: "url", max: 400 })}
        <input type="hidden" name="listingId" value="${esc(d.listingId)}">
        ${d.stage === "lost" ? field("Why it was lost", "lostReason", d.lostReason) : ""}
      </fieldset>
      <fieldset><legend>Numbers</legend>
        <div class="grid4">
          ${field("Price (€)", "price", d.price, { type: "number", attrs: 'min="0" step="1000"' })}
          ${field("Rent / month (€)", "rent", d.rent, { type: "number", attrs: 'min="0" step="50"' })}
          ${field("Net yield (%)", "yieldPct", d.yieldPct, { type: "number", attrs: 'step="0.1"' })}
          ${field("Expected fee (€)", "fee", d.fee, { type: "number", attrs: 'min="0" step="500"' })}
        </div>
        ${d.listingId ? `<small class="dmuted">Prefilled from the listing's Calculator when it was added.</small>` : ""}
      </fieldset>
      <fieldset><legend>People</legend>
        <div class="grid2">
          <label class="f"><span>Tenant</span><select name="tenantId">${tenantOpts}</select></label>
          ${field("Tenant contact", "tenantContact", d.tenantContact)}
          ${field("Owner / agent", "ownerName", d.owner?.name, { max: 120 })}
          ${field("Owner contact", "ownerContact", d.owner?.contact)}
        </div>
        <div class="sub"><span>Investors</span><button type="button" class="btn btn--small" data-add-inv>+ Add investor</button></div>
        <div id="inv-list">${(d.investors || []).map(invRow).join("") || `<p class="dmuted">No investors yet.</p>`}</div>
      </fieldset>
      <fieldset><legend>Next step</legend>
        <div class="grid2 grid2--wide">
          ${field("Next action", "nextAction", d.nextAction)}
          ${field("By", "nextDate", d.nextDate, { type: "date" })}
        </div>
      </fieldset>
      <fieldset><legend>Documents</legend>
        <p class="dmuted">Tick <em>Address shared</em> when a party knows the address. A row turns red if they knew it before signing.</p>
        <div id="doc-list">${(d.docs || []).map(docRow).join("")}</div>
        <button type="button" class="btn btn--small" data-add-doc>+ Add document</button>
      </fieldset>
      <fieldset><legend>Notes</legend>
        <label class="f"><span class="sr">Notes</span><textarea name="notes" rows="5" maxlength="5000">${esc(d.notes)}</textarea></label>
      </fieldset>
      <p class="form-err" id="form-err" role="alert" hidden></p>
      <footer class="dform__foot">
        ${d.id ? `<button type="button" class="btn btn--danger" data-delete>Delete</button>` : "<span></span>"}
        <div><button type="button" class="btn btn--ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn--primary">${d.id ? "Save" : "Create deal"}</button></div>
      </footer>`;
  }

  function readForm() {
    const f = $("#deal-form");
    const v = (n) => f.elements[n]?.value ?? "";
    const n = (x) => (x === "" ? null : Number(x));
    const d = state.editing;
    return {
      title: v("title"), stage: v("stage"), listingId: v("listingId"), listingUrl: v("listingUrl"), address: v("address"),
      tenantId: v("tenantId"), tenantContact: v("tenantContact"),
      owner: { name: v("ownerName"), contact: v("ownerContact") },
      investors: [...f.querySelectorAll(".invrow")].map((r) => ({ name: $('[name="name"]', r).value, contact: $('[name="contact"]', r).value, amount: n($('[name="amount"]', r).value) }))
        .filter((x) => x.name || x.contact || x.amount != null),
      fee: n(v("fee")), price: n(v("price")), rent: n(v("rent")), yieldPct: n(v("yieldPct")),
      nextAction: v("nextAction"), nextDate: v("nextDate"), notes: v("notes"),
      docs: [...f.querySelectorAll(".docrow")].map((r) => ({
        party: $('[name="party"]', r).value, partyName: $('[name="partyName"]', r).value, doc: $('[name="doc"]', r).value,
        signed: $('[name="signed"]', r).checked, date: $('[name="date"]', r).value, addressShared: $('[name="addressShared"]', r).checked,
      })).filter((x) => x.doc.trim()),
      lostReason: f.elements.lostReason ? v("lostReason") : d.lostReason || "",
    };
  }

  function openEditor(d) {
    state.editing = d;
    $("#drawer-title").textContent = d.id ? d.title : "New deal";
    $("#deal-form").innerHTML = formHtml(d);
    $("#drawer").hidden = false;
    document.body.classList.add("noscroll");
    setTimeout(() => $("#deal-form [name=title]")?.focus(), 30);
  }
  function closeEditor() {
    $("#drawer").hidden = true;
    document.body.classList.remove("noscroll");
    state.editing = null;
    if (location.hash) history.replaceState(null, "", "/deals");
  }
  function rerenderForm() {
    const draft = { ...state.editing, ...readForm() };
    state.editing = draft;
    const top = $(".drawer__panel").scrollTop;
    $("#deal-form").innerHTML = formHtml(draft);
    $(".drawer__panel").scrollTop = top;
  }

  const blank = () => ({ title: "", stage: "sourced", docs: DEFAULT_DOCS.map((x) => ({ ...x, partyName: "", signed: false, date: "", addressShared: false })), investors: [], owner: {} });

  async function load() {
    const { deals } = await api("/api/deals");
    state.deals = deals;
    render();
  }

  async function createFromPending() {
    const raw = sessionStorage.getItem("ps-pending-deal");
    if (!raw) return null;
    sessionStorage.removeItem("ps-pending-deal");
    const pending = JSON.parse(raw);
    const existing = pending.listingId && state.deals.find((d) => d.listingId === pending.listingId);
    if (existing) { toast("This listing is already in your deals"); return existing.id; }
    try {
      const { deal } = await api("/api/deals", { method: "POST", body: JSON.stringify({ ...blank(), ...pending }) });
      state.deals.unshift(deal);
      toast("Added from the map");
      return deal.id;
    } catch (e) { toast(e.message, true); return null; }
  }

  // ---------- Events ----------
  document.addEventListener("click", async (e) => {
    const t = e.target;
    const view = t.closest("[data-view]");
    if (view) { state.view = view.dataset.view; localStorage.setItem("ps-deals-view", state.view); render(); return; }
    if (t.closest("#new-deal, [data-new]")) { openEditor(blank()); return; }
    const open = t.closest("[data-open]");
    if (open) { const d = state.deals.find((x) => x.id === open.dataset.open); if (d) { history.replaceState(null, "", `/deals#${d.id}`); openEditor(structuredClone(d)); } return; }
    if (t.closest("[data-close]")) { closeEditor(); return; }
    if (t.closest("[data-add-doc]")) { state.editing = { ...state.editing, ...readForm() }; state.editing.docs.push({ party: "other", partyName: "", doc: "New document", signed: false, date: "", addressShared: false }); rerenderFormRaw(); return; }
    if (t.closest("[data-add-inv]")) { state.editing = { ...state.editing, ...readForm() }; state.editing.investors.push({ name: "", contact: "", amount: null }); rerenderFormRaw(); return; }
    const dd = t.closest("[data-del-doc]");
    if (dd) { dd.closest(".docrow").remove(); rerenderForm(); return; }
    const di = t.closest("[data-del-inv]");
    if (di) { di.closest(".invrow").remove(); rerenderForm(); return; }
    if (t.closest("[data-delete]")) {
      const d = state.editing;
      if (!confirm(`Delete "${d.title}"? This cannot be undone.`)) return;
      try { await api(`/api/deals/${d.id}`, { method: "DELETE" }); state.deals = state.deals.filter((x) => x.id !== d.id); closeEditor(); render(); toast("Deal deleted"); } catch (err) { toast(err.message, true); }
    }
  });
  function rerenderFormRaw() {
    // keep empty "New document"/investor rows that readForm would filter out
    const top = $(".drawer__panel").scrollTop;
    $("#deal-form").innerHTML = formHtml(state.editing);
    $(".drawer__panel").scrollTop = top;
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#drawer").hidden) closeEditor();
    if (e.key === "Enter" && e.target.matches("tr[data-open]")) e.target.click();
  });
  $("#deal-form").addEventListener("change", (e) => {
    if (e.target.matches('[name="signed"], [name="addressShared"], [name="stage"]')) {
      if (e.target.name === "signed" && e.target.checked) { const r = e.target.closest(".docrow"); const dt = $('[name="date"]', r); if (!dt.value) dt.value = today(); }
      rerenderForm();
    }
  });
  $("#deal-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = readForm();
    const err = $("#form-err");
    if (!body.title.trim()) { err.textContent = "Give the deal a name."; err.hidden = false; return; }
    const id = state.editing.id;
    try {
      const { deal } = await api(id ? `/api/deals/${id}` : "/api/deals", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
      const i = state.deals.findIndex((x) => x.id === deal.id);
      const full = { ...(i >= 0 ? state.deals[i] : {}), ...deal };
      if (i >= 0) state.deals[i] = full; else state.deals.unshift(full);
      closeEditor(); render(); toast(id ? "Saved" : "Deal created");
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });

  (async () => {
    try {
      await load();
      const pendingId = await createFromPending();
      render();
      const id = pendingId || location.hash.slice(1);
      const d = id && state.deals.find((x) => x.id === id);
      if (d) openEditor(structuredClone(d));
    } catch (e) {
      $("#deals-root").innerHTML = `<div class="dempty"><b>Couldn't load deals</b><p>${esc(e.message)}</p></div>`;
    }
  })();
})();
