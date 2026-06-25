// src/systems/Music.js — Música generativa contemplativa (Web Audio puro)
// Composer: Estúdio Murmur. Inspiração: Journey, Gris, Monument Valley.
// Tom: contemplativo, esperançoso. Mundo adormecido que desperta.
// Estrutura: progressão harmônica + melodia esparsa + envelopes suaves + espaço/delay.

/**
 * Trilha sonora generativa.
 * Requer um gesto do usuário pra iniciar (autoplay policy).
 */
export default class Music {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._started = false;
    this._scheduler = null;
    this._intensity = 0; // 0 = adormecido, 1 = reaceso
    this._currentChordIndex = 0;

    // Escalas e acordes (tonalidade Am pentatônica + maior)
    this.SCALE = [
      // Am pentatônica: A, C, D, E, G (fundamental em A2 = 110Hz)
      110, // A2
      130.81, // C3
      146.83, // D3
      164.81, // E3
      196.0, // G3
      220, // A3
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.0, // G4
      440, // A4
    ];

    // Progressão de 4 acordes (cada um leva ~10s)
    // Base: Am - F - C - G (cíclico)
    // Notas em oitavas baixas (F2-F3) = contemplativo
    this.CHORDS = [
      // Am: A2, C3, E3
      { notes: [110, 130.81, 164.81], name: 'Am' },
      // F: F2, A2, C3
      { notes: [87.31, 110, 130.81], name: 'F' },
      // C: C2, E2, G2
      { notes: [65.41, 82.41, 98.0], name: 'C' },
      // G: G2, B2, D3
      { notes: [98.0, 123.47, 146.83], name: 'G' },
    ];

