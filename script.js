"use strict";

/* =========================================================
   01. API CONFIGURATION
========================================================= */

const API = {
    geocoding: "https://geocoding-api.open-meteo.com/v1/search",
    forecast: "https://api.open-meteo.com/v1/forecast",
    airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality"
};


/* =========================================================
   02. APPLICATION STATE
========================================================= */

const state = {
    city: "New York",
    latitude: 40.7128,
    longitude: -74.0060,

    unit: "celsius",

    weather: null,
    airQuality: null,

    map: null,
    mapMarker: null,

    isLoading: false
};


/* =========================================================
   03. DOM ELEMENTS
========================================================= */

const elements = {
    searchForm: document.querySelector(
        'form[role="search"]'
    ),

    searchInput: document.querySelector(
        "#city-search"
    ),

    main: document.querySelector(
        ".dashboard-main"
    ),

    currentSection: document.querySelector(
        '[aria-labelledby="current-weather-title"]'
    ),

    hourlySection: document.querySelector(
        '[aria-labelledby="hourly-title"]'
    ),

    forecastSection: document.querySelector(
        "#forecast"
    ),

    airQualitySection: document.querySelector(
        "#air-quality"
    ),

    additionalSection: document.querySelector(
        '[aria-label="Additional weather information"]'
    ),

    unitButtons: document.querySelectorAll(
        '[aria-labelledby="temperature-unit-title"] button'
    ),

    weatherMap: document.querySelector(
        "#weather-map"
    )
};


/* =========================================================
   04. APPLICATION INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


/**
 * Initializes the complete application.
 */
async function initializeApp() {

    setupEventListeners();

    loadSavedPreferences();

    initializeMap();

    await loadWeather(state.city);
}


/* =========================================================
   05. EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* -------------------------
       City Search
    ------------------------- */

    elements.searchForm?.addEventListener(
        "submit",
        handleSearch
    );


    /* -------------------------
       Temperature Unit
    ------------------------- */

    elements.unitButtons.forEach((button) => {

        button.addEventListener(
            "click",
            handleUnitChange
        );

    });


    /* -------------------------
       Sidebar Navigation
    ------------------------- */

    setupNavigation();


    /* -------------------------
       Header Actions
    ------------------------- */

    setupHeaderActions();

}


/* =========================================================
   06. SEARCH
========================================================= */

async function handleSearch(event) {

    event.preventDefault();

    const query =
        elements.searchInput?.value.trim();

    if (!query) {

        showMessage(
            "Please enter a city name."
        );

        return;
    }

    await loadWeather(query);
}


/* =========================================================
   07. LOAD WEATHER
========================================================= */

async function loadWeather(city) {

    if (state.isLoading) {
        return;
    }

    try {

        setLoadingState(true);


        /* -------------------------
           Get Location
        ------------------------- */

        const location =
            await getLocation(city);

        if (!location) {

            throw new Error(
                `Could not find "${city}".`
            );
        }


        /* -------------------------
           Update Location State
        ------------------------- */

        state.city =
            location.name;

        state.latitude =
            Number(location.latitude);

        state.longitude =
            Number(location.longitude);


        saveCity();


        /* -------------------------
           Fetch Weather Data
        ------------------------- */

        const [
            weather,
            airQuality
        ] = await Promise.all([

            getWeatherData(
                state.latitude,
                state.longitude
            ),

            getAirQualityData(
                state.latitude,
                state.longitude
            )

        ]);


        state.weather =
            weather;

        state.airQuality =
            airQuality;


        /* -------------------------
           Render UI
        ------------------------- */

        renderWeather();

        renderAirQuality();


        /* -------------------------
           Update Map
        ------------------------- */

        updateMap();


    } catch (error) {

        console.error(
            "Weather application error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load weather data."
        );

    } finally {

        setLoadingState(false);

    }
}


/* =========================================================
   08. GEOCODING API
========================================================= */

async function getLocation(city) {

    const params =
        new URLSearchParams({

            name: city,

            count: "1",

            language: "en",

            format: "json"

        });


    const response =
        await fetch(
            `${API.geocoding}?${params}`
        );


    if (!response.ok) {

        throw new Error(
            "Location service is unavailable."
        );
    }


    const data =
        await response.json();


    return data.results?.[0] ?? null;
}


