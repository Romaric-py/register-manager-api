import { IsOptional, IsEnum, IsNumber, IsString, Min, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import { SortOrder } from '../../common/constants/global.constants.js';

enum AdminSortField {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  ROLE = 'role',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLogin',
  IS_ACTIVE = 'isActive',
  EMAIL_VERIFIED = 'emailVerified'
}

export class GetAdminsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(AdminSortField)
  sortBy?: AdminSortField;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export { AdminSortField, SortOrder };