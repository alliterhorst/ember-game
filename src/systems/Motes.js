// src/systems/Motes.js — motas de luz (coletáveis). Engenharia.
// InstancedMesh (1 draw call), boiam e giram. Ao serem absorvidas, re-spawnam em outro lugar
// (sempre há luz pra coletar). Pura geometria — sem alocação por frame.
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';
import { BAL } from '../config/balance.js';

const YUP = new THREE.Vector3(0, 1, 0);

export default class Motes {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    const g = BAL.game;
    this.count = g.motesCount;
    const geo = new THREE.IcosahedronGeometry(0.3, 0);
    const mat = new THREE.MeshBasicMaterial({ color: PALETTE.ether }); // clara -> brilha no bloom
    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.x = new Float32Array(this.count);
    this.z = new Float32Array(this.count);
    this.phase = new Float32Array(this.count);
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3(1, 1, 1);
    this._t = 0;
    for (let i = 0; i < this.count; i += 1) this._place(i);
  }

  _place(i) {
    const g = BAL.game;
    const a = Math.random() * Math.PI * 2;
    const r = g.motesInner + Math.sqrt(Math.random()) * (g.motesOuter - g.motesInner);
    this.x[i] = Math.cos(a) * r;
    this.z[i] = Math.sin(a) * r;
    this.phase[i] = Math.random() * Math.PI * 2;
  }

  /** Posição (x,z) de uma mota — pro VFX de absorção. */
  posOf(i, out) { out.set(this.x[i], 0.9, this.z[i]); return out; }

  update(dt) {
    this._t += dt;
    for (let i = 0; i < this.count; i += 1) {
      const y = 0.85 + Math.sin(this._t * 2 + this.phase[i]) * 0.25;
      this._p.set(this.x[i], y, this.z[i]);
      this._q.setFromAxisAngle(YUP, this._t * 1.5 + this.phase[i]);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Retorna os índices absorvidos pela centelha (e re-spawna cada um). */
  collect(sparkX, sparkZ, absorbRadius) {
    const hit = [];
    const r2 = absorbRadius * absorbRadius;
    for (let i = 0; i < this.count; i += 1) {
      const dx = this.x[i] - sparkX;
      const dz = this.z[i] - sparkZ;
      if (dx * dx + dz * dz < r2) hit.push(i);
    }
    return hit;
  }

  respawn(i) { this._place(i); }
}
