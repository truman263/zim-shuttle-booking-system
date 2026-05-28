import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createVehicleDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.vehicle.create({
      data: {
        companyId: createVehicleDto.companyId,
        name: createVehicleDto.name,
        registrationNo: createVehicleDto.registrationNo,
        vehicleType: createVehicleDto.vehicleType,
        passengerCapacity: createVehicleDto.passengerCapacity,
        luggageCapacity: createVehicleDto.luggageCapacity,
        imageUrl: createVehicleDto.imageUrl,
      },
    });
  }

  findAll() {
    return this.prisma.vehicle.findMany({
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
            driver: true,
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
    return this.prisma.vehicle.findUnique({
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
            driver: true,
            route: true,
          },
          orderBy: {
            pickupDate: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
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

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (
      updateVehicleDto.status &&
      updateVehicleDto.status !== vehicle.status
    ) {
      if (
        vehicle.status === VehicleStatus.BOOKED &&
        updateVehicleDto.status === VehicleStatus.AVAILABLE &&
        vehicle.bookings.length > 0
      ) {
        throw new BadRequestException(
          'Vehicle has an active trip and cannot be marked available manually',
        );
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: updateVehicleDto.name,
        registrationNo: updateVehicleDto.registrationNo?.toUpperCase(),
        vehicleType: updateVehicleDto.vehicleType,
        passengerCapacity: updateVehicleDto.passengerCapacity,
        luggageCapacity: updateVehicleDto.luggageCapacity,
        imageUrl: updateVehicleDto.imageUrl,
        status: updateVehicleDto.status,
      },
      include: {
        company: true,
      },
    });
  }
}
