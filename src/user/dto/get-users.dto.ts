import { IsOptional, IsEnum, IsNumber, IsString, Min, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

enum UserSortField {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLogin',
  IS_ACTIVE = 'isActive',
  EMAIL_VERIFIED = 'emailVerified'
}

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class GetUsersDto {
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
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export { UserSortField, SortOrder };