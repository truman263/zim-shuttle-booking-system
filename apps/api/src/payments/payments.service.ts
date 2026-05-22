import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: createPaymentDto.bookingId },
        include: {
          payments: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (!booking.finalPrice && !booking.estimatedPrice) {
        throw new BadRequestException(
          'Booking does not have a price set',
        );
      }

      const bookingTotal = Number(booking.finalPrice ?? booking.estimatedPrice);

      const previousPaidTotal = booking.payments
        .filter((payment) => payment.status === PaymentStatus.PAID)
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      const newPaidTotal = previousPaidTotal + createPaymentDto.amount;

      if (newPaidTotal > bookingTotal) {
        throw new BadRequestException(
          `Payment exceeds booking balance. Balance remaining is $${bookingTotal - previousPaidTotal}`,
        );
      }

      const payment = await tx.payment.create({
        data: {
          bookingId: createPaymentDto.bookingId,
          amount: createPaymentDto.amount,
          method: createPaymentDto.method,
          status: PaymentStatus.PAID,
          transactionRef: createPaymentDto.transactionRef,
          paidAt: new Date(),
        },
      });

      const newPaymentStatus =
        newPaidTotal >= bookingTotal
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIALLY_PAID;

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      return tx.payment.findUnique({
        where: { id: payment.id },
        include: {
          booking: {
            include: {
              customer: true,
              route: true,
              driver: true,
              vehicle: true,
            },
          },
        },
      });
    });
  }

  findAll() {
    return this.prisma.payment.findMany({
      include: {
        booking: {
          include: {
            customer: true,
            company: true,
            route: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            company: true,
            route: true,
            driver: true,
            vehicle: true,
          },
        },
      },
    });
  }
}