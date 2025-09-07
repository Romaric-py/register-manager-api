import { IsOptional, IsString } from 'class-validator';

export class GetRegistrationsDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
