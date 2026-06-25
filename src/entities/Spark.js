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

    this.light = new THREE.PointLight(PALETTE.sparkGlow, 8, 22, 1.6);
    this.root.add(this.light);

    this.root.position.set(0, 1, 0);
    scene.add(this.root);

    this.vx = 0;
    this.vz = 0;
    this._t = 0;
  }

  get position() { return this.root.position; }
  get speed() { return Math.hypot(this.vx, this.vz); }

  update(dt, dir) {
    // velocidade-alvo proporcional ao ponteiro; suaviza (aceleração)
    const tvx = dir.x * BAL.spark.maxSpeed;
    const tvz = dir.z * BAL.spark.maxSpeed;
    const k = 1 - Math.exp(-BAL.spark.accel * dt);
    this.vx += (tvx - this.vx) * k;
    this.vz += (tvz - this.vz) * k;
    this.root.position.x += this.vx * dt;
    this.root.position.z += this.vz * dt;

    // pulsar leve (vida)
    this._t += dt;
    this.core.scale.setScalar(1 + Math.sin(this._t * 4) * 0.06);
    this.halo.scale.setScalar(1 + Math.sin(this._t * 3) * 0.12);
  }
}
