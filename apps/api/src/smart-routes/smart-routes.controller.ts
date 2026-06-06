import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EstimateSmartRouteDto } from './dto/estimate-smart-route.dto';
import { SmartRoutesService } from './smart-routes.service';

@Controller('smart-routes')
export class SmartRoutesController {
  constructor(private readonly smartRoutesService: SmartRoutesService) {}

  @Post('estimate')
  estimate(@Body() estimateSmartRouteDto: EstimateSmartRouteDto) {
    return this.smartRoutesService.estimate(estimateSmartRouteDto);
  }

  @Get('places')
  places(
    @Query('input') input?: string,
    @Query('sessionToken') sessionToken?: string,
  ) {
    return this.smartRoutesService.suggestPlaces(input ?? '', sessionToken);
  }
}
