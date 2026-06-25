// src/main.js — bootstrap do EMBER. Engenharia.
// Fundação mobile-first: renderer + bloom + câmera top-down + a centelha seguindo o ponteiro.
// O mundo (Bosque), absorver/crescer e reacender entram por cima desta base.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { PALETTE } from './config/palette.js';
import { BAL } from './config/balance.js';
import Spark from './entities/Spark.js';
import PointerInput from './systems/PointerInput.js';

const app = document.getElementById('app');

// --- Renderer (mobile-first) ---
// antialias OFF: inútil com EffectComposer (a cena vai pra render target) e custoso.
// devicePixelRatio cap 1.5: o bloom processa pixels demais em dPR 2 (4x) -> jank.
const PIXEL_RATIO = Math.min(window.devicePixelRatio, 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(PIXEL_RATIO);
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

// --- Cena + névoa (mundo adormecido) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.bg);
scene.fog = new THREE.FogExp2(PALETTE.fog, 0.022);

const camera = new THREE.PerspectiveCamera(BAL.camera.fov, window.innerWidth / window.innerHeight, 0.1, 300);

// --- Luz ambiente fraca (mundo apagado) ---
scene.add(new THREE.HemisphereLight(PALETTE.groundRim, PALETTE.bg, 0.25));

// --- Chão (provisório: Bosque adormecido entra depois) ---
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(80, 64).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: PALETTE.ground, roughness: 1, metalness: 0 }),
);
scene.add(ground);

// grid sutil pra dar leitura de movimento (provisório)
const grid = new THREE.GridHelper(160, 80, PALETTE.groundRim, PALETTE.ground);
grid.position.y = 0.01;
grid.material.transparent = true;
grid.material.opacity = 0.25;
scene.add(grid);

// --- Centelha + input ---
const input = new PointerInput(app);
const spark = new Spark(scene);

// --- Pós-processamento: bloom (o glow neon) ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// (resolução, strength, radius, threshold) — mundo apagado sutil; a centelha clara brilha.
// resolução de bloom em METADE: o blur não precisa de resolução cheia (grande economia).
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5), 0.7, 0.5, 0.8);
composer.addPass(bloom);
bloom.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);

// --- Câmera top-down seguindo a centelha ---
function placeCamera(snap) {
  const t = spark.position;
  const desiredX = t.x;
  const desiredY = t.y + BAL.camera.height;
  const desiredZ = t.z + BAL.camera.back;
  if (snap) {
    camera.position.set(desiredX, desiredY, desiredZ);
  } else {
    const k = 1 - Math.exp(-BAL.camera.followLerp * lastDt);
    camera.position.x += (desiredX - camera.position.x) * k;
    camera.position.y += (desiredY - camera.position.y) * k;
    camera.position.z += (desiredZ - camera.position.z) * k;
  }
  camera.lookAt(t.x, t.y, t.z);
}

// --- Estado de debug (qa-tester lê via window.__DEBUG__) ---
const debugState = { state: 'play', fps: 0, spark: { x: 0, z: 0, speed: 0 } };
window.__DEBUG__ = debugState;

// --- Loop ---
const clock = new THREE.Clock();
let lastDt = 0.016;
let fpsAccum = 0;
let fpsFrames = 0;
placeCamera(true);

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  lastDt = dt;

  spark.update(dt, input.dir());
  placeCamera(false);

  fpsAccum += dt;
  fpsFrames += 1;
  if (fpsAccum >= 0.5) {
    debugState.fps = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
  }
  debugState.spark.x = spark.position.x;
  debugState.spark.z = spark.position.z;
  debugState.spark.speed = spark.speed;

  composer.render();
}
renderer.setAnimationLoop(loop);

// --- Resize responsivo ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5); // mantém o bloom em meia-res
});
