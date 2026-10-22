/**
 * Concurrent FIFO loading and decoding queue.
 * FIFO guarantees task START order. With concurrency > 1,
 * completion may be out of order; the UI controls playback order.
 * @typedef {{id:number, url:string, controller:AbortController, resolve:Function, reject:Function, status:string}} AudioTask
 */

function abortError() {
  return new DOMException('Audio task cancelled', 'AbortError');
}

export class AudioTaskQueue {
  constructor({ audioContext, concurrency = 2, onEvent = () => {}, fetchImpl = fetch } = {}) {
    if (!audioContext || typeof audioContext.decodeAudioData !== 'function') {
      throw new TypeError('A valid AudioContext is required');
    }
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
      throw new RangeError('Concurrency must be an integer from 1 to 8');
    }
    if (typeof fetchImpl !== 'function' || typeof onEvent !== 'function') {
      throw new TypeError('fetchImpl and onEvent must be functions');
    }
    this.audioContext = audioContext;
    this.concurrency = concurrency;
    this.fetchImpl = (...args) => fetchImpl(...args);
    this.onEvent = onEvent;
    this.pending = [];
    this.active = new Map();
    this.nextId = 1;
    this.disposed = false;
  }

  get activeCount() { return this.active.size; }
  get pendingCount() { return this.pending.length; }

  /** Contract from assignment: URL -> Promise<AudioBuffer>. */
  enqueue(trackUrl) { return this.enqueueTask(trackUrl).promise; }

  /** UI extension: return task ID for per-task cancellation. */
  enqueueTask(trackUrl) {
    if (this.disposed) throw new Error('Queue has been disposed');
    if (typeof trackUrl !== 'string' || !trackUrl.trim()) {
      throw new TypeError('Track URL must be a non-empty string');
    }
    const url = trackUrl.trim();
    if (/^(javascript|data|file):/i.test(url)) {
      throw new TypeError('Unsafe or unsupported URL scheme');
    }
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    const task = {
      id: this.nextId++, url, controller: new AbortController(),
      resolve, reject, status: 'queued'
    };
    this.pending.push(task);
    this._emit(task, 'queued');
    this._pump();
    return { id: task.id, promise };
  }

  cancel(id) {
    const index = this.pending.findIndex(task => task.id === id);
    if (index !== -1) {
      const [task] = this.pending.splice(index, 1);
      task.controller.abort();
      task.reject(abortError());
      this._emit(task, 'cancelled');
      return true;
    }
    const task = this.active.get(id);
    if (task) {
      task.controller.abort();
      this._emit(task, 'cancelling');
      return true;
    }
    return false;
  }

  cancelAll() {
    // Copy IDs; cancel() mutates pending.
    for (const { id } of [...this.pending, ...this.active.values()]) this.cancel(id);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelAll();
  }

  _emit(task, status) {
    task.status = status;
    this.onEvent({ id: task.id, url: task.url, status, active: this.activeCount, waiting: this.pendingCount });
  }

  _pump() {
    while (!this.disposed && this.active.size < this.concurrency && this.pending.length) {
      const task = this.pending.shift();
      if (task.controller.signal.aborted) continue;
      this.active.set(task.id, task);
      this._process(task); // asynchronous; deliberately not awaited
    }
  }

  async _process(task) {
    const { signal } = task.controller;
    try {
      this._emit(task, 'fetching');
      const response = await this.fetchImpl(task.url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading audio`);
      const bytes = await response.arrayBuffer();
      if (signal.aborted) throw abortError();
      this._emit(task, 'decoding');
      // decodeAudioData has no reliable AbortSignal. Ignore its result when aborted.
      const audioBuffer = await this.audioContext.decodeAudioData(bytes);
      if (signal.aborted || this.disposed) throw abortError();
      this._emit(task, 'ready');
      task.resolve(audioBuffer);
    } catch (error) {
      const cancelled = signal.aborted || this.disposed || error?.name === 'AbortError';
      this._emit(task, cancelled ? 'cancelled' : 'error');
      task.reject(cancelled ? abortError() : error);
    } finally {
      this.active.delete(task.id);
      if (!this.disposed) this._pump();
    }
  }
}
