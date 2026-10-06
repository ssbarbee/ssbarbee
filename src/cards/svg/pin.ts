import type { Theme } from '../config';
import type { Repo } from '../github';
import {
  CHAR_WIDTH,
  ICONS,
  escapeXml,
  formatNumber,
  icon,
  renderCard,
  textLength,
  wrapText,
} from './common';

// Every pin card has the same height so the README grid stays aligned.
const DESCRIPTION = { maxChars: 52, maxLines: 3 };
const FOOTER_Y = 128;

export function renderPinCard(repo: Repo, theme: Theme): string {
  const description = (repo.description || 'No description provided').replace(
    /\[([^\]]*)\]\([^)]*\)/g,
    '$1',
  );
  const lines = wrapText(description, DESCRIPTION.maxChars, DESCRIPTION.maxLines);

  const footer: string[] = [];
  let x = 25;
  if (repo.language) {
    footer.push(
      `<circle cx="${x + 6}" cy="${FOOTER_Y - 4}" r="6" fill="${repo.language.color ?? theme.muted}"/>`,
      `<text class="label" x="${x + 18}" y="${FOOTER_Y}">${escapeXml(repo.language.name)}</text>`,
    );
    x += 18 + textLength(repo.language.name) * CHAR_WIDTH + 20;
  }
  const counters: [string, number][] = [
    [ICONS.star, repo.stars],
    [ICONS.fork, repo.forks],
  ];
  for (const [path, value] of counters) {
    const text = formatNumber(value);
    footer.push(
      icon(path, x, FOOTER_Y - 12),
      `<text class="label" x="${x + 20}" y="${FOOTER_Y}">${text}</text>`,
    );
    x += 20 + text.length * CHAR_WIDTH + 20;
  }

  return renderCard({
    theme,
    width: 400,
    height: 150,
    title: repo.name,
    description,
    titleIcon: ICONS.repo,
    body: [
      `<text class="description" x="25" y="50">${lines
        .map((line) => `<tspan x="25" dy="1.2em">${escapeXml(line)}</tspan>`)
        .join('')}</text>`,
      ...footer,
    ],
  });
}
