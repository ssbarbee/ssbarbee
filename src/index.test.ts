import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPollutant, formatRounded } from './index';

test('shows a temperature of exactly 0°C instead of the placeholder', () => {
  assert.equal(formatRounded(0), '0');
});

test('rounds weather readings', () => {
  assert.equal(formatRounded(21.6), '22');
  assert.equal(formatRounded(-0.4), '0');
  assert.equal(formatRounded(-3.7), '-4');
});

test('uses the placeholder for missing weather readings', () => {
  assert.equal(formatRounded(undefined), '---');
  assert.equal(formatRounded(null), '---');
  assert.equal(formatRounded(NaN), '---');
});

test('formats pulse.eco pollutant readings', () => {
  assert.equal(formatPollutant('12'), '12 μg/m3');
  assert.equal(formatPollutant('12.0'), '12.0 μg/m3');
  assert.equal(formatPollutant(7), '7 μg/m3');
});

test('reports missing pollutant readings as not available', () => {
  assert.equal(formatPollutant('N/A'), 'Not available');
  assert.equal(formatPollutant(undefined), 'Not available');
  assert.equal(formatPollutant(null), 'Not available');
  assert.equal(formatPollutant(''), 'Not available');
  assert.equal(formatPollutant('12abc'), 'Not available');
});
