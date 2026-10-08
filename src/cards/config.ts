export const USERNAME = 'ssbarbee';

// Text of the banner and the About card at the top of the README.
export const PROFILE = {
  name: 'Filip Bozhinovski',
  role: 'Product Engineer · Frontend-first · TypeScript & React',
  location: 'Skopje, North Macedonia · @ssbarbee',
  about: [
    'Exploring AI/ML tooling and integrations',
    'Open to collaborating on open source',
    'Ask me anything frontend: React, TypeScript, Next.js',
    'Off the keyboard: half-marathons and chess',
  ],
};

export const LANGS_COUNT = 8;

export const OUTPUT_DIR = './profile';

// The sky banner is published to GitHub Pages from here, not committed.
export const SKY_OUTPUT_DIR = './site';

export interface Theme {
  background: string;
  border: string;
  title: string;
  text: string;
  icon: string;
  muted: string;
}

// Every card is rendered once per theme into <output>/<theme>/ (profile/ daily, site/ hourly for the sky),
// matching GitHub's light and dark modes.
export const THEMES: { light: Theme; dark: Theme } = {
  light: {
    background: '#f6f8fa',
    border: '#d1d9e0',
    title: '#0b7285',
    text: '#1f2328',
    icon: '#0969da',
    muted: '#59636e',
  },
  dark: {
    background: '#151b23',
    border: '#3d444d',
    title: '#7cebf5',
    text: '#e6edf3',
    icon: '#4493f8',
    muted: '#9198a1',
  },
};
