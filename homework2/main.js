import { createElement as h, renderToDOM } from '../mini-react.js';
import { setupEventDelegation } from '../delegation.js';
import { AudioTaskQueue } from './audio-queue.js';
import { AudioPlayback } from './audio-playback.js';
import { AudioVisualizer } from './visualizer.js';

const get = id => document.getElementById(id);
const nodes = {
  url: get('track-url'), form: get('track-form'),
  demo: get('load-demo'), play: get('play-all'), stop: get('stop-all'),
  clear: get('clear-history'), bins: get('fft-bins'), volume: get('volume'),
  table: get('queue-body'), status: get('app-status'),
  stats: get('queue-stats'), now: get('now-playing'), canvas: get('spectrum')
};

const fixtures = [
  { url: './audio/low.wav', label: 'Low Frequency • Bass Notes' },
  { url: './audio/mid.wav', label: 'Mid Frequency • Lead Notes' },
  { url: './audio/high.wav', label: 'High Frequency • Arpeggio' }
];

let context = null;
let queue = null;
let playback = null;
let visualizer = null;
let playGeneration = 0;
let playbackRunning = false;
let activeEntry = null;
let disposed = false;
let entries = [];

const terminalStates = new Set(['done', 'cancelled', 'error', 'skipped']);
const cancellableStates = new Set(['queued', 'fetching', 'decoding', 'ready', 'playing', 'cancelling']);

function notify(message) {
  if (!disposed) nodes.status.textContent = message;
}

function ensureAudio() {
  if (disposed) throw new Error('Application already closed');
  if (context) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('This browser does not support Web Audio API.');
  context = new AudioContextClass();
  playback = new AudioPlayback(context);
  playback.setBins(Number(nodes.bins.value));
  playback.setVolume(Number(nodes.volume.value));
  visualizer = new AudioVisualizer(nodes.canvas, playback.analyser);
  queue = new AudioTaskQueue({
    audioContext: context,
    concurrency: 2,
    onEvent(event) {
      const entry = entries.find(item => item.id === event.id);
      if (!entry || terminalStates.has(entry.status)) return;
      if (['queued', 'fetching', 'decoding', 'cancelling'].includes(event.status)) {
        entry.status = event.status;
      }
      render();
    }
  });
}

function checkUrl(input) {
  const parsed = new URL(input, window.location.href);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only local or HTTP(S) audio URLs are supported.');
  }
  return parsed.href;
}

function enqueueTrack(rawUrl, label = '') {
  ensureAudio();
  const url = checkUrl(rawUrl);
  const { id, promise } = queue.enqueueTask(url);
  const entry = {
    id, url, label: label || new URL(url).pathname.split('/').pop() || `Track ${id}`,
    status: queue.active.has(id) ? 'fetching' : 'queued',
    buffer: null, error: '', completion: null
  };
  entries.push(entry);
  entry.completion = promise.then(buffer => {
    if (!disposed && !terminalStates.has(entry.status)) {
      entry.buffer = buffer;
      entry.status = 'ready';
      render();
    }
    return true; // do not retain the decoded AudioBuffer in a settled Promise
  }, error => {
    if (!disposed && !terminalStates.has(entry.status)) {
      entry.status = error?.name === 'AbortError' ? 'cancelled' : 'error';
      entry.error = String(error?.message || error);
      render();
    }
    return false; // settle safely; no unhandled promise rejections
  });
  notify(`Added track #${id} to the FIFO queue.`);
  render();
  return entry;
}

function cancelTrack(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry || !cancellableStates.has(entry.status)) return;
  if (entry === activeEntry) {
    entry.status = 'skipped';
    entry.buffer = null;
    playback?.stop();
    visualizer?.stop();
    notify(`Skipped track #${id}.`);
  } else if (entry.status === 'ready') {
    entry.status = 'cancelled';
    entry.buffer = null;
    notify(`Removed ready track #${id} from playback.`);
  } else {
    queue?.cancel(id);
    entry.status = 'cancelling';
    notify(`Requested cancellation for track #${id}.`);
  }
  render();
}

