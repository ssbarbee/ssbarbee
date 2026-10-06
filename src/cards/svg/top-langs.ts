import type { Theme } from '../config';
import type { Language } from '../github';
import { GRID_CARD, escapeXml, renderCard } from './common';
import { FADE_IN, GROW_X, REDUCED_MOTION, delay } from './motion';

const BAR = { x: 25, y: 55, width: GRID_CARD.width - 50, height: 8 };
const COLUMN_WIDTH = 220;
// Two columns of four rows fill the fixed-size card.
const MAX_LANGUAGES = 8;

export function renderTopLanguagesCard(
  languages: Language[],
  theme: Theme,
  count: number,
  { animated = false }: { animated?: boolean } = {},
): string {
  const shown = languages.slice(0, Math.min(count, MAX_LANGUAGES));
  const total = shown.reduce((sum, { size }) => sum + size, 0);
  if (!total) {
    throw new Error('No languages found');
  }

  // Two columns, filled top to bottom.
  const rowsPerColumn = Math.ceil(shown.length / 2);
  const items = shown.map(({ name, color, size }) => ({
    name,
    color: color ?? theme.muted,
    share: size / total,
  }));

  let barOffset = 0;
  const bar = items.map(({ color, share }) => {
    const width = share * BAR.width;
    const motion = animated ? ` class="grow-x" ${delay(200 + barOffset * 2)}` : '';
    const segment = `<rect${motion} x="${BAR.x + barOffset}" y="${BAR.y}" width="${width}" height="${BAR.height}" fill="${color}"/>`;
    barOffset += width;
    return segment;
  });

  return renderCard({
    theme,
    ...GRID_CARD,
    title: 'Most Used Languages',
    css: animated ? GROW_X + FADE_IN + REDUCED_MOTION : '',
    description: items.map(({ name, share }) => `${name} ${(share * 100).toFixed(2)}%`).join(', '),
    body: [
      `<clipPath id="bar"><rect x="${BAR.x}" y="${BAR.y}" width="${BAR.width}" height="${BAR.height}" rx="5"/></clipPath>`,
      `<g clip-path="url(#bar)">${bar.join('')}</g>`,
      ...items.map(({ name, color, share }, i) => {
        const x = 25 + Math.floor(i / rowsPerColumn) * COLUMN_WIDTH;
        const y = 80 + (i % rowsPerColumn) * 25;
        return [
          `<g${animated ? ` class="fade-in" ${delay(400 + i * 90)}` : ''}>`,
          `<circle cx="${x + 5}" cy="${y + 6}" r="5" fill="${color}"/>`,
          `<text class="label" x="${x + 15}" y="${y + 10}">${escapeXml(name)} ${(share * 100).toFixed(2)}%</text>`,
          '</g>',
        ].join('');
      }),
    ],
  });
}
