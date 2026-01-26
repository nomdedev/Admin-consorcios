import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "El email debe ser válido" })
  email: string;
}

export class VerifyMagicLinkDto {
  @IsNotEmpty({ message: "El token es requerido" })
  @IsString()
  token: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  apellido: string;

  @IsNotEmpty()
  @MinLength(10)
  telefono: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  usuario: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
  };
}
