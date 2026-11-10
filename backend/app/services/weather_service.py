from __future__ import annotations

import threading
from datetime import datetime
from typing import Any, Optional

import httpx


class WeatherService:
    CACHE_TTL_SECONDS = 600

    def __init__(self) -> None:
        self._client = httpx.Client(timeout=10.0, headers={"User-Agent": "PrecertoWeather/1.0"})
        self._lock = threading.Lock()
        self._location_cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._forecast_cache: dict[str, tuple[float, dict[str, Any]]] = {}

    def _cache_get(self, cache: dict[str, tuple[float, dict[str, Any]]], key: str) -> Optional[dict[str, Any]]:
        with self._lock:
            item = cache.get(key)
            if not item:
                return None

            expires_at, value = item
            if expires_at <= datetime.utcnow().timestamp():
                cache.pop(key, None)
                return None

            return value

    def _cache_set(self, cache: dict[str, tuple[float, dict[str, Any]]], key: str, value: dict[str, Any]) -> None:
        with self._lock:
            cache[key] = (datetime.utcnow().timestamp() + self.CACHE_TTL_SECONDS, value)

    def _geocode_city(self, city: str) -> dict[str, Any]:
        cache_key = f"city:{city.strip().lower()}"
        cached = self._cache_get(self._location_cache, cache_key)
        if cached:
            return cached

        response = self._client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1, "language": "en", "format": "json"},
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("results") or []
        if not results:
            raise ValueError(f"Unable to geocode city '{city}'")

        result = results[0]
        resolved = {
            "label": ", ".join(
                part for part in [result.get("name"), result.get("admin1"), result.get("country")] if part
            ),
            "city": result.get("name") or city,
            "latitude": float(result["latitude"]),
            "longitude": float(result["longitude"]),
            "source": "city",
        }
        self._cache_set(self._location_cache, cache_key, resolved)
        return resolved

    def _reverse_geocode(self, latitude: float, longitude: float) -> dict[str, Any]:
        cache_key = f"coords:{round(latitude, 3)}:{round(longitude, 3)}"
        cached = self._cache_get(self._location_cache, cache_key)
        if cached:
            return cached

        response = self._client.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": latitude, "lon": longitude, "format": "jsonv2"},
        )
        response.raise_for_status()
        payload = response.json()
        address = payload.get("address") or {}
        city = address.get("city") or address.get("town") or address.get("village") or address.get("municipality")
        label_parts = [city, address.get("state"), address.get("country")]
        resolved = {
            "label": ", ".join(part for part in label_parts if part) or payload.get("display_name") or "Current location",
            "city": city,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "source": "browser-geolocation",
        }
        self._cache_set(self._location_cache, cache_key, resolved)
        return resolved

    def resolve_location(
        self,
        *,
        city: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        label: Optional[str] = None,
    ) -> dict[str, Any]:
        if latitude is not None and longitude is not None:
            resolved = self._reverse_geocode(latitude, longitude)
        elif city:
            resolved = self._geocode_city(city)
        else:
            raise ValueError("A city or coordinates are required to look up weather")

        if label:
            resolved = {**resolved, "label": label}
        return resolved

    def _forecast_cache_key(self, latitude: float, longitude: float) -> str:
        return f"forecast:{round(latitude, 3)}:{round(longitude, 3)}"

    def _get_forecast(self, latitude: float, longitude: float) -> dict[str, Any]:
        cache_key = self._forecast_cache_key(latitude, longitude)
        cached = self._cache_get(self._forecast_cache, cache_key)
        if cached:
            return cached

        response = self._client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": latitude,
                "longitude": longitude,
                "hourly": "temperature_2m,apparent_temperature,precipitation_probability,weather_code,windspeed_10m,uv_index",
                "forecast_days": 16,
                "timezone": "auto",
            },
        )
        response.raise_for_status()
        payload = response.json()
        self._cache_set(self._forecast_cache, cache_key, payload)
        return payload

    def _parse_datetime(self, value: Optional[datetime]) -> datetime:
        if value is None:
            return datetime.now()
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=None)

    def _weather_description(self, weather_code: Optional[int]) -> str:
        weather_map = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            56: "Freezing drizzle",
            57: "Freezing drizzle",
            61: "Light rain",
            63: "Moderate rain",
            65: "Heavy rain",
            66: "Freezing rain",
            67: "Freezing rain",
            71: "Light snow",
            73: "Moderate snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Rain showers",
            81: "Rain showers",
            82: "Violent rain showers",
            85: "Snow showers",
            86: "Snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with hail",
            99: "Thunderstorm with hail",
        }
        return weather_map.get(weather_code or -1, "Weather unavailable")

    def _recommendation(
        self,
        weather_code: Optional[int],
        temperature_c: Optional[float],
        precipitation_probability: Optional[int],
        wind_speed_kph: Optional[float],
        uv_index: Optional[float],
    ) -> str:
        if weather_code in {95, 96, 99}:
            return "Expect storms and leave extra travel time."
        if weather_code in {61, 63, 65, 80, 81, 82, 51, 53, 55, 56, 57} or (precipitation_probability or 0) >= 50:
            return "Bring an umbrella and plan extra travel time."
        if weather_code in {71, 73, 75, 77, 85, 86} or (temperature_c is not None and temperature_c <= 8):
            return "Dress warmly and travel with an extra layer."
        if uv_index is not None and uv_index >= 6:
            return "Use SPF, wear sunglasses, and stay hydrated."
        if temperature_c is not None and temperature_c >= 28:
            return "Use SPF, stay hydrated, and avoid heavy outer layers."
        if wind_speed_kph is not None and wind_speed_kph >= 30:
            return "Expect windy conditions and allow a little more travel time."
        return "Conditions look manageable, but keep a light backup plan for travel."

    def get_forecast(
        self,
        *,
        city: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        label: Optional[str] = None,
        target_datetime: Optional[datetime] = None,
    ) -> dict[str, Any]:
        resolved = self.resolve_location(city=city, latitude=latitude, longitude=longitude, label=label)
        forecast = self._get_forecast(resolved["latitude"], resolved["longitude"])
        hourly = forecast.get("hourly") or {}
        times = hourly.get("time") or []
        if not times:
            raise ValueError("Weather forecast data unavailable")

        target = self._parse_datetime(target_datetime)
        parsed_times = [datetime.fromisoformat(str(item).replace("Z", "+00:00")).replace(tzinfo=None) for item in times]
        nearest_index = min(range(len(parsed_times)), key=lambda idx: abs(parsed_times[idx] - target))

        def pick_hourly(field: str) -> Optional[Any]:
            values = hourly.get(field)
            if isinstance(values, list) and len(values) > nearest_index:
                return values[nearest_index]
            return None

        weather_code = pick_hourly("weather_code")
        temperature_c = pick_hourly("temperature_2m")
        apparent_temperature_c = pick_hourly("apparent_temperature")
        precipitation_probability = pick_hourly("precipitation_probability")
        wind_speed_kph = pick_hourly("windspeed_10m")
        uv_index = pick_hourly("uv_index")
        forecast_datetime = parsed_times[nearest_index]

        return {
            "location": resolved,
            "consultation_datetime": target,
            "forecast_datetime": forecast_datetime,
            "weather_code": weather_code,
            "weather_description": self._weather_description(weather_code),
            "temperature_c": temperature_c,
            "apparent_temperature_c": apparent_temperature_c,
            "precipitation_probability": precipitation_probability,
            "wind_speed_kph": wind_speed_kph,
            "uv_index": uv_index,
            "recommendation": self._recommendation(
                weather_code,
                temperature_c,
                precipitation_probability,
                wind_speed_kph,
                uv_index,
            ),
            "source": "open-meteo",
            "updated_at": datetime.utcnow(),
            "cache_ttl_seconds": self.CACHE_TTL_SECONDS,
        }
