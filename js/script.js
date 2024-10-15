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

const weatherChartCtx = document.getElementById("weatherChart").getContext("2d");
let weatherChart;

// Function to create or update weather chart
function createWeatherChart(labels, data) {
  if (weatherChart) {
    weatherChart.destroy();
  }

  weatherChart = new Chart(weatherChartCtx, {
    type: "line", // Change chart type as needed (line, bar, etc.)
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
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });
}

// Event listeners
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

// Function to request weather data
function requestApi(city) {
  const api = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
  fetchData(api);

  displayMap(latitude, longitude);
}



// Function to handle geolocation error
function onError(error) {
  infoTxt.innerText = error.message;
  infoTxt.classList.add("error");
  clearWeatherData();
}

// Function to fetch weather data from API
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
  const { name: city, country, temp_c: temp, feelslike_c: feels_like, humidity, wind_kph: speed, condition: { text: description, icon } } = info.current;
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

// Function to fetch daily forecast data
function fetchForecast(latitude, longitude) {
  const forecastApi = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,minutely,hourly&units=metric&appid=${apiKey}`;
  
  fetch(forecastApi)
    .then((res) => res.json())
    .then((data) => {
      if (data.cod && data.cod === "404") {
        infoTxt.innerText = "Forecast data not available";
        infoTxt.classList.replace("pending", "error");
        clearForecast();
      } else {
        updateForecast(data.daily.slice(1, 8)); // Update forecast for next 7 days
      }
    })
    .catch(() => {
      infoTxt.innerText = "Forecast data not available";
      infoTxt.classList.replace("pending", "error");
      clearForecast();
    });
}


// Function to fetch hourly forecast data
function fetchHourlyForecast(latitude, longitude) {
  const hourlyForecastApi = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,daily,minutely&units=metric&appid=${apiKey}`;
  
  fetch(hourlyForecastApi)
    .then((res) => res.json())
    .then((data) => {
      if (data.cod && data.cod === "404") {
        infoTxt.innerText = "Hourly forecast data not available";
        infoTxt.classList.replace("pending", "error");
        clearHourlyForecast();
      } else {
        updateHourlyForecast(data.hourly.slice(0, 24)); // Update hourly forecast for next 24 hours
      }
    })
    .catch(() => {
      infoTxt.innerText = "Hourly forecast data not available";
      infoTxt.classList.replace("pending", "error");
      clearHourlyForecast();
    });
}

// Function to update daily forecast
function updateForecast(dailyData) {
  forecastDetails.innerHTML = ""; // Clear previous forecast details

  dailyData.forEach((day) => {
    const { dt, weather: [{ description, id }], temp: { max, min } } = day;
    const dayOfWeek = new Date(dt * 1000).toLocaleDateString('en', { weekday: 'long' });
    
    const forecastCard = document.createElement("div");
    forecastCard.classList.add("forecast-card");
    forecastCard.innerHTML = `
      <div class="forecast-day">${dayOfWeek}</div>
      <img src="${getWeatherIcon(id)}" alt="Weather Icon" />
      <div class="forecast-temp">
        <span class="max-temp">${Math.round(max)}°C</span> / 
        <span class="min-temp">${Math.round(min)}°C</span>
      </div>
      <div class="forecast-desc">${description}</div>
    `;
    forecastDetails.appendChild(forecastCard);
  });
}
