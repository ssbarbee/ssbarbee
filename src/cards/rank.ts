// Port of calculateRank from github-readme-stats, so the grade stays comparable to the old card.
// Commits are counted for the last year only, hence the 250 commits median.

export interface RankInput {
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  stars: number;
  followers: number;
}

export interface Rank {
  level: string;
  percentile: number;
}

const exponentialCdf = (x: number): number => 1 - 2 ** -x;

const logNormalCdf = (x: number): number => x / (1 + x);

const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
const LEVELS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];

export function calculateRank({
  commits,
  prs,
  issues,
  reviews,
  stars,
  followers,
}: RankInput): Rank {
  const weighted = [
    { weight: 2, score: exponentialCdf(commits / 250) },
    { weight: 3, score: exponentialCdf(prs / 50) },
    { weight: 1, score: exponentialCdf(issues / 25) },
    { weight: 1, score: exponentialCdf(reviews / 2) },
    { weight: 4, score: logNormalCdf(stars / 50) },
    { weight: 1, score: logNormalCdf(followers / 10) },
  ];
  const totalWeight = weighted.reduce((sum, { weight }) => sum + weight, 0);
  const score = weighted.reduce((sum, { weight, score }) => sum + weight * score, 0);

  const percentile = (1 - score / totalWeight) * 100;
  const level = LEVELS[THRESHOLDS.findIndex((threshold) => percentile <= threshold)];

  return { level, percentile };
}
