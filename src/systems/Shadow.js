// src/systems/Shadow.js — "as Sombras" (perigo). Engenharia (spec: enemy-ai/difficulty + art).
// Véus de sombra ESTÁTICOS no mundo adormecido. Dentro deles a barra de luz DRENA (nunca mata —
// GAME_BIBLE §7.3). A luz da centelha abre um halo seguro: grande atravessa véus finos, pequena
// desvia. Os véus RECUAM/esmaecem diante da centelha. Leitura: massa escura, fosca, fria, SEM bloom
// (o anti-coletável). 2 draw calls (discos no chão + domos), via InstancedMesh.
import * as THREE from 'three';
import { BAL } from '../config/balance.js';

const YUP = new THREE.Vector3(0, 1, 0);

// textura do véu: escuro no centro, borda fria mais clara (lê como "buraco no mundo")
function veilTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(4,7,9,0.92)');
  grad.addColorStop(0.62, 'rgba(8,12,16,0.72)');
  grad.addColorStop(0.86, 'rgba(40,52,64,0.34)'); // rim frio
  grad.addColorStop(1, 'rgba(40,52,64,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export default class Shadow {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    const S = BAL.shadow;
    this.n = S.count;
    this.x = new Float32Array(this.n);
    this.z = new Float32Array(this.n);
    this.r = new Float32Array(this.n);
    this.ph = new Float32Array(this.n);
    this.fade = new Float32Array(this.n).fill(1); // 1 cheio, 0 recuado

    // discos no chão (escurecem a cena — blending normal, fog:false p/ ler na névoa)
    const tex = veilTexture();
    this.discMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    this.discs = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), this.discMat, this.n);
    this.discs.frustumCulled = false;
    // domos baixos de "fumaça" escura (volume), bob lento
    this.domeMat = new THREE.MeshBasicMaterial({ color: '#0a0e12', transparent: true, opacity: 0.5, depthWrite: false });
    this.domes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), this.domeMat, this.n);
    this.domes.frustumCulled = false;
    scene.add(this.discs, this.domes);

    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._t = 0;
    this.presence = 1;
    this._seed();
  }

  _seed() {
    const S = BAL.shadow;
    const wr = BAL.game.worldRadius;
    for (let i = 0; i < this.n; i += 1) {
      let x; let z;
      do {
        const a = Math.random() * Math.PI * 2;
        const rr = S.innerClear + Math.sqrt(Math.random()) * (wr - S.innerClear - 4);
        x = Math.cos(a) * rr; z = Math.sin(a) * rr;
      } while (x * x + z * z < S.innerClear * S.innerClear);
      this.x[i] = x; this.z[i] = z;
      this.r[i] = S.rMin + Math.random() * (S.rMax - S.rMin);
      this.ph[i] = Math.random() * Math.PI * 2;
      this.fade[i] = 1;
    }
    this._writeAll();
  }

  /** novo bioma: reposiciona os véus. */
  reset() { this.presence = 1; this._seed(); }

  /** presença global 0..1 (cai conforme o mundo reacende — sombra some no mundo vivo). */
  setPresence(p) {
    this.presence = p;
    this.discMat.opacity = 0.9 * p;
    this.domeMat.opacity = 0.5 * p;
    this.discs.visible = p > 0.02;
    this.domes.visible = p > 0.02;
  }

  _writeAll() { for (let i = 0; i < this.n; i += 1) this._write(i); this._flush(); }

  _write(i) {
    const f = this.fade[i];
    // disco no chão (raio ~1.2x o raio de dano, p/ a borda fria respirar)
    this._q.setFromAxisAngle(YUP, this.ph[i]);
    const ds = this.r[i] * 1.25 * (0.7 + f * 0.3);
    this._s.set(ds, ds, ds);
    this._p.set(this.x[i], 0.18, this.z[i]);
    this._m.compose(this._p, this._q, this._s);
    this.discs.setMatrixAt(i, this._m);
    // domo de fumaça
    const hs = this.r[i] * 0.5 * f;
    const bob = Math.sin(this._t * 0.8 + this.ph[i]) * 0.6;
    this._s.set(this.r[i] * 0.8 * f, hs, this.r[i] * 0.8 * f);
    this._p.set(this.x[i], 1.4 + hs * 0.4 + bob, this.z[i]);
    this._m.compose(this._p, this._q, this._s);
    this.domes.setMatrixAt(i, this._m);
  }

  _flush() {
    this.discs.instanceMatrix.needsUpdate = true;
    this.domes.instanceMatrix.needsUpdate = true;
  }

  /**
   * Luz drenada da barra neste frame (>=0). haloR = raio seguro da centelha.
   * Penetração (quão fundo no véu, descontado o halo) escala o dreno.
   */
  drainAt(sx, sz, haloR) {
    let drain = 0;
    for (let i = 0; i < this.n; i += 1) {
      const eff = this.r[i] * this.fade[i] - haloR; // raio danoso efetivo
      if (eff <= 0) continue;
      const dx = this.x[i] - sx; const dz = this.z[i] - sz;
      const d = Math.hypot(dx, dz);
      if (d < eff) drain += BAL.shadow.drainPerSec * ((eff - d) / eff);
    }
    return drain * this.presence;
  }

  /** distância à borda do véu mais próximo (negativa = dentro), p/ o drone de perigo. */
  proximity(sx, sz) {
    let nearest = Infinity;
    for (let i = 0; i < this.n; i += 1) {
      const dx = this.x[i] - sx; const dz = this.z[i] - sz;
      const edge = Math.hypot(dx, dz) - this.r[i] * this.fade[i];
      if (edge < nearest) nearest = edge;
    }
    return nearest;
  }

  update(dt, sx, sz) {
    this._t += dt;
    const recede = BAL.shadow.recede;
    for (let i = 0; i < this.n; i += 1) {
      // recua um POUCO quando a centelha está perto (a luz parte a sombra, sem dissolvê-la)
      const dx = this.x[i] - sx; const dz = this.z[i] - sz;
      const d = Math.hypot(dx, dz);
      const t = Math.max(0, Math.min(1, (d - this.r[i]) / recede)); // 0 dentro -> 1 fora da influência
      const want = 0.7 + 0.3 * t;
      this.fade[i] += (want - this.fade[i]) * (1 - Math.exp(-2.5 * dt));
      this._write(i);
    }
    this._flush();
  }
}
