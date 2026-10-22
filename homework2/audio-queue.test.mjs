import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioTaskQueue } from './audio-queue.js';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const buffer = () => new ArrayBuffer(16);
const response = (status = 200) => ({ ok: status < 400, status, arrayBuffer: async () => buffer() });
const audioContext = { decodeAudioData: async () => ({ duration: 1 }) };

function controlledFetch() {
  const calls = [];
  const waits = new Map();
  const fetchImpl = (url, { signal }) => new Promise((resolve, reject) => {
    calls.push(url);
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    waits.set(url, { resolve, reject });
  });
  return { calls, waits, fetchImpl };
}

test('FIFO dispatch with at most two active fetches', async () => {
  const f = controlledFetch();
  const q = new AudioTaskQueue({ audioContext, concurrency: 2, fetchImpl: f.fetchImpl });
  const a = q.enqueue('a'); const b = q.enqueue('b'); const c = q.enqueue('c');
  assert.deepEqual(f.calls, ['a', 'b']);
  assert.equal(q.activeCount, 2);
  assert.equal(q.pendingCount, 1);
  f.waits.get('b').resolve(response()); await b; await flush();
  assert.deepEqual(f.calls, ['a', 'b', 'c']);
  assert.equal(q.activeCount, 2);
  f.waits.get('a').resolve(response()); f.waits.get('c').resolve(response());
  await Promise.all([a, c]); await flush();
  assert.equal(q.activeCount, 0);
});

test('completion order may differ from FIFO start order', async () => {
  const f = controlledFetch();
  const q = new AudioTaskQueue({ audioContext, concurrency: 2, fetchImpl: f.fetchImpl });
  const results = [];
  const p1 = q.enqueue('first').then(() => results.push('first'));
  const p2 = q.enqueue('second').then(() => results.push('second'));
  f.waits.get('second').resolve(response()); await p2;
  f.waits.get('first').resolve(response()); await p1;
  assert.deepEqual(results, ['second', 'first']);
});

test('HTTP failure rejects one task and continues to the next', async () => {
  const q = new AudioTaskQueue({ audioContext, concurrency: 1, fetchImpl: async url => response(url === 'bad' ? 404 : 200) });
  const bad = q.enqueue('bad'); const good = q.enqueue('good');
  await assert.rejects(bad, /HTTP 404/);
  assert.equal((await good).duration, 1);
});

test('decode failure does not freeze the queue', async () => {
  let decodeCount = 0;
  const fake = { decodeAudioData: async () => { if (++decodeCount === 1) throw new Error('Unsupported audio'); return { duration: 3 }; } };
  const q = new AudioTaskQueue({ audioContext: fake, concurrency: 1, fetchImpl: async () => response() });
  const fail = q.enqueue('invalid.wav'); const success = q.enqueue('valid.wav');
  await assert.rejects(fail, /Unsupported audio/);
  assert.equal((await success).duration, 3);
});

test('cancel queued task before its fetch starts', async () => {
  const f = controlledFetch();
  const q = new AudioTaskQueue({ audioContext, concurrency: 1, fetchImpl: f.fetchImpl });
  const a = q.enqueueTask('active'); const b = q.enqueueTask('waiting');
  assert.equal(q.cancel(b.id), true);
  await assert.rejects(b.promise, { name: 'AbortError' });
  assert.deepEqual(f.calls, ['active']);
  f.waits.get('active').resolve(response()); await a.promise;
});

test('cancel active fetch frees worker and starts next task', async () => {
  const f = controlledFetch();
  const q = new AudioTaskQueue({ audioContext, concurrency: 1, fetchImpl: f.fetchImpl });
  const a = q.enqueueTask('a'); const b = q.enqueueTask('b');
  assert.equal(q.cancel(a.id), true);
  await assert.rejects(a.promise, { name: 'AbortError' });
  await flush(); assert.deepEqual(f.calls, ['a', 'b']);
  f.waits.get('b').resolve(response()); await b.promise;
});

test('cancelling during unabortable decode ignores its result', async () => {
  let releaseDecode;
  const fake = { decodeAudioData: () => new Promise(resolve => { releaseDecode = resolve; }) };
  const q = new AudioTaskQueue({ audioContext: fake, concurrency: 1, fetchImpl: async () => response() });
  const a = q.enqueueTask('a'); await flush();
  q.cancel(a.id);
  releaseDecode({ duration: 3 });
  await assert.rejects(a.promise, { name: 'AbortError' });
});

test('dispose rejects pending and active tasks and blocks enqueue', async () => {
  const f = controlledFetch();
  const q = new AudioTaskQueue({ audioContext, concurrency: 1, fetchImpl: f.fetchImpl });
  const a = q.enqueueTask('a'); const b = q.enqueueTask('b');
  q.dispose(); q.dispose();
  await assert.rejects(a.promise, { name: 'AbortError' });
  await assert.rejects(b.promise, { name: 'AbortError' });
  assert.throws(() => q.enqueue('c'), /disposed/);
});

test('bad inputs are rejected', () => {
  assert.throws(() => new AudioTaskQueue({ audioContext, concurrency: 0 }), /Concurrency/);
  const q = new AudioTaskQueue({ audioContext });
  assert.throws(() => q.enqueue(''), /non-empty/);
  assert.throws(() => q.enqueue('data:audio/wav;base64,AAA'), /Unsafe/);
});
