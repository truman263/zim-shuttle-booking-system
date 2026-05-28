import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createDriverDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.driver.create({
      data: {
        companyId: createDriverDto.companyId,
        fullName: createDriverDto.fullName,
        phone: createDriverDto.phone,
        email: createDriverDto.email,
        licenseNumber: createDriverDto.licenseNumber,
      },
    });
  }

  findAll() {
    return this.prisma.driver.findMany({
      include: {
        company: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
            },
          },
          include: {
            customer: true,
            vehicle: true,
            route: true,
          },
          orderBy: {
            pickupDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.driver.findUnique({
      where: { id },
      include: {
        company: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
            },
          },
          include: {
            customer: true,
            vehicle: true,
            route: true,
          },
          orderBy: {
            pickupDate: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['IN_PROGRESS'],
            },
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (
      driver.status === DriverStatus.ON_TRIP &&
      updateDriverDto.status === DriverStatus.AVAILABLE &&
      driver.bookings.length > 0
    ) {
      throw new BadRequestException(
        'Driver has an active trip and cannot be marked available manually',
      );
    }

    return this.prisma.driver.update({
      where: { id },
      data: {
        fullName: updateDriverDto.fullName,
        phone: updateDriverDto.phone,
        email: updateDriverDto.email,
        licenseNumber: updateDriverDto.licenseNumber,
        status: updateDriverDto.status,
      },
      include: {
        company: true,
      },
    });
  }
}
