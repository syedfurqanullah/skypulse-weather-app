"use strict";

/*
 * api.js — HTTP helpers for Open-Meteo APIs (geocoding, forecast, air quality).
 * Keep requests simple and return parsed JSON or throw descriptive errors.
 */

const WEATHER_API = Object.freeze({
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast",
  airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality"
});

async function fetchJson(url, errorMessage) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

async function getLocation(city) {
  const params = new URLSearchParams({ name: city, count: "1", language: "en", format: "json" });
  const data = await fetchJson(`${WEATHER_API.geocoding}?${params}`, "Location service is unavailable.");
  return data.results?.[0] ?? null;
}

async function getWeatherData(latitude, longitude) {
  const params = new URLSearchParams({
    latitude, longitude, timezone: "auto", forecast_days: "7", temperature_unit: "celsius", wind_speed_unit: "kmh", precipitation_unit: "mm",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max"
  });
  return fetchJson(`${WEATHER_API.forecast}?${params}`, "Weather service is unavailable.");
}

async function getAirQualityData(latitude, longitude) {
  const params = new URLSearchParams({ latitude, longitude, timezone: "auto", current: "us_aqi,pm2_5,pm10" });
  return fetchJson(`${WEATHER_API.airQuality}?${params}`, "Air quality service is unavailable.");
}
