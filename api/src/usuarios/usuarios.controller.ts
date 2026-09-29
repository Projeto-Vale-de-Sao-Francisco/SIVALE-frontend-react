import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ADMIN_GESTOR, Roles, Usuario, type UsuarioLogado } from '../common/decorators.js';
import { AtualizarUsuarioDto, CriarUsuarioDto } from './usuarios.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('usuarios')
@ApiBearerAuth()
@Roles(...ADMIN_GESTOR)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  listar(@Usuario() u: UsuarioLogado) {
    return this.service.listar(u);
  }

  @Post()
  criar(@Usuario() u: UsuarioLogado, @Body() dto: CriarUsuarioDto) {
    return this.service.criar(u, dto);
  }

  @Patch(':id')
  atualizar(@Usuario() u: UsuarioLogado, @Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarUsuarioDto) {
    return this.service.atualizar(u, id, dto);
  }
}
