import { render } from 'mustache';
import fetch from 'node-fetch';
import { readFile, writeFileSync } from 'fs';
import { getWeather } from './services/weather';

const MUSTACHE_MAIN_DIR = './main.mustache';
const DEFAULT_VALUE = '---';
const NOT_AVAILABLE = 'Not available';

interface Data {
  refreshTime: string;
  temperature: string;
  feelsLike: string;
  weatherDescription: string;
  humidity: string;
  sunRise: string;
  sunSet: string;
  pm10: string;
  pm25: string;
}

// Placeholders stay in place when the weather or pollution API is unavailable.
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
  temperature: DEFAULT_VALUE,
  feelsLike: DEFAULT_VALUE,
  weatherDescription: DEFAULT_VALUE,
  humidity: DEFAULT_VALUE,
  sunRise: DEFAULT_VALUE,
  sunSet: DEFAULT_VALUE,
  pm10: NOT_AVAILABLE,
  pm25: NOT_AVAILABLE,
};

export function formatRounded(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? DEFAULT_VALUE : Math.round(value).toString();
}

// pulse.eco sends readings as strings and uses "N/A" for missing sensors.
export function formatPollutant(value: unknown): string {
  const reading = String(value ?? '').trim();
  return reading && Number.isFinite(Number(reading)) ? `${reading} μg/m3` : NOT_AVAILABLE;
}

async function setWeatherInformation(): Promise<void> {
  try {
    const {
      current: {
        temperature2m: temp,
        apparentTemperature: feelsLike,
        description,
        relativeHumidity2m: humidity,
      },
      daily: { sunset, sunrise },
    } = await getWeather();

    DATA.temperature = formatRounded(temp);
    DATA.feelsLike = formatRounded(feelsLike);
    DATA.weatherDescription = description || DEFAULT_VALUE;
    DATA.humidity = formatRounded(humidity);
    DATA.sunRise = sunrise || DEFAULT_VALUE;
    DATA.sunSet = sunset || DEFAULT_VALUE;
  } catch (error) {
    console.warn(`::warning::Weather not available: ${error}`);
  }
}

async function setPollutionData(): Promise<void> {
  try {
    const response = await fetch(`https://skopje.pulse.eco/rest/overall`);
    const { values } = (await response.json()) as { values: Record<string, unknown> };

    DATA.pm10 = formatPollutant(values.pm10);
    DATA.pm25 = formatPollutant(values.pm25);
  } catch (error) {
    console.warn(`::warning::Pollution data not available: ${error}`);
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

if (require.main === module) {
  void action();
}
