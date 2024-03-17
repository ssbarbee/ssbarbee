import { render } from 'mustache';
import fetch from 'node-fetch';
import { readFile, writeFileSync } from 'fs';
import { getWeather } from './services/weather';

const MUSTACHE_MAIN_DIR = './main.mustache';

interface Data {
  refreshTime: string;
  temperature?: string;
  feelsLike?: string;
  weatherDescription?: string;
  humidity?: string;
  sunRise?: string;
  sunSet?: string;
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
    timeZone: 'Europe/Skopje',
  }),
};

async function setWeatherInformation(): Promise<void> {
  const {
    current: {
      temperature2m: temp,
      apparentTemperature: feelsLike,
      description,
      relativeHumidity2m: humidity,
    },
    daily: { sunset, sunrise },
  } = await getWeather();

  const defaultValue = '---';
  DATA.temperature = !temp ? defaultValue : Math.round(temp).toString();
  DATA.feelsLike = !feelsLike ? defaultValue : Math.round(feelsLike).toString();
  DATA.weatherDescription = description || defaultValue;
  DATA.humidity = humidity.toString() || defaultValue;
  DATA.sunRise = sunrise ? sunrise : defaultValue;
  DATA.sunSet = sunset ? sunset : defaultValue;
}

async function setPollutionData(): Promise<void> {
  try {
    const response = await fetch(`https://skopje.pulse.eco/rest/overall`);
    const data = (await response.json()).values;

    DATA.pm10 = data.pm10 + ' μg/m3';
    DATA.pm25 = data.pm25 + ' μg/m3';
  } catch (_) {
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
