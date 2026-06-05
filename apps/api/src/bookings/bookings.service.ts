import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  DriverStatus,
  PaymentStatus,
  TripDirection,
  VehicleStatus,
} from '@prisma/client';
import { DriverTripsService } from '../driver-trips/driver-trips.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

type NotificationBookingRecord = Parameters<
  NotificationsService['sendBookingStatusEmail']
>[0];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly driverTripsService: DriverTripsService,
  ) {}

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

    const tripDirection =
      createBookingDto.tripDirection ?? TripDirection.ONE_WAY;

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
      const calculatedDuration = this.calculateDuration(
        pickupDate,
        createBookingDto.dropoffDate,
      );

      dropoffDate = calculatedDuration.dropoffDate;
      durationHours = calculatedDuration.durationHours;
      durationDays = calculatedDuration.durationDays;
    }

    const returnDate = this.validateReturnTripFields(
      tripDirection,
      pickupDate,
      createBookingDto.returnDate,
      createBookingDto.returnPickupLocation,
      createBookingDto.returnDestination,
    );

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
      await this.validateRoute(
        createBookingDto.routeId,
        createBookingDto.companyId,
      );
    }

    if (createBookingDto.driverId) {
      await this.validateDriverForAssignment(
        createBookingDto.driverId,
        createBookingDto.companyId,
      );
    }

    if (createBookingDto.vehicleId) {
      await this.validateVehicleForAssignment(
        createBookingDto.vehicleId,
        createBookingDto.companyId,
        createBookingDto.passengers,
      );
    }

    const bookingRef = await this.generateBookingRef();

    const bookingStatus = BookingStatus.PENDING;

    const paymentStatus = this.calculatePaymentStatus(
      createBookingDto.depositAmount,
      createBookingDto.finalPrice,
    );

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
          tripDirection,
          customTripType: createBookingDto.customTripType?.trim(),

          pickupLocation: createBookingDto.pickupLocation.trim(),
          destination: createBookingDto.destination.trim(),
          pickupDate,
          dropoffDate,

          returnDate,
          returnPickupLocation:
            tripDirection === TripDirection.ROUND_TRIP
              ? createBookingDto.returnPickupLocation?.trim()
              : undefined,
          returnDestination:
            tripDirection === TripDirection.ROUND_TRIP
              ? createBookingDto.returnDestination?.trim()
              : undefined,
          returnNotes:
            tripDirection === TripDirection.ROUND_TRIP
              ? createBookingDto.returnNotes?.trim()
              : undefined,

          durationHours,
          durationDays,
          passengers: createBookingDto.passengers,

          luggageDetails: createBookingDto.luggageDetails?.trim(),
          specialNotes: createBookingDto.specialNotes?.trim(),

          estimatedPrice: createBookingDto.estimatedPrice,
          finalPrice: createBookingDto.finalPrice,
          depositAmount: createBookingDto.depositAmount,

          smartPricingMode: createBookingDto.smartPricingMode?.trim(),
          smartDistanceKm: createBookingDto.smartDistanceKm,
          smartDurationMinutes: createBookingDto.smartDurationMinutes,
          matchedRouteId: createBookingDto.matchedRouteId?.trim(),
          matchedRouteName: createBookingDto.matchedRouteName?.trim(),
          matchedRouteDirection: createBookingDto.matchedRouteDirection?.trim(),

          status: bookingStatus,
          paymentStatus,
        },
        include: this.bookingInclude(),
      });

      return createdBooking;
    });

    if (booking.driverId) {
      await this.notifyDriverAssignment(booking, null);
    }

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

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id },
      include: this.bookingInclude(),
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      existingBooking.status === BookingStatus.COMPLETED ||
      existingBooking.status === BookingStatus.CANCELLED ||
      existingBooking.status === BookingStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        'Completed, cancelled or no-show bookings cannot be edited',
      );
    }

    const companyId = existingBooking.companyId;

    if (updateBookingDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: updateBookingDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (customer.companyId !== companyId) {
        throw new BadRequestException('Customer does not belong to this company');
      }
    }

    if (updateBookingDto.routeId) {
      await this.validateRoute(updateBookingDto.routeId, companyId);
    }

    const nextPassengers =
      updateBookingDto.passengers ?? existingBooking.passengers;

    const nextDriverId =
      updateBookingDto.driverId === undefined
        ? existingBooking.driverId
        : updateBookingDto.driverId || null;

    const nextVehicleId =
      updateBookingDto.vehicleId === undefined
        ? existingBooking.vehicleId
        : updateBookingDto.vehicleId || null;

    const driverChanged = nextDriverId !== existingBooking.driverId;
    const vehicleChanged = nextVehicleId !== existingBooking.vehicleId;

    if (
      existingBooking.status === BookingStatus.IN_PROGRESS &&
      (!nextDriverId || !nextVehicleId)
    ) {
      throw new BadRequestException(
        'In-progress trips must keep an assigned driver and vehicle',
      );
    }

    if (nextDriverId && driverChanged) {
      await this.validateDriverForAssignment(nextDriverId, companyId);
    }

    if (nextVehicleId && vehicleChanged) {
      await this.validateVehicleForAssignment(
        nextVehicleId,
        companyId,
        nextPassengers,
      );
    }

    if (nextVehicleId && !vehicleChanged) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: nextVehicleId },
      });

      if (vehicle && nextPassengers > vehicle.passengerCapacity) {
        throw new BadRequestException(
          `Passengers cannot exceed vehicle capacity of ${vehicle.passengerCapacity}`,
        );
      }
    }

    const nextTripType = updateBookingDto.tripType ?? existingBooking.tripType;
    const nextTripDirection =
      updateBookingDto.tripDirection ?? existingBooking.tripDirection;

    const nextCustomTripType =
      updateBookingDto.customTripType === undefined
        ? existingBooking.customTripType
        : updateBookingDto.customTripType;

    if (nextTripType === 'CUSTOM' && !nextCustomTripType?.trim()) {
      throw new BadRequestException(
        'Custom trip type is required when trip type is CUSTOM',
      );
    }

    const pickupDate = updateBookingDto.pickupDate
      ? new Date(updateBookingDto.pickupDate)
      : existingBooking.pickupDate;

    if (Number.isNaN(pickupDate.getTime())) {
      throw new BadRequestException('Invalid pickup date');
    }

    let dropoffDate =
      updateBookingDto.dropoffDate === undefined
        ? existingBooking.dropoffDate
        : updateBookingDto.dropoffDate
          ? new Date(updateBookingDto.dropoffDate)
          : null;

    let durationHours =
      updateBookingDto.durationHours === undefined
        ? existingBooking.durationHours
        : updateBookingDto.durationHours;

    let durationDays =
      updateBookingDto.durationDays === undefined
        ? existingBooking.durationDays
        : updateBookingDto.durationDays;

    if (dropoffDate) {
      const calculatedDuration = this.calculateDuration(pickupDate, dropoffDate);

      dropoffDate = calculatedDuration.dropoffDate;
      durationHours = calculatedDuration.durationHours;
      durationDays = calculatedDuration.durationDays;
    } else {
      durationHours = null;
      durationDays = null;
    }

    const returnDateInput =
      updateBookingDto.returnDate === undefined
        ? existingBooking.returnDate
        : updateBookingDto.returnDate;

    const returnPickupLocationInput =
      updateBookingDto.returnPickupLocation === undefined
        ? existingBooking.returnPickupLocation
        : updateBookingDto.returnPickupLocation;

    const returnDestinationInput =
      updateBookingDto.returnDestination === undefined
        ? existingBooking.returnDestination
        : updateBookingDto.returnDestination;

    const returnDate = this.validateReturnTripFields(
      nextTripDirection,
      pickupDate,
      returnDateInput,
      returnPickupLocationInput,
      returnDestinationInput,
    );

    const finalPrice =
      updateBookingDto.finalPrice === undefined
        ? existingBooking.finalPrice
        : updateBookingDto.finalPrice;

    const depositAmount =
      updateBookingDto.depositAmount === undefined
        ? existingBooking.depositAmount
        : updateBookingDto.depositAmount;

    if (
      depositAmount !== null &&
      depositAmount !== undefined &&
      finalPrice !== null &&
      finalPrice !== undefined &&
      Number(depositAmount) > Number(finalPrice)
    ) {
      throw new BadRequestException(
        'Deposit amount cannot be greater than final price',
      );
    }

    const paymentStatus = this.calculatePaymentStatus(
      depositAmount === null ? undefined : Number(depositAmount ?? 0),
      finalPrice === null ? undefined : Number(finalPrice ?? 0),
    );

    const nextStatus = existingBooking.status;

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      if (
        existingBooking.status === BookingStatus.IN_PROGRESS &&
        vehicleChanged &&
        existingBooking.vehicleId
      ) {
        await tx.vehicle.update({
          where: { id: existingBooking.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      if (
        existingBooking.status === BookingStatus.IN_PROGRESS &&
        driverChanged &&
        existingBooking.driverId
      ) {
        await tx.driver.update({
          where: { id: existingBooking.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }

      if (
        existingBooking.status === BookingStatus.IN_PROGRESS &&
        vehicleChanged &&
        nextVehicleId
      ) {
        await tx.vehicle.update({
          where: { id: nextVehicleId },
          data: { status: VehicleStatus.BOOKED },
        });
      }

      if (
        existingBooking.status === BookingStatus.IN_PROGRESS &&
        driverChanged &&
        nextDriverId
      ) {
        await tx.driver.update({
          where: { id: nextDriverId },
          data: { status: DriverStatus.ON_TRIP },
        });
      }

      const result = await tx.booking.update({
        where: { id },
        data: {
          customerId: updateBookingDto.customerId,
          routeId:
            updateBookingDto.routeId === undefined
              ? undefined
              : updateBookingDto.routeId || null,
          driverId:
            updateBookingDto.driverId === undefined ? undefined : nextDriverId,
          vehicleId:
            updateBookingDto.vehicleId === undefined ? undefined : nextVehicleId,

          tripType: updateBookingDto.tripType,
          tripDirection: updateBookingDto.tripDirection,
          customTripType:
            updateBookingDto.customTripType === undefined
              ? undefined
              : updateBookingDto.customTripType?.trim() || null,

          pickupLocation: updateBookingDto.pickupLocation?.trim(),
          destination: updateBookingDto.destination?.trim(),
          pickupDate,
          dropoffDate,

          returnDate:
            nextTripDirection === TripDirection.ROUND_TRIP ? returnDate : null,
          returnPickupLocation:
            nextTripDirection === TripDirection.ROUND_TRIP
              ? returnPickupLocationInput?.trim() || null
              : null,
          returnDestination:
            nextTripDirection === TripDirection.ROUND_TRIP
              ? returnDestinationInput?.trim() || null
              : null,
          returnNotes:
            nextTripDirection === TripDirection.ROUND_TRIP
              ? updateBookingDto.returnNotes === undefined
                ? existingBooking.returnNotes
                : updateBookingDto.returnNotes?.trim() || null
              : null,

          durationHours,
          durationDays,
          passengers: updateBookingDto.passengers,

          luggageDetails:
            updateBookingDto.luggageDetails === undefined
              ? undefined
              : updateBookingDto.luggageDetails?.trim() || null,
          specialNotes:
            updateBookingDto.specialNotes === undefined
              ? undefined
              : updateBookingDto.specialNotes?.trim() || null,

          estimatedPrice:
            updateBookingDto.estimatedPrice === undefined
              ? undefined
              : updateBookingDto.estimatedPrice,
          finalPrice:
            updateBookingDto.finalPrice === undefined
              ? undefined
              : updateBookingDto.finalPrice,
          depositAmount:
            updateBookingDto.depositAmount === undefined
              ? undefined
              : updateBookingDto.depositAmount,

          status: nextStatus,
          paymentStatus,
        },
        include: this.bookingInclude(),
      });

      return result;
    });

    if (driverChanged) {
      if (nextDriverId) {
        await this.notifyDriverAssignment(
          updatedBooking,
          existingBooking.driverId,
        );
      } else {
        await this.driverTripsService.revokeActiveTokensForBooking(
          updatedBooking.id,
        );
      }
    }

    return updatedBooking;
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.validateStatusTransition(booking, status);

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id },
        data: {
          status,
        },
        include: this.bookingInclude(),
      });

      if (status === BookingStatus.IN_PROGRESS) {
        if (booking.vehicleId) {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: {
              status: VehicleStatus.BOOKED,
            },
          });
        }

        if (booking.driverId) {
          await tx.driver.update({
            where: { id: booking.driverId },
            data: {
              status: DriverStatus.ON_TRIP,
            },
          });
        }
      }

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

      return result;
    });

    if (booking.status !== status) {
      await this.notifyBookingStatusChange(updatedBooking, booking.status);
    }

    return updatedBooking;
  }

  private validateStatusTransition(
    booking: {
      status: BookingStatus;
      driverId: string | null;
      vehicleId: string | null;
    },
    nextStatus: BookingStatus,
  ) {
    if (booking.status === nextStatus) {
      return;
    }

    if (nextStatus === BookingStatus.IN_PROGRESS) {
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException(
          'Trip can only be started after the booking is confirmed',
        );
      }

      if (!booking.driverId || !booking.vehicleId) {
        throw new BadRequestException(
          'Assign a driver and vehicle before starting this trip.',
        );
      }
    }

    if (
      nextStatus === BookingStatus.COMPLETED &&
      booking.status !== BookingStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Trip can only be completed after it has started',
      );
    }
  }

  async remove(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: {
          bookingId: booking.id,
        },
      });

      const deletedBooking = await tx.booking.delete({
        where: { id },
      });

      if (booking.vehicleId) {
        const activeVehicleBookings = await tx.booking.count({
          where: {
            vehicleId: booking.vehicleId,
            status: BookingStatus.IN_PROGRESS,
          },
        });

        if (activeVehicleBookings === 0) {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: {
              status: VehicleStatus.AVAILABLE,
            },
          });
        }
      }

      if (booking.driverId) {
        const activeDriverBookings = await tx.booking.count({
          where: {
            driverId: booking.driverId,
            status: BookingStatus.IN_PROGRESS,
          },
        });

        if (activeDriverBookings === 0) {
          await tx.driver.update({
            where: { id: booking.driverId },
            data: {
              status: DriverStatus.AVAILABLE,
            },
          });
        }
      }

      return deletedBooking;
    });
  }

  private async notifyBookingStatusChange(
    booking: NotificationBookingRecord,
    previousStatus: BookingStatus,
  ) {
    try {
      await this.notificationsService.sendBookingStatusEmail(
        booking,
        previousStatus,
      );
    } catch (error) {
      console.warn(
        `Booking status notification failed for ${booking.bookingRef}`,
        error,
      );
    }
  }

  private async notifyDriverAssignment(
    booking: NotificationBookingRecord,
    previousDriverId: string | null,
  ) {
    try {
      const driverTripToken = await this.driverTripsService.createTokenForAssignment(
        booking.id,
        booking.driverId as string,
      );

      await this.notificationsService.sendDriverAssignmentEmail(
        booking,
        previousDriverId,
        driverTripToken,
      );
    } catch (error) {
      console.warn(
        `Driver assignment notification failed for ${booking.bookingRef}`,
        error,
      );
    }
  }

  private async validateRoute(routeId: string, companyId: string) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (route.companyId !== companyId) {
      throw new BadRequestException('Route does not belong to this company');
    }

    if (route.isDeleted) {
      throw new BadRequestException('Route is archived');
    }

    if (!route.isActive) {
      throw new BadRequestException('Route is inactive');
    }

    return route;
  }

  private async validateDriverForAssignment(
    driverId: string,
    companyId: string,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.companyId !== companyId) {
      throw new BadRequestException('Driver does not belong to this company');
    }

    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new BadRequestException('Driver is not available');
    }

    return driver;
  }

  private async validateVehicleForAssignment(
    vehicleId: string,
    companyId: string,
    passengers: number,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.companyId !== companyId) {
      throw new BadRequestException('Vehicle does not belong to this company');
    }

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException('Vehicle is not available');
    }

    if (passengers > vehicle.passengerCapacity) {
      throw new BadRequestException(
        `Passengers cannot exceed vehicle capacity of ${vehicle.passengerCapacity}`,
      );
    }

    return vehicle;
  }

  private calculateDuration(pickupDate: Date, dropoffDateInput: string | Date) {
    const dropoffDate =
      dropoffDateInput instanceof Date
        ? dropoffDateInput
        : new Date(dropoffDateInput);

    if (Number.isNaN(dropoffDate.getTime())) {
      throw new BadRequestException('Invalid drop-off date');
    }

    if (dropoffDate <= pickupDate) {
      throw new BadRequestException('Drop-off date must be after pickup date');
    }

    const durationMs = dropoffDate.getTime() - pickupDate.getTime();
    const calculatedHours = durationMs / (1000 * 60 * 60);
    const calculatedDays = calculatedHours / 24;

    return {
      dropoffDate,
      durationHours: Number(calculatedHours.toFixed(2)),
      durationDays: Number(calculatedDays.toFixed(2)),
    };
  }

  private validateReturnTripFields(
    tripDirection: TripDirection,
    pickupDate: Date,
    returnDateInput?: string | Date | null,
    returnPickupLocation?: string | null,
    returnDestination?: string | null,
  ) {
    if (tripDirection === TripDirection.ONE_WAY) {
      return null;
    }

    if (!returnDateInput) {
      throw new BadRequestException('Return date is required for round trip');
    }

    const returnDate =
      returnDateInput instanceof Date
        ? returnDateInput
        : new Date(returnDateInput);

    if (Number.isNaN(returnDate.getTime())) {
      throw new BadRequestException('Invalid return date');
    }

    if (returnDate <= pickupDate) {
      throw new BadRequestException('Return date must be after pickup date');
    }

    if (!returnPickupLocation?.trim()) {
      throw new BadRequestException(
        'Return pickup location is required for round trip',
      );
    }

    if (!returnDestination?.trim()) {
      throw new BadRequestException(
        'Return destination is required for round trip',
      );
    }

    return returnDate;
  }

  private calculatePaymentStatus(
    _depositAmount?: number | null,
    _finalPrice?: number | null,
  ) {
    // depositAmount is the requested deposit, not money received.
    // Payment status must only change after a real successful payment record.
    return PaymentStatus.UNPAID;
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
      tripActionLogs: {
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 3,
      },
    };
  }
}
