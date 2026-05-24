import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PaynowPaymentMethod,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicPaymentDto } from './dto/create-public-payment.dto';

@Injectable()
export class PublicPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCheckout(createPublicPaymentDto: CreatePublicPaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: createPublicPaymentDto.bookingId,
      },
      include: {
        customer: true,
        route: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking was not found.');
    }

    const paymentType =
      createPublicPaymentDto.paymentType || PaymentType.DEPOSIT;

    const paynowPaymentMethod =
      createPublicPaymentDto.paynowPaymentMethod || PaynowPaymentMethod.WEB;

    const payableAmount = this.calculatePayableAmount(
      Number(booking.finalPrice ?? booking.estimatedPrice ?? 0),
      Number(booking.depositAmount ?? 0),
      paymentType,
    );

    if (payableAmount <= 0) {
      throw new BadRequestException(
        'This booking does not have a valid payable amount.',
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: payableAmount,
        method: PaymentMethod.PAYNOW,
        status: PaymentStatus.UNPAID,
        gateway: PaymentGateway.PAYNOW,
        paymentType,
        paynowPaymentMethod,
        currency: 'USD',
        phone: createPublicPaymentDto.phone || booking.customer.phone,
        instructions:
          'Paynow payment has been prepared but live checkout is not configured yet.',
        rawResponse: JSON.stringify({
          configured: this.isPaynowConfigured(),
          reason: this.isPaynowConfigured()
            ? 'Paynow credentials are present. Live checkout implementation will be connected in the next step.'
            : 'Paynow Integration ID and Integration Key are not configured yet.',
        }),
      },
    });

    if (!this.isPaynowConfigured()) {
      return {
        success: false,
        paynowConfigured: false,
        requiresConfiguration: true,
        message:
          'Paynow is not configured yet. Please contact LadyBird Shuttle Services to complete payment.',
        bookingRef: booking.bookingRef,
        bookingId: booking.id,
        paymentId: payment.id,
        paymentType,
        paynowPaymentMethod,
        amount: payableAmount,
        currency: 'USD',
        paymentStatus: payment.status,
        whatsapp: '+263 77 361 5432',
      };
    }

    return {
      success: false,
      paynowConfigured: true,
      requiresConfiguration: false,
      message:
        'Paynow credentials are present. Live checkout will be connected in the next implementation step.',
      bookingRef: booking.bookingRef,
      bookingId: booking.id,
      paymentId: payment.id,
      paymentType,
      paynowPaymentMethod,
      amount: payableAmount,
      currency: 'USD',
      paymentStatus: payment.status,
    };
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        booking: {
          include: {
            customer: true,
            route: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment was not found.');
    }

    return {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      bookingRef: payment.booking.bookingRef,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paymentType: payment.paymentType,
      method: payment.method,
      gateway: payment.gateway,
      paynowPaymentMethod: payment.paynowPaymentMethod,
      transactionRef: payment.transactionRef,
      gatewayReference: payment.gatewayReference,
      pollUrl: payment.pollUrl,
      redirectUrl: payment.redirectUrl,
      paidAt: payment.paidAt,
      booking: {
        status: payment.booking.status,
        paymentStatus: payment.booking.paymentStatus,
        customer: {
          fullName: payment.booking.customer.fullName,
          phone: payment.booking.customer.phone,
          email: payment.booking.customer.email,
        },
        route: payment.booking.route
          ? {
              name: payment.booking.route.name,
              pickupCity: payment.booking.route.pickupCity,
              destinationCity: payment.booking.route.destinationCity,
            }
          : null,
      },
    };
  }

  async getBookingPayments(bookingRef: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        bookingRef,
      },
      include: {
        customer: true,
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking was not found.');
    }

    const totalPaid = booking.payments
      .filter((payment) => payment.status === PaymentStatus.PAID)
      .reduce((total, payment) => total + Number(payment.amount), 0);

    const finalPrice = Number(booking.finalPrice ?? booking.estimatedPrice ?? 0);
    const balance = Math.max(finalPrice - totalPaid, 0);

    return {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      finalPrice,
      totalPaid,
      balance,
      customer: {
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
        email: booking.customer.email,
      },
      payments: booking.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        method: payment.method,
        gateway: payment.gateway,
        paymentType: payment.paymentType,
        paynowPaymentMethod: payment.paynowPaymentMethod,
        status: payment.status,
        transactionRef: payment.transactionRef,
        gatewayReference: payment.gatewayReference,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      })),
    };
  }

  async handlePaynowReturn(paymentId?: string) {
    if (!paymentId) {
      return {
        success: false,
        message:
          'Payment return received, but no payment reference was supplied.',
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment was not found.');
    }

    return {
      success: true,
      message:
        'Payment return received. Payment verification will be completed through Paynow polling once live credentials are connected.',
      paymentId: payment.id,
      bookingRef: payment.booking.bookingRef,
      paymentStatus: payment.status,
      bookingPaymentStatus: payment.booking.paymentStatus,
    };
  }

  async handlePaynowResult(body: Record<string, unknown>) {
    return {
      success: true,
      message:
        'Paynow result endpoint is active. Live verification will be connected once Paynow credentials are available.',
      received: body,
    };
  }

  private calculatePayableAmount(
    finalPrice: number,
    depositAmount: number,
    paymentType: PaymentType,
  ) {
    if (paymentType === PaymentType.FULL_PAYMENT) {
      return finalPrice;
    }

    if (paymentType === PaymentType.BALANCE) {
      return finalPrice;
    }

    if (depositAmount > 0) {
      return depositAmount;
    }

    if (finalPrice > 0) {
      return Math.round(finalPrice * 0.3 * 100) / 100;
    }

    return 0;
  }

  private isPaynowConfigured() {
    return Boolean(
      process.env.PAYNOW_INTEGRATION_ID &&
        process.env.PAYNOW_INTEGRATION_KEY,
    );
  }
}
