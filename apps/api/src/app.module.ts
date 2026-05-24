import { Module } from '@nestjs/common';
import { PublicPaymentsModule } from './public-payments/public-payments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingsModule } from './bookings/bookings.module';
import { CompaniesModule } from './companies/companies.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DriversModule } from './drivers/drivers.module';
import { PaymentsModule } from './payments/payments.module';
import { PricingCalculatorModule } from './pricing-calculator/pricing-calculator.module';
import { PricingRulesModule } from './pricing-rules/pricing-rules.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicBookingsModule } from './public-bookings/public-bookings.module';
import { RoutesModule } from './routes/routes.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ZonesModule } from './zones/zones.module';

@Module({
  imports: [
    PublicPaymentsModule,
    PrismaModule,
    CompaniesModule,
    RoutesModule,
    VehiclesModule,
    DriversModule,
    CustomersModule,
    BookingsModule,
    PaymentsModule,
    DashboardModule,
    ZonesModule,
    PricingRulesModule,
    PricingCalculatorModule,
    PublicBookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}