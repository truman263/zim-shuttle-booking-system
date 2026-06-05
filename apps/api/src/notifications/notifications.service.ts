import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEvent,
  Prisma,
} from '@prisma/client';
import { Resend } from 'resend';
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
  metadata?: Prisma.InputJsonValue;
};

type MoneyValue = { toString(): string } | number | string | null | undefined;

type BookingEmailCompany = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

type BookingEmailCustomer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
};

type BookingEmailDriver = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
};

type BookingEmailRoute = {
  name: string;
  pickupCity: string;
  destinationCity: string;
} | null;

type BookingEmailRecord = {
  id: string;
  companyId: string;
  customerId: string;
  routeId?: string | null;
  bookingRef: string;
  tripType: string;
  tripDirection: string;
  customTripType?: string | null;
  pickupLocation: string;
  destination: string;
  pickupDate: Date;
  dropoffDate?: Date | null;
  returnDate?: Date | null;
  returnPickupLocation?: string | null;
  returnDestination?: string | null;
  passengers: number;
  luggageDetails?: string | null;
  specialNotes?: string | null;
  estimatedPrice?: MoneyValue;
  finalPrice?: MoneyValue;
  depositAmount?: MoneyValue;
  status: string;
  paymentStatus: string;
  smartDistanceKm?: MoneyValue;
  smartDurationMinutes?: number | null;
  matchedRouteName?: string | null;
  company?: BookingEmailCompany | null;
  customer?: BookingEmailCustomer | null;
  driverId?: string | null;
  driver?: BookingEmailDriver | null;
  route?: BookingEmailRoute;
};

type SendEmailNotificationInput = {
  companyId: string;
  bookingId?: string | null;
  customerId?: string | null;
  event: NotificationEvent;
  recipient?: string | string[] | null;
  subject: string;
  text: string;
  html: string;
  logMessage?: string;
  metadata?: Prisma.InputJsonValue;
  idempotencyKey: string;
};

