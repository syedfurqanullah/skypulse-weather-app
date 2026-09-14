"use strict";

/*
 * ui.js — DOM updates, rendering helpers and Leaflet map integration.
 * Keep behaviour unchanged: functions operate on global `state` and `elements`.
 */

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderWeather() {
  if (!state.weather) return;
  const { current, daily } = state.weather;

  setText(
    "#current-temperature",
    `${convertTemperature(current.temperature_2m)}°${getUnitSymbol()}`
  );

  setText("#current-condition", getWeatherDescription(current.weather_code));

  setText(
    "#feels-like",
    `Feels like ${convertTemperature(current.apparent_temperature)}°${getUnitSymbol()}`
  );

  setText("#humidity", `${Math.round(current.relative_humidity_2m)}%`);
  setText("#wind-speed", `${Math.round(current.wind_speed_10m)} km/h`);
  setText("#wind-direction", getWindDirection(current.wind_direction_10m));
  setText("#pressure", `${Math.round(current.pressure_msl)} hPa`);
  setText("#visibility", "10 km");

  renderHourlyForecast();
  renderSevenDayForecast();

  setText("#sunrise", formatTime(daily.sunrise[0]));
  setText("#sunset", formatTime(daily.sunset[0]));
  setText("#daylight", formatDuration(daily.daylight_duration[0]));

  const uv = Number(daily.uv_index_max[0]);
  setText("#uv-value", Math.round(uv));
  setText("#uv-level", getUvLevel(uv));
  setText("#uv-advice", getUvAdvice(uv));

  setText(
    "#precipitation-value",
    `${Math.round(daily.precipitation_probability_max[0])}%`
  );

  setText("#wind-status", `${Math.round(current.wind_speed_10m)} km/h`);
  setText(
    "#wind-status-direction",
    getWindDirectionName(current.wind_direction_10m)
  );

  setText("#current-location", state.city);

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: state.weather.timezone || undefined
  }).format(new Date());

  setText("#current-date", date);
}

function renderHourlyForecast() {
  const { hourly } = state.weather;
  const list = document.querySelector("#hourly-list");
  if (!list) return;

  const start = findCurrentHourIndex(hourly.time);
  const end = Math.min(start + 6, hourly.time.length);

  list.replaceChildren(
    ...Array.from({ length: end - start }, (_, offset) => {
      const index = start + offset;
      const item = document.createElement("li");
      const time = document.createElement("time");
      const icon = document.createElement("span");
      const temperature = document.createElement("strong");

      time.textContent = offset === 0 ? "Now" : formatHour(hourly.time[index]);
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = getWeatherIcon(hourly.weather_code[index]);
      temperature.textContent = `${convertTemperature(hourly.temperature_2m[index])}°${getUnitSymbol()}`;

      item.append(time, icon, temperature);
      return item;
    })
  );
}

function renderSevenDayForecast() {
  const { daily } = state.weather;
  const list = document.querySelector("#forecast-list");
  if (!list) return;

  list.replaceChildren(
    ...daily.time.map((date, index) => {
      const item = document.createElement("li");
      const time = document.createElement("time");
      const icon = document.createElement("span");
      const maximum = document.createElement("strong");
      const minimum = document.createElement("span");

      time.dateTime = date;
      time.textContent = index === 0 ? "Today" : formatDay(date);
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = getWeatherIcon(daily.weather_code[index]);
      maximum.textContent = `${convertTemperature(daily.temperature_2m_max[index])}°${getUnitSymbol()}`;
      minimum.textContent = `${convertTemperature(daily.temperature_2m_min[index])}°${getUnitSymbol()}`;

      item.append(time, icon, maximum, minimum);
      return item;
    })
  );
}

function renderAirQuality() {
  const current = state.airQuality?.current;
  if (!current) return;

  const aqi = Math.round(current.us_aqi);
  const status = getAirQualityStatus(aqi);

  setText("#aqi-value", aqi);
  setText("#aqi-status", status.label);
  setText("#aqi-description", status.description);
}

function updateUnitButtons() {
  elements.unitButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.textContent.includes("F") ? state.unit === "fahrenheit" : state.unit === "celsius")
    )
  );
}

function setLoadingState(isLoading) {
  state.isLoading = isLoading;
  elements.main.setAttribute("aria-busy", String(isLoading));
  elements.searchInput.disabled = isLoading;
  elements.searchButton.disabled = isLoading;
  elements.searchButton.textContent = isLoading ? "Loading..." : "Search";
}

function showMessage(message) {
  let notification = document.querySelector(".weather-notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.className = "weather-notification";
    notification.setAttribute("role", "status");
    document.body.append(notification);
  }

  notification.textContent = message;
  clearTimeout(notification._timer);
  notification._timer = setTimeout(() => notification.remove(), 3500);
}

function initializeMap() {
  if (!elements.weatherMap || typeof L === "undefined") return;

  state.map = L.map(elements.weatherMap, { zoomControl: true, attributionControl: true });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(state.map);

  state.map.setView([state.latitude, state.longitude], 10);
  state.mapMarker = L.marker([state.latitude, state.longitude]).addTo(state.map);

  updateMapPopup();
  state.mapMarker.openPopup();
  setTimeout(() => state.map?.invalidateSize(), 100);
}

function updateMapPopup() {
  state.mapMarker?.setPopupContent(`<strong>${escapeHTML(state.city)}</strong><br>Current weather location`);
}

function updateMap() {
  if (!state.map || typeof L === "undefined") return;

  const coordinates = [state.latitude, state.longitude];
  state.map.setView(coordinates, 10, { animate: true });

  if (!state.mapMarker) state.mapMarker = L.marker(coordinates).addTo(state.map);
  else state.mapMarker.setLatLng(coordinates);

  updateMapPopup();
  state.mapMarker.openPopup();
  setTimeout(() => state.map?.invalidateSize(), 150);
}
