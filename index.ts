import { render } from 'mustache';
import fetch from 'node-fetch';
import { readFile, writeFileSync } from 'fs';

const MUSTACHE_MAIN_DIR = './main.mustache';

interface Data {
    refreshTime: string;
    city_temperature?: string;
    feels_like_temp?: string;
    city_weather?: string;
    weather_icon?: string;
    humidity?: number;
    sun_rise?: string;
    sun_set?: string;
    pm10?: string;
    pm25?: string;
}

const DATA: Data = {
    refreshTime: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
        timeZone: 'Europe/Skopje'
    })
};

async function setWeatherInformation(): Promise<void> {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Skopje&units=metric&appid=bd5e378503939ddaee76f12ad7a97608`
    );
    const weatherData = await response.json();

    const weatherMain = weatherData.main;
    const weatherElement = weatherData.weather[0];
    const weatherSys = weatherData.sys;

    const temp = weatherMain?.temp;
    const feelsLike = weatherMain?.feels_like;
    const description = weatherElement?.description;
    const humidity = weatherMain?.humidity;
    const sunrise = weatherSys?.sunrise;
    const sunset = weatherSys?.sunset;

    const defaultValue = '---';

    DATA.city_temperature = !temp ? defaultValue : Math.round(temp).toString();
    DATA.feels_like_temp = !feelsLike ? defaultValue : Math.round(feelsLike).toString();
    DATA.city_weather = description || defaultValue;
    DATA.weather_icon = `https://openweathermap.org/img/w/${weatherElement.icon}.png`;
    DATA.humidity = humidity || defaultValue;
    DATA.sun_rise = sunrise ? new Date(sunrise * 1000).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Skopje',
    }) : defaultValue;
    DATA.sun_set = sunset ? new Date(sunset * 1000).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Skopje',
    }) : defaultValue;
}

async function setPollutionData(): Promise<void> {
    try {
        const response = await fetch(
            `https://skopje.pulse.eco/rest/overall`
        );
        const data = (await response.json()).values;

        DATA.pm10 = data.pm10 + " μg/m3";
        DATA.pm25 = data.pm25 + " μg/m3";
    } catch(_) {
        DATA.pm10 = 'Not available';
        DATA.pm25 = 'Not available';
    }

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
    await setPollutionData();
    generateReadMe();
}

void action();
