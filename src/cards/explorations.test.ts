import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE, THEMES } from './config';
import type { ContributionDay } from './github';
import type { SkopjeConditions } from './skopje';
import { renderAboutCard } from './svg/about';
import { renderBanner } from './svg/banner';
import { ICONS } from './svg/common';
import { renderSkylineBanner, skyPhase } from './svg/skyline';
import { renderSkopjeCard } from './svg/skopje';
import { renderStatsCard } from './svg/stats';
import { renderTerminalCard } from './svg/terminal';
import { renderKpiTile, renderRankTile, renderWeeklyTile } from './svg/tiles';
import { weatherIcon, weatherKind } from './svg/weather-icons';

const { light, dark } = THEMES;

const weeks: ContributionDay[][] = [
  [
    { date: '2026-09-27', level: 'NONE', count: 0 },
    { date: '2026-09-28', level: 'FOURTH_QUARTILE', count: 40 },
  ],
  [{ date: '2026-10-04', level: 'SECOND_QUARTILE', count: 12 }],
];

const conditions: SkopjeConditions = {
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

const stats = {
  login: 'ssbarbee',
  name: null,
  stars: 23,
  commits: 887,
  prs: 297,
  issues: 8,
  reviews: 0,
  contributedTo: 4,
  followers: 7,
  contributions: 10335,
};

test('groups WMO weather codes into drawable kinds', () => {
  assert.equal(weatherKind(0), 'clear');
  assert.equal(weatherKind(2), 'partly-cloudy');
  assert.equal(weatherKind(48), 'fog');
  assert.equal(weatherKind(55), 'drizzle');
  assert.equal(weatherKind(81), 'rain');
  assert.equal(weatherKind(86), 'snow');
  assert.equal(weatherKind(99), 'thunder');
});

test('draws a sun by day and a moon at night', () => {
  assert.ok(weatherIcon(0, true, dark, 0, 0).includes('wx-spin'));
  assert.ok(!weatherIcon(0, false, dark, 0, 0).includes('wx-spin'));
  assert.ok(weatherIcon(0, false, dark, 0, 0).includes('wx-twinkle'));
});

test('picks the sky phase from the time, sunrise, sunset and daylight', () => {
  assert.equal(skyPhase('12:30', '06:36', '18:07', true), 'day');
  assert.equal(skyPhase('17:30', '06:36', '18:07', true), 'golden');
  assert.equal(skyPhase('06:50', '06:36', '18:07', true), 'golden');
  assert.equal(skyPhase('22:00', '06:36', '18:07', false), 'night');
  assert.equal(
    skyPhase('18:20', '06:36', '18:07', false),
    'night',
    'follows the weather card after sunset',
  );
});

test('draws the same scene whether or not it is animated', () => {
  const strip = (svg: string) =>
    svg
      .replace(/<style>[\s\S]*?<\/style>/, '')
      .replace(/ class="[^"]*"/g, '')
      .replace(/ style="[^"]*"/g, '');
  for (const scene of [
    conditions,
    { ...conditions, weatherCode: 63 },
    { ...conditions, isDay: false, localTime: '22:00' },
  ]) {
    assert.equal(
      strip(renderSkylineBanner(PROFILE, weeks, scene, dark, { animated: true })),
      strip(renderSkylineBanner(PROFILE, weeks, scene, dark)),
    );
  }
});

test('lights the newest contribution days in the rightmost windows', () => {
  const recent: ContributionDay[][] = [
    [{ date: '2026-10-05', level: 'FOURTH_QUARTILE', count: 40 }],
  ];
  const svg = renderSkylineBanner(
    PROFILE,
    recent,
    { ...conditions, isDay: false, localTime: '22:00' },
    dark,
  );
  const windows = Array.from(
    svg.matchAll(/<rect x="(\d+)" y="\d+" width="5" height="6" fill="#ffd166" opacity="([\d.]+)"/g),
  );

  assert.ok(windows.length > 10);
  assert.equal(windows[windows.length - 1][2], '1', 'the newest day is the last window');
  assert.equal(windows[0][2], '0.05', 'older windows without data stay dark');
});

test('shows n/a in the sky caption when the temperature is missing', () => {
  assert.ok(
    renderSkylineBanner(PROFILE, weeks, { ...conditions, temperature: NaN }, dark).includes(
      '>n/a · Partly cloudy</text>',
    ),
  );
});

test('keeps the weather icon clear of a wide temperature', () => {
  const svg = renderSkopjeCard({ ...conditions, temperature: -12 }, dark);
  const iconX = Number(/<g transform="translate\((\d+) 58\)" aria-hidden/.exec(svg)?.[1]);

  assert.ok(iconX >= 25 + 126, `icon at ${iconX}`);
  assert.ok(iconX + 64 <= 231, 'and clear of the readings column');
});

test('renders the Skopje sky with the profile, the cross and one window per day', () => {
  const svg = renderSkylineBanner(PROFILE, weeks, conditions, dark);

  assert.match(svg, /^<svg [^>]*width="1000" height="240"/);
  assert.ok(svg.includes(`>${PROFILE.name}</text>`));
  assert.ok(
    svg.includes('>Skopje · 7 Oct, 12:30</text>'),
    'the caption says when the scene was drawn',
  );
  assert.ok(svg.includes('>14°C · Partly cloudy</text>'));
  assert.ok(svg.includes('>Air quality: Fair</text>'));
  assert.equal((svg.match(/fill="#cfe8ff"/g) ?? []).length > 3, true, 'windows are drawn');
  assert.ok(!svg.includes('@keyframes'), 'static unless animated');
});

test('lights the Millennium Cross at night', () => {
  const night = renderSkylineBanner(
    PROFILE,
    weeks,
    { ...conditions, isDay: false, localTime: '22:00' },
    dark,
  );

  assert.ok(night.includes('fill="#fff3c4"'));
});

test('keeps every animated card readable without motion', () => {
  const animated = { animated: true };
  const cards = [
    renderBanner(PROFILE, weeks, light, animated),
    renderAboutCard(PROFILE.about, light, animated),
    renderStatsCard(stats, light, animated),
    renderSkylineBanner(PROFILE, weeks, conditions, light, animated),
    renderTerminalCard(
      { user: 'u', host: 'h', monogram: 'FB', rows: [['Role', 'Engineer']] },
      light,
      animated,
    ),
    renderWeeklyTile([1, 2, 3], light, animated),
  ];

  for (const svg of cards) {
    assert.ok(svg.includes('@keyframes'), 'the card animates');
    assert.ok(svg.includes('prefers-reduced-motion: reduce'), 'and stops for reduced motion');
    assert.ok(!svg.includes('infinite'), 'and every loop ends');
  }
});

test('leaves cards static by default', () => {
  assert.ok(!renderBanner(PROFILE, weeks, light).includes('@keyframes'));
  assert.ok(!renderStatsCard(stats, light).includes('@keyframes'));
});

test('renders a number tile with a compact value', () => {
  const svg = renderKpiTile(
    { label: 'Contributions', value: 10335, caption: 'last year', icon: ICONS.graph },
    light,
  );

  assert.match(svg, /^<svg [^>]*width="202" height="120"/);
  assert.ok(svg.includes('>10.3k</text>'));
  assert.ok(svg.includes('>Contributions</text>'));
});

test('renders the rank tile from public numbers', () => {
  assert.ok(renderRankTile(stats, dark).includes('>B+</text>'));
});

test('draws a quiet chart without a busiest label when nothing happened', () => {
  const svg = renderWeeklyTile([0, 0, 0], dark);

  assert.equal((svg.match(/<rect [^>]*rx="1.5"/g) ?? []).length, 3);
  assert.ok(!svg.includes('x="-'), 'nothing is drawn outside the card');
});

test('refuses an empty contribution history', () => {
  assert.throws(() => renderWeeklyTile([], dark), /No contribution weeks/);
});

test('draws one bar per week and labels the busiest', () => {
  const svg = renderWeeklyTile([5, 40, 12], dark);

  assert.equal((svg.match(/<rect [^>]*rx="1.5"/g) ?? []).length, 3);
  assert.ok(svg.includes('>40</text>'));
});

test('keeps the terminal tall enough for the monogram and fits the prompt to the host', () => {
  const svg = renderTerminalCard(
    { user: 'u', host: 'h', monogram: 'FB', rows: [['Role', 'Engineer']] },
    dark,
  );
  const height = Number(/^<svg [^>]*height="(\d+)"/.exec(svg)?.[1]);
  const pixelBottoms = Array.from(
    svg.matchAll(/<rect x="\d+" y="(\d+)" width="15"/g),
    (m) => Number(m[1]) + 15,
  );
  const command = Number(/<text class="mono" x="([\d.]+)" y="62">neofetch/.exec(svg)?.[1]);

  assert.ok(Math.max(...pixelBottoms) + 40 <= height, 'the monogram ends above the bottom prompt');
  assert.ok(command < 24 + 8 * 7.8, 'a short host keeps the command close to the prompt');
});

test('draws the terminal monogram as pixels', () => {
  const svg = renderTerminalCard(
    { user: 'u', host: 'h', monogram: 'FB', rows: [['Role', 'Engineer']] },
    dark,
  );

  assert.equal(
    (svg.match(/<rect [^>]*rx="2" fill="#7cebf5"/g) ?? []).length,
    70,
    'two 5x7 letters',
  );
  assert.ok(svg.includes('>Role</text>'));
  assert.ok(svg.includes('>Engineer</text>'));
});
