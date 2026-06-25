// src/ui/Hud.js — HUD overlay DOM. Dono: ui-hud-designer.
// Barra de LUZ (enche ao absorver motas) + mensagem do reacender. Minimalista (P5: pouco texto).
import { PALETTE } from '../config/palette.js';

const CSS = `
.hud { position: fixed; inset: 0; pointer-events: none; font-family: ui-monospace, "Segoe UI", monospace; color: #fff; }
.hud-bar-wrap { position: absolute; left: 50%; bottom: 30px; transform: translateX(-50%); width: min(62vw, 340px); height: 9px; background: rgba(255,255,255,0.07); border-radius: 6px; overflow: hidden; }
.hud-bar { height: 100%; width: 0%; background: linear-gradient(90deg, ${PALETTE.sparkGlow}, ${PALETTE.ether}); border-radius: 6px; box-shadow: 0 0 14px ${PALETTE.sparkGlow}; transition: width 0.15s ease-out; }
.hud-msg { position: absolute; left: 0; right: 0; top: 30%; text-align: center; font-size: clamp(18px, 5vw, 28px); letter-spacing: 5px; line-height: 1.5; white-space: pre-line; opacity: 0; transition: opacity 0.7s ease; text-shadow: 0 0 18px ${PALETTE.flower}, 0 2px 4px #000; }
.hud-msg.show { opacity: 1; }
.hud-prog { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; align-items: center; }
.hud-heart { width: 13px; height: 13px; border-radius: 50%; background: rgba(255,255,255,0.12); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.18); transition: all .5s ease; }
.hud-heart.lit { background: ${PALETTE.flower}; box-shadow: 0 0 12px ${PALETTE.flower}; }
.hud-hint { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); font-size: 12px; letter-spacing: 2px; color: rgba(255,255,255,0.55); opacity: 0; transition: opacity .5s; }
.hud-hint.show { opacity: 1; }
`;

export default class Hud {
  /** @param {HTMLElement} root */
  constructor(root) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = '<div class="hud-prog" id="ember-prog"></div><div class="hud-bar-wrap"><div class="hud-bar" id="ember-bar"></div></div><div class="hud-hint" id="ember-hint"></div><div class="hud-msg" id="ember-msg"></div>';
    root.appendChild(this.el);
    this.$bar = this.el.querySelector('#ember-bar');
    this.$msg = this.el.querySelector('#ember-msg');
    this.$prog = this.el.querySelector('#ember-prog');
    this.$hint = this.el.querySelector('#ember-hint');
    this._total = 0;
  }

  setProgress(lit, total) {
    if (this._total !== total) {
      this._total = total;
      this.$prog.innerHTML = Array.from({ length: total }, () => '<div class="hud-heart"></div>').join('');
      this._hearts = [...this.$prog.children];
    }
    this._hearts.forEach((el, i) => el.classList.toggle('lit', i < lit));
  }

  hint(text) {
    if (text) { this.$hint.textContent = text; this.$hint.classList.add('show'); }
    else { this.$hint.classList.remove('show'); }
  }

  setLight(frac) { this.$bar.style.width = `${Math.min(100, frac * 100)}%`; }

  flash(text, ms = 2400) {
    this.$msg.textContent = text;
    this.$msg.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.$msg.classList.remove('show'), ms);
  }
}
