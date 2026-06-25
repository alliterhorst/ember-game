// src/systems/Lurkers.js — "Espreitas": criaturas-sombra. Engenharia (spec: enemy-ai/difficulty).
// Vagam nas zonas escuras e FOGEM da luz (steering XZ, sempre mais lentas que o jogador → justas).
// Encostam na centelha PEQUENA → drenam carga e recuam. Centelha GRANDE as ABSORVE → liberta (vira
// luz/criatura-luz). É o arco do jogo em miniatura: de "fujo delas" a "eu as salvo". Sem bloom.
import * as THREE from 'three';
import { BAL } from '../config/balance.js';

const YUP = new THREE.Vector3(0, 1, 0);
const MAX = 24;

export default class Lurkers {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.mat = new THREE.MeshBasicMaterial({ color: '#10151b', transparent: true, opacity: 0.92, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 0), this.mat, MAX);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.active = new Uint8Array(MAX);
    this.x = new Float32Array(MAX);
    this.z = new Float32Array(MAX);
    this.vx = new Float32Array(MAX);
    this.vz = new Float32Array(MAX);
    this.ph = new Float32Array(MAX);
    this.wa = new Float32Array(MAX); // ângulo de vagar
    this.cd = new Float32Array(MAX); // cooldown de dreno (debounce do contato)

    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._t = 0;
    this.presence = 1;
    this.n = 0;
    this._hideAll();
    this.spawn();
  }

  _hideAll() {
    this._p.set(0, -999, 0); this._s.setScalar(0.001);
    for (let i = 0; i < MAX; i += 1) { this._m.compose(this._p, this._q, this._s); this.mesh.setMatrixAt(i, this._m); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** (Re)posiciona as espreitas pelo mundo (novo bioma). */
  spawn() {
    this.active.fill(0);
    const wr = BAL.game.worldRadius;
    this.n = Math.min(MAX, BAL.lurker.count);
    for (let i = 0; i < this.n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.sqrt(Math.random()) * (wr - 30);
      this.active[i] = 1;
      this.x[i] = Math.cos(a) * r; this.z[i] = Math.sin(a) * r;
      this.vx[i] = 0; this.vz[i] = 0;
      this.ph[i] = Math.random() * Math.PI * 2;
      this.wa[i] = Math.random() * Math.PI * 2;
    }
  }

  setPresence(p) { this.presence = p; this.mat.opacity = 0.92 * p; this.mesh.visible = p > 0.05; }

  /**
   * @returns {{drain:number, freed:{x:number,z:number}[]}} eventos deste frame.
   */
  update(dt, sx, sz, sparkSize) {
    this._t += dt;
    const L = BAL.lurker;
    let drain = 0;
    const freed = [];
    const canAbsorb = sparkSize >= L.absorbSize;
    let any = false;
    for (let i = 0; i < this.n; i += 1) {
      if (!this.active[i]) continue;
      any = true;
      if (this.cd[i] > 0) this.cd[i] -= dt;
      const dx = sx - this.x[i]; const dz = sz - this.z[i];
      const d = Math.hypot(dx, dz) || 1;

      if (this.presence > 0.1 && d < L.fleeRadius) {
        // foge da luz (acelera no sentido oposto)
        const k = (1 - d / L.fleeRadius);
        this.vx[i] -= (dx / d) * L.speed * k * dt * 4;
        this.vz[i] -= (dz / d) * L.speed * k * dt * 4;
      } else {
        // vagar lento
        this.wa[i] += (Math.random() - 0.5) * dt * 2;
        this.vx[i] += (Math.cos(this.wa[i]) * L.wanderSpeed - this.vx[i]) * dt;
        this.vz[i] += (Math.sin(this.wa[i]) * L.wanderSpeed - this.vz[i]) * dt;
      }
      // limita a velocidade (sempre < jogador)
      const sp = Math.hypot(this.vx[i], this.vz[i]);
      const cap = d < L.fleeRadius ? L.speed : L.wanderSpeed;
      if (sp > cap) { this.vx[i] *= cap / sp; this.vz[i] *= cap / sp; }
      this.x[i] += this.vx[i] * dt; this.z[i] += this.vz[i] * dt;
      // limite do mundo
      const rr = Math.hypot(this.x[i], this.z[i]); const wr = BAL.game.worldRadius;
      if (rr > wr) { this.x[i] *= wr / rr; this.z[i] *= wr / rr; this.vx[i] *= -0.4; this.vz[i] *= -0.4; }

      // contato com a centelha
      if (d < L.contactR + sparkSize * 0.4) {
        if (canAbsorb) {
          freed.push({ x: this.x[i], z: this.z[i] });
          this.active[i] = 0;
          this._p.set(0, -999, 0); this._s.setScalar(0.001);
          this._m.compose(this._p, this._q, this._s); this.mesh.setMatrixAt(i, this._m);
          continue;
        } else if (this.presence > 0.1 && this.cd[i] <= 0) {
          drain += L.drainOnTouch;
          this.cd[i] = 0.8; // debounce: não dreno de novo já já
          // recua forte
          this.vx[i] = -(dx / d) * L.speed * 1.6;
          this.vz[i] = -(dz / d) * L.speed * 1.6;
        }
      }

      // escreve a matriz (bob + giro lento)
      const y = 2.0 + Math.sin(this._t * 1.5 + this.ph[i]) * 0.7;
      const s = 0.7 + Math.sin(this._t * 3 + this.ph[i]) * 0.12;
      this._p.set(this.x[i], y, this.z[i]);
      this._s.setScalar(s);
      this._q.setFromAxisAngle(YUP, this._t * 0.5 + this.ph[i]);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
    return { drain, freed };
  }
}
