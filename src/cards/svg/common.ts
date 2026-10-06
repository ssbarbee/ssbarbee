import type { Theme } from '../config';

const FONT = "'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif";

const style = (theme: Theme) => `
  .header { font: 600 18px ${FONT}; fill: ${theme.title}; }
  .stat { font: 600 14px ${FONT}; fill: ${theme.text}; }
  .rank { font: 800 24px ${FONT}; fill: ${theme.text}; }
  .description { font: 400 13px ${FONT}; fill: ${theme.text}; }
  .label { font: 400 12px ${FONT}; fill: ${theme.text}; }
  .small { font: 400 10px ${FONT}; fill: ${theme.muted}; }
  .name { font: 700 40px ${FONT}; fill: ${theme.text}; }
  .role { font: 400 18px ${FONT}; fill: ${theme.title}; }
  .meta { font: 400 14px ${FONT}; fill: ${theme.muted}; }
  .temperature { font: 600 48px ${FONT}; fill: ${theme.text}; }
  .muted { fill: ${theme.muted}; }
  .strong { font-weight: 600; }
  .icon { fill: ${theme.icon}; }
`;

// 16px Octicons (MIT licensed, https://github.com/primer/octicons).
export const ICONS = {
  star: 'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z',
  commits:
    'M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z',
  pullRequest:
    'M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z',
  issue:
    'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z',
  repo: 'M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z',
  fork: 'M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z',
};

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatNumber(value: number): string {
  if (value < 1000) {
    return String(value);
  }
  const thousands = Math.round(value / 100) / 10;
  return thousands < 1000 ? `${thousands}k` : `${Math.round(value / 100000) / 10}M`;
}

// Rough width of a 12px character, used to space text the SVG cannot measure.
export const CHAR_WIDTH = 7;

export function textLength(text: string): number {
  return Array.from(text).length;
}

function splitLongWord(word: string, maxChars: number): string[] {
  const chars = Array.from(word);
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += maxChars) {
    parts.push(chars.slice(i, i + maxChars).join(''));
  }
  return parts;
}

// Greedy word wrap; the last allowed line ends with an ellipsis when text is cut off.
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    for (const part of word ? splitLongWord(word, maxChars) : []) {
      if (!current) {
        current = part;
      } else if (textLength(current) + 1 + textLength(part) <= maxChars) {
        current += ` ${part}`;
      } else {
        lines.push(current);
        current = part;
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  if (lines.length <= maxLines) {
    return lines;
  }

  const kept = lines.slice(0, maxLines);
  const last = Array.from(kept[maxLines - 1]);
  kept[maxLines - 1] = `${(last.length < maxChars ? last : last.slice(0, maxChars - 1)).join('')}…`;
  return kept;
}

export function icon(path: string, x: number, y: number): string {
  return `<path class="icon" fill-rule="evenodd" transform="translate(${x}, ${y})" d="${path}"/>`;
}

interface FrameOptions {
  width: number;
  height: number;
  title: string;
  description: string;
  theme: Theme;
  body: string[];
}

// A themed card background; the title is only announced to screen readers.
export function renderFrame({ width, height, title, description, theme, body }: FrameOptions) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escapeXml(title)}</title>`,
    `<desc id="desc">${escapeXml(description)}</desc>`,
    `<style>${style(theme)}</style>`,
    `<rect x="0.5" y="0.5" rx="6" width="${width - 1}" height="${height - 1}" fill="${theme.background}" stroke="${theme.border}"/>`,
    ...body,
    '</svg>',
    '',
  ].join('\n');
}

interface CardOptions extends FrameOptions {
  titleIcon?: string;
}

export function renderCard({ titleIcon, body, ...frame }: CardOptions) {
  return renderFrame({
    ...frame,
    body: [
      ...(titleIcon ? [icon(titleIcon, 25, 22)] : []),
      `<text class="header" x="${titleIcon ? 50 : 25}" y="35">${escapeXml(frame.title)}</text>`,
      ...body,
    ],
  });
}
