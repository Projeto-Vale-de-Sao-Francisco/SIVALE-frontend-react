import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }) });

const HORAS = 48;

async function main() {
  if (await prisma.usuario.count()) {
    console.log('Banco já contém dados. Nada a fazer (use `npx prisma migrate reset` para recomeçar).');
    return;
  }

  const senha = await bcrypt.hash('123456', 10);
  const [admin, gestor, tecnico, produtor] = await Promise.all(
    [
      { nomeCompleto: 'Administrador SIVALE', cpf: '00000000000', email: 'admin@sivale.com.br', perfil: 'ADMINISTRADOR' },
      { nomeCompleto: 'Gabriela Gestora', cpf: '22222222222', email: 'gestor@sivale.com.br', perfil: 'GESTOR' },
      { nomeCompleto: 'Mariana Técnica', cpf: '33333333333', email: 'tecnico@sivale.com.br', perfil: 'TECNICO' },
      { nomeCompleto: 'Carlos Produtor', cpf: '11111111111', email: 'carlos@sivale.com.br', perfil: 'PRODUTOR' },
    ].map((u) => prisma.usuario.create({ data: { ...u, senha, perfil: u.perfil as 'ADMINISTRADOR' } })),
  );

  const manga = await prisma.cultura.create({
    data: { nome: 'Manga', variedade: 'Tommy Atkins', temperaturaMin: 20, temperaturaMax: 34, umidadeMin: 40, umidadeMax: 70, cicloMedioDias: 150, descricao: 'Muito sensível ao manejo da água, ao clima e a condições pós-colheita.' },
  });
  const uva = await prisma.cultura.create({
    data: { nome: 'Uva', variedade: 'Thompson Seedless', temperaturaMin: 15, temperaturaMax: 32, umidadeMin: 35, umidadeMax: 65, cicloMedioDias: 120, descricao: 'Sensível a mudanças de clima e a doenças fúngicas.' },
  });

  const fazenda1 = await prisma.propriedade.create({
    data: { nome: 'Fazenda Vale Verde', localizacao: 'Projeto Nilo Coelho', municipio: 'Petrolina', estado: 'PE', latitude: -9.1655, longitude: -40.7895, areaTotal: 120 },
  });
  const fazenda2 = await prisma.propriedade.create({
    data: { nome: 'Estância das Águas', localizacao: 'Projeto Mandacaru', municipio: 'Juazeiro', estado: 'BA', latitude: -9.3310, longitude: -40.5680, areaTotal: 85 },
  });

  await prisma.usuarioPropriedade.createMany({
    data: [
      { usuarioId: gestor.id, propriedadeId: fazenda1.id },
      { usuarioId: gestor.id, propriedadeId: fazenda2.id },
      { usuarioId: tecnico.id, propriedadeId: fazenda1.id },
      { usuarioId: produtor.id, propriedadeId: fazenda1.id },
    ],
  });
  void admin;

  const talhoes = await Promise.all([
    prisma.talhao.create({ data: { propriedadeId: fazenda1.id, culturaId: manga.id, nome: 'Talhão 42', latitude: -9.1655, longitude: -40.7895, area: 12, dataPlantio: new Date('2024-02-01'), previsaoColheita: new Date('2026-11-20') } }),
    prisma.talhao.create({ data: { propriedadeId: fazenda1.id, culturaId: uva.id, nome: 'Talhão 07', latitude: -9.1700, longitude: -40.7830, area: 8, dataPlantio: new Date('2024-05-10'), previsaoColheita: new Date('2026-10-12') } }),
    prisma.talhao.create({ data: { propriedadeId: fazenda2.id, culturaId: uva.id, nome: 'Setor Sul', latitude: -9.3310, longitude: -40.5680, area: 8, dataPlantio: new Date('2024-05-10'), previsaoColheita: new Date('2026-10-12') } }),
  ]);

  const dispositivos = await Promise.all(
    talhoes.map((t, i) =>
      prisma.dispositivo.create({
        data: {
          talhaoId: t.id,
          codigo: `ESP32-0${i + 1}`,
          nome: `ESP32 - ${t.nome}`,
          latitude: t.latitude,
          longitude: t.longitude,
          dataInstalacao: new Date(),
          sensor: { create: [{ tipo: 'temperatura', unidadeMedida: '°C' }, { tipo: 'umidade', unidadeMedida: '%' }] },
        },
      }),
    ),
  );

  // Historico simulado: ciclo diario suave + alguns picos fora da faixa para exercitar os alertas.
  const agora = Date.now();
  const medicoes = dispositivos.flatMap((d, di) =>
    Array.from({ length: HORAS }, (_, i) => {
      const h = HORAS - i;
      const ciclo = Math.sin(((h % 24) / 24) * Math.PI * 2);
      const pico = i === HORAS - 3 && di === 0;
      return {
        dispositivoId: d.id,
        dataHora: new Date(agora - h * 3600_000),
        temperatura: Number((27 + ciclo * 5 + (pico ? 9 : 0) + di * -1.5).toFixed(1)),
        umidade: Number((52 - ciclo * 12 + di * 3).toFixed(1)),
      };
    }),
  );
  await prisma.medicao.createMany({ data: medicoes });

  const primeiraForaDaFaixa = await prisma.medicao.findFirst({ where: { dispositivoId: dispositivos[0].id, temperatura: { gt: 34 } } });
  if (primeiraForaDaFaixa) {
    await prisma.alerta.create({
      data: {
        talhaoId: talhoes[0].id,
        medicaoId: primeiraForaDaFaixa.id,
        nivel: 'ATENCAO',
        titulo: 'Temperatura acima do recomendado',
        descricao: `Temperatura acima do recomendado para o talhão ${talhoes[0].nome} (manga): ${primeiraForaDaFaixa.temperatura}°C > 34°C.`,
      },
    });
  }

  await prisma.valorMercado.createMany({
    data: [
      { culturaId: manga.id, mercadoDestino: 'Europa', precoMedio: 8.9, moeda: 'BRL', dataReferencia: new Date(), demandaEstimada: 'alta' },
      { culturaId: manga.id, mercadoDestino: 'Estados Unidos', precoMedio: 9.6, moeda: 'BRL', dataReferencia: new Date(), demandaEstimada: 'média' },
      { culturaId: uva.id, mercadoDestino: 'Europa', precoMedio: 14.2, moeda: 'BRL', dataReferencia: new Date(), demandaEstimada: 'alta' },
      { culturaId: uva.id, mercadoDestino: 'Mercado interno', precoMedio: 10.5, moeda: 'BRL', dataReferencia: new Date(), demandaEstimada: 'média' },
    ],
  });

  await prisma.operacaoLogistica.createMany({
    data: [
      { propriedadeId: fazenda1.id, talhaoId: talhoes[0].id, origem: 'Petrolina/PE', destino: 'Porto de Pecém/CE', modal: 'rodoviário', tempoEstimado: '18h', custoEstimado: 12500, transportadora: 'TransFrutas', situacao: 'PLANEJADA', dataPrevista: new Date(agora + 7 * 86400_000) },
      { propriedadeId: fazenda2.id, origem: 'Juazeiro/BA', destino: 'Porto de Salvador/BA', modal: 'rodoviário', tempoEstimado: '10h', custoEstimado: 8200, transportadora: 'Vale Cargas', situacao: 'PLANEJADA' },
    ],
  });

  console.log('Seed concluído.');
  console.log('Logins (senha 123456): admin@ / gestor@ / tecnico@ / carlos@ sivale.com.br');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
