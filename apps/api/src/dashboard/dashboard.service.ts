import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, PaymentStatus, VehicleStatus, DriverStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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
}