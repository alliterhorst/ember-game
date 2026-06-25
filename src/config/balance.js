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
};
