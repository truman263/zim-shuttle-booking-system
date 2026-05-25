import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class EstimateSmartRouteDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsOptional()
  @IsIn(['ONE_WAY', 'ROUND_TRIP'])
  tripDirection?: 'ONE_WAY' | 'ROUND_TRIP';

  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;
}
