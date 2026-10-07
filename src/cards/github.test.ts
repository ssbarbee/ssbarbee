import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumLanguages, weeklyTotals } from './github';

test('sums language bytes across repositories, largest first', () => {
  const languages = sumLanguages([
    {
      languages: {
        edges: [
          { size: 100, node: { name: 'TypeScript', color: '#3178c6' } },
          { size: 10, node: { name: 'CSS', color: '#663399' } },
        ],
      },
    },
    {
      languages: {
        edges: [
          { size: 50, node: { name: 'CSS', color: '#663399' } },
          { size: 5, node: { name: 'Makefile', color: null } },
        ],
      },
    },
  ]);

  assert.deepEqual(languages, [
    { name: 'TypeScript', color: '#3178c6', size: 100 },
    { name: 'CSS', color: '#663399', size: 60 },
    { name: 'Makefile', color: null, size: 5 },
  ]);
});

test('ignores repositories without detected languages', () => {
  assert.deepEqual(sumLanguages([{ languages: { edges: [] } }, { languages: null }]), []);
});

test('adds up each week of the contribution calendar', () => {
  const fullWeek = Array.from({ length: 7 }, (_, i) => ({
    date: `2026-09-${27 + i}`,
    level: 'FIRST_QUARTILE' as const,
    count: i === 1 ? 34 : 1,
  }));

  assert.deepEqual(
    weeklyTotals([fullWeek, [{ date: '2026-10-04', level: 'FIRST_QUARTILE', count: 3 }]]),
    [40, 3],
  );
});

test('leaves out a partial first week so it does not look like a quiet one', () => {
  const day = (date: string, count: number) => ({ date, level: 'FIRST_QUARTILE' as const, count });
  const fullWeek = ['27', '28', '29', '30']
    .map((d) => day(`2026-09-${d}`, 1))
    .concat(['01', '02', '03'].map((d) => day(`2026-10-${d}`, 1)));

  assert.deepEqual(
    weeklyTotals([[day('2026-09-26', 5)], fullWeek, [day('2026-10-04', 2)]]),
    [7, 2],
  );
});
