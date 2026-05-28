import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationEvent,
  PaymentStatus,
  PricingMode,
  TripDirection,
  TripType,
} from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { PricingCalculatorService } from '../pricing-calculator/pricing-calculator.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
import { EstimatePublicBookingDto } from './dto/estimate-public-booking.dto';

@Injectable()
export class PublicBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly pricingCalculatorService: PricingCalculatorService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async estimate(estimateDto: EstimatePublicBookingDto) {
    await this.validateCompany(estimateDto.companyId);

    this.validatePublicTripDetails({
      tripType: estimateDto.tripType,
      tripDirection: estimateDto.tripDirection,
      customTripType: estimateDto.customTripType,
      pickupLocation: estimateDto.pickupLocation,
      destination: estimateDto.destination,
      pickupDate: estimateDto.pickupDate,
      dropoffDate: estimateDto.dropoffDate,
      returnDate: estimateDto.returnDate,
      returnPickupLocation: estimateDto.returnPickupLocation,
      returnDestination: estimateDto.returnDestination,
      passengers: estimateDto.passengers,
    });

    const pricingMode = this.resolvePricingMode(
      estimateDto.routeId,
      estimateDto.pricingMode,
      estimateDto.tripType,
    );

    if (pricingMode === PricingMode.CUSTOM_QUOTE) {
      return {
        requiresManualQuote: true,
        estimatedPrice: null,
        message:
          'This request requires a manual quote. Our team will review and confirm pricing.',
      };
    }

    const calculatedPrice = await this.pricingCalculatorService.calculate({
      companyId: estimateDto.companyId,
      routeId: estimateDto.routeId,
      pricingMode,
      tripDirection: estimateDto.tripDirection ?? TripDirection.ONE_WAY,
      roundTripDiscountPercentage:
        estimateDto.roundTripDiscountPercentage ?? 0,
      distanceKm: estimateDto.distanceKm,
      durationHours: estimateDto.durationHours,
      durationDays: estimateDto.durationDays,
      hourlyRate: estimateDto.hourlyRate,
      dailyRate: estimateDto.dailyRate,
      vehicleType: estimateDto.preferredVehicleType,
      roadCondition: estimateDto.roadCondition,
      zoneType: estimateDto.zoneType,
      passengers: estimateDto.passengers,
    });

