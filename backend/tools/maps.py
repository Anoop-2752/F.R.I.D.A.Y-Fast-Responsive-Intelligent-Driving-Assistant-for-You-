import requests


def get_route(origin: str, destination: str) -> dict:
    try:
        origin_coords = geocode(origin)
        dest_coords = geocode(destination)

        if not origin_coords or not dest_coords:
            return {
                "text": f"Could not find route from {origin} to {destination}.",
                "coords": [], "origin": None, "destination": None
            }

        url = "http://router.project-osrm.org/route/v1/driving/"
        coords = f"{origin_coords[1]},{origin_coords[0]};{dest_coords[1]},{dest_coords[0]}"

        res = requests.get(f"{url}{coords}?overview=full&geometries=geojson")
        data = res.json()

        if data["code"] != "Ok":
            return {"text": "Route not found.", "coords": [], "origin": None, "destination": None}

        route = data["routes"][0]
        distance_km = round(route["distance"] / 1000, 1)
        duration_min = round(route["duration"] / 60)

        # GeoJSON is [lng, lat] — flip to [lat, lng] for Leaflet
        leaflet_coords = [[lat, lng] for lng, lat in route["geometry"]["coordinates"]]

        text = (
            f"Route from {origin} to {destination}: "
            f"{distance_km} km, approx {duration_min} minutes."
        )

        return {
            "text": text,
            "coords": leaflet_coords,
            "origin": list(origin_coords),
            "destination": list(dest_coords),
            "distance_km": distance_km,
            "duration_min": duration_min,
            "origin_name": origin,
            "destination_name": destination
        }

    except Exception as e:
        return {"text": f"Navigation failed: {str(e)}", "coords": [], "origin": None, "destination": None}


def geocode(place: str) -> tuple:
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": place, "format": "json", "limit": 1}
        headers = {"User-Agent": "FRIDAY-CarAI/1.0"}
        res = requests.get(url, params=params, headers=headers)
        data = res.json()

        if not data:
            return None

        return float(data[0]["lat"]), float(data[0]["lon"])

    except Exception:
        return None
