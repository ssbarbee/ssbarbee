import type { Theme } from '../config';
import type { ContributionDay, ContributionLevel } from '../github';
import { airQuality, type SkopjeConditions } from '../skopje';
import type { Profile } from './banner';
import { FONT, escapeXml, renderFrame } from './common';
import { REDUCED_MOTION } from './motion';

// A banner showing Skopje's sky right now: colours follow the time of day and the weather, the sun
// sits where it really is between sunrise and sunset, Vodno carries the Millennium Cross (lit at
// night), and the city's windows light up with the last months of GitHub contributions.

export type WeatherKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

// Groups WMO weather interpretation codes (as returned by open-meteo) into drawable kinds.
export function weatherKind(code: number): WeatherKind {
  if (code <= 1) return 'clear';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

function formatRounded(value: number, unit: string): string {
  return Number.isFinite(value) ? `${Math.round(value)}${unit}` : 'n/a';
}

const WIDTH = 1000;
const HEIGHT = 240;

type Phase = 'day' | 'golden' | 'night';

const SKIES: Record<Phase, { clear: string[]; grey: string[] }> = {
  day: { clear: ['#2f6fb3', '#78b7e8', '#bfe3f7'], grey: ['#5c6b7a', '#8d9aa7', '#c3ccd5'] },
  golden: { clear: ['#2c3e70', '#c86b5a', '#f6b26b'], grey: ['#3b4253', '#7f6e6e', '#b59a86'] },
  night: { clear: ['#070b1d', '#121a3a', '#26365f'], grey: ['#0c0f17', '#1a2030', '#2c3446'] },
};

const LAND: Record<Phase, { mountain: string; city: string; window: string }> = {
  day: { mountain: '#3d5f83', city: '#1b2b40', window: '#cfe8ff' },
  golden: { mountain: '#5a3a55', city: '#2a1b2c', window: '#ffd9a0' },
  night: { mountain: '#141b33', city: '#0a0e1c', window: '#ffd166' },
};

const WINDOW_OPACITY: Record<ContributionLevel, number> = {
  NONE: 0.07,
  FIRST_QUARTILE: 0.35,
  SECOND_QUARTILE: 0.55,
  THIRD_QUARTILE: 0.8,
  FOURTH_QUARTILE: 1,
};

const OVERCAST: WeatherKind[] = ['cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunder'];

// Deterministic pseudo-random numbers, so the same data always draws the same scene.
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function minutes(clock: string): number {
  const [hours, mins] = clock.split(':').map(Number);
  return hours * 60 + mins;
}

// Night follows the weather data's own daylight flag, so the banner and the weather card agree.
export function skyPhase(clock: string, sunrise: string, sunset: string, isDay: boolean): Phase {
  if (!isDay) return 'night';
  const now = minutes(clock);
  const [rise, set] = [minutes(sunrise), minutes(sunset)];
  if (Math.abs(now - rise) <= 60 || Math.abs(now - set) <= 60) return 'golden';
  return 'day';
}

function cloudShape(x: number, y: number, scale: number, fill: string, opacity: number): string {
  return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${scale.toFixed(2)})" fill="${fill}" fill-opacity="${opacity}"><ellipse cx="0" cy="0" rx="34" ry="12"/><ellipse cx="-16" cy="-6" rx="16" ry="12"/><ellipse cx="10" cy="-12" rx="20" ry="16"/></g>`;
}

