// src/systems/Particles.js — pool único de partículas (THREE.Points, aditivo). Engenharia.
// Sem alocação por frame (anti-jank). Cor por partícula, com fade pela vida.
import * as THREE from 'three';

const MAX = 900;
const _c = new THREE.Color();

export default class Particles {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3); // cor atual (com fade) — vai pro buffer
    this.base = new Float32Array(MAX * 3); // cor base
    this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);
    this.maxLife = new Float32Array(MAX);
    this.grav = new Float32Array(MAX);
    for (let i = 0; i < MAX; i += 1) this.pos[i * 3 + 1] = -999;

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.cursor = 0;
  }

  /** Emite uma partícula. color = THREE.Color ou hex string. */
  emit(o) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % MAX;
    const i3 = i * 3;
    this.pos[i3] = o.x; this.pos[i3 + 1] = o.y; this.pos[i3 + 2] = o.z;
    this.vel[i3] = o.vx || 0; this.vel[i3 + 1] = o.vy || 0; this.vel[i3 + 2] = o.vz || 0;
    this.life[i] = o.life; this.maxLife[i] = o.life; this.grav[i] = o.gravity || 0;
    _c.set(o.color);
    this.base[i3] = _c.r; this.base[i3 + 1] = _c.g; this.base[i3 + 2] = _c.b;
  }

  /** Explosão radial de n partículas. */
  burst(x, y, z, n, color, speed, life, gravity = 0) {
    for (let k = 0; k < n; k += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random());
      this.emit({ x, y, z, vx: Math.cos(a) * sp, vy: (0.2 + Math.random()) * speed, vz: Math.sin(a) * sp, life: life * (0.6 + Math.random() * 0.6), color, gravity });
    }
  }

  update(dt) {
    const p = this.pos; const v = this.vel; const l = this.life; const ml = this.maxLife; const c = this.col; const b = this.base;
    for (let i = 0; i < MAX; i += 1) {
      if (l[i] <= 0) continue;
      l[i] -= dt;
      const i3 = i * 3;
      if (l[i] <= 0) { p[i3 + 1] = -999; c[i3] = 0; c[i3 + 1] = 0; c[i3 + 2] = 0; continue; }
      v[i3 + 1] -= this.grav[i] * dt;
      p[i3] += v[i3] * dt;
      p[i3 + 1] += v[i3 + 1] * dt;
      p[i3 + 2] += v[i3 + 2] * dt;
      const f = l[i] / ml[i]; // 1 -> 0
      c[i3] = b[i3] * f; c[i3 + 1] = b[i3 + 1] * f; c[i3 + 2] = b[i3 + 2] * f;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
