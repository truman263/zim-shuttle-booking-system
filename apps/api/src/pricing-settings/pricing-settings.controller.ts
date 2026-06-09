import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingSettingsDto } from './dto/update-pricing-settings.dto';
import { PricingSettingsService } from './pricing-settings.service';

@Controller('pricing-settings')
@UseGuards(AdminAuthGuard)
export class PricingSettingsController {
  constructor(
    private readonly pricingSettingsService: PricingSettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':companyId/audit')
  findAudit(@Param('companyId') companyId: string, @Req() request: AdminRequest) {
    this.assertCompanyAccess(companyId, request);

    return this.prisma.pricingChangeLog.findMany({
      where: { companyId },
      select: {
        id: true,
        changeType: true,
        previousValue: true,
        newValue: true,
        createdAt: true,
        changedByAdmin: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }

  @Get(':companyId')
  getSettings(@Param('companyId') companyId: string, @Req() request: AdminRequest) {
    this.assertCompanyAccess(companyId, request);

    return this.pricingSettingsService.getOrCreate(companyId);
  }

  @Put(':companyId')
  updateSettings(
    @Param('companyId') companyId: string,
    @Body() dto: UpdatePricingSettingsDto,
    @Req() request: AdminRequest,
  ) {
    this.assertCompanyAccess(companyId, request);

    return this.pricingSettingsService.update(
      companyId,
      dto,
      request.adminUser?.id,
    );
  }

  private assertCompanyAccess(companyId: string, request: AdminRequest) {
    const adminUser = request.adminUser;

    if (
      adminUser?.role !== UserRole.SUPER_ADMIN &&
      adminUser?.companyId !== companyId
    ) {
      throw new ForbiddenException(
        'You can only manage pricing for your company.',
      );
    }
  }
}
