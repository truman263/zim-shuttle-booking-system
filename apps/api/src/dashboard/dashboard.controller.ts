import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../auth/auth.types';

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
  getSummary(
    @Param('companyId') companyId: string,
    @Req() request: AdminRequest,
  ) {
    this.assertCompanyAccess(request, companyId);
    return this.dashboardService.getSummary(companyId);
  }

  @Get('analytics/:companyId')
  getAnalytics(
    @Param('companyId') companyId: string,
    @Query() query: DashboardAnalyticsQuery,
    @Req() request: AdminRequest,
  ) {
    this.assertCompanyAccess(request, companyId);
    return this.dashboardService.getAnalytics(companyId, query);
  }

  @Get('analytics/:companyId/export')
  async exportAnalytics(
    @Param('companyId') companyId: string,
    @Query() query: DashboardAnalyticsQuery,
    @Req() request: AdminRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCompanyAccess(request, companyId);
    const exportFile = await this.dashboardService.exportAnalyticsWorkbook(
      companyId,
      query,
    );

    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exportFile.filename}"`,
      'Content-Length': String(exportFile.buffer.length),
    });

    return new StreamableFile(exportFile.buffer);
  }

  private assertCompanyAccess(request: AdminRequest, companyId: string) {
    if (!request.adminUser?.companyId || request.adminUser.companyId !== companyId) {
      throw new ForbiddenException('You do not have access to this company.');
    }
  }
}
