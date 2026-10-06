import { test } from 'node:test';
import assert from 'node:assert/strict';
import { airQuality, formatUpdatedAt } from './skopje';

test('rates air quality with the European Air Quality Index bands', () => {
  assert.equal(airQuality(10, 4)?.level, 'Good');
  assert.equal(airQuality(15, 5)?.level, 'Good');
  assert.equal(airQuality(15.5, 5)?.level, 'Fair');
  assert.equal(airQuality(50, 20)?.level, 'Moderate');
  assert.equal(airQuality(150, 60)?.level, 'Poor');
  assert.equal(airQuality(200, 100)?.level, 'Very poor');
  assert.equal(airQuality(300, 0)?.level, 'Extremely poor');
});

test('reports the worse of the two pollutants', () => {
  assert.equal(airQuality(13, 7)?.level, 'Fair');
  assert.equal(airQuality(130, 3)?.level, 'Poor');
});

test('rates air quality from whichever pollutant is available', () => {
  assert.equal(airQuality(null, 7)?.level, 'Fair');
  assert.equal(airQuality(10, null)?.level, 'Good');
  assert.equal(airQuality(null, null), null);
});

test('stamps readings with the day and time they were taken', () => {
  assert.equal(formatUpdatedAt('2026-10-06T18:30'), '6 Oct, 18:30');
  assert.equal(formatUpdatedAt('2026-01-31T07:05'), '31 Jan, 07:05');
});
