export const USERNAME = 'ssbarbee';

// Text of the banner at the top of the README.
export const PROFILE = {
  name: 'Filip Bozhinovski',
  role: 'Product Engineer · Frontend-first · TypeScript & React',
  location: 'Skopje, North Macedonia · @ssbarbee',
};

// Repositories rendered as project cards (profile/<theme>/pin-<name>.svg), in README order.
export const PINNED_REPOS = [
  'iap-apple',
  'react-metamask-avatar',
  'app-store-ratings',
  'pulse-eco-garmin-widget',
];

export const LANGS_COUNT = 8;

// About six months of contributions in the banner.
export const CONTRIBUTION_WEEKS = 26;

export const OUTPUT_DIR = './profile';

export interface Theme {
  background: string;
  border: string;
  title: string;
  text: string;
  icon: string;
  muted: string;
}

// Every card is rendered once per theme into profile/<theme>/, matching GitHub's light and dark modes.
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
