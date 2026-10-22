import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioPlayback } from './audio-playback.js';

function fakeContext() {
  const created = [];
  const makeNode = () => ({
    disconnected: 0,
    connect() {},
    disconnect() { this.disconnected++; }
  });
  const analyser = Object.assign(makeNode(), { fftSize: 512, smoothingTimeConstant: 0 });
  const gain = Object.assign(makeNode(), { gain: { value: 1 } });
  return {
    created, analyser, gain,
    destination: makeNode(),
    createAnalyser() { return analyser; },
    createGain() { return gain; },
    createBufferSource() {
      const node = Object.assign(makeNode(), {
        buffer: null, onended: null,
        startCount: 0, stopCount: 0,
        start() { this.startCount++; },
        stop() { this.stopCount++; this.onended?.(); },
        finish() { this.onended?.(); }
      });
      created.push(node);
      return node;
    }
  };
}

test('FFT config: 256 bins means fftSize 512; 512 bins means 1024', () => {
  const context = fakeContext();
  const p = new AudioPlayback(context);
  assert.equal(p.analyser.fftSize, 512);
  p.setBins(512);
  assert.equal(p.analyser.fftSize, 1024);
  assert.throws(() => p.setBins(128), /Supported bins/);
  p.dispose();
});

test('new AudioBufferSourceNode for every track and disconnect on ended', async () => {
  const context = fakeContext();
  const p = new AudioPlayback(context);
  const first = p.play({ duration: 1 });
  assert.equal(context.created.length, 1);
  context.created[0].finish();
  assert.equal(await first, 'ended');
  assert.equal(context.created[0].disconnected, 1);
  const second = p.play({ duration: 2 });
  assert.equal(context.created.length, 2);
  p.stop();
  assert.equal(await second, 'stopped');
  assert.equal(context.created[1].disconnected, 1);
  p.dispose();
  assert.equal(context.analyser.disconnected, 1);
  assert.equal(context.gain.disconnected, 1);
});

test('double play is rejected; dispose stops source and is idempotent', async () => {
  const p = new AudioPlayback(fakeContext());
  const one = p.play({ duration: 3 });
  assert.throws(() => p.play({ duration: 3 }), /not ready/);
  p.dispose();
  p.dispose();
  assert.equal(await one, 'stopped');
  assert.throws(() => p.play({ duration: 1 }), /not ready/);
});
