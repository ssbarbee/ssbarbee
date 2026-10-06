import type { Theme } from '../config';
import type { ContributionDay, ContributionLevel } from '../github';
import { escapeXml, renderFrame } from './common';

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

interface Profile {
  name: string;
  role: string;
  location: string;
}

export function renderBanner(profile: Profile, weeks: ContributionDay[][], theme: Theme): string {
  const step = CELL.size + CELL.gap;
  const gridX = WIDTH - GRID.right - weeks.length * step + CELL.gap;
  const days = weeks.map((week, column) =>
    week
      .map(({ date, level }) => {
        const row = new Date(date).getUTCDay();
        return `<rect class="day" x="${gridX + column * step}" y="${GRID.top + row * step}" width="${CELL.size}" height="${CELL.size}" rx="2" fill="${theme.title}" fill-opacity="${OPACITY[level]}"/>`;
      })
      .join(''),
  );
  const months = Math.round((weeks.length * 7) / 30);

  return renderFrame({
    theme,
    width: WIDTH,
    height: HEIGHT,
    title: profile.name,
    description: `${profile.role}. ${profile.location}`,
    body: [
      `<text class="name" x="40" y="86">${escapeXml(profile.name)}</text>`,
      `<text class="role" x="42" y="120">${escapeXml(profile.role)}</text>`,
      `<text class="meta" x="42" y="150">${escapeXml(profile.location)}</text>`,
      ...days,
      ...(weeks.length
        ? [
            `<text class="label muted" x="${gridX}" y="${GRID.top + 7 * step + 18}">Last ${months} months of contributions</text>`,
          ]
        : []),
    ],
  });
}
