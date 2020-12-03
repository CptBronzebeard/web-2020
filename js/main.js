let favCities = [];
const defCity = 471101;
let posHere;

const pictureUrl = 'http://openweathermap.org/img/wn/'
const apiKey = '3d57646fde7625f581c36b64bd01dcfe';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric&lang=ru&';

window.onload = function() {
    btnAdd = document.querySelector('#add_city button').addEventListener('click', addCity);
    btnRefresh = document.getElementById('refresh').addEventListener('click', loadHere);
}

function loadHere() {
  //placeholder
  return
}

async function getUrl(url){
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function getWeatherByName(cityName){
    url = apiUrl + 'q=' + encodeURI(cityName) + '&appid=' + apiKey;
    return getUrl(url);
}

function cityInfoEntries(weather) {
    let entries = []
    attrs = [
        {name: 'Ветер', value: weather.wind.speed + ' м/с, ' + getDirectionByDegrees(weather.wind.deg)},
        {name: 'Облачность', value: weather.clouds.all + '%'},
        {name: 'Давление', value: weather.main.pressure + ' гПа'},
        {name: 'Влажность', value: weather.main.humidity + '%'},
        {name: 'Координаты', value: '[' + weather.coord.lon + ', ' + weather.coord.lat + ']'}];
    for (let attr of attrs) {
        let infoEntry = document.getElementById('weather_info_entry').content.cloneNode(true);
        infoEntry.querySelector('span.weather_list_name').innerHTML = attr.name;
        infoEntry.querySelector('span.weather_list_content').innerHTML = attr.value;
        entries.push(infoEntry);
    }
    return entries;
}

function getDirectionByDegrees(degrees) {
  //placeholder
  return
}

function createCityCardFavorite(weather) {
    let card = document.getElementById('fav_city_card').content.cloneNode(true);
    card.querySelector('li').setAttribute('city_id', weather.id);
    card.querySelector('h3').innerHTML = weather.name;
    card.querySelector('span.temperature').innerHTML = weather.main.temp + '°C';
    card.querySelector('.fav_weather_icon').setAttribute('src', pictureUrl + weather.weather[0].icon + '@4x.png');
    card.querySelector('button').addEventListener('click', removeCity);
    for (item of cityInfoEntries(weather)) {
        card.querySelector('.weather_list').append(item);
    }
    return card;
}

function removeCity(event) {
  //placeholder
  return
}

async function addCity() {
    let input = document.querySelector('#add_city input')
    let cityName = input.value
    if (cityName == ''){
        return;
    }
    input.value = '';
    let loader = document.getElementById('loader_fav').content.cloneNode(true);
    document.querySelector('#favorites ul').append(loader);
    try {
        weather = await getWeatherByName(cityName);
    }
    catch (err) {
        document.querySelector('#favorites ul').removeChild(document.querySelector('#favorites ul li.loader'));
        alert('Ошибка при загрузке информации');
        throw err;
        return;
    }
    if (favCities.includes(weather.id)) {
        document.querySelector('#favorites ul').removeChild(document.querySelector('#favorites ul li.loader'));
        alert('Такой город уже есть в списке');
        return;
    }
    favCities.push(weather.id);
    localStorage.setItem('favList', JSON.stringify(favCities));
    document.querySelector('#favorites ul').replaceChild(createCityCardFavorite(weather), document.querySelector('#favorites ul li.loader'));
}
