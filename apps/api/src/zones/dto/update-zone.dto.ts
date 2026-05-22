import {
  AdjustmentType,
  RoadCondition,
  ZoneType,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ZoneType)
  zoneType?: ZoneType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AdjustmentType)
  adjustmentType?: AdjustmentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adjustmentValue?: number;

  @IsOptional()
  @IsEnum(RoadCondition)
  roadCondition?: RoadCondition;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}