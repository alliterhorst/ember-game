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
import Flora from './systems/Flora.js';
import Shadow from './systems/Shadow.js';
import Lurkers from './systems/Lurkers.js';
import Audio from './systems/Audio.js';
import Music from './systems/Music.js';
import Hud from './ui/Hud.js';
import StartScreen from './ui/StartScreen.js';
import EdgeCues from './ui/EdgeCues.js';
import { STORY } from './data/story.js';
import { BIOMES } from './config/biomes.js';

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

// onda de choque de luz no reacender (anel rasteiro que varre o chão) + flash de bloom
const SHOCK_SPEED = 42; // casa com a cascata do bosque (Forest WAVE_SPEED)
const shocks = [];
for (let i = 0; i < 4; i += 1) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.0, 56).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }),
  );
  ring.position.y = 0.3;
  ring.visible = false;
  scene.add(ring);
  shocks.push({ ring, t: 0, active: false, maxR: 32 });
}
let shockCursor = 0;
let shockFlash = 0;
function triggerShock(x, z, color, maxR) {
  const s = shocks[shockCursor];
  shockCursor = (shockCursor + 1) % shocks.length;
  s.active = true; s.t = 0; s.maxR = maxR;
  s.ring.position.set(x, 0.3, z);
  s.ring.material.color.set(color);
  s.ring.visible = true;
  shockFlash = 1;
}

// --- Mundo + centelha + sistemas ---
const forest = new Forest(scene);
const hearts = new Hearts(scene);
const creatures = new Creatures(scene);
const ambient = new Ambient(scene);
const flora = new Flora(scene);
const shadow = new Shadow(scene);
const lurkers = new Lurkers(scene);
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

// --- botão de mudo visível (mobile não tem tecla M) — hit >=44px, canto seguro ---
const muteBtn = document.createElement('button');
muteBtn.setAttribute('aria-label', 'mudo');
muteBtn.textContent = '♪';
muteBtn.style.cssText = 'position:fixed;top:14px;right:14px;width:44px;height:44px;border:none;border-radius:50%;background:rgba(255,255,255,0.07);color:#fff;font-size:20px;cursor:pointer;z-index:9;display:flex;align-items:center;justify-content:center;transition:opacity .3s;';
muteBtn.addEventListener('pointerdown', (e) => e.stopPropagation()); // não move a centelha / não inicia o jogo
muteBtn.addEventListener('click', () => {
  audio.toggleMute(); music.toggleMute();
  const m = audio.muted;
  muteBtn.textContent = m ? '⊘' : '♪';
  muteBtn.style.opacity = m ? '0.45' : '1';
});
app.appendChild(muteBtn);

// volta da aba oculta: descarta o delta acumulado (evita salto)
document.addEventListener('visibilitychange', () => { if (!document.hidden) clock.getDelta(); });

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
  scene.fog.density = W.fogDensitySleep + w * (W.fogDensityLit * biomeFogScale - W.fogDensitySleep);
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

// --- Fluxo entre biomas: limiar de luz -> travessia -> regeneração (novo bioma) ---
let biomeIndex = 0;
let portalActive = false;
let transitioning = false;
let portalX = 0;
let portalZ = 0;

// o limiar (portal): anel + poça de luz + coluna — brilhante, fura a névoa (fog:false)
const portal = new THREE.Group();
portal.visible = false;
const portalRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.6, 0.55, 10, 32).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: '#eaffff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
);
portalRing.position.y = 0.6;
const portalDisc = new THREE.Mesh(
  new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: haloTex, color: '#d6ffff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
);
portalDisc.position.y = 0.12;
const portalCol = new THREE.Mesh(
  new THREE.CylinderGeometry(3.6, 2.0, 56, 16, 1, true),
  new THREE.MeshBasicMaterial({ map: haloTex, color: '#bfffff', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
);
portalCol.position.y = 28;
const portalLight = new THREE.PointLight('#cfffff', 5, 44, 1.3);
portalLight.position.y = 6;
portal.add(portalRing, portalDisc, portalCol, portalLight);
scene.add(portal);

// overlay branco da travessia (clarão luminoso)
const fadeEl = document.createElement('div');
fadeEl.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:8;transition:opacity 1.1s ease;';
app.appendChild(fadeEl);

// desfecho da jornada (após reacender o Núcleo)
const endEl = document.createElement('div');
endEl.style.cssText = 'position:fixed;inset:0;z-index:11;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0;pointer-events:none;transition:opacity 2.4s ease;background:radial-gradient(ellipse at 50% 46%,rgba(30,26,18,0.25),rgba(8,8,10,0.96));font-family:ui-monospace,"Segoe UI",monospace;color:#fff;padding:24px;';
endEl.innerHTML = `<div style="font-size:clamp(19px,5.2vw,32px);line-height:2.1;letter-spacing:0.18em;text-shadow:0 0 26px ${PALETTE.sparkGlow};white-space:pre-line">${STORY.ending.join('\n')}</div><div style="font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.5);margin-top:42px">${STORY.endingPrompt}</div>`;
app.appendChild(endEl);
let endingShown = false;
function showEnding() {
  endingShown = true;
  endEl.style.opacity = '1';
  setTimeout(() => { endEl.style.pointerEvents = 'auto'; }, 2600);
}
endEl.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (!endingShown) return;
  endingShown = false;
  endEl.style.opacity = '0';
  endEl.style.pointerEvents = 'none';
  regenerate(); // recomeça a jornada (Núcleo -> Bosque)
});

