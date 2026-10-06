import type { Theme } from '../config';
import { airQuality, type SkopjeConditions } from '../skopje';
import { CHAR_WIDTH, escapeXml, renderCard, textLength } from './common';

const NOT_AVAILABLE = 'n/a';

function formatReading(value: number | null, unit: string): string {
  return value === null ? NOT_AVAILABLE : `${Math.round(value)} ${unit}`;
}

function formatRounded(value: number, unit: string): string {
  return Number.isFinite(value) ? `${Math.round(value)}${unit}` : NOT_AVAILABLE;
}

export function renderSkopjeCard(conditions: SkopjeConditions, theme: Theme): string {
  const quality = airQuality(conditions.pm10, conditions.pm25);
  const qualityLabel = `Air quality: ${quality?.level ?? NOT_AVAILABLE}`;
  const qualityColor = quality?.color ?? theme.muted;
  const pillWidth = 34 + textLength(qualityLabel) * CHAR_WIDTH;
  const rows: [string, string][] = [
    ['Sunrise', conditions.sunrise],
    ['Sunset', conditions.sunset],
    ['Humidity', formatRounded(conditions.humidity, '%')],
    ['PM10', formatReading(conditions.pm10, 'µg/m³')],
    ['PM2.5', formatReading(conditions.pm25, 'µg/m³')],
  ];
  const temperature = formatRounded(conditions.temperature, '°C');

  return renderCard({
    theme,
    width: 467,
    height: 195,
    title: 'Skopje right now',
    description: `${temperature}, ${conditions.condition}. ${qualityLabel}.`,
    body: [
      `<text class="label muted" x="442" y="35" text-anchor="end">Updated ${escapeXml(conditions.updatedAt)}</text>`,
      `<text class="temperature" x="25" y="108">${temperature}</text>`,
      `<text class="description" x="27" y="134">${escapeXml(conditions.condition)}</text>`,
      `<text class="label muted" x="27" y="153">Feels like ${formatRounded(conditions.feelsLike, '°C')}</text>`,
      `<rect x="25" y="164" rx="11" width="${pillWidth}" height="22" fill="${qualityColor}" fill-opacity="0.2"/>`,
      `<circle cx="38" cy="175" r="4" fill="${qualityColor}"/>`,
      `<text class="label strong" x="48" y="179">${qualityLabel}</text>`,
      `<text class="small" x="442" y="179" text-anchor="end">Data: Open-Meteo · pulse.eco</text>`,
      ...rows.map(([label, value], i) => {
        // Readings end above the air quality pill, which can grow under this column.
        const y = 64 + i * 24;
        return [
          `<text class="label muted" x="235" y="${y}">${label}</text>`,
          `<text class="stat" x="320" y="${y}">${escapeXml(value)}</text>`,
        ].join('');
      }),
    ],
  });
}