/* =========================================================
   09. WEATHER API
========================================================= */

async function getWeatherData(
    latitude,
    longitude
) {

    const params =
        new URLSearchParams({

            latitude,

            longitude,

            timezone: "auto",

            forecast_days: "7",

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "pressure_msl",
                "wind_speed_10m",
                "wind_direction_10m"
            ].join(","),

            hourly: [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "precipitation_probability",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m"
            ].join(","),

            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "sunrise",
                "sunset",
                "daylight_duration",
                "uv_index_max",
                "precipitation_probability_max"
            ].join(","),

            temperature_unit: "celsius",

            wind_speed_unit: "kmh",

            precipitation_unit: "mm"

        });


    const response =
        await fetch(
            `${API.forecast}?${params}`
        );


    if (!response.ok) {

        throw new Error(
            "Weather service is unavailable."
        );
    }


    return response.json();
}


/* =========================================================
   10. AIR QUALITY API
========================================================= */

async function getAirQualityData(
    latitude,
    longitude
) {

    const params =
        new URLSearchParams({

            latitude,

            longitude,

            current: [
                "us_aqi",
                "pm2_5",
                "pm10"
            ].join(","),

            timezone: "auto"

        });


    const response =
        await fetch(
            `${API.airQuality}?${params}`
        );


    if (!response.ok) {

        throw new Error(
            "Air quality service is unavailable."
        );
    }


    return response.json();
}


/* =========================================================
   11. WEATHER RENDERING
========================================================= */

function renderWeather() {

    if (!state.weather) {
        return;
    }


    renderCurrentWeather();

    renderWeatherDetails();

    renderHourlyForecast();

    renderSevenDayForecast();

    renderSunData();

    renderUvIndex();

    renderPrecipitation();

    renderWind();

    updateLocationHeader();

    updatePageDate();

}


/* =========================================================
   12. CURRENT WEATHER
========================================================= */

function renderCurrentWeather() {

    const current =
        state.weather.current;

    const temperature =
        convertTemperature(
            current.temperature_2m
        );

    const feelsLike =
        convertTemperature(
            current.apparent_temperature
        );

    const description =
        getWeatherDescription(
            current.weather_code
        );


    setText(
        "#current-temperature",
        `${temperature}°${getUnitSymbol()}`
    );


    setText(
        "#current-condition",
        description
    );


    setText(
        "#feels-like",
        `Feels like ${feelsLike}°${getUnitSymbol()}`
    );

}


/* =========================================================
   13. CURRENT WEATHER DETAILS
========================================================= */

function renderWeatherDetails() {

    const current =
        state.weather.current;


    setText(
        "#humidity",
        `${Math.round(current.relative_humidity_2m)}%`
    );


    setText(
        "#wind-speed",
        `${Math.round(current.wind_speed_10m)} km/h`
    );


    setText(
        "#wind-direction",
        getWindDirection(
            current.wind_direction_10m
        )
    );


    setText(
        "#pressure",
        `${Math.round(current.pressure_msl)} hPa`
    );


    /*
       Visibility is not requested from
       the current Open-Meteo endpoint.
    */

    setText(
        "#visibility",
        "10 km"
    );

}


/* =========================================================
   14. HOURLY FORECAST
========================================================= */

