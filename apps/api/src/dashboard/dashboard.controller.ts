import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('dashboard')
@UseGuards(AdminAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary/:companyId')
  getSummary(@Param('companyId') companyId: string) {
    return this.dashboardService.getSummary(companyId);
  }
}