@Injectable()
export class NotificationsService {
  private resend?: Resend;

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
    metadata?: Prisma.InputJsonValue;
  }) {
    const logs: unknown[] = [];

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

  async sendBookingReceivedEmails(booking: BookingEmailRecord) {
    await Promise.all([
      this.sendCustomerBookingEmail(booking),
      this.sendAdminBookingEmail(booking),
    ]);
  }

  async sendBookingStatusEmail(
    booking: BookingEmailRecord,
    previousStatus?: string | null,
  ) {
    if (previousStatus === booking.status) {
      return;
    }

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.CANCELLED
    ) {
      return;
    }

    const event =
      booking.status === BookingStatus.CONFIRMED
        ? NotificationEvent.BOOKING_CONFIRMED
        : NotificationEvent.BOOKING_CANCELLED;
    const subject =
      booking.status === BookingStatus.CONFIRMED
        ? `Booking confirmed - ${booking.bookingRef}`
        : `Booking cancelled - ${booking.bookingRef}`;
    const metadata = this.mergeMetadata(
      this.bookingMetadata(booking, 'customer'),
      {
        previousStatus: previousStatus ?? null,
        newStatus: booking.status,
      },
    );
    const customer = booking.customer;

    if (!customer?.email) {
      await this.log({
        companyId: booking.companyId,
        bookingId: booking.id,
        customerId: booking.customerId,
        event,
        channel: NotificationChannel.EMAIL,
        recipient: null,
        subject,
        message: 'Customer email was not provided.',
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'Customer has no email recipient.',
        metadata,
      });
      return;
    }

    const email = this.buildCustomerStatusEmail(booking, customer);

    await this.sendEmailWithLog({
      companyId: booking.companyId,
      bookingId: booking.id,
      customerId: booking.customerId,
      event,
      recipient: customer.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      metadata,
      idempotencyKey: `booking-status-customer-${booking.id}-${previousStatus ?? 'none'}-${booking.status}`,
    });
  }

  async sendDriverAssignmentEmail(
    booking: BookingEmailRecord,
    previousDriverId?: string | null,
    driverTripToken?: string | null,
  ) {
    if (!booking.driverId || previousDriverId === booking.driverId) {
      return;
    }

    const driver = booking.driver;
    const subject = `New trip assigned - ${booking.bookingRef}`;
    const metadata = this.mergeMetadata(this.bookingMetadata(booking, 'driver'), {
      previousDriverId: previousDriverId ?? null,
      newDriverId: booking.driverId,
    });

    if (!driver?.email) {
      await this.log({
        companyId: booking.companyId,
        bookingId: booking.id,
        customerId: booking.customerId,
        event: NotificationEvent.DRIVER_ASSIGNED,
        channel: NotificationChannel.EMAIL,
        recipient: null,
        subject,
        message: 'Assigned driver email was not provided.',
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'Assigned driver has no email recipient.',
        metadata,
      });
      return;
    }

    const email = this.buildDriverAssignmentEmail(
      booking,
      driver,
      this.getDriverTripUrl(driverTripToken),
    );

    await this.sendEmailWithLog({
      companyId: booking.companyId,
      bookingId: booking.id,
      customerId: booking.customerId,
      event: NotificationEvent.DRIVER_ASSIGNED,
      recipient: driver.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      logMessage: email.logMessage,
      metadata,
      idempotencyKey: `driver-assigned-${booking.id}-${previousDriverId ?? 'none'}-${booking.driverId}`,
    });
  }

  private async sendCustomerBookingEmail(booking: BookingEmailRecord) {
    const customer = booking.customer;

    if (!customer?.email) {
      await this.log({
        companyId: booking.companyId,
        bookingId: booking.id,
        customerId: booking.customerId,
        event: NotificationEvent.BOOKING_RECEIVED,
        channel: NotificationChannel.EMAIL,
        recipient: null,
        subject: `Booking request received - ${booking.bookingRef}`,
        message: 'Customer email was not provided.',
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'Customer has no email recipient.',
        metadata: this.bookingMetadata(booking, 'customer'),
      });
      return;
    }

    const email = this.buildCustomerBookingEmail(booking, customer);

    await this.sendEmailWithLog({
      companyId: booking.companyId,
      bookingId: booking.id,
      customerId: booking.customerId,
      event: NotificationEvent.BOOKING_RECEIVED,
      recipient: customer.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      metadata: this.bookingMetadata(booking, 'customer'),
      idempotencyKey: `booking-received-customer-${booking.id}`,
    });
  }

  private async sendAdminBookingEmail(booking: BookingEmailRecord) {
    const recipients = this.parseRecipients(
      process.env.ADMIN_NOTIFICATION_EMAIL || booking.company?.email,
    );

    const email = this.buildAdminBookingEmail(booking);

    await this.sendEmailWithLog({
      companyId: booking.companyId,
      bookingId: booking.id,
      customerId: booking.customerId,
      event: NotificationEvent.BOOKING_RECEIVED,
      recipient: recipients,
      subject: email.subject,
      text: email.text,
      html: email.html,
      metadata: this.bookingMetadata(booking, 'admin'),
      idempotencyKey: `booking-received-admin-${booking.id}`,
    });
  }

  private async sendEmailWithLog(input: SendEmailNotificationInput) {
    const recipients = this.normalizeRecipients(input.recipient);

    if (recipients.length === 0) {
      return this.log({
        companyId: input.companyId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        event: input.event,
        channel: NotificationChannel.EMAIL,
        recipient: null,
        subject: input.subject,
        message: input.logMessage ?? input.text,
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'No email recipient configured.',
        metadata: input.metadata,
      });
    }

    const log = await this.log({
      companyId: input.companyId,
      bookingId: input.bookingId,
      customerId: input.customerId,
      event: input.event,
      channel: NotificationChannel.EMAIL,
      recipient: recipients.join(', '),
      subject: input.subject,
      message: input.logMessage ?? input.text,
      status: NotificationDeliveryStatus.QUEUED,
      metadata: input.metadata,
    });

    if (process.env.BOOKING_EMAILS_ENABLED !== 'true') {
      return this.prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationDeliveryStatus.SKIPPED,
          errorMessage:
            'Skipped because booking emails are disabled in this environment.',
          metadata: this.mergeMetadata(input.metadata, {
            provider: 'resend',
            emailEnabled: false,
          }),
        },
      });
    }

    try {
      const config = this.getEmailConfig();
      const resend = this.getResendClient(config.apiKey);
      const response = await resend.emails.send(
        {
          from: config.from,
          to: recipients,
          subject: input.subject,
          text: input.text,
          html: input.html,
          replyTo: config.replyTo || undefined,
        },
        {
          idempotencyKey: input.idempotencyKey,
        },
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      return this.prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
          errorMessage: null,
          metadata: this.mergeMetadata(input.metadata, {
            provider: 'resend',
            providerMessageId: response.data?.id ?? null,
            emailEnabled: true,
          }),
        },
      });
    } catch (error) {
      return this.prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : 'Email delivery failed.',
          metadata: this.mergeMetadata(input.metadata, {
            provider: 'resend',
            emailEnabled: true,
          }),
        },
      });
    }
  }

  private buildCustomerBookingEmail(
    booking: BookingEmailRecord,
    customer: BookingEmailCustomer,
  ) {
    const isCustomRoute = this.isCustomRoute(booking);
    const trackingUrl = this.getTrackingUrl(booking.bookingRef);
    const subject = `Booking request received - ${booking.bookingRef}`;
    const priceLabel = this.getPriceLabel(booking);
    const paymentLine =
      booking.paymentStatus === 'PAID'
        ? 'Payment status: Paid.'
        : `Payment status: ${this.humanise(booking.paymentStatus)}. No payment has been marked as paid yet.`;
    const quoteLine = isCustomRoute
      ? 'Manual quote pending. The LadyBird team will review your route, availability and fare before travel.'
      : 'Booking request received. The LadyBird team will review availability and confirm your trip details before travel.';

    const text = [
      `Hello ${customer.fullName},`,
      '',
      `Your LadyBird Shuttle Services booking request has been received. Reference: ${booking.bookingRef}.`,
      quoteLine,
      '',
      `Trip: ${booking.pickupLocation} to ${booking.destination}`,
      `Pickup: ${this.formatDate(booking.pickupDate)}`,
      booking.tripDirection === 'ROUND_TRIP'
        ? `Return: ${this.formatDate(booking.returnDate)}`
        : null,
      `Passengers: ${booking.passengers}`,
      `Fare: ${priceLabel}`,
      paymentLine,
      trackingUrl ? `Track your booking: ${trackingUrl}` : null,
      '',
      'Thank you for choosing LadyBird Shuttle Services.',
    ]
      .filter(Boolean)
      .join('\n');

    const html = this.wrapEmailHtml({
      title: 'Booking request received',
      eyebrow: 'LadyBird Shuttle Services',
      intro: `Hello ${this.escapeHtml(customer.fullName)}, your booking request has been received.`,
      body: quoteLine,
      rows: [
        ['Booking reference', booking.bookingRef],
        ['Trip', `${booking.pickupLocation} to ${booking.destination}`],
        ['Pickup', this.formatDate(booking.pickupDate)],
        ...(booking.tripDirection === 'ROUND_TRIP'
          ? ([['Return', this.formatDate(booking.returnDate)]] as [
              string,
              string,
            ][])
          : []),
        ['Passengers', String(booking.passengers)],
        ['Fare', priceLabel],
        ['Payment', paymentLine],
      ],
      ctaLabel: trackingUrl ? 'Track booking' : undefined,
      ctaUrl: trackingUrl,
    });

    return { subject, text, html };
  }

  private buildAdminBookingEmail(booking: BookingEmailRecord) {
    const customer = booking.customer;
    const isCustomRoute = this.isCustomRoute(booking);
    const trackingUrl = this.getTrackingUrl(booking.bookingRef);
    const dashboardUrl = this.getPublicWebUrl()
      ? `${this.getPublicWebUrl()}/dashboard/bookings`
      : null;
    const requestType = isCustomRoute
      ? 'Custom route - manual quote pending'
      : `Saved route - ${booking.route?.name || 'route selected'}`;
    const subject = `New booking request - ${booking.bookingRef}`;

    const text = [
      `New booking request: ${booking.bookingRef}`,
      '',
      `Request type: ${requestType}`,
      `Customer: ${customer?.fullName || 'Not provided'}`,
      `Phone: ${customer?.phone || 'Not provided'}`,
      `Email: ${customer?.email || 'Not provided'}`,
      `Trip: ${booking.pickupLocation} to ${booking.destination}`,
      `Pickup: ${this.formatDate(booking.pickupDate)}`,
      booking.tripDirection === 'ROUND_TRIP'
        ? `Return: ${this.formatDate(booking.returnDate)}`
        : null,
      `Passengers: ${booking.passengers}`,
      `Fare: ${this.getPriceLabel(booking)}`,
      `Status: ${this.humanise(booking.status)}`,
      `Payment status: ${this.humanise(booking.paymentStatus)}`,
      dashboardUrl ? `Admin dashboard: ${dashboardUrl}` : null,
      trackingUrl ? `Public tracking: ${trackingUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const html = this.wrapEmailHtml({
      title: 'New booking request',
      eyebrow: 'Admin notification',
      intro: `A new booking request was submitted: ${this.escapeHtml(
        booking.bookingRef,
      )}.`,
      body: isCustomRoute
        ? 'This is a custom route request. Review the route and confirm availability and fare before travel.'
        : 'This is a saved route booking request. Review availability and confirm the trip before travel.',
      rows: [
        ['Request type', requestType],
        ['Customer', customer?.fullName || 'Not provided'],
        ['Phone', customer?.phone || 'Not provided'],
        ['Email', customer?.email || 'Not provided'],
        ['Trip', `${booking.pickupLocation} to ${booking.destination}`],
        ['Pickup', this.formatDate(booking.pickupDate)],
        ...(booking.tripDirection === 'ROUND_TRIP'
          ? ([['Return', this.formatDate(booking.returnDate)]] as [
              string,
              string,
            ][])
          : []),
        ['Passengers', String(booking.passengers)],
        ['Fare', this.getPriceLabel(booking)],
        ['Status', this.humanise(booking.status)],
        ['Payment', this.humanise(booking.paymentStatus)],
      ],
      ctaLabel: dashboardUrl ? 'Open dashboard' : undefined,
      ctaUrl: dashboardUrl,
    });

    return { subject, text, html };
  }

  private buildCustomerStatusEmail(
    booking: BookingEmailRecord,
    customer: BookingEmailCustomer,
  ) {
    const trackingUrl = this.getTrackingUrl(booking.bookingRef);
    const paymentLine = this.getPaymentLine(booking);
    const isConfirmed = booking.status === BookingStatus.CONFIRMED;
    const subject = isConfirmed
      ? `Booking confirmed - ${booking.bookingRef}`
      : `Booking cancelled - ${booking.bookingRef}`;
    const title = isConfirmed ? 'Booking confirmed' : 'Booking cancelled';
    const body = isConfirmed
      ? 'Your LadyBird Shuttle Services booking has been confirmed. Please keep your booking reference for trip tracking and communication with the team.'
      : 'Your LadyBird Shuttle Services booking has been cancelled. If you still need transport support, please submit a new request or contact the team to review the journey again.';
    const rows: [string, string][] = isConfirmed
      ? [
          ['Booking reference', booking.bookingRef],
          ['Trip', `${booking.pickupLocation} to ${booking.destination}`],
          ['Route', this.getRouteLabel(booking)],
          ['Pickup', this.formatDate(booking.pickupDate)],
          ...(booking.tripDirection === 'ROUND_TRIP'
            ? ([['Return', this.formatDate(booking.returnDate)]] as [
                string,
                string,
              ][])
            : []),
          ['Passengers', String(booking.passengers)],
          ['Fare', this.getPriceLabel(booking)],
          ['Payment', paymentLine],
        ]
      : [
          ['Booking reference', booking.bookingRef],
          ['Trip', `${booking.pickupLocation} to ${booking.destination}`],
          ['Pickup', this.formatDate(booking.pickupDate)],
          ['Status', 'Cancelled'],
          ['Support note', 'You may submit a new booking request if plans change.'],
        ];

    const text = [
      `Hello ${customer.fullName},`,
      '',
      isConfirmed
        ? `Your LadyBird Shuttle Services booking has been confirmed. Reference: ${booking.bookingRef}.`
        : `Your LadyBird Shuttle Services booking has been cancelled. Reference: ${booking.bookingRef}.`,
      body,
      '',
      `Trip: ${booking.pickupLocation} to ${booking.destination}`,
      `Pickup: ${this.formatDate(booking.pickupDate)}`,
      booking.tripDirection === 'ROUND_TRIP'
        ? `Return: ${this.formatDate(booking.returnDate)}`
        : null,
      isConfirmed ? `Passengers: ${booking.passengers}` : null,
      isConfirmed ? `Fare: ${this.getPriceLabel(booking)}` : null,
      isConfirmed ? paymentLine : null,
      trackingUrl ? `Track your booking: ${trackingUrl}` : null,
      '',
      'LadyBird Shuttle Services',
    ]
      .filter(Boolean)
      .join('\n');

    const html = this.wrapEmailHtml({
      title,
      eyebrow: 'LadyBird Shuttle Services',
      intro: `Hello ${this.escapeHtml(customer.fullName)}, ${
        isConfirmed
          ? 'your booking has been confirmed.'
          : 'your booking has been cancelled.'
      }`,
      body,
      rows,
      ctaLabel: trackingUrl ? 'Track booking' : undefined,
      ctaUrl: trackingUrl,
    });

    return { subject, text, html };
  }

  private buildDriverAssignmentEmail(
    booking: BookingEmailRecord,
    driver: BookingEmailDriver,
    driverTripUrl?: string | null,
  ) {
    const customer = booking.customer;
    const routeLabel = this.getRouteLabel(booking);
    const tripTypeLabel = booking.customTripType || this.humanise(booking.tripType);
    const companyContact = this.getCompanyContactLine(booking.company);
    const subject = `New trip assigned - ${booking.bookingRef}`;
    const rows: [string, string][] = [
      ['Booking reference', booking.bookingRef],
      ['Pickup', this.formatDate(booking.pickupDate)],
      ['Pickup point', booking.pickupLocation],
      ['Destination', booking.destination],
      ['Trip type', tripTypeLabel],
      ['Trip direction', this.humanise(booking.tripDirection)],
      ['Route', routeLabel],
      ['Passenger', customer?.fullName || 'Not provided'],
      ['Passenger phone', customer?.phone || 'Not provided'],
      ['Passengers', String(booking.passengers)],
      ['Luggage', booking.luggageDetails || 'Not provided'],
      ['Special request', booking.specialNotes || 'Not provided'],
    ];

    const text = [
      `Hello ${driver.fullName},`,
      '',
      `A new trip has been assigned to you. Reference: ${booking.bookingRef}.`,
      driverTripUrl ? `Manage assigned trip: ${driverTripUrl}` : null,
      '',
      `Pickup: ${this.formatDate(booking.pickupDate)}`,
      `Pickup point: ${booking.pickupLocation}`,
      `Destination: ${booking.destination}`,
      `Trip type: ${tripTypeLabel}`,
      `Trip direction: ${this.humanise(booking.tripDirection)}`,
      `Route: ${routeLabel}`,
      `Passenger: ${customer?.fullName || 'Not provided'}`,
      `Passenger phone/WhatsApp: ${customer?.phone || 'Not provided'}`,
      `Passengers: ${booking.passengers}`,
      `Luggage: ${booking.luggageDetails || 'Not provided'}`,
      `Special request: ${booking.specialNotes || 'Not provided'}`,
      '',
      companyContact,
      driverTripUrl
        ? `If the button does not work, copy and open this link: ${driverTripUrl}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    const logMessage = [
      `Hello ${driver.fullName},`,
      '',
      `A new trip has been assigned to you. Reference: ${booking.bookingRef}.`,
      '',
      `Pickup: ${this.formatDate(booking.pickupDate)}`,
      `Pickup point: ${booking.pickupLocation}`,
      `Destination: ${booking.destination}`,
      `Trip type: ${tripTypeLabel}`,
      `Trip direction: ${this.humanise(booking.tripDirection)}`,
      `Route: ${routeLabel}`,
      `Passenger: ${customer?.fullName || 'Not provided'}`,
      `Passenger phone/WhatsApp: ${customer?.phone || 'Not provided'}`,
      `Passengers: ${booking.passengers}`,
      `Luggage: ${booking.luggageDetails || 'Not provided'}`,
      `Special request: ${booking.specialNotes || 'Not provided'}`,
      driverTripUrl ? 'Driver trip link: [secure driver trip link]' : null,
      '',
      companyContact,
    ]
      .filter(Boolean)
      .join('\n');

    const html = this.wrapEmailHtml({
      title: 'New trip assigned',
      eyebrow: 'Driver assignment',
      intro: `Hello ${this.escapeHtml(driver.fullName)}, a trip has been assigned to you.`,
      body: 'Review the trip details below and contact LadyBird operations if anything needs clarification before pickup.',
      rows,
      ctaLabel: driverTripUrl ? 'Manage Assigned Trip' : undefined,
      ctaUrl: driverTripUrl,
      ctaPlacement: 'top',
      fallbackLinkLabel: driverTripUrl
        ? 'If the button does not work, copy and open this link:'
        : undefined,
      supportNote: companyContact,
    });

    return { subject, text, html, logMessage };
  }

  private wrapEmailHtml(input: {
    eyebrow: string;
    title: string;
    intro: string;
    body: string;
    rows: [string, string][];
    ctaLabel?: string;
    ctaUrl?: string | null;
    ctaPlacement?: 'top' | 'bottom';
    fallbackLinkLabel?: string;
    supportNote?: string;
  }) {
    const rows = input.rows
      .map(
        ([label, value]) => `
          <tr>
            <td style="padding:12px 0;color:#737373;font-size:13px;border-bottom:1px solid #e5e5e5;">${this.escapeHtml(
              label,
            )}</td>
            <td style="padding:12px 0;color:#111111;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e5e5e5;">${this.escapeHtml(
              value,
            )}</td>
          </tr>`,
      )
      .join('');

    const cta =
      input.ctaLabel && input.ctaUrl
        ? `<a href="${this.escapeHtml(
            input.ctaUrl,
          )}" style="display:inline-block;margin-top:24px;border-radius:999px;background:#050505;color:#ffffff;text-decoration:none;padding:14px 24px;font-size:14px;font-weight:700;text-align:center;">${this.escapeHtml(
            input.ctaLabel,
          )}</a>`
        : '';

    const topCta = input.ctaPlacement === 'top' ? cta : '';
    const bottomCta = input.ctaPlacement === 'top' ? '' : cta;
    const fallbackLink =
      input.fallbackLinkLabel && input.ctaUrl
        ? `<div style="margin-top:26px;border-radius:18px;background:#f5f5f3;border:1px solid #e5e5e5;padding:16px;">
            <p style="margin:0 0 8px;color:#525252;font-size:12px;line-height:1.6;">${this.escapeHtml(
              input.fallbackLinkLabel,
            )}</p>
            <a href="${this.escapeHtml(
              input.ctaUrl,
            )}" style="color:#111111;font-size:12px;line-height:1.6;word-break:break-all;text-decoration:underline;">${this.escapeHtml(
              input.ctaUrl,
            )}</a>
          </div>`
        : '';
    const supportNote = input.supportNote
      ? `<div style="margin-top:18px;border-radius:18px;background:#fafafa;border:1px solid #e5e5e5;padding:16px;">
          <p style="margin:0 0 6px;color:#737373;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Operational support</p>
          <p style="margin:0;color:#404040;font-size:13px;line-height:1.7;">${this.escapeHtml(
            input.supportNote,
          )}</p>
        </div>`
      : '';

    return `
      <!doctype html>
      <html>
        <body style="margin:0;background:#f5f5f3;padding:32px 16px;font-family:Inter,Montserrat,Poppins,Arial,sans-serif;color:#111111;">
          <main style="max-width:640px;margin:0 auto;border-radius:28px;background:#ffffff;border:1px solid #e5e5e5;overflow:hidden;">
            <section style="background:#050505;color:#ffffff;padding:28px 30px;">
              <p style="margin:0 0 16px;color:#a3a3a3;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;">${this.escapeHtml(
                input.eyebrow,
              )}</p>
              <h1 style="margin:0;font-size:30px;line-height:1.05;letter-spacing:-0.04em;">${this.escapeHtml(
                input.title,
              )}</h1>
            </section>
            <section style="padding:30px;">
              <p style="margin:0;color:#111111;font-size:16px;line-height:1.7;">${input.intro}</p>
              <p style="margin:16px 0 0;color:#525252;font-size:14px;line-height:1.8;">${this.escapeHtml(
                input.body,
              )}</p>
              ${topCta}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-collapse:collapse;">
                ${rows}
              </table>
              ${bottomCta}
              ${fallbackLink}
              ${supportNote}
              <p style="margin:28px 0 0;color:#737373;font-size:12px;line-height:1.7;">This message is about a LadyBird Shuttle Services booking request. It is not a payment confirmation unless the payment status says paid.</p>
            </section>
          </main>
        </body>
      </html>`;
  }

  private getEmailConfig() {
    const missing: string[] = [];
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey) {
      missing.push('RESEND_API_KEY');
    }

    if (!from) {
      missing.push('EMAIL_FROM');
    }

    if (missing.length) {
      throw new Error(`Missing email configuration: ${missing.join(', ')}`);
    }

    return {
      apiKey: apiKey as string,
      from: from as string,
      replyTo: process.env.EMAIL_REPLY_TO,
    };
  }

  private getResendClient(apiKey: string) {
    if (!this.resend) {
      this.resend = new Resend(apiKey);
    }

    return this.resend;
  }

  private parseRecipients(value?: string | null) {
    return (value || '')
      .split(',')
      .map((recipient) => recipient.trim())
      .filter(Boolean);
  }

  private normalizeRecipients(value?: string | string[] | null) {
    if (Array.isArray(value)) {
      return value.map((recipient) => recipient.trim()).filter(Boolean);
    }

    return this.parseRecipients(value);
  }

  private isCustomRoute(booking: BookingEmailRecord) {
    return booking.tripType === 'CUSTOM' || !booking.routeId;
  }

  private getPriceLabel(booking: BookingEmailRecord) {
    const price = this.formatMoney(booking.finalPrice ?? booking.estimatedPrice);

    if (!price) {
      return this.isCustomRoute(booking) ? 'Manual quote pending' : 'Pending';
    }

    return `USD ${price}`;
  }

  private getPaymentLine(booking: BookingEmailRecord) {
    return booking.paymentStatus === 'PAID'
      ? 'Payment status: Paid.'
      : `Payment status: ${this.humanise(booking.paymentStatus)}. No payment has been marked as paid yet.`;
  }

  private getRouteLabel(booking: BookingEmailRecord) {
    if (booking.route?.name) {
      return booking.route.name;
    }

    if (booking.matchedRouteName) {
      return booking.matchedRouteName;
    }

    return this.isCustomRoute(booking) ? 'Custom route' : 'Saved route';
  }

  private getCompanyContactLine(company?: BookingEmailCompany | null) {
    const operationalEmail =
      this.parseRecipients(process.env.EMAIL_REPLY_TO)[0] ||
      this.parseRecipients(process.env.ADMIN_NOTIFICATION_EMAIL)[0] ||
      company?.email;
    const contacts = [
      company?.phone ? `Phone: ${company.phone}` : null,
      company?.whatsapp ? `WhatsApp: ${company.whatsapp}` : null,
      operationalEmail ? `Email: ${operationalEmail}` : null,
    ].filter(Boolean);

    if (contacts.length === 0) {
      return 'Contact LadyBird operations if any trip detail needs clarification.';
    }

    return `Contact LadyBird operations if any trip detail needs clarification. ${contacts.join(' | ')}`;
  }

  private formatMoney(value: MoneyValue) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed.toFixed(2);
  }

  private formatDate(value?: Date | string | null) {
    if (!value) {
      return 'Not set';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not set';
    }

    return date.toLocaleString('en-ZW', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private humanise(value?: string | null) {
    if (!value) {
      return 'Not set';
    }

    return value.replaceAll('_', ' ').toLowerCase();
  }

  private getPublicWebUrl() {
    return (process.env.PUBLIC_WEB_URL || '').replace(/\/$/, '');
  }

  private getTrackingUrl(bookingRef: string) {
    const publicWebUrl = this.getPublicWebUrl();

    if (!publicWebUrl) {
      return null;
    }

    return `${publicWebUrl}/booking/track?reference=${encodeURIComponent(
      bookingRef,
    )}`;
  }

  private getDriverTripUrl(token?: string | null) {
    const publicWebUrl = this.getPublicWebUrl();

    if (!publicWebUrl || !token) {
      return null;
    }

    return `${publicWebUrl}/driver/trips/${encodeURIComponent(token)}`;
  }

  private bookingMetadata(booking: BookingEmailRecord, audience: string) {
    return {
      audience,
      bookingRef: booking.bookingRef,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      tripType: booking.tripType,
      tripDirection: booking.tripDirection,
      pickupLocation: booking.pickupLocation,
      destination: booking.destination,
      pickupDate: booking.pickupDate.toISOString(),
      finalPrice: Number(booking.finalPrice ?? 0),
      depositAmount: Number(booking.depositAmount ?? 0),
    } as Prisma.InputJsonValue;
  }

  private mergeMetadata(
    metadata: Prisma.InputJsonValue | undefined,
    additions: Record<string, string | boolean | null>,
  ) {
    const base =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : {};

    return {
      ...base,
      ...additions,
    } as Prisma.InputJsonValue;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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
