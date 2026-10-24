/**
 * Private deal pipeline API (D1 binding DEALS_DB). The caller (worker.mjs) has already
 * checked the login session, same-origin and the rate limit. Every body is validated
 * against a strict schema here: unknown fields are rejected, strings are length-capped.
 */
export const STAGES = ["sourced", "owner_locked", "tenant_nda", "tenant_loi", "investors", "purchase", "lease", "fee_paid", "lost"];
const PARTIES = ["owner", "tenant", "investor", "agent", "other"];
const MAX_BODY = 32_000;
const MAX_DEALS = 500;
const ID_RE = /^[0-9a-f-]{36}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

class Invalid extends Error {}
const fail = (msg) => { throw new Invalid(msg); };

function str(v, name, max, { required = false } = {}) {
  if (v == null || v === "") { if (required) fail(`${name} is required`); return ""; }
  if (typeof v !== "string") fail(`${name} must be text`);
  const t = v.trim();
  if (t.length > max) fail(`${name} is too long (max ${max})`);
  if (required && !t) fail(`${name} is required`);
  return t;
}
function num(v, name, min, max) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < min || n > max) fail(`${name} must be a number between ${min} and ${max}`);
  return Math.round(n * 100) / 100;
}
function date(v, name) {
  if (v == null || v === "") return "";
  if (typeof v !== "string" || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) fail(`${name} must be YYYY-MM-DD`);
  return v;
}
function bool(v, name) {
  if (v == null) return false;
  if (typeof v !== "boolean") fail(`${name} must be true/false`);
  return v;
}
function url(v, name) {
  const t = str(v, name, 400);
  if (!t) return "";
  let u;
  try { u = new URL(t); } catch { fail(`${name} must be a URL`); }
  if (u.protocol !== "https:") fail(`${name} must be https`);
  return u.toString();
}
function only(obj, allowed, name) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) fail(`${name} must be an object`);
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) fail(`Unknown field ${name}.${k}`);
}
function list(v, name, max, each) {
  if (v == null) return [];
  if (!Array.isArray(v)) fail(`${name} must be a list`);
  if (v.length > max) fail(`${name}: at most ${max}`);
  return v.map((x, i) => each(x, `${name}[${i}]`));
}

const DEAL_FIELDS = ["title", "stage", "listingId", "listingUrl", "address", "tenantId", "tenantContact", "owner", "investors",
  "fee", "price", "rent", "yieldPct", "nextAction", "nextDate", "notes", "docs", "lostReason"];

export function validateDeal(b) {
  only(b, DEAL_FIELDS, "deal");
  const stage = b.stage ?? "sourced";
  if (!STAGES.includes(stage)) fail("stage is not valid");
  const owner = b.owner ?? {};
  only(owner, ["name", "contact"], "owner");
  const tenantId = str(b.tenantId, "tenantId", 40);
  if (tenantId && !/^[a-z0-9_-]+$/.test(tenantId)) fail("tenantId is not valid");
  return {
    title: str(b.title, "title", 160, { required: true }),
    stage,
    listingId: str(b.listingId, "listingId", 64),
    listingUrl: url(b.listingUrl, "listingUrl"),
    address: str(b.address, "address", 200),
    tenantId,
    tenantContact: str(b.tenantContact, "tenantContact", 200),
    owner: { name: str(owner.name, "owner.name", 120), contact: str(owner.contact, "owner.contact", 200) },
    investors: list(b.investors, "investors", 12, (x, n) => {
      only(x, ["name", "contact", "amount"], n);
      return { name: str(x.name, `${n}.name`, 120), contact: str(x.contact, `${n}.contact`, 200), amount: num(x.amount, `${n}.amount`, 0, 1e9) };
    }),
    fee: num(b.fee, "fee", 0, 1e8),
    price: num(b.price, "price", 0, 1e9),
    rent: num(b.rent, "rent", 0, 1e7),
    yieldPct: num(b.yieldPct, "yieldPct", -100, 100),
    nextAction: str(b.nextAction, "nextAction", 200),
    nextDate: date(b.nextDate, "nextDate"),
    notes: str(b.notes, "notes", 5000),
    docs: list(b.docs, "docs", 24, (x, n) => {
      only(x, ["party", "partyName", "doc", "signed", "date", "addressShared"], n);
      if (!PARTIES.includes(x.party)) fail(`${n}.party is not valid`);
      return {
        party: x.party,
        partyName: str(x.partyName, `${n}.partyName`, 120),
        doc: str(x.doc, `${n}.doc`, 80, { required: true }),
        signed: bool(x.signed, `${n}.signed`),
        date: date(x.date, `${n}.date`),
        addressShared: bool(x.addressShared, `${n}.addressShared`),
      };
    }),
    lostReason: str(b.lostReason, "lostReason", 200),
  };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function readBody(request) {
  if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) fail("Send JSON");
  const text = await request.text();
  if (text.length > MAX_BODY) fail("Body too large");
  try { return JSON.parse(text); } catch { fail("Invalid JSON"); }
}

const row = (r) => ({ id: r.id, createdAt: r.created_at, updatedAt: r.updated_at, ...JSON.parse(r.data) });

export async function handleDeals(request, env, url) {
  const db = env.DEALS_DB;
  if (!db) return json({ error: "Deal storage is not configured" }, 503);
  const parts = url.pathname.split("/").filter(Boolean); // ["api","deals",id?]
  if (parts.length > 3) return json({ error: "Not found" }, 404);
  const id = parts[2];
  if (id && !ID_RE.test(id)) return json({ error: "Not found" }, 404);
  try {
    if (!id && request.method === "GET") {
      const { results } = await db.prepare("SELECT * FROM deals ORDER BY updated_at DESC LIMIT ?").bind(MAX_DEALS).all();
      return json({ deals: results.map(row), stages: STAGES });
    }
    if (!id && request.method === "POST") {
      const deal = validateDeal(await readBody(request));
      const count = await db.prepare("SELECT COUNT(*) AS n FROM deals").first("n");
      if (count >= MAX_DEALS) return json({ error: `Limit of ${MAX_DEALS} deals reached` }, 409);
      const newId = crypto.randomUUID();
      const now = Date.now();
      await db.prepare("INSERT INTO deals (id, stage, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
        .bind(newId, deal.stage, JSON.stringify(deal), now, now).run();
      return json({ deal: { id: newId, createdAt: now, updatedAt: now, ...deal } }, 201);
    }
    if (id && request.method === "GET") {
      const r = await db.prepare("SELECT * FROM deals WHERE id = ?").bind(id).first();
      return r ? json({ deal: row(r) }) : json({ error: "Not found" }, 404);
    }
    if (id && request.method === "PUT") {
      const deal = validateDeal(await readBody(request));
      const now = Date.now();
      const res = await db.prepare("UPDATE deals SET stage = ?, data = ?, updated_at = ? WHERE id = ?")
        .bind(deal.stage, JSON.stringify(deal), now, id).run();
      if (!res.meta?.changes) return json({ error: "Not found" }, 404);
      return json({ deal: { id, updatedAt: now, ...deal } });
    }
    if (id && request.method === "DELETE") {
      const res = await db.prepare("DELETE FROM deals WHERE id = ?").bind(id).run();
      return res.meta?.changes ? json({ ok: true }) : json({ error: "Not found" }, 404);
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    if (err instanceof Invalid) return json({ error: err.message }, 400);
    console.error("deals api", err);
    return json({ error: "Something went wrong" }, 500);
  }
}
