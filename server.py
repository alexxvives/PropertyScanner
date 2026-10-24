"""Serve the map and call OpenRouteService and Google with the local keys.

The keys stay in config/secrets.env. The browser never receives them.
Open http://127.0.0.1:4175
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
SECRETS = ROOT / "config" / "secrets.env"

PLACE_TYPES = {
    "bakery": ["bakery"],
    "cafe": ["cafe"],
    "food": ["restaurant"],
    "grocery": ["supermarket", "grocery_store"],
    "pharmacy": ["pharmacy"],
    "beauty": ["hair_salon", "beauty_salon"],
    "fashion": ["clothing_store"],
    "health": ["doctor", "dentist"],
    "gym": ["gym"],
}


def load_secrets() -> dict[str, str]:
    found = {}
    if not SECRETS.exists():
        return found
    for line in SECRETS.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#") or "=" not in text:
            continue
        key, value = text.split("=", 1)
        found[key.strip()] = value.strip()
    return found


SECRETS_MAP = load_secrets()
WALK_CACHE: dict[tuple, dict] = {}
NEARBY_CACHE: dict[tuple, dict] = {}


def post_json(url: str, payload: dict, headers: dict) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **headers},
    )
    with urllib.request.urlopen(request, timeout=40) as response:
        return json.loads(response.read().decode())


class MapHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if urlparse(self.path).path == "/api/nearby":
            self.nearby()
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path == "/api/walk":
            self.walk()
            return
        self.send_error(404)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 20_000:
            return {}
        return json.loads(self.rfile.read(length).decode())

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def walk(self) -> None:
        key = SECRETS_MAP.get("OPENROUTESERVICE_API_KEY", "")
        if not key:
            self.send_json({"error": "OpenRouteService key is empty"}, 500)
            return
        try:
            body = self.read_json()
            lon = float(body["lon"])
            lat = float(body["lat"])
            minutes = max(5, min(15, int(body.get("minutes") or 10)))
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            self.send_json({"error": "Need a longitude and a latitude"}, 400)
            return
        cache_key = (round(lon, 4), round(lat, 4), minutes)
        if cache_key in WALK_CACHE:
            self.send_json(WALK_CACHE[cache_key])
            return
        try:
            payload = post_json(
                "https://api.openrouteservice.org/v2/isochrones/foot-walking",
                {"locations": [[lon, lat]], "range": [minutes * 60], "range_type": "time"},
                {"Authorization": key},
            )
        except urllib.error.HTTPError as error:
            self.send_json({"error": f"OpenRouteService returned {error.code}"}, 502)
            return
        except urllib.error.URLError:
            self.send_json({"error": "OpenRouteService did not respond"}, 502)
            return
        WALK_CACHE[cache_key] = payload
        self.send_json(payload)

    def nearby(self) -> None:
        key = SECRETS_MAP.get("GOOGLE_MAPS_API_KEY", "")
        if not key:
            self.send_json({"error": "Google key is empty"}, 500)
            return
        query = parse_qs(urlparse(self.path).query)
        try:
            lon = float(query["lon"][0])
            lat = float(query["lat"][0])
        except (KeyError, TypeError, ValueError):
            self.send_json({"error": "Need a longitude and a latitude"}, 400)
            return
        kind = (query.get("kind") or ["bakery"])[0]
        types = PLACE_TYPES.get(kind, ["store"])
        cache_key = (round(lon, 4), round(lat, 4), kind)
        if cache_key in NEARBY_CACHE:
            self.send_json(NEARBY_CACHE[cache_key])
            return
        try:
            payload = post_json(
                "https://places.googleapis.com/v1/places:searchNearby",
                {
                    "includedPrimaryTypes": types,
                    "maxResultCount": 10,
                    "rankPreference": "DISTANCE",
                    "locationRestriction": {
                        "circle": {"center": {"latitude": lat, "longitude": lon}, "radius": 400}
                    },
                },
                {
                    "X-Goog-Api-Key": key,
                    "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount",
                },
            )
        except urllib.error.HTTPError as error:
            self.send_json({"error": f"Google Places returned {error.code}"}, 502)
            return
        except urllib.error.URLError:
            self.send_json({"error": "Google Places did not respond"}, 502)
            return
        places = payload.get("places") or []
        ratings = [place["rating"] for place in places if isinstance(place.get("rating"), (int, float))]
        names = []
        for place in places[:3]:
            display = place.get("displayName") or {}
            name = display.get("text") if isinstance(display, dict) else ""
            if name:
                names.append(name)
        result = {
            "count": len(places),
            "rating": round(sum(ratings) / len(ratings), 1) if ratings else None,
            "names": names,
        }
        NEARBY_CACHE[cache_key] = result
        self.send_json(result)


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 4175), MapHandler)
    print("map http://127.0.0.1:4175")
    server.serve_forever()


if __name__ == "__main__":
    main()