export function renderSkylineBanner(
  profile: Profile,
  weeks: ContributionDay[][],
  conditions: SkopjeConditions,
  theme: Theme,
  { animated = false }: { animated?: boolean } = {},
): string {
  const clock = conditions.localTime;
  const phase = skyPhase(clock, conditions.sunrise, conditions.sunset, conditions.isDay);
  const kind = weatherKind(conditions.weatherCode);
  const overcast = OVERCAST.includes(kind);
  const sky = overcast ? SKIES[phase].grey : SKIES[phase].clear;
  const land = LAND[phase];
  // Layout and motion draw from separate sequences, so animating never changes the scene.
  const seed = minutes(clock) + conditions.weatherCode * 7 + 1;
  const rand = random(seed);
  const motionRand = random(seed + 7919);
  const temperature = formatRounded(conditions.temperature, '°C');
  const [date] = conditions.updatedAt.split(', ');
  const air = airQuality(conditions.pm10, conditions.pm25);
  // Short lines, right-aligned over Vodno, stay clear of the city even for long readings.
  const caption = [
    `Skopje · ${date}, ${clock}`,
    `${temperature} · ${conditions.condition}`,
    ...(air ? [`Air quality: ${air.level}`] : []),
  ];
  const css: string[] = [];
  const parts: string[] = [];

  // Sky and light sources.
  parts.push(
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${sky
      .map((color, i) => `<stop offset="${i / (sky.length - 1)}" stop-color="${color}"/>`)
      .join('')}</linearGradient>`,
    `<linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.32"/><stop offset="0.55" stop-color="#000" stop-opacity="0"/></linearGradient>`,
    `<filter id="shadow" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/></filter>`,
    `<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>`,
    `<mask id="moon"><circle cx="905" cy="52" r="16" fill="#fff"/><circle cx="913" cy="46" r="14" fill="#000"/></mask>`,
    `<clipPath id="frame"><rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="6"/></clipPath></defs>`,
    `<g clip-path="url(#frame)">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>`,
  );

  if (phase === 'night') {
    for (let i = 0; i < (overcast ? 0 : 46); i++) {
      const [x, y] = [rand() * WIDTH, rand() * 140];
      const twinkle = animated
        ? ` class="twinkle" style="animation-delay: ${(motionRand() * 4).toFixed(1)}s"`
        : '';
      parts.push(
        `<circle${twinkle} cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.6 + rand()).toFixed(1)}" fill="#fff" opacity="${(0.4 + rand() * 0.6).toFixed(2)}"/>`,
      );
    }
    if (!overcast)
      parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#f1f3f5" mask="url(#moon)"/>`);
    css.push(
      `.twinkle { animation: twinkle 4s ease-in-out 8; } @keyframes twinkle { 50% { opacity: 0.15; } }`,
    );
  } else if (!overcast) {
    const [rise, set] = [minutes(conditions.sunrise), minutes(conditions.sunset)];
    const progress = Math.min(1, Math.max(0, (minutes(clock) - rise) / (set - rise)));
    const [sunX, sunY] = [520 + (progress - 0.5) * 700, 175 - Math.sin(progress * Math.PI) * 135];
    const sunColor = phase === 'golden' ? '#ffb347' : '#fff3b0';
    parts.push(
      `<circle class="${animated ? 'sun-glow' : ''}" cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="36" fill="${sunColor}" opacity="0.25"/>`,
      `<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="18" fill="${sunColor}"/>`,
    );
    css.push(
      `.sun-glow { transform-box: fill-box; transform-origin: center; animation: sun-glow 6s ease-in-out 4; } @keyframes sun-glow { 50% { transform: scale(1.25); opacity: 0.12; } }`,
    );
  }

  // Clouds drift across the whole sky and wrap around; their resting places are spread out.
  const cloudCount = {
    clear: 2,
    'partly-cloudy': 5,
    cloudy: 9,
    fog: 6,
    drizzle: 8,
    rain: 9,
    snow: 8,
    thunder: 10,
  }[kind];
  const cloudFill =
    phase === 'night'
      ? '#9fb0d0'
      : phase === 'golden'
        ? '#ffd9c0'
        : overcast
          ? '#e9edf1'
          : '#ffffff';
  const cloudOpacity = phase === 'night' ? 0.22 : overcast ? 0.75 : 0.85;
  for (let i = 0; i < cloudCount; i++) {
    const x = (i + rand() * 0.6) * (WIDTH / cloudCount);
    const y = 14 + rand() * 56;
    const motion = animated
      ? ` class="cloud" style="animation-duration: ${(14 + motionRand() * 8).toFixed(1)}s; animation-delay: -${(motionRand() * 10).toFixed(1)}s"`
      : '';
    parts.push(`<g${motion}>${cloudShape(x, y, 0.6 + rand() * 0.6, cloudFill, cloudOpacity)}</g>`);
  }
  // Clouds sway a little and settle back, so the scene comes to rest after about a minute.
  css.push(
    `.cloud { animation-name: cloud-sway; animation-timing-function: ease-in-out; animation-iteration-count: 3; } @keyframes cloud-sway { 50% { transform: translateX(40px); } }`,
  );
  // A soft shade behind the text keeps it readable whatever drifts past.
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>`);

  // Precipitation and fog over the whole scene.
  const fallCounts: Partial<Record<WeatherKind, number>> = {
    drizzle: 35,
    rain: 70,
    thunder: 70,
    snow: 55,
  };
  const fallCount = fallCounts[kind] ?? 0;
  for (let i = 0; i < fallCount; i++) {
    const [x, y] = [rand() * (WIDTH + 60), rand() * HEIGHT];
    const motion = animated
      ? ` class="${kind === 'snow' ? 'snow' : 'rain'}" style="animation-delay: -${(motionRand() * 3).toFixed(2)}s"`
      : '';
    parts.push(
      kind === 'snow'
        ? `<circle${motion} cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.2 + rand()).toFixed(1)}" fill="#fff" opacity="0.85"/>`
        : `<line${motion} x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 4).toFixed(0)}" y2="${(y + 11).toFixed(0)}" stroke="#d0e4ff" stroke-width="1.2" opacity="0.55"/>`,
    );
  }
  css.push(
    `.rain { animation: rain 0.7s linear 40; } @keyframes rain { to { transform: translate(-24px, ${HEIGHT}px); } }`,
    `.snow { animation: snow 6s linear 5; } @keyframes snow { 50% { transform: translate(8px, ${HEIGHT / 2}px); } to { transform: translate(0, ${HEIGHT}px); } }`,
  );
  if (kind === 'fog') {
    for (let i = 0; i < 3; i++) {
      parts.push(
        `<rect class="${animated ? 'fog' : ''}" x="-100" y="${120 + i * 28}" width="${WIDTH + 200}" height="22" rx="11" fill="#e9ecef" opacity="0.18" style="animation-delay: -${i * 3}s"/>`,
      );
    }
    css.push(
      `.fog { animation: fog 12s ease-in-out 4 alternate; } @keyframes fog { to { transform: translateX(60px); } }`,
    );
  }

  // Vodno with the Millennium Cross, lit at night.
  const crossColor = phase === 'night' ? '#fff3c4' : land.city;
  parts.push(
    `<path d="M 470 ${HEIGHT} L 560 200 Q 620 170 680 146 Q 740 118 790 108 Q 845 116 890 140 Q 940 166 ${WIDTH} 180 L ${WIDTH} ${HEIGHT} Z" fill="${land.mountain}"/>`,
    ...(phase === 'night'
      ? [
          `<rect x="782" y="72" width="16" height="40" fill="#fff3c4" opacity="0.35" filter="url(#glow)"/>`,
        ]
      : []),
    `<rect x="788.5" y="76" width="3" height="32" fill="${crossColor}"/>`,
    `<rect x="782" y="84" width="16" height="3" fill="${crossColor}"/>`,
  );

  // The city: each window is one day of contributions, the newest in the rightmost window.
  const buildings: { x: number; width: number; height: number }[] = [];
  // Buildings stop at x=760, leaving the bottom-right corner to Vodno and the caption.
  const CITY_END = 760;
  for (let x = 0; x < CITY_END - 24; ) {
    const width = Math.min(30 + Math.round(rand() * 30), CITY_END - x);
    const building = { x, width, height: 34 + Math.round(rand() * 44) };
    buildings.push(building);
    x += building.width + 3;
  }
  const windows: { x: number; y: number }[] = [];
  for (const { x, width, height } of buildings) {
    parts.push(
      `<rect x="${x}" y="${HEIGHT - height}" width="${width}" height="${height}" fill="${land.city}"/>`,
    );
    for (let wy = HEIGHT - height + 8; wy + 6 <= HEIGHT - 6; wy += 10) {
      for (let wx = x + 5; wx + 5 <= x + width - 4; wx += 9) {
        windows.push({ x: wx, y: wy });
      }
    }
  }
  const days = weeks.flat();
  // When there are more windows than days, the leftmost windows have no data and stay dark.
  const firstDay = days.length - windows.length;
  windows.forEach(({ x, y }, i) => {
    const day = days[firstDay + i];
    const opacity = day ? WINDOW_OPACITY[day.level] : 0.05;
    const flicker =
      animated && phase === 'night' && day?.level === 'FOURTH_QUARTILE' && motionRand() < 0.25;
    parts.push(
      `<rect${flicker ? ` class="flicker" style="animation-delay: -${(motionRand() * 8).toFixed(1)}s"` : ''} x="${x}" y="${y}" width="5" height="6" fill="${land.window}" opacity="${phase === 'day' ? (opacity * 0.6).toFixed(2) : opacity}"/>`,
    );
  });
  css.push(
    `.flicker { animation: flicker 8s steps(1) 4; } @keyframes flicker { 0%, 70% { opacity: 1; } 71%, 80% { opacity: 0.2; } }`,
  );

  if (kind === 'thunder') {
    parts.push(
      `<rect class="${animated ? 'flash' : ''}" width="${WIDTH}" height="${HEIGHT}" fill="#fff" opacity="0"/>`,
    );
    css.push(
      `.flash { animation: flash 7s linear 4; } @keyframes flash { 0%, 92%, 100% { opacity: 0; } 93%, 95% { opacity: 0.35; } }`,
    );
  }

  parts.push(
    `<g filter="url(#shadow)">`,
    `<text class="sky-name" x="40" y="74">${escapeXml(profile.name)}</text>`,
    `<text class="sky-role" x="42" y="106">${escapeXml(profile.role)}</text>`,
    `<text class="sky-meta" x="42" y="132">${escapeXml(profile.location)}</text>`,
    // The scene is redrawn once a day, so the caption says when, not "now".
    ...caption.map(
      (line, i) =>
        `<text class="sky-meta" x="${WIDTH - 24}" y="${HEIGHT - 14 - (caption.length - 1 - i) * 18}" text-anchor="end">${escapeXml(line)}</text>`,
    ),
    `</g>`,
    `</g>`,
  );

  return renderFrame({
    theme,
    width: WIDTH,
    height: HEIGHT,
    title: profile.name,
    description: `${profile.role}. ${profile.location}. Skopje on ${date} at ${clock}: ${temperature}, ${conditions.condition}${air ? `, air quality ${air.level.toLowerCase()}` : ''}. Lit windows show contributions over the last months.`,
    css: `
      .sky-name { font: 700 38px ${FONT}; fill: #ffffff; }
      .sky-role { font: 500 18px ${FONT}; fill: #eaf4ff; }
      .sky-meta { font: 400 13px ${FONT}; fill: #dbe7f3; }
      ${animated ? css.join('\n') + REDUCED_MOTION : ''}
    `,
    body: parts,
  });
}
