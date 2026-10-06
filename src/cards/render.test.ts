import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml, formatNumber, wrapText } from './svg/common';
import { renderStatsCard } from './svg/stats';
import { renderTopLanguagesCard } from './svg/top-langs';
import { renderPinCard } from './svg/pin';
import type { Repo, UserStats } from './github';

const stats: UserStats = {
  login: 'ssbarbee',
  name: null,
  stars: 23,
  commits: 988,
  prs: 297,
  issues: 8,
  reviews: 0,
  contributedTo: 18,
  followers: 7,
};

const repo: Repo = {
  name: 'iap-apple',
  description: '📦 Integration of [Apple](https://apple.com) receipts & more',
  stars: 7,
  forks: 2,
  language: { name: 'TypeScript', color: '#3178c6' },
};

test('escapes XML special characters', () => {
  assert.equal(
    escapeXml(`<a href="x">Tom & Jerry's</a>`),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
  );
});

test('formats large numbers compactly', () => {
  assert.equal(formatNumber(988), '988');
  assert.equal(formatNumber(1000), '1k');
  assert.equal(formatNumber(1234), '1.2k');
  assert.equal(formatNumber(15890), '15.9k');
  assert.equal(formatNumber(999950), '1M');
  assert.equal(formatNumber(2500000), '2.5M');
});

test('wraps text into lines', () => {
  assert.deepEqual(wrapText('one two three four', 9, 3), ['one two', 'three', 'four']);
});

test('ellipsizes text that does not fit in the allowed lines', () => {
  assert.deepEqual(wrapText('one two three four five', 9, 2), ['one two', 'three…']);
  assert.deepEqual(wrapText('one two abcdefghi four', 9, 2), ['one two', 'abcdefgh…']);
});

test('splits words longer than a line', () => {
  assert.deepEqual(wrapText('abcdefghijkl', 5, 3), ['abcde', 'fghij', 'kl']);
});

test('renders the stats card with every metric and the rank', () => {
  const svg = renderStatsCard(stats);

  assert.match(svg, /^<svg [^>]*width="467" height="195"/);
  assert.ok(svg.includes('ssbarbee&#39;s GitHub Stats'));
  for (const value of ['23', '988', '297', '8', '18', 'B+']) {
    assert.ok(svg.includes(`>${value}</text>`), `missing ${value}`);
  }
});

test('prefers the display name in the stats card title', () => {
  assert.ok(renderStatsCard({ ...stats, name: 'Filip' }).includes('Filip&#39;s GitHub Stats'));
});

test('renders top languages as percentages of the shown languages', () => {
  const svg = renderTopLanguagesCard(
    [
      { name: 'TypeScript', color: '#3178c6', size: 300 },
      { name: 'Makefile', color: null, size: 100 },
    ],
    8,
  );

  assert.match(svg, /^<svg [^>]*width="300" height="115"/);
  assert.ok(svg.includes('>TypeScript 75.00%</text>'));
  assert.ok(svg.includes('>Makefile 25.00%</text>'));
  assert.ok(svg.includes('fill="#858585"'), 'languages without a colour fall back to grey');
});

test('limits the languages card to the requested count', () => {
  const languages = ['A', 'B', 'C', 'D'].map((name, i) => ({
    name,
    color: '#000000',
    size: 10 - i,
  }));
  const svg = renderTopLanguagesCard(languages, 3);

  assert.ok(svg.includes('>C '));
  assert.ok(!svg.includes('>D '));
});

test('renders a pin card with name, description, language, stars and forks', () => {
  const svg = renderPinCard(repo);

  assert.match(svg, /^<svg [^>]*width="400" height="150"/);
  assert.ok(svg.includes('>iap-apple</text>'));
  assert.ok(svg.includes('📦 Integration of Apple receipts &amp; more'));
  assert.ok(!svg.includes('](https'), 'markdown links are reduced to their text');
  assert.ok(svg.includes('>TypeScript</text>'));
  assert.ok(svg.includes('>7</text>'));
  assert.ok(svg.includes('>2</text>'));
});

test('renders a pin card without description or language', () => {
  const svg = renderPinCard({ ...repo, description: null, language: null });

  assert.ok(svg.includes('No description provided'));
  assert.ok(!svg.includes('<circle'));
});

test('limits long pin descriptions to three lines', () => {
  const svg = renderPinCard({ ...repo, description: 'word '.repeat(100) });
  const lines = svg.match(/<tspan /g) ?? [];

  assert.equal(lines.length, 3);
  assert.ok(svg.includes('…</tspan>'));
});
