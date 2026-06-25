// src/systems/PointerInput.js — controle unificado mouse=toque (Pointer Events). Engenharia.
// O ponteiro relativo ao CENTRO da tela vira um vetor de direção no mundo (X=leste, Z=sul),
// magnitude [0,1] proporcional (centro=parado, zona morta). Mouse controla sempre (sem clicar);
// toque controla enquanto o dedo está na tela e PARA ao soltar.
import { BAL } from '../config/balance.js';
import { pointerToDir } from '../utils/control.js';

export default class PointerInput {
  /** @param {HTMLElement} dom */
  constructor(dom) {
    this._x = 0;
    this._z = 0;
    this._touchHeld = false;

    const onMove = (e) => {
      if (e.pointerType === 'touch' && !this._touchHeld) return;
      const reachPx = Math.min(window.innerWidth, window.innerHeight) * BAL.control.reach;
      const d = pointerToDir(e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2, reachPx, BAL.control.deadzone);
      this._x = d.x;
      this._z = d.z;
    };

    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') this._touchHeld = true; onMove(e); });
    const stop = (e) => { if (e.pointerType !== 'mouse') { this._touchHeld = false; this._x = 0; this._z = 0; } };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  /** Vetor de direção no mundo {x, z}, magnitude [0,1]. */
  dir() {
    return { x: this._x, z: this._z };
  }
}
