import requests

def get_route(origin: str, destination: str) -> str:
    try:
        origin_coords = geocode(origin)
        dest_coords = geocode(destination)

        if not origin_coords or not dest_coords:
            return f"Could not find route from {origin} to {destination}."

        url = "http://router.project-osrm.org/route/v1/driving/"
        coords = f"{origin_coords[1]},{origin_coords[0]};{dest_coords[1]},{dest_coords[0]}"

        res = requests.get(f"{url}{coords}?overview=false")
        data = res.json()

        if data["code"] != "Ok":
            return "Route not found."

        route = data["routes"][0]
        distance_km = round(route["distance"] / 1000, 1)
        duration_min = round(route["duration"] / 60)

        return (
            f"Route from {origin} to {destination}: "
            f"{distance_km} km, approx {duration_min} minutes."
        )

    except Exception as e:
        return f"Navigation failed: {str(e)}"


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