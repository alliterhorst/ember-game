// src/main.js — bootstrap do EMBER. Engenharia.
// Estrutura: você guia a centelha, coleta luz, e LEVA a um Coração (árvore-mãe) pra reacender
// a região (ela floresce + criaturas surgem + a trilha abre). Reacender todos = o mundo renasce.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { PALETTE } from './config/palette.js';
import { BAL } from './config/balance.js';
import Spark from './entities/Spark.js';
import PointerInput from './systems/PointerInput.js';
import Forest from './systems/Forest.js';
import Particles from './systems/Particles.js';
import Motes from './systems/Motes.js';
import Hearts from './systems/Hearts.js';
import Creatures from './systems/Creatures.js';
import Ambient from './systems/Ambient.js';
import Audio from './systems/Audio.js';
import Music from './systems/Music.js';
import Hud from './ui/Hud.js';
import StartScreen from './ui/StartScreen.js';
import EdgeCues from './ui/EdgeCues.js';
import { STORY } from './data/story.js';

const app = document.getElementById('app');

// --- Renderer (mobile-first) ---
const PIXEL_RATIO = Math.min(window.devicePixelRatio, 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(PIXEL_RATIO);
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

// --- Cena + névoa (mundo adormecido). Cores das duas pontas da curva de luz. ---
const FOG_SLEEP = new THREE.Color(PALETTE.fog);
const FOG_LIT = new THREE.Color(PALETTE.fogLit);
const BG_SLEEP = new THREE.Color(PALETTE.bg);
const BG_LIT = new THREE.Color(PALETTE.bgLit); // fundo desacoplado da névoa
const SKY_SLEEP = new THREE.Color(PALETTE.groundRim);
const SKY_LIT = new THREE.Color(PALETTE.skyLit);
const HEMIG_SLEEP = new THREE.Color(PALETTE.bg);
const HEMIG_LIT = new THREE.Color('#3d6b4d');
const SUN_SLEEP = new THREE.Color(PALETTE.groundRim);
const SUN_LIT = new THREE.Color(PALETTE.sunLit);
const GROUND_SLEEP = new THREE.Color(PALETTE.ground);
const GROUND_LIT = new THREE.Color(PALETTE.groundLit);
const scene = new THREE.Scene();
scene.background = BG_SLEEP.clone();
scene.fog = new THREE.FogExp2(PALETTE.fog, BAL.world.fogDensitySleep);

const camera = new THREE.PerspectiveCamera(BAL.camera.fov, window.innerWidth / window.innerHeight, 0.1, 300);

const hemi = new THREE.HemisphereLight(PALETTE.groundRim, PALETTE.bg, BAL.world.hemiSleep);
scene.add(hemi);
const moon = new THREE.DirectionalLight(PALETTE.groundRim, BAL.world.sunSleep);
moon.position.set(-6, 14, -4);
scene.add(moon);

const groundMat = new THREE.MeshStandardMaterial({ color: PALETTE.ground, roughness: 1, metalness: 0 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(120, 64).rotateX(-Math.PI / 2), groundMat);
scene.add(ground);

// halo de luz no chão sob a centelha (some no adormecido, forte no reaceso)
const haloTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const halo = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 28).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: haloTex, color: PALETTE.groundHalo, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
);
halo.position.y = 0.04;
scene.add(halo);

// centelha-bússola: um "puxão" de luz no lado que aponta pro Coração apagado (só quando pronto)
const aimCue = new THREE.Mesh(
  new THREE.PlaneGeometry(1.9, 1.9).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: haloTex, color: '#ffe6b0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
);
aimCue.position.y = 0.9;
scene.add(aimCue);
let aimT = 0;

// --- Mundo + centelha + sistemas ---
const forest = new Forest(scene);
const hearts = new Hearts(scene);
const creatures = new Creatures(scene);
const ambient = new Ambient(scene);
const input = new PointerInput(app);
const spark = new Spark(scene);
const particles = new Particles(scene);
const motes = new Motes(scene);
const hud = new Hud(app);
const audio = new Audio();
const music = new Music();
const startScreen = new StartScreen(app);
const edgeCues = new EdgeCues(app, hearts.count);

hud.setProgress(0, hearts.count);

