import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcessoService } from '../common/acesso.service.js';
import { Usuario, type UsuarioLogado } from '../common/decorators.js';
import { FiltroMedicaoDto, MedicoesModule, MedicoesService } from '../medicoes/medicoes.js';
import { PrismaService } from '../prisma/prisma.service.js';

const media = (v: number[]) => (v.length ? Number((v.reduce((s, x) => s + x, 0) / v.length).toFixed(1)) : null);

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acesso: AcessoService,
    private readonly medicoes: MedicoesService,
  ) {}

  async resumo(u: UsuarioLogado, f: FiltroMedicaoDto) {
    const where = this.medicoes.where(u, f);
    const talhaoFiltro = { propriedadeId: f.propriedadeId, culturaId: f.culturaId };

    const [ultimas, totalMedicoes, dispositivosAtivos, alertasAtivos] = await Promise.all([
      this.prisma.medicao.findMany({ where, orderBy: { dataHora: 'desc' }, take: 50 }),
      this.prisma.medicao.count({ where }),
      this.prisma.dispositivo.count({
        where: { AND: [this.acesso.dispositivo(u), { status: 'ATIVO', talhaoId: f.talhaoId, talhao: talhaoFiltro }] },
      }),
      this.prisma.alerta.count({
        where: { AND: [this.acesso.alerta(u), { visualizado: false, talhaoId: f.talhaoId, talhao: talhaoFiltro }] },
      }),
    ]);

    return {
      temperaturaAtual: ultimas[0]?.temperatura ?? null,
      umidadeAtual: ultimas[0]?.umidade ?? null,
      temperaturaMedia: media(ultimas.map((m) => m.temperatura)),
      umidadeMedia: media(ultimas.map((m) => m.umidade)),
      dispositivosAtivos,
      totalMedicoes,
      alertasAtivos,
    };
  }

  // Serie temporal em ordem cronologica (ultimos 500 pontos do filtro).
  async historico(u: UsuarioLogado, f: FiltroMedicaoDto) {
    const linhas = await this.prisma.medicao.findMany({
      where: this.medicoes.where(u, f),
      select: { dataHora: true, temperatura: true, umidade: true, dispositivoId: true, dispositivo: { select: { talhaoId: true } } },
      orderBy: { dataHora: 'desc' },
      take: 500,
    });
    return linhas
      .reverse()
      .map(({ dispositivo, ...m }) => ({ ...m, talhaoId: dispositivo.talhaoId }));
  }
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('resumo') resumo(@Usuario() u: UsuarioLogado, @Query() f: FiltroMedicaoDto) { return this.service.resumo(u, f); }
  @Get('historico') historico(@Usuario() u: UsuarioLogado, @Query() f: FiltroMedicaoDto) { return this.service.historico(u, f); }
}

@Module({ imports: [MedicoesModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
