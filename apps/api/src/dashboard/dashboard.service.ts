import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  DriverStatus,
  NotificationDeliveryStatus,
  PaymentStatus,
  VehicleStatus,
} from '@prisma/client';
import type { DashboardAnalyticsQuery } from './dashboard.controller';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(companyId: string, query: DashboardAnalyticsQuery) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const { from, to } = this.resolveDateRange(query.from, query.to);
    const bookingStatus = this.cleanEnumValue<BookingStatus>(
      query.bookingStatus,
      BookingStatus,
    );
    const paymentStatus = this.cleanEnumValue<PaymentStatus>(
      query.paymentStatus,
      PaymentStatus,
    );

    const bookingWhere = {
      companyId,
      createdAt: {
        gte: from,
        lte: to,
      },
      ...(bookingStatus ? { status: bookingStatus } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(query.routeId ? { routeId: query.routeId } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
    };

    const bookingRelationFilter = {
      companyId,
      ...(bookingStatus ? { status: bookingStatus } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(query.routeId ? { routeId: query.routeId } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
    };

    const [
      bookings,
      paidPayments,
      notificationLogs,
      recentTripActions,
      routes,
      drivers,
      vehicles,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          bookingRef: true,
          status: true,
          paymentStatus: true,
          tripType: true,
          customTripType: true,
          pickupLocation: true,
          destination: true,
          pickupDate: true,
          routeId: true,
          route: {
            select: {
              id: true,
              name: true,
              pickupCity: true,
              destinationCity: true,
            },
          },
          driverId: true,
          vehicleId: true,
          estimatedPrice: true,
          finalPrice: true,
          smartPricingMode: true,
          smartDistanceKm: true,
          smartDurationMinutes: true,
          matchedRouteName: true,
          createdAt: true,
          customer: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          paidAt: {
            gte: from,
            lte: to,
          },
          booking: bookingRelationFilter,
        },
        select: {
          id: true,
          amount: true,
          method: true,
          paymentType: true,
          paidAt: true,
          createdAt: true,
          booking: {
            select: {
              bookingRef: true,
            },
          },
        },
        orderBy: {
          paidAt: 'desc',
        },
      }),

      this.prisma.notificationLog.findMany({
        where: {
          companyId,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          id: true,
          event: true,
          status: true,
          subject: true,
          recipient: true,
          errorMessage: true,
          createdAt: true,
          sentAt: true,
          bookingId: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      }),

      this.prisma.tripActionLog.findMany({
        where: {
          companyId,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          id: true,
          action: true,
          note: true,
          createdAt: true,
          booking: {
            select: {
              bookingRef: true,
              pickupLocation: true,
              destination: true,
            },
          },
          driver: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),

      this.prisma.route.findMany({
        where: {
          companyId,
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          pickupCity: true,
          destinationCity: true,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),

      this.prisma.driver.findMany({
        where: { companyId },
        select: {
          id: true,
          fullName: true,
          status: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      }),

      this.prisma.vehicle.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          registrationNo: true,
          status: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    const bookingValue = bookings.reduce(
      (sum, booking) => sum + this.getBookingValue(booking),
      0,
    );

    const paidRevenue = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const manualQuoteBookings = bookings.filter((booking) =>
      this.isManualQuotePending(booking),
    );

    const unassignedConfirmedTrips = bookings.filter(
      (booking) =>
        booking.status === BookingStatus.CONFIRMED &&
        (!booking.driverId || !booking.vehicleId),
    ).length;

    const notificationFailures = notificationLogs.filter(
      (log) => log.status === NotificationDeliveryStatus.FAILED,
    ).length;

    const bookingsOverTime = this.buildBookingsOverTime(bookings, from, to);
    const bookingStatusBreakdown = Object.values(BookingStatus).map(
      (status) => ({
        status,
        count: bookings.filter((booking) => booking.status === status).length,
      }),
    );

    const paymentStatusBreakdown = Object.values(PaymentStatus).map(
      (status) => {
        const matchingBookings = bookings.filter(
          (booking) => booking.paymentStatus === status,
        );

        return {
          status,
          count: matchingBookings.length,
          bookingValue: this.roundMoney(
            matchingBookings.reduce(
              (sum, booking) => sum + this.getBookingValue(booking),
              0,
            ),
          ),
        };
      },
    );

    const routeDemand = this.buildRouteDemand(bookings);
    const customRouteDemand = this.buildCustomRouteDemand(bookings);
    const notificationHealth = Object.values(NotificationDeliveryStatus).map(
      (status) => ({
        status,
        count: notificationLogs.filter((log) => log.status === status).length,
      }),
    );

    const recentNotificationFailures = notificationLogs
      .filter((log) => log.status === NotificationDeliveryStatus.FAILED)
      .slice(0, 5)
      .map((log) => ({
        id: log.id,
        event: log.event,
        recipient: log.recipient,
        subject: log.subject,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      }));

    return {
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      summary: {
        totalBookings: bookings.length,
        bookingValue: this.roundMoney(bookingValue),
        paidRevenue: this.roundMoney(paidRevenue),
        manualQuotePending: manualQuoteBookings.length,
        unassignedConfirmedTrips,
        tripsInProgress: bookings.filter(
          (booking) => booking.status === BookingStatus.IN_PROGRESS,
        ).length,
        completedTrips: bookings.filter(
          (booking) => booking.status === BookingStatus.COMPLETED,
        ).length,
        notificationFailures,
      },
      bookingsOverTime,
      bookingStatusBreakdown,
      paymentStatusBreakdown,
      routeDemand,
      customRouteDemand,
      manualQuoteQueue: manualQuoteBookings.slice(0, 8).map((booking) => ({
        id: booking.id,
        bookingRef: booking.bookingRef,
        routeDisplay: this.formatRouteDisplay(
          booking.pickupLocation,
          booking.destination,
        ),
        pickupDate: booking.pickupDate,
        customerName: booking.customer.fullName,
        status: booking.status,
      })),
      notificationHealth: {
        breakdown: notificationHealth,
        recentFailures: recentNotificationFailures,
      },
      recentActivity: this.buildRecentActivity({
        bookings,
        paidPayments,
        notificationLogs,
        tripActions: recentTripActions,
      }),
      filterOptions: {
        routes: routes.map((route) => ({
          id: route.id,
          name: route.name,
          label: `${route.name} (${route.pickupCity} to ${route.destinationCity})`,
          isActive: route.isActive,
        })),
        drivers: drivers.map((driver) => ({
          id: driver.id,
          name: driver.fullName,
          status: driver.status,
        })),
        vehicles: vehicles.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          label: `${vehicle.name} (${vehicle.registrationNo})`,
          status: vehicle.status,
        })),
      },
    };
  }

  async getSummary(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      paidBookings,
      partiallyPaidBookings,
      unpaidBookings,
      totalVehicles,
      availableVehicles,
      bookedVehicles,
      totalDrivers,
      availableDrivers,
      busyDrivers,
      totalCustomers,
      todayTrips,
      payments,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: { companyId },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          status: BookingStatus.PENDING,
        },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          status: BookingStatus.CONFIRMED,
        },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          status: BookingStatus.COMPLETED,
        },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          status: BookingStatus.CANCELLED,
        },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          paymentStatus: PaymentStatus.PAID,
        },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
        },
      }),

      this.prisma.booking.count({
        where: {
          companyId,
          paymentStatus: PaymentStatus.UNPAID,
        },
      }),

      this.prisma.vehicle.count({
        where: { companyId },
      }),

      this.prisma.vehicle.count({
        where: {
          companyId,
          status: VehicleStatus.AVAILABLE,
        },
      }),

      this.prisma.vehicle.count({
        where: {
          companyId,
          status: VehicleStatus.BOOKED,
        },
      }),

      this.prisma.driver.count({
        where: { companyId },
      }),

      this.prisma.driver.count({
        where: {
          companyId,
          status: DriverStatus.AVAILABLE,
        },
      }),

      this.prisma.driver.count({
        where: {
          companyId,
          status: DriverStatus.ON_TRIP,
        },
      }),

      this.prisma.customer.count({
        where: { companyId },
      }),

      this.prisma.booking.findMany({
        where: {
          companyId,
          pickupDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          customer: true,
          route: true,
          driver: true,
          vehicle: true,
        },
        orderBy: {
          pickupDate: 'asc',
        },
      }),

      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          booking: {
            companyId,
          },
        },
      }),
    ]);

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    return {
      company: {
        id: company.id,
        name: company.name,
        status: company.status,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      payments: {
        paidBookings,
        partiallyPaidBookings,
        unpaidBookings,
        totalRevenue,
      },
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        booked: bookedVehicles,
      },
      drivers: {
        total: totalDrivers,
        available: availableDrivers,
        busy: busyDrivers,
      },
      customers: {
        total: totalCustomers,
      },
      todayTrips,
    };
  }

  private resolveDateRange(fromInput?: string, toInput?: string) {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    defaultFrom.setHours(0, 0, 0, 0);

    const from = fromInput ? new Date(fromInput) : defaultFrom;
    const to = toInput ? new Date(toInput) : now;

    const safeFrom = Number.isNaN(from.getTime()) ? defaultFrom : from;
    const safeTo = Number.isNaN(to.getTime()) ? now : to;

    safeFrom.setHours(0, 0, 0, 0);
    safeTo.setHours(23, 59, 59, 999);

    if (safeFrom > safeTo) {
      return {
        from: defaultFrom,
        to: now,
      };
    }

    return {
      from: safeFrom,
      to: safeTo,
    };
  }

  private cleanEnumValue<T extends string>(
    value: string | undefined,
    enumRecord: Record<string, T>,
  ) {
    if (!value) {
      return null;
    }

    const cleanValue = value.trim().toUpperCase();
    const enumValues = Object.values(enumRecord);

    return enumValues.includes(cleanValue as T) ? (cleanValue as T) : null;
  }

  private getBookingValue(booking: {
    finalPrice?: unknown;
    estimatedPrice?: unknown;
  }) {
    const value = Number(booking.finalPrice ?? booking.estimatedPrice ?? 0);

    return Number.isFinite(value) ? value : 0;
  }

  private isManualQuotePending(booking: {
    tripType: string;
    customTripType: string | null;
    smartPricingMode: string | null;
    finalPrice: unknown;
    status: BookingStatus;
  }) {
    const isCustom =
      booking.tripType === 'CUSTOM' ||
      Boolean(booking.customTripType?.toLowerCase().includes('custom')) ||
      Boolean(booking.smartPricingMode?.toLowerCase().includes('quote'));

    if (!isCustom) {
      return false;
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.NO_SHOW
    ) {
      return false;
    }

    return booking.finalPrice === null || booking.finalPrice === undefined;
  }

  private buildBookingsOverTime(
    bookings: Array<{ createdAt: Date }>,
    from: Date,
    to: Date,
  ) {
    const rows = new Map<string, number>();
    const cursor = new Date(from);

    while (cursor <= to) {
      rows.set(this.formatDateKey(cursor), 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    bookings.forEach((booking) => {
      const key = this.formatDateKey(booking.createdAt);
      rows.set(key, (rows.get(key) ?? 0) + 1);
    });

    return Array.from(rows.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private buildRouteDemand(
    bookings: Array<{
      routeId: string | null;
      route: {
        id: string;
        name: string;
        pickupCity: string;
        destinationCity: string;
      } | null;
      matchedRouteName: string | null;
    }>,
  ) {
    const rows = new Map<
      string,
      {
        routeId: string | null;
        name: string;
        pickup: string | null;
        destination: string | null;
        count: number;
      }
    >();

    bookings.forEach((booking) => {
      if (!booking.routeId || !booking.route) {
        return;
      }

      const current = rows.get(booking.route.id) ?? {
        routeId: booking.route.id,
        name: booking.route.name || booking.matchedRouteName || 'Saved route',
        pickup: booking.route.pickupCity,
        destination: booking.route.destinationCity,
        count: 0,
      };

      current.count += 1;
      rows.set(booking.route.id, current);
    });

    return Array.from(rows.values())
      .sort((first, second) => second.count - first.count)
      .slice(0, 8);
  }

  private buildCustomRouteDemand(
    bookings: Array<{
      routeId: string | null;
      tripType: string;
      customTripType: string | null;
      pickupLocation: string;
      destination: string;
      smartDistanceKm: unknown;
      smartDurationMinutes: number | null;
    }>,
  ) {
    const rows = new Map<
      string,
      {
        pickup: string;
        destination: string;
        count: number;
        distanceSamples: number[];
        durationSamples: number[];
      }
    >();

    bookings.forEach((booking) => {
      const isCustom =
        !booking.routeId ||
        booking.tripType === 'CUSTOM' ||
        Boolean(booking.customTripType);

      if (!isCustom) {
        return;
      }

      const key = `${this.normalizeLocation(
        booking.pickupLocation,
      )}:${this.normalizeLocation(booking.destination)}`;
      const current = rows.get(key) ?? {
        pickup: this.toDisplayLocation(booking.pickupLocation),
        destination: this.toDisplayLocation(booking.destination),
        count: 0,
        distanceSamples: [],
        durationSamples: [],
      };

      const distance = Number(booking.smartDistanceKm);
      if (Number.isFinite(distance) && distance > 0) {
        current.distanceSamples.push(distance);
      }

      if (
        Number.isFinite(booking.smartDurationMinutes) &&
        Number(booking.smartDurationMinutes) > 0
      ) {
        current.durationSamples.push(Number(booking.smartDurationMinutes));
      }

      current.count += 1;
      rows.set(key, current);
    });

    return Array.from(rows.values())
      .sort((first, second) => second.count - first.count)
      .slice(0, 8)
      .map((row) => ({
        pickup: row.pickup,
        destination: row.destination,
        count: row.count,
        averageDistanceKm: row.distanceSamples.length
          ? this.roundMoney(
              row.distanceSamples.reduce((sum, value) => sum + value, 0) /
                row.distanceSamples.length,
            )
          : null,
        averageDurationMinutes: row.durationSamples.length
          ? Math.round(
              row.durationSamples.reduce((sum, value) => sum + value, 0) /
                row.durationSamples.length,
            )
          : null,
      }));
  }

  private buildRecentActivity({
    bookings,
    paidPayments,
    notificationLogs,
    tripActions,
  }: {
    bookings: Array<{
      id: string;
      bookingRef: string;
      pickupLocation: string;
      destination: string;
      status: BookingStatus;
      createdAt: Date;
    }>;
    paidPayments: Array<{
      id: string;
      amount: unknown;
      paidAt: Date | null;
      createdAt: Date;
      booking: { bookingRef: string } | null;
    }>;
    notificationLogs: Array<{
      id: string;
      event: string;
      status: NotificationDeliveryStatus;
      createdAt: Date;
      errorMessage: string | null;
    }>;
    tripActions: Array<{
      id: string;
      action: string;
      note: string | null;
      createdAt: Date;
      booking: {
        bookingRef: string;
        pickupLocation: string;
        destination: string;
      };
      driver: {
        fullName: string;
      };
    }>;
  }) {
    const bookingActivity = bookings.slice(0, 8).map((booking) => ({
      id: `booking-${booking.id}`,
      type: 'BOOKING',
      title: `Booking ${booking.bookingRef}`,
      description: this.formatRouteDisplay(
        booking.pickupLocation,
        booking.destination,
      ),
      status: booking.status,
      createdAt: booking.createdAt,
    }));

    const paymentActivity = paidPayments.slice(0, 8).map((payment) => ({
      id: `payment-${payment.id}`,
      type: 'PAYMENT',
      title: `Payment received${
        payment.booking?.bookingRef ? ` for ${payment.booking.bookingRef}` : ''
      }`,
      description: `$${this.roundMoney(Number(payment.amount)).toFixed(2)}`,
      status: 'PAID',
      createdAt: payment.paidAt ?? payment.createdAt,
    }));

    const notificationActivity = notificationLogs
      .filter((log) => log.status === NotificationDeliveryStatus.FAILED)
      .slice(0, 8)
      .map((log) => ({
        id: `notification-${log.id}`,
        type: 'NOTIFICATION',
        title: `${log.event} failed`,
        description: log.errorMessage || 'Notification delivery failed.',
        status: log.status,
        createdAt: log.createdAt,
      }));

    const tripActivity = tripActions.slice(0, 8).map((action) => ({
      id: `trip-${action.id}`,
      type: 'TRIP_ACTION',
      title: `${this.niceLabel(action.action)} by ${action.driver.fullName}`,
      description:
        action.note ||
        `${action.booking.bookingRef}: ${this.formatRouteDisplay(
          action.booking.pickupLocation,
          action.booking.destination,
        )}`,
      status: action.action,
      createdAt: action.createdAt,
    }));

    return [
      ...bookingActivity,
      ...paymentActivity,
      ...notificationActivity,
      ...tripActivity,
    ]
      .sort((first, second) => {
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      })
      .slice(0, 12);
  }

  private formatRouteDisplay(pickup: string, destination: string) {
    return `${this.toDisplayLocation(pickup)} to ${this.toDisplayLocation(
      destination,
    )}`;
  }

  private toDisplayLocation(value: string) {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((part) => {
        if (/^(cbd|rgm)$/i.test(part)) {
          return part.toUpperCase();
        }

        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private normalizeLocation(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private formatDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private niceLabel(value: string) {
    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
