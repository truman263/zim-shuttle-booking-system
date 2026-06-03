require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const RESET_CONFIRMATION = 'RESET_LADYBIRD_STAGING';
const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

const COMPANY_DATA = {
  id: COMPANY_ID,
  name: 'LadyBird Shuttle Services',
  slug: 'ladybird-shuttle-services',
  email: 'info@ladybirdshuttles.co.zw',
  phone: '+263 77 361 5432',
  whatsapp: '+263 77 361 5432',
  address: 'Zimbabwe',
  logoUrl: '/brand/ladybird-logo.png',
  status: 'ACTIVE',
};

const APPROVED_SAVED_ROUTES = [
  {
    id: 'cmpflfapi00003oewd5kxj8kg',
    name: 'Harare to Masvingo',
    pickupCity: 'Harare',
    destinationCity: 'Masvingo',
    basePrice: '35',
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    routeType: 'CITY_TO_CITY',
    pricingMode: 'FIXED_ROUTE',
    priceUnit: 'PER_PASSENGER',
    distanceKm: '297',
    estimatedDurationMinutes: 240,
    roadCondition: 'GOOD',
  },
  {
    id: 'cmpgrd8nw0000ioewwesbpg0o',
    name: 'Harare Airport to Harare CBD',
    pickupCity: 'Harare Airport',
    destinationCity: 'Harare CBD',
    basePrice: '25',
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    routeType: 'AIRPORT_TRANSFER',
    pricingMode: 'FIXED_ROUTE',
    priceUnit: 'PER_TRIP',
    distanceKm: '15',
    estimatedDurationMinutes: 25,
    roadCondition: 'GOOD',
  },
];

if (process.env.STAGING_RESET_CONFIRM !== RESET_CONFIRMATION) {
  throw new Error(
    `Refusing to reset staging data. Set STAGING_RESET_CONFIRM=${RESET_CONFIRMATION} to continue.`,
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the staging preview reset.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const bookings = await tx.booking.findMany({
      where: {
        companyId: COMPANY_ID,
      },
      select: {
        id: true,
      },
    });

    const bookingIds = bookings.map((booking) => booking.id);

    const payments = bookingIds.length
      ? await tx.payment.findMany({
          where: {
            bookingId: {
              in: bookingIds,
            },
          },
          select: {
            id: true,
          },
        })
      : [];

    const paymentIds = payments.map((payment) => payment.id);

    const notificationDelete = await tx.notificationLog.deleteMany({
      where: {
        OR: [
          { companyId: COMPANY_ID },
          ...(bookingIds.length
            ? [
                {
                  bookingId: {
                    in: bookingIds,
                  },
                },
              ]
            : []),
          ...(paymentIds.length
            ? [
                {
                  paymentId: {
                    in: paymentIds,
                  },
                },
              ]
            : []),
        ],
      },
    });

    const paymentDelete = bookingIds.length
      ? await tx.payment.deleteMany({
          where: {
            bookingId: {
              in: bookingIds,
            },
          },
        })
      : { count: 0 };

    const bookingDelete = await tx.booking.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const customerDelete = await tx.customer.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const driverDelete = await tx.driver.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const vehicleDelete = await tx.vehicle.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const pricingRuleDelete = await tx.pricingRule.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const zoneDelete = await tx.zone.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const routeDelete = await tx.route.deleteMany({
      where: {
        companyId: COMPANY_ID,
      },
    });

    const company = await tx.company.upsert({
      where: {
        id: COMPANY_ID,
      },
      update: COMPANY_DATA,
      create: COMPANY_DATA,
    });

    const routes = [];

    for (const route of APPROVED_SAVED_ROUTES) {
      routes.push(
        await tx.route.create({
          data: {
            companyId: COMPANY_ID,
            ...route,
          },
        }),
      );
    }

    return {
      deleted: {
        notificationLogs: notificationDelete.count,
        payments: paymentDelete.count,
        bookings: bookingDelete.count,
        customers: customerDelete.count,
        drivers: driverDelete.count,
        vehicles: vehicleDelete.count,
        pricingRules: pricingRuleDelete.count,
        zones: zoneDelete.count,
        routes: routeDelete.count,
      },
      company: {
        id: company.id,
        name: company.name,
        status: company.status,
      },
      routes: routes.map((route) => ({
        id: route.id,
        name: route.name,
        pickupCity: route.pickupCity,
        destinationCity: route.destinationCity,
        basePrice: route.basePrice.toString(),
        routeType: route.routeType,
        priceUnit: route.priceUnit,
        isActive: route.isActive,
        isDeleted: route.isDeleted,
      })),
    };
  });

  console.log('LadyBird staging preview reset completed.');
  console.log(`Company ID: ${COMPANY_ID}`);
  console.log('Deleted preview data:');
  console.table([result.deleted]);
  console.log('Company restored:');
  console.table([result.company]);
  console.log('Approved saved routes restored:');
  console.table(result.routes);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
