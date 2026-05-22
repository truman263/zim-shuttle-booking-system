import { Test, TestingModule } from '@nestjs/testing';
import { PricingCalculatorService } from './pricing-calculator.service';

describe('PricingCalculatorService', () => {
  let service: PricingCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingCalculatorService],
    }).compile();

    service = module.get<PricingCalculatorService>(PricingCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
