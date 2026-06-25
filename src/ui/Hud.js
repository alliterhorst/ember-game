// src/ui/Hud.js — HUD overlay DOM. Dono: ui-hud-designer.
// Barra de LUZ (enche ao absorver motas) + mensagem do reacender. Minimalista (P5: pouco texto).
import { PALETTE } from '../config/palette.js';

const CSS = `
.hud { position: fixed; inset: 0; pointer-events: none; font-family: ui-monospace, "Segoe UI", monospace; color: #fff; }
.hud-bar-wrap { position: absolute; left: 50%; bottom: 30px; transform: translateX(-50%); width: min(62vw, 340px); height: 9px; background: rgba(255,255,255,0.07); border-radius: 6px; overflow: hidden; }
.hud-bar { height: 100%; width: 0%; background: linear-gradient(90deg, ${PALETTE.sparkGlow}, ${PALETTE.ether}); border-radius: 6px; box-shadow: 0 0 14px ${PALETTE.sparkGlow}; transition: width 0.15s ease-out; }
.hud-msg { position: absolute; left: 0; right: 0; top: 30%; text-align: center; font-size: clamp(18px, 5vw, 28px); letter-spacing: 5px; opacity: 0; transition: opacity 0.7s ease; text-shadow: 0 0 18px ${PALETTE.flower}, 0 2px 4px #000; }
.hud-msg.show { opacity: 1; }
`;

export default class Hud {
  /** @param {HTMLElement} root */
  constructor(root) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = '<div class="hud-bar-wrap"><div class="hud-bar" id="ember-bar"></div></div><div class="hud-msg" id="ember-msg"></div>';
    root.appendChild(this.el);
    this.$bar = this.el.querySelector('#ember-bar');
    this.$msg = this.el.querySelector('#ember-msg');
  }

  setLight(frac) { this.$bar.style.width = `${Math.min(100, frac * 100)}%`; }

  flash(text, ms = 2400) {
    this.$msg.textContent = text;
    this.$msg.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.$msg.classList.remove('show'), ms);
  }
}