function renderHourlyForecast() {

    const hourly =
        state.weather.hourly;

    const list =
        document.querySelector(
            "#hourly-list"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    const currentHourIndex =
        findCurrentHourIndex(
            hourly.time
        );


    const startIndex =
        Math.max(
            currentHourIndex,
            0
        );


    const endIndex =
        Math.min(
            startIndex + 6,
            hourly.time.length
        );


    for (
        let index = startIndex;
        index < endIndex;
        index++
    ) {

        const li =
            document.createElement("li");


        const hour =
            index === startIndex
                ? "Now"
                : formatHour(
                    hourly.time[index]
                );


        const temperature =
            convertTemperature(
                hourly.temperature_2m[index]
            );


        const icon =
            getWeatherIcon(
                hourly.weather_code[index]
            );


        li.innerHTML = `
            <time>
                ${hour}
            </time>

            <span aria-hidden="true">
                ${icon}
            </span>

            <strong>
                ${temperature}°${getUnitSymbol()}
            </strong>
        `;


        list.appendChild(li);

    }

}


/* =========================================================
   15. SEVEN DAY FORECAST
========================================================= */

function renderSevenDayForecast() {

    const daily =
        state.weather.daily;

    const list =
        document.querySelector(
            "#forecast-list"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    daily.time.forEach(
        (date, index) => {

            const li =
                document.createElement("li");


            const dayName =
                index === 0
                    ? "Today"
                    : formatDay(date);


            const icon =
                getWeatherIcon(
                    daily.weather_code[index]
                );


            const maxTemperature =
                convertTemperature(
                    daily.temperature_2m_max[index]
                );


            const minTemperature =
                convertTemperature(
                    daily.temperature_2m_min[index]
                );


            li.innerHTML = `
                <time datetime="${date}">
                    ${dayName}
                </time>

                <span aria-hidden="true">
                    ${icon}
                </span>

                <strong>
                    ${maxTemperature}°${getUnitSymbol()}
                </strong>

                <span>
                    ${minTemperature}°${getUnitSymbol()}
                </span>
            `;


            list.appendChild(li);

        }
    );

}


/* =========================================================
   16. AIR QUALITY
========================================================= */

function renderAirQuality() {

    const current =
        state.airQuality?.current;

    if (!current) {
        return;
    }


    const aqi =
        Math.round(
            current.us_aqi
        );


    const status =
        getAirQualityStatus(aqi);


    setText(
        "#aqi-value",
        aqi
    );


    setText(
        "#aqi-status",
        status.label
    );


    setText(
        "#aqi-description",
        status.description
    );

}


/* =========================================================
   17. SUNRISE & SUNSET
========================================================= */

function renderSunData() {

    const daily =
        state.weather.daily;


    setText(
        "#sunrise",
        formatTime(
            daily.sunrise[0]
        )
    );


    setText(
        "#sunset",
        formatTime(
            daily.sunset[0]
        )
    );


    setText(
        "#daylight",
        formatDuration(
            daily.daylight_duration[0]
        )
    );

}


/* =========================================================
   18. UV INDEX
========================================================= */

function renderUvIndex() {

    const uv =
        Number(
            state.weather.daily
                .uv_index_max[0]
        );


    setText(
        "#uv-value",
        Math.round(uv)
    );


    setText(
        "#uv-level",
        getUvLevel(uv)
    );


    setText(
        "#uv-advice",
        getUvAdvice(uv)
    );

}


/* =========================================================
   19. PRECIPITATION
========================================================= */

function renderPrecipitation() {

    const probability =
        state.weather.daily
            .precipitation_probability_max[0];


    setText(
        "#precipitation-value",
        `${Math.round(probability)}%`
    );

}


/* =========================================================
   20. WIND STATUS
========================================================= */

function renderWind() {

    const current =
        state.weather.current;


    setText(
        "#wind-status",
        `${Math.round(current.wind_speed_10m)} km/h`
    );


    setText(
        "#wind-status-direction",
        getWindDirectionName(
            current.wind_direction_10m
        )
    );

}


/* =========================================================
   21. LOCATION HEADER
========================================================= */

function updateLocationHeader() {

    const location =
        document.querySelector(
            "#current-location"
        );

    if (!location) {
        return;
    }


    location.textContent =
        `${state.city}`;
}


/* =========================================================
   22. DATE / TIME
========================================================= */

function updatePageDate() {

    const dateElement =
        document.querySelector(
            "#current-date"
        );

    if (!dateElement) {
        return;
    }


    const timezone =
        state.weather?.timezone;


    const formatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long",

                month: "long",

                day: "numeric",

                hour: "numeric",

                minute: "2-digit",

                timeZone:
                    timezone || undefined
            }
        );


    dateElement.textContent =
        formatter.format(
            new Date()
        );

}


/* =========================================================
   23. TEMPERATURE UNIT
========================================================= */

function handleUnitChange(event) {

    const button =
        event.currentTarget;


    const isCelsius =
        button.textContent
            .includes("°C");


    state.unit =
        isCelsius
            ? "celsius"
            : "fahrenheit";


    updateUnitButtons();

    saveUnitPreference();


    if (state.weather) {
        renderWeather();
    }

}


