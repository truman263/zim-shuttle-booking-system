import { Body, Controller, Post } from '@nestjs/common';
import { EstimateSmartRouteDto } from './dto/estimate-smart-route.dto';
import { SmartRoutesService } from './smart-routes.service';

@Controller('smart-routes')
export class SmartRoutesController {
  constructor(private readonly smartRoutesService: SmartRoutesService) {}

  @Post('estimate')
  estimate(@Body() estimateSmartRouteDto: EstimateSmartRouteDto) {
    return this.smartRoutesService.estimate(estimateSmartRouteDto);
  }
}
