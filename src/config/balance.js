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
};
