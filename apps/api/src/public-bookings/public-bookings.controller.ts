import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
import { EstimatePublicBookingDto } from './dto/estimate-public-booking.dto';
import { PublicBookingsService } from './public-bookings.service';

@Controller('public-bookings')
export class PublicBookingsController {
  constructor(private readonly publicBookingsService: PublicBookingsService) {}

  @Post('estimate')
  estimate(@Body() estimatePublicBookingDto: EstimatePublicBookingDto) {
    return this.publicBookingsService.estimate(estimatePublicBookingDto);
  }

  @Post()
  create(@Body() createPublicBookingDto: CreatePublicBookingDto) {
    return this.publicBookingsService.create(createPublicBookingDto);
  }

  @Get('track/:bookingRef')
  track(@Param('bookingRef') bookingRef: string) {
    return this.publicBookingsService.track(bookingRef);
  }
}