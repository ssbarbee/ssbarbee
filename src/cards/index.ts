import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  CONTRIBUTION_WEEKS,
  LANGS_COUNT,
  OUTPUT_DIR,
  PROFILE,
  THEMES,
  USERNAME,
  type Theme,
} from './config';
import { fetchContributionWeeks, fetchTopLanguages, fetchUserStats } from './github';
import { fetchSkopjeConditions } from './skopje';
import { renderAboutCard } from './svg/about';
import { renderBanner } from './svg/banner';
import { renderSkopjeCard } from './svg/skopje';
import { renderStatsCard } from './svg/stats';
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

  const jobs: CardJob[] = [
    card(
      'banner.svg',
      () => fetchContributionWeeks(token, USERNAME, CONTRIBUTION_WEEKS),
      (weeks, theme) => renderBanner(PROFILE, weeks, theme),
    ),
    card('about.svg', async () => PROFILE.about, renderAboutCard),
    // Weather comes from third-party APIs, so an outage should not fail the daily run.
    { ...card('skopje.svg', fetchSkopjeConditions, renderSkopjeCard), optional: true },
    card('stats.svg', () => fetchUserStats(token, USERNAME), renderStatsCard),
    card(
      'top-langs.svg',
      () => fetchTopLanguages(token, USERNAME),
      (languages, theme) => renderTopLanguagesCard(languages, theme, LANGS_COUNT),
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
