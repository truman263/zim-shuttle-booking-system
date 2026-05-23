import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingCalculatorController } from './pricing-calculator.controller';
import { PricingCalculatorService } from './pricing-calculator.service';

@Module({
  imports: [PrismaModule],
  controllers: [PricingCalculatorController],
  providers: [PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingCalculatorModule {}