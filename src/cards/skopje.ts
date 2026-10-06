import { getPollution } from '../services/pollution';
import { getWeather } from '../services/weather';

export interface SkopjeConditions {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  sunrise: string;
  sunset: string;
  pm10: number | null;
  pm25: number | null;
  updatedAt: string;
}

export interface AirQuality {
  level: string;
  color: string;
}

// European Air Quality Index (EEA, 2024 revision): upper bound of each level in µg/m³.
// https://airindex.eea.europa.eu/AQI/index.html
const AIR_QUALITY_LEVELS = [
  { level: 'Good', color: '#50f0e6', pm10: 15, pm25: 5 },
  { level: 'Fair', color: '#50ccaa', pm10: 45, pm25: 15 },
  { level: 'Moderate', color: '#f0e641', pm10: 120, pm25: 50 },
  { level: 'Poor', color: '#ff5050', pm10: 195, pm25: 90 },
  { level: 'Very poor', color: '#960032', pm10: 270, pm25: 140 },
  { level: 'Extremely poor', color: '#7d2181', pm10: Infinity, pm25: Infinity },
];

// The index reports the worse of the available pollutants.
export function airQuality(pm10: number | null, pm25: number | null): AirQuality | null {
  const worst = Math.max(
    pm10 === null ? -1 : AIR_QUALITY_LEVELS.findIndex((band) => pm10 <= band.pm10),
    pm25 === null ? -1 : AIR_QUALITY_LEVELS.findIndex((band) => pm25 <= band.pm25),
  );
  if (worst < 0) {
    return null;
  }
  const { level, color } = AIR_QUALITY_LEVELS[worst];
  return { level, color };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// open-meteo reports local time as "2026-10-06T18:30"; the date shows when the card has gone stale.
export function formatUpdatedAt(time: string): string {
  const [date, clock] = time.split('T');
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}, ${clock}`;
}

// Weather is required; pollution is optional because pulse.eco sensors are often offline.
export async function fetchSkopjeConditions(): Promise<SkopjeConditions> {
  const [weather, pollution] = await Promise.all([
    getWeather(),
    getPollution().catch((error) => {
      console.warn(`::warning::Pollution data not available: ${error}`);
      return { pm10: null, pm25: null };
    }),
  ]);

  return {
    temperature: weather.current.temperature2m,
    feelsLike: weather.current.apparentTemperature,
    condition: weather.current.description,
    humidity: weather.current.relativeHumidity2m,
    sunrise: weather.daily.sunrise,
    sunset: weather.daily.sunset,
    pm10: pollution.pm10,
    pm25: pollution.pm25,
    updatedAt: formatUpdatedAt(weather.current.time),
  };
}
