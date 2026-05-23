import {
  PriceUnit,
  PricingMode,
  RoadCondition,
  ZoneType,
} from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CalculatePriceDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsEnum(PricingMode)
  pricingMode?: PricingMode;

  @IsOptional()
  @IsEnum(PriceUnit)
  priceUnit?: PriceUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsEnum(RoadCondition)
  roadCondition?: RoadCondition;

  @IsOptional()
  @IsEnum(ZoneType)
  zoneType?: ZoneType;

  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;
}