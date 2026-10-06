import type { Theme } from '../config';

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

function isDarkTheme(theme: Theme): boolean {
  return parseInt(theme.background.slice(1, 3), 16) < 128;
}

// Loops are slow and small, run for about half a minute and end on their resting frame,
// so nothing moves forever (WCAG 2.2.2); they don't run at all under prefers-reduced-motion.
export const WEATHER_CSS = `
  .wx-spin { transform-box: fill-box; transform-origin: center; animation: wx-spin 24s linear 2; }
  .wx-drift { animation: wx-drift 5s ease-in-out 6 alternate; }
  .wx-fall { animation: wx-fall 1.1s linear 25; }
  .wx-snow { animation: wx-snow 2.4s linear 12; }
  .wx-flash { animation: wx-flash 4s linear 8; }
  .wx-fog { animation: wx-fog 4s ease-in-out 8 alternate; }
  .wx-twinkle { animation: wx-twinkle 3s ease-in-out 10; }
  @keyframes wx-spin { to { transform: rotate(360deg); } }
  @keyframes wx-drift { to { transform: translateX(3px); } }
  @keyframes wx-fall { from { transform: translateY(-2px); opacity: 1; } to { transform: translateY(9px); opacity: 0; } }
  @keyframes wx-snow { from { transform: translate(0, -2px); opacity: 1; } 50% { transform: translate(2px, 4px); } to { transform: translate(0, 10px); opacity: 0; } }
  @keyframes wx-flash { 0%, 88%, 100% { opacity: 0.25; } 90%, 94% { opacity: 1; } }
  @keyframes wx-fog { to { transform: translateX(4px); } }
  @keyframes wx-twinkle { 50% { opacity: 0.2; } }
`;

function sun(cx: number, cy: number, scale: number): string {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const [x1, y1] = [cx + Math.cos(angle) * 16 * scale, cy + Math.sin(angle) * 16 * scale];
    const [x2, y2] = [cx + Math.cos(angle) * 22 * scale, cy + Math.sin(angle) * 22 * scale];
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');
  return [
    `<g class="wx-spin" stroke="#fab005" stroke-width="${3 * scale}" stroke-linecap="round">${rays}</g>`,
    `<circle cx="${cx}" cy="${cy}" r="${11 * scale}" fill="#fcc419"/>`,
  ].join('');
}

function moon(theme: Theme, cx: number, cy: number): string {
  const color = isDarkTheme(theme) ? '#e9ecef' : '#868e96';
  return [
    `<circle cx="${cx}" cy="${cy}" r="14" fill="${color}"/>`,
    `<circle cx="${cx + 7}" cy="${cy - 5}" r="12" fill="${theme.background}"/>`,
    `<circle class="wx-twinkle" cx="${cx + 18}" cy="${cy - 14}" r="1.6" fill="${color}"/>`,
    `<circle class="wx-twinkle" cx="${cx + 22}" cy="${cy + 2}" r="1.2" fill="${color}" style="animation-delay: 1.2s"/>`,
  ].join('');
}

function cloud(theme: Theme, dx = 0, dy = 0): string {
  const fill = isDarkTheme(theme) ? '#c9d1d9' : '#adb5bd';
  // The animated group sits inside the positioned one: a CSS transform would replace the offset.
  return `<g transform="translate(${dx} ${dy})"><g class="wx-drift" fill="${fill}"><circle cx="24" cy="38" r="9"/><circle cx="34" cy="32" r="12"/><circle cx="44" cy="39" r="8"/><rect x="18" y="37" width="32" height="10" rx="5"/></g></g>`;
}

function drops(color: string, count: number, cssClass: string, period: number): string {
  const xs = count === 2 ? [27, 39] : [24, 33, 42];
  return xs
    .map((x, i) => {
      const style = `style="animation-delay: ${((i * period) / count).toFixed(2)}s"`;
      return cssClass === 'wx-snow'
        ? `<circle class="${cssClass}" ${style} cx="${x}" cy="53" r="2.2" fill="${color}"/>`
        : `<line class="${cssClass}" ${style} x1="${x}" y1="50" x2="${x - 2}" y2="56" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;
    })
    .join('');
}

// A 64x64 animated icon placed with its top-left corner at (x, y).
export function weatherIcon(
  code: number,
  isDay: boolean,
  theme: Theme,
  x: number,
  y: number,
): string {
  const kind = weatherKind(code);
  const parts: string[] = [];
  switch (kind) {
    case 'clear':
      parts.push(isDay ? sun(32, 32, 1) : moon(theme, 30, 32));
      break;
    case 'partly-cloudy':
      parts.push(isDay ? sun(24, 24, 0.75) : moon(theme, 24, 24), cloud(theme, 4, 4));
      break;
    case 'cloudy':
      parts.push(cloud(theme));
      break;
    case 'fog':
      parts.push(
        ...[26, 35, 44].map(
          (lineY, i) =>
            `<line class="wx-fog" style="animation-delay: ${i * 0.6}s" x1="${14 + i * 3}" y1="${lineY}" x2="${50 - i * 2}" y2="${lineY}" stroke="${theme.muted}" stroke-width="3.5" stroke-linecap="round"/>`,
        ),
      );
      break;
    case 'drizzle':
      parts.push(cloud(theme, 0, -4), drops('#4dabf7', 2, 'wx-fall', 1.6));
      break;
    case 'rain':
      parts.push(cloud(theme, 0, -4), drops('#339af0', 3, 'wx-fall', 1.1));
      break;
    case 'snow':
      parts.push(
        cloud(theme, 0, -4),
        drops(isDarkTheme(theme) ? '#e7f5ff' : '#74c0fc', 3, 'wx-snow', 2.4),
      );
      break;
    case 'thunder':
      parts.push(
        cloud(theme, 0, -4),
        `<polygon class="wx-flash" points="34,44 27,56 33,56 29,64 40,50 34,50 38,44" fill="#fcc419"/>`,
      );
      break;
  }
  return `<g transform="translate(${x} ${y})" aria-hidden="true">${parts.join('')}</g>`;
}
