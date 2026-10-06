import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from './config';
import type { ContributionDay, Repo, UserStats } from './github';
import type { SkopjeConditions } from './skopje';
import { renderBanner } from './svg/banner';
import { escapeXml, formatNumber, wrapText } from './svg/common';
import { renderPinCard } from './svg/pin';
import { renderSkopjeCard } from './svg/skopje';
import { renderStatsCard } from './svg/stats';
import { renderTopLanguagesCard } from './svg/top-langs';

const { light, dark } = THEMES;

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

const conditions: SkopjeConditions = {
  temperature: 21.4,
  feelsLike: 19.6,
  condition: 'Partly cloudy',
  humidity: 25,
  sunrise: '06:36',
  sunset: '18:07',
  pm10: 13,
  pm25: 7,
  updatedAt: '6 Oct, 18:30',
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

test('paints cards with the colours of the requested theme', () => {
  const lightSvg = renderStatsCard(stats, light);
  const darkSvg = renderStatsCard(stats, dark);

  assert.ok(lightSvg.includes(`fill="${light.background}"`));
  assert.ok(darkSvg.includes(`fill="${dark.background}"`));
  assert.ok(!lightSvg.includes(dark.background));
});

test('renders the stats card with every metric and the rank', () => {
  const svg = renderStatsCard(stats, dark);

  assert.match(svg, /^<svg [^>]*width="467" height="195"/);
  assert.ok(svg.includes('ssbarbee&#39;s GitHub Stats'));
  for (const value of ['23', '988', '297', '8', '18', 'B+']) {
    assert.ok(svg.includes(`>${value}</text>`), `missing ${value}`);
  }
});

test('prefers the display name in the stats card title', () => {
  const svg = renderStatsCard({ ...stats, name: 'Filip' }, dark);

  assert.ok(svg.includes('Filip&#39;s GitHub Stats'));
});

test('renders top languages as percentages of the shown languages', () => {
  const svg = renderTopLanguagesCard(
    [
      { name: 'TypeScript', color: '#3178c6', size: 300 },
      { name: 'Makefile', color: null, size: 100 },
    ],
    light,
    8,
  );

  assert.match(svg, /^<svg [^>]*width="300" height="115"/);
  assert.ok(svg.includes('>TypeScript 75.00%</text>'));
  assert.ok(svg.includes('>Makefile 25.00%</text>'));
  assert.ok(
    svg.includes(`fill="${light.muted}"`),
    'languages without a colour use the muted colour',
  );
});

test('limits the languages card to the requested count', () => {
  const languages = ['A', 'B', 'C', 'D'].map((name, i) => ({
    name,
    color: '#000000',
    size: 10 - i,
  }));
  const svg = renderTopLanguagesCard(languages, dark, 3);

  assert.ok(svg.includes('>C '));
  assert.ok(!svg.includes('>D '));
});

test('renders a pin card with name, description, language, stars and forks', () => {
  const svg = renderPinCard(repo, dark);

  assert.match(svg, /^<svg [^>]*width="400" height="150"/);
  assert.ok(svg.includes('>iap-apple</text>'));
  assert.ok(svg.includes('📦 Integration of Apple receipts &amp; more'));
  assert.ok(!svg.includes('](https'), 'markdown links are reduced to their text');
  assert.ok(svg.includes('>TypeScript</text>'));
  assert.ok(svg.includes('>7</text>'));
  assert.ok(svg.includes('>2</text>'));
});

test('renders a pin card without description or language', () => {
  const svg = renderPinCard({ ...repo, description: null, language: null }, dark);

  assert.ok(svg.includes('No description provided'));
  assert.ok(!svg.includes('<circle'));
});

test('limits long pin descriptions to three lines', () => {
  const svg = renderPinCard({ ...repo, description: 'word '.repeat(100) }, dark);
  const lines = svg.match(/<tspan /g) ?? [];

  assert.equal(lines.length, 3);
  assert.ok(svg.includes('…</tspan>'));
});

test('renders the banner with name, role, location and one cell per day', () => {
  const weeks: ContributionDay[][] = [
    [
      { date: '2026-09-27', level: 'NONE' },
      { date: '2026-09-28', level: 'FOURTH_QUARTILE' },
    ],
    [{ date: '2026-10-04', level: 'FIRST_QUARTILE' }],
  ];
  const svg = renderBanner(
    {
      name: 'Filip Bozhinovski',
      role: 'Frontend engineer · TypeScript & React',
      location: 'Skopje',
    },
    weeks,
    light,
  );

  assert.match(svg, /^<svg [^>]*width="1000" height="200"/);
  assert.ok(svg.includes('>Filip Bozhinovski</text>'));
  assert.ok(svg.includes('>Frontend engineer · TypeScript &amp; React</text>'));
  assert.ok(svg.includes('>Skopje</text>'));
  assert.equal((svg.match(/class="day"/g) ?? []).length, 3);
  assert.ok(svg.includes('fill-opacity="1"'), 'the busiest days are drawn at full strength');
});

test('renders the Skopje card with rounded readings and the air quality level', () => {
  const svg = renderSkopjeCard(conditions, dark);

  assert.match(svg, /^<svg [^>]*width="467" height="195"/);
  assert.ok(svg.includes('>Skopje right now</text>'));
  assert.ok(svg.includes('>21°C</text>'));
  assert.ok(svg.includes('>Partly cloudy</text>'));
  assert.ok(svg.includes('>Feels like 20°C</text>'));
  assert.ok(svg.includes('>13 µg/m³</text>'));
  assert.ok(svg.includes('>7 µg/m³</text>'));
  assert.ok(svg.includes('>Air quality: Fair</text>'));
  assert.ok(svg.includes('>Updated 6 Oct, 18:30</text>'));
});

test('shows a temperature of exactly 0°C', () => {
  assert.ok(renderSkopjeCard({ ...conditions, temperature: 0 }, dark).includes('>0°C</text>'));
});

test('marks missing pollution readings as not available', () => {
  const svg = renderSkopjeCard({ ...conditions, pm10: null, pm25: null }, dark);

  assert.equal((svg.match(/>n\/a<\/text>/g) ?? []).length, 2);
  assert.ok(svg.includes('>Air quality: n/a</text>'));
});

test('rounds decimal pollution readings', () => {
  const svg = renderSkopjeCard({ ...conditions, pm10: 12.345678, pm25: 7.6 }, dark);

  assert.ok(svg.includes('>12 µg/m³</text>'));
  assert.ok(svg.includes('>8 µg/m³</text>'));
});

test('keeps the air quality pill clear of the readings for the longest level', () => {
  const svg = renderSkopjeCard({ ...conditions, pm10: 300 }, dark);
  const pillTop = Number(/<rect x="25" y="(\d+)" rx="11"/.exec(svg)?.[1]);
  const readingBaselines = Array.from(svg.matchAll(/x="235" y="(\d+)"/g), (match) =>
    Number(match[1]),
  );

  assert.ok(svg.includes('>Air quality: Extremely poor</text>'));
  assert.equal(readingBaselines.length, 5);
  assert.ok(Math.max(...readingBaselines) < pillTop, 'the pill sits below the last reading');
});
