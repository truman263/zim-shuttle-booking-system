import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const tripDirection = calculatePriceDto.tripDirection ?? 'ONE_WAY';

    let basePrice = 0;
    let pricingMode = calculatePriceDto.pricingMode;
    let priceUnit = calculatePriceDto.priceUnit;
    let distanceKm = calculatePriceDto.distanceKm;
    let vehicleType = calculatePriceDto.vehicleType;
    let roadCondition = calculatePriceDto.roadCondition;
    let durationHours = calculatePriceDto.durationHours;
    let durationDays = calculatePriceDto.durationDays;

    const breakdown: PricingBreakdownItem[] = [];

    if (calculatePriceDto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: calculatePriceDto.routeId },
      });

      if (!route) {
        throw new NotFoundException('Route not found');
      }

      if (route.isDeleted) {
        throw new BadRequestException('Route is archived');
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
        label: `Route base price: ${route.name}`,
        type: 'BASE',
        amount: basePrice,
      });

      if (route.priceUnit === 'PER_PASSENGER') {
        const passengerTotal = basePrice * passengers;

        breakdown.push({
          label: `${passengers} passenger(s) × $${this.roundMoney(basePrice)}`,
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
        basePrice = await this.calculateDistanceBasedPrice(
          calculatePriceDto.companyId,
          distanceKm,
          breakdown,
        );
      }

      if (pricingMode === PricingMode.HOURLY) {
        basePrice = await this.calculateHourlyPrice(
          calculatePriceDto.companyId,
          durationHours,
          calculatePriceDto.hourlyRate,
          breakdown,
        );

        priceUnit = 'PER_HOUR';
      }

      if (pricingMode === PricingMode.DAILY) {
        basePrice = await this.calculateDailyPrice(
          calculatePriceDto.companyId,
          durationDays,
          calculatePriceDto.dailyRate,
          breakdown,
        );

        priceUnit = 'PER_DAY';
      }

      if (pricingMode === PricingMode.CUSTOM_QUOTE) {
        throw new BadRequestException(
          'Custom quote pricing requires admin to enter final price manually',
        );
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
            label: `Pricing zone: ${zone.name}`,
            type: 'FIXED_AMOUNT',
            amount: adjustmentValue,
          });
        }

        if (zone.adjustmentType === AdjustmentType.PERCENTAGE) {
          const adjustmentAmount = subtotal * (adjustmentValue / 100);
          subtotal += adjustmentAmount;

          breakdown.push({
            label: `Pricing zone: ${zone.name}`,
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

    if (tripDirection === 'ROUND_TRIP') {
      const oneWaySubtotal = subtotal;
      subtotal = subtotal * 2;

      breakdown.push({
        label: 'Round trip: return journey added',
        type: 'INFO',
        amount: oneWaySubtotal,
      });

      const discountPercentage = Number(
        calculatePriceDto.roundTripDiscountPercentage ?? 0,
      );

      if (discountPercentage > 0) {
        const discountAmount = subtotal * (discountPercentage / 100);
        subtotal -= discountAmount;

        breakdown.push({
          label: 'Round trip discount',
          type: 'PERCENTAGE',
          amount: -discountAmount,
          percentage: discountPercentage,
        });
      }
    }

    const estimatedPrice = this.roundMoney(subtotal);

    return {
      companyId: calculatePriceDto.companyId,
      routeId: calculatePriceDto.routeId ?? null,
      pricingMode,
      priceUnit,
      tripDirection,
      roundTripDiscountPercentage:
        calculatePriceDto.roundTripDiscountPercentage ?? 0,
      distanceKm: distanceKm ?? null,
      durationHours: durationHours ?? null,
      durationDays: durationDays ?? null,
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

  private async calculateDistanceBasedPrice(
    companyId: string,
    distanceKm: number | undefined,
    breakdown: PricingBreakdownItem[],
  ) {
    if (distanceKm === undefined || distanceKm === null || distanceKm <= 0) {
      throw new BadRequestException(
        'Distance is required for distance-based pricing',
      );
    }

    const distanceRule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
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

    const amount = Number(distanceRule.amount ?? 0);

    breakdown.push({
      label: `Distance band: ${distanceRule.name}`,
      type: 'BASE',
      amount,
    });

    return amount;
  }

  private async calculateHourlyPrice(
    companyId: string,
    durationHours: number | undefined,
    requestHourlyRate: number | undefined,
    breakdown: PricingBreakdownItem[],
  ) {
    if (
      durationHours === undefined ||
      durationHours === null ||
      durationHours <= 0
    ) {
      throw new BadRequestException('Duration hours is required for hourly hire');
    }

    let hourlyRate = requestHourlyRate;

    if (!hourlyRate) {
      const hourlyRule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          isActive: true,
          ruleType: PricingRuleType.TIME_BASED,
          pricingMode: PricingMode.HOURLY,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      hourlyRate = Number(hourlyRule?.amount ?? 0);
    }

    if (!hourlyRate || hourlyRate <= 0) {
      throw new BadRequestException(
        'Hourly rate is required. Provide hourlyRate or create an active hourly pricing rule.',
      );
    }

    const total = hourlyRate * durationHours;

    breakdown.push({
      label: `${durationHours} hour(s) × $${this.roundMoney(hourlyRate)} hourly rate`,
      type: 'BASE',
      amount: total,
    });

    return total;
  }

  private async calculateDailyPrice(
    companyId: string,
    durationDays: number | undefined,
    requestDailyRate: number | undefined,
    breakdown: PricingBreakdownItem[],
  ) {
    if (
      durationDays === undefined ||
      durationDays === null ||
      durationDays <= 0
    ) {
      throw new BadRequestException('Duration days is required for daily hire');
    }

    let dailyRate = requestDailyRate;

    if (!dailyRate) {
      const dailyRule = await this.prisma.pricingRule.findFirst({
        where: {
          companyId,
          isActive: true,
          ruleType: PricingRuleType.TIME_BASED,
          pricingMode: PricingMode.DAILY,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      dailyRate = Number(dailyRule?.amount ?? 0);
    }

    if (!dailyRate || dailyRate <= 0) {
      throw new BadRequestException(
        'Daily rate is required. Provide dailyRate or create an active daily pricing rule.',
      );
    }

    const billableDays = Math.ceil(durationDays);
    const total = dailyRate * billableDays;

    breakdown.push({
      label: `${billableDays} day(s) × $${this.roundMoney(dailyRate)} daily rate`,
      type: 'BASE',
      amount: total,
    });

    if (billableDays !== durationDays) {
      breakdown.push({
        label: `Actual duration: ${durationDays} day(s), billed as ${billableDays} day(s)`,
        type: 'INFO',
        amount: 0,
      });
    }

    return total;
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