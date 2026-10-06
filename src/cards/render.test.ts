import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from './config';
import type { ContributionDay, UserStats } from './github';
import type { SkopjeConditions } from './skopje';
import { renderAboutCard } from './svg/about';
import { renderBanner } from './svg/banner';
import { escapeXml, formatNumber, wrapText } from './svg/common';
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
  contributions: 10384,
};

const conditions: SkopjeConditions = {
  temperature: 21.4,
  feelsLike: 19.6,
  condition: 'Partly cloudy',
  weatherCode: 2,
  isDay: true,
  humidity: 25,
  sunrise: '06:36',
  sunset: '18:07',
  pm10: 13,
  pm25: 7,
  updatedAt: '6 Oct, 18:30',
  localTime: '18:30',
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
  assert.ok(svg.includes('>All contributions (last year):</text>'));
  for (const value of ['23', '10.4k', '988', '297', '8', '18', 'B+']) {
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

  assert.match(svg, /^<svg [^>]*width="467" height="195"/, 'every grid card has the same size');
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
  assert.ok(svg.includes('>Data: Open-Meteo · pulse.eco</text>'));
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

test('renders the About card with one line per point', () => {
  const svg = renderAboutCard(['Exploring AI tooling', 'Half-marathons & chess'], light);

  assert.match(svg, /^<svg [^>]*width="467" height="195"/, 'every grid card has the same size');
  assert.ok(svg.includes('>About</text>'));
  assert.ok(svg.includes('>Exploring AI tooling</text>'));
  assert.ok(svg.includes('>Half-marathons &amp; chess</text>'));
  assert.equal((svg.match(/<circle /g) ?? []).length, 2);
});

test('shortens About points that would run past the card edge', () => {
  const svg = renderAboutCard(['word '.repeat(30)], dark);

  assert.ok(svg.includes('…</text>'));
});

test('skips blank About points', () => {
  const svg = renderAboutCard(['Exploring AI tooling', '  ', ''], dark);

  assert.equal((svg.match(/<circle /g) ?? []).length, 1);
});

test('refuses more About points than the card can fit', () => {
  assert.throws(() => renderAboutCard(['a', 'b', 'c', 'd', 'e'], dark), /at most 4/);
});

test('shows at most eight languages on the fixed-size card', () => {
  const languages = Array.from({ length: 12 }, (_, i) => ({
    name: `Lang${i}`,
    color: '#000000',
    size: 100 - i,
  }));
  const svg = renderTopLanguagesCard(languages, dark, 12);

  assert.ok(svg.includes('>Lang7 '));
  assert.ok(!svg.includes('>Lang8 '));
});

test('keeps the rank on public numbers only', () => {
  const empty = {
    ...stats,
    stars: 0,
    commits: 0,
    prs: 0,
    issues: 0,
    followers: 0,
    contributedTo: 0,
  };

  assert.ok(renderStatsCard({ ...empty, contributions: 50000 }, dark).includes('>C</text>'));
});
