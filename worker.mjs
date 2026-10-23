/** Wrangler worker: static web assets + /api/walk and /api/nearby (keys in .dev.vars). */

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

const walkCache = new Map();
const nearbyCache = new Map();

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

async function handleWalk(request, env) {
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
    const minutes = Math.max(5, Math.min(15, Number(body.minutes) || 10));
    const cacheKey = `${lon.toFixed(4)}:${lat.toFixed(4)}:${minutes}`;
    if (walkCache.has(cacheKey)) return json(walkCache.get(cacheKey));
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
    walkCache.set(cacheKey, payload);
    return json(payload);
  } catch {
    return json({ error: "Need a longitude and a latitude" }, 400);
  }
}

async function handleNearby(request, env) {
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
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return json({ error: "Need a longitude and a latitude" }, 400);
  const cacheKey = `${lon.toFixed(4)}:${lat.toFixed(4)}:${kind}`;
  if (nearbyCache.has(cacheKey)) return json(nearbyCache.get(cacheKey));
  const types = PLACE_TYPES[kind] || ["store"];
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
  nearbyCache.set(cacheKey, result);
  return json(result);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/walk" && request.method === "POST") return handleWalk(request, env);
    if (url.pathname === "/api/nearby" && request.method === "GET") return handleNearby(request, env);
    return env.ASSETS.fetch(request);
  },
};
