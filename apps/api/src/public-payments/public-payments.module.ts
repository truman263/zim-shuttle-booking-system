import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicPaymentsController } from './public-payments.controller';
import { PublicPaymentsService } from './public-payments.service';

@Module({
  controllers: [PublicPaymentsController],
  providers: [PublicPaymentsService, PrismaService],
})
export class PublicPaymentsModule {}
