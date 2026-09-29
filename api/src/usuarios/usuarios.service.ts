import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { USUARIO_PUBLICO } from '../auth/auth.service.js';
import { AcessoService } from '../common/acesso.service.js';
import type { UsuarioLogado } from '../common/decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AtualizarUsuarioDto, CriarUsuarioDto } from './usuarios.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acesso: AcessoService,
  ) {}

  listar(u: UsuarioLogado) {
    const where =
      u.perfil === 'ADMINISTRADOR'
        ? {}
        : { usuarioPropriedade: { some: { propriedade: this.acesso.propriedade(u) } } };
    return this.prisma.usuario.findMany({ where, select: USUARIO_PUBLICO, orderBy: { nomeCompleto: 'asc' } });
  }

  async criar(u: UsuarioLogado, dto: CriarUsuarioDto) {
    if (dto.perfil === 'ADMINISTRADOR') this.acesso.soAdmin(u);
    const existente = await this.prisma.usuario.findFirst({
      where: { OR: [{ email: dto.email }, { cpf: dto.cpf }] },
      select: { id: true },
    });
    if (existente) throw new ConflictException('CPF ou e-mail já cadastrado.');
    return this.prisma.usuario.create({
      data: { ...dto, senha: await bcrypt.hash(dto.senha, 10) },
      select: USUARIO_PUBLICO,
    });
  }

  async atualizar(u: UsuarioLogado, id: number, dto: AtualizarUsuarioDto) {
    const alvo = await this.prisma.usuario.findUnique({ where: { id }, select: { perfil: true } });
    if (!alvo) throw new NotFoundException('Usuário não encontrado.');
    if (u.perfil !== 'ADMINISTRADOR' && (alvo.perfil === 'ADMINISTRADOR' || dto.perfil === 'ADMINISTRADOR')) {
      throw new ForbiddenException('Apenas administradores gerenciam administradores.');
    }
    const { senha, ...resto } = dto;
    return this.prisma.usuario.update({
      where: { id },
      data: { ...resto, ...(senha ? { senha: await bcrypt.hash(senha, 10) } : {}) },
      select: USUARIO_PUBLICO,
    });
  }
}
