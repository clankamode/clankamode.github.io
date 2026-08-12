import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidPostDate, parseAudioTimingsJson } from '../scripts/generate-site-content.mjs';

test('isValidPostDate accepts real calendar dates only', () => {
  assert.equal(isValidPostDate('2026-02-20'), true);
  assert.equal(isValidPostDate('2024-02-29'), true);

  assert.equal(isValidPostDate('2026-02-30'), false);
  assert.equal(isValidPostDate('2025-02-29'), false);
  assert.equal(isValidPostDate('2026-13-01'), false);
  assert.equal(isValidPostDate('26-02-20'), false);
  assert.equal(isValidPostDate('2026/02/20'), false);
  assert.equal(isValidPostDate(''), false);
  assert.equal(isValidPostDate(null), false);
});

test('parseAudioTimingsJson requires a non-empty {start,end} array', () => {
  assert.deepEqual(parseAudioTimingsJson('[{"start":0,"end":1.5},{"start":1.5,"end":3}]'), [
    { start: 0, end: 1.5 },
    { start: 1.5, end: 3 },
  ]);

  assert.equal(parseAudioTimingsJson('[]'), null);
  assert.equal(parseAudioTimingsJson('not-json'), null);
  assert.equal(parseAudioTimingsJson('{"start":0,"end":1}'), null);
  assert.equal(parseAudioTimingsJson('[{"start":1,"end":0}]'), null);
  assert.equal(parseAudioTimingsJson('[{"start":-1,"end":1}]'), null);
  assert.equal(parseAudioTimingsJson('[{"start":"0","end":1}]'), null);
  assert.equal(parseAudioTimingsJson('[{"start":0}]'), null);
});
