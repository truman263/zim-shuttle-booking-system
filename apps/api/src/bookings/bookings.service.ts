import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  DriverStatus,
  VehicleStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateBookingRef() {
    const datePart = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const randomPart = Math.floor(1000 + Math.random() * 9000);

    return `LB-${datePart}-${randomPart}`;
  }

  async create(createBookingDto: CreateBookingDto) {
    const pickupDate = new Date(createBookingDto.pickupDate);

    if (pickupDate < new Date()) {
      throw new BadRequestException('Pickup date cannot be in the past');
    }

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { id: createBookingDto.companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const customer = await tx.customer.findUnique({
        where: { id: createBookingDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (customer.companyId !== createBookingDto.companyId) {
        throw new BadRequestException(
          'Customer does not belong to this company',
        );
      }

      if (createBookingDto.routeId) {
        const route = await tx.route.findUnique({
          where: { id: createBookingDto.routeId },
        });

        if (!route) {
          throw new NotFoundException('Route not found');
        }

        if (route.companyId !== createBookingDto.companyId) {
          throw new BadRequestException(
            'Route does not belong to this company',
          );
        }

        if (!route.isActive) {
          throw new BadRequestException('Route is currently inactive');
        }
      }

      if (createBookingDto.vehicleId) {
        const vehicle = await tx.vehicle.findUnique({
          where: { id: createBookingDto.vehicleId },
        });

        if (!vehicle) {
          throw new NotFoundException('Vehicle not found');
        }

        if (vehicle.companyId !== createBookingDto.companyId) {
          throw new BadRequestException(
            'Vehicle does not belong to this company',
          );
        }

        if (vehicle.status !== VehicleStatus.AVAILABLE) {
          throw new BadRequestException('Vehicle is not available');
        }

        if (vehicle.passengerCapacity < createBookingDto.passengers) {
          throw new BadRequestException(
            'Vehicle capacity is lower than passenger count',
          );
        }
      }

      if (createBookingDto.driverId) {
        const driver = await tx.driver.findUnique({
          where: { id: createBookingDto.driverId },
        });

        if (!driver) {
          throw new NotFoundException('Driver not found');
        }

        if (driver.companyId !== createBookingDto.companyId) {
          throw new BadRequestException(
            'Driver does not belong to this company',
          );
        }

        if (driver.status !== DriverStatus.AVAILABLE) {
          throw new BadRequestException('Driver is not available');
        }
      }

      const bookingStatus =
        createBookingDto.driverId && createBookingDto.vehicleId
          ? BookingStatus.DRIVER_ASSIGNED
          : createBookingDto.vehicleId
            ? BookingStatus.VEHICLE_ASSIGNED
            : BookingStatus.PENDING;

      const booking = await tx.booking.create({
        data: {
          companyId: createBookingDto.companyId,
          customerId: createBookingDto.customerId,
          routeId: createBookingDto.routeId,
          driverId: createBookingDto.driverId,
          vehicleId: createBookingDto.vehicleId,
          bookingRef: this.generateBookingRef(),
          tripType: createBookingDto.tripType,
          pickupLocation: createBookingDto.pickupLocation,
          destination: createBookingDto.destination,
          pickupDate,
          passengers: createBookingDto.passengers,
          luggageDetails: createBookingDto.luggageDetails,
          specialNotes: createBookingDto.specialNotes,
          estimatedPrice: createBookingDto.estimatedPrice,
          finalPrice: createBookingDto.finalPrice,
          depositAmount: createBookingDto.depositAmount,
          status: bookingStatus,
        },
      });

      if (createBookingDto.vehicleId) {
        await tx.vehicle.update({
          where: { id: createBookingDto.vehicleId },
          data: {
            status: VehicleStatus.BOOKED,
          },
        });
      }

      if (createBookingDto.driverId) {
        await tx.driver.update({
          where: { id: createBookingDto.driverId },
          data: {
            status: DriverStatus.ON_TRIP,
          },
        });
      }

      return tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          company: true,
          customer: true,
          route: true,
          driver: true,
          vehicle: true,
          payments: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.booking.findMany({
      include: {
        company: true,
        customer: true,
        route: true,
        driver: true,
        vehicle: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
        route: true,
        driver: true,
        vehicle: true,
        payments: true,
      },
    });
  }

  async updateStatus(id: string, status: BookingStatus) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
      });

      if (
        status === BookingStatus.COMPLETED ||
        status === BookingStatus.CANCELLED ||
        status === BookingStatus.NO_SHOW
      ) {
        if (booking.vehicleId) {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: {
              status: VehicleStatus.AVAILABLE,
            },
          });
        }

        if (booking.driverId) {
          await tx.driver.update({
            where: { id: booking.driverId },
            data: {
              status: DriverStatus.AVAILABLE,
            },
          });
        }
      }

      return tx.booking.findUnique({
        where: { id: updatedBooking.id },
        include: {
          company: true,
          customer: true,
          route: true,
          driver: true,
          vehicle: true,
          payments: true,
        },
      });
    });
  }
}