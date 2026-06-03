import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LADYBIRD_COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

@Injectable()
export class PublicRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.route.findMany({
      where: {
        companyId: LADYBIRD_COMPANY_ID,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        pickupCity: true,
        destinationCity: true,
        basePrice: true,
        routeType: true,
        pricingMode: true,
        priceUnit: true,
        distanceKm: true,
        estimatedDurationMinutes: true,
        roadCondition: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
