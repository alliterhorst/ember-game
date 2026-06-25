// src/systems/Reacender.js — o momento-uau: o Bosque transiciona de APAGADO pra VIVO. Engenharia.
// Lerp dos materiais das árvores + névoa + bloom ao longo de ~1.8s, com cascata de partículas.
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

const SLEEP = { trunk: new THREE.Color(PALETTE.treeSleep), copa: new THREE.Color(PALETTE.leafSleep), fog: new THREE.Color(PALETTE.fog) };
const LIT = { trunk: new THREE.Color(PALETTE.trunkLit), copa: new THREE.Color(PALETTE.leafLit), fog: new THREE.Color(PALETTE.fogLit) };
const FOG_SLEEP = 0.022;
const FOG_LIT = 0.013;

export default class Reacender {
  constructor(scene, forest, bloom) {
    this.scene = scene;
    this.forest = forest;
    this.bloom = bloom;
    this.t = 0;
    this.active = false;
    this._c = new THREE.Color();
  }

  /** Dispara a transformação + a cascata de partículas (no Particles). */
  trigger(x, z, particles) {
    if (this.active || this.t >= 1) return;
    this.active = true;
    const colors = [PALETTE.bioglow, PALETTE.flower, PALETTE.ether, PALETTE.leafLit];
    for (let k = 0; k < 240; k += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 16;
      particles.emit({
        x, y: 1, z,
        vx: Math.cos(a) * sp, vy: 2 + Math.random() * 9, vz: Math.sin(a) * sp,
        life: 1 + Math.random() * 1.4, color: colors[k % colors.length], gravity: 3.5,
      });
    }
  }

  update(dt) {
    if (!this.active) return;
    this.t = Math.min(this.t + dt / 1.8, 1);
    const e = this.t < 0.5 ? 2 * this.t * this.t : 1 - ((-2 * this.t + 2) ** 2) / 2; // easeInOut

    this.forest.trunkMat.color.copy(this._c.copy(SLEEP.trunk).lerp(LIT.trunk, e));
    this.forest.copaMat.color.copy(this._c.copy(SLEEP.copa).lerp(LIT.copa, e));
    this.forest.copaMat.emissive.copy(this._c.copy(LIT.copa).multiplyScalar(e * 0.35));

    this.scene.fog.color.copy(this._c.copy(SLEEP.fog).lerp(LIT.fog, e));
    this.scene.fog.density = FOG_SLEEP - e * (FOG_SLEEP - FOG_LIT);
    this.scene.background.copy(this.scene.fog.color);

    this.bloom.strength = 0.7 + e * 0.6;
    if (this.t >= 1) this.active = false;
  }

  get done() { return this.t >= 1; }
}
