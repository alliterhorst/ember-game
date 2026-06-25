// src/systems/Forest.js — o Bosque (árvores low-poly via InstancedMesh). Engenharia + tech-artist-3d.
// Cada árvore tem cor própria (instanceColor) e um progresso lit[] (0 apagada -> 1 viva).
// reacenderArea() acende as árvores num raio: elas ganham cor E CRESCEM (a vida volta), com
// transição suave. Tudo em 2 draw calls.
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';
import { BAL } from '../config/balance.js';

const YUP = new THREE.Vector3(0, 1, 0);
const LEAF_SLEEP = new THREE.Color(PALETTE.leafSleep);
const LEAF_LIT = new THREE.Color(PALETTE.leafLit);
const TRUNK_SLEEP = new THREE.Color(PALETTE.treeSleep);
const TRUNK_LIT = new THREE.Color(PALETTE.trunkLit);
const COPA_R = [0.8, 1.0, 1.27]; // variação de raio de copa (quebra a linha das copas)

export default class Forest {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    const F = BAL.forest;
    const count = F.count;
    this.count = count;
    this.buryY = F.buryY;
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 2.4, 5);
    const copaGeo = new THREE.ConeGeometry(1.5, 3.8, 6);
    // material branco; a cor real vem do instanceColor (multiplicado)
    this.trunkMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true });
    this.copaMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true });
    this.trunks = new THREE.InstancedMesh(trunkGeo, this.trunkMat, count);
    this.copas = new THREE.InstancedMesh(copaGeo, this.copaMat, count);

    this.x = new Float32Array(count);
    this.z = new Float32Array(count);
    this.baseS = new Float32Array(count);
    this.sy = new Float32Array(count);
    this.ry = new Float32Array(count);
    this.copaR = new Float32Array(count);
    this.lit = new Float32Array(count); // 0 -> 1
    this.transit = new Uint8Array(count);

    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._c = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      // dois anéis: palco interno (espaçado) + muralha externa (adensa com o raio)
      let r;
      if (i / count < F.innerFrac) {
        r = F.inner + Math.sqrt(Math.random()) * (F.mid - F.inner);
      } else {
        // ^2 empurra árvores pra fora (muralha mais densa na borda)
        const t = Math.random() ** 0.65;
        r = F.mid + t * (F.outer - F.mid);
      }
      this.x[i] = Math.cos(a) * r;
      this.z[i] = Math.sin(a) * r;
      this.baseS[i] = 0.6 + Math.random() * 1.1; // faixa mais larga: marcos altos + sub-bosque
      this.sy[i] = 0.8 + Math.random() * 0.7;
      this.ry[i] = Math.random() * Math.PI * 2;
      this.copaR[i] = COPA_R[i % 3];
      this._writeMatrix(i);
      this.trunks.setColorAt(i, TRUNK_SLEEP);
      this.copas.setColorAt(i, LEAF_SLEEP);
    }
    this.trunks.instanceMatrix.needsUpdate = true;
    this.copas.instanceMatrix.needsUpdate = true;
    this.trunks.instanceColor.needsUpdate = true;
    this.copas.instanceColor.needsUpdate = true;
    scene.add(this.trunks, this.copas);
  }

  _writeMatrix(i) {
    const grow = 0.62 + this.lit[i] * 0.45; // árvore apagada é menor; cresce ao reacender
    const s = this.baseS[i] * grow;
    const sy = this.sy[i];
    const by = this.buryY; // base enterrada: crava no chão (sem isso "flutua")
    this._q.setFromAxisAngle(YUP, this.ry[i]);
    // tronco
    this._s.set(s, s * sy, s);
    this._p.set(this.x[i], by + 1.2 * s * sy, this.z[i]);
    this._m.compose(this._p, this._q, this._s);
    this.trunks.setMatrixAt(i, this._m);
    // copa (raio horizontal variado p/ quebrar a linha das copas)
    const cr = this.copaR[i];
    this._s.set(s * cr, s * sy, s * cr);
    this._p.set(this.x[i], by + (2.4 + 1.6) * s * sy, this.z[i]);
    this._m.compose(this._p, this._q, this._s);
    this.copas.setMatrixAt(i, this._m);
  }

  /** Marca as árvores dentro do raio pra reacenderem (transição em update). */
  reacenderArea(cx, cz, radius) {
    const r2 = radius * radius;
    for (let i = 0; i < this.count; i += 1) {
      if (this.lit[i] >= 1) continue;
      const dx = this.x[i] - cx;
      const dz = this.z[i] - cz;
      if (dx * dx + dz * dz < r2) this.transit[i] = 1;
    }
  }

  /** O clímax: marca TODAS as árvores ainda apagadas pra florescerem (o mundo renasce). */
  reacenderTudo() {
    for (let i = 0; i < this.count; i += 1) {
      if (this.lit[i] < 1) this.transit[i] = 1;
    }
  }

  /** Posição de uma árvore (na fração t do bosque), pra espalhar vida no clímax. {x,z}. */
  treeAt(t) {
    const i = Math.min(this.count - 1, Math.max(0, (this.count * t) | 0));
    return { x: this.x[i], z: this.z[i] };
  }

  update(dt) {
    let any = false;
    for (let i = 0; i < this.count; i += 1) {
      if (!this.transit[i]) continue;
      any = true;
      this.lit[i] = Math.min(this.lit[i] + dt * 0.7, 1);
      this.copas.setColorAt(i, this._c.copy(LEAF_SLEEP).lerp(LEAF_LIT, this.lit[i]));
      this.trunks.setColorAt(i, this._c.copy(TRUNK_SLEEP).lerp(TRUNK_LIT, this.lit[i]));
      this._writeMatrix(i);
      if (this.lit[i] >= 1) this.transit[i] = 0;
    }
    if (any) {
      this.trunks.instanceMatrix.needsUpdate = true;
      this.copas.instanceMatrix.needsUpdate = true;
      this.trunks.instanceColor.needsUpdate = true;
      this.copas.instanceColor.needsUpdate = true;
    }
  }
}
