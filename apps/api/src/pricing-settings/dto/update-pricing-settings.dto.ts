import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdatePricingSettingsDto {
  @IsOptional()
  @IsBoolean()
  customRouteAutoEstimateEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customRouteBaseFare?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customRoutePricePerKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customRouteMinimumFare?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customRouteManualQuoteThresholdKm?: number | null;

  @IsOptional()
  @IsBoolean()
  depositRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumDepositAmount?: number;
}