// --- estado do jogo ---
const ZERO_DIR = { x: 0, z: 0 };
let started = false; // só joga depois de "acender" na tela inicial
let light = 0; // carga de luz (a barra)
let heartsLit = 0;
let worldLight = 0; // luz global atual (0..1)
let worldTarget = 0; // alvo (= heartsLit/count)
const _absorbPos = new THREE.Vector3();
const REACENDER_COLORS = [PALETTE.bioglow, PALETTE.flower, PALETTE.ether, PALETTE.leafLit];

// --- Pós-processamento: bloom ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5), 0.7, 0.5, 0.8);
composer.addPass(bloom);
bloom.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);

function applyWorldLight(w) {
  const W = BAL.world;
  scene.fog.density = W.fogDensitySleep + w * (W.fogDensityLit - W.fogDensitySleep);
  scene.fog.color.copy(FOG_SLEEP).lerp(FOG_LIT, w);
  scene.background.copy(BG_SLEEP).lerp(BG_LIT, w); // fundo desacoplado: mais claro que a névoa
  bloom.strength = W.bloomSleep + w * (W.bloomLit - W.bloomSleep);
  hemi.intensity = W.hemiSleep + w * (W.hemiLit - W.hemiSleep);
  hemi.color.copy(SKY_SLEEP).lerp(SKY_LIT, w);
  hemi.groundColor.copy(HEMIG_SLEEP).lerp(HEMIG_LIT, w);
  moon.intensity = W.sunSleep + w * (W.sunLit - W.sunSleep);
  moon.color.copy(SUN_SLEEP).lerp(SUN_LIT, w);
  groundMat.color.copy(GROUND_SLEEP).lerp(GROUND_LIT, w);
  halo.material.opacity = 0.15 + w * 0.55;
  ambient.setWorldLight(w);
}

function reacenderBurst(x, z) {
  for (let k = 0; k < 200; k += 1) {
    const a = Math.random() * Math.PI * 2;
    const sp = 5 + Math.random() * 15;
    particles.emit({ x, y: 8, z, vx: Math.cos(a) * sp, vy: 2 + Math.random() * 9, vz: Math.sin(a) * sp, life: 1 + Math.random() * 1.4, color: REACENDER_COLORS[k % 4], gravity: 3.5 });
  }
}

// --- Câmera top-down seguindo a centelha ---
function placeCamera(snap) {
  const t = spark.position;
  const dx = t.x;
  const dy = t.y + BAL.camera.height;
  const dz = t.z + BAL.camera.back;
  if (snap) { camera.position.set(dx, dy, dz); } else {
    const k = 1 - Math.exp(-BAL.camera.followLerp * lastDt);
    camera.position.x += (dx - camera.position.x) * k;
    camera.position.y += (dy - camera.position.y) * k;
    camera.position.z += (dz - camera.position.z) * k;
  }
  camera.lookAt(t.x, t.y, t.z);
}

// --- Debug ---
const debugState = { state: 'play', fps: 0, spark: { x: 0, z: 0, speed: 0 }, light: 0, hearts: 0 };
window.__DEBUG__ = debugState;
window.__DEBUG__.addLight = (n) => { light = Math.min(light + n, BAL.game.motesToReacender); };
window.__DEBUG__.heartPos = (i) => ({ x: hearts.list[i].x, z: hearts.list[i].z });
window.__DEBUG__.teleport = (x, z) => { spark.position.x = x; spark.position.z = z; spark.vx = 0; spark.vz = 0; };

// --- Loop ---
const clock = new THREE.Clock();
let lastDt = 0.016;
let fpsAccum = 0;
let fpsFrames = 0;
let runTime = 0; // tempo desde "acender" (pro ensino inicial)
placeCamera(true);

