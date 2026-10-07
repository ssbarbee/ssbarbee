import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LANGS_COUNT, OUTPUT_DIR, PROFILE, THEMES, USERNAME, type Theme } from './config';
import {
  fetchContributionCalendar,
  fetchTopLanguages,
  fetchUserStats,
  weeklyTotals,
  type ContributionDay,
} from './github';
import { fetchSkopjeConditions, type SkopjeConditions } from './skopje';
import { renderAboutCard } from './svg/about';
import { renderBanner } from './svg/banner';
import { renderSkylineBanner } from './svg/skyline';
import { renderStatsCard } from './svg/stats';
import { renderWeeklyTile } from './svg/weekly';
import { renderTopLanguagesCard } from './svg/top-langs';

type Draw = (theme: Theme) => string;

interface CardJob {
  file: string;
  // A failed optional card keeps its previous files with a warning instead of failing the run.
  optional?: boolean;
  // Fetches the card's data once and returns a renderer for any theme.
  render: () => Promise<Draw>;
}

function card<T>(
  file: string,
  fetchData: () => Promise<T>,
  draw: (data: T, theme: Theme) => string,
): CardJob {
  return {
    file,
    render: async () => {
      const data = await fetchData();
      return (theme) => draw(data, theme);
    },
  };
}

const ANIMATED = { animated: true };

// The Skopje sky needs the weather; without it the banner falls back to the classic one.
export function drawBanner(
  { weeks, conditions }: { weeks: ContributionDay[][]; conditions: SkopjeConditions | null },
  theme: Theme,
): string {
  return conditions
    ? renderSkylineBanner(PROFILE, weeks, conditions, theme, ANIMATED)
    : renderBanner(PROFILE, weeks.slice(-26), theme, ANIMATED);
}

// A card that fails to render keeps its previous files, so the README never shows an error card.
export async function runCardJobs(
  jobs: CardJob[],
  themes: Record<string, Theme>,
  write: (path: string, svg: string) => void,
): Promise<string[]> {
  const failures: string[] = [];
  for (const { file, optional, render } of jobs) {
    try {
      const draw = await render();
      // Every theme renders before anything is written, so a rendering error leaves both untouched.
      const outputs = Object.keys(themes).map((name) => ({
        path: `${name}/${file}`,
        svg: draw(themes[name]),
      }));
      for (const { path, svg } of outputs) {
        write(path, svg);
      }
      console.log(`Generated ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (optional) {
        console.warn(`::warning::Kept the previous ${file}: ${message}`);
      } else {
        failures.push(file);
        console.error(`::error::Failed to generate ${file}: ${message}`);
      }
    }
  }
  return failures;
}

async function generateCards(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set');
  }

  // Every card animates once on load and stops; viewers who prefer reduced motion see it still.
  const animated = ANIMATED;
  // The sky banner and the weekly chart both read the contribution calendar, so it is fetched once.
  let calendar: Promise<ContributionDay[][]> | undefined;
  const contributionCalendar = () => (calendar ??= fetchContributionCalendar(token, USERNAME));

  const jobs: CardJob[] = [
    // Weather comes from third-party APIs: an outage draws the classic banner instead of the sky.
    card(
      'banner.svg',
      async () => {
        const [weeks, conditions] = await Promise.all([
          contributionCalendar(),
          fetchSkopjeConditions().catch((error) => {
            console.warn(`::warning::Weather not available, drawing the classic banner: ${error}`);
            return null;
          }),
        ]);
        return { weeks, conditions };
      },
      drawBanner,
    ),
    card(
      'about.svg',
      async () => PROFILE.about,
      (points, theme) => renderAboutCard(points, theme, animated),
    ),
    card(
      'stats.svg',
      () => fetchUserStats(token, USERNAME),
      (stats, theme) => renderStatsCard(stats, theme, animated),
    ),
    card(
      'top-langs.svg',
      () => fetchTopLanguages(token, USERNAME),
      (languages, theme) => renderTopLanguagesCard(languages, theme, LANGS_COUNT, animated),
    ),
    card(
      'weekly.svg',
      async () => weeklyTotals(await contributionCalendar()),
      (weekly, theme) => renderWeeklyTile(weekly, theme, animated),
    ),
  ];

  for (const name of Object.keys(THEMES)) {
    mkdirSync(join(OUTPUT_DIR, name), { recursive: true });
  }
  const failures = await runCardJobs(jobs, THEMES, (path, svg) =>
    writeFileSync(join(OUTPUT_DIR, path), svg),
  );
  if (failures.length) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  generateCards().catch((error: Error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
