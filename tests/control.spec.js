import { describe, it, expect } from 'vitest';
import { pointerToDir } from '../src/utils/control.js';

describe('pointerToDir (controle, lógica pura)', () => {
  it('centro (dentro da zona morta) = parado', () => {
    expect(pointerToDir(0, 0, 100, 0.1)).toEqual({ x: 0, z: 0 });
    expect(pointerToDir(5, 0, 100, 0.1)).toEqual({ x: 0, z: 0 }); // 0.05 < 0.1
  });

  it('longe satura a magnitude em 1', () => {
    const d = pointerToDir(300, 0, 100, 0.1); // muito além do reach
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
    expect(d.x).toBeCloseTo(1);
    expect(d.z).toBeCloseTo(0);
  });

  it('aponta na direção do ponteiro', () => {
    const d = pointerToDir(0, 100, 100, 0.1); // pra baixo (sul, +z)
    expect(d.x).toBeCloseTo(0);
    expect(d.z).toBeGreaterThan(0);
  });

  it('magnitude proporcional entre a zona morta e o reach', () => {
    const d = pointerToDir(55, 0, 100, 0.1); // mag bruta 0.55 -> remapeada
    const m = Math.hypot(d.x, d.z);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(1);
  });
});
