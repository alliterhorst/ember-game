// src/entities/Spark.js — a centelha do jogador. Engenharia.
// Segue o ponteiro com velocidade SUAVIZADA (aceleração), pra um deslizar gostoso.
// Não é mais uma bolinha lisa: é uma BRASA viva — núcleo branco + casca facetada que cintila
// (gira e pega luz) + brasas menores orbitando + flicker orgânico. O bloom (main) faz brilhar.
import * as THREE from 'three';
import { BAL } from '../config/balance.js';
import { PALETTE } from '../config/palette.js';

const EMBER_N = 5; // brasinhas orbitando
const YUP = new THREE.Vector3(0, 1, 0);

export default class Spark {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.root = new THREE.Group();
    const R = BAL.spark.radius;

    // núcleo branco quente (o coração da brasa)
    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(R * 0.82, 2),
      new THREE.MeshBasicMaterial({ color: PALETTE.spark }),
    );
    // casca facetada (cristal de luz): poucos lados, gira devagar e cintila
    this.shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(R * 1.5, 0),
      new THREE.MeshBasicMaterial({ color: PALETTE.sparkGlow, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    // halo macio externo
    this.halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(R * 2.4, 1),
      new THREE.MeshBasicMaterial({ color: PALETTE.sparkGlow, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.root.add(this.core, this.shell, this.halo);

    // brasinhas orbitando (vida + detalhe)
    this.embers = new THREE.Group();
    const emberGeo = new THREE.IcosahedronGeometry(R * 0.2, 0);
    const emberMat = new THREE.MeshBasicMaterial({ color: '#ffe6b0', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this._embers = [];
    for (let i = 0; i < EMBER_N; i += 1) {
      const e = new THREE.Mesh(emberGeo, emberMat);
      const a = (i / EMBER_N) * Math.PI * 2;
      e.userData = { a, rad: R * 2.0 + Math.random() * R * 0.8, h: (Math.random() - 0.5) * R * 1.6, spd: 0.6 + Math.random() * 0.7, ph: Math.random() * 6 };
      this.embers.add(e);
      this._embers.push(e);
    }
    this.root.add(this.embers);

    this.light = new THREE.PointLight(PALETTE.sparkGlow, 14, 32, 1.5);
    this.root.add(this.light);

    this.root.position.set(0, 1, 0);
    scene.add(this.root);

    this.vx = 0;
    this.vz = 0;
    this._t = 0;
    this._trail = 0;
    this.size = 1; // cresce ao absorver
    this._baseIntensity = 14;
  }

  get position() { return this.root.position; }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get absorbRadius() { return BAL.game.absorbRadius * (0.7 + this.size * 0.5); }

  /** Cresce ao absorver luz (tamanho, brilho e alcance). */
  grow(amount) {
    this.size = Math.min(this.size + amount, 3.2);
    this.root.scale.setScalar(this.size);
    this._baseIntensity = 14 + this.size * 6;
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

    // vida: pulso do núcleo, casca girando/cintilando, flicker de luz
    this._t += dt;
    const t = this._t;
    this.core.scale.setScalar(1 + Math.sin(t * 4) * 0.06);
    this.shell.rotation.y += dt * 0.6;
    this.shell.rotation.x += dt * 0.25;
    this.shell.material.opacity = 0.22 + (Math.sin(t * 7) * 0.5 + 0.5) * 0.16;
    this.halo.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
    const flicker = 0.88 + Math.sin(t * 13) * 0.06 + Math.sin(t * 7.3) * 0.06;
    this.light.intensity = this._baseIntensity * flicker;

    // brasinhas orbitando
    this.embers.rotation.y += dt * 0.5;
    for (let i = 0; i < this._embers.length; i += 1) {
      const e = this._embers[i];
      const u = e.userData;
      u.a += u.spd * dt;
      e.position.set(Math.cos(u.a) * u.rad, u.h + Math.sin(t * 1.6 + u.ph) * 0.3, Math.sin(u.a) * u.rad);
      const s = 0.8 + Math.sin(t * 5 + u.ph) * 0.25;
      e.scale.setScalar(s);
    }

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
