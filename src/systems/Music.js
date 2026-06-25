// src/systems/Music.js — trilha ADAPTATIVA com gravações reais (domínio público). Dono: composer.
// Streama piano/orquestra de verdade via Howler. Cada bioma tem sua FAIXA de exploração
// (Bosque/Recife = Satie Gymnopédie; Dunas = Satie Gnossienne), com crossfade na troca de bioma.
// Clímax (qualquer bioma) = orquestra Grieg "Morning Mood". Tudo PD/CC — créditos em CREDITS.md.
import { Howl, Howler } from 'howler';

const BASE = import.meta.env.BASE_URL || '/';

export default class Music {
  constructor() {
    this._started = false;
    this.muted = false;
    this.reacendido = false;
    this.tracks = {};
    this._exploreName = 'satie-gymnopedie';
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') this.toggleMute(); });
  }

  _track(name) {
    if (!this.tracks[name]) {
      this.tracks[name] = new Howl({ src: [`${BASE}assets/audio/${name}.ogg`], loop: true, volume: 0, html5: true });
    }
    return this.tracks[name];
  }

  /** Chamar dentro de um gesto do usuário (autoplay policy) — destrava e começa o leito calmo. */
  start() {
    if (this._started) return;
    this._started = true;
    this.explore = this._track(this._exploreName);
    this.climax = new Howl({ src: [`${BASE}assets/audio/grieg-morning.ogg`], loop: true, volume: 0, html5: true, preload: false });
    this.explore.play();
    this.explore.fade(0, 0.5, 3000);
  }

  /** Troca a faixa de exploração ao mudar de bioma (lazy-load + crossfade). */
  setBiome(name) {
    if (!this._started || !name || name === this._exploreName) return;
    const old = this.explore;
    old.fade(old.volume(), 0, 2500);
    setTimeout(() => old.stop(), 2700);
    this._exploreName = name;
    this.explore = this._track(name);
    if (!this.explore.playing()) this.explore.play();
    this.explore.fade(this.explore.volume(), this.reacendido ? 0.1 : 0.5, 2500);
  }

  /** No clímax (bosque renasce): crossfade do leito calmo pra orquestra dourada. */
  setReacendido(on) {
    if (!this._started || on === this.reacendido) return;
    this.reacendido = on;
    if (on) {
      if (this.climax.state() === 'unloaded') this.climax.load();
      this.climax.play();
      this.climax.fade(0, 0.62, 5000);
      this.explore.fade(this.explore.volume(), 0.1, 4000);
    } else {
      this.climax.fade(this.climax.volume(), 0, 2500);
      this.explore.fade(this.explore.volume(), 0.5, 2500);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    Howler.mute(this.muted);
  }

  setIntensity() {}
  getContext() { return Howler.ctx; }
}