// acender (tela inicial) -> começa o jogo
startScreen.onStart(() => {
  started = true;
  if (music.start) music.start();
});

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  lastDt = dt;
  if (started) runTime += dt;

  // antes de "acender", a centelha fica parada (controle travado)
  spark.update(dt, started ? input.dir() : ZERO_DIR, particles);
  motes.update(dt);

  // absorver motas -> crescer + carregar a barra (com teto)
  const hit = motes.collect(spark.position.x, spark.position.z, spark.absorbRadius);
  for (let h = 0; h < hit.length; h += 1) {
    const i = hit[h];
    motes.posOf(i, _absorbPos);
    particles.burst(_absorbPos.x, _absorbPos.y, _absorbPos.z, 9, PALETTE.ether, 4, 0.5, 1);
    motes.respawn(i);
    spark.grow(BAL.game.growPerMote);
    audio.absorb();
    light = Math.min(light + 1, BAL.game.motesToReacender);
    hud.setLight(light / BAL.game.motesToReacender);
  }

  const ready = light >= BAL.game.motesToReacender && heartsLit < hearts.count;
  // ensino inicial: a dica fica até reunir as primeiras luzes (some sozinha quando entende)
  if (ready) hud.hint('leve a luz a um Coração ☾');
  else if (started && heartsLit === 0 && light < 4 && runTime > 1.5) hud.hint(STORY.firstHint);
  else hud.hint(null);
  hearts.update(dt, ready);

  // --- wayfinding: centelha-bússola + indicadores de borda ---
  aimT += dt;
  const target = ready ? hearts.nearestDormant(spark.position.x, spark.position.z) : null;
  if (target) {
    let dx = target.x - spark.position.x;
    let dz = target.z - spark.position.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const d = input.dir();
    const dlen = Math.hypot(d.x, d.z);
    const align = dlen > 0.05 ? Math.max(0, (d.x * dx + d.z * dz) / dlen) : 0; // 1 = indo pro rumo
    const pulse = 0.78 + Math.sin(aimT * 4) * 0.22;
    aimCue.material.opacity += (((0.6 + align * 0.4) * pulse) - aimCue.material.opacity) * 0.2;
    aimCue.position.x = spark.position.x + dx * (spark.absorbRadius + 2.4);
    aimCue.position.z = spark.position.z + dz * (spark.absorbRadius + 2.4);
  } else {
    aimCue.material.opacity += (0 - aimCue.material.opacity) * 0.2;
  }
  edgeCues.update(hearts.list, camera, renderer.domElement, ready);

  // levar a luz a um Coração -> reacende a região
  const ti = hearts.touched(spark.position.x, spark.position.z, ready);
  if (ti >= 0) {
    const h = hearts.list[ti];
    hearts.reacender(ti);
    forest.reacenderArea(h.x, h.z, 32);
    creatures.spawn(h.x, h.z, 6);
    ambient.litArea(h.x, h.z, 32, 45);
    reacenderBurst(h.x, h.z);
    audio.reacender();
    light = 0;
    hud.setLight(0);
    heartsLit += 1;
    hud.setProgress(heartsLit, hearts.count);
    worldTarget = heartsLit / hearts.count;
    if (heartsLit >= hearts.count) {
      // clímax: o mundo inteiro desperta de uma vez
      music.setReacendido(true);
      forest.reacenderTudo();
      ambient.litAll();
      worldTarget = 1;
      for (let s = 0; s < 5; s += 1) {
        const p = forest.treeAt((s + 0.5) / 5);
        creatures.spawn(p.x, p.z, 4);
      }
      hud.hint(null);
      hud.flash(STORY.climax, 4500);
      if (STORY.closing) setTimeout(() => hud.flash(STORY.closing, 5000), 5200);
    } else {
      hud.flash(STORY.hearts[heartsLit - 1]);
    }
  }

  // transição global suave (mundo clareia conforme reacende)
  if (Math.abs(worldLight - worldTarget) > 0.001) {
    worldLight += (worldTarget - worldLight) * (1 - Math.exp(-1.5 * dt));
    applyWorldLight(worldLight);
  }

  forest.update(dt);
  creatures.update(dt);
  ambient.update(dt);
  particles.update(dt);
  halo.position.x = spark.position.x;
  halo.position.z = spark.position.z;
  placeCamera(false);

  fpsAccum += dt;
  fpsFrames += 1;
  if (fpsAccum >= 0.5) { debugState.fps = Math.round(fpsFrames / fpsAccum); fpsAccum = 0; fpsFrames = 0; }
  debugState.spark.x = spark.position.x;
  debugState.spark.z = spark.position.z;
  debugState.spark.speed = spark.speed;
  debugState.light = light;
  debugState.hearts = heartsLit;

  composer.render();
}
renderer.setAnimationLoop(loop);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);
});
