import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PricingRulesService } from './pricing-rules.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';

@Controller('pricing-rules')
@UseGuards(AdminAuthGuard)
export class PricingRulesController {
  constructor(private readonly pricingRulesService: PricingRulesService) {}

  @Post()
  create(@Body() createPricingRuleDto: CreatePricingRuleDto) {
    return this.pricingRulesService.create(createPricingRuleDto);
  }

  @Get()
  findAll() {
    return this.pricingRulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricingRulesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePricingRuleDto: UpdatePricingRuleDto,
  ) {
    return this.pricingRulesService.update(id, updatePricingRuleDto);
  }
}
