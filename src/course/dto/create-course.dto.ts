import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  duration?: string; //e.g: '3h', '2d', '1w'

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
