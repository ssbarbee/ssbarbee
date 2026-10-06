// Short labels for WMO weather interpretation codes, as returned by open-meteo.
const WEATHER_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Rain showers',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

export function describeWeatherCode(code: number): string {
  return WEATHER_LABELS[code] ?? 'Unknown';
}

export const getWeather = async () => {
  const baseApiUrl = 'https://api.open-meteo.com/v1/forecast';
  const latitude = '42';
  const longitude = '21.42';
  const hourlyParams =
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m';
  const dailyParams = 'sunrise,sunset';
  const timezone = 'Europe/Skopje';

  const url = `${baseApiUrl}?latitude=${latitude}&longitude=${longitude}&current=${hourlyParams}&daily=${dailyParams}&timezone=${timezone}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    throw new Error(`open-meteo responded with ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const { current, daily } = data;

  const weatherData = {
    current: {
      time: current.time as string,
      temperature2m: current.temperature_2m,
      relativeHumidity2m: current.relative_humidity_2m,
      apparentTemperature: current.apparent_temperature,
      isDay: current.is_day === 1,
      precipitation: current.precipitation,
      rain: current.rain,
      showers: current.showers,
      snowfall: current.snowfall,
      weatherCode: current.weather_code,
      surfacePressure: current.surface_pressure,
      windSpeed10m: current.wind_speed_10m,
      windDirection10m: current.wind_direction_10m,
      description: describeWeatherCode(current.weather_code),
    },
    daily: {
      sunrise: daily.sunrise[0].split('T')[1],
      sunset: daily.sunset[0].split('T')[1],
    },
  };

  return weatherData;
};
if (process.env.TEST_WEATHER) {
  (async () => {
    if (process.env.TEST_WEATHER) {
      console.log(await getWeather());
    }
  })();
}
