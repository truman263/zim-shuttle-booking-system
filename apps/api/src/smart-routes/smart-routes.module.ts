import { Module } from '@nestjs/common';
import { PricingSettingsModule } from '../pricing-settings/pricing-settings.module';
import { SmartRoutesController } from './smart-routes.controller';
import { SmartRoutesService } from './smart-routes.service';

@Module({
  imports: [PricingSettingsModule],
  controllers: [SmartRoutesController],
  providers: [SmartRoutesService],
  exports: [SmartRoutesService],
})
export class SmartRoutesModule {}
