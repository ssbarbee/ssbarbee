import { writeFileSync } from 'fs';
import { join } from 'path';
import { LANGS_COUNT, OUTPUT_DIR, PINNED_REPOS, USERNAME } from './config';
import { fetchRepo, fetchTopLanguages, fetchUserStats } from './github';
import { renderPinCard } from './svg/pin';
import { renderStatsCard } from './svg/stats';
import { renderTopLanguagesCard } from './svg/top-langs';

interface CardJob {
  file: string;
  render: () => Promise<string>;
}

// A card that fails to render keeps its previous file, so the README never shows an error card.
export async function runCardJobs(
  jobs: CardJob[],
  write: (file: string, svg: string) => void,
): Promise<string[]> {
  const failures: string[] = [];
  for (const { file, render } of jobs) {
    try {
      write(file, await render());
      console.log(`Generated ${file}`);
    } catch (error) {
      failures.push(file);
      const message = error instanceof Error ? error.message : String(error);
      console.error(`::error::Failed to generate ${file}: ${message}`);
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
    {
      file: 'stats.svg',
      render: async () => renderStatsCard(await fetchUserStats(token, USERNAME)),
    },
    {
      file: 'top-langs.svg',
      render: async () =>
        renderTopLanguagesCard(await fetchTopLanguages(token, USERNAME), LANGS_COUNT),
    },
    ...PINNED_REPOS.map((repo) => ({
      file: `pin-${repo}.svg`,
      render: async () => renderPinCard(await fetchRepo(token, USERNAME, repo)),
    })),
  ];

  const failures = await runCardJobs(jobs, (file, svg) =>
    writeFileSync(join(OUTPUT_DIR, file), svg),
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
