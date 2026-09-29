import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AcessoService } from '../common/acesso.service.js';
import { ADMIN_GESTOR_TECNICO, Roles, Usuario, type UsuarioLogado } from '../common/decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AlertasModule, AlertasService } from '../alertas/alertas.js';

export class RegistrarMedicaoDto {
  @ApiPropertyOptional({ description: 'Informe dispositivoId ou codigoDispositivo' }) @IsOptional() @Type(() => Number) @IsInt() dispositivoId?: number;
  @ApiPropertyOptional({ example: 'ESP32-01' }) @IsOptional() @IsString() codigoDispositivo?: string;
  @ApiProperty({ example: 27.4 }) @Type(() => Number) @IsNumber() temperatura: number;
  @ApiProperty({ example: 55 }) @Type(() => Number) @IsNumber() umidade: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() umidadeSolo?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() luminosidade?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() precipitacao?: number;
  @ApiPropertyOptional({ description: 'ISO 8601; padrao: agora' }) @IsOptional() @IsDateString() dataHora?: string;
}

export class FiltroMedicaoDto {
  @IsOptional() @Type(() => Number) @IsInt() dispositivoId?: number;
  @IsOptional() @Type(() => Number) @IsInt() talhaoId?: number;
  @IsOptional() @Type(() => Number) @IsInt() propriedadeId?: number;
  @IsOptional() @Type(() => Number) @IsInt() culturaId?: number;
  @IsOptional() @IsDateString() inicio?: string;
  @IsOptional() @IsDateString() fim?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) limite?: number;
}

@Injectable()
export class MedicoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acesso: AcessoService,
    private readonly alertas: AlertasService,
  ) {}

  where(u: UsuarioLogado, f: FiltroMedicaoDto) {
    return {
      AND: [
        this.acesso.medicao(u),
        {
          dispositivoId: f.dispositivoId,
          dataHora: { gte: f.inicio ? new Date(f.inicio) : undefined, lte: f.fim ? new Date(f.fim) : undefined },
          dispositivo: {
            talhaoId: f.talhaoId,
            talhao: { propriedadeId: f.propriedadeId, culturaId: f.culturaId },
          },
        },
      ],
    };
  }

  listar(u: UsuarioLogado, f: FiltroMedicaoDto) {
    return this.prisma.medicao.findMany({
      where: this.where(u, f),
      orderBy: { dataHora: 'desc' },
      take: f.limite ?? 100,
    });
  }

  async registrar(u: UsuarioLogado, dto: RegistrarMedicaoDto) {
    const { dispositivoId, codigoDispositivo, ...dados } = dto;
    if (!dispositivoId && !codigoDispositivo) {
      throw new BadRequestException('Informe dispositivoId ou codigoDispositivo.');
    }
    const d = await this.prisma.dispositivo.findFirst({
      where: { ...(dispositivoId ? { id: dispositivoId } : { codigo: codigoDispositivo }), ...this.acesso.dispositivo(u) },
      select: { id: true, status: true },
    });
    if (!d) throw new NotFoundException('Dispositivo não encontrado.');
    return this.gravar(d.id, dados);
  }

  // Usado tambem por integracoes (ex.: ThingSpeak) que ja resolveram o dispositivo.
  async gravar(dispositivoId: number, dados: Omit<RegistrarMedicaoDto, 'dispositivoId' | 'codigoDispositivo'>) {
    const medicao = await this.prisma.medicao.create({
      data: { ...dados, dispositivoId, dataHora: dados.dataHora ? new Date(dados.dataHora) : new Date() },
    });
    const alertas = await this.alertas.avaliar(medicao);
    return { ...medicao, alertasGerados: alertas.length };
  }
}

@ApiTags('medicoes')
@ApiBearerAuth()
@Controller('medicoes')
export class MedicoesController {
  constructor(private readonly service: MedicoesService) {}

  @Get() listar(@Usuario() u: UsuarioLogado, @Query() f: FiltroMedicaoDto) { return this.service.listar(u, f); }

  @Roles(...ADMIN_GESTOR_TECNICO) @Post()
  registrar(@Usuario() u: UsuarioLogado, @Body() dto: RegistrarMedicaoDto) { return this.service.registrar(u, dto); }
}

@Module({
  imports: [AlertasModule],
  controllers: [MedicoesController],
  providers: [MedicoesService],
  exports: [MedicoesService],
})
export class MedicoesModule {}
