require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const COMPANY_ID = 'cmpfkzypy0000l4ew82k92cl1';

const APPROVED_SAVED_ROUTES = [
  {
    id: 'cmpflfapi00003oewd5kxj8kg',
    name: 'Harare to Masvingo',
    pickupCity: 'Harare',
    destinationCity: 'Masvingo',
    basePrice: '35',
    routeType: 'CITY_TO_CITY',
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
    routeType: 'AIRPORT_TRANSFER',
    priceUnit: 'PER_TRIP',
    distanceKm: '15',
    estimatedDurationMinutes: 25,
    roadCondition: 'GOOD',
  },
];

const ARCHIVED_ROUTE_IDS = [
  'cmpgre11w0001ioewflrkx9n9',
  'lb-route-harare-mutare',
  'lb-route-harare-bulawayo',
  'lb-route-harare-masvingo',
  'lb-route-cbd-airport',
  'lb-route-airport-cbd',
];

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the staging seed.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function archiveRoute(routeId, archivedAt) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      companyId: true,
      deletedAt: true,
    },
  });

  if (!route) {
    return { routeId, action: 'missing' };
  }

  if (route.companyId !== COMPANY_ID) {
    return { routeId, action: 'skipped-company-mismatch' };
  }

  await prisma.route.update({
    where: { id: routeId },
    data: {
      isActive: false,
      isDeleted: true,
      deletedAt: route.deletedAt ?? archivedAt,
    },
  });

  return { routeId, action: 'archived' };
}

async function upsertSavedRoute(route) {
  const routeData = {
    companyId: COMPANY_ID,
    name: route.name,
    pickupCity: route.pickupCity,
    destinationCity: route.destinationCity,
    basePrice: route.basePrice,
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    routeType: route.routeType,
    pricingMode: 'FIXED_ROUTE',
    priceUnit: route.priceUnit,
    distanceKm: route.distanceKm,
    estimatedDurationMinutes: route.estimatedDurationMinutes,
    roadCondition: route.roadCondition,
  };

  await prisma.route.upsert({
    where: { id: route.id },
    update: routeData,
    create: {
      id: route.id,
      ...routeData,
    },
  });

  return {
    routeId: route.id,
    name: route.name,
    action: 'active-saved-route-upserted',
  };
}

async function main() {
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {
      name: 'LadyBird Shuttle Services',
      slug: 'ladybird-shuttle-services',
      email: 'info@ladybirdshuttles.co.zw',
      phone: '+263 77 361 5432',
      whatsapp: '+263 77 361 5432',
      logoUrl: '/brand/ladybird-logo.png',
      status: 'ACTIVE',
    },
    create: {
      id: COMPANY_ID,
      name: 'LadyBird Shuttle Services',
      slug: 'ladybird-shuttle-services',
      email: 'info@ladybirdshuttles.co.zw',
      phone: '+263 77 361 5432',
      whatsapp: '+263 77 361 5432',
      logoUrl: '/brand/ladybird-logo.png',
      status: 'ACTIVE',
    },
  });

  const archivedAt = new Date();
  const savedRouteResults = [];
  const archivedRouteResults = [];

  for (const route of APPROVED_SAVED_ROUTES) {
    savedRouteResults.push(await upsertSavedRoute(route));
  }

  for (const routeId of ARCHIVED_ROUTE_IDS) {
    archivedRouteResults.push(await archiveRoute(routeId, archivedAt));
  }

  console.log('Staging seed completed for LadyBird Shuttle Services.');
  console.log(`Company ID: ${COMPANY_ID}`);
  console.log('Approved baseline saved routes were restored as active.');
  console.table(savedRouteResults);
  console.log('Duplicate or unapproved routes were archived/deactivated.');
  console.table(archivedRouteResults);
  console.log(
    'For a guarded hard reset of preview data, run prisma/reset-staging-preview.js.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
