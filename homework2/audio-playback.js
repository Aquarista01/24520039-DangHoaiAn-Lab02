/** One-shot AudioBufferSourceNode player. Owns AnalyserNode and GainNode. */
export class AudioPlayback {
  constructor(audioContext) {
    if (!audioContext) throw new TypeError('AudioContext is required');
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 512; // 256 frequency bins (frequencyBinCount = fftSize / 2)
    this.analyser.smoothingTimeConstant = 0.75;
    this.gain = audioContext.createGain();
    this.gain.gain.value = 0.75;
    this.analyser.connect(this.gain);
    this.gain.connect(audioContext.destination);
    this.current = null;
    this.disposed = false;
  }

  setBins(count) {
    if (count !== 256 && count !== 512) throw new RangeError('Supported bins: 256 or 512');
    this.analyser.fftSize = count * 2;
  }

  setVolume(value) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError('Volume 0..1');
    this.gain.gain.value = value;
  }

  /** Resolve once the source ended or was stopped, never reuse a source node. */
  play(audioBuffer) {
    if (this.disposed || this.current) throw new Error('Player not ready');
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    return new Promise((resolve, reject) => {
      let settled = false;
      const finalize = (reason) => {
        if (settled) return;
        settled = true;
        source.onended = null;
        source.disconnect();
        source.buffer = null;
        if (this.current?.source === source) this.current = null;
        resolve(reason);
      };
      this.current = { source, finalize };
      source.onended = () => finalize('ended');
      try {
        source.start(0);
      } catch (error) {
        source.onended = null;
        source.disconnect();
        source.buffer = null;
        this.current = null;
        settled = true;
        reject(error);
      }
    });
  }

  stop() {
    if (!this.current) return;
    const { source, finalize } = this.current;
    source.onended = null; // prevent a synchronous/queued ended event from winning over Stop
    try { source.stop(0); } catch { /* already ended */ }
    finalize('stopped');
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.analyser.disconnect();
    this.gain.disconnect();
  }
}
