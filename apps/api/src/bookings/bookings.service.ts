import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  DriverStatus,
  PaymentStatus,
  VehicleStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createBookingDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: createBookingDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.companyId !== createBookingDto.companyId) {
      throw new BadRequestException('Customer does not belong to this company');
    }

    if (
      createBookingDto.tripType === 'CUSTOM' &&
      !createBookingDto.customTripType?.trim()
    ) {
      throw new BadRequestException(
        'Custom trip type is required when trip type is CUSTOM',
      );
    }

    const pickupDate = new Date(createBookingDto.pickupDate);

    if (Number.isNaN(pickupDate.getTime())) {
      throw new BadRequestException('Invalid pickup date');
    }

    let dropoffDate: Date | undefined;
    let durationHours = createBookingDto.durationHours;
    let durationDays = createBookingDto.durationDays;

    if (createBookingDto.dropoffDate) {
      dropoffDate = new Date(createBookingDto.dropoffDate);

      if (Number.isNaN(dropoffDate.getTime())) {
        throw new BadRequestException('Invalid drop-off date');
      }

      if (dropoffDate <= pickupDate) {
        throw new BadRequestException(
          'Drop-off date must be after pickup date',
        );
      }

      const durationMs = dropoffDate.getTime() - pickupDate.getTime();
      const calculatedHours = durationMs / (1000 * 60 * 60);
      const calculatedDays = calculatedHours / 24;

      durationHours = Number(calculatedHours.toFixed(2));
      durationDays = Number(calculatedDays.toFixed(2));
    }

    if (
      createBookingDto.depositAmount !== undefined &&
      createBookingDto.finalPrice !== undefined &&
      createBookingDto.depositAmount > createBookingDto.finalPrice
    ) {
      throw new BadRequestException(
        'Deposit amount cannot be greater than final price',
      );
    }

    if (createBookingDto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: createBookingDto.routeId },
      });

      if (!route) {
        throw new NotFoundException('Route not found');
      }

      if (route.companyId !== createBookingDto.companyId) {
        throw new BadRequestException('Route does not belong to this company');
      }

      if (!route.isActive) {
        throw new BadRequestException('Route is inactive');
      }
    }

    if (createBookingDto.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: createBookingDto.driverId },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      if (driver.companyId !== createBookingDto.companyId) {
        throw new BadRequestException('Driver does not belong to this company');
      }

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new BadRequestException('Driver is not available');
      }
    }

    if (createBookingDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: createBookingDto.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      if (vehicle.companyId !== createBookingDto.companyId) {
        throw new BadRequestException('Vehicle does not belong to this company');
      }

      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new BadRequestException('Vehicle is not available');
      }

      if (createBookingDto.passengers > vehicle.passengerCapacity) {
        throw new BadRequestException(
          `Passengers cannot exceed vehicle capacity of ${vehicle.passengerCapacity}`,
        );
      }
    }

    const bookingRef = await this.generateBookingRef();

    const bookingStatus =
      createBookingDto.driverId || createBookingDto.vehicleId
        ? BookingStatus.DRIVER_ASSIGNED
        : BookingStatus.PENDING;

    const finalPrice = Number(createBookingDto.finalPrice ?? 0);
    const depositAmount = Number(createBookingDto.depositAmount ?? 0);

    const paymentStatus =
      depositAmount > 0
        ? depositAmount >= finalPrice
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIALLY_PAID
        : PaymentStatus.UNPAID;

    const booking = await this.prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          companyId: createBookingDto.companyId,
          customerId: createBookingDto.customerId,
          routeId: createBookingDto.routeId,
          driverId: createBookingDto.driverId,
          vehicleId: createBookingDto.vehicleId,

          bookingRef,
          tripType: createBookingDto.tripType,
          customTripType: createBookingDto.customTripType?.trim(),

          pickupLocation: createBookingDto.pickupLocation.trim(),
          destination: createBookingDto.destination.trim(),
          pickupDate,
          dropoffDate,
          durationHours,
          durationDays,
          passengers: createBookingDto.passengers,

          luggageDetails: createBookingDto.luggageDetails?.trim(),
          specialNotes: createBookingDto.specialNotes?.trim(),

          estimatedPrice: createBookingDto.estimatedPrice,
          finalPrice: createBookingDto.finalPrice,
          depositAmount: createBookingDto.depositAmount,

          status: bookingStatus,
          paymentStatus,
        },
        include: this.bookingInclude(),
      });

      if (createBookingDto.vehicleId) {
        await tx.vehicle.update({
          where: { id: createBookingDto.vehicleId },
          data: { status: VehicleStatus.BOOKED },
        });
      }

      if (createBookingDto.driverId) {
        await tx.driver.update({
          where: { id: createBookingDto.driverId },
          data: { status: DriverStatus.ON_TRIP },
        });
      }

      return createdBooking;
    });

    return booking;
  }

  findAll() {
    return this.prisma.booking.findMany({
      include: this.bookingInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: this.bookingInclude(),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id },
        data: { status },
        include: this.bookingInclude(),
      });

      if (
        status === BookingStatus.COMPLETED ||
        status === BookingStatus.CANCELLED ||
        status === BookingStatus.NO_SHOW
      ) {
        if (booking.vehicleId) {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: { status: VehicleStatus.AVAILABLE },
          });
        }

        if (booking.driverId) {
          await tx.driver.update({
            where: { id: booking.driverId },
            data: { status: DriverStatus.AVAILABLE },
          });
        }
      }

      return result;
    });

    return updatedBooking;
  }

  private async generateBookingRef(): Promise<string> {
    const now = new Date();

    const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);

    const bookingRef = `LB-${datePart}-${randomPart}`;

    const existing = await this.prisma.booking.findUnique({
      where: { bookingRef },
    });

    if (existing) {
      return this.generateBookingRef();
    }

    return bookingRef;
  }

  private bookingInclude() {
    return {
      company: true,
      customer: true,
      route: true,
      driver: true,
      vehicle: true,
      payments: true,
    };
  }
}