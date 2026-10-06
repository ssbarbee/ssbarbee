import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReading } from './pollution';

test('parses pulse.eco readings sent as strings or numbers', () => {
  assert.equal(parseReading('12'), 12);
  assert.equal(parseReading('12.5'), 12.5);
  assert.equal(parseReading(7), 7);
  assert.equal(parseReading('0'), 0);
});

test('treats missing or malformed readings as absent', () => {
  assert.equal(parseReading('N/A'), null);
  assert.equal(parseReading(undefined), null);
  assert.equal(parseReading(null), null);
  assert.equal(parseReading(''), null);
  assert.equal(parseReading('12abc'), null);
});
