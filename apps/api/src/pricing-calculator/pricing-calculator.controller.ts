import { Body, Controller, Post } from '@nestjs/common';
import { PricingCalculatorService } from './pricing-calculator.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';

@Controller('pricing-calculator')
export class PricingCalculatorController {
  constructor(
    private readonly pricingCalculatorService: PricingCalculatorService,
  ) {}

  @Post('calculate')
  calculate(@Body() calculatePriceDto: CalculatePriceDto) {
    return this.pricingCalculatorService.calculate(calculatePriceDto);
  }
}