let biomeFogScale = 1; // Dunas = baixa visibilidade
let biomeCurrent = 0; // Recife = correnteza que carrega a centelha
let currentAngle = 0;
function applyBiomeTheme(theme) {
  FOG_LIT.set(theme.fogLit); BG_LIT.set(theme.bgLit); SKY_LIT.set(theme.skyLit);
  HEMIG_LIT.set(theme.hemiGround); SUN_LIT.set(theme.sunLit); GROUND_LIT.set(theme.groundLit);
  biomeFogScale = theme.fogScale || 1;
  biomeCurrent = theme.current || 0;
  forest.applyTheme(theme); hearts.applyTheme(theme); ambient.applyTheme(theme);
}

function spawnPortal() {
  const a = Math.random() * Math.PI * 2;
  portalX = Math.cos(a) * 38; portalZ = Math.sin(a) * 38;
  portal.position.set(portalX, 0, portalZ);
  portal.visible = true;
  portalActive = true;
  hud.flash('um limiar de luz se abre ✦', 5500);
}

function regenerate() {
  biomeIndex = (biomeIndex + 1) % BIOMES.length;
  const theme = BIOMES[biomeIndex];
  applyBiomeTheme(theme);
  forest.reseed();
  hearts.reset();
  creatures.clear();
  ambient.reset();
  flora.clear();
  shadow.reset();
  lurkers.spawn();
  heartsLit = 0; light = 0; worldLight = 0; worldTarget = 0;
  applyWorldLight(0);
  hud.setProgress(0, hearts.count);
  hud.setLight(0);
  spark.position.set(0, 1, 0); spark.vx = 0; spark.vz = 0;
  placeCamera(true);
  music.setReacendido(false);
  music.setBiome(theme.track);
  portal.visible = false; portalActive = false;
  hud.flash(theme.name, 4800);
}

function crossBiome() {
  if (transitioning) return;
  transitioning = true;
  portalActive = false;
  fadeEl.style.opacity = '1';
  setTimeout(regenerate, 1150); // no auge do branco, troca o mundo
  setTimeout(() => { fadeEl.style.opacity = '0'; }, 1550);
  setTimeout(() => { transitioning = false; }, 2800);
}

