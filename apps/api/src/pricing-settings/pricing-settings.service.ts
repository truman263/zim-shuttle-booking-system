import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyPricingSettings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePricingSettingsDto } from './dto/update-pricing-settings.dto';

export type PricingSettingsSnapshot = {
  id: string;
  companyId: string;
  customRouteAutoEstimateEnabled: boolean;
  customRouteBaseFare: number;
  customRoutePricePerKm: number;
  customRouteMinimumFare: number;
  customRouteManualQuoteThresholdKm: number | null;
  depositRequired: boolean;
  depositPercentage: number;
  minimumDepositAmount: number;
  isConfigured: boolean;
  configuredAt: Date | null;
  configuredByAdminId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PricingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const settings = await this.prisma.companyPricingSettings.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });

    return this.toSnapshot(settings);
  }

  async update(
    companyId: string,
    dto: UpdatePricingSettingsDto,
    changedByAdminId?: string,
  ) {
    const previous = await this.getOrCreate(companyId);
    this.validateSettings(dto);

    const updated = await this.prisma.companyPricingSettings.update({
      where: { companyId },
      data: {
        customRouteAutoEstimateEnabled: dto.customRouteAutoEstimateEnabled,
        customRouteBaseFare: dto.customRouteBaseFare,
        customRoutePricePerKm: dto.customRoutePricePerKm,
        customRouteMinimumFare: dto.customRouteMinimumFare,
        customRouteManualQuoteThresholdKm:
          dto.customRouteManualQuoteThresholdKm === undefined
            ? undefined
            : dto.customRouteManualQuoteThresholdKm,
        depositRequired: dto.depositRequired,
        depositPercentage: dto.depositPercentage,
        minimumDepositAmount: dto.minimumDepositAmount,
        isConfigured: true,
        configuredAt: previous.isConfigured ? undefined : new Date(),
        configuredByAdminId: changedByAdminId,
      },
    });

    const next = this.toSnapshot(updated);

    await this.prisma.pricingChangeLog.create({
      data: {
        companyId,
        changedByAdminId,
        changeType: previous.isConfigured
          ? 'PRICING_SETTINGS_UPDATED'
          : 'PRICING_SETTINGS_ACTIVATED',
        previousValue: this.toAuditValue(previous),
        newValue: this.toAuditValue(next),
      },
    });

    return next;
  }

  calculateDeposit(finalPrice?: number | null, settings?: PricingSettingsSnapshot) {
    if (
      !finalPrice ||
      finalPrice <= 0 ||
      !settings?.isConfigured ||
      !settings.depositRequired
    ) {
      return 0;
    }

    const percentageDeposit =
      finalPrice * (settings.depositPercentage / 100);
    const depositAmount = Math.max(
      settings.minimumDepositAmount,
      percentageDeposit,
    );

    return this.roundMoney(Math.min(finalPrice, depositAmount));
  }

  private validateSettings(dto: UpdatePricingSettingsDto) {
    const numericFields: Array<[string, number | null | undefined]> = [
      ['Base fare', dto.customRouteBaseFare],
      ['Price per km', dto.customRoutePricePerKm],
      ['Minimum fare', dto.customRouteMinimumFare],
      ['Manual quote threshold', dto.customRouteManualQuoteThresholdKm],
      ['Deposit percentage', dto.depositPercentage],
      ['Minimum deposit amount', dto.minimumDepositAmount],
    ];

    for (const [label, value] of numericFields) {
      if (value === null || value === undefined) {
        continue;
      }

      if (!Number.isFinite(value) || value < 0) {
        throw new BadRequestException(`${label} must be zero or greater.`);
      }
    }

    if (
      dto.depositPercentage !== undefined &&
      dto.depositPercentage !== null &&
      dto.depositPercentage > 100
    ) {
      throw new BadRequestException(
        'Deposit percentage must be between 0 and 100.',
      );
    }
  }

  private toSnapshot(
    settings: CompanyPricingSettings,
  ): PricingSettingsSnapshot {
    return {
      id: settings.id,
      companyId: settings.companyId,
      customRouteAutoEstimateEnabled:
        settings.customRouteAutoEstimateEnabled,
      customRouteBaseFare: Number(settings.customRouteBaseFare),
      customRoutePricePerKm: Number(settings.customRoutePricePerKm),
      customRouteMinimumFare: Number(settings.customRouteMinimumFare),
      customRouteManualQuoteThresholdKm:
        settings.customRouteManualQuoteThresholdKm === null
          ? null
          : Number(settings.customRouteManualQuoteThresholdKm),
      depositRequired: settings.depositRequired,
      depositPercentage: Number(settings.depositPercentage),
      minimumDepositAmount: Number(settings.minimumDepositAmount),
      isConfigured: settings.isConfigured,
      configuredAt: settings.configuredAt,
      configuredByAdminId: settings.configuredByAdminId,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  private toAuditValue(settings: PricingSettingsSnapshot) {
    return {
      customRouteAutoEstimateEnabled: settings.customRouteAutoEstimateEnabled,
      customRouteBaseFare: settings.customRouteBaseFare,
      customRoutePricePerKm: settings.customRoutePricePerKm,
      customRouteMinimumFare: settings.customRouteMinimumFare,
      customRouteManualQuoteThresholdKm:
        settings.customRouteManualQuoteThresholdKm,
      depositRequired: settings.depositRequired,
      depositPercentage: settings.depositPercentage,
      minimumDepositAmount: settings.minimumDepositAmount,
      isConfigured: settings.isConfigured,
      configuredAt: settings.configuredAt
        ? settings.configuredAt.toISOString()
        : null,
      configuredByAdminId: settings.configuredByAdminId,
    };
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
