import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.notificationsService.findAll(companyId);
  }

  @Get('counts')
  getCounts(@Query('companyId') companyId?: string) {
    return this.notificationsService.getCounts(companyId);
  }
}
