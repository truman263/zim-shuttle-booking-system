import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePublicPaymentDto } from './dto/create-public-payment.dto';
import { PublicPaymentsService } from './public-payments.service';

@Controller('public-payments')
export class PublicPaymentsController {
  constructor(private readonly publicPaymentsService: PublicPaymentsService) {}

  @Post('create-checkout')
  createCheckout(@Body() createPublicPaymentDto: CreatePublicPaymentDto) {
    return this.publicPaymentsService.createCheckout(createPublicPaymentDto);
  }

  @Get('status/:paymentId')
  getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.publicPaymentsService.getPaymentStatus(paymentId);
  }

  @Get('booking/:bookingRef')
  getBookingPayments(@Param('bookingRef') bookingRef: string) {
    return this.publicPaymentsService.getBookingPayments(bookingRef);
  }

  @Get('paynow-return')
  handlePaynowReturn(@Query('paymentId') paymentId?: string) {
    return this.publicPaymentsService.handlePaynowReturn(paymentId);
  }

  @Post('paynow-result')
  handlePaynowResult(@Body() body: Record<string, unknown>) {
    return this.publicPaymentsService.handlePaynowResult(body);
  }
}
