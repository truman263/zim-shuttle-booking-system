import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdjustmentType,
  PricingMode,
  PricingRuleType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';

type PricingBreakdownItem = {
  label: string;
  type: 'BASE' | 'FIXED_AMOUNT' | 'PERCENTAGE' | 'INFO';
  amount: number;
  percentage?: number;
};

@Injectable()
export class PricingCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(calculatePriceDto: CalculatePriceDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: calculatePriceDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const passengers = calculatePriceDto.passengers ?? 1;

    let basePrice = 0;
    let pricingMode = calculatePriceDto.pricingMode;
    let priceUnit = calculatePriceDto.priceUnit;
    let distanceKm = calculatePriceDto.distanceKm;
    let vehicleType = calculatePriceDto.vehicleType;
    let roadCondition = calculatePriceDto.roadCondition;

    const breakdown: PricingBreakdownItem[] = [];

    if (calculatePriceDto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: calculatePriceDto.routeId },
      });

      if (!route) {
        throw new NotFoundException('Route not found');
      }

      if (!route.isActive) {
        throw new BadRequestException('Route is inactive');
      }

      pricingMode = route.pricingMode;
      priceUnit = route.priceUnit;
      distanceKm = distanceKm ?? Number(route.distanceKm ?? 0);
      roadCondition = roadCondition ?? route.roadCondition;

      basePrice = Number(route.basePrice);

      breakdown.push({
        label: `Fixed route base price: ${route.name}`,
        type: 'BASE',
        amount: basePrice,
      });

      if (route.priceUnit === 'PER_PASSENGER') {
        const passengerTotal = basePrice * passengers;
        breakdown.push({
          label: `${passengers} passenger(s) × $${basePrice}`,
          type: 'INFO',
          amount: passengerTotal,
        });
        basePrice = passengerTotal;
      }
    }

    if (!calculatePriceDto.routeId) {
      if (!pricingMode) {
        pricingMode = PricingMode.DISTANCE_BASED;
      }

      if (pricingMode === PricingMode.DISTANCE_BASED) {
        if (distanceKm === undefined || distanceKm === null) {
          throw new BadRequestException(
            'Distance is required for distance-based pricing',
          );
        }

        const distanceRule = await this.prisma.pricingRule.findFirst({
          where: {
            companyId: calculatePriceDto.companyId,
            isActive: true,
            ruleType: PricingRuleType.DISTANCE_BAND,
            minDistanceKm: {
              lte: distanceKm,
            },
            maxDistanceKm: {
              gte: distanceKm,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!distanceRule) {
          throw new BadRequestException(
            `No active distance pricing rule found for ${distanceKm}km`,
          );
        }

        basePrice = Number(distanceRule.amount ?? 0);

        breakdown.push({
          label: `Distance band: ${distanceRule.name}`,
          type: 'BASE',
          amount: basePrice,
        });
      }
    }

    if (basePrice <= 0) {
      throw new BadRequestException('Unable to calculate base price');
    }

    let subtotal = basePrice;

    if (calculatePriceDto.zoneType) {
      const zone = await this.prisma.zone.findFirst({
        where: {
          companyId: calculatePriceDto.companyId,
          isActive: true,
          zoneType: calculatePriceDto.zoneType,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (zone) {
        const adjustmentValue = Number(zone.adjustmentValue);

        if (zone.adjustmentType === AdjustmentType.FIXED_AMOUNT) {
          subtotal += adjustmentValue;

          breakdown.push({
            label: `Zone surcharge: ${zone.name}`,
            type: 'FIXED_AMOUNT',
            amount: adjustmentValue,
          });
        }

        if (zone.adjustmentType === AdjustmentType.PERCENTAGE) {
          const adjustmentAmount = subtotal * (adjustmentValue / 100);
          subtotal += adjustmentAmount;

          breakdown.push({
            label: `Zone adjustment: ${zone.name}`,
            type: 'PERCENTAGE',
            amount: adjustmentAmount,
            percentage: adjustmentValue,
          });
        }
      }
    }

    if (vehicleType) {
      const vehicleRule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId: calculatePriceDto.companyId,
          isActive: true,
          ruleType: PricingRuleType.VEHICLE_TYPE,
          vehicleType: {
            equals: vehicleType,
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (vehicleRule) {
        subtotal = this.applyRuleAdjustment(
          subtotal,
          vehicleRule.name,
          Number(vehicleRule.amount ?? 0),
          Number(vehicleRule.percentage ?? 0),
          vehicleRule.adjustmentType,
          breakdown,
        );
      }
    }

    if (roadCondition) {
      const roadRule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId: calculatePriceDto.companyId,
          isActive: true,
          ruleType: PricingRuleType.ROAD_CONDITION,
          roadCondition,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (roadRule) {
        subtotal = this.applyRuleAdjustment(
          subtotal,
          roadRule.name,
          Number(roadRule.amount ?? 0),
          Number(roadRule.percentage ?? 0),
          roadRule.adjustmentType,
          breakdown,
        );
      }
    }

    const estimatedPrice = this.roundMoney(subtotal);

    return {
      companyId: calculatePriceDto.companyId,
      routeId: calculatePriceDto.routeId ?? null,
      pricingMode,
      priceUnit,
      distanceKm: distanceKm ?? null,
      vehicleType: vehicleType ?? null,
      roadCondition: roadCondition ?? null,
      zoneType: calculatePriceDto.zoneType ?? null,
      passengers,
      estimatedPrice,
      breakdown: breakdown.map((item) => ({
        ...item,
        amount: this.roundMoney(item.amount),
      })),
    };
  }

  private applyRuleAdjustment(
    currentSubtotal: number,
    ruleName: string,
    amount: number,
    percentage: number,
    adjustmentType: AdjustmentType,
    breakdown: PricingBreakdownItem[],
  ) {
    if (adjustmentType === AdjustmentType.FIXED_AMOUNT) {
      breakdown.push({
        label: ruleName,
        type: 'FIXED_AMOUNT',
        amount,
      });

      return currentSubtotal + amount;
    }

    const adjustmentAmount = currentSubtotal * (percentage / 100);

    breakdown.push({
      label: ruleName,
      type: 'PERCENTAGE',
      amount: adjustmentAmount,
      percentage,
    });

    return currentSubtotal + adjustmentAmount;
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}