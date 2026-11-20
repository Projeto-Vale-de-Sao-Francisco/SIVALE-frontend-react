import { describe, expect, it } from "vitest";
import { gerarLeiturasEspMock } from "./espMock";

describe("gerarLeiturasEspMock", () => {
  it("gera uma série identificada como simulada para cada dispositivo", () => {
    const agora = new Date("2026-10-13T12:00:00.000Z").getTime();
    const leituras = gerarLeiturasEspMock([
      { id: 7, talhaoId: 3 },
      { id: 8, talhaoId: 4 },
    ], agora, 4);

    expect(leituras).toHaveLength(8);
    expect(leituras.every((l) => l.simulado)).toBe(true);
    expect(new Set(leituras.map((l) => l.dispositivoId))).toEqual(new Set([7, 8]));
    expect(leituras.every((l) => l.temperatura >= 20 && l.temperatura <= 40)).toBe(true);
    expect(leituras.every((l) => l.umidade >= 35 && l.umidade <= 90)).toBe(true);
  });
});
