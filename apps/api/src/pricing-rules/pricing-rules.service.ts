import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';

@Injectable()
export class PricingRulesService {
  constructor(private readonly prisma: PrismaService) {}

  private buildDuplicateWhere(
    companyId: string,
    data: {
      ruleType: string;
      pricingMode?: string | null;
      routeType?: string | null;
      priceUnit?: string | null;
      minDistanceKm?: number | null;
      maxDistanceKm?: number | null;
      vehicleType?: string | null;
      roadCondition?: string | null;
      zoneType?: string | null;
      adjustmentType?: string | null;
    },
    excludeId?: string,
  ) {
    return {
      companyId,
      isActive: true,
      ruleType: data.ruleType as any,
      pricingMode: (data.pricingMode ?? null) as any,
      routeType: (data.routeType ?? null) as any,
      priceUnit: (data.priceUnit ?? null) as any,
      minDistanceKm: data.minDistanceKm ?? null,
      maxDistanceKm: data.maxDistanceKm ?? null,
      vehicleType: data.vehicleType ?? null,
      roadCondition: (data.roadCondition ?? null) as any,
      zoneType: (data.zoneType ?? null) as any,
      adjustmentType: (data.adjustmentType ?? 'FIXED_AMOUNT') as any,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    };
  }

  async create(createPricingRuleDto: CreatePricingRuleDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createPricingRuleDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const duplicateRule = await this.prisma.pricingRule.findFirst({
      where: this.buildDuplicateWhere(createPricingRuleDto.companyId, {
        ruleType: createPricingRuleDto.ruleType,
        pricingMode: createPricingRuleDto.pricingMode,
        routeType: createPricingRuleDto.routeType,
        priceUnit: createPricingRuleDto.priceUnit,
        minDistanceKm: createPricingRuleDto.minDistanceKm,
        maxDistanceKm: createPricingRuleDto.maxDistanceKm,
        vehicleType: createPricingRuleDto.vehicleType,
        roadCondition: createPricingRuleDto.roadCondition,
        zoneType: createPricingRuleDto.zoneType,
        adjustmentType: createPricingRuleDto.adjustmentType,
      }),
    });

    if (duplicateRule) {
      throw new BadRequestException(
        `A similar active pricing rule already exists: ${duplicateRule.name}. Edit or deactivate the existing rule first.`,
      );
    }

    return this.prisma.pricingRule.create({
      data: {
        companyId: createPricingRuleDto.companyId,
        name: createPricingRuleDto.name,
        ruleType: createPricingRuleDto.ruleType,
        pricingMode: createPricingRuleDto.pricingMode,
        routeType: createPricingRuleDto.routeType,
        priceUnit: createPricingRuleDto.priceUnit,
        minDistanceKm: createPricingRuleDto.minDistanceKm,
        maxDistanceKm: createPricingRuleDto.maxDistanceKm,
        vehicleType: createPricingRuleDto.vehicleType,
        roadCondition: createPricingRuleDto.roadCondition,
        zoneType: createPricingRuleDto.zoneType,
        adjustmentType: createPricingRuleDto.adjustmentType,
        amount: createPricingRuleDto.amount,
        percentage: createPricingRuleDto.percentage,
        isActive: createPricingRuleDto.isActive ?? true,
      },
      include: {
        company: true,
      },
    });
  }

  findAll() {
    return this.prisma.pricingRule.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const pricingRule = await this.prisma.pricingRule.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing rule not found');
    }

    return pricingRule;
  }

  async update(id: string, updatePricingRuleDto: UpdatePricingRuleDto) {
    const pricingRule = await this.prisma.pricingRule.findUnique({
      where: { id },
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing rule not found');
    }

    const nextRule = {
      ruleType: updatePricingRuleDto.ruleType ?? pricingRule.ruleType,
      pricingMode: updatePricingRuleDto.pricingMode ?? pricingRule.pricingMode,
      routeType: updatePricingRuleDto.routeType ?? pricingRule.routeType,
      priceUnit: updatePricingRuleDto.priceUnit ?? pricingRule.priceUnit,
      minDistanceKm:
        updatePricingRuleDto.minDistanceKm !== undefined
          ? updatePricingRuleDto.minDistanceKm
          : pricingRule.minDistanceKm
            ? Number(pricingRule.minDistanceKm)
            : null,
      maxDistanceKm:
        updatePricingRuleDto.maxDistanceKm !== undefined
          ? updatePricingRuleDto.maxDistanceKm
          : pricingRule.maxDistanceKm
            ? Number(pricingRule.maxDistanceKm)
            : null,
      vehicleType:
        updatePricingRuleDto.vehicleType !== undefined
          ? updatePricingRuleDto.vehicleType
          : pricingRule.vehicleType,
      roadCondition:
        updatePricingRuleDto.roadCondition ?? pricingRule.roadCondition,
      zoneType: updatePricingRuleDto.zoneType ?? pricingRule.zoneType,
      adjustmentType:
        updatePricingRuleDto.adjustmentType ?? pricingRule.adjustmentType,
    };

    const willBeActive =
      updatePricingRuleDto.isActive !== undefined
        ? updatePricingRuleDto.isActive
        : pricingRule.isActive;

    if (willBeActive) {
      const duplicateRule = await this.prisma.pricingRule.findFirst({
        where: this.buildDuplicateWhere(
          pricingRule.companyId,
          nextRule,
          pricingRule.id,
        ),
      });

      if (duplicateRule) {
        throw new BadRequestException(
          `A similar active pricing rule already exists: ${duplicateRule.name}. Edit or deactivate the existing rule first.`,
        );
      }
    }

    return this.prisma.pricingRule.update({
      where: { id },
      data: {
        name: updatePricingRuleDto.name,
        ruleType: updatePricingRuleDto.ruleType,
        pricingMode: updatePricingRuleDto.pricingMode,
        routeType: updatePricingRuleDto.routeType,
        priceUnit: updatePricingRuleDto.priceUnit,
        minDistanceKm: updatePricingRuleDto.minDistanceKm,
        maxDistanceKm: updatePricingRuleDto.maxDistanceKm,
        vehicleType: updatePricingRuleDto.vehicleType,
        roadCondition: updatePricingRuleDto.roadCondition,
        zoneType: updatePricingRuleDto.zoneType,
        adjustmentType: updatePricingRuleDto.adjustmentType,
        amount: updatePricingRuleDto.amount,
        percentage: updatePricingRuleDto.percentage,
        isActive: updatePricingRuleDto.isActive,
      },
      include: {
        company: true,
      },
    });
  }
}