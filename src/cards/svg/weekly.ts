import type { Theme } from '../config';
import { GRID_CARD, formatNumber, renderCard } from './common';
import { REDUCED_MOTION, delay } from './motion';

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
    description: `${formatNumber(total)} contributions over ${weekly.length} weeks${busiest >= 0 ? `, busiest week ${max}` : ''}`,
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
