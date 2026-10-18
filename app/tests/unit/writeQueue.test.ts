import test from 'node:test';
import assert from 'node:assert/strict';
import { WriteQueue } from '../../src/moviedate/WriteQueue.ts';
const settle = () => new Promise(resolve => setImmediate(resolve));

test('online actions remain ordered even when the first request is slow', async () => {
  const queue = new WriteQueue(); queue.setConnected(true);
  const order: number[] = [];
  let release!: () => void;
  const first = queue.run(async () => { await new Promise<void>(resolve => { release = resolve; }); order.push(1); });
  const second = queue.run(async () => { order.push(2); });
  await settle(); assert.deepEqual(order, []);
  release(); await Promise.all([first, second]); assert.deepEqual(order, [1, 2]);
});

test('disconnect aborts the in-flight request and rejects queued actions across reconnect', async () => {
  const queue = new WriteQueue(); queue.setConnected(true);
  const actions: string[] = [];
  const first = queue.run(signal => new Promise<void>((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const second = queue.run(async () => { actions.push('stale'); });
  const firstResult = assert.rejects(first, /aborted/);
  const secondResult = assert.rejects(second, /Disconnected/);
  await settle(); queue.setConnected(false); queue.setConnected(true);
  const fresh = queue.run(async () => { actions.push('fresh'); });
  await Promise.all([firstResult, secondResult, fresh]);
  assert.deepEqual(actions, ['fresh']);
});

test('offline calls never enter the queue and failed writes do not block later actions', async () => {
  const queue = new WriteQueue();
  await assert.rejects(queue.run(async () => { assert.fail('offline action ran'); }), /Disconnected/);
  queue.setConnected(true);
  await assert.rejects(queue.run(async () => { throw new Error('denied'); }), /denied/);
  let ran = false;
  await queue.run(async () => { ran = true; }); assert.equal(ran, true);
});
