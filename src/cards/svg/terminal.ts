import type { Theme } from '../config';
import { MONO, escapeXml, renderFrame, textLength } from './common';
import { FADE_IN, REDUCED_MOTION, TYPING, delay } from './motion';

export interface TerminalInfo {
  user: string;
  host: string;
  monogram: string;
  rows: [string, string][];
}

const WIDTH = 824;
const CELL = { size: 15, gap: 3 };
const LINE = 20;
const KEY_WIDTH = 12;
const CHAR = 7.8;
const TRAFFIC_LIGHTS = ['#ff5f57', '#febc2e', '#28c840'];
const SWATCHES = [
  '#ff6b6b',
  '#fcc419',
  '#51cf66',
  '#22b8cf',
  '#339af0',
  '#cc5de8',
  '#f783ac',
  '#adb5bd',
];

// 5x7 bitmaps for the letters a monogram can use.
const GLYPHS: Record<string, string[]> = {
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
};

const MOTION_CSS = `
  .pixel { transform-box: fill-box; transform-origin: center; animation: pixel-in 0.4s ease-out both; }
  @keyframes pixel-in { from { opacity: 0; transform: scale(0.2); } }
  .cursor { animation: blink 1s steps(1) 6; }
  @keyframes blink { 50% { opacity: 0; } }
`;

function monogramCells(
  letters: string,
  theme: Theme,
  x: number,
  y: number,
  animated: boolean,
): string[] {
  const cells: string[] = [];
  Array.from(letters).forEach((letter, index) => {
    const glyph = GLYPHS[letter.toUpperCase()];
    if (!glyph) return;
    const offsetX = x + index * (5 * (CELL.size + CELL.gap) + CELL.size);
    glyph.forEach((row, r) =>
      Array.from(row).forEach((bit, c) => {
        // Lit pixels vary in strength like contribution days; unlit ones stay faintly visible.
        const strength = bit === '1' ? [1, 0.78, 0.55][(r * 3 + c + index) % 3] : 0.08;
        const motion = animated
          ? ` class="pixel" ${delay(200 + (index * 5 + c) * 40 + r * 25)}`
          : '';
        cells.push(
          `<rect${motion} x="${offsetX + c * (CELL.size + CELL.gap)}" y="${y + r * (CELL.size + CELL.gap)}" width="${CELL.size}" height="${CELL.size}" rx="2" fill="${theme.title}" fill-opacity="${strength}"/>`,
        );
      }),
    );
  });
  return cells;
}

export function renderTerminalCard(
  info: TerminalInfo,
  theme: Theme,
  { animated = false }: { animated?: boolean } = {},
): string {
  const command = 'neofetch';
  const promptX = 24;
  const prompt = `${info.host} ~ ❯`;
  const commandX = promptX + (textLength(prompt) + 1) * CHAR;
  const typingMs = command.length * 90;
  const outputStart = animated ? 500 + typingMs + 200 : 0;
  const textX = 260;
  const headerY = 98;
  const firstRowY = headerY + 30;
  const monogramTop = headerY - 10;
  const monogramBottom = monogramTop + 7 * (CELL.size + CELL.gap);
  // Tall enough for every row and for the 7-pixel-high monogram, with room for the bottom prompt.
  const height = Math.max(firstRowY + info.rows.length * LINE + 50, monogramBottom + 50);
  const identity = `${info.user}@${info.host}`;
  const line = (i: number) => (animated ? ` class="fade-in" ${delay(outputStart + i * 90)}` : '');

  return renderFrame({
    theme,
    width: WIDTH,
    height,
    title: `${info.user} terminal`,
    description: info.rows.map(([key, value]) => `${key}: ${value}`).join('. '),
    css: `
      .mono { font: 400 13px ${MONO}; fill: ${theme.text}; }
      .mono-key { font: 700 13px ${MONO}; fill: ${theme.title}; }
      .mono-dim { font: 400 13px ${MONO}; fill: ${theme.muted}; }
      .mono-title { font: 400 12px ${MONO}; fill: ${theme.muted}; }
      ${animated ? MOTION_CSS + TYPING + FADE_IN + REDUCED_MOTION : ''}
    `,
    body: [
      `<line x1="0" y1="32" x2="${WIDTH}" y2="32" stroke="${theme.border}"/>`,
      ...TRAFFIC_LIGHTS.map(
        (color, i) => `<circle cx="${20 + i * 18}" cy="16" r="5.5" fill="${color}"/>`,
      ),
      `<text class="mono-title" x="${WIDTH / 2}" y="20" text-anchor="middle">${escapeXml(info.user)} — zsh — 80×24</text>`,
      `<text class="mono-key" x="${promptX}" y="62">${escapeXml(prompt)}</text>`,
      `<text class="mono" x="${commandX}" y="62">${command}</text>`,
      ...(animated
        ? [
            `<rect class="typing" x="${commandX - 1}" y="48" width="${Math.ceil(command.length * CHAR) + 4}" height="20" fill="${theme.background}" style="animation-duration: ${typingMs}ms; animation-delay: 500ms; animation-timing-function: steps(${command.length})"/>`,
          ]
        : []),
      ...monogramCells(info.monogram, theme, 36, monogramTop, animated),
      `<g${line(0)}><text class="mono-key" x="${textX}" y="${headerY}">${escapeXml(identity)}</text>`,
      `<text class="mono-dim" x="${textX}" y="${headerY + 16}">${'─'.repeat(textLength(identity))}</text></g>`,
      ...info.rows.map(([key, value], i) => {
        const dots = '.'.repeat(Math.max(2, KEY_WIDTH - textLength(key)));
        return [
          `<g${line(i + 1)}>`,
          `<text class="mono-key" x="${textX}" y="${firstRowY + i * LINE}">${escapeXml(key)}</text>`,
          `<text class="mono-dim" x="${textX + (textLength(key) + 1) * CHAR}" y="${firstRowY + i * LINE}">${dots}</text>`,
          `<text class="mono" x="${textX + (KEY_WIDTH + 2) * CHAR}" y="${firstRowY + i * LINE}">${escapeXml(value)}</text>`,
          '</g>',
        ].join('');
      }),
      `<g${line(info.rows.length + 1)}>${SWATCHES.map(
        (color, i) =>
          `<rect x="${textX + i * 26}" y="${firstRowY + info.rows.length * LINE}" width="22" height="12" rx="2" fill="${color}"/>`,
      ).join('')}</g>`,
      `<text class="mono-key" x="${promptX}" y="${height - 14}">${escapeXml(prompt)}</text>`,
      `<rect${animated ? ' class="cursor"' : ''} x="${commandX}" y="${height - 26}" width="8" height="15" fill="${theme.text}" opacity="0.8"/>`,
    ],
  });
}
