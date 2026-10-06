const POLLUTION_URL = 'https://skopje.pulse.eco/rest/overall';

export interface Pollution {
  pm10: number | null;
  pm25: number | null;
}

// pulse.eco sends readings as strings and uses "N/A" for missing sensors.
export function parseReading(value: unknown): number | null {
  const reading = String(value ?? '').trim();
  const number = Number(reading);
  return reading && Number.isFinite(number) ? number : null;
}

export async function getPollution(): Promise<Pollution> {
  const response = await fetch(POLLUTION_URL, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    throw new Error(`pulse.eco responded with ${response.status} ${response.statusText}`);
  }
  const { values } = (await response.json()) as { values: Record<string, unknown> };
  return { pm10: parseReading(values.pm10), pm25: parseReading(values.pm25) };
}
