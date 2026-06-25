// src/systems/Forest.js — o Bosque adormecido. Engenharia + tech-artist-3d.
// Árvores low-poly (tronco + copa) via InstancedMesh: centenas de árvores = 2 draw calls.
// Estado ADORMECIDO (paleta dessaturada). Reacender troca os materiais (passo futuro).
import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

const YUP = new THREE.Vector3(0, 1, 0);

export default class Forest {
  /** @param {THREE.Scene} scene */
  constructor(scene, { count = 240, inner = 9, outer = 70 } = {}) {
    // geometrias low-poly (poucos lados = facetado)
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 2.4, 5);
    const copaGeo = new THREE.ConeGeometry(1.5, 3.8, 6);

    this.trunkMat = new THREE.MeshStandardMaterial({ color: PALETTE.treeSleep, roughness: 1, metalness: 0, flatShading: true });
    this.copaMat = new THREE.MeshStandardMaterial({ color: PALETTE.leafSleep, roughness: 1, metalness: 0, flatShading: true });

    this.trunks = new THREE.InstancedMesh(trunkGeo, this.trunkMat, count);
    this.copas = new THREE.InstancedMesh(copaGeo, this.copaMat, count);

    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      // sqrt p/ distribuição uniforme em ÁREA (não concentrar no centro)
      const r = inner + Math.sqrt(Math.random()) * (outer - inner);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const s = 0.7 + Math.random() * 0.9;
      quat.setFromAxisAngle(YUP, Math.random() * Math.PI * 2);
      scl.set(s, s * (0.85 + Math.random() * 0.5), s);

      pos.set(x, 1.2 * scl.y, z);
      m.compose(pos, quat, scl);
      this.trunks.setMatrixAt(i, m);

      pos.set(x, (2.4 + 1.6) * scl.y, z);
      m.compose(pos, quat, scl);
      this.copas.setMatrixAt(i, m);
    }
    this.trunks.instanceMatrix.needsUpdate = true;
    this.copas.instanceMatrix.needsUpdate = true;
    scene.add(this.trunks, this.copas);
  }
}
