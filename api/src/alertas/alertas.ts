import { Controller, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { AcessoService } from '../common/acesso.service.js';
import { Usuario, type UsuarioLogado } from '../common/decorators.js';
import { NivelAlerta } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export class FiltroAlertaDto {
  @IsOptional() @Type(() => Number) @IsInt() talhaoId?: number;
  @IsOptional() @Type(() => Number) @IsInt() propriedadeId?: number;
  @IsOptional() @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value)) @IsBoolean() visualizado?: boolean;
  @IsOptional() @IsEnum(NivelAlerta) nivel?: NivelAlerta;
}

// Amplitude fora da faixa acima desta fracao da largura da faixa vira CRITICO.
const LIMITE_CRITICO = 0.15;

@Injectable()
export class AlertasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acesso: AcessoService,
  ) {}

  listar(u: UsuarioLogado, f: FiltroAlertaDto) {
    return this.prisma.alerta.findMany({
      where: {
        AND: [
          this.acesso.alerta(u),
          {
            talhaoId: f.talhaoId,
            visualizado: f.visualizado,
            nivel: f.nivel,
            ...(f.propriedadeId ? { talhao: { propriedadeId: f.propriedadeId } } : {}),
          },
        ],
      },
      include: { talhao: { select: { id: true, nome: true, propriedadeId: true } } },
      orderBy: { dataHora: 'desc' },
      take: 200,
    });
  }

  async marcarVisualizado(u: UsuarioLogado, id: number) {
    const a = await this.prisma.alerta.findFirst({ where: { id, ...this.acesso.alerta(u) }, select: { id: true } });
    if (!a) throw new NotFoundException('Alerta não encontrado.');
    return this.prisma.alerta.update({ where: { id }, data: { visualizado: true } });
  }

  // Regra do requisito 14: medicao fora da faixa da cultura do talhao gera alerta sozinha.
  async avaliar(medicao: { id: number; dispositivoId: number; temperatura: number; umidade: number }) {
    const d = await this.prisma.dispositivo.findUnique({
      where: { id: medicao.dispositivoId },
      select: { talhao: { select: { id: true, nome: true, cultura: true } } },
    });
    const talhao = d?.talhao;
    const cultura = talhao?.cultura;
    if (!talhao || !cultura) return [];

    const checagens = [
      { rotulo: 'Temperatura', unidade: '°C', v: medicao.temperatura, min: cultura.temperaturaMin, max: cultura.temperaturaMax },
      { rotulo: 'Umidade', unidade: '%', v: medicao.umidade, min: cultura.umidadeMin, max: cultura.umidadeMax },
    ];

    const dados = checagens.flatMap((c) => {
      if (c.v >= c.min && c.v <= c.max) return [];
      const acima = c.v > c.max;
      const desvio = acima ? c.v - c.max : c.min - c.v;
      const nivel: NivelAlerta = desvio > (c.max - c.min) * LIMITE_CRITICO ? 'CRITICO' : 'ATENCAO';
      return [
        {
          talhaoId: talhao.id,
          medicaoId: medicao.id,
          nivel,
          titulo: `${c.rotulo} ${acima ? 'acima' : 'abaixo'} do recomendado`,
          descricao: `${c.rotulo} ${acima ? 'acima' : 'abaixo'} do recomendado para o talhão ${talhao.nome} (${cultura.nome.toLowerCase()}): ${c.v}${c.unidade} ${acima ? '>' : '<'} ${acima ? c.max : c.min}${c.unidade}.`,
        },
      ];
    });

    if (dados.length) await this.prisma.alerta.createMany({ data: dados });
    return dados;
  }
}

@ApiTags('alertas')
@ApiBearerAuth()
@Controller('alertas')
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get() listar(@Usuario() u: UsuarioLogado, @Query() f: FiltroAlertaDto) { return this.service.listar(u, f); }

  @Patch(':id/visualizar')
  visualizar(@Usuario() u: UsuarioLogado, @Param('id', ParseIntPipe) id: number) { return this.service.marcarVisualizado(u, id); }
}

@Module({ controllers: [AlertasController], providers: [AlertasService], exports: [AlertasService] })
export class AlertasModule {}
