import type { Theme } from '../config';
import { calculateRank, type RankInput } from '../rank';
import { FONT, GRID_CARD, escapeXml, formatNumber, icon, renderCard, renderFrame } from './common';
import { FADE_IN, REDUCED_MOTION, delay, ringDraw } from './motion';

// Small tiles for a bento-style README: four of them fill one row next to the 824px banner.
export const KPI_TILE = { width: 202, height: 120 };

const TILE_CSS = (theme: Theme) => `
  .kpi-value { font: 700 36px ${FONT}; fill: ${theme.title}; }
  .kpi-label { font: 600 13px ${FONT}; fill: ${theme.text}; }
`;

export interface Kpi {
  label: string;
  value: number | string;
  caption: string;
  icon: string;
}

export function renderKpiTile(
  kpi: Kpi,
  theme: Theme,
  { animated = false, order = 0 }: { animated?: boolean; order?: number } = {},
): string {
  const value = typeof kpi.value === 'number' ? formatNumber(kpi.value) : kpi.value;
  return renderFrame({
    theme,
    ...KPI_TILE,
    title: kpi.label,
    description: `${kpi.label}: ${value}, ${kpi.caption}`,
    css: TILE_CSS(theme) + (animated ? FADE_IN + REDUCED_MOTION : ''),
    body: [
      icon(kpi.icon, 16, 16),
      `<text class="kpi-label" x="40" y="29">${escapeXml(kpi.label)}</text>`,
      `<g${animated ? ` class="fade-in" ${delay(150 + order * 120)}` : ''}><text class="kpi-value" x="16" y="80">${escapeXml(value)}</text></g>`,
      `<text class="small" x="16" y="104">${escapeXml(kpi.caption)}</text>`,
    ],
  });
}

export function renderRankTile(
  stats: RankInput,
  theme: Theme,
  { animated = false }: { animated?: boolean } = {},
): string {
  const rank = calculateRank(stats);
  const [cx, cy, r] = [150, 60, 30];
  const circumference = 2 * Math.PI * r;
  const ring = `cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.title}" stroke-width="5"`;
  return renderFrame({
    theme,
    ...KPI_TILE,
    title: 'GitHub rank',
    description: `GitHub rank ${rank.level}, from public activity`,
    css: TILE_CSS(theme) + (animated ? ringDraw(circumference) + REDUCED_MOTION : ''),
    body: [
      `<text class="kpi-label" x="16" y="29">GitHub rank</text>`,
      `<text class="small" x="16" y="104">public activity only</text>`,
      `<circle ${ring} opacity="0.2"/>`,
      `<circle ${ring}${animated ? ' class="ring-draw"' : ''} opacity="0.85" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${(circumference * rank.percentile) / 100}" transform="rotate(-90 ${cx} ${cy})"/>`,
      `<text class="kpi-value" x="16" y="80">${rank.level}</text>`,
    ],
  });
}

// Weekly totals of the contribution calendar as a bar chart; the busiest week is labelled.
export function renderWeeklyTile(
  weekly: number[],
  theme: Theme,
  { animated = false }: { animated?: boolean } = {},
): string {
  if (!weekly.length) {
    throw new Error('No contribution weeks');
  }
  const chart = { x: 25, y: 60, width: GRID_CARD.width - 50, height: 100 };
  const max = Math.max(0, ...weekly);
  const step = chart.width / weekly.length;
  // A quiet history has no busiest week to label.
  const busiest = max > 0 ? weekly.indexOf(max) : -1;
  const total = weekly.reduce((sum, count) => sum + count, 0);
  return renderCard({
    theme,
    ...GRID_CARD,
    title: 'Contributions per week',
    description: `${total} contributions over ${weekly.length} weeks${busiest >= 0 ? `, busiest week ${max}` : ''}`,
    css: animated
      ? `.bar { transform-box: fill-box; transform-origin: center bottom; animation: bar-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; } @keyframes bar-up { from { transform: scaleY(0); } }` +
        REDUCED_MOTION
      : '',
    body: [
      `<text class="label muted" x="442" y="35" text-anchor="end">${formatNumber(total)} in ${weekly.length} weeks</text>`,
      `<line x1="${chart.x}" y1="${chart.y + chart.height}" x2="${chart.x + chart.width}" y2="${chart.y + chart.height}" stroke="${theme.border}"/>`,
      ...weekly.map((count, i) => {
        const height = Math.max(1.5, max ? (count / max) * chart.height : 0);
        const motion = animated ? ` class="bar" ${delay(100 + i * 18)}` : '';
        return `<rect${motion} x="${(chart.x + i * step + 1).toFixed(1)}" y="${(chart.y + chart.height - height).toFixed(1)}" width="${(step - 2).toFixed(1)}" height="${height.toFixed(1)}" rx="1.5" fill="${theme.title}" fill-opacity="${i === busiest ? 1 : 0.55}"/>`;
      }),
      ...(busiest >= 0
        ? [
            `<text class="small" x="${(chart.x + busiest * step + step / 2).toFixed(1)}" y="${chart.y - 6}" text-anchor="middle">${formatNumber(max)}</text>`,
          ]
        : []),
      `<text class="small" x="${chart.x}" y="${chart.y + chart.height + 18}">a year ago</text>`,
      `<text class="small" x="${chart.x + chart.width}" y="${chart.y + chart.height + 18}" text-anchor="end">this week</text>`,
    ],
  });
}
