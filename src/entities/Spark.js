// src/entities/Spark.js — a centelha do jogador. Engenharia.
// Segue o ponteiro com velocidade SUAVIZADA (aceleração), pra um deslizar gostoso.
// Núcleo brilhante + halo aditivo + luz pontual (ilumina o entorno). O bloom (main) faz brilhar.
import * as THREE from 'three';
import { BAL } from '../config/balance.js';
import { PALETTE } from '../config/palette.js';

export default class Spark {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.root = new THREE.Group();

    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(BAL.spark.radius, 2),
      new THREE.MeshBasicMaterial({ color: PALETTE.spark }),
    );
    this.halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(BAL.spark.radius * 2.2, 1),
      new THREE.MeshBasicMaterial({ color: PALETTE.sparkGlow, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.root.add(this.core, this.halo);

    this.light = new THREE.PointLight(PALETTE.sparkGlow, 14, 32, 1.5);
    this.root.add(this.light);

    this.root.position.set(0, 1, 0);
    scene.add(this.root);

    this.vx = 0;
    this.vz = 0;
    this._t = 0;
    this._trail = 0;
    this.size = 1; // cresce ao absorver
  }

  get position() { return this.root.position; }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get absorbRadius() { return BAL.game.absorbRadius * (0.7 + this.size * 0.5); }

  /** Cresce ao absorver luz (tamanho, brilho e alcance). */
  grow(amount) {
    this.size = Math.min(this.size + amount, 3.2);
    this.root.scale.setScalar(this.size);
    this.light.intensity = 14 + this.size * 6;
    this.light.distance = 32 + this.size * 8;
  }

  update(dt, dir, particles) {
    // velocidade-alvo proporcional ao ponteiro; suaviza (aceleração)
    const tvx = dir.x * BAL.spark.maxSpeed;
    const tvz = dir.z * BAL.spark.maxSpeed;
    const k = 1 - Math.exp(-BAL.spark.accel * dt);
    this.vx += (tvx - this.vx) * k;
    this.vz += (tvz - this.vz) * k;
    this.root.position.x += this.vx * dt;
    this.root.position.z += this.vz * dt;

    // prende no mundo (não sai da área jogável)
    const wr = BAL.game.worldRadius;
    const r2 = this.root.position.x * this.root.position.x + this.root.position.z * this.root.position.z;
    if (r2 > wr * wr) {
      const d = Math.sqrt(r2);
      this.root.position.x *= wr / d;
      this.root.position.z *= wr / d;
      this.vx *= 0.3;
      this.vz *= 0.3;
    }

    // pulsar leve (vida)
    this._t += dt;
    this.core.scale.setScalar(1 + Math.sin(this._t * 4) * 0.06);
    this.halo.scale.setScalar(1 + Math.sin(this._t * 3) * 0.12);

    // rastro de partículas quentes (mais quando se move)
    if (particles) {
      this._trail += dt * (2.5 + this.speed * 1.3);
      while (this._trail >= 1) {
        this._trail -= 1;
        const p = this.root.position;
        particles.emit({
          x: p.x + (Math.random() - 0.5) * 0.4 * this.size,
          y: p.y + (Math.random() - 0.5) * 0.4 * this.size,
          z: p.z + (Math.random() - 0.5) * 0.4 * this.size,
          vx: -this.vx * 0.15, vy: 0.3 + Math.random() * 0.4, vz: -this.vz * 0.15,
          life: 0.4 + Math.random() * 0.3, color: PALETTE.sparkGlow,
        });
      }
    }
  }
}
