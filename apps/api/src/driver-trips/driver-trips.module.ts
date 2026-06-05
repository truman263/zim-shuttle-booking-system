import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverTripsController } from './driver-trips.controller';
import { DriverTripsService } from './driver-trips.service';

@Module({
  imports: [PrismaModule],
  controllers: [DriverTripsController],
  providers: [DriverTripsService],
  exports: [DriverTripsService],
})
export class DriverTripsModule {}
