import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BookingStatus,
  DriverStatus,
  Prisma,
  TripActionType,
  VehicleStatus,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const driverTripTokenInclude = Prisma.validator<Prisma.DriverTripTokenInclude>()({
  driver: true,
  booking: {
    include: {
      customer: true,
      route: true,
      driver: true,
      vehicle: true,
      tripActionLogs: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  },
});

type ValidatedTripToken = Prisma.DriverTripTokenGetPayload<{
  include: typeof driverTripTokenInclude;
}>;

@Injectable()
export class DriverTripsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTokenForAssignment(bookingId: string, driverId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        companyId: true,
        driverId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.driverId !== driverId) {
      throw new BadRequestException(
        'Driver token can only be created for the assigned driver',
      );
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = this.getTokenExpiry();

    await this.prisma.$transaction(async (tx) => {
      await tx.driverTripToken.updateMany({
        where: {
          bookingId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.driverTripToken.create({
        data: {
          companyId: booking.companyId,
          bookingId,
          driverId,
          tokenHash,
          expiresAt,
        },
      });
    });

    return rawToken;
  }

  async revokeActiveTokensForBooking(bookingId: string) {
    await this.prisma.driverTripToken.updateMany({
      where: {
        bookingId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findTrip(token: string) {
    const driverTripToken = await this.findValidatedToken(token);

    return this.toTripResponse(driverTripToken);
  }

  async startTrip(token: string) {
    const driverTripToken = await this.findValidatedToken(token);

    if (driverTripToken.booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Trip can only be started after the booking is confirmed.',
      );
    }

    if (!driverTripToken.booking.vehicleId) {
      throw new BadRequestException(
        'A vehicle must be assigned before this trip can start.',
      );
    }

    const updatedToken = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: driverTripToken.bookingId },
        data: {
          status: BookingStatus.IN_PROGRESS,
        },
      });

      await tx.driver.update({
        where: { id: driverTripToken.driverId },
        data: {
          status: DriverStatus.ON_TRIP,
        },
      });

      if (driverTripToken.booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: driverTripToken.booking.vehicleId },
          data: {
            status: VehicleStatus.BOOKED,
          },
        });
      }

      await tx.tripActionLog.create({
        data: {
          companyId: driverTripToken.companyId,
          bookingId: driverTripToken.bookingId,
          driverId: driverTripToken.driverId,
          action: TripActionType.START_TRIP,
        },
      });

      return tx.driverTripToken.findUniqueOrThrow({
        where: { id: driverTripToken.id },
        include: this.driverTripTokenInclude(),
      });
    });

    return this.toTripResponse(updatedToken);
  }

  async completeTrip(token: string) {
    const driverTripToken = await this.findValidatedToken(token);

    if (driverTripToken.booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Trip can only be completed after it has started.',
      );
    }

    const updatedToken = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: driverTripToken.bookingId },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });

      await tx.driver.update({
        where: { id: driverTripToken.driverId },
        data: {
          status: DriverStatus.AVAILABLE,
        },
      });

      if (driverTripToken.booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: driverTripToken.booking.vehicleId },
          data: {
            status: VehicleStatus.AVAILABLE,
          },
        });
      }

      await tx.tripActionLog.create({
        data: {
          companyId: driverTripToken.companyId,
          bookingId: driverTripToken.bookingId,
          driverId: driverTripToken.driverId,
          action: TripActionType.COMPLETE_TRIP,
        },
      });

      return tx.driverTripToken.findUniqueOrThrow({
        where: { id: driverTripToken.id },
        include: this.driverTripTokenInclude(),
      });
    });

    return this.toTripResponse(updatedToken);
  }

  async reportIssue(token: string, note?: string) {
    const driverTripToken = await this.findValidatedToken(token);

    if (
      driverTripToken.booking.status === BookingStatus.COMPLETED ||
      driverTripToken.booking.status === BookingStatus.CANCELLED ||
      driverTripToken.booking.status === BookingStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        'Issues cannot be reported after the trip is closed.',
      );
    }

    const issueNote = note?.trim() || 'Driver reported an issue with this trip.';

    const updatedToken = await this.prisma.$transaction(async (tx) => {
      await tx.tripActionLog.create({
        data: {
          companyId: driverTripToken.companyId,
          bookingId: driverTripToken.bookingId,
          driverId: driverTripToken.driverId,
          action: TripActionType.REPORT_ISSUE,
          note: issueNote,
        },
      });

      return tx.driverTripToken.findUniqueOrThrow({
        where: { id: driverTripToken.id },
        include: this.driverTripTokenInclude(),
      });
    });

    return this.toTripResponse(updatedToken);
  }

  private async findValidatedToken(rawToken: string) {
    const token = rawToken?.trim();

    if (!token) {
      throw new UnauthorizedException('Driver trip link is invalid.');
    }

    const driverTripToken = await this.prisma.driverTripToken.findUnique({
      where: {
        tokenHash: this.hashToken(token),
      },
      include: this.driverTripTokenInclude(),
    });

    if (!driverTripToken) {
      throw new UnauthorizedException('Driver trip link is invalid.');
    }

    if (driverTripToken.revokedAt) {
      throw new UnauthorizedException('Driver trip link is no longer active.');
    }

    if (driverTripToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Driver trip link has expired.');
    }

    if (driverTripToken.booking.driverId !== driverTripToken.driverId) {
      throw new UnauthorizedException('Driver trip assignment has changed.');
    }

    await this.prisma.driverTripToken.update({
      where: { id: driverTripToken.id },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return driverTripToken;
  }

  private toTripResponse(driverTripToken: ValidatedTripToken) {
    const { booking } = driverTripToken;

    return {
      bookingRef: booking.bookingRef,
      status: booking.status,
      pickupDate: booking.pickupDate,
      pickupLocation: booking.pickupLocation,
      destination: booking.destination,
      tripType: booking.tripType,
      tripDirection: booking.tripDirection,
      routeName: booking.route?.name ?? booking.matchedRouteName ?? null,
      passengers: booking.passengers,
      luggageDetails: booking.luggageDetails,
      specialNotes: booking.specialNotes,
      customer: {
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
      },
      driver: {
        fullName: booking.driver?.fullName ?? driverTripToken.driver.fullName,
        phone: booking.driver?.phone ?? driverTripToken.driver.phone,
      },
      vehicle: booking.vehicle
        ? {
            name: booking.vehicle.name,
            registrationNo: booking.vehicle.registrationNo,
          }
        : null,
      actions: booking.tripActionLogs.map((actionLog) => ({
        id: actionLog.id,
        action: actionLog.action,
        note: actionLog.note,
        createdAt: actionLog.createdAt,
      })),
      canStart: booking.status === BookingStatus.CONFIRMED,
      canComplete: booking.status === BookingStatus.IN_PROGRESS,
      canReportIssue:
        booking.status !== BookingStatus.COMPLETED &&
        booking.status !== BookingStatus.CANCELLED &&
        booking.status !== BookingStatus.NO_SHOW,
    };
  }

  private driverTripTokenInclude() {
    return driverTripTokenInclude;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getTokenExpiry() {
    const hours = Number(process.env.DRIVER_TRIP_TOKEN_HOURS || 168);
    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 168;

    return new Date(Date.now() + safeHours * 60 * 60 * 1000);
  }
}