applyBiomeTheme(BIOMES[0]);

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
window.__DEBUG__.flora = () => ({ ready: flora.ready, rocks: Object.fromEntries(Object.entries(flora.rocks).map(([k, v]) => [k, v.n])), flora: Object.fromEntries(Object.entries(flora.flora).map(([k, v]) => [k, v.n])) });
// custo da cena (draw calls + triângulos) — indicador de carga GPU, independe da aba/throttle
window.__DEBUG__.sceneInfo = () => { renderer.render(scene, camera); return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; };
window.__DEBUG__.spawnPortal = () => spawnPortal();
window.__DEBUG__.cross = () => crossBiome();
window.__DEBUG__.biome = () => ({ index: biomeIndex, name: BIOMES[biomeIndex].name, portalActive, transitioning });
window.__DEBUG__.portalPos = () => ({ x: portalX, z: portalZ });
// frame-time real (p50/p95) — preciso quando a aba está VISÍVEL (rAF não-throttlado)
window.__DEBUG__.frameStats = () => {
  if (!_ftn) return { frames: 0 };
  const a = Array.from(_ft.slice(0, _ftn)).sort((x, y) => x - y);
  const pct = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
  return { p50: +pct(0.5).toFixed(2), p95: +pct(0.95).toFixed(2), max: +a[a.length - 1].toFixed(2), fps: +(1000 / pct(0.5)).toFixed(1), frames: _ftn };
};
window.__DEBUG__.shadow = () => ({ presence: +shadow.presence.toFixed(2), prox: +shadow.proximity(spark.position.x, spark.position.z).toFixed(1), veils: shadow.n });
window.__DEBUG__.lurkers = () => { const out = []; for (let i = 0; i < lurkers.n; i += 1) if (lurkers.active[i]) out.push([Math.round(lurkers.x[i]), Math.round(lurkers.z[i])]); return { active: out.length, pos: out }; };
window.__DEBUG__.grow = (n) => { for (let k = 0; k < n; k += 1) spark.grow(BAL.game.growPerMote); return spark.size; };
window.__DEBUG__.sparkSize = () => spark.size;
window.__DEBUG__.testDash = () => { spark.vx = 10; spark.vz = 0; spark.dashReady = 0; const ok = spark.dash(1, 0); return { ok, vx: +spark.vx.toFixed(1), glow: +spark.dashGlow.toFixed(2) }; };

// --- Pause + qualidade (acessibilidade mobile) ---
let paused = false;
let qualityMode = 'high';
function applyQuality(q) {
  qualityMode = q;
  try { localStorage.setItem('ember_quality', q); } catch (e) { /* ignore */ }
  if (q === 'low') { renderer.setPixelRatio(1); bloom.enabled = false; } else { renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); bloom.enabled = true; }
  qLow.style.opacity = q === 'low' ? '1' : '0.4';
  qHigh.style.opacity = q === 'high' ? '1' : '0.4';
}

const pauseBtn = document.createElement('button');
pauseBtn.setAttribute('aria-label', 'pausar');
pauseBtn.textContent = '⏸';
pauseBtn.style.cssText = 'position:fixed;top:14px;right:66px;width:44px;height:44px;border:none;border-radius:50%;background:rgba(255,255,255,0.07);color:#fff;font-size:17px;cursor:pointer;z-index:9;display:flex;align-items:center;justify-content:center;';
pauseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
app.appendChild(pauseBtn);

const pauseEl = document.createElement('div');
pauseEl.style.cssText = 'position:fixed;inset:0;z-index:12;display:none;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:radial-gradient(ellipse at center,rgba(15,22,24,0.55),rgba(6,9,10,0.92));font-family:ui-monospace,"Segoe UI",monospace;color:#fff;text-align:center;padding:24px;';
const btnCss = 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#fff;font-family:inherit;font-size:15px;letter-spacing:0.12em;padding:12px 26px;border-radius:24px;cursor:pointer;min-width:200px;';
pauseEl.innerHTML = `<div style="font-size:clamp(26px,7vw,42px);letter-spacing:0.3em;margin-bottom:8px;text-shadow:0 0 22px ${PALETTE.sparkGlow}">EMBER</div>`
  + `<button id="pz-resume" style="${btnCss}">continuar</button>`
  + `<button id="pz-restart" style="${btnCss}">recomeçar a jornada</button>`
  + `<div style="display:flex;gap:10px;align-items:center;font-size:12px;letter-spacing:0.2em;color:rgba(255,255,255,0.6);margin-top:6px">qualidade<button id="pz-low" style="${btnCss}min-width:0;padding:8px 16px">baixa</button><button id="pz-high" style="${btnCss}min-width:0;padding:8px 16px">alta</button></div>`
  + '<div style="font-size:11px;letter-spacing:0.2em;color:rgba(255,255,255,0.35);margin-top:4px">baixa = sem bloom, mais leve no celular</div>';
app.appendChild(pauseEl);
const qLow = pauseEl.querySelector('#pz-low');
const qHigh = pauseEl.querySelector('#pz-high');
[pauseEl, pauseBtn].forEach((el) => el.addEventListener('pointerdown', (e) => e.stopPropagation()));
function setPaused(p) { paused = p; pauseEl.style.display = p ? 'flex' : 'none'; pauseBtn.textContent = p ? '⏵' : '⏸'; if (!p) clock.getDelta(); }
pauseBtn.addEventListener('click', () => setPaused(!paused));
pauseEl.querySelector('#pz-resume').addEventListener('click', () => setPaused(false));
pauseEl.querySelector('#pz-restart').addEventListener('click', () => { biomeIndex = BIOMES.length - 1; regenerate(); setPaused(false); });
qLow.addEventListener('click', () => applyQuality('low'));
qHigh.addEventListener('click', () => applyQuality('high'));
try { applyQuality(localStorage.getItem('ember_quality') || 'high'); } catch (e) { applyQuality('high'); }

