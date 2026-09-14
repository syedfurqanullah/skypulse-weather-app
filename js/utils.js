"use strict";

/*
 * utils.js — reusable synchronous helpers: formatting, conversion, and mappings.
 */

const WEATHER_DESCRIPTIONS = Object.freeze({
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  56: "Light Freezing Drizzle",
  57: "Dense Freezing Drizzle",
  61: "Light Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  66: "Light Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Light Snow",
  73: "Moderate Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers",
  81: "Moderate Showers",
  82: "Heavy Showers",
  85: "Light Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Heavy Thunderstorm"
});

function convertTemperature(celsius) { if (!Number.isFinite(Number(celsius))) return "--"; return Math.round(state.unit === "fahrenheit" ? Number(celsius) * 9 / 5 + 32 : Number(celsius)); }
function getUnitSymbol() { return state.unit === "fahrenheit" ? "F" : "C"; }
function getWeatherDescription(code) { return WEATHER_DESCRIPTIONS[code] ?? "Unknown Weather"; }
function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}
function getWindDirection(degrees) { return getWindDirectionValue(degrees, ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]); }
function getWindDirectionName(degrees) { return getWindDirectionValue(degrees, ["North", "North East", "East", "South East", "South", "South West", "West", "North West"]); }
function getWindDirectionValue(degrees, labels) { return Number.isFinite(Number(degrees)) ? labels[Math.round(Number(degrees) / 45) % 8] : "--"; }
function findCurrentHourIndex(times) { const currentHour = new Date().toISOString().slice(0, 13); return Math.max(times?.findIndex((time) => time.startsWith(currentHour)) ?? 0, 0); }
function formatHour(value) { return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(value)); }
function formatDay(value) { return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${value}T12:00:00`)); }
function formatTime(value) { return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function formatDuration(seconds) { if (!Number.isFinite(Number(seconds))) return "--"; const minutes = Math.round(Number(seconds) / 60); return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
function getAirQualityStatus(aqi) { if (aqi <= 50) return { label: "Good", description: "Air quality is satisfactory and poses little or no risk." }; if (aqi <= 100) return { label: "Moderate", description: "Air quality is acceptable, but some pollutants may affect sensitive people." }; if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", description: "Sensitive people may experience health effects." }; if (aqi <= 200) return { label: "Unhealthy", description: "Everyone may begin to experience health effects." }; if (aqi <= 300) return { label: "Very Unhealthy", description: "Health alert: increased risk of health effects." }; return { label: "Hazardous", description: "Health warning of emergency conditions." }; }
function getUvLevel(uv) { return uv <= 2 ? "Low" : uv <= 5 ? "Moderate" : uv <= 7 ? "High" : uv <= 10 ? "Very High" : "Extreme"; }
function getUvAdvice(uv) { return uv <= 2 ? "Low protection needed" : uv <= 5 ? "Moderate protection recommended" : uv <= 7 ? "Protection needed" : uv <= 10 ? "Extra protection required" : "Avoid prolonged sun exposure"; }
function escapeHTML(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
