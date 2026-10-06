import type { Theme } from '../config';
import type { Language } from '../github';
import { escapeXml, renderCard } from './common';

const BAR = { x: 25, y: 55, width: 250, height: 8 };

export function renderTopLanguagesCard(languages: Language[], theme: Theme, count: number): string {
  const shown = languages.slice(0, count);
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
    const segment = `<rect x="${BAR.x + barOffset}" y="${BAR.y}" width="${width}" height="${BAR.height}" fill="${color}"/>`;
    barOffset += width;
    return segment;
  });

  return renderCard({
    theme,
    width: 300,
    height: 90 + rowsPerColumn * 25,
    title: 'Most Used Languages',
    description: items.map(({ name, share }) => `${name} ${(share * 100).toFixed(2)}%`).join(', '),
    body: [
      `<clipPath id="bar"><rect x="${BAR.x}" y="${BAR.y}" width="${BAR.width}" height="${BAR.height}" rx="5"/></clipPath>`,
      `<g clip-path="url(#bar)">${bar.join('')}</g>`,
      ...items.map(({ name, color, share }, i) => {
        const x = 25 + Math.floor(i / rowsPerColumn) * 150;
        const y = 80 + (i % rowsPerColumn) * 25;
        return [
          `<circle cx="${x + 5}" cy="${y + 6}" r="5" fill="${color}"/>`,
          `<text class="label" x="${x + 15}" y="${y + 10}">${escapeXml(name)} ${(share * 100).toFixed(2)}%</text>`,
        ].join('');
      }),
    ],
  });
}
