import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEvent,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LogNotificationInput = {
  companyId: string;
  bookingId?: string | null;
  customerId?: string | null;
  paymentId?: string | null;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient?: string | null;
  subject?: string | null;
  message: string;
  status?: NotificationDeliveryStatus;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogNotificationInput) {
    return this.prisma.notificationLog.create({
      data: {
        companyId: input.companyId,
        bookingId: input.bookingId ?? null,
        customerId: input.customerId ?? null,
        paymentId: input.paymentId ?? null,
        event: input.event,
        channel: input.channel,
        recipient: input.recipient ?? null,
        subject: input.subject ?? null,
        message: input.message,
        status: input.status ?? NotificationDeliveryStatus.QUEUED,
        errorMessage: input.errorMessage ?? null,
        metadata: input.metadata ?? {},
      },
    });
  }

  async logCustomerNotification(input: {
    companyId: string;
    bookingId?: string | null;
    customerId?: string | null;
    paymentId?: string | null;
    event: NotificationEvent;
    customerName: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    subject: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const logs = [];

    if (input.customerEmail) {
      logs.push(
        await this.log({
          companyId: input.companyId,
          bookingId: input.bookingId,
          customerId: input.customerId,
          paymentId: input.paymentId,
          event: input.event,
          channel: NotificationChannel.EMAIL,
          recipient: input.customerEmail,
          subject: input.subject,
          message: input.message,
          metadata: input.metadata,
        }),
      );
    }

    if (input.customerPhone) {
      logs.push(
        await this.log({
          companyId: input.companyId,
          bookingId: input.bookingId,
          customerId: input.customerId,
          paymentId: input.paymentId,
          event: input.event,
          channel: NotificationChannel.WHATSAPP,
          recipient: input.customerPhone,
          subject: null,
          message: input.message,
          metadata: input.metadata,
        }),
      );
    }

    if (logs.length === 0) {
      logs.push(
        await this.log({
          companyId: input.companyId,
          bookingId: input.bookingId,
          customerId: input.customerId,
          paymentId: input.paymentId,
          event: input.event,
          channel: NotificationChannel.SYSTEM,
          recipient: null,
          subject: input.subject,
          message: input.message,
          status: NotificationDeliveryStatus.SKIPPED,
          errorMessage: 'Customer has no email or phone recipient.',
          metadata: input.metadata,
        }),
      );
    }

    return logs;
  }

  findAll(companyId?: string) {
    return this.prisma.notificationLog.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async getCounts(companyId?: string) {
    const where = companyId ? { companyId } : undefined;

    const [total, queued, sent, failed, skipped] = await Promise.all([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.count({
        where: { ...where, status: NotificationDeliveryStatus.QUEUED },
      }),
      this.prisma.notificationLog.count({
        where: { ...where, status: NotificationDeliveryStatus.SENT },
      }),
      this.prisma.notificationLog.count({
        where: { ...where, status: NotificationDeliveryStatus.FAILED },
      }),
      this.prisma.notificationLog.count({
        where: { ...where, status: NotificationDeliveryStatus.SKIPPED },
      }),
    ]);

    return {
      total,
      queued,
      sent,
      failed,
      skipped,
    };
  }
}
