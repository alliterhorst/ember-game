// src/ui/EdgeCues.js — indicadores de borda (wayfinding). Dono: ui-hud-designer.
// Quando há objetivo (barra cheia), Corações FORA da tela ganham uma centelha discreta na margem
// apontando o rumo. Some quando o Coração entra em quadro (aí o próprio farol guia). Vocabulário
// de luz, não seta de HUD. Projeta a posição 3D->tela com a câmera.
import * as THREE from 'three';

const MARGIN = 34; // distância da borda (px)

const CSS = `
.edgecue { position: fixed; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #ffd9a0 45%, rgba(255,217,160,0) 72%);
  box-shadow: 0 0 12px #ffd9a0; pointer-events: none; opacity: 0; transition: opacity .35s ease; z-index: 6; }
.edgecue.on { opacity: .9; }
`;

export default class EdgeCues {
  /** @param {HTMLElement} root @param {number} max */
  constructor(root, max) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.dots = [];
    for (let i = 0; i < max; i += 1) {
      const d = document.createElement('div');
      d.className = 'edgecue';
      root.appendChild(d);
      this.dots.push(d);
    }
    this._v = new THREE.Vector3();
  }

  /**
   * @param {{x:number,z:number,aceso:boolean}[]} hearts
   * @param {THREE.Camera} camera @param {HTMLElement} canvas @param {boolean} active
   */
  update(hearts, camera, canvas, active) {
    const W = canvas.clientWidth; const H = canvas.clientHeight;
    for (let i = 0; i < this.dots.length; i += 1) {
      const dot = this.dots[i];
      const h = hearts[i];
      if (!active || !h || h.aceso) { dot.classList.remove('on'); continue; }
      this._v.set(h.x, 8, h.z).project(camera);
      let nx = this._v.x; let ny = this._v.y;
      const behind = this._v.z > 1;
      if (behind) { nx = -nx; ny = -ny; }
      const offScreen = behind || Math.abs(nx) > 1 || Math.abs(ny) > 1;
      if (!offScreen) { dot.classList.remove('on'); continue; }
      // projeta a direção na borda da tela (componente máxima = 1)
      const ax = Math.abs(nx) || 1e-4; const ay = Math.abs(ny) || 1e-4;
      const s = ax > ay ? 1 / ax : 1 / ay;
      let px = (nx * s * 0.5 + 0.5) * W;
      let py = (1 - (ny * s * 0.5 + 0.5)) * H;
      px = Math.max(MARGIN, Math.min(W - MARGIN, px));
      py = Math.max(MARGIN, Math.min(H - MARGIN, py));
      dot.style.left = `${px}px`;
      dot.style.top = `${py}px`;
      dot.classList.add('on');
    }
  }
}
