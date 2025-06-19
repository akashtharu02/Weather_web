const apiKey = "6316e19ae23edce59fc3d2ee1a9a0126";
function formatTime(dt) {
  return new Date(dt * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error("City not found");

    const { lat, lon, name, country } = geoData[0];

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    const weather = await weatherRes.json();

    let rainInfo = "No rain expected";
    if (weather.rain && (weather.rain["1h"] || weather.rain["3h"])) {
      const rainVol = weather.rain["1h"] || weather.rain["3h"];
      rainInfo = `Rain volume: ${rainVol} mm`;
    }

    const icon = weather.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    document.getElementById("currentWeather").innerHTML = `
          <div class="card">
            <h2>Current Weather in ${name}, ${country}</h2>
            <p><img src="${iconUrl}" alt="${weather.weather[0].description}"> ${
      weather.weather[0].description
    }</p>
            <p><strong>Temp:</strong> ${weather.main.temp} °C</p>
            <p><strong>Humidity:</strong> ${weather.main.humidity}%</p>
            <p><strong>Pressure:</strong> ${weather.main.pressure} hPa</p>
            <p><strong>Wind Speed:</strong> ${weather.wind.speed} m/s</p>
            <p><strong>Sunrise:</strong> ${formatTime(weather.sys.sunrise)}</p>
            <p><strong>Sunset:</strong> ${formatTime(weather.sys.sunset)}</p>
            <p><strong>Rain Info:</strong> ${rainInfo}</p>
          </div>
        `;
  } catch (error) {
    document.getElementById(
      "currentWeather"
    ).innerHTML = `<p style="color:red;">${error.message}</p>`;
  }
}

function resetWeather() {
  document.getElementById("cityInput").value = "";
  document.getElementById("currentWeather").innerHTML = "";
}
