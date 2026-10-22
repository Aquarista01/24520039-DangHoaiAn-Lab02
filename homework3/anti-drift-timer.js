/**
 * Schedules display ticks against one absolute deadline, never subtracts 1000ms.
 * The callback is invoked on the first frame, whenever the rounded-up second
 * changes, and when the deadline is reached. Cancelling stops future frames.
 * Injected clock/frame methods make the behavior testable without a browser.
 */
export function createAntiDriftTimer(durationMs, onTick, {
  now = () => Date.now(),
  requestFrame = cb => requestAnimationFrame(cb),
  cancelFrame = id => cancelAnimationFrame(id)
} = {}) {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new RangeError('durationMs must be a non-negative finite number');
  }
  if (typeof onTick !== 'function') throw new TypeError('onTick must be a function');

  const deadline = now() + durationMs;
  let frameId = null;
  let stopped = false;
  let lastSecond = null;
  function tick() {
    if (stopped) return;
    const remainingMs = Math.max(0, deadline - now());
    const second = Math.ceil(remainingMs / 1000);
    if (lastSecond !== second) {
      lastSecond = second;
      onTick(remainingMs);
    }
    if (remainingMs > 0 && !stopped) frameId = requestFrame(tick);
    else { frameId = null; stopped = true; }
  }
  // First callback happens synchronously, so the starting time is visible at once.
  tick();
  return () => {
    if (stopped) return;
    stopped = true;
    if (frameId !== null) cancelFrame(frameId);
    frameId = null;
  };
}

export function formatRemaining(milliseconds) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
