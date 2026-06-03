import { Controller, Get } from '@nestjs/common';
import { PublicRoutesService } from './public-routes.service';

@Controller('public-routes')
export class PublicRoutesController {
  constructor(private readonly publicRoutesService: PublicRoutesService) {}

  @Get()
  findAll() {
    return this.publicRoutesService.findAll();
  }
}
