import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CadastroDto, LoginDto } from './auth.dto.js';

export const USUARIO_PUBLICO = {
  id: true,
  nomeCompleto: true,
  cpf: true,
  email: true,
  telefone: true,
  perfil: true,
  status: true,
  dataCadastro: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, senha }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    const ok = usuario && usuario.status === 'ATIVO' && (await bcrypt.compare(senha, usuario.senha));
    if (!usuario || !ok) throw new UnauthorizedException('Credenciais inválidas.');

    const token = await this.jwt.signAsync({ sub: usuario.id, perfil: usuario.perfil });
    const { senha: _omitida, ...publico } = usuario;
    return { token, usuario: publico };
  }

  // Autocadastro sempre cria PRODUTOR; outros perfis so via POST /usuarios (ADMIN/GESTOR).
  async cadastrar(dto: CadastroDto) {
    const existente = await this.prisma.usuario.findFirst({
      where: { OR: [{ email: dto.email }, { cpf: dto.cpf }] },
      select: { id: true },
    });
    if (existente) throw new ConflictException('CPF ou e-mail já cadastrado.');

    return this.prisma.usuario.create({
      data: { ...dto, senha: await bcrypt.hash(dto.senha, 10), perfil: 'PRODUTOR' },
      select: USUARIO_PUBLICO,
    });
  }
}
