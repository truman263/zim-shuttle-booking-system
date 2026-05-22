import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary/:companyId')
  getSummary(@Param('companyId') companyId: string) {
    return this.dashboardService.getSummary(companyId);
  }
}