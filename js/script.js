const wrapper = document.querySelector(".wrapper"),
  inputPart = document.querySelector(".input-part"),
  infoTxt = inputPart.querySelector(".info-txt"),
  inputField = inputPart.querySelector("input"),
  locationBtn = inputPart.querySelector("button"),
  weatherPart = wrapper.querySelector(".weather-part"),
  forecastSection = wrapper.querySelector(".forecast"),
  forecastDetails = forecastSection.querySelector(".forecast-details"),
  wIcon = weatherPart.querySelector("img"),
  arrowBack = wrapper.querySelector("header i");

let apiKey = "1044ac47fbc04ab19c8111820241510"; 
let weatherChart;

// Function to create or update weather chart
const weatherChartCtx = document.getElementById("weatherChart").getContext("2d");
function createWeatherChart(labels, data) {
  if (weatherChart) {
    weatherChart.destroy();
  }

  weatherChart = new Chart(weatherChartCtx, {
    type: "line", // Line chart for temperature over time
    data: {
      labels: labels,
      datasets: [{
        label: "Temperature (°C)",
        data: data,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Event listeners for input
inputField.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && inputField.value.trim() !== "") {
    requestApi(inputField.value.trim());
  }
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  } else {
    alert("Your browser does not support geolocation API.");
  }
});

// Function to request weather data based on city name
function requestApi(city) {
  const api = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
  fetchData(api);
}

// Function to handle geolocation success
function onSuccess(position) {
  const { latitude, longitude } = position.coords;
  const api = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}`;
  fetchData(api);

  // Display the map with user's location
  displayMap(latitude, longitude);
}

// Function to handle geolocation error
function onError(error) {
  infoTxt.innerText = error.message;
  infoTxt.classList.add("error");
  clearWeatherData();
}

// Fetch data from API
function fetchData(api) {
  infoTxt.innerText = "Fetching weather details...";
  infoTxt.classList.add("pending");

  fetch(api)
    .then((res) => res.json())
    .then((result) => {
      if (result.error) {
        infoTxt.innerText = `${inputField.value} is not a valid city name`;
        infoTxt.classList.replace("pending", "error");
        clearWeatherData();
      } else {
        clearWeatherData();
        weatherDetails(result);
        
        
        fetchForecast(result.location.lat, result.location.lon); 
        forecastSection.removeAttribute("hidden"); // Ensure forecast section is visible
      }
    })
    .catch(() => {
      infoTxt.innerText = "Something went wrong";
      infoTxt.classList.replace("pending", "error");
      clearWeatherData();
    });
}

// Function to display weather details
function weatherDetails(info) {
  const { temp_c: temp, feelslike_c: feels_like, humidity, wind_kph: speed, condition: { text: description, icon } } = info.current;
  const {name: city, country} = info.location
  const weatherDate = new Date(info.location.localtime).toLocaleString('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  wIcon.src = icon;
  weatherPart.querySelector(".temp .numb").innerText = Math.round(temp);
  weatherPart.querySelector(".weather").innerText = description;
  weatherPart.querySelector(".location span").innerText = `${city}, ${country}`;
  weatherPart.querySelector(".temp .numb-2").innerText = Math.round(feels_like);
  weatherPart.querySelector(".humidity span").innerText = `${humidity}%`;
  weatherPart.querySelector(".wind span").innerText = `${speed} kph`;
  weatherPart.querySelector(".date-time").innerText = weatherDate;

  infoTxt.classList.remove("pending", "error");
  infoTxt.innerText = "";
  inputField.value = "";
  wrapper.classList.add("active");
}

// Fetch 7-day forecast data
function fetchForecast(latitude, longitude) {
  const forecastApi = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=7`;

  fetch(forecastApi)
    .then((res) => res.json())
    .then((data) => {
      updateForecast(data.forecast.forecastday);
    })
    .catch(() => {
      infoTxt.innerText = "Forecast data not available";
      infoTxt.classList.replace("pending", "error");
      clearForecast();
    });
}

// Update daily forecast
function updateForecast(dailyData) {
  forecastDetails.innerHTML = ""; // Clear previous forecast

  dailyData.forEach((day) => {
    const { date, day: { condition: { text, icon }, maxtemp_c, mintemp_c } } = day;
    const dayOfWeek = new Date(date).toLocaleDateString('en', { weekday: 'long' });

    const forecastCard = document.createElement("div");
    forecastCard.classList.add("forecast-card");
    forecastCard.innerHTML = `
      <div class="forecast-day">${dayOfWeek}</div>
      <img src="${icon}" alt="Weather Icon" />
      <div class="forecast-temp">
        <span class="max-temp">${Math.round(maxtemp_c)}°C</span> / 
        <span class="min-temp">${Math.round(mintemp_c)}°C</span>
      </div>
      <div class="forecast-desc">${text}</div>
    `;
    forecastDetails.appendChild(forecastCard);
  });
}

// Display map with user's location and weather layer
function displayMap(latitude, longitude) {
  const map = L.map('map').setView([latitude, longitude], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
    maxZoom: 19,
    attribution: '&copy; OpenWeatherMap'
  }).addTo(map);

  L.marker([latitude, longitude]).addTo(map)
    .bindPopup('You are here!')
    .openPopup();
}

// Clear weather data and forecast
function clearWeatherData() {
  wIcon.src = "";
  weatherPart.querySelector(".temp .numb").innerText = "";
  weatherPart.querySelector(".weather").innerText = "";
  weatherPart.querySelector(".location span").innerText = "";
  weatherPart.querySelector(".temp .numb-2").innerText = "";
  weatherPart.querySelector(".humidity span").innerText = "";
  weatherPart.querySelector(".wind span").innerText = "";
  weatherPart.querySelector(".date-time").innerText = "";
  clearForecast(); 
}

function clearForecast() {
  forecastDetails.innerHTML = ""; // Clear forecast section
}
// Event listener for back button
arrowBack.addEventListener("click", () => {
  wrapper.classList.remove("active");
  clearWeatherData();
});

// Change Color Theme
var isDark = false;
const colors = [
  "hsl(345, 80%, 50%)",
  "hsl(100, 80%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(227, 66%, 55%)",
  "hsl(26, 80%, 50%)",
  "hsl(44, 90%, 51%)",
  "hsl(280, 100%, 65%)",
  "hsl(480, 100%, 25%)",
  "hsl(180, 100%, 25%)",
];
const colorBtns = document.querySelectorAll(".theme-color");
const darkModeBtn = document.querySelector(".dark-mode-btn");

darkModeBtn.addEventListener("click", () => {
  isDark = !isDark;
  changeTheme(isDark ? "#000" : colors[3]);
});

colorBtns.forEach((btn, index) => {
  btn.style.backgroundColor = colors[index];
  btn.addEventListener("click", () => {
    changeTheme(btn.style.backgroundColor);
  });
});

function changeTheme(color) {
  document.documentElement.style.setProperty("--primary-color", color);
  saveTheme(color);
}

function saveTheme(color) {
  localStorage.setItem("theme", color);
}

function getTheme() {
  const theme = localStorage.getItem("theme");
  if (theme) {
    changeTheme(theme);
  }
}

getTheme(); 