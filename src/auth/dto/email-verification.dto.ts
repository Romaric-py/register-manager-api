import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class ResendVerificationEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