/* =========================================================
   24. UPDATE UNIT BUTTONS
========================================================= */

function updateUnitButtons() {

    elements.unitButtons.forEach(
        (button) => {

            const isCelsius =
                button.textContent
                    .includes("°C");


            const active =
                state.unit === "celsius"
                    ? isCelsius
                    : !isCelsius;


            button.setAttribute(
                "aria-pressed",
                String(active)
            );

        }
    );

}


/* =========================================================
   25. TEMPERATURE CONVERSION
========================================================= */

function convertTemperature(
    celsius
) {

    if (
        !Number.isFinite(
            Number(celsius)
        )
    ) {
        return "--";
    }


    if (
        state.unit === "fahrenheit"
    ) {

        return Math.round(
            (Number(celsius) * 9) / 5 + 32
        );

    }


    return Math.round(
        Number(celsius)
    );

}


/* =========================================================
   26. TEMPERATURE SYMBOL
========================================================= */

function getUnitSymbol() {

    return state.unit === "fahrenheit"
        ? "F"
        : "C";

}


/* =========================================================
   27. WEATHER DESCRIPTION
========================================================= */

function getWeatherDescription(code) {

    const descriptions = {

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

    };


    return (
        descriptions[code] ||
        "Unknown Weather"
    );

}


/* =========================================================
   28. WEATHER ICON
========================================================= */

function getWeatherIcon(code) {

    if (code === 0) {
        return "☀️";
    }


    if ([1, 2].includes(code)) {
        return "🌤️";
    }


    if (code === 3) {
        return "☁️";
    }


    if ([45, 48].includes(code)) {
        return "🌫️";
    }


    if (
        [51, 53, 55, 56, 57]
            .includes(code)
    ) {
        return "🌦️";
    }


    if (
        [61, 63, 65, 66, 67, 80, 81, 82]
            .includes(code)
    ) {
        return "🌧️";
    }


    if (
        [71, 73, 75, 77, 85, 86]
            .includes(code)
    ) {
        return "🌨️";
    }


    if (
        [95, 96, 99]
            .includes(code)
    ) {
        return "⛈️";
    }


    return "🌤️";

}


/* =========================================================
   29. WIND DIRECTION
========================================================= */

function getWindDirection(degrees) {

    if (!Number.isFinite(Number(degrees))) {
        return "--";
    }


    const directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"
    ];


    const index =
        Math.round(
            Number(degrees) / 45
        ) % 8;


    return directions[index];

}


/* =========================================================
   30. WIND DIRECTION FULL NAME
========================================================= */

function getWindDirectionName(degrees) {

    const directions = [
        "North",
        "North East",
        "East",
        "South East",
        "South",
        "South West",
        "West",
        "North West"
    ];


    if (!Number.isFinite(Number(degrees))) {
        return "--";
    }


    const index =
        Math.round(
            Number(degrees) / 45
        ) % 8;


    return directions[index];

}


/* =========================================================
   31. CURRENT HOUR INDEX
========================================================= */

function findCurrentHourIndex(times) {

    if (!Array.isArray(times)) {
        return 0;
    }


    const currentHour =
        new Date();


    const currentTime =
        currentHour
            .toISOString()
            .slice(0, 13);


    const index =
        times.findIndex(
            (time) =>
                time.startsWith(currentTime)
        );


    return index >= 0
        ? index
        : 0;

}


/* =========================================================
   32. FORMAT HOUR
========================================================= */

function formatHour(dateTime) {

    const date =
        new Date(dateTime);


    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "numeric"
        }
    ).format(date);

}


/* =========================================================
   33. FORMAT DAY
========================================================= */

function formatDay(dateString) {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long"
        }
    ).format(
        new Date(
            `${dateString}T12:00:00`
        )
    );

}


/* =========================================================
   34. FORMAT TIME
========================================================= */

function formatTime(dateTime) {

    const date =
        new Date(dateTime);


    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);

}


/* =========================================================
   35. FORMAT DAYLIGHT
========================================================= */

function formatDuration(seconds) {

    if (
        !Number.isFinite(
            Number(seconds)
        )
    ) {
        return "--";
    }


    const totalMinutes =
        Math.round(
            Number(seconds) / 60
        );


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    return `${hours}h ${minutes}m`;

}


