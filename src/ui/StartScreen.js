// src/ui/StartScreen.js — tela inicial (overlay DOM). Dono: ui-hud-designer.
// Mostra título + premissa (textos de data/story.js) sobre o bosque adormecido que respira
// atrás. Um toque/clique/tecla acende a centelha e começa o jogo. Tom Gris/Journey.
import { PALETTE } from '../config/palette.js';
import { STORY } from '../data/story.js';

const CSS = `
.start { position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; padding: 24px;
  font-family: ui-monospace, "Segoe UI", monospace; color: #fff; cursor: pointer;
  background: radial-gradient(ellipse at 50% 46%, rgba(15,22,24,0.35) 0%, rgba(8,11,12,0.82) 62%, rgba(6,9,10,0.95) 100%);
  transition: opacity 1.3s ease; -webkit-tap-highlight-color: transparent; }
.start.hide { opacity: 0; pointer-events: none; }
.start-title { font-size: clamp(46px, 15vw, 104px); font-weight: 300; letter-spacing: 0.34em;
  margin: 0 0 0 0.34em; color: #fff; text-shadow: 0 0 34px ${PALETTE.sparkGlow}, 0 0 10px #fff;
  opacity: 0; animation: emberIn 2.4s ease 0.2s forwards; }
.start-sub { font-size: clamp(13px, 3.6vw, 17px); letter-spacing: 0.42em; margin-top: 14px;
  color: ${PALETTE.ether}; opacity: 0; animation: emberIn 2s ease 1.0s forwards; text-shadow: 0 0 12px ${PALETTE.ether}; }
.start-intro { margin-top: clamp(28px, 7vh, 60px); line-height: 2.1;
  font-size: clamp(14px, 4vw, 19px); color: rgba(255,255,255,0.82); }
.start-intro span { display: block; opacity: 0; transform: translateY(6px); }
.start-prompt { position: absolute; bottom: 13%; font-size: 13px; letter-spacing: 0.32em;
  color: rgba(255,255,255,0.62); opacity: 0; animation: emberIn 1.4s ease 3.2s forwards, promptPulse 2.6s ease-in-out 4.4s infinite; }
@keyframes emberIn { to { opacity: 1; transform: none; } }
@keyframes promptPulse { 0%,100% { opacity: 0.32; } 50% { opacity: 0.85; } }
`;

export default class StartScreen {
  /** @param {HTMLElement} root */
  constructor(root) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const intro = STORY.intro
      .map((line, i) => `<span style="animation: emberIn 1.6s ease ${1.6 + i * 0.7}s forwards">${line}</span>`)
      .join('');

    this.el = document.createElement('div');
    this.el.className = 'start';
    this.el.innerHTML =
      `<h1 class="start-title">${STORY.title}</h1>`
      + `<div class="start-sub">${STORY.subtitle}</div>`
      + `<div class="start-intro">${intro}</div>`
      + `<div class="start-prompt">${STORY.startPrompt}</div>`;
    root.appendChild(this.el);
    this._done = false;
  }

  /** Chama cb uma vez quando o jogador acende (toque/clique/tecla), e some a tela. */
  onStart(cb) {
    const fire = () => {
      if (this._done) return;
      this._done = true;
      this.el.classList.add('hide');
      window.removeEventListener('pointerdown', fire);
      window.removeEventListener('keydown', fire);
      setTimeout(() => { this.el.style.display = 'none'; }, 1400);
      cb();
    };
    window.addEventListener('pointerdown', fire);
    window.addEventListener('keydown', fire);
  }
}
