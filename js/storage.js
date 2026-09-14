"use strict";

/*
 * storage.js — simple localStorage helpers and app preference persistence.
 */

const STORAGE_KEYS = Object.freeze({ city: "skypulse-city", unit: "skypulse-unit" });

function savePreference(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { console.warn("Unable to save preference:", error); }
}

function getPreference(key) {
  try { return localStorage.getItem(key); } catch (error) { console.warn("Unable to read preference:", error); return null; }
}

function saveCity(city) { savePreference(STORAGE_KEYS.city, city); }
function saveUnitPreference(unit) { savePreference(STORAGE_KEYS.unit, unit); }

function loadSavedPreferences() {
  const city = getPreference(STORAGE_KEYS.city);
  const unit = getPreference(STORAGE_KEYS.unit);
  if (city) { state.city = city; elements.searchInput.value = city; }
  if (["celsius", "fahrenheit"].includes(unit)) state.unit = unit;
  updateUnitButtons();
}
