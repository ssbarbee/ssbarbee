import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from './config';
import { drawBanner, runCardJobs } from './index';

test('writes every theme of a card and keeps the previous files of a failed card', async () => {
  const written: string[] = [];

  const failures = await runCardJobs(
    [
      { file: 'ok.svg', render: async () => (theme) => `<svg fill="${theme.background}"/>` },
      {
        file: 'broken.svg',
        render: async () => {
          throw new Error('Resource not accessible by integration');
        },
      },
      { file: 'later.svg', render: async () => () => '<svg/>' },
    ],
    THEMES,
    (path, svg) => written.push(`${path} ${svg}`),
  );

  assert.deepEqual(written, [
    `light/ok.svg <svg fill="${THEMES.light.background}"/>`,
    `dark/ok.svg <svg fill="${THEMES.dark.background}"/>`,
    'light/later.svg <svg/>',
    'dark/later.svg <svg/>',
  ]);
  assert.deepEqual(failures, ['broken.svg']);
});

test('writes nothing for a card whose drawing fails in any theme', async () => {
  const written: string[] = [];

  const failures = await runCardJobs(
    [
      {
        file: 'half.svg',
        render: async () => (theme) => {
          if (theme === THEMES.dark) {
            throw new Error('boom');
          }
          return '<svg/>';
        },
      },
    ],
    THEMES,
    (path) => written.push(path),
  );

  assert.deepEqual(written, []);
  assert.deepEqual(failures, ['half.svg']);
});

test('keeps the previous files of an optional card without failing the run', async () => {
  const written: string[] = [];

  const failures = await runCardJobs(
    [
      {
        file: 'weather.svg',
        optional: true,
        render: async () => {
          throw new Error('open-meteo responded with 503');
        },
      },
    ],
    THEMES,
    (path) => written.push(path),
  );

  assert.deepEqual(written, []);
  assert.deepEqual(failures, []);
});

test('falls back to the classic banner when the weather is unavailable', () => {
  const weeks = [[{ date: '2026-10-04', level: 'FIRST_QUARTILE' as const, count: 3 }]];
  const conditions = {
    temperature: 14,
    feelsLike: 11,
    condition: 'Partly cloudy',
    weatherCode: 2,
    isDay: true,
    humidity: 35,
    sunrise: '06:36',
    sunset: '18:07',
    pm10: 18,
    pm25: 10,
    updatedAt: '7 Oct, 12:30',
    localTime: '12:30',
  };

  assert.ok(drawBanner({ weeks, conditions }, THEMES.dark).includes('url(#sky)'));
  assert.ok(!drawBanner({ weeks, conditions: null }, THEMES.dark).includes('url(#sky)'));
  assert.ok(drawBanner({ weeks, conditions: null }, THEMES.dark).includes('class="day"'));
});
