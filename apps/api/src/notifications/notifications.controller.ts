import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('notifications')
@UseGuards(AdminAuthGuard)
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
