import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { RegisterUserDto } from './register-user.dto';

export class CreateAdminDto extends RegisterUserDto {
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
