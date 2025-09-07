import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

enum SortField {
  TITLE = 'title',
  PRICE = 'price',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  IS_ACTIVE = 'isActive'
}

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class GetCoursesDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsDateString()
  startDateBefore?: string; // ISO date string

  @IsOptional()
  @IsDateString()
  startDateAfter?: string;  // ISO date string

  @IsOptional()
  @IsDateString()
  endDateBefore?: string;   // ISO date string

  @IsOptional()
  @IsDateString()
  endDateAfter?: string;    // ISO date string

  @IsOptional()
  @IsString()
  search?: string; // search in title or description

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export { SortField, SortOrder };