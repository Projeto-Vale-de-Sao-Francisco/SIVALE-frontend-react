import { ForbiddenException, Global, Injectable, Module, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UsuarioLogado } from './decorators.js';

// Escopo por propriedade (PDF: "perfil -> permissoes basicas -> acesso as propriedades autorizadas").
// ADMINISTRADOR enxerga tudo; os demais so o que esta em usuarioPropriedade (status ATIVO).
@Injectable()
export class AcessoService {
  constructor(private readonly prisma: PrismaService) {}

  private admin(u: UsuarioLogado) {
    return u.perfil === 'ADMINISTRADOR';
  }

  propriedade(u: UsuarioLogado) {
    return this.admin(u)
      ? {}
      : { usuarioPropriedade: { some: { usuarioId: u.id, status: 'ATIVO' } } };
  }

  talhao(u: UsuarioLogado) {
    return this.admin(u) ? {} : { propriedade: this.propriedade(u) };
  }

  dispositivo(u: UsuarioLogado) {
    return this.admin(u) ? {} : { talhao: this.talhao(u) };
  }

  medicao(u: UsuarioLogado) {
    return this.admin(u) ? {} : { dispositivo: this.dispositivo(u) };
  }

  alerta(u: UsuarioLogado) {
    return this.admin(u) ? {} : { talhao: this.talhao(u) };
  }

  logistica(u: UsuarioLogado) {
    return this.admin(u) ? {} : { propriedade: this.propriedade(u) };
  }

  async garantirPropriedade(u: UsuarioLogado, propriedadeId: number) {
    const p = await this.prisma.propriedade.findFirst({
      where: { id: propriedadeId, ...this.propriedade(u) },
      select: { id: true },
    });
    if (!p) throw new NotFoundException('Propriedade não encontrada.');
  }

  async garantirTalhao(u: UsuarioLogado, talhaoId: number) {
    const t = await this.prisma.talhao.findFirst({
      where: { id: talhaoId, ...this.talhao(u) },
      select: { id: true },
    });
    if (!t) throw new NotFoundException('Talhão não encontrado.');
  }

  async garantirDispositivo(u: UsuarioLogado, dispositivoId: number) {
    const d = await this.prisma.dispositivo.findFirst({
      where: { id: dispositivoId, ...this.dispositivo(u) },
      select: { id: true },
    });
    if (!d) throw new NotFoundException('Dispositivo não encontrado.');
  }

  soAdmin(u: UsuarioLogado) {
    if (!this.admin(u)) throw new ForbiddenException('Apenas administradores podem executar esta ação.');
  }
}

@Global()
@Module({ providers: [AcessoService], exports: [AcessoService] })
export class AcessoModule {}
