import { describe, expect, it } from "vitest";
import { calcularAreaHa } from "./geo";

describe("calcularAreaHa", () => {
  it("calcula aproximadamente um hectare para um quadrado de 100 metros", () => {
    const ladoEmGraus = 100 / 111_320;
    const area = calcularAreaHa([
      [0, 0],
      [0, ladoEmGraus],
      [ladoEmGraus, ladoEmGraus],
      [ladoEmGraus, 0],
    ]);

    expect(area).toBeGreaterThan(0.98);
    expect(area).toBeLessThan(1.02);
  });

  it("não calcula área antes do terceiro ponto", () => {
    expect(calcularAreaHa([[0, 0], [0, 1]])).toBe(0);
  });
});
