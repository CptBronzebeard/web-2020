let favCities = [];
const defCity = 'Vsevolozhsk';
let posHere;

const pictureUrl = 'http://openweathermap.org/img/wn/'
const apiKey = '3d57646fde7625f581c36b64bd01dcfe';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&';

window.onload = function() {
  loadAll();
  btnAdd = document.querySelector('#add_city').addEventListener('submit', addCity);
  btnRefresh = document.getElementById('refresh').addEventListener('click', loadAll);
}

function loadAll() {
  document.querySelector('#favorites ul').innerHTML = "";
  loadFavs();
  loadHere();
  return;
}

async function getUrl(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

function getWeatherByName(cityName) {
  url = apiUrl + 'q=' + encodeURI(cityName) + '&appid=' + apiKey;
  return getUrl(url);
}

function getWeatherByCoords(lat, lon) {
  requestURL = apiUrl + 'lat=' + encodeURI(lat) + '&lon=' + encodeURI(lon) + '&appid=' + apiKey;
  return getUrl(requestURL);
}

function cityInfoEntries(weather) {
  let entries = []
  attrs = [{
      name: 'Ветер',
      value: weather.wind.speed + ' м/с, ' + getDirectionByDegrees(weather.wind.deg)
    },
    {
      name: 'Облачность',
      value: weather.clouds.all + '%'
    },
    {
      name: 'Давление',
      value: weather.main.pressure + ' гПа'
    },
    {
      name: 'Влажность',
      value: weather.main.humidity + '%'
    },
    {
      name: 'Координаты',
      value: '[' + weather.coord.lon + ', ' + weather.coord.lat + ']'
    }
  ];
  for (let attr of attrs) {
    let infoEntry = document.getElementById('weather_info_entry').content.cloneNode(true);
    infoEntry.querySelector('span.weather_list_name').innerHTML = attr.name;
    infoEntry.querySelector('span.weather_list_content').innerHTML = attr.value;
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
  let card = document.getElementById('here').content.cloneNode(true);
  card.querySelector('#general_info h2').innerHTML = weather.name;
  card.getElementById('here_icon').setAttribute('src', pictureUrl + weather.weather[0].icon + '@4x.png');
  card.getElementById("temperature_here").insertAdjacentHTML('afterbegin', weather.main.temp);
  for (item of cityInfoEntries(weather)) {
    card.querySelector('.weather_list').append(item);
  }
  return card;
}

function createCityCardFavorite(weather) {
  let card = document.getElementById('fav_city_card').content.cloneNode(true);
  card.querySelector('h3').innerHTML = weather.name;
  card.querySelector('span.temperature').innerHTML = weather.main.temp + '°C';
  card.querySelector('.fav_weather_icon').setAttribute('src', pictureUrl + weather.weather[0].icon + '.png');
  card.querySelector('button').addEventListener('click', removeCity);
  for (item of cityInfoEntries(weather)) {
    card.querySelector('.weather_list').append(item);
  }
  return card;
}

async function loadHereByCoords(position) {
  try {
    weather = await getWeatherByCoords(position.coords.latitude, position.coords.longitude);
  } catch (err) {
    document.getElementById('weather_here').removeChild(document.querySelector('#weather_here .loader'));
    alert('Возникла ошибка при загрузке информации. Пожалуйста, попробуйте снова.');
    return loadHereDef();
  }
  document.getElementById('weather_here').replaceChild(createCityCardHere(weather), document.querySelector('#weather_here .loader'));
}


async function loadHereDef() {
  let error = document.getElementById('error_here').content.cloneNode(true);
  try {
    weather = await getWeatherByName(defCity);
  } catch (err) {
    document.getElementById('weather_here').replaceChild(error, document.querySelector('#weather_here .loader'));
    alert('Возникла ошибка при загрузке информации. Пожалуйста, попробуйте снова.');
    throw err;
  }
  document.getElementById('weather_here').replaceChild(createCityCardHere(weather), document.querySelector('#weather_here .loader'));
}

async function loadHere() {
  let divHere = document.getElementById('weather_here');
  let loader = document.getElementById('loader_here').content.cloneNode(true);
  divHere.innerHTML = "";
  divHere.append(loader);
  if (!navigator.geolocation) {
    loadHereDef();
  } else {
    navigator.geolocation.getCurrentPosition(loadHereByCoords, loadHereDef);
  }
}

function removeCity(event) {
  let card = event.target.parentNode.parentNode;
  let cityName = card.querySelector('h3').innerHTML;
  let index = favCities.indexOf(cityName);
  favCities.splice(index, 1);
  card.remove();
  localStorage.setItem('favList', JSON.stringify(favCities));
}

async function loadFavs() {
  let error = document.getElementById('error_here').content.cloneNode(true);
  if (localStorage.getItem('favList') == null) {
    return;
  }
  favCities = JSON.parse(localStorage.getItem('favList'));
  for (let i = 0; i < favCities.length; i++) {
    let loader = document.getElementById('loader_fav').content.cloneNode(true);
    document.querySelector('#favorites ul').append(loader);
  }
  for (let cityName of favCities) {
    try {
      weather = await getWeatherByName(cityName);
    } catch (err) {
      document.querySelector('#favorites ul').replaceChild(error, document.querySelector('#favorites ul li.loader'));
      alert('Ошибка при загрузке информации');
      throw err;
    }
    document.querySelector('#favorites ul').replaceChild(createCityCardFavorite(weather), document.querySelector('#favorites ul li.loader'));
  }
}

async function addCity(event) {
  event.preventDefault();
  let input = event.target.children[0];
  let cityName = input.value;
  if (cityName == '') {
    return;
  }
  input.value = '';
  let loader = document.getElementById('loader_fav').content.cloneNode(true);
  let error = document.getElementById('error_fav').content.cloneNode(true);
  document.querySelector('#favorites ul').append(loader);
  try {
    weather = await getWeatherByName(cityName);
  } catch (err) {
    document.querySelector('#favorites ul').removeChild(document.querySelector('#favorites ul li.loader'));
    alert('Ошибка при загрузке информации');
    throw err;
    return;
  }
  if (weather.cod >= 300) {
    document.querySelector('#favorites ul').replaceChild(error, document.querySelector('#favorites ul li.loader'));
    alert('Ошибка при загрузке информации');
    document.querySelector('#favorites ul').removeChild(document.querySelector('#favorites ul li.error'));
    throw err;
    return;
  }
  if (favCities.includes(weather.name)) {
    document.querySelector('#favorites ul').removeChild(document.querySelector('#favorites ul li.loader'));
    alert('Такой город уже есть в списке');
    return;
  }
  favCities.push(weather.name);
  localStorage.setItem('favList', JSON.stringify(favCities));
  document.querySelector('#favorites ul').replaceChild(createCityCardFavorite(weather), document.querySelector('#favorites ul li.loader'));
}
