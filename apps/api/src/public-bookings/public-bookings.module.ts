import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { PricingCalculatorModule } from '../pricing-calculator/pricing-calculator.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicBookingsController } from './public-bookings.controller';
import { PublicBookingsService } from './public-bookings.service';

@Module({
  imports: [PrismaModule, BookingsModule, PricingCalculatorModule],
  controllers: [PublicBookingsController],
  providers: [PublicBookingsService],
})
export class PublicBookingsModule {}