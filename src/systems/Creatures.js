// src/systems/Creatures.js — criaturas-luz que surgem ao reacender um Coração. Engenharia.
// Orbitam a região reacesa, dando vida (a narrativa sem texto). InstancedMesh (1 draw call).
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

const MAX = 30;
const YUP = new THREE.Vector3(0, 1, 0);

export default class Creatures {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    const geo = new THREE.OctahedronGeometry(0.4, 0);
    const mat = new THREE.MeshBasicMaterial({ color: PALETTE.bioglow });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.active = new Array(MAX).fill(false);
    this.cx = new Float32Array(MAX);
    this.cz = new Float32Array(MAX);
    this.rad = new Float32Array(MAX);
    this.ang = new Float32Array(MAX);
    this.spd = new Float32Array(MAX);
    this.h = new Float32Array(MAX);
    this.phase = new Float32Array(MAX);
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this.cursor = 0;
    this._t = 0;

    for (let i = 0; i < MAX; i += 1) {
      this._p.set(0, -999, 0);
      this._s.setScalar(0.001);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Faz surgir n criaturas orbitando (cx, cz). */
  spawn(cx, cz, n) {
    for (let k = 0; k < n; k += 1) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX;
      this.active[i] = true;
      this.cx[i] = cx; this.cz[i] = cz;
      this.rad[i] = 3 + Math.random() * 8;
      this.ang[i] = Math.random() * Math.PI * 2;
      this.spd[i] = (0.25 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1);
      this.h[i] = 4 + Math.random() * 9;
      this.phase[i] = Math.random() * Math.PI * 2;
    }
  }

  /** Some com todas as criaturas (novo bioma). */
  clear() {
    this.active.fill(false);
    this._p.set(0, -999, 0);
    this._s.setScalar(0.001);
    for (let i = 0; i < MAX; i += 1) {
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.cursor = 0;
  }

  update(dt) {
    this._t += dt;
    let any = false;
    for (let i = 0; i < MAX; i += 1) {
      if (!this.active[i]) continue;
      any = true;
      this.ang[i] += this.spd[i] * dt;
      const x = this.cx[i] + Math.cos(this.ang[i]) * this.rad[i];
      const z = this.cz[i] + Math.sin(this.ang[i]) * this.rad[i];
      const y = this.h[i] + Math.sin(this._t * 2 + this.phase[i]) * 1.3;
      const s = 0.32 + Math.sin(this._t * 5 + this.phase[i]) * 0.08;
      this._p.set(x, y, z);
      this._s.setScalar(s);
      this._q.setFromAxisAngle(YUP, this._t + this.phase[i]);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
