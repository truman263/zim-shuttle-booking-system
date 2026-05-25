import { Module } from '@nestjs/common';
import { SmartRoutesController } from './smart-routes.controller';
import { SmartRoutesService } from './smart-routes.service';

@Module({
  controllers: [SmartRoutesController],
  providers: [SmartRoutesService],
})
export class SmartRoutesModule {}
