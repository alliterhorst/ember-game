// src/systems/Flora.js — flora e pedras low-poly REAIS (Kenney Nature Kit, CC0). Engenharia.
// Cada modelo (2 primitivas/cores) é mesclado em UMA geometria com vertex-colors e vira um
// InstancedMesh (1 draw call por tipo). Pedras espalham desde o início (detalhe do terreno);
// flores/cogumelos/plantas FLORESCEM nas regiões reacesas (morto→vivo) crescendo do chão.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';
import { BAL } from '../config/balance.js';

const BASE = (import.meta.env.BASE_URL || '/') + 'assets/models/nature/';
// modelo -> altura-alvo no mundo (normaliza o tamanho real do GLB)
const ROCKS = [['rock_smallC', 1.5], ['rock_tallD', 2.2], ['stone_smallB', 1.3]];
const FLORA = [
  ['flower_redA', 1.9], ['flower_yellowB', 2.0], ['flower_purpleC', 1.9],
  ['mushroom_red', 1.7], ['mushroom_tanGroup', 2.1], ['plant_bushSmall', 1.9], ['grass_leafs', 1.6],
];

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const YUP = new THREE.Vector3(0, 1, 0);

// um tipo de modelo instanciado (com crescimento e packing no count)
class InstModel {
  constructor(geo, max, baseScale, minY) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: true });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.max = max;
    this.baseScale = baseScale;
    this.minY = minY;
    this.n = 0;
    this.px = new Float32Array(max);
    this.pz = new Float32Array(max);
    this.ry = new Float32Array(max);
    this.sc = new Float32Array(max); // escala final por instância
    this.grow = new Float32Array(max); // 0..1 (cresce ao surgir)
    this._growing = [];
  }

  add(x, z, instant) {
    if (this.n >= this.max) return;
    const i = this.n;
    this.n += 1;
    this.mesh.count = this.n;
    this.px[i] = x; this.pz[i] = z;
    this.ry[i] = Math.random() * Math.PI * 2;
    this.sc[i] = this.baseScale * (0.8 + Math.random() * 0.5);
    this.grow[i] = instant ? 1 : 0;
    this._write(i);
    if (!instant) this._growing.push(i);
  }

  _write(i) {
    const g = this.grow[i] * (2 - this.grow[i]); // easeOut
    const s = this.sc[i] * g;
    _q.setFromAxisAngle(YUP, this.ry[i]);
    _s.set(s, s, s);
    _p.set(this.px[i], -this.minY * s, this.pz[i]);
    _m.compose(_p, _q, _s);
    this.mesh.setMatrixAt(i, _m);
  }

  update(dt) {
    if (!this._growing.length) return;
    const still = [];
    for (const i of this._growing) {
      this.grow[i] = Math.min(this.grow[i] + dt * 1.4, 1);
      this._write(i);
      if (this.grow[i] < 1) still.push(i);
    }
    this._growing = still;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export default class Flora {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.rocks = {};
    this.flora = {};
    this.ready = false;
    this._floraKeys = [];
    this._pending = []; // bloom pedidos antes do load
    this._floraCursor = 0;
    this._load();
  }

  async _load() {
    const loader = new GLTFLoader();
    const get = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
    const build = async (name, targetH, max) => {
      const gltf = await get(`${BASE}${name}.glb`);
      gltf.scene.updateWorldMatrix(true, true);
      const geos = [];
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        const c = o.material && o.material.color ? o.material.color : new THREE.Color(1, 1, 1);
        const cnt = g.attributes.position.count;
        const col = new Float32Array(cnt * 3);
        for (let i = 0; i < cnt; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
        geos.push(g);
      });
      const merged = BGU.mergeGeometries(geos, false);
      merged.computeBoundingBox();
      const bb = merged.boundingBox;
      const h = (bb.max.y - bb.min.y) || 1;
      return new InstModel(merged, max, targetH / h, bb.min.y);
    };

    for (const [name, h] of ROCKS) { this.rocks[name] = await build(name, h, 90); this.scene.add(this.rocks[name].mesh); }
    for (const [name, h] of FLORA) { this.flora[name] = await build(name, h, 240); this.scene.add(this.flora[name].mesh); }
    this._floraKeys = Object.keys(this.flora);
    this.ready = true;

    this._scatterRocks(70);
    for (const req of this._pending) this.bloom(req[0], req[1], req[2], req[3]);
    this._pending.length = 0;
  }

  _scatterRocks(n) {
    const keys = Object.keys(this.rocks);
    const wr = BAL.game.worldRadius;
    for (let k = 0; k < n; k += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.sqrt(Math.random()) * (wr - 10);
      this.rocks[keys[k % keys.length]].add(Math.cos(a) * r, Math.sin(a) * r, true);
    }
    for (const key of keys) this.rocks[key].mesh.instanceMatrix.needsUpdate = true;
  }

  /** Floresce n plantas numa região reacesa (crescem do chão). */
  bloom(cx, cz, radius, n) {
    if (!this.ready) { this._pending.push([cx, cz, radius, n]); return; }
    for (let k = 0; k < n; k += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      const key = this._floraKeys[this._floraCursor % this._floraKeys.length];
      this._floraCursor += 1;
      this.flora[key].add(cx + Math.cos(a) * r, cz + Math.sin(a) * r, false);
    }
  }

  /** Clímax: espalha flora pelo bosque inteiro. */
  bloomAll() {
    if (!this.ready) { this._pending.push([0, 0, BAL.game.worldRadius, 350]); return; }
    const wr = BAL.game.worldRadius;
    for (let k = 0; k < 350; k += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.sqrt(Math.random()) * (wr - 8);
      const key = this._floraKeys[this._floraCursor % this._floraKeys.length];
      this._floraCursor += 1;
      this.flora[key].add(Math.cos(a) * r, Math.sin(a) * r, false);
    }
  }

  update(dt) {
    if (!this.ready) return;
    for (const k of this._floraKeys) this.flora[k].update(dt);
  }
}