// --- Loop ---
const clock = new THREE.Clock();
let lastDt = 0.016;
let fpsAccum = 0;
let fpsFrames = 0;
let runTime = 0; // tempo desde "acender" (pro ensino inicial)
const _ft = new Float32Array(180); // frame-times (ms) p/ frameStats (QA)
let _fti = 0; let _ftn = 0;
placeCamera(true);

// acender (tela inicial) -> começa o jogo
startScreen.onStart(() => {
  started = true;
  if (music.start) music.start();
});

// sopro/dash de luz: um TOQUE rápido (sem arrastar) dispara o verbo
let _pdT = 0; let _pdX = 0; let _pdY = 0; let _pdMoved = false;
window.addEventListener('pointerdown', (e) => { _pdT = performance.now(); _pdX = e.clientX; _pdY = e.clientY; _pdMoved = false; });
window.addEventListener('pointermove', (e) => { if (Math.hypot(e.clientX - _pdX, e.clientY - _pdY) > 10) _pdMoved = true; });
window.addEventListener('pointerup', () => {
  if (!started || runTime < 0.6) return;
  if (performance.now() - _pdT > 220 || _pdMoved) return; // toque rápido e parado = dash
  let dx = spark.vx; let dz = spark.vz; let m = Math.hypot(dx, dz);
  if (m < 1) { const d = input.dir(); dx = d.x; dz = d.z; m = Math.hypot(dx, dz); }
  if (m < 0.05) return;
  if (spark.dash(dx / m, dz / m)) {
    particles.burst(spark.position.x, spark.position.y, spark.position.z, 14, PALETTE.sparkGlow, 7, 0.4, 0);
  }
});

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  lastDt = dt;
  if (paused) { composer.render(); return; } // congela o jogo, mantém a cena na tela
  if (started) runTime += dt;

  // antes de "acender", a centelha fica parada (controle travado)
  spark.update(dt, started ? input.dir() : ZERO_DIR, particles);
  // correnteza do bioma (Recife): carrega a centelha numa direção que gira devagar
  if (started && biomeCurrent > 0) {
    currentAngle += dt * 0.18;
    spark.position.x += Math.cos(currentAngle) * biomeCurrent * dt;
    spark.position.z += Math.sin(currentAngle) * biomeCurrent * dt;
  }
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

  // --- Perigo: véus (drenam) + Espreitas (fogem/drenam/libertam). GAME_BIBLE §7.3 ---
  if (started) {
    const shadowPresence = 1 - worldLight * 0.65; // somem no mundo reaceso
    shadow.setPresence(shadowPresence);
    shadow.update(dt, spark.position.x, spark.position.z);
    lurkers.setPresence(shadowPresence);
    const haloR = BAL.shadow.haloBase + spark.size * BAL.shadow.haloPerSize + spark.dashGlow * 6;
    let drain = shadow.drainAt(spark.position.x, spark.position.z, haloR) * dt;
    const lr = lurkers.update(dt, spark.position.x, spark.position.z, spark.size);
    if (lr.drain > 0) { drain += lr.drain; audio.hurt(); }
    if (drain > 0 && light > 0) { light = Math.max(0, light - drain); hud.setLight(light / BAL.game.motesToReacender); }
    for (let f = 0; f < lr.freed.length; f += 1) {
      const fr = lr.freed[f];
      light = Math.min(light + BAL.lurker.freeLight, BAL.game.motesToReacender);
      hud.setLight(light / BAL.game.motesToReacender);
      creatures.spawn(fr.x, fr.z, 2);
      particles.burst(fr.x, 2, fr.z, 16, BIOMES[biomeIndex].bioglow, 5, 0.7, 1);
      audio.freed();
    }
    const prox = shadow.proximity(spark.position.x, spark.position.z);
    const danger = prox < 9 ? Math.min(1, (9 - prox) / 11) : 0;
    audio.setDanger(danger * shadowPresence);
  }

  const ready = light >= BAL.game.motesToReacender && heartsLit < hearts.count;
  // ensino inicial: a dica fica até reunir as primeiras luzes (some sozinha quando entende)
  if (ready) hud.hint('leve a luz a um Coração ☾');
  else if (started && biomeIndex === 0 && heartsLit === 0 && light < 4 && runTime > 1.5) hud.hint(STORY.firstHint);
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
  edgeCues.update(hearts.list, camera, renderer.domElement, ready, portalActive ? { x: portalX, z: portalZ } : null);

  // levar a luz a um Coração -> reacende a região
  const ti = hearts.touched(spark.position.x, spark.position.z, ready);
  if (ti >= 0) {
    const h = hearts.list[ti];
    hearts.reacender(ti);
    forest.reacenderArea(h.x, h.z, 32);
    creatures.spawn(h.x, h.z, 6);
    ambient.litArea(h.x, h.z, 32, 45);
    flora.bloom(h.x, h.z, 26, 65);
    reacenderBurst(h.x, h.z);
    triggerShock(h.x, h.z, BIOMES[biomeIndex].bioglow, 34);
    audio.reacender();
    light = 0;
    hud.setLight(0);
    heartsLit += 1;
    hud.setProgress(heartsLit, hearts.count);
    worldTarget = heartsLit / hearts.count;
    const biomeStory = STORY.biomes[biomeIndex];
    if (heartsLit >= hearts.count) {
      // clímax: o mundo inteiro desperta de uma vez
      music.setReacendido(true);
      forest.reacenderTudo();
      ambient.litAll();
      flora.bloomAll();
      triggerShock(0, 0, BIOMES[biomeIndex].bioglow, BAL.game.worldRadius);
      worldTarget = 1;
      for (let s = 0; s < 5; s += 1) {
        const p = forest.treeAt((s + 0.5) / 5);
        creatures.spawn(p.x, p.z, 4);
      }
      hud.hint(null);
      hud.flash(biomeStory.climax, 7000);
      if (BIOMES[biomeIndex].nucleo) {
        setTimeout(showEnding, 7000); // o Núcleo é o fim da jornada
      } else {
        if (biomeStory.threshold) setTimeout(() => hud.flash(biomeStory.threshold, 6500), 5200);
        setTimeout(spawnPortal, 6500); // abre o limiar pro próximo bioma (logo após o clímax assentar)
      }
    } else {
      hud.flash(biomeStory.hearts[heartsLit - 1], 5500);
    }
  }

  // limiar de luz: pulsa, e ao atravessar (centelha dentro) -> novo bioma
  if (portalActive) {
    const pul = 0.6 + (Math.sin(runTime * 3) * 0.5 + 0.5) * 0.4;
    portalRing.material.opacity = pul;
    portalDisc.material.opacity = 0.45 + pul * 0.3;
    portalRing.rotation.y += dt * 0.6;
    hud.hint('atravesse o limiar ✦');
    const dx = spark.position.x - portalX;
    const dz = spark.position.z - portalZ;
    if (dx * dx + dz * dz < 36) crossBiome();
  }

  // transição global suave (mundo clareia conforme reacende)
  if (Math.abs(worldLight - worldTarget) > 0.001) {
    worldLight += (worldTarget - worldLight) * (1 - Math.exp(-1.5 * dt));
    applyWorldLight(worldLight);
  }

  // onda de choque de luz (anel varrendo o chão) + flash de bloom
  for (let s = 0; s < shocks.length; s += 1) {
    const sh = shocks[s];
    if (!sh.active) continue;
    sh.t += dt;
    const r = sh.t * SHOCK_SPEED;
    sh.ring.scale.set(r, 1, r);
    sh.ring.material.opacity = Math.max(0, 0.85 * (1 - r / sh.maxR));
    if (r >= sh.maxR) { sh.active = false; sh.ring.visible = false; }
  }
  if (shockFlash > 0) shockFlash = Math.max(0, shockFlash - dt * 3.2);
  bloom.strength = (BAL.world.bloomSleep + worldLight * (BAL.world.bloomLit - BAL.world.bloomSleep)) + shockFlash * 0.9;

  forest.update(dt);
  creatures.update(dt);
  ambient.update(dt);
  flora.update(dt);
  particles.update(dt);
  halo.position.x = spark.position.x;
  halo.position.z = spark.position.z;
  placeCamera(false);

  _ft[_fti] = dt * 1000; _fti = (_fti + 1) % 180; if (_ftn < 180) _ftn += 1;
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
