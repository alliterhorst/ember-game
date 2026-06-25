// src/systems/Ambient.js — vida ambiente do Mundo Vivo. Engenharia (spec: art-director).
// Vaga-lumes que surgem nas zonas reacesas (a área que você acende ganha vida) e pólen-luz
// suspenso no ar (atmosfera). Tudo em THREE.Points aditivo (2 draw calls), zero alloc por frame.
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';
import { BAL } from '../config/balance.js';

// distribuição de cor dos vaga-lumes: ~60% bioglow, 30% ether, 10% flower (reforça paleta REACESA)
const FIRE_PALETTE = [
  PALETTE.bioglow, PALETTE.bioglow, PALETTE.bioglow,
  PALETTE.bioglow, PALETTE.bioglow, PALETTE.bioglow,
  PALETTE.ether, PALETTE.ether, PALETTE.ether,
  PALETTE.flower,
];

export default class Ambient {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    const A = BAL.ambient;
    this.A = A;
    this.firePalette = FIRE_PALETTE.slice(); // muda por bioma
    // --- vaga-lumes (surgem nas zonas reacesas) ---
    this.fMax = A.fireflies;
    this.fActive = new Uint8Array(this.fMax);
    this.hx = new Float32Array(this.fMax);
    this.hz = new Float32Array(this.fMax);
    this.hy = new Float32Array(this.fMax);
    this.phase = new Float32Array(this.fMax);
    this.driftR = new Float32Array(this.fMax);
    this.driftS = new Float32Array(this.fMax);
    this.br = new Float32Array(this.fMax);
    this.bg = new Float32Array(this.fMax);
    this.bb = new Float32Array(this.fMax);
    this.cursor = 0;

    const fpos = new Float32Array(this.fMax * 3).fill(-9999);
    const fcol = new Float32Array(this.fMax * 3);
    this.fGeo = new THREE.BufferGeometry();
    this.fGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    this.fGeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
    this.fMat = new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false,
    });
    this.fPts = new THREE.Points(this.fGeo, this.fMat);
    this.fPts.frustumCulled = false;
    scene.add(this.fPts);

    // --- pólen / poeira-luz (mundo todo; opacidade sobe com worldLight) ---
    this.pMax = A.pollen;
    const ppos = new Float32Array(this.pMax * 3);
    this.pvy = new Float32Array(this.pMax);
    for (let i = 0; i < this.pMax; i += 1) this._seedPollen(ppos, i);
    this.pGeo = new THREE.BufferGeometry();
    this.pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
    this.pMat = new THREE.PointsMaterial({
      size: 0.22, color: PALETTE.ether, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false,
    });
    this.pPts = new THREE.Points(this.pGeo, this.pMat);
    this.pPts.frustumCulled = false;
    scene.add(this.pPts);

    this._t = 0;
    this._c = new THREE.Color();
    this.drift = 'float';
  }

  _seedPollen(arr, i) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * this.A.spread;
    arr[i * 3] = Math.cos(a) * r;
    arr[i * 3 + 1] = Math.random() * 8;
    arr[i * 3 + 2] = Math.sin(a) * r;
    this.pvy[i] = 0.06 + Math.random() * 0.1;
  }

  _wake(i, x, z) {
    this.fActive[i] = 1;
    this.hx[i] = x; this.hz[i] = z;
    this.hy[i] = 0.6 + Math.random() * 5.4;
    this.phase[i] = Math.random() * Math.PI * 2;
    this.driftR[i] = 1.2 + Math.random() * 2.8;
    this.driftS[i] = this.A.driftMin + Math.random() * (this.A.driftMax - this.A.driftMin);
    const hex = this.firePalette[i % this.firePalette.length];
    this._c.set(hex);
    this.br[i] = this._c.r; this.bg[i] = this._c.g; this.bb[i] = this._c.b;
  }

  applyTheme(theme) {
    this.firePalette = [
      theme.bioglow, theme.bioglow, theme.bioglow, theme.bioglow, theme.bioglow, theme.bioglow,
      theme.ether, theme.ether, theme.ether, theme.flower,
    ];
    this.drift = theme.drift || 'float';
    this.pMat.color.set(theme.ether);
  }

  /** Limpa toda a vida ambiente (novo bioma). */
  reset() {
    this.fActive.fill(0);
    this.cursor = 0;
    const fp = this.fGeo.attributes.position.array;
    fp.fill(-9999);
    this.fGeo.attributes.position.needsUpdate = true;
    this.pMat.opacity = 0;
  }

  /** Acende n vaga-lumes numa zona reacesa (raio ao redor de cx,cz). */
  litArea(cx, cz, radius, n) {
    let woken = 0;
    for (let k = 0; k < this.fMax && woken < n; k += 1) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.fMax;
      if (this.fActive[i]) continue;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      this._wake(i, cx + Math.cos(a) * r, cz + Math.sin(a) * r);
      woken += 1;
    }
  }

  /** Clímax: espalha todos os vaga-lumes ainda apagados pelo bosque inteiro. */
  litAll() {
    for (let i = 0; i < this.fMax; i += 1) {
      if (this.fActive[i]) continue;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * this.A.spread;
      this._wake(i, Math.cos(a) * r, Math.sin(a) * r);
    }
  }

  /** opacidade do pólen acompanha a luz do mundo (0..1). */
  setWorldLight(w) { this.pMat.opacity = 0.42 * w; }

  update(dt) {
    this._t += dt;
    const t = this._t;
    const fp = this.fGeo.attributes.position.array;
    const fc = this.fGeo.attributes.color.array;
    let any = false;
    for (let i = 0; i < this.fMax; i += 1) {
      if (!this.fActive[i]) continue;
      any = true;
      const p3 = i * 3;
      const ph = this.phase[i];
      fp[p3] = this.hx[i] + Math.sin(t * this.driftS[i] + ph) * this.driftR[i];
      fp[p3 + 1] = this.hy[i] + Math.sin(t * 1.4 + ph) * this.A.bobAmp;
      fp[p3 + 2] = this.hz[i] + Math.cos(t * this.driftS[i] * 0.7 + ph) * this.driftR[i];
      const tw = 0.55 + (Math.sin(t * 3 + ph) * 0.5 + 0.5) * 0.45; // cintilar
      fc[p3] = this.br[i] * tw; fc[p3 + 1] = this.bg[i] * tw; fc[p3 + 2] = this.bb[i] * tw;
    }
    if (any) {
      this.fGeo.attributes.position.needsUpdate = true;
      this.fGeo.attributes.color.needsUpdate = true;
    }
    // pólen: deriva pra cima lenta + recicla
    if (this.pMat.opacity > 0.001) {
      const pp = this.pGeo.attributes.position.array;
      const side = this.drift === 'side';
      const up = this.drift === 'rise' ? 13 : 6; // Recife: bolhas sobem rápido
      for (let i = 0; i < this.pMax; i += 1) {
        if (side) { // Dunas: poeira varre na horizontal (vento)
          pp[i * 3] += dt * 4.5;
          pp[i * 3 + 1] += Math.sin(t + i) * dt * 0.25;
          if (pp[i * 3] > this.A.spread) pp[i * 3] = -this.A.spread;
        } else {
          pp[i * 3 + 1] += this.pvy[i] * dt * up;
          pp[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.15;
          if (pp[i * 3 + 1] > 9) this._seedPollen(pp, i);
        }
      }
      this.pGeo.attributes.position.needsUpdate = true;
    }
  }
}
