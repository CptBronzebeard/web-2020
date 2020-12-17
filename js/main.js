let posHere;

const pictureUrl = "https://openweathermap.org/img/wn/"
const serverUrl = "https://bronzebeard-web2020.azurewebsites.net"

window.onload = function() {
  loadAll();
  btnAdd = document.querySelector("#add_city").addEventListener("submit", addCity);
  btnRefresh = document.getElementById("refresh").addEventListener("click", loadAll);
}

function loadAll() {
  document.querySelector("#favorites ul").innerHTML = "";
  loadFavs();
  loadHere();
  return;
}

async function queryUrl(url, method = "GET") {
  try {
    const response = await fetch(url, {
      method: method,
      credentials: "include",
      secure: true
    });
    let data = await response.json();
    return data;
  } catch (e) {
    return {
      success: false,
      message: e
    }
  }
}

function getWeatherByName(cityName) {
  requestURL = serverUrl + "/weather/city?q=" + encodeURI(cityName);
  return queryUrl(requestURL);
}

function getWeatherByCoords(lat, lon) {
  requestURL = serverUrl + "/weather/coords?" + "lat=" + encodeURI(lat) + "&lon=" + encodeURI(lon);
  return queryUrl(requestURL);
}

function getWeatherDefault() {
  requestURL = serverUrl + "/weather/default"
  return queryUrl(requestURL)
}

function getFavs() {
  requestURL = serverUrl + "/favorites";
  return queryUrl(requestURL);
}

function addFavCity(cityName) {
  requestURL = serverUrl + "/favorites/" + encodeURI(cityName);
  return queryUrl(requestURL, "POST");
}

function removeFavCity(cityName) {
  requestURL = serverUrl + "/favorites/" + encodeURI(cityName);
  return queryUrl(requestURL, "DELETE");
}

function cityInfoEntries(weather) {
  let entries = []
  attrs = [{
      name: "Ветер",
      value: weather.wind.speed + " м/с, " + getDirectionByDegrees(weather.wind.deg)
    },
    {
      name: "Облачность",
      value: weather.clouds.all + "%"
    },
    {
      name: "Давление",
      value: weather.main.pressure + " гПа"
    },
    {
      name: "Влажность",
      value: weather.main.humidity + "%"
    },
    {
      name: "Координаты",
      value: "[" + weather.coord.lon + ", " + weather.coord.lat + "]"
    }
  ];
  for (let attr of attrs) {
    let infoEntry = document.getElementById("weather_info_entry").content.cloneNode(true);
    infoEntry.querySelector("span.weather_list_name").innerHTML = attr.name;
    infoEntry.querySelector("span.weather_list_content").innerHTML = attr.value;
    entries.push(infoEntry);
  }
  return entries;
}

function getDirectionByDegrees(degrees) {
  const dirRange = 22.5;
  const fullCircle = 360;
  const dirs = [
    "северный", "северо-северо-восточный", "северо-восточный", "восточно-северо-восточный",
    "восточный", "восточно-юго-восточный", "юго-восточный", "юго-юго-восточный",
    "южный", "юго-юго-западный", "юго-западный", "западно-юго-западный",
    "западный", "западно-северо-западный", "северо-западный", "северо-северо-западный"
  ];
  if (degrees < 0 || degrees > 360) {
    return null;
  }
  return dirs[Math.round(degrees / dirRange)];
}

function createCityCardHere(weather) {
  let card = document.getElementById("here").content.cloneNode(true);
  card.querySelector("#general_info h2").innerHTML = weather.name;
  card.getElementById("here_icon").setAttribute("src", pictureUrl + weather.weather[0].icon + "@4x.png");
  card.getElementById("temperature_here").insertAdjacentHTML("afterbegin", weather.main.temp);
  for (item of cityInfoEntries(weather)) {
    card.querySelector(".weather_list").append(item);
  }
  return card;
}

function createCityCardFavorite(weather) {
  let card = document.getElementById("fav_city_card").content.cloneNode(true);
  card.querySelector("h3").innerHTML = weather.name;
  card.querySelector("span.temperature").innerHTML = weather.main.temp + "°C";
  card.querySelector(".fav_weather_icon").setAttribute("src", pictureUrl + weather.weather[0].icon + ".png");
  card.querySelector("button").addEventListener("click", removeCity);
  for (item of cityInfoEntries(weather)) {
    card.querySelector(".weather_list").append(item);
  }
  return card;
}

async function loadHereByCoords(position) {
  weather = await getWeatherByCoords(position);
  if (!weather.success) {
    alert("Возникла ошибка при загрузке информации. Пожалуйста, попробуйте снова.");
    return loadHereDef();
  }
  document.getElementById("weather_here").replaceChild(createCityCardHere(weather.weather), document.querySelector("#weather_here .loader"));
}


async function loadHereDef() {
  weather = await getWeatherDefault();
  if (!weather.success) {
    document.getElementById("weather_here").removeChild(document.querySelector("#weather_here .loader"));
    alert("Возникла ошибка при загрузке информации. Пожалуйста, попробуйте снова.");
    throw "Error loading def city";
  }
  document.getElementById("weather_here").replaceChild(createCityCardHere(weather.weather), document.querySelector("#weather_here .loader"));
}

async function loadHere() {
  let divHere = document.getElementById("weather_here");
  let loader = document.getElementById("loader_here").content.cloneNode(true);
  divHere.innerHTML = "";
  divHere.append(loader);
  if (!navigator.geolocation) {
    loadHereDef();
  } else {
    navigator.geolocation.getCurrentPosition(loadHereByCoords, loadHereDef);
  }
}

async function removeCity(event) {
  let card = event.target.parentNode.parentNode;
  let cityName = card.querySelector("h3").innerHTML;
  let resp = await removeFavCity(cityName);
  if (!resp.success) {
    alert("Ошибка при удалении города");
    throw "Error removing city";
  }
  card.remove()
}

async function loadFavs() {
  resp = await getFavs()
  if (!resp.success) {
    alert("Ошибка при получении списка избранных городов.");
    throw resp.message;
  }
  let favCities = resp.cities;
  for (let i = 0; i < favCities.length; i++) {
    let loader = document.getElementById("loader_fav").content.cloneNode(true);
    document.querySelector("#favorites ul").append(loader);
  }
  for (let cityName of favCities) {
    weather = await getWeatherByName(cityName);
    if (!weather.success) {
      document.querySelector("#favorites ul").removeChild(document.querySelector("#favorites ul li.loader"));
      alert("Ошибка при загрузке информации");
      throw err;
    }
    document.querySelector("#favorites ul").replaceChild(createCityCardFavorite(weather.weather), document.querySelector("#favorites ul li.loader"));
  }
}

async function addCity(event) {
  event.preventDefault();
  let input = event.target.children[0];
  let cityName = input.value;
  if (cityName == "") {
    return;
  }
  input.value = "";
  let loader = document.getElementById("loader_fav").content.cloneNode(true);
  let error = document.getElementById("error_fav").content.cloneNode(true);
  document.querySelector("#favorites ul").append(loader);
  let resp = await addFavCity(cityName);
  if (!resp.success) {
    document.querySelector("#favorites ul").removeChild(document.querySelector("#favorites ul li.loader"));
    alert("Ошибка при загрузке информации");
    return
  }
  if (resp.duplicate) {
    document.querySelector("#favorites ul").removeChild(document.querySelector("#favorites ul li.loader"));
    alert("Такой город уже есть в списке");
    return
  }
  let weather = resp.weather
  document.querySelector("#favorites ul").replaceChild(createCityCardFavorite(weather), document.querySelector("#favorites ul li.loader"));
}
