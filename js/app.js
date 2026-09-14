"use strict";

/*
 * app.js — Application initialization and main event handlers.
 * Responsible for wiring UI interactions, loading preferences and fetching data.
 */

const state = {
  city: "New York",
  latitude: 40.7128,
  longitude: -74.006,
  unit: "celsius",
  weather: null,
  airQuality: null,
  map: null,
  mapMarker: null,
  isLoading: false
};
const elements = {
  searchForm: document.querySelector('form[role="search"]'), searchInput: document.querySelector("#city-search"), searchButton: document.querySelector('form[role="search"] button[type="submit"]'), main: document.querySelector(".dashboard-main"),
  unitButtons: document.querySelectorAll('[aria-labelledby="temperature-unit-title"] button'), weatherMap: document.querySelector("#weather-map")
};

document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() { loadSavedPreferences(); setupEventListeners(); initializeMap(); await loadWeather(state.city); }
function setupEventListeners() {
  elements.searchForm?.addEventListener("submit", handleSearch);
  elements.unitButtons.forEach((button) => button.addEventListener("click", handleUnitChange));
  document.querySelectorAll(".sidebar-navigation a").forEach((link) => link.addEventListener("click", handleNavigation));
  document.querySelectorAll(".header-actions button").forEach((button) => button.addEventListener("click", handleHeaderAction));
}
async function handleSearch(event) { event.preventDefault(); const city = elements.searchInput.value.trim(); if (!city) return showMessage("Please enter a city name."); await loadWeather(city); }
async function loadWeather(city) {
  if (state.isLoading) return;
  try { setLoadingState(true); const location = await getLocation(city); if (!location) throw new Error(`Could not find "${city}".`); state.city = location.name; state.latitude = Number(location.latitude); state.longitude = Number(location.longitude); saveCity(state.city); [state.weather, state.airQuality] = await Promise.all([getWeatherData(state.latitude, state.longitude), getAirQualityData(state.latitude, state.longitude)]); renderWeather(); renderAirQuality(); updateMap(); }
  catch (error) { console.error("Weather application error:", error); showMessage(error.message || "Unable to load weather data."); }
  finally { setLoadingState(false); }
}
function handleUnitChange(event) { state.unit = event.currentTarget.textContent.includes("F") ? "fahrenheit" : "celsius"; updateUnitButtons(); saveUnitPreference(state.unit); renderWeather(); }
function handleNavigation(event) { const target = event.currentTarget.getAttribute("href"); const section = target?.startsWith("#") ? document.querySelector(target) : null; if (!section) return; event.preventDefault(); section.scrollIntoView({ behavior: "smooth", block: "start" }); if (target === "#maps") setTimeout(() => state.map?.invalidateSize(), 400); }
function handleHeaderAction(event) { const label = event.currentTarget.getAttribute("aria-label"); if (label) showMessage(`${label} feature will be available soon.`); }