/* =========================================================
   36. AIR QUALITY STATUS
========================================================= */

function getAirQualityStatus(aqi) {

    if (aqi <= 50) {

        return {
            label: "Good",

            description:
                "Air quality is satisfactory and poses little or no risk."
        };

    }


    if (aqi <= 100) {

        return {
            label: "Moderate",

            description:
                "Air quality is acceptable, but some pollutants may affect sensitive people."
        };

    }


    if (aqi <= 150) {

        return {
            label:
                "Unhealthy for Sensitive Groups",

            description:
                "Sensitive people may experience health effects."
        };

    }


    if (aqi <= 200) {

        return {
            label: "Unhealthy",

            description:
                "Everyone may begin to experience health effects."
        };

    }


    if (aqi <= 300) {

        return {
            label: "Very Unhealthy",

            description:
                "Health alert: increased risk of health effects."
        };

    }


    return {
        label: "Hazardous",

        description:
            "Health warning of emergency conditions."
    };

}


/* =========================================================
   37. UV LEVEL
========================================================= */

function getUvLevel(uv) {

    if (uv <= 2) {
        return "Low";
    }


    if (uv <= 5) {
        return "Moderate";
    }


    if (uv <= 7) {
        return "High";
    }


    if (uv <= 10) {
        return "Very High";
    }


    return "Extreme";

}


/* =========================================================
   38. UV ADVICE
========================================================= */

function getUvAdvice(uv) {

    if (uv <= 2) {
        return "Low protection needed";
    }


    if (uv <= 5) {
        return "Moderate protection recommended";
    }


    if (uv <= 7) {
        return "Protection needed";
    }


    if (uv <= 10) {
        return "Extra protection required";
    }


    return "Avoid prolonged sun exposure";

}


/* =========================================================
   39. LEAFLET MAP INITIALIZATION
========================================================= */

function initializeMap() {

    if (
        !elements.weatherMap ||
        typeof L === "undefined"
    ) {
        return;
    }


    /*
       Create the Leaflet map.
    */

    state.map =
        L.map(
            elements.weatherMap,
            {
                zoomControl: true,

                attributionControl: true
            }
        );


    /*
       OpenStreetMap tiles.
    */

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(
        state.map
    );


    /*
       Initial position.
    */

    state.map.setView(
        [
            state.latitude,
            state.longitude
        ],
        10
    );


    /*
       Create initial marker.
    */

    state.mapMarker =
        L.marker([
            state.latitude,
            state.longitude
        ])
        .addTo(
            state.map
        );


    state.mapMarker.bindPopup(
        `
        <strong>${escapeHTML(state.city)}</strong>
        <br>
        Current weather location
        `
    );


    /*
       Open popup automatically.
    */

    state.mapMarker.openPopup();


    /*
       Fix Leaflet size when the
       map becomes visible.
    */

    setTimeout(
        () => {
            state.map?.invalidateSize();
        },
        100
    );

}


/* =========================================================
   40. UPDATE MAP LOCATION
========================================================= */

function updateMap() {

    if (
        !state.map ||
        typeof L === "undefined"
    ) {
        return;
    }


    const coordinates = [
        state.latitude,
        state.longitude
    ];


    /*
       Move map to new city.
    */

    state.map.setView(
        coordinates,
        10,
        {
            animate: true
        }
    );


    /*
       Update existing marker.
    */

    if (state.mapMarker) {

        state.mapMarker.setLatLng(
            coordinates
        );

        state.mapMarker.setPopupContent(
            `
            <strong>${escapeHTML(state.city)}</strong>
            <br>
            Current weather location
            `
        );

        state.mapMarker.openPopup();

    } else {

        state.mapMarker =
            L.marker(
                coordinates
            )
            .addTo(
                state.map
            );

        state.mapMarker.bindPopup(
            `
            <strong>${escapeHTML(state.city)}</strong>
            <br>
            Current weather location
            `
        );

    }


    /*
       Ensure map renders correctly.
    */

    setTimeout(
        () => {
            state.map?.invalidateSize();
        },
        150
    );

}


