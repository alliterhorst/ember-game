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
const CALL = '#ffd9a0'; // farol-chamado (quente, da família da centelha)
const LANDMARK = '#66ff88'; // farol do Coração já reaceso (verde, vivo)

// textura radial suave (poça de luz no chão)
function discTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.30)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
// gradiente vertical (coluna brilhante embaixo, some no topo — fura a névoa)
function beamTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 16, 128);
  return new THREE.CanvasTexture(c);
}

export default class Hearts {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this._discTex = discTexture();
    this._beamTex = beamTexture();
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

    // FAROL (wayfinding): poça de luz no chão + coluna — furam a névoa (fog:false)
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: this._discTex, color: CALL, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    disc.position.y = 0.12;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 0.7, 48, 8, 1, true),
      new THREE.MeshBasicMaterial({ map: this._beamTex, color: CALL, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }),
    );
    beam.position.y = 24;

    group.add(trunk, copa, core, light, disc, beam);
    group.position.set(p.x, 0, p.z);
    scene.add(group);
    return { group, trunk, copa, core, light, disc, beam, x: p.x, z: p.z, aceso: false, _t: Math.random() * 6 };
  }

  update(dt, ready) {
    for (const h of this.list) {
      h._t += dt;
      if (h.aceso) {
        // farol vira marco verde: respira leve (mundo já vivo)
        const b = 0.32 + (Math.sin(h._t * 1.2) * 0.5 + 0.5) * 0.12;
        h.disc.material.opacity = b;
        h.beam.material.opacity = b * 0.7;
        continue;
      }
      // batimento: fraco quando não-pronto, forte e quente quando pronto (= "vem cá")
      const base = ready ? 0.55 : 0.18;
      const amp = ready ? 0.45 : 0.12;
      const pulse = base + (Math.sin(h._t * (ready ? 4.5 : 1.8)) * 0.5 + 0.5) * amp;
      h.core.material.color.setRGB(pulse, pulse * 0.55, pulse * 0.3);
      h.light.intensity = (ready ? 4 : 2.2) * (0.7 + pulse * 0.5);
      // o FAROL pulsa junto: discreto quando não há luz pra entregar, forte quando pronto
      h.disc.material.opacity = (ready ? 0.55 : 0.32) + pulse * (ready ? 0.6 : 0.2);
      h.beam.material.opacity = (ready ? 0.45 : 0.22) + pulse * (ready ? 0.5 : 0.15);
      const ds = 0.9 + pulse * (ready ? 0.5 : 0.15);
      h.disc.scale.set(ds, ds, ds);
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
    // farol-chamado (quente) -> marco verde (vivo)
    h.disc.material.color.set(LANDMARK);
    h.beam.material.color.set(LANDMARK);
    h.disc.scale.set(1, 1, 1);
  }

  /** Coração apagado mais próximo de (x,z), ou null se todos acesos. */
  nearestDormant(x, z) {
    let best = null; let bd = Infinity;
    for (const h of this.list) {
      if (h.aceso) continue;
      const dx = h.x - x; const dz = h.z - z; const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }

  get count() { return this.list.length; }
}
