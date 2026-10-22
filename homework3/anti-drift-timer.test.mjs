import test from 'node:test';
import assert from 'node:assert/strict';
import { createAntiDriftTimer, formatRemaining } from './anti-drift-timer.js';

function fakeFrameClock(initial = 1000) {
  let t = initial; let id = 0;
  const pending = new Map(); const removed = new Set();
  return {
    now: () => t,
    requestFrame: fn => { pending.set(++id, fn); return id; },
    cancelFrame: key => { removed.add(key); pending.delete(key); },
    advance(ms) { t += ms; const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(fn => fn()); },
    get pending() { return pending.size; }, get removed() { return removed.size; }
  };
}

test('deadline rather than callback count controls remaining time after 5.3-second stall', () => {
  const clock = fakeFrameClock(); const values = [];
  createAntiDriftTimer(10000, n => values.push(n), clock);
  assert.equal(values[0], 10000);
  clock.advance(5300);
  assert.equal(values.at(-1), 4700);
  clock.advance(4900);
  assert.equal(values.at(-1), 0);
  assert.equal(clock.pending, 0);
});

test('timer never goes negative even if callback occurs late', () => {
  const clock = fakeFrameClock(); const values = [];
  createAntiDriftTimer(900, n => values.push(n), clock);
  clock.advance(30000);
  assert.deepEqual(values, [900, 0]);
});

test('cleanup cancels pending requestAnimationFrame callback', () => {
  const clock = fakeFrameClock(); const values = [];
  const cleanup = createAntiDriftTimer(2500, n => values.push(n), clock);
  cleanup(); clock.advance(8000);
  assert.deepEqual(values, [2500]);
  assert.equal(clock.pending, 0);
  assert.equal(clock.removed, 1);
});

test('avoid state thrashing: display tick emitted only on second changes', () => {
  const clock = fakeFrameClock(); const values = [];
  createAntiDriftTimer(3000, n => values.push(n), clock);
  for (let i = 0; i < 60; i++) clock.advance(16);
  assert.equal(values.length, 1);
  clock.advance(100);
  assert.equal(values.length, 2);
});

test('formatter clamps and rounds up remaining seconds', () => {
  assert.equal(formatRemaining(60300), '01:01');
  assert.equal(formatRemaining(-5), '00:00');
  assert.equal(formatRemaining(15000), '00:15');
});
