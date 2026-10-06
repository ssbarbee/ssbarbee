import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumLanguages } from './github';

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