function render() {
  if (disposed) return;
  const items = entries.length ? entries.map((entry, index) => {
    const cancelButton = cancellableStates.has(entry.status)
      ? h('button', {
          type: 'button', className: 'small-button',
          'aria-label': `Cancel track ${entry.id}`,
          onClick: () => cancelTrack(entry.id)
        }, entry.status === 'playing' ? 'Skip' : 'Cancel')
      : '—';
    return h('tr', { 'data-track-id': String(entry.id) },
      h('td', null, String(index + 1)),
      h('td', null, h('strong', null, entry.label), h('small', { className: 'track-url' }, entry.url)),
      h('td', null, h('span', { className: `pill pill-${entry.status}` }, entry.status)),
      h('td', null, cancelButton)
    );
  }) : [h('tr', null,
    h('td', { colspan: '4', className: 'empty-message' }, 'Queue is empty. Add a URL or load the local demo tracks.')
  )];
  nodes.table.replaceChildren(...items.map(vnode => renderToDOM(vnode, { delegateEvents: true })));
  const waiting = queue?.pendingCount || 0;
  const active = queue?.activeCount || 0;
  nodes.stats.textContent = `Total: ${entries.length} · Loading/decoding: ${active} · Waiting: ${waiting} · Concurrency: 2`;
  nodes.now.textContent = activeEntry?.status === 'playing'
    ? `Now playing: ${activeEntry.label}`
    : 'No track currently playing';
  nodes.play.disabled = playbackRunning || !entries.some(e => !terminalStates.has(e.status) && e.status !== 'playing');
  nodes.stop.disabled = !playbackRunning && !entries.some(e => !terminalStates.has(e.status));
  nodes.clear.disabled = playbackRunning || !entries.some(e => terminalStates.has(e.status));
}

async function startPlayback() {
  if (playbackRunning || !entries.length) return;
  const generation = ++playGeneration;
  playbackRunning = true;
  render();
  try {
    ensureAudio();
    // resume() is called directly inside the user click for autoplay permission.
    await context.resume();
  } catch (error) {
    if (generation === playGeneration) playbackRunning = false;
    notify(`Cannot start audio: ${error.message}`);
    render();
    return;
  }
  if (generation !== playGeneration || disposed) return;
  notify('Playing tracks in FIFO order as each decode completes.');
  render();

  // Later tasks may finish downloading first, but must wait for earlier entries.
  for (let i = 0; i < entries.length && generation === playGeneration; i++) {
    const entry = entries[i];
    if (terminalStates.has(entry.status)) continue;
    const succeeded = await entry.completion;
    if (generation !== playGeneration || disposed) break;
    if (!succeeded || entry.status !== 'ready' || !entry.buffer) continue;
    const decoded = entry.buffer;

    activeEntry = entry;
    entry.status = 'playing';
    render();
    try {
      visualizer.start();
      const reason = await playback.play(decoded);
      if (entry.status === 'playing') entry.status = reason === 'ended' ? 'done' : 'skipped';
    } catch (error) {
      entry.status = 'error';
      entry.error = error?.message || String(error);
    } finally {
      visualizer.stop();
      entry.buffer = null; // release decoded audio data reference
      if (activeEntry === entry) activeEntry = null;
      render();
    }
  }
  if (generation === playGeneration && !disposed) {
    playbackRunning = false;
    notify('Playback queue finished.');
    render();
  }
}

function stopAll() {
  playGeneration++;
  playbackRunning = false;
  queue?.cancelAll();
  playback?.stop();
  visualizer?.stop();
  for (const entry of entries) {
    if (!terminalStates.has(entry.status)) entry.status = 'cancelled';
    entry.buffer = null;
  }
  activeEntry = null;
  notify('Stopped playback and cancelled all outstanding tasks.');
  render();
}

function clearHistory() {
  if (playbackRunning) return;
  entries = entries.filter(entry => !terminalStates.has(entry.status));
  render();
  notify('Cleared finished, failed and cancelled tasks.');
}

function onVisibilityChange() {
  if (!visualizer) return;
  if (document.hidden) visualizer.stop();
  else if (activeEntry?.status === 'playing') visualizer.start();
}

function dispose() {
  if (disposed) return;
  stopAll();
  disposed = true;
  cleanupDelegation();
  document.removeEventListener('visibilitychange', onVisibilityChange);
  queue?.dispose();
  visualizer?.dispose();
  playback?.dispose();
  context?.close().catch(() => {});
}

const cleanupDelegation = setupEventDelegation(nodes.table);
nodes.form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const url = nodes.url.value.trim();
    if (!url) throw new Error('Enter an audio URL first.');
    enqueueTrack(url);
    nodes.url.value = '';
  } catch (error) {
    notify(`Unable to add audio: ${error.message}`);
  }
});
nodes.demo.addEventListener('click', () => {
  try {
    for (const sample of fixtures) enqueueTrack(sample.url, sample.label);
    notify('Added three local WAV samples. Press Start Playback.');
  } catch (error) {
    notify(`Demo loading failed: ${error.message}`);
  }
});
nodes.play.addEventListener('click', startPlayback);
nodes.stop.addEventListener('click', stopAll);
nodes.clear.addEventListener('click', clearHistory);
nodes.bins.addEventListener('change', () => {
  if (playback) {
    playback.setBins(Number(nodes.bins.value));
    visualizer.setAnalyserBins();
  }
  notify(`Analyser configured for ${nodes.bins.value} frequency bins.`);
});
nodes.volume.addEventListener('input', () => {
  if (playback) playback.setVolume(Number(nodes.volume.value));
});
document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('pagehide', dispose, { once: true });
render();
