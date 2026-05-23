import { TripDirection, TripType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsEnum(TripType)
  tripType: TripType;

  @IsOptional()
  @IsEnum(TripDirection)
  tripDirection?: TripDirection;

  @IsOptional()
  @IsString()
  customTripType?: string;

  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @IsString()
  @IsNotEmpty()
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
  @IsString()
  returnNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationDays?: number;

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
  @IsNumber()
  @Min(0)
  estimatedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  finalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}