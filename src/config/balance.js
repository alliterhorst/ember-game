// src/config/balance.js — TODOS os números de gameplay. Dono: balance-designer.
// Regra: nenhum valor de gameplay fora daqui. Código importa { BAL }.
export const BAL = {
  spark: {
    maxSpeed: 11, // unidades/segundo na magnitude máxima do ponteiro
    accel: 9, // suavização da velocidade (quanto maior, mais responsivo)
    radius: 0.6, // tamanho/colisão inicial da centelha
    dashSpeed: 26, // impulso do sopro/dash (verbo 1)
    dashCooldown: 1.4, // s entre dashes
    dashGlow: 0.6, // s de halo ampliado pós-dash (empurra a sombra)
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
    motesOuter: 84,
    absorbRadius: 1.6, // alcance de absorção (cresce com a centelha)
    growPerMote: 0.035, // quanto a centelha cresce por mota absorvida
    motesToReacender: 16, // motas pra encher a barra de luz
    worldRadius: 88, // limite jogável: perto da borda visual (chão 120, névoa esconde o fim)
  },
  // Densidade do bosque (art-direction "Mundo Vivo"): dois anéis p/ matar o vazio
  forest: {
    count: 640, // instâncias (2 draw calls); mundo maior pede mais árvores
    inner: 6, // início do anel-palco
    mid: 28, // fronteira palco/muralha
    outer: 86, // borda do bosque (acompanha o novo limite jogável)
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
  // As Sombras (perigo): véus que DRENAM a barra de luz (nunca matam). Decisão: GAME_GUIDE §7.3
  shadow: {
    count: 7, // véus no mundo
    rMin: 9,
    rMax: 15,
    innerClear: 24, // raio livre no centro (sem sombra perto do spawn)
    drainPerSec: 2.2, // luz/seg drenada no fundo do véu (penetração escala isso)
    haloBase: 2.4, // raio seguro da centelha (atravessa véu fino)
    haloPerSize: 1.7, // o halo cresce com o tamanho da centelha (grande = imune)
    recede: 10, // distância em que o véu recua/esmaece diante da centelha
  },
  // Espreitas: criaturas-sombra que fogem da luz. Pequena você teme; grande você liberta.
  lurker: {
    count: 14,
    speed: 7, // < player (11): desviável por construção
    wanderSpeed: 1.8,
    fleeRadius: 17, // começa a fugir da luz
    contactR: 2.2,
    absorbSize: 1.7, // tamanho da centelha p/ ABSORVER (libertar) em vez de ser drenada
    drainOnTouch: 3.5, // luz drenada ao encostar quando pequena
    freeLight: 2, // luz ganha ao libertar uma espreita
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
