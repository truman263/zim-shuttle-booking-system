import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  registrationNo: string;

  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @IsInt()
  @Min(1)
  passengerCapacity: number;

  @IsOptional()
  @IsString()
  luggageCapacity?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}