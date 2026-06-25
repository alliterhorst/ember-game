// src/config/balance.js — TODOS os números de gameplay. Dono: balance-designer.
// Regra: nenhum valor de gameplay fora daqui. Código importa { BAL }.
export const BAL = {
  spark: {
    maxSpeed: 11, // unidades/segundo na magnitude máxima do ponteiro
    accel: 9, // suavização da velocidade (quanto maior, mais responsivo)
    radius: 0.6, // tamanho/colisão inicial da centelha
  },
  control: {
    reach: 0.28, // fração da menor dimensão da tela p/ velocidade máxima
    deadzone: 0.10, // zona morta no centro (parado)
  },
  camera: {
    height: 22, // altura da câmera top-down
    back: 7, // leve recuo (perspectiva, não 90° puro)
    fov: 55,
    followLerp: 6, // suavização do follow
  },
  game: {
    motesCount: 50, // motas de luz simultâneas no Bosque
    motesInner: 6, // raio livre no centro
    motesOuter: 72,
    absorbRadius: 1.6, // alcance de absorção (cresce com a centelha)
    growPerMote: 0.035, // quanto a centelha cresce por mota absorvida
    motesToReacender: 16, // motas pra encher a barra de luz
    worldRadius: 74, // limite jogável (a centelha não sai do mundo)
  },
  // Densidade do bosque (art-direction "Mundo Vivo"): dois anéis p/ matar o vazio
  forest: {
    count: 520, // instâncias (2 draw calls); dobro do antigo p/ ler "floresta"
    inner: 6, // início do anel-palco
    mid: 26, // fronteira palco/muralha
    outer: 72, // borda do bosque
    innerFrac: 0.35, // fração das árvores no anel interno (mais espaçadas)
    buryY: -0.3, // base enterrada no chão (mata o "flutuar")
  },
  // Vida ambiente persistente (Points à deriva) — detalhe/quantidade barata
  ambient: {
    fireflies: 140, // vaga-lumes nas zonas reacesas
    pollen: 80, // poeira-luz suspensa (atmosfera)
    spread: 74, // raio de distribuição
    driftMin: 0.3,
    driftMax: 0.6,
    bobAmp: 0.4,
  },
  // Curva de luz global ADORMECIDO(0) -> REACESO(1)
  world: {
    fogDensitySleep: 0.022,
    fogDensityLit: 0.0065, // abre o mundo (dá ar/profundidade)
    bloomSleep: 0.7,
    bloomLit: 1.45,
    hemiSleep: 0.4,
    hemiLit: 1.15, // luz ambiente SOBE: mundo vivo é luminoso
    sunSleep: 0.35,
    sunLit: 0.9, // a direcional vira sol quente
    lerpSpeed: 1.5, // suavização da transição global
  },
};
