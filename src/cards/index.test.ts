import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCardJobs } from './index';

test('keeps the previous file of a failed card and still renders the rest', async () => {
  const written: string[] = [];

  const failures = await runCardJobs(
    [
      { file: 'ok.svg', render: async () => '<svg/>' },
      {
        file: 'broken.svg',
        render: async () => {
          throw new Error('Resource not accessible by integration');
        },
      },
      { file: 'later.svg', render: async () => '<svg/>' },
    ],
    (file) => written.push(file),
  );

  assert.deepEqual(written, ['ok.svg', 'later.svg']);
  assert.deepEqual(failures, ['broken.svg']);
});
