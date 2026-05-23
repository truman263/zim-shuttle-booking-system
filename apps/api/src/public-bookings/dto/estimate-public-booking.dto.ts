import {
  PricingMode,
  RoadCondition,
  TripDirection,
  TripType,
  ZoneType,
} from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class EstimatePublicBookingDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsEnum(PricingMode)
  pricingMode?: PricingMode;

  @IsEnum(TripType)
  tripType: TripType;

  @IsOptional()
  @IsEnum(TripDirection)
  tripDirection?: TripDirection;

  @IsOptional()
  @IsString()
  customTripType?: string;

  @IsString()
  pickupLocation: string;

  @IsString()
  destination: string;

  @IsDateString()
  pickupDate: string;

  @IsOptional()
  @IsDateString()
  dropoffDate?: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  returnPickupLocation?: string;

  @IsOptional()
  @IsString()
  returnDestination?: string;

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
  @IsNumber()
  @Min(0)
  roundTripDiscountPercentage?: number;

  @IsOptional()
  @IsString()
  preferredVehicleType?: string;

  @IsOptional()
  @IsEnum(RoadCondition)
  roadCondition?: RoadCondition;

  @IsOptional()
  @IsEnum(ZoneType)
  zoneType?: ZoneType;

  @IsInt()
  @Min(1)
  passengers: number;

  @IsOptional()
  @IsString()
  luggageDetails?: string;

  @IsOptional()
  @IsString()
  specialNotes?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}