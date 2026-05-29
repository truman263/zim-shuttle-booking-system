import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRouteDto: CreateRouteDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createRouteDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (createRouteDto.isActive ?? true) {
      await this.validateNoActiveDuplicateRoute({
        companyId: createRouteDto.companyId,
        pickupCity: createRouteDto.pickupCity,
        destinationCity: createRouteDto.destinationCity,
      });
    }

    return this.prisma.route.create({
      data: {
        companyId: createRouteDto.companyId,
        name: createRouteDto.name,
        pickupCity: createRouteDto.pickupCity,
        destinationCity: createRouteDto.destinationCity,
        basePrice: createRouteDto.basePrice,
        isActive: createRouteDto.isActive ?? true,
        routeType: createRouteDto.routeType,
        pricingMode: createRouteDto.pricingMode,
        priceUnit: createRouteDto.priceUnit,
        distanceKm: createRouteDto.distanceKm,
        estimatedDurationMinutes: createRouteDto.estimatedDurationMinutes,
        roadCondition: createRouteDto.roadCondition,
      },
      include: {
        company: true,
      },
    });
  }

  findAll() {
    return this.prisma.route.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        company: true,
        bookings: {
          select: {
            id: true,
            bookingRef: true,
            status: true,
            paymentStatus: true,
            passengers: true,
            pickupDate: true,
            finalPrice: true,
            estimatedPrice: true,
            customer: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, isDeleted: false },
      include: {
        company: true,
        bookings: true,
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const nextIsActive = updateRouteDto.isActive ?? route.isActive;
    const nextPickupCity = updateRouteDto.pickupCity ?? route.pickupCity;
    const nextDestinationCity =
      updateRouteDto.destinationCity ?? route.destinationCity;

    if (nextIsActive) {
      await this.validateNoActiveDuplicateRoute({
        companyId: route.companyId,
        pickupCity: nextPickupCity,
        destinationCity: nextDestinationCity,
        excludeRouteId: route.id,
      });
    }

    return this.prisma.route.update({
      where: { id },
      data: {
        name: updateRouteDto.name,
        pickupCity: updateRouteDto.pickupCity,
        destinationCity: updateRouteDto.destinationCity,
        basePrice: updateRouteDto.basePrice,
        isActive: updateRouteDto.isActive,
        routeType: updateRouteDto.routeType,
        pricingMode: updateRouteDto.pricingMode,
        priceUnit: updateRouteDto.priceUnit,
        distanceKm: updateRouteDto.distanceKm,
        estimatedDurationMinutes: updateRouteDto.estimatedDurationMinutes,
        roadCondition: updateRouteDto.roadCondition,
      },
      include: {
        company: true,
      },
    });
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    });

    if (!route || route.isDeleted) {
      throw new NotFoundException('Route not found');
    }

    return this.prisma.route.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
      include: {
        company: true,
      },
    });
  }

  private normalizeRouteLocation(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async validateNoActiveDuplicateRoute({
    companyId,
    pickupCity,
    destinationCity,
    excludeRouteId,
  }: {
    companyId: string;
    pickupCity: string;
    destinationCity: string;
    excludeRouteId?: string;
  }) {
    const normalizedPickupCity = this.normalizeRouteLocation(pickupCity);
    const normalizedDestinationCity =
      this.normalizeRouteLocation(destinationCity);

    const activeRoutes = await this.prisma.route.findMany({
      where: {
        companyId,
        isActive: true,
        isDeleted: false,
        ...(excludeRouteId ? { NOT: { id: excludeRouteId } } : {}),
      },
      select: {
        pickupCity: true,
        destinationCity: true,
      },
    });

    const duplicateRoute = activeRoutes.find((route) => {
      return (
        this.normalizeRouteLocation(route.pickupCity) ===
          normalizedPickupCity &&
        this.normalizeRouteLocation(route.destinationCity) ===
          normalizedDestinationCity
      );
    });

    if (duplicateRoute) {
      throw new ConflictException(
        'An active route already exists for this pickup and destination.',
      );
    }
  }
}
