import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePublicPaymentDto {
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsIn(['DEPOSIT', 'FULL_PAYMENT', 'BALANCE'])
  paymentType?: 'DEPOSIT' | 'FULL_PAYMENT' | 'BALANCE';

  @IsOptional()
  @IsIn(['WEB', 'ECOCASH', 'ONEMONEY'])
  paynowPaymentMethod?: 'WEB' | 'ECOCASH' | 'ONEMONEY';

  @IsOptional()
  @IsString()
  phone?: string;
}
