import type { Theme } from '../config';
import type { ContributionDay, ContributionLevel } from '../github';
import { escapeXml, renderFrame, textLength } from './common';
import { FADE_IN, REDUCED_MOTION, TYPING } from './motion';

const WIDTH = 1000;
const HEIGHT = 200;
const CELL = { size: 11, gap: 3 };
const GRID = { right: 40, top: 44 };

// Contribution cells use the title colour, stronger for busier days.
const OPACITY: Record<ContributionLevel, number> = {
  NONE: 0.1,
  FIRST_QUARTILE: 0.35,
  SECOND_QUARTILE: 0.55,
  THIRD_QUARTILE: 0.78,
  FOURTH_QUARTILE: 1,
};

export interface Profile {
  name: string;
  role: string;
  location: string;
}

// Rough width of an 18px character, used to size the cover that types out the role line.
const ROLE_CHAR_WIDTH = 8.6;

// Cells ripple in diagonally, then a gentle wave passes through them three times and stops.
// The role line types itself out with the shared typing cover.
const MOTION_CSS = `
  .day { transform-box: fill-box; transform-origin: center; animation: day-in 0.5s ease-out both, day-wave 7s ease-in-out 2s 3; }
  @keyframes day-in { from { opacity: 0; transform: scale(0.3); } }
  @keyframes day-wave { 0%, 10%, 100% { transform: scale(1); } 5% { transform: scale(1.2); } }
`;

interface BannerOptions {
  animated?: boolean;
}

export function renderBanner(
  profile: Profile,
  weeks: ContributionDay[][],
  theme: Theme,
  { animated = false }: BannerOptions = {},
): string {
  const step = CELL.size + CELL.gap;
  const gridX = WIDTH - GRID.right - weeks.length * step + CELL.gap;
  const days = weeks.map((week, column) =>
    week
      .map(({ date, level }) => {
        const row = new Date(date).getUTCDay();
        const motion = animated
          ? ` style="animation-delay: ${column * 25 + row * 12}ms, ${2000 + column * 60}ms"`
          : '';
        return `<rect class="day"${motion} x="${gridX + column * step}" y="${GRID.top + row * step}" width="${CELL.size}" height="${CELL.size}" rx="2" fill="${theme.title}" fill-opacity="${OPACITY[level]}"/>`;
      })
      .join(''),
  );
  const months = Math.round((weeks.length * 7) / 30);
  const roleLength = textLength(profile.role);
  const typing = animated
    ? [
        `<rect class="typing" x="40" y="102" width="${Math.ceil(roleLength * ROLE_CHAR_WIDTH) + 12}" height="24" fill="${theme.background}" style="animation-duration: ${roleLength * 45}ms; animation-delay: 500ms; animation-timing-function: steps(${roleLength})"/>`,
      ]
    : [];

  return renderFrame({
    theme,
    width: WIDTH,
    height: HEIGHT,
    css: animated ? MOTION_CSS + TYPING + FADE_IN + REDUCED_MOTION : '',
    title: profile.name,
    description: `${profile.role}. ${profile.location}`,
    body: [
      `<text class="name${animated ? ' fade-in' : ''}" x="40" y="86">${escapeXml(profile.name)}</text>`,
      `<text class="role" x="42" y="120">${escapeXml(profile.role)}</text>`,
      ...typing,
      `<text class="meta${animated ? ' fade-in' : ''}" x="42" y="150"${animated ? ` style="animation-delay: ${500 + roleLength * 45}ms"` : ''}>${escapeXml(profile.location)}</text>`,
      ...days,
      ...(weeks.length
        ? [
            `<text class="label muted" x="${gridX}" y="${GRID.top + 7 * step + 18}">Last ${months} months of contributions</text>`,
          ]
        : []),
    ],
  });
}
