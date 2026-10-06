import { render } from 'mustache';
import { readFileSync, writeFileSync } from 'fs';
import { PROFILE } from './cards/config';

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
  // The About card is an image, so its points also go into the alt text for screen readers.
  const about = PROFILE.about.join('; ');
  writeFileSync(
    'README.md',
    render(readFileSync(MUSTACHE_MAIN_DIR, 'utf8'), { refreshTime, about }),
  );
}

generateReadMe();
