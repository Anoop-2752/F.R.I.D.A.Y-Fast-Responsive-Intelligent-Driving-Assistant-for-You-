import requests
import os

def get_weather(location: str = "Pattambi") -> str:
    api_key = os.getenv("OPENWEATHER_API_KEY")
    
    if not api_key:
        return "Weather service not configured."

    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": location,
        "appid": api_key,
        "units": "metric"
    }

    try:
        res = requests.get(url, params=params)
        data = res.json()

        if res.status_code != 200:
            return f"Could not fetch weather for {location}."

        temp = data["main"]["temp"]
        feels = data["main"]["feels_like"]
        desc = data["weather"][0]["description"]
        humidity = data["main"]["humidity"]
        wind = data["wind"]["speed"]

        return (
            f"Weather in {location}: {desc}, "
            f"temp {temp}°C (feels like {feels}°C), "
            f"humidity {humidity}%, wind {wind} m/s."
        )

    except Exception as e:
        return f"Weather fetch failed: {str(e)}"