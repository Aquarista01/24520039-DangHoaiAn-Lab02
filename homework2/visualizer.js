/** Visualize every frequency bin without changing application state per frame. */
export class AudioVisualizer {
  constructor(canvas, analyser) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('Canvas required');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('2D Canvas unavailable');
    this.analyser = analyser;
    this.data = new Uint8Array(analyser.frequencyBinCount);
    this.running = false;
    this.rafId = null;
    this.disposed = false;
    this.resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = this.canvas.clientWidth || 800;
      const height = this.canvas.clientHeight || 230;
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      this.drawIdle();
    };
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  setAnalyserBins() {
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
  }

  drawIdle() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0d1b30';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#283a56';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.83);
    ctx.lineTo(canvas.width, canvas.height * 0.83);
    ctx.stroke();
  }

  drawFrame = () => {
    if (!this.running || this.disposed) return;
    this.analyser.getByteFrequencyData(this.data);
    const { ctx, canvas, data } = this;
    this.drawIdle();
    const h = canvas.height;
    const width = canvas.width / data.length;
    const gap = Math.min(width * 0.2, 2);
    for (let i = 0; i < data.length; i++) {
      const magnitude = data[i] / 255;
      const barHeight = Math.max(1, magnitude * h * 0.78);
      ctx.fillStyle = `hsl(${190 + (i / data.length) * 70} 90% ${42 + magnitude * 23}%)`;
      ctx.fillRect(i * width, h - barHeight - h * 0.08, Math.max(0.3, width - gap), barHeight);
    }
    this.rafId = requestAnimationFrame(this.drawFrame);
  };

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.rafId = requestAnimationFrame(this.drawFrame);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.drawIdle();
  }

  dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    window.removeEventListener('resize', this.resize);
  }
}
