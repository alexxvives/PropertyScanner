/**
 * Wrangler worker: static web assets + /api/walk and /api/nearby (keys in .dev.vars).
 *
 * Private by default:
 *   - Every request (pages, data, API) needs a session cookie obtained at /login with
 *     the shared password in the APP_PASSWORD secret. Cookie is HMAC-signed with
 *     SESSION_SECRET. If APP_PASSWORD is not set the app refuses to serve
 *     (set AUTH_DISABLED=1 in .dev.vars only for local `wrangler dev`).
 *   - /api/* also: same-origin check + per-IP rate limit (API_LIMITER binding,
 *     falls back to a per-isolate in-memory limiter).
 *   - Upstream responses are cached persistently: KV (API_CACHE binding) if bound,
 *     otherwise the Cache API (note: Cache API is a no-op on *.workers.dev hosts).
 */

const PLACE_TYPES = {
  bakery: ["bakery"],
  cafe: ["cafe"],
  food: ["restaurant"],
  grocery: ["supermarket", "grocery_store"],
  pharmacy: ["pharmacy"],
  beauty: ["hair_salon", "beauty_salon"],
  fashion: ["clothing_store"],
  health: ["doctor", "dentist"],
  gym: ["gym"],
};

const SESSION_COOKIE = "ps_session";
const SESSION_DAYS = 30;
const WALK_TTL = 60 * 60 * 24 * 30; // isochrones barely change
const NEARBY_TTL = 60 * 60 * 24 * 7;
const FALLBACK_LIMIT = { limit: 30, windowMs: 60_000 };
const memoryHits = new Map();

const enc = new TextEncoder();

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function sessionSecret(env) {
  return env.SESSION_SECRET || env.APP_PASSWORD;
}

async function makeSession(env) {
  const exp = Date.now() + SESSION_DAYS * 86400_000;
  return `${exp}.${await hmac(sessionSecret(env), `session:${exp}`)}`;
}

async function validSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match) return false;
  const [exp, sig] = match[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(sessionSecret(env), `session:${exp}`));
}

function loginPage(error = "", status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Property Scanner · sign in</title><meta name="robots" content="noindex">
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0}
form{display:flex;flex-direction:column;gap:12px;padding:28px;border-radius:12px;background:#1e293b;min-width:280px}
input,button{font:inherit;padding:10px;border-radius:8px;border:1px solid #475569}button{background:#6d28d9;color:#fff;border:0;cursor:pointer}
.err{color:#fca5a5;margin:0}</style></head><body>
<form method="post" action="/login"><strong>Property Scanner</strong>
${error ? `<p class="err">${error}</p>` : ""}
<input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus required>
<button type="submit">Sign in</button></form></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

async function handleLogin(request, env) {
  if (request.method !== "POST") return loginPage();
  if (!(await allowRequest(request, env, "login"))) return loginPage("Too many attempts. Wait a minute.", 429);
  const form = await request.formData().catch(() => null);
  const password = form?.get("password") || "";
  if (!safeEqual(password, env.APP_PASSWORD)) return loginPage("Wrong password.", 401);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": `${SESSION_COOKIE}=${await makeSession(env)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure}`,
    },
  });
}

function logout() {
  return new Response(null, {
    status: 303,
    headers: { Location: "/login", "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` },
  });
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || "local";
}

async function allowRequest(request, env, scope) {
  const key = `${scope}:${clientIp(request)}`;
  if (env.API_LIMITER?.limit) {
    const { success } = await env.API_LIMITER.limit({ key });
    return success;
  }
  const now = Date.now();
  const hits = (memoryHits.get(key) || []).filter((t) => now - t < FALLBACK_LIMIT.windowMs);
  hits.push(now);
  memoryHits.set(key, hits);
  if (memoryHits.size > 5000) memoryHits.clear();
  return hits.length <= FALLBACK_LIMIT.limit;
}

function sameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return false;
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return false;
  // POSTs from a browser always carry Origin; require it so curl/other sites can't post blind.
  if (request.method === "POST" && !origin) return false;
  return true;
}

async function cacheGet(env, key) {
  if (env.API_CACHE) return env.API_CACHE.get(key, "json");
  const hit = await caches.default.match(`https://cache.internal/${encodeURIComponent(key)}`);
  return hit ? hit.json() : null;
}

