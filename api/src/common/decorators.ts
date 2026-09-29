import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Perfil } from '../generated/prisma/enums.js';

export interface UsuarioLogado {
  id: number;
  nomeCompleto: string;
  email: string;
  perfil: Perfil;
  status: string;
}

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...perfis: Perfil[]) => SetMetadata(ROLES, perfis);

export const ADMIN: Perfil[] = ['ADMINISTRADOR'];
export const ADMIN_GESTOR: Perfil[] = ['ADMINISTRADOR', 'GESTOR'];
export const ADMIN_GESTOR_TECNICO: Perfil[] = ['ADMINISTRADOR', 'GESTOR', 'TECNICO'];

export const Usuario = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): UsuarioLogado =>
    ctx.switchToHttp().getRequest().usuario,
);
