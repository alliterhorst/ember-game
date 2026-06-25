// src/systems/Hearts.js — os Corações (árvores-mãe) de cada região. Engenharia + game-designer.
// São poucos (3), então meshes próprias. Apagados pulsam fraco (localizáveis na névoa) e forte
// quando a barra está cheia (prontos). Reacender um floresce a região e conta no progresso.
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

const POSITIONS = [
  { x: -44, z: -30 },
  { x: 48, z: -24 },
  { x: 4, z: 54 },
];
const TOUCH = 7; // raio pra "tocar" o Coração

export default class Hearts {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.list = POSITIONS.map((p) => this._make(scene, p));
  }

  _make(scene, p) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.5, 7, 6),
      new THREE.MeshStandardMaterial({ color: PALETTE.treeSleep, roughness: 1, flatShading: true }),
    );
    trunk.position.y = 3.5;
    const copa = new THREE.Mesh(
      new THREE.ConeGeometry(5, 12, 8),
      new THREE.MeshStandardMaterial({ color: PALETTE.leafSleep, roughness: 1, flatShading: true }),
    );
    copa.position.y = 11.5;
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 1),
      new THREE.MeshBasicMaterial({ color: '#5a2a26' }),
    );
    core.position.y = 8.5;
    const light = new THREE.PointLight('#7a3a30', 2.2, 26, 1.6); // brilho fraco: localizável
    light.position.y = 8.5;
    group.add(trunk, copa, core, light);
    group.position.set(p.x, 0, p.z);
    scene.add(group);
    return { group, trunk, copa, core, light, x: p.x, z: p.z, aceso: false, _t: Math.random() * 6 };
  }

  update(dt, ready) {
    for (const h of this.list) {
      h._t += dt;
      if (h.aceso) continue;
      // batimento: fraco quando não-pronto, forte e quente quando pronto
      const base = ready ? 0.55 : 0.18;
      const amp = ready ? 0.45 : 0.12;
      const pulse = base + (Math.sin(h._t * (ready ? 4.5 : 1.8)) * 0.5 + 0.5) * amp;
      h.core.material.color.setRGB(pulse, pulse * 0.55, pulse * 0.3);
      h.light.intensity = (ready ? 4 : 2.2) * (0.7 + pulse * 0.5);
    }
  }

  /** Índice do Coração apagado sendo tocado (com a barra cheia), ou -1. */
  touched(sparkX, sparkZ, ready) {
    if (!ready) return -1;
    for (let i = 0; i < this.list.length; i += 1) {
      const h = this.list[i];
      if (h.aceso) continue;
      const dx = h.x - sparkX;
      const dz = h.z - sparkZ;
      if (dx * dx + dz * dz < TOUCH * TOUCH) return i;
    }
    return -1;
  }

  reacender(i) {
    const h = this.list[i];
    h.aceso = true;
    h.trunk.material.color.set(PALETTE.trunkLit);
    h.copa.material.color.set(PALETTE.leafLit);
    h.copa.material.emissive.set(PALETTE.leafLit);
    h.copa.material.emissiveIntensity = 0.3;
    h.core.material.color.set(PALETTE.flower);
    h.light.color.set(PALETTE.flower);
    h.light.intensity = 6;
    h.light.distance = 34;
  }

  get count() { return this.list.length; }
}