    return {
      requiresManualQuote: false,
      ...calculatedPrice,
    };
  }

  async create(createDto: CreatePublicBookingDto) {
    await this.validateCompany(createDto.companyId);

    this.validatePublicTripDetails({
      tripType: createDto.tripType,
      tripDirection: createDto.tripDirection,
      customTripType: createDto.customTripType,
      pickupLocation: createDto.pickupLocation,
      destination: createDto.destination,
      pickupDate: createDto.pickupDate,
      dropoffDate: createDto.dropoffDate,
      returnDate: createDto.returnDate,
      returnPickupLocation: createDto.returnPickupLocation,
      returnDestination: createDto.returnDestination,
      passengers: createDto.passengers,
    });

    const customer = await this.findOrCreateCustomer(createDto);

    const pricingMode = this.resolvePricingMode(
      createDto.routeId,
      createDto.pricingMode,
      createDto.tripType,
    );

    let estimatedPrice: number | undefined;
    let finalPrice: number | undefined;
    let requiresManualQuote = false;

    const hasSmartEstimate =
      !!createDto.smartPricingMode &&
      createDto.estimatedPrice !== undefined &&
      createDto.finalPrice !== undefined;

    if (hasSmartEstimate) {
      estimatedPrice = createDto.estimatedPrice;
      finalPrice = createDto.finalPrice;
    } else if (pricingMode === PricingMode.CUSTOM_QUOTE) {
      requiresManualQuote = true;
    } else {
      const calculatedPrice = await this.pricingCalculatorService.calculate({
        companyId: createDto.companyId,
        routeId: createDto.routeId,
        pricingMode,
        tripDirection: createDto.tripDirection ?? TripDirection.ONE_WAY,
        roundTripDiscountPercentage:
          createDto.roundTripDiscountPercentage ?? 0,
        distanceKm: createDto.distanceKm,
        durationHours: createDto.durationHours,
        durationDays: createDto.durationDays,
        hourlyRate: createDto.hourlyRate,
        dailyRate: createDto.dailyRate,
        vehicleType: createDto.preferredVehicleType,
        roadCondition: createDto.roadCondition,
        zoneType: createDto.zoneType,
        passengers: createDto.passengers,
      });

      estimatedPrice = calculatedPrice.estimatedPrice;
      finalPrice = calculatedPrice.estimatedPrice;
    }

    const depositAmount =
      finalPrice !== undefined && finalPrice > 0
        ? Math.min(
            finalPrice,
            Math.max(10, Number((finalPrice * 0.3).toFixed(2))),
          )
        : 0;

    const bookingPayload: CreateBookingDto = {
      companyId: createDto.companyId,
      customerId: customer.id,
      routeId: createDto.routeId,
      tripType: createDto.tripType,
      tripDirection: createDto.tripDirection ?? TripDirection.ONE_WAY,
      customTripType: createDto.customTripType,
      pickupLocation: createDto.pickupLocation,
      destination: createDto.destination,
      pickupDate: createDto.pickupDate,
      dropoffDate: createDto.dropoffDate,
      returnDate: createDto.returnDate,
      returnPickupLocation: createDto.returnPickupLocation,
      returnDestination: createDto.returnDestination,
      returnNotes: createDto.returnNotes,
      durationHours: createDto.durationHours,
      durationDays: createDto.durationDays,
      passengers: createDto.passengers,
      luggageDetails: createDto.luggageDetails,
      specialNotes: this.buildCustomerSpecialNotes(createDto),
      estimatedPrice,
      finalPrice,
      depositAmount,

      smartPricingMode: createDto.smartPricingMode,
      smartDistanceKm: createDto.smartDistanceKm,
      smartDurationMinutes: createDto.smartDurationMinutes,
      matchedRouteId: createDto.matchedRouteId,
      matchedRouteName: createDto.matchedRouteName,
      matchedRouteDirection: createDto.matchedRouteDirection,
    };

    const booking = await this.bookingsService.create(bookingPayload);

    try {
      const price = Number(booking.finalPrice ?? booking.estimatedPrice ?? 0);
      const deposit = Number(booking.depositAmount ?? 0);
      const balance = Math.max(price - deposit, 0).toFixed(2);

      await this.notificationsService.logCustomerNotification({
        companyId: booking.companyId,
        bookingId: booking.id,
        customerId: booking.customerId,
        event: NotificationEvent.BOOKING_RECEIVED,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        subject: 'LadyBird booking request received',
        message: `Hello ${customer.fullName}, your LadyBird Shuttle booking request has been received. Booking reference: ${booking.bookingRef}. Route: ${booking.pickupLocation} to ${booking.destination}. Estimated fare: $${price.toFixed(2)}. Deposit after approval: $${deposit.toFixed(2)}. Balance after deposit: $${balance}. Payment will become available after approval.`,
        metadata: {
          bookingRef: booking.bookingRef,
          status: booking.status,
          pickupLocation: booking.pickupLocation,
          destination: booking.destination,
          pickupDate: booking.pickupDate.toISOString(),
          finalPrice: Number(booking.finalPrice ?? 0),
          depositAmount: Number(booking.depositAmount ?? 0),
        },
      });
    } catch (error) {
      console.error('Failed to log booking received notification', error);
    }

    return {
      success: true,
      requiresManualQuote,
      message: requiresManualQuote
        ? 'Booking request received. Our team will review it and confirm pricing.'
        : 'Booking request received successfully.',
      bookingRef: booking.bookingRef,
      bookingId: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      depositAmount: booking.depositAmount,
      smartPricingMode: booking.smartPricingMode,
      smartDistanceKm: booking.smartDistanceKm,
      smartDurationMinutes: booking.smartDurationMinutes,
      matchedRouteId: booking.matchedRouteId,
      matchedRouteName: booking.matchedRouteName,
      matchedRouteDirection: booking.matchedRouteDirection,
      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      },
      booking,
    };
  }

  async track(bookingRef: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        bookingRef,
      },
      include: {
        customer: true,
        route: true,
        driver: true,
        vehicle: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      bookingRef: booking.bookingRef,
      bookingId: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      tripType: booking.tripType,
      tripDirection: booking.tripDirection,
      pickupLocation: booking.pickupLocation,
      destination: booking.destination,
      pickupDate: booking.pickupDate,
      dropoffDate: booking.dropoffDate,
      returnDate: booking.returnDate,
      returnPickupLocation: booking.returnPickupLocation,
      returnDestination: booking.returnDestination,
      passengers: booking.passengers,
      estimatedPrice: booking.estimatedPrice,
      finalPrice: booking.finalPrice,
      depositAmount: booking.depositAmount,
      smartPricingMode: booking.smartPricingMode,
      smartDistanceKm: booking.smartDistanceKm,
      smartDurationMinutes: booking.smartDurationMinutes,
      matchedRouteId: booking.matchedRouteId,
      matchedRouteName: booking.matchedRouteName,
      matchedRouteDirection: booking.matchedRouteDirection,
      customer: {
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
      },
      route: booking.route
        ? {
            name: booking.route.name,
            pickupCity: booking.route.pickupCity,
            destinationCity: booking.route.destinationCity,
          }
        : null,
      driver: booking.driver
        ? {
            fullName: booking.driver.fullName,
          }
        : null,
      vehicle: booking.vehicle
        ? {
            name: booking.vehicle.name,
            registrationNo: booking.vehicle.registrationNo,
          }
        : null,
    };
  }

  private async validateCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  private async findOrCreateCustomer(createDto: CreatePublicBookingDto) {
    const cleanName = createDto.customerName.trim();
    const cleanNationalId = createDto.nationalId.trim();
    const cleanPhone = createDto.customerPhone.trim();
    const cleanEmail = createDto.customerEmail.trim();

    if (!cleanName) {
      throw new BadRequestException('Customer name is required');
    }

    if (!cleanNationalId) {
      throw new BadRequestException('Customer ID or passport number is required');
    }

    if (!cleanPhone) {
      throw new BadRequestException('Customer phone is required');
    }

    if (!cleanEmail) {
      throw new BadRequestException('Customer email is required');
    }

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        companyId: createDto.companyId,
        phone: cleanPhone,
      },
    });

    if (existingCustomer) {
      return this.prisma.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: {
          fullName: cleanName,
          nationalId: cleanNationalId,
          email: cleanEmail,
        },
      });
    }

    return this.prisma.customer.create({
      data: {
        companyId: createDto.companyId,
        fullName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        nationalId: cleanNationalId,
        address: '',
      },
    });
  }

  private validatePublicTripDetails(details: {
    tripType: TripType;
    tripDirection?: TripDirection;
    customTripType?: string;
    pickupLocation: string;
    destination: string;
    pickupDate: string;
    dropoffDate?: string;
    returnDate?: string;
    returnPickupLocation?: string;
    returnDestination?: string;
    passengers: number;
  }) {
    if (!details.pickupLocation?.trim()) {
      throw new BadRequestException('Pickup location is required');
    }

    if (!details.destination?.trim()) {
      throw new BadRequestException('Destination is required');
    }

    if (!details.pickupDate) {
      throw new BadRequestException('Pickup date is required');
    }

    const pickupDate = new Date(details.pickupDate);

    if (Number.isNaN(pickupDate.getTime())) {
      throw new BadRequestException('Invalid pickup date');
    }

    if (details.dropoffDate) {
      const dropoffDate = new Date(details.dropoffDate);

      if (Number.isNaN(dropoffDate.getTime())) {
        throw new BadRequestException('Invalid drop-off date');
      }

      if (dropoffDate <= pickupDate) {
        throw new BadRequestException(
          'Drop-off date must be after pickup date',
        );
      }
    }

    if (details.tripDirection === TripDirection.ROUND_TRIP) {
      if (!details.returnDate) {
        throw new BadRequestException(
          'Return date is required for round trip',
        );
      }

      const returnDate = new Date(details.returnDate);

      if (Number.isNaN(returnDate.getTime())) {
        throw new BadRequestException('Invalid return date');
      }

      if (returnDate <= pickupDate) {
        throw new BadRequestException('Return date must be after pickup date');
      }

      if (!details.returnPickupLocation?.trim()) {
        throw new BadRequestException(
          'Return pickup location is required for round trip',
        );
      }

      if (!details.returnDestination?.trim()) {
        throw new BadRequestException(
          'Return destination is required for round trip',
        );
      }
    }

    if (details.tripType === TripType.CUSTOM && !details.customTripType?.trim()) {
      throw new BadRequestException(
        'Custom trip type is required for custom bookings',
      );
    }

    if (!Number.isInteger(details.passengers) || details.passengers < 1) {
      throw new BadRequestException('Passengers must be at least 1');
    }
  }

  private resolvePricingMode(
    routeId?: string,
    pricingMode?: PricingMode,
    tripType?: TripType,
  ) {
    if (routeId) {
      return undefined;
    }

    if (pricingMode) {
      return pricingMode;
    }

    if (tripType === TripType.CAR_RENTAL) {
      return PricingMode.DAILY;
    }

    if (tripType === TripType.CUSTOM) {
      return PricingMode.CUSTOM_QUOTE;
    }

    return PricingMode.DISTANCE_BASED;
  }

  private buildCustomerSpecialNotes(createDto: CreatePublicBookingDto) {
    const notes: string[] = [];

    if (createDto.preferredVehicleType) {
      notes.push(`Preferred vehicle type: ${createDto.preferredVehicleType}`);
    }

    if (createDto.specialNotes?.trim()) {
      notes.push(createDto.specialNotes.trim());
    }

    return notes.length ? notes.join('\n') : undefined;
  }
}