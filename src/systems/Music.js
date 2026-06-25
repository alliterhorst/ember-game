// src/systems/Music.js — trilha ADAPTATIVA com gravações reais (domínio público). Dono: composer.
// Não é mais síntese (soava monótona): streama orquestra/piano de verdade via Howler.
// Leito calmo na exploração (Satie — Gymnopédie nº1, PD) que dá lugar à orquestra dourada no
// clímax (Grieg — "Morning Mood", Czech National Symphony / Musopen, PD). Créditos em CREDITS.md.
import { Howl, Howler } from 'howler';

const BASE = import.meta.env.BASE_URL || '/';

export default class Music {
  constructor() {
    this._started = false;
    this.muted = false;
    this.reacendido = false;
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') this.toggleMute(); });
  }

  /** Chamar dentro de um gesto do usuário (autoplay policy) — destrava e começa o leito calmo. */
  start() {
    if (this._started) return;
    this._started = true;
    this.explore = new Howl({
      src: [`${BASE}assets/audio/satie-gymnopedie.ogg`], loop: true, volume: 0, html5: true,
    });
    this.climax = new Howl({
      src: [`${BASE}assets/audio/grieg-morning.ogg`], loop: true, volume: 0, html5: true, preload: false,
    });
    this.explore.play();
    this.explore.fade(0, 0.5, 3000); // entra suave
  }

  /** No clímax (bosque renasce): crossfade do leito calmo pra orquestra dourada. */
  setReacendido(on) {
    if (!this._started || on === this.reacendido) return;
    this.reacendido = on;
    if (on) {
      if (this.climax.state() === 'unloaded') this.climax.load();
      this.climax.play();
      this.climax.fade(0, 0.62, 5000); // o amanhecer entra
      this.explore.fade(this.explore.volume(), 0.1, 4000); // recua pra leito
    } else {
      this.climax.fade(this.climax.volume(), 0, 2500);
      this.explore.fade(this.explore.volume(), 0.5, 2500);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    Howler.mute(this.muted);
  }

  setIntensity() {} // compat (a dinâmica agora vem da própria gravação)
  getContext() { return Howler.ctx; }
}