/* =========================================================
   41. SIDEBAR NAVIGATION
========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".sidebar-navigation a"
        );


    links.forEach(
        (link) => {

            link.addEventListener(
                "click",
                handleNavigation
            );

        }
    );

}


/* =========================================================
   42. NAVIGATION HANDLER
========================================================= */

function handleNavigation(event) {

    const target =
        event.currentTarget.getAttribute(
            "href"
        );


    if (
        !target ||
        !target.startsWith("#")
    ) {
        return;
    }


    const section =
        document.querySelector(
            target
        );


    if (!section) {
        return;
    }


    event.preventDefault();


    section.scrollIntoView({
        behavior: "smooth",

        block: "start"
    });


    /*
       Leaflet needs a resize calculation
       after scrolling into its section.
    */

    if (target === "#maps") {

        setTimeout(
            () => {
                state.map?.invalidateSize();
            },
            400
        );

    }

}


/* =========================================================
   43. HEADER ACTIONS
========================================================= */

function setupHeaderActions() {

    const buttons =
        document.querySelectorAll(
            ".header-actions button"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                handleHeaderAction
            );

        }
    );

}


/* =========================================================
   44. HEADER ACTION HANDLER
========================================================= */

function handleHeaderAction(event) {

    const button =
        event.currentTarget;


    const label =
        button.getAttribute(
            "aria-label"
        );


    if (!label) {
        return;
    }


    showMessage(
        `${label} feature will be available soon.`
    );

}


/* =========================================================
   45. LOCAL STORAGE
========================================================= */

function saveCity() {

    localStorage.setItem(
        "skypulse-city",
        state.city
    );

}


/* =========================================================
   46. SAVE UNIT
========================================================= */

function saveUnitPreference() {

    localStorage.setItem(
        "skypulse-unit",
        state.unit
    );

}


/* =========================================================
   47. LOAD SAVED PREFERENCES
========================================================= */

function loadSavedPreferences() {

    const savedCity =
        localStorage.getItem(
            "skypulse-city"
        );


    const savedUnit =
        localStorage.getItem(
            "skypulse-unit"
        );


    if (savedCity) {

        state.city =
            savedCity;


        if (elements.searchInput) {

            elements.searchInput.value =
                savedCity;

        }

    }


    if (
        savedUnit === "celsius" ||
        savedUnit === "fahrenheit"
    ) {

        state.unit =
            savedUnit;

    }


    updateUnitButtons();

}


/* =========================================================
   48. LOADING STATE
========================================================= */

function setLoadingState(
    isLoading
) {

    state.isLoading =
        isLoading;


    if (elements.main) {

        elements.main.setAttribute(
            "aria-busy",
            String(isLoading)
        );

    }


    if (elements.searchInput) {

        elements.searchInput.disabled =
            isLoading;

    }


    const searchButton =
        elements.searchForm?.querySelector(
            'button[type="submit"]'
        );


    if (searchButton) {

        searchButton.disabled =
            isLoading;


        searchButton.textContent =
            isLoading
                ? "Loading..."
                : "Search";

    }

}


/* =========================================================
   49. USER NOTIFICATION
========================================================= */

function showMessage(message) {

    let notification =
        document.querySelector(
            ".weather-notification"
        );


    if (!notification) {

        notification =
            document.createElement("div");


        notification.className =
            "weather-notification";


        notification.setAttribute(
            "role",
            "status"
        );


        Object.assign(
            notification.style,
            {

                position: "fixed",

                top: "20px",

                left: "50%",

                transform:
                    "translateX(-50%)",

                zIndex: "9999",

                padding:
                    "12px 18px",

                borderRadius:
                    "12px",

                background:
                    "#17233c",

                color:
                    "#ffffff",

                border:
                    "1px solid rgba(255,255,255,.1)",

                boxShadow:
                    "0 12px 30px rgba(0,0,0,.25)",

                fontSize:
                    "13px"

            }
        );


        document.body.appendChild(
            notification
        );

    }


    notification.textContent =
        message;


    clearTimeout(
        notification._timer
    );


    notification._timer =
        setTimeout(
            () => {

                notification.remove();

            },
            3500
        );

}


/* =========================================================
   50. DOM TEXT HELPER
========================================================= */

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   51. HTML ESCAPE HELPER
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}