// src/systems/Audio.js — SFX via Web Audio. Dono: sound-designer.
// SFX em CAMADAS com reverb (convolution) e sub-bass — não mais "pings" secos.
// absorver = chime cristalino + intake (sobe de tom em sequência); reacender = evento
// cinematográfico (whoosh de antecipação + impacto sub-bass + sino com cauda longa + shimmer).
// A ambiência fica por conta da TRILHA (Music). Requer um gesto pra iniciar (autoplay policy).
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
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    // reverb compartilhado (dá "espaço" — tira o som seco de demo)
    this.reverb = this._makeReverb(2.8, 2.4);
    const rg = this.ctx.createGain();
    rg.gain.value = 0.85;
    this.reverb.connect(rg).connect(this.master);
    this._verb = this.reverb;
    this._absorbStreak = 0;
    this._lastAbsorb = -10;
    // drone de PERIGO (sub-grave que cresce com a proximidade da sombra) — sempre tocando, gain 0
    this.danger = ctx.createGain();
    this.danger.gain.value = 0;
    this.danger.connect(this.master);
    const df = ctx.createBiquadFilter();
    df.type = 'lowpass'; df.frequency.value = 150;
    df.connect(this.danger);
    [46, 69].forEach((f) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(df); o.start(); });
    this._started = true;
  }

  /** Nível de perigo 0..1 (proximidade da sombra) -> volume do drone grave. */
  setDanger(level) {
    if (!this._started) return;
    const v = this.muted ? 0 : Math.max(0, Math.min(1, level)) * 0.15;
    this.danger.gain.setTargetAtTime(v, this.ctx.currentTime, 0.18);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
  }

  /** impulse response procedural (ruído com decaimento) p/ convolution reverb. */
  _makeReverb(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * ((1 - i / len) ** decay);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  _noise(dur) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  /** Absorver uma mota: chime cristalino + intake; sobe de tom em coletas seguidas. */
  absorb() {
    if (!this._started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this._absorbStreak = (t - this._lastAbsorb > 1.1) ? 0 : Math.min(this._absorbStreak + 1, 12);
    this._lastAbsorb = t;
    const base = 660 * (2 ** (this._absorbStreak / 12)); // sobe ~1 semitom por coleta

    // chime (duas parciais, levemente desafinadas = brilho)
    [[1, 0.12], [2.01, 0.05]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(base * mult, t);
      o.frequency.exponentialRampToValueAtTime(base * mult * 1.5, t + 0.1);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g);
      g.connect(this.master);
      g.connect(this._verb);
      o.start(t);
      o.stop(t + 0.25);
    });

    // intake: ruído filtrado "puxando pra dentro"
    const n = this._noise(0.12);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = base * 2;
    nf.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.05, t + 0.04);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    n.connect(nf).connect(ng);
    ng.connect(this.master);
    n.start(t);
    n.stop(t + 0.13);
  }

  /** Reacender: whoosh de antecipação -> impacto sub-bass -> sino + shimmer com cauda longa. */
  reacender() {
    if (!this._started || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const hit = t + 0.62; // o instante da luz

    // (a) whoosh de antecipação (ruído subindo)
    const w = this._noise(1.0);
    const wf = ctx.createBiquadFilter();
    wf.type = 'lowpass';
    wf.frequency.setValueAtTime(300, t);
    wf.frequency.exponentialRampToValueAtTime(5200, hit);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0, t);
    wg.gain.linearRampToValueAtTime(0.13, hit - 0.02);
    wg.gain.exponentialRampToValueAtTime(0.001, hit + 0.3);
    w.connect(wf).connect(wg);
    wg.connect(this.master);
    wg.connect(this._verb);
    w.start(t);
    w.stop(t + 1.0);

    // (b) impacto com sub-bass (peso físico)
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(82, hit);
    sub.frequency.exponentialRampToValueAtTime(40, hit + 0.5);
    sg.gain.setValueAtTime(0, hit);
    sg.gain.linearRampToValueAtTime(0.55, hit + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.001, hit + 0.7);
    sub.connect(sg).connect(this.master);
    sub.start(hit);
    sub.stop(hit + 0.8);

    // (c) sino/cluster luminoso (acorde maior) com cauda longa de reverb
    [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const st = hit + i * 0.05;
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.09, st + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, st + 3.0);
      o.connect(g);
      g.connect(this.master);
      g.connect(this._verb);
      o.start(st);
      o.stop(st + 3.2);
    });

    // (d) shimmer ascendente (sparkle)
    for (let i = 0; i < 6; i += 1) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      const st = hit + i * 0.08;
      o.frequency.value = 880 * (2 ** (i / 6));
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.04, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.5);
      o.connect(g);
      g.connect(this._verb);
      o.start(st);
      o.stop(st + 0.55);
    }
  }
}
