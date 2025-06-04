
const apiKey = "6316e19ae23edce59fc3d2ee1a9a0126"; 

function formatDate(dt) {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dt * 1000).toLocaleDateString(undefined, options);
}

function formatTime(dt) {
    return new Date(dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    // Hide 5-day forecast initially & toggle button hidden while loading
    document.getElementById("fiveDayForecast").style.display = "none";
    const toggleBtn = document.getElementById("toggle5DayBtn");
    toggleBtn.style.display = "none";
    toggleBtn.textContent = "Show Next 5 Days Weather Condition";

    try {
        // Get coordinates
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error("City not found");

        const { lat, lon, name, country } = geoData[0];

        // Get current weather
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const weather = await weatherRes.json();

        // Current rain chance - OpenWeatherMap current weather API doesn't provide 'pop', but 'rain' object shows volume in last 1h or 3h
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
          <p><img src="${iconUrl}" alt="${weather.weather[0].description}"> ${weather.weather[0].description}</p>
          <p><strong>Temp:</strong> ${weather.main.temp} °C</p>
          <p><strong>Humidity:</strong> ${weather.main.humidity}%</p>
          <p><strong>Pressure:</strong> ${weather.main.pressure} hPa</p>
          <p><strong>Wind Speed:</strong> ${weather.wind.speed} m/s</p>
          <p><strong>Sunrise:</strong> ${formatTime(weather.sys.sunrise)}</p>
          <p><strong>Sunset:</strong> ${formatTime(weather.sys.sunset)}</p>
          <p><strong>Rain Info:</strong> ${rainInfo}</p>
        </div>
      `;

        // Get 5-day forecast (3-hour intervals)
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const forecastData = await forecastRes.json();

        // Next 24 hours forecast = next 8 intervals
        const next8 = forecastData.list.slice(0, 8);
        const forecast24hDiv = document.getElementById("forecast24h");
        forecast24hDiv.innerHTML = "";
        next8.forEach(item => {
            const timeStr = formatTime(item.dt);
            const temp = item.main.temp.toFixed(1);
            const desc = item.weather[0].description;
            const icon = item.weather[0].icon;
            const rainChance = (item.pop || 0) * 100;

            forecast24hDiv.innerHTML += `
          <div class="card forecast-interval">
            <div><strong>${timeStr}</strong></div>
            <div><img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}"></div>
            <div style="flex-grow:1; padding-left:10px;">${desc}</div>
            <div><strong>Temp:</strong> ${temp} °C</div>
            <div><strong>Rain Chance:</strong> ${rainChance.toFixed(0)}%</div>
          </div>
        `;
        });

        // Group forecast by day for 5-day forecast
        const dailyData = {};
        forecastData.list.forEach(item => {
            const date = item.dt_txt.split(" ")[0];
            if (!dailyData[date]) dailyData[date] = [];
            dailyData[date].push(item);
        });

        const forecast5dayDiv = document.getElementById("forecast5day");
        forecast5dayDiv.innerHTML = "";

        const days = Object.keys(dailyData).slice(0, 5);
        days.forEach(date => {
            const dayItems = dailyData[date];
            let minTemp = Infinity;
            let maxTemp = -Infinity;
            let maxPop = 0;
            const iconCount = {};
            const descCount = {};

            dayItems.forEach(i => {
                if (i.main.temp_min < minTemp) minTemp = i.main.temp_min;
                if (i.main.temp_max > maxTemp) maxTemp = i.main.temp_max;
                if (i.pop > maxPop) maxPop = i.pop;

                const icon = i.weather[0].icon;
                const desc = i.weather[0].description;
                iconCount[icon] = (iconCount[icon] || 0) + 1;
                descCount[desc] = (descCount[desc] || 0) + 1;
            });

            const mostFreqIcon = Object.entries(iconCount).sort((a, b) => b[1] - a[1])[0][0];
            const mostFreqDesc = Object.entries(descCount).sort((a, b) => b[1] - a[1])[0][0];

            const iconUrl = `https://openweathermap.org/img/wn/${mostFreqIcon}.png`;

            forecast5dayDiv.innerHTML += `
          <div class="card forecast-day">
            <div><strong>${formatDate(new Date(date).getTime() / 1000)}</strong></div>
            <div><img src="${iconUrl}" alt="${mostFreqDesc}"></div>
            <div style="flex-grow:1; padding-left:10px;">${mostFreqDesc}</div>
            <div><strong>Min:</strong> ${minTemp.toFixed(1)} °C</div>
            <div><strong>Max:</strong> ${maxTemp.toFixed(1)} °C</div>
            <div><strong>Rain Chance:</strong> ${(maxPop * 100).toFixed(0)}%</div>
          </div>
        `;
        });

        // Show button to toggle 5-day forecast
        toggleBtn.style.display = "inline-block";

    } catch (error) {
        document.getElementById("currentWeather").innerHTML = `<p style="color:red;">${error.message}</p>`;
        document.getElementById("forecast24h").innerHTML = "";
        document.getElementById("forecast5day").innerHTML = "";
        document.getElementById("toggle5DayBtn").style.display = "none";
        document.getElementById("fiveDayForecast").style.display = "none";
    }
}

function toggle5Day() {
    const fiveDayDiv = document.getElementById("fiveDayForecast");
    const btn = document.getElementById("toggle5DayBtn");
    if (fiveDayDiv.style.display === "none") {
        fiveDayDiv.style.display = "block";
        btn.textContent = "Hide Next 5 Days Weather Condition";
    } else {
        fiveDayDiv.style.display = "none";
        btn.textContent = "Show Next 5 Days Weather Condition";
    }
}

function resetWeather() {
    document.getElementById("cityInput").value = "";
    document.getElementById("currentWeather").innerHTML = "";
    document.getElementById("forecast24h").innerHTML = "";
    document.getElementById("forecast5day").innerHTML = "";
    document.getElementById("fiveDayForecast").style.display = "none";
    const toggleBtn = document.getElementById("toggle5DayBtn");
    toggleBtn.style.display = "none";
    toggleBtn.textContent = "Show Next 5 Days Weather Condition";
}
