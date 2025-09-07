import { IsString, IsNotEmpty, IsDateString, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class CreateRegistrationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsNotEmpty()
  @IsDateString()
  registrationDate?: string;
}

export class CreateRegistrationManyForOneDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  courseIds: string[];
  
  @IsOptional()
  @IsDateString()
  registrationDate?: string;
}

export class CreateRegistrationOneForManyDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds: string[];

  @IsNotEmpty()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;
}
