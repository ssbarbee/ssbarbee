const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const MUSTACHE_MAIN_DIR = './main.mustache';

/**
  * DATA is the object that contains
  * the data to be provided to Mustache
  * (the refresh time).
*/
let DATA = {
  refreshTime: new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'Europe/Skopje',
  }),
};

async function setWeatherInformation() {
    await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Skopje&units=metric&appid=bd5e378503939ddaee76f12ad7a97608`
    )
      .then(r => r.json())
      .then(r => {
        DATA.city_temperature = Math.round(r.main.temp);
        DATA.feels_like_temp = Math.round(r.main.feels_like);
        DATA.city_weather = r.weather[0].description;
        DATA.weather_icon = 'http://openweathermap.org/img/w/' + r.weather[0].icon + '.png';
        DATA.humidity = r.main.humidity;
        DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Skopje',
        });
        DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Skopje',
        });
    });
}

/**
  * A - We open 'main.mustache'
  * B - We ask Mustache to render our file with the data
  * C - We create a README.md file with the generated output
  */
function generateReadMe() {
  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) =>  {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
    /**
     * Fetch weather
     */
    await setWeatherInformation();
    
    /**
     * Generate README
     */
    generateReadMe();
}action();