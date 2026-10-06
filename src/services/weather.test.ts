import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeWeatherCode } from './weather';

test('describes WMO weather codes with short labels', () => {
  assert.equal(describeWeatherCode(0), 'Clear sky');
  assert.equal(describeWeatherCode(2), 'Partly cloudy');
  assert.equal(describeWeatherCode(3), 'Overcast');
  assert.equal(describeWeatherCode(63), 'Rain');
  assert.equal(describeWeatherCode(96), 'Thunderstorm with hail');
  assert.equal(describeWeatherCode(42), 'Unknown');
});
