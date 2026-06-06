import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

export type DashboardAnalyticsQuery = {
  from?: string;
  to?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  routeId?: string;
  driverId?: string;
  vehicleId?: string;
};

@Controller('dashboard')
@UseGuards(AdminAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary/:companyId')
  getSummary(@Param('companyId') companyId: string) {
    return this.dashboardService.getSummary(companyId);
  }

  @Get('analytics/:companyId')
  getAnalytics(
    @Param('companyId') companyId: string,
    @Query() query: DashboardAnalyticsQuery,
  ) {
    return this.dashboardService.getAnalytics(companyId, query);
  }
}
