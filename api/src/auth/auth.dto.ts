import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@sivale.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(1)
  senha: string;
}

export class CadastroDto {
  @ApiProperty() @IsString() @Length(2, 120) nomeCompleto: string;
  @ApiProperty({ example: '12345678901' }) @IsString() @Length(11, 14) cpf: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty({ minLength: 6 }) @IsString() @MinLength(6) senha: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefone?: string;
}
