import type { Theme } from '../config';
import { GRID_CARD, escapeXml, renderCard, wrapText } from './common';

// Characters that fit between the bullet and the card edge at 14px.
const MAX_CHARS = 54;
const MAX_POINTS = 4;

export function renderAboutCard(points: string[], theme: Theme): string {
  const shown = points.filter((point) => point.trim());
  if (shown.length > MAX_POINTS) {
    throw new Error(`The About card fits at most ${MAX_POINTS} points, got ${shown.length}`);
  }

  return renderCard({
    theme,
    ...GRID_CARD,
    title: 'About',
    description: shown.join('. '),
    body: shown.map((point, i) => {
      const y = 76 + i * 28;
      const [line] = wrapText(point, MAX_CHARS, 1);
      return [
        `<circle cx="29" cy="${y - 5}" r="3" fill="${theme.title}"/>`,
        `<text class="body" x="42" y="${y}">${escapeXml(line)}</text>`,
      ].join('');
    }),
  });
}