    // Bind listeners
    const start = () => this.start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('pointermove', start, { once: true });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.toggleMute();
    });
  }

  /**
   * Inicia o AudioContext e a reprodução musical.
   * Chamado após gesto do usuário (autoplay policy).
   */
  start() {
    if (this._started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4; // volume base contemplativo
    this.master.connect(this.ctx.destination);

    // Setup: filtro lowpass (abre ao reacender), delay (eco), master
    this._setupFX();

    this._started = true;
    this._scheduler = this._createScheduler();
    this._startHarmony();
    this._startMelody();
  }

  /**
   * Setup de efeitos: delay (eco), lowpass filter.
   */
  _setupFX() {
    // Delay/eco simples pra dar espaço (referência: ambient, sidechain do delay em feedback baixo)
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 2.0; // 2s de eco
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.value = 0.25; // feedback baixo (~25%)
    const dryWet = this.ctx.createGain();
    dryWet.gain.value = 0.15; // 15% de send ao delay (discreto)

    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(this.master);

    this.master.connect(dryWet);
    dryWet.connect(delay);

    // Lowpass filter no master (vai abrir ao reacender)
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2200; // algo médio-claro (adormecido é mais escuro)
    lowpass.Q.value = 0.7;

    // Encadeamento: harmonia/melodia -> lowpass -> master (com delay send)
    this._lowpass = lowpass;
    this.master.disconnect();
    this.master.connect(lowpass);
    lowpass.connect(this.ctx.destination);
  }

  /**
   * Scheduler simples para tocar notas no tempo.
   * Retorna função que agenda callbacks.
   */
  _createScheduler() {
    const scheduled = [];
    const process = () => {
      const now = this.ctx.currentTime;
      for (let i = scheduled.length - 1; i >= 0; i--) {
        const { time, fn } = scheduled[i];
        if (now >= time) {
          fn();
          scheduled.splice(i, 1);
        }
      }
      requestAnimationFrame(process);
    };
    process();
    return (time, fn) => scheduled.push({ time, fn });
  }

  /**
   * Progressão harmônica: troca de acordes a cada 10s.
   * Cada nota do acorde tem envelope suave (attack 1s, release 3s).
   */
  _startHarmony() {
    const nextChord = () => {
      const chord = this.CHORDS[this._currentChordIndex % this.CHORDS.length];
      this._playChord(chord.notes);
      this._currentChordIndex++;
      this._scheduler(this.ctx.currentTime + 10, nextChord);
    };
    nextChord();
  }

  /**
   * Toca um acorde: cada nota com envelope suave.
   */
  _playChord(frequencies) {
    frequencies.forEach((freq) => {
      this._playNote(freq, 1.0, 3.0, 0.1); // freq, attackTime, releaseTime, volume
    });
  }

  /**
   * Toca uma nota individual com envelope ADSR simplificado.
   * @param {number} freq - frequência em Hz
   * @param {number} attackTime - tempo de ataque (s)
   * @param {number} releaseTime - tempo de release (s)
   * @param {number} volume - amplitude (0-1)
   */
  _playNote(freq, attackTime, releaseTime, volume) {
    if (!this._started || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Oscilador sine (contemplativo, suave)
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Envelope: ataque suave, sustain, release longo
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attackTime);
    gain.gain.setValueAtTime(volume, t + attackTime); // sustain
    gain.gain.linearRampToValueAtTime(0, t + attackTime + releaseTime);

    // Conecta ao chain (com oscilação leve opcional)
    osc.connect(gain);
    gain.connect(this._lowpass);

    const stopTime = t + attackTime + releaseTime;
    osc.start(t);
    osc.stop(stopTime);
  }

  /**
   * Melodia esparsa: notas ocasionais (a cada 2.5-4s) da escala pentatônica.
   * Tom: sininos/harpa. Cada nota: decay rápido no ataque, release longo.
   */
  _startMelody() {
    const playMelodyNote = () => {
      // Escolhe uma nota aleatória da escala (restringindo a oitavas médias)
      const idx = Math.floor(Math.random() * (this.SCALE.length - 3)) + 3; // índices 3-10
      const freq = this.SCALE[idx];

      // Melodia: triangle (um pouco mais brilhante que sine), envelope rápido
      this._playNote(freq, 0.15, 2.5, 0.06); // mais curta e suave

      // Próxima nota entre 2.5 e 5 segundos
      const nextTime = 2.5 + Math.random() * 2.5;
      this._scheduler(this.ctx.currentTime + nextTime, playMelodyNote);
    };
    playMelodyNote();
  }

  /**
   * Ao reacender o mundo, a música fica mais luminosa.
   * Abre o filtro lowpass e aumenta um pouco o volume.
   */
  setReacendido(on = true) {
    if (!this._started || !this.ctx) return;

    const t = this.ctx.currentTime;
    this._intensity = on ? 1 : 0;

    // Abre o filtro lowpass (adormecido ~2200Hz -> reaceso ~3500Hz)
    const targetFreq = on ? 3500 : 2200;
    this._lowpass.frequency.linearRampToValueAtTime(targetFreq, t + 2.0);

    // Ligeira aumento de volume (contemplativo mas mais vivo)
    const targetGain = on ? 0.5 : 0.4;
    this.master.gain.linearRampToValueAtTime(targetGain, t + 1.5);
  }

  /**
   * Intensidade manual (0 = adormecido, 1 = reaceso).
   * Para futuros sistemas de "desperta gradual".
   */
  setIntensity(x) {
    if (!this._started || !this.ctx) return;
    x = Math.max(0, Math.min(1, x)); // clamp [0, 1]
    const t = this.ctx.currentTime;
    this._intensity = x;
    const freqRange = 2200 + (3500 - 2200) * x;
    const gainRange = 0.4 + (0.5 - 0.4) * x;
    this._lowpass.frequency.linearRampToValueAtTime(freqRange, t + 1.0);
    this.master.gain.linearRampToValueAtTime(gainRange, t + 1.0);
  }

  /**
   * Muta/desmuta (tecla M).
   */
  toggleMute() {
    if (!this._started) return;
    this.muted = !this.muted;
    this.master.gain.value = this.muted ? 0 : (0.4 + this._intensity * 0.1);
  }

  /**
   * Retorna o AudioContext (para integração com outros sistemas se necessário).
   */
  getContext() {
    return this.ctx;
  }

  /**
   * Retorna o nó master gain (para análise, visualizador, etc).
   */
  getMaster() {
    return this.master;
  }
}
