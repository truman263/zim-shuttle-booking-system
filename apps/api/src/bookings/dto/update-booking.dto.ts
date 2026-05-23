import { TripDirection, TripType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  routeId?: string | null;

  @IsOptional()
  @IsString()
  driverId?: string | null;

  @IsOptional()
  @IsString()
  vehicleId?: string | null;

  @IsOptional()
  @IsEnum(TripType)
  tripType?: TripType;

  @IsOptional()
  @IsEnum(TripDirection)
  tripDirection?: TripDirection;

  @IsOptional()
  @IsString()
  customTripType?: string | null;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @IsOptional()
  @IsDateString()
  dropoffDate?: string | null;

  @IsOptional()
  @IsDateString()
  returnDate?: string | null;

  @IsOptional()
  @IsString()
  returnPickupLocation?: string | null;

  @IsOptional()
  @IsString()
  returnDestination?: string | null;

  @IsOptional()
  @IsString()
  returnNotes?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationHours?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationDays?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;

  @IsOptional()
  @IsString()
  luggageDetails?: string | null;

  @IsOptional()
  @IsString()
  specialNotes?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  finalPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number | null;
}