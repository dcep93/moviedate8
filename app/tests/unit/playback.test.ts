import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayback, positionAt, validKey } from '../../src/moviedate/playbackState.ts';

test('running playback extrapolates server time at the selected rate', () => {
  assert.equal(positionAt({ paused: false, currentTime: 10, playbackRate: 2, updatedAt: 1000, sender: 'a' }, 4000), 16);
});
test('paused, future timestamps and finite duration stay bounded', () => {
  const state = { paused: true, currentTime: 10, playbackRate: 1, updatedAt: 1000, sender: 'a' };
  assert.equal(positionAt(state, 5000), 10);
  assert.equal(positionAt({ ...state, paused: false }, 500), 10);
  assert.equal(positionAt({ ...state, paused: false }, 5000, 12), 12);
});
test('untrusted records reject invalid and missing values', () => {
  const state = { paused: false, currentTime: 3, playbackRate: 1.5, updatedAt: 123, sender: 'a' };
  assert.deepEqual(parsePlayback(state), state);
  for (const invalid of [null, {}, { ...state, currentTime: -1 }, { ...state, playbackRate: 0 }, { ...state, updatedAt: Infinity }, { ...state, paused: 'false' }]) assert.equal(parsePlayback(invalid), null);
});
test('keys cannot escape Firebase paths', () => {
  assert.equal(validKey('movie-one'), true);
  for (const key of ['', 'foo/bar', 'a.b', 'a#b', 'a$b', '[a]', 'a\nb']) assert.equal(validKey(key), false);
});


test('action revisions survive parsing and must be positive safe integers', () => {
  const state = { paused: false, currentTime: 3, playbackRate: 1.5, updatedAt: 123, sender: 'a', actionRevision: 7 };
  assert.deepEqual(parsePlayback(state), state);
  for (const actionRevision of [0, -1, 1.5, Infinity, '7']) assert.equal(parsePlayback({ ...state, actionRevision }), null);
});
