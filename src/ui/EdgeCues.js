// src/ui/EdgeCues.js — indicadores de borda (wayfinding). Dono: ui-hud-designer.
// Corações FORA da tela (com a barra cheia) ganham uma centelha na margem apontando o rumo.
// O LIMIAR (portal), depois do clímax, ganha o seu próprio indicador (branco/ciano, maior).
// Some quando o alvo entra em quadro (aí o próprio farol guia). Vocabulário de luz, não seta.
import * as THREE from 'three';

const MARGIN = 36; // distância da borda (px)

const CSS = `
.edgecue { position: fixed; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #ffd9a0 45%, rgba(255,217,160,0) 72%);
  box-shadow: 0 0 12px #ffd9a0; pointer-events: none; opacity: 0; transition: opacity .35s ease; z-index: 6; }
.edgecue.on { opacity: .9; }
.edgecue.portal { width: 22px; height: 22px; margin: -11px 0 0 -11px;
  background: radial-gradient(circle, #fff 0%, #cdfcff 42%, rgba(190,255,255,0) 72%);
  box-shadow: 0 0 18px #bfffff; animation: edgePulse 1.6s ease-in-out infinite; }
@keyframes edgePulse { 0%,100% { transform: scale(0.85); } 50% { transform: scale(1.15); } }
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
    this.portalDot = document.createElement('div');
    this.portalDot.className = 'edgecue portal';
    root.appendChild(this.portalDot);
    this._v = new THREE.Vector3();
  }

  /** Projeta (x,z) na borda da tela. Liga `dot` se o alvo estiver FORA de quadro; senão desliga. */
  _place(dot, x, z, camera, W, H) {
    this._v.set(x, 8, z).project(camera);
    let nx = this._v.x; let ny = this._v.y;
    const behind = this._v.z > 1;
    if (behind) { nx = -nx; ny = -ny; }
    const offScreen = behind || Math.abs(nx) > 1 || Math.abs(ny) > 1;
    if (!offScreen) { dot.classList.remove('on'); return; }
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

  /**
   * @param {{x:number,z:number,aceso:boolean}[]} hearts
   * @param {THREE.Camera} camera @param {HTMLElement} canvas @param {boolean} active
   * @param {{x:number,z:number}|null} portal limiar aberto (ou null)
   */
  update(hearts, camera, canvas, active, portal) {
    const W = canvas.clientWidth; const H = canvas.clientHeight;
    for (let i = 0; i < this.dots.length; i += 1) {
      const h = hearts[i];
      if (!active || !h || h.aceso) { this.dots[i].classList.remove('on'); continue; }
      this._place(this.dots[i], h.x, h.z, camera, W, H);
    }
    if (portal) this._place(this.portalDot, portal.x, portal.z, camera, W, H);
    else this.portalDot.classList.remove('on');
  }
}
