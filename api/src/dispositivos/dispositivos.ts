import { Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';
import { AcessoService } from '../common/acesso.service.js';
import { ADMIN_GESTOR, Roles, Usuario, type UsuarioLogado } from '../common/decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';

export class CriarDispositivoDto {
  @ApiProperty() @Type(() => Number) @IsInt() talhaoId: number;
  @ApiProperty({ example: 'ESP32-01', description: 'Identificador usado pelo hardware/AWS IoT Core' }) @IsString() @Length(2, 60) codigo: string;
  @ApiProperty({ example: 'ESP32 - Talhão A' }) @IsString() @Length(2, 120) nome: string;
  @ApiPropertyOptional({ example: 'ESP32' }) @IsOptional() @IsString() tipo?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsLatitude() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsLongitude() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInstalacao?: string;
}
export class AtualizarDispositivoDto extends PartialType(OmitType(CriarDispositivoDto, ['talhaoId'] as const)) {
  @ApiPropertyOptional({ enum: ['ATIVO', 'INATIVO'] }) @IsOptional() @IsIn(['ATIVO', 'INATIVO']) status?: string;
}
export class FiltroDispositivoDto {
  @IsOptional() @Type(() => Number) @IsInt() talhaoId?: number;
  @IsOptional() @Type(() => Number) @IsInt() propriedadeId?: number;
}

const data = (v?: string) => (v ? new Date(v) : undefined);

@Injectable()
export class DispositivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acesso: AcessoService,
  ) {}

  listar(u: UsuarioLogado, f: FiltroDispositivoDto) {
    return this.prisma.dispositivo.findMany({
      where: { ...this.acesso.dispositivo(u), talhaoId: f.talhaoId, ...(f.propriedadeId ? { talhao: { propriedadeId: f.propriedadeId } } : {}) },
      include: { sensor: true },
      orderBy: { codigo: 'asc' },
    });
  }

  async buscar(u: UsuarioLogado, id: number) {
    const d = await this.prisma.dispositivo.findFirst({
      where: { id, ...this.acesso.dispositivo(u) },
      include: { sensor: true, talhao: true },
    });
    if (!d) throw new NotFoundException('Dispositivo não encontrado.');
    return d;
  }

  async criar(u: UsuarioLogado, dto: CriarDispositivoDto) {
    await this.acesso.garantirTalhao(u, dto.talhaoId);
    if (await this.prisma.dispositivo.findUnique({ where: { codigo: dto.codigo }, select: { id: true } })) {
      throw new ConflictException('Já existe um dispositivo com este código.');
    }
    return this.prisma.dispositivo.create({ data: { ...dto, dataInstalacao: data(dto.dataInstalacao) } });
  }

  async atualizar(u: UsuarioLogado, id: number, dto: AtualizarDispositivoDto) {
    await this.acesso.garantirDispositivo(u, id);
    return this.prisma.dispositivo.update({ where: { id }, data: { ...dto, dataInstalacao: data(dto.dataInstalacao) } });
  }
}

@ApiTags('dispositivos')
@ApiBearerAuth()
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly service: DispositivosService) {}

  @Get() listar(@Usuario() u: UsuarioLogado, @Query() f: FiltroDispositivoDto) { return this.service.listar(u, f); }
  @Get(':id') buscar(@Usuario() u: UsuarioLogado, @Param('id', ParseIntPipe) id: number) { return this.service.buscar(u, id); }

  @Roles(...ADMIN_GESTOR) @Post()
  criar(@Usuario() u: UsuarioLogado, @Body() dto: CriarDispositivoDto) { return this.service.criar(u, dto); }

  @Roles(...ADMIN_GESTOR) @Patch(':id')
  atualizar(@Usuario() u: UsuarioLogado, @Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarDispositivoDto) {
    return this.service.atualizar(u, id, dto);
  }
}

@Module({ controllers: [DispositivosController], providers: [DispositivosService] })
export class DispositivosModule {}
