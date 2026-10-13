export type DispositivoEsp = { id: number; talhaoId: number };

export function gerarLeiturasEspMock(dispositivos: DispositivoEsp[], agora = Date.now(), quantidade = 24) {
  return dispositivos.flatMap((dispositivo, indiceDispositivo) =>
    Array.from({ length: quantidade }, (_, indice) => {
      const passo = quantidade - 1 - indice;
      const onda = Math.sin((indice + indiceDispositivo * 2) / 3);
      return {
        id: `esp-mock-${dispositivo.id}-${indice}`,
        dispositivoId: dispositivo.id,
        sensorId: dispositivo.id,
        talhaoId: dispositivo.talhaoId,
        dataHora: new Date(agora - passo * 60 * 60 * 1000).toISOString(),
        temperatura: Number((27 + onda * 3 + indiceDispositivo * 0.4).toFixed(1)),
        umidade: Number((62 - onda * 9 - indiceDispositivo).toFixed(1)),
        simulado: true,
      };
    })
  );
}
