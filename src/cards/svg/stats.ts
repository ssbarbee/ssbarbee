import type { Theme } from '../config';
import type { UserStats } from '../github';
import { calculateRank } from '../rank';
import { ICONS, escapeXml, formatNumber, icon, renderCard } from './common';

const RANK = { x: 380.5, y: 110.5, radius: 40 };

export function renderStatsCard(stats: UserStats, theme: Theme): string {
  const rank = calculateRank(stats);
  const rows = [
    { icon: ICONS.star, label: 'Total Stars Earned:', value: stats.stars },
    { icon: ICONS.commits, label: 'Total Commits (last year):', value: stats.commits },
    { icon: ICONS.pullRequest, label: 'Total PRs:', value: stats.prs },
    { icon: ICONS.issue, label: 'Total Issues:', value: stats.issues },
    { icon: ICONS.repo, label: 'Contributed to (last year):', value: stats.contributedTo },
  ];
  const circumference = 2 * Math.PI * RANK.radius;
  const ring = `cx="${RANK.x}" cy="${RANK.y}" r="${RANK.radius}" fill="none" stroke="${theme.title}" stroke-width="6"`;

  return renderCard({
    theme,
    width: 467,
    height: 195,
    title: `${stats.name || stats.login}'s GitHub Stats`,
    description: [
      ...rows.map(({ label, value }) => `${label} ${value}`),
      `Rank: ${rank.level}`,
    ].join(', '),
    body: [
      ...rows.map(({ icon: path, label, value }, i) => {
        const y = 55 + i * 25;
        return [
          icon(path, 25, y),
          `<text class="stat" x="50" y="${y + 12.5}">${escapeXml(label)}</text>`,
          `<text class="stat" x="244" y="${y + 12.5}">${formatNumber(value)}</text>`,
        ].join('');
      }),
      `<circle ${ring} opacity="0.2"/>`,
      `<circle ${ring} opacity="0.8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${(circumference * rank.percentile) / 100}" transform="rotate(-90 ${RANK.x} ${RANK.y})"/>`,
      `<text class="rank" x="${RANK.x}" y="${RANK.y}" text-anchor="middle" dominant-baseline="central">${rank.level}</text>`,
    ],
  });
}
