import { Test, TestingModule } from '@nestjs/testing';
import { PricingCalculatorController } from './pricing-calculator.controller';

describe('PricingCalculatorController', () => {
  let controller: PricingCalculatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingCalculatorController],
    }).compile();

    controller = module.get<PricingCalculatorController>(PricingCalculatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
