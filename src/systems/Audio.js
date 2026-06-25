// src/systems/Audio.js — áudio generativo via Web Audio. Dono: composer/sound-designer.
// Pad ambiente contemplativo + ping de absorver + swell do reacender. Sem assets.
// Requer um gesto do usuário pra iniciar (autoplay policy) — destrava no 1º pointer.
export default class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._started = false;
    const start = () => this.start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('pointermove', start, { once: true });
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') this.toggleMute(); });
  }

  start() {
    if (this._started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this._started = true;
    // pad ambiente DESLIGADO (estava soando como chiado). Trilha de verdade entra via composer.
    // this._pad();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
  }

  /** Pad/drone ambiente — acorde suave com leve movimento (contemplativo). */
  _pad() {
    const ctx = this.ctx;
    const freqs = [110, 164.81, 220, 277.18]; // A2, E3, A3, C#4 (suave)
    const pad = ctx.createGain();
    pad.gain.value = 0.12;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    pad.connect(filter).connect(this.master);
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      // leve LFO de detune pra dar vida
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2.5;
      lfo.connect(lfoGain).connect(o.detune);
      o.connect(pad);
      o.start();
      lfo.start();
    }
    this._padFilter = filter;
  }

  /** Ping curto e cristalino ao absorver uma mota. */
  absorb() {
    if (!this._started || this.muted) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(700 + Math.random() * 300, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.2);
  }

  /** Swell grande e luminoso no reacender (o pad "abre"). */
  reacender() {
    if (!this._started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    if (this._padFilter) {
      this._padFilter.frequency.setValueAtTime(700, t);
      this._padFilter.frequency.exponentialRampToValueAtTime(2600, t + 1.6); // o mundo "abre"
    }
    // acorde maior ascendente (luminoso)
    const chord = [261.63, 329.63, 392.0, 523.25]; // C maior
    chord.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const st = t + i * 0.08;
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.1, st + 0.25);
      g.gain.exponentialRampToValueAtTime(0.001, st + 2.2);
      o.connect(g).connect(this.master);
      o.start(st);
      o.stop(st + 2.4);
    });
  }
}
