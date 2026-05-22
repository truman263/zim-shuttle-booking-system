import { Test, TestingModule } from '@nestjs/testing';
import { PricingRulesController } from './pricing-rules.controller';

describe('PricingRulesController', () => {
  let controller: PricingRulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingRulesController],
    }).compile();

    controller = module.get<PricingRulesController>(PricingRulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
