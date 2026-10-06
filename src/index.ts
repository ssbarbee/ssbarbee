import { render } from 'mustache';
import { readFileSync, writeFileSync } from 'fs';

const MUSTACHE_MAIN_DIR = './main.mustache';

// Everything else on the profile is an SVG card rendered by src/cards.
function generateReadMe(): void {
  const refreshTime = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'Europe/Skopje',
  });
  writeFileSync('README.md', render(readFileSync(MUSTACHE_MAIN_DIR, 'utf8'), { refreshTime }));
}

generateReadMe();
