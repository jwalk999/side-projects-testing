// Open-Meteo data layer.
//
// This module is intentionally named and shaped to mirror the official Python SDK
// `openmeteo-requests` (https://pypi.org/project/openmeteo-requests/), so a Python
// backend can feed this UI without any field-name translation:
//
//   import openmeteo_requests
//   openmeteo = openmeteo_requests.Client()
//   response = openmeteo.weather_api(url, params=params)[0]
//   response.Latitude(); response.Current().Variables(0).Value(); ...
//
// The SDK identifies variables by their native Open-Meteo names and by *request order*.
// We keep that order explicit in CURRENT_VARIABLES / HOURLY_VARIABLES / DAILY_VARIABLES
// so `response.Current().Variables(i)` on the Python side maps 1:1 to the fields below.

export type Station = {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
}

export const STATIONS: Station[] = [
  { id: "sfo", name: "San Francisco", region: "California, US", latitude: 37.7749, longitude: -122.4194 },
  { id: "nyc", name: "New York", region: "New York, US", latitude: 40.7128, longitude: -74.006 },
  { id: "lon", name: "London", region: "England, UK", latitude: 51.5072, longitude: -0.1276 },
  { id: "tok", name: "Tokyo", region: "Kanto, JP", latitude: 35.6762, longitude: 139.6503 },
  { id: "syd", name: "Sydney", region: "New South Wales, AU", latitude: -33.8688, longitude: 151.2093 },
  { id: "rey", name: "Reykjavik", region: "Capital Region, IS", latitude: 64.1466, longitude: -21.9426 },
]

export type Units = "metric" | "imperial"

// Request variable orders — must stay in sync with the Python client's params list,
// because the SDK assigns values by index (`Variables(0)`, `Variables(1)`, ...).
export const CURRENT_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "surface_pressure",
  "cloud_cover",
  "visibility",
  "is_day",
] as const

export const HOURLY_VARIABLES = ["temperature_2m", "precipitation_probability", "weather_code"] as const

export const DAILY_VARIABLES = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunrise",
  "sunset",
  "precipitation_probability_max",
] as const

// Response structures — native Open-Meteo names, matching the SDK's Current/Hourly/Daily groups.

export type CurrentWeather = {
  time: string
  interval: number
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
  surface_pressure: number
  cloud_cover: number
  visibility: number
  is_day: number
}

export type HourlyWeather = {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  weather_code: number[]
}

export type DailyWeather = {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  sunrise: string[]
  sunset: string[]
  precipitation_probability_max: number[]
}

// Mirrors the SDK's `response` object (metadata + Current/Hourly/Daily groups + units).
export type WeatherApiResponse = {
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  timezone_abbreviation: string
  utc_offset_seconds: number
  current: CurrentWeather
  current_units: Record<string, string>
  hourly: HourlyWeather
  hourly_units: Record<string, string>
  daily: DailyWeather
  daily_units: Record<string, string>
}

// Row helpers — zip the columnar Hourly/Daily groups into per-timestamp records that
// keep the native variable names (handy for rendering, no renaming across the boundary).
export type HourlyRow = {
  time: string
  temperature_2m: number
  precipitation_probability: number
  weather_code: number
}

export type DailyRow = {
  time: string
  weather_code: number
  temperature_2m_max: number
  temperature_2m_min: number
  sunrise: string
  sunset: string
  precipitation_probability_max: number
}

export function hourlyRows(res: WeatherApiResponse): HourlyRow[] {
  const h = res.hourly
  if (!h?.time) return []
  return h.time.map((time, i) => ({
    time,
    temperature_2m: h.temperature_2m?.[i] ?? 0,
    precipitation_probability: h.precipitation_probability?.[i] ?? 0,
    weather_code: h.weather_code?.[i] ?? 0,
  }))
}

export function dailyRows(res: WeatherApiResponse): DailyRow[] {
  const d = res.daily
  if (!d?.time) return []
  return d.time.map((time, i) => ({
    time,
    weather_code: d.weather_code?.[i] ?? 0,
    temperature_2m_max: d.temperature_2m_max?.[i] ?? 0,
    temperature_2m_min: d.temperature_2m_min?.[i] ?? 0,
    sunrise: d.sunrise?.[i] ?? "",
    sunset: d.sunset?.[i] ?? "",
    precipitation_probability_max: d.precipitation_probability_max?.[i] ?? 0,
  }))
}

// Equivalent of `openmeteo.weather_api(url, params=...)` for a single location.
export async function weatherApi(station: Station, units: Units): Promise<WeatherApiResponse> {
  const params = new URLSearchParams({
    latitude: String(station.latitude),
    longitude: String(station.longitude),
    current: CURRENT_VARIABLES.join(","),
    hourly: HOURLY_VARIABLES.join(","),
    daily: DAILY_VARIABLES.join(","),
    temperature_unit: units === "imperial" ? "fahrenheit" : "celsius",
    wind_speed_unit: units === "imperial" ? "mph" : "kmh",
    timezone: "auto",
    forecast_days: "7",
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`)
  return (await res.json()) as WeatherApiResponse
}

// WMO weather interpretation codes → short label + condition family.
export function describeWeatherCode(code: number): { label: string; family: WeatherFamily } {
  if (code === 0) return { label: "Clear sky", family: "clear" }
  if (code === 1) return { label: "Mainly clear", family: "clear" }
  if (code === 2) return { label: "Partly cloudy", family: "partly" }
  if (code === 3) return { label: "Overcast", family: "cloudy" }
  if (code === 45 || code === 48) return { label: "Fog", family: "fog" }
  if (code >= 51 && code <= 57) return { label: "Drizzle", family: "rain" }
  if (code >= 61 && code <= 67) return { label: "Rain", family: "rain" }
  if (code >= 71 && code <= 77) return { label: "Snow", family: "snow" }
  if (code >= 80 && code <= 82) return { label: "Rain showers", family: "rain" }
  if (code >= 85 && code <= 86) return { label: "Snow showers", family: "snow" }
  if (code >= 95) return { label: "Thunderstorm", family: "storm" }
  return { label: "Unknown", family: "cloudy" }
}

export type WeatherFamily = "clear" | "partly" | "cloudy" | "fog" | "rain" | "snow" | "storm"

export function compassLabel(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}
