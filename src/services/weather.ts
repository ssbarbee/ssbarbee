function mapWeatherCodeToDescription(code: number): string {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
    case 2:
    case 3:
      return 'Mainly clear, partly cloudy, and overcast';
    case 45:
    case 48:
      return 'Fog and depositing rime fog';
    case 51:
    case 53:
    case 55:
      return 'Drizzle: Light, moderate, and dense intensity';
    case 56:
    case 57:
      return 'Freezing Drizzle: Light and dense intensity';
    case 61:
    case 63:
    case 65:
      return 'Rain: Slight, moderate and heavy intensity';
    case 66:
    case 67:
      return 'Freezing Rain: Light and heavy intensity';
    case 71:
    case 73:
    case 75:
      return 'Snow fall: Slight, moderate, and heavy intensity';
    case 77:
      return 'Snow grains';
    case 80:
    case 81:
    case 82:
      return 'Rain showers: Slight, moderate, and violent';
    case 85:
    case 86:
      return 'Snow showers slight and heavy';
    case 95:
      return 'Thunderstorm: Slight or moderate';
    case 96:
    case 99:
      return 'Thunderstorm with slight and heavy hail';
    default:
      return 'Unknown weather condition';
  }
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
  const response = await fetch(url);
  const data = await response.json();
  const { current, daily } = data;

  const weatherData = {
    current: {
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
      description: mapWeatherCodeToDescription(current.weather_code),
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
