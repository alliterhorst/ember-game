// src/utils/control.js — lógica pura do controle (testável sem DOM).

/**
 * Mapeia o offset do ponteiro (em px, a partir do centro) para um vetor de direção {x,z}
 * com magnitude [0,1] proporcional, aplicando zona morta. reachPx = distância (px) para
 * magnitude máxima. Acima dela, satura em 1.
 * @returns {{x:number, z:number}}
 */
export function pointerToDir(dx, dy, reachPx, deadzone) {
  const x = dx / reachPx;
  const y = dy / reachPx;
  const mag = Math.hypot(x, y);
  if (mag < deadzone) return { x: 0, z: 0 };
  const t = Math.min((mag - deadzone) / (1 - deadzone), 1);
  return { x: (x / mag) * t, z: (y / mag) * t };
}
