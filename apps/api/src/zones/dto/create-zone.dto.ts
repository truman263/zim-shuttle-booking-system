import {
  AdjustmentType,
  RoadCondition,
  ZoneType,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(ZoneType)
  zoneType?: ZoneType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AdjustmentType)
  adjustmentType?: AdjustmentType;

  @IsNumber()
  @Min(0)
  adjustmentValue: number;

  @IsOptional()
  @IsEnum(RoadCondition)
  roadCondition?: RoadCondition;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}