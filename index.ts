import { render } from 'mustache';
import fetch from 'node-fetch';
import { readFile, writeFileSync } from 'fs';

const MUSTACHE_MAIN_DIR = './main.mustache';

interface Data {
    refreshTime: string;
    city_temperature?: number;
    feels_like_temp?: number;
    city_weather?: string;
    weather_icon?: string;
    humidity?: number;
    sun_rise?: string;
    sun_set?: string;
}

let DATA: Data = {
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

async function setWeatherInformation(): Promise<void> {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Skopje&units=metric&appid=bd5e378503939ddaee76f12ad7a97608`
    );
    const weatherData = await response.json();

    DATA.city_temperature = Math.round(weatherData.main.temp);
    DATA.feels_like_temp = Math.round(weatherData.main.feels_like);
    DATA.city_weather = weatherData.weather[0].description;
    DATA.weather_icon = `https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`;
    DATA.humidity = weatherData.main.humidity;
    DATA.sun_rise = new Date(weatherData.sys.sunrise * 1000).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Skopje',
    });
    DATA.sun_set = new Date(weatherData.sys.sunset * 1000).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Skopje',
    });
}

function generateReadMe(): void {
    readFile(MUSTACHE_MAIN_DIR, (err, data) => {
        if (err) throw err;
        const output = render(data.toString(), DATA);
        writeFileSync('README.md', output);
    });
}

async function action(): Promise<void> {
    await setWeatherInformation();
    generateReadMe();
}

void action();