async function cachePut(env, ctx, key, value, ttl) {
  const write = env.API_CACHE
    ? env.API_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl })
    : caches.default.put(
        `https://cache.internal/${encodeURIComponent(key)}`,
        new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${ttl}` } }),
      );
  if (ctx?.waitUntil) ctx.waitUntil(write.catch(() => {}));
  else await write.catch(() => {});
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function proxyToPython(request, url) {
  const target = new URL(url.pathname + url.search, "http://127.0.0.1:4175");
  const init = { method: request.method, headers: request.headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }
  try {
    const response = await fetch(target, init);
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return null;
  }
}

async function handleWalk(request, env, ctx) {
  const orsKey = env.OPENROUTESERVICE_API_KEY;
  if (!orsKey) {
    const proxied = await proxyToPython(request, new URL(request.url));
    if (proxied) return proxied;
    return json({ error: "OpenRouteService key is empty. Add OPENROUTESERVICE_API_KEY to .dev.vars or run python server.py on port 4175." }, 500);
  }
  let body;
  try {
    body = await request.json();
    const lon = Number(body.lon);
    const lat = Number(body.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error("bad");
    const minutes = Math.max(5, Math.min(15, Number(body.minutes) || 10));
    const cacheKey = `walk:${lon.toFixed(4)}:${lat.toFixed(4)}:${minutes}`;
    const cached = await cacheGet(env, cacheKey);
    if (cached) return json(cached);
    const response = await fetch("https://api.openrouteservice.org/v2/isochrones/foot-walking", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: orsKey },
      body: JSON.stringify({
        locations: [[lon, lat]],
        range: [minutes * 60],
        range_type: "time",
      }),
    });
    const payload = await response.json();
    if (!response.ok) return json({ error: payload?.error || `OpenRouteService returned ${response.status}` }, 502);
    await cachePut(env, ctx, cacheKey, payload, WALK_TTL);
    return json(payload);
  } catch {
    return json({ error: "Need a longitude and a latitude" }, 400);
  }
}

async function handleNearby(request, env, ctx) {
  const googleKey = env.GOOGLE_MAPS_API_KEY;
  const url = new URL(request.url);
  if (!googleKey) {
    const proxied = await proxyToPython(request, url);
    if (proxied) return proxied;
    return json({ error: "Google key is empty. Add GOOGLE_MAPS_API_KEY to .dev.vars or run python server.py on port 4175." }, 500);
  }
  const lon = Number(url.searchParams.get("lon"));
  const lat = Number(url.searchParams.get("lat"));
  const kind = url.searchParams.get("kind") || "bakery";
  if (!(kind in PLACE_TYPES)) return json({ error: "Unknown kind" }, 400);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return json({ error: "Need a longitude and a latitude" }, 400);
  const cacheKey = `nearby:${lon.toFixed(4)}:${lat.toFixed(4)}:${kind}`;
  const cached = await cacheGet(env, cacheKey);
  if (cached) return json(cached);
  const types = PLACE_TYPES[kind];
  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleKey,
      "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 10,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: 400 } },
    }),
  });
  const payload = await response.json();
  if (!response.ok) return json({ error: `Google Places returned ${response.status}` }, 502);
  const places = payload.places || [];
  const ratings = places.map((p) => p.rating).filter((n) => typeof n === "number");
  const names = places
    .slice(0, 3)
    .map((p) => p.displayName?.text)
    .filter(Boolean);
  const result = {
    count: places.length,
    rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    names,
  };
  await cachePut(env, ctx, cacheKey, result, NEARBY_TTL);
  return json(result);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const authOff = env.AUTH_DISABLED === "1";
    if (!authOff) {
      if (!env.APP_PASSWORD) {
        return new Response("Property Scanner is private. Set the APP_PASSWORD secret (wrangler secret put APP_PASSWORD).", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      if (url.pathname === "/login") return handleLogin(request, env);
      if (url.pathname === "/logout") return logout();
      if (!(await validSession(request, env))) {
        if (url.pathname.startsWith("/api/")) return json({ error: "Sign in required" }, 401);
        if (url.pathname.startsWith("/data/")) return new Response("Sign in required", { status: 401 });
        return Response.redirect(new URL("/login", url).toString(), 302);
      }
    }
    if (url.pathname.startsWith("/api/")) {
      if (!sameOrigin(request)) return json({ error: "Cross-origin request blocked" }, 403);
      if (!(await allowRequest(request, env, "api"))) return json({ error: "Too many requests, slow down" }, 429);
      if (url.pathname === "/api/walk" && request.method === "POST") return handleWalk(request, env, ctx);
      if (url.pathname === "/api/nearby" && request.method === "GET") return handleNearby(request, env, ctx);
      return json({ error: "Not found" }, 404);
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex");
    headers.set("Cache-Control", "private, no-store");
    return new Response(response.body, { status: response.status, headers });
  },
};
